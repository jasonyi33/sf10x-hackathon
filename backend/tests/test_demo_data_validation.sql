-- Test validation queries for demo data
-- Run this after executing 003_demo_data.sql to verify requirements

-- Test 1: Verify 20 individuals exist
SELECT 'Test 1: Individual count' as test_name,
       COUNT(*) as actual,
       20 as expected,
       CASE WHEN COUNT(*) = 20 THEN 'PASS' ELSE 'FAIL' END as result
FROM individuals;

-- Test 2: Verify danger score distribution
SELECT 'Test 2: Danger score distribution' as test_name;
SELECT 
    CASE 
        WHEN COALESCE(danger_override, danger_score) <= 33 THEN 'Low (0-33)'
        WHEN COALESCE(danger_override, danger_score) <= 66 THEN 'Medium (34-66)'
        ELSE 'High (67-100)'
    END as danger_range,
    COUNT(*) as count
FROM individuals
GROUP BY danger_range
ORDER BY danger_range;
-- Expected: ~6 low, ~8 medium, ~6 high

-- Test 3: Verify manual overrides
SELECT 'Test 3: Manual overrides' as test_name,
       COUNT(*) as actual,
       5 as expected,
       CASE WHEN COUNT(*) = 5 THEN 'PASS' ELSE 'FAIL' END as result
FROM individuals 
WHERE danger_override IS NOT NULL;

-- Test 4: Verify auto-triggered scores
SELECT 'Test 4: Auto-triggered scores' as test_name,
       COUNT(*) as actual,
       '>=3' as expected,
       CASE WHEN COUNT(*) >= 3 THEN 'PASS' ELSE 'FAIL' END as result
FROM individuals
WHERE danger_score = 100;

-- Test 5: Verify custom categories
SELECT 'Test 5: Custom categories' as test_name;
SELECT name, type, danger_weight, auto_trigger 
FROM categories 
WHERE is_preset = false
ORDER BY name;
-- Expected: 4 custom categories (housing_priority, medical_conditions, veteran_status, violent_behavior)

-- Test 6: Verify interaction distribution
SELECT 'Test 6: Interaction distribution' as test_name;
SELECT 
    i.name,
    COUNT(int.id) as interaction_count
FROM individuals i
LEFT JOIN interactions int ON i.id = int.individual_id
GROUP BY i.id, i.name
ORDER BY interaction_count;
-- Expected: Each individual has 1-10 interactions

-- Test 7: Verify voice vs manual entries
SELECT 'Test 7: Entry types' as test_name;
SELECT 
    CASE 
        WHEN transcription IS NOT NULL THEN 'Voice'
        ELSE 'Manual'
    END as entry_type,
    COUNT(*) as count
FROM interactions
GROUP BY entry_type;
-- Expected: Mix of both types

-- Test 8: Verify location variety
SELECT 'Test 8: Location variety' as test_name;
SELECT DISTINCT 
    (location->>'address') as location_address
FROM interactions
WHERE location IS NOT NULL
LIMIT 10;
-- Expected: Various SF locations (Market St, Mission, Golden Gate Park, etc.)

-- Test 9: Verify specific individuals exist
SELECT 'Test 9: Specific individuals' as test_name;
SELECT name, danger_score, danger_override 
FROM individuals 
WHERE name IN ('John Doe', 'Sarah Smith', 'Robert Johnson');
-- Expected: John (75), Sarah (20 with override 40), Robert (90)

-- Test 10: Verify all custom fields populated for at least one individual
SELECT 'Test 10: Custom fields usage' as test_name,
       COUNT(DISTINCT i.id) as individuals_with_all_custom_fields,
       '>=1' as expected,
       CASE WHEN COUNT(DISTINCT i.id) >= 1 THEN 'PASS' ELSE 'FAIL' END as result
FROM individuals i
WHERE 
    i.data->>'veteran_status' IS NOT NULL
    AND i.data->>'medical_conditions' IS NOT NULL
    AND i.data->>'housing_priority' IS NOT NULL
    AND i.data->>'violent_behavior' IS NOT NULL;