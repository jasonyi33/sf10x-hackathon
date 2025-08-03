const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const JPEG_QUALITY = 0.8; // 80% quality

/**
 * Compress an image to ensure it's under 5MB and in JPEG format
 * @param {string} imageUri - The URI of the image to compress
 * @returns {Promise<string>} The URI of the compressed image
 */
async function compressImage(imageUri) {
  // Get dependencies at runtime to allow mocking
  const ImageManipulator = require('expo-image-manipulator');
  const FileSystem = require('expo-file-system');
  
  try {
    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    // Initial compression settings
    let compressionQuality = JPEG_QUALITY;
    let maxDimension = 3000; // Start with max 3000px width/height
    
    // Check original file size
    const originalSize = fileInfo.size || 0;
    console.log(`Original image size: ${(originalSize / 1024 / 1024).toFixed(2)}MB`);

    // If already under 5MB and is JPEG, we might still want to process it
    // to ensure consistent format and reasonable dimensions
    if (originalSize < MAX_FILE_SIZE && imageUri.toLowerCase().endsWith('.jpg')) {
      // Just ensure reasonable dimensions
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: maxDimension } }],
        {
          compress: compressionQuality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      return result.uri;
    }

    // Progressive compression for large files
    let compressedUri = imageUri;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      // Resize and compress
      const actions = [];
      
      // Add resize action to maintain aspect ratio
      actions.push({
        resize: { width: maxDimension }
      });

      const result = await ImageManipulator.manipulateAsync(
        compressedUri,
        actions,
        {
          compress: compressionQuality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      compressedUri = result.uri;

      // Check the compressed file size
      const compressedInfo = await FileSystem.getInfoAsync(compressedUri);
      const compressedSize = compressedInfo.size || 0;
      
      console.log(`Attempt ${attempts + 1}: ${(compressedSize / 1024 / 1024).toFixed(2)}MB`);

      if (compressedSize <= MAX_FILE_SIZE) {
        return compressedUri;
      }

      // Adjust compression parameters for next attempt
      attempts++;
      compressionQuality *= 0.8; // Reduce quality by 20%
      maxDimension = Math.floor(maxDimension * 0.8); // Reduce dimensions by 20%
      
      // Ensure we don't go too low
      compressionQuality = Math.max(compressionQuality, 0.4);
      maxDimension = Math.max(maxDimension, 1000);
    }

    // If we still can't get it under 5MB after max attempts, 
    // do one final aggressive compression
    const finalResult = await ImageManipulator.manipulateAsync(
      compressedUri,
      [{ resize: { width: 1000 } }],
      {
        compress: 0.5,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return finalResult.uri;

  } catch (error) {
    console.error('Image compression error:', error);
    throw new Error(`Failed to compress image: ${error.message}`);
  }
}

/**
 * Helper function to get file extension
 */
function getFileExtension(uri) {
  const parts = uri.split('.');
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Check if image needs conversion based on file extension
 */
function needsConversion(uri) {
  const extension = getFileExtension(uri);
  const supportedFormats = ['jpg', 'jpeg', 'png', 'heic', 'heif'];
  return supportedFormats.includes(extension);
}

module.exports = {
  compressImage,
  getFileExtension,
  needsConversion,
};