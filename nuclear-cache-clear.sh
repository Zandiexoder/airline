#!/bin/bash
# Nuclear cache clearing script

echo "🧹 Starting NUCLEAR cache clear..."

# Stop the application
echo "1. Stopping airline-web process..."
docker compose exec airline-app pkill -f "airline-web" 2>/dev/null || true

# Wait for process to die
sleep 2

# Clear Play Framework caches
echo "2. Clearing Play Framework target directories..."
docker compose exec airline-app bash -c "rm -rf /home/airline/airline/airline-web/target/web"
docker compose exec airline-app bash -c "rm -rf /home/airline/airline/airline-web/target/scala-2.13/classes"
docker compose exec airline-app bash -c "rm -rf /home/airline/airline/airline-web/target/scala-2.13/cache"

# Clear SBT caches  
echo "3. Clearing SBT caches..."
docker compose exec airline-app bash -c "cd /home/airline/airline/airline-web && sbt clean"

# Restart container for fresh environment
echo "4. Restarting Docker container..."
docker compose restart airline-app

echo "5. Waiting for container to be ready..."
sleep 20

# Start the application
echo "6. Starting airline-web..."
docker compose exec airline-app bash /home/airline/start-all-fast.sh

echo ""
echo "✅ Nuclear cache clear complete!"
echo ""
echo "📌 IMPORTANT: Open http://192.168.1.131:9000 in a NEW INCOGNITO window"
echo "📌 Or in your current browser, press: Ctrl+Shift+Delete → Clear all cache → Hard Reload"
