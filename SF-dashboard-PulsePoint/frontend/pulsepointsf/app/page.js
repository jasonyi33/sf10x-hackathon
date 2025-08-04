'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import styles from "./page.module.css";
import '@maptiler/sdk/dist/maptiler-sdk.css';

import { useCrimeData } from '../lib/hooks/useCrimeData.js';
import { CATEGORY_COLORS, CRIME_CATEGORIES } from './crime/constants.js';

// Dynamic import to handle client-side rendering for WebGL
const SanFrancisco3D = dynamic(() => import('./components/SanFrancisco3D'), {
  ssr: false,
  loading: () => <p>Loading 3D San Francisco Map...</p>
});

const DEFAULT_CATEGORY = 'Assault';

function getAllCategories() {
  // Flatten all categories from CRIME_CATEGORIES
  return Array.from(
    new Set(
      Object.values(CRIME_CATEGORIES).flat()
    )
  );
}

export default function Home() {
  // State management for view mode - default to full-screen
  const [isFullScreen, setIsFullScreen] = useState(true);

  // Category selection for crime clusters
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORY);

  // Crime data hook (global cache)
  const { crimeData, isLoading, error, lastFetched, refetch } = useCrimeData();

  // Toggle function for switching between views
  const toggleView = () => setIsFullScreen(!isFullScreen);

  // Single persistent layout with conditional styling
  return (
    <div className={isFullScreen ? styles.containerFullscreen : styles.containerNormal}>
      {/* Full-screen toggle button */}
      <button
        className={isFullScreen ? styles.toggleBtnFullscreen : styles.toggleBtnNormal}
        onClick={toggleView}
        aria-label={isFullScreen ? "Exit full screen view" : "Enter full screen view"}
        title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
      >
        {isFullScreen ? "⌐ Exit Full Screen" : "⛶ Full Screen"}
      </button>

      {/* Controls: Category Selector (crime clusters only) */}
      <div
        style={{
          position: isFullScreen ? 'fixed' : 'absolute',
          top: isFullScreen ? 80 : 20,
          left: isFullScreen ? 20 : 0,
          zIndex: 1002,
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          padding: '12px 20px',
          minWidth: 220,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <label htmlFor="category-select" style={{ fontWeight: 600, fontSize: 14, color: '#222' }}>
          🏗️ Crime Category
        </label>
        <select
          id="category-select"
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: 4,
            border: '1px solid #d1d5db',
            fontSize: 14,
            background: 'white',
            color: '#222',
            fontWeight: 500,
            marginBottom: 4,
          }}
        >
          {getAllCategories().map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
          {crimeData
            ? `Showing clusters for "${selectedCategory}" (${crimeData.filter(d => d.incident_category === selectedCategory).length} incidents)`
            : "Loading crime data..."}
        </div>
      </div>

      {/* Loading/Error States */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255,255,255,0.95)',
            padding: '32px 48px',
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
            zIndex: 2000,
            fontSize: 18,
            color: '#444',
            fontWeight: 500,
          }}
        >
          Loading SF Crime Data...
        </div>
      )}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fef2f2',
            color: '#dc2626',
            padding: '32px 48px',
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
            zIndex: 2000,
            fontSize: 18,
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          Failed to load crime data.<br />
          <span style={{ fontWeight: 400, fontSize: 15 }}>{error}</span>
          <br />
          <button
            onClick={refetch}
            style={{
              marginTop: 16,
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 6,
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            🔄 Try Again
          </button>
        </div>
      )}

      {/* Header (only in normal mode) */}
      {!isFullScreen && (
        <header className={styles.pageHeader}>
          <h1
            id="page-title"
            className="page-title"
            style={{ margin: '20px 0', color: '#333', textAlign: 'center' }}
          >
            PulsePoint SF - 3D Crime Clusters
          </h1>
        </header>
      )}

      {/* 3D Crime Clusters Map */}
      <div className={isFullScreen ? styles.mapFullscreen : styles.mapNormal}>
        <SanFrancisco3D
          isFullScreen={isFullScreen}
          crimeData={crimeData}
          selectedCategory={selectedCategory}
          showCrimeClusters={true}
        />
      </div>

      {/* Footer (only in normal mode) */}
      {!isFullScreen && (
        <footer className={styles.pageDescription}>
          <p
            id="map-description"
            className="description-text"
            style={{ textAlign: 'center', color: '#666' }}
          >
            Explore San Francisco crime clusters in 3D. Data from DataSF API.
          </p>
        </footer>
      )}
    </div>
  );
}
