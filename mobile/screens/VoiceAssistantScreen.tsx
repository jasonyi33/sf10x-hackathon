import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isAudio?: boolean;
}

interface VoiceAssistantScreenProps {}

export default function VoiceAssistantScreen({}: VoiceAssistantScreenProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  
  const clientRef = useRef<RealtimeClient | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Initialize the voice assistant
  useEffect(() => {
    initializeVoiceAssistant();
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, []);

  const getCurrentLocation = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return null;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(coords);
      console.log('📍 Current location:', coords);
      return coords;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  };

  const initializeVoiceAssistant = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current location for location-based services
      await getCurrentLocation();

      // Get OpenAI API key from backend
      const apiKey = await api.getOpenAIApiKey();
      
      if (!apiKey) {
        throw new Error('OpenAI API key not available');
      }

      // Initialize RealtimeClient for gpt-realtime model
      const client = new RealtimeClient({ 
        apiKey: apiKey,
        dangerouslyAllowAPIKeyInBrowser: true // For React Native
      });

      // Configure the assistant for homeless outreach guidance using gpt-realtime model
      client.updateSession({
        model: 'gpt-realtime', // Explicitly specify the gpt-realtime model
        instructions: `You are a specialized AI assistant for homeless outreach workers using OpenAI's gpt-realtime model. You provide expert guidance on:

1. **Crisis Intervention**: How to safely approach and de-escalate situations with homeless individuals
2. **Care Protocols**: Best practices for providing assistance, medical care, and support
3. **Resource Recommendations**: Information about shelters, food banks, medical services, and social programs
4. **Medical Emergency Protocols**: Steps to take during medical emergencies
5. **De-escalation Techniques**: Strategies for managing tense or potentially dangerous situations
6. **Legal/Rights Information**: Understanding the rights of homeless individuals and legal considerations
7. **Safety Guidelines**: How to protect yourself and others while providing outreach services

Always prioritize safety, empathy, and practical guidance. Be concise but comprehensive in your responses. Use the available tools to get real-time information about local resources and patterns.`,
        voice: 'alloy',
        turn_detection: { type: 'server_vad' }, // Use server-side voice activity detection
        input_audio_transcription: { model: 'whisper-1' },
        // Additional gpt-realtime specific configurations
        temperature: 0.7, // Balanced creativity and consistency
        max_response_output_tokens: 4096, // Allow for comprehensive responses
      });

      // Add tools for accessing local resources and data
      client.addTool(
        {
          name: 'get_local_resources',
          description: 'Get local resources like shelters, medical facilities, and food services based on location',
          parameters: {
            type: 'object',
            properties: {
              lat: {
                type: 'number',
                description: 'Latitude coordinate',
              },
              lng: {
                type: 'number', 
                description: 'Longitude coordinate',
              },
            },
            required: [],
          },
        },
        async ({ lat, lng }: { lat?: number; lng?: number }) => {
          try {
            // Use provided coordinates or fall back to current location
            let latitude = lat;
            let longitude = lng;
            
            if (!latitude || !longitude) {
              const location = currentLocation || await getCurrentLocation();
              if (location) {
                latitude = location.latitude;
                longitude = location.longitude;
              }
            }
            
            console.log('🏠 Fetching local resources...', { latitude, longitude });
            const response = await api.getLocalResources(latitude, longitude);
            return response;
          } catch (error) {
            console.error('Failed to get local resources:', error);
            return { error: 'Failed to get local resources' };
          }
        }
      );

      client.addTool(
        {
          name: 'get_safety_guidelines',
          description: 'Get safety guidelines and protocols for homeless outreach work',
          parameters: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                description: 'Category of guidelines (crisis_intervention, medical_emergency, de_escalation, safety_protocols)',
                enum: ['crisis_intervention', 'medical_emergency', 'de_escalation', 'safety_protocols'],
              },
            },
            required: [],
          },
        },
        async ({ category }: { category?: string }) => {
          try {
            const response = await api.getSafetyGuidelines(category);
            return response;
          } catch (error) {
            console.error('Failed to get safety guidelines:', error);
            return { error: 'Failed to get safety guidelines' };
          }
        }
      );

      client.addTool(
        {
          name: 'get_individual_info',
          description: 'Get information about a specific individual in the database',
          parameters: {
            type: 'object',
            properties: {
              individual_id: {
                type: 'string',
                description: 'ID of the individual to get information about',
              },
            },
            required: ['individual_id'],
          },
        },
        async ({ individual_id }: { individual_id: string }) => {
          try {
            const response = await api.getIndividualProfile(individual_id);
            return response;
          } catch (error) {
            console.error('Failed to get individual info:', error);
            return { error: 'Failed to get individual information' };
          }
        }
      );

      // Set up event handlers
      client.on('conversation.updated', ({ item, delta }: { item: any; delta: any }) => {
        if (item.type === 'message' && item.role === 'assistant') {
          if (delta?.transcript) {
            // Update the last assistant message with new transcript content
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage && lastMessage.role === 'assistant') {
                lastMessage.content += delta.transcript;
              } else {
                // Create new assistant message
                newMessages.push({
                  id: Date.now().toString(),
                  role: 'assistant',
                  content: delta.transcript,
                  timestamp: new Date(),
                });
              }
              return newMessages;
            });
          }
        } else if (item.type === 'message' && item.role === 'user') {
          if (delta?.transcript) {
            // Update the last user message with new transcript content
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage && lastMessage.role === 'user') {
                lastMessage.content += delta.transcript;
              } else {
                // Create new user message
                newMessages.push({
                  id: Date.now().toString(),
                  role: 'user',
                  content: delta.transcript,
                  timestamp: new Date(),
                });
              }
              return newMessages;
            });
          }
        }
      });

      client.on('conversation.item.completed', ({ item }: { item: any }) => {
        if (item.type === 'message') {
          // Message completed, scroll to bottom
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      });

      client.on('conversation.interrupted', () => {
        setIsRecording(false);
      });

      client.on('error', (event: any) => {
        console.error('Voice assistant error:', event);
        setError('Connection error occurred');
        setIsConnected(false);
        setIsRecording(false);
      });

      // Connect to the API
      await client.connect();
      
      clientRef.current = client;
      setIsConnected(true);
      
      console.log('🎤 Voice Assistant connected using gpt-realtime model');
      
      // Add welcome message only once
      if (!hasShownWelcome) {
        const welcomeMessage: Message = {
          id: 'welcome',
          role: 'assistant',
          content: 'Hello! I\'m your homeless outreach assistant. I can help you with crisis intervention, care protocols, resource recommendations, and safety guidance. How can I assist you today?',
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
        setHasShownWelcome(true);
      }

    } catch (err) {
      console.error('Failed to initialize voice assistant:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize voice assistant');
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    if (!clientRef.current || !isConnected) {
      Alert.alert('Error', 'Voice assistant not connected');
      return;
    }

    try {
      // Request audio permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permission to use voice assistant');
        return;
      }

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);

      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);

      // Add user message showing recording started
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: '[Recording... Speak now]',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      console.log('🎤 Started recording audio');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current || !isRecording) {
      return;
    }

    try {
      setIsProcessingAudio(true);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);

      if (uri && clientRef.current) {
        console.log('🎤 Stopped recording, processing audio:', uri);
        
        // Update the user message to show processing
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === 'user' && lastMessage.content === '[Recording... Speak now]') {
            lastMessage.content = '[Processing your speech...]';
          }
          return newMessages;
        });

        // For now, we'll use the backend transcription service to process the audio
        // This is a more reliable approach than trying to stream directly to RealtimeClient
        try {
          const transcriptionResponse = await api.transcribeAudio(uri);
          const transcription = transcriptionResponse.transcription || 'I need help with homeless outreach guidance';
          
          console.log('🎤 Transcription result:', transcription);
          
          // Update the user message with the actual transcription
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'user' && lastMessage.content === '[Processing your speech...]') {
              lastMessage.content = transcription;
            }
            return newMessages;
          });

          // Send the transcription to the voice assistant
          clientRef.current.sendUserMessageContent([
            { type: 'input_text', text: transcription }
          ]);
          
        } catch (transcriptionError) {
          console.error('Transcription failed:', transcriptionError);
          
          // Fallback to a generic message if transcription fails
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'user' && lastMessage.content === '[Processing your speech...]') {
              lastMessage.content = 'I need help with homeless outreach guidance';
            }
            return newMessages;
          });

          clientRef.current.sendUserMessageContent([
            { type: 'input_text', text: 'I need help with homeless outreach guidance' }
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording. Please try again.');
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const sendTextMessage = async (text: string) => {
    if (!clientRef.current || !isConnected) {
      Alert.alert('Error', 'Voice assistant not connected');
      return;
    }

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Send text message to assistant
    clientRef.current.sendUserMessageContent([
      { type: 'input_text', text: text }
    ]);
  };

  const clearConversation = () => {
    setMessages([]);
    setHasShownWelcome(false); // Reset welcome message flag
    if (clientRef.current) {
      // Reset the conversation
      clientRef.current.conversation.clear();
    }
  };

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.role === 'user' ? styles.userMessage : styles.assistantMessage,
      ]}
    >
      <View style={styles.messageHeader}>
        <Ionicons
          name={message.role === 'user' ? 'person' : 'chatbubble'}
          size={16}
          color={message.role === 'user' ? '#007AFF' : '#34C759'}
        />
        <Text style={styles.messageRole}>
          {message.role === 'user' ? 'You' : 'Assistant'}
        </Text>
        <Text style={styles.messageTime}>
          {message.timestamp.toLocaleTimeString()}
        </Text>
      </View>
      <Text style={styles.messageContent}>{message.content}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Initializing Voice Assistant...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Assistant</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearConversation}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: isConnected ? '#34C759' : '#FF3B30' }
          ]} />
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={initializeVoiceAssistant}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map(renderMessage)}
      </ScrollView>

      <View style={styles.controlsContainer}>
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your question here..."
            value={textInput}
            onChangeText={setTextInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!textInput.trim() || !isConnected) && styles.sendButtonDisabled
            ]}
            onPress={() => {
              if (textInput.trim() && isConnected) {
                sendTextMessage(textInput.trim());
                setTextInput('');
              }
            }}
            disabled={!textInput.trim() || !isConnected}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.voiceControlsContainer}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive,
              isProcessingAudio && styles.recordButtonProcessing,
              (!isConnected || isProcessingAudio) && styles.recordButtonDisabled,
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={!isConnected || isProcessingAudio}
          >
            {isProcessingAudio ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons
                name={isRecording ? 'stop' : 'mic'}
                size={32}
                color={isRecording ? '#FFFFFF' : '#007AFF'}
              />
            )}
          </TouchableOpacity>
          <Text style={styles.recordButtonText}>
            {isProcessingAudio ? 'Processing...' : isRecording ? 'Tap to stop' : 'Tap to start'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    padding: 8,
    marginRight: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF3B30',
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageRole: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    color: '#666',
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    marginLeft: 'auto',
  },
  messageContent: {
    fontSize: 16,
    lineHeight: 22,
    color: '#000',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  controlsContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    color: '#000',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  voiceControlsContainer: {
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  recordButtonActive: {
    backgroundColor: '#FF3B30',
    borderColor: '#CC2E24',
  },
  recordButtonProcessing: {
    backgroundColor: '#FF9500',
    borderColor: '#CC7700',
  },
  recordButtonDisabled: {
    borderColor: '#CCCCCC',
    opacity: 0.5,
  },
  recordButtonText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
