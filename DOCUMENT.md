# Gain & Glory — Documentation Technique

> Dernière mise à jour : 20 mars 2026 — v1.1.0 — déploiement production

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

L'XP est réparti sur 5 compteurs : Global, Musculation, Course, Calisthénie, Crossfit. Chacun a son propre niveau.

| Action | XP |
|---|---|
| Séance de musculation | 50 XP |
| Course | 50 XP |
| Pesée | 10 XP |
| Séance calisthénie | 50 XP |
| Séance Crossfit | 60 XP |
| Skill débloqué (cali) | 200 XP |

**XPBar** (`src/components/xp-system/XPBar.tsx`) supporte les disciplines `global | musculation | running | calisthenics | crossfit`, chacune avec sa couleur de barre dédiée (or, rouge, bleu, violet, orange).

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
3. Affiche le fond d'écran logo Gain & Glory (`/logo.png`, fond fixe centré 55%)
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
- Type : `workout`, `run`, `calisthenics`, `crossfit`, `level_up`, `badge`, `personal_record`
- Tonnage / distance / allure / résultat WOD / ressenti (feedback)
- Likes (réactions emoji) et commentaires en temps réel
- Lien vers le détail de la session (modal)
- Bookmark (enregistrer dans Séances sauvegardées)
- Copier la séance (réutiliser comme base)

La publication dans le feed se fait via `feed.service.ts` : `publishWorkout`, `publishRun`, `publishCalisthenics`, `publishCrossfit`.

**Carte PR** : fond doré animé (`#150f00`, bordure `#c9a870`), shimmer diagonal, trophée watermark, glow pulsant — visuel grandiose pour les nouveaux records personnels.

---

## PWA

L'application est installable sur mobile et desktop. Le service worker est généré automatiquement par `vite-plugin-pwa` avec la stratégie `generateSW` (Workbox). 71 assets sont pré-cachés.

**Icônes PWA** (toutes en PNG) :
- `public/pwa-192x192.png` — icône Android Chrome
- `public/pwa-512x512.png` — icône splash screen / maskable
- `public/apple-touch-icon.png` (180×180) — icône iOS Safari

**Bouton d'installation** : disponible dans le menu utilisateur (Header → avatar → "Télécharger Gain & Glory"). Déclenche le prompt natif `beforeinstallprompt`. Si l'app est déjà installée, affiche une modale de confirmation.

> **Note iOS** : Safari ne supporte pas `beforeinstallprompt`. Sur iPhone, utiliser Partager → "Sur l'écran d'accueil". Le bouton affichera la modale de confirmation dans ce cas.

> **Attention** : le SW n'est actif qu'en build de production (`npm run build && npx vite preview`), pas en `npm run dev`. Après un déploiement, vider le cache du SW (DevTools → Application → Service Workers → Unregister) si les changements ne s'appliquent pas.

---

## Configuration requise

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Exécuter `supabase/schema.sql` dans l'éditeur SQL Supabase
3. Créer le fichier `.env` à la racine :
   ```env
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_ACCESS_KEY=VotreCleSecrete
   ```
4. Créer un bucket Storage nommé `progress-photos` (public)

> **`VITE_ACCESS_KEY`** : clé obligatoire pour s'inscrire. Seuls les utilisateurs possédant cette clé peuvent créer un compte. À définir sur le serveur de production avant le build (`npm run build` intègre la valeur au moment du build).

### SQL additionnel (post-schema.sql)

Si la table `crossfit_sessions` ou les colonnes `crossfit_xp/crossfit_level` manquent dans `profiles`, exécuter :

```sql
CREATE TABLE IF NOT EXISTS crossfit_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT, wod_type TEXT NOT NULL,
  total_duration INTEGER, round_duration INTEGER,
  target_rounds INTEGER, result_time TEXT,
  result_reps INTEGER, result_rounds INTEGER,
  benchmark_name TEXT, exercises JSONB NOT NULL DEFAULT '[]',
  feedback TEXT, notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS crossfit_xp INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS crossfit_level INTEGER DEFAULT 1;
ALTER TABLE crossfit_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cf_sel" ON crossfit_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cf_ins" ON crossfit_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cf_del" ON crossfit_sessions FOR DELETE USING (auth.uid() = user_id);
```

---

## Commandes

```bash
npm run dev      # Serveur de développement (Vite) — SW inactif
npm run build    # Build de production (dist/) — SW + PWA générés
npm run preview  # Prévisualiser le build de prod (http://localhost:4173)
npm run test     # Tests unitaires (Vitest + Testing Library) — 438 tests
npm run lint     # Linter ESLint
```

### Déploiement VPS (nginx)

```bash
# Sur le serveur
cd /var/www/gain-and-glory
git pull
VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... VITE_ACCESS_KEY=... npm run build
# Nginx sert dist/ — config : try_files $uri $uri/ /index.html
```

---

## Historique des commits — v1.1.0 (20 mars 2026)

| Commit | Description |
|---|---|
| `6f97f2f` | test(register): 18 tests inscription avec clé d'accès |
| `22b0001` | feat(auth): clé d'accès obligatoire à l'inscription (`VITE_ACCESS_KEY`) |
| `81329ce` | feat(pwa): bouton "Télécharger G&G" dans menu + modale déjà installé |
| `1681008` | feat(notifications): broadcast social — séances, level up, PR, défis, événements, commentaires |
| `e94d5e9` | feat(ui): headers Calendrier + Événements style grandiose (gradient or) |
| `a132a7f` | feat(pwa): icônes PNG spartan + manifest corrigé (image/png) |
| `2219d0c` | feat(ui): logo PNG spartan remplace spartan.avif (fond + pages auth) |
| `a32e6c5` | fix(feed): espacement bas des cards + séparateur quick reply bar |
| `d60ef4b` | feat(ui): headers HallOfFame, TeamGoals, Community, Goals, Calendar grandioses |
| `aec8d57` | feat(hall-of-fame): bandeau PR festif + confetti + feed doré |
| `dc3318c` | feat(records): liaison complète séances → profil → hall of fame |
| récent | feat(circuits): bouton dupliquer (exercice/série/circuit) dans Muscu, Cali, Crossfit |
| récent | feat(hybrid): page HybridSession — blocs multi-activité ordonnés, XP cumulé, feed doré |

## Historique des commits — v1.0.0 (historique)

| Commit | Description |
|---|---|
| récent | feat(crossfit): bloc Crossfit complet — WOD (5 types), formulaire 2 étapes, picker 115 exercices |
| récent | feat(pickers): standardisation sélecteurs exercices |
| récent | feat(db): migrations SQL (pace_km_per_h, total_tonnage, shoes.total_km, profile_records.value DECIMAL) |
| récent | feat(seed): seed complète 6 utilisateurs × 3 mois |
| récent | feat(nav): drawer "Plus" dans BottomNav |
| récent | feat(auth): pages ForgotPassword et ResetPassword |
| récent | feat(dashboard): motivation du jour (365 citations) |
| `8603561` | feat(events): système de participation |
| `3e4796e` | feat: édition et suppression des séances muscu, course et pesées |
| `600267b` | feat(feed): modal de détail sur les cartes workout/run |
