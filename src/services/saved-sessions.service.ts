import { supabase } from '../lib/supabase-client';

const db = supabase as any;

export interface SavedSession {
  id: string;
  user_id: string;
  source_user_id: string | null;
  source_username: string | null;
  type: 'workout' | 'run' | 'calisthenics';
  custom_name: string | null;
  original_name: string | null;
  exercises: { name: string; sets: number; reps: number; maxWeight?: number; distance?: number; duration?: number }[];
  saved_at: string;
}

export const savedSessionsService = {
  async getSessions(userId: string): Promise<SavedSession[]> {
    const { data, error } = await db
      .from('saved_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as SavedSession[];
  },

  async saveSession(params: {
    userId: string;
    sourceUserId?: string;
    sourceUsername?: string;
    type: 'workout' | 'run' | 'calisthenics';
    customName?: string;
    originalName?: string;
    exercises: object[];
  }): Promise<SavedSession> {
    const { data, error } = await db
      .from('saved_sessions')
      .insert({
        user_id: params.userId,
        source_user_id: params.sourceUserId ?? null,
        source_username: params.sourceUsername ?? null,
        type: params.type,
        custom_name: params.customName?.trim() || null,
        original_name: params.originalName ?? null,
        exercises: params.exercises,
      })
      .select()
      .single();
    if (error) throw error;
    return data as SavedSession;
  },

  async deleteSession(id: string): Promise<void> {
    const { error } = await db.from('saved_sessions').delete().eq('id', id);
    if (error) throw error;
  },

  async isAlreadySaved(userId: string, sourceUserId: string, originalName: string | null, type: string): Promise<boolean> {
    const query = db
      .from('saved_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('source_user_id', sourceUserId)
      .eq('type', type);
    if (originalName) query.eq('original_name', originalName);
    const { data } = await query.maybeSingle();
    return data !== null;
  },
};
