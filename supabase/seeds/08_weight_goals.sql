-- ============================================================
-- 08 — WEIGHT ENTRIES + PERSONAL GOALS
-- ============================================================

-- ── WEIGHT ENTRIES ──────────────────────────────────────────

INSERT INTO weight_entries (user_id, date, weight, notes) VALUES
-- Admin (stable, légère variation)
('a0000000-0000-0000-0000-000000000001', '2025-12-01', 82.5, 'Prise de masse'),
('a0000000-0000-0000-0000-000000000001', '2025-12-15', 82.8, NULL),
('a0000000-0000-0000-0000-000000000001', '2026-01-01', 83.1, 'Début d''année'),
('a0000000-0000-0000-0000-000000000001', '2026-01-15', 83.4, NULL),
('a0000000-0000-0000-0000-000000000001', '2026-02-01', 83.0, NULL),
('a0000000-0000-0000-0000-000000000001', '2026-02-15', 82.7, NULL),
('a0000000-0000-0000-0000-000000000001', '2026-03-01', 82.5, NULL),
('a0000000-0000-0000-0000-000000000001', '2026-03-15', 82.3, NULL),

-- Valkyrie (perte de poids progressive)
('a0000000-0000-0000-0000-000000000004', '2025-12-01', 68.0, 'Début du suivi'),
('a0000000-0000-0000-0000-000000000004', '2025-12-15', 67.5, NULL),
('a0000000-0000-0000-0000-000000000004', '2026-01-01', 67.0, 'Bonne année !'),
('a0000000-0000-0000-0000-000000000004', '2026-01-15', 66.8, NULL),
('a0000000-0000-0000-0000-000000000004', '2026-02-01', 66.5, NULL),
('a0000000-0000-0000-0000-000000000004', '2026-02-15', 66.2, NULL),
('a0000000-0000-0000-0000-000000000004', '2026-03-01', 66.0, 'Bonne progression'),
('a0000000-0000-0000-0000-000000000004', '2026-03-15', 65.7, NULL),

-- Rookie (légère perte)
('a0000000-0000-0000-0000-000000000006', '2026-01-10', 75.0, 'Début du suivi'),
('a0000000-0000-0000-0000-000000000006', '2026-02-01', 74.2, NULL),
('a0000000-0000-0000-0000-000000000006', '2026-03-01', 73.5, NULL);

-- ── PERSONAL GOALS ──────────────────────────────────────────

INSERT INTO personal_goals
  (user_id, type, title, description, target_value, current_value, unit, deadline, status, completed_at)
VALUES
-- Admin
('a0000000-0000-0000-0000-000000000001',
 'performance', 'Développé couché 130 kg',
 'Atteindre 130 kg au développé couché',
 130, 125, 'kg', '2026-06-01', 'active', NULL),

('a0000000-0000-0000-0000-000000000001',
 'volume', '50 km en janvier',
 'Courir 50 km en janvier 2026',
 50, 47, 'km', '2026-01-31', 'completed', '2026-01-28T20:00:00Z'),

('a0000000-0000-0000-0000-000000000001',
 'consistency', '30 jours consécutifs',
 '30 jours consécutifs d''activité',
 30, 30, 'jours', '2026-01-31', 'completed', '2026-01-31T20:00:00Z'),

('a0000000-0000-0000-0000-000000000001',
 'performance', 'Fran sub 7 min',
 'Réaliser Fran en moins de 7 minutes',
 7, NULL, 'minutes', '2026-09-01', 'active', NULL),

-- Atlas
('a0000000-0000-0000-0000-000000000002',
 'performance', 'Soulevé de terre 210 kg',
 'Objectif : SDT 210 kg',
 210, 207, 'kg', '2026-06-01', 'active', NULL),

('a0000000-0000-0000-0000-000000000002',
 'volume', '100 séances muscu',
 'Cent séances depuis le début',
 100, 68, 'séances', '2026-12-31', 'active', NULL),

-- Spartacus
('a0000000-0000-0000-0000-000000000003',
 'performance', 'Sub 4:30 au km',
 'Courir en moins de 4:30/km sur 10 km',
 4.5, 4.4, 'min/km', '2026-05-01', 'active', NULL),

('a0000000-0000-0000-0000-000000000003',
 'performance', 'Semi-marathon en 1h30',
 'Objectif semi en 1h30',
 90, 95, 'minutes', '2026-09-01', 'active', NULL),

('a0000000-0000-0000-0000-000000000003',
 'volume', '500 km cumulés',
 '500 km de course à pied',
 500, 213, 'km', '2026-12-31', 'active', NULL),

('a0000000-0000-0000-0000-000000000003',
 'consistency', 'Courir 3x/semaine',
 'Maintenir 3 sorties par semaine pendant 2 mois',
 8, 8, 'semaines', '2026-02-28', 'completed', '2026-02-28T20:00:00Z'),

-- Valkyrie
('a0000000-0000-0000-0000-000000000004',
 'performance', 'Courir 10 km sans s''arrêter',
 'Premier 10 km complet',
 10, 10, 'km', '2026-02-01', 'completed', '2026-01-25T09:00:00Z'),

('a0000000-0000-0000-0000-000000000004',
 'weight', 'Atteindre 65 kg',
 'Objectif poids : 65 kg',
 65, 65.7, 'kg', '2026-06-01', 'active', NULL),

('a0000000-0000-0000-0000-000000000004',
 'performance', 'Muscle-up',
 'Réussir mon premier muscle-up',
 1, 0, 'reps', '2026-12-31', 'active', NULL),

-- Titan
('a0000000-0000-0000-0000-000000000005',
 'performance', 'Squat 130 kg',
 'Squat à 130 kg',
 130, 124, 'kg', '2026-09-01', 'active', NULL),

('a0000000-0000-0000-0000-000000000005',
 'performance', 'WOD FOR TIME sub 10 min',
 'Finir un WOD FOR TIME en moins de 10 min',
 10, 12, 'minutes', '2026-06-01', 'active', NULL),

-- Rookie
('a0000000-0000-0000-0000-000000000006',
 'consistency', '5 séances muscu',
 'Faire 5 séances de musculation',
 5, 2, 'séances', '2026-04-01', 'active', NULL);
