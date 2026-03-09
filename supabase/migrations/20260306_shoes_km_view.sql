-- ============================================================
-- Migration #4 — Remplacement de shoes.total_km
--                par la VIEW shoes_with_km
-- Date    : 2026-03-06
-- Raison  : total_km était mis à jour via RPC increment_shoe_km()
--           → désynchronisation possible (bug si RPC non appelé).
--           La VIEW agrège les running_sessions en temps réel.
-- ──────────────────────────────────────────────────────────────
-- FORMULE : SUM(distance) / 1000.0 depuis running_sessions WHERE shoe_id = id
-- SÉCURITÉ : WITH (security_invoker = on) → hérite du RLS de shoes
--            (un user ne voit que ses propres chaussures)
-- ──────────────────────────────────────────────────────────────
-- ⚠️  IMPACT APP : remplacer les requêtes sur 'shoes'
--     par 'shoes_with_km' pour obtenir total_km
-- ⚠️  La fonction RPC increment_shoe_km() peut être supprimée
--     en migration complémentaire (devenue obsolète)
-- ============================================================

BEGIN;

-- ── Étape 1 : Créer (ou remplacer) la VIEW ───────────────────────────────────
CREATE OR REPLACE VIEW shoes_with_km
  WITH (security_invoker = on)
AS
SELECT
  sh.id,
  sh.user_id,
  sh.brand,
  sh.model,
  sh.purchase_date,
  sh.is_active,
  sh.created_at,
  -- Kilométrage calculé : SUM(distance en mètres) / 1000 → kilomètres
  -- COALESCE → 0 si aucune course associée
  COALESCE(
    SUM(rs.distance) / 1000.0,
    0
  ) AS total_km
FROM  shoes sh
LEFT  JOIN running_sessions rs ON rs.shoe_id = sh.id
GROUP BY
  sh.id,
  sh.user_id,
  sh.brand,
  sh.model,
  sh.purchase_date,
  sh.is_active,
  sh.created_at;

COMMENT ON VIEW shoes_with_km IS
  'Remplace shoes.total_km (supprimé). '
  'Calcule SUM(running_sessions.distance) / 1000 en temps réel. '
  'Hérite du RLS de shoes via security_invoker. '
  'La RPC increment_shoe_km() est désormais obsolète.';

-- ── Étape 2 : Supprimer la colonne total_km devenue inutile ──────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM   information_schema.columns
    WHERE  table_schema = 'public'
    AND    table_name   = 'shoes'
    AND    column_name  = 'total_km'
  ) THEN
    ALTER TABLE shoes DROP COLUMN total_km;
    RAISE NOTICE '[OK] Colonne total_km supprimée de shoes.';
  ELSE
    RAISE NOTICE '[SKIP] total_km déjà supprimée — migration déjà appliquée.';
  END IF;
END $$;

-- ── Étape 3 : Vérification — la VIEW existe et est fonctionnelle ─────────────
DO $$
DECLARE
  nb INT;
BEGIN
  SELECT COUNT(*) INTO nb
  FROM   information_schema.views
  WHERE  table_schema = 'public'
  AND    table_name   = 'shoes_with_km';

  IF nb = 0 THEN
    RAISE EXCEPTION '[CHECK FAIL] La VIEW shoes_with_km n''a pas été créée.';
  ELSE
    RAISE NOTICE '[CHECK OK] VIEW shoes_with_km opérationnelle.';
  END IF;
END $$;

-- ── Étape 4 (optionnel) : Supprimer la RPC devenue obsolète ─────────────────
-- Décommenter si vous souhaitez nettoyer la RPC increment_shoe_km()
-- DROP FUNCTION IF EXISTS increment_shoe_km(UUID, DECIMAL);

COMMIT;
