-- AI insights cache table
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  valuation_analysis TEXT NOT NULL,
  recent_performance TEXT NOT NULL,
  key_considerations TEXT[] NOT NULL,
  input_data JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_insights_symbol ON ai_insights(symbol);
CREATE INDEX IF NOT EXISTS idx_insights_generated_at ON ai_insights(generated_at);
