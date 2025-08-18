# Deployment Guide for Coolify

This document provides instructions for deploying the Voiceflow Prompts Manager on Coolify using Docker.

## Files Created

- `Dockerfile` - Multi-stage Docker build for production deployment
- `docker-compose.yml` - Container orchestration with volume persistence
- `.dockerignore` - Optimizes build context by excluding unnecessary files
- `env.production.example` - Production environment variables template

## Pre-Deployment Setup

### 1. Database Migration

Before deploying, ensure your database schema is up to date. Run locally:

```bash
# Generate Prisma client
npm run db:generate

# Apply database migrations (if using migrations instead of db:push)
npm run db:migrate
```

### 2. Environment Variables Configuration

In Coolify, configure the following environment variables:

#### Required Runtime Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_URL` | Your app's public URL | `https://prompts.yourdomain.com` |
| `NEXTAUTH_SECRET` | Random secret for JWT signing | `your-secure-random-secret` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | From Google Cloud Console |
| `ALLOWED_EMAIL_DOMAINS` | Comma-separated list of allowed email domains | `voiceflow.com,company.com` |
| `GITHUB_TOKEN` | GitHub personal access token | `ghp_...` |
| `GITHUB_OWNER` | GitHub username/organization | `yourusername` |
| `GITHUB_REPO` | Repository name for prompts | `prompts-repo` |

#### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Custom port for the application | `3000` |
| `NEXT_PUBLIC_DISABLE_AUTH` | Disable authentication entirely | `false` |

#### Build-Time vs Runtime Variables

**Build-time variables:** None required for this application.

**Runtime variables:** All variables listed above are runtime variables and should be configured in Coolify's environment section.

## Coolify Deployment Steps

### 1. Create New Service

1. In Coolify, create a new "Docker Compose" service
2. Connect your Git repository
3. Set the source as your repository URL

### 2. Configure Environment Variables

In the Environment section, add all the required runtime variables listed above.

### 3. Configure Port Mapping

- **Internal Port:** `3000` (or your custom `PORT` value)
- **External Port:** Choose your desired external port (e.g., `80`, `443`, or custom)

### 4. Volume Configuration

The docker-compose.yml automatically configures a persistent volume:
- **Volume Name:** `voiceflow_data`
- **Mount Path:** `/app/data`
- **Purpose:** Persists SQLite database between deployments

### 5. Deploy

Click "Deploy" in Coolify. The deployment process will:

1. Build the Docker image using the multi-stage Dockerfile
2. Generate Prisma client during build
3. Create the production Next.js build
4. Start the container with persistent volume mounted

## Database Initialization

On first deployment, you'll need to initialize the database schema:

### Option 1: Using Prisma db push (Recommended for SQLite)

Connect to your running container and run:

```bash
docker exec -it <container-name> npx prisma db push
```

### Option 2: Using Prisma migrations

If you prefer migrations:

```bash
docker exec -it <container-name> npx prisma migrate deploy
```

## Health Checks

The application includes a health check endpoint that Coolify can use:
- **Endpoint:** `/api/stats`
- **Method:** GET
- **Expected Response:** 200 OK

## Troubleshooting

### Database Issues

If you encounter database connection issues:

1. **Check file permissions:**
   ```bash
   docker exec -it <container-name> ls -la /app/data/
   ```

2. **Verify database file exists:**
   ```bash
   docker exec -it <container-name> ls -la /app/data/prod.db
   ```

3. **Check environment variables:**
   ```bash
   docker exec -it <container-name> env | grep DATABASE_URL
   ```

### Application Logs

View application logs in Coolify or using Docker:

```bash
docker logs <container-name> -f
```

### Volume Persistence

To verify volume is working correctly:

```bash
# Check volume exists
docker volume ls | grep voiceflow_data

# Inspect volume
docker volume inspect voiceflow_data
```

## Custom Port Configuration

To use a custom port:

1. Set the `PORT` environment variable in Coolify
2. Update the port mapping in Coolify's service configuration
3. Ensure your `NEXTAUTH_URL` includes the correct port if non-standard

## Authentication Configuration

### Google OAuth Mode (Recommended for Production)

1. **Configure Google OAuth credentials in Google Cloud Console**
2. **Set allowed email domains:** Use `ALLOWED_EMAIL_DOMAINS` to specify which email domains can access the application
   - Example: `ALLOWED_EMAIL_DOMAINS=voiceflow.com,company.com,partner.org`
   - Multiple domains can be separated by commas
3. **Keep `NEXT_PUBLIC_DISABLE_AUTH=false` (default)**

### No Authentication Mode (Development/Internal Use Only)

1. **Set `NEXT_PUBLIC_DISABLE_AUTH=true`**
2. **Google OAuth credentials become optional**
3. **⚠️ Warning:** Only use this mode for:
   - Development environments
   - Internal networks behind secure firewalls
   - Testing purposes

## Security Considerations

1. **NEXTAUTH_SECRET:** Use a cryptographically secure random string
2. **GitHub Token:** Use a token with minimal required permissions
3. **Google OAuth:** Configure proper redirect URIs in Google Cloud Console
4. **Email Domain Security:** Carefully configure `ALLOWED_EMAIL_DOMAINS` to restrict access to authorized users
5. **No Auth Mode:** Never use `NEXT_PUBLIC_DISABLE_AUTH=true` in production environments accessible from the internet
6. **Database:** SQLite file is stored in persistent volume with proper permissions

## Updates and Redeployments

The persistent volume ensures your database survives redeployments. When updating:

1. Your database will be preserved in the `voiceflow_data` volume
2. Application code will be updated from your Git repository
3. Dependencies will be rebuilt if package.json changed

## Scaling Considerations

This setup uses SQLite which is suitable for single-instance deployments. For high-availability or multi-instance deployments, consider:

1. Migrating to PostgreSQL or MySQL
2. Using external database service
3. Implementing database connection pooling
