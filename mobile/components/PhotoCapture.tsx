import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { optimizeForUpload } from '../services/imageCompression';

interface PhotoCaptureProps {
  onPhotoChange: (photoUri: string | null) => void;
  onConsentChange: (hasConsent: boolean) => void;
  photoUri?: string | null;
  hasConsent?: boolean;
}

export default function PhotoCapture({
  onPhotoChange,
  onConsentChange,
  photoUri,
  hasConsent = false,
}: PhotoCaptureProps) {
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to select photos.'
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      setIsLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera permissions to take photos.'
        );
        return;
      }
    }

    try {
      setIsLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const processImage = async (uri: string) => {
    try {
      // Use compression service to optimize image for upload
      const processedImage = await optimizeForUpload(uri);

      onPhotoChange(processedImage.uri);
      
      // Auto-clear consent when new photo is taken
      if (hasConsent) {
        onConsentChange(false);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    }
  };

  const clearPhoto = () => {
    onPhotoChange(null);
    onConsentChange(false);
  };

  const toggleConsent = () => {
    if (photoUri) {
      onConsentChange(!hasConsent);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Photo</Text>
      
      {/* Photo Display */}
      {photoUri ? (
        <View style={styles.photoContainer}>
          <Image source={{ uri: photoUri }} style={styles.photo} />
          <TouchableOpacity style={styles.clearButton} onPress={clearPhoto}>
            <Ionicons name="close-circle" size={24} color="#ff4444" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <Ionicons name="camera-outline" size={48} color="#ccc" />
          <Text style={styles.placeholderText}>No photo selected</Text>
        </View>
      )}

      {/* Photo Actions */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.cameraButton]}
          onPress={takePhoto}
          disabled={isLoading}
        >
          <Ionicons name="camera" size={20} color="white" />
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.galleryButton]}
          onPress={pickImage}
          disabled={isLoading}
        >
          <Ionicons name="images-outline" size={20} color="white" />
          <Text style={styles.buttonText}>Choose Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Consent Section */}
      {photoUri && (
        <View style={styles.consentContainer}>
          <TouchableOpacity
            style={styles.consentCheckbox}
            onPress={toggleConsent}
            disabled={!photoUri}
          >
            <Ionicons
              name={hasConsent ? 'checkbox' : 'square-outline'}
              size={24}
              color={hasConsent ? '#007AFF' : '#666'}
            />
            <Text style={styles.consentText}>
              I have obtained consent to take and store this photo
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.consentLegal}>
            By checking this box, you confirm that you have obtained proper consent 
            from the individual to take and store their photo for outreach purposes. 
            This photo will be stored securely and used only for identification and 
            outreach coordination.
          </Text>
        </View>
      )}

      {/* Warning if photo exists but no consent */}
      {photoUri && !hasConsent && (
        <View style={styles.warningContainer}>
          <Ionicons name="warning-outline" size={20} color="#ff9500" />
          <Text style={styles.warningText}>
            Photo cannot be saved without consent
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  photoContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 16,
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  clearButton: {
    position: 'absolute',
    top: -8,
    right: 60,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  placeholderContainer: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  placeholderText: {
    color: '#999',
    marginTop: 8,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  cameraButton: {
    backgroundColor: '#007AFF',
  },
  galleryButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
  },
  consentContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  consentCheckbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  consentText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  consentLegal: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    fontStyle: 'italic',
    marginLeft: 32,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  warningText: {
    marginLeft: 8,
    color: '#856404',
    fontSize: 14,
    fontWeight: '500',
  },
}); 