import { supabase } from '../lib/supabase-client';
import type { PersonalGoal } from '../types/models';

// Helper pour bypasser le typage strict Supabase sur les tables custom
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const goalsService = {
  // Récupérer tous les objectifs d'un utilisateur
  async getGoals(userId: string): Promise<PersonalGoal[]> {
    const { data, error } = await db
      .from('personal_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as PersonalGoal[];
  },

  // Créer un nouvel objectif
  async createGoal(input: {
    user_id: string;
    type: string;
    title: string;
    description?: string;
    target_value?: number;
    current_value?: number;
    unit?: string;
    deadline?: string;
    direction?: 'gain' | 'lose';
    initial_value?: number;
  }): Promise<PersonalGoal> {
    const { data, error } = await db
      .from('personal_goals')
      .insert({
        user_id: input.user_id,
        type: input.type,
        title: input.title,
        description: input.description ?? null,
        target_value: input.target_value ?? null,
        current_value: input.current_value ?? 0,
        unit: input.unit ?? null,
        deadline: input.deadline ?? null,
        status: 'active',
        direction: input.direction ?? 'gain',
        initial_value: input.initial_value ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as PersonalGoal;
  },

  // Mettre à jour la progression (current_value)
  async updateProgress(goalId: string, currentValue: number): Promise<PersonalGoal> {
    const { data, error } = await db
      .from('personal_goals')
      .update({ current_value: currentValue })
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return data as PersonalGoal;
  },

  // Marquer un objectif comme complété
  async completeGoal(goalId: string): Promise<PersonalGoal> {
    const { data, error } = await db
      .from('personal_goals')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return data as PersonalGoal;
  },

  // Annuler un objectif
  async cancelGoal(goalId: string): Promise<PersonalGoal> {
    const { data, error } = await db
      .from('personal_goals')
      .update({ status: 'cancelled' })
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return data as PersonalGoal;
  },

  // Supprimer définitivement un objectif
  async deleteGoal(goalId: string): Promise<void> {
    const { error } = await db
      .from('personal_goals')
      .delete()
      .eq('id', goalId);

    if (error) throw error;
  },
};
