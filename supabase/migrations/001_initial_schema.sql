-- Individuals table: Current state
CREATE TABLE individuals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    danger_score INTEGER DEFAULT 0,
    danger_override INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Interactions table: Historical log
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    individual_id UUID REFERENCES individuals(id),
    user_id UUID REFERENCES auth.users(id),
    transcription TEXT,
    data JSONB NOT NULL DEFAULT '{}',
    location JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Categories table: Dynamic fields
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    options JSONB,
    priority TEXT DEFAULT 'medium',
    danger_weight INTEGER DEFAULT 0,
    auto_trigger BOOLEAN DEFAULT false,
    is_preset BOOLEAN DEFAULT false,
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_individuals_name ON individuals(name);
CREATE INDEX idx_individuals_data ON individuals USING GIN(data);
CREATE INDEX idx_interactions_individual ON interactions(individual_id);
CREATE INDEX idx_interactions_created ON interactions(created_at);