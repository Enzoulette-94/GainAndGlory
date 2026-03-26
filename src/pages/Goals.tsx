import React, { useState, useEffect, useCallback } from 'react';
import {
  Target,
  Plus,
  Dumbbell,
  PersonStanding,
  Scale,
  Trash2,
  CheckCircle2,
  Pencil,
  AlertCircle,
  CalendarClock,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input, Textarea, Select } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { ProgressBar } from '../components/common/ProgressBar';

import { goalsService } from '../services/goals.service';
import { xpService } from '../services/xp.service';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/calculations';
import type { PersonalGoal, GoalType, GoalStatus } from '../types/models';

// ============================================================
// TYPES LOCAUX
// ============================================================

type TabType = 'active' | 'completed' | 'cancelled';

interface CreateGoalForm {
  type: GoalType;
  title: string;
  description: string;
  target_value: string;
  current_value: string;
  unit: string;
  deadline: string;
}

// ============================================================
// HELPERS
// ============================================================

const GOAL_TYPE_OPTIONS = [
  { value: 'musculation', label: 'Musculation' },
  { value: 'running', label: 'Course' },
  { value: 'weight', label: 'Poids' },
];

const GOAL_TYPE_ICONS: Record<GoalType, React.ReactNode> = {
  musculation: <Dumbbell className="w-5 h-5" />,
  running: <PersonStanding className="w-5 h-5" />,
  weight: <Scale className="w-5 h-5" />,
  calisthenics: <span className="text-base">⚡</span>,
};

const GOAL_TYPE_COLORS: Record<GoalType, string> = {
  musculation: 'text-red-400 bg-transparent border-red-800/50',
  running: 'text-emerald-600 bg-transparent border-emerald-800/40',
  weight: 'text-orange-600 bg-transparent border-orange-800/40',
  calisthenics: 'text-violet-400 bg-transparent border-violet-800/50',
};

const GOAL_TYPE_BAR_COLORS: Record<GoalType, string> = {
  musculation: 'bg-red-500',
  running: 'bg-emerald-800',
  weight: 'bg-orange-800',
  calisthenics: 'bg-violet-600',
};

const STATUS_TAB_LABELS: Record<TabType, string> = {
  active: 'Actifs',
  completed: 'Complétés',
  cancelled: 'Annulés',
};

function calcProgress(goal: PersonalGoal): number {
  if (!goal.target_value || goal.target_value <= 0) return 0;
  return Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
}

function isOverdue(deadline: string | null): boolean {
  if (!deadline) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(deadline);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

// ============================================================
// TOAST SIMPLE
// ============================================================

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onDismiss: () => void;
}

function Toast({ message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-[calc(100vw-2rem)]
        flex items-center gap-2.5 px-5 py-3 rounded shadow-2xl
        border text-sm font-medium
        ${type === 'success'
          ? 'bg-emerald-900/60 border-emerald-800/60 text-emerald-600'
          : 'bg-red-900/90 border-red-700/60 text-red-200'
        }
      `}
    >
      {type === 'success'
        ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
      }
      {message}
    </motion.div>
  );
}

// ============================================================
// GOAL CARD
// ============================================================

interface GoalCardProps {
  goal: PersonalGoal;
  onUpdate: (goal: PersonalGoal) => void;
  onComplete: (goalId: string) => void;
  onCancel: (goalId: string) => void;
}

function GoalCard({ goal, onUpdate, onComplete, onCancel }: GoalCardProps) {
  const progress = calcProgress(goal);
  const overdue = isOverdue(goal.deadline);
  const hasTarget = goal.target_value !== null && goal.target_value > 0;
  const iconClass = GOAL_TYPE_COLORS[goal.type];
  const barColor = GOAL_TYPE_BAR_COLORS[goal.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="p-4">
        <div className="flex items-start gap-3">
          {/* Icône type */}
          <div className={`p-2 rounded border shrink-0 ${iconClass}`}>
            {GOAL_TYPE_ICONS[goal.type]}
          </div>

          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-[#f5f5f5] truncate">{goal.title}</h3>
                {goal.description && (
                  <p className="text-xs text-[#a3a3a3] mt-0.5 line-clamp-2">{goal.description}</p>
                )}
              </div>

              {/* Bouton annuler */}
              {goal.status === 'active' && (
                <button
                  onClick={() => onCancel(goal.id)}
                  className="p-1.5 rounded-lg hover:bg-transparent text-[#6b6b6b] hover:text-red-400 transition-colors shrink-0"
                  aria-label="Annuler l'objectif"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Barre de progression */}
            {hasTarget && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[#a3a3a3]">
                    {goal.current_value} / {goal.target_value}{goal.unit ? ` ${goal.unit}` : ''}
                  </span>
                  <span className="text-xs font-semibold text-[#d4d4d4]">{progress}%</span>
                </div>
                <ProgressBar
                  value={progress}
                  color={barColor}
                  height="sm"
                  animated
                />
              </div>
            )}

            {/* Date limite */}
            {goal.deadline && (
              <div className={`flex items-center gap-1.5 mt-2.5 text-xs font-medium ${overdue ? 'text-red-400' : 'text-[#a3a3a3]'}`}>
                <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                {overdue
                  ? <span>Échéance dépassée · {formatDate(goal.deadline)}</span>
                  : <span>Échéance : {formatDate(goal.deadline)}</span>
                }
                {overdue && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-md bg-transparent border border-red-800/50 text-red-400 text-xs uppercase tracking-wide font-bold">
                    En retard
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            {goal.status === 'active' && (
              <div className="flex items-center gap-2 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Pencil className="w-3.5 h-3.5" />}
                  onClick={() => onUpdate(goal)}
                  className="text-xs"
                >
                  Mettre à jour
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  onClick={() => onComplete(goal.id)}
                  className="text-xs"
                >
                  Compléter
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================

const INITIAL_CREATE_FORM: CreateGoalForm = {
  type: 'musculation',
  title: '',
  description: '',
  target_value: '',
  current_value: '',
  unit: '',
  deadline: '',
};

export function GoalsPage() {
  const { user, profile, refreshProfile } = useAuth();

  // State données
  const [goals, setGoals] = useState<PersonalGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // State UI
  const [visibleSections, setVisibleSections] = useState<Set<TabType>>(new Set(['active']));
  const toggleSection = (tab: TabType) =>
    setVisibleSections(prev => { const n = new Set(prev); n.has(tab) ? n.delete(tab) : n.add(tab); return n; });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<PersonalGoal | null>(null);
  const [newProgressValue, setNewProgressValue] = useState('');

  // State formulaire création
  const [createForm, setCreateForm] = useState<CreateGoalForm>(INITIAL_CREATE_FORM);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // State actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // State toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ── Chargement ──────────────────────────────────────────────
  const loadGoals = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await goalsService.getGoals(user.id);
      setGoals(data);
    } catch {
      showToast('Impossible de charger les objectifs.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  // ── Toast ────────────────────────────────────────────────────
  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
  }

  // ── Stats ────────────────────────────────────────────────────
  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');
  const cancelledGoals = goals.filter((g) => g.status === 'cancelled');

  const tabGoals: Record<TabType, PersonalGoal[]> = {
    active: activeGoals,
    completed: completedGoals,
    cancelled: cancelledGoals,
  };

  // ── Création ─────────────────────────────────────────────────
  function openCreateModal() {
    setCreateForm(INITIAL_CREATE_FORM);
    setCreateError(null);
    setShowCreateModal(true);
  }

  async function handleCreate() {
    if (!user) return;
    if (!createForm.title.trim()) {
      setCreateError('Le titre est obligatoire.');
      return;
    }

    setCreateLoading(true);
    setCreateError(null);
    try {
      const newGoal = await goalsService.createGoal({
        user_id: user.id,
        type: createForm.type,
        title: createForm.title.trim(),
        description: createForm.description.trim() || undefined,
        target_value: createForm.target_value ? parseFloat(createForm.target_value) : undefined,
        current_value: createForm.current_value ? parseFloat(createForm.current_value) : 0,
        unit: createForm.unit.trim() || undefined,
        deadline: createForm.deadline || undefined,
      });
      setGoals((prev) => [newGoal, ...prev]);
      setShowCreateModal(false);
      showToast('Objectif créé !', 'success');
    } catch {
      setCreateError('Erreur lors de la création. Réessaie.');
    } finally {
      setCreateLoading(false);
    }
  }

  // ── Mise à jour progression ───────────────────────────────────
  function openUpdateModal(goal: PersonalGoal) {
    setSelectedGoal(goal);
    setNewProgressValue(String(goal.current_value));
    setShowUpdateModal(true);
  }

  async function handleUpdateProgress() {
    if (!selectedGoal) return;
    const value = parseFloat(newProgressValue);
    if (isNaN(value) || value < 0) return;

    setActionLoading(selectedGoal.id + '-update');
    try {
      const updated = await goalsService.updateProgress(selectedGoal.id, value);
      setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      setShowUpdateModal(false);
      showToast('Progression mise à jour !', 'success');
    } catch {
      showToast('Erreur lors de la mise à jour.', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  // ── Complétion ────────────────────────────────────────────────
  async function handleComplete(goalId: string) {
    if (!user) return;
    setActionLoading(goalId + '-complete');
    try {
      const updated = await goalsService.completeGoal(goalId);
      setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));

      // Attribuer XP
      const result = await xpService.awardXP(user.id, 'PERSONAL_GOAL_COMPLETED');
      await refreshProfile();
      const msg = result.leveledUp
        ? `Objectif accompli ! +${result.xpGained} XP - Niveau ${result.newLevel} !`
        : `Objectif accompli ! +${result.xpGained} XP`;
      showToast(msg, 'success');
    } catch {
      showToast("Erreur lors de la complétion de l'objectif.", 'error');
    } finally {
      setActionLoading(null);
    }
  }

  // ── Annulation ────────────────────────────────────────────────
  async function handleCancel(goalId: string) {
    if (!window.confirm('Annuler cet objectif ? Tu pourras le retrouver dans "Annulés".')) return;
    setActionLoading(goalId + '-cancel');
    try {
      const updated = await goalsService.cancelGoal(goalId);
      setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      showToast('Objectif annulé.', 'success');
    } catch {
      showToast("Erreur lors de l'annulation.", 'error');
    } finally {
      setActionLoading(null);
    }
  }

  // ── Rendu ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden -mx-4 px-6 py-8 sm:mx-0 sm:px-8"
        style={{ background: 'linear-gradient(135deg, #080808 0%, #0e0a00 50%, #080808 100%)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a870]/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a870]/20 to-transparent" />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none select-none">
          <Target className="w-44 h-44 text-[#c9a870]" />
        </div>

        <div className="relative flex flex-col items-center text-center gap-3">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            className="flex items-center justify-center w-14 h-14 border-2 border-[#c9a870]/40 bg-[#c9a870]/5"
          >
            <Target className="w-7 h-7 text-[#c9a870]" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1
              className="font-rajdhani font-black uppercase leading-none tracking-[0.25em]"
              style={{
                fontSize: 'clamp(1.8rem, 7vw, 3.5rem)',
                background: 'linear-gradient(180deg, #f5d990 0%, #c9a870 45%, #8b6f47 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Objectifs
            </h1>
            <div className="flex items-center justify-center gap-3 mt-2">
              <div className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-transparent to-[#c9a870]/40" />
              <p className="text-[10px] text-[#8b6f47] uppercase tracking-[0.3em] font-rajdhani font-bold">
                Forge ta destinée — un objectif à la fois
              </p>
              <div className="h-px flex-1 max-w-[60px] bg-gradient-to-l from-transparent to-[#c9a870]/40" />
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#c9a870]/50 bg-[#c9a870]/10 text-[#c9a870] text-xs font-rajdhani font-bold uppercase tracking-widest hover:bg-[#c9a870]/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouvel objectif
          </motion.button>
        </div>
      </motion.div>

      {/* ── Stats 3 cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-3"
      >
        <Card className="p-4 text-center">
          <p className="text-2xl font-black text-[#c9a870]">{activeGoals.length}</p>
          <p className="text-xs text-[#a3a3a3] mt-1"><strong>Actifs</strong></p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-black text-emerald-600">{completedGoals.length}</p>
          <p className="text-xs text-[#a3a3a3] mt-1"><strong>Complétés</strong></p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-black text-[#6b6b6b]">{cancelledGoals.length}</p>
          <p className="text-xs text-[#a3a3a3] mt-1"><em>Annulés</em></p>
        </Card>
      </motion.div>

      {/* ── Sections accordéon ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-white/5 bg-[#111111] p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded bg-slate-700/50" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-700/50 rounded w-1/2" />
                  <div className="h-3 bg-slate-700/50 rounded w-3/4" />
                  <div className="h-2 bg-slate-700/50 rounded w-full mt-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {(['active', 'completed', 'cancelled'] as TabType[]).map((tab) => {
            const open = visibleSections.has(tab);
            return (
              <div key={tab}>
                {/* En-tête toggle */}
                <button
                  onClick={() => toggleSection(tab)}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 border transition-all duration-200
                    ${open
                      ? 'bg-red-700/20 border-red-700/50 text-white'
                      : 'bg-[#111] border-white/5 text-[#6b6b6b] hover:text-[#d4d4d4] hover:border-white/10'
                    }
                  `}
                >
                  <span className="font-rajdhani font-bold text-sm uppercase tracking-widest">
                    {STATUS_TAB_LABELS[tab]}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 font-bold ${open ? 'bg-red-700 text-white' : 'bg-slate-800 text-[#5a5a5a]'}`}>
                      {tabGoals[tab].length}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Contenu */}
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 space-y-3">
                        {tabGoals[tab].length === 0 ? (
                          <Card className="p-8 text-center">
                            <Target className="w-10 h-10 mx-auto mb-3 text-[#4a4a4a]" />
                            <p className="text-[#a3a3a3] text-sm">
                              {tab === 'active' && 'Aucun objectif actif. Crée-en un !'}
                              {tab === 'completed' && "Aucun objectif complété pour l'instant."}
                              {tab === 'cancelled' && 'Aucun objectif annulé.'}
                            </p>
                            {tab === 'active' && (
                              <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openCreateModal} className="mt-3">
                                Nouvel objectif
                              </Button>
                            )}
                          </Card>
                        ) : (
                          tabGoals[tab].map((goal) => (
                            <GoalCard key={goal.id} goal={goal} onUpdate={openUpdateModal} onComplete={handleComplete} onCancel={handleCancel} />
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal : Nouvel objectif ── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouvel objectif"
        size="md"
      >
        <div className="p-5 space-y-4">
          <Select
            label="Type"
            options={GOAL_TYPE_OPTIONS}
            value={createForm.type}
            onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value as GoalType }))}
          />

          <Input
            label="Titre *"
            placeholder="Ex: Courir un semi-marathon"
            value={createForm.title}
            onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
          />

          <Textarea
            label="Description (optionnel)"
            placeholder="Détaille ton objectif..."
            rows={2}
            value={createForm.description}
            onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Valeur cible"
              type="number"
              min="0"
              step="any"
              placeholder="Ex: 50"
              value={createForm.target_value}
              onChange={(e) => setCreateForm((f) => ({ ...f, target_value: e.target.value }))}
            />
            <Input
              label="Valeur actuelle"
              type="number"
              min="0"
              step="any"
              placeholder="Ex: 0"
              value={createForm.current_value}
              onChange={(e) => setCreateForm((f) => ({ ...f, current_value: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Unité"
              placeholder="km, kg, reps..."
              value={createForm.unit}
              onChange={(e) => setCreateForm((f) => ({ ...f, unit: e.target.value }))}
            />
            <Input
              label="Date limite (optionnel)"
              type="date"
              value={createForm.deadline}
              onChange={(e) => setCreateForm((f) => ({ ...f, deadline: e.target.value }))}
            />
          </div>

          {createError && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {createError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateModal(false)}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={createLoading}
              onClick={handleCreate}
            >
              Créer
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal : Mise à jour progression ── */}
      <Modal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        title="Mettre à jour la progression"
        size="sm"
      >
        {selectedGoal && (
          <div className="p-5 space-y-4">
            {/* Récapitulatif objectif */}
            <div className={`flex items-center gap-3 p-3 rounded border ${GOAL_TYPE_COLORS[selectedGoal.type]}`}>
              {GOAL_TYPE_ICONS[selectedGoal.type]}
              <div>
                <p className="font-semibold text-[#f5f5f5] text-sm">{selectedGoal.title}</p>
                {selectedGoal.target_value !== null && (
                  <p className="text-xs text-[#a3a3a3] mt-0.5">
                    Objectif : {selectedGoal.target_value}{selectedGoal.unit ? ` ${selectedGoal.unit}` : ''}
                  </p>
                )}
              </div>
            </div>

            <Input
              label={`Nouvelle valeur actuelle${selectedGoal.unit ? ` (${selectedGoal.unit})` : ''}`}
              type="number"
              min="0"
              step="any"
              value={newProgressValue}
              onChange={(e) => setNewProgressValue(e.target.value)}
              autoFocus
            />

            {selectedGoal.target_value !== null && newProgressValue !== '' && (
              <div>
                <ProgressBar
                  value={Math.min(100, Math.round((parseFloat(newProgressValue) / selectedGoal.target_value) * 100))}
                  color={GOAL_TYPE_BAR_COLORS[selectedGoal.type]}
                  height="sm"
                  showLabel
                  animated
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUpdateModal(false)}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={actionLoading === (selectedGoal.id + '-update')}
                onClick={handleUpdateProgress}
              >
                Valider
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <Toast
            key="toast"
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
