import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    profile: { id: 'user-1', username: 'Test' },
    loading: false,
  }),
}));

vi.mock('../../services/workout.service', () => ({
  workoutService: { getSessions: vi.fn().mockResolvedValue([]) },
}));

vi.mock('../../services/running.service', () => ({
  runningService: { getSessions: vi.fn().mockResolvedValue([]) },
}));

vi.mock('../../services/weight.service', () => ({
  weightService: { getEntries: vi.fn().mockResolvedValue([]) },
}));

vi.mock('../../services/goals.service', () => ({
  goalsService: { getGoals: vi.fn().mockResolvedValue([]) },
}));

vi.mock('../../services/calisthenics.service', () => ({
  calisthenicsService: { getSessions: vi.fn().mockResolvedValue([]) },
}));

vi.mock('../../services/crossfit.service', () => ({
  crossfitService: { getSessions: vi.fn().mockResolvedValue([]) },
}));

vi.mock('../../services/hybrid.service', () => ({
  hybridService: { getSessions: vi.fn().mockResolvedValue([]) },
}));

// Build an event date in the current month
const now = new Date();
const eventDate = new Date(now.getFullYear(), now.getMonth(), 15).toISOString();

const mockEvent = {
  id: 'ev-1',
  title: 'Trail des Vosges',
  event_date: eventDate,
  type: 'trail',
  description: 'Un trail en montagne',
};

vi.mock('../../lib/supabase-client', () => {
  const makeChain = (result: unknown) => ({
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(result),
    then: vi.fn().mockImplementation((cb: (r: unknown) => unknown) => Promise.resolve(cb(result))),
  });

  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === 'events') {
          return makeChain({ data: [mockEvent], error: null });
        }
        return makeChain({ data: [], error: null });
      }),
    },
  };
});

let CalendarPage: any;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('../../pages/Calendar');
  CalendarPage = mod.CalendarPage;
});

const q = (pattern: RegExp) =>
  waitFor(() => expect(screen.queryAllByText(pattern).length).toBeGreaterThan(0), { timeout: 3000 });

const renderCalendar = () => render(<MemoryRouter><CalendarPage /></MemoryRouter>);

describe('CalendarPage', () => {
  it('se monte sans crash', () => {
    expect(() => renderCalendar()).not.toThrow();
  });

  it('affiche le titre "Calendrier"', async () => {
    renderCalendar();
    await q(/calendrier/i);
  });

  it('affiche la légende complète (6 entrées)', async () => {
    renderCalendar();
    await q(/muscu/i);
    await q(/course/i);
    await q(/pesée/i);
    await q(/objectif/i);
    await q(/défi équipe/i);
    await q(/événement/i);
  });

  it('affiche la navigation mensuelle (jours + chevrons)', async () => {
    renderCalendar();
    await waitFor(() => {
      expect(screen.queryAllByText(/lun/i).length).toBeGreaterThan(0);
    }, { timeout: 3000 });
    await waitFor(() => {
      expect(screen.getAllByRole('button').length).toBeGreaterThan(1);
    }, { timeout: 3000 });
  });

  it('affiche la section "À venir" quand il y a des événements', async () => {
    renderCalendar();
    await q(/à venir/i);
  });

  it('affiche le titre de l\'événement dans la section À venir', async () => {
    renderCalendar();
    await q(/trail des vosges/i);
  });

  it('affiche les stats du mois (muscu, course)', async () => {
    renderCalendar();
    await q(/muscu/i);
    await q(/course/i);
  });

  it('affiche un point violet sur le jour de l\'événement dans la grille', async () => {
    renderCalendar();
    await waitFor(() => {
      const dots = document.querySelectorAll('.bg-violet-500');
      expect(dots.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });
});
