#!/bin/bash
# Start backend server accessible from mobile devices

echo "🚀 Starting backend server on all interfaces..."
echo "📱 Mobile devices can connect to: http://$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1):8001"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start with host 0.0.0.0 to accept connections from any IP
python3 -m uvicorn main:app --reload --port 8001 --host 0.0.0.0