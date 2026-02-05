-- Add confidence field to ai_insights table
ALTER TABLE ai_insights
ADD COLUMN IF NOT EXISTS confidence VARCHAR(10) DEFAULT 'medium';

-- Add check constraint for valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_confidence_value'
  ) THEN
    ALTER TABLE ai_insights
    ADD CONSTRAINT check_confidence_value
    CHECK (confidence IN ('high', 'medium', 'low'));
  END IF;
END $$;

-- Update existing rows to have medium confidence
UPDATE ai_insights SET confidence = 'medium' WHERE confidence IS NULL;
