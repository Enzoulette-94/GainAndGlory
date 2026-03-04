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

interface Event {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_date: string; // YYYY-MM-DD
  type: string | null;
  created_at: string;
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
    border: 'border-blue-500/40',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    dot: 'bg-blue-400',
  },
  competition: {
    label: 'Compétition',
    border: 'border-yellow-500/40',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    dot: 'bg-yellow-400',
  },
  trail: {
    label: 'Trail',
    border: 'border-green-500/40',
    badge: 'bg-green-500/20 text-green-300 border-green-500/30',
    dot: 'bg-green-400',
  },
  triathlon: {
    label: 'Triathlon',
    border: 'border-cyan-500/40',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    dot: 'bg-cyan-400',
  },
  autre: {
    label: 'Autre',
    border: 'border-slate-500/40',
    badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
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
        flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl
        border text-sm font-medium whitespace-nowrap
        ${type === 'success'
          ? 'bg-emerald-900/90 border-emerald-700/60 text-emerald-200'
          : 'bg-red-900/90 border-red-700/60 text-red-200'
        }
      `}
    >
      {type === 'success'
        ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
      }
      {message}
    </motion.div>
  );
}

// ============================================================
// UPCOMING EVENT CARD
// ============================================================

interface UpcomingEventCardProps {
  event: Event;
  onDelete: (id: string) => void;
  deletingId: string | null;
}

function UpcomingEventCard({ event, onDelete, deletingId }: UpcomingEventCardProps) {
  const config = getTypeConfig(event.type);
  const countdownLabel = getCountdownLabel(event.event_date);
  const days = getCountdownDays(event.event_date);
  const isToday = days === 0;
  const isTomorrow = days === 1;

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
                <h3 className="font-bold text-slate-100 leading-snug">{event.title}</h3>

                {/* Date row */}
                <div className="flex items-center gap-1.5 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs text-slate-400 capitalize">
                    {formatEventDate(event.event_date)}
                  </span>
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={() => onDelete(event.id)}
                disabled={deletingId === event.id}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors shrink-0 disabled:opacity-40"
                aria-label="Supprimer l'événement"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Countdown + type badges */}
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              <div
                className={`
                  flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border
                  ${isToday
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                    : isTomorrow
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-slate-700/60 text-slate-300 border-slate-600/50'
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
              <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {event.description}
              </p>
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

export function EventsPage() {
  const { profile } = useAuth();

  // Data state
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [showModal, setShowModal] = useState(false);
  const [showAllPast, setShowAllPast] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<EventForm>(INITIAL_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ── Load events ──────────────────────────────────────────────
  const loadEvents = useCallback(async () => {
    if (!profile) return;
    try {
      setLoading(true);
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', profile.id)
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

  // ── Separate upcoming / past ─────────────────────────────────
  const today = getTodayString();

  const upcomingEvents = events
    .filter((e) => e.event_date >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));

  const pastEventsAll = events
    .filter((e) => e.event_date < today)
    .sort((a, b) => b.event_date.localeCompare(a.event_date));

  const pastEvents = showAllPast
    ? pastEventsAll
    : pastEventsAll.slice(0, PAST_EVENTS_LIMIT);

  const hasMorePast = pastEventsAll.length > PAST_EVENTS_LIMIT;

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
        setEvents((prev) =>
          ([...prev, data as Event]).sort((a, b) =>
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

  // ── Empty state ──────────────────────────────────────────────
  const isEmpty = events.length === 0;

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
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/30">
            <Flag className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Événements</h1>
            <p className="text-slate-400 text-sm mt-0.5">Courses et compétitions</p>
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
            <Flag className="w-14 h-14 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400 font-medium text-base">
              Aucun événement planifié
            </p>
            <p className="text-slate-500 text-sm mt-1">
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
      {!loading && !isEmpty && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                A venir
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30">
                {upcomingEvents.length}
              </span>
            </div>

            {upcomingEvents.length === 0 ? (
              <Card className="p-6 text-center">
                <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                <p className="text-slate-400 text-sm">
                  Aucun événement a venir. Planifies-en un !
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={openModal}
                  className="mt-3"
                >
                  Ajouter
                </Button>
              </Card>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <UpcomingEventCard
                      key={event.id}
                      event={event}
                      onDelete={handleDelete}
                      deletingId={deletingId}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </motion.div>

          {/* ── Past events ── */}
          {pastEventsAll.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Passes
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400 text-xs font-bold border border-slate-600/50">
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
                        {/* Type dot */}
                        <div className={`w-2 h-2 rounded-full shrink-0 opacity-50 ${cfg.dot}`} />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-400 truncate">{event.title}</p>
                          <p className="text-xs text-slate-600 mt-0.5 capitalize">
                            {formatDate(event.event_date, {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>

                        {/* Type badge compact */}
                        {event.type && (
                          <span
                            className={`
                              hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border opacity-60
                              ${cfg.badge}
                            `}
                          >
                            {cfg.label}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Toggle voir plus */}
                {hasMorePast && (
                  <button
                    onClick={() => setShowAllPast((v) => !v)}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-3 text-xs text-slate-500 hover:text-slate-300 transition-colors"
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
        </>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModal(false)}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={saving}
              onClick={handleSave}
            >
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
