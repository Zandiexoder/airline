#!/bin/bash
# quick-start.sh - One-command Docker setup for the airline project

set -e

echo "=========================================="
echo "  Airline Project - Docker Quick Start"
echo "=========================================="
echo ""

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed or not in PATH"
    echo "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if docker compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Error: Docker Compose is not available"
    echo "Please install Docker Desktop or docker-compose plugin"
    exit 1
fi

echo "✓ Docker is installed"
echo ""

# Create override file if it doesn't exist
if [ ! -f "docker-compose.override.yaml" ]; then
    echo "Creating docker-compose.override.yaml..."
    cp docker-compose.override.yaml.dist docker-compose.override.yaml
    echo "✓ Created docker-compose.override.yaml"
    echo ""
fi

# Check if containers are already running
if docker compose ps | grep -q "Up"; then
    echo "⚠️  Containers are already running"
    read -p "Do you want to restart them? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Stopping containers..."
        docker compose down
    else
        echo "Keeping existing containers running"
        echo "To access the app shell: docker compose exec airline-app bash"
        exit 0
    fi
fi

echo "Starting Docker containers..."
docker compose up -d

# Wait a moment for containers to initialize
sleep 3

echo ""
echo "==========================================
  Services Status
=========================================="
docker compose ps

echo ""
echo "✓ Main Application: http://localhost:9000"
echo "✓ Admin Panel: http://localhost:9001"
echo ""
echo "Waiting for containers to start..."
sleep 5

echo ""
echo "Checking container status..."
docker compose ps

echo ""
echo "Waiting for database to be healthy (this may take 30-60 seconds)..."
max_wait=60
count=0
while [ $count -lt $max_wait ]; do
    if docker compose ps airline-db | grep -q "healthy"; then
        echo "✓ Database is healthy!"
        break
    fi
    echo -n "."
    sleep 2
    count=$((count + 2))
done

if [ $count -ge $max_wait ]; then
    echo ""
    echo "⚠️  Database health check timeout. It may still be starting."
    echo "Check status with: docker compose ps"
    echo "Check logs with: docker compose logs airline-db"
fi

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Initialize the database and start the application:"
echo "   docker compose exec airline-app bash /home/airline/start-all.sh"
echo ""
echo "   (This will take several minutes on first run)"
echo ""
echo "2. OR do it manually in separate terminals:"
echo "   Terminal 1: docker compose exec airline-app bash /home/airline/init-data.sh"
echo "   Terminal 2: docker compose exec airline-app bash /home/airline/start-data.sh"
echo "   Terminal 3: docker compose exec airline-app bash /home/airline/start-web.sh"
echo ""
echo "3. Once started, access the application at:"
echo "   http://localhost:9000"
echo ""
echo "Useful commands:"
echo "  - View logs: docker compose logs -f"
echo "  - Check status: docker compose ps"
echo "  - Stop: docker compose stop"
echo "  - Reset everything: docker compose down -v"
echo ""
echo "For more details, see DOCKER_GUIDE.md"
echo ""
