/**
 * ==================================================================================
 * SF Crime Data Display Page
 * ==================================================================================
 *
 * @fileoverview Displays the most recent 24 hours of SF crime data from DataSF API
 * @description Fetches and displays raw JSON crime incident data with basic formatting
 *
 * @author PulsePoint SF Team
 * @version 1.0.0
 * @since 2025-01-08
 *
 * @features
 * - Fetches last 24 hours of SF crime incidents
 * - Displays raw JSON data with proper formatting
 * - Loading states and error handling
 * - Refresh functionality
 * - Responsive design
 * ==================================================================================
 */

'use client';
import React, { useState, useEffect } from 'react';
import { useMotherDuckClientState } from '../../motherduck/context/motherduckClientContext';

export default function CrimePage() {
  // ================================================================================
  // STATE MANAGEMENT
  // ================================================================================

  /** @type {[Array|null, Function]} Crime data from MotherDuck */
  const [crimeData, setCrimeData] = useState(null);

  /** @type {[boolean, Function]} Loading state */
  const [isLoading, setIsLoading] = useState(true);

  /** @type {[string|null, Function]} Error state */
  const [error, setError] = useState(null);

  /** @type {[Date|null, Function]} Last fetch timestamp */
  const [lastFetched, setLastFetched] = useState(null);

  // Get MotherDuck client from context
  const { safeEvaluateQuery } = useMotherDuckClientState();

  // ================================================================================
  // DATA FETCHING
  // ================================================================================

  /**
   * Fetch recent crime data from MotherDuck
   */
  const fetchCrimeData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching recent SF crime data from MotherDuck...');

      // Calculate 24 hours ago timestamp
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      const dateFilter = twentyFourHoursAgo.toISOString().split('T')[0]; // YYYY-MM-DD format

      // SQL query for last 24 hours of crime data
      const query = `
        SELECT
          "Incident Datetime" as incident_datetime,
          "Incident Category" as incident_category,
          "Incident Description" as incident_description,
          Latitude as latitude,
          Longitude as longitude
        FROM sf_crime_stats.data
        WHERE
          Latitude IS NOT NULL
          AND Longitude IS NOT NULL
          AND "Incident Category" != 'Non-Criminal'
          AND "Incident Datetime" >= '${dateFilter}'
        ORDER BY "Incident Datetime" DESC
        LIMIT 500;
      `;

      console.log('Executing MotherDuck query:', query);

      const result = await safeEvaluateQuery(query);

      if (result.success) {
        // Convert MotherDuck result to JSON format
        const incidents = result.result.data.toRows().map((row) => ({
          incident_datetime: String(row.incident_datetime),
          incident_category: String(row.incident_category),
          incident_description: String(row.incident_description),
          latitude: Number(row.latitude) || 0,
          longitude: Number(row.longitude) || 0,
        }));

        console.log('Crime data fetched successfully from MotherDuck:', incidents.length, 'records');

        setCrimeData(incidents);
        setLastFetched(new Date());
      } else {
        throw new Error(result.error?.message || 'Failed to execute MotherDuck query');
      }

    } catch (err) {
      console.error('Failed to fetch crime data from MotherDuck:', err);
      setError(err.message || 'Failed to fetch crime data');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle manual refresh
   */
  const handleRefresh = () => {
    fetchCrimeData();
  };

  // ================================================================================
  // LIFECYCLE
  // ================================================================================

  // Fetch data on component mount
  useEffect(() => {
    fetchCrimeData();
  }, []);

  // ================================================================================
  // RENDER HELPERS
  // ================================================================================

  /**
   * Render loading state
   */
  const renderLoading = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '3rem',
      color: '#666'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f0f0f0',
        borderTop: '4px solid #007bff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '1rem'
      }}></div>
      <p>Loading SF crime data...</p>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  /**
   * Render error state
   */
  const renderError = () => (
    <div style={{
      padding: '2rem',
      textAlign: 'center',
      backgroundColor: '#fff5f5',
      border: '1px solid #fed7d7',
      borderRadius: '8px',
      margin: '1rem'
    }}>
      <h3 style={{ color: '#e53e3e', marginBottom: '1rem' }}>
        Error Loading Crime Data
      </h3>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        {error}
      </p>
      <button
        onClick={handleRefresh}
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
      >
        Try Again
      </button>
    </div>
  );

  /**
   * Render header with metadata
   */
  const renderHeader = () => (
    <div style={{
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '1.5rem',
      margin: '1rem',
      marginBottom: '1.5rem'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{
            margin: '0 0 0.5rem 0',
            color: '#212529',
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            SF Crime Data - Last 24 Hours
          </h2>
          <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
            <strong>Total Records:</strong> {crimeData?.length || 0}
            {lastFetched && (
              <>
                <br />
                <strong>Last Updated:</strong> {lastFetched.toLocaleString()}
              </>
            )}
            <br />
            <strong>Data Source:</strong> MotherDuck (sf_crime_stats database)
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isLoading}
          style={{
            backgroundColor: isLoading ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            whiteSpace: 'nowrap'
          }}
          onMouseOver={(e) => {
            if (!isLoading) e.target.style.backgroundColor = '#218838';
          }}
          onMouseOut={(e) => {
            if (!isLoading) e.target.style.backgroundColor = '#28a745';
          }}
        >
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );

  /**
   * Render JSON data with formatting
   */
  const renderData = () => (
    <div style={{
      margin: '1rem',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      {/* JSON Header */}
      <div style={{
        backgroundColor: '#343a40',
        color: 'white',
        padding: '0.75rem 1rem',
        fontSize: '0.875rem',
        fontWeight: '500'
      }}>
        Raw JSON Data ({crimeData?.length || 0} incidents)
      </div>

      {/* JSON Content */}
      <div style={{
        backgroundColor: '#f8f9fa',
        maxHeight: '70vh',
        overflow: 'auto',
        border: 'none'
      }}>
        <pre style={{
          margin: '0',
          padding: '1.5rem',
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
          fontSize: '12px',
          lineHeight: '1.5',
          color: '#212529',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {JSON.stringify(crimeData, null, 2)}
        </pre>
      </div>
    </div>
  );

  // ================================================================================
  // MAIN RENDER
  // ================================================================================

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: 'var(--font-geist-sans)',
      padding: '0',
      margin: '0'
    }}>
      {/* Page Header */}
      <div style={{
        backgroundColor: '#007bff',
        color: 'white',
        padding: '2rem 1rem',
        textAlign: 'center'
      }}>
        <h1 style={{
          margin: '0',
          fontSize: '2rem',
          fontWeight: '700'
        }}>
          San Francisco Crime Data Monitor
        </h1>
        <p style={{
          margin: '0.5rem 0 0 0',
          fontSize: '1.1rem',
          opacity: '0.9'
        }}>
          Real-time incident reports from SFPD (Last 24 Hours)
        </p>
      </div>

      {/* Content Area */}
      <div style={{ maxWidth: '100%' }}>
        {isLoading ? (
          renderLoading()
        ) : error ? (
          renderError()
        ) : crimeData ? (
          <>
            {renderHeader()}
            {renderData()}
          </>
        ) : (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: '#666'
          }}>
            No crime data available
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '1.5rem',
        textAlign: 'center',
        fontSize: '0.875rem',
        color: '#6c757d',
        borderTop: '1px solid #dee2e6',
        marginTop: '2rem'
      }}>
        <p style={{ margin: '0' }}>
          Data provided by{' '}
          <a
            href="https://data.sfgov.org/Public-Safety/Police-Department-Incident-Reports-2018-to-Present/wg3w-h783"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#007bff', textDecoration: 'none' }}
          >
            SF Open Data Portal
          </a>
          {' '}- SFPD Incident Reports (2018 to Present)
        </p>
      </div>
    </div>
  );
}

/**
 * ==================================================================================
 * TECHNICAL NOTES
 * ==================================================================================
 *
 * Data Source:
 * - MotherDuck (cloud DuckDB): sf_crime_stats.data table
 * - Uses SQL for efficient server-side filtering and processing
 * - Filters by Incident Datetime >= 24 hours ago
 * - Orders by Incident Datetime DESC (most recent first)
 * - Limits to 500 records for performance
 * - WebAssembly client runs locally in browser for optimal performance
 *
 * Performance Benefits vs Socrata API:
 * - Server-side SQL filtering reduces network traffic
 * - Only filtered results returned (not massive datasets)
 * - DuckDB's columnar analytics optimized for this workload
 * - No API rate limiting concerns
 * - Faster query execution on large datasets
 *
 * Performance Considerations:
 * - Client-side rendering only
 * - JSON data scrollable to handle large datasets
 * - Fixed height container to prevent page overflow
 * - Monospace font for readable JSON formatting
 * - WebAssembly initialization on first load
 *
 * Error Handling:
 * - MotherDuck connection failures
 * - SQL query errors
 * - WebAssembly compatibility issues
 * - User-friendly error messages with retry functionality
 *
 * Future Enhancements:
 * - Advanced SQL-based filtering and aggregations
 * - Time-series analysis with weekly binning
 * - Category-based statistics and charts
 * - Real-time dashboard updates
 * - Export functionality with SQL-based reports
 * ==================================================================================
 */
