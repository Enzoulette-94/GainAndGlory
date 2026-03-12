import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Users, Plus, Zap, Target, Trophy, Calendar, Heart, MessageCircle, Star, Dumbbell, PersonStanding, Send, X, ChevronRight, Flame, Wind, Thermometer, Footprints, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
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
import { formatDate, formatRelativeTime, formatDistance, formatDuration, formatPace, getStatusTitle } from '../utils/calculations';
import { feedService } from '../services/feed.service';
import type { ActivityFeedItem, ActivityComment } from '../types/models';

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

type Tab = 'feed' | 'active' | 'mine' | 'create';

// ─────────────────────────────────────────────
// Helpers (challenges)
// ─────────────────────────────────────────────

function daysRemaining(endDate: string): number {
  const end = new Date(endDate).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
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
    case 'tonnage': return 'bg-transparent text-red-300 border-red-500/30';
    case 'sessions': return 'bg-transparent text-green-500 border-green-800/50';
  }
}

function typeProgressColor(type: CommunityChallenge['type']): string {
  switch (type) {
    case 'distance': return 'bg-blue-800';
    case 'tonnage': return 'bg-red-500';
    case 'sessions': return 'bg-green-800';
  }
}

function unitForType(type: string): string {
  switch (type) {
    case 'distance': return 'km';
    case 'tonnage': return 'kg';
    case 'sessions': return 'séances';
    default: return '';
  }
}

function calcTotal(challenge: CommunityChallenge): number {
  if (challenge.total_contribution !== undefined) return challenge.total_contribution;
  return (challenge.participations ?? []).reduce((sum, p) => sum + (p.contribution ?? 0), 0);
}

// ─────────────────────────────────────────────
// Session Detail Modal
// ─────────────────────────────────────────────

function SessionDetailModal({ item, onClose }: { item: ActivityFeedItem; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const c = item.content as any;
  const isWorkout = item.type === 'workout';

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (isWorkout) {
          let query = supabase
            .from('workout_sessions')
            .select('*, sets:workout_sets(*, exercise:exercises(*))')
            .eq('user_id', item.user_id);
          if (c.session_id) {
            query = query.eq('id', c.session_id);
          } else {
            // fallback: séance la plus proche du created_at
            const ts = new Date(item.created_at);
            const from = new Date(ts.getTime() - 5 * 60000).toISOString();
            const to   = new Date(ts.getTime() + 5 * 60000).toISOString();
            query = query.gte('date', from).lte('date', to).order('date', { ascending: false }).limit(1);
          }
          const { data: res } = await query.maybeSingle();
          setData(res);
        } else {
          let query = supabase
            .from('running_sessions')
            .select('*, shoe:shoes(*)')
            .eq('user_id', item.user_id);
          if (c.session_id) {
            query = query.eq('id', c.session_id);
          } else {
            const ts = new Date(item.created_at);
            const from = new Date(ts.getTime() - 5 * 60000).toISOString();
            const to   = new Date(ts.getTime() + 5 * 60000).toISOString();
            query = query.gte('date', from).lte('date', to).order('date', { ascending: false }).limit(1);
          }
          const { data: res } = await query.maybeSingle();
          setData(res);
        }
      } catch { setData(null); }
      finally { setLoading(false); }
    })();
  }, [item, isWorkout, c.session_id]);

  const feedbackLabel = (fb: string | null) => {
    if (fb === 'facile') return { label: 'Facile', color: 'text-green-500 border-green-900/50' };
    if (fb === 'difficile') return { label: 'Difficile', color: 'text-orange-500 border-orange-900/50' };
    if (fb === 'mort') return { label: 'Épuisé', color: 'text-red-500 border-red-900/50' };
    return null;
  };

  const runTypeLabel = (t: string | null) => {
    if (t === 'fractionne') return 'Fractionné';
    if (t === 'endurance') return 'Endurance';
    if (t === 'tempo') return 'Tempo';
    return t;
  };

  const weatherLabel = (w: string | null) => {
    if (w === 'ensoleille') return '☀️ Ensoleillé';
    if (w === 'nuageux') return '☁️ Nuageux';
    if (w === 'pluie') return '🌧️ Pluie';
    if (w === 'vent') return '💨 Vent';
    if (w === 'neige') return '❄️ Neige';
    return w;
  };

  // Regrouper les sets par exercice
  const groupedSets = React.useMemo(() => {
    if (!data?.sets) return [];
    const map: Record<string, { name: string; muscleGroup: string; sets: any[] }> = {};
    for (const s of data.sets) {
      const id = s.exercise_id;
      if (!map[id]) map[id] = { name: s.exercise?.name ?? '—', muscleGroup: s.exercise?.muscle_group ?? '', sets: [] };
      map[id].sets.push(s);
    }
    return Object.values(map).map(g => ({ ...g, sets: g.sets.sort((a: any, b: any) => a.set_number - b.set_number) }));
  }, [data]);

  const title = isWorkout ? 'Détails — Séance muscu' : 'Détails — Course';

  return (
    <Modal isOpen onClose={onClose} title={title} size="md">
      <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
        {loading && <Loader text="Chargement de la séance..." />}
        {!loading && !data && (
          <p className="text-sm text-[#6b6b6b] text-center py-4">Détails non disponibles pour cette séance.</p>
        )}

        {/* ── MUSCU ── */}
        {!loading && data && isWorkout && (
          <>
            {data.name && (
              <h3 className="font-rajdhani font-bold text-lg text-[#f5f5f5] tracking-wide uppercase border-b border-white/5 pb-2">
                {data.name}
              </h3>
            )}
            {/* Méta */}
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="text-[#a3a3a3]">{formatDate(data.date, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              {data.total_tonnage != null && (
                <span className="font-rajdhani font-bold text-[#c9a870]">
                  {data.total_tonnage.toLocaleString('fr-FR')} kg soulevés
                </span>
              )}
              {(() => { const fb = feedbackLabel(data.feedback); return fb ? (
                <span className={`text-xs border px-2 py-0.5 font-rajdhani font-semibold uppercase ${fb.color}`}>{fb.label}</span>
              ) : null; })()}
            </div>
            {data.notes && <p className="text-sm text-[#a3a3a3] italic border-l-2 border-[#c9a870]/30 pl-3">{data.notes}</p>}

            {/* Exercices */}
            {groupedSets.length === 0 && <p className="text-sm text-[#6b6b6b]">Aucun exercice enregistré.</p>}
            <div className="space-y-4">
              {groupedSets.map((group, gi) => (
                <div key={gi} className="border border-white/5">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-white/2">
                    <Dumbbell className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    <span className="font-rajdhani font-semibold text-[#f5f5f5] text-sm tracking-wide uppercase">{group.name}</span>
                    <span className="text-xs text-[#6b6b6b] ml-auto">{group.muscleGroup}</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {group.sets.map((s: any, si: number) => (
                      <div key={si} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span className="text-[#6b6b6b] w-14">Série {s.set_number}</span>
                        <span className="text-[#d4d4d4]">{s.reps} reps</span>
                        <span className="font-rajdhani font-bold text-[#c9a870]">{s.weight} kg</span>
                        <span className="text-[#4a4a4a] text-xs">{(s.reps * s.weight).toLocaleString('fr-FR')} kg</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── COURSE ── */}
        {!loading && data && !isWorkout && (
          <>
            {data.name && (
              <h3 className="font-rajdhani font-bold text-lg text-blue-400 tracking-wide uppercase border-b border-white/5 pb-2">
                {data.name}
              </h3>
            )}
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="text-[#a3a3a3]">{formatDate(data.date, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              {data.run_type && (
                <span className="text-xs border border-blue-800/50 text-blue-400 px-2 py-0.5 font-rajdhani font-semibold uppercase">
                  {runTypeLabel(data.run_type)}
                </span>
              )}
              {(() => { const fb = feedbackLabel(data.feedback); return fb ? (
                <span className={`text-xs border px-2 py-0.5 font-rajdhani font-semibold uppercase ${fb.color}`}>{fb.label}</span>
              ) : null; })()}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Footprints className="w-4 h-4 text-blue-400" />, label: 'Distance', value: formatDistance(data.distance) },
                { icon: <Star className="w-4 h-4 text-[#c9a870]" />, label: 'Durée', value: formatDuration(data.duration) },
                { icon: <TrendingUp className="w-4 h-4 text-green-500" />, label: 'Allure', value: data.pace_min_per_km ? formatPace(data.pace_min_per_km) : '—' },
                { icon: <Flame className="w-4 h-4 text-red-400" />, label: 'FC moy.', value: data.avg_heart_rate ? `${data.avg_heart_rate} bpm` : '—' },
                { icon: <Flame className="w-4 h-4 text-red-600" />, label: 'FC max.', value: data.max_heart_rate ? `${data.max_heart_rate} bpm` : '—' },
                { icon: <Wind className="w-4 h-4 text-[#a3a3a3]" />, label: 'Dénivelé +', value: data.elevation_gain != null ? `${data.elevation_gain} m` : '—' },
                { icon: <Wind className="w-4 h-4 text-[#6b6b6b]" />, label: 'Dénivelé −', value: data.elevation_loss != null ? `${data.elevation_loss} m` : '—' },
                { icon: <Thermometer className="w-4 h-4 text-orange-400" />, label: 'Météo', value: data.weather_temp != null ? `${data.weather_temp}°C${data.weather_condition ? ` · ${weatherLabel(data.weather_condition)}` : ''}` : weatherLabel(data.weather_condition) ?? '—' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-2 border border-white/5 px-3 py-2">
                  {stat.icon}
                  <div>
                    <p className="text-xs text-[#6b6b6b] uppercase tracking-wide">{stat.label}</p>
                    <p className="text-sm font-rajdhani font-semibold text-[#e5e5e5]">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {data.shoe && (
              <div className="flex items-center gap-2 text-sm text-[#a3a3a3] border border-white/5 px-3 py-2">
                <PersonStanding className="w-4 h-4 text-[#c9a870]" />
                <span>Chaussure : <span className="text-[#e5e5e5] font-medium">{[data.shoe.brand, data.shoe.model].filter(Boolean).join(' ')}</span></span>
              </div>
            )}
            {data.notes && <p className="text-sm text-[#a3a3a3] italic border-l-2 border-blue-800/50 pl-3">{data.notes}</p>}
          </>
        )}
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Feed item card
// ─────────────────────────────────────────────

interface FeedItemCardProps {
  item: ActivityFeedItem;
  currentUserId: string | undefined;
  onLike: (itemId: string) => void;
  onCommentAdded: (itemId: string, comment: ActivityComment) => void;
  onCommentDeleted: (itemId: string, commentId: string) => void;
}

function FeedItemCard({ item, currentUserId, onLike, onCommentAdded, onCommentDeleted }: FeedItemCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const canShowDetail = item.type === 'workout' || item.type === 'run';
  const [sendingComment, setSendingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const username = item.user?.username ?? 'Inconnu';
  const level = item.user?.global_level ?? 1;
  const initials = username.slice(0, 2).toUpperCase();
  const likes = item.likes ?? [];
  const comments = item.comments ?? [];
  const hasLiked = currentUserId ? likes.some(l => l.user_id === currentUserId) : false;

  async function handleSendComment() {
    if (!commentText.trim() || !currentUserId) return;
    setSendingComment(true);
    try {
      const newComment = await feedService.addComment(item.id, currentUserId, commentText.trim());
      setCommentText('');
      onCommentAdded(item.id, newComment as ActivityComment);
    } catch {
      // silently fail
    } finally {
      setSendingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    setDeletingCommentId(commentId);
    try {
      await feedService.deleteComment(commentId);
      onCommentDeleted(item.id, commentId);
    } catch {
      // silently fail
    } finally {
      setDeletingCommentId(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  }

  // Config par type d'activité
  const typeConfig = (() => {
    const c = item.content as any;
    switch (c.type ?? item.type) {
      case 'workout': return {
        label: (c as any).name ? (c as any).name.toUpperCase() : 'SÉANCE MUSCU',
        borderColor: 'border-l-red-800/70',
        labelColor: 'text-red-400',
        stats: `${c.tonnage.toLocaleString('fr-FR')} kg · ${c.sets_count} sér.`,
        feedback: c.feedback ?? null,
      };
      case 'run': return {
        label: (c as any).name ? (c as any).name.toUpperCase() : 'COURSE',
        borderColor: 'border-l-blue-800/70',
        labelColor: 'text-blue-500',
        stats: `${formatDistance(c.distance)} · ${formatDuration(c.duration)}`,
        feedback: (c as any).feedback ?? null,
      };
      case 'badge': return {
        label: 'BADGE DÉBLOQUÉ',
        borderColor: 'border-l-yellow-700/70',
        labelColor: 'text-yellow-500',
        stats: c.badge_name,
        feedback: null,
      };
      case 'level_up': return {
        label: `NIVEAU ${c.level} ATTEINT`,
        borderColor: 'border-l-[#c9a870]/60',
        labelColor: 'text-[#c9a870]',
        stats: null,
        subLabel: `Statut débloqué : ${getStatusTitle(c.level)}`,
        subLabelColor: 'text-[#c9a870]',
        feedback: null,
      };
      case 'record': return {
        label: 'NOUVEAU RECORD',
        borderColor: 'border-l-orange-800/70',
        labelColor: 'text-orange-600',
        stats: c.discipline,
        feedback: null,
      };
      case 'challenge_completed': return {
        label: 'DÉFI COMPLÉTÉ',
        borderColor: 'border-l-pink-800/70',
        labelColor: 'text-pink-600',
        stats: c.challenge_title,
        feedback: null,
      };
      default: return null;
    }
  })();

  if (!typeConfig) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`border border-white/5 border-l-2 ${typeConfig.borderColor} bg-[#111111] p-4 space-y-3`}
    >
      {/* Header : avatar + nom + niveau + temps */}
      <div className="flex items-center gap-3">
        <Link to={`/profil/${item.user_id}`} className="flex-shrink-0 w-8 h-8 border border-[#c9a870]/30 overflow-hidden bg-[#1c1c1c] flex items-center justify-center hover:border-[#c9a870]/70 transition-colors">
          {item.user?.avatar_url ? (
            <img src={item.user.avatar_url} alt={username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold font-rajdhani text-[#c9a870]">{initials}</span>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <Link to={`/profil/${item.user_id}`} className="font-rajdhani font-bold text-[#f5f5f5] tracking-wide uppercase text-sm hover:text-[#c9a870] transition-colors">{username}</Link>
            <span className="text-xs text-[#4a4a4a]">Niv. {level}</span>
          </div>
          <p className="text-xs text-[#4a4a4a]">{formatRelativeTime(item.created_at)}</p>
        </div>
      </div>

      {/* Contenu : type à gauche, stats à droite */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`font-rajdhani font-semibold tracking-wide text-sm ${typeConfig.labelColor}`}>
            {typeConfig.label}
          </p>
          {(typeConfig as any).subLabel && (
            <p className={`font-rajdhani font-semibold tracking-wide text-sm mt-0.5 ${(typeConfig as any).subLabelColor ?? 'text-[#a3a3a3]'}`}>
              {(typeConfig as any).subLabel}
            </p>
          )}
          {typeConfig.feedback && (
            <span className="inline-block mt-1 text-xs text-[#6b6b6b] border border-white/8 px-2 py-0.5 uppercase tracking-wide font-rajdhani">
              {typeConfig.feedback}
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {typeConfig.stats && (
            <span className="text-xs text-[#a3a3a3] text-right">{typeConfig.stats}</span>
          )}
          {canShowDetail && (
            <button
              onClick={() => setShowDetail(true)}
              className="flex items-center gap-1 text-xs text-[#6b6b6b] hover:text-[#c9a870] transition-colors font-rajdhani font-medium uppercase tracking-wide"
            >
              Voir les détails <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Footer : like + commentaires */}
      <div className="flex items-center gap-4 pt-1 border-t border-white/5">
        <button
          onClick={() => onLike(item.id)}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            hasLiked ? 'text-red-400' : 'text-[#4a4a4a] hover:text-[#a3a3a3]'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-red-400' : ''}`} />
          <span>{likes.length}</span>
        </button>

        <button
          onClick={() => {
            setShowComments(prev => !prev);
            if (!showComments) setTimeout(() => inputRef.current?.focus(), 100);
          }}
          className="flex items-center gap-1.5 text-xs text-[#4a4a4a] hover:text-[#a3a3a3] transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{comments.length}</span>
        </button>
      </div>

        {/* Comments section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-2 space-y-2">
                {/* Existing comments */}
                {comments.length > 0 && (
                  <div className="space-y-2">
                    {comments.map(comment => (
                      <div key={comment.id} className="flex items-start gap-2 group">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-700/80 border border-white/10/50 flex items-center justify-center mt-0.5">
                          <span className="text-xs font-bold text-[#d4d4d4]">
                            {(comment.user?.username ?? '?').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-[#d4d4d4]">
                              {comment.user?.username ?? 'Inconnu'}
                            </span>
                            <span className="text-xs text-[#4a4a4a]">
                              {formatRelativeTime(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-[#a3a3a3] mt-0.5 break-words">{comment.content}</p>
                        </div>
                        {currentUserId && comment.user_id === currentUserId && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={deletingCommentId === comment.id}
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-[#4a4a4a] hover:text-red-400"
                            aria-label="Supprimer le commentaire"
                          >
                            {deletingCommentId === comment.id ? (
                              <span className="text-xs">...</span>
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add comment input */}
                {currentUserId && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ajouter un commentaire..."
                      className="flex-1 bg-[#1c1c1c] border border-white/8/60 rounded px-3 py-2 text-xs text-[#e5e5e5] placeholder-slate-600 focus:outline-none focus:border-[#c9a870]/40 transition-colors"
                    />
                    <button
                      onClick={handleSendComment}
                      disabled={sendingComment || !commentText.trim()}
                      className="flex-shrink-0 p-2 rounded bg-transparent border border-red-800/50 text-red-400 hover:bg-transparent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Envoyer le commentaire"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {showDetail && canShowDetail && (
        <SessionDetailModal item={item} onClose={() => setShowDetail(false)} />
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Feed tab
// ─────────────────────────────────────────────

const FEED_PAGE_SIZE = 10;

interface FeedTabProps {
  currentUserId: string | undefined;
}

function FeedTab({ currentUserId }: FeedTabProps) {
  const [items, setItems] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const offset = useRef(0);

  const fetchFeed = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      offset.current = 0;
    } else {
      setLoadingMore(true);
    }
    setError('');

    try {
      const data = await feedService.getFeed(FEED_PAGE_SIZE, offset.current);
      if (reset) {
        setItems(data);
      } else {
        setItems(prev => [...prev, ...data]);
      }
      setHasMore(data.length === FEED_PAGE_SIZE);
      offset.current += data.length;
    } catch {
      setError('Impossible de charger le feed.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(true);
  }, [fetchFeed]);

  function handleLike(itemId: string) {
    if (!currentUserId) return;

    // Optimistic update
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const likes = item.likes ?? [];
      const hasLiked = likes.some(l => l.user_id === currentUserId);
      const newLikes = hasLiked
        ? likes.filter(l => l.user_id !== currentUserId)
        : [...likes, { id: `optimistic-${Date.now()}`, activity_id: itemId, user_id: currentUserId, created_at: new Date().toISOString() }];
      return { ...item, likes: newLikes };
    }));

    // API call (fire-and-forget)
    feedService.toggleLike(itemId, currentUserId).catch(() => {
      // Revert on failure
      fetchFeed(true);
    });
  }

  function handleCommentAdded(itemId: string, comment: ActivityComment) {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      return { ...item, comments: [...(item.comments ?? []), comment] };
    }));
  }

  function handleCommentDeleted(itemId: string, commentId: string) {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      return { ...item, comments: (item.comments ?? []).filter(c => c.id !== commentId) };
    }));
  }

  if (loading) return <Loader text="Chargement du feed..." />;

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <Button variant="ghost" size="sm" onClick={() => fetchFeed(true)} className="mt-3">
          Réessayer
        </Button>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="p-10 text-center">
        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-[#4a4a4a]" />
        <p className="text-[#a3a3a3] font-medium">Le feed est vide pour l'instant.</p>
        <p className="text-[#6b6b6b] text-sm mt-1">Les activités de la communauté apparaîtront ici.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map(item => (
        <FeedItemCard
          key={item.id}
          item={item}
          currentUserId={currentUserId}
          onLike={handleLike}
          onCommentAdded={handleCommentAdded}
          onCommentDeleted={handleCommentDeleted}
        />
      ))}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            loading={loadingMore}
            onClick={() => fetchFeed(false)}
          >
            Charger plus
          </Button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Challenge card
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
  challenge,
  userId,
  onJoin,
  onContribute,
  joiningId,
  showMyContribution = false,
}: ChallengeCardProps) {
  const total = calcTotal(challenge);
  const progress = Math.min((total / challenge.target_value) * 100, 100);
  const participants = (challenge.participations ?? []).length;
  const days = daysRemaining(challenge.end_date);
  const isParticipant = (challenge.participations ?? []).some(p => p.user_id === userId);
  const myContribution = (challenge.participations ?? []).find(p => p.user_id === userId)?.contribution ?? 0;
  const isJoining = joiningId === challenge.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${typeBadgeClass(challenge.type)}`}
            >
              {challenge.type === 'distance' && <Target className="w-3 h-3" />}
              {challenge.type === 'tonnage' && <Trophy className="w-3 h-3" />}
              {challenge.type === 'sessions' && <Calendar className="w-3 h-3" />}
              {typeLabel(challenge.type)}
            </span>
            {challenge.is_flash && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border bg-transparent text-amber-500 border-amber-700/50">
                <Zap className="w-3 h-3" />
                FLASH
              </span>
            )}
          </div>
          {challenge.creator && (
            <span className="text-xs text-[#6b6b6b] whitespace-nowrap">
              par {challenge.creator.username}
            </span>
          )}
        </div>

        {/* Title & description */}
        <div>
          <h3 className="font-semibold text-[#f5f5f5] text-base leading-snug">{challenge.title}</h3>
          {challenge.description && (
            <p className="text-sm text-[#a3a3a3] mt-1 leading-relaxed">{challenge.description}</p>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <ProgressBar
            value={progress}
            color={typeProgressColor(challenge.type)}
            height="sm"
          />
          <div className="flex justify-between items-center text-xs text-[#a3a3a3]">
            <span>
              {total.toLocaleString('fr-FR')} / {challenge.target_value.toLocaleString('fr-FR')} {challenge.unit}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Footer meta */}
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
            {days > 0 ? (
              <span className="text-amber-400 font-medium">{days}j restant{days !== 1 ? 's' : ''}</span>
            ) : (
              <span className="text-red-400 font-medium">Terminé</span>
            )}
          </div>
        </div>

        {/* My contribution (mine tab) */}
        {showMyContribution && isParticipant && (
          <div className="rounded bg-[#1c1c1c] border border-white/5 px-3 py-2 text-sm text-[#d4d4d4]">
            Ma contribution :{' '}
            <span className="font-semibold text-red-300">
              {myContribution.toLocaleString('fr-FR')} {challenge.unit}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          {!isParticipant ? (
            <Button
              size="sm"
              variant="outline"
              icon={<Plus className="w-3.5 h-3.5" />}
              loading={isJoining}
              onClick={() => onJoin(challenge.id)}
              disabled={days === 0}
            >
              Rejoindre
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => onContribute(challenge)}
              disabled={days === 0}
            >
              + Ajouter
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Contribution modal
// ─────────────────────────────────────────────

interface ContributeModalProps {
  challenge: CommunityChallenge | null;
  userId: string | undefined;
  onClose: () => void;
  onSaved: () => void;
}

function ContributeModal({ challenge, userId, onClose, onSaved }: ContributeModalProps) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (challenge) {
      setValue('');
      setError('');
    }
  }, [challenge]);

  if (!challenge) return null;

  const myContribution = (challenge.participations ?? []).find(p => p.user_id === userId)?.contribution ?? 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!challenge || !userId) return;

    const added = parseFloat(value);
    if (isNaN(added) || added <= 0) {
      setError('Valeur invalide.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const newValue = myContribution + added;
      const { error: supaErr } = await supabase
        .from('challenge_participations')
        .update({ contribution: newValue })
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
          Défi :{' '}
          <span className="font-medium text-[#e5e5e5]">{challenge.title}</span>
        </p>
        <p className="text-xs text-[#6b6b6b]">
          Ta contribution actuelle :{' '}
          <span className="text-[#d4d4d4] font-medium">
            {myContribution.toLocaleString('fr-FR')} {challenge.unit}
          </span>
        </p>

        <Input
          label={`Quantité à ajouter (${challenge.unit})`}
          type="number"
          min="0"
          step="any"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={`ex. 5`}
          error={error}
          autoFocus
        />

        {value && !isNaN(parseFloat(value)) && parseFloat(value) > 0 && (
          <p className="text-xs text-[#6b6b6b]">
            Nouveau total :{' '}
            <span className="text-red-300 font-semibold">
              {(myContribution + parseFloat(value)).toLocaleString('fr-FR')} {challenge.unit}
            </span>
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button type="submit" loading={saving} className="flex-1">
            Confirmer
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Create form
// ─────────────────────────────────────────────

interface CreateFormProps {
  userId: string;
  onCreated: () => void;
}

interface CreateFormState {
  title: string;
  description: string;
  type: 'distance' | 'tonnage' | 'sessions';
  target_value: string;
  start_date: string;
  end_date: string;
}

function CreateForm({ userId, onCreated }: CreateFormProps) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState<CreateFormState>({
    title: '',
    description: '',
    type: 'distance',
    target_value: '',
    start_date: today,
    end_date: '',
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
    if (form.start_date && form.end_date && form.end_date <= form.start_date) {
      e.end_date = 'La date de fin doit être après la date de début.';
    }
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

      setForm({
        title: '',
        description: '',
        type: 'distance',
        target_value: '',
        start_date: today,
        end_date: '',
      });
      setSuccess(true);
      onCreated();
    } catch {
      setErrors({ title: 'Erreur lors de la création. Réessaie.' });
    } finally {
      setSaving(false);
    }
  }

  const typeOptions = [
    { value: 'distance', label: 'Distance (km)' },
    { value: 'tonnage', label: 'Tonnage (kg)' },
    { value: 'sessions', label: 'Séances' },
  ];

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 rounded bg-transparent border border-red-800/50">
          <Plus className="w-4 h-4 text-red-400" />
        </div>
        <h2 className="font-semibold text-[#f5f5f5]">Proposer un défi</h2>
      </div>

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded bg-transparent border border-green-900/40 px-4 py-3 text-sm text-green-500"
        >
          Defi cree avec succes ! Il est maintenant actif.
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Titre du défi"
          placeholder="ex. 500 km collectifs en janvier"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          error={errors.title}
        />

        <Textarea
          label="Description (optionnel)"
          placeholder="Décris le défi, les règles, l'objectif..."
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={3}
        />

        <Select
          label="Type de défi"
          options={typeOptions}
          value={form.type}
          onChange={e => set('type', e.target.value as CreateFormState['type'])}
          error={errors.type}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={`Objectif (${unitForType(form.type)})`}
            type="number"
            min="1"
            step="any"
            placeholder="ex. 500"
            value={form.target_value}
            onChange={e => set('target_value', e.target.value)}
            error={errors.target_value}
          />
          <div className="flex items-end pb-0.5">
            <span className="text-sm text-[#a3a3a3] bg-[#1c1c1c] border border-white/8 rounded px-4 py-2.5 w-full">
              {unitForType(form.type)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date de début"
            type="date"
            value={form.start_date}
            onChange={e => set('start_date', e.target.value)}
            error={errors.start_date}
          />
          <Input
            label="Date de fin"
            type="date"
            value={form.end_date}
            onChange={e => set('end_date', e.target.value)}
            error={errors.end_date}
          />
        </div>

        <div className="pt-1">
          <Button
            type="submit"
            loading={saving}
            icon={<Plus className="w-4 h-4" />}
            className="w-full"
          >
            Proposer le défi
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Main page — Les Monstres (feed only)
// ─────────────────────────────────────────────

export function CommunityPage() {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-2.5 border border-[#c9a870]/30">
          <Users className="w-6 h-6 text-[#c9a870]" />
        </div>
        <div>
          <h1 className="font-rajdhani text-3xl font-bold tracking-wide uppercase text-[#c9a870]">
            Les Monstres
          </h1>
          <p className="text-[#a3a3a3] text-sm mt-0.5">Ce que font les autres guerriers</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <FeedTab currentUserId={profile?.id} />
      </motion.div>
    </div>
  );
}
