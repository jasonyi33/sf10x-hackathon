/**
 * ==================================================================================
 * Month Picker Component
 * ==================================================================================
 *
 * User-selectable month picker for year-over-year crime data comparison
 */

import React from 'react';
import { MONTHS, DEFAULT_COMPARISON_MONTH } from '../constants';

const MonthPicker = ({ selectedMonth = DEFAULT_COMPARISON_MONTH, onMonthChange }) => {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '1rem',
      marginBottom: '1.5rem',
      boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            📅 Compare Month:
          </span>
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(parseInt(e.target.value))}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              backgroundColor: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#1f2937',
              cursor: 'pointer',
              outline: 'none',
              minWidth: '120px'
            }}
          >
            {MONTHS.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#3b82f6',
              borderRadius: '2px'
            }}></div>
            <span>2025 Data</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#6b7280',
              borderRadius: '2px'
            }}></div>
            <span>2024 Data</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthPicker;
