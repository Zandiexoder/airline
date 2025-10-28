# OpenStreetMap Migration - Implementation Checklist

## ✅ Completed Steps

### 1. Documentation
- [x] Created `OPENSTREETMAP_MIGRATION.md` - Comprehensive migration guide
- [x] Documented API comparisons
- [x] Listed alternative tile providers
- [x] Created testing checklist

### 2. Core Libraries Setup
- [x] Replaced Google Maps script with Leaflet CDN in `index.scala.html`
- [x] Added Leaflet CSS (v1.9.4)
- [x] Added Leaflet.PolylineDecorator plugin for route arrows
- [x] Added custom CSS file: `leaflet-custom.css`

### 3. Adapter Layer
- [x] Created `leaflet-adapter.js` - Compatibility wrapper
  - [x] LeafletGeometry helper (spherical calculations)
  - [x] L.EnhancedMarker (extended marker class)
  - [x] L.EnhancedPolyline (extended polyline class)
  - [x] L.EnhancedMap (Google Maps-like API)
  - [x] MapControls manager
  - [x] Custom control positions

### 4. Migration Helpers
- [x] Created `leaflet-migration-helpers.js` with:
  - [x] New initMap() function
  - [x] Custom map controls setup
  - [x] Example marker creation
  - [x] Example route/polyline creation
  - [x] Plane animation example

### 5. Styling
- [x] Created `leaflet-custom.css` with:
  - [x] Custom map control styles (replaces .googleMapIcon)
  - [x] Additional control positions (center positions)
  - [x] Airport popup styling
  - [x] Route popup styling
  - [x] Mobile responsive styles
  - [x] Dark mode support

---

## 🔄 Next Steps (To Complete Migration)

### Phase 1: Core Map Implementation (High Priority)

#### 1.1 Update main.js
- [ ] **Replace initMap() function** with new Leaflet version
  - File: `airline-web/public/javascripts/main.js`
  - Lines: ~303-380
  - Use code from: `leaflet-migration-helpers.js`

- [ ] **Update getMapStyles()** to return tile layer URLs instead
  - Convert from Google Maps styles to tile provider URLs
  - Support light/dark/standard modes

- [ ] **Update map event handlers**
  - Replace `google.maps.event.addListener` with `map.on()`
  - Update all event names (zoom_changed → zoomend, etc.)

- [ ] **Update isShowMarker()** function
  - Ensure compatibility with Leaflet markers
  - Test marker visibility at different zoom levels

#### 1.2 Update CSS Files
- [ ] **Find and replace .googleMapIcon with .leaflet-map-icon**
  - Files to update:
    - `airline-web/public/stylesheets/main.css`
    - `airline-web/public/stylesheets/modern.css`
    - `airline-web/public/stylesheets/mobile.css`

- [ ] **Remove Google Maps specific styles**
  - .gm-fullscreen-control
  - .gmnoprint
  - .gm-svpc
  - .gm-control-active

---

### Phase 2: Airport Markers (High Priority)

#### 2.1 Update airport.js
- [ ] **File**: `airline-web/public/javascripts/airport.js`
- [ ] **Lines ~669**: Replace `new google.maps.Marker()` with `L.enhancedMarker()`
- [ ] **Lines ~807**: Replace second marker creation
- [ ] **Lines ~1136**: Replace contested marker creation

**Migration Pattern:**
```javascript
// BEFORE
var marker = new google.maps.Marker({
  position: {lat: airport.latitude, lng: airport.longitude},
  map: map,
  title: airport.name,
  icon: iconUrl
});

// AFTER
var marker = L.enhancedMarker([airport.latitude, airport.longitude], {
  title: airport.name,
  icon: L.icon({
    iconUrl: iconUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  })
}).addTo(map);
```

---

### Phase 3: Flight Routes & Polylines (High Priority)

#### 3.1 Update link-history.js
- [ ] **File**: `airline-web/public/javascripts/link-history.js`
- [ ] **Lines ~173-174**: Convert LatLng objects to arrays
- [ ] **Lines ~178**: Replace arrow symbols with polylineDecorator
- [ ] **Lines ~185**: Replace Polyline creation
- [ ] **Lines ~201**: Replace shadow path creation
- [ ] **Lines ~264**: Replace spherical interpolation with LeafletGeometry.interpolate()
- [ ] **Lines ~318-319**: Replace Point objects
- [ ] **Lines ~322**: Replace animated marker
- [ ] **Lines ~431**: Replace InfoWindow with popup

#### 3.2 Update alliance.js
- [ ] **File**: `airline-web/public/javascripts/alliance.js`
- [ ] **Lines ~764**: Replace InfoWindow
- [ ] **Lines ~780, 803-806**: Update map controls
- [ ] **Lines ~810-811**: Convert LatLng
- [ ] **Lines ~829, 843**: Replace Polyline creation
- [ ] **Lines ~870**: Replace InfoWindow
- [ ] **Lines ~1119**: Update controls clearing

#### 3.3 Update rivals.js
- [ ] **File**: `airline-web/public/javascripts/rivals.js`
- [ ] **Lines ~424**: Update event listeners
- [ ] **Lines ~434**: Replace InfoWindow
- [ ] **Lines ~479**: Update map controls

---

### Phase 4: Campaign & Event Maps (Medium Priority)

#### 4.1 Update campaign.js
- [ ] **File**: `airline-web/public/javascripts/campaign.js`
- [ ] **Lines ~13**: Replace map creation
- [ ] **Lines ~242**: Replace Circle creation with L.circle()
- [ ] **Lines ~255, 258**: Update event listeners
- [ ] **Lines ~273**: Replace marker creation
- [ ] **Lines ~284**: Replace InfoWindow

#### 4.2 Update event.js
- [ ] **File**: `airline-web/public/javascripts/event.js`
- [ ] **Lines ~357**: Replace marker creation

---

### Phase 5: Special Features (Medium Priority)

#### 5.1 Update christmas.js
- [ ] **File**: `airline-web/public/javascripts/christmas.js`
- [ ] **Lines ~199-200**: Replace Point objects for Christmas markers

#### 5.2 Update airline.js
- [ ] **File**: `airline-web/public/javascripts/airline.js`
- [ ] **Lines ~526**: Replace marker creation

---

### Phase 6: Configuration & Cleanup (Low Priority)

#### 6.1 Remove Google Maps Configuration
- [ ] **File**: `airline-web/conf/application.conf`
- [ ] **Line ~84**: Remove or comment out `google.mapKey`

#### 6.2 Update Documentation
- [ ] **File**: `README.md`
- [ ] **Line ~20**: Remove Google Maps API key instructions
- [ ] Add OpenStreetMap information

#### 6.3 Environment Variables
- [ ] **File**: `.env.example`
- [ ] **Line ~14**: Remove Google Maps API comments

---

### Phase 7: Advanced Features (Optional Enhancements)

#### 7.1 Add Marker Clustering
- [ ] Install Leaflet.markercluster plugin
- [ ] Implement for 1000+ airports
- [ ] Test performance improvements

#### 7.2 Add Fullscreen Control
- [ ] Install Leaflet.fullscreen plugin
- [ ] Add fullscreen button to map

#### 7.3 Add Layer Switcher
- [ ] Create control for switching tile providers
- [ ] Add satellite/terrain/street view options
- [ ] Save user preference

#### 7.4 Implement Heatmap
- [ ] Install Leaflet.heat plugin
- [ ] Replace Google visualization heatmap
- [ ] Test with passenger data

---

## 🧪 Testing Checklist

### Functional Testing
- [ ] Map loads without errors
- [ ] All airports appear as markers
- [ ] Marker info popups work
- [ ] Flight routes render correctly
- [ ] Route arrows point in correct direction
- [ ] Zoom in/out updates markers visibility
- [ ] Custom controls (light/dark, animation, etc.) work
- [ ] Animated planes move along routes
- [ ] Alliance maps display correctly
- [ ] Campaign maps function properly
- [ ] Rival routes show up
- [ ] Christmas/seasonal markers appear

### Browser Testing
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Performance Testing
- [ ] Map loads in < 3 seconds
- [ ] Smooth panning and zooming
- [ ] 100+ markers render smoothly
- [ ] 500+ routes don't lag
- [ ] Memory usage is acceptable
- [ ] No console errors

### Visual Testing
- [ ] Map styling looks professional
- [ ] Light theme displays correctly
- [ ] Dark theme displays correctly
- [ ] Controls are properly positioned
- [ ] Popups are readable
- [ ] Mobile view is responsive
- [ ] Icons are correct size

---

## 📝 Migration Strategy

### Recommended Approach: Incremental Migration

**Week 1: Setup & Core**
1. Day 1-2: Test Leaflet setup on staging
2. Day 3-4: Migrate initMap() and basic map display
3. Day 5: Test and fix core map functionality

**Week 2: Markers**
1. Day 1-2: Migrate airport markers
2. Day 3-4: Update marker interactions and popups
3. Day 5: Test marker visibility and clustering

**Week 3: Routes**
1. Day 1-2: Migrate polylines and flight routes
2. Day 3-4: Add route decorators (arrows)
3. Day 5: Test route rendering and interactions

**Week 4: Advanced Features**
1. Day 1-2: Migrate animated planes
2. Day 3: Migrate alliance/campaign maps
3. Day 4: Test all map types
4. Day 5: Performance optimization

**Week 5: Polish & Deploy**
1. Day 1-2: Cross-browser testing
2. Day 3: Mobile testing and fixes
3. Day 4: Final QA
4. Day 5: Deploy to production

---

## 🔧 Troubleshooting Guide

### Common Issues

#### Issue: Map doesn't load
**Solution**: Check browser console for errors. Ensure Leaflet CSS is loaded before JS.

#### Issue: Markers don't appear
**Solution**: Check coordinate format. Leaflet uses [lat, lng] not {lat:, lng:}.

#### Issue: Polylines are straight, not curved
**Solution**: This is expected. Leaflet draws straight lines. Use geodesic plugin if needed.

#### Issue: Animations are choppy
**Solution**: Use requestAnimationFrame for smooth animations. Check LeafletGeometry.interpolate().

#### Issue: Controls not visible
**Solution**: Check z-index. Ensure custom control CSS is loaded.

#### Issue: Popups don't open
**Solution**: Check if bindPopup() is called. Ensure marker is added to map.

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] No console errors
- [ ] Performance benchmarks met
- [ ] Code reviewed
- [ ] Documentation updated

### Deployment
- [ ] Backup database
- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Get stakeholder approval
- [ ] Deploy to production
- [ ] Monitor for errors

### Post-Deployment
- [ ] Verify map loads for all users
- [ ] Check analytics for errors
- [ ] Monitor performance metrics
- [ ] Gather user feedback
- [ ] Document any issues

---

## 📊 Progress Tracking

**Overall Progress: 30%**

| Phase | Status | Progress |
|-------|--------|----------|
| Documentation | ✅ Complete | 100% |
| Setup | ✅ Complete | 100% |
| Core Map | 🔄 In Progress | 20% |
| Markers | ⏳ Not Started | 0% |
| Routes | ⏳ Not Started | 0% |
| Campaign Maps | ⏳ Not Started | 0% |
| Testing | ⏳ Not Started | 0% |
| Deployment | ⏳ Not Started | 0% |

---

## 🎯 Quick Start Commands

```bash
# Test the changes
cd /Users/alexa/Documents/GitHub/airline
docker-compose restart airline-app

# Watch for errors
docker-compose logs -f airline-app

# Check browser console
# Open http://localhost:9000 and check DevTools console
```

---

## 📞 Support Resources

- **Leaflet Docs**: https://leafletjs.com/reference.html
- **OSM Wiki**: https://wiki.openstreetmap.org/
- **Stack Overflow**: Tag `leaflet` or `openstreetmap`
- **GitHub Issues**: Check airline repo for similar migrations

---

**Last Updated**: October 28, 2025
**Status**: Ready for Phase 1 implementation
**Next Action**: Begin updating main.js with new initMap() function
