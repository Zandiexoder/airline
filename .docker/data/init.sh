#!/bin/sh
set -e

echo "===== WAITING FOR DATABASE ====="
# Wait for MySQL to be ready
max_attempts=60
attempt=0
db_host="${DB_HOST:-airline-db}"
db_user="${DB_USER:-mfc01}"
db_pass="${DB_PASSWORD:-ghEtmwBdnXYBQH4}"

# Extract host if it contains port
db_host_only=$(echo "$db_host" | cut -d':' -f1)

echo "Checking MySQL connection to $db_host_only..."
until mysql -h"$db_host_only" -u"$db_user" -p"$db_pass" -e "SELECT 1" > /dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ $attempt -eq $max_attempts ]; then
    echo "ERROR: MySQL did not become ready in time (waited 120 seconds)"
    exit 1
  fi
  echo "MySQL is unavailable (attempt $attempt/$max_attempts) - waiting..."
  sleep 2
done

echo "✓ MySQL is ready!"

echo "===== BUILDING PROJECT (publishLocal) ====="
cd /home/airline/airline/airline-data

# Run publishLocal with retry logic
echo "Running sbt publishLocal..."
max_build_attempts=3
build_attempt=0

while [ $build_attempt -lt $max_build_attempts ]; do
  build_attempt=$((build_attempt + 1))
  echo "Build attempt $build_attempt/$max_build_attempts..."
  
  if sbt publishLocal; then
    echo "✓ Build succeeded!"
    break
  else
    if [ $build_attempt -eq $max_build_attempts ]; then
      echo "ERROR: Build failed after $max_build_attempts attempts"
      exit 1
    fi
    echo "Build failed, retrying in 5 seconds..."
    sleep 5
  fi
done

echo "===== STARTING DATABASE MIGRATION ====="
# Run MainInit with better retry logic and exponential backoff
max_init_attempts=10
init_attempt=0
sleep_time=5

while [ $init_attempt -lt $max_init_attempts ]; do
  init_attempt=$((init_attempt + 1))
  echo "Initialization attempt $init_attempt/$max_init_attempts..."
  
  if sbt "runMain com.patson.init.MainInit"; then
    echo "✓ Initialization succeeded!"
    echo "===== INITIALIZATION COMPLETE ====="
    exit 0
  else
    if [ $init_attempt -eq $max_init_attempts ]; then
      echo "ERROR: Initialization failed after $max_init_attempts attempts"
      echo "Please check the logs above for errors"
      exit 1
    fi
    echo "Initialization failed, retrying in $sleep_time seconds..."
    sleep $sleep_time
    # Exponential backoff (5s, 10s, 15s, etc.)
    sleep_time=$((sleep_time + 5))
  fi
done
