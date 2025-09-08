-- Create Database Schema for Homeless Outreach App
-- Run this in your Supabase SQL Editor

-- Step 1: Create individuals table with all required columns
CREATE TABLE IF NOT EXISTS individuals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    danger_score INTEGER DEFAULT 0,
    danger_override INTEGER,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'number', 'single_select', 'multi_select', 'date', 'location')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    danger_weight INTEGER DEFAULT 0,
    auto_trigger BOOLEAN DEFAULT FALSE,
    is_required BOOLEAN DEFAULT FALSE,
    is_preset BOOLEAN DEFAULT FALSE,
    options JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create interactions table
CREATE TABLE IF NOT EXISTS interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    individual_id UUID REFERENCES individuals(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    transcription TEXT,
    data JSONB DEFAULT '{}',
    location JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Insert default categories
INSERT INTO categories (name, type, priority, danger_weight, auto_trigger, is_required, is_preset, options) VALUES
    ('Name', 'text', 'high', 0, FALSE, TRUE, TRUE, NULL),
    ('Height', 'number', 'medium', 10, FALSE, TRUE, TRUE, NULL),
    ('Weight', 'number', 'medium', 10, FALSE, TRUE, TRUE, NULL),
    ('Skin Color', 'single_select', 'high', 15, FALSE, TRUE, TRUE, 
        '[{"label": "Light", "value": 0.2}, {"label": "Medium", "value": 0.4}, {"label": "Dark", "value": 0.6}]'),
    ('Age', 'number', 'medium', 5, FALSE, FALSE, TRUE, NULL),
    ('Gender', 'single_select', 'medium', 5, FALSE, FALSE, TRUE,
        '[{"label": "Male", "value": 0.3}, {"label": "Female", "value": 0.3}, {"label": "Other", "value": 0.4}]'),
    ('Medical Conditions', 'multi_select', 'high', 20, TRUE, FALSE, TRUE,
        '[{"label": "Diabetes", "value": 0.8}, {"label": "Heart Disease", "value": 0.9}, {"label": "Mental Health", "value": 0.7}]'),
    ('Substance Abuse History', 'single_select', 'high', 25, TRUE, FALSE, TRUE,
        '[{"label": "None", "value": 0.1}, {"label": "Light", "value": 0.4}, {"label": "Moderate", "value": 0.7}, {"label": "Heavy", "value": 0.9}]'),
    ('Housing Priority', 'single_select', 'medium', 15, FALSE, FALSE, TRUE,
        '[{"label": "Low", "value": 0.2}, {"label": "Medium", "value": 0.5}, {"label": "High", "value": 0.8}]')
ON CONFLICT (name) DO NOTHING;

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_individuals_name ON individuals(name);
CREATE INDEX IF NOT EXISTS idx_individuals_danger_score ON individuals(danger_score);
CREATE INDEX IF NOT EXISTS idx_individuals_created_at ON individuals(created_at);
CREATE INDEX IF NOT EXISTS idx_interactions_individual_id ON interactions(individual_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON interactions(created_at);

-- Step 6: Enable Row Level Security (RLS)
ALTER TABLE individuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies (basic policies - adjust as needed)
CREATE POLICY "Allow all operations on individuals" ON individuals FOR ALL USING (true);
CREATE POLICY "Allow all operations on categories" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all operations on interactions" ON interactions FOR ALL USING (true);

-- Step 8: Verify the schema
SELECT 
    'individuals' as table_name,
    COUNT(*) as total_records
FROM individuals
UNION ALL
SELECT 
    'categories' as table_name,
    COUNT(*) as total_records
FROM categories
UNION ALL
SELECT 
    'interactions' as table_name,
    COUNT(*) as total_records
FROM interactions;

