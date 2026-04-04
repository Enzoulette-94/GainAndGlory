# Gain & Glory — Fonctionnalités

> Document exhaustif de toutes les fonctionnalités de l'application.
> Dernière mise à jour : commit `1bcbac1`

---

## Table des matières

1. [Authentification](#1-authentification)
2. [Dashboard](#2-dashboard)
3. [Musculation](#3-musculation)
4. [Course à pied](#4-course-à-pied)
5. [Suivi du poids](#5-suivi-du-poids)
6. [Calendrier](#6-calendrier)
7. [Objectifs personnels](#7-objectifs-personnels)
8. [Communauté / Feed](#8-communauté--feed)
9. [Objectifs par équipes](#9-objectifs-par-équipes)
10. [Hall of Fame](#10-hall-of-fame)
11. [Événements](#11-événements)
12. [Profil](#12-profil)
13. [Paramètres](#13-paramètres)
14. [Système XP & Niveaux](#14-système-xp--niveaux)
15. [Système de badges](#15-système-de-badges)
16. [Notifications](#16-notifications)
17. [Navigation](#17-navigation)

---

## 1. Authentification

### Inscription (`/register`)
- Formulaire : username, email, mot de passe
- Validation Zod : username 3–20 caractères alphanumériques, email valide, mot de passe 6+ caractères
- Création du compte via Supabase Auth
- Création automatique du profil (`profiles`) après inscription
- Redirection vers `/dashboard` si déjà connecté

### Connexion (`/login`)
- Formulaire : email + mot de passe
- Authentification via Supabase Auth
- Gestion des erreurs (identifiants incorrects)
- Redirection automatique vers `/dashboard` après connexion

### Mot de passe oublié (`/forgot-password`)
- Formulaire email → envoie un lien de réinitialisation via Supabase Auth
- Confirmation visuelle après envoi
- SMTP configurable (Resend recommandé)

### Réinitialisation du mot de passe (`/reset-password`)
- Écoute l'événement `PASSWORD_RECOVERY` de Supabase
- Formulaire nouveau mot de passe + confirmation
- Redirection automatique vers le dashboard après succès

### Protection des routes
- Toutes les routes (sauf `/login`, `/register`, `/forgot-password`, `/reset-password`) nécessitent une session active
- Redirection vers `/login` si non authentifié
- `AuthContext` expose `user` et `loading` globalement

### Déconnexion
- Accessible depuis les Paramètres
- Déconnexion de tous les appareils (Supabase signOut)

---

## 2. Dashboard (`/dashboard`)

### En-tête personnalisé
- Salutation dynamique selon l'heure (Bonjour / Bon après-midi / Bonsoir)
- Affichage du username et du titre de statut (LOTR/DBZ)
- Compteur de streak (jours consécutifs d'activité)

### Barres de progression XP
- 4 barres : Global, Musculation, Course, Calisthénie (violet)
- Affichage du niveau actuel, XP courant / XP requis, pourcentage
- Grille responsive : 2 colonnes → 4 colonnes sur grands écrans

### Motivation du jour
- Citation motivationnelle différente chaque jour
- 365 phrases françaises (src/data/motivationQuotes.ts)
- Sélection déterministe selon le jour de l'année (getDailyQuote)

### Statistiques de la semaine
- Nombre de séances muscu
- Nombre de courses
- Distance totale (km)
- Tonnage total (kg)

### Actions rapides
- Bouton "Nouvelle séance muscu" → `/musculation/new`
- Bouton "Nouvelle course" → `/running/new`
- Bouton "Peser" → `/weight`
- Bouton "Calisthénie" → `/calisthenics/new` (violet)

### Événements à venir
- Affiche les 3 prochains événements de l'utilisateur
- Countdown format "J-X"
- Lien "Voir tout" → `/events`

### Objectifs communs actifs
- Affiche les 3 défis équipe actifs
- Barre de progression avec pourcentage
- Nombre de participants
- Lien "Voir tout" → `/team-goals`

### Objectifs personnels actifs
- Affiche les 3 objectifs personnels actifs
- Barre de progression
- Lien "Voir tout" → `/goals`

### Dernières activités
- Dernière séance muscu (date, tonnage)
- Dernière course (date, distance)
- Dernier poids (date, valeur)
- Formatage temps relatif ("il y a 2h", "il y a 3j")

---

## 3. Musculation (`/musculation`)

### Statistiques globales
- Nombre total de séances
- Tonnage maximum sur une séance
- Moyenne de séries par séance

### Onglet Séances
- Liste paginée des séances (bouton "Charger plus")
- Filtre par ressenti : Tous / Facile / Difficile / Mort
- Carte de séance : date, nom, tonnage, nombre d'exercices, badge ressenti
- Expansion des détails : liste des exercices avec séries (reps × poids)
- **Édition d'une séance** : nom, date, ressenti, notes + modification complète des exercices et séries
- **Suppression** avec confirmation

### Édition des exercices (dans l'éditeur de séance)
- Ajout d'exercices avec recherche autocomplete
- Suppression d'exercices
- Pour chaque exercice : ajout/suppression de séries
- Édition inline : reps, poids (kg), temps de repos (s)
- Prévisualisation du tonnage total en temps réel

### Onglet Graphiques
- Histogramme : tonnage par semaine (8 dernières semaines)
- Courbe : moyenne de reps par séance dans le temps
- Courbe : fréquence des exercices dans le temps

### Onglet Records
- Records personnels par exercice
- Date du record, exercice, tonnage
- Bouton "Voir l'historique" par exercice

---

## 4. Course à pied (`/running`)

### Statistiques globales
- Nombre total de sorties
- Distance totale (km)
- Niveau course + XP

### Onglet Sorties
- Liste paginée avec filtre par type (Tous / Fractionné / Endurance / Tempo)
- Filtre par période (Cette semaine / Ce mois / Tout)
- Carte de course : nom, date, type, emoji ressenti, distance, durée, allure, notes
- **Édition** : nom, date, distance, durée, type, ressenti, notes — allure recalculée automatiquement
- **Suppression** avec confirmation

### Onglet Graphiques
- Histogramme : distance hebdomadaire (8 dernières semaines)
- Courbe : évolution de l'allure (min/km)
- Courbe : fréquence cardiaque moyenne (si renseignée)

### Onglet Records
- Records personnels par distance standard : 1 km, 5 km, 10 km, semi-marathon (21,1 km), marathon (42,2 km)
- Durée, allure, date du record
- Bouton "Historique" par distance

---

## 5. Nouvelle séance muscu (`/musculation/new`)

- Sélection de la date/heure
- Nom de la séance (optionnel)
- Ajout dynamique d'exercices via **sélecteur prédéfini** en 2 étapes : grille groupes musculaires → liste exercices (plus de saisie libre pour éviter les doublons dans les records)
- Pour chaque exercice : tableau de séries (n°, reps, poids, repos)
  - Ajout de série (pré-remplie avec les valeurs de la dernière série)
  - Suppression de série (désactivée si une seule série)
  - Édition inline de toutes les valeurs
- Compteur tonnage total en temps réel
- Sélection du ressenti (Facile / Difficile / Mort)
- Notes libres (optionnel)
- Affichage des XP à gagner
- Validation : au moins 1 exercice avec au moins 1 série
- Attribution d'XP au submit + publication dans le feed + vérification badges

---

## 6. Nouvelle course (`/running/new`)

- Sélection de la date/heure
- Nom de la course (optionnel)
- Distance (km, pas de 0,01)
- Durée en 3 champs : heures, minutes, secondes
- Calcul temps réel : allure (min/km) et vitesse (km/h)
- Type de course : Endurance / Fractionné / Tempo
- Section optionnelle (dépliable) :
  - Dénivelé positif / négatif (m)
  - FC moyenne / FC max (bpm)
  - Température (°C)
  - Conditions météo (dropdown)
  - Sélection des chaussures (calcul km cumulés)
- Ressenti (Facile / Difficile / Mort)
- Notes libres (optionnel)
- Validation : distance > 0 et durée > 0
- Attribution d'XP + publication dans le feed + vérification badges

---

## 7. Suivi du poids (`/weight`)

### Affichage principal
- Dernier poids enregistré (grande police)
- Date de la dernière mesure
- Variation sur 7 jours (±X kg, colorée)
- Variation sur 30 jours (±X kg, colorée)

### Graphique 30 jours
- Courbe de poids sur les 30 dernières entrées
- Tooltip : date formatée + poids

### Historique
- 20 dernières entrées
- Poids, notes, delta vs entrée précédente (rouge = prise, vert = perte), date
- Bouton édition par entrée (nom, date, notes)
- Bouton suppression avec confirmation

### Nouvelle pesée (modal)
- Champ poids (kg)
- Sélecteur de date
- Notes (optionnel)
- Affichage XP à gagner
- Attribution d'XP + vérification badges

---

## 8. Calendrier (`/calendar`)

### Navigation mensuelle
- Flèches précédent/suivant
- Bouton cliquable affichant la date complète (ex. "Vendredi 20 mars 2026") → retour au mois courant
- Affichage mois + année

### Section "À venir ce mois" (hero cards)
- Affiché en haut, avant la grille
- Fusion : événements sportifs + échéances d'objectifs + fin de défis équipe
- Trié par date croissante
- Carte hero par item : gradient coloré selon le type, bordure gauche colorée, icône catégorie
- Countdown **J-X** en gros (text-3xl), rouge si ≤ 7 jours, "Auj." si aujourd'hui
- Sous-titre : sous-type (objectif) ou "Fin du défi"

### Code couleur (légende)
- Affiché avant la grille (repère visuel immédiat)
- 8 types : Muscu (rouge), Course (bleu), Calisthénie (violet), Crossfit (orange), Pesée (emerald), Objectif (or), Défi équipe (rose), Événement (amber)
- Icône + pastille couleur par type

### Grille calendrier
- 7 colonnes Lun–Dim
- Cellules hauteur fixe `h-[72px]`
- Jour courant : fond or/10 + anneau or/30 + texte "**Aujourd'hui**" en rouge (gras, uppercase)
- Jours de week-end : légèrement atténués
- Jours futurs sans activité : opacité 20%
- Par cellule active : icônes sport (badges tintés) + strips couleur en bas
- Clic sur un jour → modal détail

### Modal détail d'un jour
- Pills des types actifs (icône + label)
- Séances muscu (tonnage, nb exercices, ressenti)
- Courses (distance, durée, allure, type, ressenti)
- Séances calisthénie (nom, nb exercices, ressenti)
- Séances crossfit (nom/WOD type, nb exercices, ressenti)
- Pesées (poids en kg)
- Échéances d'objectifs (titre, progression %)
- Fin de défis équipe
- Événements (titre, type, description)

### Statistiques du mois
- 4 cards : séances Muscu / Course / Calisthénie / Crossfit avec compteur et icône

### Liens rapides
- Liens discrets → /goals, /team-goals, /events si items présents ce mois

---

## 9. Objectifs personnels (`/goals`)

### Statistiques
- Nombre d'objectifs actifs
- Nombre d'objectifs complétés
- Streak courant

### Onglet Actifs / Complétés / Annulés
- Cartes d'objectif : icône type, titre, description, barre de progression, échéance
- Badge "Échéance dépassée" si la date est passée
- Coloration par type : Musculation = rouge, Course = vert, Poids = orange

### Actions sur objectif actif
- "Mettre à jour" → modal de progression (valeur actuelle, preview barre)
- "Compléter" → marque l'objectif terminé, attribution XP
- "Annuler" (icône ×)

### Création d'objectif (modal)
- Type (Musculation / Course / Poids)
- Titre (obligatoire)
- Description (optionnel)
- Valeur cible (optionnel)
- Valeur actuelle (optionnel)
- Unité (km, kg, reps…)
- Date d'échéance (optionnel)

---

## 10. Communauté / Feed (`/community`)

### Feed d'activité
- Timeline des activités partagées (tous utilisateurs dont `share_performances = true`)
- Pagination (chargement infini)
- Carte **Séance muscu** : liste des exercices (nom · sets × reps · poids max), bouton "Voir la séance"
- Carte **Course** : Distance / Temps / Allure moy. en 3 colonnes labellisées, bouton "Voir la séance"
- Carte **Calisthénie** : liste des exercices (nom · sets × reps, ou sets × Xs pour les chronométrés)
- Carte **Level-up** : ancien niveau → nouveau niveau, titre de statut
- Carte **Badge** : nom badge, rareté, description
- Bandeau vertical coloré par type (rouge muscu, bleu course, violet calisthénie)
- **Liker** une activité (toggle, compteur mis à jour en temps réel)
- **Commenter** une activité (champ + envoi)
- Affichage des commentaires (username, contenu, date)
- **Supprimer** son propre commentaire
- **Modal détail** : clic sur une carte muscu/course → détail complet de la session
- **Enregistrer une séance** : bouton bookmark sur chaque carte → sauvegarde dans `/seances`

---

## 11. Objectifs par équipes (`/team-goals`)

### Onglet Actifs
- Liste de tous les défis communautaires actifs
- Carte de défi : titre, description, type (distance/tonnage/séances/répétitions/mixte), créateur, badge flash
- Barre de progression avec pourcentage
- Avatars + usernames des participants
- Jours restants avant fin
- Bouton "Participer" / "Contribuer +"

### Onglet Mes contributions
- Défis que l'utilisateur a rejoints
- Affichage de sa contribution personnelle

### Onglet Créer
- Titre (obligatoire)
- Description
- Type : distance / tonnage / séances / répétitions / mixte
- Nom de l'exercice (pour tonnage/répétitions)
- Pour "mixte" : ajout dynamique de plusieurs métriques (kg/km/reps + exercice optionnel)
- Valeur cible
- Date de début / date de fin
- Validation et messages d'erreur

### Modal Contribution
- Résumé de l'objectif en cours
- Champ de valeur à ajouter
- Prévisualisation du nouveau total

### Participation
- Rejoindre / quitter un défi
- Liste des participants (avatar + username)

---

## 12. Hall of Fame (`/hall-of-fame`)

### Layout 3 colonnes (classements globaux)
- **Top XP Global** : classement 5 premiers par XP total
- **Top Course** : classement 5 premiers par distance totale
- **Top Musculation** : classement 5 premiers par tonnage total

### Carte joueur (classements globaux)
- Rang (#1 🥇, #2 🥈, #3 🥉, #4/#5 avec couleur dégradée)
- Avatar (photo ou initiale)
- Username cliquable → `/profil/:userId` (sauf utilisateur courant)
- Badge "VOUS" pour l'utilisateur courant
- Niveau
- Valeur + unité (XP / km / kg)
- Surbrillance anneau doré pour l'utilisateur courant

### Section Records Personnels (classements par exercice)
- Regroupement automatique des `profile_records` par titre d'exercice
- **Un seul utilisateur suffit** pour qu'un classement apparaisse
- **Confidentialité** : seuls les profils ayant `share_performances = true` sont inclus
- **Tri intelligent par unité** :
  - Unités poids (kg, lbs…) → décroissant (meilleure charge ↑)
  - Unités temps (min, s…) → croissant (meilleur temps ↓)
- Valeur temporelle au format `MM:SS` correctement parsée en secondes pour comparaison
- Une seule entrée par utilisateur par exercice (meilleure performance conservée)
- Top 5 par exercice
- Username cliquable → `/profil/:userId`
- Grille responsive : 1 col mobile, 2 cols sm, 3 cols lg, 4 cols xl

---

## 13. Événements (`/events`)

### Événements à venir
- Liste triée par date croissante
- Carte : titre, date complète, type (Course/Compétition/Trail/Triathlon/Autre), countdown
  - "Aujourd'hui !" (orange), "Demain" (ambre), "Dans X jours" (gris)
- Description (2 lignes max)
- **Bouton "Participer" / "Je participe"** (toggle avec état de chargement)
- Liste des participants (avatar + username)
- Bouton suppression (propriétaire uniquement)

### Événements passés (les miens)
- Affichage simplifié des 5 premiers, bouton "Voir plus"

### Créer un événement (modal)
- Titre (obligatoire)
- Date (obligatoire, minimum = aujourd'hui)
- Type (optionnel)
- Description (optionnel)
- Toast de confirmation / erreur

---

## 14. Profil (`/profile`)

### En-tête
- Avatar cliquable (ouvre la modal de modification)
- Username
- Titre de statut (badge coloré)
- Membre depuis (date)

### XP & Niveaux
- 4 lignes : Global, Musculation, Course, Calisthénie
- Niveau, XP courant / XP requis, barre de progression colorée

### Meilleures performances — Sélecteurs standardisés (anti-doublons)
- **Muscu** : sélecteur 2 étapes (groupe musculaire → exercice prédéfini) — plus de saisie libre
- **Cali** : sélecteur 2 étapes (groupe → exercice calisthénie prédéfini)
- **Course** : 4 boutons fixes (5 km / 10 km / Semi-marathon / Marathon) + champ Durée
- Garantit l'uniformité des titres de records pour les classements du Hall of Fame

### Meilleures performances — Records de course
- **Allure moyenne calculée automatiquement** depuis le titre (ex : "10 km") et la durée
- Format affiché : `10 km · 52:00 temps · 5:12 /km`
- Fonctionne pour les 4 distances standard : 5 km, 10 km, Semi-marathon, Marathon

### Statistiques
- Séances muscu totales
- Courses totales
- Distance totale
- Streak courant & streak maximum

### Badges
- Grille des badges débloqués (3 colonnes)
- Rareté colorée, tooltip description

### Modifier le profil (modal)
- Upload avatar (image, max 2 Mo) → stocké dans Supabase Storage
- Modification du username (validation unicité + format)

---

## 15. Paramètres (`/settings`)

### Compte
- Affichage email (lecture seule)
- Modification du username (modal)
- Upload avatar

### Préférences sportives
- FC Max (100–250 bpm)
- Unité d'allure : min/km ou km/h
- Sauvegarde avec feedback

### Confidentialité (3 toggles)
- Partager ses performances (muscu + course dans le feed)
- Partager son poids
- Partager ses photos

### Zone de danger
- Bouton "Se déconnecter" (déconnexion Supabase)

---

## 16. Système XP & Niveaux

### Gains d'XP
| Action | XP gagné |
|--------|----------|
| Séance de musculation | 50 XP |
| Course à pied | 50 XP |
| Séance de calisthénie | 50 XP |
| Séance de Crossfit | 60 XP |
| Skill calisthénie débloqué | 200 XP |
| Pesée | 10 XP |
| Compléter un objectif personnel | Variable |

### Calcul des niveaux
- Formule exponentielle : `XP niveau N → N+1 = floor(100 × 1.5^(N-2))`
- 5 compteurs indépendants : Global, Musculation, Course, Calisthénie, Crossfit
- Détection automatique de montée de niveau

### Titres de statut (niveaux 1–30+)
- Niveaux 1–10 : thème **Seigneur des Anneaux** (Hobbit → Roi du Gondor)
- Niveaux 11–30 : thème **Dragon Ball Z** (Guerrier Saiyan → Zeno-Sama)
- Niveaux 31+ : Entité Divine / Créateur des Univers / Au-delà de la Puissance

### Couleurs par palier
| Niveaux | Couleur | Nom |
|---------|---------|-----|
| 1–5 | `#8b6f47` | Bronze |
| 6–10 | `#c0c0c0` | Argent |
| 11–15 | `#ffd700` | Or |
| 16–20 | `#38bdf8` | Bleu (SSB) |
| 21–25 | `#c084fc` | Violet clair (UI) |
| 26–30 | `#a855f7` | Violet (Ange/Dieu) |
| 31+ | `#ef4444` | Rouge (Divin) |

### Notification de montée de niveau
- Modal animée `LevelUpModal` à chaque level-up
- Publication automatique dans le feed communautaire

---

## 17. Système de badges

### Vérification automatique
- Déclenchée après chaque séance, course, pesée, objectif complété
- `badges.service.ts` → `checkAndUnlockBadges(userId, context)`

### Déblocage
- Notification in-app + publication dans le feed
- Affichage dans le profil avec rareté (Commun / Rare / Épique / Légendaire)

---

## 18. Notifications

### Types de notifications
- `level_up` — Montée de niveau
- `badge_unlocked` — Badge débloqué
- `flash_challenge` — Nouveau défi flash
- `record_beaten` — Record personnel battu
- `event_created` — Nouvel événement
- `like` — Like sur une activité
- `comment` — Commentaire sur une activité

### Fonctionnement
- Stockées en BDD (`notifications` table)
- Mises à jour en temps réel via Supabase Realtime (`NotificationContext`)
- Centre de notifications dans le `Header` (icône cloche + badge non-lus)
- Marquage "lu" au clic

---

## 19. Navigation

### SideNav (desktop, `lg:` et plus)
- Barre latérale fixe gauche avec tous les liens
- Logo "Gain & Glory" en haut
- Liens actifs mis en évidence (bordure dorée + fond)
- Lien Admin visible uniquement pour `is_admin = true`

### BottomNav (mobile, `< lg`)
- Barre de navigation en bas d'écran fixe
- 4 liens principaux : Dashboard, Muscu, Course, Poids
- Bouton **"Plus"** (icône MoreHorizontal) pour accéder aux liens secondaires
- Indicateur actif sur "Plus" si la route courante est un lien secondaire
- `safe-area-inset-bottom` pour compatibilité iPhone (notch/home indicator)
- Touch targets ≥ 44×44px

### Drawer "Plus" (mobile)
- S'ouvre au clic sur le bouton "Plus"
- Fond semi-transparent avec fermeture au clic en dehors
- Animation slide-up (Framer Motion, spring)
- En-tête "Menu" + bouton X pour fermer
- Grille 4 colonnes avec les liens secondaires : Calendrier, Objectifs, Objectifs équipe, Hall of Fame, Événements, Profil
- Lien Admin si `is_admin = true`
- Fermeture automatique au clic sur un lien

---

## Migrations de base de données

### Migration #1 — Suppression de `running_sessions.pace_km_per_h`
- **Fichier** : `supabase/migrations/20260306_drop_pace_km_per_h.sql`
- `pace_km_per_h` supprimée (redondante : `60 / pace_min_per_km`)
- Le service `running.service.ts` n'écrit plus cette colonne
- `calcSpeedKmH()` plus importé dans le service

### Migration #2 — `profile_records.value` : TEXT → DECIMAL
- **Fichier** : `supabase/migrations/20260306_profile_records_value_decimal.sql`
- Les valeurs muscu (`"125"`) sont castées directement en `125.0`
- Les durées course (`"1:42:00"`) sont converties en secondes (`6120.0`)
- Permet le tri et les comparaisons numériques (Hall of Fame)
- **Impact app** : le frontend doit reformater les secondes en `MM:SS` ou `H:MM:SS` pour l'affichage

### Migration #3 — `workout_sessions.total_tonnage` remplacé par une VIEW
- **Fichier** : `supabase/migrations/20260306_workout_sessions_tonnage_view.sql`
- Vue `workout_sessions_with_tonnage` : calcule `SUM(reps × weight)` depuis `workout_sets`
- `total_tonnage` supprimée de la table (plus de désynchronisation possible)
- `security_invoker = on` : la VIEW hérite du RLS de `workout_sessions`
- `workout.service.ts` interroge maintenant `workout_sessions_with_tonnage`

### Migration #4 — `shoes.total_km` remplacé par une VIEW
- **Fichier** : `supabase/migrations/20260306_shoes_km_view.sql`
- Vue `shoes_with_km` : calcule `SUM(distance) / 1000` depuis `running_sessions`
- `total_km` supprimée de la table (plus de désynchronisation via RPC)
- La RPC `increment_shoe_km()` est devenue obsolète
- `running.service.ts` interroge maintenant `shoes_with_km`

---

## 18. Circuits & Dupliquer

### Circuits (Musculation / Calisthénie / Crossfit)
- Bouton **"Créer un circuit"** dans chaque page de nouvelle séance
- Un circuit regroupe N exercices exécutés en boucle (paramètre **rounds**)
- Paramètre **repos entre rounds** (secondes)
- Dans un circuit : ajout d'exercices et de **blocs repos**
- Sauvegarde : les exercices du circuit sont enregistrés avec `rounds` répétitions chacun
- Pour Calisthénie et Crossfit : structure JSONB préservée avec items imbriqués

### Bouton Dupliquer
- **Dupliquer un exercice** : bouton ⧉ sur chaque exercice → copie insérée juste en dessous
- **Dupliquer une série** (Musculation) : bouton ⧉ sur chaque ligne de série
- **Dupliquer un circuit entier** : bouton ⧉ sur le header du circuit
- **Dupliquer dans un circuit** : bouton ⧉ sur chaque exercice à l'intérieur du circuit

---

## 19. Session Hybride

### Concept
Combiner plusieurs activités en une seule session (ex : Course + Musculation).

### Formulaire
- Page dédiée `/hybrid/new`, accessible depuis le Dashboard (bouton "Hybride")
- Formulaire unifié avec des **blocs d'activité** ordonnés
- Types supportés : Running, Musculation, Calisthénie, Crossfit
- Chaque bloc a son propre formulaire simplifié inline
- Boutons ↑ / ↓ pour réordonner les blocs
- Minimum 2 blocs requis

### XP
- XP accordé pour chaque bloc selon son type (RUNNING_SESSION, WORKOUT_SESSION, etc.)
- **+20 XP bonus hybride** si 2 blocs ou plus
- Affiché en temps réel pendant la saisie

### Données
- Table `hybrid_sessions` avec colonne `blocks` JSONB
- Fichier SQL : `supabase/hybrid_sessions.sql`
- Service : `src/services/hybrid.service.ts`

### Feed communautaire
- Carte dorée avec label "SESSION HYBRIDE"
- Affiche le résumé des types d'activités (🏃 Course + 🏋️ Muscu...)
- Type `'hybrid'` ajouté à `ActivityType`

---

## Résumé des fonctionnalités

| Module | Fonctionnalités principales | Statut |
|--------|----------------------------|--------|
| Auth | Inscription, connexion, déconnexion, routes protégées | ✅ |
| Dashboard | Stats semaine, XP, actions rapides, résumés | ✅ |
| Musculation | CRUD séances + exercices, graphiques, records | ✅ |
| Running | CRUD courses, graphiques, records par distance | ✅ |
| Poids | CRUD pesées, graphique 30j, variations | ✅ |
| Calendrier | Vue mensuelle interactive, détail par jour, événements intégrés | ✅ |
| Objectifs | CRUD objectifs, progression, complétion avec XP | ✅ |
| Feed social | Activités, likes, commentaires, modal détail | ✅ |
| Équipes | Défis collectifs, participation, contribution | ✅ |
| Hall of Fame | 3 classements globaux + classements par exercice (Records Personnels) | ✅ |
| Événements | CRUD événements, participation, liste participants | ✅ |
| Profil | Avatar, stats, badges, édition | ✅ |
| Paramètres | Préférences, confidentialité, déconnexion | ✅ |
| XP & Niveaux | Système exponentiel, 30 niveaux thématiques | ✅ |
| Badges | Vérification automatique, déblocage, affichage | ✅ |
| Notifications | Realtime, 7 types, centre de notifs | ✅ |
| Crossfit | WOD (EMOM/AMRAP/Benchmark/For Rounds/For Time), records, graphiques, feed | ✅ |
| Circuits | Blocs circuit (N rounds) dans Muscu/Cali/Crossfit, dupliquer exercice/circuit | ✅ |
| Session hybride | Multi-activité en une session (Running+Muscu+Cali+Crossfit), XP cumulé | ✅ |
| Navigation | SideNav desktop, BottomNav mobile + drawer "Plus" | ✅ |
| Mot de passe oublié | Envoi email de reset, page réinitialisation | ✅ |
| Migrations DB | 4 migrations SQL avec BEGIN/COMMIT, DO blocks, vérifications | ✅ |
