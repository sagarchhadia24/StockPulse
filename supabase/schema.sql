-- Watchlist table for user saved stocks
CREATE TABLE IF NOT EXISTS watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  notes TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_symbol ON watchlists(symbol);

-- Enable Row Level Security
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own watchlist items
CREATE POLICY "Users can view own watchlist"
  ON watchlists FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert into their own watchlist
CREATE POLICY "Users can add to own watchlist"
  ON watchlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own watchlist items
CREATE POLICY "Users can update own watchlist"
  ON watchlists FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete from their own watchlist
CREATE POLICY "Users can delete from own watchlist"
  ON watchlists FOR DELETE
  USING (auth.uid() = user_id);
