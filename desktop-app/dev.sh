#!/bin/bash

# Development runner for MyFly Club Desktop App
# This script runs the app in development mode with auto-reload

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "🚀 Starting FlightForge Desktop in development mode..."
echo ""
echo "This will:"
echo "  1. Use the local Scala source code"
echo "  2. Enable hot reload for Electron"
echo "  3. Auto-open developer tools"
echo ""

# Check if node_modules exists
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd "$SCRIPT_DIR"
    npm install
fi

# Set development environment
export NODE_ENV=development

# Run the app
cd "$SCRIPT_DIR"
npm run dev
