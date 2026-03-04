import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Users, Plus, Zap, Target, Trophy, Calendar, Heart, MessageCircle, Star, Dumbbell, PersonStanding, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { formatDate, formatRelativeTime, formatDistance, formatDuration, formatPace } from '../utils/calculations';
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
    case 'distance': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'tonnage': return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'sessions': return 'bg-green-500/20 text-green-300 border-green-500/30';
  }
}

function typeProgressColor(type: CommunityChallenge['type']): string {
  switch (type) {
    case 'distance': return 'bg-blue-500';
    case 'tonnage': return 'bg-red-500';
    case 'sessions': return 'bg-green-500';
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

  function renderContent() {
    const c = item.content;
    switch (c.type) {
      case 'workout':
        return (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 rounded-xl bg-blue-500/15 border border-blue-500/25">
              <Dumbbell className="w-4 h-4 text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-slate-200 font-medium">Séance muscu</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {c.tonnage.toLocaleString('fr-FR')} kg soulevés · {c.sets_count} séries
              </p>
              {c.feedback && (
                <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full bg-slate-700/70 border border-slate-600/50 text-slate-300">
                  {c.feedback}
                </span>
              )}
            </div>
          </div>
        );

      case 'run':
        return (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 rounded-xl bg-green-500/15 border border-green-500/25">
              <PersonStanding className="w-4 h-4 text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-slate-200 font-medium">Course</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {formatDistance(c.distance)} · {formatDuration(c.duration)} · {formatPace(c.pace)}
              </p>
            </div>
          </div>
        );

      case 'badge':
        return (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 rounded-xl bg-yellow-500/15 border border-yellow-500/25">
              <Trophy className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-slate-200 font-medium">Badge débloqué</p>
              <p className="text-xs text-slate-400 mt-0.5">{c.badge_name}</p>
            </div>
          </div>
        );

      case 'level_up':
        return (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 rounded-xl bg-red-500/15 border border-red-500/25">
              <Star className="w-4 h-4 text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-slate-200 font-medium">Niveau {c.level} atteint !</p>
              <p className="text-xs text-slate-400 mt-0.5">{c.title}</p>
            </div>
          </div>
        );

      case 'record':
        return (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 rounded-xl bg-orange-500/15 border border-orange-500/25">
              <Zap className="w-4 h-4 text-orange-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-slate-200 font-medium">Nouveau record</p>
              <p className="text-xs text-slate-400 mt-0.5">{c.discipline}</p>
            </div>
          </div>
        );

      case 'challenge_completed':
        return (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 rounded-xl bg-pink-500/15 border border-pink-500/25">
              <Target className="w-4 h-4 text-pink-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-slate-200 font-medium">Défi complété</p>
              <p className="text-xs text-slate-400 mt-0.5">{c.challenge_title}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-600/30 border border-red-500/40 flex items-center justify-center">
            <span className="text-xs font-bold text-red-300">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-100 truncate">{username}</span>
              <span className="text-xs text-slate-500">Niv. {level}</span>
            </div>
            <p className="text-xs text-slate-500">{formatRelativeTime(item.created_at)}</p>
          </div>
        </div>

        {/* Activity content */}
        {renderContent()}

        {/* Footer actions */}
        <div className="flex items-center gap-4 pt-1 border-t border-slate-700/50">
          <button
            onClick={() => onLike(item.id)}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              hasLiked ? 'text-red-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Heart className={`w-4 h-4 ${hasLiked ? 'fill-red-400' : ''}`} />
            <span>{likes.length}</span>
          </button>

          <button
            onClick={() => {
              setShowComments(prev => !prev);
              if (!showComments) {
                setTimeout(() => inputRef.current?.focus(), 100);
              }
            }}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
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
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-700/80 border border-slate-600/50 flex items-center justify-center mt-0.5">
                          <span className="text-[10px] font-bold text-slate-300">
                            {(comment.user?.username ?? '?').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-slate-300">
                              {comment.user?.username ?? 'Inconnu'}
                            </span>
                            <span className="text-[10px] text-slate-600">
                              {formatRelativeTime(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 break-words">{comment.content}</p>
                        </div>
                        {currentUserId && comment.user_id === currentUserId && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={deletingCommentId === comment.id}
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-600 hover:text-red-400"
                            aria-label="Supprimer le commentaire"
                          >
                            {deletingCommentId === comment.id ? (
                              <span className="text-[10px]">...</span>
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
                      className="flex-1 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-red-500/60 transition-colors"
                    />
                    <button
                      onClick={handleSendComment}
                      disabled={sendingComment || !commentText.trim()}
                      className="flex-shrink-0 p-2 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
      </Card>
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
        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <p className="text-slate-400 font-medium">Le feed est vide pour l'instant.</p>
        <p className="text-slate-500 text-sm mt-1">Les activités de la communauté apparaîtront ici.</p>
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
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/30">
                <Zap className="w-3 h-3" />
                FLASH
              </span>
            )}
          </div>
          {challenge.creator && (
            <span className="text-xs text-slate-500 whitespace-nowrap">
              par {challenge.creator.username}
            </span>
          )}
        </div>

        {/* Title & description */}
        <div>
          <h3 className="font-semibold text-slate-100 text-base leading-snug">{challenge.title}</h3>
          {challenge.description && (
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">{challenge.description}</p>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <ProgressBar
            value={progress}
            color={typeProgressColor(challenge.type)}
            height="sm"
          />
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>
              {total.toLocaleString('fr-FR')} / {challenge.target_value.toLocaleString('fr-FR')} {challenge.unit}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Footer meta */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
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
          <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 px-3 py-2 text-sm text-slate-300">
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
        <p className="text-sm text-slate-400">
          Défi :{' '}
          <span className="font-medium text-slate-200">{challenge.title}</span>
        </p>
        <p className="text-xs text-slate-500">
          Ta contribution actuelle :{' '}
          <span className="text-slate-300 font-medium">
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
          <p className="text-xs text-slate-500">
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
        <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/30">
          <Plus className="w-4 h-4 text-red-400" />
        </div>
        <h2 className="font-semibold text-slate-100">Proposer un défi</h2>
      </div>

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-3 text-sm text-green-300"
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
            <span className="text-sm text-slate-400 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 w-full">
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
// Main page
// ─────────────────────────────────────────────

export function CommunityPage() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('feed');
  const [challenges, setChallenges] = useState<CommunityChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [contributeTarget, setContributeTarget] = useState<CommunityChallenge | null>(null);

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: supaErr } = await supabase
        .from('community_challenges')
        .select(`
          *,
          creator:profiles!created_by(username),
          participations:challenge_participations(
            user_id, contribution, completed,
            user:profiles(username)
          )
        `)
        .eq('status', 'active')
        .order('end_date', { ascending: true });

      if (supaErr) throw supaErr;

      const enriched = (data ?? []).map((c: CommunityChallenge) => ({
        ...c,
        total_contribution: (c.participations ?? []).reduce(
          (sum: number, p) => sum + (p.contribution ?? 0),
          0
        ),
      }));

      setChallenges(enriched);
    } catch {
      setError('Impossible de charger les défis.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  async function handleJoin(challengeId: string) {
    if (!profile) return;
    setJoiningId(challengeId);
    try {
      const { error: supaErr } = await supabase.from('challenge_participations').insert({
        challenge_id: challengeId,
        user_id: profile.id,
        contribution: 0,
      });
      if (supaErr) throw supaErr;
      await fetchChallenges();
    } catch {
      // silently fail — the user can retry
    } finally {
      setJoiningId(null);
    }
  }

  function handleOpenContribute(challenge: CommunityChallenge) {
    setContributeTarget(challenge);
  }

  function handleContributeSaved() {
    fetchChallenges();
  }

  const myChallenges = challenges.filter(c =>
    (c.participations ?? []).some(p => p.user_id === profile?.id)
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'feed', label: 'Feed', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'active', label: 'Défis actifs', icon: <Trophy className="w-4 h-4" /> },
    { id: 'mine', label: 'Mes contributions', icon: <Target className="w-4 h-4" /> },
    { id: 'create', label: 'Créer', icon: <Plus className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-2.5 rounded-2xl bg-pink-500/20 border border-pink-500/30">
          <Users className="w-6 h-6 text-pink-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Communauté</h1>
          <p className="text-slate-400 text-sm mt-0.5">Feed social et défis collectifs</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-1 p-1 bg-slate-800/60 border border-slate-700/50 rounded-2xl"
      >
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`
              flex-1 flex items-center justify-center gap-1.5 text-sm font-medium
              px-3 py-2 rounded-xl transition-all duration-200
              ${tab === t.id
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }
            `}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {/* ── Feed ── */}
        {tab === 'feed' && (
          <motion.div
            key="feed"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            <FeedTab currentUserId={profile?.id} />
          </motion.div>
        )}

        {/* ── Active challenges ── */}
        {tab === 'active' && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {loading && <Loader text="Chargement des défis..." />}

            {!loading && error && (
              <Card className="p-6 text-center">
                <p className="text-sm text-red-400">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchChallenges}
                  className="mt-3"
                >
                  Réessayer
                </Button>
              </Card>
            )}

            {!loading && !error && challenges.length === 0 && (
              <Card className="p-10 text-center">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p className="text-slate-400 font-medium">Aucun défi actif pour le moment.</p>
                <p className="text-slate-500 text-sm mt-1">
                  Sois le premier à en proposer un !
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTab('create')}
                  className="mt-4"
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Créer un défi
                </Button>
              </Card>
            )}

            {!loading && !error && challenges.map(challenge => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userId={profile?.id}
                onJoin={handleJoin}
                onContribute={handleOpenContribute}
                joiningId={joiningId}
              />
            ))}
          </motion.div>
        )}

        {/* ── My contributions ── */}
        {tab === 'mine' && (
          <motion.div
            key="mine"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {loading && <Loader text="Chargement..." />}

            {!loading && !profile && (
              <Card className="p-8 text-center">
                <p className="text-slate-400 text-sm">Connecte-toi pour voir tes contributions.</p>
              </Card>
            )}

            {!loading && profile && myChallenges.length === 0 && (
              <Card className="p-10 text-center">
                <Target className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p className="text-slate-400 font-medium">Tu ne participes à aucun défi.</p>
                <p className="text-slate-500 text-sm mt-1">
                  Rejoins un défi actif pour commencer.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTab('active')}
                  className="mt-4"
                >
                  Voir les défis
                </Button>
              </Card>
            )}

            {!loading && profile && myChallenges.map(challenge => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userId={profile?.id}
                onJoin={handleJoin}
                onContribute={handleOpenContribute}
                joiningId={joiningId}
                showMyContribution
              />
            ))}
          </motion.div>
        )}

        {/* ── Create ── */}
        {tab === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {profile ? (
              <CreateForm
                userId={profile.id}
                onCreated={() => {
                  fetchChallenges();
                  // stay on create tab so the user sees the success message
                }}
              />
            ) : (
              <Card className="p-8 text-center">
                <p className="text-slate-400 text-sm">Connecte-toi pour proposer un défi.</p>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contribution modal */}
      <ContributeModal
        challenge={contributeTarget}
        userId={profile?.id}
        onClose={() => setContributeTarget(null)}
        onSaved={handleContributeSaved}
      />
    </div>
  );
}
