#!/bin/sh
# start-all.sh - Automated startup script for the entire airline application
# This script will initialize the database (if needed) and start both backend and frontend

set -e

echo "=========================================="
echo "  Airline Application - Full Startup"
echo "=========================================="

# Check if already initialized by looking for a marker file
INIT_MARKER="/tmp/airline_initialized"

if [ ! -f "$INIT_MARKER" ]; then
  echo ""
  echo "Database not initialized yet. Running initialization..."
  echo ""
  
  if sh /home/airline/init-data.sh; then
    echo "✓ Database initialization complete!"
    touch "$INIT_MARKER"
  else
    echo "✗ Database initialization failed!"
    exit 1
  fi
else
  echo ""
  echo "Database already initialized (marker found at $INIT_MARKER)"
  echo "To re-initialize, delete the marker file and restart"
  echo ""
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
echo "Waiting 30 seconds for backend to stabilize..."
sleep 30

echo ""
echo "=========================================="
echo "  Starting Frontend Web Server"
echo "=========================================="
echo ""

# Start the frontend (this will run in foreground)
sh /home/airline/start-web.sh
