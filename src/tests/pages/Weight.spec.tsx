import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    profile: { id: 'user-1', username: 'Test' },
    loading: false,
  }),
}));

const mockEntries = [
  { id: 'e-1', weight: 75.5, date: '2025-03-05T10:00:00Z', notes: 'Matin', user_id: 'user-1' },
  { id: 'e-2', weight: 76.0, date: '2025-03-01T10:00:00Z', notes: null, user_id: 'user-1' },
];

vi.mock('../../services/weight.service', () => ({
  weightService: {
    getEntries: vi.fn().mockResolvedValue(mockEntries),
    getLatest: vi.fn().mockResolvedValue(mockEntries[0]),
    createEntry: vi.fn().mockResolvedValue(mockEntries[0]),
    updateEntry: vi.fn().mockResolvedValue(mockEntries[0]),
    deleteEntry: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../services/xp.service', () => ({
  xpService: {
    awardXP: vi.fn().mockResolvedValue({ xpGained: 10, newLevel: 1, oldLevel: 1, leveledUp: false }),
  },
}));

let WeightPage: any;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('../../pages/Weight');
  WeightPage = mod.WeightPage;
});

const q = (pattern: RegExp) =>
  waitFor(() => expect(screen.queryAllByText(pattern).length).toBeGreaterThan(0), { timeout: 3000 });

const renderWeight = () => render(<MemoryRouter><WeightPage /></MemoryRouter>);

describe('WeightPage', () => {
  describe('Affichage principal', () => {
    it('affiche le titre "Poids" ou similaire', async () => {
      renderWeight();
      await q(/poids/i);
    });

    it('affiche le bouton pour ajouter une pesée', async () => {
      renderWeight();
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /peser|nouvelle|ajouter/i }).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Historique', () => {
    it('affiche un poids de la liste (75 ou 76)', async () => {
      renderWeight();
      await waitFor(() => {
        expect(screen.queryAllByText(/75|76/).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Modal nouvelle pesée', () => {
    it('ouvre la modal au clic sur le bouton d\'ajout', async () => {
      renderWeight();
      await waitFor(() => expect(screen.getAllByRole('button', { name: /peser|nouvelle|ajouter/i }).length).toBeGreaterThan(0), { timeout: 3000 });
      fireEvent.click(screen.getAllByRole('button', { name: /peser|nouvelle|ajouter/i })[0]);
      await waitFor(() => {
        expect(screen.getAllByRole('textbox').length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });
});
