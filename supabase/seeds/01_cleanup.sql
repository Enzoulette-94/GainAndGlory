-- ============================================================
-- 01 — CLEANUP (run first)
-- Supprime toutes les données de jeu avant de re-seeder
-- ============================================================

TRUNCATE TABLE
  activity_feed,
  user_badges,
  challenge_participations,
  event_participations,
  events,
  community_challenges,
  personal_goals,
  profile_records,
  profile_skills,
  crossfit_sessions,
  calisthenics_sessions,
  running_sessions,
  workout_sets,
  workout_sessions,
  weight_entries,
  badges,
  exercises
CASCADE;
