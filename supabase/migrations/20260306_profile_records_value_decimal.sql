-- ============================================================
-- Migration #2 — profile_records.value : TEXT → DECIMAL
-- Date    : 2026-03-06
-- Raison  : Permettre le tri numérique (MAX, MIN, ORDER BY) dans le
--           Hall of Fame et les classements de records
-- ──────────────────────────────────────────────────────────────
-- RÈGLES DE CONVERSION (sans perte) :
--   Musculation  "125"      → 125.0   (kg ou reps)
--                "82.5"     → 82.5
--   Course MM:SS "22:30"   → 1350.0  (secondes)
--   Course HH:MM:SS "1:42:00" → 6120.0 (secondes)
-- ──────────────────────────────────────────────────────────────
-- ⚠️  IMPACT APP : les valeurs de course sont maintenant en secondes.
--     Le frontend doit formater : Math.floor(v/60)+':'+(v%60).toString().padStart(2,'0')
-- ============================================================

BEGIN;

-- ── Étape 1 : Vérifier le type actuel de la colonne ─────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.columns
    WHERE  table_schema = 'public'
    AND    table_name   = 'profile_records'
    AND    column_name  = 'value'
  ) THEN
    RAISE EXCEPTION '[FAIL] Colonne value introuvable dans profile_records.';
  END IF;

  IF (
    SELECT data_type
    FROM   information_schema.columns
    WHERE  table_schema = 'public'
    AND    table_name   = 'profile_records'
    AND    column_name  = 'value'
  ) = 'numeric' THEN
    RAISE NOTICE '[SKIP] value est déjà DECIMAL — migration déjà appliquée.';
  ELSE
    RAISE NOTICE '[INFO] Démarrage de la conversion TEXT → DECIMAL...';
  END IF;
END $$;

-- ── Étape 2 : Audit des données non convertibles ────────────────────────────
-- Affiche les lignes qui ne matchent aucune règle (pour info, sans bloquer)
DO $$
DECLARE
  nb INT;
BEGIN
  SELECT COUNT(*) INTO nb
  FROM profile_records
  WHERE value !~ '^[0-9]+(\.[0-9]+)?$'
    AND value !~ '^\d+:\d{2}:\d{2}$'
    AND value !~ '^\d+:\d{2}$';

  IF nb > 0 THEN
    RAISE WARNING '[AUDIT] % ligne(s) avec format non reconnu seront converties en NULL.', nb;
  ELSE
    RAISE NOTICE '[AUDIT OK] Toutes les valeurs sont dans un format reconnu.';
  END IF;
END $$;

-- ── Étape 3 : Conversion effective ──────────────────────────────────────────
DO $$
BEGIN
  IF (
    SELECT data_type
    FROM   information_schema.columns
    WHERE  table_schema = 'public'
    AND    table_name   = 'profile_records'
    AND    column_name  = 'value'
  ) <> 'numeric' THEN

    ALTER TABLE profile_records
      ALTER COLUMN value TYPE DECIMAL
      USING CASE
        -- Format numérique pur : "125" ou "82.5"
        WHEN value ~ '^[0-9]+(\.[0-9]+)?$'
          THEN value::DECIMAL

        -- Format HH:MM:SS (ex: "1:42:00") → secondes
        WHEN value ~ '^\d+:\d{2}:\d{2}$'
          THEN (
            split_part(value, ':', 1)::INT * 3600 +
            split_part(value, ':', 2)::INT * 60  +
            split_part(value, ':', 3)::INT
          )::DECIMAL

        -- Format MM:SS (ex: "22:30") → secondes
        WHEN value ~ '^\d+:\d{2}$'
          THEN (
            split_part(value, ':', 1)::INT * 60 +
            split_part(value, ':', 2)::INT
          )::DECIMAL

        -- Format non reconnu → NULL (préférable à une erreur de cast)
        ELSE NULL
      END;

    RAISE NOTICE '[OK] Colonne value convertie en DECIMAL avec succès.';
  END IF;
END $$;

-- ── Étape 4 : Vérification post-migration ────────────────────────────────────
DO $$
DECLARE
  nb_null INT;
BEGIN
  SELECT COUNT(*) INTO nb_null
  FROM profile_records
  WHERE value IS NULL;

  IF nb_null > 0 THEN
    RAISE WARNING '[POST-CHECK] % enregistrement(s) avec value = NULL après migration.', nb_null;
  ELSE
    RAISE NOTICE '[POST-CHECK OK] Aucune valeur NULL — conversion complète.';
  END IF;
END $$;

COMMIT;
