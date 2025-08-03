import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { IndividualProfile, Interaction } from '../types';
import InteractionHistoryItem from './InteractionHistoryItem';
import InteractionDetailModal from './InteractionDetailModal';
import UrgencyScoreTimeline from './UrgencyScoreTimeline';

interface PreviousInteractionsTabProps {
  route: {
    params: {
      profile: IndividualProfile;
    };
  };
}

export default function PreviousInteractionsTab({ route }: PreviousInteractionsTabProps) {
  const { profile } = route.params;
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleInteractionPress = (interaction: Interaction) => {
    setSelectedInteraction(interaction);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedInteraction(null);
  };

  const renderInteractionItem = ({ item }: { item: Interaction }) => (
    <InteractionHistoryItem
      interaction={item}
      onPress={() => handleInteractionPress(item)}
    />
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLocationDisplay = (interaction: Interaction) => {
    if (!interaction.location) return 'No location recorded';
    
    const { latitude, longitude, address } = interaction.location;
    if (address) return address;
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  };

  const getChangesSummary = (interaction: Interaction) => {
    if (!interaction.changes || Object.keys(interaction.changes).length === 0) {
      return 'No data changes';
    }
    
    const changes = Object.entries(interaction.changes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    return changes;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Urgency Score Timeline */}
      <UrgencyScoreTimeline 
        interactions={profile.interactions}
        currentUrgencyScore={profile.urgency_override || profile.urgency_score}
      />
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Previous Interactions</Text>
          <Text style={styles.interactionCount}>
            {profile.total_interactions} interaction{profile.total_interactions !== 1 ? 's' : ''}
          </Text>
        </View>
        
        {profile.interactions.length > 0 ? (
          <FlatList
            data={profile.interactions}
            renderItem={renderInteractionItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.interactionsList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No interactions recorded</Text>
            <Text style={styles.emptyStateSubtext}>
              Interactions will appear here when you record new encounters with this individual.
            </Text>
          </View>
        )}
      </View>

      {/* Interaction Detail Modal */}
      <InteractionDetailModal
        visible={modalVisible}
        interaction={selectedInteraction}
        onClose={handleCloseModal}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  interactionCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  interactionsList: {
    paddingHorizontal: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 