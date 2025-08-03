-- Task 4.0.5: Create/Update Required Demo Individuals
-- This migration ensures the 5 demo individuals match PRD specifications exactly

-- 1. John Doe - Update to match PRD specs (Male, 45-50, 5'10", Medium skin, Danger: 20, Has photo)
UPDATE individuals SET
  name = 'John Doe',
  data = jsonb_set(
    jsonb_set(
      jsonb_set(data, '{approximate_age}', '[45, 50]'::jsonb),
      '{skin_color}', '"Medium"'::jsonb
    ),
    '{height}', '70'::jsonb  -- 5'10" = 70 inches
  ),
  danger_score = 20,
  danger_override = NULL,
  photo_url = NULL,  -- No initial photo, will upload during demo
  updated_at = NOW()
WHERE id = '550e8400-e29b-41d4-a716-446655440007';

-- 2. Jane Smith - Create new with Unknown age (Female, Unknown age, 5'6", Light skin, Danger: 80, No photo)
INSERT INTO individuals (id, name, data, danger_score, danger_override, photo_url, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440101',
  'Jane Smith',
  jsonb_build_object(
    'gender', 'Female',
    'approximate_age', '[-1, -1]'::jsonb,  -- Unknown age
    'height', 66,  -- 5'6"
    'weight', 140,
    'skin_color', 'Light',
    'substance_abuse_history', '["Unknown"]'::jsonb,
    'medical_conditions', '["Unknown"]'::jsonb
  ),
  80,
  NULL,
  NULL,  -- No photo
  '2024-01-02T10:00:00Z',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  data = EXCLUDED.data,
  danger_score = EXCLUDED.danger_score,
  photo_url = EXCLUDED.photo_url,
  updated_at = NOW();

-- 3. Robert Johnson - Update to match PRD specs (Male, 65-70, 6'0", Dark skin, Danger: 45, Has photo + history)
UPDATE individuals SET
  data = jsonb_set(
    jsonb_set(
      jsonb_set(data, '{approximate_age}', '[65, 70]'::jsonb),
      '{height}', '72'::jsonb  -- 6'0" = 72 inches
    ),
    '{skin_color}', '"Dark"'::jsonb
  ),
  danger_score = 45,
  danger_override = NULL,
  photo_url = NULL,  -- No initial photo, will upload during demo
  updated_at = NOW()
WHERE id = '550e8400-e29b-41d4-a716-446655440009';

-- 4. Maria Garcia - Update to match PRD specs (Female, 30-35, 5'4", Medium skin, Danger: 10, Has photo)
UPDATE individuals SET
  data = jsonb_set(
    jsonb_set(
      jsonb_set(data, '{approximate_age}', '[30, 35]'::jsonb),
      '{height}', '64'::jsonb  -- 5'4" = 64 inches
    ),
    '{skin_color}', '"Medium"'::jsonb
  ),
  danger_score = 10,
  danger_override = NULL,
  photo_url = NULL,  -- No initial photo, will upload during demo
  updated_at = NOW()
WHERE id = '550e8400-e29b-41d4-a716-446655440008';

-- 5. Unknown Person - Create new (Unknown gender, Unknown age, 5'8", Medium skin, Danger: 90, No photo)
INSERT INTO individuals (id, name, data, danger_score, danger_override, photo_url, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440102',
  'Unknown Person',
  jsonb_build_object(
    'gender', 'Unknown',
    'approximate_age', '[-1, -1]'::jsonb,  -- Unknown age
    'height', 68,  -- 5'8"
    'weight', 160,
    'skin_color', 'Medium',
    'substance_abuse_history', '["Unknown"]'::jsonb,
    'medical_conditions', '["Unknown"]'::jsonb,
    'housing_status', 'Unknown'
  ),
  90,
  NULL,
  NULL,  -- No photo
  '2024-01-05T10:00:00Z',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  data = EXCLUDED.data,
  danger_score = EXCLUDED.danger_score,
  photo_url = EXCLUDED.photo_url,
  updated_at = NOW();

-- Photo history for Robert Johnson will be created during demo when photos are uploaded

-- Add interactions for all 5 demo individuals to ensure they have history
-- John Doe interactions
INSERT INTO interactions (individual_id, user_id, transcription, data, location, created_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440007',
   '550e8400-e29b-41d4-a716-446655440999',
   'Met John near Market Street. About 45 years old, 5 feet 10 inches tall, maybe 180 pounds. Medium skin tone. Shows signs of moderate substance abuse, been on streets 3 months. Needs diabetes medication.',
   '{"location": "Market Street", "needs": "Diabetes medication", "time_on_streets": "3 months"}'::jsonb,
   '{"latitude": 37.7749, "longitude": -122.4194, "address": "Market St & 5th Ave, SF"}'::jsonb,
   '2024-01-15T10:30:00Z')
ON CONFLICT DO NOTHING;

-- Jane Smith interactions  
INSERT INTO interactions (individual_id, user_id, transcription, data, location, created_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440101',
   '550e8400-e29b-41d4-a716-446655440999',
   'Found Jane at the library. Female, age unknown, about 5 feet 6 inches, light skin. Very guarded about personal information. High risk individual, seems paranoid.',
   '{"location": "Public Library", "behavior": "Guarded, paranoid"}'::jsonb,
   '{"latitude": 37.7793, "longitude": -122.4193, "address": "SF Public Library"}'::jsonb,
   '2024-01-16T14:20:00Z')
ON CONFLICT DO NOTHING;

-- Robert Johnson interactions (multiple for photo history)
INSERT INTO interactions (individual_id, user_id, transcription, data, location, created_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440009',
   '550e8400-e29b-41d4-a716-446655440999',
   'Robert at Golden Gate Park. Male, 65-70 years old, 6 feet tall, about 200 pounds. Dark skin. Veteran, needs medical attention for chronic pain.',
   '{"location": "Golden Gate Park", "veteran_status": "Yes", "medical_needs": "Chronic pain treatment"}'::jsonb,
   '{"latitude": 37.7694, "longitude": -122.4862, "address": "Golden Gate Park, SF"}'::jsonb,
   '2024-01-17T09:15:00Z')
ON CONFLICT DO NOTHING;

-- Maria Garcia interactions
INSERT INTO interactions (individual_id, user_id, transcription, data, location, created_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440008',
   '550e8400-e29b-41d4-a716-446655440999',
   'Maria seeking housing assistance. Female, early 30s, 5 feet 4 inches, medium skin tone. Very low danger score, just needs help with housing applications.',
   '{"location": "City Hall", "needs": "Housing assistance", "danger_assessment": "Very low risk"}'::jsonb,
   '{"latitude": 37.7793, "longitude": -122.4193, "address": "City Hall, SF"}'::jsonb,
   '2024-01-18T11:45:00Z')
ON CONFLICT DO NOTHING;

-- Unknown Person interactions
INSERT INTO interactions (individual_id, user_id, transcription, data, location, created_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440102',
   '550e8400-e29b-41d4-a716-446655440999',
   'Individual in Tenderloin area. Cannot determine gender or age. About 5 feet 8 inches, medium skin. Extremely high risk, aggressive behavior, refused all assistance.',
   '{"location": "Tenderloin", "behavior": "Aggressive, non-cooperative", "assistance_refused": true}'::jsonb,
   '{"latitude": 37.7840, "longitude": -122.4140, "address": "Tenderloin District, SF"}'::jsonb,
   '2024-01-19T16:30:00Z')
ON CONFLICT DO NOTHING;

-- Verify the demo data
DO $$
DECLARE
  john_check RECORD;
  jane_check RECORD;
  robert_check RECORD;
  maria_check RECORD;
  unknown_check RECORD;
BEGIN
  -- Check John Doe
  SELECT name, danger_score, data->>'gender' as gender, data->'approximate_age' as age, 
         data->>'height' as height, data->>'skin_color' as skin_color, photo_url IS NOT NULL as has_photo
  INTO john_check
  FROM individuals WHERE name = 'John Doe' LIMIT 1;
  
  ASSERT john_check.danger_score = 20, 'John Doe danger score should be 20';
  ASSERT john_check.age = '[45, 50]', 'John Doe age should be [45, 50]';
  ASSERT john_check.skin_color = 'Medium', 'John Doe skin color should be Medium';
  -- Photo will be added during demo
  -- ASSERT john_check.has_photo = true, 'John Doe should have photo';
  
  -- Check Jane Smith
  SELECT name, danger_score, data->>'gender' as gender, data->'approximate_age' as age,
         data->>'height' as height, data->>'skin_color' as skin_color, photo_url IS NOT NULL as has_photo
  INTO jane_check
  FROM individuals WHERE name = 'Jane Smith' AND data->'approximate_age' = '[-1, -1]'::jsonb LIMIT 1;
  
  ASSERT jane_check IS NOT NULL, 'Jane Smith with unknown age should exist';
  ASSERT jane_check.danger_score = 80, 'Jane Smith danger score should be 80';
  ASSERT jane_check.age = '[-1, -1]', 'Jane Smith age should be [-1, -1] (unknown)';
  ASSERT jane_check.has_photo = false, 'Jane Smith should not have photo';
  
  -- Check Robert Johnson
  SELECT name, danger_score, data->'approximate_age' as age, photo_url IS NOT NULL as has_photo
  INTO robert_check
  FROM individuals WHERE name = 'Robert Johnson' AND danger_score = 45 LIMIT 1;
  
  ASSERT robert_check IS NOT NULL, 'Robert Johnson with danger score 45 should exist';
  ASSERT robert_check.age = '[65, 70]', 'Robert Johnson age should be [65, 70]';
  
  -- Check Maria Garcia  
  SELECT name, danger_score, data->'approximate_age' as age
  INTO maria_check
  FROM individuals WHERE name = 'Maria Garcia' AND danger_score = 10 LIMIT 1;
  
  ASSERT maria_check IS NOT NULL, 'Maria Garcia with danger score 10 should exist';
  ASSERT maria_check.age = '[30, 35]', 'Maria Garcia age should be [30, 35]';
  
  -- Check Unknown Person
  SELECT name, danger_score, data->>'gender' as gender, data->'approximate_age' as age
  INTO unknown_check
  FROM individuals WHERE name = 'Unknown Person' LIMIT 1;
  
  ASSERT unknown_check IS NOT NULL, 'Unknown Person should exist';
  ASSERT unknown_check.gender = 'Unknown', 'Unknown Person gender should be Unknown';
  ASSERT unknown_check.age = '[-1, -1]', 'Unknown Person age should be [-1, -1]';
  ASSERT unknown_check.danger_score = 90, 'Unknown Person danger score should be 90';
  
  RAISE NOTICE 'All 5 demo individuals verified successfully!';
END $$;