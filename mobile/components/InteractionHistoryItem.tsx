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
          {interaction.worker_name || 'Unknown Worker'}
        </Text>
        <Text style={styles.address}>
          {interaction.abbreviated_address || 'Location not specified'}
        </Text>
      </View>
      
      {/* Show transcription preview if available */}
      {interaction.transcription && (
        <Text style={styles.transcriptionPreview} numberOfLines={2}>
          "{interaction.transcription}"
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
  address: {
    fontSize: 14,
    color: '#6B7280',
  },
  transcriptionPreview: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    lineHeight: 18,
  },
}); 