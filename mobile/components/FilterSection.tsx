import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';

export interface FilterState {
  gender: string[];
  ageMin: number;
  ageMax: number;
  heightMin: number;
  heightMax: number;
  dangerMin: number;
  dangerMax: number;
  hasPhoto: 'any' | 'yes' | 'no';
}

interface FilterSectionProps {
  onFiltersChange: (filters: FilterState) => void;
  onClearAll: () => void;
  initialFilters?: Partial<FilterState>;
}

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Unknown'];

export default function FilterSection({ 
  onFiltersChange, 
  onClearAll,
  initialFilters 
}: FilterSectionProps) {
  // State
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    gender: initialFilters?.gender || [],
    ageMin: initialFilters?.ageMin || -1,
    ageMax: initialFilters?.ageMax || -1,
    heightMin: initialFilters?.heightMin || 0,
    heightMax: initialFilters?.heightMax || 0,
    dangerMin: initialFilters?.dangerMin || 0,
    dangerMax: initialFilters?.dangerMax || 100,
    hasPhoto: initialFilters?.hasPhoto || 'any',
  });

  // Animation
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  // Calculate active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.gender.length > 0) count += filters.gender.length;
    if (filters.ageMin > -1 || filters.ageMax > -1) count++;
    if (filters.heightMin > 0 || filters.heightMax > 0) count++;
    if (filters.dangerMin > 0 || filters.dangerMax < 100) count++;
    if (filters.hasPhoto !== 'any') count++;
    return count;
  };

  // Update parent when filters change
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters]);

  // Toggle expansion
  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    
    Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(rotateAnimation, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    setIsExpanded(!isExpanded);
  };

  // Filter update functions
  const toggleGender = (gender: string) => {
    setFilters(prev => ({
      ...prev,
      gender: prev.gender.includes(gender)
        ? prev.gender.filter(g => g !== gender)
        : [...prev.gender, gender]
    }));
  };

  const updateAgeRange = (min: number, max: number) => {
    setFilters(prev => ({ ...prev, ageMin: min, ageMax: max }));
  };

  const updateHeightRange = (min: number, max: number) => {
    setFilters(prev => ({ ...prev, heightMin: min, heightMax: max }));
  };

  const updateDangerRange = (min: number, max: number) => {
    setFilters(prev => ({ ...prev, dangerMin: min, dangerMax: max }));
  };

  const updateHasPhoto = (value: 'any' | 'yes' | 'no') => {
    setFilters(prev => ({ ...prev, hasPhoto: value }));
  };

  const removeFilter = (type: string, value?: string) => {
    switch (type) {
      case 'gender':
        if (value) {
          toggleGender(value);
        }
        break;
      case 'age':
        updateAgeRange(-1, -1);
        break;
      case 'height':
        updateHeightRange(0, 0);
        break;
      case 'danger':
        updateDangerRange(0, 100);
        break;
      case 'photo':
        updateHasPhoto('any');
        break;
    }
  };

  const clearAllFilters = () => {
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
    onClearAll();
  };

  // Render helpers
  const renderCheckbox = (label: string, checked: boolean, onPress: () => void, testID: string) => (
    <TouchableOpacity
      style={styles.checkboxContainer}
      onPress={onPress}
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={16} color="#fff" />}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const renderRadioButton = (label: string, selected: boolean, onPress: () => void, testID: string) => (
    <TouchableOpacity
      style={styles.radioContainer}
      onPress={onPress}
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const renderFilterTag = (label: string, onRemove: () => void, testID: string) => (
    <View style={styles.filterTag} testID={testID}>
      <Text style={styles.filterTagText}>{label}</Text>
      <TouchableOpacity
        onPress={onRemove}
        testID={`${testID.replace('filter-tag-', 'filter-tag-remove-')}`}
        style={styles.filterTagRemove}
      >
        <Ionicons name="close-circle" size={16} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );

  const activeFilterCount = getActiveFilterCount();

  const rotate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const maxHeight = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 600],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpanded}
        testID={isExpanded ? 'filter-header-expanded' : 'filter-header-collapsed'}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="filter" size={20} color="#374151" />
          <Text style={styles.headerTitle}>Filters</Text>
          {!isExpanded && activeFilterCount > 0 && (
            <View style={styles.badge} testID="filter-count-badge">
              <Text style={styles.badgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={24} color="#374151" />
        </Animated.View>
      </TouchableOpacity>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <View style={styles.tagsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.gender.map(gender => 
              renderFilterTag(gender, () => toggleGender(gender), `filter-tag-gender-${gender}`)
            )}
            {(filters.ageMin > -1 || filters.ageMax > -1) && 
              renderFilterTag(
                `Age: ${filters.ageMin > -1 ? filters.ageMin : 'Any'}-${filters.ageMax > -1 ? filters.ageMax : 'Any'}`,
                () => updateAgeRange(-1, -1),
                'filter-tag-age'
              )
            }
            {(filters.heightMin > 0 || filters.heightMax > 0) && 
              renderFilterTag(
                `Height: ${filters.heightMin || 'Any'}${filters.heightMax ? `-${filters.heightMax}` : '+'}\"`,
                () => updateHeightRange(0, 0),
                'filter-tag-height'
              )
            }
            {(filters.dangerMin > 0 || filters.dangerMax < 100) && 
              renderFilterTag(
                `Danger: ${filters.dangerMin}-${filters.dangerMax}`,
                () => updateDangerRange(0, 100),
                'filter-tag-danger'
              )
            }
            {filters.hasPhoto !== 'any' && 
              renderFilterTag(
                `Photo: ${filters.hasPhoto}`,
                () => updateHasPhoto('any'),
                'filter-tag-photo'
              )
            }
          </ScrollView>
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={clearAllFilters}
            testID="clear-all-button"
          >
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Expandable Content */}
      <Animated.View style={[styles.content, { maxHeight }]}>
        <ScrollView
          style={styles.scrollContent}
          testID="filter-content-expanded"
          showsVerticalScrollIndicator={false}
        >
          {/* Gender Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Gender</Text>
            <View style={styles.checkboxGroup}>
              {GENDER_OPTIONS.map(gender => (
                <View key={gender} style={styles.checkboxWrapper}>
                  {renderCheckbox(
                    gender,
                    filters.gender.includes(gender),
                    () => toggleGender(gender),
                    `gender-checkbox-${gender}`
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Age Range Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Age Range</Text>
            <View style={styles.rangeContainer}>
              <View style={styles.sliderRow}>
                <Text style={styles.rangeLabel}>Min:</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={-1}
                  maximumValue={100}
                  step={1}
                  value={filters.ageMin}
                  onValueChange={(value) => updateAgeRange(value, filters.ageMax)}
                  testID="age-slider-min"
                />
                <Text style={styles.rangeValue} testID="age-value-min">
                  {filters.ageMin === -1 ? 'Any' : filters.ageMin}
                </Text>
              </View>
              <View style={styles.sliderRow}>
                <Text style={styles.rangeLabel}>Max:</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={-1}
                  maximumValue={100}
                  step={1}
                  value={filters.ageMax}
                  onValueChange={(value) => updateAgeRange(filters.ageMin, value)}
                  testID="age-slider-max"
                />
                <Text style={styles.rangeValue} testID="age-value-max">
                  {filters.ageMax === -1 ? 'Any' : filters.ageMax}
                </Text>
              </View>
            </View>
          </View>

          {/* Height Range Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Height Range</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.numberInput}
                placeholder="Min"
                keyboardType="numeric"
                value={filters.heightMin > 0 ? filters.heightMin.toString() : ''}
                onChangeText={(text) => updateHeightRange(parseInt(text) || 0, filters.heightMax)}
                testID="height-input-min"
              />
              <Text style={styles.rangeSeparator}>to</Text>
              <TextInput
                style={styles.numberInput}
                placeholder="Max"
                keyboardType="numeric"
                value={filters.heightMax > 0 ? filters.heightMax.toString() : ''}
                onChangeText={(text) => updateHeightRange(filters.heightMin, parseInt(text) || 0)}
                testID="height-input-max"
              />
              <Text style={styles.unitLabel}>inches</Text>
            </View>
          </View>

          {/* Danger Score Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Danger Score</Text>
            <View style={styles.rangeContainer}>
              <View style={styles.sliderRow}>
                <Text style={styles.rangeLabel}>Min:</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  step={5}
                  value={filters.dangerMin}
                  onValueChange={(value) => updateDangerRange(value, filters.dangerMax)}
                  testID="danger-slider-min"
                />
                <Text style={styles.rangeValue}>{filters.dangerMin}</Text>
              </View>
              <View style={styles.sliderRow}>
                <Text style={styles.rangeLabel}>Max:</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  step={5}
                  value={filters.dangerMax}
                  onValueChange={(value) => updateDangerRange(filters.dangerMin, value)}
                  testID="danger-slider-max"
                />
                <Text style={styles.rangeValue}>{filters.dangerMax}</Text>
              </View>
            </View>
          </View>

          {/* Has Photo Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Has Photo</Text>
            <View style={styles.radioGroup}>
              {renderRadioButton('Any', filters.hasPhoto === 'any', () => updateHasPhoto('any'), 'photo-option-any')}
              {renderRadioButton('Yes', filters.hasPhoto === 'yes', () => updateHasPhoto('yes'), 'photo-option-yes')}
              {renderRadioButton('No', filters.hasPhoto === 'no', () => updateHasPhoto('no'), 'photo-option-no')}
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  badge: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0,
    gap: 8,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 4,
    paddingLeft: 12,
    paddingRight: 4,
    marginRight: 8,
  },
  filterTagText: {
    fontSize: 14,
    color: '#374151',
    marginRight: 4,
  },
  filterTagRemove: {
    padding: 2,
  },
  clearAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  clearAllText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  filterGroup: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  checkboxGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  checkboxWrapper: {
    width: '48%',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#374151',
  },
  rangeContainer: {
    gap: 16,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rangeLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 40,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  rangeValue: {
    fontSize: 14,
    color: '#111827',
    width: 40,
    textAlign: 'right',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    width: 80,
  },
  rangeSeparator: {
    fontSize: 14,
    color: '#6B7280',
  },
  unitLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 24,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#3B82F6',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  radioLabel: {
    fontSize: 15,
    color: '#374151',
  },
});