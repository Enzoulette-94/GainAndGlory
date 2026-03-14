import { supabase } from '../lib/supabase-client';
import type { CalisthenicsSession, CaliExercise, ProfileSkill } from '../types/models';
import { feedService } from './feed.service';
import { xpService } from './xp.service';
import { CALISTHENICS_SKILLS } from '../utils/constants';

const db = supabase as any;

export interface CreateCalisthenicsInput {
  userId: string;
  name?: string;
  date?: string;
  feedback?: 'facile' | 'difficile' | 'mort';
  notes?: string;
  exercises: CaliExercise[];
  skillsUnlocked?: string[];
}

function calcTotalReps(exercises: CaliExercise[]): number {
  return exercises.reduce((total, ex) => {
    return total + ex.sets.reduce((s, set) => s + (set.reps ?? 0), 0);
  }, 0);
}

export const calisthenicsService = {
  async createSession(input: CreateCalisthenicsInput): Promise<CalisthenicsSession> {
    const totalReps = calcTotalReps(input.exercises);
    const { data, error } = await db
      .from('calisthenics_sessions')
      .insert({
        user_id: input.userId,
        name: input.name ?? null,
        date: input.date ?? new Date().toISOString(),
        feedback: input.feedback ?? null,
        notes: input.notes ?? null,
        exercises: input.exercises,
        skills_unlocked: input.skillsUnlocked ?? [],
        total_reps: totalReps,
      })
      .select()
      .single();
    if (error) throw error;
    const session = data as CalisthenicsSession;

    // Publier dans le feed
    await feedService.publishCalisthenics(
      input.userId,
      input.exercises.length,
      totalReps,
      input.feedback,
      session.id,
      input.name,
      input.skillsUnlocked,
    );

    // Débloquer les skills cochés
    if (input.skillsUnlocked && input.skillsUnlocked.length > 0) {
      for (const skillCode of input.skillsUnlocked) {
        await this.unlockSkill(input.userId, skillCode);
      }
    }

    return session;
  },

  async getSessions(userId: string, limit = 20, offset = 0): Promise<CalisthenicsSession[]> {
    const { data, error } = await db
      .from('calisthenics_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return (data ?? []) as CalisthenicsSession[];
  },

  async getSession(sessionId: string): Promise<CalisthenicsSession | null> {
    const { data, error } = await db
      .from('calisthenics_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();
    if (error) throw error;
    return data as CalisthenicsSession | null;
  },

  async deleteSession(sessionId: string): Promise<void> {
    const { error } = await db
      .from('calisthenics_sessions')
      .delete()
      .eq('id', sessionId);
    if (error) throw error;
  },

  async getSessionsCount(userId: string): Promise<number> {
    const { count, error } = await db
      .from('calisthenics_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (error) throw error;
    return count ?? 0;
  },

  async getTotalReps(userId: string): Promise<number> {
    const { data, error } = await db
      .from('calisthenics_sessions')
      .select('total_reps')
      .eq('user_id', userId);
    if (error) throw error;
    return (data ?? []).reduce((sum: number, row: { total_reps: number }) => sum + (row.total_reps ?? 0), 0);
  },

  async getUnlockedSkills(userId: string): Promise<ProfileSkill[]> {
    const { data, error } = await db
      .from('profile_skills')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as ProfileSkill[];
  },

  async unlockSkill(userId: string, skillCode: string): Promise<void> {
    // Upsert to avoid duplicates
    const { error } = await db
      .from('profile_skills')
      .upsert({ user_id: userId, skill_code: skillCode }, { onConflict: 'user_id,skill_code' });
    if (error) throw error;

    // Award XP matching the skill definition
    const skillDef = CALISTHENICS_SKILLS.find(s => s.code === skillCode);
    if (skillDef) {
      try {
        await xpService.awardXP(userId, 'SKILL_UNLOCKED', 'calisthenics');
      } catch { /* ignore */ }
    }
  },
};
