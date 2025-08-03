/**
 * ==================================================================================
 * Crime Card Component
 * ==================================================================================
 *
 * Individual crime incident card display component
 */

import React from 'react';
import { getCategoryColor, formatDateTime } from '../utils.js';

const CrimeCard = ({ incident, index }) => {
  return (
    <div
      key={`${incident.incident_id}-${index}`}
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '1.25rem',
        marginBottom: '1rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        transition: 'box-shadow 0.2s ease',
        cursor: 'default'
      }}
      onMouseEnter={(e) => {
        e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.target.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
      }}
    >
      {/* Header: Category Badge + DateTime */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '0.75rem',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <span style={{
          backgroundColor: getCategoryColor(incident.incident_category),
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: '0.025em'
        }}>
          {incident.incident_category}
        </span>

        <span style={{
          fontSize: '0.875rem',
          color: '#6b7280',
          fontWeight: '500'
        }}>
          {formatDateTime(incident.incident_datetime)}
        </span>
      </div>

      {/* Description */}
      <div style={{
        fontSize: '1rem',
        color: '#1f2937',
        fontWeight: '500',
        marginBottom: '0.75rem',
        lineHeight: '1.5'
      }}>
        {incident.incident_description}
      </div>

      {/* Location Info */}
      <div style={{
        fontSize: '0.875rem',
        color: '#4b5563',
        marginBottom: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <span>📍</span>
        <span style={{ fontWeight: '500' }}>
          {incident.analysis_neighborhood || 'Unknown Neighborhood'}
        </span>
        {incident.intersection && (
          <>
            <span>•</span>
            <span>{incident.intersection}</span>
          </>
        )}
      </div>

      {/* Administrative Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.75rem',
        color: '#6b7280',
        paddingTop: '0.5rem',
        borderTop: '1px solid #f3f4f6',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span>ID: {incident.incident_id}</span>
          <span>District: {incident.police_district || 'Unknown'}</span>
        </div>

        {incident.resolution && (
          <span style={{
            backgroundColor: incident.resolution === 'Open or Active' ? '#fef3c7' : '#dcfce7',
            color: incident.resolution === 'Open or Active' ? '#92400e' : '#166534',
            padding: '0.125rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: '500'
          }}>
            {incident.resolution}
          </span>
        )}
      </div>
    </div>
  );
};

export default CrimeCard;
