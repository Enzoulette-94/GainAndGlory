import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dumbbell, PersonStanding, Zap, Flame, Plus, Trash2,
  ChevronUp, ChevronDown, Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { hybridService } from '../services/hybrid.service';
import { xpService } from '../services/xp.service';
import { feedService } from '../services/feed.service';
import { notificationService } from '../services/notification.service';
import { badgesService } from '../services/badges.service';
import { workoutService } from '../services/workout.service';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input, Textarea } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { BadgeUnlockModal } from '../components/xp-system/BadgeUnlockModal';
import { LevelUpModal } from '../components/xp-system/LevelUpModal';
import { MuscuBlockForm, buildMuscuSets } from '../components/forms/MuscuBlockForm';
import { CaliBlockForm, flattenToCaliExercises } from '../components/forms/CaliBlockForm';
import { CrossfitBlockForm, flattenCrossfitExercises } from '../components/forms/CrossfitBlockForm';
import { RunBlockForm } from '../components/forms/RunBlockForm';
import type { MuscuBlockFormData } from '../components/forms/MuscuBlockForm';
import type { CaliBlockFormData } from '../components/forms/CaliBlockForm';
import type { CrossfitBlockFormData } from '../components/forms/CrossfitBlockForm';
import type { RunBlockFormData } from '../components/forms/RunBlockForm';
import { XP_REWARDS, FEEDBACK_LABELS } from '../utils/constants';
import type {
  HybridBlock, HybridRunBlock, HybridMusculationBlock, HybridCalisthenicsBlock,
  HybridCrossfitBlock, HybridMusculationExercise, HybridCaliExercise, UserBadge,
} from '../types/models';
import type { Feedback } from '../types/enums';

// ─── Block type selector ──────────────────────────────────────────────────────

const BLOCK_TYPES = [
  { id: 'running', label: 'Course', icon: <PersonStanding className="w-5 h-5" />, color: 'text-blue-400', border: 'border-blue-900/50', bg: 'bg-blue-950/20', hoverBg: 'hover:bg-blue-900/30 hover:border-blue-700/60' },
  { id: 'musculation', label: 'Musculation', icon: <Dumbbell className="w-5 h-5" />, color: 'text-red-400', border: 'border-red-900/50', bg: 'bg-red-950/20', hoverBg: 'hover:bg-red-900/30 hover:border-red-700/60' },
  { id: 'calisthenics', label: 'Calisthénie', icon: <Zap className="w-5 h-5" />, color: 'text-violet-400', border: 'border-violet-900/50', bg: 'bg-violet-950/20', hoverBg: 'hover:bg-violet-900/30 hover:border-violet-700/60' },
  { id: 'crossfit', label: 'Crossfit', icon: <Flame className="w-5 h-5" />, color: 'text-orange-400', border: 'border-orange-900/50', bg: 'bg-orange-950/20', hoverBg: 'hover:bg-orange-900/30 hover:border-orange-700/60' },
] as const;

type BlockTypeId = typeof BLOCK_TYPES[number]['id'];

function getBlockTypeConfig(type: BlockTypeId) {
  return BLOCK_TYPES.find(b => b.id === type)!;
}

// ─── UIBlock types ────────────────────────────────────────────────────────────

type UIBlock =
  | { uiType: 'running'; id: string; data: RunBlockFormData }
  | { uiType: 'musculation'; id: string; data: MuscuBlockFormData }
  | { uiType: 'calisthenics'; id: string; data: CaliBlockFormData }
  | { uiType: 'crossfit'; id: string; data: CrossfitBlockFormData };

function defaultBlockData(type: BlockTypeId): UIBlock {
  const id = Math.random().toString(36).slice(2);
  switch (type) {
    case 'running':
      return { uiType: 'running', id, data: { distance: 0, durationSeconds: 0, runType: '', runLocation: '', pace: 0, speed: 0 } };
    case 'musculation':
      return { uiType: 'musculation', id, data: { items: [], totalTonnage: 0 } };
    case 'calisthenics':
      return { uiType: 'calisthenics', id, data: { items: [] } };
    case 'crossfit':
      return { uiType: 'crossfit', id, data: { wodType: '', items: [], totalDuration: '', roundDuration: '', targetRounds: '', resultTime: '', resultReps: '', resultRounds: '', benchmarkName: '' } };
  }
}

function uiBlockToHybridBlock(block: UIBlock): HybridBlock {
  switch (block.uiType) {
    case 'running': {
      const d = block.data;
      return {
        blockType: 'running', id: block.id,
        distance: d.distance,
        duration: d.durationSeconds,
        runType: d.runType,
        notes: '',
      } satisfies HybridRunBlock;
    }
    case 'musculation': {
      const sets = buildMuscuSets(block.data.items);
      const exercises: HybridMusculationExercise[] = [];
      const seen = new Map<string, HybridMusculationExercise>();
      const circuits: HybridMusculationBlock['circuits'] = [];
      for (const item of block.data.items) {
        if (item.itemType === 'exercise' && item.exercise) {
          const key = item.exercise.id;
          if (!seen.has(key)) {
            const ex: HybridMusculationExercise = { id: item.exercise.id, name: item.exercise.name, sets: [] };
            seen.set(key, ex);
            exercises.push(ex);
          }
          seen.get(key)!.sets.push(...item.sets.map(s => ({ reps: s.reps, weight: s.weight })));
        } else if (item.itemType === 'circuit') {
          circuits!.push({
            name: item.name,
            rounds: item.rounds,
            exercises: item.exercises.filter(e => e.exercise).map(e => e.exercise!.name),
          });
          for (const ex of item.exercises) {
            if (!ex.exercise) continue;
            const key = ex.exercise.id;
            if (!seen.has(key)) {
              const hexer: HybridMusculationExercise = { id: ex.exercise.id, name: ex.exercise.name, sets: [] };
              seen.set(key, hexer);
              exercises.push(hexer);
            }
            seen.get(key)!.sets.push(...ex.sets.map(s => ({ reps: s.reps, weight: s.weight })));
          }
        }
      }
      return {
        blockType: 'musculation', id: block.id,
        exercises,
        circuits: circuits!.length > 0 ? circuits : undefined,
        notes: '',
      } satisfies HybridMusculationBlock;
    }
    case 'calisthenics': {
      const caliExercises = flattenToCaliExercises(block.data.items);
      const caliCircuits: HybridCalisthenicsBlock['circuits'] = block.data.items
        .filter((item) => (item as any).itemType === 'circuit')
        .map((c: any) => ({
          name: c.name,
          rounds: c.rounds,
          exercises: c.exercises.filter((e: any) => 'name' in e && e.name?.trim()).map((e: any) => e.name.trim()),
        }));
      return {
        blockType: 'calisthenics', id: block.id,
        exercises: caliExercises.map(ex => ({
          id: Math.random().toString(36).slice(2),
          name: ex.name,
          sets: ex.sets.length,
          reps: ex.set_type === 'reps' ? (ex.sets.reduce((s, r) => s + (r.reps ?? 0), 0) / Math.max(ex.sets.length, 1)) | 0 : 0,
        })) satisfies HybridCaliExercise[],
        circuits: caliCircuits.length > 0 ? caliCircuits : undefined,
        notes: '',
      } satisfies HybridCalisthenicsBlock;
    }
    case 'crossfit': {
      const crossfitExercises = flattenCrossfitExercises(block.data.items);
      return {
        blockType: 'crossfit', id: block.id,
        wodType: block.data.wodType,
        duration: block.data.totalDuration ? parseInt(block.data.totalDuration) : 0,
        exercises: crossfitExercises.map(e => ({ id: Math.random().toString(36).slice(2), name: e.name })),
        notes: '',
      } satisfies HybridCrossfitBlock;
    }
  }
}

function xpForBlock(type: BlockTypeId): number {
  switch (type) {
    case 'running': return XP_REWARDS.RUNNING_SESSION;
    case 'musculation': return XP_REWARDS.WORKOUT_SESSION;
    case 'calisthenics': return XP_REWARDS.CALISTHENICS_SESSION;
    case 'crossfit': return XP_REWARDS.CROSSFIT_SESSION;
  }
}

function blockSummary(block: UIBlock): string {
  switch (block.uiType) {
    case 'running':
      return block.data.distance > 0 ? `${block.data.distance} km` : 'Course';
    case 'musculation': {
      const count = block.data.items.filter(i => i.itemType === 'exercise' && i.exercise).length;
      return `${count} exercice(s)`;
    }
    case 'calisthenics': {
      const count = block.data.items.filter(i => i.itemType === 'exercise' && (i as any).name).length;
      return `${count} exercice(s)`;
    }
    case 'crossfit':
      return block.data.wodType ? block.data.wodType.toUpperCase() : 'Crossfit';
  }
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function HybridSessionPage() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [sessionName, setSessionName] = useState('');
  const [globalNotes, setGlobalNotes] = useState('');
  const [feedback, setFeedback] = useState<Feedback | ''>('');
  const [blocks, setBlocks] = useState<UIBlock[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [badgeQueue, setBadgeQueue] = useState<UserBadge[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState(0);
  const [levelUpDiscipline, setLevelUpDiscipline] = useState<'musculation' | 'running' | 'calisthenics' | 'crossfit'>('musculation');

  // Keep refs of per-block data to avoid stale closure in handlers
  const blockDataRefs = useRef<Map<string, UIBlock['data']>>(new Map());

  const totalXP = blocks.reduce((sum, b) => sum + xpForBlock(b.uiType), 0) + (blocks.length >= 2 ? XP_REWARDS.HYBRID_SESSION_BONUS : 0);

  // ── Block management ─────────────────────────────────────────────────────────

  function addBlock(type: BlockTypeId) {
    const newBlock = defaultBlockData(type);
    blockDataRefs.current.set(newBlock.id, newBlock.data);
    setBlocks(prev => [...prev, newBlock]);
    setShowTypeModal(false);
  }

  function removeBlock(id: string) {
    blockDataRefs.current.delete(id);
    setBlocks(prev => prev.filter(b => b.id !== id));
  }

  function moveBlock(id: string, dir: 'up' | 'down') {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      const to = dir === 'up' ? idx - 1 : idx + 1;
      if (to < 0 || to >= next.length) return prev;
      [next[idx], next[to]] = [next[to], next[idx]];
      return next;
    });
  }

  const updateBlockData = useCallback((id: string, data: UIBlock['data']) => {
    blockDataRefs.current.set(id, data);
  }, []);

  // ── Soumission ───────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    if (blocks.length < 2) { setError('Ajoute au moins 2 blocs d\'activité.'); return; }

    // Build hybrid blocks from current state (use refs for latest form data)
    const currentBlocks = blocks.map(b => ({
      ...b,
      data: blockDataRefs.current.get(b.id) ?? b.data,
    } as UIBlock));
    const hybridBlocks = currentBlocks.map(uiBlockToHybridBlock);
    setSaving(true);
    setError(null);

    try {
      const session = await hybridService.createSession({
        userId: profile.id,
        date: new Date(date).toISOString(),
        name: sessionName.trim() || undefined,
        notes: globalNotes.trim() || undefined,
        feedback: feedback || undefined,
        blocks: hybridBlocks,
      });

      let lastXpResult = null;
      let lastDiscipline: 'musculation' | 'running' | 'calisthenics' | 'crossfit' = 'musculation';
      for (const block of blocks) {
        const discipline = block.uiType as 'musculation' | 'running' | 'calisthenics' | 'crossfit';
        const actionMap: Record<string, keyof typeof XP_REWARDS> = {
          running: 'RUNNING_SESSION', musculation: 'WORKOUT_SESSION',
          calisthenics: 'CALISTHENICS_SESSION', crossfit: 'CROSSFIT_SESSION',
        };
        lastXpResult = await xpService.awardXP(profile.id, actionMap[block.uiType], discipline);
        lastDiscipline = discipline;
      }
      await refreshProfile();

      await feedService.publishHybrid(
        profile.id, hybridBlocks, feedback || undefined, session.id, sessionName.trim() || undefined,
      );

      notificationService.broadcastToAll(profile.id, 'new_session', {
        message: `🏆 ${profile.username} vient de terminer une session hybride (${blocks.length} activités) !`,
        discipline: 'musculation',
      });

      try {
        const totalSessions = await workoutService.getSessionsCount(profile.id).catch(() => 0);
        const newBadges = await badgesService.checkAndUnlockBadges(profile.id, {
          globalLevel: profile.global_level,
          currentStreak: profile.current_streak,
          totalSessions,
        });
        if (newBadges.length > 0) setBadgeQueue(newBadges);
      } catch { /* ignore */ }

      if (lastXpResult?.leveledUp && lastXpResult.newLevel) {
        setLevelUpLevel(lastXpResult.newLevel);
        setLevelUpDiscipline(lastDiscipline);
        setShowLevelUp(true);
        return;
      }
      if (badgeQueue.length > 0) return;
      navigate('/dashboard');
    } catch {
      setError('Erreur lors de l\'enregistrement. Réessaie.');
      setSaving(false);
    }
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="p-2.5 rounded bg-transparent border border-[#c9a870]/30">
          <Layers className="w-6 h-6 text-[#c9a870]" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Session hybride</h1>
          <p className="text-[#a3a3a3] text-sm mt-0.5">Combiner plusieurs activités en une session</p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Infos générales */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-4 space-y-3">
            <Input label="Titre (optionnel)" placeholder="ex. Matin sport complet..." value={sessionName} onChange={e => setSessionName(e.target.value)} />
            <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </Card>
        </motion.div>

        {/* Blocs d'activité */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#a3a3a3] uppercase tracking-wider">Activités</h2>
            <span className="text-xs text-[#6b6b6b]">{blocks.length} bloc{blocks.length !== 1 ? 's' : ''}</span>
          </div>

          <AnimatePresence>
            {blocks.map((block, idx) => {
              const cfg = getBlockTypeConfig(block.uiType);
              return (
                <motion.div key={block.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.2 }}>
                  <Card className={`p-4 space-y-4 border-l-2 ${cfg.border}`}>
                    {/* Header bloc */}
                    <div className="flex items-center gap-2">
                      <span className={cfg.color}>{cfg.icon}</span>
                      <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-xs text-[#6b6b6b] flex-1">{blockSummary(block)}</span>
                      <button type="button" onClick={() => moveBlock(block.id, 'up')} disabled={idx === 0} className="p-1 text-[#6b6b6b] hover:text-[#d4d4d4] disabled:opacity-30 transition-colors"><ChevronUp className="w-4 h-4" /></button>
                      <button type="button" onClick={() => moveBlock(block.id, 'down')} disabled={idx === blocks.length - 1} className="p-1 text-[#6b6b6b] hover:text-[#d4d4d4] disabled:opacity-30 transition-colors"><ChevronDown className="w-4 h-4" /></button>
                      <button type="button" onClick={() => removeBlock(block.id)} title="Supprimer le bloc" className="p-1 text-[#6b6b6b] hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>

                    {/* Full form selon le type */}
                    {block.uiType === 'running' && (
                      <RunBlockForm
                        key={block.id}
                        onChange={data => updateBlockData(block.id, data)}
                      />
                    )}

                    {block.uiType === 'musculation' && (
                      <MuscuBlockForm
                        key={block.id}
                        onChange={data => updateBlockData(block.id, data)}
                      />
                    )}

                    {block.uiType === 'calisthenics' && (
                      <CaliBlockForm
                        key={block.id}
                        onChange={data => updateBlockData(block.id, data)}
                      />
                    )}

                    {block.uiType === 'crossfit' && (
                      <CrossfitBlockForm
                        key={block.id}
                        onChange={data => updateBlockData(block.id, data)}
                      />
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Ajouter un bloc */}
          <Button type="button" variant="outline" icon={<Plus className="w-4 h-4" />} onClick={() => setShowTypeModal(true)} className="w-full border-[#c9a870]/30 text-[#c9a870] hover:border-[#c9a870]/60">
            Ajouter une activité
          </Button>
        </div>

        {/* Feedback global */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-4 space-y-3">
            <label className="text-sm font-semibold text-[#d4d4d4]">Ressenti global</label>
            <div className="flex gap-3">
              {(Object.entries(FEEDBACK_LABELS) as [Feedback, string][]).map(([value, label]) => (
                <button key={value} type="button" onClick={() => setFeedback(prev => prev === value ? '' : value)}
                  className={`flex-1 py-2.5 px-3 rounded text-sm font-medium border transition-all ${feedback === value ? 'bg-[#c9a870]/20 border-[#c9a870]/50 text-[#c9a870]' : 'bg-[#1c1c1c] border-white/8 text-[#a3a3a3] hover:border-white/10 hover:text-[#e5e5e5]'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Notes globales */}
        <Card className="p-4">
          <Textarea label="Notes globales (optionnel)" placeholder="Impressions sur la session..." value={globalNotes} onChange={e => setGlobalNotes(e.target.value)} rows={2} />
        </Card>

        {/* XP preview */}
        {blocks.length > 0 && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs text-[#c9a870] font-bold">+{totalXP} XP</span>
            <span className="text-xs text-[#6b6b6b]">
              {blocks.map(b => `${b.uiType} (${xpForBlock(b.uiType)} XP)`).join(' + ')}
              {blocks.length >= 2 && ` + ${XP_REWARDS.HYBRID_SESSION_BONUS} XP bonus hybride`}
            </span>
          </div>
        )}

        {error && (
          <Card className="p-3 bg-transparent border-red-500/25">
            <p className="text-sm text-red-400 text-center">{error}</p>
          </Card>
        )}

        {/* Submit */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="pb-6">
          <Button type="submit" size="lg" loading={saving} className="w-full" icon={<Layers className="w-5 h-5" />}>
            {saving ? 'Enregistrement...' : 'Enregistrer la session'}
          </Button>
        </motion.div>
      </form>

      {/* Modal choix type */}
      <Modal isOpen={showTypeModal} onClose={() => setShowTypeModal(false)} title="Choisir une activité" size="sm">
        <div className="p-4 grid grid-cols-2 gap-3">
          {BLOCK_TYPES.map(bt => (
            <button
              key={bt.id}
              onClick={() => addBlock(bt.id)}
              className={`flex flex-col items-center gap-2 p-4 border rounded-xl transition-all ${bt.border} ${bt.bg} ${bt.hoverBg}`}
            >
              <span className={bt.color}>{bt.icon}</span>
              <span className={`text-sm font-semibold ${bt.color}`}>{bt.label}</span>
            </button>
          ))}
        </div>
      </Modal>

      <LevelUpModal isOpen={showLevelUp} level={levelUpLevel} discipline={levelUpDiscipline} onClose={() => { setShowLevelUp(false); if (badgeQueue.length === 0) navigate('/dashboard'); }} />
      <BadgeUnlockModal badge={badgeQueue[0] ?? null} onClose={() => {
        setBadgeQueue(prev => { const next = prev.slice(1); if (next.length === 0) navigate('/dashboard'); return next; });
      }} />
    </div>
  );
}
