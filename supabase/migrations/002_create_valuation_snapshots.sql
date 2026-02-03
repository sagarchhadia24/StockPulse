-- supabase/migrations/002_create_valuation_snapshots.sql

-- Valuation snapshots table for historical tracking
CREATE TABLE IF NOT EXISTS valuation_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) NOT NULL,
  snapshot_date DATE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  value_score INTEGER NOT NULL,
  pe_score INTEGER,
  pb_score INTEGER,
  peg_score INTEGER,
  week_position_score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(symbol, snapshot_date)
);

-- Index for efficient queries by symbol and date range
CREATE INDEX IF NOT EXISTS idx_snapshots_symbol_date
  ON valuation_snapshots(symbol, snapshot_date DESC);

-- Index for cron job to check latest snapshot date
CREATE INDEX IF NOT EXISTS idx_snapshots_date
  ON valuation_snapshots(snapshot_date DESC);
