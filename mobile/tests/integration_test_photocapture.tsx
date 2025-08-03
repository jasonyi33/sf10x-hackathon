import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import PhotoCapture from '../components/PhotoCapture';

/**
 * Integration test screen for PhotoCapture component
 * Can be temporarily added to App.tsx to test functionality
 */
export const PhotoCaptureTestScreen: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [capturedData, setCapturedData] = useState<any>(null);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
  };

  const handlePhotoCapture = (data: { photoUri: string | null; hasConsent: boolean }) => {
    addTestResult(`✅ onPhotoCapture called with data: ${JSON.stringify(data)}`);
    setCapturedData(data);
    
    // Verify data structure
    if (typeof data.photoUri === 'string' || data.photoUri === null) {
      addTestResult('✅ photoUri is string or null');
    } else {
      addTestResult('❌ photoUri has incorrect type');
    }
    
    if (typeof data.hasConsent === 'boolean') {
      addTestResult('✅ hasConsent is boolean');
    } else {
      addTestResult('❌ hasConsent has incorrect type');
    }
    
    // Test specific scenarios
    if (data.photoUri && !data.hasConsent) {
      addTestResult('❌ Photo saved without consent - this should not happen!');
    }
    
    if (data.photoUri === null && data.hasConsent === false) {
      addTestResult('✅ Skip functionality working correctly');
    }
    
    if (data.photoUri && data.hasConsent) {
      addTestResult('✅ Photo captured with consent successfully');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>PhotoCapture Integration Test</Text>
      
      <View style={styles.componentContainer}>
        <PhotoCapture onPhotoCapture={handlePhotoCapture} />
      </View>
      
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>{result}</Text>
        ))}
        
        {capturedData && (
          <View style={styles.dataContainer}>
            <Text style={styles.dataTitle}>Captured Data:</Text>
            <Text style={styles.dataText}>
              Photo URI: {capturedData.photoUri || 'null'}
            </Text>
            <Text style={styles.dataText}>
              Has Consent: {capturedData.hasConsent ? 'Yes' : 'No'}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Test Instructions:</Text>
        <Text style={styles.instruction}>1. Test camera preview displays</Text>
        <Text style={styles.instruction}>2. Test capture button takes photo</Text>
        <Text style={styles.instruction}>3. Test retake button returns to camera</Text>
        <Text style={styles.instruction}>4. Test consent checkbox enables/disables save</Text>
        <Text style={styles.instruction}>5. Test unchecking consent clears photo</Text>
        <Text style={styles.instruction}>6. Test skip button with no photo</Text>
        <Text style={styles.instruction}>7. Test save with photo and consent</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  componentContainer: {
    flex: 1,
    minHeight: 600,
  },
  resultsContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 10,
    borderRadius: 10,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    marginVertical: 2,
  },
  dataContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  dataText: {
    fontSize: 14,
    marginVertical: 2,
  },
  instructionsContainer: {
    backgroundColor: '#e8f4f8',
    padding: 20,
    margin: 10,
    borderRadius: 10,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instruction: {
    fontSize: 14,
    marginVertical: 3,
    paddingLeft: 10,
  },
});