import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { AudioRecorder } from '../components/AudioRecorder';
import { TranscriptionResults } from '../components/TranscriptionResults';
import { ManualEntryForm } from '../components/ManualEntryForm';
import { LocationPicker } from '../components/LocationPicker';
import { useAuth } from '../contexts/AuthContext';
import { uploadAudio } from '../services/supabase';
import { api, TranscriptionResult } from '../services/api';

export const RecordScreen: React.FC = () => {
  const { user, loading } = useAuth();
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);

  const handleRecordingComplete = async (uri: string, location?: { latitude: number; longitude: number; address?: string }) => {
    console.log('Recording completed:', uri, location);
    setRecordingUri(uri);
    setUploadError(null);
    setTranscriptionError(null);
    
    // Set location if captured during recording
    if (location && !selectedLocation) {
      setSelectedLocation(location);
    }
    
    // Start upload process
    await uploadAudioFile(uri);
  };

  const uploadAudioFile = async (uri: string) => {
    try {
      setIsUploading(true);
      setUploadError(null);
      
      console.log('Starting audio upload...');
      const result = await uploadAudio(uri);
      
      if (result.error) {
        console.error('Upload failed:', result.error);
        setUploadError(result.error);
        Alert.alert('Upload Failed', result.error);
      } else if (result.url) {
        console.log('Upload successful:', result.url);
        setUploadedUrl(result.url);
        
        // Start transcription immediately after upload
        await transcribeAudio(result.url);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Upload failed');
      Alert.alert('Error', 'Failed to upload audio file');
    } finally {
      setIsUploading(false);
    }
  };

  const transcribeAudio = async (audioUrl: string) => {
    try {
      setIsTranscribing(true);
      setTranscriptionError(null);
      
      console.log('Starting transcription...');
      const result = await api.transcribe(audioUrl);
      
      console.log('Transcription completed:', result);
      setTranscriptionResult(result);
      
      Alert.alert(
        'Transcription Complete',
        'Audio has been transcribed and categorized successfully!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Transcription error:', error);
      setTranscriptionError('Transcription failed');
      Alert.alert('Error', 'Failed to transcribe audio');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSaveTranscription = async (data: Record<string, any>) => {
    try {
      console.log('Saving transcription data:', data);
      
      // TODO: Save to backend - this will be implemented in next steps
      Alert.alert(
        'Save Successful',
        'Transcription data saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset everything for new recording
              setRecordingUri(null);
              setUploadedUrl(null);
              setTranscriptionResult(null);
              setUploadError(null);
              setTranscriptionError(null);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save transcription data');
    }
  };

  const handleSaveManualEntry = async (data: Record<string, any>) => {
    try {
      console.log('Saving manual entry data:', data);
      
      // TODO: Save to backend - this will be implemented in next steps
      Alert.alert(
        'Save Successful',
        'Manual entry data saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset everything for new entry
              setShowManualEntry(false);
              setRecordingUri(null);
              setUploadedUrl(null);
              setTranscriptionResult(null);
              setUploadError(null);
              setTranscriptionError(null);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save manual entry data');
    }
  };

  const handleCancelTranscription = () => {
    setTranscriptionResult(null);
    setTranscriptionError(null);
  };

  const handleCancelManualEntry = () => {
    setShowManualEntry(false);
  };

  const handleRecordingStart = () => {
    console.log('Recording started');
    setRecordingUri(null);
    setUploadedUrl(null);
    setTranscriptionResult(null);
    setUploadError(null);
    setTranscriptionError(null);
  };

  const handleLocationSelected = (location: { latitude: number; longitude: number; address?: string }) => {
    console.log('Location selected:', location);
    setSelectedLocation(location);
    setShowLocationPicker(false);
  };

  const handleLocationCancel = () => {
    setShowLocationPicker(false);
  };

  const handleRecordingStop = () => {
    console.log('Recording stopped');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show transcription results if available
  if (transcriptionResult) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Review Transcription</Text>
          <Text style={styles.subtitle}>
            {user ? `Logged in as: ${user.email}` : 'Not logged in'}
          </Text>
        </View>
        <TranscriptionResults
          result={transcriptionResult}
          onSave={handleSaveTranscription}
          onCancel={handleCancelTranscription}
        />
      </View>
    );
  }

  // Show location picker if requested
  if (showLocationPicker) {
    return (
      <LocationPicker
        onLocationSelected={handleLocationSelected}
        onCancel={handleLocationCancel}
        initialLocation={selectedLocation || undefined}
      />
    );
  }

  // Show manual entry form if requested
  if (showManualEntry) {
    return (
      <View style={styles.container}>
        <ManualEntryForm
          onSave={handleSaveManualEntry}
          onCancel={handleCancelManualEntry}
          selectedLocation={selectedLocation}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Recording</Text>
        <Text style={styles.subtitle}>
          {user ? `Logged in as: ${user.email}` : 'Not logged in'}
        </Text>
      </View>

      {/* Location and Manual Entry Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => setShowLocationPicker(true)}
        >
          <Text style={styles.locationButtonText}>
            📍 {selectedLocation ? 'Change Location' : 'Set Location'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.manualEntryButton}
          onPress={() => setShowManualEntry(true)}
        >
          <Text style={styles.manualEntryButtonText}>📝 Manual Entry</Text>
        </TouchableOpacity>
      </View>

      {selectedLocation && (
        <View style={styles.locationInfoContainer}>
          <Text style={styles.locationInfoText}>
            📍 Location: {selectedLocation.address || `${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`}
          </Text>
        </View>
      )}

      <View style={styles.recorderContainer}>
        <AudioRecorder
          onRecordingComplete={handleRecordingComplete}
          onRecordingStart={handleRecordingStart}
          onRecordingStop={handleRecordingStop}
        />
      </View>

      {/* Upload Status */}
      {isUploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.uploadingText}>Uploading audio...</Text>
        </View>
      )}

      {/* Transcription Status */}
      {isTranscribing && (
        <View style={styles.transcribingContainer}>
          <ActivityIndicator size="small" color="#28a745" />
          <Text style={styles.transcribingText}>Transcribing audio...</Text>
        </View>
      )}

      {uploadError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Upload Error</Text>
          <Text style={styles.errorText}>❌ {uploadError}</Text>
        </View>
      )}

      {transcriptionError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Transcription Error</Text>
          <Text style={styles.errorText}>❌ {transcriptionError}</Text>
        </View>
      )}

      {recordingUri && !isUploading && !uploadedUrl && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Recording Status</Text>
          <Text style={styles.statusText}>✅ Recording saved successfully</Text>
          <Text style={styles.statusText}>📁 File: {recordingUri.split('/').pop()}</Text>
          <Text style={styles.statusText}>⏳ Ready to upload...</Text>
        </View>
      )}

      {uploadedUrl && !isTranscribing && !transcriptionResult && (
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>Upload Successful</Text>
          <Text style={styles.successText}>✅ Audio uploaded to Supabase Storage</Text>
          <Text style={styles.successText}>🔗 URL: {uploadedUrl.substring(0, 50)}...</Text>
          <Text style={styles.successText}>🎯 Ready for transcription</Text>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Recording Guidelines</Text>
        <Text style={styles.infoText}>• Minimum recording: 10 seconds</Text>
        <Text style={styles.infoText}>• Maximum recording: 2 minutes</Text>
        <Text style={styles.infoText}>• Format: M4A with AAC codec (64kbps)</Text>
        <Text style={styles.infoText}>• Speak clearly and include key details</Text>
        <Text style={styles.infoText}>• Audio will be uploaded and transcribed</Text>
        <Text style={styles.infoText}>• Or use manual entry for direct input</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  buttonContainer: {
    padding: 20,
    gap: 12,
  },
  locationButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  locationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  manualEntryButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  manualEntryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  locationInfoContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  locationInfoText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  recorderContainer: {
    marginTop: 10,
  },
  uploadingContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  uploadingText: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: '600',
  },
  transcribingContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#d4edda',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transcribingText: {
    fontSize: 16,
    color: '#155724',
    fontWeight: '600',
  },
  statusContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#d4edda',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#155724',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#155724',
    marginBottom: 4,
  },
  successContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#d1ecf1',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#17a2b8',
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c5460',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#0c5460',
    marginBottom: 4,
  },
  errorContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#f8d7da',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#721c24',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#721c24',
    marginBottom: 4,
  },
  infoContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
}); 