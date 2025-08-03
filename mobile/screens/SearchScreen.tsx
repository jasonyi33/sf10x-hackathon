import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SearchResult } from '../types';
import { api } from '../services/api';
import SearchResultItem from '../components/SearchResultItem';

// NOTE: This component requires @react-navigation/stack to be installed
// When Tasks 1, 2, 3 are completed, install: npm install @react-navigation/stack react-native-gesture-handler

export default function SearchScreen({ navigation }: { navigation: any }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'urgency' | 'location' | 'name' | 'lastSeen'>('urgency');
  const [filters, setFilters] = useState({
    gender: '',
    ageRange: '',
    heightRange: '',
  });

  // Refresh search results when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (searchQuery.trim()) {
        performSearch();
      }
    }, [searchQuery])
  );

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

  const performSearch = async () => {
    try {
      setIsLoading(true);
      const results = await api.searchIndividuals(searchQuery);
      setSearchResults(results);
      applyFiltersAndSort(results);
    } catch (error) {
      console.error('Error searching individuals:', error);
      Alert.alert('Error', 'Failed to search individuals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = (results: SearchResult[]) => {
    let filtered = [...results];

    // Apply filters
    if (filters.gender) {
      filtered = filtered.filter(result => 
        result.data?.gender?.toLowerCase() === filters.gender.toLowerCase()
      );
    }

    if (filters.ageRange) {
      const [min, max] = filters.ageRange.split('-').map(Number);
      filtered = filtered.filter(result => {
        const age = result.data?.age;
        return age && age >= min && age <= max;
      });
    }

    if (filters.heightRange) {
      const [min, max] = filters.heightRange.split('-').map(Number);
      filtered = filtered.filter(result => {
        const height = result.data?.height;
        return height && height >= min && height <= max;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'urgency':
          return (b.urgency_score || 0) - (a.urgency_score || 0);
        case 'location':
          // Sort by last interaction date (proxy for location relevance)
          return new Date(b.last_interaction_date).getTime() - new Date(a.last_interaction_date).getTime();
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'lastSeen':
          return new Date(b.last_interaction_date).getTime() - new Date(a.last_interaction_date).getTime();
        default:
          return 0;
      }
    });

    setFilteredResults(filtered);
  };

  // Re-apply filters when filters or sort changes
  useEffect(() => {
    if (searchResults.length > 0) {
      applyFiltersAndSort(searchResults);
    }
  }, [filters, sortBy]);

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

  const renderSortButton = (sortType: 'urgency' | 'location' | 'name' | 'lastSeen', label: string) => (
    <TouchableOpacity
      style={[styles.sortButton, sortBy === sortType && styles.sortButtonActive]}
      onPress={() => setSortBy(sortType)}
    >
      <Text style={[styles.sortButtonText, sortBy === sortType && styles.sortButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderFilterButton = (filterType: keyof typeof filters, label: string, options: string[]) => (
    <TouchableOpacity
      style={[styles.filterButton, filters[filterType] && styles.filterButtonActive]}
      onPress={() => {
        Alert.alert(
          `Filter by ${label}`,
          'Select an option:',
          [
            { text: 'Clear', onPress: () => setFilters(prev => ({ ...prev, [filterType]: '' })) },
            ...options.map(option => ({
              text: option,
              onPress: () => setFilters(prev => ({ ...prev, [filterType]: option }))
            }))
          ]
        );
      }}
    >
      <Text style={[styles.filterButtonText, filters[filterType] && styles.filterButtonTextActive]}>
        {filters[filterType] || label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search individuals..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.filterToggleButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons 
              name={showFilters ? "options" : "filter"} 
              size={24} 
              color="#007AFF" 
            />
          </TouchableOpacity>
        </View>

        {/* Sort and Filter Options */}
        {showFilters && (
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.sortSection}>
                <Text style={styles.filterLabel}>Sort by:</Text>
                <View style={styles.sortButtons}>
                  {renderSortButton('urgency', 'Urgency')}
                  {renderSortButton('location', 'Location')}
                  {renderSortButton('name', 'Name')}
                  {renderSortButton('lastSeen', 'Last Seen')}
                </View>
              </View>
              
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Filter by:</Text>
                <View style={styles.filterButtons}>
                  {renderFilterButton('gender', 'Gender', ['Male', 'Female', 'Other', 'Unknown'])}
                  {renderFilterButton('ageRange', 'Age', ['18-30', '31-50', '51-70', '70+'])}
                  {renderFilterButton('heightRange', 'Height', ['Under 5\'6"', '5\'6"-6\'', 'Over 6\''])}
                </View>
              </View>
            </ScrollView>
          </View>
        )}
      </View>

      {/* Search Results */}
      {searchQuery.trim() ? (
        <View style={styles.resultsContainer}>
          {renderSectionHeader(`Search Results (${filteredResults.length})`)}
          {isLoading ? (
            <ActivityIndicator style={styles.loader} size="large" color="#007AFF" />
          ) : filteredResults.length > 0 ? (
            <FlatList
              data={filteredResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.noResults}>
              {searchResults.length > 0 ? 'No results match your filters' : 'No individuals found'}
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.resultsContainer}>
          <Text style={styles.noResults}>Enter a search term to find individuals</Text>
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
  },
  filterToggleButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  filterContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sortSection: {
    marginRight: 20,
  },
  filterSection: {
    marginRight: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#fff',
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