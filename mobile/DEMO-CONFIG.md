# Demo Configuration Guide

This app can now run in multiple modes for different demo scenarios:

## Demo Modes

### 1. MOCK Mode (Default - No Internet Required)
- **Best for**: Offline demos, presentations without internet
- **Configuration**: Already set as default
- **Features**: Uses pre-built mock data, works completely offline
- **To enable**: No changes needed (already enabled)

### 2. LOCAL Mode (Requires Local Backend)
- **Best for**: Development, demos with full functionality
- **Configuration**: Change `DEMO_MODE: 'LOCAL'` in `config/api.ts` line 18
- **Features**: Uses your local backend on localhost:8001
- **Requirements**: Backend must be running on port 8001

### 3. RAILWAY Mode (Public Deployment)
- **Best for**: Demos anywhere with internet
- **Configuration**: Change `DEMO_MODE: 'RAILWAY'` in `config/api.ts` line 18
- **Features**: Uses stable public backend URL
- **Requirements**: Internet connection

## Quick Demo Mode Switching

### For Demo Without Internet:
```typescript
// In mobile/config/api.ts line 18:
DEMO_MODE: 'MOCK', // Uses mock data, no backend needed
```

### For Demo With Your Local Backend:
```typescript
// In mobile/config/api.ts line 18:
DEMO_MODE: 'LOCAL', // Uses localhost:8001
```

### For Demo From Any Location:
```typescript
// In mobile/config/api.ts line 18:
DEMO_MODE: 'RAILWAY', // Uses public deployment
```

## Environment Variable Override

You can also set the demo mode via environment variable:
```bash
export EXPO_PUBLIC_DEMO_MODE=MOCK   # or LOCAL or RAILWAY
```

This way you don't need to edit code files for different demo scenarios.

## Mock Data Features

In MOCK mode, the app includes:
- Pre-loaded individuals with realistic data
- Simulated transcription responses
- Working search and profile views
- Voice assistant with mock responses
- No network dependency

## Current Status

The app is currently set to **MOCK mode** which means:
✅ Works completely offline
✅ No backend or internet required
✅ Perfect for demos in any location
✅ Shows all app features with realistic data

To switch modes, simply edit line 18 in `mobile/config/api.ts` or set the environment variable.