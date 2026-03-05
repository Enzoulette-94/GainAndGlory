# Gain & Glory — Fonctionnalités

> Document exhaustif de toutes les fonctionnalités de l'application.
> Dernière mise à jour : commit `282920a`

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
- 3 barres : Global, Musculation, Course
- Affichage du niveau actuel, XP courant / XP requis, pourcentage

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
- Ajout dynamique d'exercices avec recherche autocomplete (filtre sur 8 résultats, groupe musculaire affiché)
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
- Bouton "Aujourd'hui"
- Affichage mois + année

### Grille calendrier
- 7 colonnes Lun–Dim
- Jour courant surligné (anneau doré)
- Indicateurs colorés par activité :
  - 🔴 Rouge = séance muscu
  - 🔵 Bleu = course
  - 🟢 Vert = pesée
  - 🟡 Or = échéance d'objectif
  - 🩷 Rose = défi équipe (début/fin/en cours)
- Clic sur un jour → modal détail

### Modal détail d'un jour
- Toutes les séances muscu (tonnage, exercices, ressenti)
- Toutes les courses (distance, durée, allure, type, ressenti)
- Toutes les pesées
- Échéances d'objectifs personnels
- Début/fin de défis équipe

### Aperçu mensuel
- Objectifs personnels avec échéance ce mois (barre de progression, jours restants)
- Défis d'équipe actifs ce mois (titre, plage de dates, jours restants)

### Statistiques du mois
- Nombre de séances muscu
- Nombre de courses
- Distance totale
- Tonnage total

### Légende
- Code couleur de tous les types d'activité

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
- Carte **Séance muscu** : avatar, username, niveau, date relative, nom séance, tonnage, nb séries, badge ressenti
- Carte **Course** : distance, durée, allure, type, badge ressenti
- Carte **Level-up** : ancien niveau → nouveau niveau, titre de statut
- Carte **Badge** : nom badge, rareté, description
- **Liker** une activité (toggle, compteur mis à jour en temps réel)
- **Commenter** une activité (champ + envoi)
- Affichage des commentaires (username, contenu, date)
- **Supprimer** son propre commentaire
- **Modal détail** : clic sur une carte → détail complet de la session

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

### Layout 3 colonnes
- **Top XP Global** : classement 5 premiers par XP total
- **Top Course** : classement 5 premiers par distance totale
- **Top Musculation** : classement 5 premiers par tonnage total

### Carte joueur
- Rang (#1 🥇, #2 🥈, #3 🥉, #4/#5 avec couleur dégradée)
- Avatar (photo ou initiale)
- Username + badge "VOUS" pour l'utilisateur courant
- Niveau
- Valeur + unité (XP / km / kg)
- Surbrillance anneau doré pour l'utilisateur courant

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
- 3 lignes : Global, Musculation, Course
- Niveau, XP courant / XP requis, barre de progression colorée

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
| Pesée | 10 XP |
| Compléter un objectif personnel | Variable |

### Calcul des niveaux
- Formule exponentielle : `XP niveau N → N+1 = floor(100 × 1.5^(N-2))`
- 3 compteurs indépendants : Global, Musculation, Course
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

## Résumé des fonctionnalités

| Module | Fonctionnalités principales | Statut |
|--------|----------------------------|--------|
| Auth | Inscription, connexion, déconnexion, routes protégées | ✅ |
| Dashboard | Stats semaine, XP, actions rapides, résumés | ✅ |
| Musculation | CRUD séances + exercices, graphiques, records | ✅ |
| Running | CRUD courses, graphiques, records par distance | ✅ |
| Poids | CRUD pesées, graphique 30j, variations | ✅ |
| Calendrier | Vue mensuelle interactive, détail par jour | ✅ |
| Objectifs | CRUD objectifs, progression, complétion avec XP | ✅ |
| Feed social | Activités, likes, commentaires, modal détail | ✅ |
| Équipes | Défis collectifs, participation, contribution | ✅ |
| Hall of Fame | 3 classements (XP, distance, tonnage) | ✅ |
| Événements | CRUD événements, participation, liste participants | ✅ |
| Profil | Avatar, stats, badges, édition | ✅ |
| Paramètres | Préférences, confidentialité, déconnexion | ✅ |
| XP & Niveaux | Système exponentiel, 30 niveaux thématiques | ✅ |
| Badges | Vérification automatique, déblocage, affichage | ✅ |
| Notifications | Realtime, 7 types, centre de notifs | ✅ |
| Navigation | SideNav desktop, BottomNav mobile + drawer "Plus" | ✅ |
| Mot de passe oublié | Envoi email de reset, page réinitialisation | ✅ |
