import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SearchResult } from '../types';
import { api } from '../services/api';
import SearchDropdownItem from '../components/SearchDropdownItem';
import FilterSection, { FilterState } from '../components/FilterSection';
import SortDropdown, { SortOption, SortOrder } from '../components/SortDropdown';

export default function SearchScreen({ navigation }: { navigation: any }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    gender: [],
    ageMin: -1,
    ageMax: -1,
    heightMin: 0,
    heightMax: 0,
    dangerMin: 0,
    dangerMax: 100,
    hasPhoto: 'any',
  });
  const [currentSort, setCurrentSort] = useState<SortOption>('danger_score');
  const [currentOrder, setCurrentOrder] = useState<SortOrder>('desc');

  // Search as user types (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const performSearch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const results = await api.searchIndividuals(searchQuery);
      // Limit to 10 results for dropdown
      const limitedResults = results.slice(0, 10);
      setSearchResults(limitedResults);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error searching individuals:', error);
      setError('Failed to search. Please try again.');
      setShowDropdown(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultPress = (result: SearchResult) => {
    // Dismiss dropdown and navigate
    setShowDropdown(false);
    navigation.navigate('IndividualProfile', { individualId: result.id });
  };

  const dismissDropdown = () => {
    setShowDropdown(false);
    Keyboard.dismiss();
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    // TODO: Update search with filters when backend is ready
  };

  const handleClearAllFilters = () => {
    setFilters({
      gender: [],
      ageMin: -1,
      ageMax: -1,
      heightMin: 0,
      heightMax: 0,
      dangerMin: 0,
      dangerMax: 100,
      hasPhoto: 'any',
    });
  };

  const handleSortChange = (sort: SortOption, order: SortOrder) => {
    setCurrentSort(sort);
    setCurrentOrder(order);
    // TODO: Apply sort to search results when backend is ready
  };

  const renderDropdownItem = ({ item }: { item: SearchResult }) => (
    <SearchDropdownItem
      id={item.id}
      name={item.name}
      age={item.data?.approximate_age || null}
      height={item.data?.height || null}
      skinColor={item.data?.skin_color || null}
      onPress={() => handleResultPress(item)}
    />
  );

  const renderDropdownContent = () => {
    if (isLoading) {
      return (
        <View style={styles.dropdownContent} testID="dropdown-loading">
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.dropdownContent} testID="dropdown-error">
          <Text style={styles.errorText} testID="dropdown-error-text">
            {error}
          </Text>
        </View>
      );
    }

    if (searchResults.length === 0) {
      return (
        <View style={styles.dropdownContent} testID="dropdown-empty">
          <Text style={styles.emptyText} testID="dropdown-empty-text">
            No individuals found
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={searchResults}
        renderItem={renderDropdownItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.dropdownList}
      />
    );
  };

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

      {/* Filter Section */}
      <FilterSection
        onFiltersChange={handleFiltersChange}
        onClearAll={handleClearAllFilters}
        initialFilters={filters}
      />

      {/* Sort Dropdown */}
      <SortDropdown
        onSortChange={handleSortChange}
        currentSort={currentSort}
        currentOrder={currentOrder}
      />

      {/* Dropdown Overlay */}
      {showDropdown && searchQuery.trim() && (
        <>
          {/* Invisible overlay to capture outside taps */}
          <TouchableWithoutFeedback onPress={dismissDropdown}>
            <View style={styles.overlay} testID="dropdown-overlay" />
          </TouchableWithoutFeedback>

          {/* Dropdown Container */}
          <View style={styles.dropdownContainer} testID="search-dropdown">
            {renderDropdownContent()}
          </View>
        </>
      )}

      {/* Main Content */}
      <View style={styles.mainContent}>
        <Text style={styles.instructionText}>
          Start typing to search for individuals
        </Text>
      </View>
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
    zIndex: 1,
  },
  searchInput: {
    height: 44,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 180, // Below search bar, filter section, and sort dropdown
    left: 16,
    right: 16,
    maxHeight: 400,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 3,
  },
  dropdownContent: {
    padding: 20,
    alignItems: 'center',
  },
  dropdownList: {
    maxHeight: 400,
  },
  loadingText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});