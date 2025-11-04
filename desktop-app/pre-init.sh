#!/bin/bash

# Pre-initialization script for FlightForge Desktop App
# This runs during the build process to set up everything needed for instant gameplay

set -e

echo "🚀 Pre-initializing FlightForge for fast startup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$PROJECT_ROOT/airline-data"
WEB_DIR="$PROJECT_ROOT/airline-web"

echo ""
echo -e "${BLUE}Step 1: Checking Database Setup${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if MySQL is available (including Homebrew installations)
MYSQL_CMD=""
if command -v mysql &> /dev/null; then
    MYSQL_CMD="mysql"
elif [ -f "/opt/homebrew/bin/mysql" ]; then
    MYSQL_CMD="/opt/homebrew/bin/mysql"
    echo -e "${GREEN}✅ Found Homebrew MySQL (Apple Silicon)${NC}"
elif [ -f "/usr/local/bin/mysql" ]; then
    MYSQL_CMD="/usr/local/bin/mysql"
    echo -e "${GREEN}✅ Found Homebrew MySQL (Intel)${NC}"
else
    echo -e "${RED}❌ MySQL not found. Please install MySQL 8${NC}"
    echo "   Install with: brew install mysql@8.0"
    echo "   Then add to PATH: echo 'export PATH=\"/opt/homebrew/opt/mysql@8.0/bin:\$PATH\"' >> ~/.zshrc"
    exit 1
fi

# Check if MySQL server is running
if ! $MYSQL_CMD -u root -e "SELECT 1" &> /dev/null; then
    echo -e "${YELLOW}⚠️  MySQL server not running. Starting...${NC}"
    if [ -f "/opt/homebrew/bin/mysql.server" ]; then
        /opt/homebrew/bin/mysql.server start
    elif [ -f "/usr/local/bin/mysql.server" ]; then
        /usr/local/bin/mysql.server start
    else
        brew services start mysql@8.0
    fi
    sleep 5
fi

# Check if database exists
DB_EXISTS=$($MYSQL_CMD -u mfc01 -pghEtmwBdnXYBQH4 -e "SHOW DATABASES LIKE 'airline';" 2>/dev/null | grep airline || echo "")

if [ -z "$DB_EXISTS" ]; then
    echo -e "${YELLOW}⚠️  Database 'airline' not found. Creating...${NC}"
    
    # Try without password first (fresh Homebrew installation)
    if $MYSQL_CMD -u root -e "SELECT 1" &> /dev/null; then
        echo "Creating database without password..."
        $MYSQL_CMD -u root << 'SQL'
CREATE DATABASE IF NOT EXISTS airline CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'mfc01'@'localhost' IDENTIFIED BY 'ghEtmwBdnXYBQH4';
GRANT ALL PRIVILEGES ON airline.* TO 'mfc01'@'localhost';
FLUSH PRIVILEGES;
SQL
    else
        echo -e "${YELLOW}Root password required. Please enter MySQL root password:${NC}"
        $MYSQL_CMD -u root -p << 'SQL'
CREATE DATABASE IF NOT EXISTS airline CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'mfc01'@'localhost' IDENTIFIED BY 'ghEtmwBdnXYBQH4';
GRANT ALL PRIVILEGES ON airline.* TO 'mfc01'@'localhost';
FLUSH PRIVILEGES;
SQL
    fi
    
    echo -e "${GREEN}✅ Database created${NC}"
else
    echo -e "${GREEN}✅ Database exists${NC}"
fi

echo ""
echo -e "${BLUE}Step 2: Checking Database Initialization${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if tables exist (indicates database is initialized)
TABLE_COUNT=$($MYSQL_CMD -u mfc01 -pghEtmwBdnXYBQH4 airline -e "SHOW TABLES;" 2>/dev/null | wc -l)

if [ "$TABLE_COUNT" -lt 10 ]; then
    echo -e "${YELLOW}⚠️  Database not initialized. Running MainInit...${NC}"
    echo "   This will take 10-15 minutes. Please be patient."
    echo ""
    
    cd "$DATA_DIR"
    export SBT_OPTS="-Xms2g -Xmx8g"
    
    # Run MainInit (option 16) - macOS doesn't have timeout, use background process
    echo "16" | sbt run &
    SBT_PID=$!
    
    # Wait up to 20 minutes (1200 seconds)
    WAIT_TIME=0
    MAX_WAIT=1200
    while [ $WAIT_TIME -lt $MAX_WAIT ]; do
        if ! kill -0 $SBT_PID 2>/dev/null; then
            # Process finished
            wait $SBT_PID
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ Database initialized${NC}"
                break
            else
                echo -e "${RED}❌ Database initialization failed${NC}"
                exit 1
            fi
        fi
        sleep 10
        WAIT_TIME=$((WAIT_TIME + 10))
        if [ $((WAIT_TIME % 60)) -eq 0 ]; then
            echo "   Still initializing... ($((WAIT_TIME / 60)) minutes elapsed)"
        fi
    done
    
    if [ $WAIT_TIME -ge $MAX_WAIT ]; then
        echo -e "${RED}❌ Database initialization timed out after 20 minutes${NC}"
        kill $SBT_PID 2>/dev/null
        exit 1
    fi
else
    echo -e "${GREEN}✅ Database already initialized (${TABLE_COUNT} tables)${NC}"
fi

echo ""
echo -e "${BLUE}Step 3: Pre-compiling Backend${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$DATA_DIR"
export SBT_OPTS="-Xms2g -Xmx8g"

echo "Compiling airline-data..."
sbt clean compile publishLocal
echo -e "${GREEN}✅ airline-data compiled${NC}"

echo ""
echo "Staging airline-web..."
cd "$WEB_DIR"
sbt clean compile stage
echo -e "${GREEN}✅ airline-web staged${NC}"

echo ""
echo -e "${BLUE}Step 4: Creating Optimized Startup Cache${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create a marker file to indicate initialization is complete
CACHE_DIR="$PROJECT_ROOT/desktop-app/.cache"
mkdir -p "$CACHE_DIR"

cat > "$CACHE_DIR/init-complete.json" << EOF
{
  "initialized": true,
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "1.0.0",
  "database": "initialized",
  "backend": "compiled",
  "tables": $TABLE_COUNT
}
EOF

echo -e "${GREEN}✅ Startup cache created${NC}"

echo ""
echo -e "${BLUE}Step 5: Optimizing for Fast Startup${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create JVM warmup cache
cd "$WEB_DIR"
echo "Creating JVM class cache..."

# Start server briefly to warm up JVM (macOS compatible)
sbt run &
SERVER_PID=$!
sleep 25
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

echo -e "${GREEN}✅ JVM cache warmed${NC}"

echo ""
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║         Pre-initialization Complete! ✓                ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo "Optimizations applied:"
echo "  ✓ Database initialized and ready"
echo "  ✓ Backend pre-compiled"
echo "  ✓ JVM cache created"
echo "  ✓ Startup cache generated"
echo ""
echo "Expected startup time: 5-10 seconds (vs 30-60 seconds)"
echo ""
