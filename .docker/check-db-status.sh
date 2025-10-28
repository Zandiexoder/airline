#!/bin/sh
# check-db-status.sh - Quick script to check if database is initialized

DB_HOST="${DB_HOST}"
DB_NAME="${DB_NAME}"
DB_USER="${DB_USER}"
DB_PASSWORD="${DB_PASSWORD}"

echo "Checking database status..."
echo ""

# Check if we can connect
if ! mysql -h "${DB_HOST%:*}" -P "${DB_HOST#*:}" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" > /dev/null 2>&1; then
  echo "❌ Cannot connect to database"
  exit 1
fi

echo "✓ Database connection OK"
echo ""

# Check tables exist
TABLES=$(mysql -h "${DB_HOST%:*}" -P "${DB_HOST#*:}" -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" -se "SHOW TABLES" 2>/dev/null | wc -l)
echo "Tables found: $TABLES"

if [ "$TABLES" -eq "0" ]; then
  echo "Status: ❌ EMPTY - Needs initialization"
  exit 2
fi

# Check data exists
AIRPORTS=$(mysql -h "${DB_HOST%:*}" -P "${DB_HOST#*:}" -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" -se "SELECT COUNT(*) FROM airport" 2>/dev/null || echo "0")
AIRLINES=$(mysql -h "${DB_HOST%:*}" -P "${DB_HOST#*:}" -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" -se "SELECT COUNT(*) FROM airline" 2>/dev/null || echo "0")
LINKS=$(mysql -h "${DB_HOST%:*}" -P "${DB_HOST#*:}" -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" -se "SELECT COUNT(*) FROM link" 2>/dev/null || echo "0")
USERS=$(mysql -h "${DB_HOST%:*}" -P "${DB_HOST#*:}" -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" -se "SELECT COUNT(*) FROM user" 2>/dev/null || echo "0")

echo ""
echo "Data Summary:"
echo "  Airports: $AIRPORTS"
echo "  Airlines: $AIRLINES"
echo "  Links/Routes: $LINKS"
echo "  Users: $USERS"
echo ""

if [ "$AIRPORTS" -gt "0" ]; then
  echo "Status: ✅ INITIALIZED - Ready to use!"
  echo ""
  echo "You can run start-all-fast.sh for faster startup"
  exit 0
else
  echo "Status: ⚠️  PARTIAL - Has tables but no data"
  echo ""
  echo "Run init-data.sh to populate database"
  exit 2
fi
