import { describe, it, expect } from 'vitest';
import {
  getXPForLevel,
  getTotalXPForLevel,
  getLevelFromXP,
  getLevelProgress,
  getLevelTitle,
  getStatusTitle,
  getStatusColor,
  calcPaceMinPerKm,
  calcSpeedKmH,
  formatPace,
  formatDuration,
  timeStringToSeconds,
  getHeartRateZone,
  calcTonnage,
  formatNumber,
  formatWeight,
  formatDistance,
  formatRelativeTime,
  getCountdown,
  getSeason,
  getWeekStart,
  getWeekEnd,
} from '../../utils/calculations';

// ============================================================
// XP & NIVEAUX
// ============================================================

describe('getXPForLevel', () => {
  it('retourne 0 pour le niveau 1 (pas de coût pour atteindre lvl 1)', () => {
    expect(getXPForLevel(1)).toBe(0);
  });

  it('retourne 100 XP pour passer du niveau 1 au niveau 2', () => {
    expect(getXPForLevel(2)).toBe(100);
  });

  it('retourne 150 XP pour passer du niveau 2 au niveau 3', () => {
    expect(getXPForLevel(3)).toBe(150);
  });

  it('augmente exponentiellement (facteur ×1.5) jusqu\'au niveau 15', () => {
    const lvl2 = getXPForLevel(2); // 100
    const lvl3 = getXPForLevel(3); // 150
    const lvl4 = getXPForLevel(4); // 225
    expect(lvl3 / lvl2).toBeCloseTo(1.5);
    expect(lvl4 / lvl3).toBeCloseTo(1.5);
  });

  it('est plafonné à 700 XP à partir du niveau 15', () => {
    expect(getXPForLevel(15)).toBe(700);
    expect(getXPForLevel(16)).toBe(700);
    expect(getXPForLevel(20)).toBe(700);
    expect(getXPForLevel(30)).toBe(700);
  });

  it('retourne un entier (floor appliqué)', () => {
    expect(Number.isInteger(getXPForLevel(5))).toBe(true);
    expect(Number.isInteger(getXPForLevel(10))).toBe(true);
  });
});

describe('getTotalXPForLevel', () => {
  it('retourne 0 XP pour atteindre le niveau 1', () => {
    expect(getTotalXPForLevel(1)).toBe(0);
  });

  it('retourne 100 XP pour atteindre le niveau 2', () => {
    expect(getTotalXPForLevel(2)).toBe(100);
  });

  it('retourne 250 XP pour atteindre le niveau 3', () => {
    expect(getTotalXPForLevel(3)).toBe(250); // 100 + 150
  });

  it('est strictement croissant', () => {
    for (let i = 2; i <= 10; i++) {
      expect(getTotalXPForLevel(i)).toBeGreaterThan(getTotalXPForLevel(i - 1));
    }
  });
});

describe('getLevelFromXP', () => {
  it('retourne le niveau 1 pour 0 XP', () => {
    expect(getLevelFromXP(0)).toBe(1);
  });

  it('retourne le niveau 1 pour 99 XP (pas encore au niveau 2)', () => {
    expect(getLevelFromXP(99)).toBe(1);
  });

  it('retourne le niveau 2 pour exactement 100 XP', () => {
    expect(getLevelFromXP(100)).toBe(2);
  });

  it('retourne le niveau 2 pour 249 XP (pas encore au niveau 3)', () => {
    expect(getLevelFromXP(249)).toBe(2);
  });

  it('retourne le niveau 3 pour exactement 250 XP', () => {
    expect(getLevelFromXP(250)).toBe(3);
  });

  it('est cohérent avec getTotalXPForLevel', () => {
    for (let lvl = 1; lvl <= 10; lvl++) {
      expect(getLevelFromXP(getTotalXPForLevel(lvl))).toBe(lvl);
    }
  });
});

describe('getLevelProgress', () => {
  it('retourne niveau 1, current=0 pour 0 XP', () => {
    const result = getLevelProgress(0);
    expect(result.level).toBe(1);
    expect(result.current).toBe(0);
  });

  it('calcule la progression correctement au niveau 1 (50/100 XP → 50%)', () => {
    const result = getLevelProgress(50);
    expect(result.level).toBe(1);
    expect(result.current).toBe(50);
    expect(result.needed).toBe(100);
    expect(result.progress).toBeCloseTo(0.5);
  });

  it('retourne progress=0 au début d\'un nouveau niveau', () => {
    const result = getLevelProgress(100); // exactement niveau 2
    expect(result.level).toBe(2);
    expect(result.current).toBe(0);
    expect(result.progress).toBe(0);
  });

  it('la progression ne dépasse pas 1 (100%)', () => {
    const result = getLevelProgress(getTotalXPForLevel(5) - 1);
    expect(result.progress).toBeLessThanOrEqual(1);
  });
});

describe('getLevelTitle', () => {
  it('retourne "Débutant" pour les premiers niveaux', () => {
    expect(getLevelTitle(1)).toBe('Débutant');
    expect(getLevelTitle(2)).toBe('Débutant');
  });

  it('retourne une string non vide pour tout niveau de 1 à 30', () => {
    for (let i = 1; i <= 30; i++) {
      expect(getLevelTitle(i)).toBeTruthy();
    }
  });
});

describe('getStatusTitle', () => {
  it('retourne "Hobbit du Comté" au niveau 1', () => {
    expect(getStatusTitle(1)).toBe('Hobbit du Comté');
  });

  it('retourne "Roi du Gondor" au niveau 10', () => {
    expect(getStatusTitle(10)).toBe('Roi du Gondor');
  });

  it('retourne "Guerrier Saiyan" au niveau 11', () => {
    expect(getStatusTitle(11)).toBe('Guerrier Saiyan');
  });

  it('retourne "Zeno-Sama (Roi Suprême)" au niveau 30', () => {
    expect(getStatusTitle(30)).toBe('Zeno-Sama (Roi Suprême)');
  });

  it('retourne "Entité Divine" pour les niveaux 31–40', () => {
    expect(getStatusTitle(35)).toBe('Entité Divine');
    expect(getStatusTitle(40)).toBe('Entité Divine');
  });

  it('retourne "Créateur des Univers" pour les niveaux 41–50', () => {
    expect(getStatusTitle(45)).toBe('Créateur des Univers');
  });

  it('couvre tous les niveaux de 1 à 30 (aucune valeur undefined)', () => {
    for (let i = 1; i <= 30; i++) {
      expect(getStatusTitle(i)).toBeTruthy();
    }
  });
});

describe('getStatusColor', () => {
  it('retourne Bronze (#8b6f47) pour les niveaux 1–5', () => {
    expect(getStatusColor(1)).toBe('#8b6f47');
    expect(getStatusColor(5)).toBe('#8b6f47');
  });

  it('retourne Argent (#c0c0c0) pour les niveaux 6–10', () => {
    expect(getStatusColor(6)).toBe('#c0c0c0');
    expect(getStatusColor(10)).toBe('#c0c0c0');
  });

  it('retourne Or (#ffd700) pour les niveaux 11–15', () => {
    expect(getStatusColor(11)).toBe('#ffd700');
  });

  it('retourne Bleu (#38bdf8) pour les niveaux 16–20', () => {
    expect(getStatusColor(16)).toBe('#38bdf8');
    expect(getStatusColor(20)).toBe('#38bdf8');
  });

  it('retourne Violet clair (#c084fc) pour les niveaux 21–25', () => {
    expect(getStatusColor(21)).toBe('#c084fc');
  });

  it('retourne Violet (#a855f7) pour les niveaux 26–30', () => {
    expect(getStatusColor(26)).toBe('#a855f7');
  });

  it('retourne Rouge (#ef4444) pour les niveaux > 30', () => {
    expect(getStatusColor(31)).toBe('#ef4444');
    expect(getStatusColor(50)).toBe('#ef4444');
  });
});

// ============================================================
// COURSE À PIED
// ============================================================

describe('calcPaceMinPerKm', () => {
  it('calcule correctement l\'allure pour 10 km en 50 minutes (5 min/km)', () => {
    expect(calcPaceMinPerKm(10, 3000)).toBeCloseTo(5.0);
  });

  it('calcule correctement pour 5 km en 25 minutes (5 min/km)', () => {
    expect(calcPaceMinPerKm(5, 1500)).toBeCloseTo(5.0);
  });

  it('retourne 0 si la distance est 0', () => {
    expect(calcPaceMinPerKm(0, 3600)).toBe(0);
  });

  it('retourne une valeur positive pour des inputs valides', () => {
    expect(calcPaceMinPerKm(10, 3600)).toBeGreaterThan(0);
  });
});

describe('calcSpeedKmH', () => {
  it('calcule 10 km/h pour 10 km en 3600s (1h)', () => {
    expect(calcSpeedKmH(10, 3600)).toBeCloseTo(10);
  });

  it('calcule 12 km/h pour 10 km en 3000s (50min)', () => {
    expect(calcSpeedKmH(10, 3000)).toBeCloseTo(12);
  });

  it('retourne 0 si la durée est 0', () => {
    expect(calcSpeedKmH(10, 0)).toBe(0);
  });
});

describe('formatPace', () => {
  it('formate 5.0 min/km → "5:00 /km"', () => {
    expect(formatPace(5.0)).toBe('5:00 /km');
  });

  it('formate 5.5 min/km → "5:30 /km"', () => {
    expect(formatPace(5.5)).toBe('5:30 /km');
  });

  it('formate 4.75 min/km → "4:45 /km"', () => {
    expect(formatPace(4.75)).toBe('4:45 /km');
  });

  it('retourne "--:--" pour une allure de 0', () => {
    expect(formatPace(0)).toBe('--:--');
  });

  it('retourne "--:--" pour une allure négative', () => {
    expect(formatPace(-1)).toBe('--:--');
  });

  it('pad les secondes avec un zéro si < 10', () => {
    expect(formatPace(5.1)).toMatch(/5:0\d /);
  });
});

describe('formatDuration', () => {
  it('formate 90 secondes → "1min 30s"', () => {
    expect(formatDuration(90)).toBe('1min 30s');
  });

  it('formate 3600 secondes → "1h"', () => {
    expect(formatDuration(3600)).toBe('1h');
  });

  it('formate 3661 secondes → "1h 1min 1s"', () => {
    expect(formatDuration(3661)).toBe('1h 1min 1s');
  });

  it('formate 0 secondes → "0s"', () => {
    expect(formatDuration(0)).toBe('0s');
  });

  it('mode compact : formate 90s → "1:30"', () => {
    expect(formatDuration(90, true)).toBe('1:30');
  });

  it('mode compact : formate 3661s → "1:01:01"', () => {
    expect(formatDuration(3661, true)).toBe('1:01:01');
  });

  it('mode compact : formate 8100s → "2:15:00" (2h15)', () => {
    expect(formatDuration(8100, true)).toBe('2:15:00');
  });

  it('mode compact : formate 3120s → "52:00" (52 minutes)', () => {
    expect(formatDuration(3120, true)).toBe('52:00');
  });

  it('mode compact : formate 3600s → "1:00:00" (1 heure)', () => {
    expect(formatDuration(3600, true)).toBe('1:00:00');
  });

  it('mode compact : formate 6720s → "1:52:00" (1h52)', () => {
    expect(formatDuration(6720, true)).toBe('1:52:00');
  });
});

describe('timeStringToSeconds', () => {
  it('convertit "1:00:00" → 3600', () => {
    expect(timeStringToSeconds('1:00:00')).toBe(3600);
  });

  it('convertit "0:05:30" → 330', () => {
    expect(timeStringToSeconds('0:05:30')).toBe(330);
  });

  it('convertit "5:30" (MM:SS) → 330', () => {
    expect(timeStringToSeconds('5:30')).toBe(330);
  });
});

describe('getHeartRateZone', () => {
  it('retourne Z1 pour < 60% FC max', () => {
    expect(getHeartRateZone(110, 200)).toBe('Z1'); // 55%
  });

  it('retourne Z2 pour 60–69% FC max', () => {
    expect(getHeartRateZone(130, 200)).toBe('Z2'); // 65%
  });

  it('retourne Z3 pour 70–79% FC max', () => {
    expect(getHeartRateZone(150, 200)).toBe('Z3'); // 75%
  });

  it('retourne Z4 pour 80–89% FC max', () => {
    expect(getHeartRateZone(170, 200)).toBe('Z4'); // 85%
  });

  it('retourne Z5 pour >= 90% FC max', () => {
    expect(getHeartRateZone(185, 200)).toBe('Z5'); // 92.5%
  });
});

// ============================================================
// MUSCULATION
// ============================================================

describe('calcTonnage', () => {
  it('calcule correctement le tonnage total', () => {
    const sets = [
      { weight: 100, reps: 5 },
      { weight: 80, reps: 8 },
      { weight: 60, reps: 10 },
    ];
    expect(calcTonnage(sets)).toBe(500 + 640 + 600); // 1740
  });

  it('retourne 0 pour une liste vide', () => {
    expect(calcTonnage([])).toBe(0);
  });

  it('retourne 0 si toutes les reps sont à 0', () => {
    expect(calcTonnage([{ weight: 100, reps: 0 }])).toBe(0);
  });

  it('gère les poids décimaux', () => {
    expect(calcTonnage([{ weight: 22.5, reps: 4 }])).toBeCloseTo(90);
  });
});

// ============================================================
// FORMATAGE GÉNÉRAL
// ============================================================

describe('formatNumber', () => {
  it('formate 1000 avec séparateur de milliers français', () => {
    expect(formatNumber(1000)).toMatch(/1[.\s\u00a0]000/); // 1 000 ou 1.000
  });

  it('formate 1234567 correctement', () => {
    expect(formatNumber(1234567)).toBeTruthy();
  });

  it('retourne des décimales si spécifié', () => {
    expect(formatNumber(3.14159, 2)).toContain('3');
  });
});

describe('formatWeight', () => {
  it('formate 75 kg → "75 kg"', () => {
    expect(formatWeight(75)).toBe('75 kg');
  });

  it('formate 75.5 kg avec décimale', () => {
    expect(formatWeight(75.5)).toContain('75');
    expect(formatWeight(75.5)).toContain('kg');
  });
});

describe('formatDistance', () => {
  it('formate 10 km → "10,0 km" (ou "10.0 km")', () => {
    const result = formatDistance(10);
    expect(result).toContain('km');
    expect(result).toContain('10');
  });

  it('formate 5.5 km avec décimales', () => {
    const result = formatDistance(5.5);
    expect(result).toContain('km');
  });
});

describe('formatRelativeTime', () => {
  it('retourne "à l\'instant" pour < 1 minute', () => {
    const date = new Date(Date.now() - 30 * 1000).toISOString();
    expect(formatRelativeTime(date)).toBe("à l'instant");
  });

  it('retourne "il y a Xmin" pour < 1 heure', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(date)).toBe('il y a 5min');
  });

  it('retourne "il y a Xh" pour < 24 heures', () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(date)).toBe('il y a 3h');
  });

  it('retourne "il y a Xj" pour < 7 jours', () => {
    const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(date)).toBe('il y a 2j');
  });

  it('retourne une date formatée pour > 7 jours', () => {
    const date = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const result = formatRelativeTime(date);
    expect(result).not.toContain('il y a');
  });
});

describe('getCountdown', () => {
  it('retourne total=0 pour une date passée', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    expect(getCountdown(past).total).toBe(0);
  });

  it('retourne des valeurs positives pour une date future', () => {
    const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const result = getCountdown(future);
    expect(result.days).toBeGreaterThanOrEqual(1);
    expect(result.total).toBeGreaterThan(0);
  });
});

describe('getSeason', () => {
  it('retourne "printemps" pour mars–mai', () => {
    expect(getSeason(new Date('2025-03-15'))).toBe('printemps');
    expect(getSeason(new Date('2025-05-31'))).toBe('printemps');
  });

  it('retourne "été" pour juin–août', () => {
    expect(getSeason(new Date('2025-07-14'))).toBe('été');
  });

  it('retourne "automne" pour septembre–novembre', () => {
    expect(getSeason(new Date('2025-10-01'))).toBe('automne');
  });

  it('retourne "hiver" pour décembre–février', () => {
    expect(getSeason(new Date('2025-01-01'))).toBe('hiver');
    expect(getSeason(new Date('2025-12-25'))).toBe('hiver');
  });
});

describe('getWeekStart', () => {
  it('retourne le lundi de la semaine courante', () => {
    const wednesday = new Date('2025-03-05'); // mercredi
    const monday = getWeekStart(wednesday);
    expect(monday.getDay()).toBe(1); // 1 = lundi
    expect(monday.getDate()).toBe(3); // 3 mars
  });

  it('retourne le même lundi si on part d\'un lundi', () => {
    const monday = new Date('2025-03-03');
    expect(getWeekStart(monday).getDate()).toBe(3);
  });
});

describe('getWeekEnd', () => {
  it('retourne le dimanche de la semaine', () => {
    const wednesday = new Date('2025-03-05');
    const sunday = getWeekEnd(wednesday);
    expect(sunday.getDay()).toBe(0); // 0 = dimanche
  });

  it('la fin de semaine est après le début de semaine', () => {
    const d = new Date('2025-03-05');
    expect(getWeekEnd(d).getTime()).toBeGreaterThan(getWeekStart(d).getTime());
  });
});
