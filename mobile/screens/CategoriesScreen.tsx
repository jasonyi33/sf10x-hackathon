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
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

interface Category {
  id: string;
  name: string;
  type: 'text' | 'number' | 'single-select' | 'multi-select' | 'date' | 'location';
  required: boolean;
  priority: 'high' | 'medium' | 'low';
  urgency_weight?: number; // 0-100, only for number/single-select
  auto_trigger?: boolean; // only for number/single-select
  options?: string[] | Array<{label: string, value: number}>;
  active: boolean;
}

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([
    {
      id: '1',
      name: 'Name',
      type: 'text',
      required: true,
      priority: 'high',
      active: true,
    },
    {
      id: '2',
      name: 'Gender',
      type: 'single-select',
      required: false,
      priority: 'medium',
      urgency_weight: 0,
      auto_trigger: false,
      options: [
        {label: 'Male', value: 0},
        {label: 'Female', value: 0},
        {label: 'Other', value: 0},
        {label: 'Unknown', value: 0}
      ],
      active: true,
    },
    {
      id: '3',
      name: 'Height',
      type: 'number',
      required: true,
      priority: 'medium',
      urgency_weight: 0,
      auto_trigger: false,
      active: true,
    },
    {
      id: '4',
      name: 'Weight',
      type: 'number',
      required: true,
      priority: 'medium',
      urgency_weight: 0,
      auto_trigger: false,
      active: true,
    },
    {
      id: '5',
      name: 'Skin Color',
      type: 'single-select',
      required: true,
      priority: 'high',
      urgency_weight: 0,
      auto_trigger: false,
      options: [
        {label: 'Light', value: 0},
        {label: 'Medium', value: 0},
        {label: 'Dark', value: 0}
      ],
      active: true,
    },
    {
      id: '6',
      name: 'Substance Abuse History',
      type: 'multi-select',
      required: false,
      priority: 'low',
      options: ['None', 'Mild', 'Moderate', 'Severe', 'In Recovery'],
      active: true,
    },
  ]);

  const [isExporting, setIsExporting] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'text' | 'number' | 'single-select' | 'multi-select' | 'date' | 'location'>('text');
  const [newCategoryPriority, setNewCategoryPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newCategoryUrgencyWeight, setNewCategoryUrgencyWeight] = useState(0);
  const [newCategoryAutoTrigger, setNewCategoryAutoTrigger] = useState(false);
  const [newCategoryOptions, setNewCategoryOptions] = useState<string[]>([]);

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      
      // Use real API to export CSV
      const csvUrl = await api.exportCSV();
      
      Alert.alert(
        'Export Successful',
        'CSV file has been generated and is ready for download.',
        [
          {
            text: 'Download',
            onPress: () => {
              // In a real app, you would trigger a download here
              console.log('CSV Export completed:', csvUrl);
            }
          },
          {
            text: 'OK',
            style: 'cancel'
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
        urgencyScore: 75,
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
        urgencyScore: 20,
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
        urgencyScore: 90,
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

  const validateNewCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Category name is required');
      return false;
    }

    if (newCategoryType === 'single-select' && (!newCategoryOptions || newCategoryOptions.length === 0)) {
      Alert.alert('Error', 'Single-select categories require options');
      return false;
    }

    if (newCategoryType === 'multi-select' && (!newCategoryOptions || newCategoryOptions.length === 0)) {
      Alert.alert('Error', 'Multi-select categories require options');
      return false;
    }

    return true;
  };

  const addNewCategory = () => {
    if (!validateNewCategory()) return;

    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      type: newCategoryType,
      required: false,
      priority: newCategoryPriority,
      urgency_weight: (newCategoryType === 'number' || newCategoryType === 'single-select') ? newCategoryUrgencyWeight : undefined,
      auto_trigger: (newCategoryType === 'number' || newCategoryType === 'single-select') ? newCategoryAutoTrigger : undefined,
      options: (newCategoryType === 'single-select' || newCategoryType === 'multi-select') ? newCategoryOptions : undefined,
      active: true,
    };

    setCategories(prev => [...prev, newCategory]);
    setNewCategoryName('');
    setNewCategoryType('text');
  };

  const getActiveCategoriesCount = () => {
    return categories.filter(cat => cat.active).length;
  };

  const getPriorityDistribution = () => {
    const active = categories.filter(cat => cat.active);
    const high = active.filter(cat => cat.priority === 'high').length;
    const medium = active.filter(cat => cat.priority === 'medium').length;
    const low = active.filter(cat => cat.priority === 'low').length;
    return { high, medium, low };
  };

  return (
    <SafeAreaView style={styles.safeContainer} testID="categories-screen">
      {/* Sticky Warning Header */}
      <View style={styles.warningHeader} testID="warning-header">
        <Ionicons 
          name="warning" 
          size={24} 
          color="#856404" 
          style={styles.warningIcon}
          testID="warning-icon"
        />
        <View style={styles.warningContent}>
          <Text style={styles.warningTitle} testID="warning-title">
            ⚠️ Data Protection Notice
          </Text>
          <Text style={styles.warningSubtitle}>
            No medical, criminal, immigration, or racial categories allowed
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        testID="categories-scroll-view"
      >
        <View testID="scroll-content" style={styles.contentWrapper}>
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
        {(() => {
          const priorityDist = getPriorityDistribution();
          return (
            <Text style={styles.categoryCount}>
              {getActiveCategoriesCount()} active categories (High: {priorityDist.high}, Medium: {priorityDist.medium}, Low: {priorityDist.low})
            </Text>
          );
        })()}
        
        {categories.map(category => (
          <View key={category.id} style={styles.categoryItem}>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryType}>{category.type}</Text>
              <Text style={styles.categoryPriority}>Priority: {category.priority}</Text>
              {category.required && (
                <Text style={styles.requiredBadge}>Required</Text>
              )}
              {(category.type === 'number' || category.type === 'single-select') && category.urgency_weight !== undefined && (
                <Text style={styles.urgencyWeightBadge}>Urgency: {category.urgency_weight}</Text>
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
            const types: Array<'text' | 'number' | 'single-select' | 'multi-select' | 'date' | 'location'> = 
              ['text', 'number', 'single-select', 'multi-select', 'date', 'location'];
            const currentIndex = types.indexOf(newCategoryType);
            const nextIndex = (currentIndex + 1) % types.length;
            setNewCategoryType(types[nextIndex]);
          }}>
            <Text style={styles.typeButtonText}>{newCategoryType}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.priorityButton} onPress={() => {
            const priorities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
            const currentIndex = priorities.indexOf(newCategoryPriority);
            const nextIndex = (currentIndex + 1) % priorities.length;
            setNewCategoryPriority(priorities[nextIndex]);
          }}>
            <Text style={styles.priorityButtonText}>{newCategoryPriority}</Text>
          </TouchableOpacity>
        </View>
        
        {(newCategoryType === 'number' || newCategoryType === 'single-select') && (
          <View style={styles.urgencyWeightContainer}>
            <Text style={styles.urgencyWeightLabel}>Urgency Weight: {newCategoryUrgencyWeight}</Text>
            <TouchableOpacity 
              style={[styles.autoTriggerButton, newCategoryAutoTrigger && styles.autoTriggerButtonActive]}
              onPress={() => setNewCategoryAutoTrigger(!newCategoryAutoTrigger)}
            >
              <Text style={styles.autoTriggerText}>
                Auto-Trigger Urgency: {newCategoryAutoTrigger ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
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
              • Urgency scores and last interaction dates included{'\n'}
              • Multi-select values are comma-separated{'\n'}
              • File is named with current date and time
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  warningHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: '#FFF3CD',
    borderColor: '#FF3B30',
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  warningIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 2,
  },
  warningSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#856404',
  },
  warningList: {
    marginTop: 2,
  },
  warningItem: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
    marginBottom: 2,
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentWrapper: {
    paddingTop: 80, // Add padding to account for sticky header
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
  categoryPriority: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  urgencyWeightBadge: {
    fontSize: 10,
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
  priorityButton: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  priorityButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  urgencyWeightContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  urgencyWeightLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 5,
  },
  autoTriggerButton: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    alignItems: 'center',
  },
  autoTriggerButtonActive: {
    backgroundColor: '#DC2626',
  },
  autoTriggerText: {
    fontSize: 12,
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