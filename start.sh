#!/bin/bash
set -e

echo "Starting Voiceflow Prompts Manager..."

# Set HOME directory for npm operations
export HOME=/home/nextjs

# Initialize database if it doesn't exist
if [ ! -f "/app/data/prod.db" ]; then
    echo "Initializing database..."
    cd /app && npx prisma db push --accept-data-loss
    echo "Database initialized successfully"
else
    echo "Database already exists, checking for migrations..."
    cd /app && npx prisma db push
fi

echo "Starting Next.js application..."
exec node server.js
