# Centralized Configuration

This directory contains centralized configuration files to make it easy to update IP addresses and location coordinates across the entire project.

## Quick Setup

1. **Update your IP address** in `ip_config.py`:
   ```python
   LOCAL_IP = '192.168.1.3'  # Change this to your computer's IP
   ```

2. **Update default location coordinates** in `ip_config.py`:
   ```python
   DEFAULT_LATITUDE = 37.80808794862037
   DEFAULT_LONGITUDE = -122.43016054168524
   ```

3. **That's it!** Both IP address and location will now be updated everywhere in the project.

## Files Updated

> **Caveat:** these values are *not* propagated automatically. Consumers import
> from here, but `mobile/config/api.ts` also carries its own hardcoded
> `LOCAL_IP`, and the two currently disagree. The reliable way to point the app
> at a specific backend is the `EXPO_PUBLIC_API_BASE_URL` environment variable
> — see the Mobile section of the root README.

Files that read from this directory:

- `config/ip-config.js` — for JavaScript/TypeScript consumers
- `config/ip_config.py` — for Python consumers (`backend/tests/`)

## How It Works

- **JavaScript/TypeScript**: Uses `config/ip-config.js`
- **Python**: Uses `config/ip_config.py`
- Both files contain the same IP address and are kept in sync

## Finding Your IP Address

### On macOS/Linux:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### On Windows:
```bash
ipconfig | findstr "IPv4"
```

## Example Usage

After updating the IP, you can test the connection:

```bash
# Backend integration tests (require a running backend + live Supabase)
python3 -m pytest backend/tests/test_api_integration.py
```

## Troubleshooting

If you're still having connection issues:

1. Make sure your backend is running: `uvicorn main:app --reload --port 8001`
2. Check that your IP address is correct in `config/ip_config.py` **and** `mobile/config/api.ts`
3. Ensure your mobile device and computer are on the same network
4. Try using `localhost` instead of your IP for same-machine testing
