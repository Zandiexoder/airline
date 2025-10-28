#!/bin/sh
# wait-for-mysql.sh - Wait for MySQL to be ready

set -e

host="$1"
shift
cmd="$@"

echo "Waiting for MySQL at $host to be ready..."

max_attempts=60
attempt=0

until mysql -h"$host" -u"${DB_USER:-mfc01}" -p"${DB_PASSWORD:-ghEtmwBdnXYBQH4}" -e "SELECT 1" > /dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ $attempt -eq $max_attempts ]; then
    echo "MySQL did not become ready in time"
    exit 1
  fi
  echo "MySQL is unavailable (attempt $attempt/$max_attempts) - sleeping"
  sleep 2
done

echo "MySQL is up and ready!"

exec $cmd
