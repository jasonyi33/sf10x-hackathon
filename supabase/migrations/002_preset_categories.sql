INSERT INTO categories (name, type, is_required, is_preset, options) VALUES
('name', 'text', true, true, null),
('height', 'number', true, true, null),
('weight', 'number', true, true, null),
('skin_color', 'single_select', true, true, 
 '[{"label": "Light", "value": 0}, {"label": "Medium", "value": 0}, {"label": "Dark", "value": 0}]'::jsonb),
('gender', 'single_select', false, true,
 '[{"label": "Male", "value": 0}, {"label": "Female", "value": 0}, {"label": "Other", "value": 0}, {"label": "Unknown", "value": 0}]'::jsonb),
('substance_abuse_history', 'multi_select', false, true,
 '["None", "Mild", "Moderate", "Severe", "In Recovery"]'::jsonb);