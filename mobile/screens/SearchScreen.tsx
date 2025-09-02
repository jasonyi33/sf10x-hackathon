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
import { useFocusEffect } from '@react-navigation/native';
import { SearchResult } from '../types';
import { api } from '../services/api';
import SearchResultItem from '../components/SearchResultItem';
import { supabase } from '../services/supabase';

// NOTE: This component requires @react-navigation/stack to be installed
// When Tasks 1, 2, 3 are completed, install: npm install @react-navigation/stack react-native-gesture-handler

export default function SearchScreen({ navigation }: { navigation: any }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [allIndividuals, setAllIndividuals] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAllIndividuals = async () => {
    try{
      setIsLoading(true);
      console.log('🔄 Loading all individuals...');
      
      const results = await api.searchIndividuals('');
      console.log('✅ Loaded all individuals:', results);
      setAllIndividuals(results);
      setSearchResults(results); // Also set search results to show all individuals initially
    }
    catch (error) {
      console.error('Error loading all individuals:', error);
      Alert.alert('Error', 'Failed to load all individuals. Please try again.');
    }
    finally{
      setIsLoading(false);
    }
  };

  // Load all individuals when component mounts
  useEffect(() => {
    loadAllIndividuals();
  }, []);

  // Refresh search results when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else{
        setSearchResults(allIndividuals);
      }
    }, [searchQuery, allIndividuals])
  );

    // Search as user types (with debounce)
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        if (searchQuery.trim()) {
          performSearch();
        } else{
          setSearchResults(allIndividuals);
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    },[searchQuery, allIndividuals]);

  const performSearch = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Performing search for:', searchQuery);
      
      // Try semantic search first, fall back to regular search if it fails
      let results;
      try {
        console.log('🧠 Attempting semantic search...');
        results = await api.semanticSearchIndividuals(searchQuery);
        console.log('✅ Semantic search successful:', results);
      } catch (semanticError) {
        console.log('⚠️ Semantic search failed, using regular search:', semanticError);
        results = await api.searchIndividuals(searchQuery);
        console.log('✅ Regular search successful:', results);
      }
      
      console.log('✅ Final search results:', results);
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
    navigation.navigate('IndividualProfile', { individualId: result.id });
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
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
          placeholder="Search individuals..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Search Results */}
      {isLoading ? (
        <View style={styles.resultsContainer}>
          <ActivityIndicator style={styles.loader} size="large" color="#007AFF" />
        </View>
      ) : searchResults.length > 0 ? (
        <View style={styles.resultsContainer}>
          {searchQuery.trim() ? (
            renderSectionHeader('Search Results')
          ) : (
            renderSectionHeader('All Individuals')
          )}
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        </View>
      ) : (
        <View style={styles.resultsContainer}>
          <Text style={styles.noResults}>
            {searchQuery.trim() ? 'No individuals found' : 'No individuals available'}
          </Text>
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