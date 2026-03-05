import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    profile: {
      id: 'user-1', username: 'TestUser', avatar_url: null,
      total_xp: 500, global_level: 3, musculation_xp: 200,
      musculation_level: 2, running_xp: 100, running_level: 1,
      current_streak: 5, longest_streak: 12,
      created_at: '2025-01-01T00:00:00Z',
      is_admin: false, fc_max: null,
      share_performances: true, share_weight: false, share_photos: false,
      preferred_pace_unit: 'min/km', last_activity_date: null,
    },
    refreshProfile: vi.fn(),
    loading: false,
  }),
}));

vi.mock('../../services/workout.service', () => ({
  workoutService: { getSessionsCount: vi.fn().mockResolvedValue(42) },
}));
vi.mock('../../services/running.service', () => ({
  runningService: { getSessionsCount: vi.fn().mockResolvedValue(15), getTotalDistance: vi.fn().mockResolvedValue(120000) },
}));
vi.mock('../../services/badges.service', () => ({
  badgesService: { getUserBadges: vi.fn().mockResolvedValue([]) },
}));
vi.mock('../../services/profile.service', () => ({
  profileService: { updateProfile: vi.fn(), isUsernameTaken: vi.fn().mockResolvedValue(false), uploadAvatar: vi.fn() },
}));

const mockRecords = [
  { id: 'r-1', user_id: 'user-1', title: 'Squat', value: '120', unit: 'kg', category: 'musculation', created_at: '2025-01-01T00:00:00Z' },
  { id: 'r-2', user_id: 'user-1', title: '5 km', value: '22:30', unit: '5 km', category: 'course', created_at: '2025-01-02T00:00:00Z' },
];

vi.mock('../../services/profile-records.service', () => ({
  profileRecordsService: {
    getRecords: vi.fn().mockResolvedValue(mockRecords),
    createRecord: vi.fn().mockResolvedValue({ id: 'r-3', user_id: 'user-1', title: 'Bench', value: '100', unit: 'kg', category: 'musculation', created_at: '2025-01-03T00:00:00Z' }),
    updateRecord: vi.fn().mockResolvedValue(mockRecords[0]),
    deleteRecord: vi.fn().mockResolvedValue(undefined),
  },
}));

let ProfilePage: any;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('../../pages/Profile');
  ProfilePage = mod.ProfilePage;
});

const q = (pattern: RegExp) =>
  waitFor(() => expect(screen.queryAllByText(pattern).length).toBeGreaterThan(0), { timeout: 3000 });

const renderProfile = () => render(<MemoryRouter><ProfilePage /></MemoryRouter>);

describe('ProfilePage', () => {
  describe('Infos générales', () => {
    it('affiche le username', async () => {
      renderProfile();
      await q(/testuser/i);
    });

    it('affiche la section Statistiques', async () => {
      renderProfile();
      await q(/statistiques/i);
    });

    it('affiche le nombre de séances muscu (42)', async () => {
      renderProfile();
      await waitFor(() => expect(screen.queryAllByText('42').length).toBeGreaterThan(0), { timeout: 3000 });
    });
  });

  describe('Performances manuelles', () => {
    it('affiche la section "Meilleures performances"', async () => {
      renderProfile();
      await q(/meilleures performances/i);
    });

    it('affiche le record "Squat"', async () => {
      renderProfile();
      await q(/squat/i);
    });

    it('affiche la valeur du record "120"', async () => {
      renderProfile();
      await waitFor(() => expect(screen.queryAllByText(/120/).length).toBeGreaterThan(0), { timeout: 3000 });
    });

    it('affiche le record "5 km"', async () => {
      renderProfile();
      await q(/5 km/i);
    });

    it('affiche la sous-section "Musculation"', async () => {
      renderProfile();
      await q(/musculation/i);
    });

    it('affiche la sous-section "Course"', async () => {
      renderProfile();
      await q(/course/i);
    });

    it('affiche le séparateur "•" entre titre et valeur (format inline)', async () => {
      renderProfile();
      await waitFor(() => {
        expect(screen.queryAllByText('•').length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('affiche l\'unité "kg" à côté de la valeur muscu', async () => {
      renderProfile();
      await waitFor(() => {
        expect(screen.queryAllByText(/kg/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('affiche les boutons Modifier et Supprimer pour chaque record', async () => {
      renderProfile();
      await waitFor(() => {
        expect(document.querySelectorAll('[aria-label="Modifier"]').length).toBeGreaterThan(0);
        expect(document.querySelectorAll('[aria-label="Supprimer"]').length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('affiche le sélecteur de catégorie dans la modal (Musculation / Course)', async () => {
      renderProfile();
      await waitFor(() => expect(screen.queryAllByText(/ajouter/i).length).toBeGreaterThan(0), { timeout: 3000 });
      fireEvent.click(screen.getAllByText(/ajouter/i)[0]);
      await waitFor(() => {
        expect(screen.queryAllByText(/musculation/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('affiche un bouton "Ajouter"', async () => {
      renderProfile();
      await waitFor(() => {
        expect(screen.queryAllByText(/ajouter/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('ouvre la modal au clic sur "Ajouter"', async () => {
      renderProfile();
      await waitFor(() => expect(screen.queryAllByText(/ajouter/i).length).toBeGreaterThan(0), { timeout: 3000 });
      fireEvent.click(screen.getAllByText(/ajouter/i)[0]);
      await waitFor(() => {
        expect(screen.queryAllByPlaceholderText(/squat|titre|développé/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Badges', () => {
    it('affiche la section badges', async () => {
      renderProfile();
      await q(/badges/i);
    });
  });
});
