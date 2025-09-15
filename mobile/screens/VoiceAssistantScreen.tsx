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
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { AudioProcessor, RECORDING_CONFIG, configureAudioRecording } from '../utils/audioProcessor';
import { API_CONFIG } from '../config/api';

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
  const [isMuted, setIsMuted] = useState(false);
  const [currentAudioData, setCurrentAudioData] = useState<string>('');
  // Use a ref to avoid stale state when buffering streamed audio
  const audioBufferRef = useRef<string>('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Initialize the voice assistant
  useEffect(() => {
    initializeVoiceAssistant();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
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

  // Handle WebSocket events from OpenAI Realtime API
  const handleWebSocketEvent = (event: any) => {
    console.log('🔍 Processing WebSocket event:', event.type);
    
    switch (event.type) {
      case 'session.created':
        console.log('✅ Session created successfully');
        break;
        
      case 'session.updated':
        console.log('✅ Session updated successfully');
        break;
        
      case 'conversation.item.created':
      case 'conversation.item.added':
        if (event.item?.type === 'message' && event.item?.role === 'assistant') {
          console.log('📝 Assistant message created/added');
          // Add assistant message to UI
          const assistantMessage: Message = {
            id: event.item.id || Date.now().toString(),
            role: 'assistant',
            content: '',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMessage]);
        }
        break;
        
      case 'conversation.item.updated':
        if (event.item?.type === 'message' && event.item?.role === 'assistant') {
          console.log('📝 Assistant message updated');
          // Update the last assistant message
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content = event.item.content?.[0]?.text || '';
            }
            return newMessages;
          });
        }
        break;
        
      case 'conversation.item.done':
        if (event.item?.type === 'message' && event.item?.role === 'assistant') {
          console.log('✅ Assistant message completed');
          // Scroll to bottom when message is complete
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
        break;
        
      case 'response.output_audio_transcript.delta':
        console.log('📝 Audio transcript delta:', event.delta);
        // Update the last assistant message with the transcript
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content += event.delta || '';
          }
          return newMessages;
        });
        break;

      // Also handle explicit text stream events if the model emits them
      case 'response.output_text.delta':
        console.log('📝 Text delta:', event.delta);
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content += event.delta || '';
          }
          return newMessages;
        });
        break;

      case 'response.output_text.done':
        console.log('✅ Text output completed');
        break;
        
      case 'response.output_audio_transcript.done':
        console.log('✅ Audio transcript completed');
        break;
        
      case 'response.output_audio.delta':
        console.log('🎵 Audio delta received');
        // Collect audio data
        if (event.delta) {
          // Keep state updated for debugging/visibility
          setCurrentAudioData(prev => prev + event.delta);
          // Append to ref buffer to avoid stale state in done handler
          audioBufferRef.current += event.delta;
        }
        break;
        
      case 'response.output_audio.done':
        console.log('✅ Audio output completed');
        // Play the collected audio data
        {
          const buffered = audioBufferRef.current || currentAudioData;
          if (buffered && !isMuted) {
            playAudioData(buffered);
          }
          // Reset buffers for next response
          audioBufferRef.current = '';
          setCurrentAudioData('');
        }
        break;
        
      case 'input_audio_buffer.speech_started':
        console.log('🎤 Speech started detected');
        break;
        
      case 'input_audio_buffer.speech_stopped':
        console.log('🎤 Speech stopped detected');
        break;
        
      case 'input_audio_buffer.committed':
        console.log('✅ Audio buffer committed');
        break;
        
      case 'response.done':
        console.log('✅ Response completed');
        break;
        
      case 'error':
        console.error('❌ Server error:', event.error);
        setError(event.error?.message || 'Server error occurred');
        break;
        
      case 'echo':
        console.log('🔍 Echo event received (testing mode)');
        break;
        
      default:
        console.log('🔍 Unhandled event type:', event.type);
        console.log('🔍 Full event data:', JSON.stringify(event, null, 2));
    }
  };

  const playAudioData = async (audioData: string) => {
    try {
      console.log('🎵 Playing audio data...');
      console.log('🎵 Audio data length:', audioData.length);

      // Server outputs base64 PCM; convert to WAV and play from a temp file
      const pcmBytes = AudioProcessor.base64ToArrayBuffer(audioData);
      if (!AudioProcessor.validatePCMData(pcmBytes)) {
        throw new Error('Invalid PCM data format');
      }

      const wavBuffer = AudioProcessor.createWavFile(pcmBytes);

      // Convert WAV ArrayBuffer to base64 to persist as a file
      const wavBytes = new Uint8Array(wavBuffer);
      let binary = '';
      const chunk = 0x8000;
      for (let i = 0; i < wavBytes.length; i += chunk) {
        const slice = wavBytes.subarray(i, i + chunk);
        binary += String.fromCharCode.apply(null, Array.from(slice));
      }
      const base64Wav = btoa(binary);

      const fileUri = `${FileSystem.cacheDirectory}gpt_audio_${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(fileUri, base64Wav, { encoding: FileSystem.EncodingType.Base64 });

      const { sound } = await Audio.Sound.createAsync({ uri: fileUri }, { shouldPlay: true });
      console.log('🎵 Audio playback started');

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          console.log('🎵 Audio playback completed');
          sound.unloadAsync();
          FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
        }
      });
    } catch (error) {
      console.error('❌ Error playing audio:', error);
      console.log('🎵 Audio playback failed; transcript text is still shown');
    }
  };

  const toggleMute = async () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      // If we're muting, stop any current audio playback
      console.log('🔇 Muted - Audio output disabled');
    } else {
      console.log('🔊 Unmuted - Audio output enabled');
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

      // Connect to our backend WebSocket proxy
      // This will handle the authentication with OpenAI
      console.log('🔌 Connecting to backend WebSocket proxy...');
      
      // Get the backend URL from our API config
      const backendUrl = API_CONFIG.BASE_URL.replace('http', 'ws');
      const wsUrl = `${backendUrl}/api/voice-assistant/realtime/ws`;
      
      console.log('🔌 WebSocket URL:', wsUrl);
      console.log('🔌 Backend URL:', backendUrl);
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ Connected to OpenAI Realtime API');
        setIsConnected(true);
        console.log('🔌 WebSocket connection state:', ws.readyState);
        
        // Session is already configured via ephemeral token, no need to send again
        console.log('🔧 Session already configured via ephemeral token');
      };

      ws.onmessage = (event: any) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Received WebSocket message:', data);
          
          // Handle different event types
          handleWebSocketEvent(data);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (err: any) => {
        console.error('❌ WebSocket error:', err);
        console.error('❌ Error details:', JSON.stringify(err, null, 2));
        setError(`WebSocket connection error: ${err.message || 'Unknown error'}`);
        setIsConnected(false);
        console.log('🔌 Connection state set to false due to error');
      };

      ws.onclose = (event: any) => {
        console.log('🔌 WebSocket connection closed');
        console.log('🔌 Close event details:', JSON.stringify(event, null, 2));
        setIsConnected(false);
        console.log('🔌 Connection state set to false due to close');
      };

      wsRef.current = ws;

    } catch (err) {
      console.error('Failed to initialize voice assistant:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize voice assistant');
    } finally {
      setIsLoading(false);
    }
  };

  // Add welcome message when connected
  const addWelcomeMessage = () => {
    if (!hasShownWelcome) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: 'Hello! I\'m your homeless outreach assistant. I can help you with crisis intervention, care protocols, resource recommendations, and safety guidance, among other things. How can I assist you today?',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      setHasShownWelcome(true);
      console.log('👋 Welcome message added');
    }
  };

  const startRecording = async () => {
    if (!wsRef.current || !isConnected) {
      Alert.alert('Error', 'Voice assistant not connected');
      return;
    }

    try {
      // Configure audio recording with optimized settings
      await configureAudioRecording();

      // Start recording with fallback configuration to avoid AAC error
      const recording = new Audio.Recording();
      
      // Use the most basic configuration to avoid encoder errors
      try {
        // Try with basic high quality preset first
        await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      } catch (error) {
        console.log('⚠️ High quality preset failed, trying low quality...');
        // Fallback to low quality if high quality fails
        await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.LOW_QUALITY);
      }
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

      console.log('🎤 Started recording audio with optimized settings');
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

      if (uri && wsRef.current) {
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

        try {
          // Use backend Whisper transcription, then send text to Realtime
          console.log('🎤 Transcribing recorded audio via backend...');
          const transcriptionResponse = await api.transcribeAudio(uri);
          const transcription = transcriptionResponse.transcription || '';

          console.log('🎤 Transcription result:', transcription);

          // Update the user message with the actual transcription
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'user' && lastMessage.content === '[Processing your speech...]') {
              lastMessage.content = transcription || '[Unrecognized speech]';
            }
            return newMessages;
          });

          // Send transcription as a user message to Realtime
          const messageEvent = {
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [
                { type: 'input_text', text: transcription || 'Please assist with homeless outreach guidance' },
              ],
            },
          };

          wsRef.current.send(JSON.stringify(messageEvent));
          console.log('✅ Sent transcribed text to Realtime');

          // Trigger assistant response (speech output is configured server-side)
          setTimeout(() => {
            const responseEvent = { type: 'response.create' };
            wsRef.current?.send(JSON.stringify(responseEvent));
            console.log('🎯 Triggered assistant response');
          }, 100);

        } catch (audioError) {
          console.error('Transcription failed:', audioError);

          // Fallback: send a generic message if speech not recognized
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'user' && lastMessage.content === '[Processing your speech...]') {
              lastMessage.content = 'I need help with homeless outreach guidance';
            }
            return newMessages;
          });

          const fallbackEvent = {
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [ { type: 'input_text', text: 'I need help with homeless outreach guidance' } ],
            },
          };
          wsRef.current.send(JSON.stringify(fallbackEvent));
          console.log('🎯 Sent fallback text message');
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
    if (!wsRef.current || !isConnected) {
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

    // Send text message to assistant via WebSocket
    console.log('📤 Sending text message to GPT Realtime via WebSocket');
    console.log('📤 Message content:', text);
    
    // Send message via WebSocket
    const messageEvent = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: text,
          },
        ],
      },
    };
    
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify(messageEvent));
      console.log('✅ Text message sent successfully via WebSocket');
      
      // Trigger assistant response
      setTimeout(() => {
        const responseEvent = {
          type: "response.create",
        };
        wsRef.current?.send(JSON.stringify(responseEvent));
        console.log('🎯 Triggered assistant response');
      }, 100);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setHasShownWelcome(false); // Reset welcome message flag
    // Note: WebSocket doesn't have a conversation.clear() method
    // The conversation state is managed by the server
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
            style={styles.testButton}
            onPress={() => {
              if (wsRef.current && isConnected) {
                console.log('🧪 Testing GPT Realtime speech output via WebSocket');
                sendTextMessage('Hello, this is a test of the text to speech functionality.');
              }
            }}
          >
            <Ionicons name="play" size={16} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.muteButton}
            onPress={toggleMute}
          >
            <Ionicons 
              name={isMuted ? "volume-mute" : "volume-high"} 
              size={20} 
              color={isMuted ? "#FF3B30" : "#007AFF"} 
            />
          </TouchableOpacity>
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
            onPress={() => {
              console.log('🎤 Record button pressed:', {
                isRecording,
                isConnected,
                isProcessingAudio,
                disabled: !isConnected || isProcessingAudio
              });
              if (isRecording) {
                stopRecording();
              } else {
                startRecording();
              }
            }}
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
          <Text style={[styles.recordButtonText, { fontSize: 12, marginTop: 4 }]}>
            {isConnected ? 'Connected' : 'Not Connected'}
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
  testButton: {
    padding: 8,
    marginRight: 4,
  },
  muteButton: {
    padding: 8,
    marginRight: 8,
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
