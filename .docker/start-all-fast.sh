#!/bin/sh
# start-all-fast.sh - OPTIMIZED startup script
# This version includes smart checks to skip unnecessary processing

set -e

echo "=========================================="
echo "  Airline App - FAST START (Optimized)"
echo "=========================================="

# Function to check if database has data
check_db_initialized() {
  DB_CHECK=$(mysql -h "${DB_HOST%:*}" -P "${DB_HOST#*:}" -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" -se "SELECT COUNT(*) FROM airport LIMIT 1" 2>/dev/null || echo "0")
  [ "$DB_CHECK" -gt "0" ]
}

# Function to wait for backend health
wait_for_backend() {
  echo "Waiting for backend to be ready..."
  timeout=60
  while [ $timeout -gt 0 ]; do
    # Check if backend process is responding
    if ps -p $1 > /dev/null 2>&1; then
      echo "✓ Backend process is running"
      # Optional: Add actual health check if backend exposes one
      # if curl -f http://localhost:9000/health 2>/dev/null; then
      #   echo "✓ Backend is healthy!"
      #   return 0
      # fi
      sleep 5  # Reduced from 30 to 5 seconds
      return 0
    fi
    sleep 2
    timeout=$((timeout-2))
  done
  echo "⚠ Backend health check timed out, continuing anyway..."
}

# Smart initialization check
if check_db_initialized; then
  echo ""
  echo "✓ Database already initialized (found existing data)"
  echo "  Skipping initialization - SAVED 2-5 MINUTES! ⚡"
  echo ""
else
  echo ""
  echo "Database not initialized. Running initialization..."
  echo ""
  
  if sh /home/airline/init-data-fast.sh; then
    echo "✓ Database initialization complete!"
  else
    echo "✗ Database initialization failed!"
    exit 1
  fi
fi

echo ""
echo "=========================================="
echo "  Starting Backend Simulation"
echo "=========================================="
echo ""

# Start the backend simulation in the background
sh /home/airline/start-data.sh &
BACKEND_PID=$!

echo "Backend started with PID $BACKEND_PID"

# Smart wait instead of fixed 30 seconds
wait_for_backend $BACKEND_PID

echo ""
echo "=========================================="
echo "  Starting Frontend Web Server"
echo "=========================================="
echo ""

# Display service URLs
echo "📊 Admin Panel: http://localhost:9001"
echo "🌐 Web App: http://localhost:9000"
echo ""

# Start the frontend (runs in foreground)
sh /home/airline/start-web.sh
