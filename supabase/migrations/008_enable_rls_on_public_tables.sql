-- Enable RLS on valuation_snapshots and ai_insights tables
-- These tables store shared data (not user-specific), so all authenticated
-- users can read, but only the service role can write.

-- valuation_snapshots
ALTER TABLE valuation_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read valuation snapshots"
  ON valuation_snapshots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage valuation snapshots"
  ON valuation_snapshots FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ai_insights
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read AI insights"
  ON ai_insights FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage AI insights"
  ON ai_insights FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
