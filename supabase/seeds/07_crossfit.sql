-- ============================================================
-- 07 — CROSSFIT SESSIONS
-- Couvre les 5 types de WOD : EMOM · AMRAP · BENCHMARK · FOR_ROUNDS · FOR_TIME
-- Admin (2) · Atlas (2) · Spartacus (2) · Valkyrie (2) · Titan (2)
-- ============================================================

-- Exercises JSONB format:
-- [{"name":"...", "reps":N, "weight":N|null, "duration":N|null, "notes":null}]

INSERT INTO crossfit_sessions (
  user_id, date, name,
  wod_type, total_duration, round_duration,
  target_rounds, result_time, result_reps, result_rounds,
  benchmark_name, exercises, feedback, notes
) VALUES

-- ── ADMIN ───────────────────────────────────────────────────

-- EMOM 20 min
('a0000000-0000-0000-0000-000000000001',
 '2026-01-15T07:00:00Z',
 'EMOM matin',
 'emom', 20, 60,
 NULL, NULL, NULL, NULL, NULL,
 '[
   {"name":"Burpees","reps":10,"weight":null,"duration":null,"notes":null},
   {"name":"Squat","reps":15,"weight":60,"duration":null,"notes":null},
   {"name":"Pompes","reps":15,"weight":null,"duration":null,"notes":null}
 ]',
 'difficile', '20 rounds complets'),

-- FOR TIME
('a0000000-0000-0000-0000-000000000001',
 '2026-02-20T07:30:00Z',
 'Cindy modifiée',
 'for_time', NULL, NULL,
 5, '18:42', NULL, NULL, NULL,
 '[
   {"name":"Pull-up","reps":10,"weight":null,"duration":null,"notes":null},
   {"name":"Pompes","reps":20,"weight":null,"duration":null,"notes":null},
   {"name":"Air squat","reps":30,"weight":null,"duration":null,"notes":null}
 ]',
 'mort', '5 rounds pour temps'),

-- ── ATLAS ───────────────────────────────────────────────────

-- AMRAP 12 min
('a0000000-0000-0000-0000-000000000002',
 '2026-01-10T19:00:00Z',
 'AMRAP force',
 'amrap', 12, NULL,
 NULL, NULL, 156, NULL, NULL,
 '[
   {"name":"Deadlift","reps":5,"weight":140,"duration":null,"notes":null},
   {"name":"Power clean","reps":5,"weight":80,"duration":null,"notes":null},
   {"name":"Burpees","reps":10,"weight":null,"duration":null,"notes":null}
 ]',
 'difficile', '156 reps — nouveau PR AMRAP'),

-- BENCHMARK — Fran
('a0000000-0000-0000-0000-000000000002',
 '2026-02-05T19:00:00Z',
 'Fran',
 'benchmark', NULL, NULL,
 NULL, NULL, NULL, NULL, 'Fran',
 '[
   {"name":"Thruster","reps":21,"weight":43,"duration":null,"notes":"21-15-9"},
   {"name":"Pull-up","reps":21,"weight":null,"duration":null,"notes":"21-15-9"}
 ]',
 'mort', 'Fran en 7:23 — PR !'),

-- ── SPARTACUS ────────────────────────────────────────────────

-- FOR ROUNDS
('a0000000-0000-0000-0000-000000000003',
 '2026-01-20T19:30:00Z',
 'Fight Gone Bad',
 'for_rounds', 17, NULL,
 5, NULL, NULL, 5, NULL,
 '[
   {"name":"Wall ball","reps":20,"weight":9,"duration":null,"notes":null},
   {"name":"Sumo DL high pull","reps":12,"weight":35,"duration":null,"notes":null},
   {"name":"Box jump","reps":15,"weight":null,"duration":null,"notes":null},
   {"name":"Push press","reps":12,"weight":35,"duration":null,"notes":null},
   {"name":"Row","reps":null,"weight":null,"duration":60,"notes":"1 min"}
 ]',
 'mort', '5/5 rounds !'),

-- EMOM 15 min (running-focused)
('a0000000-0000-0000-0000-000000000003',
 '2026-02-25T19:00:00Z',
 'EMOM cardio',
 'emom', 15, 60,
 NULL, NULL, NULL, NULL, NULL,
 '[
   {"name":"Burpees","reps":10,"weight":null,"duration":null,"notes":null},
   {"name":"Mountain climbers","reps":20,"weight":null,"duration":null,"notes":"x2"},
   {"name":"Air squat","reps":20,"weight":null,"duration":null,"notes":null}
 ]',
 'difficile', NULL),

-- ── VALKYRIE ─────────────────────────────────────────────────

-- AMRAP 10 min
('a0000000-0000-0000-0000-000000000004',
 '2026-02-01T08:00:00Z',
 'AMRAP bodyweight',
 'amrap', 10, NULL,
 NULL, NULL, 120, NULL, NULL,
 '[
   {"name":"Pompes","reps":10,"weight":null,"duration":null,"notes":null},
   {"name":"Air squat","reps":15,"weight":null,"duration":null,"notes":null},
   {"name":"Sit-up","reps":10,"weight":null,"duration":null,"notes":null}
 ]',
 'modere', '120 reps en 10 min'),

-- BENCHMARK — Helen
('a0000000-0000-0000-0000-000000000004',
 '2026-03-01T08:30:00Z',
 'Helen',
 'benchmark', NULL, NULL,
 NULL, NULL, NULL, NULL, 'Helen',
 '[
   {"name":"Run 400m","reps":null,"weight":null,"duration":120,"notes":"x3"},
   {"name":"Kettlebell swing","reps":21,"weight":16,"duration":null,"notes":"x3"},
   {"name":"Pull-up","reps":12,"weight":null,"duration":null,"notes":"x3"}
 ]',
 'difficile', 'Helen en 14:52'),

-- ── TITAN ────────────────────────────────────────────────────

-- FOR TIME (lourd)
('a0000000-0000-0000-0000-000000000005',
 '2026-01-25T17:00:00Z',
 'WOD lourd',
 'for_time', NULL, NULL,
 3, '12:08', NULL, NULL, NULL,
 '[
   {"name":"Deadlift","reps":10,"weight":120,"duration":null,"notes":null},
   {"name":"Hang power clean","reps":8,"weight":70,"duration":null,"notes":null},
   {"name":"Push press","reps":10,"weight":60,"duration":null,"notes":null},
   {"name":"Burpees","reps":10,"weight":null,"duration":null,"notes":null}
 ]',
 'mort', '3 rounds en 12:08'),

-- FOR ROUNDS
('a0000000-0000-0000-0000-000000000005',
 '2026-02-28T17:00:00Z',
 'Power rounds',
 'for_rounds', 20, NULL,
 6, NULL, NULL, 5, NULL,
 '[
   {"name":"Back squat","reps":5,"weight":100,"duration":null,"notes":null},
   {"name":"Push press","reps":8,"weight":60,"duration":null,"notes":null},
   {"name":"Box jump","reps":10,"weight":null,"duration":null,"notes":null},
   {"name":"Row","reps":null,"weight":null,"duration":60,"notes":null}
 ]',
 'difficile', '5/6 rounds en 20 min');
