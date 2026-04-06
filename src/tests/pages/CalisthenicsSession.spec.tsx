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
    getSessionsCount: vi.fn().mockResolvedValue(3),
  },
}));

vi.mock('../../services/xp.service', () => ({
  xpService: {
    awardXP: vi.fn().mockResolvedValue({ xpGained: 50, newLevel: 1, oldLevel: 1, leveledUp: false }),
  },
}));

vi.mock('../../services/feed.service', () => ({
  feedService: {
    publishCalisthenics: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../services/profile-records.service', () => ({
  profileRecordsService: {
    upsertRecord: vi.fn().mockResolvedValue(undefined),
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

const mockCopySession = {
  id: 's-copy', user_id: 'user-1', date: '2025-03-01T10:00:00Z',
  name: 'Upper body', feedback: 'difficile', notes: null,
  exercises: [
    { name: 'Pull-up', set_type: 'reps', sets: [{ reps: 10, hold_seconds: null }] },
  ],
  skills_unlocked: [],
  total_reps: 10,
  created_at: '2025-03-01T10:00:00Z',
};

const renderWithCopyFrom = () =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/calisthenics/new', state: { copyFrom: mockCopySession } }]}>
      <CalisthenicsSessionPage />
    </MemoryRouter>
  );

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

  describe('Boutons dupliquer et circuit', () => {
    it('affiche le bouton "Circuit"', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.queryAllByText(/circuit/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('affiche le bouton "Repos"', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.queryAllByText(/^repos$/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('ajoute un circuit au clic sur "Circuit"', async () => {
      renderPage();
      // D'abord ajouter un exercice pour que les boutons soient visibles
      await waitFor(() => {
        const addBtns = screen.queryAllByText(/exercice/i);
        expect(addBtns.length).toBeGreaterThan(0);
        addBtns[0].click();
      }, { timeout: 3000 });
      // Cliquer sur "Circuit" ouvre le wizard
      await waitFor(() => {
        const circuitBtns = screen.queryAllByText(/^circuit$/i);
        expect(circuitBtns.length).toBeGreaterThan(0);
        circuitBtns[0].click();
      }, { timeout: 3000 });
      // Confirmer le wizard (valeurs par défaut)
      await waitFor(() => {
        const confirmBtn = document.querySelector('[data-testid="wizard-confirm"]');
        expect(confirmBtn).toBeTruthy();
        (confirmBtn as HTMLElement).click();
      }, { timeout: 3000 });
      // Le circuit doit être créé avec "rounds" dans le header
      await waitFor(() => {
        expect(screen.queryAllByText(/rounds/i).length).toBeGreaterThan(0);
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

  describe('Copie de séance', () => {
    it('affiche le bandeau "Séance copiée depuis" quand copyFrom est présent', async () => {
      renderWithCopyFrom();
      await q(/séance copiée depuis/i);
    });

    it('pré-remplit le nom de la séance depuis copyFrom', async () => {
      renderWithCopyFrom();
      await waitFor(() => {
        const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
        const nameInput = Array.from(inputs).find(
          (el) => (el as HTMLInputElement).value === 'Upper body'
        );
        expect(nameInput).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('pré-remplit les exercices depuis copyFrom', async () => {
      renderWithCopyFrom();
      await q(/pull-up/i);
    });
  });
});
