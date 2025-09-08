import React, { useState, useEffect, useRef } from 'react';
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

export default function SearchScreen({ navigation, route }: { navigation: any, route: any }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [allIndividuals, setAllIndividuals] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSemanticResults, setIsLoadingSemanticResults] = useState(false);
  const listRef = useRef<FlatList<SearchResult>>(null);
  const [scrollTargetId, setScrollTargetId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const clearHighlightTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Reload when a refreshKey param changes (e.g., after delete/undo)
  useEffect(() => {
    if (route?.params?.refreshKey) {
      loadAllIndividuals();
    }
  }, [route?.params?.refreshKey]);

  // If a restoredId is provided, attempt to scroll to it after data loads
  useEffect(() => {
    if (route?.params?.restoredId) {
      setScrollTargetId(route.params.restoredId);
      setHighlightedId(route.params.restoredId);
      if (clearHighlightTimeout.current) {
        clearTimeout(clearHighlightTimeout.current);
      }
      clearHighlightTimeout.current = setTimeout(() => {
        setHighlightedId(null);
      }, 2500);
    }
  }, [route?.params?.restoredId]);

  // Perform the scroll when we have results and a target id
  useEffect(() => {
    if (!scrollTargetId || searchResults.length === 0) return;
    const index = searchResults.findIndex(item => item.id === scrollTargetId);
    if (index >= 0) {
      setTimeout(() => {
        try {
          listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.2 });
        } catch (e) {
          // ignore scroll errors
        }
      }, 150);
    }
    setScrollTargetId(null);
  }, [scrollTargetId, searchResults]);

  // Reload individuals whenever screen gains focus (ensures deletions reflect)
  useFocusEffect(
    React.useCallback(() => {
      loadAllIndividuals();
    }, [])
  );

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
      console.log('🔍 Performing hybrid search for:', searchQuery);
      
      // Phase 1: Get instant text-based results
      console.log('⚡ Getting instant text matches...');
      const textResults = await api.searchIndividuals(searchQuery);
      console.log('✅ Text search results:', textResults);
      
      // Show instant text results immediately
      setSearchResults(textResults);
      setIsLoading(false); // Stop main loading indicator
      
      // Phase 2: Get semantic results in background (if text search had results or not)
      setIsLoadingSemanticResults(true);
      try {
        console.log('🧠 Getting semantic matches in background...');
        const semanticResults = await api.semanticSearchIndividuals(searchQuery);
        console.log('✅ Semantic search results:', semanticResults);
        
        // Merge results, avoiding duplicates
        const mergedResults = mergeSearchResults(textResults, semanticResults);
        console.log('✅ Merged results:', mergedResults);
        setSearchResults(mergedResults);
        
      } catch (semanticError) {
        console.log('⚠️ Semantic search failed, keeping text results:', semanticError);
        // Keep the text results that are already showing
      }
      
    } catch (error) {
      console.error('Error performing search:', error);
      Alert.alert('Error', 'Failed to search individuals. Please try again.');
    } finally {
      setIsLoading(false);
      setIsLoadingSemanticResults(false);
    }
  };

  // Helper function to merge search results and remove duplicates
  const mergeSearchResults = (textResults: SearchResult[], semanticResults: SearchResult[]): SearchResult[] => {
    const textIds = new Set(textResults.map(result => result.id));
    
    // Add semantic results that aren't already in text results
    const uniqueSemanticResults = semanticResults.filter(result => !textIds.has(result.id));
    
    // Combine: text results first (marked as exact), then semantic results
    const textResultsMarked = textResults.map(result => ({ 
      ...result, 
      search_type: 'exact' as const 
    }));
    
    const semanticResultsMarked = uniqueSemanticResults.map(result => ({ 
      ...result, 
      search_type: 'semantic' as const 
    }));
    
    return [...textResultsMarked, ...semanticResultsMarked];
  };

  const handleResultPress = (result: SearchResult) => {
    // Navigate to IndividualProfileScreen with the individual's data
    navigation.navigate('IndividualProfile', { individualId: result.id });
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <SearchResultItem result={item} onPress={handleResultPress} highlight={highlightedId === item.id} />
  );



  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderContent}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {isLoadingSemanticResults && (
          <View style={styles.semanticLoadingIndicator}>
            <ActivityIndicator size="small" color="#6366F1" />
            <Text style={styles.semanticLoadingText}>Finding more...</Text>
          </View>
        )}
      </View>
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
            ref={listRef}
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
    backgroundColor: '#F8FAFC',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    height: 46,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultsContainer: {
    flex: 1,
    paddingTop: 12,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: -0.2,
  },
  semanticLoadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  semanticLoadingText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
    marginLeft: 6,
  },
  loader: {
    padding: 24,
  },
  noResults: {
    padding: 32,
    textAlign: 'center',
    color: '#64748B',
    fontSize: 15,
    fontWeight: '500',
  },
}); 
