/**
 * Leaflet/OSM Migration - Main Map Initialization
 * 
 * This file contains the converted initMap() function and related code
 * for the OpenStreetMap migration using Leaflet.js
 * 
 * TO APPLY: Replace the initMap() function in main.js with this code
 */

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

// Get tile URL based on current map style preference
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

function addCustomMapControls(map) {
    // Create custom control buttons (similar to Google Maps controls)
    var toggleMapChristmasButton = $('<div id="toggleMapChristmasButton" class="leaflet-map-icon" onclick="toggleChristmasMarker()" align="center" style="display: none; margin-bottom: 10px;"><span class="alignHelper"></span><img src="assets/images/icons/bauble.png" title=\'Merry Christmas!\' style="vertical-align: middle;"/></div>');
    var toggleMapAnimationButton = $('<div id="toggleMapAnimationButton" class="leaflet-map-icon" onclick="toggleMapAnimation()" align="center" style="margin-bottom: 10px;"><span class="alignHelper"></span><img src="assets/images/icons/arrow-step-over.png" title=\'toggle flight marker animation\' style="vertical-align: middle;"/></div>');
    var toggleChampionButton = $('<div id="toggleChampionButton" class="leaflet-map-icon" onclick="toggleChampionMap()" align="center"  style="margin-bottom: 10px;"><span class="alignHelper"></span><img src="assets/images/icons/crown.png" title=\'toggle champion\' style="vertical-align: middle;"/></div>');
    var toggleMapLightButton = $('<div id="toggleMapLightButton" class="leaflet-map-icon" onclick="toggleMapLight()" align="center" style="margin-bottom: 10px;"><span class="alignHelper"></span><img src="assets/images/icons/switch.png" title=\'toggle dark/light themed map\' style="vertical-align: middle;"/></div>');
    var toggleAllianceBaseMapViewButton = $(`
        <div id="toggleAllianceBaseMapViewButton" class="leaflet-map-icon" onclick="toggleAllianceBaseMapViewButton()" align="center" style="margin-bottom: 10px;">
            <span class="alignHelper"></span>
            <img src="assets/images/icons/puzzle.png" title=\'Toggle alliance bases\' style="vertical-align: middle;"/>
        </div>
    `);

    toggleAllianceBaseMapViewButton.index = 0;
    toggleMapLightButton.index = 1;
    toggleMapAnimationButton.index = 2;
    toggleChampionButton.index = 3;
    toggleMapChristmasButton.index = 5;

    // Determine control position based on map height
    const position = $("#map").height() > 500 ? 'RIGHT_BOTTOM' : 'LEFT_BOTTOM';
    
    map.controls[position].push(toggleAllianceBaseMapViewButton[0]);
    map.controls[position].push(toggleMapLightButton[0]);
    map.controls[position].push(toggleMapAnimationButton[0]);
    map.controls[position].push(toggleChampionButton[0]);

    if (christmasFlag) {
        map.controls[position].push(toggleMapChristmasButton[0]);
        toggleMapChristmasButton.show();
    }
}

function addAirlineSpecificMapControls(map) {
    var toggleHeatmapButton = $('<div id="toggleMapHeatmapButton" class="leaflet-map-icon" onclick="toggleHeatmap()" align="center"  style="margin-bottom: 10px;"><span class="alignHelper"></span><img src="assets/images/icons/table-heatmap.png" title=\'toggle heatmap\' style="vertical-align: middle;"/></div>');
    
    const position = $("#map").height() > 500 ? 'RIGHT_BOTTOM' : 'LEFT_BOTTOM';
    
    map.controls[position].insertAt(3, toggleHeatmapButton[0]);
}

// Toggle map light/dark mode
function toggleMapLight() {
    const currentMode = $.cookie('mapLightMode') || 'standard';
    let newMode;
    
    if (currentMode === 'standard') {
        newMode = 'dark';
    } else if (currentMode === 'dark') {
        newMode = 'light';
    } else {
        newMode = 'standard';
    }
    
    $.cookie('mapLightMode', newMode);
    map.setMapTypeId(newMode);
}

// Example: Creating a marker (migration helper)
function createAirportMarker(airport, iconUrl) {
    const marker = L.enhancedMarker([airport.latitude, airport.longitude], {
        title: airport.name,
        icon: L.icon({
            iconUrl: iconUrl,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
        }),
        customData: {
            airportId: airport.id,
            airportCode: airport.iata,
            city: airport.city
        }
    });
    
    // Bind popup
    marker.bindPopup(`
        <div class="airport-popup">
            <h3>${airport.name}</h3>
            <p>${airport.city}, ${airport.country}</p>
            <p><strong>${airport.iata}</strong></p>
        </div>
    `);
    
    return marker;
}

// Example: Creating a flight route polyline
function createFlightRoute(fromAirport, toAirport, color, opacity) {
    const from = {lat: fromAirport.latitude, lng: fromAirport.longitude};
    const to = {lat: toAirport.latitude, lng: toAirport.longitude};
    
    // Create main polyline
    const flightPath = L.enhancedPolyline([
        [from.lat, from.lng],
        [to.lat, to.lng]
    ], {
        color: color || '#FF0000',
        weight: 2,
        opacity: opacity || 0.8,
        customData: {
            fromAirport: fromAirport.id,
            toAirport: toAirport.id
        }
    });
    
    // Add shadow for better visibility
    flightPath.addShadow(map);
    
    // Add arrow decorator (requires leaflet.polylineDecorator)
    const decorator = addArrowDecorator(flightPath, color || '#FF0000');
    if (decorator) {
        decorator.addTo(map);
    }
    
    flightPath.addTo(map);
    
    return flightPath;
}

// Example: Animate plane marker along route
function animatePlaneAlongRoute(fromLatLng, toLatLng, duration, planeIconUrl) {
    const planeMarker = L.marker([fromLatLng.lat, fromLatLng.lng], {
        icon: L.icon({
            iconUrl: planeIconUrl,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        }),
        zIndexOffset: 1000
    }).addTo(map);
    
    let startTime = Date.now();
    
    function animateStep() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        if (progress < 1) {
            const currentPos = LeafletGeometry.interpolate(fromLatLng, toLatLng, progress);
            planeMarker.setLatLng([currentPos.lat, currentPos.lng]);
            
            // Rotate plane to face direction of travel
            const heading = LeafletGeometry.computeHeading(
                progress === 0 ? fromLatLng : LeafletGeometry.interpolate(fromLatLng, toLatLng, progress - 0.01),
                currentPos
            );
            planeMarker.setRotationAngle(heading);
            
            requestAnimationFrame(animateStep);
        } else {
            planeMarker.setLatLng([toLatLng.lat, toLatLng.lng]);
        }
    }
    
    animateStep();
    return planeMarker;
}

console.log('Leaflet/OSM map functions loaded! ✈️🗺️');
