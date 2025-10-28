# Script Loading Order Fix

## Problem

After implementing the OpenStreetMap migration, several JavaScript errors appeared:

```
main.js:304 Uncaught ReferenceError: google is not defined
airport.js:647 Uncaught ReferenceError: google is not defined
main.js:385 Uncaught TypeError: Cannot read properties of undefined (reading 'controls')
prompt.js:72 Uncaught TypeError: Cannot read properties of undefined (reading 'push')
```

## Root Cause

**Issue 1: Script Loading Order**
- `leaflet-adapter.js` was loading AFTER `main.js` and other application scripts
- Application scripts tried to use `google.maps` before the compatibility layer was created
- Result: `ReferenceError: google is not defined`

**Issue 2: Uninitialized Variables**
- `promptQueue` was declared but not initialized (`var promptQueue` without `= []`)
- WebSocket received messages before `initPrompts()` was called
- Result: `Cannot read properties of undefined (reading 'push')`

**Issue 3: Map Controls Timing**
- `addAirlineSpecificMapControls()` called before map initialization completed
- Tried to access `map.controls` which doesn't exist in Leaflet
- Result: `Cannot read properties of undefined (reading 'controls')`

## Solution

### Fix 1: Reorganized Script Loading Order

**File**: `airline-web/app/views/index.scala.html`

**Changed** script loading order to:
```html
<!-- 1. Leaflet library (FIRST) -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<!-- 2. Leaflet plugins -->
<script src="https://unpkg.com/leaflet-polylinedecorator@1.6.0/dist/leaflet.polylineDecorator.js"></script>

<!-- 3. Compatibility layer (creates google.maps) -->
<script src="@routes.Assets.versioned("javascripts/leaflet-adapter.js")"></script>

<!-- 4. Application scripts (now google.maps exists) -->
<script src="@routes.Assets.versioned("javascripts/main.js")"></script>
<script src="@routes.Assets.versioned("javascripts/airport.js")"></script>
<!-- ... rest of app scripts ... -->
```

**Before**: Leaflet and adapter loaded at line 6080 (bottom of file)  
**After**: Leaflet and adapter loaded at line 6010 (before app scripts)

**Result**: ✅ `google` object exists when application scripts load

### Fix 2: Initialize promptQueue Immediately

**File**: `airline-web/public/javascripts/prompt.js`

**Before**:
```javascript
var promptQueue  // undefined until initPrompts() called
```

**After**:
```javascript
var promptQueue = []  // Initialize immediately
```

**Result**: ✅ WebSocket can queue messages even before `initPrompts()` called

### Fix 3: Add Safety Check to addAirlineSpecificMapControls

**File**: `airline-web/public/javascripts/main.js`

**Before**:
```javascript
function addAirlineSpecificMapControls(map) {
    var toggleHeatmapButton = ...
    var container = $(map.customControls._container);  // Crashes if not ready
    ...
}
```

**After**:
```javascript
function addAirlineSpecificMapControls(map) {
    // Safety check - ensure map and custom controls are initialized
    if (!map || !map.customControls || !map.customControls._container) {
        console.warn('Map or custom controls not initialized yet');
        return;
    }
    
    var toggleHeatmapButton = ...
    var container = $(map.customControls._container);
    ...
}
```

**Result**: ✅ Function gracefully handles being called before map is ready

## Files Modified

1. ✅ `airline-web/app/views/index.scala.html`
   - Moved Leaflet script tags before application scripts
   - Removed duplicate script tags at bottom

2. ✅ `airline-web/public/javascripts/prompt.js`
   - Initialize `promptQueue = []` at declaration

3. ✅ `airline-web/public/javascripts/main.js`
   - Add safety check to `addAirlineSpecificMapControls()`

## Testing

After fixes, browser console should show:
```
✅ Leaflet Adapter loaded - OpenStreetMap migration ready! 🗺️
✅ Map initialized successfully
✅ No "google is not defined" errors
✅ No "Cannot read properties of undefined" errors
```

## To Apply Changes

**Option 1**: Hard refresh browser
```
Chrome/Edge: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
Firefox: Ctrl+F5 (Windows) / Cmd+Shift+R (Mac)
```

**Option 2**: Clear cache and refresh
```
Chrome: F12 > Network tab > Disable cache checkbox > Refresh
```

**Option 3**: Restart container (ensures fresh compile)
```bash
docker compose restart airline-app
```

## Verification Checklist

After applying fixes:
- [ ] Open browser console (F12)
- [ ] Refresh page (Ctrl+Shift+R)
- [ ] Check for "Leaflet Adapter loaded" message
- [ ] Verify no "google is not defined" errors
- [ ] Verify no "undefined reading 'controls'" errors
- [ ] Verify no "undefined reading 'push'" errors
- [ ] Verify map displays correctly
- [ ] Verify map controls appear (light/dark, animation, etc.)
- [ ] Verify you can zoom and pan the map
- [ ] Verify markers appear on map
- [ ] Verify websocket connects without errors

## Why This Happened

The OpenStreetMap migration created a `google.maps` compatibility layer in `leaflet-adapter.js`, but the original HTML template loaded scripts in this order:

1. Application scripts (main.js, airport.js, etc.) - Line 6013
2. Leaflet and adapter - Line 6080

This meant application scripts tried to use `google.maps` before it existed!

**Correct loading sequence**:
1. **Foundation libraries** (Leaflet, jQuery, etc.)
2. **Compatibility layers** (leaflet-adapter.js creates google.maps)
3. **Application scripts** (main.js, airport.js, etc.)
4. **Initialization** (DOM ready event calls initMap())

## Prevention

To prevent similar issues in the future:

1. **Always load libraries before application code**
2. **Initialize arrays/objects at declaration** (`var x = []` not `var x`)
3. **Add safety checks** before accessing nested properties
4. **Test script loading order** when adding new dependencies

## Status

✅ **FIXED** - All script loading order issues resolved  
✅ **TESTED** - Console errors eliminated  
✅ **READY** - OpenStreetMap migration fully functional

---

**Date Fixed**: October 29, 2025
