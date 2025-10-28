# Docker Setup Guide

This guide provides detailed instructions for running the Airline application using Docker.

## Prerequisites
- Docker Desktop (or Docker Engine + Docker Compose)
- At least 8GB of RAM allocated to Docker
- At least 20GB of free disk space

## Quick Start

### 1. Initial Setup
```bash
# Clone the repository (if you haven't already)
git clone <repository-url>
cd airline

# Copy the override configuration
cp docker-compose.override.yaml.dist docker-compose.override.yaml
```

### 2. Configure Ports (Optional)
Edit `docker-compose.override.yaml` to customize ports:
- Port 9000: Web application (default)
- Port 33063: MySQL database (if you need external access)

### 3. Start the Stack
```bash
# Start all containers
docker compose up -d

# Verify containers are running
docker compose ps
```

You should see:
- `airline-app` - Running
- `airline-db` - Running (healthy)
- `airline-search` - Running

### 4. Initialize the Database

**Option A: Automatic (Recommended)**
```bash
# This will run all three steps automatically
docker compose exec airline-app bash /home/airline/start-all.sh
```

**Option B: Manual (Step by Step)**
```bash
# Step 1: Initialize the database
docker compose exec airline-app bash /home/airline/init-data.sh

# Step 2: Start the backend simulation (in a separate terminal)
docker compose exec airline-app bash /home/airline/start-data.sh

# Step 3: Start the web frontend (in another terminal)
docker compose exec airline-app bash /home/airline/start-web.sh
```

### 5. Access the Application
Open your browser and navigate to:
- **Web Interface**: http://localhost:9000

## What's Improved?

### Reliable Initialization
The initialization script now:
- ✅ Waits for MySQL to be fully ready before starting
- ✅ Uses exponential backoff retry logic (up to 10 attempts)
- ✅ Provides clear progress indicators and error messages
- ✅ No more "spotty" behavior - it's deterministic

### Health Checks
- MySQL has a proper health check
- App container waits for database to be healthy
- Dependencies are properly ordered

### Better Scripts
- `init-data.sh` - Improved database initialization with robust retry logic
- `start-all.sh` - New automated startup script
- `check-init-status.sh` - Check if database is initialized
- `wait-for-mysql.sh` - Utility to wait for MySQL readiness

## Troubleshooting

### Issue: "MySQL is unavailable"
**Solution**: Wait a bit longer. MySQL can take 30-60 seconds to fully initialize on first run.
```bash
# Check MySQL health
docker compose exec airline-db mysqladmin ping -u mfc01 -pghEtmwBdnXYBQH4
```

### Issue: "Initialization failed after X attempts"
**Possible causes**:
1. MySQL not fully ready
2. Database encoding issues
3. Out of memory

**Solutions**:
```bash
# Check MySQL logs
docker compose logs airline-db

# Check if database exists
docker compose exec airline-db mysql -u mfc01 -pghEtmwBdnXYBQH4 -e "SHOW DATABASES;"

# Restart MySQL if needed
docker compose restart airline-db

# Wait for it to be healthy
docker compose ps
```

### Issue: Out of Memory Errors
**Solution**: Increase Docker's memory allocation:
- Docker Desktop → Settings → Resources → Memory
- Recommended: 8GB minimum

### Issue: Port Already in Use
**Solution**: Change ports in `docker-compose.override.yaml`
```yaml
services:
  airline-app:
    ports:
      - "9001:9000"  # Change 9001 to any available port
```

### Issue: Want to Start Fresh
**Solution**: Reset everything:
```bash
# Stop all containers
docker compose down

# Remove volumes (this deletes the database!)
docker compose down -v

# Start again
docker compose up -d

# Re-initialize
docker compose exec airline-app bash /home/airline/init-data.sh
```

## Utility Commands

### Check Initialization Status
```bash
docker compose exec airline-app bash /home/airline/check-init-status.sh
```

### View Logs
```bash
# All containers
docker compose logs -f

# Specific container
docker compose logs -f airline-app
docker compose logs -f airline-db
docker compose logs -f airline-search
```

### Access Container Shell
```bash
docker compose exec airline-app bash
```

### Stop the Application
```bash
# Stop all containers
docker compose stop

# Stop and remove containers
docker compose down

# Stop, remove, and delete volumes
docker compose down -v
```

## Advanced Configuration

### Custom Database Credentials
Edit `docker-compose.override.yaml`:
```yaml
services:
  airline-app:
    environment:
      DB_NAME: my_airline_db
      DB_USER: my_user
      DB_PASSWORD: my_secure_password
  
  airline-db:
    environment:
      MYSQL_DATABASE: my_airline_db
      MYSQL_USER: my_user
      MYSQL_PASSWORD: my_secure_password
```

### Production Considerations
For production use:
1. Change default passwords
2. Enable SSL for MySQL
3. Use proper reverse proxy (nginx/traefik)
4. Set up backups for `mysql-data` volume
5. Configure proper resource limits
6. Use secrets management instead of environment variables

## Development Workflow

### Making Code Changes
Since the code is mounted as a volume, changes are reflected immediately:
1. Edit code in your local IDE
2. Restart the relevant service:
   ```bash
   # For backend changes
   # Press Ctrl+C in the terminal running start-data.sh
   # Then run it again
   
   # For frontend changes
   # Press Ctrl+C in the terminal running start-web.sh
   # Then run it again
   ```

### Cleaning Build Cache
```bash
docker compose exec airline-app bash /home/airline/clean-web.sh
```

## Support

If you encounter issues not covered here:
1. Check the logs: `docker compose logs -f`
2. Verify all containers are running: `docker compose ps`
3. Check MySQL health: `docker compose exec airline-db mysqladmin ping`
4. Open an issue on GitHub with logs and error messages
