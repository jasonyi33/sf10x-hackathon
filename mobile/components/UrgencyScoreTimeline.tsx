import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Interaction } from '../types';

interface UrgencyScoreTimelineProps {
  interactions: Interaction[];
  currentUrgencyScore: number;
}

export default function UrgencyScoreTimeline({ interactions, currentUrgencyScore }: UrgencyScoreTimelineProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUrgencyScoreColor = (score: number) => {
    if (score >= 80) return '#DC2626'; // Red
    if (score >= 60) return '#F59E0B'; // Orange
    if (score >= 40) return '#FBBF24'; // Yellow
    return '#10B981'; // Green
  };

  const getUrgencyScoreLabel = (score: number) => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  };

  // Create timeline data with urgency scores
  const timelineData = interactions.map((interaction, index) => {
    // For now, we'll use a mock urgency score based on interaction data
    // In a real implementation, this would come from the backend
    const mockUrgencyScore = Math.floor(Math.random() * 100);
    
    return {
      id: interaction.id,
      date: interaction.created_at,
      urgencyScore: mockUrgencyScore,
      interaction,
    };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (timelineData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Urgency Score Timeline</Text>
        <Text style={styles.emptyText}>No interactions recorded yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Urgency Score Timeline</Text>
      
      {/* Current Score */}
      <View style={styles.currentScoreContainer}>
        <Text style={styles.currentScoreLabel}>Current Score:</Text>
        <View style={styles.scoreDisplay}>
          <Text style={[styles.scoreValue, { color: getUrgencyScoreColor(currentUrgencyScore) }]}>
            {currentUrgencyScore}
          </Text>
          <Text style={[styles.scoreLabel, { color: getUrgencyScoreColor(currentUrgencyScore) }]}>
            {getUrgencyScoreLabel(currentUrgencyScore)}
          </Text>
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.timeline}>
        {timelineData.map((item, index) => (
          <View key={item.id} style={styles.timelineItem}>
            <View style={styles.timelineDot}>
              <View 
                style={[
                  styles.dot, 
                  { backgroundColor: getUrgencyScoreColor(item.urgencyScore) }
                ]} 
              />
            </View>
            
            <View style={styles.timelineContent}>
              <View style={styles.timelineHeader}>
                <Text style={styles.timelineDate}>{formatDate(item.date)}</Text>
                <View style={styles.scoreBadge}>
                  <Text style={[styles.scoreBadgeText, { color: getUrgencyScoreColor(item.urgencyScore) }]}>
                    {item.urgencyScore}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.timelineDescription}>
                {item.interaction.transcription 
                  ? `Voice entry: "${item.interaction.transcription.substring(0, 50)}..."`
                  : 'Manual entry'
                }
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  currentScoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  currentScoreLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  scoreDisplay: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  timeline: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineDot: {
    width: 20,
    alignItems: 'center',
    marginRight: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  scoreBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timelineDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
}); 