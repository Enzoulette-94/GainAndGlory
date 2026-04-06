-- Fix RLS: allow authenticated users to read any user's sessions (public profiles)
-- Run this in the Supabase SQL Editor

-- workout_sessions
DROP POLICY IF EXISTS "workout_select" ON workout_sessions;
CREATE POLICY "workout_select" ON workout_sessions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- running_sessions
DROP POLICY IF EXISTS "running_select" ON running_sessions;
CREATE POLICY "running_select" ON running_sessions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- crossfit_sessions
DROP POLICY IF EXISTS "crossfit_sel" ON crossfit_sessions;
CREATE POLICY "crossfit_sel" ON crossfit_sessions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- calisthenics_sessions
DROP POLICY IF EXISTS "own calisthenics" ON calisthenics_sessions;
DROP POLICY IF EXISTS "cali_select" ON calisthenics_sessions;
DROP POLICY IF EXISTS "cali_write" ON calisthenics_sessions;
CREATE POLICY "cali_select" ON calisthenics_sessions
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "cali_write" ON calisthenics_sessions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- hybrid_sessions
DROP POLICY IF EXISTS "Users can manage their own hybrid sessions" ON hybrid_sessions;
DROP POLICY IF EXISTS "hybrid_select" ON hybrid_sessions;
DROP POLICY IF EXISTS "hybrid_write" ON hybrid_sessions;
CREATE POLICY "hybrid_select" ON hybrid_sessions
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "hybrid_write" ON hybrid_sessions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
