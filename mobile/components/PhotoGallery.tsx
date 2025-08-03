import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Photo {
  url: string;
  timestamp: string;
}

interface PhotoGalleryProps {
  currentPhoto: Photo | null;
  photoHistory: Photo[];
  onPhotoSelect: (photoUrl: string) => void;
}

export default function PhotoGallery({
  currentPhoto,
  photoHistory,
  onPhotoSelect,
}: PhotoGalleryProps) {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Combine current photo with history, limiting to 4 total
  const getAllPhotos = (): Photo[] => {
    const photos: Photo[] = [];
    
    if (currentPhoto) {
      photos.push(currentPhoto);
    }
    
    // Add up to 3 history photos (to make max 4 total)
    const maxHistory = currentPhoto ? 3 : 4;
    const historyToAdd = photoHistory.slice(0, maxHistory);
    photos.push(...historyToAdd);
    
    return photos;
  };

  const allPhotos = getAllPhotos();

  // Format date for display
  const formatDate = (timestamp: string, index: number): string => {
    if (currentPhoto && index === 0 && allPhotos[0].url === currentPhoto.url) {
      return 'Current';
    }
    
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Handle thumbnail tap
  const handleThumbnailPress = (photo: Photo, index: number) => {
    setSelectedPhoto(photo);
    setSelectedIndex(index);
    setPreviewVisible(true);
  };

  // Handle "Set as Current" button
  const handleSetAsCurrent = () => {
    if (selectedPhoto) {
      onPhotoSelect(selectedPhoto.url);
      setPreviewVisible(false);
      Alert.alert('Success', 'Photo updated successfully');
    }
  };

  // Check if photo is the current one
  const isCurrentPhoto = (photo: Photo, index: number): boolean => {
    return currentPhoto !== null && index === 0 && photo.url === currentPhoto.url;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        testID="photo-gallery-scroll"
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {allPhotos.map((photo, index) => (
          <TouchableOpacity
            key={`photo-${index}`}
            testID={`photo-touchable-${index}`}
            onPress={() => handleThumbnailPress(photo, index)}
            activeOpacity={0.8}
          >
            <View
              testID={`photo-container-${index}`}
              style={[
                styles.thumbnailContainer,
                isCurrentPhoto(photo, index) && styles.currentPhotoContainer,
              ]}
            >
              <Image
                testID={`photo-thumbnail-${index}`}
                source={{ uri: photo.url }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
              <Text testID={`photo-date-${index}`} style={styles.dateText}>
                {formatDate(photo.timestamp, index)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Photo Preview Modal */}
      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        {previewVisible && selectedPhoto && (
          <View testID="photo-preview-modal" style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {/* Close Button */}
              <TouchableOpacity
                testID="preview-close-button"
                style={styles.closeButton}
                onPress={() => setPreviewVisible(false)}
              >
                <Ionicons name="close" size={30} color="#fff" />
              </TouchableOpacity>

              {/* Preview Image */}
              <Image
                testID="photo-preview-image"
                source={{ uri: selectedPhoto.url }}
                style={styles.previewImage}
                resizeMode="contain"
              />

              {/* Photo Info */}
              <View style={styles.photoInfo}>
                <Text style={styles.photoDateText}>
                  {formatDate(selectedPhoto.timestamp, selectedIndex)}
                </Text>
                
                {/* Set as Current Button - only show if not already current */}
                {!isCurrentPhoto(selectedPhoto, selectedIndex) && (
                  <TouchableOpacity
                    testID="set-as-current-button"
                    style={styles.setCurrentButton}
                    onPress={handleSetAsCurrent}
                  >
                    <Text style={styles.setCurrentButtonText}>
                      Set as Current
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  thumbnailContainer: {
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currentPhotoContainer: {
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  thumbnail: {
    width: 80,
    height: 80,
  },
  dateText: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
    paddingVertical: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  previewImage: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.6,
  },
  photoInfo: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  photoDateText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  setCurrentButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  setCurrentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});