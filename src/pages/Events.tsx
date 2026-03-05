import React, { useState, useEffect, useCallback } from 'react';
import {
  Flag,
  Plus,
  X,
  Calendar,
  Clock,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Users,
  UserPlus,
  UserCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { supabase } from '../lib/supabase-client';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input, Textarea, Select } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Loader } from '../components/common/Loader';
import { formatDate } from '../utils/calculations';

// ============================================================
// TYPES
// ============================================================

interface EventParticipant {
  user_id: string;
  user: { username: string; avatar_url: string | null } | null;
}

interface Event {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_date: string;
  type: string | null;
  created_at: string;
  participations?: EventParticipant[];
}

type EventType = 'course' | 'competition' | 'trail' | 'triathlon' | 'autre';

interface EventForm {
  title: string;
  event_date: string;
  type: EventType | '';
  description: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const TYPE_CONFIG: Record<
  EventType,
  { label: string; border: string; badge: string; dot: string }
> = {
  course: {
    label: 'Course',
    border: 'border-blue-800/50',
    badge: 'bg-transparent text-blue-500 border-blue-800/50',
    dot: 'bg-blue-700',
  },
  competition: {
    label: 'Compétition',
    border: 'border-yellow-500/40',
    badge: 'bg-transparent text-yellow-500 border-yellow-500/30',
    dot: 'bg-yellow-400',
  },
  trail: {
    label: 'Trail',
    border: 'border-green-500/40',
    badge: 'bg-transparent text-green-500 border-green-800/50',
    dot: 'bg-green-700',
  },
  triathlon: {
    label: 'Triathlon',
    border: 'border-cyan-500/40',
    badge: 'bg-transparent text-cyan-500 border-cyan-800/50',
    dot: 'bg-cyan-700',
  },
  autre: {
    label: 'Autre',
    border: 'border-slate-500/40',
    badge: 'bg-slate-500/20 text-[#d4d4d4] border-slate-500/30',
    dot: 'bg-slate-400',
  },
};

const TYPE_OPTIONS = [
  { value: 'course', label: 'Course' },
  { value: 'competition', label: 'Compétition' },
  { value: 'trail', label: 'Trail' },
  { value: 'triathlon', label: 'Triathlon' },
  { value: 'autre', label: 'Autre' },
];

const INITIAL_FORM: EventForm = {
  title: '',
  event_date: '',
  type: '',
  description: '',
};

const PAST_EVENTS_LIMIT = 5;

// ============================================================
// HELPERS
// ============================================================

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getCountdownLabel(eventDate: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(eventDate);
  target.setHours(0, 0, 0, 0);
  const days = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (days === 0) return "Aujourd'hui !";
  if (days === 1) return 'Demain';
  return `Dans ${days} jours`;
}

function getCountdownDays(eventDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(eventDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getTypeConfig(type: string | null) {
  if (type && type in TYPE_CONFIG) {
    return TYPE_CONFIG[type as EventType];
  }
  return TYPE_CONFIG['autre'];
}

function formatEventDate(dateStr: string): string {
  return formatDate(dateStr, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ============================================================
// TOAST
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
        fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]
        flex items-center gap-2.5 px-5 py-3 rounded shadow-2xl
        border text-sm font-medium whitespace-nowrap
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
// PARTICIPANT AVATARS
// ============================================================

function ParticipantList({ participants }: { participants: EventParticipant[] }) {
  if (participants.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      <div className="flex items-center gap-1.5 mb-2">
        <Users className="w-3 h-3 text-[#6b6b6b]" />
        <span className="text-xs text-[#6b6b6b]">
          {participants.length} participant{participants.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {participants.map(p => (
          <span
            key={p.user_id}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/3 border border-white/8 text-xs text-[#a3a3a3]"
          >
            {p.user?.avatar_url ? (
              <img
                src={p.user.avatar_url}
                alt=""
                className="w-4 h-4 rounded-full object-cover"
              />
            ) : (
              <span className="w-4 h-4 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[9px] text-[#6b6b6b] font-bold">
                {(p.user?.username ?? '?')[0].toUpperCase()}
              </span>
            )}
            {p.user?.username ?? '—'}
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// UPCOMING EVENT CARD
// ============================================================

interface UpcomingEventCardProps {
  event: Event;
  currentUserId: string;
  isParticipating: boolean;
  participationLoading: boolean;
  onDelete: (id: string) => void;
  deletingId: string | null;
  onToggleParticipation: (eventId: string, isParticipating: boolean) => void;
}

function UpcomingEventCard({
  event,
  currentUserId,
  isParticipating,
  participationLoading,
  onDelete,
  deletingId,
  onToggleParticipation,
}: UpcomingEventCardProps) {
  const config = getTypeConfig(event.type);
  const countdownLabel = getCountdownLabel(event.event_date);
  const days = getCountdownDays(event.event_date);
  const isToday = days === 0;
  const isTomorrow = days === 1;
  const isOwner = event.user_id === currentUserId;
  const participants = event.participations ?? [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
    >
      <Card className={`p-4 border-l-4 ${config.border}`}>
        <div className="flex items-start gap-3">
          {/* Left dot indicator */}
          <div className="mt-1.5 shrink-0">
            <div className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-[#f5f5f5] leading-snug">{event.title}</h3>

                {/* Date row */}
                <div className="flex items-center gap-1.5 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-[#a3a3a3] shrink-0" />
                  <span className="text-xs text-[#a3a3a3] capitalize">
                    {formatEventDate(event.event_date)}
                  </span>
                </div>
              </div>

              {/* Delete button (owner only) */}
              {isOwner && (
                <button
                  onClick={() => onDelete(event.id)}
                  disabled={deletingId === event.id}
                  className="p-1.5 rounded-lg hover:bg-transparent text-[#6b6b6b] hover:text-red-400 transition-colors shrink-0 disabled:opacity-40"
                  aria-label="Supprimer l'événement"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Countdown + type badges */}
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              <div
                className={`
                  flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border
                  ${isToday
                    ? 'bg-transparent text-orange-500 border-orange-800/50'
                    : isTomorrow
                      ? 'bg-transparent text-amber-500 border-amber-700/50'
                      : 'bg-slate-700/60 text-[#d4d4d4] border-white/10/50'
                  }
                `}
              >
                <Clock className="w-3 h-3" />
                {countdownLabel}
              </div>

              {event.type && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.badge}`}>
                  {config.label}
                </span>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <p className="mt-2 text-xs text-[#a3a3a3] line-clamp-2 leading-relaxed">
                {event.description}
              </p>
            )}

            {/* Bouton participer */}
            <div className="mt-3">
              <button
                onClick={() => onToggleParticipation(event.id, isParticipating)}
                disabled={participationLoading}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                  border transition-all rounded disabled:opacity-50
                  ${isParticipating
                    ? 'bg-[#c9a870]/10 border-[#c9a870]/40 text-[#c9a870] hover:bg-red-900/10 hover:border-red-700/40 hover:text-red-400'
                    : 'bg-transparent border-white/10 text-[#6b6b6b] hover:border-[#c9a870]/40 hover:text-[#c9a870] hover:bg-[#c9a870]/5'
                  }
                `}
              >
                {isParticipating
                  ? <><UserCheck className="w-3.5 h-3.5" /> Je participe</>
                  : <><UserPlus className="w-3.5 h-3.5" /> Participer</>
                }
              </button>
            </div>

            {/* Liste des participants */}
            <ParticipantList participants={participants} />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================

export function EventsPage() {
  const { profile } = useAuth();

  // Data state
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [showModal, setShowModal] = useState(false);
  const [showAllPast, setShowAllPast] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [participationLoadingId, setParticipationLoadingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<EventForm>(INITIAL_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ── Load events (all users) ───────────────────────────────────
  const loadEvents = useCallback(async () => {
    if (!profile) return;
    try {
      setLoading(true);
      const { data } = await (supabase as any)
        .from('events')
        .select('*, participations:event_participations(user_id, user:profiles(username, avatar_url))')
        .order('event_date', { ascending: true });
      setEvents((data as Event[]) ?? []);
    } catch {
      showToast('Impossible de charger les événements.', 'error');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // ── Toast helper ─────────────────────────────────────────────
  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
  }

  // ── Toggle participation ──────────────────────────────────────
  async function toggleParticipation(eventId: string, currently: boolean) {
    if (!profile) return;
    setParticipationLoadingId(eventId);
    try {
      if (currently) {
        // Se désinscrire
        await (supabase as any)
          .from('event_participations')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', profile.id);

        setEvents(prev => prev.map(e => {
          if (e.id !== eventId) return e;
          return {
            ...e,
            participations: (e.participations ?? []).filter(p => p.user_id !== profile.id),
          };
        }));
      } else {
        // S'inscrire
        await (supabase as any)
          .from('event_participations')
          .insert({ event_id: eventId, user_id: profile.id });

        setEvents(prev => prev.map(e => {
          if (e.id !== eventId) return e;
          const newParticipant: EventParticipant = {
            user_id: profile.id,
            user: { username: profile.username, avatar_url: profile.avatar_url },
          };
          return {
            ...e,
            participations: [...(e.participations ?? []), newParticipant],
          };
        }));
      }
    } catch {
      showToast('Erreur lors de la participation.', 'error');
    } finally {
      setParticipationLoadingId(null);
    }
  }

  // ── Separate upcoming / past ─────────────────────────────────
  const today = getTodayString();

  const upcomingEvents = events
    .filter((e) => e.event_date >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));

  // Past: only user's own events
  const pastEventsAll = events
    .filter((e) => e.event_date < today && e.user_id === profile?.id)
    .sort((a, b) => b.event_date.localeCompare(a.event_date));

  const pastEvents = showAllPast
    ? pastEventsAll
    : pastEventsAll.slice(0, PAST_EVENTS_LIMIT);

  const hasMorePast = pastEventsAll.length > PAST_EVENTS_LIMIT;
  const isEmpty = upcomingEvents.length === 0 && pastEventsAll.length === 0;

  // ── Open modal ───────────────────────────────────────────────
  function openModal() {
    setForm(INITIAL_FORM);
    setFormError(null);
    setShowModal(true);
  }

  // ── Save event ───────────────────────────────────────────────
  async function handleSave() {
    if (!profile) return;

    if (!form.title.trim()) {
      setFormError('Le titre est obligatoire.');
      return;
    }
    if (!form.event_date) {
      setFormError('La date est obligatoire.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          user_id: profile.id,
          title: form.title.trim(),
          description: form.description.trim() || null,
          event_date: form.event_date,
          type: form.type || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newEvent: Event = { ...(data as Event), participations: [] };
        setEvents((prev) =>
          ([...prev, newEvent]).sort((a, b) =>
            a.event_date.localeCompare(b.event_date)
          )
        );
      }

      setShowModal(false);
      showToast('Événement ajouté !', 'success');
    } catch {
      setFormError("Erreur lors de l'enregistrement. Réessaie.");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete event ─────────────────────────────────────────────
  async function handleDelete(eventId: string) {
    const confirmed = window.confirm(
      'Supprimer cet événement ? Cette action est irréversible.'
    );
    if (!confirmed) return;

    setDeletingId(eventId);
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      showToast('Événement supprimé.', 'success');
    } catch {
      showToast('Erreur lors de la suppression.', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  if (!profile) return null;

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-transparent border border-cyan-800/40">
            <Flag className="w-6 h-6 text-[#c9a870]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Événements</h1>
            <p className="text-[#a3a3a3] text-sm mt-0.5">Courses et compétitions</p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={openModal}
        >
          Ajouter
        </Button>
      </motion.div>

      {/* ── Loading ── */}
      {loading && <Loader text="Chargement des événements..." />}

      {/* ── Empty state ── */}
      {!loading && isEmpty && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-14 text-center">
            <Flag className="w-14 h-14 mx-auto mb-4 text-[#4a4a4a]" />
            <p className="text-[#a3a3a3] font-medium text-base">
              Aucun événement planifié
            </p>
            <p className="text-[#6b6b6b] text-sm mt-1">
              Ajoute tes courses et compétitions pour ne rien manquer.
            </p>
            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={openModal}
              className="mt-5"
            >
              Ajouter un événement
            </Button>
          </Card>
        </motion.div>
      )}

      {/* ── Upcoming events ── */}
      {!loading && upcomingEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-[#c9a870] uppercase tracking-widest">
              À venir
            </span>
            <span className="px-2 py-0.5 bg-transparent text-[#c9a870] text-xs font-bold border border-[#c9a870]/30">
              {upcomingEvents.length}
            </span>
          </div>

          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {upcomingEvents.map((event) => {
                const isParticipating = (event.participations ?? []).some(p => p.user_id === profile.id);
                return (
                  <UpcomingEventCard
                    key={event.id}
                    event={event}
                    currentUserId={profile.id}
                    isParticipating={isParticipating}
                    participationLoading={participationLoadingId === event.id}
                    onDelete={handleDelete}
                    deletingId={deletingId}
                    onToggleParticipation={toggleParticipation}
                  />
                );
              })}
            </div>
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Past events (user's own) ── */}
      {!loading && pastEventsAll.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-[#6b6b6b] uppercase tracking-widest">
              Passés
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-700/60 text-[#a3a3a3] text-xs font-bold border border-white/10/50">
              {pastEventsAll.length}
            </span>
          </div>

          <Card className="divide-y divide-slate-700/40">
            <AnimatePresence>
              {pastEvents.map((event) => {
                const cfg = getTypeConfig(event.type);
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 opacity-50 ${cfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#a3a3a3] truncate">{event.title}</p>
                      <p className="text-xs text-[#4a4a4a] mt-0.5 capitalize">
                        {formatDate(event.event_date, {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    {event.type && (
                      <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border opacity-60 ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {hasMorePast && (
              <button
                onClick={() => setShowAllPast((v) => !v)}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-3 text-xs text-[#6b6b6b] hover:text-[#d4d4d4] transition-colors"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${showAllPast ? 'rotate-180' : ''}`}
                />
                {showAllPast
                  ? 'Voir moins'
                  : `Voir ${pastEventsAll.length - PAST_EVENTS_LIMIT} de plus`}
              </button>
            )}
          </Card>
        </motion.div>
      )}

      {/* ── Modal : Ajouter un événement ── */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Ajouter un événement"
        size="md"
      >
        <div className="p-5 space-y-4">
          <Input
            label="Titre *"
            placeholder="Ex: Semi-marathon de Paris"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            autoFocus
          />

          <Input
            label="Date *"
            type="date"
            min={getTodayString()}
            value={form.event_date}
            onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
          />

          <Select
            label="Type"
            placeholder="Selectionner un type"
            options={TYPE_OPTIONS}
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as EventType | '' }))}
          />

          <Textarea
            label="Description (optionnel)"
            placeholder="Notes, objectifs, logistique..."
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />

          {formError && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
              Enregistrer
            </Button>
          </div>
        </div>
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
