import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    profile: { id: 'user-1', username: 'Test', calisthenics_level: 1, calisthenics_xp: 0 },
    loading: false,
  }),
}));

vi.mock('../../services/calisthenics.service', () => ({
  calisthenicsService: {
    getUnlockedSkills: vi.fn().mockResolvedValue([]),
    createSession: vi.fn().mockResolvedValue({ id: 's-1' }),
  },
}));

vi.mock('../../services/xp.service', () => ({
  xpService: {
    awardXP: vi.fn().mockResolvedValue({ xpGained: 50, newLevel: 1, oldLevel: 1, leveledUp: false }),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual as object, useNavigate: () => vi.fn() };
});

let CalisthenicsSessionPage: any;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('../../pages/CalisthenicsSession');
  CalisthenicsSessionPage = mod.CalisthenicsSessionPage;
});

const q = (pattern: RegExp) =>
  waitFor(() => expect(screen.queryAllByText(pattern).length).toBeGreaterThan(0), { timeout: 3000 });

const renderPage = () => render(<MemoryRouter><CalisthenicsSessionPage /></MemoryRouter>);

describe('CalisthenicsSessionPage', () => {
  describe('Rendu initial', () => {
    it('affiche le titre "Nouvelle séance"', async () => {
      renderPage();
      await q(/nouvelle séance/i);
    });

    it('affiche le sous-titre "Calisthénie"', async () => {
      renderPage();
      await q(/calisthénie/i);
    });

    it('affiche les champs nom et date', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.queryAllByText(/nom/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/date/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('affiche le bouton "Ajouter un exercice"', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.queryAllByText(/ajouter/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('affiche les boutons de feedback', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.queryAllByText(/facile/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/difficile/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/mort/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('affiche les boutons Annuler et Enregistrer', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.queryAllByText(/annuler/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/enregistrer/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Section Notes', () => {
    it('affiche le champ notes', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.queryAllByText(/notes/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });
});
