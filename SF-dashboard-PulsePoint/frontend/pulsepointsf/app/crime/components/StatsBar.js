/**
 * ==================================================================================
 * Stats Bar Component
 * ==================================================================================
 *
 * Statistics bar with key metrics and category explorer toggle
 */

import React from 'react';

const StatsBar = ({
  sortedDataLength,
  visibleItems,
  sortOrder,
  showCategoryExplorer,
  onToggleCategoryExplorer
}) => {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '2rem',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
          {sortedDataLength}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Total Incidents
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
          {visibleItems}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Currently Showing
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
          {sortOrder === 'newest' ? '📅 Newest' : '📅 Oldest'}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Sort Order
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          onClick={onToggleCategoryExplorer}
          style={{
            backgroundColor: showCategoryExplorer ? '#10b981' : '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            justifyContent: 'center',
            width: '100%'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          {showCategoryExplorer ? '📁 Hide Categories' : '🔍 View All Categories'}
        </button>
      </div>
    </div>
  );
};

export default StatsBar;
