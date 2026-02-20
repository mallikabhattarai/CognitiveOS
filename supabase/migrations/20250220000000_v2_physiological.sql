-- CognitiveOS v2 – Physiological Performance Modeling Layer
-- Schema additions for circadian, sleep pressure, architecture, projections

-- user_profiles: age for Sleep Age Index
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS age INT CHECK (age IS NULL OR (age >= 18 AND age <= 120));

-- sleep_records: nap duration for Sleep Pressure model
ALTER TABLE sleep_records
  ADD COLUMN IF NOT EXISTS nap_duration_minutes INT CHECK (nap_duration_minutes IS NULL OR (nap_duration_minutes >= 0 AND nap_duration_minutes <= 180));

-- predictions: edge_score (alias for readiness in v2), v2 physiological outputs
ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS edge_score INT CHECK (edge_score IS NULL OR (edge_score >= 0 AND edge_score <= 100));

ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS circadian_alignment_pct NUMERIC CHECK (circadian_alignment_pct IS NULL OR (circadian_alignment_pct >= 0 AND circadian_alignment_pct <= 100)),
  ADD COLUMN IF NOT EXISTS biological_readiness_time TIME,
  ADD COLUMN IF NOT EXISTS bedtime_vs_brt_minutes INT,
  ADD COLUMN IF NOT EXISTS sleep_pressure_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS cognitive_dip_window_start TIME,
  ADD COLUMN IF NOT EXISTS cognitive_dip_window_end TIME,
  ADD COLUMN IF NOT EXISTS recovery_time_estimate NUMERIC,
  ADD COLUMN IF NOT EXISTS predicted_n3_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS predicted_rem_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS fragmentation_risk NUMERIC,
  ADD COLUMN IF NOT EXISTS predicted_efficiency NUMERIC,
  ADD COLUMN IF NOT EXISTS cognitive_window_deep_work JSONB,
  ADD COLUMN IF NOT EXISTS cognitive_window_dip JSONB,
  ADD COLUMN IF NOT EXISTS cognitive_window_creative JSONB,
  ADD COLUMN IF NOT EXISTS projection_baseline JSONB,
  ADD COLUMN IF NOT EXISTS projection_recovery JSONB,
  ADD COLUMN IF NOT EXISTS projection_partial JSONB,
  ADD COLUMN IF NOT EXISTS cognitive_sleep_age INT,
  ADD COLUMN IF NOT EXISTS sleep_age_driver TEXT,
  ADD COLUMN IF NOT EXISTS edge_breakdown JSONB;

-- model_version: allow research_v2
ALTER TABLE predictions DROP CONSTRAINT IF EXISTS predictions_model_version_check;
ALTER TABLE predictions ADD CONSTRAINT predictions_model_version_check
  CHECK (model_version IN ('research_v1', 'research_v2'));
