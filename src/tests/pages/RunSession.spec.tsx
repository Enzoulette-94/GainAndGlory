import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    profile: { id: 'user-1', username: 'Enzoulette', running_level: 1, running_xp: 0 },
    loading: false,
    refreshProfile: vi.fn(),
  }),
}));

vi.mock('../../services/running.service', () => ({
  runningService: {
    createSession: vi.fn().mockResolvedValue({ id: 's-1', distance: 10, duration: 3000 }),
    getShoes: vi.fn().mockResolvedValue([
      { id: 'shoe-1', brand: 'Nike', model: 'Pegasus', is_active: true, total_km: 50 },
    ]),
  },
}));

vi.mock('../../services/xp.service', () => ({
  xpService: {
    awardXP: vi.fn().mockResolvedValue({ xpGained: 75, newLevel: 1, oldLevel: 1, leveledUp: false }),
  },
}));

vi.mock('../../services/feed.service', () => ({
  feedService: {
    publishRun: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../services/profile-records.service', () => ({
  profileRecordsService: {
    upsertRecord: vi.fn().mockResolvedValue(undefined),
  },
}));

let RunSessionPage: any;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('../../pages/RunSession');
  RunSessionPage = mod.RunSessionPage;
});

const q = (pattern: RegExp) =>
  waitFor(() => expect(screen.queryAllByText(pattern).length).toBeGreaterThan(0), { timeout: 3000 });

const renderRunSession = () => render(<MemoryRouter><RunSessionPage /></MemoryRouter>);

describe('RunSessionPage', () => {
  describe('Rendu initial', () => {
    it('se monte sans crash', () => {
      expect(() => renderRunSession()).not.toThrow();
    });

    it('affiche un titre ou label lié à la course', async () => {
      renderRunSession();
      await q(/course|sortie|running/i);
    });

    it('affiche un champ de distance', async () => {
      renderRunSession();
      await waitFor(() => {
        const inputs = document.querySelectorAll('input');
        expect(inputs.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('affiche un champ de date', async () => {
      renderRunSession();
      await waitFor(() => {
        const dateInputs = document.querySelectorAll('input[type="datetime-local"], input[type="date"]');
        expect(dateInputs.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('affiche des boutons d\'action', async () => {
      renderRunSession();
      await waitFor(() => {
        expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Types de course', () => {
    it('affiche les options de type de course', async () => {
      renderRunSession();
      await q(/endurance|tempo|fractionné|trail/i);
    });
  });

  describe('Chaussures', () => {
    it('appelle runningService.getShoes au chargement', async () => {
      const { runningService } = await import('../../services/running.service');
      renderRunSession();
      await waitFor(() => {
        expect(runningService.getShoes).toHaveBeenCalled();
      }, { timeout: 3000 });
    });
  });

  describe('Services mockés', () => {
    it('runningService.createSession est défini', async () => {
      const { runningService } = await import('../../services/running.service');
      expect(typeof runningService.createSession).toBe('function');
    });

    it('profileRecordsService.upsertRecord est défini', async () => {
      const { profileRecordsService } = await import('../../services/profile-records.service');
      expect(typeof profileRecordsService.upsertRecord).toBe('function');
    });
  });
});
