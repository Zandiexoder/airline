# Database Initialization Issues - Fixed

## Issues Found

### 1. Duplicate Link Entries
**Problem:** When running the initialization, the system tried to create flight routes (links) that already existed in the database, causing "Duplicate entry" errors.

**Error Example:**
```
Error saving link between ELM and ITH: Duplicate entry '1857-1598-0' for key 'link.link_index_1'
```

**Root Cause:** The GenericTransitGenerator was attempting to create links without checking if they already exist.

**Fix Applied:**
- Updated `GenericTransitGenerator.scala` to check for existing links before attempting to save
- Suppressed duplicate entry error messages (these are harmless)
- Links are now only created if they don't already exist

### 2. Missing airlines.csv File
**Problem:** The bot airline generator couldn't find `airlines.csv` which contains country-specific airline names.

**Error:**
```
[error] java.io.FileNotFoundException: airlines.csv (No such file or directory)
```

**Root Cause:** The Scala code was looking for `airlines.csv` in the current working directory, but the file is located in the project root.

**Fix Applied:**
- Updated `AirlineGenerator.scala` to search multiple possible paths for the CSV file
- Added fallback behavior: if CSV not found, uses generic airline names
- Added informative logging to show which path was used

**Possible Paths Checked (in order):**
1. `airlines.csv` (current directory)
2. `airline-data/airlines.csv`
3. `../airlines.csv` (parent directory)
4. `../../airlines.csv` (grandparent directory)

---

## Files Modified

### 1. `airline-data/src/main/scala/com/patson/init/AirlineGenerator.scala`
**Changes:**
- Added multi-path CSV file search
- Added fallback to empty map if file not found
- Added logging to show which path was used
- Returns empty map instead of crashing if file missing

**Impact:** Bot airlines will now load country-specific names from CSV, or use generic names if CSV is missing.

### 2. `airline-data/src/main/scala/com/patson/init/GenericTransitGenerator.scala`
**Changes:**
- Added check for existing links before creating new ones
- Suppressed duplicate entry error messages
- Only logs actual errors (not duplicate key errors)

**Impact:** Initialization can now run multiple times without errors from duplicate links.

### 3. `fix-airlines-csv.sh` (New File)
**Purpose:** Helper script to ensure airlines.csv is in the correct location for Docker container.

**What it does:**
- Checks if airlines.csv exists in expected locations
- Creates symlinks in common locations
- Provides user feedback

**Usage:**
```bash
chmod +x fix-airlines-csv.sh
./fix-airlines-csv.sh
```

---

## How to Verify Fixes

### Test 1: Check CSV Loading
Run the app and look for this log message:
```
[INFO] Loading airline names from: <path>
```

If you see:
```
[WARNING] airlines.csv not found in any expected location
```
Then the CSV file needs to be copied to one of the expected locations.

### Test 2: Check Link Creation
When running initialization, you should no longer see errors like:
```
Error saving link between XXX and YYY: Duplicate entry...
```

The links will simply be skipped silently if they already exist.

---

## Manual Fixes (if needed)

### If CSV Still Not Found

**Option 1: Copy to Root**
```bash
cp airlines.csv /root/airlines.csv
```

**Option 2: Copy to airline-data**
```bash
cp airlines.csv airline-data/airlines.csv
```

**Option 3: Create Symlink**
```bash
ln -s /path/to/airlines.csv /root/airline/airlines.csv
```

### If Duplicate Links Persist

**Option 1: Clean Existing Links**
```sql
-- Connect to MySQL
docker exec -it airline-db mysql -u root -p

-- Use the airline database
USE airline;

-- Check existing generic transit links
SELECT COUNT(*) FROM link WHERE transport_type = 0;

-- (Optional) Delete all generic transit links to start fresh
DELETE FROM link WHERE transport_type = 0;
```

**Option 2: Ignore the Errors**
The duplicate entry errors are harmless - they're caught and the initialization continues. The existing links are preserved.

---

## Prevention

To prevent these issues in the future:

1. **Always include airlines.csv in Docker volume mounts**
   - Ensure airlines.csv is in the project root
   - Or update docker-compose.yaml to mount it explicitly

2. **Don't re-run initialization unless necessary**
   - Generic transit links are persistent
   - Only run initialization for fresh databases

3. **Use database migrations**
   - Track schema changes with version control
   - Use proper migration scripts for updates

---

## Testing Checklist

After applying fixes:
- [ ] airlines.csv is accessible from the working directory
- [ ] Bot airlines are created with country-specific names
- [ ] No FileNotFoundException errors in logs
- [ ] Generic transit links are created successfully
- [ ] No duplicate entry errors (or they're silently skipped)
- [ ] Application starts normally
- [ ] Existing data is preserved

---

## Status

**Fixed:** ✅
- Airlines.csv path resolution
- Duplicate link error handling
- Graceful fallback for missing CSV

**Testing Required:**
- Verify CSV loads correctly in Docker
- Confirm bot airlines have proper names
- Check that link creation works on fresh DB

---

**Date:** October 28, 2025  
**Status:** Ready for testing
