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

  // Get urgency score for compact display
  const displayScore = getDisplayDangerScore(result);
  const scoreColor = getDangerScoreColor(displayScore);

  return (
    <Animated.View style={[styles.highlightWrapper, { backgroundColor }]}>
      <TouchableOpacity style={styles.container} onPress={() => onPress(result)}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.name}>{result.name}</Text>
            <View style={[styles.urgencyBadge, { backgroundColor: scoreColor }]}>
              <Text style={styles.urgencyText}>{displayScore}</Text>
            </View>
          </View>
          <View style={styles.details}>
            <View style={styles.metaInfo}>
              {(result.similarity_score || result.search_type === 'exact') && (
                <Text style={styles.similarityScore}>
                  {result.search_type === 'exact' ? '🔍 Text Match' : `🧠 ${Math.round(result.similarity_score * 100)}%`}
                </Text>
              )}
              <Text style={styles.lastSeen}>
                {daysAgo} {daysAgo === 1 ? 'day' : 'days'} ago
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
    marginHorizontal: 16,
    marginVertical: 3,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 32,
    alignItems: 'center',
    opacity: 0.85,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastSeen: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  similarityScore: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
  },
}); 
