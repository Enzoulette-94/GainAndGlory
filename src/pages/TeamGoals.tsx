import React, { useState, useEffect, useCallback } from 'react';
import { Swords, Plus, Trophy, Target, Calendar, Users, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase-client';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Textarea } from '../components/common/Input';
import { Select } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { ProgressBar } from '../components/common/ProgressBar';
import { Loader } from '../components/common/Loader';
import { formatDate } from '../utils/calculations';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface CommunityChallenge {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  type: 'distance' | 'tonnage' | 'sessions';
  target_value: number;
  unit: string;
  start_date: string;
  end_date: string;
  is_flash: boolean;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  creator?: { username: string };
  participations?: {
    user_id: string;
    contribution: number;
    completed: boolean;
    user?: { username: string };
  }[];
  total_contribution?: number;
}

type Tab = 'active' | 'mine' | 'create';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function daysRemaining(endDate: string): number {
  return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

function typeLabel(type: CommunityChallenge['type']): string {
  switch (type) {
    case 'distance': return 'Distance';
    case 'tonnage': return 'Tonnage';
    case 'sessions': return 'Séances';
  }
}

function typeBadgeClass(type: CommunityChallenge['type']): string {
  switch (type) {
    case 'distance': return 'bg-transparent text-blue-500 border-blue-800/50';
    case 'tonnage':  return 'bg-transparent text-red-400 border-red-800/50';
    case 'sessions': return 'bg-transparent text-green-500 border-green-800/50';
  }
}

function typeProgressColor(type: CommunityChallenge['type']): string {
  switch (type) {
    case 'distance': return 'bg-blue-800';
    case 'tonnage':  return 'bg-red-800';
    case 'sessions': return 'bg-green-800';
  }
}

function unitForType(type: string): string {
  switch (type) {
    case 'distance': return 'km';
    case 'tonnage':  return 'kg';
    case 'sessions': return 'séances';
    default: return '';
  }
}

function calcTotal(challenge: CommunityChallenge): number {
  if (challenge.total_contribution !== undefined) return challenge.total_contribution;
  return (challenge.participations ?? []).reduce((sum, p) => sum + (p.contribution ?? 0), 0);
}

// ─────────────────────────────────────────────
// ChallengeCard
// ─────────────────────────────────────────────

interface ChallengeCardProps {
  challenge: CommunityChallenge;
  userId: string | undefined;
  onJoin: (id: string) => Promise<void>;
  onContribute: (challenge: CommunityChallenge) => void;
  joiningId: string | null;
  showMyContribution?: boolean;
}

function ChallengeCard({
  challenge, userId, onJoin, onContribute, joiningId, showMyContribution = false,
}: ChallengeCardProps) {
  const total = calcTotal(challenge);
  const progress = Math.min((total / challenge.target_value) * 100, 100);
  const participants = (challenge.participations ?? []).length;
  const days = daysRemaining(challenge.end_date);
  const isParticipant = (challenge.participations ?? []).some(p => p.user_id === userId);
  const myContribution = (challenge.participations ?? []).find(p => p.user_id === userId)?.contribution ?? 0;
  const isJoining = joiningId === challenge.id;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className="p-4 space-y-4">
        {/* Header badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-xs font-rajdhani font-medium px-2 py-0.5 border ${typeBadgeClass(challenge.type)}`}>
              {challenge.type === 'distance' && <Target className="w-3 h-3" />}
              {challenge.type === 'tonnage'  && <Trophy className="w-3 h-3" />}
              {challenge.type === 'sessions' && <Calendar className="w-3 h-3" />}
              {typeLabel(challenge.type)}
            </span>
            {challenge.is_flash && (
              <span className="inline-flex items-center gap-1 text-xs font-rajdhani font-bold px-2 py-0.5 border bg-transparent text-amber-500 border-amber-700/50">
                <Zap className="w-3 h-3" />FLASH
              </span>
            )}
          </div>
          {challenge.creator && (
            <span className="text-xs text-[#6b6b6b] whitespace-nowrap">par {challenge.creator.username}</span>
          )}
        </div>

        {/* Title */}
        <div>
          <h3 className="font-rajdhani font-semibold text-[#f5f5f5] text-base tracking-wide uppercase">
            {challenge.title}
          </h3>
          {challenge.description && (
            <p className="text-sm text-[#a3a3a3] mt-1 leading-relaxed">{challenge.description}</p>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <ProgressBar value={progress} color={typeProgressColor(challenge.type)} height="sm" />
          <div className="flex justify-between text-xs text-[#a3a3a3]">
            <span>{total.toLocaleString('fr-FR')} / {challenge.target_value.toLocaleString('fr-FR')} {challenge.unit}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6b6b6b]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {participants} participant{participants !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Fin : {formatDate(challenge.end_date, { day: 'numeric', month: 'short' })}
            </span>
            {days > 0
              ? <span className="text-amber-500 font-medium">{days}j restant{days !== 1 ? 's' : ''}</span>
              : <span className="text-red-400 font-medium">Terminé</span>
            }
          </div>
        </div>

        {/* Ma contribution */}
        {showMyContribution && isParticipant && (
          <div className="border border-white/5 px-3 py-2 text-sm text-[#d4d4d4]">
            Ma contribution :{' '}
            <span className="font-rajdhani font-semibold text-[#c9a870]">
              {myContribution.toLocaleString('fr-FR')} {challenge.unit}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          {!isParticipant ? (
            <Button size="sm" variant="outline" icon={<Plus className="w-3.5 h-3.5" />}
              loading={isJoining} onClick={() => onJoin(challenge.id)} disabled={days === 0}>
              Rejoindre
            </Button>
          ) : (
            <Button size="sm" variant="secondary" icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => onContribute(challenge)} disabled={days === 0}>
              + Ajouter
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// ContributeModal
// ─────────────────────────────────────────────

function ContributeModal({ challenge, userId, onClose, onSaved }: {
  challenge: CommunityChallenge | null;
  userId: string | undefined;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (challenge) { setValue(''); setError(''); }
  }, [challenge]);

  if (!challenge) return null;

  const myContribution = (challenge.participations ?? []).find(p => p.user_id === userId)?.contribution ?? 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!challenge || !userId) return;
    const added = parseFloat(value);
    if (isNaN(added) || added <= 0) { setError('Valeur invalide.'); return; }
    setSaving(true);
    setError('');
    try {
      const { error: supaErr } = await supabase
        .from('challenge_participations')
        .update({ contribution: myContribution + added })
        .eq('challenge_id', challenge.id)
        .eq('user_id', userId);
      if (supaErr) throw supaErr;
      onSaved();
      onClose();
    } catch {
      setError('Erreur lors de la mise à jour. Réessaie.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={!!challenge} onClose={onClose} title="Ajouter une contribution" size="sm">
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <p className="text-sm text-[#a3a3a3]">
          Objectif : <span className="font-medium text-[#e5e5e5]">{challenge.title}</span>
        </p>
        <p className="text-xs text-[#6b6b6b]">
          Ta contribution actuelle :{' '}
          <span className="text-[#d4d4d4] font-medium">{myContribution.toLocaleString('fr-FR')} {challenge.unit}</span>
        </p>
        <Input
          label={`Quantité à ajouter (${challenge.unit})`}
          type="number" min="0" step="any"
          value={value} onChange={e => setValue(e.target.value)}
          placeholder="ex. 5" error={error} autoFocus
        />
        {value && !isNaN(parseFloat(value)) && parseFloat(value) > 0 && (
          <p className="text-xs text-[#6b6b6b]">
            Nouveau total :{' '}
            <span className="text-[#c9a870] font-semibold">
              {(myContribution + parseFloat(value)).toLocaleString('fr-FR')} {challenge.unit}
            </span>
          </p>
        )}
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Annuler</Button>
          <Button type="submit" loading={saving} className="flex-1">Confirmer</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// CreateForm
// ─────────────────────────────────────────────

interface CreateFormState {
  title: string;
  description: string;
  type: 'distance' | 'tonnage' | 'sessions';
  target_value: string;
  start_date: string;
  end_date: string;
}

function CreateForm({ userId, onCreated }: { userId: string; onCreated: () => void }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState<CreateFormState>({
    title: '', description: '', type: 'distance', target_value: '', start_date: today, end_date: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateFormState, string>>>({});
  const [success, setSuccess] = useState(false);

  function set<K extends keyof CreateFormState>(key: K, value: CreateFormState[K]) {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: undefined }));
    setSuccess(false);
  }

  function validate(): boolean {
    const e: Partial<Record<keyof CreateFormState, string>> = {};
    if (!form.title.trim()) e.title = 'Le titre est obligatoire.';
    const target = parseFloat(form.target_value);
    if (isNaN(target) || target <= 0) e.target_value = 'Objectif invalide.';
    if (!form.start_date) e.start_date = 'Date de début obligatoire.';
    if (!form.end_date) e.end_date = 'Date de fin obligatoire.';
    if (form.start_date && form.end_date && form.end_date <= form.start_date)
      e.end_date = 'La date de fin doit être après la date de début.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setSuccess(false);
    try {
      const { error } = await supabase.from('community_challenges').insert({
        created_by: userId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        type: form.type,
        target_value: parseFloat(form.target_value),
        unit: unitForType(form.type),
        start_date: form.start_date,
        end_date: form.end_date,
        is_flash: false,
        status: 'active',
      });
      if (error) throw error;
      setForm({ title: '', description: '', type: 'distance', target_value: '', start_date: today, end_date: '' });
      setSuccess(true);
      onCreated();
    } catch {
      setErrors({ title: 'Erreur lors de la création. Réessaie.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 border border-[#c9a870]/30">
          <Plus className="w-4 h-4 text-[#c9a870]" />
        </div>
        <h2 className="font-rajdhani font-semibold text-[#f5f5f5] tracking-wide uppercase">
          Proposer un objectif d'équipe
        </h2>
      </div>

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 border border-green-900/40 px-4 py-3 text-sm text-green-500"
        >
          Objectif créé avec succès ! Il est maintenant actif.
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Titre" placeholder="ex. 500 km collectifs en janvier"
          value={form.title} onChange={e => set('title', e.target.value)} error={errors.title} />
        <Textarea label="Description (optionnel)" placeholder="Décris l'objectif, les règles..."
          value={form.description} onChange={e => set('description', e.target.value)} rows={3} />
        <Select label="Type"
          options={[
            { value: 'distance', label: 'Distance (km)' },
            { value: 'tonnage',  label: 'Tonnage (kg)' },
            { value: 'sessions', label: 'Séances' },
          ]}
          value={form.type}
          onChange={e => set('type', e.target.value as CreateFormState['type'])}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input label={`Objectif (${unitForType(form.type)})`} type="number" min="1" step="any"
            placeholder="ex. 500" value={form.target_value}
            onChange={e => set('target_value', e.target.value)} error={errors.target_value} />
          <div className="flex items-end pb-0.5">
            <span className="text-sm text-[#a3a3a3] bg-[#1c1c1c] border border-white/8 px-4 py-2.5 w-full">
              {unitForType(form.type)}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Date de début" type="date" value={form.start_date}
            onChange={e => set('start_date', e.target.value)} error={errors.start_date} />
          <Input label="Date de fin" type="date" value={form.end_date}
            onChange={e => set('end_date', e.target.value)} error={errors.end_date} />
        </div>
        <Button type="submit" loading={saving} icon={<Plus className="w-4 h-4" />} className="w-full">
          CRÉER L'OBJECTIF
        </Button>
      </form>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────

export function TeamGoalsPage() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('active');
  const [challenges, setChallenges] = useState<CommunityChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [contributeTarget, setContributeTarget] = useState<CommunityChallenge | null>(null);

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: supaErr } = await supabase
        .from('community_challenges')
        .select(`
          *,
          creator:profiles!created_by(username),
          participations:challenge_participations(
            user_id, contribution, completed,
            user:profiles(username)
          )
        `)
        .eq('status', 'active')
        .order('end_date', { ascending: true });
      if (supaErr) throw supaErr;
      const enriched = (data ?? []).map((c: CommunityChallenge) => ({
        ...c,
        total_contribution: (c.participations ?? []).reduce((sum: number, p) => sum + (p.contribution ?? 0), 0),
      }));
      setChallenges(enriched);
    } catch {
      setError('Impossible de charger les objectifs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChallenges(); }, [fetchChallenges]);

  async function handleJoin(challengeId: string) {
    if (!profile) return;
    setJoiningId(challengeId);
    try {
      const { error: supaErr } = await supabase.from('challenge_participations').insert({
        challenge_id: challengeId, user_id: profile.id, contribution: 0,
      });
      if (supaErr) throw supaErr;
      await fetchChallenges();
    } catch {
      // silently fail
    } finally {
      setJoiningId(null);
    }
  }

  const myChallenges = challenges.filter(c =>
    (c.participations ?? []).some(p => p.user_id === profile?.id)
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'active', label: 'Objectifs actifs', icon: <Trophy className="w-4 h-4" /> },
    { id: 'mine',   label: 'Mes contributions', icon: <Target className="w-4 h-4" /> },
    { id: 'create', label: 'Créer', icon: <Plus className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="p-2.5 border border-[#c9a870]/30">
          <Swords className="w-6 h-6 text-[#c9a870]" />
        </div>
        <div>
          <h1 className="font-rajdhani text-3xl font-bold tracking-wide uppercase text-[#c9a870]">
            Objectifs de l'équipe
          </h1>
          <p className="text-[#a3a3a3] text-sm mt-0.5">Défis collectifs — rejoins la troupe</p>
        </div>
      </motion.div>

      {/* Onglets */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="flex gap-1 p-1 bg-[#0d0d0d] border border-white/5"
      >
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`
              flex-1 flex items-center justify-center gap-1.5 text-xs font-rajdhani font-semibold
              tracking-wide px-3 py-2.5 transition-colors
              ${tab === t.id
                ? 'bg-[#c9a870]/10 text-[#c9a870] border-l-2 border-[#c9a870]'
                : 'text-[#6b6b6b] hover:text-[#d4d4d4] border-l-2 border-transparent'
              }
            `}
          >
            {t.icon}
            <span className="hidden sm:inline ml-1">{t.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Contenu */}
      <AnimatePresence mode="wait">
        {/* ── Objectifs actifs ── */}
        {tab === 'active' && (
          <motion.div key="active" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="space-y-4">
            {loading && <Loader text="Chargement des objectifs..." />}
            {!loading && error && (
              <Card className="p-6 text-center">
                <p className="text-sm text-red-400">{error}</p>
                <Button variant="ghost" size="sm" onClick={fetchChallenges} className="mt-3">Réessayer</Button>
              </Card>
            )}
            {!loading && !error && challenges.length === 0 && (
              <Card className="p-10 text-center">
                <Swords className="w-12 h-12 mx-auto mb-3 text-[#4a4a4a]" />
                <p className="text-[#a3a3a3] font-medium">Aucun objectif actif pour le moment.</p>
                <p className="text-[#6b6b6b] text-sm mt-1">Sois le premier à en créer un !</p>
                <Button variant="outline" size="sm" onClick={() => setTab('create')} className="mt-4"
                  icon={<Plus className="w-3.5 h-3.5" />}>
                  Créer un objectif
                </Button>
              </Card>
            )}
            {!loading && !error && challenges.map(challenge => (
              <ChallengeCard key={challenge.id} challenge={challenge} userId={profile?.id}
                onJoin={handleJoin} onContribute={c => setContributeTarget(c)} joiningId={joiningId} />
            ))}
          </motion.div>
        )}

        {/* ── Mes contributions ── */}
        {tab === 'mine' && (
          <motion.div key="mine" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="space-y-4">
            {loading && <Loader text="Chargement..." />}
            {!loading && !profile && (
              <Card className="p-8 text-center">
                <p className="text-[#a3a3a3] text-sm">Connecte-toi pour voir tes contributions.</p>
              </Card>
            )}
            {!loading && profile && myChallenges.length === 0 && (
              <Card className="p-10 text-center">
                <Target className="w-12 h-12 mx-auto mb-3 text-[#4a4a4a]" />
                <p className="text-[#a3a3a3] font-medium">Tu ne participes à aucun objectif.</p>
                <p className="text-[#6b6b6b] text-sm mt-1">Rejoins un objectif actif pour commencer.</p>
                <Button variant="outline" size="sm" onClick={() => setTab('active')} className="mt-4">
                  Voir les objectifs
                </Button>
              </Card>
            )}
            {!loading && profile && myChallenges.map(challenge => (
              <ChallengeCard key={challenge.id} challenge={challenge} userId={profile?.id}
                onJoin={handleJoin} onContribute={c => setContributeTarget(c)}
                joiningId={joiningId} showMyContribution />
            ))}
          </motion.div>
        )}

        {/* ── Créer ── */}
        {tab === 'create' && (
          <motion.div key="create" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
            {profile
              ? <CreateForm userId={profile.id} onCreated={fetchChallenges} />
              : <Card className="p-8 text-center">
                  <p className="text-[#a3a3a3] text-sm">Connecte-toi pour créer un objectif.</p>
                </Card>
            }
          </motion.div>
        )}
      </AnimatePresence>

      <ContributeModal
        challenge={contributeTarget}
        userId={profile?.id}
        onClose={() => setContributeTarget(null)}
        onSaved={fetchChallenges}
      />
    </div>
  );
}
