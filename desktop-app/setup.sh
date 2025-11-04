#!/bin/bash

# Desktop App Setup Script
# Automates the initial setup of MyFly Club Desktop App

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║        FlightForge Desktop App Setup                  ║
║        Airline Management Simulation                  ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if running from correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must be run from desktop-app directory${NC}"
    echo "cd desktop-app && ./setup.sh"
    exit 1
fi

PROJECT_ROOT="$(dirname "$(pwd)")"

# Function to check command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to prompt yes/no
ask_yes_no() {
    while true; do
        read -p "$1 (y/n) " yn
        case $yn in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Please answer yes or no.";;
        esac
    done
}

echo ""
echo -e "${YELLOW}Step 1: Checking Prerequisites${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found"
    echo "  Install from: https://nodejs.org/"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} npm: $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found"
    exit 1
fi

# Check Java
if command_exists java; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
    echo -e "${GREEN}✓${NC} Java: $JAVA_VERSION"
else
    echo -e "${RED}✗${NC} Java not found"
    echo "  Install OpenJDK 11+: https://adoptium.net/"
    exit 1
fi

# Check SBT
if command_exists sbt; then
    echo -e "${GREEN}✓${NC} SBT: installed"
else
    echo -e "${YELLOW}!${NC} SBT not found (required for development)"
    if ask_yes_no "Continue anyway?"; then
        :
    else
        exit 1
    fi
fi

# Check MySQL
if command_exists mysql; then
    echo -e "${GREEN}✓${NC} MySQL: installed"
else
    echo -e "${YELLOW}!${NC} MySQL not found"
    if ask_yes_no "Continue anyway? (You'll need to install MySQL later)"; then
        :
    else
        exit 1
    fi
fi

echo ""
echo -e "${YELLOW}Step 2: Installing Desktop App Dependencies${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

npm install
echo -e "${GREEN}✓${NC} Dependencies installed"

echo ""
echo -e "${YELLOW}Step 3: Database Setup${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ask_yes_no "Do you need to set up the database?"; then
    echo ""
    echo "Database Configuration:"
    echo "  Database Name: airline"
    echo "  Username: mfc01"
    echo "  Password: ghEtmwBdnXYBQH4"
    echo ""
    echo "Run these SQL commands:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    cat << 'SQL'
CREATE DATABASE airline CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mfc01'@'localhost' IDENTIFIED BY 'ghEtmwBdnXYBQH4';
GRANT ALL PRIVILEGES ON airline.* TO 'mfc01'@'localhost';
FLUSH PRIVILEGES;
SQL
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    if ask_yes_no "Open MySQL now to run these commands?"; then
        if command_exists mysql; then
            echo "Connecting to MySQL..."
            mysql -u root -p << 'SQL'
CREATE DATABASE IF NOT EXISTS airline CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'mfc01'@'localhost' IDENTIFIED BY 'ghEtmwBdnXYBQH4';
GRANT ALL PRIVILEGES ON airline.* TO 'mfc01'@'localhost';
FLUSH PRIVILEGES;
SQL
            echo -e "${GREEN}✓${NC} Database created"
        fi
    fi
    
    if ask_yes_no "Initialize database schema now? (takes 10-15 minutes)"; then
        cd "$PROJECT_ROOT/airline-data"
        export SBT_OPTS="-Xms2g -Xmx8g"
        echo ""
        echo "Running database initialization..."
        echo "This will take 10-15 minutes. Please be patient."
        echo ""
        
        # Run MainInit
        echo "1" | sbt run
        
        echo -e "${GREEN}✓${NC} Database initialized"
    else
        echo -e "${YELLOW}!${NC} Database not initialized"
        echo "  You'll need to run this later before first use:"
        echo "  cd airline-data && sbt run (select option 1: MainInit)"
    fi
else
    echo "Skipping database setup"
fi

echo ""
echo -e "${YELLOW}Step 4: Backend Build${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ask_yes_no "Build the backend now? (required, takes 5-10 minutes)"; then
    export SBT_OPTS="-Xms2g -Xmx8g"
    
    echo ""
    echo "Building airline-data..."
    cd "$PROJECT_ROOT/airline-data"
    sbt publishLocal
    echo -e "${GREEN}✓${NC} airline-data built"
    
    echo ""
    echo "Building airline-web..."
    cd "$PROJECT_ROOT/airline-web"
    sbt stage
    echo -e "${GREEN}✓${NC} airline-web built"
else
    echo -e "${YELLOW}!${NC} Backend not built"
    echo "  You'll need to build it before first use"
fi

echo ""
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║              Setup Complete! ✓                        ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo "Next steps:"
echo ""
echo "1. Run the app in development mode:"
echo "   ${GREEN}./dev.sh${NC}"
echo ""
echo "2. Or build installers:"
echo "   ${GREEN}./build.sh${NC}  (current platform)"
echo "   ${GREEN}./build.sh mac${NC}  (macOS)"
echo "   ${GREEN}./build.sh win${NC}  (Windows)"
echo "   ${GREEN}./build.sh linux${NC}  (Linux)"
echo ""
echo "3. Read the documentation:"
echo "   ${BLUE}README.md${NC}      - User guide"
echo "   ${BLUE}GUIDE.md${NC}       - Developer guide"
echo "   ${BLUE}QUICK_START.md${NC} - Quick reference"
echo ""
echo "Happy flying! ✈️"
echo ""
