# OpenStreetMap Migration Guide

## Overview
This guide documents the migration from Google Maps API to OpenStreetMap using Leaflet.js.

## Why This Migration?

### Benefits:
- ✅ **100% Free** - No API keys, no quotas, no billing
- ✅ **No Watermarks** - Clean professional appearance
- ✅ **Open Source** - BSD-2-Clause License
- ✅ **Community-Driven** - Constantly updated by contributors worldwide
- ✅ **No Usage Limits** - Unlimited tile requests (with fair use)
- ✅ **Self-Hostable** - Can host your own tiles if needed

### Trade-offs:
- Different API syntax (but well-documented)
- Need to implement some geometry functions manually
- Different styling approach

## Implementation Plan

### Phase 1: Setup Leaflet.js
1. Replace Google Maps script with Leaflet CDN
2. Add Leaflet CSS
3. Initialize base map

### Phase 2: Core Migration
1. Convert map initialization
2. Migrate marker creation
3. Convert polylines/flight paths
4. Implement info windows (popups)
5. Add custom controls

### Phase 3: Advanced Features
1. Animated plane markers
2. Route visualization
3. Alliance maps
4. Campaign maps
5. Heatmaps

### Phase 4: Geometry Functions
1. Spherical distance calculations
2. Route interpolation for animations
3. Custom projections if needed

## API Comparison

### Map Initialization

**Before (Google Maps):**
```javascript
map = new google.maps.Map(document.getElementById('map'), {
  center: {lat: 20, lng: 150.644},
  zoom: 2,
  minZoom: 2,
  styles: getMapStyles(),
  mapTypeId: 'roadmap'
});
```

**After (Leaflet + OSM):**
```javascript
map = L.map('map', {
  center: [20, 150.644],  // Note: [lat, lng] not {lat, lng}
  zoom: 2,
  minZoom: 2,
  maxBounds: [[-85, -180], [85, 180]],
  worldCopyJump: true
});

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19
}).addTo(map);
```

### Markers

**Before (Google Maps):**
```javascript
var marker = new google.maps.Marker({
  position: {lat: airport.latitude, lng: airport.longitude},
  map: map,
  title: airport.name,
  icon: iconUrl
});
```

**After (Leaflet):**
```javascript
var marker = L.marker([airport.latitude, airport.longitude], {
  title: airport.name,
  icon: L.icon({
    iconUrl: iconUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  })
}).addTo(map);
```

### Polylines (Flight Routes)

**Before (Google Maps):**
```javascript
var flightPath = new google.maps.Polyline({
  path: [{lat: from.lat, lng: from.lng}, {lat: to.lat, lng: to.lng}],
  geodesic: true,
  strokeColor: '#FF0000',
  strokeOpacity: 0.8,
  strokeWeight: 2
});
flightPath.setMap(map);
```

**After (Leaflet):**
```javascript
var flightPath = L.polyline([
  [from.lat, from.lng],
  [to.lat, to.lng]
], {
  color: '#FF0000',
  weight: 2,
  opacity: 0.8
}).addTo(map);
```

### Info Windows (Popups)

**Before (Google Maps):**
```javascript
var infowindow = new google.maps.InfoWindow({
  content: contentString
});
marker.addListener('click', function() {
  infowindow.open(map, marker);
});
```

**After (Leaflet):**
```javascript
marker.bindPopup(contentString);
// Automatically opens on click
```

### Event Listeners

**Before (Google Maps):**
```javascript
google.maps.event.addListener(map, 'zoom_changed', function() {
  var zoom = map.getZoom();
  // Handle zoom change
});
```

**After (Leaflet):**
```javascript
map.on('zoomend', function() {
  var zoom = map.getZoom();
  // Handle zoom change
});
```

## Geometry Functions

For animated plane movement along routes, we need to implement spherical interpolation:

```javascript
// Haversine distance
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

// Interpolate between two points (for animation)
function interpolate(start, end, fraction) {
  const lat1 = start.lat * Math.PI / 180;
  const lon1 = start.lng * Math.PI / 180;
  const lat2 = end.lat * Math.PI / 180;
  const lon2 = end.lng * Math.PI / 180;

  const d = 2 * Math.asin(Math.sqrt(
    Math.pow(Math.sin((lat1 - lat2) / 2), 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon1 - lon2) / 2), 2)
  ));

  const A = Math.sin((1 - fraction) * d) / Math.sin(d);
  const B = Math.sin(fraction * d) / Math.sin(d);

  const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
  const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
  const z = A * Math.sin(lat1) + B * Math.sin(lat2);

  const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
  const lon = Math.atan2(y, x);

  return {
    lat: lat * 180 / Math.PI,
    lng: lon * 180 / Math.PI
  };
}
```

## Alternative Tile Providers

While OpenStreetMap is free, you can use alternative styles:

### 1. **OpenStreetMap Standard** (Default)
```javascript
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
```

### 2. **CartoDB Positron** (Light theme)
```javascript
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
}).addTo(map);
```

### 3. **CartoDB Dark Matter** (Dark theme)
```javascript
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
}).addTo(map);
```

### 4. **Stamen Terrain** (Topographic)
```javascript
L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png', {
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
```

## Custom Map Controls

Leaflet makes it easy to add custom controls:

```javascript
// Create custom control
L.Control.CustomButton = L.Control.extend({
  onAdd: function(map) {
    var btn = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    btn.innerHTML = '<a href="#" title="Custom Action"><img src="icon.png"/></a>';
    btn.onclick = function() {
      // Handle click
      return false;
    };
    return btn;
  }
});

// Add to map
new L.Control.CustomButton({ position: 'bottomright' }).addTo(map);
```

## Useful Leaflet Plugins

For advanced features similar to Google Maps:

1. **Leaflet.markercluster** - Cluster markers for better performance
2. **Leaflet.AnimatedMarker** - Animate markers along polylines
3. **Leaflet.polylineDecorator** - Add arrows to polylines
4. **Leaflet.heat** - Heatmap layer
5. **Leaflet.fullscreen** - Fullscreen control
6. **Leaflet-providers** - Easy access to multiple tile providers

## File Changes Required

### Core Files to Modify:
1. ✅ `airline-web/app/views/index.scala.html` - Replace Google Maps script
2. ✅ `airline-web/public/javascripts/main.js` - Core map initialization
3. ✅ `airline-web/public/javascripts/airport.js` - Airport markers
4. ✅ `airline-web/public/javascripts/link-history.js` - Route visualization
5. ✅ `airline-web/public/javascripts/alliance.js` - Alliance maps
6. ✅ `airline-web/public/javascripts/campaign.js` - Campaign maps
7. ✅ `airline-web/public/javascripts/rivals.js` - Rival routes
8. ✅ `airline-web/public/javascripts/christmas.js` - Seasonal markers
9. ✅ `airline-web/public/stylesheets/*.css` - Update map control styles

### Configuration:
- ❌ Remove `google.mapKey` from `airline-web/conf/application.conf`
- ❌ Remove Google Places API usage (if used for airport images)

## Migration Timeline

1. **Week 1**: Setup and core map functionality
2. **Week 2**: Markers and basic interactions
3. **Week 3**: Polylines and route visualization
4. **Week 4**: Animations and advanced features
5. **Week 5**: Testing and optimization

## Testing Checklist

- [ ] Map loads correctly
- [ ] Airports appear as markers
- [ ] Routes render properly
- [ ] Info windows/popups work
- [ ] Animated planes move along routes
- [ ] Custom controls function
- [ ] Zoom levels work correctly
- [ ] Performance is acceptable
- [ ] Mobile view works
- [ ] Dark/light themes toggle
- [ ] Alliance maps work
- [ ] Campaign maps work
- [ ] Christmas/seasonal markers

## Performance Considerations

1. **Marker Clustering**: Use for 1000+ airports
2. **Lazy Loading**: Only load visible routes
3. **Tile Caching**: Browser automatically caches tiles
4. **Layer Management**: Hide/show layers instead of recreating
5. **Throttle Events**: Debounce zoom/pan events

## Support and Resources

- **Leaflet Documentation**: https://leafletjs.com/reference.html
- **Leaflet Tutorials**: https://leafletjs.com/examples.html
- **OpenStreetMap**: https://www.openstreetmap.org/
- **Leaflet Plugins**: https://leafletjs.com/plugins.html
- **Community**: https://gis.stackexchange.com/

## Next Steps

Would you like me to:
1. ✅ Start implementing the migration in main.js
2. ✅ Create a leaflet-adapter.js wrapper for easy migration
3. ✅ Update the HTML to include Leaflet
4. ✅ Test with a single map first (campaign or airport detail)

---

**Status**: Ready to implement
**Priority**: High
**Estimated Effort**: 2-3 weeks for full migration
