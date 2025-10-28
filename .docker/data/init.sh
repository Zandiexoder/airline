#!/bin/sh
echo "===== FIXING PERMISSIONS ====="
# Ensure target directories are writable
sudo chown -R airline:airline /home/airline/airline/airline-data/target 2>/dev/null || true
sudo chown -R airline:airline /home/airline/airline/airline-web/target 2>/dev/null || true
chmod -R 755 /home/airline/airline/airline-data/target 2>/dev/null || true
chmod -R 755 /home/airline/airline/airline-web/target 2>/dev/null || true

echo "===== INITIALIZING (if this fails, run again until it works) ====="
cd /home/airline/airline/airline-data
echo "Cleaning cached builds..."
sbt clean
echo "Publishing locally..."
sbt publishLocal
echo "===== STARTING MIGRATION ====="
for i in `seq 1 5`
do
  DB_HOST="${DB_HOST}" DB_NAME="${DB_NAME}" DB_USER="${DB_USER}" DB_PASSWORD="${DB_PASSWORD}" sbt "runMain com.patson.init.MainInit"
  if [ $? -eq 0 ]; then
    echo "Command succeeded on attempt $i"
    break
  else
    echo "Command failed on attempt $i, retrying in 5 seconds..."
    sleep 5
  fi
done
echo "===== DONE ====="
