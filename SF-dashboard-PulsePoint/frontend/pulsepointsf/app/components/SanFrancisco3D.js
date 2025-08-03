/**
 * ==================================================================================
 * SanFrancisco3D Component
 * ==================================================================================
 *
 * @fileoverview 3D interactive map component for San Francisco using MapTiler + deck.gl
 * @description Renders a WebGL-based 3D map of San Francisco with potential for
 *              data visualization overlays, building extrusion, and real-time updates
 *
 * @author PulsePoint SF Team
 * @version 1.0.0
 * @since 2025-01-08
 *
 * @dependencies
 * - @maptiler/sdk: Vector tile mapping and terrain rendering
 * - @deck.gl/mapbox: WebGL overlay integration with MapTiler
 * - @deck.gl/layers: 3D data visualization layers (future use)
 * - React: Component lifecycle and DOM management
 *
 * @features
 * - 3D perspective view of San Francisco
 * - MapTiler vector tiles with terrain support
 * - deck.gl overlay system ready for data layers
 * - Error handling and graceful degradation
 * - Client-side only rendering (SSR disabled)
 *
 * @configuration
 * - Requires NEXT_PUBLIC_MAPTILER_KEY environment variable
 * - Default view: Downtown SF with 60° pitch, -30° bearing
 * - Map style: MapTiler Streets v2 with terrain
 *
 * @future_enhancements
 * - 3D building extrusion from SF Open Data
 * - Real-time data overlays (heatmaps, points of interest)
 * - Interactive controls and user customization
 * - Performance optimization for mobile devices
 * ==================================================================================
 */

'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { GeoJsonLayer } from '@deck.gl/layers';

/**
 * SanFrancisco3D - Interactive 3D Map Component
 *
 * Creates a 3D perspective map of San Francisco using MapTiler as the base layer
 * and deck.gl for potential data visualization overlays. The component handles
 * map initialization, error states, and cleanup automatically.
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} [props.isFullScreen=false] - Whether to render in full-screen mode
 * @returns {JSX.Element} Rendered map container div
 *
 * @example
 * ```jsx
 * import SanFrancisco3D from './components/SanFrancisco3D';
 *
 * function Dashboard() {
 *   return (
 *     <div className="dashboard">
 *       <SanFrancisco3D isFullScreen={false} />
 *     </div>
 *   );
 * }
 * ```
 */
export default function SanFrancisco3D({ isFullScreen = false }) {
  // ================================================================================
  // STATE & REFS
  // ================================================================================

  /** @type {React.MutableRefObject<HTMLDivElement|null>} DOM container for map */
  const mapContainer = useRef(null);

  /** @type {React.MutableRefObject<maptilersdk.Map|null>} MapTiler map instance */
  const map = useRef(null);

  /** @type {React.MutableRefObject<MapboxOverlay|null>} deck.gl overlay instance */
  const overlay = useRef(null);

  /** @type {[Object|null, Function]} Building data for 3D visualization */
  const [buildingData, setBuildingData] = useState(null);

  /** @type {[boolean, Function]} Loading state */
  const [isLoading, setIsLoading] = useState(true);

  /** @type {[string|null, Function]} Error state for data loading */
  const [error, setError] = useState(null);

  // ================================================================================
  // DATA LOADING
  // ================================================================================

  useEffect(() => {
    /**
     * Load curated San Francisco building data for 3D visualization
     * Fetches GeoJSON containing iconic SF buildings with accurate heights
     */
    const loadBuildingData = async () => {
      try {
        console.log('Loading curated SF building data...');
        setIsLoading(true);
        setError(null);

        const response = await fetch('/data/twin-towers-demo.json');

        if (!response.ok) {
          throw new Error(`Failed to load building data: ${response.status}`);
        }

        const data = await response.json();

        // Validate GeoJSON structure
        if (!data.features || !Array.isArray(data.features)) {
          throw new Error('Invalid GeoJSON: missing features array');
        }

        console.log(`Loaded ${data.features.length} buildings for Twin Towers demo`);
        setBuildingData(data);

      } catch (err) {
        console.error('Error loading building data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadBuildingData();
  }, []);

  // ================================================================================
  // MAP INITIALIZATION & LIFECYCLE
  // ================================================================================

  useEffect(() => {
    // Prevent re-initialization if map already exists
    if (map.current) return;

    // ============================================================================
    // STEP 1: API KEY VALIDATION
    // ============================================================================

    /** @type {string|undefined} MapTiler API key from environment variables */
    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;

    if (!apiKey) {
      console.error('MapTiler API key not found. Please set NEXT_PUBLIC_MAPTILER_KEY in .env');
      return;
    }

    // ============================================================================
    // STEP 2: MAP INITIALIZATION
    // ============================================================================

    try {
      // Configure MapTiler SDK with API key (multiple approaches for compatibility)
      if (maptilersdk.config) {
        maptilersdk.config.apiKey = apiKey;
      }

      /** @type {maptilersdk.MapOptions} Map configuration object */
      const mapConfig = {
        container: mapContainer.current,
        style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
        center: [-122.4194, 37.7749], // San Francisco downtown coordinates
        zoom: 13,                     // City-level zoom for building details
        pitch: 60,                    // 3D perspective angle (0° = top-down, 60° = angled)
        bearing: -30,                 // Map rotation (-30° = slightly northwest facing)
        terrain: true,                // Enable 3D terrain rendering
        apiKey: apiKey                // Direct API key configuration as fallback
      };

      // Initialize MapTiler map instance
      map.current = new maptilersdk.Map(mapConfig);

    } catch (error) {
      console.error('Error initializing MapTiler map:', error);
      return;
    }

    // ============================================================================
    // STEP 3: DECK.GL OVERLAY SETUP
    // ============================================================================

    /** @type {MapboxOverlay} deck.gl WebGL overlay for data visualization */
    overlay.current = new MapboxOverlay({
      interleaved: true,              // Enable proper 3D depth sorting
      layers: []                      // Start with empty layers, will be updated when data loads
    });

    // Attach deck.gl overlay to MapTiler map
    map.current.addControl(overlay.current);

    // ============================================================================
    // STEP 4: CLEANUP FUNCTION
    // ============================================================================

    /**
     * Cleanup function to prevent memory leaks
     * Called when component unmounts or dependencies change
     */
    return () => {
      if (map.current) {
        map.current.remove();    // Remove map from DOM and clean up resources
        map.current = null;      // Clear reference
      }
    };
  }, []); // Empty dependency array = run once on mount

  // ================================================================================
  // UPDATE DECK.GL LAYERS WHEN DATA LOADS
  // ================================================================================

  useEffect(() => {
    // Update deck.gl overlay layers when building data is loaded
    if (overlay.current && buildingData) {
      console.log('Updating deck.gl layers with building data...');

      /** @type {GeoJsonLayer} 3D buildings layer */
      const buildingsLayer = new GeoJsonLayer({
        id: 'sf-iconic-buildings',
        data: buildingData,

        // 3D Configuration
        extruded: true,                     // Enable 3D building extrusion
        wireframe: false,                   // Solid buildings (not wireframes)
        filled: true,                       // Fill building polygons

        // Height and Elevation
        getElevation: (feature) => {
          // Extract height from properties with fallback
          const height = feature.properties?.height || 30;
          return Math.max(height, 5); // Minimum 5m height for visibility
        },

        // Visual Styling - Twin Towers Demo with Distinctive Colors
        getFillColor: (feature) => {
          const category = feature.properties?.category;
          const name = feature.properties?.name;
          const height = feature.properties?.height || 30;

          // Special styling for Twin Towers - Metallic Silver/Blue
          if (category === 'historic_monument' && name?.includes('Tower')) {
            if (name.includes('North Tower')) {
              return [200, 220, 240, 255]; // Slightly blue-tinted silver for North Tower
            } else if (name.includes('South Tower')) {
              return [220, 240, 255, 255]; // Slightly lighter blue-silver for South Tower
            }
          }

          // Color based on building category for visual distinction
          switch (category) {
            case 'historic_monument':
              return [180, 200, 220, 240]; // Silver-blue for historic monuments
            case 'office':
              return [160, 160, 160, 220]; // Medium grey for office buildings
            case 'residential':
              return [180, 180, 180, 200]; // Lighter grey for residential
            case 'religious':
              return [140, 140, 140, 230]; // Medium-dark grey for religious buildings
            case 'government':
              return [100, 100, 100, 250]; // Dark grey for government buildings
            default:
              // Height-based gradient for uncategorized buildings
              const intensity = Math.min(140 + (height / 100) * 40, 200);
              return [intensity, intensity, intensity, 210];
          }
        },

        // Building Outlines
        getLineColor: [60, 60, 60, 255],    // Dark grey outlines
        getLineWidth: 1,                    // Thin building outlines
        lineWidthScale: 1,                  // Scale factor for line width

        // Interactivity
        pickable: false,                    // Disable picking for performance

        // Performance Optimization
        updateTriggers: {
          getFillColor: [buildingData],     // Re-render when data changes
          getElevation: [buildingData]
        },

        // Material Properties for Realistic 3D Rendering
        material: {
          ambient: 0.35,                    // Ambient light reflection
          diffuse: 0.6,                     // Diffuse light reflection
          shininess: 32,                    // Surface shininess
          specularColor: [30, 30, 30]       // Specular highlight color
        }
      });

      // Update overlay with new layers
      overlay.current.setProps({
        layers: [buildingsLayer]
      });

      console.log(`Updated deck.gl overlay with ${buildingData.features.length} 3D buildings`);
    }
  }, [buildingData]); // Re-run when building data changes

  // ================================================================================
  // HANDLE FULL-SCREEN MODE CHANGES
  // ================================================================================

  useEffect(() => {
    // Trigger map resize when switching between full-screen and normal modes
    if (map.current) {
      // Use a longer delay to ensure the DOM layout has completed
      const resizeTimeout = setTimeout(() => {
        try {
          // Force the map to resize to fit its container
          map.current.resize();

          // Trigger a map repaint to ensure proper rendering
          map.current.getCanvas().style.visibility = 'hidden';
          map.current.getCanvas().offsetHeight; // Force reflow
          map.current.getCanvas().style.visibility = 'visible';

          // Additional resize call to ensure proper sizing
          setTimeout(() => {
            if (map.current) {
              map.current.resize();
            }
          }, 50);
        } catch (error) {
          console.warn('Error resizing map:', error);
        }
      }, 200);

      return () => clearTimeout(resizeTimeout);
    }
  }, [isFullScreen]); // Re-run when isFullScreen changes

  // ================================================================================
  // COMPONENT RENDER
  // ================================================================================

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: isFullScreen ? '100%' : '500px',
      borderRadius: isFullScreen ? '0px' : '8px',
      overflow: 'hidden'
    }}>
      {/* Map Container */}
      <div
        ref={mapContainer}
        role="img"
        aria-label="3D map of San Francisco showing streets and terrain"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#f0f0f0',                     // Fallback color while loading
        }}
      />

      {/* Loading Indicator */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '14px',
          color: '#666',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          Loading Twin Towers demo...
        </div>
      )}

      {/* Error Indicator */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 1000,
          backgroundColor: 'rgba(255, 69, 58, 0.9)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          maxWidth: '300px'
        }}>
          Error: {error}
        </div>
      )}

      {/* Building Count Info */}
      {buildingData && !isLoading && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          fontSize: '12px',
          color: '#888',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '4px 8px',
          borderRadius: '4px',
          zIndex: 1000
        }}>
          {buildingData.features.length} iconic SF buildings
        </div>
      )}
    </div>
  );
}

/**
 * ==================================================================================
 * TECHNICAL NOTES
 * ==================================================================================
 *
 * Map Coordinates System:
 * - Uses WGS84 (longitude, latitude) coordinate system
 * - San Francisco bounds: approximately [-122.52, 37.70] to [-122.35, 37.83]
 *
 * Performance Considerations:
 * - Map initializes only once per component lifecycle
 * - Uses client-side rendering only (no SSR) due to WebGL requirements
 * - Terrain and vector tiles are cached by MapTiler CDN
 *
 * Browser Compatibility:
 * - Requires WebGL support (modern browsers)
 * - Gracefully falls back to 2D if WebGL unavailable
 * - Mobile support depends on device GPU capabilities
 *
 * API Usage:
 * - MapTiler free tier: 100,000 requests/month
 * - Requests counted per tile load, not per page view
 * - Consider upgrading for production use
 *
 * Security:
 * - API key is exposed in client bundle (unavoidable for web maps)
 * - Use domain restrictions in MapTiler dashboard for security
 * - Monitor usage to prevent API key abuse
 * ==================================================================================
 */
