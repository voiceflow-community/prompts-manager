FROM node:18-slim AS base

# Install dependencies only when needed
FROM base AS deps
# Install OpenSSL and required libraries for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
# Set OpenSSL environment variables for Prisma
ENV OPENSSL_ROOT_DIR=/usr
ENV OPENSSL_LIB_DIR=/usr/lib/x86_64-linux-gnu
ENV OPENSSL_INCLUDE_DIR=/usr/include/openssl
ENV PRISMA_CLI_BINARY_TARGETS="debian-openssl-3.0.x,linux-arm64-openssl-3.0.x"
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
# Install OpenSSL for Prisma generation
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client with correct binary target
ENV PRISMA_CLI_BINARY_TARGETS="debian-openssl-3.0.x,linux-arm64-openssl-3.0.x"
ENV OPENSSL_ROOT_DIR=/usr
ENV OPENSSL_LIB_DIR=/usr/lib/x86_64-linux-gnu
ENV OPENSSL_INCLUDE_DIR=/usr/include/openssl
RUN npx prisma generate --generator client

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
# Install OpenSSL and curl for Prisma runtime and health checks
RUN apt-get update && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

# Set OpenSSL environment variables for Prisma runtime
ENV OPENSSL_ROOT_DIR=/usr
ENV OPENSSL_LIB_DIR=/usr/lib/x86_64-linux-gnu
ENV OPENSSL_INCLUDE_DIR=/usr/include/openssl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --home /home/nextjs --shell /bin/bash nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and generated client
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin ./node_modules/.bin
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

# Copy startup script
COPY --chown=nextjs:nodejs start.sh ./start.sh
RUN chmod +x ./start.sh

# Create data directory for SQLite database with proper permissions
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# Setup proper home directory and npm cache for nextjs user
RUN mkdir -p /home/nextjs/.npm /home/nextjs/.cache && \
    chown -R nextjs:nodejs /home/nextjs

USER nextjs

EXPOSE 3160

ENV PORT=3160
# set hostname to localhost
ENV HOSTNAME="0.0.0.0"

# Use the startup script that initializes the database and starts the application
CMD ["./start.sh"]
