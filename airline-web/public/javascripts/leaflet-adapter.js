/**
 * Leaflet Adapter for Google Maps Migration
 * 
 * This adapter provides a compatibility layer to ease migration from Google Maps to Leaflet/OSM.
 * It wraps Leaflet functionality to mimic some Google Maps API patterns.
 */

console.log('✅ Leaflet Adapter v3.0 loaded - with setZIndex, setOpacity, addListener fixes');

// Geometry helper functions (replaces google.maps.geometry.spherical)
const LeafletGeometry = {
    /**
     * Calculate spherical distance between two points
     * @param {Object} from - {lat, lng}
     * @param {Object} to - {lat, lng}
     * @returns {number} Distance in meters
     */
    computeDistanceBetween: function(from, to) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = from.lat * Math.PI / 180;
        const φ2 = to.lat * Math.PI / 180;
        const Δφ = (to.lat - from.lat) * Math.PI / 180;
        const Δλ = (to.lng - from.lng) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    },

    /**
     * Interpolate between two points (for animation)
     * Replicates google.maps.geometry.spherical.interpolate
     * @param {Object} from - {lat, lng}
     * @param {Object} to - {lat, lng}
     * @param {number} fraction - 0 to 1
     * @returns {Object} {lat, lng}
     */
    interpolate: function(from, to, fraction) {
        const lat1 = from.lat * Math.PI / 180;
        const lon1 = from.lng * Math.PI / 180;
        const lat2 = to.lat * Math.PI / 180;
        const lon2 = to.lng * Math.PI / 180;

        const d = 2 * Math.asin(Math.sqrt(
            Math.pow(Math.sin((lat1 - lat2) / 2), 2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon1 - lon2) / 2), 2)
        ));

        if (d === 0) {
            return { lat: from.lat, lng: from.lng };
        }

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
    },

    /**
     * Compute heading between two points
     * @param {Object} from - {lat, lng}
     * @param {Object} to - {lat, lng}
     * @returns {number} Heading in degrees (0-360)
     */
    computeHeading: function(from, to) {
        const lat1 = from.lat * Math.PI / 180;
        const lat2 = to.lat * Math.PI / 180;
        const dLng = (to.lng - from.lng) * Math.PI / 180;

        const y = Math.sin(dLng) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) -
                Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
        const bearing = Math.atan2(y, x);

        return (bearing * 180 / Math.PI + 360) % 360;
    }
};

// Enhanced Marker class
L.EnhancedMarker = L.Marker.extend({
    initialize: function(latlng, options) {
        L.Marker.prototype.initialize.call(this, latlng, options);
        this._visible = true;
        this._customData = options.customData || {};
    },

    setVisible: function(visible) {
        this._visible = visible;
        if (visible) {
            this.setOpacity(1);
        } else {
            this.setOpacity(0);
        }
    },

    getVisible: function() {
        return this._visible;
    },

    setTitle: function(title) {
        this.options.title = title;
        if (this._icon) {
            this._icon.title = title;
        }
    },

    getTitle: function() {
        return this.options.title;
    },

    getData: function(key) {
        return this._customData[key];
    },

    setData: function(key, value) {
        this._customData[key] = value;
    }
});

// Factory function for enhanced markers
L.enhancedMarker = function(latlng, options) {
    return new L.EnhancedMarker(latlng, options);
};

// Enhanced Polyline class
L.EnhancedPolyline = L.Polyline.extend({
    initialize: function(latlngs, options) {
        L.Polyline.prototype.initialize.call(this, latlngs, options);
        this._customData = options.customData || {};
    },

    getData: function(key) {
        return this._customData[key];
    },

    setData: function(key, value) {
        this._customData[key] = value;
    },

    // Add shadow polyline for better visibility
    addShadow: function(map, shadowOptions) {
        const shadowOpts = L.extend({}, this.options, shadowOptions || {
            color: '#000000',
            weight: (this.options.weight || 2) + 2,
            opacity: 0.3
        });
        
        this._shadow = L.polyline(this.getLatLngs(), shadowOpts).addTo(map);
        return this._shadow;
    },

    removeShadow: function() {
        if (this._shadow && this._shadow._map) {
            this._shadow.remove();
        }
    }
});

// Factory function for enhanced polylines
L.enhancedPolyline = function(latlngs, options) {
    return new L.EnhancedPolyline(latlngs, options);
};

// Custom control position helper
const ControlPositions = {
    TOP_LEFT: 'topleft',
    TOP_CENTER: 'topcenter',
    TOP_RIGHT: 'topright',
    LEFT_TOP: 'topleft',
    LEFT_CENTER: 'leftcenter',
    LEFT_BOTTOM: 'bottomleft',
    RIGHT_TOP: 'topright',
    RIGHT_CENTER: 'rightcenter',
    RIGHT_BOTTOM: 'bottomright',
    BOTTOM_LEFT: 'bottomleft',
    BOTTOM_CENTER: 'bottomcenter',
    BOTTOM_RIGHT: 'bottomright'
};

// Add center positions that Leaflet doesn't have by default
L.Control.TopCenter = L.Control.extend({
    options: {
        position: 'topleft'
    },
    onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-top-center leaflet-bar');
        container.style.cssText = 'position: absolute; left: 50%; transform: translateX(-50%); margin-top: 10px;';
        return container;
    }
});

L.control.topCenter = function(opts) {
    return new L.Control.TopCenter(opts);
};

// Map controls manager (mimics Google Maps controls array)
class MapControls {
    constructor(map, position) {
        this.map = map;
        this.position = position;
        this.controls = [];
        this.container = null;
    }

    push(element) {
        this.controls.push(element);
        if (!this.container) {
            this.createContainer();
        }
        this.container.appendChild(element);
    }

    insertAt(index, element) {
        if (index >= this.controls.length) {
            this.push(element);
        } else {
            this.controls.splice(index, 0, element);
            if (!this.container) {
                this.createContainer();
            }
            const refChild = this.container.children[index];
            this.container.insertBefore(element, refChild);
        }
    }

    clear() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.controls = [];
    }

    getLength() {
        return this.controls.length;
    }

    createContainer() {
        const CustomControl = L.Control.extend({
            onAdd: () => {
                const container = L.DomUtil.create('div', 'leaflet-control-custom');
                L.DomEvent.disableClickPropagation(container);
                return container;
            }
        });

        const control = new CustomControl({ position: this.position });
        control.addTo(this.map);
        this.container = control.getContainer();
    }
}

// Enhanced Map wrapper
L.EnhancedMap = L.Map.extend({
    initialize: function(id, options) {
        // Convert Google Maps options to Leaflet options
        const leafletOptions = {
            center: options.center ? [options.center.lat, options.center.lng] : [0, 0],
            zoom: options.zoom || 2,
            minZoom: options.minZoom || 2,
            maxZoom: options.maxZoom || 18,
            zoomControl: options.zoomControl !== false,
            worldCopyJump: true
        };

        if (options.restriction) {
            const bounds = options.restriction.latLngBounds;
            leafletOptions.maxBounds = [
                [bounds.south, bounds.west],
                [bounds.north, bounds.east]
            ];
        }

        L.Map.prototype.initialize.call(this, id, leafletOptions);

        // Add default OSM tiles
        const tileOptions = options.tileLayer || {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        };

        this.baseLayer = L.tileLayer(tileOptions.url, tileOptions).addTo(this);

        // Add alternative tile layers for map type switching
        this.tileLayers = {
            standard: this.baseLayer,
            light: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            }),
            dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            }),
            satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri'
            })
        };

        // Initialize control positions
        this.controls = {};
        Object.keys(ControlPositions).forEach(key => {
            const position = ControlPositions[key];
            this.controls[key] = new MapControls(this, position);
        });

        this._currentMapType = 'standard';
        this._gestureHandling = options.gestureHandling || 'greedy';

        // Apply gesture handling
        if (this._gestureHandling === 'greedy') {
            this.scrollWheelZoom.enable();
            this.dragging.enable();
        }
    },

    setMapTypeId: function(mapType) {
        if (this._currentMapType === mapType) return;

        // Remove current layer
        if (this.baseLayer) {
            this.removeLayer(this.baseLayer);
        }

        // Add new layer
        this.baseLayer = this.tileLayers[mapType] || this.tileLayers.standard;
        this.addLayer(this.baseLayer);
        this._currentMapType = mapType;

        this.fire('maptypeid_changed', { mapType: mapType });
    },

    getMapTypeId: function() {
        return this._currentMapType;
    },

    // Compatibility methods
    getBounds: function() {
        const bounds = L.Map.prototype.getBounds.call(this);
        return {
            getNorthEast: () => ({ lat: bounds.getNorth(), lng: bounds.getEast() }),
            getSouthWest: () => ({ lat: bounds.getSouth(), lng: bounds.getWest() }),
            contains: (latlng) => bounds.contains([latlng.lat, latlng.lng])
        };
    }
});

// Factory function for enhanced map
L.enhancedMap = function(id, options) {
    return new L.EnhancedMap(id, options);
};

// Utility: Convert Google Maps LatLng to Leaflet format
function convertLatLng(googleLatLng) {
    if (googleLatLng.lat && googleLatLng.lng) {
        return [googleLatLng.lat, googleLatLng.lng];
    }
    return googleLatLng;
}

// Utility: Create arrow decorator for polylines
function addArrowDecorator(polyline, color) {
    // Requires Leaflet.PolylineDecorator plugin
    if (typeof L.polylineDecorator !== 'undefined') {
        return L.polylineDecorator(polyline, {
            patterns: [
                {
                    offset: '100%',
                    repeat: 0,
                    symbol: L.Symbol.arrowHead({
                        pixelSize: 12,
                        polygon: false,
                        pathOptions: {
                            stroke: true,
                            color: color,
                            weight: 2
                        }
                    })
                }
            ]
        });
    }
    return null;
}

/**
 * Google Maps Compatibility Layer
 * Creates a partial google.maps object for backward compatibility
 */
if (typeof google === 'undefined') {
    window.google = {};
}

if (typeof google.maps === 'undefined') {
    google.maps = {
        // Marker constructor wrapper
        Marker: function(options) {
            var marker;
            
            if (options.position) {
                var latlng = [options.position.lat, options.position.lng];
                
                var markerOptions = {
                    title: options.title || ''
                };
                
                // Handle custom icon
                if (options.icon) {
                    if (typeof options.icon === 'string') {
                        markerOptions.icon = L.icon({
                            iconUrl: options.icon,
                            iconSize: [32, 32],
                            iconAnchor: [16, 32],
                            popupAnchor: [0, -32]
                        });
                    } else if (options.icon.url) {
                        markerOptions.icon = L.icon({
                            iconUrl: options.icon.url,
                            iconSize: options.icon.scaledSize ? 
                                [options.icon.scaledSize.width, options.icon.scaledSize.height] : 
                                [32, 32],
                            iconAnchor: options.icon.anchor ? 
                                [options.icon.anchor.x, options.icon.anchor.y] : 
                                [16, 32],
                            popupAnchor: [0, -32]
                        });
                    }
                }
                
                marker = L.marker(latlng, markerOptions);
                
                console.log('🔵 Created Leaflet marker, adding compatibility methods...');
                
                // Add compatibility methods
                marker.setVisible = function(visible) {
                    if (visible) {
                        if (options.map && !marker._map) {
                            marker.addTo(options.map);
                        }
                    } else {
                        if (marker._map) {
                            marker.remove();
                        }
                    }
                };
                
                marker.setMap = function(map) {
                    if (map) {
                        marker.addTo(map);
                    } else {
                        marker.remove();
                    }
                };
                
                marker.getPosition = function() {
                    var latlng = marker.getLatLng();
                    return { lat: latlng.lat, lng: latlng.lng };
                };
                
                // Store original Leaflet methods before overriding
                var leafletSetOpacity = marker.setOpacity.bind(marker);
                
                marker.setZIndex = function(zIndex) {
                    if (marker._icon) {
                        marker._icon.style.zIndex = zIndex;
                    }
                    marker._zIndex = zIndex;
                    return marker;
                };
                
                console.log('✅ Added setZIndex method, type:', typeof marker.setZIndex);
                
                marker.setOpacity = function(opacity) {
                    leafletSetOpacity(opacity);
                    return marker;
                };
                
                marker.addListener = function(eventName, handler) {
                    // Map Google Maps events to Leaflet events
                    var leafletEvent = eventName;
                    if (eventName === 'click') {
                        leafletEvent = 'click';
                    } else if (eventName === 'mouseover') {
                        leafletEvent = 'mouseover';
                    } else if (eventName === 'mouseout') {
                        leafletEvent = 'mouseout';
                    }
                    marker.on(leafletEvent, handler);
                    return marker;
                };
                
                // Add to map if specified
                if (options.map) {
                    marker.addTo(options.map);
                }
            }
            
            return marker;
        },
        
        // Polyline constructor wrapper
        Polyline: function(options) {
            var latlngs = [];
            if (options.path) {
                latlngs = options.path.map(function(p) {
                    return [p.lat, p.lng];
                });
            }
            
            var polylineOptions = {
                color: options.strokeColor || '#FF0000',
                weight: options.strokeWeight || 2,
                opacity: options.strokeOpacity || 1.0
            };
            
            var polyline = L.polyline(latlngs, polylineOptions);
            
            // Add compatibility methods
            polyline.setMap = function(map) {
                if (map) {
                    polyline.addTo(map);
                } else {
                    polyline.remove();
                }
            };
            
            polyline.setPath = function(path) {
                var latlngs = path.map(function(p) {
                    return [p.lat, p.lng];
                });
                polyline.setLatLngs(latlngs);
            };
            
            polyline.getPath = function() {
                return polyline.getLatLngs().map(function(ll) {
                    return { lat: ll.lat, lng: ll.lng };
                });
            };
            
            // Add to map if specified
            if (options.map) {
                polyline.addTo(options.map);
            }
            
            return polyline;
        },
        
        // InfoWindow constructor wrapper (popup)
        InfoWindow: function(options) {
            options = options || {};
            
            var popup = L.popup({
                maxWidth: options.maxWidth || 300,
                minWidth: options.minWidth || 50,
                maxHeight: options.maxHeight || null,
                autoPan: options.autoPan !== false,
                closeButton: true,
                autoClose: false,
                closeOnEscapeKey: true,
                className: 'leaflet-google-popup'
            });
            
            // Store content
            popup._content = options.content || '';
            popup.marker = null;
            
            // Add compatibility methods
            popup.setContent = function(content) {
                popup._content = content;
                L.Popup.prototype.setContent.call(popup, content);
                return popup;
            };
            
            popup.getContent = function() {
                return popup._content;
            };
            
            popup.open = function(map, marker) {
                popup.marker = marker;
                if (marker && marker.getLatLng) {
                    popup.setLatLng(marker.getLatLng());
                }
                popup.openOn(map);
                return popup;
            };
            
            popup.close = function() {
                if (popup._map) {
                    popup._map.closePopup(popup);
                }
                return popup;
            };
            
            // Set initial content if provided
            if (options.content) {
                popup.setContent(options.content);
            }
            
            return popup;
        },
        
        // Event system wrapper
        event: {
            addListener: function(instance, eventName, handler) {
                // Map Google Maps events to Leaflet events
                var leafletEvent = eventName;
                switch(eventName) {
                    case 'zoom_changed':
                        leafletEvent = 'zoomend';
                        break;
                    case 'maptypeid_changed':
                        leafletEvent = 'baselayerchange';
                        break;
                    case 'bounds_changed':
                        leafletEvent = 'moveend';
                        break;
                    case 'click':
                        leafletEvent = 'click';
                        break;
                }
                
                if (instance.on) {
                    instance.on(leafletEvent, handler);
                }
            },
            
            removeListener: function(listener) {
                if (listener && listener.off) {
                    listener.off();
                }
            }
        },
        
        // Geometry spherical functions
        geometry: {
            spherical: LeafletGeometry
        },
        
        // ControlPosition enum
        ControlPosition: {
            RIGHT_BOTTOM: 'bottomright',
            LEFT_BOTTOM: 'bottomleft',
            TOP_RIGHT: 'topright',
            TOP_LEFT: 'topleft'
        }
    };
}

// Export utilities
window.LeafletGeometry = LeafletGeometry;
window.ControlPositions = ControlPositions;
window.convertLatLng = convertLatLng;
window.addArrowDecorator = addArrowDecorator;

console.log('Leaflet Adapter loaded - OpenStreetMap migration ready! 🗺️');
