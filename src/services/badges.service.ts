import { supabase } from '../lib/supabase-client';
import { profileService } from './profile.service';
import type { Badge, UserBadge } from '../types/models';

export const badgesService = {
  async getAllBadges(): Promise<Badge[]> {
    const { data, error } = await supabase.from('badges').select('*').order('category');
    if (error) throw error;
    return (data ?? []) as Badge[];
  },

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    const { data, error } = await supabase
      .from('user_badges')
      .select('*, badge:badges(*)')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as UserBadge[];
  },

  async hasBadge(userId: string, badgeCode: string): Promise<boolean> {
    const { data } = await supabase
      .from('user_badges')
      .select('user_badges.id')
      .eq('user_id', userId)
      .eq('badges.code', badgeCode);
    return (data?.length ?? 0) > 0;
  },

  async unlockBadge(userId: string, badgeCode: string): Promise<UserBadge | null> {
    // Trouver le badge
    const { data: badge } = await supabase
      .from('badges')
      .select('*')
      .eq('code', badgeCode)
      .single();

    if (!badge) return null;

    // Vérifier s'il est déjà débloqué
    const { data: existing } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_id', badge.id)
      .maybeSingle();

    if (existing) return null; // Déjà débloqué

    // Débloquer
    const { data, error } = await supabase
      .from('user_badges')
      .insert({ user_id: userId, badge_id: badge.id })
      .select('*, badge:badges(*)')
      .single();

    if (error) throw error;

    // Award XP for badge rarity
    try {
      const xpRewards: Record<string, number> = { common: 50, uncommon: 50, rare: 250, epic: 250, legendary: 500 };
      const xp = xpRewards[badge.rarity ?? 'common'] ?? 50;
      await profileService.addXP(userId, xp);
    } catch { /* ignore */ }

    // Publier dans le feed
    try {
      await supabase.from('activity_feed').insert({
        user_id: userId,
        type: 'badge',
        content: {
          type: 'badge',
          badge_code: badge.code,
          badge_name: badge.name,
          badge_rarity: badge.rarity,
        },
      });
    } catch { /* ignore */ }

    try {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'badge_unlocked',
        content: {
          message: `🏅 Badge débloqué : ${badge.name}`,
          badge_code: badge.code,
          badge_name: badge.name,
        },
      });
    } catch { /* ignore */ }

    return data as UserBadge;
  },

  async checkAndUnlockBadges(userId: string, context: BadgeCheckContext): Promise<UserBadge[]> {
    const unlocked: UserBadge[] = [];
    const checks = getBadgeChecks(context);

    for (const [code, condition] of Object.entries(checks)) {
      if (condition) {
        const result = await this.unlockBadge(userId, code);
        if (result) unlocked.push(result);
      }
    }

    return unlocked;
  },
};

export interface BadgeCheckContext {
  totalSessions?: number;
  globalLevel?: number;
  musculationLevel?: number;
  runningLevel?: number;
  currentStreak?: number;
  totalKm?: number;
  totalTonnage?: number;
  completedPersonalGoals?: number;
  completedCommunityGoals?: number;
  completedFlashGoals?: number;
  personalRecordsCount?: number;
  weightLost?: number;
  weightGained?: number;
  likesGiven?: number;
  commentsGiven?: number;
  sessionDate?: Date;
  inactivityDays?: number;
  runTypes?: string[];
  differentExercises?: number;
  feedbacksUsed?: string[];
  rainyRuns?: number;
  coldRuns?: number;
  sameDay?: { musculation: boolean; running: boolean; weight: boolean };
  weekPRs?: number;
  singleSessionTonnage?: number;
  totalBadges?: number;
  exactXP?: number;
  seasonsActive?: string[];
}

function getBadgeChecks(ctx: BadgeCheckContext): Record<string, boolean> {
  const checks: Record<string, boolean> = {};

  if (ctx.globalLevel !== undefined) {
    checks['bronze_level'] = ctx.globalLevel >= 5;
    checks['silver_level'] = ctx.globalLevel >= 10;
    checks['gold_level'] = ctx.globalLevel >= 15;
    checks['platinum_level'] = ctx.globalLevel >= 20;
    checks['diamond_level'] = ctx.globalLevel >= 25;
  }

  if (ctx.runningLevel !== undefined) checks['runner_badge'] = ctx.runningLevel >= 10;
  if (ctx.musculationLevel !== undefined) checks['lifter_badge'] = ctx.musculationLevel >= 10;

  if (ctx.currentStreak !== undefined) {
    checks['week_streak'] = ctx.currentStreak >= 7;
    checks['month_streak'] = ctx.currentStreak >= 30;
    checks['hundred_days'] = ctx.currentStreak >= 100;
    checks['year_streak'] = ctx.currentStreak >= 365;
    checks['indestructible'] = ctx.currentStreak >= 100;
    checks['resolution_keeper'] = ctx.currentStreak >= 365;
  }

  if (ctx.totalSessions !== undefined) {
    checks['ten_sessions'] = ctx.totalSessions >= 10;
    checks['fifty_sessions'] = ctx.totalSessions >= 50;
    checks['hundred_sessions'] = ctx.totalSessions >= 100;
    checks['five_hundred_sessions'] = ctx.totalSessions >= 500;
    checks['thousand_sessions'] = ctx.totalSessions >= 1000;
  }

  if (ctx.totalKm !== undefined) {
    checks['hundred_km'] = ctx.totalKm >= 100;
    checks['five_hundred_km'] = ctx.totalKm >= 500;
    checks['thousand_km'] = ctx.totalKm >= 1000;
  }

  if (ctx.totalTonnage !== undefined) {
    checks['thousand_kg'] = ctx.totalTonnage >= 1000;
    checks['five_thousand_kg'] = ctx.totalTonnage >= 5000;
    checks['ten_thousand_kg'] = ctx.totalTonnage >= 10000;
  }

  if (ctx.completedPersonalGoals !== undefined) {
    checks['first_goal'] = ctx.completedPersonalGoals >= 1;
    checks['ten_goals'] = ctx.completedPersonalGoals >= 10;
    checks['fifty_goals'] = ctx.completedPersonalGoals >= 50;
    checks['hundred_goals'] = ctx.completedPersonalGoals >= 100;
  }

  if (ctx.completedCommunityGoals !== undefined) {
    checks['challenge_contributor'] = ctx.completedCommunityGoals >= 1;
    checks['challenge_mvp'] = ctx.completedCommunityGoals >= 10;
  }

  if (ctx.completedFlashGoals !== undefined) checks['speedster'] = ctx.completedFlashGoals >= 1;
  if (ctx.personalRecordsCount !== undefined) {
    checks['first_pr'] = ctx.personalRecordsCount >= 1;
    checks['ten_prs'] = ctx.personalRecordsCount >= 10;
    checks['fifty_prs'] = ctx.personalRecordsCount >= 50;
  }

  if (ctx.weightLost !== undefined) {
    checks['minus_5kg'] = ctx.weightLost >= 5;
    checks['minus_10kg'] = ctx.weightLost >= 10;
    checks['minus_20kg'] = ctx.weightLost >= 20;
    checks['transformer_badge'] = ctx.weightLost >= 10;
  }
  if (ctx.weightGained !== undefined) {
    checks['plus_5kg_muscle'] = ctx.weightGained >= 5;
    checks['plus_10kg_muscle'] = ctx.weightGained >= 10;
    checks['transformer_badge'] = (checks['transformer_badge'] ?? false) || ctx.weightGained >= 10;
  }

  if (ctx.likesGiven !== undefined) checks['social_athlete'] = ctx.likesGiven >= 50;
  if (ctx.commentsGiven !== undefined) {
    checks['team_player'] = ctx.commentsGiven >= 50;
    checks['active_commenter'] = ctx.commentsGiven >= 100;
  }

  if (ctx.sessionDate) {
    const d = ctx.sessionDate;
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hour = d.getHours();

    checks['new_year_athlete'] = month === 1 && day === 1;
    checks['valentine_solo'] = month === 2 && day === 14;
    checks['triple_seven'] = month === 7 && day === 7 && hour === 7;
  }

  if (ctx.inactivityDays !== undefined && ctx.inactivityDays >= 30) checks['phoenix'] = true;
  if (ctx.runTypes) checks['explorer'] = new Set(ctx.runTypes).size >= 3;
  if (ctx.differentExercises !== undefined) checks['polyvalent'] = ctx.differentExercises >= 10;
  if (ctx.feedbacksUsed) checks['rainbow'] = new Set(ctx.feedbacksUsed).size >= 3;
  if (ctx.rainyRuns !== undefined) checks['rainy_warrior'] = ctx.rainyRuns >= 5;
  if (ctx.coldRuns !== undefined) checks['winter_warrior'] = ctx.coldRuns >= 10;

  if (ctx.sameDay) {
    checks['double_trouble'] = ctx.sameDay.musculation && ctx.sameDay.running;
    checks['triple_threat'] = ctx.sameDay.musculation && ctx.sameDay.running && ctx.sameDay.weight;
  }

  if (ctx.weekPRs !== undefined) checks['speedster_week'] = ctx.weekPRs >= 3;
  if (ctx.singleSessionTonnage !== undefined) checks['titan'] = ctx.singleSessionTonnage >= 10000;
  if (ctx.totalBadges !== undefined) checks['mad_collector'] = ctx.totalBadges >= 50;
  if (ctx.exactXP !== undefined) checks['leet'] = ctx.exactXP === 1337;
  if (ctx.seasonsActive) checks['four_seasons'] = new Set(ctx.seasonsActive).size >= 4;

  return checks;
}
