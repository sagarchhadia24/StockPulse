-- Add sentiment and pre-generation fields to ai_insights table
ALTER TABLE ai_insights
  ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(3,2),
  ADD COLUMN IF NOT EXISTS sentiment_label VARCHAR(20),
  ADD COLUMN IF NOT EXISTS news_summary TEXT,
  ADD COLUMN IF NOT EXISTS pre_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS analyst_target_median DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS analyst_recommendation VARCHAR(20);

-- Add check constraint for sentiment_label
ALTER TABLE ai_insights
  ADD CONSTRAINT ai_insights_sentiment_label_check
  CHECK (sentiment_label IS NULL OR sentiment_label IN ('bullish', 'neutral', 'bearish'));

-- Partial index for pre-generated insights (frequently queried)
CREATE INDEX IF NOT EXISTS idx_ai_insights_pre_generated
  ON ai_insights (generated_at DESC)
  WHERE pre_generated = TRUE;
