/**
 * ==================================================================================
 * Crime Dashboard Utilities
 * ==================================================================================
 *
 * Utility functions for data processing, formatting, and color management
 */

import { CATEGORY_COLORS, CRIME_CATEGORIES, COMPARISON_YEARS, YEAR_COMPARISON_COLORS } from './constants.js';

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
 * Year-over-Year Comparison Utilities
 * ==================================================================================
 */

/**
 * Filter data by specific month and year
 * @param {Array} data - Array of crime incidents
 * @param {number} month - Month (1-12)
 * @param {number} year - Year (e.g., 2024, 2025)
 * @returns {Array} - Filtered data array
 */
export const filterDataByMonthYear = (data, month, year) => {
  if (!data.length) return [];

  return data.filter(incident => {
    try {
      const date = new Date(incident.incident_datetime);
      return date.getMonth() + 1 === month && date.getFullYear() === year;
    } catch (error) {
      return false;
    }
  });
};

/**
 * Calculate percentage change between two values
 * @param {number} current - Current year value
 * @param {number} previous - Previous year value
 * @returns {string} - Formatted percentage change with sign
 */
export const calculatePercentageChange = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? '+∞%' : '0%';
  }
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
};

/**
 * Process year-over-year comparison data for category groups chart
 * @param {Array} allData - All crime data
 * @param {number} selectedMonth - Selected month (1-12)
 * @returns {Array} - Year-over-year comparison chart data
 */
export const processYearOverYearCategoryData = (allData, selectedMonth) => {
  const currentYearData = filterDataByMonthYear(allData, selectedMonth, COMPARISON_YEARS.current);
  const previousYearData = filterDataByMonthYear(allData, selectedMonth, COMPARISON_YEARS.previous);

  const currentCategoryData = processCategoryExplorerData(currentYearData);
  const previousCategoryData = processCategoryExplorerData(previousYearData);

  const currentGroupData = processCategoryGroupChartData(currentCategoryData);
  const previousGroupData = processCategoryGroupChartData(previousCategoryData);

  // Combine data for side-by-side visualization
  const categoryNames = ['Violent Crimes', 'Property Crimes', 'Drug Offenses', 'Public Order', 'Other'];

  return categoryNames.map(categoryName => {
    const currentItem = currentGroupData.find(item => item.category === categoryName) || { count: 0, percentage: '0.0' };
    const previousItem = previousGroupData.find(item => item.category === categoryName) || { count: 0, percentage: '0.0' };

    const percentageChange = calculatePercentageChange(currentItem.count, previousItem.count);

    return {
      category: categoryName,
      current: currentItem.count,
      previous: previousItem.count,
      currentPercentage: currentItem.percentage,
      previousPercentage: previousItem.percentage,
      change: percentageChange,
      fill: currentItem.fill || '#6b7280'
    };
  }).filter(item => item.current > 0 || item.previous > 0);
};

/**
 * Process year-over-year comparison data for time distribution chart
 * @param {Array} allData - All crime data
 * @param {number} selectedMonth - Selected month (1-12)
 * @returns {Array} - Year-over-year time comparison chart data
 */
export const processYearOverYearTimeData = (allData, selectedMonth) => {
  const currentYearData = filterDataByMonthYear(allData, selectedMonth, COMPARISON_YEARS.current);
  const previousYearData = filterDataByMonthYear(allData, selectedMonth, COMPARISON_YEARS.previous);

  const currentTimeData = processTimeChartData(currentYearData);
  const previousTimeData = processTimeChartData(previousYearData);

  // Combine data for all 24 hours
  return Array.from({ length: 24 }, (_, hour) => {
    const currentHour = currentTimeData.find(item => item.hourNum === hour) || { count: 0 };
    const previousHour = previousTimeData.find(item => item.hourNum === hour) || { count: 0 };

    return {
      hour: `${hour}:00`,
      hourNum: hour,
      current: currentHour.count,
      previous: previousHour.count,
      change: calculatePercentageChange(currentHour.count, previousHour.count)
    };
  });
};

/**
 * Process year-over-year comparison data for day of week chart
 * @param {Array} allData - All crime data
 * @param {number} selectedMonth - Selected month (1-12)
 * @returns {Array} - Year-over-year day comparison chart data
 */
export const processYearOverYearDayData = (allData, selectedMonth) => {
  const currentYearData = filterDataByMonthYear(allData, selectedMonth, COMPARISON_YEARS.current);
  const previousYearData = filterDataByMonthYear(allData, selectedMonth, COMPARISON_YEARS.previous);

  const currentDayData = processDayOfWeekChartData(currentYearData);
  const previousDayData = processDayOfWeekChartData(previousYearData);

  const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return dayOrder.map(day => {
    const currentDay = currentDayData.find(item => item.day === day) || { count: 0, fullDay: day };
    const previousDay = previousDayData.find(item => item.day === day) || { count: 0, fullDay: day };

    return {
      day,
      fullDay: currentDay.fullDay,
      current: currentDay.count,
      previous: previousDay.count,
      change: calculatePercentageChange(currentDay.count, previousDay.count)
    };
  });
};

/**
 * Process year-over-year comparison data for resolution status chart
 * @param {Array} allData - All crime data
 * @param {number} selectedMonth - Selected month (1-12)
 * @returns {Array} - Year-over-year resolution comparison chart data
 */
export const processYearOverYearResolutionData = (allData, selectedMonth) => {
  const currentYearData = filterDataByMonthYear(allData, selectedMonth, COMPARISON_YEARS.current);
  const previousYearData = filterDataByMonthYear(allData, selectedMonth, COMPARISON_YEARS.previous);

  const currentResolutionData = processResolutionChartData(currentYearData);
  const previousResolutionData = processResolutionChartData(previousYearData);

  // Get all unique resolution types
  const allResolutions = new Set([
    ...currentResolutionData.map(item => item.fullName),
    ...previousResolutionData.map(item => item.fullName)
  ]);

  const colors = ['#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  return Array.from(allResolutions).map((resolution, index) => {
    const currentItem = currentResolutionData.find(item => item.fullName === resolution) || { value: 0, percentage: '0.0' };
    const previousItem = previousResolutionData.find(item => item.fullName === resolution) || { value: 0, percentage: '0.0' };

    return {
      name: resolution.length > 20 ? resolution.substring(0, 20) + '...' : resolution,
      fullName: resolution,
      current: currentItem.value,
      previous: previousItem.value,
      currentPercentage: currentItem.percentage,
      previousPercentage: previousItem.percentage,
      change: calculatePercentageChange(currentItem.value, previousItem.value),
      fill: colors[index % colors.length]
    };
  }).filter(item => item.current > 0 || item.previous > 0)
    .sort((a, b) => (b.current + b.previous) - (a.current + a.previous));
};
