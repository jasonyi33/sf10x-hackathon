import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SearchResult } from '../types';
import { getDangerScoreColor, getDisplayDangerScore, calculateDaysAgo } from '../utils/dangerScore';
import DangerScore from './DangerScore';

interface SearchResultItemProps {
  result: SearchResult;
  onPress: (result: SearchResult) => void;
}

export default function SearchResultItem({ result, onPress }: SearchResultItemProps) {
  const daysAgo = calculateDaysAgo(result.last_interaction_date);

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(result)}>
      <View style={styles.content}>
        <Text style={styles.name}>{result.name}</Text>
        <View style={styles.details}>
          <DangerScore
            individual={result}
            onOverrideChange={() => {}} // No override in search results
            showSlider={false}
          />
          <View style={styles.rightDetails}>
            {result.similarity_score && (
              <Text style={styles.similarityScore}>
                {result.search_type === 'exact' ? '🔍 Exact Match' : `🧠 Match: ${Math.round(result.similarity_score * 100)}%`}
              </Text>
            )}
            <Text style={styles.lastSeen}>
              Last seen: {daysAgo} {daysAgo === 1 ? 'day' : 'days'} ago
            </Text>
          </View>
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
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
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
  rightDetails: {
    alignItems: 'flex-end',
  },
  similarityScore: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
}); 