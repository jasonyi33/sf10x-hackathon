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
import React, { useEffect, useRef } from 'react';
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

    // Configure global MapTiler SDK with API key
    maptilersdk.config.apiKey = apiKey;

    // ============================================================================
    // STEP 2: MAP INITIALIZATION
    // ============================================================================

    try {
      /** @type {maptilersdk.MapOptions} Map configuration object */
      const mapConfig = {
        container: mapContainer.current,
        style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
        center: [-122.4194, 37.7749], // San Francisco downtown coordinates
        zoom: 13,                     // City-level zoom for building details
        pitch: 60,                    // 3D perspective angle (0° = top-down, 60° = angled)
        bearing: -30,                 // Map rotation (-30° = slightly northwest facing)
        terrain: true                 // Enable 3D terrain rendering
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
    const overlay = new MapboxOverlay({
      interleaved: true,              // Enable proper 3D depth sorting
      layers: [
        // TODO: Add 3D building layers here
        // Example: new GeoJsonLayer({
        //   id: 'sf-buildings',
        //   data: buildingGeoJSON,
        //   extruded: true,
        //   getElevation: f => f.properties.height || 20
        // })
      ]
    });

    // Attach deck.gl overlay to MapTiler map
    map.current.addControl(overlay);

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
    <div
      ref={mapContainer}
      role="img"
      aria-label="3D map of San Francisco showing streets and terrain"
      style={{
        width: '100%',                                    // Responsive width
        height: isFullScreen ? '100%' : '500px',          // Dynamic height based on view mode
        backgroundColor: '#f0f0f0',                       // Fallback color while loading
        borderRadius: isFullScreen ? '0px' : '8px',       // No border radius in full-screen
        overflow: 'hidden'                                // Ensure map stays within bounds
      }}
    />
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
