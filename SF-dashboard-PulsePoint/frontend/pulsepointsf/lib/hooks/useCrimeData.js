import { useState, useEffect, useRef, useCallback } from "react";
import { API_QUERY } from "../../app/crime/constants.js";

/**
 * Global in-memory cache for crime data and fetch status.
 * This ensures all components using this hook share the same data and state.
 */
let cachedCrimeData = null;
let cachedError = null;
let cachedLastFetched = null;
let cachedIsLoading = false;
let subscribers = [];

/**
 * Notifies all subscribers (setters) of state changes.
 */
function notifySubscribers() {
  subscribers.forEach((setters) => {
    setters.setCrimeData(cachedCrimeData);
    setters.setError(cachedError);
    setters.setLastFetched(cachedLastFetched);
    setters.setIsLoading(cachedIsLoading);
  });
}

/**
 * Fetches crime data from the DataSF API and updates the cache.
 */
async function fetchCrimeData() {
  cachedIsLoading = true;
  cachedError = null;
  notifySubscribers();

  try {
    const response = await fetch(API_QUERY);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    // Validate and clean data
    const validRecords = data.filter(
      (record) =>
        record.incident_datetime &&
        record.incident_category &&
        record.incident_description &&
        record.latitude &&
        record.longitude
    );
    cachedCrimeData = validRecords;
    cachedLastFetched = new Date();
    cachedError = null;
  } catch (err) {
    cachedCrimeData = null;
    cachedError = err.message;
    cachedLastFetched = null;
  } finally {
    cachedIsLoading = false;
    notifySubscribers();
  }
}

/**
 * Custom React hook for accessing and caching SF crime data.
 * Returns: { crimeData, isLoading, error, lastFetched, refetch }
 */
export function useCrimeData() {
  const [crimeData, setCrimeData] = useState(cachedCrimeData);
  const [isLoading, setIsLoading] = useState(cachedIsLoading);
  const [error, setError] = useState(cachedError);
  const [lastFetched, setLastFetched] = useState(cachedLastFetched);

  // Register this hook's setters for global updates
  const settersRef = useRef({ setCrimeData, setIsLoading, setError, setLastFetched });
  useEffect(() => {
    settersRef.current = { setCrimeData, setIsLoading, setError, setLastFetched };
    subscribers.push(settersRef.current);
    // On mount, fetch if not already cached
    if (!cachedCrimeData && !cachedIsLoading) {
      fetchCrimeData();
    } else {
      // Sync with cache
      setCrimeData(cachedCrimeData);
      setIsLoading(cachedIsLoading);
      setError(cachedError);
      setLastFetched(cachedLastFetched);
    }
    return () => {
      // Unsubscribe on unmount
      subscribers = subscribers.filter((s) => s !== settersRef.current);
    };
  }, []);

  // Manual refetch (e.g., on error or user request)
  const refetch = useCallback(() => {
    if (!cachedIsLoading) {
      fetchCrimeData();
    }
  }, []);

  return { crimeData, isLoading, error, lastFetched, refetch };
}
