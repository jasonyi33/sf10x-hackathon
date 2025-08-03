"""
OpenAI API integration for Whisper transcription and GPT-4o categorization
"""
import os
import httpx
import tempfile
import json
import re
from typing import Optional, List, Dict, Any
from openai import AsyncOpenAI
from urllib.parse import urlparse


class OpenAIService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
    async def transcribe_audio(self, audio_url: str) -> str:
        """
        Transcribe audio from Supabase URL using OpenAI Whisper API
        
        Args:
            audio_url: Public URL to M4A audio file in Supabase Storage
            
        Returns:
            Plain text transcription
            
        Raises:
            ValueError: For invalid URL, wrong format, or duration issues
            Exception: For API or network errors
        """
        # Validate URL format
        parsed = urlparse(audio_url)
        if not parsed.scheme or not parsed.netloc:
            raise ValueError("Invalid URL format")
            
        # Check if it's a Supabase URL
        if "supabase" not in parsed.netloc:
            raise ValueError("URL must be from Supabase Storage")
            
        # Download audio file to temporary location
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(audio_url, timeout=30.0)
                response.raise_for_status()
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404:
                    raise ValueError("Audio file not found")
                raise Exception(f"Failed to download audio: {e}")
            except httpx.TimeoutException:
                raise Exception("Network timeout while downloading audio")
                
        # Save to temporary file
        with tempfile.NamedTemporaryFile(suffix=".m4a", delete=False) as tmp_file:
            tmp_file.write(response.content)
            tmp_path = tmp_file.name
            
        try:
            # Validate file format (basic check for M4A header)
            with open(tmp_path, 'rb') as f:
                header = f.read(12)
                # M4A files typically have 'ftyp' at offset 4
                if b'ftyp' not in header:
                    raise ValueError("File is not in M4A format")
            
            # Send to Whisper API
            with open(tmp_path, 'rb') as audio_file:
                transcript = await self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="text"
                )
                
            # Note: Duration validation would happen on frontend
            # Backend accepts whatever audio Whisper can process
            # Frontend enforces 10-second minimum and 2-minute maximum
            
            return transcript.strip()
            
        except Exception as e:
            if "Audio file is too short" in str(e):
                raise ValueError("Audio must be at least 10 seconds long")
            elif "Audio file is too long" in str(e):
                raise ValueError("Audio must be less than 2 minutes")
            raise
            
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
                
    async def categorize_transcription(self, transcription: str, categories: list) -> dict:
        """
        Extract structured data from transcription using GPT-4o
        
        Args:
            transcription: Plain text transcription from Whisper
            categories: List of category definitions from database
            
        Returns:
            Dict with extracted data for each category
            
        Raises:
            Exception: For API errors or invalid responses
        """
        # Build dynamic prompt with all categories
        category_lines = []
        for cat in categories:
            line = f"- {cat['name']} ({cat['type']}"
            
            # Add options for select types
            if cat['type'] == 'single_select' and cat.get('options'):
                options_str = ", ".join([opt['label'] for opt in cat['options']])
                line += f": {options_str}"
            elif cat['type'] == 'multi_select' and cat.get('options'):
                options_str = ", ".join(cat['options'])
                line += f": {options_str}"
                
            # Add required flag
            if cat.get('is_required'):
                line += ", required"
                
            line += ")"
            category_lines.append(line)
            
        categories_text = "\n".join(category_lines)
        
        # Build the prompt following PRD format exactly
        prompt = f"""Extract information from this transcription into these categories:
{categories_text}

Rules:
- For multi-select, return array of matching options
- For single-select, return one option from the available choices
- For numbers, extract digits only
- Always attempt to extract required fields: Name, Height, Weight, Skin Color, Approximate Age
- Return null for missing non-required information
- Be conservative - only extract explicitly stated info
- For skin color, map descriptions to Light/Medium/Dark
- For height, convert to total inches (e.g., "6 feet" = 72, "5'4\"" = 64)
- For approximate_age, ALWAYS return as [min, max] array:
  - Specific ages: use ±2 years (e.g., "45 years old" → [43, 47])
  - Descriptive ages: use standard ranges:
    - "teenage"/"teenager" → [13, 19]
    - "young adult" → [18, 30]
    - "middle-aged" → [40, 60]
    - "elderly"/"senior" → [65, 85]
    - "in their twenties" → [20, 29], "thirties" → [30, 39], etc.
  - No age mentioned: return [-1, -1] for "Unknown"
  - NEVER return a single number, always [min, max] format

Transcription: {transcription}

Return JSON only."""

        try:
            # Call GPT-4o API
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a data extraction assistant. Extract only explicitly stated information from transcriptions. Return valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,  # Lower temperature for more consistent extraction
                response_format={"type": "json_object"}  # Force JSON response
            )
            
            # Parse JSON response
            result = response.choices[0].message.content
            extracted_data = json.loads(result) if isinstance(result, str) else result
            
            # Post-process the data
            processed_data = {}
            for cat in categories:
                field_name = cat['name']
                value = extracted_data.get(field_name)
                
                # Handle different field types
                # Special handling for required range fields (like age)
                if cat['type'] == 'range' and field_name == 'approximate_age':
                    # Always process age, even if None
                    if value is None:
                        value = [-1, -1]  # Unknown
                    elif not isinstance(value, list):
                        # If GPT returns a single number, string, or object, handle it
                        if isinstance(value, str):
                            # Handle string values like "Unknown"
                            if value.lower() in ["unknown", "n/a", "none", ""]:
                                value = [-1, -1]
                            else:
                                # Try to parse as number
                                try:
                                    age = int(value)
                                    if age == -1:
                                        value = [-1, -1]
                                    elif age < 0 or age > 120:
                                        value = [-1, -1]
                                    else:
                                        value = [max(0, age - 2), min(120, age + 2)]
                                except (ValueError, TypeError):
                                    value = [-1, -1]
                        elif isinstance(value, dict):
                            # Handle object format like {"min": 45, "max": 50}
                            try:
                                min_age = int(value.get("min", -1))
                                max_age = int(value.get("max", -1))
                                if min_age >= 0 and max_age > min_age and max_age <= 120:
                                    value = [min_age, max_age]
                                else:
                                    value = [-1, -1]
                            except (ValueError, TypeError):
                                value = [-1, -1]
                        else:
                            # Handle numeric values
                            try:
                                age = int(value)
                                # Special case for -1 (unknown)
                                if age == -1:
                                    value = [-1, -1]
                                # Check bounds
                                elif age < 0 or age > 120:
                                    value = [-1, -1]
                                else:
                                    value = [max(0, age - 2), min(120, age + 2)]
                            except (ValueError, TypeError):
                                value = [-1, -1]
                    elif len(value) != 2:
                        value = [-1, -1]
                    else:
                        # Ensure values are integers
                        try:
                            value = [int(value[0]), int(value[1])]
                        except (ValueError, TypeError):
                            value = [-1, -1]
                    processed_data[field_name] = value
                elif value is not None:
                    if cat['type'] == 'number':
                        # Special handling for height field
                        if field_name == 'height':
                            # If it's a string, parse it
                            if isinstance(value, str):
                                value = self._parse_height(value)
                            # If it's a small number (likely feet), convert to inches
                            elif isinstance(value, (int, float)) and value < 10:
                                value = value * 12
                        # Ensure it's a number
                        try:
                            value = float(value) if value is not None else None
                        except (ValueError, TypeError):
                            value = None
                            
                    elif cat['type'] == 'single_select':
                        # Validate against available options
                        if cat.get('options'):
                            valid_labels = [opt['label'] for opt in cat['options']]
                            if value not in valid_labels:
                                # Try case-insensitive match
                                for label in valid_labels:
                                    if label.lower() == str(value).lower():
                                        value = label
                                        break
                                else:
                                    value = None
                                    
                    elif cat['type'] == 'multi_select':
                        # Ensure it's a list
                        if not isinstance(value, list):
                            value = [value] if value else []
                        # Validate against available options
                        if cat.get('options'):
                            valid_options = cat['options']
                            value = [v for v in value if v in valid_options]
                            
                    processed_data[field_name] = value
                
            return processed_data
            
        except Exception as e:
            raise Exception(f"Failed to categorize transcription: {str(e)}")
            
    def _parse_height(self, height_str: str) -> Optional[float]:
        """Parse height strings to inches"""
        if not height_str:
            return None
            
        # Handle "X feet Y inches" or "X'Y"""
        
        # Try "X feet Y inches" pattern
        match = re.search(r'(\d+)\s*(?:feet|foot|ft)(?:\s+(\d+)\s*(?:inches|inch|in))?', height_str, re.I)
        if match:
            feet = int(match.group(1))
            inches = int(match.group(2)) if match.group(2) else 0
            return feet * 12 + inches
            
        # Try "X'Y"" pattern
        match = re.search(r"(\d+)'(\d+)", height_str)
        if match:
            feet = int(match.group(1))
            inches = int(match.group(2))
            return feet * 12 + inches
            
        # Try just inches
        match = re.search(r'(\d+)\s*(?:inches|inch|in)', height_str, re.I)
        if match:
            return int(match.group(1))
            
        # Try to extract any number
        match = re.search(r'(\d+)', height_str)
        if match:
            num = int(match.group(1))
            # If it's a reasonable height in inches, return it
            if 48 <= num <= 96:  # 4-8 feet
                return num
            # If it looks like feet, convert
            elif 4 <= num <= 8:
                return num * 12
                
        return None
    
    async def find_duplicates(self, new_data: dict, existing_individuals: list) -> list:
        """
        Find potential duplicate individuals using LLM comparison
        
        Args:
            new_data: Dictionary of categorized data for the new individual
            existing_individuals: List of existing individuals to compare against
                                (pre-filtered by name similarity)
                                
        Returns:
            List of matches sorted by confidence (highest first):
            [{"id": "uuid", "name": "John Doe", "confidence": 95, "data": {...}}, ...]
            
        Note: Frontend handles auto-merge threshold (≥95%)
        """
        if not existing_individuals:
            return []
            
        matches = []
        
        # Compare against each existing individual
        for existing in existing_individuals:
            # Build comparison prompt
            prompt = f"""Compare these two individuals and return a confidence score (0-100) 
that they are the same person based on all attributes:

Person 1: {json.dumps(new_data, indent=2)}

Person 2: {json.dumps(existing.get('data', {}), indent=2)}

Consider name similarity, physical attributes, and other characteristics.
Return only a number 0-100."""

            try:
                # Call GPT-4o for comparison
                response = await self.client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": "You are a data comparison assistant. Compare individuals based on their attributes and return only a confidence score as a number."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,  # Lower temperature for consistent scoring
                    max_tokens=10  # We only need a number
                )
                
                # Parse confidence score
                result = response.choices[0].message.content.strip()
                # Extract just the number in case there's extra text
                confidence_match = re.search(r'\d+', result)
                if confidence_match:
                    confidence = int(confidence_match.group())
                    confidence = min(max(confidence, 0), 100)  # Ensure 0-100 range
                    
                    matches.append({
                        "id": existing.get('id'),
                        "name": existing.get('name', 'Unknown'),
                        "confidence": confidence,
                        "data": existing.get('data', {})
                    })
            except Exception as e:
                # Log error but continue with other comparisons
                print(f"Error comparing with {existing.get('name', 'Unknown')}: {str(e)}")
                continue
        
        # Sort by confidence (highest first)
        matches.sort(key=lambda x: x['confidence'], reverse=True)
        
        # Only return matches with meaningful confidence (>30%)
        return [m for m in matches if m['confidence'] > 30]