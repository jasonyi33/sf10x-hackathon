'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import styles from "./page.module.css";
import '@maptiler/sdk/dist/maptiler-sdk.css';

// Dynamic import to handle client-side rendering for WebGL
const SanFrancisco3D = dynamic(() => import('./components/SanFrancisco3D'), {
  ssr: false,
  loading: () => <p>Loading 3D San Francisco Map...</p>
});

export default function Home() {
  // State management for view mode - default to full-screen
  const [isFullScreen, setIsFullScreen] = useState(true);

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

      {/* Reserved space for future controls (only in full-screen) */}
      {isFullScreen && (
        <div className={styles.controlsReserved} aria-label="Map controls area">
          {/* Future: Zoom buttons, layer toggles, etc. */}
        </div>
      )}

      {/* Header (only in normal mode) */}
      {!isFullScreen && (
        <header className={styles.pageHeader}>
          <h1
            id="page-title"
            className="page-title"
            style={{ margin: '20px 0', color: '#333', textAlign:'center' }}
          >
            PulsePoint SF - 3D Map Test
          </h1>
        </header>
      )}

      {/* Single persistent map component */}
      <div className={isFullScreen ? styles.mapFullscreen : styles.mapNormal}>
        <SanFrancisco3D isFullScreen={isFullScreen} />
      </div>

      {/* Footer (only in normal mode) */}
      {!isFullScreen && (
        <footer className={styles.pageDescription}>
          <p
            id="map-description"
            className="description-text"
            style={{ textAlign: 'center', color: '#666' }}
          >
            Basic deck.gl integration test - San Francisco 3D view
          </p>
        </footer>
      )}
    </div>
  );
}
