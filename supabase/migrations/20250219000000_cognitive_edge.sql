-- Cognitive Edge Product Expansion
-- Peak Performance Windows, Edge Score, Drift, Events, Travel

-- user_profiles: chronotype for peak window calculation
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS chronotype TEXT NOT NULL DEFAULT 'intermediate'
    CHECK (chronotype IN ('early', 'intermediate', 'late'));

-- predictions: extend with edge score components, peak windows, drift
ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS strategic_clarity TEXT
    CHECK (strategic_clarity IS NULL OR strategic_clarity IN ('Strong', 'Moderate', 'Slightly Reduced', 'Reduced')),
  ADD COLUMN IF NOT EXISTS emotional_regulation TEXT
    CHECK (emotional_regulation IS NULL OR emotional_regulation IN ('Strong', 'Moderate', 'Slightly Reduced', 'Reduced')),
  ADD COLUMN IF NOT EXISTS cognitive_stamina TEXT
    CHECK (cognitive_stamina IS NULL OR cognitive_stamina IN ('Strong', 'Moderate', 'Slightly Reduced', 'Reduced')),
  ADD COLUMN IF NOT EXISTS peak_windows JSONB,
  ADD COLUMN IF NOT EXISTS drift_status TEXT
    CHECK (drift_status IS NULL OR drift_status IN ('stable', 'slight_compression', 'accumulating_fatigue', 'edge_erosion')),
  ADD COLUMN IF NOT EXISTS drift_pct_5d NUMERIC;

-- daily_scores: for drift tracking (populated when prediction runs)
CREATE TABLE IF NOT EXISTS daily_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  edge_score INT NOT NULL CHECK (edge_score >= 0 AND edge_score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE daily_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own daily_scores"
  ON daily_scores FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_daily_scores_user_date ON daily_scores(user_id, date DESC);

-- optimization_events: Event Optimization Mode
CREATE TABLE IF NOT EXISTS optimization_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'board_meeting', 'fundraise', 'earnings_call', 'product_launch',
    'court_case', 'conference', 'custom'
  )),
  event_label TEXT,
  target_date DATE NOT NULL,
  target_edge_score INT NOT NULL DEFAULT 85 CHECK (target_edge_score >= 0 AND target_edge_score <= 100),
  sleep_target_minutes INT,
  optimal_bedtime TIME,
  recovery_days INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE optimization_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own optimization_events"
  ON optimization_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_optimization_events_user ON optimization_events(user_id, target_date DESC);

-- travel_trips: Flight & Travel Intelligence
CREATE TABLE IF NOT EXISTS travel_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  departure_city TEXT NOT NULL,
  departure_tz TEXT NOT NULL,
  arrival_city TEXT NOT NULL,
  arrival_tz TEXT NOT NULL,
  departure_datetime TIMESTAMPTZ NOT NULL,
  arrival_datetime TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE travel_trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own travel_trips"
  ON travel_trips FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_travel_trips_user ON travel_trips(user_id);

-- travel_impact: computed impact per trip per day
CREATE TABLE IF NOT EXISTS travel_impact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES travel_trips(id) ON DELETE CASCADE,
  day_offset INT NOT NULL,
  strategic_clarity_delta_pct NUMERIC,
  notes TEXT,
  recovery_expected BOOLEAN
);

ALTER TABLE travel_impact ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view travel_impact for own trips"
  ON travel_impact FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM travel_trips t
      WHERE t.id = travel_impact.trip_id AND t.user_id = auth.uid()
    )
  );
