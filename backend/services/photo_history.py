"""
Photo history management service
"""
from typing import Dict, Any, Optional, List
from datetime import datetime


def update_photo_history(individual: dict, new_photo_url: str) -> dict:
    """
    Update photo history when new photo added
    
    Requirements:
    - Get current history (max 3 entries)
    - Add current photo_url to history if exists
    - Keep only last 3 photos
    - Set new photo as current
    - Preserve timestamps
    
    Args:
        individual: Current individual record dict
        new_photo_url: URL of the new photo to set as current
        
    Returns:
        Updated individual dict with photo_url and photo_history
    """
    # Create a copy of the individual to avoid mutating the original
    updated_individual = individual.copy()
    
    # Get current photo history, default to empty list if not exists
    history = updated_individual.get('photo_history', [])
    
    # Ensure history is a list (defensive programming)
    if not isinstance(history, list):
        history = []
    
    # Create a copy of history to avoid mutating the original
    history = history.copy()
    
    # If there's a current photo, add it to history
    current_photo_url = updated_individual.get('photo_url')
    if current_photo_url:
        # Get the timestamp when this photo was added
        # Use updated_at as the timestamp for when the current photo was added
        timestamp = updated_individual.get('updated_at', datetime.utcnow().isoformat())
        
        # Add current photo to the beginning of history
        history.insert(0, {
            'url': current_photo_url,
            'added_at': timestamp
        })
    
    # Keep only the last 3 photos in history
    history = history[:3]
    
    # Update the individual with new photo and history
    updated_individual['photo_url'] = new_photo_url
    updated_individual['photo_history'] = history
    
    return updated_individual