-- ============================================================
-- TABLE: hybrid_sessions
-- Sessions hybrides multi-activités (running + muscu + cali + crossfit)
-- ============================================================

CREATE TABLE IF NOT EXISTS hybrid_sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name        TEXT,
  notes       TEXT,
  feedback    TEXT,
  blocks      JSONB       NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index sur user_id + date pour les requêtes de listing
CREATE INDEX IF NOT EXISTS idx_hybrid_sessions_user_date
  ON hybrid_sessions (user_id, date DESC);

-- RLS : chaque utilisateur ne voit que ses propres sessions
ALTER TABLE hybrid_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own hybrid sessions"
  ON hybrid_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- STRUCTURE JSONB des blocs (pour référence)
-- ============================================================
-- blocks est un tableau de HybridBlock :
--
-- Bloc Running :
--   { "blockType": "running", "id": "...", "distance": 5.0,
--     "duration": 30, "runType": "endurance", "notes": "" }
--
-- Bloc Musculation :
--   { "blockType": "musculation", "id": "...",
--     "exercises": [
--       { "id": "...", "name": "Squat",
--         "sets": [{"reps": 10, "weight": 80}] }
--     ], "notes": "" }
--
-- Bloc Calisthénie :
--   { "blockType": "calisthenics", "id": "...",
--     "exercises": [
--       { "id": "...", "name": "Pull-up", "sets": 3, "reps": 10 }
--     ], "notes": "" }
--
-- Bloc Crossfit :
--   { "blockType": "crossfit", "id": "...",
--     "wodType": "amrap", "duration": 20,
--     "exercises": [{"id": "...", "name": "Burpee"}],
--     "notes": "" }
-- ============================================================
