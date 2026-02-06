# Docker Setup Guide

This guide explains how to run the Smart Accident Report System API using Docker.

## Prerequisites

- Docker Desktop installed
- Docker Compose installed (included with Docker Desktop)
- `.env` file configured (copy from `.env.example`)

## Quick Start

### Production Mode

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

### Development Mode

```bash
# Build and start all services with hot-reload
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f api

# Stop services
docker-compose -f docker-compose.dev.yml down
```

## Services

### Main Services

- **api** - NestJS application (Port: 3000)
- **postgres** - PostgreSQL database (Port: 5432)
- **redis** - Redis cache (Port: 6379)

### Optional Management Tools

Start with `--profile tools`:

```bash
docker-compose --profile tools up -d
```

- **pgadmin** - PostgreSQL web interface (Port: 5050)
  - Default login: admin@admin.com / admin
- **redis-commander** - Redis web interface (Port: 8081)

## Common Commands

### View Running Containers

```bash
docker-compose ps
```

### Rebuild After Code Changes (Production)

```bash
docker-compose up -d --build
```

### View Application Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Execute Commands in Container

```bash
# Access API container shell
docker-compose exec api sh

# Run database migrations
docker-compose exec api pnpm run migration:run

# Access PostgreSQL CLI
docker-compose exec postgres psql -U postgres -d smartresponse

# Access Redis CLI
docker-compose exec redis redis-cli -a redispassword
```

### Database Operations

```bash
# Backup database
docker-compose exec -T postgres pg_dump -U postgres smartresponse > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U postgres smartresponse

# Reset database (warning: deletes all data)
docker-compose down -v
docker-compose up -d
```

### Clean Up

```bash
# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (deletes all data)
docker-compose down -v

# Remove all unused Docker resources
docker system prune -a --volumes
```

## Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration. Key variables:

- `DATABASE_PASSWORD` - PostgreSQL password
- `REDIS_PASSWORD` - Redis password
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_TOKEN_SECRET` - JWT refresh token secret
- `OPENAI_API_KEY` - OpenAI API key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

## Development Workflow

### Hot Reload Development

```bash
# Start dev environment with hot reload
docker-compose -f docker-compose.dev.yml up -d

# Make code changes - they will auto-reload
# View logs to see reload activity
docker-compose -f docker-compose.dev.yml logs -f api
```

### Debugging

The development container exposes port 9229 for debugging:

1. Start dev environment:

   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. In VS Code, create `.vscode/launch.json`:

   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "type": "node",
         "request": "attach",
         "name": "Docker: Attach to Node",
         "port": 9229,
         "restart": true,
         "remoteRoot": "/app"
       }
     ]
   }
   ```

3. Start debugging from VS Code (F5)

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (Windows - use PID from above)
taskkill /PID <PID> /F
```

### Container Won't Start

```bash
# Check logs
docker-compose logs api

# Check container status
docker-compose ps

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Issues

```bash
# Verify database is healthy
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Verify connection from API container
docker-compose exec api sh
nc -zv postgres 5432
```

### Redis Connection Issues

```bash
# Test Redis connection
docker-compose exec redis redis-cli -a redispassword ping

# View Redis logs
docker-compose logs redis
```

## Production Deployment

### Best Practices

1. **Use secrets management** - Don't commit `.env` files
2. **Use specific image tags** - Avoid `latest` tag
3. **Enable SSL/TLS** - Configure proper certificates
4. **Set resource limits** - Add CPU/memory limits
5. **Use health checks** - Already configured in docker-compose
6. **Regular backups** - Schedule database backups
7. **Monitor logs** - Use log aggregation tools
8. **Update regularly** - Keep base images updated

### Build for Production

```bash
# Build optimized image
docker-compose build

# Tag for registry
docker tag smartresponse-api your-registry/smartresponse-api:1.0.0

# Push to registry
docker push your-registry/smartresponse-api:1.0.0
```

## Network Architecture

All services run on isolated networks:

- **Production**: `smartresponse-network`
- **Development**: `smartresponse-dev-network`

Services communicate using Docker's internal DNS.

## Volume Persistence

Data is persisted in Docker volumes:

- `postgres_data` - PostgreSQL data
- `redis_data` - Redis persistence
- `pgadmin_data` - pgAdmin configuration
- `./uploads` - Application file uploads (bind mount)

## Health Checks

All services include health checks:

- **API**: HTTP check on `/health` endpoint
- **PostgreSQL**: `pg_isready` command
- **Redis**: `redis-cli ping` command

Use `docker-compose ps` to view health status.
