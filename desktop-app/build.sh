#!/bin/bash

# Build script for FlightForge Desktop App
# This script packages the Scala backend with the Electron frontend

set -e

echo "🚀 Building FlightForge Desktop App..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

command -v java >/dev/null 2>&1 || { echo -e "${RED}❌ Java is required but not installed.${NC}" >&2; exit 1; }
command -v sbt >/dev/null 2>&1 || { echo -e "${RED}❌ SBT is required but not installed.${NC}" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}❌ npm is required but not installed.${NC}" >&2; exit 1; }

echo -e "${GREEN}✅ All prerequisites found${NC}"

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DESKTOP_APP_DIR="$PROJECT_ROOT/desktop-app"

# Step 1: Build airline-data
echo ""
echo "📦 Building airline-data..."
cd "$PROJECT_ROOT/airline-data"

# Set SBT memory options
export SBT_OPTS="-Xms2g -Xmx8g"

# Clean and publish local
sbt clean publishLocal

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ airline-data built successfully${NC}"
else
    echo -e "${RED}❌ Failed to build airline-data${NC}"
    exit 1
fi

# Step 2: Build airline-web
echo ""
echo "📦 Building airline-web..."
cd "$PROJECT_ROOT/airline-web"

# Stage the application (creates a runnable distribution)
sbt clean stage

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ airline-web staged successfully${NC}"
else
    echo -e "${RED}❌ Failed to stage airline-web${NC}"
    exit 1
fi

# Step 3: Install Electron dependencies
echo ""
echo "📦 Installing Electron dependencies..."
cd "$DESKTOP_APP_DIR"
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Step 3.5: Pre-initialize for fast startup
echo ""
echo "⚡ Running pre-initialization for fast startup..."
cd "$DESKTOP_APP_DIR"
./pre-init.sh

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Pre-initialization complete${NC}"
else
    echo -e "${YELLOW}⚠️  Pre-initialization had issues, continuing anyway${NC}"
fi

# Step 4: Package the application
echo ""
echo "📦 Packaging desktop application..."

# Determine platform
PLATFORM=$(uname -s)
BUILD_CMD="npm run build"

if [ "$1" == "mac" ] || [ "$PLATFORM" == "Darwin" ]; then
    BUILD_CMD="npm run build:mac"
    echo "Building for macOS..."
elif [ "$1" == "win" ]; then
    BUILD_CMD="npm run build:win"
    echo "Building for Windows..."
elif [ "$1" == "linux" ] || [ "$PLATFORM" == "Linux" ]; then
    BUILD_CMD="npm run build:linux"
    echo "Building for Linux..."
else
    echo "Building for current platform..."
fi

$BUILD_CMD

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Desktop app built successfully!${NC}"
    echo ""
    echo "📁 Output location: $DESKTOP_APP_DIR/dist"
    echo ""
    ls -lh "$DESKTOP_APP_DIR/dist"
else
    echo -e "${RED}❌ Failed to build desktop app${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Build complete!${NC}"
