#!/bin/sh
echo "===== FIXING PERMISSIONS ====="
# Ensure target directories are writable
sudo chown -R airline:airline /home/airline/airline/airline-data/target 2>/dev/null || true
sudo chown -R airline:airline /home/airline/airline/airline-web/target 2>/dev/null || true
chmod -R 755 /home/airline/airline/airline-data/target 2>/dev/null || true
chmod -R 755 /home/airline/airline/airline-web/target 2>/dev/null || true

echo "===== INITIALIZING (if this fails, run again until it works) ====="
cd /home/airline/airline/airline-data
sbt publishLocal
echo "===== STARTING MIGRATION ====="
for i in `seq 1 5`
do
  sbt "runMain com.patson.init.MainInit"
  if [ $? -eq 0 ]; then
    echo "Command succeeded on attempt $i"
    break
  else
    echo "Command failed on attempt $i, retrying in 5 seconds..."
    sleep 5
  fi
done
echo "===== DONE ====="
