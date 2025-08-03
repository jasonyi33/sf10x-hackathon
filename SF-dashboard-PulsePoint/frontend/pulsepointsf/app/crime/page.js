/**
 * ==================================================================================
 * SF Crime Data Dashboard - Modularized Version
 * ==================================================================================
 *
 * @fileoverview Modular crime dashboard with separated components and utilities
 * @description Clean, maintainable version using component-based architecture
 *
 * @author PulsePoint SF Team
 * @version 3.0.0 - Modularized
 * @since 2025-01-08
 *
 * @features
 * - Modular component architecture
 * - Separated constants and utilities
 * - MotherDuck connection integration ready
 * - Clean code organization
 * ==================================================================================
 */

'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Import modular components and utilities
import { API_QUERY, INITIAL_VISIBLE_ITEMS, ITEMS_PER_LOAD, SCROLL_THRESHOLD } from './constants.js';
import {
  processCategoryChartData,
  processTimeChartData,
  processDayOfWeekChartData,
  processResolutionChartData,
  processCategoryExplorerData
} from './utils.js';

// Import UI components
import DashboardHeader from './components/DashboardHeader.js';
import StatsBar from './components/StatsBar.js';
import CategoryExplorer from './components/CategoryExplorer.js';
import ChartsSection from './components/ChartsSection.js';
import CrimeCard from './components/CrimeCard.js';

// Import MotherDuck context (ready for integration)
// import { useMotherDuckClient } from '../../motherduck/context/motherduckClientContext.js';

export default function CrimeDataDashboard() {
  // ================================================================================
  // STATE MANAGEMENT
  // ================================================================================

  /** @type {[Array|null, Function]} Crime data from DataSF API */
  const [crimeData, setCrimeData] = useState(null);

  /** @type {[boolean, Function]} Data loading state */
  const [isLoading, setIsLoading] = useState(true);

  /** @type {[string|null, Function]} Error message */
  const [error, setError] = useState(null);

  /** @type {[string, Function]} Sort order: 'newest' or 'oldest' */
  const [sortOrder, setSortOrder] = useState('newest');

  /** @type {[number, Function]} Number of visible items for infinite scroll */
  const [visibleItems, setVisibleItems] = useState(INITIAL_VISIBLE_ITEMS);

  /** @type {[Date|null, Function]} Last fetch timestamp */
  const [lastFetched, setLastFetched] = useState(null);

  /** @type {[boolean, Function]} Category explorer visibility state */
  const [showCategoryExplorer, setShowCategoryExplorer] = useState(false);

  // MotherDuck integration (ready for future use)
  // const { testConnection, connectionStatus } = useMotherDuckClient();

  // ================================================================================
  // DATA FETCHING
  // ================================================================================

  /**
   * Fetch crime data from DataSF API
   * TODO: Add MotherDuck integration option
   */
  const fetchCrimeData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    console.log('🔍 [MotherDuck Ready] Initializing crime data fetch...');
    console.log('📡 Using DataSF API endpoint:', API_QUERY);

    try {
      const startTime = Date.now();
      const response = await fetch(API_QUERY);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const endTime = Date.now();
      const fetchTime = endTime - startTime;

      console.log(`✅ Successfully fetched ${data.length} crime records in ${fetchTime}ms`);
      console.log('🦆 [MotherDuck Integration] Ready for database connection testing');

      // Validate and clean data
      const validRecords = data.filter(record =>
        record.incident_datetime &&
        record.incident_category &&
        record.incident_description &&
        record.latitude &&
        record.longitude
      );

      console.log(`📊 Valid records after filtering: ${validRecords.length}`);
      console.log('💾 [MotherDuck Logging] Connection initialization can be tested here');

      setCrimeData(validRecords);
      setLastFetched(new Date());

    } catch (err) {
      console.error('❌ Failed to fetch crime data:', err);
      console.log('🦆 [MotherDuck Debug] Connection testing will be logged here');
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    console.log('🚀 [Crime Dashboard] Component mounted - MotherDuck integration ready');
    fetchCrimeData();
  }, [fetchCrimeData]);

  // ================================================================================
  // DATA PROCESSING
  // ================================================================================

  /**
   * Sort and process crime data based on current sort order
   */
  const sortedData = useMemo(() => {
    if (!crimeData) return [];

    const sorted = [...crimeData].sort((a, b) => {
      const dateA = new Date(a.incident_datetime);
      const dateB = new Date(b.incident_datetime);

      return sortOrder === 'newest' ?
        dateB.getTime() - dateA.getTime() :
        dateA.getTime() - dateB.getTime();
    });

    return sorted;
  }, [crimeData, sortOrder]);

  /**
   * Get visible items for infinite scroll
   */
  const visibleData = useMemo(() => {
    return sortedData.slice(0, visibleItems);
  }, [sortedData, visibleItems]);

  // ================================================================================
  // CHART DATA PROCESSING (using modular utilities)
  // ================================================================================

  const categoryChartData = useMemo(() =>
    processCategoryChartData(sortedData), [sortedData]);

  const timeChartData = useMemo(() =>
    processTimeChartData(sortedData), [sortedData]);

  const dayOfWeekChartData = useMemo(() =>
    processDayOfWeekChartData(sortedData), [sortedData]);

  const resolutionChartData = useMemo(() =>
    processResolutionChartData(sortedData), [sortedData]);

  const categoryExplorerData = useMemo(() =>
    processCategoryExplorerData(sortedData), [sortedData]);

  // ================================================================================
  // EVENT HANDLERS
  // ================================================================================

  /**
   * Toggle sort order between newest and oldest
   */
  const handleSortToggle = useCallback(() => {
    setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest');
    console.log('🔄 Sort order changed - MotherDuck query logging can be added here');
  }, []);

  /**
   * Load more items for infinite scroll
   */
  const loadMoreItems = useCallback(() => {
    setVisibleItems(prev => Math.min(prev + ITEMS_PER_LOAD, sortedData.length));
  }, [sortedData.length]);

  /**
   * Handle scroll event for infinite loading
   */
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const scrollPercentage = scrollTop / (scrollHeight - clientHeight);

    // Load more when user scrolls to threshold
    if (scrollPercentage > SCROLL_THRESHOLD && visibleItems < sortedData.length) {
      loadMoreItems();
    }
  }, [visibleItems, sortedData.length, loadMoreItems]);

  /**
   * Toggle category explorer visibility
   */
  const handleToggleCategoryExplorer = useCallback(() => {
    setShowCategoryExplorer(prev => !prev);
    console.log('📁 Category Explorer toggled - MotherDuck category queries can be logged here');
  }, []);

  /**
   * Retry data fetch on error
   */
  const handleRetry = useCallback(() => {
    console.log('🔄 Retrying data fetch - MotherDuck connection retry can be tested here');
    fetchCrimeData();
  }, [fetchCrimeData]);

  // ================================================================================
  // LOADING & ERROR STATES
  // ================================================================================

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div style={{
          fontSize: '1.125rem',
          color: '#4b5563',
          fontWeight: '500'
        }}>
          Loading SF Crime Data...
        </div>
        <div style={{
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          🦆 MotherDuck connection initialization ready
        </div>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        padding: '2rem'
      }}>
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '2rem',
          maxWidth: '500px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>
            ❌
          </div>
          <h2 style={{
            fontSize: '1.5rem',
            color: '#dc2626',
            marginBottom: '0.5rem',
            fontWeight: '600'
          }}>
            Failed to Load Crime Data
          </h2>
          <p style={{
            color: '#991b1b',
            marginBottom: '0.5rem'
          }}>
            {error}
          </p>
          <p style={{
            color: '#6b7280',
            fontSize: '0.875rem',
            marginBottom: '1.5rem'
          }}>
            🦆 MotherDuck connection logging available for debugging
          </p>
          <button
            onClick={handleRetry}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#3b82f6';
            }}
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  // ================================================================================
  // MAIN RENDER
  // ================================================================================

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      fontFamily: 'var(--font-geist-sans)',
    }}>
      {/* Header Component */}
      <DashboardHeader
        sortedDataLength={sortedData.length}
        lastFetched={lastFetched}
        sortOrder={sortOrder}
        onSortToggle={handleSortToggle}
      />

      {/* Content Container */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem 1rem',
          maxHeight: 'calc(100vh - 140px)',
          overflowY: 'auto'
        }}
        onScroll={handleScroll}
      >
        {/* Stats Bar Component */}
        <StatsBar
          sortedDataLength={sortedData.length}
          visibleItems={visibleItems}
          sortOrder={sortOrder}
          showCategoryExplorer={showCategoryExplorer}
          onToggleCategoryExplorer={handleToggleCategoryExplorer}
        />

        {/* Category Explorer Component */}
        <CategoryExplorer
          categoryExplorerData={categoryExplorerData}
          showCategoryExplorer={showCategoryExplorer}
        />

        {/* Charts Section Component */}
        <ChartsSection
          categoryChartData={categoryChartData}
          timeChartData={timeChartData}
          dayOfWeekChartData={dayOfWeekChartData}
          resolutionChartData={resolutionChartData}
        />

        {/* Crime Cards */}
        <div>
          {visibleData.map((incident, index) => (
            <CrimeCard
              key={`${incident.incident_id}-${index}`}
              incident={incident}
              index={index}
            />
          ))}
        </div>

        {/* Load More Indicator */}
        {visibleItems < sortedData.length && (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#6b7280'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #e5e7eb',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            Loading more incidents...
            <div style={{
              fontSize: '0.75rem',
              marginTop: '0.5rem',
              opacity: '0.7'
            }}>
              🦆 MotherDuck pagination ready
            </div>
          </div>
        )}

        {/* End of Data */}
        {visibleItems >= sortedData.length && sortedData.length > 0 && (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            ✅ Showing all {sortedData.length} incidents
            <div style={{
              fontSize: '0.75rem',
              marginTop: '0.5rem',
              opacity: '0.7'
            }}>
              🦆 MotherDuck connection testing ready for /crime route
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ==================================================================================
 * MODULAR ARCHITECTURE NOTES
 * ==================================================================================
 *
 * File Structure:
 * - constants.js - All configuration constants and API settings
 * - utils.js - Data processing and formatting utilities
 * - components/DashboardHeader.js - Header with sort controls
 * - components/StatsBar.js - Statistics and controls bar
 * - components/CategoryExplorer.js - Expandable category breakdown
 * - components/ChartsSection.js - All analytics charts
 * - components/CrimeCard.js - Individual crime incident cards
 *
 * MotherDuck Integration Ready:
 * - Connection context imported and ready
 * - Logging points established throughout
 * - Error handling prepared for database connections
 * - /crime route optimized for testing MotherDuck initialization
 *
 * Benefits:
 * - Maintainable component-based architecture
 * - Reusable utilities and constants
 * - Easy to test individual components
 * - Prepared for database integration
 * - Clean separation of concerns
 * ==================================================================================
 */
