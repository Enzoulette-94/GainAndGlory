// Types générés pour Supabase - à mettre à jour avec `supabase gen types typescript`
// Ce fichier sert de placeholder pour le typage de base

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          created_at: string;
          fc_max: number | null;
          share_performances: boolean;
          share_weight: boolean;
          share_photos: boolean;
          preferred_pace_unit: string;
          total_xp: number;
          global_level: number;
          musculation_xp: number;
          musculation_level: number;
          running_xp: number;
          running_level: number;
          current_streak: number;
          longest_streak: number;
          last_activity_date: string | null;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; username: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      exercises: {
        Row: {
          id: string;
          name: string;
          muscle_group: string;
          created_by: string | null;
          created_at: string;
          is_default: boolean;
          usage_count: number;
        };
        Insert: Omit<Database['public']['Tables']['exercises']['Row'], 'id' | 'created_at' | 'usage_count'>;
        Update: Partial<Database['public']['Tables']['exercises']['Row']>;
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          feedback: string | null;
          total_tonnage: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workout_sessions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['workout_sessions']['Row']>;
      };
      workout_sets: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string;
          set_number: number;
          reps: number;
          weight: number;
          rest_time: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workout_sets']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['workout_sets']['Row']>;
      };
      running_sessions: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          distance: number;
          duration: number;
          pace_min_per_km: number | null;
          pace_km_per_h: number | null;
          run_type: string | null;
          elevation_gain: number | null;
          elevation_loss: number | null;
          avg_heart_rate: number | null;
          max_heart_rate: number | null;
          weather_temp: number | null;
          weather_condition: string | null;
          shoe_id: string | null;
          feedback: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['running_sessions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['running_sessions']['Row']>;
      };
      weight_entries: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          weight: number;
          photo_url: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['weight_entries']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['weight_entries']['Row']>;
      };
      shoes: {
        Row: {
          id: string;
          user_id: string;
          brand: string | null;
          model: string;
          purchase_date: string | null;
          total_km: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shoes']['Row'], 'id' | 'created_at' | 'total_km'>;
        Update: Partial<Database['public']['Tables']['shoes']['Row']>;
      };
      personal_goals: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          description: string | null;
          target_value: number | null;
          current_value: number;
          unit: string | null;
          deadline: string | null;
          status: string;
          completed_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['personal_goals']['Row'], 'id' | 'created_at' | 'current_value' | 'completed_at'>;
        Update: Partial<Database['public']['Tables']['personal_goals']['Row']>;
      };
      community_challenges: {
        Row: {
          id: string;
          created_by: string;
          title: string;
          description: string | null;
          type: string;
          target_value: number;
          unit: string;
          start_date: string;
          end_date: string;
          is_flash: boolean;
          status: string;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['community_challenges']['Row'], 'id' | 'created_at' | 'approved_by' | 'approved_at'>;
        Update: Partial<Database['public']['Tables']['community_challenges']['Row']>;
      };
      challenge_participations: {
        Row: {
          id: string;
          challenge_id: string;
          user_id: string;
          contribution: number;
          completed: boolean;
          completed_at: string | null;
          joined_at: string;
        };
        Insert: Omit<Database['public']['Tables']['challenge_participations']['Row'], 'id' | 'joined_at' | 'contribution' | 'completed' | 'completed_at'>;
        Update: Partial<Database['public']['Tables']['challenge_participations']['Row']>;
      };
      events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          event_date: string;
          type: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['events']['Row']>;
      };
      badges: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          category: string;
          rarity: string;
          icon_url: string | null;
          is_secret: boolean;
        };
        Insert: Omit<Database['public']['Tables']['badges']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['badges']['Row']>;
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          unlocked_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_badges']['Row'], 'id' | 'unlocked_at'>;
        Update: Partial<Database['public']['Tables']['user_badges']['Row']>;
      };
      activity_feed: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          content: Json;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['activity_feed']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['activity_feed']['Row']>;
      };
      activity_likes: {
        Row: { id: string; activity_id: string; user_id: string; created_at: string };
        Insert: Omit<Database['public']['Tables']['activity_likes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['activity_likes']['Row']>;
      };
      activity_comments: {
        Row: { id: string; activity_id: string; user_id: string; content: string; created_at: string };
        Insert: Omit<Database['public']['Tables']['activity_comments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['activity_comments']['Row']>;
      };
      notifications: {
        Row: { id: string; user_id: string; type: string; content: Json; read: boolean; created_at: string };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at' | 'read'>;
        Update: Partial<Database['public']['Tables']['notifications']['Row']>;
      };
      notification_preferences: {
        Row: {
          user_id: string;
          flash_challenge: boolean;
          record_beaten: boolean;
          badge_unlocked: boolean;
          level_up: boolean;
          event_created: boolean;
          likes: boolean;
          comments: boolean;
        };
        Insert: Database['public']['Tables']['notification_preferences']['Row'];
        Update: Partial<Database['public']['Tables']['notification_preferences']['Row']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
