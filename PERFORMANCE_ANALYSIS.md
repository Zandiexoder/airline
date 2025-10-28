# Performance Analysis: start-all.sh

## Current Bottlenecks 🐌

### 1. **`sbt clean` in init-data.sh** (MAJOR BOTTLENECK)
- **Time:** 30-60 seconds
- **Impact:** Deletes all compiled code, forcing full recompilation
- **Needed?** ❌ NO - only needed if dependencies change

### 2. **`sbt publishLocal` in init-data.sh** (MAJOR BOTTLENECK)
- **Time:** 60-120 seconds  
- **Impact:** Recompiles and publishes entire project
- **Needed?** ⚠️ Only on first run or code changes

### 3. **MainInit retries (up to 5 times)** (MODERATE BOTTLENECK)
- **Time:** 100-500 seconds (104s per attempt × up to 5 retries)
- **Impact:** Re-runs entire database initialization
- **Needed?** ⚠️ Only if database is empty

### 4. **30-second wait after backend starts** (MINOR BOTTLENECK)
- **Time:** 30 seconds
- **Impact:** Fixed delay regardless of backend readiness
- **Needed?** ⚠️ Could be replaced with actual health check

---

## Optimized Approach 🚀

### Strategy: Skip Unnecessary Steps

1. ✅ **Check if DB is initialized** - Skip MainInit if data exists
2. ✅ **Skip `sbt clean`** - Only clean when needed
3. ✅ **Skip `publishLocal`** - Only compile when needed
4. ✅ **Smart health checks** - Replace fixed delays
5. ✅ **Incremental compilation** - Use SBT's incremental compiler

---

## Time Savings Estimate

| Current | Optimized | Savings |
|---------|-----------|---------|
| **First Run:** 4-6 min | 3-5 min | 1-2 min |
| **Subsequent Runs:** 3-4 min | 30-60 sec | 2.5-3 min ⚡ |

**For subsequent runs (DB already initialized), we can reduce from ~4 minutes to ~1 minute!**

---

## Recommendations by Priority

### 🔴 HIGH PRIORITY - Implement Now

#### 1. Skip MainInit if DB has data
```bash
# Check if database already has data
DB_CHECK=$(docker exec airline-db mysql -u $DB_USER -p$DB_PASSWORD -D $DB_NAME -se "SELECT COUNT(*) FROM airport LIMIT 1" 2>/dev/null || echo "0")

if [ "$DB_CHECK" -gt "0" ]; then
  echo "✓ Database already has data ($DB_CHECK airports), skipping initialization"
else
  echo "Database empty, running initialization..."
  # Run MainInit
fi
```
**Savings:** 100-500 seconds on subsequent runs

#### 2. Remove `sbt clean` from routine startups
```bash
# Only clean if explicitly requested or on first run
if [ "$FORCE_CLEAN" = "true" ] || [ ! -d "target" ]; then
  sbt clean
fi
```
**Savings:** 30-60 seconds

#### 3. Use compiled JARs instead of `sbt runMain`
```bash
# Compile once to JAR, then run JAR directly
# Much faster than running through SBT each time
sbt assembly  # Only when code changes
java -jar target/scala-*/airline-assembly.jar
```
**Savings:** 20-40 seconds per run

---

### 🟡 MEDIUM PRIORITY - Implement Soon

#### 4. Smart backend health check
```bash
# Instead of: sleep 30
# Use actual health check:
timeout=60
while [ $timeout -gt 0 ]; do
  if curl -f http://localhost:9000/health 2>/dev/null; then
    echo "Backend ready!"
    break
  fi
  sleep 2
  timeout=$((timeout-2))
done
```
**Savings:** 10-30 seconds

#### 5. Parallel compilation for web and data
```bash
# Start both compilations at same time
(cd airline-data && sbt compile) &
(cd airline-web && sbt compile) &
wait
```
**Savings:** 30-60 seconds

---

### 🟢 LOW PRIORITY - Nice to Have

#### 6. Pre-compiled Docker images
- Build images with pre-compiled code
- Only recompile on code changes
**Savings:** 1-2 minutes

#### 7. SBT server mode
- Keep SBT running in background
- Avoid JVM startup overhead
**Savings:** 5-15 seconds per command

---

## Implementation

I'll create an optimized version of the scripts.
