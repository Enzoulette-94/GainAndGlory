import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

const mockNotifications = [
  {
    id: 'n-1',
    user_id: 'user-1',
    type: 'new_session',
    content: { message: 'TestUser a enregistré une séance muscu' },
    read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'n-2',
    user_id: 'user-1',
    type: 'record_beaten',
    content: { message: 'Nouveau record sur Squat !' },
    read: true,
    created_at: new Date().toISOString(),
  },
];

const markAsRead = vi.fn();
const markAllAsRead = vi.fn();

vi.mock('../../contexts/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: mockNotifications,
    unreadCount: 1,
    markAsRead,
    markAllAsRead,
  }),
}));

vi.mock('../../utils/calculations', () => ({
  formatRelativeTime: () => 'à l\'instant',
}));

let NotificationCenter: any;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('../../components/notifications/NotificationCenter');
  NotificationCenter = mod.NotificationCenter;
});

const renderCenter = () => render(<MemoryRouter><NotificationCenter onClose={vi.fn()} /></MemoryRouter>);

describe('NotificationCenter', () => {
  it('se monte sans crash', () => {
    expect(() => renderCenter()).not.toThrow();
  });

  it('affiche le titre "Notifications"', () => {
    renderCenter();
    expect(screen.getByText(/notifications/i)).toBeTruthy();
  });

  it('affiche le badge unread count', () => {
    renderCenter();
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('affiche les messages des notifications', () => {
    renderCenter();
    expect(screen.getByText(/séance muscu/i)).toBeTruthy();
    expect(screen.getByText(/record sur Squat/i)).toBeTruthy();
  });

  it('affiche le bouton "Tout lire" quand il y a des non lues', () => {
    renderCenter();
    expect(screen.getByText(/tout lire/i)).toBeTruthy();
  });

  it('appelle markAllAsRead au clic sur "Tout lire"', async () => {
    renderCenter();
    fireEvent.click(screen.getByText(/tout lire/i));
    await waitFor(() => expect(markAllAsRead).toHaveBeenCalled());
  });

  it('appelle markAsRead au clic sur le bouton check d\'une notif non lue', async () => {
    renderCenter();
    // Le bouton check individuel est le dernier bouton (après "Tout lire")
    const checkBtns = screen.getAllByRole('button');
    const checkBtn = checkBtns[checkBtns.length - 1];
    fireEvent.click(checkBtn);
    await waitFor(() => expect(markAsRead).toHaveBeenCalledWith('n-1'));
  });
});

describe('NotificationCenter — liste vide', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.doMock('../../contexts/NotificationContext', () => ({
      useNotifications: () => ({
        notifications: [],
        unreadCount: 0,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
      }),
    }));
    vi.doMock('../../utils/calculations', () => ({
      formatRelativeTime: () => 'à l\'instant',
    }));
    const mod = await import('../../components/notifications/NotificationCenter');
    NotificationCenter = mod.NotificationCenter;
  });

  it('affiche "Aucune notification" quand la liste est vide', () => {
    render(<MemoryRouter><NotificationCenter onClose={vi.fn()} /></MemoryRouter>);
    expect(screen.getByText(/aucune notification/i)).toBeTruthy();
  });
});
