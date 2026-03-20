# Gain & Glory — Documentation Technique

> Dernière mise à jour : refactor(calendar): refonte visuelle — hero cards "À venir", légende couleur, icônes cellules, strips, stats 4 sports

---

## Présentation

**Gain & Glory** est une Progressive Web App (PWA) de suivi sportif gamifiée, pensée pour la musculation et la course à pied. L'utilisateur gagne de l'XP, monte en niveau, débloque des badges, compare ses performances avec la communauté et participe à des objectifs collectifs.

---

## Stack technique

| Catégorie | Outil / Version |
|---|---|
| Framework UI | React 19 |
| Langage | TypeScript 5.9 |
| Bundler | Vite 7 |
| Styles | Tailwind CSS v4 (config via `@theme` dans `index.css`, plugin `@tailwindcss/vite`) |
| Animations | Framer Motion 12 |
| Icônes | Lucide React |
| Graphiques | Recharts 3 |
| Formulaires | React Hook Form 7 + Zod 4 (validation) |
| Routage | React Router v7 |
| Backend / BDD | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| PWA | vite-plugin-pwa + Workbox (service worker auto-généré) |
| Dates | date-fns 4 |

> **Note Tailwind v4** : il n'y a pas de `tailwind.config.js`. Toute la configuration du thème se fait directement dans `src/index.css` avec la directive `@theme`.

---

## Architecture du projet

```
src/
├── App.tsx                    # Routing principal (React Router)
├── main.tsx                   # Point d'entrée
├── index.css                  # Styles globaux + thème Tailwind v4
│
├── components/
│   ├── common/                # Composants UI réutilisables
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Loader.tsx
│   │   ├── Modal.tsx
│   │   ├── ProgressBar.tsx
│   │   └── Textarea / Select (inline dans certaines pages)
│   ├── layout/
│   │   ├── AppLayout.tsx      # Fond spartiate + layout global protégé
│   │   ├── Header.tsx         # Barre du haut (streak, notifications)
│   │   └── Navigation.tsx     # SideNav (desktop) + BottomNav (mobile)
│   ├── notifications/
│   │   └── NotificationCenter.tsx
│   └── xp-system/
│       ├── XPBar.tsx
│       └── LevelUpModal.tsx
│
├── contexts/
│   ├── AuthContext.tsx         # Auth Supabase + profil utilisateur courant
│   └── NotificationContext.tsx # Notifications realtime Supabase
│
├── lib/
│   └── supabase-client.ts      # Client Supabase (non-typé, createClient sans générique)
│
├── pages/                      # Une page = une route
│   ├── Login.tsx / Register.tsx
│   ├── ForgotPassword.tsx      # Envoi email de réinitialisation
│   ├── ResetPassword.tsx       # Formulaire nouveau mot de passe (PASSWORD_RECOVERY)
│   ├── Dashboard.tsx           # Résumé hebdo + actions rapides + motivation du jour
│   ├── Musculation.tsx         # Liste des séances muscu (édition/suppression)
│   ├── MuscuSession.tsx        # Formulaire nouvelle séance muscu
│   ├── Running.tsx             # Liste des courses (édition/suppression)
│   ├── RunSession.tsx          # Formulaire nouvelle course
│   ├── Weight.tsx              # Suivi du poids + graphique (édition/suppression)
│   ├── Calendar.tsx            # Calendrier d'activité (8 types : muscu, course, cali, crossfit, pesée, objectif, défi, événement) — hero cards "À venir", légende couleur, icônes + strips par cellule
│   ├── Goals.tsx               # Objectifs personnels
│   ├── Community.tsx           # Feed social (muscu/course/cali/badge/level-up, likes, commentaires, bookmark)
│   ├── TeamGoals.tsx           # Objectifs par équipes
│   ├── HallOfFame.tsx          # Classements globaux (XP, distance, tonnage) + Records Personnels par exercice
│   ├── Events.tsx              # Événements sportifs (participation)
│   ├── Profile.tsx             # Profil utilisateur
│   ├── Settings.tsx            # Paramètres
│   └── Admin.tsx               # Page admin
│
├── services/                   # Couche d'accès aux données Supabase
│   ├── auth.service.ts
│   ├── profile.service.ts
│   ├── workout.service.ts      # Séances muscu + sets (replaceSets)
│   ├── running.service.ts      # Courses
│   ├── weight.service.ts       # Pesées
│   ├── xp.service.ts           # Calcul et attribution d'XP
│   ├── badges.service.ts       # Vérification et attribution de badges
│   ├── feed.service.ts         # Feed d'activité, likes, commentaires (publishWorkout/Run/Calisthenics)
│   ├── calisthenics.service.ts # Sessions calisthénie (JSONB exercises + profile_skills)
│   ├── saved-sessions.service.ts # Séances bookmarkées depuis le feed (snapshot JSONB)
│   └── goals.service.ts        # Objectifs
│
├── types/
│   ├── enums.ts                # Enums TypeScript (RunType, FeedbackType…)
│   ├── models.ts               # Interfaces des entités (importe enums.ts)
│   └── database.ts             # Types Supabase bruts
│
├── data/
│   └── motivationQuotes.ts     # 365 citations françaises + getDailyQuote()
└── utils/
    ├── calculations.ts         # XP, allure, tonnage, formatage
    └── constants.ts            # Exercices par défaut, badges, XP_REWARDS, labels
```

---

## Base de données (Supabase / PostgreSQL)

### Tables principales

| Table | Description |
|---|---|
| `profiles` | Profil utilisateur (XP, niveaux, streak, avatar, is_admin) |
| `exercises` | Exercices de musculation (défauts + créés par user) |
| `workout_sessions` | Séances de musculation (sans `total_tonnage` → voir VIEW) |
| `workout_sets` | Séries d'une séance (exercice, reps, poids, repos) |
| `running_sessions` | Courses (distance, durée, allure min/km, type, dénivelé…) |
| `weight_entries` | Pesées (poids, date, notes) |
| `personal_goals` | Objectifs personnels |
| `community_challenges` | Objectifs par équipes |
| `challenge_participations` | Participants aux objectifs collectifs |
| `events` | Événements sportifs à venir |
| `event_participations` | Participants aux événements |
| `badges` | Définition des badges |
| `user_badges` | Badges débloqués par utilisateur |
| `activity_feed` | Feed d'activité (type: workout / run / level_up / badge…) |
| `activity_likes` | Likes sur les entrées du feed |
| `activity_comments` | Commentaires sur les entrées du feed |
| `notifications` | Notifications in-app |
| `profile_records` | Records personnels (muscu + course) — `value` en DECIMAL |

### VIEWs calculées (migrations 2026-03-06)

| VIEW | Source | Colonne calculée | Formule |
|---|---|---|---|
| `workout_sessions_with_tonnage` | `workout_sessions` + `workout_sets` | `total_tonnage` | `SUM(reps × weight)` |
| `shoes_with_km` | `shoes` + `running_sessions` | `total_km` | `SUM(distance) / 1000` |

Les VIEWs utilisent `WITH (security_invoker = on)` pour hériter du RLS des tables sous-jacentes.

**Services mis à jour :**
- `workout.service.ts` → interroge `workout_sessions_with_tonnage` (getSessions, getSession, getTotalTonnage) ; ne stocke plus `total_tonnage`
- `running.service.ts` → interroge `shoes_with_km` (getShoes) ; ne stocke plus `pace_km_per_h`

### Particularités Supabase

- **Client non-typé** : `createClient()` sans générique TypeScript → évite les erreurs `never` sur les requêtes imbriquées. Certains services utilisent `supabase as any` pour les inserts JSONB.
- **RLS (Row Level Security)** activé sur toutes les tables.
- **Realtime** : les notifications sont écoutées en temps réel via `supabase.channel()`.
- **Storage** : bucket `progress-photos` pour les photos de progression.
- **SMTP** : configurer Resend (smtp.resend.com:465) dans Supabase > Project Settings > Authentication > SMTP pour les emails de réinitialisation.

### Compatibilité mobile (HTTP)

`crypto.randomUUID()` ne fonctionne que dans les contextes sécurisés (HTTPS ou localhost). Sur mobile en HTTP local, utiliser `Math.random().toString(36).slice(2)` comme fallback (voir `MuscuSession.tsx` et `Musculation.tsx`).

---

## Système de gamification

### XP
Chaque action rapporte de l'XP (défini dans `src/utils/constants.ts`) :

| Action | XP |
|---|---|
| Séance de musculation | 50 XP |
| Course | 50 XP |
| Pesée | 10 XP |

L'XP est réparti sur 4 compteurs : Global, Musculation, Course, Calisthénie. Chacun a son propre niveau.

**XPBar** (`src/components/xp-system/XPBar.tsx`) supporte les disciplines `global | musculation | running | calisthenics`, chacune avec sa couleur de barre dédiée (or, rouge, bleu, violet).

### Niveaux
Les seuils de niveaux sont calculés dans `src/utils/calculations.ts` (`getXPForLevel`). Chaque niveau a un **titre de statut** thématique (inspiré LOTR/DBZ) avec une couleur dédiée.

**Formule** : croissance exponentielle (×1.5) jusqu'au niveau 14, puis palier fixe à **700 XP** par niveau à partir du niveau 15 (~2 semaines d'activité régulière).

| Niveau | XP ce palier | XP total cumulé | Temps estimé¹ |
|--------|-------------:|----------------:|---------------|
| 1 → 2  | 100          | 0               | 2 jours       |
| 2 → 3  | 150          | 100             | 3 jours       |
| 3 → 4  | 225          | 250             | 5 jours       |
| 4 → 5  | 337          | 475             | 1 semaine     |
| 5 → 6  | 506          | 812             | 1.5 semaine   |
| 6 → 7  | 759          | 1 318           | 2 semaines    |
| 7 → 8  | 1 139        | 2 077           | 3 semaines    |
| 8 → 9  | 1 708        | 3 216           | 5 semaines    |
| 9 → 10 | 2 562        | 4 924           | 7 semaines    |
| 10 → 11| 3 844        | 7 486           | ~3 mois       |
| 11 → 12| 5 766        | 11 330          | ~4 mois       |
| 12 → 13| 8 649        | 17 096          | ~6 mois       |
| 13 → 14| 12 974       | 25 745          | ~9 mois       |
| 14 → 15| **700**      | 38 719          | **2 semaines**|
| 15 → 16| 700          | 39 419          | 2 semaines    |
| 20 → 21| 700          | 42 919          | 2 semaines    |
| 30     | —            | 46 219          | ~3 ans total  |

> ¹ Base : ~350 XP/semaine (5 séances muscu + 2 courses + pesées)

### Badges
Les badges sont vérifiés à chaque nouvelle activité via `badges.service.ts`. Ils se débloquent selon des critères (nombre de séances, tonnage total, distance cumulée…).

### Streak
Compteur de jours consécutifs d'activité, mis à jour à chaque session dans `profiles.current_streak` et `profiles.last_activity_date`.

---

## Navigation & Layout

### Routes protégées
Toutes les routes (sauf `/login`, `/register`, `/forgot-password`, `/reset-password`) sont enveloppées dans `AppLayout` qui :
1. Vérifie l'authentification via `useAuth()`
2. Redirige vers `/login` si non authentifié
3. Affiche le fond d'écran spartiate (`/spartan.avif`)
4. Fournit le `NotificationProvider`

### Mise en page
- **Desktop** : `SideNav` à gauche + `Header` en haut
- **Mobile** : `BottomNav` en bas (masque la SideNav)
  - 4 liens principaux + bouton **"Plus"** ouvrant un drawer slide-up (Framer Motion)
  - Drawer liste les liens secondaires en grille 4 colonnes
  - Touch targets ≥ 44×44px, `safe-area-inset-bottom` pour iPhone
- Pages chargées en **lazy loading** (`React.lazy`) pour optimiser le bundle initial

---

## Feed social

Le feed (`/community`) affiche les activités partagées de tous les utilisateurs. Chaque carte peut afficher :
- Type : `workout` (séance muscu), `run` (course), `level_up`, `badge`
- Tonnage / distance / allure / ressenti (feedback)
- Likes et commentaires en temps réel
- Lien vers le détail de la session (modal)

La publication dans le feed se fait via `feed.service.ts` depuis `MuscuSession.tsx` (publishWorkout), `RunSession.tsx` (publishRun) et `CalisthenicsSession.tsx` (publishCalisthenics avec tableau exercises détaillé).

---

## PWA

L'application est installable sur mobile et desktop. Le service worker est généré automatiquement par `vite-plugin-pwa` avec la stratégie `generateSW` (Workbox). Les 47 assets sont pré-cachés.

> **Attention** : après un déploiement, vider le cache du service worker dans le navigateur (DevTools → Application → Service Workers → Unregister) si les changements visuels ne s'appliquent pas.

---

## Configuration requise

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Exécuter `supabase/schema.sql` dans l'éditeur SQL Supabase
3. Créer le fichier `.env` à la racine :
   ```env
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
4. Créer un bucket Storage nommé `progress-photos` (public)

---

## Commandes

```bash
npm run dev      # Serveur de développement (Vite)
npm run build    # Build de production (dist/)
npm run preview  # Prévisualiser le build de prod
npm run lint     # Linter ESLint
```

---

## Historique des commits récents

| Commit | Description |
|---|---|
| récent | feat(pickers): standardisation sélecteurs exercices — 0 texte libre, composant ExercisePicker partagé (Muscu/Cali/Course), anti-doublons records |
| récent | feat(db): 4 migrations SQL + tests + MàJ docs (pace_km_per_h, total_tonnage, shoes.total_km, profile_records.value DECIMAL) |
| récent | feat(seed): seed complète 6 utilisateurs × 3 mois (supabase/seed.sql) |
| récent | feat(nav): drawer "Plus" dans BottomNav + tests Navigation |
| récent | feat(auth): pages ForgotPassword et ResetPassword |
| récent | feat(dashboard): motivation du jour (365 citations, getDailyQuote) |
| récent | fix(mobile): crypto.randomUUID → Math.random() pour contexte HTTP |
| récent | fix(responsive): audit complet — z-index, touch targets, grilles, textes |
| `67910d3` | fix(layout): background-image sur div pour positionnement fiable du crâne |
| `87f8003` | fix(feed): afficher le ressenti (feedback) sur les cartes de course |
| `4ccaf9b` | fix(team-goals): afficher avatar + username dans la liste des participants |
| `8603561` | feat(events): système de participation (rejoindre/quitter + liste) |
| `3e4796e` | feat: édition et suppression des séances muscu, course et pesées |
| `600267b` | feat(feed): modal de détail sur les cartes workout/run |
| `655fbb1` | feat: titre de statut dans les notifications et le feed |
| `93111ca` | fix(auth): auto-refresh du profil sur mise à jour BDD realtime |
| `cfaf445` | feat(hall-of-fame): photo avatar dans les classements |

| récent | feat(crossfit): bloc Crossfit complet — WOD (5 types), formulaire 2 étapes, picker 115 exercices, XP/niveaux, records, feed, Hall of Fame, Profile, Dashboard |
