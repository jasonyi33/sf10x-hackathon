# Phase 3 & Phase 4 Implementation Guide: Advanced Search & Final Integration

## Overview
Phase 3 focuses on implementing advanced search functionality with filters, live dropdown results, sort options, and legal compliance screens. Phase 4 covers final integration, comprehensive testing, and deployment readiness. This guide covers hours 6-7 of the 7-hour sprint.

## Phase 3 Task Breakdown (Hour 6-7)

### Task 3.0: [Dev 3] Search UI with Filters

#### Sub-task 3.0.1: Live Dropdown Search
**Requirements:**
- Implement live search dropdown that appears as user types
- Debounce search input by 300ms to reduce API calls
- Show maximum 10 results in dropdown
- Display format: "Name, Age, Height, Skin Color" (e.g., "John Doe, 45-50, 5'10", Medium")
- Text-only results - NO photos in dropdown for privacy
- Click result to navigate to full profile
- Dismiss dropdown on outside tap or selection

**Test Cases:**
```typescript
// Test 1: Dropdown appears after 300ms of typing
// Test 2: Maximum 10 results shown
// Test 3: Results format matches specification
// Test 4: No photo URLs or images in dropdown
// Test 5: Click navigates to profile
// Test 6: Dropdown dismisses on outside tap
// Test 7: Loading state while searching
// Test 8: Empty state when no results
// Test 9: Error state on API failure
```

#### Sub-task 3.0.2: Collapsible Filter Section
**Requirements:**
- Filter section starts collapsed by default
- Expand/collapse with smooth animation
- Filter options include:
  - Gender (multi-select checkboxes)
  - Age range (dual slider with min/max)
  - Height range (min/max number inputs)
  - Danger score range (0-100 slider)
  - Has photo (yes/no/any radio buttons)
- Active filters shown as removable tags above results
- Clear all filters button
- Filter count badge when collapsed

**Test Cases:**
```typescript
// Test 1: Filter section collapsed on load
// Test 2: Smooth expand/collapse animation
// Test 3: All filter types render correctly
// Test 4: Active filters show as tags
// Test 5: Remove individual filter tag
// Test 6: Clear all filters button works
// Test 7: Filter count updates correctly
// Test 8: Filters persist during collapse/expand
// Test 9: Age slider shows numeric values
```

#### Sub-task 3.0.3: Sort Dropdown
**Requirements:**
- Dropdown with 4 sort options:
  1. Danger Score (default) - highest first
  2. Last Seen - most recent first
  3. Name A-Z - alphabetical
  4. Distance - nearest first (only if user location available)
- Selected sort option persists during session
- Sort indicator (arrow) shows current direction
- Apply sort immediately on selection

**Test Cases:**
```typescript
// Test 1: Default sort is Danger Score
// Test 2: All 4 sort options available
// Test 3: Distance option disabled without location
// Test 4: Sort applies immediately
// Test 5: Sort persists during filter changes
// Test 6: Sort indicator shows correctly
// Test 7: Results re-render on sort change
```

### Task 3.1: [Dev 1] Efficient Search Backend

#### Sub-task 3.1.1: Advanced Search Endpoint
**Requirements:**
```python
@router.get("/api/individuals/search")
async def search_individuals(
    q: Optional[str] = Query(None, description="Search query"),
    gender: Optional[str] = Query(None, description="Comma-separated genders"),
    age_min: Optional[int] = Query(None, ge=0, le=120),
    age_max: Optional[int] = Query(None, ge=0, le=120),
    height_min: Optional[int] = Query(None, ge=0, le=300),
    height_max: Optional[int] = Query(None, ge=0, le=300),
    danger_min: Optional[int] = Query(None, ge=0, le=100),
    danger_max: Optional[int] = Query(None, ge=0, le=100),
    has_photo: Optional[bool] = Query(None),
    sort_by: str = Query("danger_score", pattern="^(danger_score|last_seen|name|distance)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    limit: int = Query(10, ge=1, le=20),
    offset: int = Query(0, ge=0, le=100),
    lat: Optional[float] = Query(None, ge=-90, le=90),
    lon: Optional[float] = Query(None, ge=-180, le=180)
):
    # Requirements:
    # 1. All filters use AND logic
    # 2. Age overlap: NOT (ind_max < filter_min OR ind_min > filter_max)
    # 3. Gender uses OR within field (e.g., gender IN ('Male', 'Female'))
    # 4. Text search across name and JSONB data fields
    # 5. Distance calculation if lat/lon provided
    # 6. Return IndividualSummary (no photo_url)
    # 7. Include total count for pagination
```

**Test Cases:**
```python
# Test 1: Search with no filters returns all
# Test 2: Text search finds in name field
# Test 3: Text search finds in JSONB data
# Test 4: Gender filter with single value
# Test 5: Gender filter with multiple values (OR)
# Test 6: Age range overlap logic works correctly
# Test 7: All filters combined with AND logic
# Test 8: Sort by each option works
# Test 9: Distance sort only with coordinates
# Test 10: Pagination limit and offset
# Test 11: Max offset 100 enforced
# Test 12: Response time < 500ms with filters
```

#### Sub-task 3.1.2: Filter Options Endpoint
**Requirements:**
```python
@router.get("/api/search/filters")
async def get_filter_options(user_id: str = Depends(get_current_user)):
    """
    Get dynamic filter options from existing data
    - Cache for 1 hour in memory
    - Refresh if cache empty
    - Extract unique values from database
    - Return min/max for numeric fields
    """
    
    # Cache implementation
    global FILTER_CACHE, CACHE_EXPIRY
    
    if not FILTER_CACHE or datetime.now() > CACHE_EXPIRY:
        # Rebuild cache from database
        # Query unique genders, age ranges, etc.
        FILTER_CACHE = build_filter_cache()
        CACHE_EXPIRY = datetime.now() + timedelta(hours=1)
    
    return FILTER_CACHE
```

**Test Cases:**
```python
# Test 1: Returns all filter options
# Test 2: Gender list includes all unique values
# Test 3: Age range shows actual min/max
# Test 4: Height range shows actual min/max
# Test 5: Cache works for 1 hour
# Test 6: Cache refreshes after expiry
# Test 7: Empty cache triggers rebuild
# Test 8: Response time < 100ms (cached)
# Test 9: Handles empty database gracefully
```

#### Sub-task 3.1.3: Search Performance Optimization
**Requirements:**
- Create necessary database indexes
- Optimize JSONB queries
- Implement query result caching
- Profile slow queries

```sql
-- Required indexes
CREATE INDEX idx_individuals_name_gin ON individuals USING gin(name gin_trgm_ops);
CREATE INDEX idx_individuals_data_gin ON individuals USING gin(data);
CREATE INDEX idx_individuals_gender ON individuals((data->>'gender'));
CREATE INDEX idx_individuals_age_min ON individuals(((data->'approximate_age'->0)::int));
CREATE INDEX idx_individuals_age_max ON individuals(((data->'approximate_age'->1)::int));
CREATE INDEX idx_individuals_has_photo ON individuals((photo_url IS NOT NULL));
CREATE INDEX idx_individuals_danger ON individuals(danger_score);
CREATE INDEX idx_individuals_updated ON individuals(updated_at);
```

**Test Cases:**
```python
# Test 1: Query plan uses indexes
# Test 2: Search with 1000+ records < 500ms
# Test 3: Complex filters < 500ms
# Test 4: No sequential scans on large tables
# Test 5: EXPLAIN ANALYZE shows index usage
```

### Task 3.2: [Dev 2] Legal Compliance

#### Sub-task 3.2.1: Onboarding Screen
**Requirements:**
- Show on first app launch (check AsyncStorage)
- Full-screen modal that cannot be dismissed
- Display legal compliance text:
  ```
  SF Street Team Data Protection Notice
  
  This app collects information about individuals experiencing homelessness
  to provide better support services.
  
  Important Guidelines:
  • Only collect information necessary for service delivery
  • Always obtain verbal consent before taking photos
  • Do not record medical diagnoses or health conditions
  • Do not record criminal history or legal status
  • Do not record immigration or citizenship status
  • Do not record specific racial/ethnic identification
  
  Photo Consent Requirements:
  • Verbal consent must be obtained and confirmed
  • Photos are for identification purposes only
  • Individuals can request photo removal at any time
  
  By proceeding, you acknowledge these guidelines and agree to follow
  San Francisco privacy regulations for vulnerable populations.
  
  [I Understand and Agree]
  ```
- Set flag in AsyncStorage after acknowledgment
- Navigate to main app after agreement

**Test Cases:**
```typescript
// Test 1: Shows on first launch
// Test 2: Does not show if already acknowledged
// Test 3: Cannot be dismissed without agreeing
// Test 4: Legal text displays correctly
// Test 5: AsyncStorage flag set after agreement
// Test 6: Navigates to main app after agreement
// Test 7: Handles AsyncStorage errors gracefully
```

#### Sub-task 3.2.2: Categories Screen Warning
**Requirements:**
- Sticky header with red border warning box
- Warning text always visible when scrolling
- Warning content:
  ```
  ⚠️ Data Protection Notice
  Do not create categories for:
  • Medical diagnoses or health conditions
  • Criminal history or legal status
  • Immigration or citizenship status
  • Specific racial/ethnic identification
  ```
- Warning cannot be dismissed
- Red border and yellow background for visibility

**Test Cases:**
```typescript
// Test 1: Warning displays at top of screen
// Test 2: Warning has red border
// Test 3: Warning has yellow background
// Test 4: Warning stays visible when scrolling
// Test 5: Warning text matches requirements
// Test 6: No dismiss button on warning
// Test 7: Warning responsive to screen sizes
```

## Phase 4 Task Breakdown (Hour 7)

### Task 4.0: [All Devs] Critical Testing & Integration

#### Sub-task 4.0.1: Complete Flow Testing
**Test Scenarios:**
1. **Voice to Profile with Photo**
   ```
   1. Record 30-second audio about individual
   2. Verify transcription includes all required fields
   3. Add photo with consent
   4. Save individual
   5. Search for individual using filters
   6. Verify profile shows all data and photo
   ```

2. **Search with Multiple Filters**
   ```
   1. Navigate to search screen
   2. Expand filters
   3. Set gender = Male
   4. Set age range 40-60
   5. Set has photo = Yes
   6. Verify results match all criteria
   7. Sort by name A-Z
   8. Verify sort order correct
   ```

3. **Photo Update Flow**
   ```
   1. Find existing individual
   2. Update photo from profile
   3. Verify consent required
   4. Verify old photo in history
   5. Verify no new interaction created
   ```

#### Sub-task 4.0.2: Age Display Verification
**Requirements:**
- Verify age displays correctly in all screens:
  - [-1, -1] → "Unknown"
  - [45, 50] → "45-50"
  - Single age estimates properly ranged
- Test age filter overlap logic
- Verify age required in all saves

**Test Cases:**
```typescript
// Test 1: Unknown age displays as "Unknown"
// Test 2: Age range displays as "min-max"
// Test 3: Age filter finds overlapping ranges
// Test 4: Age required validation works
// Test 5: AI extracts age in correct format
```

#### Sub-task 4.0.3: Performance Testing
**Requirements:**
- Search response time < 500ms with filters
- Photo upload < 5 seconds for 5MB file
- Filter options load < 100ms (cached)
- No UI freezing during operations
- Smooth animations at 60fps

**Test Cases:**
```typescript
// Test 1: Measure search response times
// Test 2: Test with 1000+ individuals
// Test 3: Test photo upload with large file
// Test 4: Test filter performance
// Test 5: Profile animations smooth
// Test 6: No memory leaks after extended use
```

#### Sub-task 4.0.4: Error Recovery Testing
**Requirements:**
- Test all failure scenarios:
  - Network offline during save
  - Photo upload timeout
  - Invalid server responses
  - Expired auth tokens
  - Corrupted audio files
- Verify appropriate error messages
- Ensure no data loss
- Test retry mechanisms

**Test Cases:**
```typescript
// Test 1: Offline mode shows clear message
// Test 2: Photo upload retry works (3 attempts)
// Test 3: Save continues without photo on failure
// Test 4: Auth refresh works automatically
// Test 5: Corrupted audio shows error
// Test 6: All errors show user-friendly messages
```

#### Sub-task 4.0.5: Demo Data Creation
**Requirements:**
- Create 5 realistic demo individuals
- Include variety of characteristics:
  - Different ages, genders, danger scores
  - Some with photos, some without
  - Some with photo history
  - Various last seen dates
- Ensure searchable by different criteria
- Include edge cases (Unknown age, etc.)

**Demo Individuals:**
```javascript
1. John Doe - Male, 45-50, 5'10", Medium skin, Danger: 20, Has photo
2. Jane Smith - Female, Unknown age, 5'6", Light skin, Danger: 80, No photo  
3. Robert Johnson - Male, 65-70, 6'0", Dark skin, Danger: 45, Has photo + history
4. Maria Garcia - Female, 30-35, 5'4", Medium skin, Danger: 10, Has photo
5. Unknown Person - Unknown gender, Unknown age, 5'8", Medium skin, Danger: 90, No photo
```

## Critical Success Criteria for Phase 3 & 4

### 1. Search Functionality
- [ ] Live dropdown shows max 10 text-only results
- [ ] 300ms debounce on search input
- [ ] All filters work with AND logic
- [ ] Age filter uses overlap logic correctly
- [ ] Sort by all 4 options works
- [ ] Response time < 500ms with filters

### 2. Filter UI
- [ ] Collapsible section with smooth animation
- [ ] All filter types implemented
- [ ] Active filters show as removable tags
- [ ] Filter options populated from data
- [ ] Clear all filters works
- [ ] Filter count badge shows correctly

### 3. Legal Compliance
- [ ] Onboarding screen shows on first launch
- [ ] Cannot proceed without acknowledgment
- [ ] Categories screen has sticky warning
- [ ] Warning has proper styling (red border)
- [ ] AsyncStorage tracks acknowledgment

### 4. Performance
- [ ] Search < 500ms with multiple filters
- [ ] Filter options cached for 1 hour
- [ ] No deep pagination past offset 100
- [ ] All queries use proper indexes
- [ ] UI remains responsive

### 5. Integration
- [ ] Complete voice → photo → search flow works
- [ ] Age displays correctly everywhere
- [ ] Photo upload failures handled gracefully
- [ ] All error states have messages
- [ ] Demo data created and searchable

## Common Pitfalls to Avoid

1. **Search Performance**: Always use indexes and limit results
2. **Filter Logic**: Remember ALL filters use AND (except OR within gender)
3. **Age Overlap**: Use NOT (ind_max < filter_min OR ind_min > filter_max)
4. **Dropdown Privacy**: Never show photos in search dropdown
5. **Cache Management**: Refresh cache if empty, not just on timer
6. **Legal Compliance**: Cannot skip onboarding screen
7. **Sort Options**: Distance only available with user location

## Integration Test Scenarios

### Scenario 1: First-Time User Flow
```
1. Launch app for first time
2. See onboarding legal screen
3. Must acknowledge to proceed
4. Auto-login with demo credentials
5. Record first individual with photo
6. Search and find using filters
```

### Scenario 2: Power User Search
```
1. Open search screen
2. Type "John" - see dropdown after 300ms
3. Expand filters
4. Set: Male, Age 40-60, Has photo
5. See filtered results with tags
6. Sort by last seen
7. Navigate to profile from results
```

### Scenario 3: Complete Data Flow
```
1. Record audio about individual
2. AI extracts approximate age [45, 50]
3. Take photo with consent
4. Save successfully
5. Search by age range 40-55
6. Find individual in results
7. Update photo from profile
8. See old photo in history
```

## Performance Requirements

- Search endpoint: < 500ms with any filter combination
- Filter options: < 100ms when cached
- Dropdown search: < 300ms for results
- UI animations: 60fps minimum
- Photo operations: Same as Phase 2
- Memory usage: < 200MB in normal operation

## Security Considerations

- Filter queries use parameterized inputs (no SQL injection)
- Search results exclude sensitive data (no photo_url)
- Legal acknowledgment tracked per user
- No deep pagination to prevent data scraping
- Cache cleared on logout

## API Contracts

### Search with Filters Request
```
GET /api/individuals/search?
  q=john&
  gender=Male,Female&
  age_min=40&age_max=60&
  has_photo=true&
  danger_min=20&
  sort_by=last_seen&
  sort_order=desc&
  limit=10&
  offset=0

Headers:
  Authorization: Bearer {token}
```

### Search Response
```json
{
  "individuals": [
    {
      "id": "uuid",
      "name": "John Doe",
      "danger_score": 45,
      "danger_override": null,
      "display_score": 45,
      "last_seen": "2024-01-15T10:30:00Z",
      "last_location": {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "address_abbreviated": "Market St"
      }
    }
  ],
  "total": 156,
  "offset": 0,
  "limit": 10
}
```

### Filter Options Response
```json
{
  "filters": {
    "gender": ["Male", "Female", "Other", "Unknown"],
    "age_range": {"min": 18, "max": 85},
    "height_range": {"min": 48, "max": 84},
    "has_photo": [true, false],
    "danger_score_range": {"min": 0, "max": 100}
  },
  "cached_at": "2024-01-15T10:00:00Z",
  "expires_at": "2024-01-15T11:00:00Z"
}
```

## Completion Checklist

### Phase 3
- [ ] Live search dropdown with debounce
- [ ] Collapsible filter section
- [ ] All filter types working
- [ ] Active filter tags
- [ ] Sort dropdown with 4 options
- [ ] Search endpoint with AND logic
- [ ] Filter options endpoint with cache
- [ ] Database indexes created
- [ ] Onboarding screen implemented
- [ ] Categories warning sticky header
- [ ] Search performance < 500ms

### Phase 4
- [ ] Complete flow tested
- [ ] Age display verified
- [ ] Performance benchmarked
- [ ] Error scenarios tested
- [ ] Demo data created
- [ ] All integrations working
- [ ] Legal compliance verified
- [ ] Ready for deployment

## Development Priority

### Hour 6 (Phase 3)
1. **Dev 1**: Search endpoint with filters, then filter options endpoint
2. **Dev 2**: Onboarding screen, then categories warning
3. **Dev 3**: Search dropdown, then collapsible filters

### Hour 7 (Phase 4)
1. **All**: Integration testing
2. **Dev 1**: Performance optimization
3. **Dev 2**: Error handling polish  
4. **Dev 3**: Demo data and final UI polish