/**
 * Utility to reset onboarding state for testing
 * Usage: Add this to a development menu or admin screen
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const resetOnboarding = async () => {
  try {
    await AsyncStorage.removeItem('onboarding_complete');
    console.log('✅ Onboarding state reset. The onboarding screen will show on next app launch.');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to reset onboarding state:', error);
    return { success: false, error };
  }
};

// Helper to check current onboarding status
export const checkOnboardingStatus = async () => {
  try {
    const status = await AsyncStorage.getItem('onboarding_complete');
    const isComplete = status === 'true';
    console.log(`📊 Onboarding status: ${isComplete ? 'Completed' : 'Not completed'}`);
    return { completed: isComplete };
  } catch (error) {
    console.error('❌ Failed to check onboarding status:', error);
    return { completed: false, error };
  }
};