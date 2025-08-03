# Phase 3 & 4 Implementation Guide: Advanced Search & Final Integration

## Overview
Phase 3 focuses on implementing advanced search functionality with filters, while Phase 4 handles final integration, legal compliance, and system-wide testing. These phases run from hours 6-7 of the 7-hour sprint.

## Questions for Clarification

Before proceeding with implementation, these aspects need clarification:

1. **Distance-based sorting**: The PRD mentions "Distance (if location available)" as a sort option. Should this use:
   - User's current location vs individual's last known location?
   - Or distance from a search center point?
   
2. **Filter caching**: The PRD states "Filter options cached for 1 hour with manual refresh". Where is the manual refresh triggered from - UI button or API parameter?

3. **Onboarding flow**: Should onboarding acknowledgment be stored per-device or per-user account? What happens if user logs in on new device?

4. **Age overlap logic**: For age filtering, should we match if ANY overlap exists, or require the individual's range to be fully within the filter range?

5. **Photo visibility in dropdown**: The PRD says "text-only previews" in search dropdown but also mentions showing photos in search results. Need clarification on where photos appear.

## Phase 3: Advanced Search & Filters (Hour 6)

### Task 3.0: [Dev 3] Search UI with Filters

#### Sub-task 3.0.1: Create SearchDropdown Component
**Requirements:**
- Real-time search with 300ms debounce
- Text-only results (NO photos in dropdown)
- Maximum 10 results displayed
- Display format: "John Doe, 45-50, 5'10", Medium"
- Click to navigate to full profile
- Loading indicator during search
- "No results found" message when empty

**Implementation:**
```typescript
// components/SearchDropdown.tsx
interface SearchDropdownProps {
  searchQuery: string;
  onSelectIndividual: (id: string) => void;
}

// Format: "Name, Age, Height, Build"
// Example: "John Doe, 45-50, 5'10", Medium"
```

**Test Cases:**
```typescript
// Test 1: Dropdown appears after 300ms of typing
// Test 2: Maximum 10 results shown
// Test 3: No photos displayed in dropdown
// Test 4: Correct format "Name, Age, Height, Build"
// Test 5: Loading state during search
// Test 6: Empty state shows "No results found"
// Test 7: Click navigates to profile
// Test 8: Dropdown closes on selection
// Test 9: Escape key closes dropdown
// Test 10: Click outside closes dropdown
```

#### Sub-task 3.0.2: Create FilterSection Component
**Requirements:**
- Starts collapsed by default
- Expand/collapse animation
- Filter groups:
  - Gender (multi-select checkboxes)
  - Age Range (dual slider)
  - Height Range (min/max inputs)
  - Danger Score (0-100 slider)
  - Has Photo (toggle)
- Active filters show as removable tags above
- "Clear All" button when filters active
- Filter count badge when collapsed

**Implementation:**
```typescript
// components/FilterSection.tsx
interface FilterState {
  gender: string[];           // Multiple selections allowed
  ageMin: number;            // -1 for no minimum
  ageMax: number;            // -1 for no maximum  
  heightMin: number;         // 0 for no minimum
  heightMax: number;         // 0 for no maximum
  dangerMin: number;         // 0-100
  dangerMax: number;         // 0-100
  hasPhoto: boolean | null;  // null = no filter
}
```

**Test Cases:**
```typescript
// Test 1: Section starts collapsed
// Test 2: Expand/collapse animation smooth
// Test 3: Gender allows multiple selection
// Test 4: Age slider shows numeric values
// Test 5: Height inputs validate numeric only
// Test 6: Danger slider 0-100 range
// Test 7: Active filters show as tags
// Test 8: Remove tag updates filter
// Test 9: Clear All resets all filters
// Test 10: Filter count badge updates
// Test 11: Filters persist during collapse
```

#### Sub-task 3.0.3: Create SortDropdown Component
**Requirements:**
- 4 sort options:
  - Danger Score (default)
  - Last Seen
  - Name A-Z
  - Distance (if location available)
- Show current sort option
- Dropdown on tap
- Update search results immediately

**Test Cases:**
```typescript
// Test 1: Default sort is Danger Score
// Test 2: All 4 options displayed
// Test 3: Current option highlighted
// Test 4: Distance option disabled without location
// Test 5: Sort change triggers new search
// Test 6: Sort persists across searches
```

### Task 3.1: [Dev 1] Efficient Search Backend

#### Sub-task 3.1.1: Implement Advanced Search Endpoint
**Requirements:**
```python
@router.get("/api/individuals/search/advanced")
async def search_individuals_advanced(
    # Text search
    q: Optional[str] = Query(None, description="Search query"),
    
    # Filters
    gender: Optional[str] = Query(None, description="Comma-separated genders"),
    age_min: Optional[int] = Query(None, ge=-1, le=120),
    age_max: Optional[int] = Query(None, ge=-1, le=120),
    height_min: Optional[int] = Query(None, ge=0, le=300),
    height_max: Optional[int] = Query(None, ge=0, le=300),
    danger_min: Optional[int] = Query(None, ge=0, le=100),
    danger_max: Optional[int] = Query(None, ge=0, le=100),
    has_photo: Optional[bool] = Query(None),
    
    # Sorting
    sort_by: str = Query("danger_score", regex="^(danger_score|last_seen|name|distance)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    
    # Pagination
    limit: int = Query(10, ge=1, le=20),
    offset: int = Query(0, ge=0, le=100),
    
    # Location for distance sort
    lat: Optional[float] = Query(None, ge=-90, le=90),
    lng: Optional[float] = Query(None, ge=-180, le=180),
    
    user_id: str = Depends(get_current_user)
):
    """
    Advanced search with filters using AND logic.
    Age filter uses overlap: NOT (ind_max < filter_min OR ind_min > filter_max)
    """
```

**SQL Query Building:**
```python
# Build WHERE clauses dynamically
conditions = []

# Text search
if q:
    conditions.append("(name ILIKE %s OR data::text ILIKE %s)")
    params.extend([f"%{q}%", f"%{q}%"])

# Gender filter (OR within gender)
if gender:
    genders = gender.split(",")
    conditions.append("data->>'gender' = ANY(%s)")
    params.append(genders)

# Age overlap filter
if age_min is not None or age_max is not None:
    # Extract age array [min, max] from JSONB
    age_condition = """
    NOT (
        (data->'approximate_age'->1)::int < %s OR 
        (data->'approximate_age'->0)::int > %s
    )
    """
    conditions.append(age_condition)
    params.extend([age_min or 0, age_max or 120])

# All conditions use AND
where_clause = " AND ".join(conditions) if conditions else "1=1"
```

**Test Cases:**
```python
# Test 1: Search without filters returns all
# Test 2: Text search in name field
# Test 3: Text search in JSONB data
# Test 4: Gender filter with single value
# Test 5: Gender filter with multiple values (OR)
# Test 6: Age overlap - partial overlap matches
# Test 7: Age overlap - no overlap excluded  
# Test 8: Age [-1,-1] (Unknown) handling
# Test 9: All filters combined (AND logic)
# Test 10: Sort by danger score DESC
# Test 11: Sort by last_seen DESC
# Test 12: Sort by name ASC
# Test 13: Sort by distance (with lat/lng)
# Test 14: Sort by distance without location fails
# Test 15: Pagination limit enforced
# Test 16: Deep pagination blocked (offset > 100)
# Test 17: Performance < 500ms with filters
```

#### Sub-task 3.1.2: Create Filter Options Endpoint
**Requirements:**
```python
@router.get("/api/search/filters")
async def get_filter_options(
    refresh: bool = Query(False, description="Force refresh cache"),
    user_id: str = Depends(get_current_user)
):
    """
    Get available filter options from existing data.
    Cached for 1 hour unless refresh=true or cache empty.
    """
    
    # Cache implementation
    global FILTER_CACHE, CACHE_EXPIRY
    
    if not refresh and FILTER_CACHE and datetime.now() < CACHE_EXPIRY:
        return FILTER_CACHE
    
    # Query distinct values
    options = {
        "gender": get_distinct_values("data->>'gender'"),
        "age_range": {
            "min": get_min_age(),  # Exclude -1 values
            "max": get_max_age()
        },
        "height_range": {
            "min": get_min_value("data->>'height'"),
            "max": get_max_value("data->>'height'")
        },
        "danger_score_range": {
            "min": 0,  # Always 0
            "max": 100  # Always 100
        }
    }
    
    FILTER_CACHE = options
    CACHE_EXPIRY = datetime.now() + timedelta(hours=1)
    
    return options
```

**Test Cases:**
```python
# Test 1: Returns all filter categories
# Test 2: Gender includes all distinct values
# Test 3: Age range excludes -1 (Unknown)
# Test 4: Cache works for 1 hour
# Test 5: refresh=true forces new query
# Test 6: Empty cache triggers refresh
# Test 7: Response format matches spec
# Test 8: Performance < 200ms (cached)
# Test 9: Performance < 1s (fresh query)
```

#### Sub-task 3.1.3: Database Optimization
**Requirements:**
- Create indexes for all filterable fields
- Optimize JSONB queries
- Ensure < 500ms response time

**SQL Indexes:**
```sql
-- Create indexes for filter performance
CREATE INDEX idx_individuals_gender ON individuals((data->>'gender'));
CREATE INDEX idx_individuals_age_min ON individuals(((data->'approximate_age'->0)::int));
CREATE INDEX idx_individuals_age_max ON individuals(((data->'approximate_age'->1)::int));
CREATE INDEX idx_individuals_height ON individuals(((data->>'height')::int));
CREATE INDEX idx_individuals_danger ON individuals(danger_score);
CREATE INDEX idx_individuals_has_photo ON individuals((photo_url IS NOT NULL));
CREATE INDEX idx_individuals_name_lower ON individuals(lower(name));

-- For text search in JSONB
CREATE INDEX idx_individuals_data_gin ON individuals USING gin(data);
```

**Test Cases:**
```sql
-- Test 1: EXPLAIN shows index usage
-- Test 2: Filter queries < 500ms
-- Test 3: Combined filters < 500ms
-- Test 4: Text search uses GIN index
-- Test 5: Sort operations use indexes
```

### Task 3.2: [Dev 2] Legal Compliance UI

#### Sub-task 3.2.1: Create OnboardingScreen Component
**Requirements:**
- Check AsyncStorage for 'onboarding_complete' flag
- If not complete, show legal warning screen
- Full screen modal, no skip option
- Warning text (from PRD):
  ```
  ⚠️ Data Protection Notice: Do not create categories for:
  • Medical diagnoses or health conditions
  • Criminal history or legal status
  • Immigration or citizenship status
  • Specific racial/ethnic identification
  ```
- "I Understand" button at bottom
- Set flag after acknowledgment
- Auto-proceed to main app

**Implementation:**
```typescript
// screens/OnboardingScreen.tsx
const checkOnboardingStatus = async () => {
  const completed = await AsyncStorage.getItem('onboarding_complete');
  return completed === 'true';
};

const completeOnboarding = async () => {
  await AsyncStorage.setItem('onboarding_complete', 'true');
  await AsyncStorage.setItem('onboarding_date', new Date().toISOString());
  navigation.replace('Main');
};
```

**Test Cases:**
```typescript
// Test 1: Shows on first launch
// Test 2: Skipped if flag exists
// Test 3: Cannot dismiss without acknowledging
// Test 4: Warning text matches PRD exactly
// Test 5: Button enables after scrolling to bottom
// Test 6: Flag persists across app restarts
// Test 7: Date tracked for compliance
// Test 8: Navigation replaces (no back)
```

#### Sub-task 3.2.2: Update CategoriesScreen with Warning
**Requirements:**
- Sticky header with warning box
- Red border, yellow background
- Same warning text as onboarding
- Always visible (doesn't scroll)
- Takes up top 20% of screen
- Categories list below scrolls independently

**Implementation:**
```typescript
// screens/CategoriesScreen.tsx
<View style={styles.container}>
  <View style={styles.warningContainer}>
    <Text style={styles.warningTitle}>⚠️ Data Protection Notice</Text>
    <Text style={styles.warningText}>
      Do not create categories for:{'\n'}
      • Medical diagnoses or health conditions{'\n'}
      • Criminal history or legal status{'\n'}
      • Immigration or citizenship status{'\n'}
      • Specific racial/ethnic identification
    </Text>
  </View>
  <ScrollView style={styles.categoriesList}>
    {/* Categories content */}
  </ScrollView>
</View>
```

**Test Cases:**
```typescript
// Test 1: Warning always visible at top
// Test 2: Red border 2px solid
// Test 3: Yellow background (#FFF3CD)
// Test 4: Warning doesn't scroll
// Test 5: Categories scroll below
// Test 6: Warning text readable (14px+)
// Test 7: Proper padding/margins
```

## Phase 4: Final Integration & Testing (Hour 7)

### Task 4.0: [All Devs] Integration Testing

#### Sub-task 4.0.1: Complete Voice → Photo → Search Flow
**Test Scenario:**
```
1. Record voice interaction (with age mentioned)
2. AI extracts age correctly as range
3. Edit screen shows age slider with extracted values
4. Take photo with consent
5. Save individual
6. Search for individual using filters
7. Verify found with correct data
```

**Test Cases:**
```typescript
// Test 1: Age "about 45" → [43, 47]
// Test 2: Age "elderly" → [65, 85] 
// Test 3: No age → [-1, -1] (Unknown)
// Test 4: Photo uploads before save
// Test 5: Search by age range finds match
// Test 6: Search by photo filter works
// Test 7: Combined filters work (AND)
// Test 8: Performance < 3s total flow
```

#### Sub-task 4.0.2: Search Performance Testing
**Requirements:**
- Create 1000+ test individuals
- Test all filter combinations
- Verify < 500ms response time
- Test pagination performance

**Test Data Generation:**
```python
# Generate diverse test data
for i in range(1000):
    age = [random.randint(25, 35), random.randint(36, 45)] if i % 10 != 0 else [-1, -1]
    individual = {
        "name": f"Test Person {i}",
        "data": {
            "approximate_age": age,
            "gender": random.choice(["Male", "Female", "Other", "Unknown"]),
            "height": random.randint(60, 78),
            "weight": random.randint(100, 250),
            "skin_color": random.choice(["Light", "Medium", "Dark"])
        },
        "danger_score": random.randint(0, 100),
        "photo_url": f"https://example.com/photo{i}.jpg" if i % 3 != 0 else None
    }
```

**Performance Tests:**
```python
# Test 1: Search with no filters < 500ms
# Test 2: Single filter < 500ms
# Test 3: All filters combined < 500ms
# Test 4: Text search < 500ms
# Test 5: Sort by distance < 500ms
# Test 6: Page 1 load < 500ms
# Test 7: Page 2+ load < 500ms
# Test 8: Filter options query < 200ms
# Test 9: 10 concurrent searches handled
# Test 10: Memory usage stable
```

#### Sub-task 4.0.3: Error Handling & Edge Cases
**Test Cases:**
```typescript
// Test 1: Network failure during search
// Test 2: Invalid filter combinations
// Test 3: Search with special characters
// Test 4: Empty search results
// Test 5: Timeout handling (> 30s)
// Test 6: Malformed age data [-1] or [45]
// Test 7: Missing required fields
// Test 8: Photo upload during search
// Test 9: Logout during search
// Test 10: Background/foreground transitions
```

#### Sub-task 4.0.4: Legal Compliance Verification
**Requirements:**
- Verify onboarding shown to new users
- Confirm warning visible in categories
- Test consent flow for photos
- Audit trail completeness

**Test Cases:**
```typescript
// Test 1: New install shows onboarding
// Test 2: Onboarding blocks app access
// Test 3: Categories shows warning
// Test 4: Cannot create medical category
// Test 5: Photo consent tracked
// Test 6: Consent has location
// Test 7: Consent has timestamp
// Test 8: Consent has user ID
// Test 9: Warning text matches PRD
// Test 10: Acknowledgment persisted
```

### Task 4.1: [Dev 1] Data Migration & Cleanup

#### Sub-task 4.1.1: Run Age Migration
**Requirements:**
- Ensure all existing individuals have approximate_age
- Set to [-1, -1] if missing
- Verify data integrity

**Migration Check:**
```python
# Verify migration completed
def verify_age_migration():
    # Check no individuals missing age
    missing = supabase.table("individuals")\
        .select("id, name")\
        .is_("data->approximate_age", None)\
        .execute()
    
    if missing.data:
        # Run update for any missed
        for ind in missing.data:
            update_data = {
                "data": {
                    **ind.get("data", {}),
                    "approximate_age": [-1, -1]
                }
            }
            supabase.table("individuals")\
                .update(update_data)\
                .eq("id", ind["id"])\
                .execute()
```

#### Sub-task 4.1.2: Create Demo Data
**Requirements:**
- 5 individuals with photos
- Diverse characteristics
- Various danger scores
- Some with photo history

**Demo Data:**
```python
demo_individuals = [
    {
        "name": "John Smith",
        "data": {
            "approximate_age": [45, 50],
            "gender": "Male",
            "height": 72,
            "weight": 180,
            "skin_color": "Light",
            "hair_color": "Brown",
            "build": "Medium"
        },
        "danger_score": 35,
        "photo_url": "demo/john_current.jpg",
        "photo_history": [
            {"url": "demo/john_old1.jpg", "timestamp": "2024-01-15T10:00:00Z"},
            {"url": "demo/john_old2.jpg", "timestamp": "2024-01-01T10:00:00Z"}
        ]
    },
    # ... 4 more individuals
]
```

### Task 4.2: [Dev 2] UI Polish & Accessibility

#### Sub-task 4.2.1: Loading States
**Requirements:**
- Search spinner during query
- Filter options loading
- Skeleton screens for results
- Progress indicator for photo upload

**Test Cases:**
```typescript
// Test 1: Search shows spinner
// Test 2: Filters show loading
// Test 3: Results show skeletons
// Test 4: Photo upload progress
// Test 5: Timeout shows error
// Test 6: Can cancel search
```

#### Sub-task 4.2.2: Error Messages
**Requirements:**
- User-friendly error text
- Actionable suggestions
- Retry options
- Toast notifications

**Error Messages:**
```typescript
const ERROR_MESSAGES = {
  SEARCH_FAILED: "Search failed. Please try again.",
  FILTER_LOAD_FAILED: "Couldn't load filter options. Tap to retry.",
  NO_RESULTS: "No individuals found matching your criteria.",
  NETWORK_ERROR: "No internet connection. Please check your network.",
  PHOTO_TOO_LARGE: "Photo is too large. Maximum size is 5MB.",
  INVALID_AGE_RANGE: "Maximum age must be greater than minimum age."
};
```

### Task 4.3: [Dev 3] Final Testing Checklist

#### Complete Feature Testing
- [ ] Voice recording with age extraction
- [ ] Age displayed as range or "Unknown"  
- [ ] Photo capture with consent
- [ ] Search with live dropdown
- [ ] All filters working (AND logic)
- [ ] Sort options functional
- [ ] Filter tags removable
- [ ] Onboarding flow complete
- [ ] Category warning visible
- [ ] Performance < 500ms

#### Edge Case Testing  
- [ ] Age [-1, -1] displays "Unknown"
- [ ] Age overlap matching works
- [ ] Photo upload timeout handled
- [ ] Deep pagination blocked
- [ ] Special characters in search
- [ ] Multiple rapid searches
- [ ] Background/foreground
- [ ] Low memory conditions
- [ ] No network handling
- [ ] Concurrent user updates

## Critical Implementation Notes

### Filter Performance Optimization
```python
# Use query builder pattern
class SearchQueryBuilder:
    def __init__(self):
        self.conditions = []
        self.params = []
    
    def add_text_search(self, query: str):
        if query:
            self.conditions.append(
                "(name ILIKE %s OR data::text ILIKE %s)"
            )
            self.params.extend([f"%{query}%", f"%{query}%"])
    
    def add_age_filter(self, age_min: int, age_max: int):
        # Handle overlap logic
        if age_min > -1 or age_max > -1:
            self.conditions.append("""
                NOT (
                    (data->'approximate_age'->1)::int < %s OR 
                    (data->'approximate_age'->0)::int > %s
                )
            """)
            self.params.extend([
                age_min if age_min > -1 else 0,
                age_max if age_max > -1 else 120
            ])
```

### Frontend Filter State Management
```typescript
// Use reducer for complex filter state
const filterReducer = (state: FilterState, action: FilterAction) => {
  switch (action.type) {
    case 'SET_GENDER':
      return { ...state, gender: action.payload };
    case 'TOGGLE_GENDER':
      const gender = state.gender.includes(action.payload)
        ? state.gender.filter(g => g !== action.payload)
        : [...state.gender, action.payload];
      return { ...state, gender };
    case 'SET_AGE_RANGE':
      return { 
        ...state, 
        ageMin: action.payload.min,
        ageMax: action.payload.max 
      };
    case 'CLEAR_ALL':
      return initialFilterState;
    default:
      return state;
  }
};
```

### Search Debouncing
```typescript
// Proper debounce implementation
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// Usage in search
const debouncedSearch = useDebounce(searchQuery, 300);
```

## Success Metrics

### Phase 3 Success Criteria
- [ ] Search response time < 500ms with filters
- [ ] Filter options load < 200ms (cached)
- [ ] Dropdown shows within 300ms of typing
- [ ] All filters work correctly with AND logic
- [ ] Age overlap matching works as specified
- [ ] Sort options function correctly
- [ ] UI responsive during search

### Phase 4 Success Criteria  
- [ ] Complete flow works end-to-end
- [ ] Performance meets all targets
- [ ] Legal warnings properly displayed
- [ ] Error handling comprehensive
- [ ] 1000+ individuals handle well
- [ ] Demo data created successfully
- [ ] All edge cases handled

## Common Pitfalls to Avoid

1. **Filter Logic**: Ensure AND between different filters, OR within same filter (e.g., gender)
2. **Age Overlap**: Must handle [-1, -1] specially - it should not match any age filter
3. **Performance**: Don't query filter options on every search - use caching
4. **Dropdown**: Must be text-only, no photos in search dropdown
5. **Deep Pagination**: Block offset > 100 to prevent performance issues
6. **Sort by Distance**: Requires location parameters, handle missing location gracefully
7. **Onboarding**: Store completion flag immediately to prevent re-showing

## Deployment Checklist

### Backend Deployment
- [ ] Run all migrations first
- [ ] Create indexes for filters  
- [ ] Deploy search endpoints
- [ ] Test with production data
- [ ] Monitor performance

### Frontend Deployment
- [ ] Test on real devices
- [ ] Verify onboarding flow
- [ ] Check filter animations
- [ ] Test search performance
- [ ] Verify error handling