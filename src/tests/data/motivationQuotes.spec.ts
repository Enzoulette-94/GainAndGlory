import { describe, it, expect } from 'vitest';
import { MOTIVATION_QUOTES, getDailyQuote } from '../../data/motivationQuotes';

describe('motivationQuotes', () => {
  it('contient exactement 365 citations', () => {
    expect(MOTIVATION_QUOTES).toHaveLength(365);
  });

  it('toutes les citations sont des chaînes non vides', () => {
    MOTIVATION_QUOTES.forEach((q, i) => {
      expect(typeof q, `citation ${i}`).toBe('string');
      expect(q.trim().length, `citation ${i} vide`).toBeGreaterThan(0);
    });
  });

  it('getDailyQuote() retourne une chaîne non vide', () => {
    const quote = getDailyQuote();
    expect(typeof quote).toBe('string');
    expect(quote.trim().length).toBeGreaterThan(0);
  });

  it('getDailyQuote() retourne une citation présente dans le tableau', () => {
    const quote = getDailyQuote();
    expect(MOTIVATION_QUOTES).toContain(quote);
  });
});
