import { supabase } from '../lib/supabase-client';
import type { HybridSession, HybridBlock } from '../types/models';

const db = supabase as any;

interface CreateHybridSessionInput {
  userId: string;
  date: string;
  name?: string;
  notes?: string;
  feedback?: string;
  blocks: HybridBlock[];
}

export const hybridService = {
  async createSession(input: CreateHybridSessionInput): Promise<HybridSession> {
    const { data, error } = await db
      .from('hybrid_sessions')
      .insert({
        user_id: input.userId,
        date: input.date,
        name: input.name ?? null,
        notes: input.notes ?? null,
        feedback: input.feedback ?? null,
        blocks: input.blocks,
      })
      .select()
      .single();
    if (error) throw error;
    return data as HybridSession;
  },

  async getSessions(userId: string, limit = 20): Promise<HybridSession[]> {
    const { data, error } = await db
      .from('hybrid_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as HybridSession[];
  },

  async getSessionsCount(userId: string): Promise<number> {
    const { data, error } = await db
      .from('hybrid_sessions')
      .select('id')
      .eq('user_id', userId);
    if (error) return 0;
    return (data ?? []).length;
  },

  async deleteSession(sessionId: string): Promise<void> {
    const { error } = await db
      .from('hybrid_sessions')
      .delete()
      .eq('id', sessionId);
    if (error) throw error;
  },
};
