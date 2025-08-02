import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FieldDisplayProps {
  label: string;
  value: any;
  isRequired?: boolean;
}

export default function FieldDisplay({ label, value, isRequired = false }: FieldDisplayProps) {
  // Handle different types of values
  const formatValue = (val: any): string => {
    if (val === null || val === undefined) {
      return 'Not specified';
    }
    
    if (Array.isArray(val)) {
      return val.join(', ');
    }
    
    if (typeof val === 'boolean') {
      return val ? 'Yes' : 'No';
    }
    
    return String(val);
  };

  const displayValue = formatValue(value);

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          {label}
          {isRequired && <Text style={styles.required}> *</Text>}
        </Text>
      </View>
      <Text style={styles.value}>{displayValue}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  labelContainer: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
  },
  required: {
    color: '#EF4444',
  },
  value: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 22,
  },
}); 