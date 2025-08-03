import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { IndividualProfile, IndividualProfileScreenProps } from '../types';
import { api } from '../services/api';
import { getUrgencyScoreColor, getDisplayUrgencyScore } from '../utils/urgencyScore';
import UrgencyScore from '../components/UrgencyScore';
import CurrentInformationTab from '../components/CurrentInformationTab';
import PreviousInteractionsTab from '../components/PreviousInteractionsTab';

const Tab = createMaterialTopTabNavigator();

export default function IndividualProfileScreen({ navigation, route }: any) {
  // State variables to store data
  const [profile, setProfile] = useState<IndividualProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get the individual ID from the route parameters
  const { individualId } = route.params;

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
        Alert.alert('Error', 'Failed to update urgency override');
      }
    } catch (error) {
      // Revert the change if there was an error
      setProfile(profile);
      console.error('Error updating urgency override:', error);
      Alert.alert('Error', 'Failed to update urgency override');
    }
  };



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

      {/* Tab Navigation */}
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIndicatorStyle: styles.tabIndicator,
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#6B7280',
        }}
      >
        <Tab.Screen
          name="CurrentInformation"
          component={CurrentInformationTab}
          options={{ tabBarLabel: 'Current Information' }}
          initialParams={{ profile }}
        />
        <Tab.Screen
          name="PreviousInteractions"
          component={PreviousInteractionsTab}
          options={{ tabBarLabel: 'Previous Interactions' }}
          initialParams={{ profile }}
        />
      </Tab.Navigator>
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
  tabBar: {
    backgroundColor: '#fff',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'none',
  },
  tabIndicator: {
    backgroundColor: '#007AFF',
    height: 3,
  },
}); 