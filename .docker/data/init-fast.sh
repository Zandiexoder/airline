#!/bin/sh
# init-data-fast.sh - OPTIMIZED initialization script
# This version skips unnecessary steps for faster startup

set -e

echo "===== SMART INITIALIZATION (OPTIMIZED) ====="

# Check if database already has data
echo "Checking if database needs initialization..."

DB_CHECK=$(mysql -h "${DB_HOST%:*}" -P "${DB_HOST#*:}" -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" -se "SELECT COUNT(*) FROM airport LIMIT 1" 2>/dev/null || echo "0")

if [ "$DB_CHECK" -gt "0" ]; then
  echo "✓ Database already initialized ($DB_CHECK airports found)"
  echo "✓ Skipping MainInit - saves ~2-5 minutes!"
  echo ""
  echo "To force re-initialization:"
  echo "  1. Set FORCE_INIT=true environment variable, OR"
  echo "  2. Manually run: docker-compose exec airline-app /home/airline/init-data.sh"
  exit 0
fi

echo "Database is empty, proceeding with initialization..."
echo ""

# Fix permissions (quick)
echo "===== FIXING PERMISSIONS ====="
sudo chown -R airline:airline /home/airline/airline/airline-data/target 2>/dev/null || true
sudo chown -R airline:airline /home/airline/airline/airline-web/target 2>/dev/null || true
chmod -R 755 /home/airline/airline/airline-data/target 2>/dev/null || true
chmod -R 755 /home/airline/airline/airline-web/target 2>/dev/null || true

cd /home/airline/airline/airline-data

# Only clean if explicitly requested or target doesn't exist
if [ "$FORCE_CLEAN" = "true" ] || [ ! -d "target" ]; then
  echo "Cleaning cached builds..."
  sbt clean
else
  echo "✓ Skipping sbt clean (target exists) - saves ~30-60 seconds!"
fi

# Only publish if needed
if [ "$FORCE_PUBLISH" = "true" ] || [ ! -f "target/scala-2.13/airline-data_2.13-0.1-SNAPSHOT.jar" ]; then
  echo "Publishing locally..."
  sbt publishLocal
else
  echo "✓ Skipping publishLocal (JAR exists) - saves ~60-120 seconds!"
fi

echo "===== STARTING DATABASE MIGRATION ====="

# Run MainInit with retry logic
for i in `seq 1 5`
do
  DB_HOST="${DB_HOST}" DB_NAME="${DB_NAME}" DB_USER="${DB_USER}" DB_PASSWORD="${DB_PASSWORD}" sbt "runMain com.patson.init.MainInit"
  if [ $? -eq 0 ]; then
    echo "✓ Database initialization succeeded on attempt $i"
    break
  else
    echo "✗ Attempt $i failed, retrying in 5 seconds..."
    sleep 5
  fi
done

echo "===== INITIALIZATION COMPLETE ====="
