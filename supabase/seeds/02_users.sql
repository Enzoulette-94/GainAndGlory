-- ============================================================
-- 02 — AUTH USERS + PROFILES
-- 6 utilisateurs · Déc 2025 → Mar 2026
-- ============================================================

-- IDs constants (réutilisés dans tous les autres fichiers) :
-- Admin    a0000000-0000-0000-0000-000000000001
-- Atlas    a0000000-0000-0000-0000-000000000002
-- Spartacus a0000000-0000-0000-0000-000000000003
-- Valkyrie  a0000000-0000-0000-0000-000000000004
-- Titan    a0000000-0000-0000-0000-000000000005
-- Rookie   a0000000-0000-0000-0000-000000000006

INSERT INTO auth.users (
  instance_id, id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  role, aud,
  confirmation_token, recovery_token,
  email_change_token_new, email_change
) VALUES
  ('00000000-0000-0000-0000-000000000000',
   'a0000000-0000-0000-0000-000000000001',
   'admin@gainandglory.com',
   crypt('Admin1234!', gen_salt('bf')),
   NOW(), '2025-09-01T08:00:00Z', NOW(),
   '{"provider":"email","providers":["email"]}',
   '{"username":"Admin"}',
   'authenticated', 'authenticated', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000',
   'a0000000-0000-0000-0000-000000000002',
   'atlas@gainandglory.com',
   crypt('Password123!', gen_salt('bf')),
   NOW(), '2025-09-05T10:00:00Z', NOW(),
   '{"provider":"email","providers":["email"]}',
   '{"username":"Atlas"}',
   'authenticated', 'authenticated', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000',
   'a0000000-0000-0000-0000-000000000003',
   'spartacus@gainandglory.com',
   crypt('Password123!', gen_salt('bf')),
   NOW(), '2025-09-10T12:00:00Z', NOW(),
   '{"provider":"email","providers":["email"]}',
   '{"username":"Spartacus"}',
   'authenticated', 'authenticated', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000',
   'a0000000-0000-0000-0000-000000000004',
   'valkyrie@gainandglory.com',
   crypt('Password123!', gen_salt('bf')),
   NOW(), '2025-10-01T09:00:00Z', NOW(),
   '{"provider":"email","providers":["email"]}',
   '{"username":"Valkyrie"}',
   'authenticated', 'authenticated', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000',
   'a0000000-0000-0000-0000-000000000005',
   'titan@gainandglory.com',
   crypt('Password123!', gen_salt('bf')),
   NOW(), '2025-10-15T14:00:00Z', NOW(),
   '{"provider":"email","providers":["email"]}',
   '{"username":"Titan"}',
   'authenticated', 'authenticated', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000',
   'a0000000-0000-0000-0000-000000000006',
   'rookie@gainandglory.com',
   crypt('Password123!', gen_salt('bf')),
   NOW(), '2026-01-10T11:00:00Z', NOW(),
   '{"provider":"email","providers":["email"]}',
   '{"username":"Rookie"}',
   'authenticated', 'authenticated', '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- ── PROFILES ────────────────────────────────────────────────

INSERT INTO profiles (
  id, username, is_admin,
  total_xp, global_level,
  musculation_xp, musculation_level,
  running_xp, running_level,
  calisthenics_xp, calisthenics_level,
  crossfit_xp, crossfit_level,
  current_streak, longest_streak,
  last_activity_date, fc_max,
  share_performances, share_weight, share_photos,
  preferred_pace_unit, created_at
) VALUES
  -- Admin : multi-sport, admin
  ('a0000000-0000-0000-0000-000000000001', 'Admin', true,
   14000, 12,
   8500, 10, 3800, 8,
   700, 4, 480, 3,
   12, 35, '2026-03-19', 185,
   true, true, false, 'min/km', '2025-09-01T08:00:00Z'),

  -- Atlas : powerlifter, haut niveau muscu
  ('a0000000-0000-0000-0000-000000000002', 'Atlas', false,
   11000, 11,
   9500, 11, 700, 4,
   200, 2, 300, 2,
   22, 30, '2026-03-18', 190,
   true, false, false, 'min/km', '2025-09-05T10:00:00Z'),

  -- Spartacus : runner + crossfit
  ('a0000000-0000-0000-0000-000000000003', 'Spartacus', false,
   9000, 10,
   2600, 7, 5800, 9,
   150, 2, 350, 3,
   18, 28, '2026-03-17', 178,
   true, false, false, 'min/km', '2025-09-10T12:00:00Z'),

  -- Valkyrie : spécialiste calisthénie
  ('a0000000-0000-0000-0000-000000000004', 'Valkyrie', false,
   5000, 8,
   2800, 7, 1400, 6,
   1000, 5, 250, 2,
   5, 20, '2026-03-16', 182,
   true, true, false, 'min/km', '2025-10-01T09:00:00Z'),

  -- Titan : muscu + crossfit
  ('a0000000-0000-0000-0000-000000000005', 'Titan', false,
   2800, 7,
   2400, 7, 100, 2,
   0, 1, 360, 3,
   3, 10, '2026-03-10', 175,
   true, false, false, 'min/km', '2025-10-15T14:00:00Z'),

  -- Rookie : débutant
  ('a0000000-0000-0000-0000-000000000006', 'Rookie', false,
   350, 3,
   350, 3, 0, 1,
   0, 1, 0, 1,
   2, 5, '2026-03-01', NULL,
   false, false, false, 'min/km', '2026-01-10T11:00:00Z')

ON CONFLICT (id) DO UPDATE SET
  username            = EXCLUDED.username,
  is_admin            = EXCLUDED.is_admin,
  total_xp            = EXCLUDED.total_xp,
  global_level        = EXCLUDED.global_level,
  musculation_xp      = EXCLUDED.musculation_xp,
  musculation_level   = EXCLUDED.musculation_level,
  running_xp          = EXCLUDED.running_xp,
  running_level       = EXCLUDED.running_level,
  calisthenics_xp     = EXCLUDED.calisthenics_xp,
  calisthenics_level  = EXCLUDED.calisthenics_level,
  crossfit_xp         = EXCLUDED.crossfit_xp,
  crossfit_level      = EXCLUDED.crossfit_level,
  current_streak      = EXCLUDED.current_streak,
  longest_streak      = EXCLUDED.longest_streak,
  last_activity_date  = EXCLUDED.last_activity_date,
  fc_max              = EXCLUDED.fc_max,
  share_performances  = EXCLUDED.share_performances,
  share_weight        = EXCLUDED.share_weight,
  share_photos        = EXCLUDED.share_photos,
  preferred_pace_unit = EXCLUDED.preferred_pace_unit;
