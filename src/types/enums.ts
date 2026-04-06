// ============================================================
// ENUMS ET TYPES LITTÉRAUX
// ============================================================

export type MuscleGroup =
  | 'pectoraux'
  | 'dos'
  | 'jambes'
  | 'epaules'
  | 'biceps'
  | 'triceps'
  | 'abdos'
  | 'cardio';

export type RunLocation = 'exterieur' | 'salle';

export type Feedback = 'facile' | 'difficile' | 'mort';

export type RunType = 'fractionne' | 'endurance' | 'tempo';

export type WeatherCondition = 'ensoleille' | 'nuageux' | 'pluie' | 'vent' | 'neige';

export type GoalType = 'weight' | 'musculation' | 'running' | 'calisthenics';

export type GoalStatus = 'active' | 'completed' | 'failed' | 'cancelled';

export type ChallengeType = 'musculation' | 'running' | 'mixed' | 'calisthenics';

export type ChallengeStatus = 'pending' | 'active' | 'completed' | 'expired';

export type EventType = 'course' | 'competition' | 'objectif_poids';

export type BadgeCategory =
  | 'progression'
  | 'objectifs'
  | 'performance'
  | 'participation'
  | 'secret';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type CrossfitWodType = 'emom' | 'amrap' | 'benchmark' | 'for_rounds' | 'for_time';

export type ActivityType =
  | 'workout'
  | 'run'
  | 'calisthenics'
  | 'crossfit'
  | 'hybrid'
  | 'record'
  | 'personal_record'
  | 'badge'
  | 'level_up'
  | 'challenge_completed';

export type NotificationType =
  | 'flash_challenge'
  | 'record_beaten'
  | 'badge_unlocked'
  | 'level_up'
  | 'event_created'
  | 'like'
  | 'comment'
  | 'new_session'
  | 'team_goal_created';

export type HeartRateZone = 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5';

export type LevelTitle =
  | 'Débutant'
  | 'Intermédiaire'
  | 'Avancé'
  | 'Expert'
  | 'Élite';
