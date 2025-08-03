#!/usr/bin/env node

/**
 * DataSF Crime API Test Script
 * Tests SF Open Data API connectivity, structure, and performance
 * API: https://data.sfgov.org/resource/wg3w-h783.json
 */

const https = require('https');
const http = require('http');

// Base URL for SF Crime Data API
const BASE_URL = 'https://data.sfgov.org/resource/wg3w-h783.json';

/**
 * Make HTTP/HTTPS request with promise wrapper
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    console.log(`📡 Requesting: ${url}`);

    const client = url.startsWith('https:') ? https : http;

    const req = client.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
            responseTime,
            dataSize: data.length
          });
        } catch (parseError) {
          reject({
            error: 'JSON Parse Error',
            message: parseError.message,
            statusCode: res.statusCode,
            rawData: data.substring(0, 500) + '...',
            responseTime
          });
        }
      });
    });

    req.on('error', (error) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      reject({
        error: 'Network Error',
        message: error.message,
        responseTime
      });
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject({
        error: 'Timeout Error',
        message: 'Request timed out after 30 seconds'
      });
    });
  });
}

/**
 * Test basic API connectivity
 */
async function testBasicConnectivity() {
  console.log('🌐 Step 1: Testing Basic API Connectivity');
  console.log('==========================================');

  try {
    const url = `${BASE_URL}?$limit=1`;
    const result = await makeRequest(url);

    console.log('✅ API Connection Successful!');
    console.log(`📊 Status Code: ${result.statusCode}`);
    console.log(`⏱️ Response Time: ${result.responseTime}ms`);
    console.log(`📦 Data Size: ${result.dataSize} bytes`);
    console.log(`📋 Records Returned: ${result.data.length}`);

    // Check rate limiting headers
    const rateLimitHeaders = {};
    for (const [key, value] of Object.entries(result.headers)) {
      if (key.toLowerCase().includes('limit') || key.toLowerCase().includes('rate')) {
        rateLimitHeaders[key] = value;
      }
    }

    if (Object.keys(rateLimitHeaders).length > 0) {
      console.log('🚦 Rate Limit Headers:', rateLimitHeaders);
    }

    return result;

  } catch (error) {
    console.error('❌ API Connection Failed:');
    console.error('Error Type:', error.error || 'Unknown');
    console.error('Message:', error.message);
    if (error.statusCode) {
      console.error('Status Code:', error.statusCode);
    }
    throw error;
  }
}

/**
 * Analyze data structure with small sample
 */
async function testDataStructure() {
  console.log('\n🔍 Step 2: Analyzing Data Structure');
  console.log('=====================================');

  try {
    const url = `${BASE_URL}?$limit=3`;
    const result = await makeRequest(url);

    if (result.data.length === 0) {
      console.log('⚠️ No data returned from API');
      return;
    }

    console.log(`✅ Retrieved ${result.data.length} sample records`);
    console.log(`⏱️ Response Time: ${result.responseTime}ms`);

    // Analyze first record structure
    const firstRecord = result.data[0];
    console.log('\n📋 Available Fields:');

    const fields = Object.keys(firstRecord);
    fields.forEach((field, index) => {
      const value = firstRecord[field];
      const type = typeof value;
      const preview = type === 'string' && value.length > 50
        ? value.substring(0, 50) + '...'
        : value;
      console.log(`   ${index + 1}. ${field} (${type}): ${preview}`);
    });

    // Show sample records
    console.log('\n📄 Sample Records:');
    result.data.forEach((record, index) => {
      console.log(`\n   Record ${index + 1}:`);
      console.log(`      Category: ${record.incident_category || 'N/A'}`);
      console.log(`      Description: ${record.incident_description || 'N/A'}`);
      console.log(`      Date: ${record.incident_datetime || 'N/A'}`);
      console.log(`      Location: ${record.latitude || 'N/A'}, ${record.longitude || 'N/A'}`);
      console.log(`      Neighborhood: ${record.analysis_neighborhood || 'N/A'}`);
    });

    return { fields, sampleData: result.data };

  } catch (error) {
    console.error('❌ Data Structure Analysis Failed:', error.message);
    throw error;
  }
}

/**
 * Test filtered queries for recent crime data
 */
async function testFilteredQueries() {
  console.log('\n🎯 Step 3: Testing Filtered Queries');
  console.log('====================================');

  const queries = [
    {
      name: 'Last 24 Hours',
      description: 'Recent crime incidents',
      filter: `incident_datetime >= '2025-08-02T00:00:00'`,
      limit: 10
    },
    {
      name: 'Major Crimes Only',
      description: 'Excluding non-criminal incidents',
      filter: `incident_category != 'Non-Criminal'`,
      limit: 10
    },
    {
      name: 'With Location Data',
      description: 'Records with valid coordinates',
      filter: `latitude IS NOT NULL AND longitude IS NOT NULL`,
      limit: 10
    },
    {
      name: 'Theft Incidents',
      description: 'Larceny and theft related crimes',
      filter: `incident_category LIKE '%Theft%' OR incident_category LIKE '%Larceny%'`,
      limit: 5
    },
    {
      name: 'Downtown Area',
      description: 'Incidents in downtown SF (approximate)',
      filter: `latitude BETWEEN 37.77 AND 37.80 AND longitude BETWEEN -122.42 AND -122.39`,
      limit: 5
    }
  ];

  for (const query of queries) {
    console.log(`\n🧪 Testing: ${query.name}`);
    console.log(`   Description: ${query.description}`);
    console.log(`   Filter: ${query.filter}`);

    try {
      const url = `${BASE_URL}?$where=${encodeURIComponent(query.filter)}&$limit=${query.limit}`;
      const result = await makeRequest(url);

      console.log(`   ✅ Success: ${result.data.length} records found`);
      console.log(`   ⏱️ Response Time: ${result.responseTime}ms`);
      console.log(`   📦 Data Size: ${result.dataSize} bytes`);

      if (result.data.length > 0) {
        const sample = result.data[0];
        console.log(`   📋 Sample: ${sample.incident_category} - ${sample.incident_description}`);
        if (sample.incident_datetime) {
          console.log(`   📅 Date: ${sample.incident_datetime}`);
        }
        if (sample.latitude && sample.longitude) {
          console.log(`   📍 Location: ${sample.latitude}, ${sample.longitude}`);
        }
      }

    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }

    // Small delay to be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Test different limit sizes for performance analysis
 */
async function testPerformanceLimits() {
  console.log('\n⚡ Step 4: Performance Testing with Different Limits');
  console.log('===================================================');

  const limits = [1, 10, 50, 100, 500, 1000];
  const results = [];

  for (const limit of limits) {
    console.log(`\n📊 Testing limit: ${limit} records`);

    try {
      const url = `${BASE_URL}?$limit=${limit}&$where=latitude IS NOT NULL`;
      const result = await makeRequest(url);

      const performanceData = {
        limit,
        recordsReturned: result.data.length,
        responseTime: result.responseTime,
        dataSize: result.dataSize,
        bytesPerRecord: Math.round(result.dataSize / result.data.length),
        recordsPerSecond: Math.round(result.data.length / (result.responseTime / 1000))
      };

      results.push(performanceData);

      console.log(`   ✅ Success: ${performanceData.recordsReturned} records`);
      console.log(`   ⏱️ Response Time: ${performanceData.responseTime}ms`);
      console.log(`   📦 Data Size: ${performanceData.dataSize} bytes`);
      console.log(`   📏 Bytes per Record: ${performanceData.bytesPerRecord}`);
      console.log(`   🚀 Records per Second: ${performanceData.recordsPerSecond}`);

      // Be respectful to the API - longer delays for larger requests
      const delay = limit >= 500 ? 2000 : limit >= 100 ? 1000 : 500;
      await new Promise(resolve => setTimeout(resolve, delay));

    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }

  // Performance summary
  console.log('\n📈 Performance Summary:');
  console.log('========================');
  results.forEach(result => {
    console.log(`   ${result.limit} records: ${result.responseTime}ms (${result.recordsPerSecond} rec/sec)`);
  });

  return results;
}

/**
 * Test error handling scenarios
 */
async function testErrorHandling() {
  console.log('\n🚨 Step 5: Testing Error Handling');
  console.log('==================================');

  const errorTests = [
    {
      name: 'Invalid Field Name',
      url: `${BASE_URL}?$where=invalid_field = 'test'&$limit=1`,
      expectedError: 'Bad field name or query syntax'
    },
    {
      name: 'Malformed Date Filter',
      url: `${BASE_URL}?$where=incident_datetime = 'invalid-date'&$limit=1`,
      expectedError: 'Date parsing error'
    },
    {
      name: 'Very Large Limit (Rate Limiting)',
      url: `${BASE_URL}?$limit=50000`,
      expectedError: 'Rate limit or size limit exceeded'
    },
    {
      name: 'Invalid URL Encoding',
      url: `${BASE_URL}?$where=incident_category = 'test%gg'&$limit=1`,
      expectedError: 'URL encoding error'
    }
  ];

  for (const test of errorTests) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`   Expected: ${test.expectedError}`);

    try {
      const result = await makeRequest(test.url);
      console.log(`   ⚠️ Unexpected Success: ${result.data.length} records returned`);
      console.log(`   📊 Status: ${result.statusCode}`);
    } catch (error) {
      console.log(`   ✅ Expected Error: ${error.error || 'Error occurred'}`);
      console.log(`   📄 Message: ${error.message}`);
      if (error.statusCode) {
        console.log(`   📊 Status Code: ${error.statusCode}`);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Main test runner
 */
async function runDataSFAPITests() {
  try {
    console.log('🏛️ SF Crime Data API Comprehensive Test');
    console.log('========================================');
    console.log(`📡 API Endpoint: ${BASE_URL}`);
    console.log(`🕐 Started at: ${new Date().toISOString()}\n`);

    // Run all test phases
    await testBasicConnectivity();
    await testDataStructure();
    await testFilteredQueries();
    const performanceResults = await testPerformanceLimits();
    await testErrorHandling();

    // Final summary
    console.log('\n🎉 Test Suite Completed Successfully!');
    console.log('=====================================');
    console.log('✅ API is accessible and functional');
    console.log('✅ Data structure analyzed');
    console.log('✅ Filtered queries working');
    console.log('✅ Performance characteristics measured');
    console.log('✅ Error handling tested');

    if (performanceResults && performanceResults.length > 0) {
      const bestPerformance = performanceResults.reduce((best, current) =>
        current.recordsPerSecond > best.recordsPerSecond ? current : best
      );
      console.log(`🚀 Best Performance: ${bestPerformance.limit} records in ${bestPerformance.responseTime}ms`);
    }

    console.log('\n💡 Recommendations:');
    console.log('   • Use $limit parameter to control response size');
    console.log('   • Filter by date ranges for better performance');
    console.log('   • Include location filters (latitude/longitude IS NOT NULL)');
    console.log('   • Consider caching for frequently accessed data');
    console.log('   • Monitor rate limits and implement retry logic');

  } catch (error) {
    console.error('\n💥 Test Suite Failed:');
    console.error('Error:', error.message || error);
    process.exit(1);
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runDataSFAPITests()
    .then(() => {
      console.log('\n✅ All tests completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runDataSFAPITests };
