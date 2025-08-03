#!/usr/bin/env node

/**
 * Simple MotherDuck Connection Test
 * Tests basic connectivity and database access without WebAssembly complexity
 */

const duckdb = require('duckdb');
const fs = require('fs');
const path = require('path');

// Read token from .env file
function loadToken() {
  const envPath = path.join(__dirname, 'frontend/pulsepointsf/.env');

  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found at:', envPath);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const tokenMatch = envContent.match(/NEXT_PUBLIC_DUCK_READ_TOKEN="([^"]+)"/);

  if (!tokenMatch) {
    console.error('❌ NEXT_PUBLIC_DUCK_READ_TOKEN not found in .env file');
    process.exit(1);
  }

  return tokenMatch[1];
}

async function testMotherDuckConnection() {
  try {
    console.log('🦆 Starting MotherDuck Connection Test');
    console.log('=====================================\n');

    // Load token
    const token = loadToken();
    console.log('🔑 Token loaded successfully');
    console.log('📋 Token preview:', token.substring(0, 20) + '...\n');

    // Set MotherDuck token environment variable
    process.env.motherduck_token = token;

    // Step 1: Create connection to MotherDuck
    console.log('📊 Step 1: Creating MotherDuck connection...');
    const db = new duckdb.Database('md:');
    console.log('✅ Database connection created\n');

    // Step 2: Test basic connectivity
    console.log('🧪 Step 2: Testing basic connectivity...');
    await new Promise((resolve, reject) => {
      db.all('SELECT 1 as test_connection', (err, res) => {
        if (err) {
          console.error('❌ Basic connection test failed:', err.message);
          reject(err);
        } else {
          console.log('✅ Basic connection successful:', res);
          resolve(res);
        }
      });
    });

    // Step 3: List available databases
    console.log('\n📋 Step 3: Listing available databases...');
    await new Promise((resolve, reject) => {
      db.all('SHOW DATABASES', (err, res) => {
        if (err) {
          console.error('❌ Failed to list databases:', err.message);
          reject(err);
        } else {
          console.log('✅ Available databases:');
          res.forEach((row, index) => {
            console.log(`   ${index + 1}. ${row.database_name || row.name || JSON.stringify(row)}`);
          });
          resolve(res);
        }
      });
    });

    // Step 4: Explore each available database
    console.log('\n🗄️ Step 4: Exploring available databases...');

    const databases = ['my_db', 'sample_data'];

    for (const dbName of databases) {
      console.log(`\n📋 Exploring database: ${dbName}`);

      try {
        // Switch to database
        await new Promise((resolve, reject) => {
          db.all(`USE ${dbName}`, (err, res) => {
            if (err) {
              console.log(`   ❌ Failed to use ${dbName}: ${err.message}`);
              resolve(null);
            } else {
              console.log(`   ✅ Successfully switched to ${dbName}`);
              resolve(res);
            }
          });
        });

        // List tables in this database
        await new Promise((resolve, reject) => {
          db.all('SHOW TABLES', (err, res) => {
            if (err) {
              console.log(`   ⚠️ Failed to list tables in ${dbName}: ${err.message}`);
              resolve(null);
            } else {
              if (res.length === 0) {
                console.log(`   📋 No tables found in ${dbName}`);
              } else {
                console.log(`   📋 Tables in ${dbName}:`);
                res.forEach((row, index) => {
                  console.log(`      ${index + 1}. ${row.name || row.table_name || JSON.stringify(row)}`);
                });

                // If this database has tables, get sample data from first table
                const firstTable = res[0];
                const tableName = firstTable.name || firstTable.table_name;
                if (tableName) {
                  console.log(`   🔍 Sample data from ${tableName}:`);
                  // Note: Cannot use await inside Promise callback, so we'll skip sample data for now
                  console.log(`      ℹ️ Table exists: ${tableName} (sample data retrieval deferred)`);
                }
              }
              resolve(res);
            }
          });
        });

      } catch (e) {
        console.log(`   💥 Error exploring ${dbName}:`, e.message);
      }
    }

    // Step 5: Check if sf_crime_stats exists as a schema in any database
    console.log('\n🔍 Step 5: Searching for SF crime-related data...');

    // Try to find any crime-related tables across all databases
    const searchQueries = [
      "SELECT table_name, database_name FROM information_schema.tables WHERE table_name LIKE '%crime%'",
      "SELECT table_name, database_name FROM information_schema.tables WHERE table_name LIKE '%incident%'",
      "SHOW ALL TABLES",
    ];

    for (const query of searchQueries) {
      console.log(`\n   🧪 Trying: ${query}`);
      try {
        await new Promise((resolve, reject) => {
          db.all(query, (err, res) => {
            if (err) {
              console.log(`      ❌ Failed: ${err.message}`);
            } else {
              if (res.length > 0) {
                console.log(`      ✅ Found ${res.length} results:`);
                res.slice(0, 5).forEach((row, idx) => {
                  console.log(`         ${idx + 1}. ${JSON.stringify(row)}`);
                });
                if (res.length > 5) {
                  console.log(`         ... and ${res.length - 5} more`);
                }
              } else {
                console.log(`      📋 No results found`);
              }
            }
            resolve(res);
          });
        });
      } catch (e) {
        console.log(`      💥 Query error: ${e.message}`);
      }
    }

    // Step 6: Test sample queries with different table references
    console.log('\n🔍 Step 6: Testing sample queries...');
    const tableVariations = [
      'data',
      'sf_crime_stats.data',
      'crime_data',
      'incidents'
    ];

    for (const tableName of tableVariations) {
      console.log(`\n🧪 Testing table: ${tableName}`);
      try {
        await new Promise((resolve, reject) => {
          const testQuery = `SELECT COUNT(*) as total_records FROM ${tableName} LIMIT 1`;
          db.all(testQuery, (err, res) => {
            if (err) {
              console.log(`   ❌ Failed: ${err.message}`);
              resolve(null);
            } else {
              console.log(`   ✅ Success! Records found:`, res[0]);
              resolve(res);
            }
          });
        });
      } catch (e) {
        console.log(`   ❌ Error testing ${tableName}:`, e.message);
      }
    }

    console.log('\n🎉 MotherDuck connection test completed!');
    console.log('=====================================');

  } catch (error) {
    console.error('\n💥 Connection test failed with error:');
    console.error('Error:', error.message);
    console.error('Type:', error.constructor.name);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testMotherDuckConnection()
    .then(() => {
      console.log('\n✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testMotherDuckConnection };
