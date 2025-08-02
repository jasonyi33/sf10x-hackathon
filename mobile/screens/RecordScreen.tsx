import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { AudioRecorder } from '../components/AudioRecorder';
import { TranscriptionResults } from '../components/TranscriptionResults';
import { ManualEntryForm } from '../components/ManualEntryForm';
import { LocationPicker } from '../components/LocationPicker';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { api, TranscriptionResult } from '../services/api';
import { ErrorHandler } from '../utils/errorHandler';

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
    location: {
      latitude: number;
      longitude: number;
      address: string;
    }
  } | null>(null);

  const handleRecordingComplete = async (uri: string, location?: { 
    location: {
      latitude: number;
      longitude: number;
      address: string;
    }
  }) => {
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
      const result = await api.uploadAudio(uri);
      
      if (result.error) {
        console.error('Upload failed:', result.error);
        setUploadError(result.error);
        const error = ErrorHandler.handleError(new Error(result.error), 'Audio Upload');
        ErrorHandler.showError(error);
      } else if (result.url) {
        console.log('Upload successful:', result.url);
        setUploadedUrl(result.url);
        ErrorHandler.showSuccess('Audio uploaded successfully');
        
        // Start transcription immediately after upload
        await transcribeAudio(result.url);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Upload failed');
      const appError = ErrorHandler.handleError(error, 'Audio Upload');
      ErrorHandler.showError(appError);
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
      
      console.log('Transcription result:', result);
      setTranscriptionResult(result);
      ErrorHandler.showSuccess('Transcription completed successfully');
    } catch (error) {
      console.error('Transcription error:', error);
      setTranscriptionError('Transcription failed');
      const appError = ErrorHandler.handleError(error, 'Audio Transcription');
      ErrorHandler.showError(appError);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSaveTranscription = async (data: Record<string, any>) => {
    try {
      const saveData = {
        ...data,
        location: selectedLocation?.location,
        audio_url: uploadedUrl,
        transcription: transcriptionResult?.transcription,
      };
      
      await api.saveIndividual(saveData);
      ErrorHandler.showSuccess('Data saved successfully');
      
      // Reset state
      setRecordingUri(null);
      setUploadedUrl(null);
      setTranscriptionResult(null);
      setSelectedLocation(null);
      setShowManualEntry(false);
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'Save Transcription');
      ErrorHandler.showError(appError);
    }
  };

  const handleSaveManualEntry = async (data: Record<string, any>) => {
    try {
      const saveData = {
        ...data,
        location: selectedLocation?.location,
      };
      
      await api.saveIndividual(saveData);
      ErrorHandler.showSuccess('Data saved successfully');
      
      // Reset state
      setShowManualEntry(false);
      setSelectedLocation(null);
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'Save Manual Entry');
      ErrorHandler.showError(appError);
    }
  };

  const handleCancelTranscription = () => {
    setTranscriptionResult(null);
    setUploadedUrl(null);
    setRecordingUri(null);
    setSelectedLocation(null);
  };

  const handleCancelManualEntry = () => {
    setShowManualEntry(false);
    setSelectedLocation(null);
  };

  const handleRecordingStart = () => {
    setUploadError(null);
    setTranscriptionError(null);
    setTranscriptionResult(null);
    setUploadedUrl(null);
  };

  const handleLocationSelected = (location: { 
    location: {
      latitude: number;
      longitude: number;
      address: string;
    }
  }) => {
    setSelectedLocation(location);
    setShowLocationPicker(false);
  };

  const handleLocationCancel = () => {
    setShowLocationPicker(false);
  };

  const handleRecordingStop = () => {
    // Recording stopped, will be handled by handleRecordingComplete
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Authentication Required</Text>
        <Text style={styles.subtitle}>Please log in to record observations</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Recording</Text>
        <Text style={styles.subtitle}>Record observations about homeless individuals</Text>
      </View>

      {/* Location Information */}
      {selectedLocation && (
        <View style={styles.locationInfoContainer}>
          <Text style={styles.locationInfoText}>
            📍 Location: {selectedLocation.location.address}
          </Text>
        </View>
      )}

      {/* Audio Recorder */}
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
          <ActivityIndicator size="small" color="#2196f3" />
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

      {/* Upload Error */}
      {uploadError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Upload Error</Text>
          <Text style={styles.errorText}>{uploadError}</Text>
        </View>
      )}

      {/* Transcription Error */}
      {transcriptionError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Transcription Error</Text>
          <Text style={styles.errorText}>{transcriptionError}</Text>
        </View>
      )}

      {/* Transcription Results */}
      {transcriptionResult && (
        <TranscriptionResults
          result={transcriptionResult}
          onSave={handleSaveTranscription}
          onCancel={handleCancelTranscription}
        />
      )}

      {/* Manual Entry Form */}
      {showManualEntry && (
        <ManualEntryForm
          selectedLocation={selectedLocation?.location || null}
          onSave={handleSaveManualEntry}
          onCancel={handleCancelManualEntry}
        />
      )}

      {/* Action Buttons */}
      {!transcriptionResult && !showManualEntry && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => setShowLocationPicker(true)}
          >
            <Text style={styles.locationButtonText}>
              {selectedLocation ? 'Change Location' : 'Set Location'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manualEntryButton}
            onPress={() => setShowManualEntry(true)}
          >
            <Text style={styles.manualEntryButtonText}>Manual Entry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPicker
          initialLocation={selectedLocation?.location ? {
            latitude: selectedLocation.location.latitude,
            longitude: selectedLocation.location.longitude
          } : undefined}
          onLocationSelected={handleLocationSelected}
          onCancel={handleLocationCancel}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
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