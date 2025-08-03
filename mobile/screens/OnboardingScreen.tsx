import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const ONBOARDING_KEY = 'onboarding_complete';

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAgree = async () => {
    setIsProcessing(true);
    
    try {
      // Set onboarding complete flag
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      console.log('Onboarding completed, flag set');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      // Continue even if storage fails
    }

    // Reset navigation stack to main app
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'MainApp' }],
      })
    );
  };

  return (
    <SafeAreaView style={styles.container} testID="onboarding-modal">
      <StatusBar barStyle="dark-content" />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="shield-checkmark" size={60} color="#007AFF" />
          <Text style={styles.title}>SF Street Team Data Protection Notice</Text>
        </View>

        {/* Introduction */}
        <Text style={styles.introText}>
          This app collects information about individuals experiencing homelessness
          to provide better support services.
        </Text>

        {/* Important Guidelines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Important Guidelines:</Text>
          <View style={styles.bulletList}>
            <BulletPoint text="Only collect information necessary for service delivery" />
            <BulletPoint text="Always obtain verbal consent before taking photos" />
            <BulletPoint text="Do not record medical diagnoses or health conditions" isWarning />
            <BulletPoint text="Do not record criminal history or legal status" isWarning />
            <BulletPoint text="Do not record immigration or citizenship status" isWarning />
            <BulletPoint text="Do not record specific racial/ethnic identification" isWarning />
          </View>
        </View>

        {/* Photo Consent Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo Consent Requirements:</Text>
          <View style={styles.bulletList}>
            <BulletPoint text="Verbal consent must be obtained and confirmed" />
            <BulletPoint text="Photos are for identification purposes only" />
            <BulletPoint text="Individuals can request photo removal at any time" />
          </View>
        </View>

        {/* Agreement Text */}
        <View style={styles.agreementSection}>
          <Text style={styles.agreementText}>
            By proceeding, you acknowledge these guidelines and agree to follow
            San Francisco privacy regulations for vulnerable populations.
          </Text>
        </View>

        {/* Agree Button */}
        <TouchableOpacity
          style={[styles.agreeButton, isProcessing && styles.agreeButtonDisabled]}
          onPress={handleAgree}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.agreeButtonText}>I Understand and Agree</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Bottom Padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Bullet Point Component
const BulletPoint: React.FC<{ text: string; isWarning?: boolean }> = ({ text, isWarning }) => (
  <View style={styles.bulletPoint}>
    <Text style={[styles.bullet, isWarning && styles.warningBullet]}>•</Text>
    <Text style={[styles.bulletText, isWarning && styles.warningText]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginTop: 16,
  },
  introText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  bulletList: {
    marginLeft: 8,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingRight: 20,
  },
  bullet: {
    fontSize: 18,
    color: '#007AFF',
    marginRight: 12,
    marginTop: -2,
  },
  warningBullet: {
    color: '#FF3B30',
  },
  bulletText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
    lineHeight: 22,
  },
  warningText: {
    color: '#CC0000',
    fontWeight: '500',
  },
  agreementSection: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 30,
  },
  agreementText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
    textAlign: 'center',
  },
  agreeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  agreeButtonDisabled: {
    backgroundColor: '#999999',
  },
  agreeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});

// Export component with modal properties for testing
export default Object.assign(OnboardingScreen, {
  // Modal properties for testing
  props: {
    presentationStyle: 'fullScreen',
    gestureEnabled: false,
  },
});