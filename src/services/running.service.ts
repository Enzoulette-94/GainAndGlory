import { supabase } from '../lib/supabase-client';
import { calcPaceMinPerKm, calcSpeedKmH } from '../utils/calculations';
import type { RunningSession, Shoe } from '../types/models';

interface CreateRunningSessionInput {
  user_id: string;
  date?: string;
  name?: string;
  distance: number;
  duration: number;
  run_type?: string;
  elevation_gain?: number;
  elevation_loss?: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
  weather_temp?: number;
  weather_condition?: string;
  shoe_id?: string;
  feedback?: string;
  notes?: string;
}

export const runningService = {
  async createSession(input: CreateRunningSessionInput): Promise<RunningSession> {
    const pace_min_per_km = calcPaceMinPerKm(input.distance, input.duration);
    const pace_km_per_h = calcSpeedKmH(input.distance, input.duration);

    const basePayload = {
      user_id: input.user_id,
      date: input.date ?? new Date().toISOString(),
      distance: input.distance,
      duration: input.duration,
      pace_min_per_km,
      pace_km_per_h,
      run_type: input.run_type ?? null,
      elevation_gain: input.elevation_gain ?? null,
      elevation_loss: input.elevation_loss ?? null,
      avg_heart_rate: input.avg_heart_rate ?? null,
      max_heart_rate: input.max_heart_rate ?? null,
      weather_temp: input.weather_temp ?? null,
      weather_condition: input.weather_condition ?? null,
      shoe_id: input.shoe_id ?? null,
      feedback: input.feedback ?? null,
      notes: input.notes ?? null,
    };

    // Essai avec name (colonne optionnelle — peut ne pas exister encore)
    let result = await supabase
      .from('running_sessions')
      .insert({ ...basePayload, name: input.name ?? null })
      .select()
      .single();

    // Fallback sans name si la colonne n'existe pas encore
    if (result.error) {
      result = await supabase
        .from('running_sessions')
        .insert(basePayload)
        .select()
        .single();
    }

    if (result.error) throw result.error;
    const data = result.data;

    // Mettre à jour le kilométrage des chaussures
    if (input.shoe_id) {
      try {
        await supabase.rpc('increment_shoe_km', { shoe_id: input.shoe_id, km: input.distance });
      } catch { /* ignore */ }
    }

    return data as RunningSession;
  },

  async getSessions(userId: string, limit = 20, offset = 0): Promise<RunningSession[]> {
    const { data, error } = await supabase
      .from('running_sessions')
      .select('*, shoe:shoes(*)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data ?? []) as RunningSession[];
  },

  async deleteSession(sessionId: string) {
    const { error } = await supabase.from('running_sessions').delete().eq('id', sessionId);
    if (error) throw error;
  },

  async updateSession(sessionId: string, updates: {
    name?: string | null; date?: string; feedback?: string | null; notes?: string | null;
    distance?: number; duration?: number; run_type?: string | null;
    elevation_gain?: number | null; elevation_loss?: number | null;
    avg_heart_rate?: number | null; max_heart_rate?: number | null;
    weather_temp?: number | null; weather_condition?: string | null;
    shoe_id?: string | null; pace_min_per_km?: number | null; pace_km_per_h?: number | null;
  }) {
    const { error } = await supabase.from('running_sessions').update(updates).eq('id', sessionId);
    if (error) throw error;
  },

  async getTotalDistance(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('running_sessions')
      .select('distance')
      .eq('user_id', userId);

    if (error) throw error;
    return (data ?? []).reduce((sum, s) => sum + s.distance, 0);
  },

  async getSessionsCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('running_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count ?? 0;
  },

  async getPersonalRecords(userId: string): Promise<Record<number, { duration: number; pace: number; date: string }>> {
    const recordDistances = [5, 10, 21.0975, 42.195];
    const records: Record<number, { duration: number; pace: number; date: string }> = {};

    const { data, error } = await supabase
      .from('running_sessions')
      .select('distance, duration, pace_min_per_km, date')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;

    for (const dist of recordDistances) {
      const sessions = (data ?? []).filter(s => Math.abs(s.distance - dist) < 0.5);
      if (sessions.length > 0) {
        const best = sessions.reduce((min, s) => s.duration < min.duration ? s : min);
        records[dist] = {
          duration: best.duration,
          pace: best.pace_min_per_km ?? 0,
          date: best.date,
        };
      }
    }

    return records;
  },

  // Chaussures
  async getShoes(userId: string): Promise<Shoe[]> {
    const { data, error } = await supabase
      .from('shoes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as Shoe[];
  },

  async createShoe(userId: string, brand: string | null, model: string, purchaseDate?: string): Promise<Shoe> {
    const { data, error } = await supabase
      .from('shoes')
      .insert({ user_id: userId, brand, model, purchase_date: purchaseDate ?? null })
      .select()
      .single();

    if (error) throw error;
    return data as Shoe;
  },

  async retireShoe(shoeId: string) {
    const { error } = await supabase.from('shoes').update({ is_active: false }).eq('id', shoeId);
    if (error) throw error;
  },
};
