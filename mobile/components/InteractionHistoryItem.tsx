import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Interaction } from '../types';

interface InteractionHistoryItemProps {
  interaction: Interaction;
  onPress: (interaction: Interaction) => void;
}

export default function InteractionHistoryItem({ interaction, onPress }: InteractionHistoryItemProps) {
  // Format the date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if this was a voice entry (has transcription)
  const isVoiceEntry = !!interaction.transcription;

  // Get location display
  const getLocationDisplay = () => {
    if (!interaction.location) return 'Location not specified';
    
    const { latitude, longitude, address } = interaction.location;
    if (address) return address;
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  };

  // Get changes summary
  const getChangesSummary = () => {
    if (!interaction.changes || Object.keys(interaction.changes).length === 0) {
      return 'No data changes';
    }
    
    const changes = Object.entries(interaction.changes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    return changes;
  };



  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(interaction)}>
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(interaction.created_at)}</Text>
        <View style={styles.entryType}>
          <Text style={[styles.entryTypeText, { color: isVoiceEntry ? '#007AFF' : '#6B7280' }]}>
            {isVoiceEntry ? 'Voice Entry' : 'Manual Entry'}
          </Text>
        </View>
      </View>
      
      <View style={styles.details}>
        <Text style={styles.workerName}>
          {interaction.user_name || 'Unknown Worker'}
        </Text>
        <Text style={styles.location}>
          📍 {getLocationDisplay()}
        </Text>
      </View>
      
      {/* Show changes summary */}
      <Text style={styles.changesSummary}>
        📝 {getChangesSummary()}
      </Text>
      
      {/* Show transcription preview if available */}
      {interaction.transcription && (
        <Text style={styles.transcriptionPreview} numberOfLines={2}>
          🎤 "{interaction.transcription}"
        </Text>
      )}
      

    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  entryType: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  entryTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  details: {
    marginBottom: 8,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
  },
  changesSummary: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 8,
  },
  transcriptionPreview: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 8,
  },

}); 