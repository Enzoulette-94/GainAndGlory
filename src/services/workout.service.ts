import { supabase } from '../lib/supabase-client';
import { calcTonnage } from '../utils/calculations';
import type { WorkoutSession, WorkoutSet, Exercise } from '../types/models';

interface CreateWorkoutSetInput {
  exercise_id: string;
  set_number: number;
  reps: number;
  weight: number;
  rest_time?: number;
}

interface CreateWorkoutSessionInput {
  user_id: string;
  date?: string;
  name?: string;
  feedback?: string;
  notes?: string;
  sets: CreateWorkoutSetInput[];
}

export const workoutService = {
  async createSession(input: CreateWorkoutSessionInput): Promise<WorkoutSession> {
    const total_tonnage = calcTonnage(input.sets);

    const { data: session, error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: input.user_id,
        date: input.date ?? new Date().toISOString(),
        name: input.name ?? null,
        feedback: input.feedback ?? null,
        notes: input.notes ?? null,
        total_tonnage,
      })
      .select()
      .single();

    if (error) throw error;

    if (input.sets.length > 0) {
      const setsToInsert = input.sets.map(s => ({
        session_id: session.id,
        exercise_id: s.exercise_id,
        set_number: s.set_number,
        reps: s.reps,
        weight: s.weight,
        rest_time: s.rest_time ?? null,
      }));

      const { error: setsError } = await supabase.from('workout_sets').insert(setsToInsert);
      if (setsError) throw setsError;

      // Incrémenter usage_count des exercices
      const exerciseIds = [...new Set(input.sets.map(s => s.exercise_id))];
      for (const id of exerciseIds) {
        try { await supabase.rpc('increment_exercise_usage', { exercise_id: id }); } catch { /* ignore */ }
      }
    }

    return session as WorkoutSession;
  },

  async getSessions(userId: string, limit = 20, offset = 0): Promise<WorkoutSession[]> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select(`
        *,
        sets:workout_sets(
          *,
          exercise:exercises(*)
        )
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data ?? []) as WorkoutSession[];
  },

  async getSession(sessionId: string): Promise<WorkoutSession | null> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select(`
        *,
        sets:workout_sets(
          *,
          exercise:exercises(*)
        )
      `)
      .eq('id', sessionId)
      .single();

    if (error) return null;
    return data as WorkoutSession;
  },

  async deleteSession(sessionId: string) {
    const { error } = await supabase.from('workout_sessions').delete().eq('id', sessionId);
    if (error) throw error;
  },

  async getExercises(): Promise<Exercise[]> {
    const { data, error } = await supabase
      .from('exercises')
      .select('*, tags:exercise_tag_relation(tag:exercise_tags(*))')
      .order('usage_count', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(e => ({
      ...e,
      tags: e.tags?.map((t: { tag: Exercise['tags'] }) => t.tag).flat() ?? [],
    })) as Exercise[];
  },

  async createExercise(name: string, muscleGroup: string, userId: string): Promise<Exercise> {
    const { data, error } = await supabase
      .from('exercises')
      .insert({ name, muscle_group: muscleGroup, created_by: userId, is_default: false })
      .select()
      .single();

    if (error) throw error;
    return data as Exercise;
  },

  async getPersonalRecords(userId: string): Promise<Record<string, { weight: number; reps: number; date: string; sessionId: string }>> {
    const { data, error } = await supabase
      .from('workout_sets')
      .select(`
        weight, reps, created_at,
        exercise_id,
        session_id
      `)
      .in('session_id', (
        await supabase.from('workout_sessions').select('id').eq('user_id', userId)
          .then(r => r.data?.map(s => s.id) ?? [])
      ));

    if (error) throw error;

    const records: Record<string, { weight: number; reps: number; date: string; sessionId: string }> = {};

    for (const set of (data ?? []) as Array<{ exercise_id: string; weight: number; reps: number; created_at: string; session_id: string }>) {
      const exerciseId = set.exercise_id;
      if (!exerciseId) continue;

      if (!records[exerciseId] || set.weight > records[exerciseId].weight) {
        records[exerciseId] = {
          weight: set.weight,
          reps: set.reps,
          date: set.created_at,
          sessionId: set.session_id,
        };
      }
    }

    return records;
  },

  async getTotalTonnage(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('total_tonnage')
      .eq('user_id', userId);

    if (error) throw error;
    return (data ?? []).reduce((sum, s) => sum + (s.total_tonnage ?? 0), 0);
  },

  async getSessionsCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('workout_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count ?? 0;
  },
};
