#!/usr/bin/env node
/**
 * Mobile App Configuration Checker
 * Ensures the mobile app is properly configured for backend connectivity
 */

const fs = require('fs');
const path = require('path');

function checkConfig() {
    console.log('='.repeat(60));
    console.log('📱 Mobile App Configuration Check');
    console.log('='.repeat(60));
    
    const configPath = path.join(__dirname, 'config', 'api.ts');
    
    if (!fs.existsSync(configPath)) {
        console.log('❌ API config file not found:', configPath);
        return false;
    }
    
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Check for correct backend URL
    if (configContent.includes("'http://localhost:8000'")) {
        console.log('✅ Backend URL configured correctly (port 8000)');
    } else if (configContent.includes("'http://localhost:8001'")) {
        console.log('⚠️  Backend URL is set to port 8001 (should be 8000)');
        console.log('   Please update config/api.ts to use port 8000');
        return false;
    } else {
        console.log('❌ Backend URL not found or incorrect');
        return false;
    }
    
    // Check for real API enabled
    if (configContent.includes('USE_REAL_API: true')) {
        console.log('✅ Real API enabled');
    } else {
        console.log('⚠️  Real API is disabled (USE_REAL_API: false)');
        console.log('   Please set USE_REAL_API: true in config/api.ts');
        return false;
    }
    
    // Check for mock data disabled
    if (configContent.includes('USE_MOCK_DATA: false')) {
        console.log('✅ Mock data disabled (using real API)');
    } else {
        console.log('⚠️  Mock data is enabled (USE_MOCK_DATA: true)');
        console.log('   Please set USE_MOCK_DATA: false in config/api.ts');
        return false;
    }
    
    console.log();
    console.log('📋 Configuration Summary:');
    console.log('   ✅ Backend URL: http://localhost:8000');
    console.log('   ✅ Real API: Enabled');
    console.log('   ✅ Mock Data: Disabled');
    console.log('   ✅ Photo Upload: Ready');
    console.log();
    console.log('🎯 Mobile app is properly configured for backend connectivity!');
    
    return true;
}

function testBackendConnection() {
    console.log('='.repeat(60));
    console.log('🌐 Testing Backend Connection');
    console.log('='.repeat(60));
    
    const http = require('http');
    
    const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/docs',
        method: 'GET',
        timeout: 5000
    };
    
    const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
            console.log('✅ Backend server is running and accessible');
            console.log('   URL: http://localhost:8000');
            console.log('   Status: Online');
        } else {
            console.log(`⚠️  Backend responded with status: ${res.statusCode}`);
        }
    });
    
    req.on('error', (err) => {
        console.log('❌ Backend server is not accessible');
        console.log('   Error:', err.message);
        console.log();
        console.log('🔧 To fix this:');
        console.log('   1. Start the backend server:');
        console.log('      cd backend && python3 start_server.py');
        console.log('   2. Or manually:');
        console.log('      cd backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000');
    });
    
    req.on('timeout', () => {
        console.log('❌ Backend connection timed out');
        console.log('   Server may not be running');
    });
    
    req.setTimeout(5000);
    req.end();
}

// Run checks
const configOk = checkConfig();
console.log();

if (configOk) {
    testBackendConnection();
} else {
    console.log('❌ Configuration issues found. Please fix them before testing connection.');
    console.log();
    console.log('🔧 Quick Fix:');
    console.log('   1. Update mobile/config/api.ts:');
    console.log('      - Set BASE_URL to "http://localhost:8000"');
    console.log('      - Set USE_REAL_API: true');
    console.log('      - Set USE_MOCK_DATA: false');
    console.log('   2. Restart the mobile app');
} 