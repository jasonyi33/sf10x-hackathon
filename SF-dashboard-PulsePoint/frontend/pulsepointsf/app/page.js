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
    <>
      <div className={isFullScreen ? "container-fullscreen" : "container-normal"}>
        {/* Full-screen toggle button */}
        <button
          className={isFullScreen ? "toggle-btn-fullscreen" : "toggle-btn-normal"}
          onClick={toggleView}
          aria-label={isFullScreen ? "Exit full screen view" : "Enter full screen view"}
          title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
        >
          {isFullScreen ? "⌐ Exit Full Screen" : "⛶ Full Screen"}
        </button>

        {/* Reserved space for future controls (only in full-screen) */}
        {isFullScreen && (
          <div className="controls-reserved" aria-label="Map controls area">
            {/* Future: Zoom buttons, layer toggles, etc. */}
          </div>
        )}

        {/* Header (only in normal mode) */}
        {!isFullScreen && (
          <header className="page-header">
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
        <div className={isFullScreen ? "map-fullscreen" : "map-normal"}>
          <SanFrancisco3D isFullScreen={isFullScreen} />
        </div>

        {/* Footer (only in normal mode) */}
        {!isFullScreen && (
          <footer className="page-description">
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

      {/* CSS Styles */}
      <style jsx>{`
        /* Container Styles */
        .container-fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          padding: 12px;
          box-sizing: border-box;
          background: #1a1a1a;
          z-index: 1000;
        }

        .container-normal {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
        }

        /* Map Container Styles */
        .map-fullscreen {
          width: 100%;
          height: 100%;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .map-normal {
          width: 100%;
          height: 500px;
          margin: 20px 0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        /* Toggle Button Styles */
        .toggle-btn-fullscreen {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          padding: 12px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #333;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
          transition: all 0.2s ease;
          z-index: 1001;
        }

        .toggle-btn-fullscreen:hover {
          background: rgba(255, 255, 255, 1);
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        .toggle-btn-normal {
          position: absolute;
          top: 20px;
          right: 0px;
          background: #007bff;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          color: white;
          transition: all 0.2s ease;
        }

        .toggle-btn-normal:hover {
          background: #0056b3;
          transform: translateY(-1px);
        }

        /* Controls Reserved Area */
        .controls-reserved {
          position: fixed;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          width: 60px;
          height: 200px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          border: 2px dashed rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          z-index: 1001;
        }

        .controls-reserved::before {
          content: "Future\\AControls";
          white-space: pre;
          text-align: center;
        }

        /* Header and Footer Styles */
        .page-header {
          margin-bottom: 20px;
        }

        .page-description {
          margin-top: 20px;
        }

        /* Keyboard accessibility */
        .toggle-btn-fullscreen:focus,
        .toggle-btn-normal:focus {
          outline: 2px solid #007bff;
          outline-offset: 2px;
        }
      `}</style>
    </>
  );
}
