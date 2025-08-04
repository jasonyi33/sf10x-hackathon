/**
 * ==================================================================================
 * Crime Dashboard Utilities
 * ==================================================================================
 *
 * Utility functions for data processing, formatting, and color management
 */

import { CATEGORY_COLORS, CRIME_CATEGORIES } from './constants.js';

/**
 * Get color for incident category badge
 * @param {string} category - The incident category
 * @returns {string} - Hex color code
 */
export const getCategoryColor = (category) => {
  // Find matching category or use default
  const matchedColor = Object.keys(CATEGORY_COLORS).find(key =>
    category.toLowerCase().includes(key.toLowerCase())
  );

  return matchedColor ? CATEGORY_COLORS[matchedColor] : '#6b7280';
};

/**
 * Format incident datetime for display
 * @param {string} datetimeString - ISO datetime string
 * @returns {string} - Formatted datetime
 */
export const formatDateTime = (datetimeString) => {
  try {
    const date = new Date(datetimeString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return datetimeString;
  }
};

/**
 * Process grouped category data for crime type overview chart
 * @param {Object} categoryExplorerData - Grouped category data from processCategoryExplorerData
 * @returns {Array} - Chart data array for 5 main crime types
 */
export const processCategoryGroupChartData = (categoryExplorerData) => {
  if (!categoryExplorerData) return [];

  console.log('🔍 Processing category group data for crime type overview chart');

  // Calculate total incidents for each group
  const violentTotal = categoryExplorerData.violent.reduce((sum, crime) => sum + crime.count, 0);
  const propertyTotal = categoryExplorerData.property.reduce((sum, crime) => sum + crime.count, 0);
  const drugTotal = categoryExplorerData.drug.reduce((sum, crime) => sum + crime.count, 0);
  const publicOrderTotal = categoryExplorerData.publicOrder.reduce((sum, crime) => sum + crime.count, 0);
  const otherTotal = categoryExplorerData.other.reduce((sum, crime) => sum + crime.count, 0);

  // Calculate total for percentages
  const grandTotal = violentTotal + propertyTotal + drugTotal + publicOrderTotal + otherTotal;

  // Create chart data with consistent colors matching CategoryExplorer
  const chartData = [
    {
      category: 'Violent Crimes',
      count: violentTotal,
      percentage: grandTotal > 0 ? ((violentTotal / grandTotal) * 100).toFixed(1) : '0.0',
      fill: '#dc2626' // Red
    },
    {
      category: 'Property Crimes',
      count: propertyTotal,
      percentage: grandTotal > 0 ? ((propertyTotal / grandTotal) * 100).toFixed(1) : '0.0',
      fill: '#d97706' // Orange
    },
    {
      category: 'Drug Offenses',
      count: drugTotal,
      percentage: grandTotal > 0 ? ((drugTotal / grandTotal) * 100).toFixed(1) : '0.0',
      fill: '#0284c7' // Blue
    },
    {
      category: 'Public Order',
      count: publicOrderTotal,
      percentage: grandTotal > 0 ? ((publicOrderTotal / grandTotal) * 100).toFixed(1) : '0.0',
      fill: '#7c3aed' // Purple
    },
    {
      category: 'Other',
      count: otherTotal,
      percentage: grandTotal > 0 ? ((otherTotal / grandTotal) * 100).toFixed(1) : '0.0',
      fill: '#4b5563' // Gray
    }
  ].filter(item => item.count > 0) // Only include groups with incidents
   .sort((a, b) => b.count - a.count); // Sort by count descending

  console.log('📈 Crime type overview chart data:', JSON.stringify(chartData, null, 2));
  return chartData;
};

/**
 * Process crime data for time distribution chart (24-hour pattern)
 * @param {Array} sortedData - Array of crime incidents
 * @returns {Array} - Time chart data array
 */
export const processTimeChartData = (sortedData) => {
  if (!sortedData.length) return [];

  const hourCounts = {};
  for (let i = 0; i < 24; i++) {
    hourCounts[i] = 0;
  }

  sortedData.forEach(incident => {
    try {
      const date = new Date(incident.incident_datetime);
      const hour = date.getHours();
      if (!isNaN(hour)) {
        hourCounts[hour]++;
      }
    } catch (error) {
      // Skip invalid dates
    }
  });

  return Object.entries(hourCounts).map(([hour, count]) => ({
    hour: `${hour}:00`,
    hourNum: parseInt(hour),
    count,
    percentage: ((count / sortedData.length) * 100).toFixed(1)
  }));
};

/**
 * Process crime data for day of week pattern
 * @param {Array} sortedData - Array of crime incidents
 * @returns {Array} - Day of week chart data array
 */
export const processDayOfWeekChartData = (sortedData) => {
  if (!sortedData.length) return [];

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayCounts = {};
  dayOrder.forEach(day => dayCounts[day] = 0);

  sortedData.forEach(incident => {
    const day = incident.incident_day_of_week;
    if (day && dayCounts.hasOwnProperty(day)) {
      dayCounts[day]++;
    }
  });

  return dayOrder.map(day => ({
    day: day.substring(0, 3), // Mon, Tue, etc.
    fullDay: day,
    count: dayCounts[day],
    percentage: ((dayCounts[day] / sortedData.length) * 100).toFixed(1),
    fill: '#3b82f6'
  }));
};

/**
 * Process crime data for resolution status chart
 * @param {Array} sortedData - Array of crime incidents
 * @returns {Array} - Resolution chart data array
 */
export const processResolutionChartData = (sortedData) => {
  if (!sortedData.length) return [];

  const resolutionCounts = {};
  sortedData.forEach(incident => {
    const resolution = incident.resolution || 'Unknown';
    resolutionCounts[resolution] = (resolutionCounts[resolution] || 0) + 1;
  });

  const colors = ['#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
  return Object.entries(resolutionCounts)
    .map(([resolution, count], index) => ({
      name: resolution.length > 20 ? resolution.substring(0, 20) + '...' : resolution,
      fullName: resolution,
      value: count,
      percentage: ((count / sortedData.length) * 100).toFixed(1),
      fill: colors[index % colors.length]
    }))
    .sort((a, b) => b.value - a.value);
};

/**
 * Process all crime categories with comprehensive details and grouping
 * @param {Array} sortedData - Array of crime incidents
 * @returns {Object} - Grouped category data
 */
export const processCategoryExplorerData = (sortedData) => {
  if (!sortedData.length) {
    return { violent: [], property: [], drug: [], publicOrder: [], other: [] };
  }

  // Get all categories with counts
  const categoryCounts = {};
  sortedData.forEach(incident => {
    const category = incident.incident_category || 'Unknown';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  // Process and categorize all categories
  const processedCategories = Object.entries(categoryCounts)
    .map(([category, count]) => ({
      name: category,
      count: Number(count),
      percentage: ((count / sortedData.length) * 100).toFixed(1),
      color: getCategoryColor(category)
    }))
    .sort((a, b) => b.count - a.count);

  // Group categories
  return {
    violent: processedCategories.filter(cat =>
      CRIME_CATEGORIES.violent.some(violent =>
        cat.name.toLowerCase().includes(violent.toLowerCase())
      )
    ),
    property: processedCategories.filter(cat =>
      CRIME_CATEGORIES.property.some(property =>
        cat.name.toLowerCase().includes(property.toLowerCase())
      )
    ),
    drug: processedCategories.filter(cat =>
      CRIME_CATEGORIES.drug.some(drug =>
        cat.name.toLowerCase().includes(drug.toLowerCase())
      )
    ),
    publicOrder: processedCategories.filter(cat =>
      CRIME_CATEGORIES.publicOrder.some(order =>
        cat.name.toLowerCase().includes(order.toLowerCase())
      )
    ),
    other: processedCategories.filter(cat => {
      const isViolent = CRIME_CATEGORIES.violent.some(violent =>
        cat.name.toLowerCase().includes(violent.toLowerCase())
      );
      const isProperty = CRIME_CATEGORIES.property.some(property =>
        cat.name.toLowerCase().includes(property.toLowerCase())
      );
      const isDrug = CRIME_CATEGORIES.drug.some(drug =>
        cat.name.toLowerCase().includes(drug.toLowerCase())
      );
      const isPublicOrder = CRIME_CATEGORIES.publicOrder.some(order =>
        cat.name.toLowerCase().includes(order.toLowerCase())
      );
      return !isViolent && !isProperty && !isDrug && !isPublicOrder;
    })
  };
};

/**
 * ==================================================================================
 * SPATIAL CLUSTERING FOR 3D VISUALIZATION
 * ==================================================================================
 */

/**
 * Spatial clustering function for crime incidents
 * @param {Array} incidents - Crime data from DataSF API
 * @param {number} radius - Clustering radius in meters (default: 200)
 * @param {string} category - Crime category to filter (default: 'Assault')
 * @returns {Array} Array of cluster objects
 */
export function spatialCluster(incidents, radius = 200, category = 'Assault') {
  console.log(`🔍 Clustering ${category} incidents within ${radius}m radius...`);

  // Filter incidents by category and validate coordinates
  const filtered = incidents.filter(incident =>
    incident.incident_category === category &&
    incident.latitude && incident.longitude &&
    !isNaN(parseFloat(incident.latitude)) &&
    !isNaN(parseFloat(incident.longitude))
  );

  console.log(`📊 Found ${filtered.length} valid ${category} incidents`);

  const clusters = [];
  const processed = new Set();

  filtered.forEach((incident, index) => {
    if (processed.has(index)) return;

    // Initialize cluster with first incident
    const cluster = {
      id: `cluster-${clusters.length}`,
      centroid: {
        lat: parseFloat(incident.latitude),
        lng: parseFloat(incident.longitude)
      },
      incidentCount: 1,
      category: category,
      incidents: [incident],
      timeRange: {
        earliest: incident.incident_datetime,
        latest: incident.incident_datetime
      },
      neighborhoods: new Set([incident.analysis_neighborhood]),
      resolutions: { open: 0, closed: 0 }
    };

    // Count resolution status
    if (incident.resolution === 'Open or Active') {
      cluster.resolutions.open = 1;
    } else {
      cluster.resolutions.closed = 1;
    }

    // Find nearby incidents within radius
    filtered.forEach((other, otherIndex) => {
      if (processed.has(otherIndex) || index === otherIndex) return;

      const distance = haversineDistance(
        parseFloat(incident.latitude), parseFloat(incident.longitude),
        parseFloat(other.latitude), parseFloat(other.longitude)
      );

      if (distance <= radius) {
        // Add to cluster
        cluster.incidents.push(other);
        cluster.incidentCount++;
        processed.add(otherIndex);

        // Update centroid (weighted average)
        const oldLat = cluster.centroid.lat;
        const oldLng = cluster.centroid.lng;
        const weight = cluster.incidentCount - 1;

        cluster.centroid.lat = (oldLat * weight + parseFloat(other.latitude)) / cluster.incidentCount;
        cluster.centroid.lng = (oldLng * weight + parseFloat(other.longitude)) / cluster.incidentCount;

        // Update time range
        if (other.incident_datetime < cluster.timeRange.earliest) {
          cluster.timeRange.earliest = other.incident_datetime;
        }
        if (other.incident_datetime > cluster.timeRange.latest) {
          cluster.timeRange.latest = other.incident_datetime;
        }

        // Update neighborhoods
        if (other.analysis_neighborhood) {
          cluster.neighborhoods.add(other.analysis_neighborhood);
        }

        // Update resolutions
        if (other.resolution === 'Open or Active') {
          cluster.resolutions.open++;
        } else {
          cluster.resolutions.closed++;
        }
      }
    });

    // Convert neighborhoods set to array
    cluster.neighborhoods = Array.from(cluster.neighborhoods);

    clusters.push(cluster);
    processed.add(index);
  });

  console.log(`✅ Created ${clusters.length} spatial clusters`);
  console.log(`📈 Cluster sizes: [${clusters.map(c => c.incidentCount).join(', ')}]`);

  return clusters;
}

/**
 * Calculate distance between two lat/lng points using Haversine formula
 * @param {number} lat1 - First point latitude
 * @param {number} lon1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lon2 - Second point longitude
 * @returns {number} Distance in meters
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Get cluster statistics for display
 * @param {Array} clusters - Array of cluster objects
 * @returns {Object} Statistics summary
 */
export function getClusterStats(clusters) {
  if (!clusters.length) return null;

  const totalIncidents = clusters.reduce((sum, cluster) => sum + cluster.incidentCount, 0);
  const avgClusterSize = totalIncidents / clusters.length;
  const maxClusterSize = Math.max(...clusters.map(c => c.incidentCount));
  const minClusterSize = Math.min(...clusters.map(c => c.incidentCount));

  return {
    clusterCount: clusters.length,
    totalIncidents,
    avgClusterSize: Math.round(avgClusterSize * 10) / 10,
    maxClusterSize,
    minClusterSize
  };
}

/**
 * Convert hex color to RGB array
 * @param {string} hex - Hex color code
 * @returns {Array} RGB array [r, g, b]
 */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [239, 68, 68]; // Default red
}
