# 🚀 Getting Started with OpenStreetMap Migration

## Step-by-Step Implementation Guide

This guide will walk you through implementing the OpenStreetMap migration one step at a time.

---

## ✅ Prerequisites (Already Done!)

You already have:
- ✅ Leaflet libraries loaded in HTML
- ✅ Custom adapter (`leaflet-adapter.js`)
- ✅ Migration helpers (`leaflet-migration-helpers.js`)
- ✅ Custom CSS (`leaflet-custom.css`)

---

## 🎯 Step 1: Test Basic Map (5 minutes)

Let's verify Leaflet is loading correctly.

### 1.1 Restart the Application
```bash
cd /Users/alexa/Documents/GitHub/airline
docker-compose restart airline-app
```

### 1.2 Check Browser Console
1. Open http://localhost:9000
2. Press `F12` to open DevTools
3. Go to Console tab
4. Look for: `"Leaflet Adapter loaded - OpenStreetMap migration ready! 🗺️"`

**Expected:** You should see the message above with no errors.
**If errors:** Check that Leaflet CSS/JS loaded correctly.

---

## 🎯 Step 2: Update initMap() Function (15 minutes)

Now let's replace the Google Maps initialization with Leaflet.

### 2.1 Open main.js
```bash
# Open in your editor
code airline-web/public/javascripts/main.js
```

### 2.2 Find the initMap() function
Around line 303, you'll see:
```javascript
function initMap() {
    initStyles()
    map = new google.maps.Map(document.getElementById('map'), {
        // ... Google Maps config
    });
```

### 2.3 Replace with Leaflet Version
Copy this code from `leaflet-migration-helpers.js` (lines 10-46):

```javascript
function initMap() {
    initStyles();
    
    // Create map using Leaflet
    map = L.enhancedMap('map', {
        center: {lat: 20, lng: 150.644},
        zoom: 2,
        minZoom: 2,
        gestureHandling: 'greedy',
        restriction: {
            latLngBounds: { north: 85, south: -85, west: -180, east: 180 }
        },
        tileLayer: {
            url: getMapTileUrl(),
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
    });
    
    // Load saved map type preference
    const savedMapType = $.cookie('currentMapTypes');
    if (savedMapType) {
        map.setMapTypeId(savedMapType);
    }
    
    // Zoom changed event
    map.on('zoomend', function() {
        var zoom = map.getZoom();
        // iterate over markers and call setVisible
        $.each(markers, function(key, marker) {
            if (marker.setVisible) {
                marker.setVisible(isShowMarker(marker, zoom));
            }
        });
    });
    
    // Map type changed event
    map.on('maptypeid_changed', function(e) {
        var mapType = e.mapType || map.getMapTypeId();
        $.cookie('currentMapTypes', mapType);
    });

    addCustomMapControls(map);
}
```

### 2.4 Add getMapTileUrl() Function
Add this function right after initMap():

```javascript
function getMapTileUrl() {
    const mapStyle = $.cookie('mapLightMode');
    
    if (mapStyle === 'dark') {
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    } else if (mapStyle === 'light') {
        return 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    }
    
    // Default standard OSM
    return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
}
```

### 2.5 Update addCustomMapControls() Function
Around line 330, update the function to use Leaflet controls:

```javascript
function addCustomMapControls(map) {
    // ... keep your existing button creation code ...
    
    // Determine control position based on map height
    const position = $("#map").height() > 500 ? 'RIGHT_BOTTOM' : 'LEFT_BOTTOM';
    
    // Add controls (replace google.maps.ControlPosition with our position)
    map.controls[position].push(toggleAllianceBaseMapViewButton[0]);
    map.controls[position].push(toggleMapLightButton[0]);
    map.controls[position].push(toggleMapAnimationButton[0]);
    map.controls[position].push(toggleChampionButton[0]);

    if (christmasFlag) {
        map.controls[position].push(toggleMapChristmasButton[0]);
        toggleMapChristmasButton.show();
    }
}
```

### 2.6 Save and Test
```bash
# Restart the app
docker-compose restart airline-app

# Check logs
docker-compose logs -f airline-app
```

Open http://localhost:9000 - **you should now see an OpenStreetMap!** 🎉

---

## 🎯 Step 3: Fix Markers (30 minutes)

Now let's update how airports appear on the map.

### 3.1 Find Marker Creation
Search for `new google.maps.Marker` in your codebase:
```bash
grep -r "new google.maps.Marker" airline-web/public/javascripts/
```

### 3.2 Update airport.js (Example)
Find marker creation (around line 669):

**Before:**
```javascript
var marker = new google.maps.Marker({
    position: {lat: airport.latitude, lng: airport.longitude},
    map: map,
    title: airport.name,
    icon: iconUrl
});
```

**After:**
```javascript
var marker = L.enhancedMarker([airport.latitude, airport.longitude], {
    title: airport.name,
    icon: L.icon({
        iconUrl: iconUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    })
}).addTo(map);
```

### 3.3 Test Markers
Restart and check if airport markers appear on the map.

---

## 🎯 Step 4: Fix Flight Routes (30 minutes)

Update polyline creation for flight paths.

### 4.1 Find Polyline Creation
Search for `new google.maps.Polyline`:
```bash
grep -r "new google.maps.Polyline" airline-web/public/javascripts/
```

### 4.2 Update link-history.js (Example)
Around line 185:

**Before:**
```javascript
var linkPath = new google.maps.Polyline({
    path: [from, to],
    strokeColor: color,
    strokeOpacity: 0.8,
    strokeWeight: 2
});
linkPath.setMap(map);
```

**After:**
```javascript
var linkPath = L.enhancedPolyline([
    [from.lat, from.lng],
    [to.lat, to.lng]
], {
    color: color,
    opacity: 0.8,
    weight: 2
}).addTo(map);
```

### 4.3 Add Route Arrows
After creating the polyline, add arrows:
```javascript
// Add arrow decorator
if (typeof addArrowDecorator !== 'undefined') {
    var decorator = addArrowDecorator(linkPath, color);
    if (decorator) {
        decorator.addTo(map);
    }
}
```

---

## 🎯 Step 5: Fix Info Windows (20 minutes)

Replace Google Maps InfoWindows with Leaflet popups.

### 5.1 Find InfoWindow Usage
```bash
grep -r "google.maps.InfoWindow" airline-web/public/javascripts/
```

### 5.2 Update Pattern

**Before:**
```javascript
var infowindow = new google.maps.InfoWindow({
    content: htmlContent
});
marker.addListener('click', function() {
    infowindow.open(map, marker);
});
```

**After:**
```javascript
marker.bindPopup(htmlContent);
// Popup opens automatically on click!
```

---

## 🎯 Step 6: Fix Geometry Functions (20 minutes)

Replace Google's geometry library with our helpers.

### 6.1 Find Geometry Usage
```bash
grep -r "google.maps.geometry.spherical" airline-web/public/javascripts/
```

### 6.2 Update Interpolation
**Before:**
```javascript
var newPos = google.maps.geometry.spherical.interpolate(from, to, fraction);
```

**After:**
```javascript
var newPos = LeafletGeometry.interpolate(from, to, fraction);
```

### 6.3 Update Distance Calculation
**Before:**
```javascript
var distance = google.maps.geometry.spherical.computeDistanceBetween(point1, point2);
```

**After:**
```javascript
var distance = LeafletGeometry.computeDistanceBetween(
    {lat: point1.lat(), lng: point1.lng()},
    {lat: point2.lat(), lng: point2.lng()}
);
```

---

## 🎯 Step 7: Update CSS Classes (10 minutes)

Replace Google Maps CSS classes.

### 7.1 Find and Replace
```bash
# In each CSS file, replace:
# .googleMapIcon → .leaflet-map-icon
```

Files to update:
- `airline-web/public/stylesheets/main.css`
- `airline-web/public/stylesheets/modern.css`
- `airline-web/public/stylesheets/mobile.css`

### 7.2 Remove Unused Classes
Remove or comment out:
- `.gm-fullscreen-control`
- `.gmnoprint`
- `.gm-svpc`
- `.gm-control-active`

---

## 🎯 Step 8: Testing (20 minutes)

### 8.1 Functionality Tests
- [ ] Map loads and displays correctly
- [ ] Can zoom in/out
- [ ] Can pan/drag the map
- [ ] Airport markers appear
- [ ] Clicking marker shows info
- [ ] Flight routes display
- [ ] Custom controls work
- [ ] Light/dark toggle works

### 8.2 Browser Tests
Test in:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browser

### 8.3 Check Console
Look for any JavaScript errors in browser console.

---

## 🎯 Step 9: Clean Up (10 minutes)

### 9.1 Remove Google Maps Config
Edit `airline-web/conf/application.conf`:
```conf
# Comment out or remove:
# google.mapKey="YOUR_OLD_KEY"
```

### 9.2 Update README
Edit `README.md`:
- Remove Google Maps API key instructions
- Add note about OpenStreetMap
- Update setup instructions

---

## 🎯 Step 10: Deploy (30 minutes)

### 10.1 Final Testing
```bash
# Full restart
docker-compose down
docker-compose up -d

# Watch logs
docker-compose logs -f airline-app
```

### 10.2 Monitor
- Check for errors in logs
- Test main features
- Get user feedback

### 10.3 Celebrate! 🎉
You've successfully migrated to OpenStreetMap!

---

## 📋 Progress Tracking

Use this checklist as you work:

- [ ] Step 1: Verified Leaflet loads ✅
- [ ] Step 2: Updated initMap() function
- [ ] Step 3: Fixed markers
- [ ] Step 4: Fixed flight routes
- [ ] Step 5: Fixed info windows
- [ ] Step 6: Fixed geometry functions
- [ ] Step 7: Updated CSS classes
- [ ] Step 8: Completed testing
- [ ] Step 9: Cleaned up config
- [ ] Step 10: Deployed successfully

---

## 🆘 Troubleshooting

### Problem: Map doesn't show
**Solution:** Check browser console. Ensure Leaflet CSS loaded.

### Problem: Markers don't appear
**Solution:** Check coordinate format. Use `[lat, lng]` not `{lat, lng}`.

### Problem: Routes are straight lines
**Solution:** This is normal for Leaflet. Use geodesic plugin if curved lines needed.

### Problem: Controls not visible
**Solution:** Check CSS is loaded. Verify z-index values.

### Problem: Popups don't work
**Solution:** Ensure `.bindPopup()` is called after marker is created.

---

## 📞 Get Help

If stuck:
1. Check `OSM_QUICK_REFERENCE.md` for conversion examples
2. Review `OSM_MIGRATION_CHECKLIST.md` for detailed steps
3. Search Leaflet docs: https://leafletjs.com/reference.html
4. Check browser console for specific errors

---

## 🎓 Next Steps After Basic Migration

Once the basic migration works:

1. **Add Marker Clustering** - For better performance with many airports
2. **Add Fullscreen Control** - Let users expand map
3. **Add Layer Switcher** - Let users choose map styles
4. **Optimize Performance** - Lazy load routes, debounce events
5. **Add Advanced Features** - Heatmaps, custom overlays, etc.

---

## ✨ Success Checklist

You're done when:
- ✅ Map loads with OpenStreetMap tiles
- ✅ Airports show as markers
- ✅ Flight routes display correctly
- ✅ Clicking markers shows info
- ✅ Map controls work
- ✅ No Google Maps API errors
- ✅ No console errors
- ✅ Performance is good

---

**Estimated Total Time:** 2-3 hours for basic migration

**Good luck!** 🚀🗺️

Need help? Refer to:
- `OSM_QUICK_REFERENCE.md` - Quick conversions
- `OSM_MIGRATION_CHECKLIST.md` - Detailed checklist
- `OPENSTREETMAP_MIGRATION.md` - Complete guide
