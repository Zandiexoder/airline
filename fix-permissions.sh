#!/bin/bash
# Fix permissions for Docker container
# Run this script on the host to fix file ownership issues

echo "Fixing permissions for airline project..."

# Create target directories if they don't exist
mkdir -p airline-data/target
mkdir -p airline-data/project/target
mkdir -p airline-web/target
mkdir -p airline-web/project/target

# Set ownership to UID 1000 (the airline user in the container)
sudo chown -R 1000:1000 airline-data/target airline-data/project airline-web/target airline-web/project 2>/dev/null || true

# Make directories writable
chmod -R 755 airline-data/target airline-data/project airline-web/target airline-web/project 2>/dev/null || true

echo "✓ Permissions fixed!"
echo "You can now run: docker compose exec airline-app bash /home/airline/start-all.sh"
