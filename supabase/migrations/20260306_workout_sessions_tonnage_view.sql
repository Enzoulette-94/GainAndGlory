-- ============================================================
-- Migration #3 — Remplacement de workout_sessions.total_tonnage
--                par la VIEW workout_sessions_with_tonnage
-- Date    : 2026-03-06
-- Raison  : total_tonnage était écrit manuellement côté app → désynchronisation
--           possible si un set est modifié/supprimé sans recalcul.
--           La VIEW calcule toujours la valeur exacte depuis workout_sets.
-- ──────────────────────────────────────────────────────────────
-- FORMULE : SUM(reps * weight) sur tous les sets de la séance
-- SÉCURITÉ : WITH (security_invoker = on) → la VIEW hérite des RLS
--            de workout_sessions (seul l'owner voit ses séances)
-- ──────────────────────────────────────────────────────────────
-- ⚠️  IMPACT APP : remplacer les requêtes sur 'workout_sessions'
--     par 'workout_sessions_with_tonnage' pour obtenir total_tonnage
-- ============================================================

BEGIN;

-- ── Étape 1 : Créer (ou remplacer) la VIEW ───────────────────────────────────
-- security_invoker = on : la view s'exécute avec les droits du CALLER
-- → les policies RLS de workout_sessions s'appliquent normalement
CREATE OR REPLACE VIEW workout_sessions_with_tonnage
  WITH (security_invoker = on)
AS
SELECT
  ws.id,
  ws.user_id,
  ws.date,
  ws.feedback,
  ws.notes,
  ws.created_at,
  -- Tonnage calculé en temps réel depuis workout_sets
  -- NULL si aucun set enregistré (COALESCE → 0)
  COALESCE(
    SUM(s.reps::DECIMAL * s.weight),
    0
  ) AS total_tonnage
FROM  workout_sessions ws
LEFT  JOIN workout_sets s ON s.session_id = ws.id
GROUP BY
  ws.id,
  ws.user_id,
  ws.date,
  ws.feedback,
  ws.notes,
  ws.created_at;

COMMENT ON VIEW workout_sessions_with_tonnage IS
  'Remplace workout_sessions.total_tonnage (supprimé). '
  'Calcule SUM(reps × weight) depuis workout_sets en temps réel. '
  'Hérite du RLS de workout_sessions via security_invoker.';

-- ── Étape 2 : Supprimer la colonne total_tonnage devenue inutile ─────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM   information_schema.columns
    WHERE  table_schema = 'public'
    AND    table_name   = 'workout_sessions'
    AND    column_name  = 'total_tonnage'
  ) THEN
    ALTER TABLE workout_sessions DROP COLUMN total_tonnage;
    RAISE NOTICE '[OK] Colonne total_tonnage supprimée de workout_sessions.';
  ELSE
    RAISE NOTICE '[SKIP] total_tonnage déjà supprimée — migration déjà appliquée.';
  END IF;
END $$;

-- ── Étape 3 : Vérification — la VIEW retourne bien un total_tonnage ──────────
DO $$
DECLARE
  nb INT;
BEGIN
  SELECT COUNT(*) INTO nb
  FROM   information_schema.views
  WHERE  table_schema = 'public'
  AND    table_name   = 'workout_sessions_with_tonnage';

  IF nb = 0 THEN
    RAISE EXCEPTION '[CHECK FAIL] La VIEW workout_sessions_with_tonnage n''a pas été créée.';
  ELSE
    RAISE NOTICE '[CHECK OK] VIEW workout_sessions_with_tonnage opérationnelle.';
  END IF;
END $$;

COMMIT;
