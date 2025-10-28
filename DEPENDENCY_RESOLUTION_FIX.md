# Airline-Data Dependency Resolution Fix

## Problem Summary

**Error**: `airline-web` build fails with:
```
Error downloading default:airline-data_2.13:2.1
Not found: /home/airline/.ivy2/local/default/airline-data_2.13/2.1/ivys/ivy.xml
```

## Root Cause

The `airline-web` project depends on `airline-data` as a library dependency:
- `airline-data` version: `2.1` (defined in `airline-data/build.sbt`)
- `airline-web` expects to find: `airline-data_2.13:2.1`

**The Problem**: `airline-data` must be **published to the local Ivy repository** BEFORE `airline-web` tries to compile. If `airline-data` hasn't been published, the dependency resolution fails.

## How SBT Dependency Resolution Works

1. **Local Project Build**: When you build `airline-data`, it compiles to `target/scala-2.13/`
2. **publishLocal**: This command publishes the artifact to `~/.ivy2/local/`
3. **Dependency Resolution**: When `airline-web` builds, it looks for `airline-data_2.13:2.1` in:
   - Local Ivy cache: `~/.ivy2/local/default/airline-data_2.13/2.1/`
   - Maven Central
   - Other configured repositories

Since `airline-data` is not published to Maven Central, it **MUST** be in the local Ivy cache.

## The Fix Applied

### Updated `init-fast.sh`

Changed the publishLocal check to look in the correct location:

**Before** (WRONG):
```bash
# Checked wrong location and wrong version
if [ ! -f "target/scala-2.13/airline-data_2.13-0.1-SNAPSHOT.jar" ]; then
  sbt publishLocal
fi
```

**After** (CORRECT):
```bash
# Check the Ivy repository where airline-web will look
IVY_PATH="/home/airline/.ivy2/local/default/airline-data_2.13/2.1/jars/airline-data_2.13-2.1.jar"

if [ "$FORCE_PUBLISH" = "true" ] || [ ! -f "$IVY_PATH" ]; then
  echo "Publishing airline-data to local Ivy repository..."
  sbt publishLocal
  
  if [ ! -f "$IVY_PATH" ]; then
    echo "✗ WARNING: publishLocal completed but JAR not found at $IVY_PATH"
  else
    echo "✓ airline-data published successfully"
  fi
else
  echo "✓ Skipping publishLocal (already in Ivy cache)"
fi
```

## Build Order Requirements

The correct build order is:

1. **First**: `cd airline-data && sbt publishLocal`
   - Compiles `airline-data`
   - Publishes to `~/.ivy2/local/default/airline-data_2.13/2.1/`
   
2. **Second**: `cd airline-web && sbt compile`
   - Resolves dependency on `airline-data_2.13:2.1`
   - Finds it in local Ivy cache
   - Compiles successfully

## Why the Error Occurred

When using `start-all-fast.sh` with optimization:
1. Script checked if JAR existed in `target/` (wrong location)
2. Assumed `publishLocal` wasn't needed
3. Skipped `publishLocal` to save time
4. `airline-web` tried to build but couldn't find `airline-data_2.13:2.1`
5. Build failed with "Not found" error

## How to Verify the Fix

Check if `airline-data` is published:

```bash
docker-compose exec airline-app ls -lh /home/airline/.ivy2/local/default/airline-data_2.13/2.1/jars/
```

Expected output:
```
airline-data_2.13-2.1.jar
airline-data_2.13-2.1-sources.jar
airline-data_2.13-2.1-javadoc.jar
```

## Manual Recovery Steps

If you encounter this error:

### Option 1: Force Publish
```bash
docker-compose exec airline-app bash
cd /home/airline/airline/airline-data
sbt publishLocal
```

### Option 2: Use Environment Variable
```bash
docker-compose exec airline-app bash -c "FORCE_PUBLISH=true /home/airline/start-all-fast.sh"
```

### Option 3: Clear Cache and Rebuild
```bash
docker-compose exec airline-app bash
rm -rf /home/airline/.ivy2/local/default/airline-data_2.13
cd /home/airline/airline/airline-data
sbt clean publishLocal
```

## Performance Impact

**With the fix**:
- First run: `publishLocal` runs (~60-120 seconds)
- Subsequent runs: Checks Ivy cache, skips if present (instant)
- `airline-web` builds successfully because dependency is available

**Optimization savings**:
- ✅ Still skips unnecessary `sbt clean` (saves 30-60s)
- ✅ Skips `publishLocal` if already in Ivy cache (saves 60-120s)
- ✅ Skips MainInit if DB has data (saves 100-500s)
- **Total possible savings: 190-680 seconds (3-11 minutes)**

## Technical Details

### Ivy Repository Structure
```
~/.ivy2/local/
  default/
    airline-data_2.13/
      2.1/
        ivys/
          ivy.xml                    # Dependency metadata
        jars/
          airline-data_2.13-2.1.jar  # Compiled artifact
        srcs/
          airline-data_2.13-2.1-sources.jar
        docs/
          airline-data_2.13-2.1-javadoc.jar
```

### Version Matching
- Project version in `build.sbt`: `version := "2.1"`
- Scala version: `2.13` (from `scalaVersion := "2.13.11"`)
- Artifact name: `airline-data_2.13-2.1.jar`
- Organization: `default` (no custom organization set)

### Dependency Declaration
In `airline-web/build.sbt`, there should be:
```scala
libraryDependencies += "default" %% "airline-data" % "2.1"
```

This resolves to: `default:airline-data_2.13:2.1`

## Prevention

**Always ensure**:
1. `airline-data` is published before building `airline-web`
2. Version numbers match between projects
3. Ivy cache is not corrupted (test with `ls ~/.ivy2/local/`)
4. Optimization scripts check the Ivy cache, not project `target/`

## Related Files

- `/home/airline/airline/airline-data/build.sbt` - Defines version "2.1"
- `/home/airline/airline/airline-web/build.sbt` - Declares dependency
- `~/.ivy2/local/default/airline-data_2.13/2.1/` - Published artifacts
- `.docker/data/init-fast.sh` - Fixed to check Ivy cache
- `.docker/data/init.sh` - Always runs publishLocal (safe)

## Status

✅ **FIXED** in commit updating `init-fast.sh` to check Ivy repository path instead of project target directory.
