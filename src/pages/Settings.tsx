import React, { useState, useEffect, useRef } from 'react';
import {
  Settings2,
  User,
  Heart,
  Activity,
  Lock,
  LogOut,
  Edit2,
  Save,
  Camera,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profile.service';
import { supabase } from '../lib/supabase-client';

// ---------------------------------------------------------------------------
// Toggle switch component
// ---------------------------------------------------------------------------
interface ToggleSwitchProps {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  id?: string;
}

function ToggleSwitch({ value, onChange, disabled = false, id }: ToggleSwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={value}
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#c9a870]/50 focus:ring-offset-2 focus:ring-offset-[#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed ${
        value ? 'bg-[#8b6f47]' : 'bg-[#3a3a3a]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();

  // --- avatar state ---
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) { setAvatarError('Fichier image requis.'); return; }
    if (file.size > 2 * 1024 * 1024) { setAvatarError('Taille max 2 Mo.'); return; }
    setAvatarError('');
    setUploadingAvatar(true);
    try {
      await profileService.uploadAvatar(user.id, file);
      await refreshProfile();
    } catch {
      setAvatarError("Erreur lors de l'upload. Vérifie le bucket Supabase.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  // --- username modal state ---
  const [usernameModalOpen, setUsernameModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);

  // --- sports prefs state ---
  const [fcMax, setFcMax] = useState<string>('');
  const [paceUnit, setPaceUnit] = useState<'min/km' | 'km/h'>('min/km');
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsError, setPrefsError] = useState('');
  const [prefsSaved, setPrefsSaved] = useState(false);

  // --- privacy toggles ---
  const [savingToggle, setSavingToggle] = useState<string | null>(null);

  // Sync local prefs state when profile loads / changes
  useEffect(() => {
    if (profile) {
      setFcMax(profile.fc_max != null ? String(profile.fc_max) : '');
      setPaceUnit(profile.preferred_pace_unit ?? 'min/km');
    }
  }, [profile]);

  // -------------------------------------------------------------------------
  // Username change
  // -------------------------------------------------------------------------
  function openUsernameModal() {
    setNewUsername(profile?.username ?? '');
    setUsernameError('');
    setUsernameModalOpen(true);
  }

  function closeUsernameModal() {
    setUsernameModalOpen(false);
    setUsernameError('');
  }

  async function handleSaveUsername() {
    if (!user || !profile) return;

    const trimmed = newUsername.trim();
    const pattern = /^[a-zA-Z0-9_]{3,20}$/;

    if (!pattern.test(trimmed)) {
      setUsernameError('3 à 20 caractères, lettres, chiffres et _ uniquement.');
      return;
    }

    if (trimmed === profile.username) {
      closeUsernameModal();
      return;
    }

    setSavingUsername(true);
    setUsernameError('');

    try {
      const taken = await profileService.isUsernameTaken(trimmed, user.id);
      if (taken) {
        setUsernameError('Ce pseudo est déjà pris.');
        setSavingUsername(false);
        return;
      }

      await profileService.updateProfile(user.id, { username: trimmed });
      await refreshProfile();
      closeUsernameModal();
    } catch {
      setUsernameError('Une erreur est survenue. Réessaie.');
    } finally {
      setSavingUsername(false);
    }
  }

  // -------------------------------------------------------------------------
  // Sports prefs save
  // -------------------------------------------------------------------------
  async function handleSavePrefs() {
    if (!user || !profile) return;

    setPrefsError('');
    setPrefsSaved(false);

    const fcMaxNum = fcMax !== '' ? Number(fcMax) : null;

    if (fcMaxNum !== null && (fcMaxNum < 100 || fcMaxNum > 250 || !Number.isInteger(fcMaxNum))) {
      setPrefsError('La FC max doit être un entier entre 100 et 250.');
      return;
    }

    setSavingPrefs(true);

    try {
      await profileService.updateProfile(user.id, {
        fc_max: fcMaxNum,
        preferred_pace_unit: paceUnit,
      });
      await refreshProfile();
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2500);
    } catch {
      setPrefsError('Erreur lors de la sauvegarde. Réessaie.');
    } finally {
      setSavingPrefs(false);
    }
  }

  // -------------------------------------------------------------------------
  // Privacy toggles
  // -------------------------------------------------------------------------
  async function handleToggle(field: 'share_performances' | 'share_weight' | 'share_photos') {
    if (!user || !profile) return;

    setSavingToggle(field);

    try {
      await profileService.updateProfile(user.id, {
        [field]: !profile[field],
      });
      await refreshProfile();
    } catch {
      // silently fail — value stays the same (refreshProfile will restore)
    } finally {
      setSavingToggle(null);
    }
  }

  // -------------------------------------------------------------------------
  // Sign out
  // -------------------------------------------------------------------------
  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6 pb-8">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                               */}
      {/* ------------------------------------------------------------------ */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-2.5 rounded bg-slate-600/40 border border-white/10/40">
          <Settings2 className="w-6 h-6 text-[#a3a3a3]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Paramètres</h1>
          <p className="text-[#a3a3a3] text-sm mt-0.5"><em>Préférences</em> et compte</p>
        </div>
      </motion.div>

      {/* Navigation ancres */}
      <nav aria-label="Navigation intra-page" className="flex items-center gap-3 flex-wrap text-xs font-rajdhani font-bold uppercase tracking-widest">
        <a href="#compte" className="text-[#c9a870]/70 hover:text-[#c9a870] transition-colors">Compte</a>
        <span className="text-[#3a3a3a]">·</span>
        <a href="#preferences" className="text-[#c9a870]/70 hover:text-[#c9a870] transition-colors">Préférences</a>
        <span className="text-[#3a3a3a]">·</span>
        <a href="#confidentialite" className="text-[#c9a870]/70 hover:text-[#c9a870] transition-colors">Confidentialité</a>
        <span className="text-[#3a3a3a]">·</span>
        <a href="#danger" className="text-[#c9a870]/70 hover:text-red-400 transition-colors">Zone de danger</a>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* Section Compte                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div id="compte">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader
            title="Compte"
            icon={<User className="w-4 h-4" />}
          />
          <div className="p-4 space-y-4">
            {/* Avatar row */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="relative w-16 h-16 border border-[#c9a870]/30 hover:border-[#c9a870]/70 bg-[#1c1c1c] flex items-center justify-center overflow-hidden group transition-colors flex-shrink-0"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-rajdhani font-bold text-[#c9a870] text-xl">
                    {profile?.username?.[0]?.toUpperCase() ?? 'U'}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-[#c9a870] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <div>
                <p className="text-sm font-medium text-[#d4d4d4]">Photo de <strong>profil</strong></p>
                <p className="text-xs text-[#6b6b6b] mt-0.5">JPG, PNG — <em>max 2 Mo</em></p>
                {avatarError && <p className="text-xs text-red-400 mt-1">{avatarError}</p>}
              </div>
            </div>

            <div className="border-t border-white/5" />

            {/* Email row */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#a3a3a3] uppercase tracking-wide font-medium">
                  Adresse e-mail
                </p>
                <p className="text-sm text-[#f5f5f5] mt-0.5">
                  {user?.email ?? '—'}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/5" />

            {/* Username row */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#a3a3a3] uppercase tracking-wide font-medium">
                  Pseudo
                </p>
                <p className="text-sm text-[#f5f5f5] mt-0.5">
                  {profile?.username ?? '—'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<Edit2 className="w-3.5 h-3.5" />}
                onClick={openUsernameModal}
              >
                Modifier
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section Préférences sportives                                        */}
      {/* ------------------------------------------------------------------ */}
      <div id="preferences">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader
            title="Préférences sportives"
            icon={<Heart className="w-4 h-4" />}
          />
          <div className="p-4 space-y-5">
            {/* FC max */}
            <Input
              label="Fréquence cardiaque max (bpm)"
              id="fc-max"
              type="number"
              min={100}
              max={250}
              placeholder="Ex: 185"
              value={fcMax}
              onChange={(e) => {
                setFcMax(e.target.value);
                setPrefsError('');
                setPrefsSaved(false);
              }}
              icon={<Activity className="w-4 h-4" />}
            />

            {/* Pace unit toggle */}
            <div>
              <p className="text-sm font-medium text-[#d4d4d4] mb-2">
                Unité d'allure
              </p>
              <div className="flex gap-2">
                {(['min/km', 'km/h'] as const).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => {
                      setPaceUnit(unit);
                      setPrefsError('');
                      setPrefsSaved(false);
                    }}
                    className={`flex-1 py-2 px-3 rounded text-sm font-medium border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#c9a870]/50 focus:ring-offset-2 focus:ring-offset-[#0a0a0a] ${
                      paceUnit === unit
                        ? 'bg-[#8b6f47] border-[#c9a870]/50 text-white'
                        : 'bg-[#1c1c1c] border-white/10 text-[#a3a3a3] hover:border-slate-500 hover:text-[#d4d4d4]'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>

            {/* Error / success feedback */}
            {prefsError && (
              <p className="text-xs text-red-400">{prefsError}</p>
            )}
            {prefsSaved && (
              <p className="text-xs text-emerald-600">Préférences enregistrées.</p>
            )}

            {/* Save button */}
            <div className="pt-1">
              <Button
                variant="primary"
                size="md"
                loading={savingPrefs}
                icon={<Save className="w-4 h-4" />}
                onClick={handleSavePrefs}
                className="w-full sm:w-auto"
              >
                Enregistrer les préférences
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section Confidentialité                                              */}
      {/* ------------------------------------------------------------------ */}
      <div id="confidentialite">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader
            title="Confidentialité"
            icon={<Lock className="w-4 h-4" />}
            subtitle="Les données partagées sont visibles dans le feed communautaire"
          />
          <div className="p-4 divide-y divide-slate-700/50">
            {(
              [
                {
                  field: 'share_performances' as const,
                  label: 'Partager mes performances',
                  description: 'Séances de musculation et de running',
                },
                {
                  field: 'share_weight' as const,
                  label: 'Partager mon poids',
                  description: 'Évolution du poids dans le feed',
                },
                {
                  field: 'share_photos' as const,
                  label: 'Partager mes photos',
                  description: 'Photos de progression',
                },
              ] as const
            ).map(({ field, label, description }) => (
              <div key={field} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="pr-4">
                  <p className="text-sm font-medium text-[#e5e5e5]">{label}</p>
                  <p className="text-xs text-[#6b6b6b] mt-0.5">{description}</p>
                </div>
                <ToggleSwitch
                  id={`toggle-${field}`}
                  value={profile?.[field] ?? false}
                  onChange={() => handleToggle(field)}
                  disabled={savingToggle === field}
                />
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section Danger                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div id="danger">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-red-900/50">
          <CardHeader
            title="Zone de danger"
            icon={<LogOut className="w-4 h-4 text-red-400" />}
          />
          <div className="p-4">
            <p className="text-sm text-[#a3a3a3] mb-4">
              Tu seras déconnecté de tous tes appareils.
            </p>
            <Button
              variant="danger"
              size="md"
              icon={<LogOut className="w-4 h-4" />}
              onClick={handleSignOut}
            >
              Se déconnecter
            </Button>
          </div>
        </Card>
      </motion.div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Modal — Changer le pseudo                                            */}
      {/* ------------------------------------------------------------------ */}
      <Modal
        isOpen={usernameModalOpen}
        onClose={closeUsernameModal}
        title="Changer le pseudo"
        size="sm"
      >
        <div className="p-5 space-y-4">
          <Input
            label="Nouveau pseudo"
            id="new-username"
            type="text"
            placeholder="Ex: hercule_42"
            value={newUsername}
            onChange={(e) => {
              setNewUsername(e.target.value);
              setUsernameError('');
            }}
            error={usernameError}
            hint="3 à 20 caractères — lettres, chiffres, underscore"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveUsername();
            }}
          />
          <div className="flex gap-3 pt-1">
            <Button
              variant="secondary"
              size="md"
              onClick={closeUsernameModal}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={savingUsername}
              icon={<Save className="w-4 h-4" />}
              onClick={handleSaveUsername}
              className="flex-1"
            >
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
