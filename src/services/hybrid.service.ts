import { supabase } from '../lib/supabase-client';
import type {
  HybridSession, HybridBlock,
  HybridMusculationBlock, HybridRunBlock, HybridCalisthenicsBlock,
} from '../types/models';

// ─── Fonctions d'extraction pure (pas d'appel DB) ────────────────────────────

/** Tonnage total des blocs musculation d'une liste de blocks. */
export function hybridMusculationTonnage(blocks: HybridBlock[]): number {
  return (blocks.filter(b => b.blockType === 'musculation') as HybridMusculationBlock[])
    .reduce((sum, b) => sum + b.exercises.reduce((exSum, ex) =>
      exSum + ex.sets.reduce((setSum, s) => setSum + s.reps * s.weight, 0), 0), 0);
}

/** Distance totale (km) des blocs running d'une liste de blocks. */
export function hybridRunningDistance(blocks: HybridBlock[]): number {
  return (blocks.filter(b => b.blockType === 'running') as HybridRunBlock[])
    .reduce((sum, b) => sum + b.distance, 0);
}

/** Reps totales des blocs calisthenics d'une liste de blocks. */
export function hybridCalisthenicsReps(blocks: HybridBlock[]): number {
  return (blocks.filter(b => b.blockType === 'calisthenics') as HybridCalisthenicsBlock[])
    .reduce((sum, b) => sum + b.exercises.reduce((exSum, ex) =>
      exSum + ex.sets * ex.reps, 0), 0);
}

/** Retourne true si la liste de blocks contient au moins un bloc du type donné. */
export function hybridHasBlock(blocks: HybridBlock[], type: HybridBlock['blockType']): boolean {
  return blocks.some(b => b.blockType === type);
}

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
