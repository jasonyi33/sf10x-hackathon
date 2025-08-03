#!/usr/bin/env python3
"""
Robust Backend Server Startup Script
Ensures the server starts correctly and provides clear feedback
"""
import os
import sys
import subprocess
import time
import requests
import signal
import atexit

def check_port_available(port):
    """Check if port is available"""
    try:
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        return result != 0
    except:
        return False

def kill_process_on_port(port):
    """Kill any process using the specified port"""
    try:
        result = subprocess.run(['lsof', '-ti', str(port)], capture_output=True, text=True)
        if result.stdout.strip():
            pids = result.stdout.strip().split('\n')
            for pid in pids:
                if pid:
                    print(f"Killing process {pid} on port {port}")
                    subprocess.run(['kill', '-9', pid])
            time.sleep(1)
    except Exception as e:
        print(f"Warning: Could not kill process on port {port}: {e}")

def test_server_health(url, max_retries=5):
    """Test if server is responding"""
    for i in range(max_retries):
        try:
            response = requests.get(f"{url}/docs", timeout=5)
            if response.status_code == 200:
                return True
        except:
            pass
        time.sleep(1)
    return False

def start_server():
    """Start the backend server with proper error handling"""
    port = 8000
    host = "0.0.0.0"
    
    print("=" * 60)
    print("🚀 Starting SF Homeless Outreach Backend Server")
    print("=" * 60)
    
    # Check if we're in the right directory
    if not os.path.exists('main.py'):
        print("❌ Error: main.py not found!")
        print("   Please run this script from the backend directory")
        print("   Current directory:", os.getcwd())
        sys.exit(1)
    
    # Check if port is available
    if not check_port_available(port):
        print(f"⚠️  Port {port} is already in use")
        print("   Attempting to kill existing process...")
        kill_process_on_port(port)
        time.sleep(2)
    
    if not check_port_available(port):
        print(f"❌ Port {port} is still in use after cleanup")
        print("   Please manually stop any process using port 8000")
        sys.exit(1)
    
    print(f"✅ Port {port} is available")
    
    # Test app import
    try:
        from main import app
        print("✅ App imports successfully")
    except Exception as e:
        print(f"❌ Failed to import app: {e}")
        sys.exit(1)
    
    # Start server
    print(f"🌐 Starting server on {host}:{port}")
    print("   API Documentation: http://localhost:8000/docs")
    print("   Photo Upload: http://localhost:8000/api/photos/upload")
    print("   Simple Upload: http://localhost:8000/api/photos/upload-simple")
    print()
    
    try:
        # Start uvicorn server
        process = subprocess.Popen([
            sys.executable, '-m', 'uvicorn', 
            'main:app', 
            '--host', host, 
            '--port', str(port)
        ])
        
        # Wait a moment for server to start
        time.sleep(3)
        
        # Test server health
        if test_server_health(f"http://localhost:{port}"):
            print("✅ Server is running and responding!")
            print("✅ Mobile app can now connect to backend")
            print()
            print("📱 Mobile App Configuration:")
            print("   - Backend URL: http://localhost:8000")
            print("   - Photo upload endpoints available")
            print("   - API documentation available")
            print()
            print("🎯 Ready for mobile app integration!")
            print("   Press Ctrl+C to stop the server")
            
            # Keep server running
            try:
                process.wait()
            except KeyboardInterrupt:
                print("\n🛑 Stopping server...")
                process.terminate()
                process.wait()
                print("✅ Server stopped")
        else:
            print("❌ Server failed to start properly")
            process.terminate()
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    start_server() 