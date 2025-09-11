"""
Main FastAPI application for SF Homeless Outreach Voice Transcription App
"""
import os
import json
import asyncio
import ssl
import httpx
import websockets
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="SF Homeless Outreach API", version="0.1.0")

# CORS configuration for hackathon demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Simple health check endpoint"""
    return {"status": "ok"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "SF Homeless Outreach API",
        "framework": "FastAPI",
        "project": "sf10x-hackathon",
        "note": "If you see Flask errors, Railway deployed the wrong project!"
    }

@app.websocket("/test-ws")
async def test_websocket(websocket: WebSocket):
    """Test WebSocket endpoint"""
    await websocket.accept()
    await websocket.send_text("Hello from test WebSocket!")
    await websocket.close()

@app.websocket("/api/voice-assistant/realtime/ws")
async def websocket_realtime_proxy(websocket: WebSocket):
    """
    WebSocket proxy for OpenAI Realtime API
    Handles authentication and forwards messages between client and OpenAI
    """
    print("🔌 WebSocket connection attempt received - GPT Realtime version")
    await websocket.accept()
    print("✅ WebSocket connection accepted")
    
    try:
        # Get OpenAI API key
        api_key = os.getenv("OPENAI_API_KEY")
        print(f"🔑 OpenAI API key available: {'Yes' if api_key else 'No'}")
        if not api_key:
            print("❌ OpenAI API key not configured")
            await websocket.send_text(json.dumps({
                "type": "error",
                "error": {"message": "OpenAI API key not configured"}
            }))
            return
        
        # Create ephemeral token for OpenAI Realtime API
        session_config = {
            "session": {
                "type": "realtime",
                "model": "gpt-realtime",
                "instructions": """You are a specialized AI assistant for homeless outreach workers. You provide expert guidance on:

1. **Crisis Intervention**: How to safely approach and de-escalate situations with homeless individuals
2. **Care Protocols**: Best practices for providing assistance, medical care, and support
3. **Resource Recommendations**: Information about shelters, food banks, medical services, and social programs
4. **Medical Emergency Protocols**: Steps to take during medical emergencies
5. **De-escalation Techniques**: Strategies for managing tense or potentially dangerous situations
6. **Legal/Rights Information**: Understanding the rights of homeless individuals and legal considerations
7. **Safety Guidelines**: How to protect yourself and others while providing outreach services

Always prioritize safety, empathy, and practical guidance. Be concise but comprehensive in your responses.""",
                "audio": {
                    "output": {
                        "voice": "alloy",
                        "format": {
                            "type": "audio/pcm",
                            "rate": 24000,
                        },
                    },
                },
            },
        }
        
        # Create ephemeral token
        print("🔑 Creating ephemeral token with OpenAI...")
        print("🔧 Session config:", json.dumps(session_config, indent=2))
        
        async with httpx.AsyncClient(verify=False) as client:
            token_response = await client.post(
                "https://api.openai.com/v1/realtime/client_secrets",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=session_config,
            )
            
            print(f"🔑 Token response status: {token_response.status_code}")
            if not token_response.is_success:
                print(f"❌ Failed to create ephemeral token: {token_response.text}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "error": {"message": f"Failed to create ephemeral token: {token_response.text}"}
                }))
                return
            
            token_data = token_response.json()
            ephemeral_key = token_data["value"]
            print("✅ Ephemeral token created successfully")
        
        # Connect to OpenAI Realtime API
        openai_ws_url = f"wss://api.openai.com/v1/realtime?model=gpt-realtime"
        print(f"🔌 Connecting to OpenAI WebSocket: {openai_ws_url}")
        
        # Create SSL context that doesn't verify certificates (for development)
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        # Connect with proper headers
        headers = {
            "Authorization": f"Bearer {ephemeral_key}"
        }
        
        async with websockets.connect(openai_ws_url, ssl=ssl_context, extra_headers=headers) as openai_ws:
            print("✅ Connected to OpenAI Realtime API")
            
            # Send session configuration to OpenAI
            session_update = {
                "type": "session.update",
                "session": session_config["session"]
            }
            await openai_ws.send(json.dumps(session_update))
            print("🔧 Session configuration sent to OpenAI")
            
            # Forward messages between client and OpenAI
            async def forward_to_openai():
                try:
                    while True:
                        message = await websocket.receive_text()
                        print(f"📤 Forwarding to OpenAI: {message[:100]}...")
                        await openai_ws.send(message)
                except Exception as e:
                    print(f"❌ Error forwarding to OpenAI: {e}")
            
            async def forward_to_client():
                try:
                    while True:
                        message = await openai_ws.recv()
                        print(f"📨 Received from OpenAI: {message[:100]}...")
                        await websocket.send_text(message)
                except Exception as e:
                    print(f"❌ Error forwarding to client: {e}")
            
            # Run both forwarding tasks concurrently
            await asyncio.gather(
                forward_to_openai(),
                forward_to_client(),
                return_exceptions=True
            )
            
    except Exception as e:
        print(f"❌ WebSocket proxy error: {str(e)}")
        try:
            await websocket.send_text(json.dumps({
                "type": "error",
                "error": {"message": f"WebSocket proxy error: {str(e)}"}
            }))
        except:
            pass

# Import API routers
from api import categories, transcription, individuals, export, embeddings, voice_assistant

# Register routers
app.include_router(categories.router)
app.include_router(transcription.router)
app.include_router(individuals.router)
app.include_router(export.router)
app.include_router(embeddings.router)
app.include_router(voice_assistant.router)