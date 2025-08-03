import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IndividualProfile, IndividualProfileScreenProps } from '../types';
import { api } from '../services/api';
import { getDangerScoreColor, getDisplayDangerScore } from '../utils/dangerScore';
import FieldDisplay from '../components/FieldDisplay';
import InteractionHistoryItem from '../components/InteractionHistoryItem';
import DangerScore from '../components/DangerScore';
import InteractionDetailModal from '../components/InteractionDetailModal';
import PhotoGallery from '../components/PhotoGallery';
import PhotoCapture from '../components/PhotoCapture';
import Toast from 'react-native-toast-message';
import * as Location from 'expo-location';
import { compressImage } from '../services/imageCompression';

export default function IndividualProfileScreen({ navigation, route }: any) {
  // State variables to store data
  const [profile, setProfile] = useState<IndividualProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [photoLoadError, setPhotoLoadError] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    location: { latitude: number; longitude: number; address: string };
    timestamp: number;
  } | null>(null);

  // Get the individual ID from the route parameters
  const { individualId } = route.params;

  // Load profile data when component mounts
  useEffect(() => {
    loadProfile();
  }, [individualId]);
  
  // Update selected photo when profile loads
  useEffect(() => {
    if (profile?.photo_url) {
      setSelectedPhotoUrl(profile.photo_url);
      setPhotoLoadError(false);
    }
  }, [profile]);
  
  // Get location when component mounts
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Function to load the individual's profile data
  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const profileData = await api.getIndividualProfile(individualId);
      
      if (profileData) {
        setProfile(profileData);
      } else {
        Alert.alert('Error', 'Individual not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to refresh the profile data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProfile();
    setIsRefreshing(false);
  };
  
  // Function to get current location
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const fullAddress = `${address.street || ''} ${address.city || ''} ${address.region || ''} ${address.postalCode || ''}`.trim();
      
      setSelectedLocation({
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: fullAddress || 'Unknown location',
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  // Function to handle interaction item press
  const handleInteractionPress = (interaction: any) => {
    setSelectedInteraction(interaction);
    setModalVisible(true);
  };

  // Function to close the modal
  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedInteraction(null);
  };

  // Function to handle photo selection from gallery
  const handlePhotoSelect = (photoUrl: string) => {
    setSelectedPhotoUrl(photoUrl);
    setPhotoLoadError(false);
  };
  
  // Function to handle photo load error
  const handlePhotoError = () => {
    setPhotoLoadError(true);
  };
  
  // Function to handle photo update
  const handlePhotoUpdate = async (photoData: { photoUri: string; hasConsent: boolean }) => {
    if (!photoData.hasConsent) {
      Alert.alert('Consent Required', 'You must confirm consent before saving the photo.');
      return;
    }
    
    if (!profile || !selectedLocation) {
      Alert.alert('Error', 'Unable to update photo. Please try again.');
      return;
    }
    
    try {
      setIsUploadingPhoto(true);
      
      // Compress the image first
      const compressedUri = await compressImage(photoData.photoUri);
      
      // Update the photo
      const result = await api.updateIndividualPhoto({
        individualId: profile.id,
        photoUri: compressedUri,
        consentLocation: selectedLocation.location,
      });
      
      // Show success message
      Toast.show({
        type: 'success',
        text1: 'Photo Updated',
        text2: 'The photo has been updated successfully.',
        position: 'bottom',
      });
      
      // Close the photo capture modal
      setShowPhotoCapture(false);
      
      // Refresh the profile to show the new photo
      await loadProfile();
      
    } catch (error) {
      console.error('Photo update error:', error);
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: 'Failed to update photo. Please try again.',
        position: 'bottom',
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };
  
  // Function to handle danger override change
  const handleDangerOverrideChange = async (overrideValue: number | null) => {
    if (!profile) return;
    
    // Immediately update local state for instant UI feedback
    const updatedProfile = {
      ...profile,
      danger_override: overrideValue,
    };
    setProfile(updatedProfile);
    
    try {
      const success = await api.updateDangerOverride(profile.id, overrideValue);
      if (!success) {
        // Revert the change if the API call failed
        setProfile(profile);
        Alert.alert('Error', 'Failed to update danger override');
      }
    } catch (error) {
      // Revert the change if there was an error
      setProfile(profile);
      console.error('Error updating danger override:', error);
      Alert.alert('Error', 'Failed to update danger override');
    }
  };

  // Function to render a field display
  const renderField = (key: string, value: any, isRequired: boolean = false) => {
    // Skip certain fields that are handled separately
    if (key === 'name') return null;
    
    // Format the field label (convert snake_case to Title Case)
    const label = key.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    return (
      <FieldDisplay
        key={key}
        label={label}
        value={value}
        isRequired={isRequired}
      />
    );
  };

  // Function to render interaction history item
  const renderInteractionItem = ({ item }: { item: any }) => (
    <InteractionHistoryItem
      interaction={item}
      onPress={handleInteractionPress}
    />
  );

  // Show loading spinner while data is being fetched
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Show error if no profile data
  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  // Calculate the display danger score
  const displayScore = getDisplayDangerScore(profile);
  const scoreColor = getDangerScoreColor(displayScore);

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Photo Section */}
        <View testID="photo-section">
          <View style={styles.photoTouchable}>
            <View testID="photo-container" style={styles.photoContainer}>
              {(selectedPhotoUrl || profile?.photo_url) && !photoLoadError ? (
                <Image
                  testID="individual-photo"
                  source={{ uri: selectedPhotoUrl || profile?.photo_url }}
                  style={styles.photo}
                  resizeMode="cover"
                  onError={handlePhotoError}
                />
              ) : (
                <View testID="photo-placeholder" style={styles.photoPlaceholder}>
                  <Ionicons name="person-circle-outline" size={120} color="#D1D5DB" />
                </View>
              )}
              
              {/* Update Photo Button */}
              <TouchableOpacity
                testID="update-photo-button"
                style={styles.updatePhotoButton}
                onPress={() => setShowPhotoCapture(true)}
              >
                <Ionicons name="camera" size={24} color="#fff" />
                <Text testID="update-photo-button-text" style={styles.updatePhotoButtonText}>
                  Update Photo
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Photo Gallery Component */}
          {(profile?.photo_url || profile?.photo_history?.length > 0) && (
            <View testID="photo-gallery-component">
              <PhotoGallery
                currentPhoto={profile?.photo_url ? {
                  url: profile.photo_url,
                  timestamp: profile.updated_at || new Date().toISOString()
                } : null}
                photoHistory={profile?.photo_history || []}
                onPhotoSelect={handlePhotoSelect}
              />
            </View>
          )}
        </View>
        
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.name}>{profile.name}</Text>
          
          {/* Danger Score Component */}
          <DangerScore
            individual={profile}
            onOverrideChange={handleDangerOverrideChange}
            showSlider={true}
          />
        </View>

        {/* Current Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Information</Text>
          <View style={styles.fieldsContainer}>
            {/* Render all data fields */}
            {Object.entries(profile.data).map(([key, value]) => 
              renderField(key, value, key === 'name' || key === 'height' || key === 'weight' || key === 'skin_color')
            )}
          </View>
        </View>

        {/* Interaction History Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Interaction History</Text>
            <Text style={styles.interactionCount}>
              {profile.total_interactions} interaction{profile.total_interactions !== 1 ? 's' : ''}
            </Text>
          </View>
          
          {profile.interactions.length > 0 ? (
            <FlatList
              data={profile.interactions}
              renderItem={renderInteractionItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false} // Let the parent ScrollView handle scrolling
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.noInteractions}>No interactions recorded</Text>
          )}
        </View>
      </ScrollView>

      {/* Interaction Detail Modal */}
      <InteractionDetailModal
        visible={modalVisible}
        interaction={selectedInteraction}
        onClose={handleCloseModal}
      />
      
      {/* Photo Capture Modal */}
      {showPhotoCapture && (
        <View testID="photo-capture-modal" style={styles.photoCaptureModal}>
          <View style={styles.photoCaptureHeader}>
            <Text style={styles.photoCaptureTitle}>Update Photo</Text>
            <TouchableOpacity
              testID="cancel-photo-button"
              onPress={() => setShowPhotoCapture(false)}
              style={styles.cancelButton}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          
          <PhotoCapture
            onPhotoCapture={handlePhotoUpdate}
          />
          
          {isUploadingPhoto && (
            <View testID="upload-loading-indicator" style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.uploadingText}>Updating photo...</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },

  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  interactionCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  fieldsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  noInteractions: {
    padding: 20,
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 16,
  },
  photoTouchable: {
    width: '100%',
  },
  photoContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  updatePhotoButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  updatePhotoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  photoCaptureModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 1000,
  },
  photoCaptureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  photoCaptureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cancelButton: {
    padding: 8,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  uploadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
}); 