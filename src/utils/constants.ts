import type { MuscleGroup } from '../types/enums';

// ============================================================
// EXERCICES PAR DÉFAUT
// ============================================================

export interface DefaultExercise {
  name: string;
  muscle_group: MuscleGroup;
  is_default: true;
}

export const DEFAULT_EXERCISES: DefaultExercise[] = [
  // Pectoraux
  { name: 'Développé couché', muscle_group: 'pectoraux', is_default: true },
  { name: 'Développé incliné', muscle_group: 'pectoraux', is_default: true },
  { name: 'Développé décliné', muscle_group: 'pectoraux', is_default: true },
  { name: 'Écarté', muscle_group: 'pectoraux', is_default: true },
  { name: 'Pompes', muscle_group: 'pectoraux', is_default: true },
  { name: 'Dips', muscle_group: 'pectoraux', is_default: true },
  { name: 'Pull-over', muscle_group: 'pectoraux', is_default: true },

  // Dos
  { name: 'Tractions', muscle_group: 'dos', is_default: true },
  { name: 'Rowing barre', muscle_group: 'dos', is_default: true },
  { name: 'Rowing haltère', muscle_group: 'dos', is_default: true },
  { name: 'Tirage vertical', muscle_group: 'dos', is_default: true },
  { name: 'Tirage horizontal', muscle_group: 'dos', is_default: true },
  { name: 'Soulevé de terre', muscle_group: 'dos', is_default: true },
  { name: 'Face pull', muscle_group: 'dos', is_default: true },

  // Jambes
  { name: 'Squat', muscle_group: 'jambes', is_default: true },
  { name: 'Front squat', muscle_group: 'jambes', is_default: true },
  { name: 'Presse à cuisses', muscle_group: 'jambes', is_default: true },
  { name: 'Leg curl', muscle_group: 'jambes', is_default: true },
  { name: 'Leg extension', muscle_group: 'jambes', is_default: true },
  { name: 'Fentes', muscle_group: 'jambes', is_default: true },
  { name: 'Bulgarian split squat', muscle_group: 'jambes', is_default: true },
  { name: 'Mollets debout', muscle_group: 'jambes', is_default: true },
  { name: 'Mollets assis', muscle_group: 'jambes', is_default: true },

  // Épaules
  { name: 'Développé militaire', muscle_group: 'epaules', is_default: true },
  { name: 'Développé Arnold', muscle_group: 'epaules', is_default: true },
  { name: 'Élévations latérales', muscle_group: 'epaules', is_default: true },
  { name: 'Élévations frontales', muscle_group: 'epaules', is_default: true },
  { name: 'Oiseau', muscle_group: 'epaules', is_default: true },
  { name: 'Rowing menton', muscle_group: 'epaules', is_default: true },

  // Biceps
  { name: 'Curl barre', muscle_group: 'biceps', is_default: true },
  { name: 'Curl haltères', muscle_group: 'biceps', is_default: true },
  { name: 'Curl marteau', muscle_group: 'biceps', is_default: true },
  { name: 'Curl pupitre', muscle_group: 'biceps', is_default: true },
  { name: 'Curl concentration', muscle_group: 'biceps', is_default: true },

  // Triceps
  { name: 'Dips triceps', muscle_group: 'triceps', is_default: true },
  { name: 'Extensions nuque', muscle_group: 'triceps', is_default: true },
  { name: 'Extensions poulie haute', muscle_group: 'triceps', is_default: true },
  { name: 'Kickback', muscle_group: 'triceps', is_default: true },
  { name: 'Barre au front', muscle_group: 'triceps', is_default: true },

  // Abdos
  { name: 'Crunch', muscle_group: 'abdos', is_default: true },
  { name: 'Planche', muscle_group: 'abdos', is_default: true },
  { name: 'Relevé de jambes', muscle_group: 'abdos', is_default: true },
  { name: 'Russian twist', muscle_group: 'abdos', is_default: true },
  { name: 'Mountain climbers', muscle_group: 'abdos', is_default: true },
  { name: 'Bicycle crunch', muscle_group: 'abdos', is_default: true },
];

export const EXERCISE_TAGS = [
  'Barre', 'Haltères', 'Machine', 'Poids de corps', 'Poulie',
  'Élastiques', 'Incliné', 'Décliné', 'Plat',
  'Unilatéral', 'Bilatéral', 'Prise large', 'Prise serrée', 'Prise neutre',
];

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  pectoraux: 'Pectoraux',
  dos: 'Dos',
  jambes: 'Jambes',
  epaules: 'Épaules',
  biceps: 'Biceps',
  triceps: 'Triceps',
  abdos: 'Abdos',
};

// ============================================================
// XP BARÈME
// ============================================================

export const XP_REWARDS = {
  WORKOUT_SESSION: 50,
  RUNNING_SESSION: 50,
  WEIGHT_ENTRY: 10,
  PERSONAL_RECORD: 100,
  PERSONAL_GOAL_COMPLETED: 150,
  COMMUNITY_CHALLENGE_COMPLETED: 200,
  FLASH_CHALLENGE_COMPLETED: 100,
  STREAK_7_DAYS: 200,
  STREAK_30_DAYS: 1000,
  MILESTONE: 300,
} as const;

// ============================================================
// BADGES
// ============================================================

export const BADGE_DEFINITIONS = [
  // Progression
  { code: 'bronze_level', name: 'Niveau Bronze', description: 'Atteindre le niveau 5', category: 'progression', rarity: 'common', is_secret: false },
  { code: 'silver_level', name: 'Niveau Argent', description: 'Atteindre le niveau 10', category: 'progression', rarity: 'rare', is_secret: false },
  { code: 'gold_level', name: 'Niveau Or', description: 'Atteindre le niveau 15', category: 'progression', rarity: 'epic', is_secret: false },
  { code: 'platinum_level', name: 'Niveau Platine', description: 'Atteindre le niveau 20', category: 'progression', rarity: 'legendary', is_secret: false },
  { code: 'diamond_level', name: 'Niveau Diamant', description: 'Atteindre le niveau 25', category: 'progression', rarity: 'legendary', is_secret: false },
  { code: 'runner_badge', name: 'Runner', description: 'Atteindre niveau 10 en course', category: 'progression', rarity: 'rare', is_secret: false },
  { code: 'lifter_badge', name: 'Lifter', description: 'Atteindre niveau 10 en musculation', category: 'progression', rarity: 'rare', is_secret: false },
  { code: 'transformer_badge', name: 'Transformer', description: 'Perdre ou gagner 10kg', category: 'progression', rarity: 'epic', is_secret: false },
  { code: 'week_streak', name: '7 jours consécutifs', description: 'Maintenir 7 jours d\'activité', category: 'progression', rarity: 'common', is_secret: false },
  { code: 'month_streak', name: '30 jours consécutifs', description: 'Maintenir 30 jours d\'activité', category: 'progression', rarity: 'rare', is_secret: false },
  { code: 'hundred_days', name: '100 jours consécutifs', description: 'Maintenir 100 jours d\'activité', category: 'progression', rarity: 'epic', is_secret: false },
  { code: 'year_streak', name: '365 jours consécutifs', description: 'Maintenir 1 an d\'activité', category: 'progression', rarity: 'legendary', is_secret: false },

  // Objectifs
  { code: 'first_goal', name: 'Premier objectif', description: 'Compléter son 1er objectif personnel', category: 'objectifs', rarity: 'common', is_secret: false },
  { code: 'ten_goals', name: 'Visionnaire', description: 'Compléter 10 objectifs personnels', category: 'objectifs', rarity: 'common', is_secret: false },
  { code: 'fifty_goals', name: 'Ambitieux', description: 'Compléter 50 objectifs personnels', category: 'objectifs', rarity: 'rare', is_secret: false },
  { code: 'hundred_goals', name: 'Déterminé', description: 'Compléter 100 objectifs personnels', category: 'objectifs', rarity: 'epic', is_secret: false },
  { code: 'challenge_participant', name: 'Participant', description: 'Participer à un objectif commun', category: 'objectifs', rarity: 'common', is_secret: false },
  { code: 'challenge_contributor', name: 'Contributeur', description: 'Compléter un objectif commun', category: 'objectifs', rarity: 'common', is_secret: false },
  { code: 'challenge_mvp', name: 'MVP communautaire', description: 'Compléter 10 objectifs communs', category: 'objectifs', rarity: 'epic', is_secret: false },
  { code: 'speedster', name: 'Speedster', description: 'Compléter un objectif flash', category: 'objectifs', rarity: 'rare', is_secret: false },
  { code: 'early_bird_flash', name: 'Early Bird', description: 'Compléter un objectif flash dans les 6h', category: 'objectifs', rarity: 'epic', is_secret: true },

  // Performance
  { code: 'first_pr', name: 'Premier record', description: 'Battre son 1er record personnel', category: 'performance', rarity: 'common', is_secret: false },
  { code: 'ten_prs', name: 'Progressiste', description: 'Battre 10 records personnels', category: 'performance', rarity: 'common', is_secret: false },
  { code: 'fifty_prs', name: 'Champion', description: 'Battre 50 records personnels', category: 'performance', rarity: 'rare', is_secret: false },
  { code: 'hundred_km', name: 'Centurion du km', description: 'Courir 100km cumulés', category: 'performance', rarity: 'common', is_secret: false },
  { code: 'five_hundred_km', name: 'Ultra runner', description: 'Courir 500km cumulés', category: 'performance', rarity: 'rare', is_secret: false },
  { code: 'thousand_km', name: 'Marathonien légendaire', description: 'Courir 1000km cumulés', category: 'performance', rarity: 'legendary', is_secret: false },
  { code: 'thousand_kg', name: 'Force Initiale', description: 'Soulever 1000kg cumulés', category: 'performance', rarity: 'common', is_secret: false },
  { code: 'five_thousand_kg', name: 'Force Intermédiaire', description: 'Soulever 5000kg cumulés', category: 'performance', rarity: 'rare', is_secret: false },
  { code: 'ten_thousand_kg', name: 'Force Légendaire', description: 'Soulever 10000kg cumulés', category: 'performance', rarity: 'epic', is_secret: false },
  { code: 'minus_5kg', name: 'Transformation -5kg', description: 'Perdre 5kg', category: 'performance', rarity: 'common', is_secret: false },
  { code: 'minus_10kg', name: 'Transformation -10kg', description: 'Perdre 10kg', category: 'performance', rarity: 'rare', is_secret: false },
  { code: 'minus_20kg', name: 'Transformation -20kg', description: 'Perdre 20kg', category: 'performance', rarity: 'epic', is_secret: false },
  { code: 'plus_5kg_muscle', name: 'Gain musculaire +5kg', description: 'Prendre 5kg', category: 'performance', rarity: 'common', is_secret: false },
  { code: 'plus_10kg_muscle', name: 'Gain musculaire +10kg', description: 'Prendre 10kg', category: 'performance', rarity: 'rare', is_secret: false },

  // Participation
  { code: 'ten_sessions', name: 'Démarrage', description: 'Enregistrer 10 séances', category: 'participation', rarity: 'common', is_secret: false },
  { code: 'fifty_sessions', name: 'Régulier', description: 'Enregistrer 50 séances', category: 'participation', rarity: 'common', is_secret: false },
  { code: 'hundred_sessions', name: 'Assidu', description: 'Enregistrer 100 séances', category: 'participation', rarity: 'rare', is_secret: false },
  { code: 'five_hundred_sessions', name: 'Dévoué', description: 'Enregistrer 500 séances', category: 'participation', rarity: 'epic', is_secret: false },
  { code: 'thousand_sessions', name: 'Légendaire', description: 'Enregistrer 1000 séances', category: 'participation', rarity: 'legendary', is_secret: false },
  { code: 'multi_sport_warrior', name: 'Guerrier multi-sport', description: 'Faire muscu + course dans la même semaine', category: 'participation', rarity: 'common', is_secret: false },
  { code: 'social_athlete', name: 'Athlète social', description: 'Liker 50 performances', category: 'participation', rarity: 'common', is_secret: false },
  { code: 'team_player', name: 'Team Player', description: 'Commenter 50 fois', category: 'participation', rarity: 'common', is_secret: false },

  // Secret
  { code: 'new_year_athlete', name: 'Nouvel An Sportif', description: 'Séance le 1er janvier', category: 'secret', rarity: 'rare', is_secret: true },
  { code: 'valentine_solo', name: 'Saint-Valentin solo', description: 'Séance le 14 février', category: 'secret', rarity: 'rare', is_secret: true },
  { code: 'resolution_keeper', name: 'Résolution tenue', description: '365 jours consécutifs', category: 'secret', rarity: 'legendary', is_secret: true },
  { code: 'four_seasons', name: 'Quatre saisons', description: 'Séance dans chaque saison', category: 'secret', rarity: 'epic', is_secret: true },
  { code: 'phoenix', name: 'Phoenix', description: 'Revenir après 30+ jours d\'inactivité', category: 'secret', rarity: 'epic', is_secret: true },
  { code: 'indestructible', name: 'Indestructible', description: '100 jours consécutifs', category: 'secret', rarity: 'epic', is_secret: true },
  { code: 'rainy_warrior', name: 'Guerrier de la pluie', description: '5 courses sous la pluie', category: 'secret', rarity: 'rare', is_secret: true },
  { code: 'winter_warrior', name: 'Guerrier de l\'hiver', description: '10 courses par <5°C', category: 'secret', rarity: 'rare', is_secret: true },
  { code: 'double_trouble', name: 'Doublé', description: 'Muscu + Course le même jour', category: 'secret', rarity: 'rare', is_secret: false },
  { code: 'triple_threat', name: 'Triplé', description: 'Muscu + Course + Pesée le même jour', category: 'secret', rarity: 'epic', is_secret: false },
  { code: 'speedster_week', name: 'Speedster', description: 'Battre 3 PRs en une semaine', category: 'secret', rarity: 'rare', is_secret: false },
  { code: 'titan', name: 'Titan', description: '10000kg de tonnage en une séance', category: 'secret', rarity: 'legendary', is_secret: true },
  { code: 'triple_seven', name: 'Triple 7', description: 'Séance le 07/07 entre 7h-8h', category: 'secret', rarity: 'legendary', is_secret: true },
  { code: 'perfect_balance', name: 'Équilibre parfait', description: '50% muscu / 50% course sur un mois', category: 'secret', rarity: 'epic', is_secret: true },
  { code: 'mad_collector', name: 'Collectionneur fou', description: 'Débloquer 50 badges', category: 'secret', rarity: 'legendary', is_secret: false },
  { code: 'leet', name: '1337', description: 'Atteindre exactement 1337 XP', category: 'secret', rarity: 'legendary', is_secret: true },
  { code: 'explorer', name: 'Explorateur', description: 'Utiliser tous les types de course', category: 'secret', rarity: 'common', is_secret: false },
  { code: 'polyvalent', name: 'Polyvalent', description: '10 exercices différents en muscu', category: 'secret', rarity: 'common', is_secret: false },
  { code: 'rainbow', name: 'Arc-en-ciel', description: 'Utiliser tous les feedbacks', category: 'secret', rarity: 'rare', is_secret: false },
  { code: 'first_supporter', name: 'Premier supporter', description: 'Premier à liker une performance', category: 'secret', rarity: 'rare', is_secret: true },
  { code: 'active_commenter', name: 'Commentateur actif', description: '100 commentaires postés', category: 'participation', rarity: 'rare', is_secret: false },
  { code: 'motivator', name: 'Motivateur', description: 'Recevoir 50 likes sur une performance', category: 'secret', rarity: 'epic', is_secret: true },
  { code: 'creator', name: 'Créateur', description: 'Créer le 1er objectif commun validé', category: 'secret', rarity: 'rare', is_secret: true },
] as const;

export type BadgeCode = typeof BADGE_DEFINITIONS[number]['code'];

// ============================================================
// NIVEAUX
// ============================================================

export const LEVEL_TITLES = [
  { min: 1, max: 5, title: 'Débutant' },
  { min: 6, max: 10, title: 'Intermédiaire' },
  { min: 11, max: 15, title: 'Avancé' },
  { min: 16, max: 20, title: 'Expert' },
  { min: 21, max: Infinity, title: 'Élite' },
] as const;

// ============================================================
// RUNNING
// ============================================================

export const RUN_TYPE_LABELS = {
  fractionne: 'Fractionné',
  endurance: 'Endurance',
  tempo: 'Tempo',
} as const;

export const WEATHER_LABELS = {
  ensoleille: '☀️ Ensoleillé',
  nuageux: '☁️ Nuageux',
  pluie: '🌧️ Pluie',
  vent: '💨 Vent',
  neige: '❄️ Neige',
} as const;

export const FEEDBACK_LABELS = {
  facile: 'Facile',
  difficile: 'Difficile',
  mort: 'Mort',
} as const;

export const FEEDBACK_COLORS = {
  facile: 'text-emerald-400',
  difficile: 'text-amber-400',
  mort: 'text-red-400',
} as const;

// Records distances course
export const RUNNING_RECORD_DISTANCES = [
  { label: '5 km', km: 5 },
  { label: '10 km', km: 10 },
  { label: 'Semi-marathon', km: 21.0975 },
  { label: 'Marathon', km: 42.195 },
] as const;

// Zones cardiaques
export const HEART_RATE_ZONES = [
  { zone: 'Z1', label: 'Récupération', min: 50, max: 60, color: '#6ee7b7' },
  { zone: 'Z2', label: 'Endurance fondamentale', min: 60, max: 70, color: '#34d399' },
  { zone: 'Z3', label: 'Tempo', min: 70, max: 80, color: '#fbbf24' },
  { zone: 'Z4', label: 'Seuil', min: 80, max: 90, color: '#f97316' },
  { zone: 'Z5', label: 'VO2 max', min: 90, max: 100, color: '#ef4444' },
] as const;

// Seuil d'alerte chaussures
export const SHOE_ALERT_KM = 800;

// Rareté des badges
export const BADGE_RARITY_CONFIG = {
  common: { label: 'Commun', color: '#94a3b8', bg: '#1e293b' },
  rare: { label: 'Rare', color: '#60a5fa', bg: '#1e3a5f' },
  epic: { label: 'Épique', color: '#a78bfa', bg: '#2e1065' },
  legendary: { label: 'Légendaire', color: '#fbbf24', bg: '#451a03' },
} as const;
