#!/bin/bash
# Fix airlines.csv path for Docker container

echo "Checking airlines.csv location..."

# Check if file exists in root
if [ -f "/root/airlines.csv" ]; then
    echo "✓ airlines.csv found in /root/"
else
    # Copy from airline directory if it exists
    if [ -f "/root/airline/airlines.csv" ]; then
        cp /root/airline/airlines.csv /root/airlines.csv
        echo "✓ Copied airlines.csv to /root/"
    elif [ -f "/root/airline/airline-data/airlines.csv" ]; then
        cp /root/airline/airline-data/airlines.csv /root/airlines.csv
        echo "✓ Copied airlines.csv from airline-data to /root/"
    else
        echo "✗ airlines.csv not found - bot airlines will use generic names"
        exit 0
    fi
fi

# Also create symlinks in common locations
ln -sf /root/airlines.csv /root/airline/airlines.csv 2>/dev/null
ln -sf /root/airlines.csv /root/airline/airline-data/airlines.csv 2>/dev/null

echo "airlines.csv setup complete!"
