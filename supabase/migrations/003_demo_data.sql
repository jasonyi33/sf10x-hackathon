-- Demo data for SF Homeless Outreach Voice Transcription App
-- Task 6.1: Create demo data with 20 individuals and varied profiles

-- Step 1: Insert custom categories
INSERT INTO categories (name, type, is_required, is_preset, priority, danger_weight, auto_trigger, options) VALUES
('veteran_status', 'single_select', false, false, 'high', 20, false,
 '[{"label": "Yes", "value": 1}, {"label": "No", "value": 0}, {"label": "Unknown", "value": 0}]'::jsonb),
('medical_conditions', 'multi_select', false, false, 'high', 0, false,
 '["Diabetes", "Heart Disease", "Mental Health", "Mobility Issues", "Chronic Pain", "None"]'::jsonb),
('housing_priority', 'single_select', false, false, 'high', 30, false,
 '[{"label": "Critical", "value": 1}, {"label": "High", "value": 0.7}, {"label": "Medium", "value": 0.4}, {"label": "Low", "value": 0.1}]'::jsonb),
('violent_behavior', 'single_select', false, false, 'high', 40, true,
 '[{"label": "None", "value": 0}, {"label": "Verbal Only", "value": 0.3}, {"label": "Physical", "value": 1}]'::jsonb);

-- Step 2: Insert 20 individuals
-- First, the 3 specific individuals mentioned
INSERT INTO individuals (id, name, data, danger_score, danger_override, created_at, updated_at) VALUES
-- John Doe - danger score 75
('550e8400-e29b-41d4-a716-446655440001'::uuid, 'John Doe', 
 jsonb_build_object(
    'height', 72,
    'weight', 180,
    'skin_color', 'Light',
    'gender', 'Male',
    'veteran_status', 'Yes',
    'housing_priority', 'High',
    'substance_abuse_history', ARRAY['Moderate']
 ),
 75, NULL, NOW() - INTERVAL '30 days', NOW() - INTERVAL '2 days'),

-- Sarah Smith - danger score 20, override 40
('550e8400-e29b-41d4-a716-446655440002'::uuid, 'Sarah Smith',
 jsonb_build_object(
    'height', 64,
    'weight', 130,
    'skin_color', 'Dark',
    'gender', 'Female',
    'substance_abuse_history', ARRAY['In Recovery'],
    'housing_priority', 'Medium'
 ),
 20, 40, NOW() - INTERVAL '45 days', NOW() - INTERVAL '1 day'),

-- Robert Johnson - danger score 90
('550e8400-e29b-41d4-a716-446655440003'::uuid, 'Robert Johnson',
 jsonb_build_object(
    'height', 70,
    'weight', 200,
    'skin_color', 'Medium',
    'gender', 'Male',
    'veteran_status', 'Yes',
    'violent_behavior', 'Physical',
    'medical_conditions', ARRAY['Mental Health', 'Chronic Pain']
 ),
 90, NULL, NOW() - INTERVAL '60 days', NOW() - INTERVAL '3 days'),

-- Additional 17 individuals with varied profiles
-- Individual 4: Low danger, manual override
('550e8400-e29b-41d4-a716-446655440004'::uuid, 'Maria Garcia',
 jsonb_build_object(
    'height', 62,
    'weight', 115,
    'skin_color', 'Medium',
    'gender', 'Female',
    'housing_priority', 'Low',
    'substance_abuse_history', ARRAY['None']
 ),
 15, 25, NOW() - INTERVAL '20 days', NOW() - INTERVAL '5 days'),

-- Individual 5: Auto-triggered danger (violent_behavior = Physical)
('550e8400-e29b-41d4-a716-446655440005'::uuid, 'Michael Chen',
 jsonb_build_object(
    'height', 68,
    'weight', 160,
    'skin_color', 'Light',
    'gender', 'Male',
    'violent_behavior', 'Physical',
    'medical_conditions', ARRAY['Mental Health']
 ),
 100, NULL, NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 day'),

-- Individual 6: Medium danger
('550e8400-e29b-41d4-a716-446655440006'::uuid, 'Linda Williams',
 jsonb_build_object(
    'height', 66,
    'weight', 140,
    'skin_color', 'Dark',
    'gender', 'Female',
    'veteran_status', 'No',
    'housing_priority', 'Medium',
    'substance_abuse_history', ARRAY['Mild']
 ),
 45, NULL, NOW() - INTERVAL '35 days', NOW() - INTERVAL '7 days'),

-- Individual 7: High danger with override
('550e8400-e29b-41d4-a716-446655440007'::uuid, 'James Wilson',
 jsonb_build_object(
    'height', 74,
    'weight', 190,
    'skin_color', 'Light',
    'gender', 'Male',
    'violent_behavior', 'Verbal Only',
    'housing_priority', 'High'
 ),
 85, 60, NOW() - INTERVAL '25 days', NOW() - INTERVAL '2 days'),

-- Individual 8: Low danger
('550e8400-e29b-41d4-a716-446655440008'::uuid, 'Patricia Brown',
 jsonb_build_object(
    'height', 60,
    'weight', 125,
    'skin_color', 'Medium',
    'gender', 'Female',
    'substance_abuse_history', ARRAY['None'],
    'medical_conditions', ARRAY['Diabetes']
 ),
 10, NULL, NOW() - INTERVAL '40 days', NOW() - INTERVAL '10 days'),

-- Individual 9: Auto-triggered (violent_behavior)
('550e8400-e29b-41d4-a716-446655440009'::uuid, 'David Martinez',
 jsonb_build_object(
    'height', 71,
    'weight', 175,
    'skin_color', 'Medium',
    'gender', 'Male',
    'violent_behavior', 'Physical',
    'veteran_status', 'Yes',
    'medical_conditions', ARRAY['Mental Health', 'Mobility Issues'],
    'housing_priority', 'Critical'
 ),
 100, NULL, NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),

-- Individual 10: Medium danger with all custom fields
('550e8400-e29b-41d4-a716-446655440010'::uuid, 'Jennifer Davis',
 jsonb_build_object(
    'height', 65,
    'weight', 135,
    'skin_color', 'Light',
    'gender', 'Female',
    'veteran_status', 'No',
    'medical_conditions', ARRAY['Heart Disease', 'Chronic Pain'],
    'housing_priority', 'Medium',
    'violent_behavior', 'None',
    'substance_abuse_history', ARRAY['Moderate', 'In Recovery']
 ),
 50, NULL, NOW() - INTERVAL '22 days', NOW() - INTERVAL '4 days'),

-- Individual 11: High danger
('550e8400-e29b-41d4-a716-446655440011'::uuid, 'Christopher Lee',
 jsonb_build_object(
    'height', 69,
    'weight', 155,
    'skin_color', 'Medium',
    'gender', 'Male',
    'housing_priority', 'High',
    'violent_behavior', 'Verbal Only'
 ),
 70, NULL, NOW() - INTERVAL '18 days', NOW() - INTERVAL '3 days'),

-- Individual 12: Low danger with override
('550e8400-e29b-41d4-a716-446655440012'::uuid, 'Nancy Taylor',
 jsonb_build_object(
    'height', 63,
    'weight', 120,
    'skin_color', 'Dark',
    'gender', 'Female',
    'substance_abuse_history', ARRAY['None']
 ),
 5, 15, NOW() - INTERVAL '50 days', NOW() - INTERVAL '12 days'),

-- Individual 13: Auto-triggered
('550e8400-e29b-41d4-a716-446655440013'::uuid, 'Kevin Anderson',
 jsonb_build_object(
    'height', 73,
    'weight', 185,
    'skin_color', 'Light',
    'gender', 'Male',
    'violent_behavior', 'Physical',
    'substance_abuse_history', ARRAY['Severe']
 ),
 100, NULL, NOW() - INTERVAL '8 days', NOW() - INTERVAL '1 day'),

-- Individual 14: Medium danger
('550e8400-e29b-41d4-a716-446655440014'::uuid, 'Barbara Thomas',
 jsonb_build_object(
    'height', 61,
    'weight', 110,
    'skin_color', 'Medium',
    'gender', 'Female',
    'veteran_status', 'Unknown',
    'housing_priority', 'Low',
    'medical_conditions', ARRAY['None']
 ),
 35, NULL, NOW() - INTERVAL '28 days', NOW() - INTERVAL '6 days'),

-- Individual 15: High danger
('550e8400-e29b-41d4-a716-446655440015'::uuid, 'Daniel Rodriguez',
 jsonb_build_object(
    'height', 72,
    'weight', 170,
    'skin_color', 'Dark',
    'gender', 'Male',
    'housing_priority', 'Critical',
    'violent_behavior', 'Verbal Only',
    'medical_conditions', ARRAY['Mental Health']
 ),
 80, NULL, NOW() - INTERVAL '12 days', NOW() - INTERVAL '2 days'),

-- Individual 16: Low danger
('550e8400-e29b-41d4-a716-446655440016'::uuid, 'Lisa White',
 jsonb_build_object(
    'height', 64,
    'weight', 128,
    'skin_color', 'Light',
    'gender', 'Female',
    'substance_abuse_history', ARRAY['In Recovery']
 ),
 20, NULL, NOW() - INTERVAL '33 days', NOW() - INTERVAL '8 days'),

-- Individual 17: Medium danger
('550e8400-e29b-41d4-a716-446655440017'::uuid, 'Mark Harris',
 jsonb_build_object(
    'height', 70,
    'weight', 165,
    'skin_color', 'Medium',
    'gender', 'Male',
    'veteran_status', 'Yes',
    'housing_priority', 'Medium'
 ),
 55, NULL, NOW() - INTERVAL '24 days', NOW() - INTERVAL '5 days'),

-- Individual 18: High danger with override
('550e8400-e29b-41d4-a716-446655440018'::uuid, 'Sandra Clark',
 jsonb_build_object(
    'height', 62,
    'weight', 118,
    'skin_color', 'Dark',
    'gender', 'Female',
    'violent_behavior', 'None',
    'medical_conditions', ARRAY['Diabetes', 'Heart Disease']
 ),
 65, 50, NOW() - INTERVAL '16 days', NOW() - INTERVAL '3 days'),

-- Individual 19: Low danger
('550e8400-e29b-41d4-a716-446655440019'::uuid, 'Paul Lewis',
 jsonb_build_object(
    'height', 68,
    'weight', 150,
    'skin_color', 'Light',
    'gender', 'Male',
    'substance_abuse_history', ARRAY['Mild']
 ),
 25, NULL, NOW() - INTERVAL '38 days', NOW() - INTERVAL '9 days'),

-- Individual 20: Medium danger
('550e8400-e29b-41d4-a716-446655440020'::uuid, 'Amy Walker',
 jsonb_build_object(
    'height', 66,
    'weight', 132,
    'skin_color', 'Medium',
    'gender', 'Female',
    'veteran_status', 'No',
    'housing_priority', 'High',
    'medical_conditions', ARRAY['Mobility Issues']
 ),
 60, NULL, NOW() - INTERVAL '14 days', NOW() - INTERVAL '2 days');

-- Step 3: Insert interactions for each individual (1-10 per person)
-- Using a mix of voice entries (with transcription) and manual entries
-- Varied locations across SF

-- For John Doe (3 interactions)
INSERT INTO interactions (individual_id, user_id, transcription, data, location, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-0000-0000-0000-000000000001'::uuid,
 'Met John near Market Street. About 45 years old, 6 feet tall, maybe 180 pounds. Light skin. Shows signs of moderate substance abuse, been on streets 3 months. Needs diabetes medication.',
 '{"height": 72, "weight": 180, "skin_color": "Light", "substance_abuse_history": ["Moderate"]}'::jsonb,
 '{"latitude": 37.7749, "longitude": -122.4194, "address": "Market Street & 5th St, San Francisco, CA 94103"}'::jsonb,
 NOW() - INTERVAL '30 days'),
 
('550e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-0000-0000-0000-000000000002'::uuid,
 NULL,
 '{"veteran_status": "Yes", "housing_priority": "High"}'::jsonb,
 '{"latitude": 37.7751, "longitude": -122.4180, "address": "UN Plaza, San Francisco, CA 94102"}'::jsonb,
 NOW() - INTERVAL '20 days'),
 
('550e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-0000-0000-0000-000000000001'::uuid,
 NULL,
 '{}'::jsonb,
 '{"latitude": 37.7749, "longitude": -122.4194, "address": "Market Street & Powell St, San Francisco, CA 94102"}'::jsonb,
 NOW() - INTERVAL '2 days');

-- For Sarah Smith (5 interactions)
INSERT INTO interactions (individual_id, user_id, transcription, data, location, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-0000-0000-0000-000000000001'::uuid,
 'Sarah by the library, approximately 35, 5 foot 4, 120 pounds, dark skin. Says she''s in recovery, looking for shelter. Has two children staying with relatives.',
 '{"height": 64, "weight": 130, "skin_color": "Dark", "substance_abuse_history": ["In Recovery"]}'::jsonb,
 '{"latitude": 37.7790, "longitude": -122.4148, "address": "Main Library, 100 Larkin St, San Francisco, CA 94102"}'::jsonb,
 NOW() - INTERVAL '45 days'),
 
('550e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-0000-0000-0000-000000000002'::uuid,
 NULL,
 '{"housing_priority": "Medium"}'::jsonb,
 '{"latitude": 37.7790, "longitude": -122.4148, "address": "Civic Center, San Francisco, CA 94102"}'::jsonb,
 NOW() - INTERVAL '35 days'),
 
('550e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-0000-0000-0000-000000000001'::uuid,
 'Sarah still at the library area. Doing better, still in recovery program.',
 '{}'::jsonb,
 '{"latitude": 37.7790, "longitude": -122.4148, "address": "Civic Center Plaza, San Francisco, CA 94102"}'::jsonb,
 NOW() - INTERVAL '25 days'),
 
('550e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-0000-0000-0000-000000000003'::uuid,
 NULL,
 '{}'::jsonb,
 '{"latitude": 37.7790, "longitude": -122.4148, "address": "United Nations Plaza, San Francisco, CA 94102"}'::jsonb,
 NOW() - INTERVAL '15 days'),
 
('550e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-0000-0000-0000-000000000001'::uuid,
 NULL,
 '{}'::jsonb,
 '{"latitude": 37.7790, "longitude": -122.4148, "address": "Civic Center, San Francisco, CA 94102"}'::jsonb,
 NOW() - INTERVAL '1 day');

-- For Robert Johnson (2 interactions)
INSERT INTO interactions (individual_id, user_id, transcription, data, location, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440003'::uuid, '550e8400-0000-0000-0000-000000000001'::uuid,
 'Robert at Golden Gate Park. 55 years old, 5 foot 10, 200 pounds, medium skin tone. Veteran, mild substance issues. Applied for housing last week.',
 '{"height": 70, "weight": 200, "skin_color": "Medium", "veteran_status": "Yes"}'::jsonb,
 '{"latitude": 37.7694, "longitude": -122.4862, "address": "Golden Gate Park, San Francisco, CA 94118"}'::jsonb,
 NOW() - INTERVAL '60 days'),
 
('550e8400-e29b-41d4-a716-446655440003'::uuid, '550e8400-0000-0000-0000-000000000002'::uuid,
 NULL,
 '{"violent_behavior": "Physical", "medical_conditions": ["Mental Health", "Chronic Pain"]}'::jsonb,
 '{"latitude": 37.7694, "longitude": -122.4862, "address": "Golden Gate Park, Haight St Entrance, San Francisco, CA 94117"}'::jsonb,
 NOW() - INTERVAL '3 days');

-- Continue with varied interactions for remaining individuals...
-- Maria Garcia (1 interaction)
INSERT INTO interactions (individual_id, user_id, transcription, data, location, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440004'::uuid, '550e8400-0000-0000-0000-000000000001'::uuid,
 NULL,
 '{"height": 62, "weight": 115, "skin_color": "Medium", "housing_priority": "Low", "substance_abuse_history": ["None"]}'::jsonb,
 '{"latitude": 37.7599, "longitude": -122.4148, "address": "Mission District, 16th St, San Francisco, CA 94103"}'::jsonb,
 NOW() - INTERVAL '20 days');

-- Michael Chen (4 interactions)
INSERT INTO interactions (individual_id, user_id, transcription, data, location, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440005'::uuid, '550e8400-0000-0000-0000-000000000002'::uuid,
 'Found Michael in distress near SOMA. Aggressive behavior reported. Asian male, about 5''8", 160 lbs.',
 '{"height": 68, "weight": 160, "skin_color": "Light", "violent_behavior": "Physical"}'::jsonb,
 '{"latitude": 37.7785, "longitude": -122.4056, "address": "SOMA, 3rd St & Howard St, San Francisco, CA 94103"}'::jsonb,
 NOW() - INTERVAL '15 days'),
 
('550e8400-e29b-41d4-a716-446655440005'::uuid, '550e8400-0000-0000-0000-000000000003'::uuid,
 NULL,
 '{"medical_conditions": ["Mental Health"]}'::jsonb,
 '{"latitude": 37.7785, "longitude": -122.4056, "address": "SOMA District, San Francisco, CA 94103"}'::jsonb,
 NOW() - INTERVAL '10 days'),
 
('550e8400-e29b-41d4-a716-446655440005'::uuid, '550e8400-0000-0000-0000-000000000001'::uuid,
 'Michael still showing aggressive tendencies. Needs immediate mental health intervention.',
 '{}'::jsonb,
 '{"latitude": 37.7785, "longitude": -122.4056, "address": "South of Market, San Francisco, CA 94103"}'::jsonb,
 NOW() - INTERVAL '5 days'),
 
('550e8400-e29b-41d4-a716-446655440005'::uuid, '550e8400-0000-0000-0000-000000000002'::uuid,
 NULL,
 '{}'::jsonb,
 '{"latitude": 37.7785, "longitude": -122.4056, "address": "SOMA, San Francisco, CA 94103"}'::jsonb,
 NOW() - INTERVAL '1 day');

-- Linda Williams (3 interactions)
INSERT INTO interactions (individual_id, user_id, transcription, data, location, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440006'::uuid, '550e8400-0000-0000-0000-000000000001'::uuid,
 NULL,
 '{"height": 66, "weight": 140, "skin_color": "Dark", "veteran_status": "No", "housing_priority": "Medium"}'::jsonb,
 '{"latitude": 37.7837, "longitude": -122.4089, "address": "Tenderloin, Turk St, San Francisco, CA 94102"}'::jsonb,
 NOW() - INTERVAL '35 days'),
 
('550e8400-e29b-41d4-a716-446655440006'::uuid, '550e8400-0000-0000-0000-000000000002'::uuid,
 'Linda near the Tenderloin. African American woman, mid-40s, mild substance use.',
 '{"substance_abuse_history": ["Mild"]}'::jsonb,
 '{"latitude": 37.7837, "longitude": -122.4089, "address": "Tenderloin District, San Francisco, CA 94109"}'::jsonb,
 NOW() - INTERVAL '20 days'),
 
('550e8400-e29b-41d4-a716-446655440006'::uuid, '550e8400-0000-0000-0000-000000000003'::uuid,
 NULL,
 '{}'::jsonb,
 '{"latitude": 37.7837, "longitude": -122.4089, "address": "Tenderloin, Hyde St, San Francisco, CA 94109"}'::jsonb,
 NOW() - INTERVAL '7 days');

-- Continue pattern for remaining individuals with varying numbers of interactions
-- Each individual gets 1-10 interactions with mix of voice/manual entries
-- Locations include: Market St, Mission District, Golden Gate Park, Tenderloin, SOMA, Haight-Ashbury, Civic Center

-- Adding more interactions to ensure variety...
-- James Wilson (2 interactions)
INSERT INTO interactions (individual_id, user_id, transcription, data, location, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440007'::uuid, '550e8400-0000-0000-0000-000000000001'::uuid,
 NULL,
 '{"height": 74, "weight": 190, "skin_color": "Light", "violent_behavior": "Verbal Only", "housing_priority": "High"}'::jsonb,
 '{"latitude": 37.7618, "longitude": -122.4345, "address": "Haight-Ashbury, Haight St, San Francisco, CA 94117"}'::jsonb,
 NOW() - INTERVAL '25 days'),
 
('550e8400-e29b-41d4-a716-446655440007'::uuid, '550e8400-0000-0000-0000-000000000002'::uuid,
 'James getting verbally aggressive when approached. Tall white male, over 6 feet.',
 '{}'::jsonb,
 '{"latitude": 37.7618, "longitude": -122.4345, "address": "Haight Street, San Francisco, CA 94117"}'::jsonb,
 NOW() - INTERVAL '2 days');

-- Patricia Brown (1 interaction)
INSERT INTO interactions (individual_id, user_id, transcription, data, location, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440008'::uuid, '550e8400-0000-0000-0000-000000000003'::uuid,
 NULL,
 '{"height": 60, "weight": 125, "skin_color": "Medium", "substance_abuse_history": ["None"], "medical_conditions": ["Diabetes"]}'::jsonb,
 '{"latitude": 37.7599, "longitude": -122.4148, "address": "Mission & 24th St, San Francisco, CA 94110"}'::jsonb,
 NOW() - INTERVAL '40 days');

-- Add remaining interactions to ensure each individual has at least 1 interaction
-- (For brevity, adding minimal interactions for remaining individuals)

INSERT INTO interactions (individual_id, user_id, transcription, data, location, created_at) VALUES
-- David Martinez (3 interactions with auto-trigger)
('550e8400-e29b-41d4-a716-446655440009'::uuid, '550e8400-0000-0000-0000-000000000001'::uuid,
 'David showing violent behavior. Hispanic male, veteran with mobility issues.',
 '{"height": 71, "weight": 175, "skin_color": "Medium", "violent_behavior": "Physical", "veteran_status": "Yes"}'::jsonb,
 '{"latitude": 37.7749, "longitude": -122.4194, "address": "Market & Van Ness, San Francisco, CA 94102"}'::jsonb,
 NOW() - INTERVAL '10 days'),

('550e8400-e29b-41d4-a716-446655440009'::uuid, '550e8400-0000-0000-0000-000000000002'::uuid,
 NULL,
 '{"medical_conditions": ["Mental Health", "Mobility Issues"], "housing_priority": "Critical"}'::jsonb,
 '{"latitude": 37.7749, "longitude": -122.4194, "address": "Market Street, San Francisco, CA 94102"}'::jsonb,
 NOW() - INTERVAL '5 days'),

('550e8400-e29b-41d4-a716-446655440009'::uuid, '550e8400-0000-0000-0000-000000000003'::uuid,
 NULL,
 '{}'::jsonb,
 '{"latitude": 37.7749, "longitude": -122.4194, "address": "Market & Montgomery, San Francisco, CA 94104"}'::jsonb,
 NOW() - INTERVAL '1 day'),

-- Jennifer Davis (2 interactions - has all custom fields)
('550e8400-e29b-41d4-a716-446655440010'::uuid, '550e8400-0000-0000-0000-000000000001'::uuid,
 NULL,
 '{"height": 65, "weight": 135, "skin_color": "Light", "veteran_status": "No", "medical_conditions": ["Heart Disease", "Chronic Pain"]}'::jsonb,
 '{"latitude": 37.7694, "longitude": -122.4862, "address": "Golden Gate Park, Stow Lake, San Francisco, CA 94118"}'::jsonb,
 NOW() - INTERVAL '22 days'),

('550e8400-e29b-41d4-a716-446655440010'::uuid, '550e8400-0000-0000-0000-000000000002'::uuid,
 'Jennifer needs medical attention. Female, mid-30s, has heart condition.',
 '{"housing_priority": "Medium", "violent_behavior": "None", "substance_abuse_history": ["Moderate", "In Recovery"]}'::jsonb,
 '{"latitude": 37.7694, "longitude": -122.4862, "address": "Golden Gate Park, San Francisco, CA 94122"}'::jsonb,
 NOW() - INTERVAL '4 days');

-- Add at least one interaction for each remaining individual
INSERT INTO interactions (individual_id, user_id, transcription, data, location, created_at) VALUES
-- Christopher Lee
('550e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-0000-0000-0000-000000000001'::uuid,
 NULL,
 '{"height": 69, "weight": 155, "skin_color": "Medium", "housing_priority": "High", "violent_behavior": "Verbal Only"}'::jsonb,
 '{"latitude": 37.7837, "longitude": -122.4089, "address": "Tenderloin, Ellis St, San Francisco, CA 94109"}'::jsonb,
 NOW() - INTERVAL '18 days'),

-- Nancy Taylor
('550e8400-e29b-41d4-a716-446655440012'::uuid, '550e8400-0000-0000-0000-000000000002'::uuid,
 NULL,
 '{"height": 63, "weight": 120, "skin_color": "Dark", "substance_abuse_history": ["None"]}'::jsonb,
 '{"latitude": 37.7599, "longitude": -122.4148, "address": "Mission District, Valencia St, San Francisco, CA 94110"}'::jsonb,
 NOW() - INTERVAL '50 days'),

-- Kevin Anderson (auto-triggered)
('550e8400-e29b-41d4-a716-446655440013'::uuid, '550e8400-0000-0000-0000-000000000003'::uuid,
 'Kevin extremely violent, had to call police. White male, large build.',
 '{"height": 73, "weight": 185, "skin_color": "Light", "violent_behavior": "Physical", "substance_abuse_history": ["Severe"]}'::jsonb,
 '{"latitude": 37.7785, "longitude": -122.4056, "address": "SOMA, 6th St, San Francisco, CA 94103"}'::jsonb,
 NOW() - INTERVAL '8 days'),

-- Barbara Thomas
('550e8400-e29b-41d4-a716-446655440014'::uuid, '550e8400-0000-0000-0000-000000000001'::uuid,
 NULL,
 '{"height": 61, "weight": 110, "skin_color": "Medium", "veteran_status": "Unknown", "housing_priority": "Low", "medical_conditions": ["None"]}'::jsonb,
 '{"latitude": 37.7790, "longitude": -122.4148, "address": "Civic Center, San Francisco, CA 94102"}'::jsonb,
 NOW() - INTERVAL '28 days'),

-- Daniel Rodriguez
('550e8400-e29b-41d4-a716-446655440015'::uuid, '550e8400-0000-0000-0000-000000000002'::uuid,
 NULL,
 '{"height": 72, "weight": 170, "skin_color": "Dark", "housing_priority": "Critical", "violent_behavior": "Verbal Only", "medical_conditions": ["Mental Health"]}'::jsonb,
 '{"latitude": 37.7618, "longitude": -122.4345, "address": "Haight-Ashbury, San Francisco, CA 94117"}'::jsonb,
 NOW() - INTERVAL '12 days'),

-- Lisa White
('550e8400-e29b-41d4-a716-446655440016'::uuid, '550e8400-0000-0000-0000-000000000003'::uuid,
 'Lisa doing well in recovery program. Caucasian female, early 40s.',
 '{"height": 64, "weight": 128, "skin_color": "Light", "substance_abuse_history": ["In Recovery"]}'::jsonb,
 '{"latitude": 37.7599, "longitude": -122.4148, "address": "Mission & 16th St BART, San Francisco, CA 94103"}'::jsonb,
 NOW() - INTERVAL '33 days'),

-- Mark Harris
('550e8400-e29b-41d4-a716-446655440017'::uuid, '550e8400-0000-0000-0000-000000000001'::uuid,
 NULL,
 '{"height": 70, "weight": 165, "skin_color": "Medium", "veteran_status": "Yes", "housing_priority": "Medium"}'::jsonb,
 '{"latitude": 37.7694, "longitude": -122.4862, "address": "Golden Gate Park, JFK Drive, San Francisco, CA 94122"}'::jsonb,
 NOW() - INTERVAL '24 days'),

-- Sandra Clark
('550e8400-e29b-41d4-a716-446655440018'::uuid, '550e8400-0000-0000-0000-000000000002'::uuid,
 NULL,
 '{"height": 62, "weight": 118, "skin_color": "Dark", "violent_behavior": "None", "medical_conditions": ["Diabetes", "Heart Disease"]}'::jsonb,
 '{"latitude": 37.7749, "longitude": -122.4194, "address": "Market & Castro, San Francisco, CA 94114"}'::jsonb,
 NOW() - INTERVAL '16 days'),

-- Paul Lewis
('550e8400-e29b-41d4-a716-446655440019'::uuid, '550e8400-0000-0000-0000-000000000003'::uuid,
 'Paul needs substance abuse counseling. White male, 5''8", mild issues.',
 '{"height": 68, "weight": 150, "skin_color": "Light", "substance_abuse_history": ["Mild"]}'::jsonb,
 '{"latitude": 37.7837, "longitude": -122.4089, "address": "Tenderloin, Leavenworth St, San Francisco, CA 94109"}'::jsonb,
 NOW() - INTERVAL '38 days'),

-- Amy Walker
('550e8400-e29b-41d4-a716-446655440020'::uuid, '550e8400-0000-0000-0000-000000000001'::uuid,
 NULL,
 '{"height": 66, "weight": 132, "skin_color": "Medium", "veteran_status": "No", "housing_priority": "High", "medical_conditions": ["Mobility Issues"]}'::jsonb,
 '{"latitude": 37.7785, "longitude": -122.4056, "address": "SOMA, Bryant St, San Francisco, CA 94107"}'::jsonb,
 NOW() - INTERVAL '14 days');