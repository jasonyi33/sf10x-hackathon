# Centralized IP Configuration
# Change this IP address to update it everywhere in the project

# Your computer's IP address - change this to update everywhere
LOCAL_IP = '10.23.0.57'

# Port for backend API
API_PORT = '8001'

# Generate full API URL
API_URL = f'http://{LOCAL_IP}:{API_PORT}'

# Generate localhost URL for same-machine testing
LOCALHOST_URL = f'http://localhost:{API_PORT}'

# Centralized Location Configuration
# Change these coordinates to update default location everywhere in the project
DEFAULT_LATITUDE = 37.7821638619815
DEFAULT_LONGITUDE = -122.41033921502972

# Generate location dictionary for API calls
DEFAULT_LOCATION = {
    "latitude": DEFAULT_LATITUDE,
    "longitude": DEFAULT_LONGITUDE
}

# Generate location for Supabase format (lat/lng)
DEFAULT_LOCATION_SUPABASE = {
    "lat": DEFAULT_LATITUDE,
    "lng": DEFAULT_LONGITUDE
}
