# Network Error Fix Guide

## Root Cause
The backend is currently running on `localhost` only, which prevents mobile devices (including Expo Go) from connecting to it.

## Solution

### Step 1: Stop the Current Backend
Find the terminal running the backend and press `Ctrl+C` to stop it.

### Step 2: Start Backend on All Interfaces
```bash
cd backend
./start.sh
```

Or manually:
```bash
cd backend
python3 -m uvicorn main:app --reload --port 8001 --host 0.0.0.0
```

The key is the `--host 0.0.0.0` flag, which makes the backend accessible from any device on your network.

### Step 3: Verify Backend is Accessible
After starting, you should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
```

Test it's working:
```bash
# From your computer
curl http://192.168.1.59:8001/health

# Should return: {"status":"ok"}
```

### Step 4: Update Mobile App IP (if needed)
The app is already configured with the correct IP (192.168.1.59:8001) in `.env.local`.

## What We Fixed

1. **Audio Recording Format**: Now properly uses M4A format with 64kbps bitrate as per PRD
2. **Network Debugging**: Added debug utilities to diagnose connection issues
3. **Error Handling**: Improved error messages to show exactly what's failing
4. **Backend Accessibility**: Created start.sh script to ensure backend runs on all interfaces

## Testing the Fix

1. Make sure backend shows it's running on `0.0.0.0:8001`
2. Try recording audio in the app
3. If it still fails, check the console logs - they now include detailed network diagnostics

## For Expo Go Users

When using Expo Go, the backend MUST be running with `--host 0.0.0.0` otherwise your phone cannot connect to it.

## Troubleshooting

If you still get network errors after following these steps:

1. Check your firewall isn't blocking port 8001
2. Make sure your phone is on the same WiFi network as your computer
3. Try accessing http://192.168.1.59:8001/health from your phone's browser
4. Check the backend logs for any errors