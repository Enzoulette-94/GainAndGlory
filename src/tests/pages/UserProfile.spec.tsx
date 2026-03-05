import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import React from 'react';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-me' },
    profile: { id: 'user-me', username: 'Me' },
    loading: false,
  }),
}));

const mockProfile = {
  id: 'user-42', username: 'Spartacus', avatar_url: null,
  total_xp: 1200, global_level: 5, musculation_xp: 700,
  musculation_level: 4, running_xp: 300, running_level: 2,
  current_streak: 7, longest_streak: 30,
  created_at: '2024-06-01T00:00:00Z',
  is_admin: false, fc_max: null,
  share_performances: true, share_weight: false, share_photos: false,
  preferred_pace_unit: 'min/km', last_activity_date: null,
};

const mockRecords = [
  { id: 'r-1', user_id: 'user-42', title: 'Deadlift', value: '180', unit: 'kg', created_at: '2025-01-01T00:00:00Z' },
];

vi.mock('../../services/profile.service', () => ({
  profileService: { getProfile: vi.fn().mockResolvedValue(mockProfile) },
}));
vi.mock('../../services/workout.service', () => ({
  workoutService: { getSessionsCount: vi.fn().mockResolvedValue(60) },
}));
vi.mock('../../services/running.service', () => ({
  runningService: { getSessionsCount: vi.fn().mockResolvedValue(20), getTotalDistance: vi.fn().mockResolvedValue(200000) },
}));
vi.mock('../../services/badges.service', () => ({
  badgesService: { getUserBadges: vi.fn().mockResolvedValue([]) },
}));
vi.mock('../../services/profile-records.service', () => ({
  profileRecordsService: { getRecords: vi.fn().mockResolvedValue(mockRecords) },
}));

let UserProfilePage: any;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('../../pages/UserProfile');
  UserProfilePage = mod.UserProfilePage;
});

const q = (pattern: RegExp) =>
  waitFor(() => expect(screen.queryAllByText(pattern).length).toBeGreaterThan(0), { timeout: 3000 });

const renderUserProfile = (userId = 'user-42') =>
  render(
    <MemoryRouter initialEntries={[`/profil/${userId}`]}>
      <Routes>
        <Route path="/profil/:userId" element={<UserProfilePage />} />
      </Routes>
    </MemoryRouter>
  );

describe('UserProfilePage', () => {
  it('se monte sans crash', () => {
    expect(() => renderUserProfile()).not.toThrow();
  });

  it('affiche le username "Spartacus"', async () => {
    renderUserProfile();
    await q(/spartacus/i);
  });

  it('affiche la section Progression (XP)', async () => {
    renderUserProfile();
    await q(/progression/i);
  });

  it('affiche les statistiques (séances muscu)', async () => {
    renderUserProfile();
    await q(/séances muscu/i);
  });

  it('affiche le nombre de séances muscu (60)', async () => {
    renderUserProfile();
    await waitFor(() => expect(screen.queryAllByText('60').length).toBeGreaterThan(0), { timeout: 3000 });
  });

  it('affiche les performances manuelles (Deadlift)', async () => {
    renderUserProfile();
    await q(/deadlift/i);
  });

  it('affiche la valeur de la performance (180)', async () => {
    renderUserProfile();
    await waitFor(() => expect(screen.queryAllByText(/180/).length).toBeGreaterThan(0), { timeout: 3000 });
  });

  it('affiche la section badges', async () => {
    renderUserProfile();
    await q(/badges/i);
  });

  it('affiche un bouton retour', async () => {
    renderUserProfile();
    await q(/retour/i);
  });

  it('ne propose pas de bouton "Modifier" (lecture seule)', async () => {
    renderUserProfile();
    await waitFor(() => {
      expect(screen.queryAllByText(/modifier/i).length).toBe(0);
    }, { timeout: 3000 });
  });
});
