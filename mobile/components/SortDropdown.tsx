import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export type SortOption = 'danger_score' | 'last_seen' | 'name' | 'distance';
export type SortOrder = 'asc' | 'desc';

interface SortDropdownProps {
  onSortChange: (sort: SortOption, order: SortOrder) => void;
  currentSort: SortOption;
  currentOrder: SortOrder;
}

const SORT_OPTIONS: Array<{
  value: SortOption;
  label: string;
  defaultOrder: SortOrder;
}> = [
  { value: 'danger_score', label: 'Danger Score', defaultOrder: 'desc' },
  { value: 'last_seen', label: 'Last Seen', defaultOrder: 'desc' },
  { value: 'name', label: 'Name A-Z', defaultOrder: 'asc' },
  { value: 'distance', label: 'Distance', defaultOrder: 'asc' },
];

export default function SortDropdown({
  onSortChange,
  currentSort,
  currentOrder,
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // Check location permission on mount
  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setHasLocationPermission(status === 'granted');
    } catch (error) {
      console.error('Error checking location permission:', error);
      setHasLocationPermission(false);
    }
  };

  const getCurrentLabel = () => {
    const option = SORT_OPTIONS.find(opt => opt.value === currentSort);
    return option?.label || 'Sort';
  };

  const handleOptionPress = (option: SortOption) => {
    if (option === 'distance' && !hasLocationPermission) {
      // Don't allow selection if no location permission
      return;
    }

    let newOrder: SortOrder;
    
    if (option === currentSort) {
      // Toggle order if selecting the same option
      newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
    } else {
      // Use default order for new option
      const sortConfig = SORT_OPTIONS.find(opt => opt.value === option);
      newOrder = sortConfig?.defaultOrder || 'desc';
    }

    onSortChange(option, newOrder);
    setIsOpen(false);
  };

  const getArrowIcon = () => {
    return currentOrder === 'asc' ? 'arrow-up' : 'arrow-down';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setIsOpen(true)}
        testID="sort-dropdown-trigger"
      >
        <Text style={styles.triggerText}>{getCurrentLabel()}</Text>
        <Ionicons
          name={getArrowIcon()}
          size={16}
          color="#374151"
          testID="sort-direction-indicator"
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setIsOpen(false)}
          testID="sort-dropdown-overlay"
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdown} testID="sort-dropdown-menu">
                {SORT_OPTIONS.map((option) => {
                  const isDisabled = option.value === 'distance' && !hasLocationPermission;
                  const isSelected = option.value === currentSort;

                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.option,
                        isDisabled && styles.optionDisabled,
                        isSelected && styles.optionSelected,
                      ]}
                      onPress={() => handleOptionPress(option.value)}
                      disabled={isDisabled}
                      testID={`sort-option-${option.value}`}
                      accessibilityState={{ disabled: isDisabled }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isDisabled && styles.optionTextDisabled,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {option.label}
                        {isDisabled && ' (Location required)'}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color="#3B82F6"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  triggerText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    paddingTop: 200, // Position below header and filters
  },
  dropdown: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  optionDisabled: {
    backgroundColor: '#F9FAFB',
  },
  optionSelected: {
    backgroundColor: '#EBF5FF',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
  },
  optionTextDisabled: {
    color: '#9CA3AF',
  },
  optionTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});