#!/bin/bash
# Ultra nuclear cache clearing script - destroys EVERYTHING

echo "💣 Starting ULTRA NUCLEAR cache clear..."
echo "This will destroy ALL caches and force a complete rebuild"
echo ""

# Force kill
echo "1. Force killing all Java processes..."
docker compose exec airline-app bash -c "pkill -9 -f java" 2>/dev/null || true
sleep 3

# Delete ALL target directories
echo "2. Deleting ALL target directories..."
docker compose exec airline-app bash -c "
rm -rf /home/airline/airline/airline-web/target
rm -rf /home/airline/airline/airline-web/project/target
rm -rf /home/airline/airline/airline-web/project/project/target
rm -rf /home/airline/airline/airline-data/target
rm -rf /home/airline/airline/airline-data/project/target
"

# Delete SBT boot and caches
echo "3. Clearing SBT caches..."
docker compose exec airline-app bash -c "
rm -rf /home/airline/.sbt/boot
rm -rf /home/airline/.sbt/1.0/zinc
"

# Restart container completely
echo "4. Restarting Docker container..."
docker compose restart airline-app
sleep 25

# Start app
echo "5. Starting airline-web with clean state..."
docker compose exec airline-app bash /home/airline/start-all-fast.sh

echo ""
echo "✅ Ultra nuclear cache clear complete!"
echo ""
echo "📌 CRITICAL: You MUST do these steps:"
echo "   1. Close ALL browser windows/tabs with 192.168.1.131"
echo "   2. Open Chrome/Firefox settings"
echo "   3. Go to: Clear browsing data → Cached images and files → All time → Clear"
echo "   4. Open a NEW INCOGNITO window"
echo "   5. Navigate to: http://192.168.1.131:9000"
echo ""
echo "📌 In DevTools Console, you should see:"
echo "   ✅ Leaflet Adapter v3.5 loaded - clearListeners, strokeColor properties, getAt support"
echo ""
