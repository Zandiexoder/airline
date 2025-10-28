# 🗺️ Google Maps → Leaflet Quick Reference

## Common Conversions Cheat Sheet

### Map Initialization
```javascript
// GOOGLE MAPS
map = new google.maps.Map(element, {
  center: {lat: 20, lng: 150},
  zoom: 2,
  minZoom: 2
});

// LEAFLET
map = L.enhancedMap('map', {
  center: {lat: 20, lng: 150},
  zoom: 2,
  minZoom: 2
});
```

### Markers
```javascript
// GOOGLE MAPS
marker = new google.maps.Marker({
  position: {lat: 40.7, lng: -74.0},
  map: map,
  title: "NYC",
  icon: 'icon.png'
});

// LEAFLET
marker = L.enhancedMarker([40.7, -74.0], {
  title: "NYC",
  icon: L.icon({
    iconUrl: 'icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  })
}).addTo(map);
```

### Polylines
```javascript
// GOOGLE MAPS
polyline = new google.maps.Polyline({
  path: [{lat: 40, lng: -74}, {lat: 51, lng: 0}],
  strokeColor: '#FF0000',
  strokeOpacity: 0.8,
  strokeWeight: 2
});
polyline.setMap(map);

// LEAFLET
polyline = L.enhancedPolyline([
  [40, -74], [51, 0]
], {
  color: '#FF0000',
  opacity: 0.8,
  weight: 2
}).addTo(map);
```

### Info Windows / Popups
```javascript
// GOOGLE MAPS
infowindow = new google.maps.InfoWindow({
  content: "<h3>Hello</h3>"
});
marker.addListener('click', function() {
  infowindow.open(map, marker);
});

// LEAFLET
marker.bindPopup("<h3>Hello</h3>");
// Opens automatically on click
```

### Event Listeners
```javascript
// GOOGLE MAPS
google.maps.event.addListener(map, 'zoom_changed', function() {
  var zoom = map.getZoom();
});

// LEAFLET
map.on('zoomend', function() {
  var zoom = map.getZoom();
});
```

### Geometry - Distance
```javascript
// GOOGLE MAPS
distance = google.maps.geometry.spherical.computeDistanceBetween(
  new google.maps.LatLng(40, -74),
  new google.maps.LatLng(51, 0)
);

// LEAFLET
distance = LeafletGeometry.computeDistanceBetween(
  {lat: 40, lng: -74},
  {lat: 51, lng: 0}
);
```

### Geometry - Interpolation
```javascript
// GOOGLE MAPS
newPos = google.maps.geometry.spherical.interpolate(from, to, 0.5);

// LEAFLET
newPos = LeafletGeometry.interpolate(from, to, 0.5);
```

### Marker Visibility
```javascript
// GOOGLE MAPS
marker.setVisible(false);

// LEAFLET
marker.setVisible(false);
// or
marker.setOpacity(0);
```

### Map Controls
```javascript
// GOOGLE MAPS
map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(element);

// LEAFLET
map.controls.RIGHT_BOTTOM.push(element);
```

### Get Map Bounds
```javascript
// GOOGLE MAPS
bounds = map.getBounds();
ne = bounds.getNorthEast();
sw = bounds.getSouthWest();

// LEAFLET
bounds = map.getBounds();
ne = bounds.getNorthEast();
sw = bounds.getSouthWest();
```

### Set Map Type
```javascript
// GOOGLE MAPS
map.setMapTypeId('roadmap');

// LEAFLET
map.setMapTypeId('standard');
// Options: 'standard', 'light', 'dark', 'satellite'
```

### Remove from Map
```javascript
// GOOGLE MAPS
marker.setMap(null);
polyline.setMap(null);

// LEAFLET
marker.remove();
polyline.remove();
```

---

## Event Name Changes

| Google Maps | Leaflet |
|------------|---------|
| `zoom_changed` | `zoomend` |
| `dragend` | `dragend` ✓ |
| `click` | `click` ✓ |
| `dblclick` | `dblclick` ✓ |
| `idle` | `moveend` |
| `maptypeid_changed` | `maptypeid_changed` (custom) |

---

## Coordinate Format

⚠️ **Important Difference:**

```javascript
// GOOGLE MAPS uses objects
{lat: 40.7, lng: -74.0}

// LEAFLET uses arrays
[40.7, -74.0]  // [latitude, longitude]
```

Our adapter handles both formats for compatibility.

---

## Control Positions

| Google Maps | Leaflet |
|------------|---------|
| `TOP_LEFT` | `topleft` |
| `TOP_CENTER` | Use custom control |
| `TOP_RIGHT` | `topright` |
| `LEFT_TOP` | `topleft` |
| `LEFT_CENTER` | Use custom control |
| `LEFT_BOTTOM` | `bottomleft` |
| `RIGHT_TOP` | `topright` |
| `RIGHT_CENTER` | Use custom control |
| `RIGHT_BOTTOM` | `bottomright` |
| `BOTTOM_LEFT` | `bottomleft` |
| `BOTTOM_CENTER` | Use custom control |
| `BOTTOM_RIGHT` | `bottomright` |

---

## CSS Class Changes

| Google Maps | Leaflet |
|------------|---------|
| `.googleMapIcon` | `.leaflet-map-icon` |
| `.gm-fullscreen-control` | `.leaflet-control-fullscreen` |
| `.gmnoprint` | N/A (not needed) |
| `.gm-control-active` | `.leaflet-control-active` |

---

## Common Patterns

### Creating Shadow Polyline
```javascript
// GOOGLE MAPS
shadowPath = new google.maps.Polyline({
  path: coordinates,
  strokeColor: '#000000',
  strokeWeight: 4,
  strokeOpacity: 0.3
});

// LEAFLET
mainPolyline.addShadow(map, {
  color: '#000000',
  weight: 4,
  opacity: 0.3
});
```

### Custom Marker Icon
```javascript
// GOOGLE MAPS
icon = {
  url: 'marker.png',
  size: new google.maps.Size(32, 32),
  origin: new google.maps.Point(0, 0),
  anchor: new google.maps.Point(16, 32)
};

// LEAFLET
icon = L.icon({
  iconUrl: 'marker.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});
```

### Fit Bounds
```javascript
// GOOGLE MAPS
bounds = new google.maps.LatLngBounds();
bounds.extend({lat: 40, lng: -74});
bounds.extend({lat: 51, lng: 0});
map.fitBounds(bounds);

// LEAFLET
bounds = L.latLngBounds([
  [40, -74],
  [51, 0]
]);
map.fitBounds(bounds);
```

---

## Import Statements

### Before
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_KEY&libraries=geometry"></script>
```

### After
```html
<!-- Leaflet CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

<!-- Leaflet JS -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<!-- Our Adapter -->
<script src="leaflet-adapter.js"></script>
```

---

## Quick Migration Checklist

- [ ] Replace map initialization
- [ ] Convert `{lat, lng}` → `[lat, lng]`
- [ ] Replace `google.maps.Marker` → `L.enhancedMarker`
- [ ] Replace `google.maps.Polyline` → `L.enhancedPolyline`
- [ ] Update event listeners
- [ ] Replace InfoWindow with bindPopup
- [ ] Update geometry functions
- [ ] Update CSS classes
- [ ] Test in browser

---

**Pro Tip:** Use Find & Replace to speed up migration:
- Find: `google.maps.Marker` → Replace: `L.enhancedMarker`
- Find: `google.maps.Polyline` → Replace: `L.enhancedPolyline`
- Find: `google.maps.event.addListener` → Replace: `map.on`
- Find: `.googleMapIcon` → Replace: `.leaflet-map-icon`
