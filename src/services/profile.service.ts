import { supabase } from '../lib/supabase-client';
import type { Profile } from '../types/models';

export const profileService = {
  async getProfile(userId: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data as Profile;
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data as Profile;
  },

  async isUsernameTaken(username: string, excludeUserId?: string): Promise<boolean> {
    let query = supabase
      .from('profiles')
      .select('id')
      .eq('username', username);
    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }
    const { data } = await query;
    return (data?.length ?? 0) > 0;
  },

  async addXP(userId: string, xp: number, discipline?: 'musculation' | 'running' | 'calisthenics') {
    const profile = await this.getProfile(userId);
    const updates: Partial<Profile> = {
      total_xp: profile.total_xp + xp,
    };

    if (discipline === 'musculation') {
      updates.musculation_xp = profile.musculation_xp + xp;
    } else if (discipline === 'running') {
      updates.running_xp = profile.running_xp + xp;
    } else if (discipline === 'calisthenics') {
      updates.calisthenics_xp = (profile.calisthenics_xp ?? 0) + xp;
    }

    return this.updateProfile(userId, updates);
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop();
    const path = `${userId}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;
    await this.updateProfile(userId, { avatar_url: avatarUrl });
    return avatarUrl;
  },

  async updateStreak(userId: string) {
    const profile = await this.getProfile(userId);
    const today = new Date().toISOString().split('T')[0];
    const lastActivity = profile.last_activity_date;

    let newStreak = profile.current_streak;

    if (!lastActivity) {
      newStreak = 1;
    } else {
      const lastDate = new Date(lastActivity);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Déjà compté aujourd'hui
        return profile;
      } else if (diffDays === 1) {
        // Jour consécutif
        newStreak = profile.current_streak + 1;
      } else {
        // Streak cassé
        newStreak = 1;
      }
    }

    const longestStreak = Math.max(newStreak, profile.longest_streak);

    return this.updateProfile(userId, {
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_activity_date: today,
    });
  },
};
