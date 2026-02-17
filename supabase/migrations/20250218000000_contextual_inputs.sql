-- Contextual inputs for sleep and check-ins
-- Adds behavioral tracking and mood/stress for richer insights

-- Sleep records: night-of context
ALTER TABLE sleep_records
  ADD COLUMN IF NOT EXISTS caffeine_after_2pm BOOLEAN,
  ADD COLUMN IF NOT EXISTS alcohol_tonight BOOLEAN,
  ADD COLUMN IF NOT EXISTS screen_time_minutes INT CHECK (screen_time_minutes IS NULL OR (screen_time_minutes >= 0 AND screen_time_minutes <= 180)),
  ADD COLUMN IF NOT EXISTS exercise_today BOOLEAN;

-- Check-ins: daily context
ALTER TABLE check_ins
  ADD COLUMN IF NOT EXISTS energy_rating INT CHECK (energy_rating IS NULL OR (energy_rating >= 1 AND energy_rating <= 5)),
  ADD COLUMN IF NOT EXISTS stress_level INT CHECK (stress_level IS NULL OR (stress_level >= 1 AND stress_level <= 10));

-- Predictions: readiness score, insights, recommendations
ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS readiness_score INT CHECK (readiness_score IS NULL OR (readiness_score >= 0 AND readiness_score <= 100)),
  ADD COLUMN IF NOT EXISTS insights JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS recommendations JSONB DEFAULT '{}';

-- Add csv_import to sleep_records source
ALTER TABLE sleep_records DROP CONSTRAINT IF EXISTS sleep_records_source_check;
ALTER TABLE sleep_records ADD CONSTRAINT sleep_records_source_check
  CHECK (source IN ('manual', 'apple_health', 'oura', 'whoop', 'csv_import'));
