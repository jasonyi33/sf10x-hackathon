import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SearchResult } from '../types';
import { getDangerScoreColor, getDisplayDangerScore, calculateDaysAgo } from '../utils/dangerScore';
import DangerScore from './DangerScore';

interface SearchResultItemProps {
  result: SearchResult;
  onPress: (result: SearchResult) => void;
  highlight?: boolean;
}

export default function SearchResultItem({ result, onPress, highlight }: SearchResultItemProps) {
  const daysAgo = calculateDaysAgo(result.last_interaction_date);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (highlight) {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
      }).start();
    }
  }, [highlight]);

  const backgroundColor = highlight
    ? anim.interpolate({ inputRange: [0, 1], outputRange: ['#FEF3C7', '#FFFFFF'] })
    : '#FFFFFF';

  return (
    <Animated.View style={[styles.highlightWrapper, { backgroundColor }]}>
      <TouchableOpacity style={styles.container} onPress={() => onPress(result)}>
        <View style={styles.content}>
          <Text style={styles.name}>{result.name}</Text>
          <View style={styles.details}>
            <DangerScore
              individual={result}
              onOverrideChange={() => {}} // No override in search results
              showSlider={false}
              compact={true}
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  highlightWrapper: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastSeen: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  rightDetails: {
    alignItems: 'flex-end',
  },
  similarityScore: {
    fontSize: 12,
    color: '#8B5CF6',
    marginBottom: 2,
    fontWeight: '600',
  },
}); 
