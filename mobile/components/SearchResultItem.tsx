import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SearchResult } from '../types';
import { getUrgencyScoreColor, getDisplayUrgencyScore, calculateDaysAgo } from '../utils/urgencyScore';
import UrgencyScore from './UrgencyScore';

interface SearchResultItemProps {
  result: SearchResult;
  onPress: (result: SearchResult) => void;
}

export default function SearchResultItem({ result, onPress }: SearchResultItemProps) {
  const daysAgo = calculateDaysAgo(result.last_interaction_date);

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(result)}>
      <View style={styles.content}>
        <View style={styles.header}>
          {result.photo_url && (
            <Image source={{ uri: result.photo_url }} style={styles.photo} />
          )}
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{result.name}</Text>
            <Text style={styles.lastSeen}>
              Last seen: {daysAgo} {daysAgo === 1 ? 'day' : 'days'} ago
            </Text>
            {result.data?.last_location?.address && (
              <Text style={styles.location}>
                📍 {result.data.last_location.address}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.details}>
          <UrgencyScore
            individual={result}
            onOverrideChange={() => {}} // No override in search results
            showSlider={false}
          />
        </View>
      </View>
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
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  photo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastSeen: {
    fontSize: 14,
    color: '#6B7280',
  },
  location: {
    fontSize: 12,
    color: '#059669',
    marginTop: 2,
  },
}); 