import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual as object, useNavigate: () => mockNavigate };
});

vi.mock('../../services/auth.service', () => ({
  authService: {
    signUp: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../services/profile.service', () => ({
  profileService: {
    isUsernameTaken: vi.fn().mockResolvedValue(false),
  },
}));

// Clé d'accès injectée
vi.stubEnv('VITE_ACCESS_KEY', 'Vivelerose94');

// ── Import après les mocks ─────────────────────────────────────────────────
import { RegisterPage } from '../../pages/Register';
import { authService } from '../../services/auth.service';
import { profileService } from '../../services/profile.service';

// ── Helper ─────────────────────────────────────────────────────────────────
function renderRegister() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  );
}

const VALID_KEY      = 'Vivelerose94';
const VALID_USERNAME = 'warrior42';
const VALID_EMAIL    = 'warrior@test.com';
const VALID_PASSWORD = 'password123';

async function fillForm({
  key      = VALID_KEY,
  username = VALID_USERNAME,
  email    = VALID_EMAIL,
  password = VALID_PASSWORD,
  confirm  = VALID_PASSWORD,
} = {}) {
  const user = userEvent.setup();
  if (key)      await user.type(screen.getByLabelText(/clé d'accès/i),            key);
  if (username) await user.type(screen.getByLabelText(/pseudo/i),                  username);
  if (email)    await user.type(screen.getByLabelText(/email/i),                   email);
  if (password) await user.type(screen.getByLabelText(/^mot de passe$/i),          password);
  if (confirm)  await user.type(screen.getByLabelText(/confirmer le mot de passe/i), confirm);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  // ── Rendu ────────────────────────────────────────────────────────────────

  it('affiche le titre Gain & Glory', () => {
    renderRegister();
    expect(screen.queryAllByText(/gain.*glory/i).length).toBeGreaterThan(0);
  });

  it('affiche le champ Clé d\'accès en premier', () => {
    renderRegister();
    expect(screen.getByLabelText(/clé d'accès/i)).toBeInTheDocument();
  });

  it('affiche tous les champs du formulaire', () => {
    renderRegister();
    expect(screen.getByLabelText(/clé d'accès/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pseudo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^mot de passe$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmer le mot de passe/i)).toBeInTheDocument();
  });

  it('affiche le bouton CRÉER MON COMPTE', () => {
    renderRegister();
    expect(screen.getByRole('button', { name: /créer mon compte/i })).toBeInTheDocument();
  });

  it('affiche le lien "Se connecter"', () => {
    renderRegister();
    expect(screen.getByRole('link', { name: /se connecter/i })).toBeInTheDocument();
  });

  it('affiche le hint demande la clé à un administrateur', () => {
    renderRegister();
    expect(screen.getByText(/demande la clé/i)).toBeInTheDocument();
  });

  // ── Validation clé d'accès ───────────────────────────────────────────────

  it('affiche une erreur si la clé d\'accès est vide', async () => {
    renderRegister();
    fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }));
    await waitFor(() => {
      expect(screen.queryAllByText(/clé d'accès requise/i).length).toBeGreaterThan(0);
    });
  });

  it('affiche une erreur si la clé d\'accès est incorrecte', async () => {
    renderRegister();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/clé d'accès/i), 'MauvaiseCle');
    await user.type(screen.getByLabelText(/pseudo/i), VALID_USERNAME);
    await user.type(screen.getByLabelText(/email/i), VALID_EMAIL);
    await user.type(screen.getByLabelText(/^mot de passe$/i), VALID_PASSWORD);
    await user.type(screen.getByLabelText(/confirmer le mot de passe/i), VALID_PASSWORD);
    fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }));
    await waitFor(() => {
      expect(screen.queryAllByText(/clé d'accès invalide/i).length).toBeGreaterThan(0);
    });
  });

  it('n\'affiche pas d\'erreur clé si la clé est correcte', async () => {
    renderRegister();
    await fillForm();
    fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }));
    await waitFor(() => {
      expect(screen.queryAllByText(/clé d'accès invalide/i).length).toBe(0);
    });
  });

  // ── Validation autres champs ─────────────────────────────────────────────

  it('affiche une erreur si le pseudo est trop court', async () => {
    renderRegister();
    await fillForm({ username: 'ab' });
    fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }));
    await waitFor(() => {
      expect(screen.queryAllByText(/min 3 caractères/i).length).toBeGreaterThan(0);
    });
  });

  it('bloque la soumission si l\'email est invalide', async () => {
    renderRegister();
    await fillForm({ email: 'pas-un-email' });
    fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }));
    await new Promise(r => setTimeout(r, 300));
    expect(authService.signUp).not.toHaveBeenCalled();
  });

  it('affiche une erreur si le mot de passe est trop court', async () => {
    renderRegister();
    await fillForm({ password: '123', confirm: '123' });
    fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }));
    await waitFor(() => {
      expect(screen.queryAllByText(/min 8 caractères/i).length).toBeGreaterThan(0);
    });
  });

  it('affiche une erreur si les mots de passe ne correspondent pas', async () => {
    renderRegister();
    await fillForm({ password: 'password123', confirm: 'different456' });
    fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }));
    await waitFor(() => {
      expect(screen.queryAllByText(/ne correspondent pas/i).length).toBeGreaterThan(0);
    });
  });

  // ── Erreurs serveur ──────────────────────────────────────────────────────

  it('affiche une erreur si le pseudo est déjà pris', async () => {
    vi.mocked(profileService.isUsernameTaken).mockResolvedValueOnce(true);
    renderRegister();
    await fillForm();
    fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }));
    await waitFor(() => {
      expect(screen.queryAllByText(/pseudo est déjà pris/i).length).toBeGreaterThan(0);
    });
  });

  it('affiche une erreur si l\'inscription échoue côté serveur', async () => {
    vi.mocked(authService.signUp).mockRejectedValueOnce(new Error('Erreur serveur'));
    renderRegister();
    await fillForm();
    fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }));
    await waitFor(() => {
      expect(screen.queryAllByText(/erreur serveur/i).length).toBeGreaterThan(0);
    });
  });

  // ── Succès ───────────────────────────────────────────────────────────────

  it('appelle signUp avec les bonnes données si tout est valide', async () => {
    renderRegister();
    await fillForm();
    fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }));
    await waitFor(() => {
      expect(authService.signUp).toHaveBeenCalledWith(
        VALID_EMAIL,
        VALID_PASSWORD,
        VALID_USERNAME,
      );
    });
  });

  it('redirige vers /dashboard après inscription réussie', async () => {
    renderRegister();
    await fillForm();
    fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('ne soumet pas si la clé est incorrecte même avec tout le reste valide', async () => {
    renderRegister();
    await fillForm({ key: 'WrongKey' });
    fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }));
    await waitFor(() => {
      expect(authService.signUp).not.toHaveBeenCalled();
    });
  });
});
