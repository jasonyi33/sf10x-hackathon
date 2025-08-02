"""
Main FastAPI application for SF Homeless Outreach Voice Transcription App
"""
import os
from fastapi import FastAPI
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

# Import API routers
from api import categories, transcription, individuals

# Register routers
app.include_router(categories.router)
app.include_router(transcription.router)
app.include_router(individuals.router)