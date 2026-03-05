import { LEVEL_TITLES } from './constants';
import type { LevelTitle } from '../types/enums';

// ============================================================
// XP ET NIVEAUX
// ============================================================

/** XP requis pour passer DU niveau N au niveau N+1 */
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(1.5, level - 2));
}

/** XP total cumulé pour atteindre le niveau N */
export function getTotalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXPForLevel(i + 1);
  }
  return total;
}

/** Calcule le niveau courant à partir du total XP */
export function getLevelFromXP(totalXP: number): number {
  let level = 1;
  let xpNeeded = 0;
  while (true) {
    const nextXP = getXPForLevel(level + 1);
    if (xpNeeded + nextXP > totalXP) break;
    xpNeeded += nextXP;
    level++;
  }
  return level;
}

/** Progression dans le niveau actuel (0-1) */
export function getLevelProgress(totalXP: number): { level: number; current: number; needed: number; progress: number } {
  const level = getLevelFromXP(totalXP);
  const xpAtCurrentLevel = getTotalXPForLevel(level);
  const xpNeeded = getXPForLevel(level + 1);
  const current = totalXP - xpAtCurrentLevel;
  return {
    level,
    current,
    needed: xpNeeded,
    progress: xpNeeded > 0 ? Math.min(current / xpNeeded, 1) : 1,
  };
}

/** Titre pour un niveau donné */
export function getLevelTitle(level: number): LevelTitle {
  for (const tier of LEVEL_TITLES) {
    if (level >= tier.min && level <= tier.max) {
      return tier.title as LevelTitle;
    }
  }
  return 'Élite';
}

/** Titre de statut LOTR/DBZ selon le niveau */
export function getStatusTitle(level: number): string {
  switch (level) {
    case 1:  return 'Hobbit du Comté';
    case 2:  return 'Rôdeur Débutant';
    case 3:  return 'Homme du Nord';
    case 4:  return 'Guerrier de Rohan';
    case 5:  return 'Rôdeur du Nord';
    case 6:  return 'Gardien de la Comté';
    case 7:  return 'Chevalier du Gondor';
    case 8:  return 'Capitaine des Rangers';
    case 9:  return "Héritier d'Isildur";
    case 10: return 'Roi du Gondor';
    case 11: return 'Guerrier Saiyan';
    case 12: return 'Saiyan Élite';
    case 13: return 'Guerrier Z';
    case 14: return 'Super Saiyan (Éveil)';
    case 15: return 'Super Saiyan';
    case 16: return 'Super Saiyan Ascendant';
    case 17: return 'Super Saiyan 2';
    case 18: return 'Super Saiyan 3';
    case 19: return 'Super Saiyan God';
    case 20: return 'Super Saiyan Blue';
    case 21: return 'Ultra Instinct (Omen)';
    case 22: return 'Ultra Instinct';
    case 23: return 'Ultra Instinct Maîtrisé';
    case 24: return 'Ultra Ego';
    case 25: return 'Fusion Ultime';
    case 26: return 'Ange en Formation';
    case 27: return 'Ange Guerrier';
    case 28: return 'Dieu de la Destruction (Apprenti)';
    case 29: return 'Dieu de la Destruction';
    case 30: return 'Zeno-Sama (Roi Suprême)';
    default:
      if (level >= 31 && level <= 40) return 'Entité Divine';
      if (level >= 41 && level <= 50) return 'Créateur des Univers';
      return 'Au-delà de la Puissance';
  }
}

/** Couleur hex du statut selon le palier de niveau */
export function getStatusColor(level: number): string {
  if (level <= 5)  return '#8b6f47';  // Bronze — LOTR débutant
  if (level <= 10) return '#c0c0c0';  // Argent — LOTR avancé
  if (level <= 15) return '#ffd700';  // Or — Saiyan
  if (level <= 20) return '#38bdf8';  // Bleu — Super Saiyan Blue
  if (level <= 25) return '#c084fc';  // Violet clair — Ultra Instinct
  if (level <= 30) return '#a855f7';  // Violet — Ange/Dieu
  return '#ef4444';                   // Rouge — Divin
}

// ============================================================
// COURSE À PIED
// ============================================================

/** Calcule l'allure en min/km depuis distance (km) et durée (secondes) */
export function calcPaceMinPerKm(distanceKm: number, durationSeconds: number): number {
  if (distanceKm <= 0) return 0;
  return durationSeconds / 60 / distanceKm;
}

/** Calcule la vitesse en km/h */
export function calcSpeedKmH(distanceKm: number, durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  return (distanceKm / durationSeconds) * 3600;
}

/** Formate une allure en min/km → "5:42 /km" */
export function formatPace(paceMinPerKm: number): string {
  if (!paceMinPerKm || paceMinPerKm <= 0) return '--:--';
  const minutes = Math.floor(paceMinPerKm);
  const seconds = Math.round((paceMinPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
}

/** Formate une durée en secondes → "1h 23min 45s" ou "23:45" */
export function formatDuration(seconds: number, compact = false): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (compact) {
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}min`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(' ');
}

/** Convertit HH:MM:SS en secondes */
export function timeStringToSeconds(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0];
}

/** Calcule la zone cardiaque */
export function getHeartRateZone(fcAvg: number, fcMax: number): string {
  const pct = (fcAvg / fcMax) * 100;
  if (pct < 60) return 'Z1';
  if (pct < 70) return 'Z2';
  if (pct < 80) return 'Z3';
  if (pct < 90) return 'Z4';
  return 'Z5';
}

// ============================================================
// MUSCULATION
// ============================================================

/** Calcule le tonnage total d'une séance (somme poids × reps) */
export function calcTonnage(sets: Array<{ weight: number; reps: number }>): number {
  return sets.reduce((total, set) => total + set.weight * set.reps, 0);
}

// ============================================================
// FORMATAGE GÉNÉRAL
// ============================================================

/** Formate un nombre avec séparateur de milliers */
export function formatNumber(n: number, decimals = 0): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Formate un poids en kg */
export function formatWeight(kg: number): string {
  return `${formatNumber(kg, kg % 1 !== 0 ? 1 : 0)} kg`;
}

/** Formate une distance en km */
export function formatDistance(km: number): string {
  return `${formatNumber(km, km < 10 ? 2 : 1)} km`;
}

/** Formate une date relative */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'à l\'instant';
  if (diffMinutes < 60) return `il y a ${diffMinutes}min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays < 7) return `il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR');
}

/** Formate une date */
export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', options ?? {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Calcule un compte à rebours */
export function getCountdown(targetDate: string): { days: number; hours: number; minutes: number; total: number } {
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, total: 0 };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, total: diff };
}

/** Saison selon la date */
export function getSeason(date: Date): 'printemps' | 'été' | 'automne' | 'hiver' {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'printemps';
  if (month >= 6 && month <= 8) return 'été';
  if (month >= 9 && month <= 11) return 'automne';
  return 'hiver';
}

/** Début de la semaine (lundi) */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Fin de la semaine (dimanche) */
export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}
