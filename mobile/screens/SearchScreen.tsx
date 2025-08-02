import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SearchResult } from '../types';
import { searchIndividuals, getRecentIndividuals } from '../services/api';
import SearchResultItem from '../components/SearchResultItem';

// NOTE: This component requires @react-navigation/stack to be installed
// When Tasks 1, 2, 3 are completed, install: npm install @react-navigation/stack react-native-gesture-handler

export default function SearchScreen({ navigation }: { navigation: any }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentIndividuals, setRecentIndividuals] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);

  // Load recent individuals on component mount
  useEffect(() => {
    loadRecentIndividuals();
  }, []);

  // Search as user types (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadRecentIndividuals = async () => {
    try {
      setIsLoadingRecent(true);
      const recent = await getRecentIndividuals();
      setRecentIndividuals(recent);
    } catch (error) {
      console.error('Error loading recent individuals:', error);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const performSearch = async () => {
    try {
      setIsLoading(true);
      const results = await searchIndividuals(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching individuals:', error);
      Alert.alert('Error', 'Failed to search individuals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultPress = (result: SearchResult) => {
    // Navigate to IndividualProfileScreen with the individual's data
    // Note: This will work with the current tab navigation structure
    // When Tasks 1, 2, 3 are completed, this will use proper stack navigation
    Alert.alert(
      'Individual Profile',
      `Name: ${result.name}\nDanger Score: ${result.danger_score}\nLast Seen: ${result.last_seen_days} days ago\n\nIndividual Profile Screen is available but navigation requires Tasks 1, 2, 3 completion for full stack navigation.`,
      [
        { text: 'OK', style: 'default' }
      ]
    );
    
    // TODO: When Tasks 1, 2, 3 are completed, uncomment this navigation:
    // navigation.navigate('IndividualProfile', { individualId: result.id });
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <SearchResultItem result={item} onPress={handleResultPress} />
  );

  const renderRecentItem = ({ item }: { item: SearchResult }) => (
    <SearchResultItem result={item} onPress={handleResultPress} />
  );

  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Search Results */}
      {searchQuery.trim() ? (
        <View style={styles.resultsContainer}>
          {renderSectionHeader('Search Results')}
          {isLoading ? (
            <ActivityIndicator style={styles.loader} size="large" color="#007AFF" />
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.noResults}>No individuals found</Text>
          )}
        </View>
      ) : (
        /* Recent Individuals */
        <View style={styles.resultsContainer}>
          {renderSectionHeader('Recent Individuals')}
          {isLoadingRecent ? (
            <ActivityIndicator style={styles.loader} size="large" color="#007AFF" />
          ) : recentIndividuals.length > 0 ? (
            <FlatList
              data={recentIndividuals}
              renderItem={renderRecentItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.noResults}>No recent individuals</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    height: 44,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
  },
  resultsContainer: {
    flex: 1,
  },
  sectionHeader: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  loader: {
    padding: 20,
  },
  noResults: {
    padding: 20,
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 16,
  },
}); 