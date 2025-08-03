// Mock expo modules BEFORE any imports
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg' }
}));

jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn()
}));

// Now safe to require
const { compressImage } = require('../imageCompression');

describe('Image Compression Service', () => {
  let ImageManipulator;
  let FileSystem;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get mocked modules
    ImageManipulator = require('expo-image-manipulator');
    FileSystem = require('expo-file-system');
    
    // Setup default mocks
    ImageManipulator.SaveFormat = { JPEG: 'jpeg' };
    
    // Default mock for FileSystem
    FileSystem.getInfoAsync = jest.fn().mockResolvedValue({
      exists: true,
      size: 1024 * 1024, // 1MB default
      uri: 'file:///test.jpg',
    });
  });

  // Test 1: HEIC file converts to JPEG
  test('1. HEIC file converts to JPEG', async () => {
    const heicUri = 'file:///test.heic';
    const jpegUri = 'file:///compressed.jpg';
    
    ImageManipulator.manipulateAsync = jest.fn().mockResolvedValue({
      uri: jpegUri,
      width: 1000,
      height: 1000,
    });

    const result = await compressImage(heicUri);

    expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
      heicUri,
      expect.any(Array),
      expect.objectContaining({
        format: 'jpeg',
        compress: 0.8,
      })
    );
    expect(result).toBe(jpegUri);
  });

  // Test 2: Large image (>5MB) compressed successfully
  test('2. Large image (>5MB) compressed successfully', async () => {
    const largeImageUri = 'file:///large.jpg';
    const compressedUri = 'file:///compressed.jpg';
    
    // Mock large file
    FileSystem.getInfoAsync
      .mockResolvedValueOnce({ exists: true, size: 6 * 1024 * 1024, uri: largeImageUri }) // Original
      .mockResolvedValueOnce({ exists: true, size: 4 * 1024 * 1024, uri: compressedUri }); // After compression

    ImageManipulator.manipulateAsync = jest.fn().mockResolvedValue({
      uri: compressedUri,
      width: 2000,
      height: 2000,
    });

    const result = await compressImage(largeImageUri);

    expect(ImageManipulator.manipulateAsync).toHaveBeenCalled();
    expect(result).toBe(compressedUri);
    
    // Verify it checked the compressed file size
    expect(FileSystem.getInfoAsync).toHaveBeenCalledWith(compressedUri);
  });

  // Test 3: Small image (<5MB) not over-compressed
  test('3. Small image (<5MB) not over-compressed', async () => {
    const smallImageUri = 'file:///small.jpg';
    const processedUri = 'file:///processed.jpg';
    
    // Mock small file
    FileSystem.getInfoAsync = jest.fn().mockResolvedValue({
      exists: true,
      size: 2 * 1024 * 1024, // 2MB
      uri: smallImageUri,
    });

    ImageManipulator.manipulateAsync = jest.fn().mockResolvedValue({
      uri: processedUri,
      width: 1000,
      height: 1000,
    });

    const result = await compressImage(smallImageUri);

    // Should still process but maintain quality
    expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
      smallImageUri,
      expect.any(Array),
      expect.objectContaining({
        compress: 0.8, // Should maintain 80% quality
      })
    );
    expect(result).toBe(processedUri);
  });

  // Test 4: Output is valid JPEG format
  test('4. Output is valid JPEG format', async () => {
    const inputUri = 'file:///input.png';
    const outputUri = 'file:///output.jpg';
    
    ImageManipulator.manipulateAsync = jest.fn().mockResolvedValue({
      uri: outputUri,
      width: 1000,
      height: 1000,
    });

    const result = await compressImage(inputUri);

    // Verify JPEG format was specified
    expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
      inputUri,
      expect.any(Array),
      expect.objectContaining({
        format: 'jpeg',
      })
    );
    
    // Result should have .jpg extension
    expect(result).toMatch(/\.jpg$/i);
  });

  // Test 5: Returns proper file:// URI
  test('5. Returns proper file:// URI', async () => {
    const inputUri = 'file:///input.jpg';
    const outputUri = 'file:///cache/compressed_12345.jpg';
    
    ImageManipulator.manipulateAsync = jest.fn().mockResolvedValue({
      uri: outputUri,
      width: 1000,
      height: 1000,
    });

    const result = await compressImage(inputUri);

    expect(result).toMatch(/^file:\/\//);
    expect(result).toBe(outputUri);
  });

  // Test 6: Handles corrupted images gracefully
  test('6. Handles corrupted images gracefully', async () => {
    const corruptedUri = 'file:///corrupted.jpg';
    
    FileSystem.getInfoAsync = jest.fn().mockResolvedValue({
      exists: true,
      size: 1024,
      uri: corruptedUri,
    });

    ImageManipulator.manipulateAsync = jest.fn().mockRejectedValue(
      new Error('Invalid image data')
    );

    await expect(compressImage(corruptedUri)).rejects.toThrow('Failed to compress image');
  });

  // Additional test: Handles non-existent files
  test('Handles non-existent files', async () => {
    const nonExistentUri = 'file:///nonexistent.jpg';
    
    FileSystem.getInfoAsync = jest.fn().mockResolvedValue({
      exists: false,
    });

    await expect(compressImage(nonExistentUri)).rejects.toThrow('File does not exist');
  });

  // Additional test: Progressive compression for very large files
  test('Progressive compression for very large files', async () => {
    const veryLargeUri = 'file:///verylarge.jpg';
    const compressedUri = 'file:///compressed.jpg';
    
    // Mock very large file
    FileSystem.getInfoAsync
      .mockResolvedValueOnce({ exists: true, size: 10 * 1024 * 1024 }) // 10MB original
      .mockResolvedValueOnce({ exists: true, size: 7 * 1024 * 1024 })  // 7MB after first compression
      .mockResolvedValueOnce({ exists: true, size: 4.5 * 1024 * 1024 }); // 4.5MB after second compression

    ImageManipulator.manipulateAsync
      .mockResolvedValueOnce({ uri: 'file:///temp1.jpg', width: 3000, height: 3000 })
      .mockResolvedValueOnce({ uri: compressedUri, width: 2000, height: 2000 });

    const result = await compressImage(veryLargeUri);

    // Should have attempted multiple compressions
    expect(ImageManipulator.manipulateAsync).toHaveBeenCalledTimes(2);
    expect(result).toBe(compressedUri);
  });

  // Additional test: Maintains aspect ratio
  test('Maintains aspect ratio during compression', async () => {
    const inputUri = 'file:///input.jpg';
    const outputUri = 'file:///output.jpg';
    
    ImageManipulator.manipulateAsync = jest.fn().mockResolvedValue({
      uri: outputUri,
      width: 1500,
      height: 1000,
    });

    await compressImage(inputUri);

    // Should resize maintaining aspect ratio
    const calls = ImageManipulator.manipulateAsync.mock.calls;
    const actions = calls[0][1];
    
    // Should have resize action
    expect(actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          resize: expect.objectContaining({
            width: expect.any(Number)
          })
        })
      ])
    );
  });
});