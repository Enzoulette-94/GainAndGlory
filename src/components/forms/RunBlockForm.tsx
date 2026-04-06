import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input, Select } from '../common/Input';
import { Card } from '../common/Card';
import {
  calcPaceMinPerKm,
  calcSpeedKmH,
  formatPace,
} from '../../utils/calculations';
import {
  RUN_TYPE_LABELS,
  WEATHER_LABELS,
} from '../../utils/constants';
import type { RunType, RunLocation, WeatherCondition } from '../../types/enums';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RunBlockFormData {
  distance: number;
  durationSeconds: number;
  runType: RunType | '';
  runLocation: RunLocation | '';
  pace: number;
  speed: number;
  elevationGain?: number;
  elevationLoss?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  weatherTemp?: number;
  weatherCondition?: WeatherCondition | '';
}

// ─── RunBlockForm ─────────────────────────────────────────────────────────────

interface RunBlockFormProps {
  onChange: (data: RunBlockFormData) => void;
}

export function RunBlockForm({ onChange }: RunBlockFormProps) {
  const [distance, setDistance] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [runType, setRunType] = useState<RunType | ''>('');
  const [runLocation, setRunLocation] = useState<RunLocation | ''>('');
  const [showOptional, setShowOptional] = useState(false);
  const [elevationGain, setElevationGain] = useState('');
  const [elevationLoss, setElevationLoss] = useState('');
  const [avgHeartRate, setAvgHeartRate] = useState('');
  const [maxHeartRate, setMaxHeartRate] = useState('');
  const [weatherTemp, setWeatherTemp] = useState('');
  const [weatherCondition, setWeatherCondition] = useState<WeatherCondition | ''>('');

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

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  useEffect(() => {
    onChangeRef.current({
      distance: distanceNum,
      durationSeconds,
      runType,
      runLocation,
      pace,
      speed,
      elevationGain: elevationGain ? parseInt(elevationGain) : undefined,
      elevationLoss: elevationLoss ? parseInt(elevationLoss) : undefined,
      avgHeartRate: avgHeartRate ? parseInt(avgHeartRate) : undefined,
      maxHeartRate: maxHeartRate ? parseInt(maxHeartRate) : undefined,
      weatherTemp: weatherTemp ? parseInt(weatherTemp) : undefined,
      weatherCondition: weatherCondition || undefined,
    });
  }, [distanceNum, durationSeconds, runType, runLocation, pace, speed, elevationGain, elevationLoss, avgHeartRate, maxHeartRate, weatherTemp, weatherCondition]);

  const runTypeOptions = Object.entries(RUN_TYPE_LABELS).map(([value, label]) => ({ value, label }));
  const weatherOptions = Object.entries(WEATHER_LABELS).map(([value, label]) => ({ value, label }));

  return (
    <div className="space-y-4">
      {/* Distance + Durée */}
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
        />

        <div>
          <label className="text-sm font-medium text-[#d4d4d4] mb-2 block">Durée</label>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1">
              <input
                type="number" min={0} max={23} placeholder="0" value={hours}
                onChange={e => setHours(e.target.value)}
                className="w-full bg-[#1c1c1c] border border-white/8 hover:border-white/10 rounded px-2 sm:px-4 py-2.5 text-sm text-[#f5f5f5] text-center placeholder-slate-500 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              />
              <span className="text-xs text-[#6b6b6b] text-center">heures</span>
            </div>
            <div className="flex flex-col gap-1">
              <input
                type="number" min={0} max={59} placeholder="0" value={minutes}
                onChange={e => setMinutes(e.target.value)}
                className="w-full bg-[#1c1c1c] border border-white/8 hover:border-white/10 rounded px-2 sm:px-4 py-2.5 text-sm text-[#f5f5f5] text-center placeholder-slate-500 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              />
              <span className="text-xs text-[#6b6b6b] text-center">minutes</span>
            </div>
            <div className="flex flex-col gap-1">
              <input
                type="number" min={0} max={59} placeholder="0" value={seconds}
                onChange={e => setSeconds(e.target.value)}
                className="w-full bg-[#1c1c1c] border border-white/8 hover:border-white/10 rounded px-2 sm:px-4 py-2.5 text-sm text-[#f5f5f5] text-center placeholder-slate-500 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              />
              <span className="text-xs text-[#6b6b6b] text-center">secondes</span>
            </div>
          </div>
        </div>

        {pace > 0 && (
          <div className="flex items-center gap-4 p-3 bg-transparent border border-blue-900/40 rounded">
            <div className="flex-1 text-center">
              <p className="text-lg font-black text-blue-500">{formatPace(pace)}</p>
              <p className="text-xs text-[#6b6b6b]">allure</p>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="flex-1 text-center">
              <p className="text-lg font-black text-blue-500">{speed.toFixed(1)} km/h</p>
              <p className="text-xs text-[#6b6b6b]">vitesse</p>
            </div>
          </div>
        )}
      </Card>

      {/* Localisation */}
      <Card className="p-4 space-y-3">
        <div>
          <label className="text-sm font-medium text-[#d4d4d4] mb-2 block">Où as-tu couru ?</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRunLocation(runLocation === 'exterieur' ? '' : 'exterieur')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                runLocation === 'exterieur'
                  ? 'bg-blue-600/20 border-blue-500/60 text-blue-300'
                  : 'bg-[#1c1c1c] border-white/8 text-[#6b6b6b] hover:border-white/15 hover:text-[#d4d4d4]'
              }`}
            >
              Extérieur
            </button>
            <button
              type="button"
              onClick={() => setRunLocation(runLocation === 'salle' ? '' : 'salle')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                runLocation === 'salle'
                  ? 'bg-blue-600/20 border-blue-500/60 text-blue-300'
                  : 'bg-[#1c1c1c] border-white/8 text-[#6b6b6b] hover:border-white/15 hover:text-[#d4d4d4]'
              }`}
            >
              En salle
            </button>
          </div>
        </div>

        {/* Type de course */}
        <Select
          label="Type de séance"
          value={runType}
          onChange={e => setRunType(e.target.value as RunType | '')}
          options={runTypeOptions}
          placeholder="Sélectionner un type..."
        />
      </Card>

      {/* Section optionnelle */}
      <button
        type="button"
        onClick={() => setShowOptional(prev => !prev)}
        className="w-full flex items-center justify-between p-4 bg-[#111111] border border-white/5 rounded hover:border-white/10 hover:bg-[#1c1c1c] transition-all"
      >
        <span className="text-sm font-semibold text-[#d4d4d4]">Informations optionnelles</span>
        {showOptional ? <ChevronUp className="w-4 h-4 text-[#a3a3a3]" /> : <ChevronDown className="w-4 h-4 text-[#a3a3a3]" />}
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
                <Input label="D+ (m)" type="number" min={0} placeholder="0" value={elevationGain} onChange={e => setElevationGain(e.target.value)} />
                <Input label="D- (m)" type="number" min={0} placeholder="0" value={elevationLoss} onChange={e => setElevationLoss(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="FC moyenne (bpm)" type="number" min={40} max={250} placeholder="150" value={avgHeartRate} onChange={e => setAvgHeartRate(e.target.value)} />
                <Input label="FC max (bpm)" type="number" min={40} max={250} placeholder="180" value={maxHeartRate} onChange={e => setMaxHeartRate(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="Température (°C)" type="number" min={-30} max={50} step={0.5} placeholder="18" value={weatherTemp} onChange={e => setWeatherTemp(e.target.value)} />
                <Select
                  label="Météo"
                  value={weatherCondition}
                  onChange={e => setWeatherCondition(e.target.value as WeatherCondition | '')}
                  options={weatherOptions}
                  placeholder="Choisir..."
                />
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
