import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

export interface CompressionOptions {
  quality?: number; // 0.1 to 1.0
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png';
}

export interface CompressionResult {
  uri: string;
  width: number;
  height: number;
  size?: number; // in bytes, if available
  originalSize?: number; // in bytes, if available
}

/**
 * Image compression service for mobile app
 * Handles HEIC→JPEG conversion and compression
 */
export class ImageCompressionService {
  private static instance: ImageCompressionService;

  private constructor() {}

  static getInstance(): ImageCompressionService {
    if (!ImageCompressionService.instance) {
      ImageCompressionService.instance = new ImageCompressionService();
    }
    return ImageCompressionService.instance;
  }

  /**
   * Compress and convert image
   * @param uri - Image URI to compress
   * @param options - Compression options
   * @returns Promise<CompressionResult>
   */
  async compressImage(
    uri: string,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const {
      quality = 0.8,
      maxWidth = 1024,
      maxHeight = 1024,
      format = 'jpeg'
    } = options;

    try {
      // Get image info first
      const imageInfo = await ImageManipulator.manipulateAsync(
        uri,
        [], // no manipulations
        { format: ImageManipulator.SaveFormat.JPEG }
      );

      // Calculate resize dimensions if needed
      let resizeActions: ImageManipulator.Action[] = [];
      
      if (imageInfo.width > maxWidth || imageInfo.height > maxHeight) {
        const aspectRatio = imageInfo.width / imageInfo.height;
        
        let newWidth = imageInfo.width;
        let newHeight = imageInfo.height;
        
        if (newWidth > maxWidth) {
          newWidth = maxWidth;
          newHeight = newWidth / aspectRatio;
        }
        
        if (newHeight > maxHeight) {
          newHeight = maxHeight;
          newWidth = newHeight * aspectRatio;
        }
        
        resizeActions = [
          {
            resize: {
              width: Math.round(newWidth),
              height: Math.round(newHeight)
            }
          }
        ];
      }

      // Perform compression and conversion
      const result = await ImageManipulator.manipulateAsync(
        uri,
        resizeActions,
        {
          compress: quality,
          format: format === 'jpeg' 
            ? ImageManipulator.SaveFormat.JPEG 
            : ImageManipulator.SaveFormat.PNG
        }
      );

      return {
        uri: result.uri,
        width: result.width,
        height: result.height
      };

    } catch (error) {
      console.error('Image compression failed:', error);
      throw new Error('Failed to compress image');
    }
  }

  /**
   * Convert HEIC to JPEG (iOS specific)
   * @param uri - HEIC image URI
   * @param quality - JPEG quality (0.1 to 1.0)
   * @returns Promise<CompressionResult>
   */
  async convertHeicToJpeg(
    uri: string,
    quality: number = 0.8
  ): Promise<CompressionResult> {
    if (Platform.OS !== 'ios') {
      // On Android, just return the original image
      return this.compressImage(uri, { quality, format: 'jpeg' });
    }

    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [], // no manipulations
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG
        }
      );

      return {
        uri: result.uri,
        width: result.width,
        height: result.height
      };

    } catch (error) {
      console.error('HEIC to JPEG conversion failed:', error);
      throw new Error('Failed to convert HEIC to JPEG');
    }
  }

  /**
   * Optimize image for upload (standard settings)
   * @param uri - Image URI to optimize
   * @returns Promise<CompressionResult>
   */
  async optimizeForUpload(uri: string): Promise<CompressionResult> {
    return this.compressImage(uri, {
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      format: 'jpeg'
    });
  }

  /**
   * Create thumbnail (small version for preview)
   * @param uri - Image URI to create thumbnail from
   * @returns Promise<CompressionResult>
   */
  async createThumbnail(uri: string): Promise<CompressionResult> {
    return this.compressImage(uri, {
      quality: 0.6,
      maxWidth: 200,
      maxHeight: 200,
      format: 'jpeg'
    });
  }

  /**
   * Validate image file
   * @param uri - Image URI to validate
   * @returns Promise<boolean>
   */
  async validateImage(uri: string): Promise<boolean> {
    try {
      await ImageManipulator.manipulateAsync(
        uri,
        [],
        { format: ImageManipulator.SaveFormat.JPEG }
      );
      return true;
    } catch (error) {
      console.error('Image validation failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const imageCompressionService = ImageCompressionService.getInstance();

// Export convenience functions
export const compressImage = (uri: string, options?: CompressionOptions) =>
  imageCompressionService.compressImage(uri, options);

export const convertHeicToJpeg = (uri: string, quality?: number) =>
  imageCompressionService.convertHeicToJpeg(uri, quality);

export const optimizeForUpload = (uri: string) =>
  imageCompressionService.optimizeForUpload(uri);

export const createThumbnail = (uri: string) =>
  imageCompressionService.createThumbnail(uri);

export const validateImage = (uri: string) =>
  imageCompressionService.validateImage(uri); 