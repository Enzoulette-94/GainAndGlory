import React, { useEffect, useState, useMemo } from 'react';
import { Scale, Plus, TrendingUp, TrendingDown, Minus, X, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { weightService } from '../services/weight.service';
import { xpService } from '../services/xp.service';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input, Textarea } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Loader } from '../components/common/Loader';
import { formatWeight, formatDate, formatRelativeTime } from '../utils/calculations';
import { XP_REWARDS } from '../utils/constants';
import type { WeightEntry } from '../types/models';

function toLocalDateValue(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

interface ChartPoint {
  date: string;
  weight: number;
  label: string;
}

export function WeightPage() {
  const { profile, refreshProfile } = useAuth();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal nouvelle pesée
  const [showModal, setShowModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newDate, setNewDate] = useState(toLocalDateValue());
  const [newNotes, setNewNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Modal édition pesée
  const [editEntry, setEditEntry] = useState<WeightEntry | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Suppression
  const [deleteEntry, setDeleteEntry] = useState<WeightEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadEntries = () => {
    if (!profile) return;
    weightService
      .getEntries(profile.id, 90)
      .then(setEntries)
      .catch(() => setError('Impossible de charger les données.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEntries();
  }, [profile]);

  // Dernier poids
  const latestEntry = entries[0] ?? null;

  // Variation 7 jours
  const variation7d = useMemo(() => {
    if (entries.length < 2) return null;
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const weekOldEntry = entries.find(e => new Date(e.date) <= weekAgo);
    if (!weekOldEntry || !latestEntry) return null;
    return latestEntry.weight - weekOldEntry.weight;
  }, [entries, latestEntry]);

  // Variation 30 jours
  const variation30d = useMemo(() => {
    if (entries.length < 2) return null;
    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 30);
    const monthOldEntry = entries.find(e => new Date(e.date) <= monthAgo);
    if (!monthOldEntry || !latestEntry) return null;
    return latestEntry.weight - monthOldEntry.weight;
  }, [entries, latestEntry]);

  // Données graphique (30 derniers jours, ordre chronologique)
  const chartData: ChartPoint[] = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return entries
      .filter(e => new Date(e.date) >= thirtyDaysAgo)
      .reverse()
      .map(e => ({
        date: e.date,
        weight: e.weight,
        label: formatDate(e.date, { day: 'numeric', month: 'short' }),
      }));
  }, [entries]);

  const recent20 = entries.slice(0, 20);

  async function handleSave() {
    if (!profile) return;
    const weightNum = parseFloat(newWeight);
    if (isNaN(weightNum) || weightNum <= 0) {
      setSaveError('Entre un poids valide.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      await weightService.createEntry(
        profile.id,
        weightNum,
        newDate,
        newNotes.trim() || undefined
      );
      await xpService.awardXP(profile.id, 'WEIGHT_ENTRY');
      await refreshProfile();

      setShowModal(false);
      setNewWeight('');
      setNewDate(toLocalDateValue());
      setNewNotes('');
      setLoading(true);
      loadEntries();
    } catch {
      setSaveError('Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  }

  function openModal() {
    setNewDate(toLocalDateValue());
    setNewWeight('');
    setNewNotes('');
    setSaveError(null);
    setShowModal(true);
  }

  function openEdit(entry: WeightEntry) {
    setEditEntry(entry);
    setEditWeight(String(entry.weight));
    setEditDate(entry.date);
    setEditNotes(entry.notes ?? '');
    setEditError(null);
  }

  async function handleEditSave() {
    if (!editEntry) return;
    const w = parseFloat(editWeight);
    if (isNaN(w) || w <= 0) {
      setEditError('Entre un poids valide.');
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      await weightService.updateEntry(editEntry.id, {
        weight: w,
        date: editDate,
        notes: editNotes.trim() || null,
      });
      setEditEntry(null);
      setLoading(true);
      loadEntries();
    } catch {
      setEditError('Erreur lors de la sauvegarde.');
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteEntry) return;
    setDeleting(true);
    try {
      await weightService.deleteEntry(deleteEntry.id);
      setDeleteEntry(null);
      setLoading(true);
      loadEntries();
    } catch {
      setDeleting(false);
    }
  }

  if (!profile) return null;

  function VariationBadge({ value, label }: { value: number | null; label: string }) {
    if (value === null) return null;
    const abs = Math.abs(value).toFixed(1);
    const isPositive = value > 0;
    const isNeutral = Math.abs(value) < 0.1;

    if (isNeutral) {
      return (
        <div className="flex items-center gap-2 p-3 bg-[#1c1c1c] border border-white/8 rounded">
          <Minus className="w-4 h-4 text-[#a3a3a3]" />
          <div>
            <p className="text-sm font-semibold text-[#d4d4d4]">0,0 kg</p>
            <p className="text-xs text-[#6b6b6b]">{label}</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-2 p-3 rounded border ${
        isPositive
          ? 'bg-transparent border-red-500/25'
          : 'bg-transparent border-emerald-800/40'
      }`}>
        {isPositive ? (
          <TrendingUp className="w-4 h-4 text-red-400 flex-shrink-0" />
        ) : (
          <TrendingDown className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        )}
        <div>
          <p className={`text-sm font-semibold ${isPositive ? 'text-red-400' : 'text-emerald-600'}`}>
            {isPositive ? '+' : '-'}{abs} kg
          </p>
          <p className="text-xs text-[#6b6b6b]">{label}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-transparent border border-green-900/40">
            <Scale className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Poids</h1>
            <p className="text-[#a3a3a3] text-sm mt-0.5">Suivi corporel</p>
          </div>
        </div>
        <Button
          icon={<Plus className="w-4 h-4" />}
          size="md"
          onClick={openModal}
          className="bg-transparent border border-green-800/60 text-green-600 hover:bg-green-900/10 hover:border-green-700"
        >
          Nouvelle pesée
        </Button>
      </motion.div>

      {loading && <Loader text="Chargement des données..." />}

      {error && (
        <Card className="p-4">
          <p className="text-sm text-red-400 text-center">{error}</p>
        </Card>
      )}

      {!loading && !error && (
        <>
          {/* Dernier poids + variations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {latestEntry ? (
              <Card className="p-5">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-xs text-[#a3a3a3] mb-1">Dernier poids</p>
                    <p className="text-4xl sm:text-5xl font-black text-green-600">
                      {latestEntry.weight.toFixed(1)}
                      <span className="text-2xl text-green-600/70 ml-1">kg</span>
                    </p>
                    <p className="text-xs text-[#6b6b6b] mt-1">
                      {formatDate(latestEntry.date, {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </p>
                  </div>
                  <Scale className="w-12 h-12 text-green-600/20" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <VariationBadge value={variation7d} label="7 derniers jours" />
                  <VariationBadge value={variation30d} label="30 derniers jours" />
                </div>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <Scale className="w-12 h-12 mx-auto mb-3 text-[#4a4a4a]" />
                <p className="text-[#a3a3a3] text-sm mb-4">
                  Aucune pesée enregistrée pour l'instant.
                </p>
                <Button
                  icon={<Plus className="w-4 h-4" />}
                  onClick={openModal}
                  className="bg-transparent border border-green-800/60 text-green-600 hover:bg-green-900/10 hover:border-green-700"
                >
                  Première pesée
                </Button>
              </Card>
            )}
          </motion.div>

          {/* Graphique */}
          {chartData.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-4">
                <h2 className="text-sm font-semibold text-[#a3a3a3] uppercase tracking-wider mb-4">
                  Évolution sur 30 jours
                </h2>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#f1f5f9',
                      }}
                      formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(1)} kg`, 'Poids'] as [string, string]}
                      labelStyle={{ color: '#94a3b8' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#15803d"
                      strokeWidth={2}
                      dot={{ fill: '#15803d', r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: '#4ade80' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </motion.div>
          )}

          {/* Historique */}
          {recent20.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <h2 className="text-sm font-semibold text-[#a3a3a3] uppercase tracking-wider mb-3">
                Historique
              </h2>
              <div className="space-y-2">
                {recent20.map((entry, i) => {
                  const prev = recent20[i + 1];
                  const delta = prev ? entry.weight - prev.weight : null;

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.03 * i }}
                      className="flex items-center gap-3 p-3.5 bg-[#111111] border border-white/5 rounded"
                    >
                      <div className="p-2 bg-transparent border border-green-900/40 rounded flex-shrink-0">
                        <Scale className="w-4 h-4 text-green-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#e5e5e5]">
                          {formatWeight(entry.weight)}
                        </p>
                        {entry.notes && (
                          <p className="text-xs text-[#6b6b6b] truncate">{entry.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          {delta !== null && Math.abs(delta) >= 0.1 && (
                            <p className={`text-xs font-semibold ${
                              delta > 0 ? 'text-red-400' : 'text-emerald-600'
                            }`}>
                              {delta > 0 ? '+' : ''}{delta.toFixed(1)} kg
                            </p>
                          )}
                          <p className="text-xs text-[#6b6b6b]">
                            {formatDate(entry.date, { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <button
                          onClick={() => openEdit(entry)}
                          className="p-1.5 rounded text-[#6b6b6b] hover:text-[#d4d4d4] hover:bg-white/5 transition-all"
                          title="Modifier"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteEntry(entry)}
                          className="p-1.5 rounded text-[#6b6b6b] hover:text-red-400 hover:bg-red-900/10 transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Modal édition pesée */}
      <Modal
        isOpen={!!editEntry}
        onClose={() => setEditEntry(null)}
        title="Modifier la pesée"
        size="sm"
      >
        <div className="p-5 space-y-4">
          <Input
            label="Poids (kg)"
            type="number"
            min="20"
            max="500"
            step="0.1"
            placeholder="Ex: 75.5"
            value={editWeight}
            onChange={e => setEditWeight(e.target.value)}
            autoFocus
          />
          <Input
            label="Date"
            type="date"
            value={editDate}
            onChange={e => setEditDate(e.target.value)}
          />
          <Textarea
            label="Notes (optionnel)"
            placeholder="Remarques..."
            value={editNotes}
            onChange={e => setEditNotes(e.target.value)}
            rows={2}
          />
          {editError && <p className="text-sm text-red-400">{editError}</p>}
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" onClick={() => setEditEntry(null)} className="flex-1">
              Annuler
            </Button>
            <Button
              loading={editSaving}
              onClick={handleEditSave}
              className="flex-1 bg-transparent border border-green-800/60 text-green-600 hover:bg-green-900/10 hover:border-green-700"
            >
              {editSaving ? 'Sauvegarde...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal suppression pesée */}
      <Modal
        isOpen={!!deleteEntry}
        onClose={() => setDeleteEntry(null)}
        title="Supprimer la pesée"
        size="sm"
      >
        <div className="p-5 space-y-4">
          <p className="text-sm text-[#a3a3a3]">
            Supprimer la pesée du{' '}
            <span className="text-white font-semibold">
              {deleteEntry ? formatDate(deleteEntry.date, { day: 'numeric', month: 'long' }) : ''}
            </span>{' '}
            ({deleteEntry ? formatWeight(deleteEntry.weight) : ''}) ? Cette action est irréversible.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setDeleteEntry(null)} className="flex-1">
              Annuler
            </Button>
            <Button
              loading={deleting}
              onClick={handleDeleteConfirm}
              className="flex-1 bg-transparent border border-red-800/60 text-red-400 hover:bg-red-900/10 hover:border-red-700"
            >
              {deleting ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal nouvelle pesée */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nouvelle pesée"
        size="sm"
      >
        <div className="p-5 space-y-4">
          <Input
            label="Poids (kg)"
            type="number"
            min="20"
            max="500"
            step="0.1"
            placeholder="Ex: 75.5"
            value={newWeight}
            onChange={e => setNewWeight(e.target.value)}
            autoFocus
          />

          <Input
            label="Date"
            type="date"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
          />

          <Textarea
            label="Notes (optionnel)"
            placeholder="Remarques..."
            value={newNotes}
            onChange={e => setNewNotes(e.target.value)}
            rows={2}
          />

          {/* XP info */}
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-transparent">
              <span className="text-xs text-red-400 font-bold">+{XP_REWARDS.WEIGHT_ENTRY} XP</span>
            </div>
            <span className="text-xs text-[#6b6b6b]">à l'enregistrement</span>
          </div>

          {saveError && (
            <p className="text-sm text-red-400">{saveError}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              loading={saving}
              onClick={handleSave}
              className="flex-1 bg-transparent border border-green-800/60 text-green-600 hover:bg-green-900/10 hover:border-green-700"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
