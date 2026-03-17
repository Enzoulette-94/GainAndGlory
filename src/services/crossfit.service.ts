import { supabase } from '../lib/supabase-client';
import type { CrossfitSession, CrossfitExercise } from '../types/models';
import type { CrossfitWodType } from '../types/enums';
import type { Feedback } from '../types/enums';

const db = supabase as any;

export interface CreateCrossfitInput {
  userId: string;
  date?: string;
  name?: string;
  wod_type: CrossfitWodType;
  total_duration?: number | null;
  round_duration?: number | null;
  target_rounds?: number | null;
  result_time?: string | null;
  result_reps?: number | null;
  result_rounds?: number | null;
  benchmark_name?: string | null;
  exercises: CrossfitExercise[];
  feedback?: Feedback;
  notes?: string;
}

export const crossfitService = {
  async createSession(input: CreateCrossfitInput): Promise<CrossfitSession> {
    const { data, error } = await db
      .from('crossfit_sessions')
      .insert({
        user_id: input.userId,
        date: input.date ?? new Date().toISOString(),
        name: input.name ?? null,
        wod_type: input.wod_type,
        total_duration: input.total_duration ?? null,
        round_duration: input.round_duration ?? null,
        target_rounds: input.target_rounds ?? null,
        result_time: input.result_time ?? null,
        result_reps: input.result_reps ?? null,
        result_rounds: input.result_rounds ?? null,
        benchmark_name: input.benchmark_name ?? null,
        exercises: input.exercises,
        feedback: input.feedback ?? null,
        notes: input.notes ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as CrossfitSession;
  },

  async getSessions(userId: string, limit = 20, offset = 0): Promise<CrossfitSession[]> {
    const { data, error } = await db
      .from('crossfit_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return (data ?? []) as CrossfitSession[];
  },

  async getSession(sessionId: string): Promise<CrossfitSession | null> {
    const { data, error } = await db
      .from('crossfit_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();
    if (error) throw error;
    return data as CrossfitSession | null;
  },

  async deleteSession(sessionId: string): Promise<void> {
    const { error } = await db
      .from('crossfit_sessions')
      .delete()
      .eq('id', sessionId);
    if (error) throw error;
  },

  async getSessionsCount(userId: string): Promise<number> {
    const { count, error } = await db
      .from('crossfit_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (error) throw error;
    return count ?? 0;
  },
};
