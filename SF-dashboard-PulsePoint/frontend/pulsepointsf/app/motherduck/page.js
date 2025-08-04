/**
 * ==================================================================================
 * MotherDuck Connection Test & Logging Dashboard
 * ==================================================================================
 *
 * @fileoverview Test interface for MotherDuck connection with comprehensive logging
 * @description Provides real-time visibility into MotherDuck connection initialization,
 *              database discovery, and query execution with detailed error handling
 *
 * @author PulsePoint SF Team
 * @version 2.0.0
 * @since 2025-01-08
 *
 * @features
 * - Real-time MotherDuck connection status monitoring
 * - Comprehensive logging system with different log levels
 * - Token validation and environment variable checks
 * - Database and table discovery tools
 * - Interactive connection testing
 * - SF crime data query testing
 * - Error diagnosis and troubleshooting aids
 * ==================================================================================
 */

'use client';
import React, { useState, useEffect } from 'react';
/*
import { useMotherDuckClientState } from '../../motherduck/context/motherduckClientContext.js';
*/

export default function MotherDuckTestPage() {
  // ================================================================================
  // STATE MANAGEMENT
  // ================================================================================

  /** @type {[Array|null, Function]} Crime data from MotherDuck */
  const [crimeData, setCrimeData] = useState(null);

  /** @type {[boolean, Function]} Manual test loading state */
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  /** @type {[boolean, Function]} Crime data loading state */
  const [isFetchingCrimeData, setIsFetchingCrimeData] = useState(false);

  /** @type {[Date|null, Function]} Last fetch timestamp */
  const [lastFetched, setLastFetched] = useState(null);

  /** @type {[string, Function]} Expanded log section */
  const [expandedSection, setExpandedSection] = useState('connection');

  /** @type {[boolean, Function]} Write operation testing state */
  const [isTestingWrites, setIsTestingWrites] = useState(false);

  /** @type {[Array|null, Function]} Write test results */
  const [writeTestResults, setWriteTestResults] = useState(null);

  /*
  // Get MotherDuck client from context with all logging capabilities
  const {
    safeEvaluateQuery,
    connectionStatus,
    connectionError,
    connectionLogs,
    testConnection,
    clearLogs,
    tokenInfo
  } = useMotherDuckClientState();
  */

  // ================================================================================
  // CONNECTION TESTING METHODS
  // ================================================================================

  /**
   * Handle comprehensive connection test
   */
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      await testConnection();
    } catch (error) {
      console.error('Connection test failed:', error);
    } finally {
      setIsTestingConnection(false);
    }
  };

  /**
   * Fetch sample crime data for testing
   */
  const handleFetchCrimeData = async () => {
    setIsFetchingCrimeData(true);

    try {
      // Calculate 24 hours ago timestamp
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      const dateFilter = twentyFourHoursAgo.toISOString().split('T')[0];

      // Test different table variations
      const tableVariations = [
        'sf_crime_stats.data',
        'data',
        'crime_data',
        'incidents'
      ];

      let successfulQuery = null;
      let crimeResult = null;

      for (const tableName of tableVariations) {
        const query = `
          SELECT
            \\"Incident Datetime\\" as incident_datetime,
            \\"Incident Category\\" as incident_category,
            \\"Incident Description\\" as incident_description,
            Latitude as latitude,
            Longitude as longitude
          FROM ${tableName}
          WHERE
            Latitude IS NOT NULL
            AND Longitude IS NOT NULL
            AND \\"Incident Category\\" != 'Non-Criminal'
            AND \\"Incident Datetime\\" >= '${dateFilter}'
          ORDER BY \\"Incident Datetime\\" DESC
          LIMIT 100;
        `;

        const result = await safeEvaluateQuery(query);

        if (result.success) {
          successfulQuery = tableName;
          crimeResult = result;
          break;
        }
      }

      if (crimeResult && crimeResult.success) {
        // Convert MotherDuck result to JSON format
        const incidents = crimeResult.result.data.toRows().map((row) => ({
          incident_datetime: String(row.incident_datetime),
          incident_category: String(row.incident_category),
          incident_description: String(row.incident_description),
          latitude: Number(row.latitude) || 0,
          longitude: Number(row.longitude) || 0,
        }));

        setCrimeData(incidents);
        setLastFetched(new Date());
      }

    } catch (error) {
      console.error('Failed to fetch crime data:', error);
    } finally {
      setIsFetchingCrimeData(false);
    }
  };

  /**
   * Test write capabilities with permission discovery
   */
  const handleTestWriteCapabilities = async () => {
    setIsTestingWrites(true);
    setWriteTestResults(null);

    try {
      const testResults = [];
      const timestamp = Date.now();

      // Phase 1: Database Connection & Discovery
      testResults.push({
        operation: 'DATABASE CONNECTION',
        status: 'attempting',
        message: 'Connecting to my_db database'
      });

      const useDbQuery = `USE my_db`;
      const useDbResult = await safeEvaluateQuery(useDbQuery);

      if (useDbResult.success) {
        testResults[testResults.length - 1].status = 'success';
        testResults[testResults.length - 1].message = 'Successfully connected to my_db database';
      } else {
        testResults[testResults.length - 1].status = 'error';
        testResults[testResults.length - 1].message = `Failed to connect to my_db: ${useDbResult.error?.message || JSON.stringify(useDbResult.error) || 'Unknown error'}`;
        testResults[testResults.length - 1].errorDetail = useDbResult;
      }

      // Phase 2: Schema Discovery
      testResults.push({
        operation: 'SCHEMA DISCOVERY',
        status: 'attempting',
        message: 'Discovering tables in my_db.main schema'
      });

      const showTablesQuery = `SHOW TABLES FROM my_db.main`;
      const tablesResult = await safeEvaluateQuery(showTablesQuery);

      let existingTables = [];
      if (tablesResult.success) {
        try {
          existingTables = tablesResult.result.data.toRows();
          testResults[testResults.length - 1].status = 'success';
          testResults[testResults.length - 1].message = `Found ${existingTables.length} tables in my_db.main`;
          testResults[testResults.length - 1].data = existingTables;
        } catch (error) {
          testResults[testResults.length - 1].status = 'warning';
          testResults[testResults.length - 1].message = `Schema discovery completed but could not parse results: ${error.message}`;
        }
      } else {
        testResults[testResults.length - 1].status = 'warning';
        testResults[testResults.length - 1].message = `Could not list tables: ${tablesResult.error?.message || JSON.stringify(tablesResult.error) || 'Unknown error'}`;
        testResults[testResults.length - 1].errorDetail = tablesResult;
      }

      // Phase 3: Permission Testing (Start with least privileged)

      // Test 3a: Try TEMPORARY TABLE (most likely to work)
      testResults.push({
        operation: 'CREATE TEMPORARY TABLE',
        status: 'attempting',
        message: 'Testing temporary table creation permissions'
      });

      const tempTableName = `temp_test_${timestamp}`;
      const createTempQuery = `
        CREATE TEMPORARY TABLE ${tempTableName} (
          id INTEGER,
          test_data VARCHAR,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      const tempResult = await safeEvaluateQuery(createTempQuery);
      let workingTableName = null;

      if (tempResult.success) {
        testResults[testResults.length - 1].status = 'success';
        testResults[testResults.length - 1].message = 'Successfully created temporary table';
        workingTableName = tempTableName;
      } else {
        testResults[testResults.length - 1].status = 'error';
        testResults[testResults.length - 1].message = `Temporary table creation failed: ${tempResult.error?.message || JSON.stringify(tempResult.error) || 'Unknown error'}`;
        testResults[testResults.length - 1].errorDetail = tempResult;

        // Test 3b: Try MEMORY TABLE as fallback
        testResults.push({
          operation: 'CREATE MEMORY TABLE',
          status: 'attempting',
          message: 'Testing in-memory table creation as fallback'
        });

        const memTableName = `memory:test_mem_${timestamp}`;
        const createMemQuery = `
          CREATE TABLE ${memTableName} (
            id INTEGER,
            test_data VARCHAR,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;

        const memResult = await safeEvaluateQuery(createMemQuery);

        if (memResult.success) {
          testResults[testResults.length - 1].status = 'success';
          testResults[testResults.length - 1].message = 'Successfully created in-memory table';
          workingTableName = memTableName;
        } else {
          testResults[testResults.length - 1].status = 'error';
          testResults[testResults.length - 1].message = `Memory table creation failed: ${memResult.error?.message || JSON.stringify(memResult.error) || 'Unknown error'}`;
          testResults[testResults.length - 1].errorDetail = memResult;

          // Test 3c: Try regular table in my_db.main
          testResults.push({
            operation: 'CREATE TABLE',
            status: 'attempting',
            message: 'Testing regular table creation in my_db.main'
          });

          const regularTableName = `my_db.main.test_regular_${timestamp}`;
          const createRegularQuery = `
            CREATE TABLE ${regularTableName} (
              id INTEGER,
              test_data VARCHAR,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `;

          const regularResult = await safeEvaluateQuery(createRegularQuery);

          if (regularResult.success) {
            testResults[testResults.length - 1].status = 'success';
            testResults[testResults.length - 1].message = 'Successfully created regular table';
            workingTableName = regularTableName;
          } else {
            testResults[testResults.length - 1].status = 'error';
            testResults[testResults.length - 1].message = `Regular table creation failed: ${regularResult.error?.message || JSON.stringify(regularResult.error) || 'Unknown error'}`;
            testResults[testResults.length - 1].errorDetail = regularResult;
          }
        }
      }

      // Phase 4: If we have a working table, test write operations
      if (workingTableName) {
        // Test INSERT
        testResults.push({
          operation: 'INSERT',
          status: 'attempting',
          message: `Inserting test data into ${workingTableName}`
        });

        const insertQuery = `
          INSERT INTO ${workingTableName} (id, test_data)
          VALUES
            (1, 'Test write operation 1'),
            (2, 'Test write operation 2'),
            (3, 'Test write operation 3')
        `;

        const insertResult = await safeEvaluateQuery(insertQuery);

        if (insertResult.success) {
          testResults[testResults.length - 1].status = 'success';
          testResults[testResults.length - 1].message = 'Successfully inserted 3 test records';
        } else {
          testResults[testResults.length - 1].status = 'error';
          testResults[testResults.length - 1].message = `Failed to insert data: ${insertResult.error?.message || JSON.stringify(insertResult.error) || 'Unknown error'}`;
          testResults[testResults.length - 1].errorDetail = insertResult;
        }

        // Test SELECT (verify data)
        testResults.push({
          operation: 'SELECT',
          status: 'attempting',
          message: 'Reading back inserted data for verification'
        });

        const selectQuery = `SELECT * FROM ${workingTableName} ORDER BY id`;
        const selectResult = await safeEvaluateQuery(selectQuery);

        if (selectResult.success) {
          try {
            const rows = selectResult.result.data.toRows();
            testResults[testResults.length - 1].status = 'success';
            testResults[testResults.length - 1].message = `Successfully read ${rows.length} records back`;
            testResults[testResults.length - 1].data = rows;
          } catch (error) {
            testResults[testResults.length - 1].status = 'warning';
            testResults[testResults.length - 1].message = `Query succeeded but could not parse results: ${error.message}`;
          }
        } else {
          testResults[testResults.length - 1].status = 'error';
          testResults[testResults.length - 1].message = `Failed to read data: ${selectResult.error?.message || JSON.stringify(selectResult.error) || 'Unknown error'}`;
          testResults[testResults.length - 1].errorDetail = selectResult;
        }

        // Test UPDATE
        testResults.push({
          operation: 'UPDATE',
          status: 'attempting',
          message: 'Testing UPDATE operation'
        });

        const updateQuery = `
          UPDATE ${workingTableName}
          SET test_data = 'Updated: ' || test_data
          WHERE id = 1
        `;

        const updateResult = await safeEvaluateQuery(updateQuery);

        if (updateResult.success) {
          testResults[testResults.length - 1].status = 'success';
          testResults[testResults.length - 1].message = 'Successfully updated record';
        } else {
          testResults[testResults.length - 1].status = 'error';
          testResults[testResults.length - 1].message = `Failed to update data: ${updateResult.error?.message || JSON.stringify(updateResult.error) || 'Unknown error'}`;
          testResults[testResults.length - 1].errorDetail = updateResult;
        }

        // Clean up
        testResults.push({
          operation: 'DROP TABLE',
          status: 'attempting',
          message: `Cleaning up ${workingTableName}`
        });

        const dropQuery = `DROP TABLE ${workingTableName}`;
        const dropResult = await safeEvaluateQuery(dropQuery);

        if (dropResult.success) {
          testResults[testResults.length - 1].status = 'success';
          testResults[testResults.length - 1].message = 'Successfully cleaned up test table';
        } else {
          testResults[testResults.length - 1].status = 'warning';
          testResults[testResults.length - 1].message = `Table cleanup warning: ${dropResult.error?.message || JSON.stringify(dropResult.error) || 'Unknown error'}`;
          testResults[testResults.length - 1].errorDetail = dropResult;
        }
      } else {
        // No table creation permissions found
        testResults.push({
          operation: 'PERMISSION SUMMARY',
          status: 'error',
          message: 'No table creation permissions detected. Token appears to be read-only or has restricted permissions.'
        });
      }

      setWriteTestResults(testResults);

    } catch (error) {
      setWriteTestResults([{
        operation: 'WRITE_TEST',
        status: 'error',
        message: `Write test failed with exception: ${error.message}`,
        errorDetail: { name: error.name, message: error.message, stack: error.stack }
      }]);
    } finally {
      setIsTestingWrites(false);
    }
  };

  /**
   * Handle clearing logs
   */
  const handleClearLogs = () => {
    clearLogs();
    setCrimeData(null);
    setLastFetched(null);
    setWriteTestResults(null);
  };

  /**
   * Toggle expanded log section
   */
  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // ================================================================================
  // RENDER HELPERS
  // ================================================================================

  /**
   * Get connection status color and icon
   */
  const getConnectionStatusStyle = () => {
    switch (connectionStatus) {
      case 'connected':
        return { color: '#22c55e', icon: '✅', text: 'Connected' };
      case 'connecting':
        return { color: '#f59e0b', icon: '🔄', text: 'Connecting...' };
      case 'error':
        return { color: '#ef4444', icon: '❌', text: 'Error' };
      case 'disconnected':
        return { color: '#6b7280', icon: '⭕', text: 'Disconnected' };
      default:
        return { color: '#6b7280', icon: '⏳', text: 'Initializing...' };
    }
  };

  /**
   * Get log level color
   */
  const getLogLevelColor = (level) => {
    switch (level) {
      case 'success': return '#22c55e';
      case 'error': return '#ef4444';
      case 'warn': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  /**
   * Render connection status panel
   */
  const renderConnectionStatus = () => {
    const statusStyle = getConnectionStatusStyle();

    return (
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '1.5rem',
        margin: '1rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h3 style={{
            margin: '0',
            color: '#212529',
            fontSize: '1.2rem',
            fontWeight: '600'
          }}>
            🦆 MotherDuck Connection Status
          </h3>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '1rem',
            fontWeight: '500',
            color: statusStyle.color
          }}>
            <span>{statusStyle.icon}</span>
            <span>{statusStyle.text}</span>
          </div>
        </div>

        {/* Token Information */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div>
            <strong>Token Status:</strong>{' '}
            <span style={{ color: tokenInfo.hasToken ? '#22c55e' : '#ef4444' }}>
              {tokenInfo.hasToken ? '✅ Loaded' : '❌ Missing'}
            </span>
          </div>
          {tokenInfo.hasToken && (
            <>
              <div>
                <strong>Token Source:</strong> {tokenInfo.tokenSource}
              </div>
              <div>
                <strong>Token Preview:</strong>{' '}
                <code style={{
                  backgroundColor: '#e5e7eb',
                  padding: '0.25rem',
                  borderRadius: '4px',
                  fontSize: '0.875rem'
                }}>
                  {tokenInfo.tokenPreview}
                </code>
              </div>
            </>
          )}
        </div>

        {/* Connection Error */}
        {connectionError && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <strong style={{ color: '#dc2626' }}>Connection Error:</strong>
            <p style={{ margin: '0.5rem 0 0 0', color: '#991b1b' }}>
              {connectionError}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleTestConnection}
            disabled={isTestingConnection}
            style={{
              backgroundColor: isTestingConnection ? '#6b7280' : '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: isTestingConnection ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {isTestingConnection ? '🧪 Testing...' : '🧪 Test Connection'}
          </button>

          <button
            onClick={handleFetchCrimeData}
            disabled={isFetchingCrimeData || connectionStatus !== 'connected'}
            style={{
              backgroundColor: (isFetchingCrimeData || connectionStatus !== 'connected') ? '#6b7280' : '#10b981',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: (isFetchingCrimeData || connectionStatus !== 'connected') ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {isFetchingCrimeData ? '🔍 Fetching...' : '🔍 Test Crime Data'}
          </button>

          <button
            onClick={handleTestWriteCapabilities}
            disabled={isTestingWrites || connectionStatus !== 'connected'}
            style={{
              backgroundColor: (isTestingWrites || connectionStatus !== 'connected') ? '#6b7280' : '#8b5cf6',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: (isTestingWrites || connectionStatus !== 'connected') ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {isTestingWrites ? '✍️ Testing...' : '✍️ Test Write Ops'}
          </button>

          <button
            onClick={handleClearLogs}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            🗑️ Clear Logs
          </button>
        </div>
      </div>
    );
  };

  /**
   * Render logs section
   */
  const renderLogsSection = () => (
    <div style={{
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      margin: '1rem',
      overflow: 'hidden'
    }}>
      {/* Logs Header */}
      <div
        style={{
          backgroundColor: '#343a40',
          color: 'white',
          padding: '1rem',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
        onClick={() => toggleSection('logs')}
      >
        <h3 style={{ margin: '0', fontSize: '1.1rem', fontWeight: '600' }}>
          📋 Connection Logs ({connectionLogs.length})
        </h3>
        <span style={{ fontSize: '1.2rem' }}>
          {expandedSection === 'logs' ? '🔽' : '▶️'}
        </span>
      </div>

      {/* Logs Content */}
      {expandedSection === 'logs' && (
        <div style={{
          maxHeight: '400px',
          overflow: 'auto',
          backgroundColor: '#1f2937',
          color: '#f9fafb'
        }}>
          {connectionLogs.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#9ca3af'
            }}>
              No logs yet. Connection will initialize automatically.
            </div>
          ) : (
            <div style={{ padding: '1rem' }}>
              {connectionLogs.map((log, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '0.5rem',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    backgroundColor: log.level === 'error' ? '#7f1d1d' :
                                   log.level === 'warn' ? '#78350f' :
                                   log.level === 'success' ? '#14532d' : '#374151',
                    borderLeft: `4px solid ${getLogLevelColor(log.level)}`
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.875rem',
                        color: getLogLevelColor(log.level),
                        fontWeight: '500',
                        marginBottom: '0.25rem'
                      }}>
                        [{log.level.toUpperCase()}] {log.message}
                      </div>
                      {log.details && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#d1d5db',
                          marginTop: '0.25rem',
                          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace'
                        }}>
                          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                        </div>
                      )}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                      whiteSpace: 'nowrap'
                    }}>
                      {log.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  /**
   * Render write test results section
   */
  const renderWriteTestSection = () => (
    <div style={{
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      margin: '1rem',
      overflow: 'hidden'
    }}>
      {/* Write Test Header */}
      <div
        style={{
          backgroundColor: '#8b5cf6',
          color: 'white',
          padding: '1rem',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
        onClick={() => toggleSection('writeTest')}
      >
        <h3 style={{ margin: '0', fontSize: '1.1rem', fontWeight: '600' }}>
          ✍️ Write Capabilities Test Results {writeTestResults && `(${writeTestResults.length} operations)`}
        </h3>
        <span style={{ fontSize: '1.2rem' }}>
          {expandedSection === 'writeTest' ? '🔽' : '▶️'}
        </span>
      </div>

      {/* Write Test Content */}
      {expandedSection === 'writeTest' && (
        <div>
          {writeTestResults ? (
            <>
              {/* Test Summary */}
              <div style={{
                padding: '1rem',
                backgroundColor: '#faf5ff',
                borderBottom: '1px solid #e9d5ff'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <strong>Total Operations:</strong> {writeTestResults.length}
                  </div>
                  <div>
                    <strong>Successful:</strong>{' '}
                    <span style={{ color: '#22c55e' }}>
                      {writeTestResults.filter(r => r.status === 'success').length}
                    </span>
                  </div>
                  <div>
                    <strong>Failed:</strong>{' '}
                    <span style={{ color: '#ef4444' }}>
                      {writeTestResults.filter(r => r.status === 'error').length}
                    </span>
                  </div>
                  <div>
                    <strong>Token Type:</strong>{' '}
                    <span style={{
                      color: tokenInfo.tokenSource.includes('read-write') ? '#22c55e' : '#f59e0b',
                      fontWeight: '600'
                    }}>
                      {tokenInfo.tokenSource.includes('read-write') ? '✅ Read-Write' : '⚠️ Read-Only'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Test Results */}
              <div style={{
                maxHeight: '500px',
                overflow: 'auto',
                backgroundColor: '#1f2937'
              }}>
                <div style={{ padding: '1rem' }}>
                  {writeTestResults.map((test, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: '1rem',
                        padding: '1rem',
                        borderRadius: '6px',
                        backgroundColor: test.status === 'success' ? '#14532d' :
                                       test.status === 'error' ? '#7f1d1d' :
                                       test.status === 'warning' ? '#78350f' : '#374151',
                        borderLeft: `4px solid ${
                          test.status === 'success' ? '#22c55e' :
                          test.status === 'error' ? '#ef4444' :
                          test.status === 'warning' ? '#f59e0b' : '#6b7280'
                        }`
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{
                          fontSize: '1rem',
                          color: test.status === 'success' ? '#22c55e' :
                                test.status === 'error' ? '#ef4444' :
                                test.status === 'warning' ? '#f59e0b' : '#6b7280'
                        }}>
                          {test.status === 'success' ? '✅' :
                           test.status === 'error' ? '❌' :
                           test.status === 'warning' ? '⚠️' : '⏳'}
                        </span>
                        <strong style={{
                          color: '#f9fafb',
                          fontSize: '0.875rem'
                        }}>
                          {test.operation}
                        </strong>
                      </div>

                      <div style={{
                        color: '#d1d5db',
                        fontSize: '0.875rem',
                        marginBottom: test.data ? '0.5rem' : '0'
                      }}>
                        {test.message}
                      </div>

                      {test.data && (
                        <div style={{
                          backgroundColor: '#111827',
                          padding: '0.75rem',
                          borderRadius: '4px',
                          marginTop: '0.5rem'
                        }}>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#9ca3af',
                            marginBottom: '0.5rem'
                          }}>
                            Retrieved Data:
                          </div>
                          <pre style={{
                            margin: '0',
                            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
                            fontSize: '0.75rem',
                            color: '#f9fafb',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {JSON.stringify(test.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <p>No write test results yet.</p>
              <p style={{ fontSize: '0.875rem', marginTop: '1rem' }}>
                Click "✍️ Test Write Ops" above to test CREATE, INSERT, UPDATE, and DROP operations.
              </p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#9ca3af' }}>
                This will verify that the read-write token is working properly.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  /**
   * Render crime data section
   */
  const renderCrimeDataSection = () => (
    <div style={{
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      margin: '1rem',
      overflow: 'hidden'
    }}>
      {/* Crime Data Header */}
      <div
        style={{
          backgroundColor: '#059669',
          color: 'white',
          padding: '1rem',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
        onClick={() => toggleSection('crimeData')}
      >
        <h3 style={{ margin: '0', fontSize: '1.1rem', fontWeight: '600' }}>
          🚨 SF Crime Data Test Results {crimeData && `(${crimeData.length} records)`}
        </h3>
        <span style={{ fontSize: '1.2rem' }}>
          {expandedSection === 'crimeData' ? '🔽' : '▶️'}
        </span>
      </div>

      {/* Crime Data Content */}
      {expandedSection === 'crimeData' && (
        <div>
          {crimeData ? (
            <>
              {/* Metadata */}
              <div style={{
                padding: '1rem',
                backgroundColor: '#ecfdf5',
                borderBottom: '1px solid #d1fae5'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <strong>Total Records:</strong> {crimeData.length}
                  </div>
                  {lastFetched && (
                    <div>
                      <strong>Last Fetched:</strong> {lastFetched.toLocaleString()}
                    </div>
                  )}
                  <div>
                    <strong>Query Success:</strong> <span style={{ color: '#22c55e' }}>✅ Success</span>
                  </div>
                </div>
              </div>

              {/* JSON Data */}
              <div style={{
                maxHeight: '500px',
                overflow: 'auto',
                backgroundColor: '#1f2937'
              }}>
                <pre style={{
                  margin: '0',
                  padding: '1.5rem',
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  color: '#f9fafb',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {JSON.stringify(crimeData, null, 2)}
                </pre>
              </div>
            </>
          ) : (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <p>No crime data loaded yet.</p>
              <p style={{ fontSize: '0.875rem', marginTop: '1rem' }}>
                Click "🔍 Test Crime Data" above to fetch sample crime incidents from MotherDuck.
              </p>
            </div>
          )}
        </div>
      )}
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
        backgroundColor: '#1f2937',
        color: 'white',
        padding: '2rem 1rem',
        textAlign: 'center'
      }}>
        <h1 style={{
          margin: '0',
          fontSize: '2rem',
          fontWeight: '700'
        }}>
          🦆 MotherDuck Connection Test Dashboard
        </h1>
        <p style={{
          margin: '0.5rem 0 0 0',
          fontSize: '1.1rem',
          opacity: '0.9'
        }}>
          Real-time connection monitoring & SF crime data testing
        </p>
      </div>

      {/* Dashboard Content */}
      <div style={{ maxWidth: '100%' }}>
        {/* Connection Status Panel */}
        {renderConnectionStatus()}

        {/* Logs Section */}
        {renderLogsSection()}

        {/* Write Test Section */}
        {renderWriteTestSection()}

        {/* Crime Data Section */}
        {renderCrimeDataSection()}
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
          MotherDuck Connection Testing Dashboard - Built for debugging and monitoring database connectivity
        </p>
        <p style={{ margin: '0.5rem 0 0 0' }}>
          Data source:{' '}
          <a
            href="https://data.sfgov.org/Public-Safety/Police-Department-Incident-Reports-2018-to-Present/wg3w-h783"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#007bff', textDecoration: 'none' }}
          >
            SF Open Data Portal
          </a>
          {' '}— SFPD Incident Reports (2018 to Present)
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
 * - DuckDB columnar analytics optimized for this workload
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
