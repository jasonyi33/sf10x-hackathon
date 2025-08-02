import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

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

  // Required fields from PRD
  const requiredFields = ['name', 'height', 'weight', 'skin_color'];

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

  const handleFieldChange = (fieldName: string, value: string) => {
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
    Object.keys(fieldConfig).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
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

  const renderField = (fieldName: string) => {
    const config = fieldConfig[fieldName as keyof typeof fieldConfig];
    const value = formData[fieldName];
    const error = errors[fieldName];
    const isRequired = config.required;

    return (
      <View key={fieldName} style={styles.fieldContainer}>
        <Text style={[
          styles.fieldLabel,
          isRequired && styles.requiredLabel,
          error && styles.errorLabel
        ]}>
          {config.label}
          {isRequired && ' *'}
        </Text>

        {config.type === 'select' ? (
          <View style={styles.selectContainer}>
            {'options' in config && config.options.map((option: string) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.selectOption,
                  value === option && styles.selectedOption
                ]}
                onPress={() => handleFieldChange(fieldName, option)}
              >
                <Text style={[
                  styles.selectOptionText,
                  value === option && styles.selectedOptionText
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <TextInput
            style={[
              styles.fieldInput,
              error && styles.errorInput
            ]}
            value={String(value || '')}
            onChangeText={(text) => handleFieldChange(fieldName, text)}
            placeholder={`Enter ${config.label.toLowerCase()}`}
            placeholderTextColor="#999"
            keyboardType={config.type === 'number' ? 'numeric' : 'default'}
            multiline={fieldName === 'notes'}
            numberOfLines={fieldName === 'notes' ? 3 : 1}
          />
        )}

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manual Entry</Text>
        <Text style={styles.subtitle}>
          Enter information manually instead of voice recording
        </Text>
      </View>

      <View style={styles.formContainer}>
        {/* Required Fields Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Information</Text>
          {requiredFields.map(fieldName => renderField(fieldName))}
        </View>

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

        {/* Optional Fields Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          {Object.keys(fieldConfig)
            .filter(fieldName => !requiredFields.includes(fieldName))
            .map(fieldName => renderField(fieldName))
          }
        </View>
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
}); 