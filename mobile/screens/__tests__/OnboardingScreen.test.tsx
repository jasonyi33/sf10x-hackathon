import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import OnboardingScreen from '../OnboardingScreen';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    replace: mockNavigate,
  }),
}));

describe('OnboardingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  // Test 1: Shows on first launch
  it('should display the onboarding screen on first launch', async () => {
    const { getByText } = render(
      <NavigationContainer>
        <OnboardingScreen />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(getByText('SF Street Team Data Protection Notice')).toBeTruthy();
    });
  });

  // Test 2: Does not show if already acknowledged
  it('should not show if user has already acknowledged', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
    
    const { queryByText } = render(
      <NavigationContainer>
        <OnboardingScreen />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(queryByText('SF Street Team Data Protection Notice')).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith('MainApp');
    });
  });

  // Test 3: Cannot be dismissed without agreeing
  it('should not have a dismiss button or allow dismissal without agreement', () => {
    const { queryByTestId, queryByText } = render(
      <NavigationContainer>
        <OnboardingScreen />
      </NavigationContainer>
    );

    // Should not have a close/dismiss button
    expect(queryByTestId('close-button')).toBeNull();
    expect(queryByText('Skip')).toBeNull();
    expect(queryByText('Later')).toBeNull();
  });

  // Test 4: Legal text displays correctly
  it('should display all required legal text', async () => {
    const { getByText } = render(
      <NavigationContainer>
        <OnboardingScreen />
      </NavigationContainer>
    );

    await waitFor(() => {
      // Check for main title
      expect(getByText('SF Street Team Data Protection Notice')).toBeTruthy();
      
      // Check for important guidelines
      expect(getByText(/Only collect information necessary for service delivery/)).toBeTruthy();
      expect(getByText(/Always obtain verbal consent before taking photos/)).toBeTruthy();
      expect(getByText(/Do not record medical diagnoses or health conditions/)).toBeTruthy();
      expect(getByText(/Do not record criminal history or legal status/)).toBeTruthy();
      expect(getByText(/Do not record immigration or citizenship status/)).toBeTruthy();
      expect(getByText(/Do not record specific racial\/ethnic identification/)).toBeTruthy();
      
      // Check for photo consent requirements
      expect(getByText(/Photo Consent Requirements:/)).toBeTruthy();
      expect(getByText(/Verbal consent must be obtained and confirmed/)).toBeTruthy();
      expect(getByText(/Photos are for identification purposes only/)).toBeTruthy();
      expect(getByText(/Individuals can request photo removal at any time/)).toBeTruthy();
      
      // Check for agreement text
      expect(getByText(/By proceeding, you acknowledge these guidelines/)).toBeTruthy();
      
      // Check for agreement button
      expect(getByText('I Understand and Agree')).toBeTruthy();
    });
  });

  // Test 5: AsyncStorage flag set after agreement
  it('should set AsyncStorage flag when user agrees', async () => {
    const { getByText } = render(
      <NavigationContainer>
        <OnboardingScreen />
      </NavigationContainer>
    );

    await waitFor(() => {
      const agreeButton = getByText('I Understand and Agree');
      fireEvent.press(agreeButton);
    });

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('onboarding_complete', 'true');
    });
  });

  // Test 6: Navigates to main app after agreement
  it('should navigate to main app after user agrees', async () => {
    const { getByText } = render(
      <NavigationContainer>
        <OnboardingScreen />
      </NavigationContainer>
    );

    await waitFor(() => {
      const agreeButton = getByText('I Understand and Agree');
      fireEvent.press(agreeButton);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('MainApp');
    });
  });

  // Test 7: Handles AsyncStorage errors gracefully
  it('should handle AsyncStorage errors gracefully', async () => {
    // Mock AsyncStorage.setItem to throw an error
    (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
    
    const { getByText } = render(
      <NavigationContainer>
        <OnboardingScreen />
      </NavigationContainer>
    );

    await waitFor(() => {
      const agreeButton = getByText('I Understand and Agree');
      fireEvent.press(agreeButton);
    });

    // Should still navigate even if storage fails
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('MainApp');
    });
  });

  // Additional test: Screen is not dismissible with back gesture
  it('should not be dismissible with back gesture', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <OnboardingScreen />
      </NavigationContainer>
    );

    // The modal should have gestureEnabled: false
    const modal = getByTestId('onboarding-modal');
    expect(modal.props.gestureEnabled).toBe(false);
  });

  // Additional test: Button is disabled while processing
  it('should disable button while processing agreement', async () => {
    const { getByText } = render(
      <NavigationContainer>
        <OnboardingScreen />
      </NavigationContainer>
    );

    await waitFor(() => {
      const agreeButton = getByText('I Understand and Agree');
      fireEvent.press(agreeButton);
      
      // Button should be disabled immediately after press
      expect(agreeButton.props.disabled).toBe(true);
    });
  });

  // Additional test: Full screen modal presentation
  it('should be presented as a full screen modal', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <OnboardingScreen />
      </NavigationContainer>
    );

    const modal = getByTestId('onboarding-modal');
    expect(modal.props.presentationStyle).toBe('fullScreen');
  });
});