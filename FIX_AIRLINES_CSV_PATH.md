# How to Fix airlines.csv File Not Found Error

## The Problem

The initialization script can't find `airlines.csv` because:
1. The Scala code hasn't been recompiled with the new path-finding logic
2. The Docker container's working directory is different from where the file is located

## The Solution (Choose One Method)

---

## 🚀 Method 1: Quick Fix (Use This Now!)

### Step 1: Copy the file into the container
```bash
# From your host machine
docker cp airlines.csv airline-app:/root/airline/airlines.csv
```

### Step 2: Verify it's there
```bash
docker exec -it airline-app ls -la /root/airline/airlines.csv
```

### Step 3: Restart the initialization
```bash
docker exec -it airline-app bash
cd /root/airline
./init-data.sh
```

**Result:** Should work immediately without recompiling!

---

## 🔧 Method 2: Rebuild with Fixed Code (Permanent Fix)

The code has been updated to search multiple paths, but needs to be recompiled.

### Step 1: Ensure airlines.csv is in project root
```bash
# On your Mac (host machine)
cd /Users/alexa/Documents/GitHub/airline
ls -la airlines.csv  # Should show the file
```

### Step 2: Restart with the new volume mount
I've already added the volume mount to `docker-compose.yaml`. Now restart:
```bash
docker-compose down
docker-compose up -d
```

### Step 3: Wait for services to be ready
```bash
# Wait for database
docker-compose exec airline-app ./wait-for-mysql.sh

# Check if file is accessible
docker exec -it airline-app ls -la /root/airline/airlines.csv
```

### Step 4: Recompile the code
```bash
docker exec -it airline-app bash
cd /root/airline/airline-data
sbt clean compile
```

### Step 5: Run initialization
```bash
cd /root/airline
./init-data.sh
```

**Result:** The code will now search multiple paths and find the file!

---

## 📋 Method 3: Direct Path (If Above Don't Work)

If the file still isn't found, create it in the exact location the container expects:

### Step 1: Find the working directory
```bash
docker exec -it airline-app pwd
# Likely: /root/airline
```

### Step 2: Copy file there
```bash
docker cp airlines.csv airline-app:/root/airline/airlines.csv
```

### Step 3: Also copy to airline-data subdirectory
```bash
docker cp airlines.csv airline-app:/root/airline/airline-data/airlines.csv
```

### Step 4: Verify both locations
```bash
docker exec -it airline-app bash -c "ls -la /root/airline/airlines.csv && ls -la /root/airline/airline-data/airlines.csv"
```

---

## 🎯 Recommended Workflow (Do This Now)

**Quick Solution (5 minutes):**

```bash
# 1. Copy file into container
docker cp /Users/alexa/Documents/GitHub/airline/airlines.csv airline-app:/root/airline/airlines.csv

# 2. Verify it's there
docker exec -it airline-app ls -la /root/airline/airlines.csv

# 3. Run initialization
docker exec -it airline-app bash
cd /root/airline
./init-data.sh
```

**Permanent Solution (do later when convenient):**

```bash
# 1. The docker-compose.yaml has been updated with the volume mount
# 2. Next time you restart, it will automatically mount the file
docker-compose down
docker-compose up -d

# 3. Recompile to get the new path-finding code
docker exec -it airline-app bash
cd /root/airline/airline-data
sbt clean compile
exit
```

---

## 📁 File Locations Reference

### On Your Mac (Host):
```
/Users/alexa/Documents/GitHub/airline/airlines.csv
```

### Inside Docker Container:
After volume mount, should be at:
```
/root/airline/airlines.csv
```

### The Code Will Search These Paths (after recompilation):
1. `airlines.csv` (current directory)
2. `airline-data/airlines.csv` (subdirectory)
3. `../airlines.csv` (parent directory)
4. `../../airlines.csv` (grandparent directory)

---

## ✅ How to Verify It's Working

### Test 1: File Exists
```bash
docker exec -it airline-app ls -la /root/airline/airlines.csv
# Should show: -rw-r--r-- 1 root root [size] [date] airlines.csv
```

### Test 2: File is Readable
```bash
docker exec -it airline-app head -5 /root/airline/airlines.csv
# Should show first 5 lines of the CSV
```

### Test 3: Initialization Finds It
When you run `./init-data.sh`, you should see:
```
[INFO] Loading airline names from: airlines.csv
```

Instead of:
```
[error] java.io.FileNotFoundException: airlines.csv
```

---

## 🔍 Debugging Commands

If you're still having issues:

### Check current working directory:
```bash
docker exec -it airline-app pwd
```

### List all airlines.csv files in container:
```bash
docker exec -it airline-app find /root -name "airlines.csv"
```

### Check what paths are being searched:
```bash
docker exec -it airline-app bash
cd /root/airline/airline-data
sbt "runMain com.patson.init.MainInit" 2>&1 | grep -i "WARNING\|airlines.csv"
```

---

## 🎉 Expected Output After Fix

When initialization runs successfully, you should see:
```
[INFO] Loading airline names from: airlines.csv
Generating US Airlines...
Created airline: American Airlines (US)
Created airline: Delta Air Lines (US)
Created airline: United Airlines (US)
...
```

Instead of:
```
[error] java.io.FileNotFoundException: airlines.csv (No such file or directory)
```

---

## Summary: Do This Right Now

**Fastest fix (30 seconds):**
```bash
docker cp /Users/alexa/Documents/GitHub/airline/airlines.csv airline-app:/root/airline/airlines.csv
docker exec -it airline-app bash
cd /root/airline && ./init-data.sh
```

This will work immediately without any recompilation!

The `docker-compose.yaml` has already been updated for future restarts. ✅
