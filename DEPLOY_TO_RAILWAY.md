# Deploy Backend to Railway

## Quick Steps:

1. **Open a new terminal** and navigate to backend:
   ```bash
   cd sf10x-hackathon/backend
   ```

2. **Deploy to Railway**:
   ```bash
   railway up
   ```

3. **Get your Railway URL**:
   ```bash
   railway status
   ```
   
   You'll see something like:
   ```
   Project: sf10x-demo-test
   Environment: production
   Service: sf10x-hackathon-production
   URL: https://sf10x-hackathon-production.up.railway.app
   ```

4. **Update your mobile app** with the Railway URL:
   
   Edit `mobile/.env.production`:
   ```
   EXPO_PUBLIC_API_BASE_URL=https://your-railway-url.up.railway.app
   ```

5. **Restart Expo**:
   ```bash
   cd mobile
   # Kill current Expo (Ctrl+C)
   npm start
   ```

## Why Railway is Better for Demos:

- ✅ No network configuration needed
- ✅ Works from any device anywhere
- ✅ Already has your OpenAI API key
- ✅ HTTPS enabled
- ✅ No firewall issues

## Alternative: Fix Local Backend

If you prefer local development:

1. Kill the current backend process
2. Start with: `python3 -m uvicorn main:app --reload --port 8001 --host 0.0.0.0`
3. Make sure your firewall allows port 8001

The Railway deployment will solve all your network issues immediately!