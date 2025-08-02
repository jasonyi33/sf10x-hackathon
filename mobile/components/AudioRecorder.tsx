import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { ErrorHandler } from '../utils/errorHandler';

interface AudioRecorderProps {
  onRecordingComplete: (uri: string, location?: { 
    location: {
      latitude: number;
      longitude: number;
      address: string;
    }
  }) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  onRecordingStart,
  onRecordingStop,
}) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Request permissions
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          const error = ErrorHandler.handleRecordingError(new Error('Recording permission denied'));
          ErrorHandler.showError(error);
        }
      } catch (error) {
        const appError = ErrorHandler.handleError(error, 'Audio Permission Request');
        ErrorHandler.showError(appError);
      }
    })();
  }, []);

  // Start recording
  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Capture location when recording starts
      let locationData: { 
        location: {
          latitude: number;
          longitude: number;
          address: string;
        }
      } | undefined;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          
          // Get address from coordinates
          const addressResponse = await Location.reverseGeocodeAsync({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          });

          const address = addressResponse[0];
          const addressString = address 
            ? `${address.street || ''} ${address.city || ''} ${address.region || ''}`.trim()
            : 'Unknown Address';

          locationData = {
            location: {
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
              address: addressString,
            }
          };
        }
      } catch (locationErr) {
        console.log('Location capture failed, continuing without location:', locationErr);
        const error = ErrorHandler.handleLocationError(locationErr);
        ErrorHandler.showError(error);
      }

      // Use default recording options for hackathon
      const { recording } = await Audio.Recording.createAsync();
      setRecording(recording);
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      onRecordingStart?.();

      // Store location data for when recording completes
      (recording as any).locationData = locationData;

      // Start duration timer
      intervalRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          
          // Warning at 1:45 (105 seconds)
          if (newDuration === 105) {
            Alert.alert(
              'Recording Time Warning',
              'Recording will automatically stop in 15 seconds.',
              [{ text: 'OK' }]
            );
          }
          
          // Auto-stop at 2:00 (120 seconds)
          if (newDuration >= 120) {
            stopRecording();
            return prev;
          }
          
          return newDuration;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
      const error = ErrorHandler.handleRecordingError(err);
      ErrorHandler.showError(error);
    }
  };

  // Stop recording
  const stopRecording = async () => {
    if (!recording) return;

    try {
      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);
      setIsPaused(false);
      onRecordingStop?.();

      if (uri) {
        const locationData = (recording as any).locationData;
        onRecordingComplete(uri, locationData);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      const error = ErrorHandler.handleRecordingError(err);
      ErrorHandler.showError(error);
    }
  };

  // Pause recording
  const pauseRecording = async () => {
    if (!recording) return;

    try {
      await recording.pauseAsync();
      setIsPaused(true);
      
      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (err) {
      console.error('Failed to pause recording', err);
      const error = ErrorHandler.handleRecordingError(err);
      ErrorHandler.showError(error);
    }
  };

  // Resume recording
  const resumeRecording = async () => {
    if (!recording) return;

    try {
      await recording.startAsync();
      setIsPaused(false);
      
      // Restart interval
      intervalRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          
          // Warning at 1:45 (105 seconds)
          if (newDuration === 105) {
            Alert.alert(
              'Recording Time Warning',
              'Recording will automatically stop in 15 seconds.',
              [{ text: 'OK' }]
            );
          }
          
          // Auto-stop at 2:00 (120 seconds)
          if (newDuration >= 120) {
            stopRecording();
            return prev;
          }
          
          return newDuration;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to resume recording', err);
    }
  };

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if recording is too short
  const isTooShort = duration < 10;
  
  // Check if we should show warning color (after 1:30 = 90 seconds)
  const shouldShowWarning = duration > 90;

  return (
    <View style={styles.container}>
      {/* Duration Display */}
      <View style={styles.durationContainer}>
        <Text style={[
          styles.durationText,
          shouldShowWarning && styles.durationWarning
        ]}>
          {formatDuration(duration)} / 2:00
        </Text>
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>
              {isPaused ? 'PAUSED' : 'RECORDING'}
            </Text>
          </View>
        )}
      </View>

      {/* Recording Controls */}
      <View style={styles.controlsContainer}>
        {!isRecording ? (
          // Start Recording Button
          <TouchableOpacity
            style={styles.recordButton}
            onPress={startRecording}
          >
            <Text style={styles.recordButtonText}>Start Recording</Text>
          </TouchableOpacity>
        ) : (
          // Recording Controls
          <View style={styles.recordingControls}>
            {isPaused ? (
              <TouchableOpacity
                style={styles.resumeButton}
                onPress={resumeRecording}
              >
                <Text style={styles.resumeButtonText}>Resume</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.pauseButton}
                onPress={pauseRecording}
              >
                <Text style={styles.pauseButtonText}>Pause</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.stopButton,
                isTooShort && styles.stopButtonDisabled
              ]}
              onPress={stopRecording}
              disabled={isTooShort}
            >
              <Text style={[
                styles.stopButtonText,
                isTooShort && styles.stopButtonTextDisabled
              ]}>
                Stop
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          {!isRecording 
            ? 'Tap "Start Recording" to begin'
            : isTooShort 
              ? 'Recording must be at least 10 seconds'
              : 'Tap "Stop" when finished'
          }
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    margin: 16,
  },
  durationContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  durationText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  durationWarning: {
    color: '#dc3545', // Red color for warning
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#dc3545',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc3545',
  },
  controlsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  recordButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
  },
  recordButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  recordingControls: {
    flexDirection: 'row',
    gap: 16,
  },
  pauseButton: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  pauseButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  resumeButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  resumeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  stopButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  stopButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  stopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  stopButtonTextDisabled: {
    color: '#adb5bd',
  },
  instructionsContainer: {
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
}); 