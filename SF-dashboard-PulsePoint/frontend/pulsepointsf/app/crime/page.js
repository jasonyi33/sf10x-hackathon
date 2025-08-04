'use client';
import React, { useState, useMemo, useCallback } from 'react';

import { useCrimeData } from '../../lib/hooks/useCrimeData.js';
import { INITIAL_VISIBLE_ITEMS, ITEMS_PER_LOAD, SCROLL_THRESHOLD, CRIME_CATEGORIES } from './constants.js';
import {
  processCategoryGroupChartData,
  processTimeChartData,
  processDayOfWeekChartData,
  processResolutionChartData,
  processCategoryExplorerData
} from './utils.js';

import DashboardHeader from './components/DashboardHeader.js';
import StatsBar from './components/StatsBar.js';
import CategoryExplorer from './components/CategoryExplorer.js';
import ChartsSection from './components/ChartsSection.js';
import CrimeCard from './components/CrimeCard.js';
import SanFrancisco3D from '../components/SanFrancisco3D.js';

function getAllCategories() {
  return Array.from(
    new Set(
      Object.values(CRIME_CATEGORIES).flat()
    )
  );
}

const DEFAULT_CATEGORY = 'Assault';

export default function CrimeDataDashboard() {
  // Shared crime data (global cache)
  const { crimeData, isLoading, error, lastFetched, refetch } = useCrimeData();

  // Dashboard state
  const [sortOrder, setSortOrder] = useState('newest');
  const [visibleItems, setVisibleItems] = useState(INITIAL_VISIBLE_ITEMS);
  const [showCategoryExplorer, setShowCategoryExplorer] = useState(false);

  // 3D map state
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORY);

  // Data processing
  const sortedData = useMemo(() => {
    if (!crimeData) return [];
    const sorted = [...crimeData].sort((a, b) => {
      const dateA = new Date(a.incident_datetime);
      const dateB = new Date(b.incident_datetime);
      return sortOrder === 'newest'
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
    });
    return sorted;
  }, [crimeData, sortOrder]);

  const visibleData = useMemo(() => sortedData.slice(0, visibleItems), [sortedData, visibleItems]);

  const categoryExplorerData = useMemo(() =>
    processCategoryExplorerData(sortedData), [sortedData]);

  const categoryGroupChartData = useMemo(() =>
    processCategoryGroupChartData(categoryExplorerData), [categoryExplorerData]);

  const timeChartData = useMemo(() =>
    processTimeChartData(sortedData), [sortedData]);

  const dayOfWeekChartData = useMemo(() =>
    processDayOfWeekChartData(sortedData), [sortedData]);

  const resolutionChartData = useMemo(() =>
    processResolutionChartData(sortedData), [sortedData]);

  // Event handlers
  const handleSortToggle = useCallback(() => {
    setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest');
  }, []);

  const loadMoreItems = useCallback(() => {
    setVisibleItems(prev => Math.min(prev + ITEMS_PER_LOAD, sortedData.length));
  }, [sortedData.length]);

  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
    if (scrollPercentage > SCROLL_THRESHOLD && visibleItems < sortedData.length) {
      loadMoreItems();
    }
  }, [visibleItems, sortedData.length, loadMoreItems]);

  const handleToggleCategoryExplorer = useCallback(() => {
    setShowCategoryExplorer(prev => !prev);
  }, []);

  const handleCategorySelect = useCallback((category) => {
    setSelectedCategory(category);
  }, []);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // Loading & error states
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

  // Main render
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

      {/* 3D Map and Category Selector at Top */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem 0 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          marginBottom: '1rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#111827',
            margin: 0
          }}>
            🌐 3D Crime Clusters
          </h2>
          <label htmlFor="category-select" style={{ fontWeight: 500, fontSize: 15, color: '#222' }}>
            Category:
          </label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={e => handleCategorySelect(e.target.value)}
            style={{
              padding: '8px',
              borderRadius: 4,
              border: '1px solid #d1d5db',
              fontSize: 15,
              background: 'white',
              color: '#222',
              fontWeight: 500,
              minWidth: 180
            }}
          >
            {getAllCategories().map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <span style={{ fontSize: 13, color: '#666', marginLeft: 8 }}>
            {crimeData
              ? `${crimeData.filter(d => d.incident_category === selectedCategory).length} incidents`
              : "Loading..."}
          </span>
        </div>
        <div style={{
          width: '100%',
          height: '500px',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
          position: 'relative'
        }}>
          <SanFrancisco3D
            isFullScreen={false}
            crimeData={sortedData}
            selectedCategory={selectedCategory}
            showCrimeClusters={true}
          />
        </div>
      </div>

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
          categoryGroupChartData={categoryGroupChartData}
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
          </div>
        )}
      </div>
    </div>
  );
}
