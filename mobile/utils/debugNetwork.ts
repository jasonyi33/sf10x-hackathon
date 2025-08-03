/**
 * Debug utilities for testing network connectivity
 */
import { API_CONFIG, getApiUrl } from '../config/api';

export const testBackendConnection = async () => {
  console.log('🔍 Testing backend connection...');
  console.log('📍 Backend URL:', API_CONFIG.BASE_URL);
  
  try {
    // Test 1: Simple GET request
    console.log('\n1️⃣ Testing GET /api/debug/ping...');
    const pingResponse = await fetch(getApiUrl('/api/debug/ping'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (pingResponse.ok) {
      const pingData = await pingResponse.json();
      console.log('✅ Ping successful:', pingData);
    } else {
      console.error('❌ Ping failed:', pingResponse.status, pingResponse.statusText);
    }
    
    // Test 2: POST request with data
    console.log('\n2️⃣ Testing POST /api/debug/echo...');
    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'Testing from mobile app',
    };
    
    const echoResponse = await fetch(getApiUrl('/api/debug/echo'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    if (echoResponse.ok) {
      const echoData = await echoResponse.json();
      console.log('✅ Echo successful:', echoData);
    } else {
      console.error('❌ Echo failed:', echoResponse.status, echoResponse.statusText);
    }
    
    // Test 3: Check /health endpoint
    console.log('\n3️⃣ Testing GET /health...');
    const healthResponse = await fetch(getApiUrl('/health'), {
      method: 'GET',
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check successful:', healthData);
    } else {
      console.error('❌ Health check failed:', healthResponse.status, healthResponse.statusText);
    }
    
    console.log('\n✅ All tests completed!');
    return true;
    
  } catch (error: any) {
    console.error('\n❌ Network test failed:', error.message);
    console.error('📱 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    
    if (error.message.includes('Network request failed')) {
      console.error('\n🚨 Backend is not accessible!');
      console.error('💡 Solutions:');
      console.error('1. Kill the current backend process');
      console.error('2. Start backend with: cd backend && ./start.sh');
      console.error('3. Or manually: python3 -m uvicorn main:app --reload --port 8001 --host 0.0.0.0');
      console.error('4. Check your IP in .env.local matches:', API_CONFIG.BASE_URL);
    }
    
    return false;
  }
};