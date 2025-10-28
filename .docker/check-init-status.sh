#!/bin/sh
# check-init-status.sh - Check if the database has been initialized

db_host="${DB_HOST:-airline-db}"
db_user="${DB_USER:-mfc01}"
db_pass="${DB_PASSWORD:-ghEtmwBdnXYBQH4}"
db_name="${DB_NAME:-airline}"

# Extract host if it contains port
db_host_only=$(echo "$db_host" | cut -d':' -f1)

echo "Checking initialization status..."
echo "Database: $db_name on $db_host_only"

# Check if database exists and has tables
table_count=$(mysql -h"$db_host_only" -u"$db_user" -p"$db_pass" -D"$db_name" -sN -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$db_name'" 2>/dev/null || echo "0")

if [ "$table_count" -gt 0 ]; then
  echo "✓ Database is initialized with $table_count tables"
  exit 0
else
  echo "✗ Database is empty or not initialized"
  exit 1
fi
