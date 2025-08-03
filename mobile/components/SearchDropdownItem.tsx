import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatAge } from '../utils/ageUtils';

interface SearchDropdownItemProps {
  id: string;
  name: string;
  age: [number, number] | null;
  height: number | null;
  skinColor: string | null;
  onPress: () => void;
  testID?: string;
}

// Helper function to convert inches to feet and inches
const formatHeight = (inches: number | null): string => {
  if (!inches) return 'Unknown';
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return `${feet}'${remainingInches}"`;
};

export default function SearchDropdownItem({ 
  id, 
  name, 
  age, 
  height, 
  skinColor, 
  onPress,
  testID 
}: SearchDropdownItemProps) {
  // Format the display text: "Name, Age, Height, Skin Color"
  const displayText = `${name}, ${formatAge(age)}, ${formatHeight(height)}, ${skinColor || 'Unknown'}`;

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      testID={testID || `dropdown-item-${id}`}
    >
      <Text 
        style={styles.text}
        testID={`dropdown-text-${id}`}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {displayText}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  text: {
    fontSize: 15,
    color: '#111827',
  },
});