import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Edit2, Dumbbell, Timer, Route, Flame, Camera, Trophy, Plus, Trash2, Pencil, PersonStanding } from 'lucide-react';
import { motion } from 'framer-motion';
import { workoutService } from '../services/workout.service';
import { runningService } from '../services/running.service';
import { badgesService } from '../services/badges.service';
import { profileService } from '../services/profile.service';
import { profileRecordsService } from '../services/profile-records.service';
import { getLevelProgress, getLevelTitle, formatDate, formatDistance, formatDuration } from '../utils/calculations';
import { BADGE_RARITY_CONFIG } from '../utils/constants';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { ProgressBar } from '../components/common/ProgressBar';
import { Loader } from '../components/common/Loader';
import { useAuth } from '../contexts/AuthContext';
import type { UserBadge, ProfileRecord } from '../types/models';

// ─── helpers ────────────────────────────────────────────────────────────────

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

// ─── types ───────────────────────────────────────────────────────────────────

interface StatsData {
  muscuCount: number;
  runCount: number;
  totalDistance: number;
}

// ─── sub-components ──────────────────────────────────────────────────────────

interface XPRowProps {
  label: string;
  xp: number;
  color: string;
  delay?: number;
}

function XPRow({ label, xp, color, delay = 0 }: XPRowProps) {
  const { level, current, needed } = getLevelProgress(xp);
  const progress = needed > 0 ? Math.min((current / needed) * 100, 100) : 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#d4d4d4] font-medium">Niveau {level}</span>
        <span className="text-[#6b6b6b]">
          {current.toLocaleString('fr-FR')} / {needed.toLocaleString('fr-FR')} XP
        </span>
      </div>
      <ProgressBar value={progress} color={color} height="sm" />
      <p className="text-xs text-[#6b6b6b]">{label}</p>
    </motion.div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();

  // stats loading
  const [stats, setStats] = useState<StatsData | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [records, setRecords] = useState<ProfileRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // record modal
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProfileRecord | null>(null);
  const [recCategory, setRecCategory] = useState<'musculation' | 'course' | 'calisthenics'>('musculation');
  const [recTitle, setRecTitle] = useState('');
  const [recValue, setRecValue] = useState('');
  const [recUnit, setRecUnit] = useState<'kg' | 'reps'>('kg');
  const [recDistance, setRecDistance] = useState('');
  const [recError, setRecError] = useState('');
  const [savingRecord, setSavingRecord] = useState(false);

  // edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (!file.type.startsWith('image/')) { setAvatarError('Fichier image requis.'); return; }
    if (file.size > 2 * 1024 * 1024) { setAvatarError('Taille max 2 Mo.'); return; }
    setAvatarError('');
    setUploadingAvatar(true);
    try {
      await profileService.uploadAvatar(profile.id, file);
      await refreshProfile();
    } catch {
      setAvatarError("Erreur upload. Vérifie le bucket Supabase.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  // ─── data fetch ─────────────────────────────────────────────────────────

  const loadData = useCallback(async (userId: string) => {
    try {
      // Nettoyage silencieux des records muscu orphelins (exercices hors liste)
      await profileRecordsService.deleteOrphanedMuscuRecords?.(userId).catch(() => {});

      const [muscuCount, runCount, totalDistance, userBadges, userRecords] = await Promise.all([
        workoutService.getSessionsCount(userId),
        runningService.getSessionsCount(userId),
        runningService.getTotalDistance(userId),
        badgesService.getUserBadges(userId),
        profileRecordsService.getRecords(userId),
      ]);
      setStats({ muscuCount, runCount, totalDistance });
      setBadges(userBadges);
      setRecords(userRecords);
    } catch {
      setStats({ muscuCount: 0, runCount: 0, totalDistance: 0 });
      setBadges([]);
      setRecords([]);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.id) {
      loadData(profile.id);
    } else {
      setDataLoading(false);
    }
  }, [profile?.id, loadData]);

  // ─── edit modal handlers ─────────────────────────────────────────────────

  function openEdit() {
    setEditUsername(profile?.username ?? '');
    setEditError('');
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditError('');
  }

  async function handleSave() {
    if (!profile) return;

    const trimmed = editUsername.trim();
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

    if (!usernameRegex.test(trimmed)) {
      setEditError('3 à 20 caractères, lettres, chiffres ou underscore uniquement.');
      return;
    }

    setSaving(true);
    setEditError('');

    try {
      if (trimmed !== profile.username) {
        const taken = await profileService.isUsernameTaken(trimmed, profile.id);
        if (taken) {
          setEditError('Ce nom d\'utilisateur est déjà pris.');
          setSaving(false);
          return;
        }
      }

      await profileService.updateProfile(profile.id, { username: trimmed });
      await refreshProfile();
      closeEdit();
    } catch {
      setEditError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  }

  // ─── record handlers ─────────────────────────────────────────────────────

  function openAddRecord(cat: 'musculation' | 'course' | 'calisthenics' = 'musculation') {
    setEditingRecord(null);
    setRecCategory(cat);
    setRecTitle(''); setRecValue(''); setRecUnit('kg'); setRecDistance(''); setRecError('');
    setRecordModalOpen(true);
  }

  function openEditRecord(r: ProfileRecord) {
    setEditingRecord(r);
    const cat = r.category ?? 'musculation';
    setRecCategory(cat);
    setRecTitle(r.title);
    setRecValue(r.value);
    if (cat === 'course') {
      setRecDistance(r.unit.replace(/\s*km$/i, '').trim());
      setRecUnit('kg');
    } else {
      setRecUnit((r.unit === 'reps' ? 'reps' : 'kg') as 'kg' | 'reps');
      setRecDistance('');
    }
    setRecError('');
    setRecordModalOpen(true);
  }

  async function handleSaveRecord() {
    if (!profile) return;
    if (!recTitle.trim()) { setRecError('Le titre est requis.'); return; }
    if (!recValue.trim()) { setRecError(recCategory === 'course' ? 'La durée est requise.' : 'La valeur est requise.'); return; }
    if (recCategory === 'course' && !recDistance.trim()) { setRecError('La distance est requise.'); return; }
    const unit = recCategory === 'course' ? `${recDistance.trim()} km` : recUnit;
    setSavingRecord(true); setRecError('');
    try {
      if (editingRecord) {
        const updated = await profileRecordsService.updateRecord(editingRecord.id, recTitle.trim(), recValue.trim(), unit, recCategory);
        setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
      } else {
        const created = await profileRecordsService.createRecord(profile.id, recTitle.trim(), recValue.trim(), unit, recCategory);
        setRecords(prev => [...prev, created]);
      }
      setRecordModalOpen(false);
    } catch {
      setRecError('Erreur lors de la sauvegarde.');
    } finally {
      setSavingRecord(false);
    }
  }

  async function handleDeleteRecord(id: string) {
    try {
      await profileRecordsService.deleteRecord(id);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Erreur suppression record:', err);
    }
  }

  // ─── loading guard ───────────────────────────────────────────────────────

  if (!profile) {
    return <Loader text="Chargement du profil..." />;
  }

  // ─── derived values ──────────────────────────────────────────────────────

  const levelTitle = getLevelTitle(profile.global_level);
  const memberSince = formatDate(profile.created_at, { month: 'long', year: 'numeric' });

  // ─── render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-6">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Card className="p-6">
          <div className="flex items-start gap-5">

            {/* Avatar */}
            <button
              onClick={() => { setEditOpen(true); setEditUsername(profile.username); setEditError(''); setAvatarError(''); }}
              className="flex-shrink-0 relative w-[72px] h-[72px] rounded-full overflow-hidden border-2 border-[#c9a870]/40 hover:border-[#c9a870]/80 bg-[#1c1c1c] flex items-center justify-center group transition-colors"
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#c9a870] font-bold text-2xl">{getInitials(profile.username)}</span>
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-white truncate">{profile.username}</h1>

              <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-semibold bg-transparent text-[#c9a870] border border-[#c9a870]/30">
                {levelTitle}
              </span>

              <p className="text-xs text-[#6b6b6b] mt-2">Membre depuis {memberSince}</p>
            </div>

            {/* Edit button */}
            <Button
              variant="secondary"
              size="sm"
              icon={<Edit2 className="w-3.5 h-3.5" />}
              onClick={openEdit}
              aria-label="Modifier le profil"
            >
              Modifier
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* ── XP BARS ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-5 space-y-5">
          <h2 className="text-sm font-semibold text-[#d4d4d4] uppercase tracking-wider">Progression</h2>

          <XPRow
            label={`Global · ${profile.total_xp.toLocaleString('fr-FR')} XP total`}
            xp={profile.total_xp}
            color="bg-red-500"
            delay={0.12}
          />
          <XPRow
            label={`Musculation · ${profile.musculation_xp.toLocaleString('fr-FR')} XP total`}
            xp={profile.musculation_xp}
            color="bg-red-800"
            delay={0.18}
          />
          <XPRow
            label={`Course · ${profile.running_xp.toLocaleString('fr-FR')} XP total`}
            xp={profile.running_xp}
            color="bg-blue-700"
            delay={0.24}
          />
        </Card>
      </motion.div>

      {/* ── STATS ───────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-sm font-semibold text-[#d4d4d4] uppercase tracking-wider mb-3">Statistiques</h2>

        {dataLoading ? (
          <Loader size="sm" />
        ) : (
          <div className="grid grid-cols-2 gap-3">

            {/* Séances muscu */}
            <Card className="p-4 flex flex-col gap-2">
              <div className="p-2 rounded bg-transparent w-fit">
                <Dumbbell className="w-4 h-4 text-red-400" />
              </div>
              <p className="text-2xl font-black text-white">{stats?.muscuCount ?? 0}</p>
              <p className="text-xs text-[#a3a3a3]">Séances muscu</p>
            </Card>

            {/* Séances course */}
            <Card className="p-4 flex flex-col gap-2">
              <div className="p-2 rounded bg-transparent w-fit">
                <Timer className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-black text-white">{stats?.runCount ?? 0}</p>
              <p className="text-xs text-[#a3a3a3]">Séances course</p>
            </Card>

            {/* Distance totale */}
            <Card className="p-4 flex flex-col gap-2">
              <div className="p-2 rounded bg-transparent w-fit">
                <Route className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-black text-white">
                {stats ? formatDistance(stats.totalDistance) : '0 km'}
              </p>
              <p className="text-xs text-[#a3a3a3]">Distance totale</p>
            </Card>

            {/* Série */}
            <Card className="p-4 flex flex-col gap-2">
              <div className="p-2 rounded bg-transparent w-fit">
                <Flame className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-2xl font-black text-white">{profile.current_streak}</p>
              <p className="text-xs text-[#a3a3a3]">Jours consécutifs</p>
              <p className="text-xs text-[#4a4a4a]">
                Record : {profile.longest_streak} jours
              </p>
            </Card>

          </div>
        )}
      </motion.div>

      {/* ── PERFORMANCES MANUELLES ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#d4d4d4] uppercase tracking-wider">Meilleures performances</h2>
          <button
            onClick={() => openAddRecord()}
            className="flex items-center gap-1 text-xs text-[#c9a870]/70 hover:text-[#c9a870] transition-colors"
            aria-label="Ajouter une performance"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter
          </button>
        </div>

        {dataLoading ? (
          <Loader size="sm" />
        ) : records.length === 0 ? (
          <Card className="p-6 text-center">
            <Trophy className="w-8 h-8 text-[#4a4a4a] mx-auto mb-2" />
            <p className="text-[#6b6b6b] text-sm">Aucune performance enregistrée</p>
            <div className="flex justify-center gap-4 mt-2">
              <button onClick={() => openAddRecord('musculation')} className="text-xs text-[#c9a870]/70 hover:text-[#c9a870] transition-colors flex items-center gap-1">
                <Dumbbell className="w-3 h-3" /> Musculation
              </button>
              <button onClick={() => openAddRecord('course')} className="text-xs text-blue-400/70 hover:text-blue-400 transition-colors flex items-center gap-1">
                <PersonStanding className="w-3 h-3" /> Course
              </button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Musculation */}
            {records.filter(r => (r.category ?? 'musculation') === 'musculation').length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="w-3.5 h-3.5 text-[#c9a870]" />
                  <span className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Musculation</span>
                  <button onClick={() => openAddRecord('musculation')} className="ml-auto text-[10px] text-[#c9a870]/50 hover:text-[#c9a870] transition-colors flex items-center gap-0.5">
                    <Plus className="w-3 h-3" />Ajouter
                  </button>
                </div>
                <div className="space-y-1.5">
                  {records.filter(r => (r.category ?? 'musculation') === 'musculation').map((r, i) => (
                    <motion.div key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.27 + i * 0.04 }}
                      className="flex items-center gap-2 px-3 py-2.5 bg-[#111111] border border-white/5 border-l-2 border-l-[#c9a870]/40"
                    >
                      <Trophy className="w-3.5 h-3.5 text-[#c9a870] flex-shrink-0" />
                      <span className="text-sm font-medium text-[#d4d4d4]">{r.title}</span>
                      <span className="text-[#6b6b6b] text-xs">•</span>
                      <span className="text-sm font-bold text-[#c9a870]">
                        {r.value}<span className="text-xs font-normal text-[#6b6b6b] ml-1">{r.unit}</span>
                      </span>
                      <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                        <button onClick={() => openEditRecord(r)} className="p-1 text-[#6b6b6b] hover:text-[#d4d4d4] transition-colors" aria-label="Modifier"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteRecord(r.id)} className="p-1 text-[#6b6b6b] hover:text-red-400 transition-colors" aria-label="Supprimer"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Course */}
            {records.filter(r => r.category === 'course').length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <PersonStanding className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Course</span>
                  <button onClick={() => openAddRecord('course')} className="ml-auto text-[10px] text-blue-400/50 hover:text-blue-400 transition-colors flex items-center gap-0.5">
                    <Plus className="w-3 h-3" />Ajouter
                  </button>
                </div>
                <div className="space-y-1.5">
                  {records.filter(r => r.category === 'course').map((r, i) => (
                    <motion.div key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.27 + i * 0.04 }}
                      className="flex items-center gap-2 px-3 py-2.5 bg-[#111111] border border-white/5 border-l-2 border-l-blue-800/50"
                    >
                      <PersonStanding className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-[#d4d4d4]">{r.title}</span>
                      <span className="text-[#6b6b6b] text-xs">•</span>
                      <span className="text-sm font-bold text-blue-400">
                        {!String(r.value).includes(':') && !isNaN(parseFloat(String(r.value)))
                          ? formatDuration(parseFloat(String(r.value)), true)
                          : r.value}
                      </span>
                      <span className="text-xs text-[#6b6b6b]">temps</span>
                      <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                        <button onClick={() => openEditRecord(r)} className="p-1 text-[#6b6b6b] hover:text-[#d4d4d4] transition-colors" aria-label="Modifier"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteRecord(r.id)} className="p-1 text-[#6b6b6b] hover:text-red-400 transition-colors" aria-label="Supprimer"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* ── BADGES ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-sm font-semibold text-[#d4d4d4] uppercase tracking-wider mb-3">
          Badges debloqués ({badges.length})
        </h2>

        {dataLoading ? (
          <Loader size="sm" />
        ) : badges.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-[#6b6b6b] text-sm">Aucun badge encore...</p>
            <p className="text-[#4a4a4a] text-xs mt-1">Continue a t'entrainer pour en debloquer !</p>
          </Card>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {badges.map((ub, i) => {
              const badge = ub.badge;
              if (!badge) return null;

              const rarityKey = badge.rarity as keyof typeof BADGE_RARITY_CONFIG;
              const config = BADGE_RARITY_CONFIG[rarityKey] ?? BADGE_RARITY_CONFIG.common;

              return (
                <motion.div
                  key={ub.id}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.32 + i * 0.04 }}
                  title={badge.description ?? badge.name}
                  className="rounded border px-3 py-2 text-center cursor-default select-none"
                  style={{
                    backgroundColor: config.bg,
                    borderColor: config.color + '40',
                  }}
                >
                  <p
                    className="text-xs font-semibold truncate"
                    style={{ color: config.color }}
                  >
                    {badge.name}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── RECORD MODAL ────────────────────────────────────────────────── */}
      <Modal
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        title={editingRecord ? 'Modifier la performance' : 'Ajouter une performance'}
        size="sm"
      >
        <div className="p-5 space-y-4">
          {/* Sélecteur de catégorie */}
          <div className="flex rounded overflow-hidden border border-white/10">
            <button
              type="button"
              onClick={() => { setRecCategory('musculation'); setRecError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${
                recCategory === 'musculation' ? 'bg-[#c9a870]/15 text-[#c9a870]' : 'text-[#6b6b6b] hover:text-[#d4d4d4]'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              Musculation
            </button>
            <button
              type="button"
              onClick={() => { setRecCategory('course'); setRecError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium border-l border-white/10 transition-colors ${
                recCategory === 'course' ? 'bg-blue-500/15 text-blue-400' : 'text-[#6b6b6b] hover:text-[#d4d4d4]'
              }`}
            >
              <PersonStanding className="w-3.5 h-3.5" />
              Course
            </button>
          </div>

          {recCategory === 'musculation' ? (
            <>
              <Input
                label="Exercice"
                value={recTitle}
                onChange={e => { setRecTitle(e.target.value); setRecError(''); }}
                placeholder="ex: Squat, DC, Tractions…"
                maxLength={60}
                autoFocus
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Valeur"
                  value={recValue}
                  onChange={e => { setRecValue(e.target.value); setRecError(''); }}
                  placeholder="ex: 120 ou 25"
                  maxLength={20}
                />
                <div>
                  <p className="text-xs text-[#a3a3a3] uppercase tracking-wide font-medium mb-1.5">Unité</p>
                  <div className="flex rounded overflow-hidden border border-white/10 h-10">
                    {(['kg', 'reps'] as const).map((u, idx) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setRecUnit(u)}
                        className={`flex-1 text-sm font-medium transition-colors ${idx > 0 ? 'border-l border-white/10' : ''} ${
                          recUnit === u ? 'bg-[#c9a870]/15 text-[#c9a870]' : 'text-[#6b6b6b] hover:text-[#d4d4d4]'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <Input
                label="Nom de l'épreuve"
                value={recTitle}
                onChange={e => { setRecTitle(e.target.value); setRecError(''); }}
                placeholder="ex: 5 km, Semi-marathon, Trail des Crêtes…"
                maxLength={60}
                autoFocus
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Distance (km)"
                  value={recDistance}
                  onChange={e => { setRecDistance(e.target.value); setRecError(''); }}
                  placeholder="ex: 5 ou 21.1"
                  maxLength={10}
                />
                <Input
                  label="Durée"
                  value={recValue}
                  onChange={e => { setRecValue(e.target.value); setRecError(''); }}
                  placeholder="ex: 22:30 ou 1:45:00"
                  maxLength={20}
                />
              </div>
            </>
          )}

          {recError && <p className="text-xs text-red-400">{recError}</p>}
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setRecordModalOpen(false)} disabled={savingRecord}>
              Annuler
            </Button>
            <Button className="flex-1" loading={savingRecord} onClick={handleSaveRecord}>
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── EDIT MODAL ──────────────────────────────────────────────────── */}
      <Modal isOpen={editOpen} onClose={closeEdit} title="Modifier le profil" size="sm">
        <div className="p-5 space-y-5">
          {/* Photo de profil */}
          <div>
            <p className="text-xs text-[#a3a3a3] uppercase tracking-wide font-medium mb-3">Photo de profil</p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="relative w-16 h-16 rounded-full overflow-hidden border border-[#c9a870]/30 hover:border-[#c9a870]/70 bg-[#1c1c1c] flex items-center justify-center group transition-colors flex-shrink-0"
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#c9a870] font-bold text-lg">{getInitials(profile.username)}</span>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-full">
                    <div className="w-4 h-4 border-2 border-[#c9a870] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="text-sm text-[#c9a870] hover:text-[#dfc99e] transition-colors"
                >
                  Changer la photo
                </button>
                <p className="text-xs text-[#6b6b6b] mt-0.5">JPG, PNG — max 2 Mo</p>
                {avatarError && <p className="text-xs text-red-400 mt-1">{avatarError}</p>}
              </div>
            </div>
          </div>

          <div className="border-t border-white/5" />

          {/* Pseudo */}
          <Input
            label="Pseudo"
            value={editUsername}
            onChange={e => {
              setEditUsername(e.target.value);
              if (editError) setEditError('');
            }}
            placeholder="ex: john_doe42"
            error={editError}
            hint="3 à 20 caractères, lettres, chiffres ou underscore."
            maxLength={20}
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') handleSave();
            }}
          />

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={closeEdit} disabled={saving}>
              Annuler
            </Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
