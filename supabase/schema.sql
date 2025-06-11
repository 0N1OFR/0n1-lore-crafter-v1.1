-- 0N1 Lore Crafter Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE memory_type AS ENUM ('conversation', 'key_memory', 'context_note');

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE,
    matrica_id TEXT UNIQUE,
    username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE
);

-- Souls table
CREATE TABLE IF NOT EXISTS souls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nft_id TEXT NOT NULL, -- 0N1 Force NFT ID
    soul_name TEXT NOT NULL,
    archetype TEXT,
    background_story TEXT,
    personality JSONB,
    powers_abilities JSONB,
    lore_depth TEXT,
    creation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data JSONB NOT NULL, -- Complete character data
    is_public BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    UNIQUE(user_id, nft_id) -- One soul per NFT per user
);

-- Memories table
CREATE TABLE IF NOT EXISTS memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    soul_id UUID NOT NULL REFERENCES souls(id) ON DELETE CASCADE,
    memory_type memory_type NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat archives table
CREATE TABLE IF NOT EXISTS chat_archives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    soul_id UUID NOT NULL REFERENCES souls(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT,
    message_count INTEGER NOT NULL DEFAULT 0,
    conversation_duration NUMERIC NOT NULL DEFAULT 0, -- in minutes
    key_topics TEXT[],
    messages JSONB NOT NULL, -- Array of message objects
    memory_segments JSONB, -- Saved memory segments
    metadata JSONB, -- Additional metadata (tokens, engagement score, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User analytics table
CREATE TABLE IF NOT EXISTS user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'soul_created', 'chat_started', 'memory_saved', etc.
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_souls_user_id ON souls(user_id);
CREATE INDEX IF NOT EXISTS idx_souls_nft_id ON souls(nft_id);
CREATE INDEX IF NOT EXISTS idx_souls_public ON souls(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_memories_soul_id ON memories(soul_id);
CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_chat_archives_user_id ON chat_archives(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_archives_soul_id ON chat_archives(soul_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type ON user_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_matrica_id ON users(matrica_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_souls_updated_at BEFORE UPDATE ON souls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_memories_updated_at BEFORE UPDATE ON memories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_archives_updated_at BEFORE UPDATE ON chat_archives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE souls ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (
    auth.uid()::text = id::text OR 
    wallet_address = current_setting('app.current_wallet_address', true) OR
    matrica_id = current_setting('app.current_matrica_id', true)
);

CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (
    auth.uid()::text = id::text OR
    wallet_address = current_setting('app.current_wallet_address', true) OR
    matrica_id = current_setting('app.current_matrica_id', true)
);

CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (
    auth.uid()::text = id::text OR
    wallet_address = current_setting('app.current_wallet_address', true) OR
    matrica_id = current_setting('app.current_matrica_id', true)
);

-- RLS Policies for souls table
CREATE POLICY "Users can view their own souls" ON souls FOR SELECT USING (
    user_id = auth.uid() OR is_public = TRUE
);

CREATE POLICY "Users can insert their own souls" ON souls FOR INSERT WITH CHECK (
    user_id = auth.uid()
);

CREATE POLICY "Users can update their own souls" ON souls FOR UPDATE USING (
    user_id = auth.uid()
);

CREATE POLICY "Users can delete their own souls" ON souls FOR DELETE USING (
    user_id = auth.uid()
);

-- RLS Policies for memories table
CREATE POLICY "Users can view their own memories" ON memories FOR SELECT USING (
    user_id = auth.uid()
);

CREATE POLICY "Users can insert their own memories" ON memories FOR INSERT WITH CHECK (
    user_id = auth.uid()
);

CREATE POLICY "Users can update their own memories" ON memories FOR UPDATE USING (
    user_id = auth.uid()
);

CREATE POLICY "Users can delete their own memories" ON memories FOR DELETE USING (
    user_id = auth.uid()
);

-- RLS Policies for chat_archives table
CREATE POLICY "Users can view their own chat archives" ON chat_archives FOR SELECT USING (
    user_id = auth.uid()
);

CREATE POLICY "Users can insert their own chat archives" ON chat_archives FOR INSERT WITH CHECK (
    user_id = auth.uid()
);

CREATE POLICY "Users can update their own chat archives" ON chat_archives FOR UPDATE USING (
    user_id = auth.uid()
);

CREATE POLICY "Users can delete their own chat archives" ON chat_archives FOR DELETE USING (
    user_id = auth.uid()
);

-- RLS Policies for user_analytics table
CREATE POLICY "Users can view their own analytics" ON user_analytics FOR SELECT USING (
    user_id = auth.uid()
);

CREATE POLICY "Users can insert their own analytics" ON user_analytics FOR INSERT WITH CHECK (
    user_id = auth.uid()
);

-- Create view for public souls
CREATE OR REPLACE VIEW public_souls AS
SELECT 
    s.id,
    s.nft_id,
    s.soul_name,
    s.archetype,
    s.background_story,
    s.personality,
    s.powers_abilities,
    s.lore_depth,
    s.creation_timestamp,
    s.view_count,
    u.username as creator_username
FROM souls s
JOIN users u ON s.user_id = u.id
WHERE s.is_public = TRUE
ORDER BY s.view_count DESC, s.creation_timestamp DESC;

-- Create function to get user by wallet or matrica
CREATE OR REPLACE FUNCTION get_or_create_user(
    p_wallet_address TEXT DEFAULT NULL,
    p_matrica_id TEXT DEFAULT NULL,
    p_username TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Try to find existing user
    IF p_wallet_address IS NOT NULL THEN
        SELECT id INTO user_id FROM users WHERE wallet_address = p_wallet_address;
    END IF;
    
    IF user_id IS NULL AND p_matrica_id IS NOT NULL THEN
        SELECT id INTO user_id FROM users WHERE matrica_id = p_matrica_id;
    END IF;
    
    -- If no user found, create new one
    IF user_id IS NULL THEN
        INSERT INTO users (wallet_address, matrica_id, username, last_seen)
        VALUES (p_wallet_address, p_matrica_id, p_username, NOW())
        RETURNING id INTO user_id;
    ELSE
        -- Update last_seen
        UPDATE users SET last_seen = NOW() WHERE id = user_id;
    END IF;
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to track analytics
CREATE OR REPLACE FUNCTION track_user_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_event_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_analytics (user_id, event_type, event_data)
    VALUES (p_user_id, p_event_type, p_event_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated; 