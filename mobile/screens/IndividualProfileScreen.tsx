import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { IndividualProfile, IndividualProfileScreenProps } from '../types';
import { api } from '../services/api';
import { getUrgencyScoreColor, getDisplayUrgencyScore } from '../utils/urgencyScore';
import FieldDisplay from '../components/FieldDisplay';
import InteractionHistoryItem from '../components/InteractionHistoryItem';
import UrgencyScore from '../components/UrgencyScore';
import InteractionDetailModal from '../components/InteractionDetailModal';
import IndividualLocationMap from '../components/IndividualLocationMap';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function IndividualProfileScreen({ navigation, route }: any) {
  // State variables to store data
  const [profile, setProfile] = useState<IndividualProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const lastDeletedRef = useRef<IndividualProfile | null>(null);

  // Get the individual ID from the route parameters
  const { individualId } = route.params;

  // Set header actions (Delete button)
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          accessibilityLabel="Delete profile"
          onPress={() => confirmDelete()}
          style={{ paddingHorizontal: 12 }}
        >
          <Ionicons name="trash" size={22} color="#EF4444" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, individualId, profile]);

  // Load profile data when component mounts
  useEffect(() => {
    loadProfile();
  }, [individualId]);

  // Function to load the individual's profile data
  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const profileData = await api.getIndividualProfile(individualId);
      
      if (profileData) {
        setProfile(profileData);
      } else {
        Toast.show({ type: 'error', text1: 'Individual not found' });
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Toast.show({ type: 'error', text1: 'Failed to load profile', text2: 'Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm and delete the individual profile
  const confirmDelete = () => {
    if (!profile) return;
    Alert.alert(
      'Delete Profile',
      `Are you sure you want to delete ${profile.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const success = await api.deleteIndividual(profile.id);
              if (success) {
                // Save snapshot for potential undo
                lastDeletedRef.current = profile;
                Toast.show({
                  type: 'success',
                  text1: 'Profile deleted',
                  text2: 'Tap to undo',
                  visibilityTime: 4000,
                  onPress: async () => {
                    try {
                      const deleted = lastDeletedRef.current;
                      if (!deleted) return;
                      const result = await api.saveIndividual({
                        id: deleted.id,
                        name: deleted.name,
                        urgency_score: deleted.urgency_score,
                        urgency_override: deleted.urgency_override,
                        data: deleted.data,
                      });
                      if (result?.success) {
                        Toast.show({ type: 'success', text1: 'Restored', text2: `${deleted.name} was restored` });
                        navigation.navigate('SearchMain', { refreshKey: Date.now(), restoredId: deleted.id });
                        lastDeletedRef.current = null;
                      } else {
                        Toast.show({ type: 'error', text1: 'Restore failed', text2: result?.message || 'Please try again.' });
                      }
                    } catch (err) {
                      Toast.show({ type: 'error', text1: 'Restore failed', text2: 'Please try again.' });
                    }
                  },
                });
                // Navigate back to Search screen; it will refresh on focus
                navigation.navigate('SearchMain', { refreshKey: Date.now() });
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Delete failed',
                  text2: 'Please try again.',
                });
              }
            } catch (e) {
              console.error('Delete error:', e);
              Toast.show({
                type: 'error',
                text1: 'Delete failed',
                text2: 'Please try again.',
              });
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Function to refresh the profile data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProfile();
    setIsRefreshing(false);
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

  // Function to handle urgency override change
  const handleUrgencyOverrideChange = async (overrideValue: number | null) => {
    if (!profile) return;
    
    // Immediately update local state for instant UI feedback
    const updatedProfile = {
      ...profile,
      urgency_override: overrideValue,
    };
    setProfile(updatedProfile);
    
    try {
              const success = await api.updateUrgencyOverride(profile.id, overrideValue);
      if (!success) {
        // Revert the change if the API call failed
        setProfile(profile);
        Toast.show({ type: 'error', text1: 'Update failed', text2: 'Could not update urgency override.' });
      }
    } catch (error) {
      // Revert the change if there was an error
      setProfile(profile);
      console.error('Error updating urgency override:', error);
      Toast.show({ type: 'error', text1: 'Update failed', text2: 'Could not update urgency override.' });
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

  // Calculate the display urgency score
  const displayScore = getDisplayUrgencyScore(profile);
  const scoreColor = getUrgencyScoreColor(displayScore);

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.name}>{profile.name}</Text>
          
          {/* Urgency Score Component */}
          <UrgencyScore
            individual={profile}
            onOverrideChange={handleUrgencyOverrideChange}
            showSlider={true}
          />
        </View>

        {/* Current Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Information</Text>
          <View style={styles.fieldsContainer}>
            {/* Render all data fields */}
            {Object.entries(profile.data).map(([key, value]) => 
              renderField(key, value, key === 'name' || key === 'height' || key === 'weight')
            )}
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <IndividualLocationMap profile={profile} />
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
}); 
