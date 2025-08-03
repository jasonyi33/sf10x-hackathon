/**
 * ==================================================================================
 * Dashboard Header Component
 * ==================================================================================
 *
 * Header component with title, stats, and sort controls
 */

import React from 'react';

const DashboardHeader = ({
  sortedDataLength,
  lastFetched,
  sortOrder,
  onSortToggle
}) => {
  return (
    <div style={{
      backgroundColor: '#1f2937',
      color: 'white',
      padding: '2rem 1rem',
      position: 'sticky',
      top: '0',
      zIndex: '10',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{
            margin: '0',
            fontSize: '2rem',
            fontWeight: '700'
          }}>
            🚨 SF Crime Data Dashboard
          </h1>
          <p style={{
            margin: '0.5rem 0 0 0',
            fontSize: '1rem',
            opacity: '0.9'
          }}>
            {sortedDataLength} recent incidents • Updated {lastFetched?.toLocaleTimeString()}
          </p>
        </div>

        <button
          onClick={onSortToggle}
          style={{
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#4338ca';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#4f46e5';
          }}
        >
          {sortOrder === 'newest' ? '🔄 Most Recent' : '🔄 Oldest First'}
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
