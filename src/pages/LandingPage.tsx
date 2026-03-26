import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Shield, Dumbbell, PersonStanding, Zap, Flame, Trophy,
  Users, Star, ChevronRight, TrendingUp, Target, Swords,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from '../components/common/Loader';

/* ── Données statiques ───────────────────────────────────────── */

const disciplines = [
  {
    icon: Dumbbell,
    label: 'Musculation',
    desc: 'Séances, tonnage, records personnels',
    color: 'text-yellow-400',
    border: 'border-yellow-900/40',
    bg: 'bg-yellow-950/20',
  },
  {
    icon: PersonStanding,
    label: 'Running',
    desc: 'Distance, allure, zones cardio',
    color: 'text-blue-400',
    border: 'border-blue-900/40',
    bg: 'bg-blue-950/20',
  },
  {
    icon: Zap,
    label: 'Calisthenics',
    desc: 'Skills, niveaux, progressions',
    color: 'text-violet-400',
    border: 'border-violet-900/40',
    bg: 'bg-violet-950/20',
  },
  {
    icon: Flame,
    label: 'Crossfit',
    desc: 'WODs EMOM, AMRAP, FOR TIME',
    color: 'text-orange-400',
    border: 'border-orange-900/40',
    bg: 'bg-orange-950/20',
  },
];

const features = [
  {
    icon: TrendingUp,
    title: 'Progression XP & Niveaux',
    desc: "Chaque séance te rapporte de l'XP. Monte en grade de Novice à Élite.",
  },
  {
    icon: Trophy,
    title: 'Hall of Fame',
    desc: 'Tes records personnels tracés et exposés. Bats-les. Recommence.',
  },
  {
    icon: Users,
    title: 'Feed communautaire',
    desc: 'Partage tes séances, like, commente, défie tes amis.',
  },
  {
    icon: Swords,
    title: "Objectifs d'équipe",
    desc: "Crée des challenges communs et progresse avec ta communauté.",
  },
  {
    icon: Star,
    title: 'Badges & Récompenses',
    desc: 'Débloque des badges en accomplissant des exploits sportifs.',
  },
  {
    icon: Target,
    title: 'Objectifs personnels',
    desc: 'Fixe-toi des cibles et suis ta progression semaine par semaine.',
  },
];

const grades = [
  { label: 'Novice', range: 'Niv. 1–4', color: '#6b7280' },
  { label: 'Guerrier', range: 'Niv. 5–9', color: '#c9a870' },
  { label: 'Champion', range: 'Niv. 10–14', color: '#60a5fa' },
  { label: 'Élite', range: 'Niv. 15+', color: '#a78bfa' },
];

/* ── Composants utilitaires ──────────────────────────────────── */

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Page principale ─────────────────────────────────────────── */

export function LandingPage() {
  const { user, loading } = useAuth();

  if (loading) return <Loader fullScreen text="Chargement..." />;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-[#c9a870]/10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#c9a870]" />
            <a href="#hero" className="font-rajdhani font-bold text-[#c9a870] text-lg uppercase tracking-wide hover:opacity-80 transition-opacity">
              Gain &amp; Glory
            </a>
          </div>
          <div className="hidden md:flex items-center gap-5 text-xs font-rajdhani font-bold uppercase tracking-widest text-[#a3a3a3]">
            <a href="#disciplines" className="hover:text-[#c9a870] transition-colors">Disciplines</a>
            <a href="#niveaux" className="hover:text-[#c9a870] transition-colors">Niveaux</a>
            <a href="#features" className="hover:text-[#c9a870] transition-colors">Features</a>
            <a href="#rejoindre" className="hover:text-[#c9a870] transition-colors">Rejoindre</a>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="text-sm bg-[#c9a870] text-black font-rajdhani font-bold uppercase tracking-wide px-4 py-1.5 hover:bg-[#d4b87a] transition-colors"
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-[#a3a3a3] hover:text-[#f5f5f5] transition-colors px-3 py-1.5"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="text-sm bg-[#c9a870] text-black font-rajdhani font-bold uppercase tracking-wide px-4 py-1.5 hover:bg-[#d4b87a] transition-colors"
                >
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>

      {/* ── Hero ── */}
      <section id="hero" className="relative flex flex-col items-center justify-center text-center px-6 py-28 md:py-40 overflow-hidden">
        {/* Fond logo flou */}
        <div className="absolute inset-0 z-0">
          <img
            src="/logo.png"
            alt=""
            className="w-full h-full object-cover object-center opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-[#0a0a0a]/40 to-[#0a0a0a]" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-3 mb-6"
          >
            <Shield className="w-12 h-12 md:w-16 md:h-16 text-[#c9a870]" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-rajdhani font-black text-5xl md:text-7xl uppercase tracking-wider text-[#c9a870] leading-none mb-4"
          >
            Gain &amp; Glory
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-[#d4d4d4] mb-3 max-w-xl mx-auto"
          >
            Suis tes entraînements. Gagne de l'<strong>XP</strong>. Monte en <strong>niveau</strong>.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-sm text-[#6b6b6b] mb-10"
          >
            Musculation · Running · Calisthenics · Crossfit
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-[#c9a870] text-black font-rajdhani font-black text-lg uppercase tracking-wide px-8 py-3 hover:bg-[#d4b87a] transition-all hover:scale-105"
            >
              Rejoindre l'arène
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 border border-[#c9a870]/40 text-[#c9a870] font-rajdhani font-semibold text-base uppercase tracking-wide px-6 py-3 hover:bg-[#c9a870]/10 transition-colors"
            >
              Se connecter
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── 4 Disciplines ── */}
      <section id="disciplines" className="py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-12">
            <h2 className="font-rajdhani font-black text-3xl md:text-4xl uppercase tracking-wide text-[#f5f5f5] mb-2">
              4 disciplines. Un seul profil.
            </h2>
            <p className="text-[#6b6b6b] text-sm">Chaque sport a ses <strong>stats</strong>, ses <strong>records</strong>, son <strong>niveau</strong>.</p>
          </FadeIn>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 list-none p-0 m-0">
            {disciplines.map((d, i) => (
              <li key={d.label}>
              <FadeIn delay={i * 0.08} className="h-full">
                <article className={`h-full p-6 border ${d.border} ${d.bg} hover:scale-[1.02] transition-transform`}>
                  <d.icon className={`w-8 h-8 ${d.color} mb-4`} />
                  <h3 className={`font-rajdhani font-bold text-lg uppercase ${d.color} mb-1`}>
                    {d.label}
                  </h3>
                  <p className="text-sm text-[#a3a3a3]">{d.desc}</p>
                </article>
              </FadeIn>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Gamification / Niveaux ── */}
      <section id="niveaux" className="py-20 px-6 bg-[#0d0d0d] border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-12">
            <h2 className="font-rajdhani font-black text-3xl md:text-4xl uppercase tracking-wide text-[#f5f5f5] mb-2">
              Progresse. Monte en grade.
            </h2>
            <p className="text-[#6b6b6b] text-sm">Chaque séance te rapporte de l'<strong>XP</strong> et te rapproche du <strong>rang suivant</strong>.</p>
          </FadeIn>

          {/* XP Bar mockée */}
          <FadeIn delay={0.1} className="mb-10">
            <div className="bg-[#111] border border-[#c9a870]/15 p-6 max-w-lg mx-auto">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-rajdhani font-bold text-[#c9a870] text-lg">Niveau 7</span>
                  <span className="text-[#6b6b6b] text-sm ml-2">· Guerrier</span>
                </div>
                <span className="text-xs text-[#6b6b6b]">340 / 450 XP</span>
              </div>
              <div className="h-2 bg-[#1c1c1c] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '75%' }}
                  transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                  viewport={{ once: true }}
                  className="h-full bg-gradient-to-r from-[#c9a870] to-[#f0d080] rounded-full"
                />
              </div>
              <p className="text-xs text-[#4a4a4a] mt-2">+60 XP lors de ta prochaine séance</p>
            </div>
          </FadeIn>

          {/* Grades */}
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3 list-none p-0 m-0">
            {grades.map((g, i) => (
              <li key={g.label}>
              <FadeIn delay={i * 0.07}>
                <div className="border border-white/8 p-4 text-center">
                  <p className="font-rajdhani font-bold text-base uppercase" style={{ color: g.color }}>
                    {g.label}
                  </p>
                  <p className="text-xs text-[#6b6b6b] mt-0.5">{g.range}</p>
                </div>
              </FadeIn>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-12">
            <h2 className="font-rajdhani font-black text-3xl md:text-4xl uppercase tracking-wide text-[#f5f5f5] mb-2">
              Tout ce qu'il te faut.
            </h2>
            <p className="text-[#6b6b6b] text-sm">De l'<strong>enregistrement</strong> à la <strong>compétition</strong>.</p>
          </FadeIn>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
            {features.map((f, i) => (
              <li key={f.title}>
              <FadeIn delay={i * 0.07}>
                <article className="p-5 border border-white/8 hover:border-[#c9a870]/30 hover:bg-[#c9a870]/5 transition-all">
                  <f.icon className="w-5 h-5 text-[#c9a870] mb-3" />
                  <h3 className="font-rajdhani font-bold text-sm uppercase tracking-wide text-[#f5f5f5] mb-1">
                    {f.title}
                  </h3>
                  <p className="text-xs text-[#6b6b6b] leading-relaxed">{f.desc}</p>
                </article>
              </FadeIn>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section id="rejoindre" className="py-28 px-6 border-t border-white/5 text-center">
        <FadeIn className="max-w-xl mx-auto">
          <Shield className="w-12 h-12 text-[#c9a870] mx-auto mb-6" />
          <h2 className="font-rajdhani font-black text-4xl md:text-5xl uppercase tracking-wide text-[#f5f5f5] mb-3">
            L'arène t'attend.
          </h2>
          <p className="text-[#6b6b6b] mb-8"><strong>Gratuit</strong>. Sans pub. Pour les <em>warriors</em>.</p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-[#c9a870] text-black font-rajdhani font-black text-lg uppercase tracking-wide px-10 py-4 hover:bg-[#d4b87a] transition-all hover:scale-105"
          >
            Créer mon compte
            <ChevronRight className="w-5 h-5" />
          </Link>
        </FadeIn>
      </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-6 px-6 text-center">
        <p className="text-xs text-[#4a4a4a]">
          © 2026 Gain &amp; Glory · Développé par Enzoulette ·{' '}
          <Link to="/login" className="hover:text-[#c9a870] transition-colors">
            Connexion
          </Link>
        </p>
      </footer>
    </div>
  );
}
