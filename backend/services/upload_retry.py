"""
Upload retry service for Supabase storage operations
"""
import asyncio
import logging
from typing import Any
from fastapi import HTTPException, status

# Configure logger
logger = logging.getLogger(__name__)


async def upload_with_retry(
    storage_client: Any,
    file_data: bytes,
    path: str,
    max_retries: int = 2
) -> Any:
    """
    Upload to Supabase with retry logic
    
    Requirements:
    - Attempt 1 + 2 retries = 3 total attempts
    - 1 second delay between attempts
    - Return success or raise HTTPException(500) after 3 failures
    - Log each attempt for debugging
    - Auth errors fail fast without retry
    
    Args:
        storage_client: Supabase storage client (e.g., supabase.storage.from_('photos'))
        file_data: Binary file data to upload
        path: Path where file should be stored
        max_retries: Maximum number of retries (default 2 = 3 total attempts)
        
    Returns:
        Upload response object
        
    Raises:
        HTTPException: 401 for auth errors, 500 for persistent failures
    """
    attempt = 0
    last_error = None
    
    while attempt <= max_retries:
        try:
            logger.info(f"Upload attempt {attempt + 1} for path: {path}")
            
            # Attempt upload
            response = storage_client.upload(
                path=path,
                file=file_data,
                file_options={"content-type": "image/jpeg"}
            )
            
            # Check if upload succeeded
            if hasattr(response, 'error') and response.error:
                # Check if it's an auth error
                error_msg = str(response.error).lower()
                if any(auth_term in error_msg for auth_term in ['auth', 'credential', 'unauthorized', 'forbidden']):
                    logger.error(f"Authentication error on upload: {response.error}")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail=f"Authentication failed: {response.error}"
                    )
                
                # Other error - will retry
                raise Exception(f"Upload failed: {response.error}")
            
            # Success!
            logger.info(f"Upload successful on attempt {attempt + 1}")
            return response
            
        except HTTPException:
            # Re-raise HTTP exceptions (auth errors) immediately
            raise
            
        except Exception as e:
            last_error = str(e)
            logger.warning(f"Upload attempt {attempt + 1} failed: {last_error}")
            
            # Check if this is an auth-related exception
            error_msg = str(e).lower()
            if any(auth_term in error_msg for auth_term in ['invalid credentials', 'authentication', 'unauthorized']):
                logger.error(f"Authentication exception on upload: {e}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Authentication failed: {str(e)}"
                )
            
            # If we've exhausted retries, raise 500
            if attempt >= max_retries:
                logger.error(f"Upload failed after {attempt + 1} attempts: {last_error}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Photo upload failed after 3 attempts: {last_error}"
                )
            
            # Wait before retry
            logger.info(f"Waiting 1 second before retry...")
            await asyncio.sleep(1)
            
            attempt += 1
    
    # This should never be reached, but just in case
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Photo upload failed after 3 attempts: {last_error}"
    )