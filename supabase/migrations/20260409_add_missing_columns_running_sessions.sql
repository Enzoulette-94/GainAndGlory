-- ============================================================
-- Migration — Ajout des colonnes manquantes dans running_sessions
-- Date    : 2026-04-09
-- Raison  : PGRST204 "Could not find column run_location in schema cache"
--           + colonne name absente détectée (42703 précédent)
--           Le schéma SQL de référence définissait ces colonnes mais
--           elles n'avaient jamais été appliquées sur la base live.
-- ──────────────────────────────────────────────────────────────
-- Colonnes concernées :
--   • run_location TEXT CHECK ('exterieur'|'salle') — utilisé par RunBlockForm
--   • name         TEXT                             — nom libre de la séance
-- ──────────────────────────────────────────────────────────────
-- ⚠️  Après exécution, recharger le cache PostgREST :
--     SELECT pg_notify('pgrst', 'reload schema');
--     OU Supabase Dashboard > Settings > API > Reload schema
-- ============================================================

BEGIN;

-- ── Étape 1 : Ajouter run_location ───────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.columns
    WHERE  table_schema = 'public'
    AND    table_name   = 'running_sessions'
    AND    column_name  = 'run_location'
  ) THEN
    ALTER TABLE running_sessions
      ADD COLUMN run_location TEXT
      CHECK (run_location IN ('exterieur', 'salle'));
    RAISE NOTICE '[OK] Colonne run_location ajoutée.';
  ELSE
    RAISE NOTICE '[SKIP] run_location existe déjà.';
  END IF;
END $$;

-- ── Étape 2 : Ajouter name ───────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.columns
    WHERE  table_schema = 'public'
    AND    table_name   = 'running_sessions'
    AND    column_name  = 'name'
  ) THEN
    ALTER TABLE running_sessions ADD COLUMN name TEXT;
    RAISE NOTICE '[OK] Colonne name ajoutée.';
  ELSE
    RAISE NOTICE '[SKIP] name existe déjà.';
  END IF;
END $$;

-- ── Étape 3 : Recharger le cache PostgREST ───────────────────────────────────
SELECT pg_notify('pgrst', 'reload schema');

-- ── Étape 4 : Vérification ────────────────────────────────────────────────────
DO $$
DECLARE
  has_run_location BOOLEAN;
  has_name         BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE  table_schema = 'public'
    AND    table_name   = 'running_sessions'
    AND    column_name  = 'run_location'
  ) INTO has_run_location;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE  table_schema = 'public'
    AND    table_name   = 'running_sessions'
    AND    column_name  = 'name'
  ) INTO has_name;

  IF NOT has_run_location THEN
    RAISE EXCEPTION '[CHECK FAIL] run_location manquante après migration.';
  END IF;
  IF NOT has_name THEN
    RAISE EXCEPTION '[CHECK FAIL] name manquante après migration.';
  END IF;

  RAISE NOTICE '[CHECK OK] run_location=%, name=% — migration réussie.',
    has_run_location, has_name;
END $$;

COMMIT;
