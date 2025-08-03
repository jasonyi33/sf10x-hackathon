-- Demo Data for SF Homeless Outreach App
-- Task 6.1: Create comprehensive demo data with 20 individuals

-- First, insert custom categories
INSERT INTO categories (name, type, is_required, is_preset, priority, urgency_weight, auto_trigger, options) VALUES
('veteran_status', 'single_select', false, false, 'high', 20, false,
 '[{"label": "Yes", "value": 1}, {"label": "No", "value": 0}, {"label": "Unknown", "value": 0}]'::jsonb),
('medical_conditions', 'multi_select', false, false, 'high', 0, false,
 '["Diabetes", "Heart Disease", "Mental Health", "Mobility Issues", "Chronic Pain", "None"]'::jsonb),
('housing_priority', 'single_select', false, false, 'high', 30, false,
 '[{"label": "Critical", "value": 1}, {"label": "High", "value": 0.7}, {"label": "Medium", "value": 0.4}, {"label": "Low", "value": 0.1}]'::jsonb),
('violent_behavior', 'single_select', false, false, 'high', 40, true,
 '[{"label": "None", "value": 0}, {"label": "Verbal Only", "value": 0.3}, {"label": "Physical", "value": 1}]'::jsonb);

-- Insert 20 individuals with varied profiles
-- Low urgency scores (0-33): ~6 individuals
INSERT INTO individuals (id, name, data, urgency_score, urgency_override, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Sarah Smith', 
 '{"age": 32, "height": 65, "weight": 140, "skin_color": "Light", "gender": "Female", "substance_abuse_history": ["None"], "veteran_status": "No", "medical_conditions": ["None"], "housing_priority": "Low"}'::jsonb, 
 15, NULL, '2024-01-10T09:00:00Z', '2024-01-15T14:30:00Z'),

('550e8400-e29b-41d4-a716-446655440002', 'Michael Chen', 
 '{"age": 28, "height": 68, "weight": 155, "skin_color": "Medium", "gender": "Male", "substance_abuse_history": ["None"], "veteran_status": "No", "medical_conditions": ["None"], "housing_priority": "Medium"}'::jsonb, 
 25, NULL, '2024-01-11T10:15:00Z', '2024-01-16T11:45:00Z'),

('550e8400-e29b-41d4-a716-446655440003', 'Emily Rodriguez', 
 '{"age": 35, "height": 62, "weight": 130, "skin_color": "Medium", "gender": "Female", "substance_abuse_history": ["Mild"], "veteran_status": "No", "medical_conditions": ["Mental Health"], "housing_priority": "Medium"}'::jsonb, 
 30, NULL, '2024-01-12T08:30:00Z', '2024-01-17T16:20:00Z'),

('550e8400-e29b-41d4-a716-446655440004', 'David Wilson', 
 '{"age": 45, "height": 70, "weight": 175, "skin_color": "Light", "gender": "Male", "substance_abuse_history": ["None"], "veteran_status": "Yes", "medical_conditions": ["None"], "housing_priority": "High"}'::jsonb, 
 20, NULL, '2024-01-13T12:00:00Z', '2024-01-18T09:15:00Z'),

('550e8400-e29b-41d4-a716-446655440005', 'Lisa Thompson', 
 '{"age": 29, "height": 64, "weight": 145, "skin_color": "Light", "gender": "Female", "substance_abuse_history": ["Mild"], "veteran_status": "No", "medical_conditions": ["None"], "housing_priority": "Low"}'::jsonb, 
 18, NULL, '2024-01-14T14:45:00Z', '2024-01-19T13:30:00Z'),

('550e8400-e29b-41d4-a716-446655440006', 'James Brown', 
 '{"age": 52, "height": 72, "weight": 185, "skin_color": "Dark", "gender": "Male", "substance_abuse_history": ["None"], "veteran_status": "Yes", "medical_conditions": ["Heart Disease"], "housing_priority": "High"}'::jsonb, 
 32, NULL, '2024-01-15T11:20:00Z', '2024-01-20T10:45:00Z');

-- Medium urgency scores (34-66): ~8 individuals
INSERT INTO individuals (id, name, data, urgency_score, urgency_override, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440007', 'John Doe', 
 '{"age": 45, "height": 72, "weight": 180, "skin_color": "Light", "gender": "Male", "substance_abuse_history": ["Moderate"], "veteran_status": "No", "medical_conditions": ["Diabetes"], "housing_priority": "High"}'::jsonb, 
 75, NULL, '2024-01-10T08:00:00Z', '2024-01-15T15:30:00Z'),

('550e8400-e29b-41d4-a716-446655440008', 'Maria Garcia', 
 '{"age": 38, "height": 63, "weight": 150, "skin_color": "Medium", "gender": "Female", "substance_abuse_history": ["Moderate"], "veteran_status": "No", "medical_conditions": ["Mental Health"], "housing_priority": "Critical"}'::jsonb, 
 55, NULL, '2024-01-11T09:30:00Z', '2024-01-16T12:15:00Z'),

('550e8400-e29b-41d4-a716-446655440009', 'Robert Johnson', 
 '{"age": 58, "height": 70, "weight": 200, "skin_color": "Medium", "gender": "Male", "substance_abuse_history": ["Severe"], "veteran_status": "Yes", "medical_conditions": ["Chronic Pain"], "housing_priority": "Critical"}'::jsonb, 
 90, NULL, '2024-01-12T10:45:00Z', '2024-01-17T14:20:00Z'),

('550e8400-e29b-41d4-a716-446655440010', 'Jennifer Lee', 
 '{"age": 42, "height": 66, "weight": 160, "skin_color": "Light", "gender": "Female", "substance_abuse_history": ["Mild"], "veteran_status": "No", "medical_conditions": ["Mobility Issues"], "housing_priority": "High"}'::jsonb, 
 45, NULL, '2024-01-13T13:15:00Z', '2024-01-18T11:45:00Z'),

('550e8400-e29b-41d4-a716-446655440011', 'Thomas Anderson', 
 '{"age": 49, "height": 71, "weight": 190, "skin_color": "Dark", "gender": "Male", "substance_abuse_history": ["Moderate"], "veteran_status": "Yes", "medical_conditions": ["Heart Disease"], "housing_priority": "High"}'::jsonb, 
 60, NULL, '2024-01-14T15:00:00Z', '2024-01-19T16:30:00Z'),

('550e8400-e29b-41d4-a716-446655440012', 'Amanda White', 
 '{"age": 33, "height": 65, "weight": 145, "skin_color": "Light", "gender": "Female", "substance_abuse_history": ["Severe"], "veteran_status": "No", "medical_conditions": ["Mental Health"], "housing_priority": "Critical"}'::jsonb, 
 50, NULL, '2024-01-15T12:30:00Z', '2024-01-20T13:15:00Z'),

('550e8400-e29b-41d4-a716-446655440013', 'Christopher Davis', 
 '{"age": 47, "height": 69, "weight": 175, "skin_color": "Medium", "gender": "Male", "substance_abuse_history": ["Moderate"], "veteran_status": "No", "medical_conditions": ["Diabetes"], "housing_priority": "High"}'::jsonb, 
 40, NULL, '2024-01-16T09:45:00Z', '2024-01-21T10:20:00Z'),

('550e8400-e29b-41d4-a716-446655440014', 'Jessica Martinez', 
 '{"age": 36, "height": 64, "weight": 155, "skin_color": "Medium", "gender": "Female", "substance_abuse_history": ["Mild"], "veteran_status": "No", "medical_conditions": ["None"], "housing_priority": "Medium"}'::jsonb, 
 35, NULL, '2024-01-17T11:00:00Z', '2024-01-22T14:45:00Z');

-- High urgency scores (67-100): ~6 individuals (including 3 with auto-trigger)
INSERT INTO individuals (id, name, data, urgency_score, urgency_override, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440015', 'Daniel Taylor', 
 '{"age": 55, "height": 73, "weight": 210, "skin_color": "Dark", "gender": "Male", "substance_abuse_history": ["Severe"], "veteran_status": "Yes", "medical_conditions": ["Chronic Pain"], "housing_priority": "Critical", "violent_behavior": "Physical"}'::jsonb, 
 100, NULL, '2024-01-10T07:30:00Z', '2024-01-15T16:45:00Z'),

('550e8400-e29b-41d4-a716-446655440016', 'Nicole Clark', 
 '{"age": 41, "height": 67, "weight": 170, "skin_color": "Light", "gender": "Female", "substance_abuse_history": ["Severe"], "veteran_status": "No", "medical_conditions": ["Mental Health"], "housing_priority": "Critical", "violent_behavior": "Physical"}'::jsonb, 
 100, NULL, '2024-01-11T08:45:00Z', '2024-01-16T17:20:00Z'),

('550e8400-e29b-41d4-a716-446655440017', 'Kevin Lewis', 
 '{"age": 44, "height": 70, "weight": 185, "skin_color": "Medium", "gender": "Male", "substance_abuse_history": ["Moderate"], "veteran_status": "Yes", "medical_conditions": ["Heart Disease"], "housing_priority": "Critical", "violent_behavior": "Physical"}'::jsonb, 
 100, NULL, '2024-01-12T10:15:00Z', '2024-01-17T18:30:00Z'),

('550e8400-e29b-41d4-a716-446655440018', 'Rachel Green', 
 '{"age": 39, "height": 65, "weight": 160, "skin_color": "Light", "gender": "Female", "substance_abuse_history": ["Severe"], "veteran_status": "No", "medical_conditions": ["Mental Health"], "housing_priority": "Critical"}'::jsonb, 
 85, NULL, '2024-01-13T12:45:00Z', '2024-01-18T19:15:00Z'),

('550e8400-e29b-41d4-a716-446655440019', 'Steven Hall', 
 '{"age": 51, "height": 71, "weight": 195, "skin_color": "Dark", "gender": "Male", "substance_abuse_history": ["Severe"], "veteran_status": "Yes", "medical_conditions": ["Chronic Pain"], "housing_priority": "Critical"}'::jsonb, 
 80, NULL, '2024-01-14T14:00:00Z', '2024-01-19T20:45:00Z'),

('550e8400-e29b-41d4-a716-446655440020', 'Michelle Adams', 
 '{"age": 37, "height": 66, "weight": 165, "skin_color": "Medium", "gender": "Female", "substance_abuse_history": ["Moderate"], "veteran_status": "No", "medical_conditions": ["Mobility Issues"], "housing_priority": "High"}'::jsonb, 
 70, NULL, '2024-01-15T15:30:00Z', '2024-01-20T21:30:00Z');

-- Insert interactions for each individual (1-10 interactions per person)
-- Sample interactions for first few individuals
INSERT INTO interactions (id, individual_id, user_id, transcription, data, location, created_at) VALUES
-- John Doe interactions
('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440007', 'demo-user-1',
 'Met John near Market Street. About 45 years old, 6 feet tall, maybe 180 pounds. Light skin. Shows signs of moderate substance abuse, been on streets 3 months. Needs diabetes medication.',
 '{"name": "John", "age": 45, "height": 72, "weight": 180, "skin_color": "Light", "substance_abuse": "Moderate", "medical_conditions": ["Diabetes"]}'::jsonb,
 '{"lat": 37.7749, "lng": -122.4194, "address": "Market St & 5th, San Francisco, CA"}'::jsonb,
 '2024-01-15T15:30:00Z'),

('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440007', 'demo-user-2',
 NULL,
 '{"veteran_status": "No", "housing_priority": "High"}'::jsonb,
 '{"lat": 37.7858, "lng": -122.4064, "address": "Ellis St & 6th, San Francisco, CA"}'::jsonb,
 '2024-01-16T12:15:00Z'),

-- Sarah Smith interactions
('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440001', 'demo-user-1',
 'Sarah by the library, approximately 35, 5 foot 4, 120 pounds, dark skin. Says she is in recovery, looking for shelter. Has two children staying with relatives.',
 '{"name": "Sarah", "age": 35, "height": 64, "weight": 120, "skin_color": "Dark", "substance_abuse": "In Recovery", "housing_priority": "High"}'::jsonb,
 '{"lat": 37.7793, "lng": -122.4193, "address": "Civic Center Library, San Francisco, CA"}'::jsonb,
 '2024-01-15T14:30:00Z'),

-- Robert Johnson interactions
('550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440009', 'demo-user-3',
 'Robert at Golden Gate Park. 55 years old, 5 foot 10, 200 pounds, medium skin tone. Veteran, mild substance issues. Applied for housing last week.',
 '{"name": "Robert", "age": 55, "height": 70, "weight": 200, "skin_color": "Medium", "veteran_status": "Yes", "substance_abuse": "Mild", "housing_priority": "High"}'::jsonb,
 '{"lat": 37.7694, "lng": -122.4862, "address": "Golden Gate Park, San Francisco, CA"}'::jsonb,
 '2024-01-17T14:20:00Z'),

-- Daniel Taylor (auto-trigger violent behavior)
('550e8400-e29b-41d4-a716-446655440105', '550e8400-e29b-41d4-a716-446655440015', 'demo-user-1',
 'Daniel in Tenderloin area. 55 years old, 6 foot 1, 210 pounds, dark skin. Veteran with severe substance abuse. Showed aggressive behavior towards other individuals. Needs immediate intervention.',
 '{"name": "Daniel", "age": 55, "height": 73, "weight": 210, "skin_color": "Dark", "veteran_status": "Yes", "substance_abuse": "Severe", "violent_behavior": "Physical"}'::jsonb,
 '{"lat": 37.7849, "lng": -122.4094, "address": "Tenderloin District, San Francisco, CA"}'::jsonb,
 '2024-01-15T16:45:00Z'),

-- Nicole Clark (auto-trigger violent behavior)
('550e8400-e29b-41d4-a716-446655440106', '550e8400-e29b-41d4-a716-446655440016', 'demo-user-2',
 'Nicole near Mission District. 41 years old, 5 foot 7, 170 pounds, light skin. Severe substance abuse, mental health issues. Physically aggressive with staff. Requires immediate safety assessment.',
 '{"name": "Nicole", "age": 41, "height": 67, "weight": 170, "skin_color": "Light", "substance_abuse": "Severe", "medical_conditions": ["Mental Health"], "violent_behavior": "Physical"}'::jsonb,
 '{"lat": 37.7599, "lng": -122.4148, "address": "Mission District, San Francisco, CA"}'::jsonb,
 '2024-01-16T17:20:00Z'),

-- Kevin Lewis (auto-trigger violent behavior)
('550e8400-e29b-41d4-a716-446655440107', '550e8400-e29b-41d4-a716-446655440017', 'demo-user-3',
 'Kevin in SOMA area. 44 years old, 5 foot 10, 185 pounds, medium skin. Veteran with heart disease. Physical violence reported. Critical housing priority.',
 '{"name": "Kevin", "age": 44, "height": 70, "weight": 185, "skin_color": "Medium", "veteran_status": "Yes", "medical_conditions": ["Heart Disease"], "housing_priority": "Critical", "violent_behavior": "Physical"}'::jsonb,
 '{"lat": 37.7749, "lng": -122.4194, "address": "SOMA District, San Francisco, CA"}'::jsonb,
 '2024-01-17T18:30:00Z');

-- Add more interactions for variety (simplified for demo)
INSERT INTO interactions (id, individual_id, user_id, transcription, data, location, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440108', '550e8400-e29b-41d4-a716-446655440008', 'demo-user-1',
 'Maria at Haight-Ashbury. 38 years old, 5 foot 3, 150 pounds, medium skin. Moderate substance abuse, mental health concerns. Critical housing priority.',
 '{"name": "Maria", "age": 38, "height": 63, "weight": 150, "skin_color": "Medium", "substance_abuse": "Moderate", "medical_conditions": ["Mental Health"], "housing_priority": "Critical"}'::jsonb,
 '{"lat": 37.7699, "lng": -122.4469, "address": "Haight-Ashbury, San Francisco, CA"}'::jsonb,
 '2024-01-16T12:15:00Z'),

('550e8400-e29b-41d4-a716-446655440109', '550e8400-e29b-41d4-a716-446655440010', 'demo-user-2',
 'Jennifer near Fisherman\'s Wharf. 42 years old, 5 foot 6, 160 pounds, light skin. Mobility issues, mild substance abuse. High housing priority.',
 '{"name": "Jennifer", "age": 42, "height": 66, "weight": 160, "skin_color": "Light", "substance_abuse": "Mild", "medical_conditions": ["Mobility Issues"], "housing_priority": "High"}'::jsonb,
 '{"lat": 37.8087, "lng": -122.4098, "address": "Fisherman\'s Wharf, San Francisco, CA"}'::jsonb,
 '2024-01-18T11:45:00Z'),

('550e8400-e29b-41d4-a716-446655440110', '550e8400-e29b-41d4-a716-446655440012', 'demo-user-3',
 'Amanda in North Beach. 33 years old, 5 foot 5, 145 pounds, light skin. Severe substance abuse, mental health issues. Critical housing priority.',
 '{"name": "Amanda", "age": 33, "height": 65, "weight": 145, "skin_color": "Light", "substance_abuse": "Severe", "medical_conditions": ["Mental Health"], "housing_priority": "Critical"}'::jsonb,
 '{"lat": 37.8038, "lng": -122.4100, "address": "North Beach, San Francisco, CA"}'::jsonb,
 '2024-01-20T13:15:00Z');