import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { Camera, CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

interface PhotoCaptureProps {
  onPhotoCapture: (data: { photoUri: string | null; hasConsent: boolean }) => void;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onPhotoCapture }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView>(null);

  // Handle permission state
  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera permission is required to take photos
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const handleRetake = () => {
    setPhotoUri(null);
    setHasConsent(false);
  };

  const handleConsentChange = (value: boolean) => {
    setHasConsent(value);
    // If consent is unchecked after photo is taken, clear the photo
    if (!value && photoUri) {
      Alert.alert(
        'Remove Photo?',
        'Unchecking consent will remove the photo. Do you want to continue?',
        [
          { text: 'Cancel', onPress: () => setHasConsent(true) },
          {
            text: 'Remove',
            onPress: () => {
              setPhotoUri(null);
              setHasConsent(false);
            },
            style: 'destructive',
          },
        ]
      );
    }
  };

  const handleSave = () => {
    onPhotoCapture({ photoUri, hasConsent });
  };

  const handleSkip = () => {
    onPhotoCapture({ photoUri: null, hasConsent: false });
  };

  // Camera preview view
  if (!photoUri) {
    return (
      <View style={styles.container}>
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing={facing}
            ref={cameraRef}
            testID="camera-preview"
          >
            <View style={styles.cameraOverlay}>
              <TouchableOpacity
                style={styles.flipButton}
                onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
              >
                <Ionicons name="camera-reverse" size={30} color="white" />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>

        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
            testID="capture-button"
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            testID="skip-button"
          >
            <Text style={styles.skipButtonText}>Skip Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Photo preview view
  return (
    <ScrollView style={styles.container}>
      <View style={styles.previewContainer}>
        <Image
          source={{ uri: photoUri }}
          style={styles.photoPreview}
          testID="photo-preview"
        />
        
        <TouchableOpacity
          style={styles.retakeButton}
          onPress={handleRetake}
          testID="retake-button"
        >
          <Ionicons name="camera" size={20} color="white" />
          <Text style={styles.retakeButtonText}>Retake</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.consentContainer}>
        <View style={styles.consentRow}>
          <Switch
            value={hasConsent}
            onValueChange={handleConsentChange}
            testID="consent-checkbox"
          />
          <Text style={styles.consentLabel}>I confirm consent</Text>
        </View>
        
        <Text style={styles.consentText}>
          Verbal consent has been received to use facial photos for identification purposes within the SF Street Team system only
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.saveButton, !hasConsent && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!hasConsent}
          testID="save-button"
        >
          <Text style={[styles.saveButtonText, !hasConsent && styles.saveButtonTextDisabled]}>
            Save Photo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          testID="skip-button"
        >
          <Text style={styles.skipButtonText}>Continue Without Photo</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  cameraContainer: {
    aspectRatio: 1, // Make it square
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    padding: 20,
  },
  flipButton: {
    alignSelf: 'flex-end',
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
  },
  controlsContainer: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    borderWidth: 5,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
  },
  previewContainer: {
    aspectRatio: 3 / 4,
    backgroundColor: 'black',
    position: 'relative',
  },
  photoPreview: {
    flex: 1,
    resizeMode: 'contain',
  },
  retakeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retakeButtonText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 16,
  },
  consentContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 10,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  consentLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  consentText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 5,
  },
  actionButtons: {
    padding: 20,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#999',
  },
  skipButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PhotoCapture;