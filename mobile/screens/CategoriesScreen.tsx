import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Category {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  required: boolean;
  options?: string[];
  active: boolean;
}

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([
    {
      id: '1',
      name: 'Name',
      type: 'text',
      required: true,
      active: true,
    },
    {
      id: '2',
      name: 'Age',
      type: 'number',
      required: true,
      active: true,
    },
    {
      id: '3',
      name: 'Height',
      type: 'number',
      required: true,
      active: true,
    },
    {
      id: '4',
      name: 'Weight',
      type: 'number',
      required: true,
      active: true,
    },
    {
      id: '5',
      name: 'Skin Color',
      type: 'select',
      required: true,
      options: ['Light', 'Medium', 'Dark'],
      active: true,
    },
    {
      id: '6',
      name: 'Veteran Status',
      type: 'boolean',
      required: false,
      active: true,
    },
    {
      id: '7',
      name: 'Medical Conditions',
      type: 'select',
      required: false,
      options: ['Diabetes', 'Hypertension', 'Mental Health', 'Substance Abuse', 'None'],
      active: true,
    },
    {
      id: '8',
      name: 'Housing Priority',
      type: 'select',
      required: false,
      options: ['High', 'Medium', 'Low'],
      active: true,
    },
  ]);

  const [isExporting, setIsExporting] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'text' | 'number' | 'select' | 'boolean'>('text');

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      
      // Simulate API call to export CSV
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock CSV data
      const csvData = generateMockCSV();
      
      Alert.alert(
        'Export Successful',
        `CSV file downloaded with ${csvData.length} individuals and ${categories.filter(c => c.active).length} categories.`,
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('CSV Export completed');
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const generateMockCSV = () => {
    // Mock data for demonstration
    const mockIndividuals = [
      {
        name: 'John Doe',
        age: 45,
        height: 72,
        weight: 180,
        skinColor: 'Light',
        veteranStatus: true,
        medicalConditions: 'Diabetes',
        housingPriority: 'High',
        dangerScore: 75,
        lastInteraction: '2024-01-15',
      },
      {
        name: 'Sarah Smith',
        age: 35,
        height: 64,
        weight: 120,
        skinColor: 'Dark',
        veteranStatus: false,
        medicalConditions: 'None',
        housingPriority: 'Medium',
        dangerScore: 20,
        lastInteraction: '2024-01-14',
      },
      {
        name: 'Robert Johnson',
        age: 55,
        height: 70,
        weight: 200,
        skinColor: 'Medium',
        veteranStatus: true,
        medicalConditions: 'Substance Abuse',
        housingPriority: 'High',
        dangerScore: 90,
        lastInteraction: '2024-01-13',
      },
    ];

    return mockIndividuals;
  };

  const toggleCategoryActive = (categoryId: string) => {
    setCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, active: !cat.active }
          : cat
      )
    );
  };

  const addNewCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      type: newCategoryType,
      required: false,
      active: true,
    };

    setCategories(prev => [...prev, newCategory]);
    setNewCategoryName('');
    setNewCategoryType('text');
  };

  const getActiveCategoriesCount = () => {
    return categories.filter(cat => cat.active).length;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <Text style={styles.subtitle}>
          Manage data collection fields and export data
        </Text>
      </View>

      {/* Export Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Export</Text>
        <TouchableOpacity 
          style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
          onPress={handleExportCSV}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="download" size={20} color="#fff" />
          )}
          <Text style={styles.exportButtonText}>
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.exportInfo}>
          Exports all individuals with {getActiveCategoriesCount()} active categories
        </Text>
      </View>

      {/* Categories List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Categories</Text>
        <Text style={styles.categoryCount}>
          {getActiveCategoriesCount()} of {categories.length} categories active
        </Text>
        
        {categories.map(category => (
          <View key={category.id} style={styles.categoryItem}>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryType}>{category.type}</Text>
              {category.required && (
                <Text style={styles.requiredBadge}>Required</Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.toggleButton, category.active && styles.toggleButtonActive]}
              onPress={() => toggleCategoryActive(category.id)}
            >
              <Text style={[styles.toggleText, category.active && styles.toggleTextActive]}>
                {category.active ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Add New Category */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add New Category</Text>
        
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Category name"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
          />
          <TouchableOpacity style={styles.typeButton} onPress={() => {
            const types: Array<'text' | 'number' | 'select' | 'boolean'> = ['text', 'number', 'select', 'boolean'];
            const currentIndex = types.indexOf(newCategoryType);
            const nextIndex = (currentIndex + 1) % types.length;
            setNewCategoryType(types[nextIndex]);
          }}>
            <Text style={styles.typeButtonText}>{newCategoryType}</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={addNewCategory}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Category</Text>
        </TouchableOpacity>
      </View>

      {/* Export Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Export Information</Text>
        <Text style={styles.infoText}>
          • CSV includes all individuals in the database{'\n'}
          • All active categories are included as columns{'\n'}
          • Danger scores and last interaction dates included{'\n'}
          • Multi-select values are comma-separated{'\n'}
          • File is named with current date and time
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  exportButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  exportButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  exportInfo: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  categoryType: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  requiredBadge: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
    marginTop: 4,
  },
  toggleButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#fff',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  typeButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  addButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
}); 