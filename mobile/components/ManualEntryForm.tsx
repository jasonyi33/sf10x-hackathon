import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { api } from '../services/api';

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

  // Get required fields from categories
  const requiredFields = categories.filter(cat => cat.is_required).map(cat => cat.name);

  // Field configurations
  const fieldConfig = {
    name: { type: 'text', label: 'Name', required: true },
    height: { type: 'number', label: 'Height (inches)', required: true, max: 300 },
    weight: { type: 'number', label: 'Weight (pounds)', required: true, max: 300 },
    skin_color: { 
      type: 'select', 
      label: 'Skin Color', 
      required: true, 
      options: ['Light', 'Medium', 'Dark'] 
    },
    gender: { 
      type: 'select', 
      label: 'Gender', 
      required: false, 
      options: ['Male', 'Female', 'Other', 'Unknown'] 
    },
    substance_abuse_history: { 
      type: 'select', 
      label: 'Substance Abuse History', 
      required: false, 
      options: ['None', 'Mild', 'Moderate', 'Severe', 'In Recovery'] 
    },
    age: { type: 'number', label: 'Age', required: false, max: 120 },
    location: { type: 'text', label: 'Location', required: false },
    notes: { type: 'text', label: 'Notes', required: false },
  };

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

  const validateField = (fieldName: string, value: any): string => {
    const config = fieldConfig[fieldName as keyof typeof fieldConfig];
    
    // Check required fields
    if (config.required && (!value || value === '')) {
      return `${config.label} is required`;
    }

    // Check number fields
    if (config.type === 'number' && value) {
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < 0) {
        return `${config.label} must be a positive number`;
      }
      if ('max' in config && config.max && numValue > config.max) {
        return `${config.label} must be ${config.max} or less`;
      }
    }

    // Check select fields
    if (config.type === 'select' && value && 'options' in config && !config.options.includes(value)) {
      return `Please select a valid ${config.label.toLowerCase()}`;
    }

    return '';
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Validate all fields
    categories.forEach(category => {
      const error = validateField(category.name, formData[category.name]);
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
          placeholder={`Enter ${category.name.toLowerCase()}`}
          placeholderTextColor="#999"
          keyboardType={category.type === 'number' ? 'numeric' : 'default'}
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
        {/* High Priority Categories */}
        {categories.filter(cat => cat.priority === 'high').length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Required Information</Text>
            {categories.filter(cat => cat.priority === 'high').map(category => renderField(category))}
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
        {categories.filter(cat => cat.priority === 'medium').length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            {categories.filter(cat => cat.priority === 'medium').map(category => renderField(category))}
          </View>
        )}

        {/* Low Priority Categories */}
        {categories.filter(cat => cat.priority === 'low').length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Optional Information</Text>
            {categories.filter(cat => cat.priority === 'low').map(category => renderField(category))}
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