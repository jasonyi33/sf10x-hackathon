"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import 'core-js/actual/promise/with-resolvers';

// ================================================================================
// MotherDuck Connection Context with Enhanced Logging
// ================================================================================

export const MotherDuckContext = createContext(null);

export function MotherDuckClientProvider({ children, database }) {
  // ================================================================================
  // State Management
  // ================================================================================

  const [connectionStatus, setConnectionStatus] = useState('initializing');
  const [connectionError, setConnectionError] = useState(null);
  const [connectionLogs, setConnectionLogs] = useState([]);
  const [tokenInfo, setTokenInfo] = useState({
    hasToken: false,
    tokenPreview: '',
    tokenSource: ''
  });

  const connectionRef = useRef();
  const mdConnectionRef = useRef();

  if (connectionRef.current === undefined) {
    connectionRef.current = Promise.withResolvers();
  }

  // ================================================================================
  // Logging System
  // ================================================================================

  const addLog = (level, message, details = null) => {
    const logEntry = {
      timestamp: new Date(),
      level,
      message,
      details
    };

    setConnectionLogs(prev => [...prev, logEntry]);

    // Also log to console with proper formatting
    const timestamp = logEntry.timestamp.toISOString().substring(11, 23);
    const prefix = `[${timestamp}] [MotherDuck] [${level.toUpperCase()}]`;

    switch (level) {
      case 'error':
        console.error(prefix, message, details || '');
        break;
      case 'warn':
        console.warn(prefix, message, details || '');
        break;
      case 'success':
        console.log(`%c${prefix} ${message}`, 'color: #22c55e', details || '');
        break;
      default:
        console.log(prefix, message, details || '');
    }
  };

  const clearLogs = () => {
    setConnectionLogs([]);
    addLog('info', 'Logs cleared');
  };

  // ================================================================================
  // Token Management
  // ================================================================================

  const loadTokenInfo = () => {
    addLog('info', 'Loading MotherDuck token from environment...');

    let token = null;
    let source = '';

    // Prioritize read-write token for full database capabilities
    if (process.env.NEXT_PUBLIC_DUCK_WRITE_READ_TOKEN) {
      token = process.env.NEXT_PUBLIC_DUCK_WRITE_READ_TOKEN;
      source = 'NEXT_PUBLIC_DUCK_WRITE_READ_TOKEN (read-write)';
      addLog('success', 'Found read-write token in environment');
    }
    // Fallback to read-only token if write token not available
    else if (process.env.NEXT_PUBLIC_DUCK_READ_TOKEN) {
      token = process.env.NEXT_PUBLIC_DUCK_READ_TOKEN;
      source = 'NEXT_PUBLIC_DUCK_READ_TOKEN (read-only)';
      addLog('warn', 'Using read-only token (read-write token not found)');
    }

    if (!token) {
      addLog('error', 'No MotherDuck token found in environment variables');
      addLog('error', 'Expected: NEXT_PUBLIC_DUCK_READ_TOKEN or NEXT_PUBLIC_DUCK_WRITE_READ_TOKEN');
      return null;
    }

    const tokenPreview = token.substring(0, 20) + '...' + token.substring(token.length - 10);
    addLog('info', `Token preview: ${tokenPreview}`);
    addLog('info', `Token source: ${source}`);

    setTokenInfo({
      hasToken: true,
      tokenPreview,
      tokenSource: source
    });

    return token;
  };

  // ================================================================================
  // Connection Management
  // ================================================================================

  const initializeConnection = async () => {
    try {
      addLog('info', '🦆 Starting MotherDuck Connection Initialization');
      addLog('info', '='.repeat(50));

      setConnectionStatus('connecting');
      setConnectionError(null);

      // Step 1: Load and validate token
      addLog('info', '📋 Step 1: Loading token from environment');
      const token = loadTokenInfo();

      if (!token) {
        throw new Error('No MotherDuck token available');
      }

      // Step 2: Check WebAssembly support
      addLog('info', '🔧 Step 2: Checking WebAssembly support');
      if (typeof WebAssembly === 'undefined') {
        throw new Error('WebAssembly not supported in this browser');
      }
      addLog('success', 'WebAssembly support confirmed');

      // Step 3: Initialize MotherDuck WebAssembly client
      addLog('info', '🚀 Step 3: Loading MotherDuck WebAssembly client');

      // Dynamic import of MotherDuck client
      let MDConnection;
      try {
        const motherduckModule = await import('@motherduck/wasm-client');
        MDConnection = motherduckModule.MDConnection;
        addLog('success', 'MotherDuck WebAssembly module loaded successfully');
      } catch (importError) {
        addLog('error', 'Failed to import MotherDuck WebAssembly client', importError.message);
        throw new Error(`Failed to load MotherDuck client: ${importError.message}`);
      }

      // Step 4: Create connection
      addLog('info', '🔗 Step 4: Creating MotherDuck connection');

      const connection = await MDConnection.create({
        motherduckToken: token,
        database: database || undefined
      });

      mdConnectionRef.current = connection;
      addLog('success', 'MotherDuck connection created successfully');

      if (database) {
        addLog('info', `Connected to database: ${database}`);
      }

      // Step 5: Test basic connectivity
      addLog('info', '🧪 Step 5: Testing basic connectivity');

      try {
        const testResult = await connection.evaluateQuery('SELECT 1 as test_connection');
        addLog('success', 'Basic connectivity test passed', {
          result: testResult.data.toRows()
        });
      } catch (testError) {
        addLog('warn', 'Basic connectivity test failed', testError.message);
        // Don't throw here, connection might still work for other queries
      }

      // Step 6: Resolve the connection promise
      if (connectionRef.current) {
        connectionRef.current.resolve(connection);
      }

      setConnectionStatus('connected');
      addLog('success', '🎉 MotherDuck connection initialization completed!');
      addLog('info', '='.repeat(50));

    } catch (error) {
      addLog('error', '💥 Connection initialization failed', error.message);
      addLog('error', 'Error type: ' + error.constructor.name);

      if (error.stack) {
        addLog('error', 'Stack trace', error.stack);
      }

      setConnectionStatus('error');
      setConnectionError(error.message);

      if (connectionRef.current) {
        connectionRef.current.reject(error);
      }

      // Reset connection ref for retry
      connectionRef.current = Promise.withResolvers();
    }
  };

  // ================================================================================
  // Query Methods
  // ================================================================================

  const evaluateQuery = async (query) => {
    addLog('info', `Executing query: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`);

    if (!connectionRef.current) {
      throw new Error('MotherDuck connection ref is falsy');
    }

    const connection = await connectionRef.current.promise;

    if (!connection) {
      throw new Error('No MotherDuck connection available');
    }

    try {
      const result = await connection.evaluateQuery(query);
      const rowCount = result.data.numRows;
      addLog('success', `Query executed successfully (${rowCount} rows)`);
      return result;
    } catch (queryError) {
      addLog('error', `Query execution failed: ${queryError.message}`);
      throw queryError;
    }
  };

  const safeEvaluateQuery = async (query) => {
    addLog('info', `Safe executing query: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`);

    if (!connectionRef.current) {
      throw new Error('MotherDuck connection ref is falsy');
    }

    const connection = await connectionRef.current.promise;

    if (!connection) {
      throw new Error('No MotherDuck connection available');
    }

    try {
      const result = await connection.safeEvaluateQuery(query);

      if (result.success) {
        const rowCount = result.result.data.numRows;
        addLog('success', `Safe query executed successfully (${rowCount} rows)`);
      } else {
        addLog('error', `Safe query failed: ${result.error?.message || 'Unknown error'}`);
      }

      return result;
    } catch (queryError) {
      addLog('error', `Safe query execution failed: ${queryError.message}`);

      // Return error in safe format
      return {
        success: false,
        error: {
          message: queryError.message,
          name: queryError.constructor.name
        }
      };
    }
  };

  // ================================================================================
  // Testing Methods
  // ================================================================================

  const testConnection = async () => {
    addLog('info', '🧪 Starting comprehensive connection test');

    try {
      // Test 1: Basic connectivity
      addLog('info', 'Test 1: Basic connectivity');
      const basicTest = await safeEvaluateQuery('SELECT 1 as test');

      if (!basicTest.success) {
        throw new Error(`Basic test failed: ${basicTest.error?.message}`);
      }

      // Test 2: List databases
      addLog('info', 'Test 2: Listing available databases');
      const dbTest = await safeEvaluateQuery('SHOW DATABASES');

      if (dbTest.success) {
        const databases = dbTest.result.data.toRows();
        addLog('success', `Found ${databases.length} databases`, databases);
      }

      // Test 3: Search for crime-related tables
      addLog('info', 'Test 3: Searching for SF crime data');
      const crimeSearchQueries = [
        "SELECT table_name, database_name FROM information_schema.tables WHERE table_name LIKE '%crime%'",
        "SELECT table_name, database_name FROM information_schema.tables WHERE table_name LIKE '%incident%'",
        "SHOW ALL TABLES"
      ];

      for (const query of crimeSearchQueries) {
        addLog('info', `Trying: ${query}`);
        const result = await safeEvaluateQuery(query);

        if (result.success && result.result.data.numRows > 0) {
          const tables = result.result.data.toRows();
          addLog('success', `Found ${tables.length} matching tables`, tables.slice(0, 5));
        } else {
          addLog('info', 'No results found for this query');
        }
      }

      addLog('success', '🎉 Connection test completed successfully');

    } catch (error) {
      addLog('error', `Connection test failed: ${error.message}`);
      throw error;
    }
  };

  // ================================================================================
  // Lifecycle
  // ================================================================================

  useEffect(() => {
    initializeConnection();
  }, [database]);

  // ================================================================================
  // Context Value
  // ================================================================================

  const value = useMemo(() => ({
    // Connection methods
    evaluateQuery,
    safeEvaluateQuery,

    // Connection state
    connectionStatus,
    connectionError,
    connectionLogs,

    // Testing methods
    testConnection,
    clearLogs,

    // Token info
    tokenInfo
  }), [
    connectionStatus,
    connectionError,
    connectionLogs,
    tokenInfo
  ]);

  return (
    <MotherDuckContext.Provider value={value}>
      {children}
    </MotherDuckContext.Provider>
  );
}

export function useMotherDuckClientState() {
  const context = useContext(MotherDuckContext);
  if (!context) {
    throw new Error('useMotherDuckClientState must be used within MotherDuckClientProvider');
  }
  return context;
}
