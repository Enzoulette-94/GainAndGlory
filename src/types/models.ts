import type {
  MuscleGroup, Feedback, RunType, WeatherCondition,
  GoalType, GoalStatus, ChallengeType, ChallengeStatus,
  EventType, BadgeCategory, BadgeRarity, ActivityType, NotificationType,
} from './enums';

export type {
  MuscleGroup, Feedback, RunType, WeatherCondition,
  GoalType, GoalStatus, ChallengeType, ChallengeStatus,
  EventType, BadgeCategory, BadgeRarity, ActivityType, NotificationType,
};

// ============================================================
// MODÈLES PRINCIPAUX
// ============================================================

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  fc_max: number | null;
  share_performances: boolean;
  share_weight: boolean;
  share_photos: boolean;
  preferred_pace_unit: 'min/km' | 'km/h';
  total_xp: number;
  global_level: number;
  musculation_xp: number;
  musculation_level: number;
  running_xp: number;
  running_level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  created_by: string | null;
  created_at: string;
  is_default: boolean;
  usage_count: number;
  tags?: ExerciseTag[];
}

export interface ExerciseTag {
  id: string;
  name: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  date: string;
  name: string | null;
  feedback: Feedback | null;
  total_tonnage: number | null;
  notes: string | null;
  created_at: string;
  sets?: WorkoutSet[];
}

export interface WorkoutSet {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  reps: number;
  weight: number;
  rest_time: number | null;
  created_at: string;
  exercise?: Exercise;
}

export interface Shoe {
  id: string;
  user_id: string;
  brand: string | null;
  model: string;
  purchase_date: string | null;
  total_km: number;
  is_active: boolean;
  created_at: string;
}

export interface RunningSession {
  id: string;
  user_id: string;
  date: string;
  name: string | null;
  distance: number;
  duration: number;
  pace_min_per_km: number | null;
  pace_km_per_h: number | null;
  run_type: RunType | null;
  elevation_gain: number | null;
  elevation_loss: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  weather_temp: number | null;
  weather_condition: WeatherCondition | null;
  shoe_id: string | null;
  feedback: Feedback | null;
  notes: string | null;
  created_at: string;
  shoe?: Shoe;
}

export interface WeightEntry {
  id: string;
  user_id: string;
  date: string;
  weight: number;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface PersonalGoal {
  id: string;
  user_id: string;
  type: GoalType;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  deadline: string | null;
  status: GoalStatus;
  completed_at: string | null;
  created_at: string;
}

export interface CommunityChallenge {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  type: ChallengeType;
  target_value: number;
  unit: string;
  start_date: string;
  end_date: string;
  is_flash: boolean;
  status: ChallengeStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  creator?: Profile;
  participations?: ChallengeParticipation[];
  total_contribution?: number;
}

export interface ChallengeParticipation {
  id: string;
  challenge_id: string;
  user_id: string;
  contribution: number;
  completed: boolean;
  completed_at: string | null;
  joined_at: string;
  user?: Profile;
}

export interface Event {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_date: string;
  type: EventType | null;
  created_at: string;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: BadgeCategory;
  rarity: BadgeRarity;
  icon_url: string | null;
  is_secret: boolean;
}

export interface ProfileRecord {
  id: string;
  user_id: string;
  title: string;
  value: string;
  unit: string;
  category: 'musculation' | 'course';
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  unlocked_at: string;
  badge?: Badge;
}

export interface ActivityFeedItem {
  id: string;
  user_id: string;
  type: ActivityType;
  content: ActivityContent;
  created_at: string;
  user?: Profile;
  likes?: ActivityLike[];
  comments?: ActivityComment[];
  likes_count?: number;
  comments_count?: number;
  user_liked?: boolean;
}

export interface ActivityLike {
  id: string;
  activity_id: string;
  user_id: string;
  created_at: string;
}

export interface ActivityComment {
  id: string;
  activity_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  content: NotificationContent;
  read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  flash_challenge: boolean;
  record_beaten: boolean;
  badge_unlocked: boolean;
  level_up: boolean;
  event_created: boolean;
  likes: boolean;
  comments: boolean;
}

// ============================================================
// TYPES DE CONTENU (JSONB)
// ============================================================

export type ActivityContent =
  | { type: 'workout'; tonnage: number; sets_count: number; feedback?: string }
  | { type: 'run'; distance: number; duration: number; pace: number; run_type?: string }
  | { type: 'record'; discipline: string; exercise?: string; distance?: number; old_value: number; new_value: number; unit: string }
  | { type: 'badge'; badge_code: string; badge_name: string; badge_rarity: BadgeRarity }
  | { type: 'level_up'; level: number; discipline: 'global' | 'musculation' | 'running'; title: string }
  | { type: 'challenge_completed'; challenge_title: string; contribution: number; unit: string };

export type NotificationContent =
  | { message: string; challenge_id?: string; challenge_title?: string }
  | { message: string; activity_id?: string }
  | { message: string; badge_code?: string; badge_name?: string }
  | { message: string; level?: number; discipline?: string }
  | { message: string; event_id?: string; event_title?: string }
  | { message: string; liker_name?: string; count?: number; activity_id?: string }
  | { message: string; commenter_name?: string; activity_id?: string };
