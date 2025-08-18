# Docker Deployment Guide

This document provides instructions for deploying the Voiceflow Prompts Manager using Docker in any container hosting environment.

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

Configure the following environment variables in your deployment environment:

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

## Deployment Options

### Option 1: Docker Compose (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd voiceflow-prompts-manager
   ```

2. **Configure environment variables:**
   ```bash
   # Copy the example file and edit with your values
   cp env.production.example .env.production
   # Edit .env.production with your actual values
   ```

3. **Deploy with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

### Option 2: Standalone Docker Container

1. **Build the Docker image:**
   ```bash
   docker build -t voiceflow-prompts-manager .
   ```

2. **Create a persistent volume:**
   ```bash
   docker volume create voiceflow_data
   ```

3. **Run the container:**
   ```bash
   docker run -d \
     --name voiceflow-prompts-manager \
     -p 3000:3000 \
     -v voiceflow_data:/app/data \
     --env-file .env.production \
     voiceflow-prompts-manager
   ```

### Option 3: Container Orchestration Platforms

For deployment on platforms like Docker Swarm, Kubernetes, or container hosting services:

1. **Use the provided docker-compose.yml as a reference**
2. **Configure environment variables according to your platform**
3. **Ensure persistent storage is configured for `/app/data`**
4. **Expose port 3000 (or your custom PORT value)**

## Database Initialization

On first deployment, you'll need to initialize the database schema:

### Option 1: Using Prisma db push (Recommended for SQLite)

Connect to your running container and run:

```bash
docker exec -it voiceflow-prompts-manager npx prisma db push
```

### Option 2: Using Prisma migrations

If you prefer migrations:

```bash
docker exec -it voiceflow-prompts-manager npx prisma migrate deploy
```

### For Docker Compose deployments:

```bash
docker-compose exec app npx prisma db push
```

## Health Checks

The application includes a health check endpoint for monitoring:
- **Endpoint:** `/api/stats`
- **Method:** GET
- **Expected Response:** 200 OK

Use this endpoint for:
- Load balancer health checks
- Container orchestration platform readiness probes
- Monitoring and alerting systems

## Troubleshooting

### Database Issues

If you encounter database connection issues:

1. **Check file permissions:**
   ```bash
   docker exec -it voiceflow-prompts-manager ls -la /app/data/
   ```

2. **Verify database file exists:**
   ```bash
   docker exec -it voiceflow-prompts-manager ls -la /app/data/prod.db
   ```

3. **Check environment variables:**
   ```bash
   docker exec -it voiceflow-prompts-manager env | grep DATABASE_URL
   ```

### Application Logs

View application logs using Docker:

```bash
# For standalone container
docker logs voiceflow-prompts-manager -f

# For Docker Compose
docker-compose logs app -f
```

### Volume Persistence

To verify volume is working correctly:

```bash
# Check volume exists
docker volume ls | grep voiceflow_data

# Inspect volume
docker volume inspect voiceflow_data
```

### Container Status

Check if the container is running properly:

```bash
# List running containers
docker ps

# Check container status
docker inspect voiceflow-prompts-manager
```

## Custom Port Configuration

To use a custom port:

1. **Set the `PORT` environment variable** in your environment configuration
2. **Update port mapping** when running the container:
   ```bash
   # For custom port 8080
   docker run -p 8080:8080 -e PORT=8080 voiceflow-prompts-manager
   ```
3. **Ensure your `NEXTAUTH_URL`** includes the correct port if non-standard

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

### Docker Compose Updates

```bash
# Pull latest changes and rebuild
git pull
docker-compose down
docker-compose up -d --build
```

### Standalone Container Updates

```bash
# Stop and remove old container
docker stop voiceflow-prompts-manager
docker rm voiceflow-prompts-manager

# Rebuild image with latest code
docker build -t voiceflow-prompts-manager .

# Start new container (volume persists)
docker run -d \
  --name voiceflow-prompts-manager \
  -p 3000:3000 \
  -v voiceflow_data:/app/data \
  --env-file .env.production \
  voiceflow-prompts-manager
```

**Important Notes:**
- Your database will be preserved in the `voiceflow_data` volume
- Environment variables should be updated as needed
- Dependencies will be rebuilt if package.json changed

## Scaling Considerations

This setup uses SQLite which is suitable for single-instance deployments. For high-availability or multi-instance deployments, consider:

1. **Migrating to PostgreSQL or MySQL**
   - Update `DATABASE_URL` environment variable
   - Use managed database services (AWS RDS, Google Cloud SQL, etc.)

2. **Load Balancing**
   - Use reverse proxy (nginx, traefik, etc.)
   - Configure session affinity or external session storage

3. **Container Orchestration**
   - Kubernetes deployments with persistent volumes
   - Docker Swarm with replicated services
   - Managed container services (AWS ECS, Google Cloud Run, etc.)

## Production Deployment Examples

### AWS ECS with Load Balancer

```yaml
# Use the provided Dockerfile and docker-compose.yml as reference
# Configure ECS task definition with:
# - Persistent EFS volumes for /app/data
# - Environment variables from AWS Systems Manager
# - Application Load Balancer for high availability
```

### Kubernetes Deployment

```yaml
# Example deployment configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: voiceflow-prompts-manager
spec:
  replicas: 1  # Single instance due to SQLite
  selector:
    matchLabels:
      app: voiceflow-prompts-manager
  template:
    metadata:
      labels:
        app: voiceflow-prompts-manager
    spec:
      containers:
      - name: app
        image: voiceflow-prompts-manager:latest
        ports:
        - containerPort: 3000
        env:
        - name: NEXTAUTH_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: nextauth-url
        volumeMounts:
        - name: data-volume
          mountPath: /app/data
      volumes:
      - name: data-volume
        persistentVolumeClaim:
          claimName: voiceflow-data-pvc
```
