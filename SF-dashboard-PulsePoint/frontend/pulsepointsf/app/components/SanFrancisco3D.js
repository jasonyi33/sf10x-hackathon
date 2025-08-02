'use client';
import React, { useEffect, useRef } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { GeoJsonLayer } from '@deck.gl/layers';

export default function SanFrancisco3D() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return; // Initialize only once

    // Configure MapTiler API key
    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
    if (!apiKey) {
      console.error('MapTiler API key not found. Please set NEXT_PUBLIC_MAPTILER_KEY in .env');
      return;
    }

    maptilersdk.config.apiKey = apiKey;

    // Initialize MapTiler map with explicit style URL
    try {
      map.current = new maptilersdk.Map({
        container: mapContainer.current,
        style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
        center: [-122.4194, 37.7749], // San Francisco coordinates
        zoom: 13,
        pitch: 60,
        bearing: -30,
        terrain: true
      });
    } catch (error) {
      console.error('Error initializing MapTiler map:', error);
      return;
    }

    // Create deck.gl overlay
    const overlay = new MapboxOverlay({
      interleaved: true,
      layers: [
        // Placeholder for future 3D building layers
        // We'll add GeoJsonLayer with building data here
      ]
    });

    // Add overlay to map
    map.current.addControl(overlay);

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100%',
        height: '500px'
      }}
    />
  );
}
