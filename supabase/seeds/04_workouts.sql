-- ============================================================
-- 04 — WORKOUT SESSIONS + SETS
-- Admin (11 séances) · Atlas (9) · Spartacus (4)
-- Valkyrie (3) · Titan (4) · Rookie (2)
-- ============================================================

DO $$
DECLARE
  e_dc   UUID; e_di   UUID; e_sq  UUID; e_sdl UUID;
  e_pm   UUID; e_rb   UUID; e_tv  UUID; e_cb  UUID;
  e_ct   UUID; e_pa   UUID; e_f   UUID; e_el  UUID;
  s UUID;
  u1 UUID := 'a0000000-0000-0000-0000-000000000001'; -- Admin
  u2 UUID := 'a0000000-0000-0000-0000-000000000002'; -- Atlas
  u3 UUID := 'a0000000-0000-0000-0000-000000000003'; -- Spartacus
  u4 UUID := 'a0000000-0000-0000-0000-000000000004'; -- Valkyrie
  u5 UUID := 'a0000000-0000-0000-0000-000000000005'; -- Titan
  u6 UUID := 'a0000000-0000-0000-0000-000000000006'; -- Rookie
BEGIN
  SELECT id INTO e_dc  FROM exercises WHERE name = 'Développé couché'        LIMIT 1;
  SELECT id INTO e_di  FROM exercises WHERE name = 'Développé incliné'       LIMIT 1;
  SELECT id INTO e_sq  FROM exercises WHERE name = 'Squat'                   LIMIT 1;
  SELECT id INTO e_sdl FROM exercises WHERE name = 'Soulevé de terre'        LIMIT 1;
  SELECT id INTO e_pm  FROM exercises WHERE name = 'Développé militaire'     LIMIT 1;
  SELECT id INTO e_rb  FROM exercises WHERE name = 'Rowing barre'            LIMIT 1;
  SELECT id INTO e_tv  FROM exercises WHERE name = 'Tirage vertical'         LIMIT 1;
  SELECT id INTO e_cb  FROM exercises WHERE name = 'Curl barre'              LIMIT 1;
  SELECT id INTO e_ct  FROM exercises WHERE name = 'Extensions poulie haute' LIMIT 1;
  SELECT id INTO e_pa  FROM exercises WHERE name = 'Presse à cuisses'        LIMIT 1;
  SELECT id INTO e_f   FROM exercises WHERE name = 'Fentes'                  LIMIT 1;
  SELECT id INTO e_el  FROM exercises WHERE name = 'Élévations latérales'    LIMIT 1;

  -- ──────────────────────────────────────────────
  -- ADMIN — Push/Pull/Legs
  -- ──────────────────────────────────────────────

  -- S1 2025-12-02 Push
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u1,'2025-12-02T07:30:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,5,120),(s,e_dc,2,5,120),(s,e_dc,3,5,120),
    (s,e_di,1,8,82),(s,e_di,2,8,82),(s,e_di,3,8,82),
    (s,e_pm,1,8,78),(s,e_pm,2,8,78);

  -- S2 2025-12-04 Pull
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u1,'2025-12-04T07:30:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sdl,1,5,180),(s,e_sdl,2,5,180),(s,e_sdl,3,5,180),
    (s,e_rb,1,8,90),(s,e_rb,2,8,90),(s,e_rb,3,8,90),
    (s,e_tv,1,10,70),(s,e_tv,2,10,70),(s,e_tv,3,10,70);

  -- S3 2025-12-07 Legs
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u1,'2025-12-07T07:30:00Z','mort');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sq,1,5,140),(s,e_sq,2,5,140),(s,e_sq,3,5,140),(s,e_sq,4,5,140),
    (s,e_pa,1,12,120),(s,e_pa,2,12,120),(s,e_pa,3,12,120),
    (s,e_f,1,10,60),(s,e_f,2,10,60);

  -- S4 2025-12-12 Push
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u1,'2025-12-12T07:30:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,5,122),(s,e_dc,2,5,122),(s,e_dc,3,5,122),
    (s,e_di,1,8,84),(s,e_di,2,8,84),(s,e_di,3,8,84),
    (s,e_pm,1,8,80),(s,e_pm,2,8,80);

  -- S5 2025-12-16 Pull
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u1,'2025-12-16T07:30:00Z','facile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sdl,1,5,182),(s,e_sdl,2,5,182),(s,e_sdl,3,5,182),
    (s,e_rb,1,8,92),(s,e_rb,2,8,92),(s,e_rb,3,8,92),
    (s,e_tv,1,10,72),(s,e_tv,2,10,72),(s,e_tv,3,10,72);

  -- S6 2026-01-01 Push (new_year_athlete)
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u1,'2026-01-01T08:00:00Z','facile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,5,122),(s,e_dc,2,5,122),(s,e_dc,3,5,122),
    (s,e_pm,1,8,80),(s,e_pm,2,8,80),(s,e_pm,3,8,80),
    (s,e_cb,1,10,50),(s,e_cb,2,10,50);

  -- S7 2026-01-06 Legs
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u1,'2026-01-06T07:30:00Z','mort');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sq,1,5,145),(s,e_sq,2,5,145),(s,e_sq,3,5,145),(s,e_sq,4,5,145),
    (s,e_pa,1,12,130),(s,e_pa,2,12,130),(s,e_pa,3,12,130),
    (s,e_f,1,10,62),(s,e_f,2,10,62);

  -- S8 2026-02-03 Push
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u1,'2026-02-03T07:30:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,5,125),(s,e_dc,2,5,125),(s,e_dc,3,5,125),
    (s,e_di,1,8,86),(s,e_di,2,8,86),(s,e_di,3,8,86),
    (s,e_pm,1,8,82),(s,e_pm,2,8,82);

  -- S9 2026-02-14 Bras (valentine_solo)
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u1,'2026-02-14T06:30:00Z','facile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_cb,1,10,52),(s,e_cb,2,10,52),(s,e_cb,3,10,52),
    (s,e_ct,1,12,42),(s,e_ct,2,12,42),(s,e_ct,3,12,42),
    (s,e_el,1,15,18),(s,e_el,2,15,18);

  -- S10 2026-03-03 Pull
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u1,'2026-03-03T07:30:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sdl,1,5,188),(s,e_sdl,2,5,188),(s,e_sdl,3,5,188),
    (s,e_rb,1,8,94),(s,e_rb,2,8,94),(s,e_rb,3,8,94),
    (s,e_tv,1,10,74),(s,e_tv,2,10,74),(s,e_tv,3,10,74);

  -- S11 2026-03-17 Legs
  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u1,'2026-03-17T07:30:00Z','mort');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sq,1,5,148),(s,e_sq,2,5,148),(s,e_sq,3,5,148),(s,e_sq,4,5,148),
    (s,e_pa,1,12,135),(s,e_pa,2,12,135),(s,e_pa,3,12,135),
    (s,e_f,1,10,65),(s,e_f,2,10,65);

  -- ──────────────────────────────────────────────
  -- ATLAS — Powerlifter charges élevées
  -- ──────────────────────────────────────────────

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u2,'2025-12-01T18:00:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,5,130),(s,e_dc,2,5,130),(s,e_dc,3,5,130),(s,e_dc,4,5,130),
    (s,e_di,1,8,92),(s,e_di,2,8,92),(s,e_di,3,8,92),
    (s,e_pm,1,8,85),(s,e_pm,2,8,85),(s,e_pm,3,8,85);

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u2,'2025-12-03T18:00:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sdl,1,5,200),(s,e_sdl,2,5,200),(s,e_sdl,3,5,200),(s,e_sdl,4,5,200),
    (s,e_rb,1,8,100),(s,e_rb,2,8,100),(s,e_rb,3,8,100),
    (s,e_tv,1,10,80),(s,e_tv,2,10,80),(s,e_tv,3,10,80);

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u2,'2025-12-05T18:00:00Z','mort');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sq,1,5,160),(s,e_sq,2,5,160),(s,e_sq,3,5,160),(s,e_sq,4,5,160),(s,e_sq,5,5,160),
    (s,e_pa,1,12,150),(s,e_pa,2,12,150),(s,e_pa,3,12,150),
    (s,e_f,1,10,72),(s,e_f,2,10,72),(s,e_f,3,10,72);

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u2,'2025-12-11T18:00:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sdl,1,5,202),(s,e_sdl,2,5,202),(s,e_sdl,3,5,202),(s,e_sdl,4,5,202),
    (s,e_rb,1,8,102),(s,e_rb,2,8,102),(s,e_rb,3,8,102),
    (s,e_tv,1,10,82),(s,e_tv,2,10,82),(s,e_tv,3,10,82);

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u2,'2026-01-08T18:00:00Z','mort');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sq,1,5,165),(s,e_sq,2,5,165),(s,e_sq,3,5,165),(s,e_sq,4,5,165),(s,e_sq,5,5,165),
    (s,e_pa,1,12,155),(s,e_pa,2,12,155),(s,e_pa,3,12,155),
    (s,e_f,1,10,75),(s,e_f,2,10,75),(s,e_f,3,10,75);

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u2,'2026-02-10T18:00:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,5,135),(s,e_dc,2,5,135),(s,e_dc,3,5,135),(s,e_dc,4,5,135),
    (s,e_di,1,8,95),(s,e_di,2,8,95),(s,e_di,3,8,95),
    (s,e_pm,1,8,90),(s,e_pm,2,8,90),(s,e_pm,3,8,90);

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u2,'2026-03-04T18:00:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sdl,1,5,207),(s,e_sdl,2,5,207),(s,e_sdl,3,5,207),(s,e_sdl,4,5,207),
    (s,e_rb,1,8,105),(s,e_rb,2,8,105),(s,e_rb,3,8,105),
    (s,e_tv,1,10,85),(s,e_tv,2,10,85),(s,e_tv,3,10,85);

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u2,'2026-03-18T18:00:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,5,137),(s,e_dc,2,5,137),(s,e_dc,3,5,137),(s,e_dc,4,5,137),
    (s,e_pm,1,8,92),(s,e_pm,2,8,92),(s,e_pm,3,8,92),
    (s,e_el,1,15,20),(s,e_el,2,15,20);

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u2,'2026-03-19T18:00:00Z','mort');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sq,1,5,168),(s,e_sq,2,5,168),(s,e_sq,3,5,168),(s,e_sq,4,5,168),(s,e_sq,5,5,168),
    (s,e_pa,1,12,160),(s,e_pa,2,12,160),(s,e_pa,3,12,160),
    (s,e_f,1,10,78),(s,e_f,2,10,78);

  -- ──────────────────────────────────────────────
  -- SPARTACUS — muscu légère (runner principal)
  -- ──────────────────────────────────────────────

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u3,'2025-12-03T19:00:00Z','facile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,10,80),(s,e_dc,2,10,80),
    (s,e_sq,1,12,80),(s,e_sq,2,12,80),
    (s,e_pm,1,12,60),(s,e_pm,2,12,60);

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u3,'2026-01-14T19:00:00Z','facile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sdl,1,8,100),(s,e_sdl,2,8,100),
    (s,e_sq,1,10,90),(s,e_sq,2,10,90),
    (s,e_rb,1,10,70),(s,e_rb,2,10,70);

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u3,'2026-02-18T19:00:00Z','facile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,10,82),(s,e_dc,2,10,82),
    (s,e_sq,1,12,82),(s,e_sq,2,12,82),
    (s,e_pm,1,12,62),(s,e_pm,2,12,62);

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u3,'2026-03-12T19:00:00Z','facile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sdl,1,8,105),(s,e_sdl,2,8,105),
    (s,e_sq,1,10,92),(s,e_sq,2,10,92),
    (s,e_rb,1,10,72),(s,e_rb,2,10,72);

  -- ──────────────────────────────────────────────
  -- VALKYRIE — muscu légère
  -- ──────────────────────────────────────────────

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u4,'2025-12-10T12:00:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,10,55),(s,e_dc,2,10,55),(s,e_dc,3,10,55),
    (s,e_sq,1,12,60),(s,e_sq,2,12,60),
    (s,e_di,1,10,45),(s,e_di,2,10,45);

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u4,'2026-01-20T12:00:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,10,58),(s,e_dc,2,10,58),(s,e_dc,3,10,58),
    (s,e_sq,1,12,62),(s,e_sq,2,12,62),
    (s,e_rb,1,10,50),(s,e_rb,2,10,50);

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u4,'2026-02-25T12:00:00Z','modere');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_pm,1,10,45),(s,e_pm,2,10,45),
    (s,e_sq,1,12,65),(s,e_sq,2,12,65),
    (s,e_cb,1,12,30),(s,e_cb,2,12,30);

  -- ──────────────────────────────────────────────
  -- TITAN — muscu costaud
  -- ──────────────────────────────────────────────

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u5,'2025-12-20T17:00:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,8,110),(s,e_dc,2,8,110),(s,e_dc,3,8,110),
    (s,e_sq,1,8,120),(s,e_sq,2,8,120),(s,e_sq,3,8,120),
    (s,e_pm,1,8,70),(s,e_pm,2,8,70);

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u5,'2026-01-15T17:00:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sdl,1,5,150),(s,e_sdl,2,5,150),(s,e_sdl,3,5,150),
    (s,e_rb,1,8,95),(s,e_rb,2,8,95),(s,e_rb,3,8,95),
    (s,e_tv,1,10,65),(s,e_tv,2,10,65);

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u5,'2026-02-20T17:00:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,8,112),(s,e_dc,2,8,112),(s,e_dc,3,8,112),
    (s,e_sq,1,8,122),(s,e_sq,2,8,122),(s,e_sq,3,8,122),
    (s,e_pm,1,8,72),(s,e_pm,2,8,72);

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u5,'2026-03-10T17:00:00Z','difficile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_sdl,1,5,155),(s,e_sdl,2,5,155),(s,e_sdl,3,5,155),
    (s,e_rb,1,8,98),(s,e_rb,2,8,98),(s,e_rb,3,8,98),
    (s,e_sq,1,8,124),(s,e_sq,2,8,124),(s,e_sq,3,8,124);

  -- ──────────────────────────────────────────────
  -- ROOKIE — débutant
  -- ──────────────────────────────────────────────

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u6,'2026-01-20T20:00:00Z','facile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,10,40),(s,e_dc,2,10,40),
    (s,e_sq,1,12,40),(s,e_sq,2,12,40),
    (s,e_pm,1,12,30),(s,e_pm,2,12,30);

  s := gen_random_uuid();
  INSERT INTO workout_sessions (id,user_id,date,feedback) VALUES
    (s,u6,'2026-03-01T20:00:00Z','facile');
  INSERT INTO workout_sets (session_id,exercise_id,set_number,reps,weight) VALUES
    (s,e_dc,1,10,42),(s,e_dc,2,10,42),
    (s,e_sq,1,12,42),(s,e_sq,2,12,42),
    (s,e_pm,1,12,32),(s,e_pm,2,12,32);

END $$;
