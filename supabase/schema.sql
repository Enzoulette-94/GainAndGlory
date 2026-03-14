-- ============================================================
-- GAIN & GLORY - Schéma Supabase complet
-- ============================================================
-- Exécuter dans l'éditeur SQL Supabase

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES PRINCIPALES
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fc_max INTEGER,
  share_performances BOOLEAN DEFAULT true,
  share_weight BOOLEAN DEFAULT false,
  share_photos BOOLEAN DEFAULT false,
  preferred_pace_unit TEXT DEFAULT 'min/km',
  total_xp INTEGER DEFAULT 0,
  global_level INTEGER DEFAULT 1,
  musculation_xp INTEGER DEFAULT 0,
  musculation_level INTEGER DEFAULT 1,
  running_xp INTEGER DEFAULT 0,
  running_level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false
);

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_default BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0
);

CREATE TABLE exercise_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE exercise_tag_relation (
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES exercise_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (exercise_id, tag_id)
);

CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  feedback TEXT,
  total_tonnage DECIMAL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) NOT NULL,
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight DECIMAL NOT NULL,
  rest_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE shoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  brand TEXT,
  model TEXT NOT NULL,
  purchase_date DATE,
  total_km DECIMAL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE running_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  distance DECIMAL NOT NULL,
  duration INTEGER NOT NULL,
  pace_min_per_km DECIMAL,
  pace_km_per_h DECIMAL,
  run_type TEXT,
  elevation_gain INTEGER,
  elevation_loss INTEGER,
  avg_heart_rate INTEGER,
  max_heart_rate INTEGER,
  weather_temp INTEGER,
  weather_condition TEXT,
  shoe_id UUID REFERENCES shoes(id) ON DELETE SET NULL,
  feedback TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE weight_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  weight DECIMAL NOT NULL,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE personal_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_value DECIMAL,
  current_value DECIMAL DEFAULT 0,
  unit TEXT,
  deadline DATE,
  status TEXT DEFAULT 'active',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE community_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  target_value DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_flash BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE challenge_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES community_challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  contribution DECIMAL DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE event_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  rarity TEXT DEFAULT 'common',
  icon_url TEXT,
  is_secret BOOLEAN DEFAULT false
);

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE TABLE profile_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  value TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'musculation',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE activity_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES activity_feed(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(activity_id, user_id)
);

CREATE TABLE activity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES activity_feed(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  content JSONB NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  flash_challenge BOOLEAN DEFAULT true,
  record_beaten BOOLEAN DEFAULT true,
  badge_unlocked BOOLEAN DEFAULT true,
  level_up BOOLEAN DEFAULT true,
  event_created BOOLEAN DEFAULT true,
  likes BOOLEAN DEFAULT true,
  comments BOOLEAN DEFAULT true
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_workout_sessions_user_date ON workout_sessions(user_id, date DESC);
CREATE INDEX idx_running_sessions_user_date ON running_sessions(user_id, date DESC);
CREATE INDEX idx_weight_entries_user_date ON weight_entries(user_id, date DESC);
CREATE INDEX idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_exercises_default ON exercises(is_default, muscle_group);

-- ============================================================
-- FONCTIONS UTILITAIRES
-- ============================================================

-- Incrémenter usage_count d'un exercice
CREATE OR REPLACE FUNCTION increment_exercise_usage(exercise_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE exercises SET usage_count = usage_count + 1 WHERE id = exercise_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Incrémenter km d'une chaussure
CREATE OR REPLACE FUNCTION increment_shoe_km(shoe_id UUID, km DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE shoes SET total_km = total_km + km WHERE id = shoe_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE running_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE shoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_records ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Workout sessions
CREATE POLICY "workout_select" ON workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "workout_insert" ON workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "workout_update" ON workout_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "workout_delete" ON workout_sessions FOR DELETE USING (auth.uid() = user_id);

-- Workout sets
CREATE POLICY "sets_select" ON workout_sets FOR SELECT
  USING (EXISTS (SELECT 1 FROM workout_sessions ws WHERE ws.id = session_id AND ws.user_id = auth.uid()));
CREATE POLICY "sets_insert" ON workout_sets FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM workout_sessions ws WHERE ws.id = session_id AND ws.user_id = auth.uid()));
CREATE POLICY "sets_delete" ON workout_sets FOR DELETE
  USING (EXISTS (SELECT 1 FROM workout_sessions ws WHERE ws.id = session_id AND ws.user_id = auth.uid()));

-- Running sessions
CREATE POLICY "running_select" ON running_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "running_insert" ON running_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "running_update" ON running_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "running_delete" ON running_sessions FOR DELETE USING (auth.uid() = user_id);

-- Weight entries
CREATE POLICY "weight_select" ON weight_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "weight_insert" ON weight_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weight_delete" ON weight_entries FOR DELETE USING (auth.uid() = user_id);

-- Personal goals
CREATE POLICY "goals_select" ON personal_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "goals_insert" ON personal_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goals_update" ON personal_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "goals_delete" ON personal_goals FOR DELETE USING (auth.uid() = user_id);

-- Shoes
CREATE POLICY "shoes_select" ON shoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "shoes_insert" ON shoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shoes_update" ON shoes FOR UPDATE USING (auth.uid() = user_id);

-- Challenge participations
CREATE POLICY "participations_select" ON challenge_participations FOR SELECT USING (true);
CREATE POLICY "participations_insert" ON challenge_participations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "participations_update" ON challenge_participations FOR UPDATE USING (auth.uid() = user_id);

-- Events (visibles par tous)
CREATE POLICY "events_select" ON events FOR SELECT USING (true);
CREATE POLICY "events_insert" ON events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "events_delete" ON events FOR DELETE USING (auth.uid() = user_id);

-- Event participations
ALTER TABLE event_participations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ep_select" ON event_participations FOR SELECT USING (true);
CREATE POLICY "ep_insert" ON event_participations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ep_delete" ON event_participations FOR DELETE USING (auth.uid() = user_id);

-- User badges
CREATE POLICY "user_badges_select" ON user_badges FOR SELECT USING (true);
CREATE POLICY "user_badges_insert" ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Activity likes
CREATE POLICY "likes_select" ON activity_likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON activity_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete" ON activity_likes FOR DELETE USING (auth.uid() = user_id);

-- Activity comments
CREATE POLICY "comments_select" ON activity_comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON activity_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON activity_comments FOR DELETE USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "notif_select" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Notification preferences
CREATE POLICY "notif_prefs_select" ON notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_prefs_insert" ON notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notif_prefs_update" ON notification_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Profile records
CREATE POLICY "records_select" ON profile_records FOR SELECT USING (true);
CREATE POLICY "records_insert" ON profile_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "records_update" ON profile_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "records_delete" ON profile_records FOR DELETE USING (auth.uid() = user_id);

-- Exercises et badges (lecture publique)
CREATE POLICY "exercises_select" ON exercises FOR SELECT USING (true);
CREATE POLICY "exercises_insert" ON exercises FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "badges_select" ON badges FOR SELECT USING (true);

-- Community challenges (lecture publique)
CREATE POLICY "challenges_select" ON community_challenges FOR SELECT USING (true);
CREATE POLICY "challenges_insert" ON community_challenges FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "challenges_update" ON community_challenges FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "challenges_delete" ON community_challenges FOR DELETE USING (auth.uid() = created_by);

-- Activity feed (respect de la confidentialité via share_performances)
CREATE POLICY "feed_select" ON activity_feed FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = user_id
      AND (p.share_performances = true OR p.id = auth.uid())
    )
  );
CREATE POLICY "feed_insert" ON activity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- SEED DATA - Exercices par défaut
-- ============================================================

INSERT INTO exercises (name, muscle_group, is_default) VALUES
  -- Pectoraux
  ('Développé couché', 'pectoraux', true),
  ('Développé incliné', 'pectoraux', true),
  ('Développé décliné', 'pectoraux', true),
  ('Écarté', 'pectoraux', true),
  ('Pompes', 'pectoraux', true),
  ('Dips', 'pectoraux', true),
  ('Pull-over', 'pectoraux', true),
  -- Dos
  ('Tractions', 'dos', true),
  ('Rowing barre', 'dos', true),
  ('Rowing haltère', 'dos', true),
  ('Tirage vertical', 'dos', true),
  ('Tirage horizontal', 'dos', true),
  ('Soulevé de terre', 'dos', true),
  ('Face pull', 'dos', true),
  -- Jambes
  ('Squat', 'jambes', true),
  ('Front squat', 'jambes', true),
  ('Presse à cuisses', 'jambes', true),
  ('Leg curl', 'jambes', true),
  ('Leg extension', 'jambes', true),
  ('Fentes', 'jambes', true),
  ('Bulgarian split squat', 'jambes', true),
  ('Mollets debout', 'jambes', true),
  ('Mollets assis', 'jambes', true),
  -- Épaules
  ('Développé militaire', 'epaules', true),
  ('Développé Arnold', 'epaules', true),
  ('Élévations latérales', 'epaules', true),
  ('Élévations frontales', 'epaules', true),
  ('Oiseau', 'epaules', true),
  ('Rowing menton', 'epaules', true),
  -- Biceps
  ('Curl barre', 'biceps', true),
  ('Curl haltères', 'biceps', true),
  ('Curl marteau', 'biceps', true),
  ('Curl pupitre', 'biceps', true),
  ('Curl concentration', 'biceps', true),
  -- Triceps
  ('Dips triceps', 'triceps', true),
  ('Extensions nuque', 'triceps', true),
  ('Extensions poulie haute', 'triceps', true),
  ('Kickback', 'triceps', true),
  ('Barre au front', 'triceps', true),
  -- Abdos
  ('Crunch', 'abdos', true),
  ('Planche', 'abdos', true),
  ('Relevé de jambes', 'abdos', true),
  ('Russian twist', 'abdos', true),
  ('Mountain climbers', 'abdos', true),
  ('Bicycle crunch', 'abdos', true);

-- Tags
INSERT INTO exercise_tags (name) VALUES
  ('Barre'), ('Haltères'), ('Machine'), ('Poids de corps'),
  ('Poulie'), ('Élastiques'), ('Incliné'), ('Décliné'), ('Plat'),
  ('Unilatéral'), ('Bilatéral'), ('Prise large'), ('Prise serrée'), ('Prise neutre');

-- Badges
INSERT INTO badges (code, name, description, category, rarity, is_secret) VALUES
  ('bronze_level', 'Niveau Bronze', 'Atteindre le niveau 5', 'progression', 'common', false),
  ('silver_level', 'Niveau Argent', 'Atteindre le niveau 10', 'progression', 'rare', false),
  ('gold_level', 'Niveau Or', 'Atteindre le niveau 15', 'progression', 'epic', false),
  ('platinum_level', 'Niveau Platine', 'Atteindre le niveau 20', 'progression', 'legendary', false),
  ('diamond_level', 'Niveau Diamant', 'Atteindre le niveau 25', 'progression', 'legendary', false),
  ('runner_badge', 'Runner', 'Atteindre niveau 10 en course', 'progression', 'rare', false),
  ('lifter_badge', 'Lifter', 'Atteindre niveau 10 en musculation', 'progression', 'rare', false),
  ('transformer_badge', 'Transformer', 'Perdre ou gagner 10kg', 'progression', 'epic', false),
  ('week_streak', '7 jours consécutifs', 'Maintenir 7 jours d''activité', 'progression', 'common', false),
  ('month_streak', '30 jours consécutifs', 'Maintenir 30 jours d''activité', 'progression', 'rare', false),
  ('hundred_days', '100 jours consécutifs', 'Maintenir 100 jours d''activité', 'progression', 'epic', false),
  ('year_streak', '365 jours consécutifs', 'Maintenir 1 an d''activité', 'progression', 'legendary', false),
  ('first_goal', 'Premier objectif', 'Compléter son 1er objectif personnel', 'objectifs', 'common', false),
  ('ten_goals', 'Visionnaire', 'Compléter 10 objectifs personnels', 'objectifs', 'common', false),
  ('fifty_goals', 'Ambitieux', 'Compléter 50 objectifs personnels', 'objectifs', 'rare', false),
  ('hundred_goals', 'Déterminé', 'Compléter 100 objectifs personnels', 'objectifs', 'epic', false),
  ('challenge_participant', 'Participant', 'Participer à un objectif commun', 'objectifs', 'common', false),
  ('challenge_contributor', 'Contributeur', 'Compléter un objectif commun', 'objectifs', 'common', false),
  ('challenge_mvp', 'MVP communautaire', 'Compléter 10 objectifs communs', 'objectifs', 'epic', false),
  ('speedster', 'Speedster', 'Compléter un objectif flash', 'objectifs', 'rare', false),
  ('early_bird_flash', 'Early Bird', 'Compléter un objectif flash dans les 6h', 'objectifs', 'epic', true),
  ('first_pr', 'Premier record', 'Battre son 1er record personnel', 'performance', 'common', false),
  ('ten_prs', 'Progressiste', 'Battre 10 records personnels', 'performance', 'common', false),
  ('fifty_prs', 'Champion', 'Battre 50 records personnels', 'performance', 'rare', false),
  ('hundred_km', 'Centurion du km', 'Courir 100km cumulés', 'performance', 'common', false),
  ('five_hundred_km', 'Ultra runner', 'Courir 500km cumulés', 'performance', 'rare', false),
  ('thousand_km', 'Marathonien légendaire', 'Courir 1000km cumulés', 'performance', 'legendary', false),
  ('thousand_kg', 'Force Initiale', 'Soulever 1000kg cumulés', 'performance', 'common', false),
  ('five_thousand_kg', 'Force Intermédiaire', 'Soulever 5000kg cumulés', 'performance', 'rare', false),
  ('ten_thousand_kg', 'Force Légendaire', 'Soulever 10000kg cumulés', 'performance', 'epic', false),
  ('minus_5kg', 'Transformation -5kg', 'Perdre 5kg', 'performance', 'common', false),
  ('minus_10kg', 'Transformation -10kg', 'Perdre 10kg', 'performance', 'rare', false),
  ('minus_20kg', 'Transformation -20kg', 'Perdre 20kg', 'performance', 'epic', false),
  ('plus_5kg_muscle', 'Gain musculaire +5kg', 'Prendre 5kg', 'performance', 'common', false),
  ('plus_10kg_muscle', 'Gain musculaire +10kg', 'Prendre 10kg', 'performance', 'rare', false),
  ('ten_sessions', 'Démarrage', 'Enregistrer 10 séances', 'participation', 'common', false),
  ('fifty_sessions', 'Régulier', 'Enregistrer 50 séances', 'participation', 'common', false),
  ('hundred_sessions', 'Assidu', 'Enregistrer 100 séances', 'participation', 'rare', false),
  ('five_hundred_sessions', 'Dévoué', 'Enregistrer 500 séances', 'participation', 'epic', false),
  ('thousand_sessions', 'Légendaire', 'Enregistrer 1000 séances', 'participation', 'legendary', false),
  ('multi_sport_warrior', 'Guerrier multi-sport', 'Faire muscu + course dans la même semaine', 'participation', 'common', false),
  ('social_athlete', 'Athlète social', 'Liker 50 performances', 'participation', 'common', false),
  ('team_player', 'Team Player', 'Commenter 50 fois', 'participation', 'common', false),
  ('new_year_athlete', 'Nouvel An Sportif', 'Séance le 1er janvier', 'secret', 'rare', true),
  ('valentine_solo', 'Saint-Valentin solo', 'Séance le 14 février', 'secret', 'rare', true),
  ('resolution_keeper', 'Résolution tenue', '365 jours consécutifs', 'secret', 'legendary', true),
  ('four_seasons', 'Quatre saisons', 'Séance dans chaque saison', 'secret', 'epic', true),
  ('phoenix', 'Phoenix', 'Revenir après 30+ jours d''inactivité', 'secret', 'epic', true),
  ('indestructible', 'Indestructible', '100 jours consécutifs', 'secret', 'epic', true),
  ('rainy_warrior', 'Guerrier de la pluie', '5 courses sous la pluie', 'secret', 'rare', true),
  ('winter_warrior', 'Guerrier de l''hiver', '10 courses par <5°C', 'secret', 'rare', true),
  ('double_trouble', 'Doublé', 'Muscu + Course le même jour', 'secret', 'rare', false),
  ('triple_threat', 'Triplé', 'Muscu + Course + Pesée le même jour', 'secret', 'epic', false),
  ('speedster_week', 'Speedster', 'Battre 3 PRs en une semaine', 'secret', 'rare', false),
  ('titan', 'Titan', '10000kg de tonnage en une séance', 'secret', 'legendary', true),
  ('triple_seven', 'Triple 7', 'Séance le 07/07 entre 7h-8h', 'secret', 'legendary', true),
  ('perfect_balance', 'Équilibre parfait', '50% muscu / 50% course sur un mois', 'secret', 'epic', true),
  ('mad_collector', 'Collectionneur fou', 'Débloquer 50 badges', 'secret', 'legendary', false),
  ('leet', '1337', 'Atteindre exactement 1337 XP', 'secret', 'legendary', true),
  ('explorer', 'Explorateur', 'Utiliser tous les types de course', 'secret', 'common', false),
  ('polyvalent', 'Polyvalent', '10 exercices différents en muscu', 'secret', 'common', false),
  ('rainbow', 'Arc-en-ciel', 'Utiliser tous les feedbacks', 'secret', 'rare', false),
  ('first_supporter', 'Premier supporter', 'Premier à liker une performance', 'secret', 'rare', true),
  ('active_commenter', 'Commentateur actif', '100 commentaires postés', 'participation', 'rare', false),
  ('motivator', 'Motivateur', 'Recevoir 50 likes sur une performance', 'secret', 'epic', true),
  ('creator', 'Créateur', 'Créer le 1er objectif commun validé', 'secret', 'rare', true);

-- ============================================================
-- RPCs HALL OF FAME (SECURITY DEFINER — bypassent RLS)
-- ============================================================

-- Classement Course (distance totale)
CREATE OR REPLACE FUNCTION get_running_leaderboard()
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  global_level INTEGER,
  avatar_url TEXT,
  total_distance DECIMAL
) AS $$
  SELECT
    p.id AS user_id,
    p.username,
    p.global_level,
    p.avatar_url,
    COALESCE(SUM(rs.distance), 0) AS total_distance
  FROM profiles p
  LEFT JOIN running_sessions rs ON rs.user_id = p.id
  GROUP BY p.id, p.username, p.global_level, p.avatar_url
  ORDER BY total_distance DESC;
$$ LANGUAGE sql SECURITY DEFINER;

-- Classement Musculation (tonnage total calculé depuis workout_sets)
CREATE OR REPLACE FUNCTION get_workout_leaderboard()
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  global_level INTEGER,
  avatar_url TEXT,
  total_tonnage DECIMAL
) AS $$
  SELECT
    p.id AS user_id,
    p.username,
    p.global_level,
    p.avatar_url,
    COALESCE(SUM(wset.reps * wset.weight), 0) AS total_tonnage
  FROM profiles p
  LEFT JOIN workout_sessions ws ON ws.user_id = p.id
  LEFT JOIN workout_sets wset ON wset.session_id = ws.id
  GROUP BY p.id, p.username, p.global_level, p.avatar_url
  ORDER BY total_tonnage DESC;
$$ LANGUAGE sql SECURITY DEFINER;

-- Records personnels Hall of Fame (profils publics)
CREATE OR REPLACE FUNCTION get_hall_of_fame_records()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  value DECIMAL,
  unit TEXT,
  category TEXT,
  username TEXT,
  global_level INTEGER,
  avatar_url TEXT
) AS $$
  SELECT
    pr.id,
    pr.user_id,
    pr.title,
    pr.value,
    pr.unit,
    pr.category,
    p.username,
    p.global_level,
    p.avatar_url
  FROM profile_records pr
  JOIN profiles p ON p.id = pr.user_id
  WHERE p.share_performances = true
  ORDER BY pr.category, pr.title, pr.value DESC;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- CALISTHÉNIE (migration)
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS calisthenics_xp INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS calisthenics_level INTEGER DEFAULT 1;

CREATE TABLE IF NOT EXISTS calisthenics_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT,
  feedback TEXT CHECK (feedback IN ('facile', 'difficile', 'mort')),
  notes TEXT,
  exercises JSONB NOT NULL DEFAULT '[]',
  skills_unlocked TEXT[] DEFAULT '{}',
  total_reps INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE calisthenics_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "own calisthenics" ON calisthenics_sessions
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS profile_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  skill_code TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_code)
);
ALTER TABLE profile_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "own skills" ON profile_skills
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
