-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create souls table
CREATE TABLE IF NOT EXISTS souls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nft_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  collection TEXT NOT NULL CHECK (collection IN ('force', 'frame')),
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create nft_metadata table for caching NFT data
CREATE TABLE IF NOT EXISTS nft_metadata (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nft_id TEXT NOT NULL,
  collection TEXT NOT NULL CHECK (collection IN ('force', 'frame')),
  name TEXT,
  image_url TEXT,
  traits JSONB,
  contract_address TEXT NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS souls_nft_id_idx ON souls(nft_id);
CREATE INDEX IF NOT EXISTS souls_wallet_address_idx ON souls(wallet_address);
CREATE INDEX IF NOT EXISTS souls_collection_idx ON souls(collection);
CREATE INDEX IF NOT EXISTS nft_metadata_nft_id_collection_idx ON nft_metadata(nft_id, collection);

-- Create unique constraint to prevent duplicate souls per NFT
CREATE UNIQUE INDEX IF NOT EXISTS souls_nft_id_collection_unique ON souls(nft_id, collection);
CREATE UNIQUE INDEX IF NOT EXISTS nft_metadata_nft_id_collection_unique ON nft_metadata(nft_id, collection);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_souls_updated_at BEFORE UPDATE ON souls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE souls ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_metadata ENABLE ROW LEVEL SECURITY;

-- Create policies for souls table
-- Users can read all souls (for public viewing)
CREATE POLICY "Anyone can view souls" ON souls FOR SELECT USING (true);

-- Users can insert/update souls for their own wallet address
CREATE POLICY "Users can manage their own souls" ON souls 
  FOR ALL USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Create policies for nft_metadata table
-- Anyone can read NFT metadata (for public viewing)
CREATE POLICY "Anyone can view nft_metadata" ON nft_metadata FOR SELECT USING (true);

-- Only authenticated users can insert/update NFT metadata
CREATE POLICY "Authenticated users can manage nft_metadata" ON nft_metadata 
  FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON souls TO anon, authenticated;
GRANT ALL ON nft_metadata TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated; 