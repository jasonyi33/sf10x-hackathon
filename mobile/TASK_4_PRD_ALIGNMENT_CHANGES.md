# Task 4 PRD Alignment Changes
*Comprehensive guide to align current implementation with updated PRD and task list*

## Overview
This document outlines all necessary changes to align the current Task 4 implementation with the updated PRD and task list. The changes are categorized by priority and include specific code modifications required.

## Critical Changes (Must Fix)

### 1. Remove Recent Individuals Section
**File:** `mobile/screens/SearchScreen.tsx`
**Issue:** Recent individuals section was removed from updated PRD
**Changes Required:**

```typescript
// REMOVE these lines:
const [recentIndividuals, setRecentIndividuals] = useState<SearchResult[]>([]);
const [isLoadingRecent, setIsLoadingRecent] = useState(true);

// REMOVE this useEffect:
useEffect(() => {
  loadRecentIndividuals();
}, []);

// REMOVE this function:
const loadRecentIndividuals = async () => {
  // ... entire function
};

// REMOVE this render function:
const renderRecentItem = ({ item }: { item: SearchResult }) => (
  <SearchResultItem result={item} onPress={handleResultPress} />
);

// REPLACE the conditional rendering section:
{searchQuery.trim() ? (
  <View style={styles.resultsContainer}>
    {renderSectionHeader('Search Results')}
    {isLoading ? (
      <ActivityIndicator style={styles.loader} size="large" color="#007AFF" />
    ) : searchResults.length > 0 ? (
      <FlatList
        data={searchResults}
        renderItem={renderSearchResult}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />
    ) : (
      <Text style={styles.noResults}>No individuals found</Text>
    )}
  </View>
) : (
  // REMOVE entire "Recent Individuals" section
  <View style={styles.resultsContainer}>
    <Text style={styles.noResults}>Enter a search term to find individuals</Text>
  </View>
)}
```

### 2. Update Search Placeholder Text
**File:** `mobile/screens/SearchScreen.tsx`
**Issue:** Search should search across all fields, not just name
**Changes Required:**

```typescript
// CHANGE this line:
placeholder="Search by name..."

// TO:
placeholder="Search individuals..."
```

### 3. Update Category Types to Match PRD
**File:** `mobile/screens/CategoriesScreen.tsx`
**Issue:** Category types don't match updated PRD specification
**Changes Required:**

```typescript
// CHANGE this interface:
interface Category {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  required: boolean;
  options?: string[];
  active: boolean;
}

// TO:
interface Category {
  id: string;
  name: string;
  type: 'text' | 'number' | 'single-select' | 'multi-select' | 'date' | 'location';
  required: boolean;
  priority: 'high' | 'medium' | 'low';
  danger_weight?: number; // 0-100, only for number/single-select
  auto_trigger?: boolean; // only for number/single-select
  options?: string[] | Array<{label: string, value: number}>;
  active: boolean;
}
```

### 4. Replace Custom Categories with Preset Categories
**File:** `mobile/screens/CategoriesScreen.tsx`
**Issue:** Categories don't match preset categories from PRD
**Changes Required:**

```typescript
// REPLACE the entire categories array with:
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
    danger_weight: 0,
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
    danger_weight: 0,
    auto_trigger: false,
    active: true,
  },
  {
    id: '4',
    name: 'Weight',
    type: 'number',
    required: true,
    priority: 'medium',
    danger_weight: 0,
    auto_trigger: false,
    active: true,
  },
  {
    id: '5',
    name: 'Skin Color',
    type: 'single-select',
    required: true,
    priority: 'high',
    danger_weight: 0,
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
```

### 5. Update Category Type Selection
**File:** `mobile/screens/CategoriesScreen.tsx`
**Issue:** Type selection doesn't match new category types
**Changes Required:**

```typescript
// CHANGE this line:
type: 'text' | 'number' | 'select' | 'boolean'

// TO:
type: 'text' | 'number' | 'single-select' | 'multi-select' | 'date' | 'location'

// UPDATE the type button logic:
const types: Array<'text' | 'number' | 'single-select' | 'multi-select' | 'date' | 'location'> = 
  ['text', 'number', 'single-select', 'multi-select', 'date', 'location'];
```

### 6. Add Priority System to Categories
**File:** `mobile/screens/CategoriesScreen.tsx`
**Issue:** Missing priority system for categories
**Changes Required:**

```typescript
// ADD priority state:
const [newCategoryPriority, setNewCategoryPriority] = useState<'high' | 'medium' | 'low'>('medium');

// ADD priority selection in the UI:
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
```

### 7. Add Danger Weight System
**File:** `mobile/screens/CategoriesScreen.tsx`
**Issue:** Missing danger weight system for number/single-select categories
**Changes Required:**

```typescript
// ADD danger weight state:
const [newCategoryDangerWeight, setNewCategoryDangerWeight] = useState(0);
const [newCategoryAutoTrigger, setNewCategoryAutoTrigger] = useState(false);

// ADD danger weight UI (only show for number/single-select):
{(newCategoryType === 'number' || newCategoryType === 'single-select') && (
  <View style={styles.dangerWeightContainer}>
    <Text style={styles.dangerWeightLabel}>Danger Weight: {newCategoryDangerWeight}</Text>
    <Slider
      style={styles.slider}
      minimumValue={0}
      maximumValue={100}
      value={newCategoryDangerWeight}
      onValueChange={setNewCategoryDangerWeight}
    />
    <TouchableOpacity 
      style={[styles.autoTriggerButton, newCategoryAutoTrigger && styles.autoTriggerButtonActive]}
      onPress={() => setNewCategoryAutoTrigger(!newCategoryAutoTrigger)}
    >
      <Text style={styles.autoTriggerText}>
        Auto-Trigger Danger: {newCategoryAutoTrigger ? 'ON' : 'OFF'}
      </Text>
    </TouchableOpacity>
  </View>
)}
```

### 8. Update Category Display to Show Priority
**File:** `mobile/screens/CategoriesScreen.tsx`
**Issue:** Category display doesn't show priority
**Changes Required:**

```typescript
// UPDATE the category item rendering:
{categories.map(category => (
  <View key={category.id} style={styles.categoryItem}>
    <View style={styles.categoryInfo}>
      <Text style={styles.categoryName}>{category.name}</Text>
      <Text style={styles.categoryType}>{category.type}</Text>
      <Text style={styles.categoryPriority}>Priority: {category.priority}</Text>
      {category.required && (
        <Text style={styles.requiredBadge}>Required</Text>
      )}
      {(category.type === 'number' || category.type === 'single-select') && category.danger_weight !== undefined && (
        <Text style={styles.dangerWeightBadge}>Danger: {category.danger_weight}</Text>
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
```

### 9. Update Danger Score Colors
**File:** `mobile/utils/dangerScore.ts`
**Issue:** Danger score colors may not match exact PRD specification
**Changes Required:**

```typescript
// VERIFY these exact color values are used:
export const getDangerScoreColor = (score: number): string => {
  if (score <= 33) return '#10B981'; // Green
  if (score <= 66) return '#F59E0B'; // Yellow
  return '#EF4444'; // Red
};
```

### 10. Update API Service to Remove Recent Individuals
**File:** `mobile/services/api.ts`
**Issue:** API still has getRecentIndividuals function
**Changes Required:**

```typescript
// REMOVE this function entirely:
export const getRecentIndividuals = async (): Promise<SearchResult[]> => {
  // ... entire function
};
```

## Medium Priority Changes

### 11. Update Search API to Support Multi-Field Search
**File:** `mobile/services/api.ts`
**Issue:** Search should search across all fields, not just name
**Changes Required:**

```typescript
// UPDATE the search function to indicate multi-field search:
export const searchIndividuals = async (query: string): Promise<SearchResult[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  if (!query.trim()) {
    return [];
  }

  // Search across multiple fields (name, data fields, etc.)
  const filtered = mockIndividuals.filter(individual =>
    individual.name.toLowerCase().includes(query.toLowerCase()) ||
    // Add other field searches when backend is connected
    // individual.data.some(field => field.toLowerCase().includes(query.toLowerCase()))
  );

  return filtered;
};
```

### 12. Add Category Priority Styles
**File:** `mobile/screens/CategoriesScreen.tsx`
**Issue:** Missing styles for priority display
**Changes Required:**

```typescript
// ADD these styles:
categoryPriority: {
  fontSize: 12,
  color: '#6B7280',
  marginTop: 2,
},
dangerWeightBadge: {
  fontSize: 10,
  color: '#DC2626',
  backgroundColor: '#FEE2E2',
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 4,
  marginTop: 2,
},
dangerWeightContainer: {
  marginTop: 10,
  padding: 10,
  backgroundColor: '#F9FAFB',
  borderRadius: 8,
},
dangerWeightLabel: {
  fontSize: 14,
  fontWeight: '500',
  color: '#374151',
  marginBottom: 5,
},
slider: {
  width: '100%',
  height: 40,
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
```

## Low Priority Changes

### 13. Update Category Count Display
**File:** `mobile/screens/CategoriesScreen.tsx`
**Issue:** Category count should reflect priority distribution
**Changes Required:**

```typescript
// UPDATE the category count function:
const getActiveCategoriesCount = () => {
  return categories.filter(cat => cat.active).length;
};

// ADD priority distribution display:
const getPriorityDistribution = () => {
  const active = categories.filter(cat => cat.active);
  const high = active.filter(cat => cat.priority === 'high').length;
  const medium = active.filter(cat => cat.priority === 'medium').length;
  const low = active.filter(cat => cat.priority === 'low').length;
  return { high, medium, low };
};

// UPDATE the display:
const priorityDist = getPriorityDistribution();
<Text style={styles.categoryCount}>
  {getActiveCategoriesCount()} active categories (High: {priorityDist.high}, Medium: {priorityDist.medium}, Low: {priorityDist.low})
</Text>
```

### 14. Add Category Type Validation
**File:** `mobile/screens/CategoriesScreen.tsx`
**Issue:** Missing validation for category type-specific requirements
**Changes Required:**

```typescript
// ADD validation function:
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

// UPDATE addNewCategory function:
const addNewCategory = () => {
  if (!validateNewCategory()) return;
  
  // ... rest of function
};
```

## Testing Changes

### 15. Update Mock Data to Match New Categories
**File:** `mobile/services/api.ts`
**Issue:** Mock data should reflect new category structure
**Changes Required:**

```typescript
// UPDATE mock individual profiles to match new category structure:
data: {
  name: 'John Doe',
  height: 72,
  weight: 180,
  skin_color: 'Light',
  gender: 'Male',
  substance_abuse_history: ['Moderate'],
  // Remove fields that aren't in preset categories
  // age: 45, // Not in preset categories
  // veteran_status: 'Yes', // Not in preset categories
  // medical_conditions: ['Diabetes'], // Not in preset categories
  // housing_priority: 'High', // Not in preset categories
},
```

## Summary of Changes

### Files to Modify:
1. `mobile/screens/SearchScreen.tsx` - Remove recent individuals, update search
2. `mobile/screens/CategoriesScreen.tsx` - Update categories, add priority/danger systems
3. `mobile/services/api.ts` - Remove recent individuals function
4. `mobile/utils/dangerScore.ts` - Verify color values

### New Features to Add:
- Category priority system (high/medium/low)
- Danger weight system (0-100 for number/single-select)
- Auto-trigger system for danger scoring
- Multi-field search capability
- Preset category structure

### Features to Remove:
- Recent individuals section
- Custom categories not in preset list
- Boolean category type
- Select category type (replace with single-select/multi-select)

## Implementation Priority

1. **Critical (Must Fix):** Items 1-10
2. **Medium Priority:** Items 11-12
3. **Low Priority:** Items 13-15

## Verification Checklist

After implementing changes, verify:
- [ ] Recent individuals section is completely removed
- [ ] Search placeholder says "Search individuals..."
- [ ] Categories use correct types (single-select, multi-select, etc.)
- [ ] Preset categories are implemented correctly
- [ ] Priority system is visible in category list
- [ ] Danger weight system works for number/single-select
- [ ] Danger score colors match exact hex values
- [ ] No references to removed features remain

## Notes

- These changes align the implementation with the updated PRD
- The changes maintain backward compatibility where possible
- All changes are focused on Task 4 scope (frontend data management)
- Integration with Tasks 1, 2, 3 will require additional changes when backend is ready 