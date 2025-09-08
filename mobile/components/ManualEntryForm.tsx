import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { api } from '../services/api';
import { normalizeHeightToStandardString, parseHeightToInches } from '../utils/height';

interface Category {
  id: string;
  name: string;
  type: string;
  is_required: boolean;
  options?: any;
  priority: string;
  danger_weight: number;
  auto_trigger: boolean;
}

interface ManualEntryFormProps {
  onSave: (data: Record<string, any>) => void;
  onCancel: () => void;
  selectedLocation?: { latitude: number; longitude: number; address?: string } | null;
}

export const ManualEntryForm: React.FC<ManualEntryFormProps> = ({
  onSave,
  onCancel,
  selectedLocation,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({
    name: '',
    height: '',
    weight: '',
    skin_color: '',
    gender: '',
    substance_abuse_history: '',
    age: '',
    location: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories from API on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await api.getCategories();
      setCategories(response || []);
      
      // Initialize form data with empty values for all categories
      const initialData: Record<string, any> = {};
      response?.forEach((cat: Category) => {
        initialData[cat.name] = '';
      });
      setFormData(initialData);
      
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      Alert.alert('Error', 'Failed to load form fields. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Parse height strings like 5'10, 5 ft 10 in, 70, 70in, 1.78m (optional) into inches
  // height utils moved to ../utils/height

  // Helper to format a category name for display
  const prettyLabel = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ');
  };

  // Helper to normalize category names for comparison
  const normalizeKey = (name: string) => name.trim().toLowerCase().replace(/\s+|_/g, '');

  const handleFieldChange = (fieldName: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));

    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: '',
      }));
    }
  };

  const validateField = (category: Category, value: any): string => {
    const label = prettyLabel(category.name);
    
    // Required check based on category config
    if (category.is_required && (value === undefined || value === null || value === '')) {
      return `${label} is required`;
    }

    // Number validation (with special handling for height)
    if (category.type === 'number' && value !== undefined && value !== null && value !== '') {
      const key = category.name.trim().toLowerCase();
      let numValue: number;
      if (key === 'height') {
        const parsed = parseHeightToInches(value);
        if (parsed === null) {
          return `${label} must be in inches or x'y format`;
        }
        numValue = parsed;
      } else {
        numValue = Number(value);
      }
      if (Number.isNaN(numValue) || numValue < 0) {
        return `${label} must be a positive number`;
      }
      if ((key === 'height' || key === 'weight') && numValue > 300) {
        return `${label} must be 300 or less`;
      }
      if (key === 'age' && numValue > 120) {
        return `${label} must be 120 or less`;
      }
    }

    // Select validation
    if (category.type === 'select' && Array.isArray(category.options) && value) {
      if (!category.options.includes(value)) {
        return `Please select a valid ${label.toLowerCase()}`;
      }
    }

    return '';
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Validate all fields
    categories.forEach(category => {
      const error = validateField(category, formData[category.name]);
      if (error) {
        newErrors[category.name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = () => {
    if (validateForm()) {
      // Convert empty strings to null for optional fields
      const cleanData = Object.keys(formData).reduce((acc, key) => {
        acc[key] = formData[key] === '' ? null : formData[key];
        return acc;
      }, {} as Record<string, any>);

      // Normalize height to a consistent feet'inches string (e.g., 5'10)
      const heightKey = Object.keys(cleanData).find(k => k.trim().toLowerCase() === 'height');
      if (heightKey && cleanData[heightKey] !== undefined && cleanData[heightKey] !== null && cleanData[heightKey] !== '') {
        const normalized = normalizeHeightToStandardString(cleanData[heightKey]);
        if (normalized !== null) {
          cleanData[heightKey] = normalized;
        }
      }

      // Add location data if available
      if (selectedLocation) {
        cleanData.location = {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          address: selectedLocation.address || 'Unknown Address',
        };
      }

      onSave(cleanData);
    } else {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
    }
  };

  const renderField = (category: Category) => {
    const value = formData[category.name];
    const error = errors[category.name];
    const isRequired = category.is_required;

    return (
      <View key={category.id} style={styles.fieldContainer}>
        <Text style={[
          styles.fieldLabel,
          isRequired && styles.requiredLabel,
          error && styles.errorLabel
        ]}>
          {category.name.charAt(0).toUpperCase() + category.name.slice(1).replace(/_/g, ' ')}
          {isRequired && ' *'}
        </Text>

        {/* Preset options for quick filling (if available) */}
        {category.options && Array.isArray(category.options) && category.options.length > 0 && (
          <View style={styles.presetOptionsContainer}>
            <Text style={styles.presetOptionsLabel}>Quick options:</Text>
            <View style={styles.presetOptionsRow}>
              {category.options.map((option: any) => {
                const optionLabel = option.label || option;
                
                return (
                  <TouchableOpacity
                    key={optionLabel}
                    style={styles.presetOptionButton}
                    onPress={() => handleFieldChange(category.name, optionLabel)}
                  >
                    <Text style={styles.presetOptionText}>{optionLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Always render as text input for flexibility */}
        <TextInput
          style={[
            styles.fieldInput,
            error && styles.errorInput
          ]}
          value={String(value || '')}
          onChangeText={(text) => handleFieldChange(category.name, text)}
          placeholder={category.name.trim().toLowerCase() === 'height' ? "Enter height (e.g., 5'10 or 70)" : `Enter ${category.name.toLowerCase()}`}
          placeholderTextColor="#999"
          keyboardType={category.type === 'number' && category.name.trim().toLowerCase() !== 'height' ? 'numeric' : 'default'}
          multiline={category.type === 'text' && category.name.toLowerCase().includes('notes')}
          numberOfLines={category.type === 'text' && category.name.toLowerCase().includes('notes') ? 3 : 1}
        />

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading form fields...</Text>
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>No Categories Found</Text>
        <Text style={styles.errorText}>
          No form fields are configured. Please contact an administrator.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCategories}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manual Entry</Text>
        <Text style={styles.subtitle}>
          Enter information manually instead of voice recording
        </Text>
      </View>

      <View style={styles.formContainer}>
        {/* Always show key fields first: Name, Height, Age, Weight (in that order) */}
        {(() => {
          const keyOrder = ['name', 'height', 'age', 'weight'];
          const keySet = new Set(keyOrder);
          const keyCategories = keyOrder
            .map(key => categories.find(cat => normalizeKey(cat.name) === key))
            .filter(Boolean) as Category[];
          if (keyCategories.length === 0) return null;
          return (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Key Information</Text>
              {keyCategories.map(category => renderField(category))}
            </View>
          );
        })()}

        {/* High Priority Categories */}
        {categories.filter(cat => cat.priority === 'high').filter(cat => !['name','height','age','weight'].includes(normalizeKey(cat.name))).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Required Information</Text>
            {categories
              .filter(cat => cat.priority === 'high')
              .filter(cat => !['name','height','age','weight'].includes(normalizeKey(cat.name)))
              .map(category => renderField(category))}
          </View>
        )}

        {/* Location Information */}
        {selectedLocation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location Information</Text>
            <View style={styles.locationContainer}>
              <Text style={styles.locationText}>
                📍 {selectedLocation.address || `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`}
              </Text>
            </View>
          </View>
        )}

        {/* Medium Priority Categories */}
        {categories.filter(cat => cat.priority === 'medium').filter(cat => !['name','height','age','weight'].includes(normalizeKey(cat.name))).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            {categories
              .filter(cat => cat.priority === 'medium')
              .filter(cat => !['name','height','age','weight'].includes(normalizeKey(cat.name)))
              .map(category => renderField(category))}
          </View>
        )}

        {/* Low Priority Categories */}
        {categories.filter(cat => cat.priority === 'low').filter(cat => !['name','height','age','weight'].includes(normalizeKey(cat.name))).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Optional Information</Text>
            {categories
              .filter(cat => cat.priority === 'low')
              .filter(cat => !['name','height','age','weight'].includes(normalizeKey(cat.name)))
              .map(category => renderField(category))}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  requiredLabel: {
    color: '#dc3545',
  },
  errorLabel: {
    color: '#dc3545',
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  errorInput: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectOption: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  selectedOption: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  selectOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
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
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  locationContainer: {
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  locationText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 10,
  },

  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  presetOptionsContainer: {
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  presetOptionsLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  presetOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetOptionButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  presetOptionText: {
    fontSize: 12,
    color: '#333',
  },
}); 
