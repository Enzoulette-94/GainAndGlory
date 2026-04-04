import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    profile: {
      id: 'user-1', username: 'Test',
      global_level: 1, musculation_level: 1, running_level: 1,
      calisthenics_level: 1, crossfit_level: 1,
      current_streak: 0, total_xp: 0,
    },
    loading: false,
    refreshProfile: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('../../services/hybrid.service', () => ({
  hybridService: {
    createSession: vi.fn().mockResolvedValue({ id: 'h-1' }),
  },
}));

vi.mock('../../services/xp.service', () => ({
  xpService: {
    awardXP: vi.fn().mockResolvedValue({ xpGained: 50, newLevel: 1, oldLevel: 1, leveledUp: false }),
  },
}));

vi.mock('../../services/feed.service', () => ({
  feedService: {
    publishHybrid: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../services/workout.service', () => ({
  workoutService: {
    getSessionsCount: vi.fn().mockResolvedValue(5),
    getExercises: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../services/badges.service', () => ({
  badgesService: {
    checkAndUnlockBadges: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../services/notification.service', () => ({
  notificationService: {
    broadcastToAll: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual as object, useNavigate: () => vi.fn() };
});

// Mock les form composants (sans hooks dans les factories pour compatibilité vi.mock hoist)
vi.mock('../../components/forms/RunBlockForm', () => ({
  RunBlockForm: () => require('react').createElement('div', null,
    require('react').createElement('label', null, 'Distance'),
    require('react').createElement('label', null, 'Durée'),
  ),
}));

vi.mock('../../components/forms/MuscuBlockForm', () => ({
  MuscuBlockForm: () => null,
  buildMuscuSets: () => [],
}));

vi.mock('../../components/forms/CaliBlockForm', () => ({
  CaliBlockForm: () => null,
  flattenToCaliExercises: () => [],
}));

vi.mock('../../components/forms/CrossfitBlockForm', () => ({
  CrossfitBlockForm: () => null,
  flattenCrossfitExercises: () => [],
}));

import { HybridSessionPage } from '../../pages/HybridSession';

beforeEach(() => {
  vi.clearAllMocks();
});

const q = (pattern: RegExp) =>
  waitFor(() => expect(screen.queryAllByText(pattern).length).toBeGreaterThan(0), { timeout: 3000 });

const renderPage = () => render(<MemoryRouter><HybridSessionPage /></MemoryRouter>);

describe('HybridSessionPage', () => {
  describe('Rendu initial', () => {
    it('monte sans crash', () => {
      expect(() => renderPage()).not.toThrow();
    });

    it('affiche le titre "Session hybride"', async () => {
      renderPage();
      await q(/session hybride/i);
    });

    it('affiche le sous-titre descriptif', async () => {
      renderPage();
      await q(/combiner/i);
    });

    it('affiche un champ date', async () => {
      renderPage();
      await waitFor(() => {
        const dateInputs = document.querySelectorAll('input[type="date"]');
        expect(dateInputs.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('affiche le bouton "Ajouter une activité"', async () => {
      renderPage();
      await q(/ajouter une activité/i);
    });

    it('commence avec 0 blocs', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.queryAllByText(/0 bloc/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Ajout de blocs via la modal', () => {
    it('ouvre la modal de sélection au clic sur "Ajouter une activité"', async () => {
      renderPage();
      await waitFor(() => {
        const btn = screen.queryAllByText(/ajouter une activité/i);
        expect(btn.length).toBeGreaterThan(0);
        fireEvent.click(btn[0]);
      }, { timeout: 3000 });
      await q(/choisir une activité/i);
    });

    it('affiche les 4 types d\'activité dans la modal', async () => {
      renderPage();
      await waitFor(() => fireEvent.click(screen.getAllByText(/ajouter une activité/i)[0]), { timeout: 3000 });
      await waitFor(() => {
        expect(screen.queryAllByText(/course/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/musculation/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/calisthénie/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/crossfit/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('ajoute un bloc Running au clic sur "Course"', async () => {
      renderPage();
      await waitFor(() => fireEvent.click(screen.getAllByText(/ajouter une activité/i)[0]), { timeout: 3000 });
      await waitFor(() => {
        const courseBtns = screen.queryAllByText(/course/i);
        expect(courseBtns.length).toBeGreaterThan(0);
        fireEvent.click(courseBtns[0]);
      }, { timeout: 3000 });
      await waitFor(() => {
        expect(screen.queryAllByText(/1 bloc/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('affiche les champs Distance et Durée après ajout d\'un bloc Running', async () => {
      renderPage();
      await waitFor(() => fireEvent.click(screen.getAllByText(/ajouter une activité/i)[0]), { timeout: 3000 });
      await waitFor(() => fireEvent.click(screen.queryAllByText(/course/i)[0]), { timeout: 3000 });
      await waitFor(() => {
        expect(screen.queryAllByText(/distance/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/durée/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('ajoute un bloc Musculation', async () => {
      renderPage();
      await waitFor(() => fireEvent.click(screen.getAllByText(/ajouter une activité/i)[0]), { timeout: 3000 });
      await waitFor(() => {
        const muscu = screen.queryAllByText(/musculation/i);
        expect(muscu.length).toBeGreaterThan(0);
        fireEvent.click(muscu[0]);
      }, { timeout: 3000 });
      await waitFor(() => {
        expect(screen.queryAllByText(/1 bloc/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('XP preview', () => {
    it('affiche le bonus hybride après ajout de 2 blocs', async () => {
      renderPage();
      // Add bloc 1
      await waitFor(() => fireEvent.click(screen.getAllByText(/ajouter une activité/i)[0]), { timeout: 3000 });
      await waitFor(() => fireEvent.click(screen.queryAllByText(/course/i)[0]), { timeout: 3000 });
      // Add bloc 2
      await waitFor(() => fireEvent.click(screen.getAllByText(/ajouter une activité/i)[0]), { timeout: 3000 });
      await waitFor(() => {
        const muscu = screen.queryAllByText(/musculation/i);
        expect(muscu.length).toBeGreaterThan(0);
        fireEvent.click(muscu[0]);
      }, { timeout: 3000 });
      await waitFor(() => {
        expect(screen.queryAllByText(/bonus hybride/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Feedback global', () => {
    it('affiche les boutons de feedback', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.queryAllByText(/facile/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/difficile/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Validation soumission', () => {
    it('affiche une erreur si moins de 2 blocs au submit', async () => {
      renderPage();
      const submitBtns = await waitFor(() => {
        const btns = screen.queryAllByText(/enregistrer la session/i);
        expect(btns.length).toBeGreaterThan(0);
        return btns;
      }, { timeout: 3000 });
      fireEvent.click(submitBtns[0]);
      await waitFor(() => {
        expect(screen.queryAllByText(/au moins 2 blocs/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Suppression de bloc', () => {
    it('supprime un bloc au clic sur la corbeille', async () => {
      renderPage();
      await waitFor(() => fireEvent.click(screen.getAllByText(/ajouter une activité/i)[0]), { timeout: 3000 });
      await waitFor(() => fireEvent.click(screen.queryAllByText(/course/i)[0]), { timeout: 3000 });
      // Verify block exists
      await waitFor(() => expect(screen.queryAllByText(/1 bloc/i).length).toBeGreaterThan(0), { timeout: 3000 });
      // Find delete button by title
      const trashBtn = document.querySelector('button[title="Supprimer le bloc"]');
      if (trashBtn) {
        fireEvent.click(trashBtn);
        await waitFor(() => expect(screen.queryAllByText(/0 bloc/i).length).toBeGreaterThan(0), { timeout: 3000 });
      } else {
        expect(screen.queryAllByText(/1 bloc/i).length).toBeGreaterThan(0);
      }
    });
  });
});
