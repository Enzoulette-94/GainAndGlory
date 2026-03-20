-- ============================================================
-- 12 — ACTIVITY FEED
-- Types : workout · run · calisthenics · crossfit · badge
-- ============================================================

INSERT INTO activity_feed (user_id, type, content, created_at) VALUES

-- ══════════════════════════════════════════════════════════
-- MARS 2026 (récent)
-- ══════════════════════════════════════════════════════════

-- 20 Mars — Admin Calisthenics
('a0000000-0000-0000-0000-000000000001', 'calisthenics',
 '{"type":"calisthenics","exercises_count":4,"total_reps":105,"feedback":"difficile","name":"Full body","skills_unlocked":[],"exercises":[{"name":"Tractions","sets":3,"reps":27},{"name":"Dips","sets":3,"reps":37},{"name":"Pompes inclinées","sets":2,"reps":38},{"name":"Gainage","sets":2,"hold_seconds":180}]}',
 '2026-03-20T07:00:00Z'),

-- 19 Mars — Atlas Workout Push
('a0000000-0000-0000-0000-000000000002', 'workout',
 '{"type":"workout","tonnage":7912,"sets_count":9,"feedback":"difficile","exercises":[{"name":"Développé couché","sets":4,"reps":20,"maxWeight":137},{"name":"Développé militaire","sets":3,"reps":24,"maxWeight":92},{"name":"Élévations latérales","sets":2,"reps":30,"maxWeight":20}]}',
 '2026-03-19T07:30:00Z'),

-- 19 Mars — Atlas Workout Legs
('a0000000-0000-0000-0000-000000000002', 'workout',
 '{"type":"workout","tonnage":13280,"sets_count":9,"feedback":"mort","exercises":[{"name":"Squat","sets":5,"reps":25,"maxWeight":168},{"name":"Presse à cuisses","sets":3,"reps":36,"maxWeight":160},{"name":"Fentes","sets":2,"reps":20,"maxWeight":78}]}',
 '2026-03-19T18:00:00Z'),

-- 18 Mars — Spartacus Run 10km
('a0000000-0000-0000-0000-000000000003', 'run',
 '{"type":"run","distance":10,"duration":2700,"pace":4.5,"run_type":"tempo","feedback":"difficile"}',
 '2026-03-17T07:00:00Z'),

-- 17 Mars — Admin Workout Legs
('a0000000-0000-0000-0000-000000000001', 'workout',
 '{"type":"workout","tonnage":10100,"sets_count":11,"feedback":"mort","exercises":[{"name":"Squat","sets":4,"reps":20,"maxWeight":148},{"name":"Presse à cuisses","sets":3,"reps":36,"maxWeight":135},{"name":"Fentes","sets":2,"reps":20,"maxWeight":65}]}',
 '2026-03-17T07:30:00Z'),

-- 16 Mars — Valkyrie badge -5kg
('a0000000-0000-0000-0000-000000000004', 'badge',
 '{"type":"badge","badge_code":"minus_5kg","badge_name":"Transformation -5kg","badge_rarity":"common","badge_description":"Perdre 5kg","badge_xp":50}',
 '2026-03-16T00:00:00Z'),

-- 15 Mars — Valkyrie Calisthenics + Run
('a0000000-0000-0000-0000-000000000004', 'calisthenics',
 '{"type":"calisthenics","exercises_count":5,"total_reps":200,"feedback":"difficile","name":"Full body avancé","skills_unlocked":[],"exercises":[{"name":"Tractions","sets":3,"reps":33},{"name":"Dips","sets":3,"reps":48},{"name":"Pompes","sets":3,"reps":67},{"name":"L-sit","sets":2,"hold_seconds":65},{"name":"Gainage","sets":2,"hold_seconds":180}]}',
 '2026-03-15T08:00:00Z'),

('a0000000-0000-0000-0000-000000000004', 'run',
 '{"type":"run","distance":5,"duration":1500,"pace":5.0,"run_type":"tempo","feedback":"difficile"}',
 '2026-03-10T09:00:00Z'),

-- 12 Mars — Spartacus Calisthenics
('a0000000-0000-0000-0000-000000000003', 'calisthenics',
 '{"type":"calisthenics","exercises_count":3,"total_reps":90,"feedback":"facile","name":"Core runner","skills_unlocked":[],"exercises":[{"name":"Gainage","sets":3,"hold_seconds":240},{"name":"Relevé de jambes","sets":3,"reps":53},{"name":"Tractions","sets":3,"reps":21}]}',
 '2026-03-05T19:00:00Z'),

-- 12 Mars — Spartacus Workout muscu
('a0000000-0000-0000-0000-000000000003', 'workout',
 '{"type":"workout","tonnage":3744,"sets_count":8,"feedback":"facile","exercises":[{"name":"Soulevé de terre","sets":2,"reps":16,"maxWeight":105},{"name":"Squat","sets":2,"reps":20,"maxWeight":92},{"name":"Rowing barre","sets":2,"reps":20,"maxWeight":72}]}',
 '2026-03-12T19:00:00Z'),

-- 12 Mars — Atlas Calisthenics muscle-up
('a0000000-0000-0000-0000-000000000002', 'calisthenics',
 '{"type":"calisthenics","exercises_count":3,"total_reps":72,"feedback":"difficile","name":"Muscle-up session","skills_unlocked":["muscle_up"],"exercises":[{"name":"Tractions","sets":3,"reps":39},{"name":"Muscle-up","sets":3,"reps":12},{"name":"Planche (hold)","sets":2,"hold_seconds":27}]}',
 '2026-03-12T19:00:00Z'),

-- Atlas badge : muscle-up skill
('a0000000-0000-0000-0000-000000000002', 'badge',
 '{"type":"badge","badge_code":"first_pr","badge_name":"Premier record","badge_rarity":"common","badge_description":"Battre son 1er record personnel","badge_xp":50}',
 '2026-03-12T19:30:00Z'),

-- 10 Mars — Titan Workout Pull
('a0000000-0000-0000-0000-000000000005', 'workout',
 '{"type":"workout","tonnage":7800,"sets_count":9,"feedback":"difficile","exercises":[{"name":"Soulevé de terre","sets":3,"reps":15,"maxWeight":155},{"name":"Rowing barre","sets":3,"reps":24,"maxWeight":98},{"name":"Squat","sets":3,"reps":24,"maxWeight":124}]}',
 '2026-03-10T17:00:00Z'),

-- 8 Mars — Admin Calisthenics
('a0000000-0000-0000-0000-000000000001', 'calisthenics',
 '{"type":"calisthenics","exercises_count":4,"total_reps":115,"feedback":"difficile","name":"Full body","skills_unlocked":[],"exercises":[{"name":"Tractions","sets":3,"reps":28},{"name":"Dips","sets":3,"reps":39},{"name":"Pompes inclinées","sets":2,"reps":38},{"name":"Gainage","sets":2,"hold_seconds":180}]}',
 '2026-03-08T07:00:00Z'),

-- 5 Mars — Admin Run + Atlas Run
('a0000000-0000-0000-0000-000000000001', 'run',
 '{"type":"run","distance":18,"duration":5760,"pace":5.33,"run_type":"endurance","feedback":"facile"}',
 '2026-03-05T07:00:00Z'),

('a0000000-0000-0000-0000-000000000002', 'run',
 '{"type":"run","distance":4,"duration":1320,"pace":5.5,"run_type":"endurance","feedback":"facile"}',
 '2026-03-05T09:00:00Z'),

-- 4 Mars — Atlas Pull + Spartacus Run
('a0000000-0000-0000-0000-000000000002', 'workout',
 '{"type":"workout","tonnage":9210,"sets_count":11,"feedback":"difficile","exercises":[{"name":"Soulevé de terre","sets":4,"reps":20,"maxWeight":207},{"name":"Rowing barre","sets":4,"reps":32,"maxWeight":105},{"name":"Tirage vertical","sets":3,"reps":30,"maxWeight":85}]}',
 '2026-03-04T18:00:00Z'),

('a0000000-0000-0000-0000-000000000003', 'run',
 '{"type":"run","distance":18,"duration":5040,"pace":4.67,"run_type":"endurance","feedback":"facile"}',
 '2026-03-01T06:00:00Z'),

-- 3 Mars — Admin Pull + Valkyrie Calisthenics
('a0000000-0000-0000-0000-000000000001', 'workout',
 '{"type":"workout","tonnage":7320,"sets_count":11,"feedback":"difficile","exercises":[{"name":"Soulevé de terre","sets":3,"reps":15,"maxWeight":188},{"name":"Rowing barre","sets":3,"reps":24,"maxWeight":94},{"name":"Tirage vertical","sets":3,"reps":30,"maxWeight":74}]}',
 '2026-03-03T07:30:00Z'),

('a0000000-0000-0000-0000-000000000004', 'calisthenics',
 '{"type":"calisthenics","exercises_count":4,"total_reps":120,"feedback":"difficile","name":"L-sit & handstand","skills_unlocked":["lsit_30s"],"exercises":[{"name":"Tractions","sets":4,"reps":37},{"name":"L-sit","sets":3,"hold_seconds":83},{"name":"Dips","sets":3,"reps":42},{"name":"Pompes","sets":4,"reps":58}]}',
 '2026-02-10T08:00:00Z'),

-- 1 Mars — Valkyrie badge L-sit
('a0000000-0000-0000-0000-000000000004', 'badge',
 '{"type":"badge","badge_code":"first_pr","badge_name":"Premier record","badge_rarity":"common","badge_description":"Battre son 1er record personnel","badge_xp":50}',
 '2026-02-10T08:45:00Z'),

-- Valkyrie Crossfit Helen
('a0000000-0000-0000-0000-000000000004', 'crossfit',
 '{"type":"crossfit","wod_type":"benchmark","result_value":"14:52","result_unit":"time","feedback":"difficile","name":"Helen","exercises":[{"name":"Run 400m","reps":null,"duration":120},{"name":"Kettlebell swing","reps":21,"weight":16},{"name":"Pull-up","reps":12}]}',
 '2026-03-01T08:30:00Z'),

-- ══════════════════════════════════════════════════════════
-- FÉVRIER 2026
-- ══════════════════════════════════════════════════════════

-- Spartacus badge Ultra runner
('a0000000-0000-0000-0000-000000000003', 'badge',
 '{"type":"badge","badge_code":"five_hundred_km","badge_name":"Ultra runner","badge_rarity":"rare","badge_description":"Courir 500km cumulés","badge_xp":250}',
 '2026-02-01T06:30:00Z'),

-- Spartacus Run 15km
('a0000000-0000-0000-0000-000000000003', 'run',
 '{"type":"run","distance":15,"duration":4200,"pace":4.67,"run_type":"endurance","feedback":"facile"}',
 '2026-02-01T06:00:00Z'),

-- Admin Run 10km tempo
('a0000000-0000-0000-0000-000000000001', 'run',
 '{"type":"run","distance":10,"duration":3000,"pace":5.0,"run_type":"tempo","feedback":"difficile"}',
 '2026-02-01T07:30:00Z'),

-- Admin Push
('a0000000-0000-0000-0000-000000000001', 'workout',
 '{"type":"workout","tonnage":5251,"sets_count":8,"feedback":"difficile","exercises":[{"name":"Développé couché","sets":3,"reps":15,"maxWeight":125},{"name":"Développé incliné","sets":3,"reps":24,"maxWeight":86},{"name":"Développé militaire","sets":2,"reps":16,"maxWeight":82}]}',
 '2026-02-03T07:30:00Z'),

-- Titan Crossfit FOR TIME
('a0000000-0000-0000-0000-000000000005', 'crossfit',
 '{"type":"crossfit","wod_type":"for_time","result_value":"12:08","result_unit":"time","feedback":"mort","name":"WOD lourd","exercises":[{"name":"Deadlift","reps":10,"weight":120},{"name":"Hang power clean","reps":8,"weight":70},{"name":"Push press","reps":10,"weight":60},{"name":"Burpees","reps":10}]}',
 '2026-01-25T17:00:00Z'),

-- Atlas Run 10km
('a0000000-0000-0000-0000-000000000002', 'run',
 '{"type":"run","distance":10,"duration":3300,"pace":5.5,"run_type":"endurance","feedback":"difficile"}',
 '2026-02-08T09:00:00Z'),

-- Atlas AMRAP Crossfit
('a0000000-0000-0000-0000-000000000002', 'crossfit',
 '{"type":"crossfit","wod_type":"amrap","result_value":156,"result_unit":"reps","feedback":"difficile","name":"AMRAP force","exercises":[{"name":"Deadlift","reps":5,"weight":140},{"name":"Power clean","reps":5,"weight":80},{"name":"Burpees","reps":10}]}',
 '2026-01-10T19:00:00Z'),

-- Spartacus Run semi
('a0000000-0000-0000-0000-000000000003', 'run',
 '{"type":"run","distance":21.097,"duration":5700,"pace":4.53,"run_type":"endurance","feedback":"difficile"}',
 '2026-02-08T06:00:00Z'),

-- Atlas Push
('a0000000-0000-0000-0000-000000000002', 'workout',
 '{"type":"workout","tonnage":7140,"sets_count":10,"feedback":"difficile","exercises":[{"name":"Développé couché","sets":4,"reps":20,"maxWeight":135},{"name":"Développé incliné","sets":3,"reps":24,"maxWeight":95},{"name":"Développé militaire","sets":3,"reps":24,"maxWeight":90}]}',
 '2026-02-10T18:00:00Z'),

-- Admin Valentine bras
('a0000000-0000-0000-0000-000000000001', 'workout',
 '{"type":"workout","tonnage":3192,"sets_count":8,"feedback":"facile","exercises":[{"name":"Curl barre","sets":3,"reps":30,"maxWeight":52},{"name":"Extensions poulie haute","sets":3,"reps":36,"maxWeight":42},{"name":"Élévations latérales","sets":2,"reps":30,"maxWeight":18}]}',
 '2026-02-14T06:30:00Z'),

-- Admin badge valentine
('a0000000-0000-0000-0000-000000000001', 'badge',
 '{"type":"badge","badge_code":"valentine_solo","badge_name":"Saint-Valentin solo","badge_rarity":"rare","badge_description":"Séance le 14 février","badge_xp":250}',
 '2026-02-14T07:00:00Z'),

-- Titan Crossfit FOR ROUNDS
('a0000000-0000-0000-0000-000000000005', 'crossfit',
 '{"type":"crossfit","wod_type":"for_rounds","result_value":5,"result_unit":"rounds","feedback":"difficile","name":"Power rounds","exercises":[{"name":"Back squat","reps":5,"weight":100},{"name":"Push press","reps":8,"weight":60},{"name":"Box jump","reps":10},{"name":"Row","duration":60}]}',
 '2026-02-28T17:00:00Z'),

-- Spartacus Crossfit EMOM cardio
('a0000000-0000-0000-0000-000000000003', 'crossfit',
 '{"type":"crossfit","wod_type":"emom","result_value":15,"result_unit":"min","feedback":"difficile","name":"EMOM cardio","exercises":[{"name":"Burpees","reps":10},{"name":"Mountain climbers","reps":20},{"name":"Air squat","reps":20}]}',
 '2026-02-25T19:00:00Z'),

-- Admin Crossfit FOR TIME
('a0000000-0000-0000-0000-000000000001', 'crossfit',
 '{"type":"crossfit","wod_type":"for_time","result_value":"18:42","result_unit":"time","feedback":"mort","name":"Cindy modifiée","exercises":[{"name":"Pull-up","reps":10},{"name":"Pompes","reps":20},{"name":"Air squat","reps":30}]}',
 '2026-02-20T07:30:00Z'),

-- Admin Run sortie longue
('a0000000-0000-0000-0000-000000000001', 'run',
 '{"type":"run","distance":20,"duration":6600,"pace":5.5,"run_type":"endurance","feedback":"difficile"}',
 '2026-02-22T08:00:00Z'),

-- Valkyrie Run 10km
('a0000000-0000-0000-0000-000000000004', 'run',
 '{"type":"run","distance":10,"duration":3060,"pace":5.1,"run_type":"endurance","feedback":"facile"}',
 '2026-02-15T09:00:00Z'),

-- Spartacus Run tempo
('a0000000-0000-0000-0000-000000000003', 'run',
 '{"type":"run","distance":10,"duration":2640,"pace":4.4,"run_type":"tempo","feedback":"difficile"}',
 '2026-02-15T07:00:00Z'),

-- Valkyrie AMRAP Crossfit
('a0000000-0000-0000-0000-000000000004', 'crossfit',
 '{"type":"crossfit","wod_type":"amrap","result_value":120,"result_unit":"reps","feedback":"modere","name":"AMRAP bodyweight","exercises":[{"name":"Pompes","reps":10},{"name":"Air squat","reps":15},{"name":"Sit-up","reps":10}]}',
 '2026-02-01T08:00:00Z'),

-- Valkyrie muscu
('a0000000-0000-0000-0000-000000000004', 'workout',
 '{"type":"workout","tonnage":2928,"sets_count":6,"feedback":"modere","exercises":[{"name":"Développé militaire","sets":2,"reps":20,"maxWeight":45},{"name":"Squat","sets":2,"reps":24,"maxWeight":65},{"name":"Curl barre","sets":2,"reps":24,"maxWeight":30}]}',
 '2026-02-25T12:00:00Z'),

-- ══════════════════════════════════════════════════════════
-- JANVIER 2026
-- ══════════════════════════════════════════════════════════

-- Spartacus badge contributeur
('a0000000-0000-0000-0000-000000000003', 'badge',
 '{"type":"badge","badge_code":"challenge_contributor","badge_name":"Contributeur","badge_rarity":"common","badge_description":"Compléter un objectif commun","badge_xp":50}',
 '2026-01-25T07:00:00Z'),

-- Admin badge contributeur
('a0000000-0000-0000-0000-000000000001', 'badge',
 '{"type":"badge","badge_code":"challenge_contributor","badge_name":"Contributeur","badge_rarity":"common","badge_description":"Compléter un objectif commun","badge_xp":50}',
 '2026-01-28T20:00:00Z'),

-- Admin Run neige
('a0000000-0000-0000-0000-000000000001', 'run',
 '{"type":"run","distance":12,"duration":3840,"pace":5.2,"run_type":"endurance","feedback":"difficile"}',
 '2026-01-12T07:00:00Z'),

-- Admin Run 1er janvier
('a0000000-0000-0000-0000-000000000001', 'run',
 '{"type":"run","distance":5,"duration":1500,"pace":5.0,"run_type":"endurance","feedback":"facile"}',
 '2026-01-01T16:00:00Z'),

-- Admin badge new year
('a0000000-0000-0000-0000-000000000001', 'badge',
 '{"type":"badge","badge_code":"new_year_athlete","badge_name":"Nouvel An Sportif","badge_rarity":"rare","badge_description":"Séance le 1er janvier","badge_xp":250}',
 '2026-01-01T16:30:00Z'),

-- Admin badge double trouble
('a0000000-0000-0000-0000-000000000001', 'badge',
 '{"type":"badge","badge_code":"double_trouble","badge_name":"Doublé","badge_rarity":"rare","badge_description":"Muscu + Course le même jour","badge_xp":250}',
 '2026-01-01T16:35:00Z'),

-- Admin Push 1 jan
('a0000000-0000-0000-0000-000000000001', 'workout',
 '{"type":"workout","tonnage":4260,"sets_count":8,"feedback":"facile","exercises":[{"name":"Développé couché","sets":3,"reps":15,"maxWeight":122},{"name":"Développé militaire","sets":3,"reps":24,"maxWeight":80},{"name":"Curl barre","sets":2,"reps":20,"maxWeight":50}]}',
 '2026-01-01T08:00:00Z'),

-- Valkyrie badge first_goal
('a0000000-0000-0000-0000-000000000004', 'badge',
 '{"type":"badge","badge_code":"first_goal","badge_name":"Premier objectif","badge_rarity":"common","badge_description":"Compléter son 1er objectif personnel","badge_xp":50}',
 '2026-01-25T09:00:00Z'),

-- Valkyrie Run 10km (objectif atteint)
('a0000000-0000-0000-0000-000000000004', 'run',
 '{"type":"run","distance":10,"duration":3150,"pace":5.25,"run_type":"endurance","feedback":"facile"}',
 '2026-01-25T09:00:00Z'),

-- Atlas Pull
('a0000000-0000-0000-0000-000000000002', 'workout',
 '{"type":"workout","tonnage":9840,"sets_count":11,"feedback":"mort","exercises":[{"name":"Squat","sets":5,"reps":25,"maxWeight":165},{"name":"Presse à cuisses","sets":3,"reps":36,"maxWeight":155},{"name":"Fentes","sets":3,"reps":30,"maxWeight":75}]}',
 '2026-01-08T18:00:00Z'),

-- Admin Legs
('a0000000-0000-0000-0000-000000000001', 'workout',
 '{"type":"workout","tonnage":9960,"sets_count":11,"feedback":"mort","exercises":[{"name":"Squat","sets":4,"reps":20,"maxWeight":145},{"name":"Presse à cuisses","sets":3,"reps":36,"maxWeight":130},{"name":"Fentes","sets":2,"reps":20,"maxWeight":62}]}',
 '2026-01-06T07:30:00Z'),

-- Spartacus Calisthenics endurance
('a0000000-0000-0000-0000-000000000003', 'calisthenics',
 '{"type":"calisthenics","exercises_count":3,"total_reps":225,"feedback":"modere","name":"Endurance cali","skills_unlocked":[],"exercises":[{"name":"Pompes","sets":3,"reps":75},{"name":"Squats","sets":3,"reps":85},{"name":"Mountain climbers","sets":2,"hold_seconds":120}]}',
 '2026-01-22T19:00:00Z'),

-- Admin Crossfit EMOM
('a0000000-0000-0000-0000-000000000001', 'crossfit',
 '{"type":"crossfit","wod_type":"emom","result_value":20,"result_unit":"min","feedback":"difficile","name":"EMOM matin","exercises":[{"name":"Burpees","reps":10},{"name":"Squat","reps":15,"weight":60},{"name":"Pompes","reps":15}]}',
 '2026-01-15T07:00:00Z'),

-- Spartacus Run sortie longue
('a0000000-0000-0000-0000-000000000003', 'run',
 '{"type":"run","distance":25,"duration":7200,"pace":4.8,"run_type":"endurance","feedback":"difficile"}',
 '2026-01-18T06:30:00Z'),

-- Valkyrie Calisthenics tractions
('a0000000-0000-0000-0000-000000000004', 'calisthenics',
 '{"type":"calisthenics","exercises_count":3,"total_reps":63,"feedback":"difficile","name":"Tractions & dips","skills_unlocked":["pullup_10","dip_15"],"exercises":[{"name":"Tractions","sets":3,"reps":21},{"name":"Dips","sets":3,"reps":32},{"name":"Gainage","sets":2,"hold_seconds":120}]}',
 '2026-01-05T08:00:00Z'),

-- Valkyrie badge pullup_10 et dip_15
('a0000000-0000-0000-0000-000000000004', 'badge',
 '{"type":"badge","badge_code":"first_pr","badge_name":"Premier record","badge_rarity":"common","badge_description":"Battre son 1er record personnel","badge_xp":50}',
 '2026-01-05T08:30:00Z'),

-- Spartacus Fight Gone Bad (crossfit)
('a0000000-0000-0000-0000-000000000003', 'crossfit',
 '{"type":"crossfit","wod_type":"for_rounds","result_value":5,"result_unit":"rounds","feedback":"mort","name":"Fight Gone Bad","exercises":[{"name":"Wall ball","reps":20,"weight":9},{"name":"Sumo DL high pull","reps":12,"weight":35},{"name":"Box jump","reps":15},{"name":"Push press","reps":12,"weight":35},{"name":"Row","duration":60}]}',
 '2026-01-20T19:30:00Z'),

-- Titan Workout Pull + badge
('a0000000-0000-0000-0000-000000000005', 'workout',
 '{"type":"workout","tonnage":5940,"sets_count":8,"feedback":"difficile","exercises":[{"name":"Soulevé de terre","sets":3,"reps":15,"maxWeight":150},{"name":"Rowing barre","sets":3,"reps":24,"maxWeight":95},{"name":"Tirage vertical","sets":2,"reps":20,"maxWeight":65}]}',
 '2026-01-15T17:00:00Z'),

-- Atlas Calisthenics upper
('a0000000-0000-0000-0000-000000000002', 'calisthenics',
 '{"type":"calisthenics","exercises_count":3,"total_reps":102,"feedback":"difficile","name":"Upper body force","skills_unlocked":[],"exercises":[{"name":"Tractions","sets":4,"reps":40},{"name":"Dips","sets":3,"reps":42},{"name":"Pompes archer","sets":3,"reps":28}]}',
 '2026-01-12T19:00:00Z'),

-- Atlas BENCHMARK Fran
('a0000000-0000-0000-0000-000000000002', 'crossfit',
 '{"type":"crossfit","wod_type":"benchmark","result_value":"7:23","result_unit":"time","feedback":"mort","name":"Fran","exercises":[{"name":"Thruster","reps":21,"weight":43},{"name":"Pull-up","reps":21}]}',
 '2026-02-05T19:00:00Z'),

-- Rookie Workout 1ère
('a0000000-0000-0000-0000-000000000006', 'workout',
 '{"type":"workout","tonnage":1920,"sets_count":6,"feedback":"facile","exercises":[{"name":"Développé couché","sets":2,"reps":20,"maxWeight":40},{"name":"Squat","sets":2,"reps":24,"maxWeight":40},{"name":"Développé militaire","sets":2,"reps":24,"maxWeight":30}]}',
 '2026-01-20T20:00:00Z'),

-- Rookie badge first_pr
('a0000000-0000-0000-0000-000000000006', 'badge',
 '{"type":"badge","badge_code":"first_pr","badge_name":"Premier record","badge_rarity":"common","badge_description":"Battre son 1er record personnel","badge_xp":50}',
 '2026-01-20T20:30:00Z'),

-- ══════════════════════════════════════════════════════════
-- DÉCEMBRE 2025
-- ══════════════════════════════════════════════════════════

-- Spartacus Run semi-marathon
('a0000000-0000-0000-0000-000000000003', 'run',
 '{"type":"run","distance":21.097,"duration":5820,"pace":4.62,"run_type":"endurance","feedback":"difficile"}',
 '2025-12-10T06:00:00Z'),

-- Spartacus badge runner_badge
('a0000000-0000-0000-0000-000000000003', 'badge',
 '{"type":"badge","badge_code":"runner_badge","badge_name":"Runner","badge_rarity":"rare","badge_description":"Atteindre niveau 10 en course","badge_xp":250}',
 '2025-12-01T00:00:00Z'),

-- Atlas SDT Pull
('a0000000-0000-0000-0000-000000000002', 'workout',
 '{"type":"workout","tonnage":9720,"sets_count":11,"feedback":"difficile","exercises":[{"name":"Soulevé de terre","sets":4,"reps":20,"maxWeight":202},{"name":"Rowing barre","sets":4,"reps":32,"maxWeight":102},{"name":"Tirage vertical","sets":3,"reps":30,"maxWeight":82}]}',
 '2025-12-11T18:00:00Z'),

-- Atlas badge ten_thousand_kg
('a0000000-0000-0000-0000-000000000002', 'badge',
 '{"type":"badge","badge_code":"ten_thousand_kg","badge_name":"Force Légendaire","badge_rarity":"epic","badge_description":"Soulever 10000kg cumulés","badge_xp":250}',
 '2025-12-01T00:00:00Z'),

-- Atlas badge lifter_badge
('a0000000-0000-0000-0000-000000000002', 'badge',
 '{"type":"badge","badge_code":"lifter_badge","badge_name":"Lifter","badge_rarity":"rare","badge_description":"Atteindre niveau 10 en musculation","badge_xp":250}',
 '2025-11-15T00:00:00Z'),

-- Admin Run sortie froide
('a0000000-0000-0000-0000-000000000001', 'run',
 '{"type":"run","distance":10,"duration":3120,"pace":5.2,"run_type":"endurance","feedback":"difficile"}',
 '2025-12-06T06:30:00Z'),

-- Admin Push DC
('a0000000-0000-0000-0000-000000000001', 'workout',
 '{"type":"workout","tonnage":4272,"sets_count":8,"feedback":"difficile","exercises":[{"name":"Développé couché","sets":3,"reps":15,"maxWeight":120},{"name":"Développé incliné","sets":3,"reps":24,"maxWeight":82},{"name":"Développé militaire","sets":2,"reps":16,"maxWeight":78}]}',
 '2025-12-02T07:30:00Z'),

-- Valkyrie Run première
('a0000000-0000-0000-0000-000000000004', 'run',
 '{"type":"run","distance":5,"duration":1650,"pace":5.5,"run_type":"endurance","feedback":"difficile"}',
 '2025-12-08T08:00:00Z'),

-- Valkyrie Workout premiers
('a0000000-0000-0000-0000-000000000004', 'workout',
 '{"type":"workout","tonnage":2700,"sets_count":7,"feedback":"difficile","exercises":[{"name":"Développé couché","sets":3,"reps":30,"maxWeight":55},{"name":"Squat","sets":2,"reps":24,"maxWeight":60},{"name":"Développé incliné","sets":2,"reps":20,"maxWeight":45}]}',
 '2025-12-10T12:00:00Z'),

-- Valkyrie Calisthenics première
('a0000000-0000-0000-0000-000000000004', 'calisthenics',
 '{"type":"calisthenics","exercises_count":3,"total_reps":75,"feedback":"difficile","name":"Première session cali","skills_unlocked":[],"exercises":[{"name":"Pompes","sets":3,"reps":37},{"name":"Squats","sets":3,"reps":55},{"name":"Gainage","sets":2,"hold_seconds":90}]}',
 '2025-12-15T08:00:00Z'),

-- Titan Workout
('a0000000-0000-0000-0000-000000000005', 'workout',
 '{"type":"workout","tonnage":5268,"sets_count":8,"feedback":"difficile","exercises":[{"name":"Développé couché","sets":3,"reps":24,"maxWeight":110},{"name":"Squat","sets":3,"reps":24,"maxWeight":120},{"name":"Développé militaire","sets":2,"reps":16,"maxWeight":70}]}',
 '2025-12-20T17:00:00Z'),

-- Atlas Legs
('a0000000-0000-0000-0000-000000000002', 'workout',
 '{"type":"workout","tonnage":13360,"sets_count":11,"feedback":"mort","exercises":[{"name":"Squat","sets":5,"reps":25,"maxWeight":160},{"name":"Presse à cuisses","sets":3,"reps":36,"maxWeight":150},{"name":"Fentes","sets":3,"reps":30,"maxWeight":72}]}',
 '2025-12-05T18:00:00Z'),

-- Spartacus Run tempo
('a0000000-0000-0000-0000-000000000003', 'run',
 '{"type":"run","distance":10,"duration":2640,"pace":4.4,"run_type":"tempo","feedback":"difficile"}',
 '2025-12-05T06:30:00Z'),

-- Spartacus Workout fond
('a0000000-0000-0000-0000-000000000003', 'workout',
 '{"type":"workout","tonnage":2400,"sets_count":6,"feedback":"facile","exercises":[{"name":"Développé couché","sets":2,"reps":20,"maxWeight":80},{"name":"Squat","sets":2,"reps":24,"maxWeight":80},{"name":"Développé militaire","sets":2,"reps":24,"maxWeight":60}]}',
 '2025-12-03T19:00:00Z');
