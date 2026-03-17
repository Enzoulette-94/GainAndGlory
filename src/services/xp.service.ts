import { supabase } from '../lib/supabase-client';
import { profileService } from './profile.service';
import { getLevelFromXP, getStatusTitle } from '../utils/calculations';
import { XP_REWARDS } from '../utils/constants';

interface XPResult {
  xpGained: number;
  newLevel?: number;
  oldLevel?: number;
  leveledUp: boolean;
}

// Helper pour bypasser le typage strict Supabase sur les tables
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const xpService = {
  async awardXP(
    userId: string,
    action: keyof typeof XP_REWARDS,
    discipline?: 'musculation' | 'running' | 'calisthenics' | 'crossfit'
  ): Promise<XPResult> {
    const xp = XP_REWARDS[action];
    const profile = await profileService.getProfile(userId);
    const oldLevel = profile.global_level;

    const newProfile = await profileService.addXP(userId, xp, discipline);
    const newLevel = getLevelFromXP(newProfile.total_xp);

    const updates: Record<string, number> = { global_level: newLevel };

    if (discipline === 'musculation') {
      updates.musculation_level = getLevelFromXP(newProfile.musculation_xp);
    } else if (discipline === 'running') {
      updates.running_level = getLevelFromXP(newProfile.running_xp);
    } else if (discipline === 'calisthenics') {
      updates.calisthenics_level = getLevelFromXP(newProfile.calisthenics_xp ?? 0);
    } else if (discipline === 'crossfit') {
      updates.crossfit_level = getLevelFromXP(newProfile.crossfit_xp ?? 0);
    }

    if (newLevel !== oldLevel || discipline) {
      await profileService.updateProfile(userId, updates);
    }

    const leveledUp = newLevel > oldLevel;

    if (leveledUp) {
      try {
        await db.from('activity_feed').insert({
          user_id: userId,
          type: 'level_up',
          content: {
            type: 'level_up',
            level: newLevel,
            discipline: 'global',
            title: newProfile.username,
          },
        });
      } catch { /* ignore */ }

      try {
        await db.from('notifications').insert({
          user_id: userId,
          type: 'level_up',
          content: {
            message: `🎉 Niveau ${newLevel} atteint ! Statut débloqué : ${getStatusTitle(newLevel)}`,
            level: newLevel,
            discipline: 'global',
          },
        });
      } catch { /* ignore */ }
    }

    return { xpGained: xp, newLevel, oldLevel, leveledUp };
  },
};
