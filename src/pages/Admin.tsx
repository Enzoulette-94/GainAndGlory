import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Trash2, Pencil, Flag, Target, Swords, ChevronDown, ChevronUp, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase-client';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/Button';
import { Input, Textarea, Select } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Loader } from '../components/common/Loader';
import { formatDate } from '../utils/calculations';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ─── Types ───────────────────────────────────────────────────

interface AdminEvent {
  id: string; user_id: string; title: string;
  description: string | null; event_date: string; type: string | null;
  user?: { username: string };
}

interface AdminGoal {
  id: string; user_id: string; type: string; title: string;
  description: string | null; target_value: number | null;
  current_value: number; unit: string | null; deadline: string | null;
  status: string;
  user?: { username: string };
}

interface AdminChallenge {
  id: string; created_by: string; title: string; description: string | null;
  type: string; target_value: number; unit: string;
  start_date: string; end_date: string; status: string; is_flash: boolean;
  creator?: { username: string };
}

type Tab = 'events' | 'goals' | 'challenges';

// ─── Helpers ─────────────────────────────────────────────────

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'Type...' },
  { value: 'course', label: 'Course' },
  { value: 'competition', label: 'Compétition' },
  { value: 'trail', label: 'Trail' },
  { value: 'triathlon', label: 'Triathlon' },
  { value: 'autre', label: 'Autre' },
];

const GOAL_TYPE_OPTIONS = [
  { value: 'musculation', label: 'Musculation' },
  { value: 'running', label: 'Course' },
  { value: 'weight', label: 'Poids' },
];

const CHALLENGE_TYPE_OPTIONS = [
  { value: 'distance', label: 'Distance (km)' },
  { value: 'tonnage', label: 'Tonnage (kg)' },
  { value: 'sessions', label: 'Séances' },
];

const CHALLENGE_STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente' },
  { value: 'active', label: 'Actif' },
  { value: 'completed', label: 'Terminé' },
  { value: 'cancelled', label: 'Annulé' },
];

// ─── Main ─────────────────────────────────────────────────────

export function AdminPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('events');

  // Redirect non-admins
  useEffect(() => {
    if (profile && !profile.is_admin) navigate('/dashboard', { replace: true });
  }, [profile, navigate]);

  if (!profile) return <Loader fullScreen text="Chargement..." />;
  if (!profile.is_admin) return null;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="p-2.5 border border-[#c9a870]/30">
          <Shield className="w-6 h-6 text-[#c9a870]" />
        </div>
        <div>
          <h1 className="font-rajdhani text-3xl font-bold tracking-wide uppercase text-[#c9a870]">Administration</h1>
          <p className="text-[#a3a3a3] text-sm mt-0.5">Gestion des contenus</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5">
        {([
          { key: 'events', label: 'Événements', icon: <Flag className="w-4 h-4" /> },
          { key: 'goals', label: 'Objectifs perso', icon: <Target className="w-4 h-4" /> },
          { key: 'challenges', label: "Objectifs équipe", icon: <Swords className="w-4 h-4" /> },
        ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'text-[#c9a870] border-[#c9a870]'
                : 'text-[#a3a3a3] border-transparent hover:text-[#d4d4d4]'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === 'events' && <EventsAdmin />}
      {tab === 'goals' && <GoalsAdmin />}
      {tab === 'challenges' && <ChallengesAdmin />}
    </div>
  );
}

// ─── Events Admin ─────────────────────────────────────────────

function EventsAdmin() {
  const [items, setItems] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', event_date: '', type: '', description: '' });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await db.from('events')
      .select('*, user:profiles(username)')
      .order('event_date', { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openEdit(item: AdminEvent) {
    setForm({ title: item.title, event_date: item.event_date, type: item.type ?? '', description: item.description ?? '' });
    setEditing(item);
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    await db.from('events').update({
      title: form.title,
      event_date: form.event_date,
      type: form.type || null,
      description: form.description || null,
    }).eq('id', editing.id);
    setSaving(false);
    setEditing(null);
    load();
  }

  async function handleDelete(id: string) {
    await db.from('events').delete().eq('id', id);
    setConfirmDelete(null);
    load();
  }

  if (loading) return <Loader size="sm" />;

  return (
    <>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-[#6b6b6b] text-sm py-4">Aucun événement.</p>}
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-3 p-3 bg-[#111111] border border-white/5 hover:border-white/10 transition-colors">
            <Flag className="w-4 h-4 text-[#c9a870] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#d4d4d4] truncate">{item.title}</p>
              <p className="text-xs text-[#6b6b6b]">{formatDate(item.event_date)} · {item.user?.username ?? '—'}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-white/5 text-[#a3a3a3] hover:text-[#c9a870] transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setConfirmDelete(item.id)} className="p-1.5 hover:bg-red-900/20 text-[#a3a3a3] hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Modifier l'événement" size="sm">
        <div className="p-5 space-y-4">
          <Input label="Titre" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <Input label="Date" type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
          <Select label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} options={EVENT_TYPE_OPTIONS} />
          <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setEditing(null)}>Annuler</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>Enregistrer</Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Supprimer l'événement" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-sm text-[#a3a3a3]">Cette action est irréversible.</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(null)}>Annuler</Button>
            <Button variant="primary" className="flex-1 !bg-red-900/80 hover:!bg-red-800" onClick={() => confirmDelete && handleDelete(confirmDelete)}>Supprimer</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─── Goals Admin ──────────────────────────────────────────────

function GoalsAdmin() {
  const [items, setItems] = useState<AdminGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminGoal | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'musculation', target_value: '', current_value: '', unit: '', deadline: '', status: 'active', description: '' });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await db.from('personal_goals')
      .select('*, user:profiles(username)')
      .order('created_at', { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openEdit(item: AdminGoal) {
    setForm({
      title: item.title,
      type: item.type,
      target_value: item.target_value != null ? String(item.target_value) : '',
      current_value: String(item.current_value ?? 0),
      unit: item.unit ?? '',
      deadline: item.deadline ? item.deadline.split('T')[0] : '',
      status: item.status,
      description: item.description ?? '',
    });
    setEditing(item);
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    await db.from('personal_goals').update({
      title: form.title,
      type: form.type,
      target_value: form.target_value ? Number(form.target_value) : null,
      current_value: Number(form.current_value) || 0,
      unit: form.unit || null,
      deadline: form.deadline || null,
      status: form.status,
      description: form.description || null,
    }).eq('id', editing.id);
    setSaving(false);
    setEditing(null);
    load();
  }

  async function handleDelete(id: string) {
    await db.from('personal_goals').delete().eq('id', id);
    setConfirmDelete(null);
    load();
  }

  const STATUS_COLORS: Record<string, string> = {
    active: 'text-green-500', completed: 'text-[#c9a870]', cancelled: 'text-[#6b6b6b]',
  };

  if (loading) return <Loader size="sm" />;

  return (
    <>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-[#6b6b6b] text-sm py-4">Aucun objectif.</p>}
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-3 p-3 bg-[#111111] border border-white/5 hover:border-white/10 transition-colors">
            <Target className="w-4 h-4 text-[#c9a870] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#d4d4d4] truncate">{item.title}</p>
              <p className="text-xs text-[#6b6b6b]">
                {item.user?.username ?? '—'} · {item.type}
                {item.deadline && ` · deadline ${formatDate(item.deadline)}`}
                <span className={` · ${STATUS_COLORS[item.status] ?? 'text-[#6b6b6b]'}`}> {item.status}</span>
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-white/5 text-[#a3a3a3] hover:text-[#c9a870] transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setConfirmDelete(item.id)} className="p-1.5 hover:bg-red-900/20 text-[#a3a3a3] hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Modifier l'objectif" size="sm">
        <div className="p-5 space-y-3">
          <Input label="Titre" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} options={GOAL_TYPE_OPTIONS} />
            <Select label="Statut" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              options={[{ value: 'active', label: 'Actif' }, { value: 'completed', label: 'Complété' }, { value: 'cancelled', label: 'Annulé' }]} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Valeur actuelle" type="number" value={form.current_value} onChange={e => setForm(f => ({ ...f, current_value: e.target.value }))} />
            <Input label="Objectif" type="number" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} />
            <Input label="Unité" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="kg, km…" />
          </div>
          <Input label="Deadline" type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setEditing(null)}>Annuler</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>Enregistrer</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Supprimer l'objectif" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-sm text-[#a3a3a3]">Cette action est irréversible.</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(null)}>Annuler</Button>
            <Button variant="primary" className="flex-1 !bg-red-900/80 hover:!bg-red-800" onClick={() => confirmDelete && handleDelete(confirmDelete)}>Supprimer</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─── Challenges Admin ─────────────────────────────────────────

function ChallengesAdmin() {
  const [items, setItems] = useState<AdminChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminChallenge | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', type: 'distance',
    target_value: '', unit: '', start_date: '', end_date: '', status: 'active',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await db.from('community_challenges')
      .select('*, creator:profiles(username)')
      .order('created_at', { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openEdit(item: AdminChallenge) {
    setForm({
      title: item.title,
      description: item.description ?? '',
      type: item.type,
      target_value: String(item.target_value),
      unit: item.unit,
      start_date: item.start_date.split('T')[0],
      end_date: item.end_date.split('T')[0],
      status: item.status,
    });
    setEditing(item);
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    await db.from('community_challenges').update({
      title: form.title,
      description: form.description || null,
      type: form.type,
      target_value: Number(form.target_value) || 0,
      unit: form.unit,
      start_date: form.start_date,
      end_date: form.end_date,
      status: form.status,
    }).eq('id', editing.id);
    setSaving(false);
    setEditing(null);
    load();
  }

  async function handleDelete(id: string) {
    await db.from('community_challenges').delete().eq('id', id);
    setConfirmDelete(null);
    load();
  }

  const STATUS_COLORS: Record<string, string> = {
    active: 'text-green-500', pending: 'text-yellow-500',
    completed: 'text-[#c9a870]', cancelled: 'text-[#6b6b6b]',
  };

  if (loading) return <Loader size="sm" />;

  return (
    <>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-[#6b6b6b] text-sm py-4">Aucun défi.</p>}
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-3 p-3 bg-[#111111] border border-white/5 hover:border-white/10 transition-colors">
            <Swords className="w-4 h-4 text-pink-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#d4d4d4] truncate">{item.title}</p>
              <p className="text-xs text-[#6b6b6b]">
                {item.creator?.username ?? '—'} · {item.target_value} {item.unit}
                <span className={` · ${STATUS_COLORS[item.status] ?? 'text-[#6b6b6b]'}`}> {item.status}</span>
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-white/5 text-[#a3a3a3] hover:text-[#c9a870] transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setConfirmDelete(item.id)} className="p-1.5 hover:bg-red-900/20 text-[#a3a3a3] hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Modifier le défi" size="sm">
        <div className="p-5 space-y-3">
          <Input label="Titre" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} options={CHALLENGE_TYPE_OPTIONS} />
            <Select label="Statut" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} options={CHALLENGE_STATUS_OPTIONS} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Objectif" type="number" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} />
            <Input label="Unité" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Début" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            <Input label="Fin" type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setEditing(null)}>Annuler</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>Enregistrer</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Supprimer le défi" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-sm text-[#a3a3a3]">Cette action est irréversible.</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(null)}>Annuler</Button>
            <Button variant="primary" className="flex-1 !bg-red-900/80 hover:!bg-red-800" onClick={() => confirmDelete && handleDelete(confirmDelete)}>Supprimer</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
