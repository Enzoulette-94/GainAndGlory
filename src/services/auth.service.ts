import { supabase } from '../lib/supabase-client';

export const authService = {
  async signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw error;
    if (!data.user) throw new Error('Erreur lors de la création du compte');

    // Créer le profil (le trigger le fait aussi en fallback)
    await supabase.from('profiles').upsert({
      id: data.user.id,
      username,
    }, { onConflict: 'id' });

    // Créer les préférences de notifications
    await supabase.from('notification_preferences').insert({
      user_id: data.user.id,
      flash_challenge: true,
      record_beaten: true,
      badge_unlocked: true,
      level_up: true,
      event_created: true,
      likes: true,
      comments: true,
    });

    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },
};
