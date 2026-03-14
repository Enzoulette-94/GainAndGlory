import React, { useState, useEffect } from 'react';
import { Bookmark, Dumbbell, PersonStanding, Zap, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { savedSessionsService, type SavedSession } from '../services/saved-sessions.service';
import { Card } from '../components/common/Card';
import { Loader } from '../components/common/Loader';
import { formatDate } from '../utils/calculations';

type Tab = 'workout' | 'run' | 'calisthenics';

const TABS: { id: Tab; label: string; icon: React.ReactNode; color: string; border: string }[] = [
  { id: 'workout',      label: 'Musculation', icon: <Dumbbell className="w-4 h-4" />,        color: 'text-red-400',    border: 'border-red-700/50'    },
  { id: 'run',          label: 'Course',      icon: <PersonStanding className="w-4 h-4" />,   color: 'text-blue-400',   border: 'border-blue-700/50'   },
  { id: 'calisthenics', label: 'Calisthénie', icon: <Zap className="w-4 h-4" />,              color: 'text-violet-400', border: 'border-violet-700/50' },
];

function SessionCard({ session, onDelete }: { session: SavedSession; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const name = session.custom_name ?? session.original_name ?? 'Séance sans nom';
  const tab = TABS.find(t => t.id === session.type)!;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="border border-white/5 bg-[#0f0f0f]"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`flex-shrink-0 ${tab.color}`}>{tab.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="font-rajdhani font-bold text-[#f5f5f5] text-sm tracking-wide truncate">{name}</p>
          <p className="text-[10px] text-[#6b6b6b] mt-0.5">
            {session.source_username && <span className="text-[#a3a3a3]">par {session.source_username} · </span>}
            {formatDate(session.saved_at, { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-[#6b6b6b] hover:text-[#f5f5f5] transition-colors p-1"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="text-[#6b6b6b] hover:text-red-400 transition-colors p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={onDelete}
                className="text-xs font-rajdhani font-bold text-red-400 border border-red-700/50 px-2 py-0.5 hover:bg-red-900/20 transition-colors"
              >
                Oui
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="text-xs font-rajdhani font-bold text-[#6b6b6b] border border-white/10 px-2 py-0.5 hover:bg-white/5 transition-colors"
              >
                Non
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Exercices résumés (toujours visibles) */}
      <div className="px-4 pb-3 space-y-0.5">
        {session.type === 'workout' && session.exercises.slice(0, expanded ? undefined : 3).map((ex, i) => (
          <div key={i} className="flex items-baseline gap-1.5 text-xs">
            <span className="text-[#d4d4d4] font-medium">{ex.name}</span>
            <span className="text-[#6b6b6b]">·</span>
            <span className="text-[#a3a3a3] font-rajdhani">
              {ex.sets > 1 ? `${ex.sets} × ${ex.sets > 0 ? Math.round(ex.reps / ex.sets) : ex.reps} reps` : `${ex.reps} reps`}
            </span>
            {ex.maxWeight != null && ex.maxWeight > 0 && (
              <>
                <span className="text-[#4a4a4a]">·</span>
                <span className="font-rajdhani font-bold text-[#c9a870]">{ex.maxWeight} kg</span>
              </>
            )}
          </div>
        ))}

        {session.type === 'run' && (
          <div className="text-xs text-[#a3a3a3] font-rajdhani">
            {session.exercises[0]?.distance != null && <span>{session.exercises[0].distance} km</span>}
            {session.exercises[0]?.duration != null && <span> · {Math.floor(session.exercises[0].duration / 60)} min</span>}
          </div>
        )}

        {session.type === 'calisthenics' && session.exercises.slice(0, expanded ? undefined : 3).map((ex, i) => (
          <div key={i} className="flex items-baseline gap-1.5 text-xs">
            <span className="text-[#d4d4d4] font-medium">{ex.name}</span>
            {ex.reps > 0 && (
              <>
                <span className="text-[#6b6b6b]">·</span>
                <span className="text-[#a3a3a3] font-rajdhani">{ex.reps} reps</span>
              </>
            )}
          </div>
        ))}

        {!expanded && session.exercises.length > 3 && session.type !== 'run' && (
          <button
            onClick={() => setExpanded(true)}
            className="text-[10px] text-[#4a4a4a] hover:text-[#a3a3a3] transition-colors font-rajdhani mt-0.5"
          >
            +{session.exercises.length - 3} exercice{session.exercises.length - 3 > 1 ? 's' : ''}…
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function SavedSessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('workout');

  useEffect(() => {
    if (!user) return;
    savedSessionsService.getSessions(user.id)
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = sessions.filter(s => s.type === tab);

  async function handleDelete(id: string) {
    await savedSessionsService.deleteSession(id).catch(() => {});
    setSessions(prev => prev.filter(s => s.id !== id));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bookmark className="w-5 h-5 text-[#c9a870]" />
        <h1 className="font-rajdhani font-bold text-xl text-[#f5f5f5] tracking-wide uppercase">Séances enregistrées</h1>
        <span className="ml-auto text-xs text-[#6b6b6b] font-rajdhani">{sessions.length} séance{sessions.length > 1 ? 's' : ''}</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-rajdhani font-semibold uppercase tracking-wide border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? `${t.color} border-current`
                : 'text-[#6b6b6b] border-transparent hover:text-[#a3a3a3]'
            }`}
          >
            {t.icon}
            {t.label}
            <span className="text-[10px] font-normal opacity-60">
              {sessions.filter(s => s.type === t.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Contenu */}
      {loading ? (
        <Loader text="Chargement..." />
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <div className={`mx-auto mb-3 ${TABS.find(t => t.id === tab)!.color} opacity-30`}>
            {TABS.find(t => t.id === tab)!.icon}
          </div>
          <p className="text-sm text-[#6b6b6b]">Aucune séance {TABS.find(t => t.id === tab)!.label.toLowerCase()} enregistrée.</p>
          <p className="text-xs text-[#4a4a4a] mt-1">Explore le feed Community et enregistre les séances qui t'inspirent.</p>
        </Card>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {filtered.map(s => (
              <SessionCard key={s.id} session={s} onDelete={() => handleDelete(s.id)} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
