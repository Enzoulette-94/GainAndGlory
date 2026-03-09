-- ============================================================
-- Migration #1 — Suppression de running_sessions.pace_km_per_h
-- Date    : 2026-03-06
-- Raison  : Colonne redondante — pace_km_per_h = 60 / pace_min_per_km
--           Toujours calculable côté app ou SQL : 60.0 / pace_min_per_km
-- Impact  : Aucun sur les RLS (colonne non référencée dans les policies)
--           Le client doit arrêter de lire/écrire cette colonne
-- ============================================================

BEGIN;

-- ── Vérification : la colonne doit exister avant le DROP ────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM   information_schema.columns
    WHERE  table_schema = 'public'
    AND    table_name   = 'running_sessions'
    AND    column_name  = 'pace_km_per_h'
  ) THEN
    -- Aucune view ni policy ne référence cette colonne → DROP direct
    ALTER TABLE running_sessions DROP COLUMN pace_km_per_h;
    RAISE NOTICE '[OK] Colonne pace_km_per_h supprimée de running_sessions.';
  ELSE
    RAISE NOTICE '[SKIP] pace_km_per_h introuvable — migration déjà appliquée.';
  END IF;
END $$;

-- ── Vérification post-migration ──────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.columns
    WHERE  table_schema = 'public'
    AND    table_name   = 'running_sessions'
    AND    column_name  = 'pace_km_per_h'
  ) THEN
    RAISE NOTICE '[CHECK OK] La colonne pace_km_per_h n''existe plus.';
  ELSE
    RAISE EXCEPTION '[CHECK FAIL] La colonne pace_km_per_h existe encore — rollback.';
  END IF;
END $$;

COMMIT;
