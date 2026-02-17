-- CognitiveOS MVP - Initial Schema
-- Run this in Supabase SQL Editor or via Supabase CLI

-- Extend auth.users with profile fields (optional - Supabase auth.users has id, email, etc.)
-- We use auth.users(id) as FK for user_id in our tables

-- Sleep records: one per night per user
CREATE TABLE IF NOT EXISTS sleep_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  bedtime TIMESTAMPTZ,
  wake_time TIMESTAMPTZ,
  duration_minutes INT,
  quality_rating INT CHECK (quality_rating >= 1 AND quality_rating <= 5),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'apple_health', 'oura', 'whoop')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Daily check-ins
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sleep_quality INT CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  mental_clarity INT CHECK (mental_clarity >= 1 AND mental_clarity <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Predictions (stored for audit and ML)
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'elevated', 'high')),
  risk_horizon_hours INT,
  triggered_rules JSONB NOT NULL DEFAULT '[]',
  protocol_actions JSONB NOT NULL DEFAULT '[]',
  model_version TEXT NOT NULL DEFAULT 'research_v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- User profiles (timezone, wearable connection)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  wearable_connected BOOLEAN NOT NULL DEFAULT false,
  wearable_type TEXT CHECK (wearable_type IN ('apple_health', 'oura', 'whoop')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Users can only access their own data
ALTER TABLE sleep_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sleep_records"
  ON sleep_records FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own check_ins"
  ON check_ins FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own predictions"
  ON predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own predictions"
  ON predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own profile"
  ON user_profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sleep_records_user_date ON sleep_records(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_date ON check_ins(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_user_date ON predictions(user_id, date DESC);

-- Trigger to create user_profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, timezone)
  VALUES (NEW.id, 'UTC');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if it doesn't exist (run once)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
