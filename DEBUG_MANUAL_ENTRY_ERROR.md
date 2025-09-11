# Debug Guide: Manual Entry Error

## Error Description
`❌ Save individual error: [Error: [object Object]]` when trying manual entry

## Root Cause Analysis
This error typically occurs when the frontend can't communicate with the backend API. The error message is generic because the original error details are being lost.

## Debugging Steps

### 1. Check Backend Server Status
First, verify if your backend server is running:

```bash
cd /Users/bowenxia/sf10x-hackathon
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload
```

### 2. Check Network Configuration
The app is configured to connect to: `http://192.168.1.3:8001`

**Verify the IP address:**
```bash
# Check your computer's IP address
ifconfig | grep inet
# or
ipconfig getifaddr en0
```

**Update API configuration if needed:**
Edit `mobile/config/api.ts` and update the BASE_URL:
```typescript
BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://YOUR_ACTUAL_IP:8001',
```

### 3. Test Backend Connectivity
Test if the backend is reachable:

```bash
# Test from terminal
curl http://192.168.1.3:8001/api/categories

# Or test with a simple ping
curl -I http://192.168.1.3:8001/api/categories
```

### 4. Check Console Logs
The improved error handling will now show detailed logs:

- `🌍 API URL`: Shows the full API URL being called
- `📤 Request body`: Shows the data being sent
- `🌐 Network test`: Tests if backend is reachable
- `❌ Detailed error`: Shows specific error message

### 5. Common Solutions

#### Option A: Use Localhost (if testing on same machine)
```typescript
// In mobile/config/api.ts
BASE_URL: 'http://localhost:8001',
```

#### Option B: Use Correct IP Address
```bash
# Find your IP address
ifconfig | grep "inet " | grep -v 127.0.0.1

# Update mobile/config/api.ts with the correct IP
BASE_URL: 'http://YOUR_ACTUAL_IP:8001',
```

#### Option C: Disable API Calls (Use Mock Data)
```typescript
// In mobile/config/api.ts - temporarily for testing
DEMO: {
  USE_MOCK_DATA: true, // This will bypass API calls
}
```

## Error Message Improvements

The updated error handling now provides:

1. **Network connectivity check** - Tests if backend is reachable
2. **Detailed HTTP error messages** - Shows status codes and responses
3. **Request logging** - Shows exactly what data is being sent
4. **Fallback error extraction** - Attempts to get meaningful error messages

## Quick Fix for Testing

If you want to test the location functionality without fixing the backend connectivity issue:

1. **Enable mock data temporarily:**
   ```typescript
   // In mobile/config/api.ts
   DEMO: {
     USE_MOCK_DATA: true,
   }
   ```

2. **Test the UI functionality**
3. **Fix backend connectivity**
4. **Re-enable real API calls**

## Expected Console Output (After Fix)

When working correctly, you should see:
```
📊 Processed categorized data: { name: "John Doe", height: 72, ... }
🔀 Merge with ID: null
🌍 API URL: http://192.168.1.3:8001/api/individuals
🌐 Network test - Backend reachable: true
➕ Creating new individual
📤 Create request body: { "data": { "name": "John Doe", ... } }
✅ Successfully saved new individual: { individual: { id: "...", ... } }
```

## Next Steps

1. **Check backend is running** on the correct port
2. **Verify IP address** in config matches your machine
3. **Test network connectivity** using curl
4. **Check console logs** for detailed error information
5. **Try manual entry again** and report specific error messages
