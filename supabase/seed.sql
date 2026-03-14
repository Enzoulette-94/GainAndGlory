-- ============================================================
-- GAIN & GLORY — Seed complet
-- 6 utilisateurs · 3 mois (Déc 2025 → Mar 2026)
-- ============================================================
-- Exécuter dans l'éditeur SQL Supabase (après schema.sql)
-- ============================================================

-- ============================================================
-- 1. AUTH USERS
-- ============================================================

INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000001', 'admin@gainandglory.com',
   crypt('Admin1234!', gen_salt('bf')), NOW(), '2025-09-01T08:00:00Z', NOW(),
   '{"provider":"email","providers":["email"]}', '{"username":"Admin"}', 'authenticated', 'authenticated', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'atlas@gainandglory.com',
   crypt('Password123!', gen_salt('bf')), NOW(), '2025-09-05T10:00:00Z', NOW(),
   '{"provider":"email","providers":["email"]}', '{"username":"Atlas"}', 'authenticated', 'authenticated', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000003', 'spartacus@gainandglory.com',
   crypt('Password123!', gen_salt('bf')), NOW(), '2025-09-10T12:00:00Z', NOW(),
   '{"provider":"email","providers":["email"]}', '{"username":"Spartacus"}', 'authenticated', 'authenticated', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000004', 'valkyrie@gainandglory.com',
   crypt('Password123!', gen_salt('bf')), NOW(), '2025-10-01T09:00:00Z', NOW(),
   '{"provider":"email","providers":["email"]}', '{"username":"Valkyrie"}', 'authenticated', 'authenticated', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000005', 'titan@gainandglory.com',
   crypt('Password123!', gen_salt('bf')), NOW(), '2025-10-15T14:00:00Z', NOW(),
   '{"provider":"email","providers":["email"]}', '{"username":"Titan"}', 'authenticated', 'authenticated', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000006', 'rookie@gainandglory.com',
   crypt('Password123!', gen_salt('bf')), NOW(), '2026-01-10T11:00:00Z', NOW(),
   '{"provider":"email","providers":["email"]}', '{"username":"Rookie"}', 'authenticated', 'authenticated', '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. PROFILES
-- ============================================================

INSERT INTO profiles (
  id, username, is_admin,
  total_xp, global_level,
  musculation_xp, musculation_level,
  running_xp, running_level,
  current_streak, longest_streak,
  last_activity_date, fc_max,
  share_performances, share_weight, share_photos,
  preferred_pace_unit, created_at
) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Admin', true,
   12000, 11, 8200, 10, 3500, 8,
   12, 35, '2026-03-05', 185,
   true, true, false, 'min/km', '2025-09-01T08:00:00Z'),
  ('a0000000-0000-0000-0000-000000000002', 'Atlas', false,
   9800, 10, 9000, 10, 700, 4,
   22, 30, '2026-03-05', 190,
   true, false, false, 'min/km', '2025-09-05T10:00:00Z'),
  ('a0000000-0000-0000-0000-000000000003', 'Spartacus', false,
   8500, 10, 2600, 7, 5500, 9,
   18, 28, '2026-03-04', 178,
   true, false, false, 'min/km', '2025-09-10T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000004', 'Valkyrie', false,
   4200, 8, 2800, 7, 1400, 6,
   5, 20, '2026-03-03', 182,
   true, true, false, 'min/km', '2025-10-01T09:00:00Z'),
  ('a0000000-0000-0000-0000-000000000005', 'Titan', false,
   2200, 7, 2100, 7, 100, 2,
   3, 10, '2026-03-01', 175,
   true, false, false, 'min/km', '2025-10-15T14:00:00Z'),
  ('a0000000-0000-0000-0000-000000000006', 'Rookie', false,
   350, 3, 350, 3, 0, 1,
   2, 5, '2026-02-28', NULL,
   false, false, false, 'min/km', '2026-01-10T11:00:00Z')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  is_admin = EXCLUDED.is_admin,
  total_xp = EXCLUDED.total_xp,
  global_level = EXCLUDED.global_level,
  musculation_xp = EXCLUDED.musculation_xp,
  musculation_level = EXCLUDED.musculation_level,
  running_xp = EXCLUDED.running_xp,
  running_level = EXCLUDED.running_level,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  last_activity_date = EXCLUDED.last_activity_date,
  fc_max = EXCLUDED.fc_max,
  share_performances = EXCLUDED.share_performances,
  share_weight = EXCLUDED.share_weight,
  share_photos = EXCLUDED.share_photos,
  preferred_pace_unit = EXCLUDED.preferred_pace_unit;

-- ============================================================
-- 3. EXERCISES (défauts)
-- ============================================================

INSERT INTO exercises (name, muscle_group, is_default, usage_count) VALUES
  ('Développé couché',       'pectoraux', true, 48),
  ('Développé incliné',      'pectoraux', true, 22),
  ('Développé décliné',      'pectoraux', true, 8),
  ('Écarté',                 'pectoraux', true, 12),
  ('Pompes',                 'pectoraux', true, 18),
  ('Dips',                   'pectoraux', true, 15),
  ('Pull-over',              'pectoraux', true, 7),
  ('Tractions',              'dos',       true, 30),
  ('Rowing barre',           'dos',       true, 38),
  ('Rowing haltère',         'dos',       true, 20),
  ('Tirage vertical',        'dos',       true, 28),
  ('Tirage horizontal',      'dos',       true, 22),
  ('Soulevé de terre',       'dos',       true, 45),
  ('Face pull',              'dos',       true, 15),
  ('Squat',                  'jambes',    true, 52),
  ('Front squat',            'jambes',    true, 12),
  ('Presse à cuisses',       'jambes',    true, 26),
  ('Leg curl',               'jambes',    true, 20),
  ('Leg extension',          'jambes',    true, 18),
  ('Fentes',                 'jambes',    true, 22),
  ('Bulgarian split squat',  'jambes',    true, 10),
  ('Mollets debout',         'jambes',    true, 15),
  ('Mollets assis',          'jambes',    true, 10),
  ('Développé militaire',    'epaules',   true, 32),
  ('Développé Arnold',       'epaules',   true, 12),
  ('Élévations latérales',   'epaules',   true, 28),
  ('Élévations frontales',   'epaules',   true, 10),
  ('Oiseau',                 'epaules',   true, 8),
  ('Rowing menton',          'epaules',   true, 12),
  ('Curl barre',             'biceps',    true, 32),
  ('Curl haltères',          'biceps',    true, 28),
  ('Curl marteau',           'biceps',    true, 20),
  ('Curl pupitre',           'biceps',    true, 15),
  ('Curl concentration',     'biceps',    true, 10),
  ('Dips triceps',           'triceps',   true, 20),
  ('Extensions nuque',       'triceps',   true, 18),
  ('Extensions poulie haute','triceps',   true, 22),
  ('Kickback',               'triceps',   true, 12),
  ('Barre au front',         'triceps',   true, 15),
  ('Crunch',                 'abdos',     true, 20),
  ('Planche',                'abdos',     true, 18),
  ('Relevé de jambes',       'abdos',     true, 15),
  ('Russian twist',          'abdos',     true, 12),
  ('Mountain climbers',      'abdos',     true, 10),
  ('Bicycle crunch',         'abdos',     true, 8)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. WORKOUT SESSIONS + SETS
-- ============================================================

DO $$
DECLARE
  e_dc   UUID; e_di  UUID; e_sq  UUID; e_sdl UUID;
  e_pm   UUID; e_rb  UUID; e_tv  UUID; e_cb  UUID;
  e_ct   UUID; e_pa  UUID; e_f   UUID; e_el  UUID;
  s UUID;
  u_admin UUID := 'a0000000-0000-0000-0000-000000000001';
  u_atlas UUID := 'a0000000-0000-0000-0000-000000000002';
  u_spart UUID := 'a0000000-0000-0000-0000-000000000003';
  u_valk  UUID := 'a0000000-0000-0000-0000-000000000004';
  u_titan UUID := 'a0000000-0000-0000-0000-000000000005';
  u_rookie UUID := 'a0000000-0000-0000-0000-000000000006';
BEGIN
  SELECT id INTO e_dc  FROM exercises WHERE name = 'Développé couché'       LIMIT 1;
  SELECT id INTO e_di  FROM exercises WHERE name = 'Développé incliné'      LIMIT 1;
  SELECT id INTO e_sq  FROM exercises WHERE name = 'Squat'                  LIMIT 1;
  SELECT id INTO e_sdl FROM exercises WHERE name = 'Soulevé de terre'       LIMIT 1;
  SELECT id INTO e_pm  FROM exercises WHERE name = 'Développé militaire'    LIMIT 1;
  SELECT id INTO e_rb  FROM exercises WHERE name = 'Rowing barre'           LIMIT 1;
  SELECT id INTO e_tv  FROM exercises WHERE name = 'Tirage vertical'        LIMIT 1;
  SELECT id INTO e_cb  FROM exercises WHERE name = 'Curl barre'             LIMIT 1;
  SELECT id INTO e_ct  FROM exercises WHERE name = 'Extensions poulie haute' LIMIT 1;
  SELECT id INTO e_pa  FROM exercises WHERE name = 'Presse à cuisses'       LIMIT 1;
  SELECT id INTO e_f   FROM exercises WHERE name = 'Fentes'                 LIMIT 1;
  SELECT id INTO e_el  FROM exercises WHERE name = 'Élévations latérales'   LIMIT 1;

  -- ──────────────────────────────────────────────────────────
  -- ADMIN  (Push/Pull/Legs 3x/semaine, ~11 séances dans la seed)
  -- ──────────────────────────────────────────────────────────

  -- S1 2025-12-02 Push
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_admin,'2025-12-02T07:30:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,5,120),(s,e_dc,2,5,120),(s,e_dc,3,5,120),
    (s,e_di,1,8,82), (s,e_di,2,8,82), (s,e_di,3,8,82),
    (s,e_pm,1,8,78), (s,e_pm,2,8,78);

  -- S2 2025-12-04 Pull
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_admin,'2025-12-04T07:30:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sdl,1,5,180),(s,e_sdl,2,5,180),(s,e_sdl,3,5,180),
    (s,e_rb, 1,8,90), (s,e_rb, 2,8,90), (s,e_rb, 3,8,90),
    (s,e_tv, 1,10,70),(s,e_tv, 2,10,70),(s,e_tv, 3,10,70);

  -- S3 2025-12-07 Legs
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_admin,'2025-12-07T07:30:00Z','mort');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sq,1,5,140),(s,e_sq,2,5,140),(s,e_sq,3,5,140),(s,e_sq,4,5,140),
    (s,e_pa,1,12,120),(s,e_pa,2,12,120),(s,e_pa,3,12,120),
    (s,e_f, 1,10,60),(s,e_f, 2,10,60);

  -- S4 2025-12-09 Épaules & Bras
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_admin,'2025-12-09T07:00:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_pm,1,8,80),(s,e_pm,2,8,80),(s,e_pm,3,8,80),
    (s,e_cb,1,10,50),(s,e_cb,2,10,50),(s,e_cb,3,10,50),
    (s,e_ct,1,12,40),(s,e_ct,2,12,40),(s,e_ct,3,12,40),
    (s,e_el,1,15,16),(s,e_el,2,15,16);

  -- S5 2025-12-12 Push
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_admin,'2025-12-12T07:30:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,5,122),(s,e_dc,2,5,122),(s,e_dc,3,5,122),
    (s,e_di,1,8,84), (s,e_di,2,8,84), (s,e_di,3,8,84),
    (s,e_pm,1,8,80), (s,e_pm,2,8,80);

  -- S6 2025-12-16 Pull
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_admin,'2025-12-16T07:30:00Z','facile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sdl,1,5,182),(s,e_sdl,2,5,182),(s,e_sdl,3,5,182),
    (s,e_rb, 1,8,92), (s,e_rb, 2,8,92), (s,e_rb, 3,8,92),
    (s,e_tv, 1,10,72),(s,e_tv, 2,10,72),(s,e_tv, 3,10,72);

  -- S7 2026-01-01 Push (new_year_athlete)
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_admin,'2026-01-01T08:00:00Z','facile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,5,122),(s,e_dc,2,5,122),(s,e_dc,3,5,122),
    (s,e_pm,1,8,80), (s,e_pm,2,8,80), (s,e_pm,3,8,80),
    (s,e_cb,1,10,50),(s,e_cb,2,10,50);

  -- S8 2026-01-06 Legs
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_admin,'2026-01-06T07:30:00Z','mort');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sq,1,5,145),(s,e_sq,2,5,145),(s,e_sq,3,5,145),(s,e_sq,4,5,145),
    (s,e_pa,1,12,130),(s,e_pa,2,12,130),(s,e_pa,3,12,130),
    (s,e_f, 1,10,62),(s,e_f, 2,10,62);

  -- S9 2026-02-03 Push
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_admin,'2026-02-03T07:30:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,5,125),(s,e_dc,2,5,125),(s,e_dc,3,5,125),
    (s,e_di,1,8,86), (s,e_di,2,8,86), (s,e_di,3,8,86),
    (s,e_pm,1,8,82), (s,e_pm,2,8,82);

  -- S10 2026-02-14 Bras (valentine_solo)
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_admin,'2026-02-14T06:30:00Z','facile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_cb,1,10,52),(s,e_cb,2,10,52),(s,e_cb,3,10,52),
    (s,e_ct,1,12,42),(s,e_ct,2,12,42),(s,e_ct,3,12,42),
    (s,e_el,1,15,18),(s,e_el,2,15,18);

  -- S11 2026-03-03 Pull
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_admin,'2026-03-03T07:30:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sdl,1,5,188),(s,e_sdl,2,5,188),(s,e_sdl,3,5,188),
    (s,e_rb, 1,8,94), (s,e_rb, 2,8,94), (s,e_rb, 3,8,94),
    (s,e_tv, 1,10,74),(s,e_tv, 2,10,74),(s,e_tv, 3,10,74);

  -- ──────────────────────────────────────────────────────────
  -- ATLAS  (Push/Pull/Legs 4x/semaine, charges élevées)
  -- ──────────────────────────────────────────────────────────

  -- S1 2025-12-01 Push
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_atlas,'2025-12-01T18:00:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,5,130),(s,e_dc,2,5,130),(s,e_dc,3,5,130),(s,e_dc,4,5,130),
    (s,e_di,1,8,92), (s,e_di,2,8,92), (s,e_di,3,8,92),
    (s,e_pm,1,8,85), (s,e_pm,2,8,85), (s,e_pm,3,8,85);

  -- S2 2025-12-03 Pull
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_atlas,'2025-12-03T18:00:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sdl,1,5,200),(s,e_sdl,2,5,200),(s,e_sdl,3,5,200),(s,e_sdl,4,5,200),
    (s,e_rb, 1,8,100),(s,e_rb, 2,8,100),(s,e_rb, 3,8,100),
    (s,e_tv, 1,10,80),(s,e_tv, 2,10,80),(s,e_tv, 3,10,80);

  -- S3 2025-12-05 Legs
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_atlas,'2025-12-05T18:00:00Z','mort');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sq,1,5,160),(s,e_sq,2,5,160),(s,e_sq,3,5,160),(s,e_sq,4,5,160),(s,e_sq,5,5,160),
    (s,e_pa,1,12,150),(s,e_pa,2,12,150),(s,e_pa,3,12,150),
    (s,e_f, 1,10,72),(s,e_f, 2,10,72),(s,e_f, 3,10,72);

  -- S4 2025-12-08 Push
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_atlas,'2025-12-08T18:00:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,5,132),(s,e_dc,2,5,132),(s,e_dc,3,5,132),(s,e_dc,4,5,132),
    (s,e_di,1,8,94), (s,e_di,2,8,94), (s,e_di,3,8,94),
    (s,e_pm,1,8,87), (s,e_pm,2,8,87), (s,e_pm,3,8,87);

  -- S5 2025-12-11 Pull
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_atlas,'2025-12-11T18:00:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sdl,1,5,202),(s,e_sdl,2,5,202),(s,e_sdl,3,5,202),(s,e_sdl,4,5,202),
    (s,e_rb, 1,8,102),(s,e_rb, 2,8,102),(s,e_rb, 3,8,102),
    (s,e_tv, 1,10,82),(s,e_tv, 2,10,82),(s,e_tv, 3,10,82);

  -- S6 2026-01-05 Pull
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_atlas,'2026-01-05T18:00:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sdl,1,5,205),(s,e_sdl,2,5,205),(s,e_sdl,3,5,205),(s,e_sdl,4,5,205),
    (s,e_rb, 1,8,104),(s,e_rb, 2,8,104),(s,e_rb, 3,8,104),
    (s,e_tv, 1,10,84),(s,e_tv, 2,10,84),(s,e_tv, 3,10,84);

  -- S7 2026-01-08 Legs
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_atlas,'2026-01-08T18:00:00Z','mort');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sq,1,5,165),(s,e_sq,2,5,165),(s,e_sq,3,5,165),(s,e_sq,4,5,165),(s,e_sq,5,5,165),
    (s,e_pa,1,12,155),(s,e_pa,2,12,155),(s,e_pa,3,12,155),
    (s,e_f, 1,10,75),(s,e_f, 2,10,75),(s,e_f, 3,10,75);

  -- S8 2026-02-10 Push
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_atlas,'2026-02-10T18:00:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,5,135),(s,e_dc,2,5,135),(s,e_dc,3,5,135),(s,e_dc,4,5,135),
    (s,e_di,1,8,95), (s,e_di,2,8,95), (s,e_di,3,8,95),
    (s,e_pm,1,8,90), (s,e_pm,2,8,90), (s,e_pm,3,8,90);

  -- S9 2026-03-04 Pull
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_atlas,'2026-03-04T18:00:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sdl,1,5,207),(s,e_sdl,2,5,207),(s,e_sdl,3,5,207),(s,e_sdl,4,5,207),
    (s,e_rb, 1,8,105),(s,e_rb, 2,8,105),(s,e_rb, 3,8,105),
    (s,e_tv, 1,10,85),(s,e_tv, 2,10,85),(s,e_tv, 3,10,85);

  -- ──────────────────────────────────────────────────────────
  -- SPARTACUS  (muscu légère 2x/mois, coureur principal)
  -- ──────────────────────────────────────────────────────────

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_spart,'2025-12-03T19:00:00Z','facile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,10,80),(s,e_dc,2,10,80),
    (s,e_sq,1,12,80),(s,e_sq,2,12,80),
    (s,e_pm,1,12,60),(s,e_pm,2,12,60);

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_spart,'2025-12-17T19:00:00Z','facile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sdl,1,8,100),(s,e_sdl,2,8,100),
    (s,e_sq, 1,10,90),(s,e_sq, 2,10,90),
    (s,e_rb, 1,10,70),(s,e_rb, 2,10,70);

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_spart,'2026-01-14T19:00:00Z','facile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,10,82),(s,e_dc,2,10,82),
    (s,e_sq,1,12,82),(s,e_sq,2,12,82),
    (s,e_pm,1,12,62),(s,e_pm,2,12,62);

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_spart,'2026-02-18T19:00:00Z','facile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sdl,1,8,105),(s,e_sdl,2,8,105),
    (s,e_sq, 1,10,92),(s,e_sq, 2,10,92),
    (s,e_rb, 1,10,72),(s,e_rb, 2,10,72);

  -- ──────────────────────────────────────────────────────────
  -- VALKYRIE  (3 séances)
  -- ──────────────────────────────────────────────────────────

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_valk,'2025-12-10T12:00:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,10,55),(s,e_dc,2,10,55),(s,e_dc,3,10,55),
    (s,e_sq,1,12,60),(s,e_sq,2,12,60),
    (s,e_di,1,10,45),(s,e_di,2,10,45);

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_valk,'2026-01-20T12:00:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,10,58),(s,e_dc,2,10,58),(s,e_dc,3,10,58),
    (s,e_sq,1,12,62),(s,e_sq,2,12,62),
    (s,e_rb,1,10,50),(s,e_rb,2,10,50);

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_valk,'2026-02-25T12:00:00Z','facile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_pm,1,10,45),(s,e_pm,2,10,45),
    (s,e_sq,1,12,65),(s,e_sq,2,12,65),
    (s,e_cb,1,12,30),(s,e_cb,2,12,30);

  -- ──────────────────────────────────────────────────────────
  -- TITAN  (3 séances costauds)
  -- ──────────────────────────────────────────────────────────

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_titan,'2025-12-20T17:00:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,8,110),(s,e_dc,2,8,110),(s,e_dc,3,8,110),
    (s,e_sq,1,8,120),(s,e_sq,2,8,120),(s,e_sq,3,8,120),
    (s,e_pm,1,8,70),(s,e_pm,2,8,70);

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_titan,'2026-01-15T17:00:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sdl,1,5,150),(s,e_sdl,2,5,150),(s,e_sdl,3,5,150),
    (s,e_rb, 1,8,95), (s,e_rb, 2,8,95), (s,e_rb, 3,8,95),
    (s,e_tv, 1,10,65),(s,e_tv, 2,10,65);

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_titan,'2026-03-01T17:00:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,8,112),(s,e_dc,2,8,112),(s,e_dc,3,8,112),
    (s,e_sq,1,8,122),(s,e_sq,2,8,122),(s,e_sq,3,8,122),
    (s,e_pm,1,8,72),(s,e_pm,2,8,72);

  -- ──────────────────────────────────────────────────────────
  -- ROOKIE  (2 séances légères)
  -- ──────────────────────────────────────────────────────────

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_rookie,'2026-01-20T20:00:00Z','facile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,10,40),(s,e_dc,2,10,40),
    (s,e_sq,1,12,40),(s,e_sq,2,12,40),
    (s,e_pm,1,12,30),(s,e_pm,2,12,30);

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES (s,u_rookie,'2026-02-10T20:00:00Z','facile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,10,42),(s,e_dc,2,10,42),
    (s,e_sq,1,12,42),(s,e_sq,2,12,42),
    (s,e_pm,1,12,32),(s,e_pm,2,12,32);

END $$;

-- ============================================================
-- 5. RUNNING SESSIONS
-- ============================================================

INSERT INTO running_sessions (user_id, date, distance, duration, pace_min_per_km, run_type, elevation_gain, avg_heart_rate, max_heart_rate, weather_temp, weather_condition, feedback, notes) VALUES

-- ADMIN (coureur régulier, ~90 km dans la seed)
('a0000000-0000-0000-0000-000000000001','2025-12-06T06:30:00Z',
 10, 3120, 5.20, 'endurance', 85, 155, 172, 5, 'nuageux', 'difficile', 'Sortie matinale froide'),
('a0000000-0000-0000-0000-000000000001','2025-12-14T07:00:00Z',
 15, 4860, 5.40, 'endurance', 180, 162, 178, 2, 'nuageux', 'difficile', 'Trail en forêt'),
('a0000000-0000-0000-0000-000000000001','2025-12-28T08:00:00Z',
 5, 1440, 4.80, 'tempo', 20, 168, 185, 3, 'ensoleille', 'difficile', NULL),
('a0000000-0000-0000-0000-000000000001','2026-01-12T07:00:00Z',
 12, 3840, 5.20, 'endurance', 120, 158, 175, 1, 'neige', 'difficile', 'Course dans la neige'),
('a0000000-0000-0000-0000-000000000001','2026-02-01T07:30:00Z',
 10, 3000, 5.00, 'tempo', 80, 165, 182, 8, 'nuageux', 'difficile', NULL),
('a0000000-0000-0000-0000-000000000001','2026-02-22T08:00:00Z',
 20, 6600, 5.50, 'endurance', 250, 158, 174, 10, 'ensoleille', 'difficile', 'Sortie longue'),
('a0000000-0000-0000-0000-000000000001','2026-03-05T07:00:00Z',
 18, 5760, 5.33, 'endurance', 200, 160, 176, 12, 'ensoleille', 'facile', NULL),

-- ATLAS (peu de course)
('a0000000-0000-0000-0000-000000000002','2025-12-22T09:00:00Z',
 5, 1650, 5.50, 'endurance', 30, 162, 178, 4, 'nuageux', 'difficile', NULL),
('a0000000-0000-0000-0000-000000000002','2026-02-08T09:00:00Z',
 10, 3300, 5.50, 'endurance', 60, 165, 180, 9, 'ensoleille', 'difficile', NULL),
('a0000000-0000-0000-0000-000000000002','2026-03-05T09:00:00Z',
 4, 1320, 5.50, 'endurance', 20, 160, 175, 13, 'ensoleille', 'facile', NULL),

-- SPARTACUS (runner principal, ~213 km dans la seed)
('a0000000-0000-0000-0000-000000000003','2025-12-01T06:00:00Z',
 15, 4350, 4.83, 'endurance', 120, 155, 170, 6, 'nuageux', 'facile', 'Sortie fond'),
('a0000000-0000-0000-0000-000000000003','2025-12-05T06:30:00Z',
 10, 2640, 4.40, 'tempo', 80, 170, 188, 5, 'ensoleille', 'difficile', 'Sortie tempo'),
('a0000000-0000-0000-0000-000000000003','2025-12-10T06:00:00Z',
 21.097, 5820, 4.62, 'endurance', 210, 160, 178, 4, 'nuageux', 'difficile', 'Semi-marathon'),
('a0000000-0000-0000-0000-000000000003','2025-12-17T06:00:00Z',
 12, 3360, 4.67, 'endurance', 130, 158, 174, 3, 'nuageux', 'facile', NULL),
('a0000000-0000-0000-0000-000000000003','2025-12-22T07:00:00Z',
 8, 2160, 4.50, 'tempo', 50, 168, 185, 2, 'nuageux', 'difficile', NULL),
('a0000000-0000-0000-0000-000000000003','2026-01-04T06:00:00Z',
 20, 5700, 4.75, 'endurance', 200, 158, 176, 0, 'neige', 'difficile', 'Première sortie 2026'),
('a0000000-0000-0000-0000-000000000003','2026-01-11T07:00:00Z',
 10, 2700, 4.50, 'tempo', 80, 170, 190, 3, 'nuageux', 'difficile', NULL),
('a0000000-0000-0000-0000-000000000003','2026-01-18T06:30:00Z',
 25, 7200, 4.80, 'endurance', 280, 155, 172, 5, 'ensoleille', 'difficile', 'Sortie longue'),
('a0000000-0000-0000-0000-000000000003','2026-01-25T07:00:00Z',
 8, 2160, 4.50, 'fractionne', 40, 178, 195, 6, 'ensoleille', 'difficile', 'Séance fractionné'),
('a0000000-0000-0000-0000-000000000003','2026-02-01T06:00:00Z',
 15, 4200, 4.67, 'endurance', 150, 158, 175, 7, 'nuageux', 'facile', NULL),
('a0000000-0000-0000-0000-000000000003','2026-02-08T06:00:00Z',
 21.097, 5700, 4.53, 'endurance', 220, 162, 180, 8, 'ensoleille', 'difficile', 'Semi objectif'),
('a0000000-0000-0000-0000-000000000003','2026-02-15T07:00:00Z',
 10, 2640, 4.40, 'tempo', 90, 172, 190, 10, 'ensoleille', 'difficile', NULL),
('a0000000-0000-0000-0000-000000000003','2026-03-01T06:00:00Z',
 18, 5040, 4.67, 'endurance', 180, 160, 176, 11, 'ensoleille', 'facile', NULL),
('a0000000-0000-0000-0000-000000000003','2026-03-04T07:00:00Z',
 10, 2700, 4.50, 'tempo', 80, 168, 185, 12, 'ensoleille', 'difficile', NULL),

-- VALKYRIE (progression régulière)
('a0000000-0000-0000-0000-000000000004','2025-12-08T08:00:00Z',
 5, 1650, 5.50, 'endurance', 30, 168, 182, 5, 'nuageux', 'difficile', 'Première course'),
('a0000000-0000-0000-0000-000000000004','2025-12-20T09:00:00Z',
 8, 2640, 5.50, 'endurance', 50, 165, 180, 3, 'nuageux', 'difficile', NULL),
('a0000000-0000-0000-0000-000000000004','2026-01-10T09:00:00Z',
 8, 2520, 5.25, 'endurance', 55, 162, 178, 4, 'ensoleille', 'difficile', NULL),
('a0000000-0000-0000-0000-000000000004','2026-01-25T09:00:00Z',
 10, 3150, 5.25, 'endurance', 70, 160, 176, 7, 'ensoleille', 'facile', '10 km !'),
('a0000000-0000-0000-0000-000000000004','2026-02-15T09:00:00Z',
 10, 3060, 5.10, 'endurance', 75, 158, 175, 10, 'ensoleille', 'facile', NULL),
('a0000000-0000-0000-0000-000000000004','2026-03-03T09:00:00Z',
 5, 1500, 5.00, 'tempo', 25, 165, 182, 12, 'ensoleille', 'difficile', NULL),

-- TITAN (1 run)
('a0000000-0000-0000-0000-000000000005','2026-02-20T17:30:00Z',
 5, 1800, 6.00, 'endurance', 20, 175, 188, 9, 'nuageux', 'mort', 'Première course tentée'),

-- ROOKIE (0 course)
-- Pas de running sessions pour Rookie

-- Admin jan 1 run bonus
('a0000000-0000-0000-0000-000000000001','2026-01-01T16:00:00Z',
 5, 1500, 5.00, 'endurance', 30, 160, 175, 2, 'ensoleille', 'facile', 'Foulée du Nouvel An');

-- ============================================================
-- 6. WEIGHT ENTRIES
-- ============================================================

INSERT INTO weight_entries (user_id, date, weight, notes) VALUES
-- Admin
('a0000000-0000-0000-0000-000000000001','2025-12-01', 82.5, 'Prise de masse'),
('a0000000-0000-0000-0000-000000000001','2025-12-15', 82.8, NULL),
('a0000000-0000-0000-0000-000000000001','2026-01-01', 83.1, 'Début d''année'),
('a0000000-0000-0000-0000-000000000001','2026-01-15', 83.4, NULL),
('a0000000-0000-0000-0000-000000000001','2026-02-01', 83.0, NULL),
('a0000000-0000-0000-0000-000000000001','2026-02-15', 82.7, NULL),
('a0000000-0000-0000-0000-000000000001','2026-03-01', 82.5, NULL),
-- Valkyrie
('a0000000-0000-0000-0000-000000000004','2025-12-01', 68.0, 'Début du suivi'),
('a0000000-0000-0000-0000-000000000004','2025-12-15', 67.5, NULL),
('a0000000-0000-0000-0000-000000000004','2026-01-01', 67.0, 'Bonne année !'),
('a0000000-0000-0000-0000-000000000004','2026-01-15', 66.8, NULL),
('a0000000-0000-0000-0000-000000000004','2026-02-01', 66.5, NULL),
('a0000000-0000-0000-0000-000000000004','2026-03-01', 66.0, 'Objectif atteint !'),
-- Rookie
('a0000000-0000-0000-0000-000000000006','2026-01-10', 75.0, 'Début du suivi'),
('a0000000-0000-0000-0000-000000000006','2026-02-01', 74.2, NULL),
('a0000000-0000-0000-0000-000000000006','2026-03-01', 73.5, NULL);

-- ============================================================
-- 7. PERSONAL GOALS
-- ============================================================

INSERT INTO personal_goals (user_id, type, title, description, target_value, current_value, unit, deadline, status, completed_at) VALUES
-- Admin
('a0000000-0000-0000-0000-000000000001','performance','Développé couché 130 kg',
 'Atteindre 130 kg au DC', 130, 125, 'kg', '2026-06-01', 'active', NULL),
('a0000000-0000-0000-0000-000000000001','volume','50 km en janvier',
 'Courir 50 km en janvier 2026', 50, 47, 'km', '2026-01-31', 'completed', '2026-01-28T20:00:00Z'),
('a0000000-0000-0000-0000-000000000001','consistency','Séance quotidienne',
 '30 jours consécutifs d''activité', 30, 30, 'jours', '2026-01-31', 'completed', '2026-01-31T20:00:00Z'),

-- Atlas
('a0000000-0000-0000-0000-000000000002','performance','Soulevé de terre 210 kg',
 'Objectif : SDT 210 kg', 210, 207, 'kg', '2026-06-01', 'active', NULL),
('a0000000-0000-0000-0000-000000000002','volume','100 séances muscu',
 'Cent séances depuis le début', 100, 68, 'séances', '2026-12-31', 'active', NULL),

-- Spartacus
('a0000000-0000-0000-0000-000000000003','performance','Sub 4:30 au km',
 'Courir en moins de 4:30/km sur 10 km', 4.5, 4.4, 'min/km', '2026-05-01', 'active', NULL),
('a0000000-0000-0000-0000-000000000003','performance','Semi-marathon en 1h30',
 'Objectif semi en 1h30', 90, 95, 'minutes', '2026-09-01', 'active', NULL),
('a0000000-0000-0000-0000-000000000003','volume','500 km cumulés',
 '500 km de course à pied', 500, 213, 'km', '2026-12-31', 'active', NULL),
('a0000000-0000-0000-0000-000000000003','consistency','Courir 3x/semaine',
 'Maintenir 3 sorties par semaine pendant 2 mois', 8, 8, 'semaines', '2026-02-28', 'completed', '2026-02-28T20:00:00Z'),

-- Valkyrie
('a0000000-0000-0000-0000-000000000004','performance','Courir 10 km sans s''arrêter',
 'Premier 10 km complet', 10, 10, 'km', '2026-02-01', 'completed', '2026-01-25T09:00:00Z'),
('a0000000-0000-0000-0000-000000000004','weight','Atteindre 65 kg',
 'Objectif poids : 65 kg', 65, 66, 'kg', '2026-06-01', 'active', NULL),

-- Titan
('a0000000-0000-0000-0000-000000000005','performance','Squat 130 kg',
 'Squat à 130 kg', 130, 122, 'kg', '2026-09-01', 'active', NULL),

-- Rookie
('a0000000-0000-0000-0000-000000000006','consistency','5 séances muscu',
 'Faire 5 séances de musculation', 5, 2, 'séances', '2026-04-01', 'active', NULL);

-- ============================================================
-- 8. COMMUNITY CHALLENGES
-- ============================================================

INSERT INTO community_challenges (id, created_by, title, description, type, target_value, unit, start_date, end_date, is_flash, status, approved_by, approved_at) VALUES
('c1000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000001',
 'Défi Janvier : 200 km collectifs',
 'Courons 200 km ensemble en janvier !',
 'running', 200000, 'm',
 '2026-01-01T00:00:00Z', '2026-01-31T23:59:59Z',
 false, 'approved',
 'a0000000-0000-0000-0000-000000000001', '2025-12-28T10:00:00Z'),
('c1000000-0000-0000-0000-000000000002',
 'a0000000-0000-0000-0000-000000000003',
 '⚡ Flash : 50 000 kg en 24h',
 'Tous ensemble : 50 000 kg de tonnage en 24 heures !',
 'musculation', 50000, 'kg',
 '2026-02-15T08:00:00Z', '2026-02-16T08:00:00Z',
 true, 'approved',
 'a0000000-0000-0000-0000-000000000001', '2026-02-14T20:00:00Z'),
('c1000000-0000-0000-0000-000000000003',
 'a0000000-0000-0000-0000-000000000002',
 'Défi Mars : 300 km collectifs',
 'On vise 300 km pour fêter le printemps !',
 'running', 300000, 'm',
 '2026-03-01T00:00:00Z', '2026-03-31T23:59:59Z',
 false, 'approved',
 'a0000000-0000-0000-0000-000000000001', '2026-02-26T10:00:00Z');

INSERT INTO challenge_participations (challenge_id, user_id, contribution, completed, completed_at) VALUES
-- Défi Janvier (c1)
('c1000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001', 47000, true,  '2026-01-28T20:00:00Z'),
('c1000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000003', 92097, true,  '2026-01-25T07:00:00Z'),
('c1000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000004', 18000, false, NULL),
('c1000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002', 10000, false, NULL),
-- Flash (c2)
('c1000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001', 9600,  true,  '2026-02-15T14:00:00Z'),
('c1000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000002', 15200, true,  '2026-02-15T16:00:00Z'),
('c1000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000005', 11400, true,  '2026-02-15T18:00:00Z'),
-- Défi Mars (c3 — en cours)
('c1000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000001', 18000, false, NULL),
('c1000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000002', 4000,  false, NULL),
('c1000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000003', 28000, false, NULL),
('c1000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000004', 5000,  false, NULL);

-- ============================================================
-- 9. EVENTS
-- ============================================================

INSERT INTO events (id, user_id, title, description, event_date, type) VALUES
('e1000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000003',
 'Semi-marathon de Nancy',
 'Objectif : sub 1h35. Bib récupéré, prêt !',
 '2026-04-12', 'course'),
('e1000000-0000-0000-0000-000000000009',
 'a0000000-0000-0000-0000-000000000001',
 'Trail des Crêtes',
 '25 km de trail en montagne, 800m D+',
 '2026-05-24', 'trail'),
('e1000000-0000-0000-0000-000000000002',
 'a0000000-0000-0000-0000-000000000004',
 '10 km de Metz',
 'Première course officielle !',
 '2026-04-26', 'course'),
('e1000000-0000-0000-0000-000000000003',
 'a0000000-0000-0000-0000-000000000002',
 'Powerlifting Open',
 'Compétition de force : SDT, Squat, DC',
 '2026-06-07', 'competition'),
('e1000000-0000-0000-0000-000000000004',
 'a0000000-0000-0000-0000-000000000001',
 'Triathlon sprint Lyon',
 '750m nage / 20km vélo / 5km course',
 '2026-07-19', 'triathlon'),
-- Événement passé
('e1000000-0000-0000-0000-000000000005',
 'a0000000-0000-0000-0000-000000000003',
 'Semi-marathon de Paris',
 'Terminé en 1h42 — nouveau PR !',
 '2026-02-22', 'course');

-- ============================================================
-- 10. EVENT PARTICIPATIONS
-- ============================================================

INSERT INTO event_participations (event_id, user_id) VALUES
('e1000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000003'),
('e1000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001'),
('e1000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000004'),
('e1000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000002'),
('e1000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000005'),
('e1000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000001'),
('e1000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000003'),
('e1000000-0000-0000-0000-000000000009','a0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 11. PROFILE RECORDS (Hall of Fame)
-- ============================================================

INSERT INTO profile_records (user_id, title, value, unit, category) VALUES
-- Admin — Musculation
('a0000000-0000-0000-0000-000000000001', 'Développé couché', 125,  'kg',   'musculation'),
('a0000000-0000-0000-0000-000000000001', 'Soulevé de terre',  190,  'kg',   'musculation'),
('a0000000-0000-0000-0000-000000000001', 'Squat',             145,  'kg',   'musculation'),
-- Admin — Course (valeurs en secondes)
('a0000000-0000-0000-0000-000000000001', '10 km',             3120, '10 km','course'),
('a0000000-0000-0000-0000-000000000001', 'Semi-marathon',     6720, '21 km','course'),

-- Atlas — Musculation
('a0000000-0000-0000-0000-000000000002', 'Développé couché', 135,  'kg',   'musculation'),
('a0000000-0000-0000-0000-000000000002', 'Soulevé de terre',  207,  'kg',   'musculation'),
('a0000000-0000-0000-0000-000000000002', 'Squat',             165,  'kg',   'musculation'),
-- Atlas — Course
('a0000000-0000-0000-0000-000000000002', '10 km',             3300, '10 km','course'),

-- Spartacus — Musculation
('a0000000-0000-0000-0000-000000000003', 'Développé couché', 85,   'kg',   'musculation'),
('a0000000-0000-0000-0000-000000000003', 'Squat',             95,   'kg',   'musculation'),
-- Spartacus — Course
('a0000000-0000-0000-0000-000000000003', '5 km',              1350, '5 km', 'course'),
('a0000000-0000-0000-0000-000000000003', '10 km',             2640, '10 km','course'),
('a0000000-0000-0000-0000-000000000003', 'Semi-marathon',     6120, '21 km','course'),

-- Valkyrie — Musculation
('a0000000-0000-0000-0000-000000000004', 'Développé couché', 60,   'kg',   'musculation'),
('a0000000-0000-0000-0000-000000000004', 'Squat',             68,   'kg',   'musculation'),
-- Valkyrie — Course
('a0000000-0000-0000-0000-000000000004', '10 km',             3060, '10 km','course'),
('a0000000-0000-0000-0000-000000000004', '5 km',              1530, '5 km', 'course'),

-- Titan — Musculation
('a0000000-0000-0000-0000-000000000005', 'Développé couché', 112,  'kg',   'musculation'),
('a0000000-0000-0000-0000-000000000005', 'Soulevé de terre',  155,  'kg',   'musculation'),
('a0000000-0000-0000-0000-000000000005', 'Squat',             122,  'kg',   'musculation'),

-- Rookie — Musculation
('a0000000-0000-0000-0000-000000000006', 'Développé couché', 42,   'kg',   'musculation');

-- ============================================================
-- 12. BADGES (seed)
-- ============================================================

INSERT INTO badges (code, name, description, category, rarity, is_secret) VALUES
('bronze_level',       'Niveau Bronze',           'Atteindre le niveau 5',                    'progression',   'common',    false),
('silver_level',       'Niveau Argent',           'Atteindre le niveau 10',                   'progression',   'rare',      false),
('gold_level',         'Niveau Or',               'Atteindre le niveau 15',                   'progression',   'epic',      false),
('platinum_level',     'Niveau Platine',          'Atteindre le niveau 20',                   'progression',   'legendary', false),
('diamond_level',      'Niveau Diamant',          'Atteindre le niveau 25',                   'progression',   'legendary', false),
('runner_badge',       'Runner',                  'Atteindre niveau 10 en course',             'progression',   'rare',      false),
('lifter_badge',       'Lifter',                  'Atteindre niveau 10 en musculation',        'progression',   'rare',      false),
('transformer_badge',  'Transformer',             'Perdre ou gagner 10kg',                     'progression',   'epic',      false),
('week_streak',        '7 jours consécutifs',     'Maintenir 7 jours d''activité',             'progression',   'common',    false),
('month_streak',       '30 jours consécutifs',    'Maintenir 30 jours d''activité',            'progression',   'rare',      false),
('hundred_days',       '100 jours consécutifs',   'Maintenir 100 jours d''activité',           'progression',   'epic',      false),
('year_streak',        '365 jours consécutifs',   'Maintenir 1 an d''activité',                'progression',   'legendary', false),
('first_goal',         'Premier objectif',        'Compléter son 1er objectif personnel',      'objectifs',     'common',    false),
('ten_goals',          'Visionnaire',             'Compléter 10 objectifs personnels',         'objectifs',     'common',    false),
('fifty_goals',        'Ambitieux',               'Compléter 50 objectifs personnels',         'objectifs',     'rare',      false),
('hundred_goals',      'Déterminé',               'Compléter 100 objectifs personnels',        'objectifs',     'epic',      false),
('challenge_participant','Participant',           'Participer à un objectif commun',           'objectifs',     'common',    false),
('challenge_contributor','Contributeur',          'Compléter un objectif commun',              'objectifs',     'common',    false),
('challenge_mvp',      'MVP communautaire',       'Compléter 10 objectifs communs',            'objectifs',     'epic',      false),
('speedster',          'Speedster',               'Compléter un objectif flash',               'objectifs',     'rare',      false),
('early_bird_flash',   'Early Bird',              'Compléter un objectif flash dans les 6h',   'objectifs',     'epic',      true),
('first_pr',           'Premier record',          'Battre son 1er record personnel',           'performance',   'common',    false),
('ten_prs',            'Progressiste',            'Battre 10 records personnels',              'performance',   'common',    false),
('fifty_prs',          'Champion',                'Battre 50 records personnels',              'performance',   'rare',      false),
('hundred_km',         'Centurion du km',         'Courir 100km cumulés',                      'performance',   'common',    false),
('five_hundred_km',    'Ultra runner',            'Courir 500km cumulés',                      'performance',   'rare',      false),
('thousand_km',        'Marathonien légendaire',  'Courir 1000km cumulés',                     'performance',   'legendary', false),
('thousand_kg',        'Force Initiale',          'Soulever 1000kg cumulés',                   'performance',   'common',    false),
('five_thousand_kg',   'Force Intermédiaire',     'Soulever 5000kg cumulés',                   'performance',   'rare',      false),
('ten_thousand_kg',    'Force Légendaire',        'Soulever 10000kg cumulés',                  'performance',   'epic',      false),
('minus_5kg',          'Transformation -5kg',     'Perdre 5kg',                                'performance',   'common',    false),
('minus_10kg',         'Transformation -10kg',    'Perdre 10kg',                               'performance',   'rare',      false),
('minus_20kg',         'Transformation -20kg',    'Perdre 20kg',                               'performance',   'epic',      false),
('plus_5kg_muscle',    'Gain musculaire +5kg',    'Prendre 5kg',                               'performance',   'common',    false),
('plus_10kg_muscle',   'Gain musculaire +10kg',   'Prendre 10kg',                              'performance',   'rare',      false),
('ten_sessions',       'Démarrage',               'Enregistrer 10 séances',                    'participation', 'common',    false),
('fifty_sessions',     'Régulier',                'Enregistrer 50 séances',                    'participation', 'common',    false),
('hundred_sessions',   'Assidu',                  'Enregistrer 100 séances',                   'participation', 'rare',      false),
('five_hundred_sessions','Dévoué',                'Enregistrer 500 séances',                   'participation', 'epic',      false),
('thousand_sessions',  'Légendaire',              'Enregistrer 1000 séances',                  'participation', 'legendary', false),
('multi_sport_warrior','Guerrier multi-sport',    'Faire muscu + course dans la même semaine',  'participation', 'common',    false),
('social_athlete',     'Athlète social',          'Liker 50 performances',                      'participation', 'common',    false),
('team_player',        'Team Player',             'Commenter 50 fois',                          'participation', 'common',    false),
('active_commenter',   'Commentateur actif',      '100 commentaires postés',                    'participation', 'rare',      false),
('new_year_athlete',   'Nouvel An Sportif',       'Séance le 1er janvier',                      'secret',        'rare',      true),
('valentine_solo',     'Saint-Valentin solo',     'Séance le 14 février',                       'secret',        'rare',      true),
('resolution_keeper',  'Résolution tenue',        '365 jours consécutifs',                      'secret',        'legendary', true),
('four_seasons',       'Quatre saisons',          'Séance dans chaque saison',                  'secret',        'epic',      true),
('phoenix',            'Phoenix',                 'Revenir après 30+ jours d''inactivité',      'secret',        'epic',      true),
('indestructible',     'Indestructible',          '100 jours consécutifs',                      'secret',        'epic',      true),
('rainy_warrior',      'Guerrier de la pluie',    '5 courses sous la pluie',                    'secret',        'rare',      true),
('winter_warrior',     'Guerrier de l''hiver',    '10 courses par <5°C',                        'secret',        'rare',      true),
('double_trouble',     'Doublé',                  'Muscu + Course le même jour',                'secret',        'rare',      false),
('triple_threat',      'Triplé',                  'Muscu + Course + Pesée le même jour',        'secret',        'epic',      false),
('speedster_week',     'Speedster',               'Battre 3 PRs en une semaine',                'secret',        'rare',      false),
('titan',              'Titan',                   '10000kg de tonnage en une séance',           'secret',        'legendary', true),
('triple_seven',       'Triple 7',                'Séance le 07/07 entre 7h-8h',                'secret',        'legendary', true),
('perfect_balance',    'Équilibre parfait',       '50% muscu / 50% course sur un mois',         'secret',        'epic',      true),
('mad_collector',      'Collectionneur fou',      'Débloquer 50 badges',                        'secret',        'legendary', false),
('leet',               '1337',                   'Atteindre exactement 1337 XP',               'secret',        'legendary', true),
('explorer',           'Explorateur',             'Utiliser tous les types de course',           'secret',        'common',    false),
('polyvalent',         'Polyvalent',              '10 exercices différents en muscu',            'secret',        'common',    false),
('rainbow',            'Arc-en-ciel',             'Utiliser tous les feedbacks',                 'secret',        'rare',      false),
('first_supporter',    'Premier supporter',       'Premier à liker une performance',             'secret',        'rare',      true),
('motivator',          'Motivateur',              'Recevoir 50 likes sur une performance',       'secret',        'epic',      true),
('creator',            'Créateur',                'Créer le 1er objectif commun validé',         'secret',        'rare',      true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 13. USER BADGES
-- ============================================================

INSERT INTO user_badges (user_id, badge_id, unlocked_at)
SELECT u, b.id, t FROM (VALUES
  -- Admin
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'bronze_level',         '2025-09-15T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'silver_level',         '2025-10-20T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'week_streak',          '2025-09-22T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'month_streak',         '2025-10-15T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'ten_sessions',         '2025-09-28T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'fifty_sessions',       '2025-11-10T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'thousand_kg',          '2025-10-05T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'five_thousand_kg',     '2025-11-01T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'hundred_km',           '2025-11-20T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'first_pr',             '2025-09-10T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'first_goal',           '2025-11-30T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'challenge_participant','2025-12-05T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'challenge_contributor','2026-01-28T20:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'multi_sport_warrior',  '2025-12-06T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'new_year_athlete',     '2026-01-01T08:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'valentine_solo',       '2026-02-14T06:30:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'speedster',            '2026-02-15T14:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'double_trouble',       '2026-01-01T16:00:00Z'::timestamptz),
  -- Atlas
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'bronze_level',         '2025-09-20T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'silver_level',         '2025-10-25T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'lifter_badge',         '2025-11-15T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'week_streak',          '2025-10-01T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'month_streak',         '2025-11-01T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'ten_sessions',         '2025-10-05T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'fifty_sessions',       '2025-11-20T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'thousand_kg',          '2025-10-10T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'five_thousand_kg',     '2025-11-05T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'ten_thousand_kg',      '2025-12-01T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'first_pr',             '2025-09-15T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'challenge_participant','2026-01-02T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'speedster',            '2026-02-15T16:00:00Z'::timestamptz),
  -- Spartacus
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'bronze_level',         '2025-10-01T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'silver_level',         '2025-11-15T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'runner_badge',         '2025-12-01T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'week_streak',          '2025-10-10T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'ten_sessions',         '2025-10-15T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'fifty_sessions',       '2025-12-01T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'hundred_km',           '2025-11-10T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'five_hundred_km',      '2026-02-01T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'thousand_kg',          '2025-11-01T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'first_pr',             '2025-09-20T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'first_goal',           '2025-12-28T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'challenge_participant','2026-01-02T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'challenge_contributor','2026-01-25T07:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'multi_sport_warrior',  '2025-12-03T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'winter_warrior',       '2026-01-18T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'explorer',             '2026-01-25T00:00:00Z'::timestamptz),
  -- Valkyrie
  ('a0000000-0000-0000-0000-000000000004'::uuid, 'bronze_level',         '2025-11-01T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000004'::uuid, 'ten_sessions',         '2025-11-20T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000004'::uuid, 'week_streak',          '2025-12-10T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000004'::uuid, 'hundred_km',           '2026-01-25T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000004'::uuid, 'first_pr',             '2025-10-15T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000004'::uuid, 'first_goal',           '2026-01-25T09:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000004'::uuid, 'challenge_participant','2026-01-02T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000004'::uuid, 'multi_sport_warrior',  '2025-12-10T00:00:00Z'::timestamptz),
  -- Titan
  ('a0000000-0000-0000-0000-000000000005'::uuid, 'bronze_level',         '2025-11-10T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000005'::uuid, 'ten_sessions',         '2025-12-01T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000005'::uuid, 'thousand_kg',          '2025-11-25T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000005'::uuid, 'first_pr',             '2025-11-01T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000005'::uuid, 'challenge_participant','2026-02-14T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000005'::uuid, 'speedster',            '2026-02-15T18:00:00Z'::timestamptz),
  -- Rookie
  ('a0000000-0000-0000-0000-000000000006'::uuid, 'ten_sessions',         '2026-02-10T00:00:00Z'::timestamptz),
  ('a0000000-0000-0000-0000-000000000006'::uuid, 'first_pr',             '2026-01-20T00:00:00Z'::timestamptz)
) AS t(u, code, t)
JOIN badges b ON b.code = t.code
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- ============================================================
-- 14. ACTIVITY FEED (toutes les sessions — 3 mois)
-- ============================================================

INSERT INTO activity_feed (user_id, type, content, created_at) VALUES

-- ── AUJOURD'HUI 13 MARS 2026 ──────────────────────────────────

-- Atlas — Workout Push (ce matin)
('a0000000-0000-0000-0000-000000000002','workout',
 '{"type":"workout","tonnage":7240,"sets_count":10,"feedback":"difficile","exercises":[{"name":"Développé couché","sets":4,"reps":40},{"name":"Développé incliné","sets":3,"reps":30},{"name":"Développé militaire","sets":3,"reps":24}]}',
 '2026-03-13T07:30:00Z'),

-- Spartacus — Run 12km tempo (ce matin)
('a0000000-0000-0000-0000-000000000003','run',
 '{"type":"run","distance":12,"duration":3168,"pace":4.4,"run_type":"tempo","feedback":"difficile"}',
 '2026-03-13T06:15:00Z'),

-- Admin — Workout Legs (ce matin)
('a0000000-0000-0000-0000-000000000001','workout',
 '{"type":"workout","tonnage":9840,"sets_count":11,"feedback":"mort","exercises":[{"name":"Squat","sets":4,"reps":32},{"name":"Presse à cuisses","sets":4,"reps":48},{"name":"Fentes","sets":3,"reps":30}]}',
 '2026-03-13T08:00:00Z'),

-- ── HIER 12 MARS 2026 ────────────────────────────────────────

-- Valkyrie — Run 8km endurance
('a0000000-0000-0000-0000-000000000004','run',
 '{"type":"run","distance":8,"duration":2640,"pace":5.5,"run_type":"endurance","feedback":"facile"}',
 '2026-03-12T09:00:00Z'),

-- Titan — Workout Pull
('a0000000-0000-0000-0000-000000000005','workout',
 '{"type":"workout","tonnage":6120,"sets_count":11,"feedback":"difficile","exercises":[{"name":"Soulevé de terre","sets":4,"reps":20},{"name":"Rowing barre","sets":4,"reps":32},{"name":"Tirage vertical","sets":3,"reps":30}]}',
 '2026-03-12T17:30:00Z'),

-- Rookie — Workout (progression)
('a0000000-0000-0000-0000-000000000006','workout',
 '{"type":"workout","tonnage":2880,"sets_count":9,"feedback":"facile","exercises":[{"name":"Développé couché","sets":3,"reps":24},{"name":"Squat","sets":3,"reps":24},{"name":"Rowing barre","sets":3,"reps":24}]}',
 '2026-03-12T20:00:00Z'),

-- ── 11 MARS 2026 ────────────────────────────────────────────

-- Spartacus — Run 10km fractionné
('a0000000-0000-0000-0000-000000000003','run',
 '{"type":"run","distance":10,"duration":2700,"pace":4.5,"run_type":"fractionne","feedback":"difficile"}',
 '2026-03-11T06:30:00Z'),

-- Atlas — Workout Legs
('a0000000-0000-0000-0000-000000000002','workout',
 '{"type":"workout","tonnage":12200,"sets_count":11,"feedback":"mort","exercises":[{"name":"Squat","sets":4,"reps":32},{"name":"Presse à cuisses","sets":4,"reps":48},{"name":"Fentes","sets":3,"reps":30}]}',
 '2026-03-11T18:00:00Z'),

-- ── MARS 2026 (début de mois) ────────────────────────────────

-- Spartacus — Run 18km endurance
('a0000000-0000-0000-0000-000000000003','run',
 '{"type":"run","distance":18,"duration":5040,"pace":4.67,"run_type":"endurance","feedback":"facile"}',
 '2026-03-01T06:00:00Z'),

-- Titan — Workout Push/Legs
('a0000000-0000-0000-0000-000000000005','workout',
 '{"type":"workout","tonnage":6768,"sets_count":9,"feedback":"difficile","exercises":[{"name":"Développé couché","sets":3,"reps":30},{"name":"Squat","sets":3,"reps":24},{"name":"Développé militaire","sets":3,"reps":24}]}',
 '2026-03-01T17:00:00Z'),

-- Admin — Workout Pull
('a0000000-0000-0000-0000-000000000001','workout',
 '{"type":"workout","tonnage":7296,"sets_count":11,"feedback":"difficile","exercises":[{"name":"Soulevé de terre","sets":4,"reps":20},{"name":"Rowing barre","sets":4,"reps":32},{"name":"Tirage vertical","sets":3,"reps":30}]}',
 '2026-03-03T07:30:00Z'),

-- Valkyrie — Run 5km tempo
('a0000000-0000-0000-0000-000000000004','run',
 '{"type":"run","distance":5,"duration":1500,"pace":5.0,"run_type":"tempo","feedback":"difficile"}',
 '2026-03-03T09:00:00Z'),

-- Spartacus — Run 10km tempo
('a0000000-0000-0000-0000-000000000003','run',
 '{"type":"run","distance":10,"duration":2700,"pace":4.5,"run_type":"tempo","feedback":"difficile"}',
 '2026-03-04T07:00:00Z'),

-- Atlas — Workout Pull
('a0000000-0000-0000-0000-000000000002','workout',
 '{"type":"workout","tonnage":9210,"sets_count":11,"feedback":"difficile","exercises":[{"name":"Soulevé de terre","sets":4,"reps":20},{"name":"Rowing barre","sets":4,"reps":32},{"name":"Tirage vertical","sets":3,"reps":30}]}',
 '2026-03-04T18:00:00Z'),

-- Admin — Run 18km endurance
('a0000000-0000-0000-0000-000000000001','run',
 '{"type":"run","distance":18,"duration":5760,"pace":5.33,"run_type":"endurance","feedback":"facile"}',
 '2026-03-05T07:00:00Z'),

-- Atlas — Run 4km récup
('a0000000-0000-0000-0000-000000000002','run',
 '{"type":"run","distance":4,"duration":1320,"pace":5.5,"run_type":"endurance","feedback":"facile"}',
 '2026-03-05T09:00:00Z'),

-- ── FÉVRIER 2026 ─────────────────────────────────────────────

-- Spartacus — Run 15km endurance
('a0000000-0000-0000-0000-000000000003','run',
 '{"type":"run","distance":15,"duration":4200,"pace":4.67,"run_type":"endurance","feedback":"facile"}',
 '2026-02-01T06:00:00Z'),

-- Admin — Run 10km tempo
('a0000000-0000-0000-0000-000000000001','run',
 '{"type":"run","distance":10,"duration":3000,"pace":5.0,"run_type":"tempo","feedback":"difficile"}',
 '2026-02-01T07:30:00Z'),

-- Spartacus — badge Ultra runner
('a0000000-0000-0000-0000-000000000003','badge_unlocked',
 '{"badge_name":"Ultra runner","badge_code":"five_hundred_km","rarity":"rare"}',
 '2026-02-01T06:30:00Z'),

-- Admin — Workout Push
('a0000000-0000-0000-0000-000000000001','workout',
 '{"type":"workout","tonnage":5251,"sets_count":10,"feedback":"difficile","exercises":[{"name":"Développé couché","sets":4,"reps":40},{"name":"Développé incliné","sets":3,"reps":30},{"name":"Développé militaire","sets":3,"reps":24}]}',
 '2026-02-03T07:30:00Z'),

-- Atlas — Run 10km
('a0000000-0000-0000-0000-000000000002','run',
 '{"type":"run","distance":10,"duration":3300,"pace":5.5,"run_type":"endurance","feedback":"difficile"}',
 '2026-02-08T09:00:00Z'),

-- Spartacus — Run semi-marathon
('a0000000-0000-0000-0000-000000000003','run',
 '{"type":"run","distance":21.097,"duration":5700,"pace":4.53,"run_type":"endurance","feedback":"difficile"}',
 '2026-02-08T06:00:00Z'),

-- Atlas — Workout Push
('a0000000-0000-0000-0000-000000000002','workout',
 '{"type":"workout","tonnage":7140,"sets_count":10,"feedback":"difficile","exercises":[{"name":"Développé couché","sets":4,"reps":40},{"name":"Développé incliné","sets":3,"reps":30},{"name":"Développé militaire","sets":3,"reps":24}]}',
 '2026-02-10T18:00:00Z'),

-- Rookie — Workout
('a0000000-0000-0000-0000-000000000006','workout',
 '{"type":"workout","tonnage":2616,"sets_count":9,"feedback":"facile","exercises":[{"name":"Développé couché","sets":3,"reps":24},{"name":"Squat","sets":3,"reps":24},{"name":"Développé militaire","sets":3,"reps":18}]}',
 '2026-02-10T20:00:00Z'),

-- Admin — Workout Bras (Saint-Valentin solo)
('a0000000-0000-0000-0000-000000000001','workout',
 '{"type":"workout","tonnage":3612,"sets_count":10,"feedback":"facile","exercises":[{"name":"Curl barre","sets":4,"reps":48},{"name":"Extensions poulie haute","sets":3,"reps":36},{"name":"Élévations latérales","sets":3,"reps":36}]}',
 '2026-02-14T06:30:00Z'),

-- Admin — badge Saint-Valentin solo
('a0000000-0000-0000-0000-000000000001','badge_unlocked',
 '{"badge_name":"Saint-Valentin solo","badge_code":"valentine_solo","rarity":"rare"}',
 '2026-02-14T06:35:00Z'),

-- Valkyrie — Run 10km
('a0000000-0000-0000-0000-000000000004','run',
 '{"type":"run","distance":10,"duration":3060,"pace":5.1,"run_type":"endurance","feedback":"facile"}',
 '2026-02-15T09:00:00Z'),

-- Spartacus — Run 10km tempo
('a0000000-0000-0000-0000-000000000003','run',
 '{"type":"run","distance":10,"duration":2640,"pace":4.4,"run_type":"tempo","feedback":"difficile"}',
 '2026-02-15T07:00:00Z'),

-- Titan — Run 5km (première course)
('a0000000-0000-0000-0000-000000000005','run',
 '{"type":"run","distance":5,"duration":1800,"pace":6.0,"run_type":"endurance","feedback":"mort"}',
 '2026-02-20T17:30:00Z'),

-- Admin — Run 20km sortie longue
('a0000000-0000-0000-0000-000000000001','run',
 '{"type":"run","distance":20,"duration":6600,"pace":5.5,"run_type":"endurance","feedback":"difficile"}',
 '2026-02-22T08:00:00Z'),

-- Valkyrie — Workout
('a0000000-0000-0000-0000-000000000004','workout',
 '{"type":"workout","tonnage":3180,"sets_count":9,"feedback":"facile","exercises":[{"name":"Développé militaire","sets":3,"reps":24},{"name":"Squat","sets":3,"reps":24},{"name":"Curl barre","sets":3,"reps":36}]}',
 '2026-02-25T12:00:00Z'),

-- Spartacus — Workout
('a0000000-0000-0000-0000-000000000003','workout',
 '{"type":"workout","tonnage":4960,"sets_count":10,"feedback":"facile","exercises":[{"name":"Soulevé de terre","sets":4,"reps":20},{"name":"Squat","sets":3,"reps":24},{"name":"Rowing barre","sets":3,"reps":24}]}',
 '2026-02-18T19:00:00Z'),

-- ── JANVIER 2026 ─────────────────────────────────────────────

-- Admin — Workout Push (Nouvel An)
('a0000000-0000-0000-0000-000000000001','workout',
 '{"type":"workout","tonnage":5250,"sets_count":10,"feedback":"facile","exercises":[{"name":"Développé couché","sets":4,"reps":40},{"name":"Développé militaire","sets":3,"reps":24},{"name":"Curl barre","sets":3,"reps":36}]}',
 '2026-01-01T08:00:00Z'),

-- Admin — Run Foulée du Nouvel An
('a0000000-0000-0000-0000-000000000001','run',
 '{"type":"run","distance":5,"duration":1500,"pace":5.0,"run_type":"endurance","feedback":"facile"}',
 '2026-01-01T16:00:00Z'),

-- Admin — badge Nouvel An Sportif
('a0000000-0000-0000-0000-000000000001','badge_unlocked',
 '{"badge_name":"Nouvel An Sportif","badge_code":"new_year_athlete","rarity":"rare"}',
 '2026-01-01T08:05:00Z'),

-- Spartacus — Run 20km endurance
('a0000000-0000-0000-0000-000000000003','run',
 '{"type":"run","distance":20,"duration":5700,"pace":4.75,"run_type":"endurance","feedback":"difficile"}',
 '2026-01-04T06:00:00Z'),

-- Atlas — Workout Pull
('a0000000-0000-0000-0000-000000000002','workout',
 '{"type":"workout","tonnage":9116,"sets_count":11,"feedback":"difficile","exercises":[{"name":"Soulevé de terre","sets":4,"reps":20},{"name":"Rowing barre","sets":4,"reps":32},{"name":"Tirage vertical","sets":3,"reps":30}]}',
 '2026-01-05T18:00:00Z'),

-- Admin — Workout Legs
('a0000000-0000-0000-0000-000000000001','workout',
 '{"type":"workout","tonnage":8820,"sets_count":11,"feedback":"mort","exercises":[{"name":"Squat","sets":4,"reps":32},{"name":"Presse à cuisses","sets":4,"reps":48},{"name":"Fentes","sets":3,"reps":30}]}',
 '2026-01-06T07:30:00Z'),

-- Atlas — Workout Legs
('a0000000-0000-0000-0000-000000000002','workout',
 '{"type":"workout","tonnage":11955,"sets_count":11,"feedback":"mort","exercises":[{"name":"Squat","sets":4,"reps":32},{"name":"Presse à cuisses","sets":4,"reps":48},{"name":"Fentes","sets":3,"reps":30}]}',
 '2026-01-08T18:00:00Z'),

-- Spartacus — Run 10km tempo
('a0000000-0000-0000-0000-000000000003','run',
 '{"type":"run","distance":10,"duration":2700,"pace":4.5,"run_type":"tempo","feedback":"difficile"}',
 '2026-01-11T07:00:00Z'),

-- Admin — Run 12km (neige)
('a0000000-0000-0000-0000-000000000001','run',
 '{"type":"run","distance":12,"duration":3840,"pace":5.2,"run_type":"endurance","feedback":"difficile"}',
 '2026-01-12T07:00:00Z'),

-- Spartacus — Workout
('a0000000-0000-0000-0000-000000000003','workout',
 '{"type":"workout","tonnage":5096,"sets_count":9,"feedback":"facile","exercises":[{"name":"Développé couché","sets":3,"reps":30},{"name":"Squat","sets":3,"reps":24},{"name":"Développé militaire","sets":3,"reps":24}]}',
 '2026-01-14T19:00:00Z'),

-- Titan — Workout Pull
('a0000000-0000-0000-0000-000000000005','workout',
 '{"type":"workout","tonnage":5830,"sets_count":11,"feedback":"difficile","exercises":[{"name":"Soulevé de terre","sets":4,"reps":20},{"name":"Rowing barre","sets":4,"reps":32},{"name":"Tirage vertical","sets":3,"reps":30}]}',
 '2026-01-15T17:00:00Z'),

-- Spartacus — Run 25km sortie longue
('a0000000-0000-0000-0000-000000000003','run',
 '{"type":"run","distance":25,"duration":7200,"pace":4.8,"run_type":"endurance","feedback":"difficile"}',
 '2026-01-18T06:30:00Z'),

-- Rookie — Workout (début)
('a0000000-0000-0000-0000-000000000006','workout',
 '{"type":"workout","tonnage":2480,"sets_count":9,"feedback":"facile","exercises":[{"name":"Développé couché","sets":3,"reps":24},{"name":"Squat","sets":3,"reps":24},{"name":"Développé militaire","sets":3,"reps":18}]}',
 '2026-01-20T20:00:00Z'),

-- Valkyrie — Workout
('a0000000-0000-0000-0000-000000000004','workout',
 '{"type":"workout","tonnage":4228,"sets_count":9,"feedback":"difficile","exercises":[{"name":"Développé couché","sets":3,"reps":30},{"name":"Squat","sets":3,"reps":24},{"name":"Rowing barre","sets":3,"reps":24}]}',
 '2026-01-20T12:00:00Z'),

-- Valkyrie — Run 10km (objectif atteint !)
('a0000000-0000-0000-0000-000000000004','run',
 '{"type":"run","distance":10,"duration":3150,"pace":5.25,"run_type":"endurance","feedback":"facile"}',
 '2026-01-25T09:00:00Z'),

-- Valkyrie — goal_completed
('a0000000-0000-0000-0000-000000000004','goal_completed',
 '{"goal_title":"Courir 10 km sans s''arrêter","goal_type":"performance"}',
 '2026-01-25T09:30:00Z'),

-- Spartacus — Run 8km fractionné
('a0000000-0000-0000-0000-000000000003','run',
 '{"type":"run","distance":8,"duration":2160,"pace":4.5,"run_type":"fractionne","feedback":"difficile"}',
 '2026-01-25T07:00:00Z'),

-- ── DÉCEMBRE 2025 ────────────────────────────────────────────

-- Atlas — Workout Push
('a0000000-0000-0000-0000-000000000002','workout',
 '{"type":"workout","tonnage":6848,"sets_count":10,"feedback":"difficile","exercises":[{"name":"Développé couché","sets":4,"reps":40},{"name":"Développé incliné","sets":3,"reps":30},{"name":"Développé militaire","sets":3,"reps":24}]}',
 '2025-12-01T18:00:00Z'),

-- Atlas — Workout Pull
('a0000000-0000-0000-0000-000000000002','workout',
 '{"type":"workout","tonnage":8800,"sets_count":11,"feedback":"difficile","exercises":[{"name":"Soulevé de terre","sets":4,"reps":20},{"name":"Rowing barre","sets":4,"reps":32},{"name":"Tirage vertical","sets":3,"reps":30}]}',
 '2025-12-03T18:00:00Z'),

-- Spartacus — Run 10km tempo
('a0000000-0000-0000-0000-000000000003','run',
 '{"type":"run","distance":10,"duration":2640,"pace":4.4,"run_type":"tempo","feedback":"difficile"}',
 '2025-12-05T06:30:00Z'),

-- Admin — Workout Push
('a0000000-0000-0000-0000-000000000001','workout',
 '{"type":"workout","tonnage":5016,"sets_count":10,"feedback":"difficile","exercises":[{"name":"Développé couché","sets":4,"reps":40},{"name":"Développé incliné","sets":3,"reps":30},{"name":"Développé militaire","sets":3,"reps":24}]}',
 '2025-12-02T07:30:00Z'),

-- Spartacus — Run semi-marathon
('a0000000-0000-0000-0000-000000000003','run',
 '{"type":"run","distance":21.097,"duration":5820,"pace":4.62,"run_type":"endurance","feedback":"difficile"}',
 '2025-12-10T06:00:00Z'),

-- Spartacus — Run 12km endurance
('a0000000-0000-0000-0000-000000000003','run',
 '{"type":"run","distance":12,"duration":3360,"pace":4.67,"run_type":"endurance","feedback":"facile"}',
 '2025-12-17T06:00:00Z'),

-- Admin — Run 5km tempo (fin d''année)
('a0000000-0000-0000-0000-000000000001','run',
 '{"type":"run","distance":5,"duration":1440,"pace":4.8,"run_type":"tempo","feedback":"difficile"}',
 '2025-12-28T08:00:00Z')

ON CONFLICT DO NOTHING;

-- ============================================================
-- 15. NOTIFICATION PREFERENCES
-- ============================================================

INSERT INTO notification_preferences (user_id, flash_challenge, record_beaten, badge_unlocked, level_up, event_created, likes, comments)
VALUES
  ('a0000000-0000-0000-0000-000000000001', true,  true,  true,  true,  true,  true,  true),
  ('a0000000-0000-0000-0000-000000000002', true,  true,  true,  true,  true,  true,  false),
  ('a0000000-0000-0000-0000-000000000003', true,  true,  true,  true,  true,  false, false),
  ('a0000000-0000-0000-0000-000000000004', true,  true,  true,  true,  true,  true,  true),
  ('a0000000-0000-0000-0000-000000000005', true,  false, true,  true,  false, false, false),
  ('a0000000-0000-0000-0000-000000000006', true,  true,  true,  true,  true,  true,  true)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- FIN DU SEED
-- ============================================================
-- Comptes :
--   admin@gainandglory.com   / Admin1234!   (is_admin = true)
--   atlas@gainandglory.com   / Password123!
--   spartacus@gainandglory.com / Password123!
--   valkyrie@gainandglory.com  / Password123!
--   titan@gainandglory.com     / Password123!
--   rookie@gainandglory.com    / Password123!
-- ============================================================
