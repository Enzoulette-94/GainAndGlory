import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PersonStanding, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { runningService } from '../services/running.service';
import { xpService } from '../services/xp.service';
import { feedService } from '../services/feed.service';
import { Button } from '../components/common/Button';
import { Input, Textarea, Select } from '../components/common/Input';
import { Card } from '../components/common/Card';
import {
  calcPaceMinPerKm,
  calcSpeedKmH,
  formatPace,
} from '../utils/calculations';
import {
  RUN_TYPE_LABELS,
  WEATHER_LABELS,
  FEEDBACK_LABELS,
  XP_REWARDS,
} from '../utils/constants';
import type { Shoe } from '../types/models';
import type { Feedback, RunType, WeatherCondition } from '../types/enums';

function toLocalDatetimeValue(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function RunSessionPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Champs principaux
  const [date, setDate] = useState(toLocalDatetimeValue());
  const [sessionName, setSessionName] = useState('');
  const [distance, setDistance] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [runType, setRunType] = useState<RunType | ''>('');
  const [feedback, setFeedback] = useState<Feedback | ''>('');
  const [notes, setNotes] = useState('');

  // Section optionnelle
  const [showOptional, setShowOptional] = useState(false);
  const [elevationGain, setElevationGain] = useState('');
  const [elevationLoss, setElevationLoss] = useState('');
  const [avgHeartRate, setAvgHeartRate] = useState('');
  const [maxHeartRate, setMaxHeartRate] = useState('');
  const [weatherTemp, setWeatherTemp] = useState('');
  const [weatherCondition, setWeatherCondition] = useState<WeatherCondition | ''>('');
  const [shoeId, setShoeId] = useState('');

  // Chaussures
  const [shoes, setShoes] = useState<Shoe[]>([]);

  // State
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    runningService.getShoes(profile.id).then(setShoes).catch(() => {});
  }, [profile]);

  // Calculs en temps réel
  const durationSeconds = useMemo(() => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;
    return h * 3600 + m * 60 + s;
  }, [hours, minutes, seconds]);

  const distanceNum = parseFloat(distance) || 0;

  const pace = useMemo(() => {
    if (distanceNum <= 0 || durationSeconds <= 0) return 0;
    return calcPaceMinPerKm(distanceNum, durationSeconds);
  }, [distanceNum, durationSeconds]);

  const speed = useMemo(() => {
    if (distanceNum <= 0 || durationSeconds <= 0) return 0;
    return calcSpeedKmH(distanceNum, durationSeconds);
  }, [distanceNum, durationSeconds]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    if (distanceNum <= 0) {
      setError('La distance doit être supérieure à 0.');
      return;
    }
    if (durationSeconds <= 0) {
      setError('La durée doit être supérieure à 0.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const session = await runningService.createSession({
        user_id: profile.id,
        date: new Date(date).toISOString(),
        name: sessionName.trim() || undefined,
        distance: distanceNum,
        duration: durationSeconds,
        run_type: runType || undefined,
        elevation_gain: elevationGain ? parseInt(elevationGain) : undefined,
        elevation_loss: elevationLoss ? parseInt(elevationLoss) : undefined,
        avg_heart_rate: avgHeartRate ? parseInt(avgHeartRate) : undefined,
        max_heart_rate: maxHeartRate ? parseInt(maxHeartRate) : undefined,
        weather_temp: weatherTemp ? parseFloat(weatherTemp) : undefined,
        weather_condition: weatherCondition || undefined,
        shoe_id: shoeId || undefined,
        feedback: feedback || undefined,
        notes: notes.trim() || undefined,
      });

      await xpService.awardXP(profile.id, 'RUNNING_SESSION', 'running');

      await feedService.publishRun(
        profile.id,
        distanceNum,
        durationSeconds,
        pace,
        runType || undefined,
        session.id,
        sessionName.trim() || undefined,
        feedback || undefined,
      );

      navigate('/running');
    } catch {
      setError('Erreur lors de l\'enregistrement. Réessaie.');
      setSaving(false);
    }
  }

  if (!profile) return null;

  const runTypeOptions = Object.entries(RUN_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const weatherOptions = Object.entries(WEATHER_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const shoeOptions = shoes.filter(s => s.is_active).map(s => ({
    value: s.id,
    label: `${s.brand ? s.brand + ' ' : ''}${s.model} (${Math.round(s.total_km)} km)`,
  }));

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-2.5 rounded bg-transparent border border-blue-900/40">
          <PersonStanding className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Nouvelle course</h1>
          <p className="text-[#a3a3a3] text-sm mt-0.5">Running</p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 space-y-3">
            <Input
              label="Titre de la course (optionnel)"
              placeholder="ex. Morning Run, Trail des crêtes, Sortie longue..."
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
            />
            <Input
              label="Date et heure"
              type="datetime-local"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </Card>
        </motion.div>

        {/* Distance + Durée */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="p-4 space-y-4">
            <Input
              label="Distance (km)"
              type="number"
              min="0.1"
              max="999"
              step="0.01"
              placeholder="Ex: 10.5"
              value={distance}
              onChange={e => setDistance(e.target.value)}
              required
            />

            <div>
              <label className="text-sm font-medium text-[#d4d4d4] mb-2 block">
                Durée
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    placeholder="0"
                    value={hours}
                    onChange={e => setHours(e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-white/8 hover:border-white/10 rounded px-2 sm:px-4 py-2.5 text-sm text-[#f5f5f5] text-center placeholder-slate-500 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  />
                  <span className="text-xs text-[#6b6b6b] text-center">heures</span>
                </div>
                <div className="flex flex-col gap-1">
                  <input
                    type="number"
                    min={0}
                    max={59}
                    placeholder="0"
                    value={minutes}
                    onChange={e => setMinutes(e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-white/8 hover:border-white/10 rounded px-2 sm:px-4 py-2.5 text-sm text-[#f5f5f5] text-center placeholder-slate-500 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  />
                  <span className="text-xs text-[#6b6b6b] text-center">minutes</span>
                </div>
                <div className="flex flex-col gap-1">
                  <input
                    type="number"
                    min={0}
                    max={59}
                    placeholder="0"
                    value={seconds}
                    onChange={e => setSeconds(e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-white/8 hover:border-white/10 rounded px-2 sm:px-4 py-2.5 text-sm text-[#f5f5f5] text-center placeholder-slate-500 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  />
                  <span className="text-xs text-[#6b6b6b] text-center">secondes</span>
                </div>
              </div>
            </div>

            {/* Calcul allure en temps réel */}
            {pace > 0 && (
              <div className="flex items-center gap-4 p-3 bg-transparent border border-blue-900/40 rounded">
                <div className="flex-1 text-center">
                  <p className="text-lg font-black text-blue-500">
                    {formatPace(pace)}
                  </p>
                  <p className="text-xs text-[#6b6b6b]">allure</p>
                </div>
                <div className="w-px h-8 bg-slate-700" />
                <div className="flex-1 text-center">
                  <p className="text-lg font-black text-blue-500">
                    {speed.toFixed(1)} km/h
                  </p>
                  <p className="text-xs text-[#6b6b6b]">vitesse</p>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Type de course */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4">
            <Select
              label="Type de course"
              value={runType}
              onChange={e => setRunType(e.target.value as RunType | '')}
              options={runTypeOptions}
              placeholder="Sélectionner un type..."
            />
          </Card>
        </motion.div>

        {/* Section optionnelle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <button
            type="button"
            onClick={() => setShowOptional(prev => !prev)}
            className="w-full flex items-center justify-between p-4 bg-[#111111] border border-white/5 rounded hover:border-white/10 hover:bg-[#1c1c1c] transition-all"
          >
            <span className="text-sm font-semibold text-[#d4d4d4]">
              Informations optionnelles
            </span>
            {showOptional ? (
              <ChevronUp className="w-4 h-4 text-[#a3a3a3]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#a3a3a3]" />
            )}
          </button>

          <AnimatePresence>
            {showOptional && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <Card className="p-4 mt-2 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="D+ (m)"
                      type="number"
                      min={0}
                      placeholder="0"
                      value={elevationGain}
                      onChange={e => setElevationGain(e.target.value)}
                    />
                    <Input
                      label="D- (m)"
                      type="number"
                      min={0}
                      placeholder="0"
                      value={elevationLoss}
                      onChange={e => setElevationLoss(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="FC moyenne (bpm)"
                      type="number"
                      min={40}
                      max={250}
                      placeholder="150"
                      value={avgHeartRate}
                      onChange={e => setAvgHeartRate(e.target.value)}
                    />
                    <Input
                      label="FC max (bpm)"
                      type="number"
                      min={40}
                      max={250}
                      placeholder="180"
                      value={maxHeartRate}
                      onChange={e => setMaxHeartRate(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Température (°C)"
                      type="number"
                      min={-30}
                      max={50}
                      step={0.5}
                      placeholder="18"
                      value={weatherTemp}
                      onChange={e => setWeatherTemp(e.target.value)}
                    />
                    <Select
                      label="Météo"
                      value={weatherCondition}
                      onChange={e => setWeatherCondition(e.target.value as WeatherCondition | '')}
                      options={weatherOptions}
                      placeholder="Choisir..."
                    />
                  </div>

                  {shoeOptions.length > 0 && (
                    <Select
                      label="Chaussures"
                      value={shoeId}
                      onChange={e => setShoeId(e.target.value)}
                      options={shoeOptions}
                      placeholder="Sélectionner des chaussures..."
                    />
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 space-y-3">
            <label className="text-sm font-semibold text-[#d4d4d4]">
              Comment tu t'es senti ?
            </label>
            <div className="flex gap-3">
              {(Object.entries(FEEDBACK_LABELS) as [Feedback, string][]).map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFeedback(prev => (prev === value ? '' : value))}
                    className={`
                      flex-1 py-2.5 px-3 rounded text-sm font-medium border transition-all
                      ${
                        feedback === value
                          ? 'bg-red-700 border-red-500 text-white'
                          : 'bg-[#1c1c1c] border-white/8 text-[#a3a3a3] hover:border-white/10 hover:text-[#e5e5e5]'
                      }
                    `}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </Card>
        </motion.div>

        {/* Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="p-4">
            <Textarea
              label="Notes (optionnel)"
              placeholder="Ressenti, itinéraire, conditions..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </Card>
        </motion.div>

        {/* XP info */}
        <div className="flex items-center gap-2 px-1">
          <div className="p-1 rounded-lg bg-transparent">
            <span className="text-xs text-red-400 font-bold">+{XP_REWARDS.RUNNING_SESSION} XP</span>
          </div>
          <span className="text-xs text-[#6b6b6b]">seront gagnés à l'enregistrement</span>
        </div>

        {/* Erreur */}
        {error && (
          <Card className="p-3 bg-transparent border-red-500/25">
            <p className="text-sm text-red-400 text-center">{error}</p>
          </Card>
        )}

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pb-6"
        >
          <Button
            type="submit"
            size="lg"
            loading={saving}
            className="w-full bg-transparent border border-blue-800/60 text-blue-500 hover:bg-blue-900/10 hover:border-blue-700"
            icon={<PersonStanding className="w-5 h-5" />}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer la course'}
          </Button>
        </motion.div>
      </form>
    </div>
  );
}
