import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

interface PotentialMatch {
  id: string;
  confidence: number;
  name: string;
}

interface MergeUIProps {
  newData: Record<string, any>;
  potentialMatch: PotentialMatch;
  existingData?: Record<string, any>; // Will be fetched from backend
  onMerge: (mergedData: Record<string, any>) => void;
  onCreateNew: (data: Record<string, any>) => void;
  onCancel: () => void;
}

export const MergeUI: React.FC<MergeUIProps> = ({
  newData,
  potentialMatch,
  existingData = {},
  onMerge,
  onCreateNew,
  onCancel,
}) => {
  // Initialize field selection - auto-select existing data when new data is empty
  const initialSelection = useMemo(() => {
    const selection: Record<string, 'new' | 'existing'> = {};
    const allFields = new Set([...Object.keys(newData), ...Object.keys(existingData)]);
    
    allFields.forEach(field => {
      const hasNewData = newData[field] !== undefined && newData[field] !== null && newData[field] !== '';
      const hasExistingData = existingData[field] !== undefined && existingData[field] !== null && existingData[field] !== '';
      
      if (hasNewData) {
        // If new data exists, prefer it
        selection[field] = 'new';
      } else if (hasExistingData) {
        // If new data is empty but existing data exists, auto-select existing
        selection[field] = 'existing';
      } else {
        // If neither has data, default to new
        selection[field] = 'new';
      }
    });
    
    return selection;
  }, [newData, existingData]);

  const [selectedFields, setSelectedFields] = useState<Record<string, 'new' | 'existing'>>(initialSelection);

  const handleFieldSelection = (fieldName: string, source: 'new' | 'existing') => {
    setSelectedFields(prev => ({
      ...prev,
      [fieldName]: source,
    }));
  };

  const handleMerge = () => {
    const mergedData: Record<string, any> = {};
    
    // Combine data based on user selections
    Object.keys(selectedFields).forEach(field => {
      const source = selectedFields[field];
      if (source === 'new') {
        mergedData[field] = newData[field];
      } else if (source === 'existing') {
        mergedData[field] = existingData[field];
      }
    });

    // Add the existing individual's ID for merging
    mergedData.existing_individual_id = potentialMatch.id;
    
    onMerge(mergedData);
  };

  const handleCreateNew = () => {
    onCreateNew(newData);
  };

  const getFieldValue = (fieldName: string, source: 'new' | 'existing') => {
    const data = source === 'new' ? newData : existingData;
    const value = data[fieldName];
    
    if (value === undefined || value === null || value === '') {
      return '—';
    }
    
    return String(value);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#dc3545'; // Red for high confidence
    if (confidence >= 60) return '#ffc107'; // Yellow for medium confidence
    return '#28a745'; // Green for low confidence
  };

  const renderFieldComparison = (fieldName: string) => {
    const newValue = getFieldValue(fieldName, 'new');
    const existingValue = getFieldValue(fieldName, 'existing');
    const selectedSource = selectedFields[fieldName];
    const hasNewData = newData[fieldName] !== undefined && newData[fieldName] !== null && newData[fieldName] !== '';
    const hasExistingData = existingData[fieldName] !== undefined && existingData[fieldName] !== null && existingData[fieldName] !== '';

    return (
      <View key={fieldName} style={styles.fieldRow}>
        <Text style={styles.fieldName}>
          {fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/_/g, ' ')}
        </Text>
        
        <View style={styles.fieldValues}>
          {/* New Data */}
          <TouchableOpacity
            style={[
              styles.valueContainer,
              selectedSource === 'new' && styles.selectedValue,
              !hasNewData && styles.emptyValue
            ]}
            onPress={() => handleFieldSelection(fieldName, 'new')}
            disabled={!hasNewData}
          >
            <Text style={styles.valueLabel}>New</Text>
            <Text style={[
              styles.valueText,
              selectedSource === 'new' && styles.selectedValueText,
              !hasNewData && styles.emptyValueText
            ]}>
              {newValue}
            </Text>
          </TouchableOpacity>

          {/* Existing Data */}
          <TouchableOpacity
            style={[
              styles.valueContainer,
              selectedSource === 'existing' && styles.selectedValue,
              !hasExistingData && styles.emptyValue
            ]}
            onPress={() => handleFieldSelection(fieldName, 'existing')}
            disabled={!hasExistingData}
          >
            <Text style={styles.valueLabel}>Existing</Text>
            <Text style={[
              styles.valueText,
              selectedSource === 'existing' && styles.selectedValueText,
              !hasExistingData && styles.emptyValueText
            ]}>
              {existingValue}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const allFields = Array.from(new Set([...Object.keys(newData), ...Object.keys(existingData)]));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Potential Duplicate Found</Text>
        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceLabel}>Confidence:</Text>
          <Text style={[
            styles.confidenceScore,
            { color: getConfidenceColor(potentialMatch.confidence) }
          ]}>
            {potentialMatch.confidence}%
          </Text>
        </View>
        <Text style={styles.subtitle}>
          We found a similar individual: <Text style={styles.matchName}>{potentialMatch.name}</Text>
        </Text>
        <Text style={styles.instructions}>
          Select which data to keep for each field, then choose an action below.
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.comparisonSection}>
          <Text style={styles.sectionTitle}>Field Comparison</Text>
          {allFields.map(fieldName => renderFieldComparison(fieldName))}
        </View>
      </ScrollView>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.createNewButton} onPress={handleCreateNew}>
          <Text style={styles.createNewButtonText}>Create New</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.mergeButton} onPress={handleMerge}>
          <Text style={styles.mergeButtonText}>Merge</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  confidenceScore: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  matchName: {
    fontWeight: '600',
    color: '#333',
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
  },
  comparisonSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  fieldRow: {
    marginBottom: 16,
  },
  fieldName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  fieldValues: {
    flexDirection: 'row',
    gap: 12,
  },
  valueContainer: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  selectedValue: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  emptyValue: {
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
    opacity: 0.6,
  },
  valueLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  valueText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedValueText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyValueText: {
    color: '#999',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  createNewButton: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createNewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  mergeButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  mergeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 