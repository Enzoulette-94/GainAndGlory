-- ============================================================
-- 06 — CALISTHENICS SESSIONS + PROFILE SKILLS
-- Admin (3) · Atlas (2) · Spartacus (2) · Valkyrie (4) · Rookie (1)
-- ============================================================

-- Exercises JSONB format:
-- [{"name":"...", "set_type":"reps|timed",
--   "sets":[{"reps":N,"hold_seconds":N}], "notes":null}]

INSERT INTO calisthenics_sessions
  (user_id, date, name, exercises, feedback, notes)
VALUES

-- ── ADMIN ───────────────────────────────────────────────────

('a0000000-0000-0000-0000-000000000001',
 '2026-01-08T07:00:00Z',
 'Upper body',
 '[
   {"name":"Tractions","set_type":"reps","sets":[{"reps":10,"hold_seconds":null},{"reps":9,"hold_seconds":null},{"reps":8,"hold_seconds":null}],"notes":null},
   {"name":"Dips","set_type":"reps","sets":[{"reps":12,"hold_seconds":null},{"reps":12,"hold_seconds":null},{"reps":10,"hold_seconds":null}],"notes":null},
   {"name":"Pompes","set_type":"reps","sets":[{"reps":20,"hold_seconds":null},{"reps":18,"hold_seconds":null},{"reps":15,"hold_seconds":null}],"notes":null},
   {"name":"Gainage","set_type":"timed","sets":[{"reps":null,"hold_seconds":60},{"reps":null,"hold_seconds":60}],"notes":null}
 ]',
 'difficile', NULL),

('a0000000-0000-0000-0000-000000000001',
 '2026-02-05T07:00:00Z',
 'Core & plyometrie',
 '[
   {"name":"Pompes","set_type":"reps","sets":[{"reps":20,"hold_seconds":null},{"reps":20,"hold_seconds":null},{"reps":18,"hold_seconds":null}],"notes":null},
   {"name":"Relevé de jambes","set_type":"reps","sets":[{"reps":15,"hold_seconds":null},{"reps":15,"hold_seconds":null},{"reps":12,"hold_seconds":null}],"notes":null},
   {"name":"Squat bulgare","set_type":"reps","sets":[{"reps":12,"hold_seconds":null},{"reps":12,"hold_seconds":null}],"notes":"Chaque jambe"},
   {"name":"Gainage latéral","set_type":"timed","sets":[{"reps":null,"hold_seconds":45},{"reps":null,"hold_seconds":45}],"notes":null}
 ]',
 'modere', NULL),

('a0000000-0000-0000-0000-000000000001',
 '2026-03-08T07:00:00Z',
 'Full body',
 '[
   {"name":"Tractions","set_type":"reps","sets":[{"reps":10,"hold_seconds":null},{"reps":10,"hold_seconds":null},{"reps":8,"hold_seconds":null}],"notes":null},
   {"name":"Dips","set_type":"reps","sets":[{"reps":15,"hold_seconds":null},{"reps":12,"hold_seconds":null},{"reps":12,"hold_seconds":null}],"notes":null},
   {"name":"Pompes inclinées","set_type":"reps","sets":[{"reps":20,"hold_seconds":null},{"reps":18,"hold_seconds":null}],"notes":null},
   {"name":"Gainage","set_type":"timed","sets":[{"reps":null,"hold_seconds":90},{"reps":null,"hold_seconds":90}],"notes":null}
 ]',
 'difficile', NULL),

-- ── ATLAS ───────────────────────────────────────────────────

('a0000000-0000-0000-0000-000000000002',
 '2026-01-12T19:00:00Z',
 'Upper body force',
 '[
   {"name":"Tractions","set_type":"reps","sets":[{"reps":12,"hold_seconds":null},{"reps":10,"hold_seconds":null},{"reps":10,"hold_seconds":null},{"reps":8,"hold_seconds":null}],"notes":null},
   {"name":"Dips","set_type":"reps","sets":[{"reps":15,"hold_seconds":null},{"reps":15,"hold_seconds":null},{"reps":12,"hold_seconds":null}],"notes":null},
   {"name":"Pompes archer","set_type":"reps","sets":[{"reps":10,"hold_seconds":null},{"reps":10,"hold_seconds":null},{"reps":8,"hold_seconds":null}],"notes":null}
 ]',
 'difficile', NULL),

('a0000000-0000-0000-0000-000000000002',
 '2026-03-12T19:00:00Z',
 'Muscle-up session',
 '[
   {"name":"Tractions","set_type":"reps","sets":[{"reps":15,"hold_seconds":null},{"reps":12,"hold_seconds":null},{"reps":12,"hold_seconds":null}],"notes":null},
   {"name":"Muscle-up","set_type":"reps","sets":[{"reps":5,"hold_seconds":null},{"reps":4,"hold_seconds":null},{"reps":3,"hold_seconds":null}],"notes":null},
   {"name":"Planche (hold)","set_type":"timed","sets":[{"reps":null,"hold_seconds":15},{"reps":null,"hold_seconds":12}],"notes":null}
 ]',
 'difficile', NULL),

-- ── SPARTACUS ────────────────────────────────────────────────

('a0000000-0000-0000-0000-000000000003',
 '2026-01-22T19:00:00Z',
 'Endurance cali',
 '[
   {"name":"Pompes","set_type":"reps","sets":[{"reps":30,"hold_seconds":null},{"reps":25,"hold_seconds":null},{"reps":20,"hold_seconds":null}],"notes":null},
   {"name":"Squats","set_type":"reps","sets":[{"reps":30,"hold_seconds":null},{"reps":30,"hold_seconds":null},{"reps":25,"hold_seconds":null}],"notes":null},
   {"name":"Mountain climbers","set_type":"timed","sets":[{"reps":null,"hold_seconds":60},{"reps":null,"hold_seconds":60}],"notes":null}
 ]',
 'modere', 'Léger avant sortie longue'),

('a0000000-0000-0000-0000-000000000003',
 '2026-03-05T19:00:00Z',
 'Core runner',
 '[
   {"name":"Gainage","set_type":"timed","sets":[{"reps":null,"hold_seconds":90},{"reps":null,"hold_seconds":90},{"reps":null,"hold_seconds":60}],"notes":null},
   {"name":"Relevé de jambes","set_type":"reps","sets":[{"reps":20,"hold_seconds":null},{"reps":18,"hold_seconds":null},{"reps":15,"hold_seconds":null}],"notes":null},
   {"name":"Tractions","set_type":"reps","sets":[{"reps":8,"hold_seconds":null},{"reps":7,"hold_seconds":null},{"reps":6,"hold_seconds":null}],"notes":null}
 ]',
 'facile', NULL),

-- ── VALKYRIE — spécialiste ────────────────────────────────────

('a0000000-0000-0000-0000-000000000004',
 '2025-12-15T08:00:00Z',
 'Première session cali',
 '[
   {"name":"Pompes","set_type":"reps","sets":[{"reps":15,"hold_seconds":null},{"reps":12,"hold_seconds":null},{"reps":10,"hold_seconds":null}],"notes":null},
   {"name":"Squats","set_type":"reps","sets":[{"reps":20,"hold_seconds":null},{"reps":20,"hold_seconds":null},{"reps":15,"hold_seconds":null}],"notes":null},
   {"name":"Gainage","set_type":"timed","sets":[{"reps":null,"hold_seconds":45},{"reps":null,"hold_seconds":45}],"notes":null}
 ]',
 'difficile', 'Première fois !'),

('a0000000-0000-0000-0000-000000000004',
 '2026-01-05T08:00:00Z',
 'Tractions & dips',
 '[
   {"name":"Tractions","set_type":"reps","sets":[{"reps":8,"hold_seconds":null},{"reps":7,"hold_seconds":null},{"reps":6,"hold_seconds":null}],"notes":"Premier objectif atteint"},
   {"name":"Dips","set_type":"reps","sets":[{"reps":12,"hold_seconds":null},{"reps":12,"hold_seconds":null},{"reps":10,"hold_seconds":null}],"notes":null},
   {"name":"Gainage","set_type":"timed","sets":[{"reps":null,"hold_seconds":60},{"reps":null,"hold_seconds":60}],"notes":null}
 ]',
 'difficile', NULL),

('a0000000-0000-0000-0000-000000000004',
 '2026-02-10T08:00:00Z',
 'L-sit & handstand',
 '[
   {"name":"Tractions","set_type":"reps","sets":[{"reps":10,"hold_seconds":null},{"reps":10,"hold_seconds":null},{"reps":9,"hold_seconds":null},{"reps":8,"hold_seconds":null}],"notes":null},
   {"name":"L-sit","set_type":"timed","sets":[{"reps":null,"hold_seconds":30},{"reps":null,"hold_seconds":28},{"reps":null,"hold_seconds":25}],"notes":"PR !"},
   {"name":"Dips","set_type":"reps","sets":[{"reps":15,"hold_seconds":null},{"reps":15,"hold_seconds":null},{"reps":12,"hold_seconds":null}],"notes":null},
   {"name":"Pompes","set_type":"reps","sets":[{"reps":20,"hold_seconds":null},{"reps":20,"hold_seconds":null},{"reps":18,"hold_seconds":null}],"notes":null}
 ]',
 'difficile', 'L-sit 30s atteint !'),

('a0000000-0000-0000-0000-000000000004',
 '2026-03-15T08:00:00Z',
 'Full body avancé',
 '[
   {"name":"Tractions","set_type":"reps","sets":[{"reps":12,"hold_seconds":null},{"reps":11,"hold_seconds":null},{"reps":10,"hold_seconds":null}],"notes":null},
   {"name":"Dips","set_type":"reps","sets":[{"reps":18,"hold_seconds":null},{"reps":15,"hold_seconds":null},{"reps":15,"hold_seconds":null}],"notes":null},
   {"name":"Pompes","set_type":"reps","sets":[{"reps":25,"hold_seconds":null},{"reps":22,"hold_seconds":null},{"reps":20,"hold_seconds":null}],"notes":null},
   {"name":"L-sit","set_type":"timed","sets":[{"reps":null,"hold_seconds":35},{"reps":null,"hold_seconds":30}],"notes":null},
   {"name":"Gainage","set_type":"timed","sets":[{"reps":null,"hold_seconds":90},{"reps":null,"hold_seconds":90}],"notes":null}
 ]',
 'difficile', NULL),

-- ── ROOKIE — initiation ───────────────────────────────────────

('a0000000-0000-0000-0000-000000000006',
 '2026-02-15T20:00:00Z',
 'Initiation calisthénie',
 '[
   {"name":"Pompes","set_type":"reps","sets":[{"reps":10,"hold_seconds":null},{"reps":8,"hold_seconds":null},{"reps":7,"hold_seconds":null}],"notes":"Difficile mais OK"},
   {"name":"Squats","set_type":"reps","sets":[{"reps":15,"hold_seconds":null},{"reps":15,"hold_seconds":null}],"notes":null},
   {"name":"Gainage","set_type":"timed","sets":[{"reps":null,"hold_seconds":30},{"reps":null,"hold_seconds":30}],"notes":null}
 ]',
 'difficile', 'Première fois, je tiens !');

-- ── PROFILE SKILLS (compétences calisthénie débloquées) ─────

INSERT INTO profile_skills (user_id, skill_code, unlocked_at) VALUES
-- Valkyrie : spécialiste, a débloqué 4 compétences
('a0000000-0000-0000-0000-000000000004', 'pullup_10',  '2026-01-05T08:30:00Z'),
('a0000000-0000-0000-0000-000000000004', 'dip_15',     '2026-01-05T09:00:00Z'),
('a0000000-0000-0000-0000-000000000004', 'pushup_50',  '2026-02-10T08:00:00Z'),
('a0000000-0000-0000-0000-000000000004', 'lsit_30s',   '2026-02-10T08:45:00Z'),
-- Atlas : muscle-up débloqué
('a0000000-0000-0000-0000-000000000002', 'pullup_10',  '2025-11-20T00:00:00Z'),
('a0000000-0000-0000-0000-000000000002', 'dip_15',     '2025-11-25T00:00:00Z'),
('a0000000-0000-0000-0000-000000000002', 'muscle_up',  '2026-03-12T19:30:00Z')
ON CONFLICT (user_id, skill_code) DO NOTHING;
