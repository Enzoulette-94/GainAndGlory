import type { MuscleGroup } from '../types/enums';

// ============================================================
// EXERCICES PAR DÉFAUT
// ============================================================

export interface DefaultExercise {
  name: string;
  muscle_group: MuscleGroup;
  is_default: true;
}

export const DEFAULT_EXERCISES: DefaultExercise[] = [
  // Pectoraux
  { name: 'Développé couché', muscle_group: 'pectoraux', is_default: true },
  { name: 'Développé incliné', muscle_group: 'pectoraux', is_default: true },
  { name: 'Développé décliné', muscle_group: 'pectoraux', is_default: true },
  { name: 'Écarté', muscle_group: 'pectoraux', is_default: true },
  { name: 'Pompes', muscle_group: 'pectoraux', is_default: true },
  { name: 'Dips', muscle_group: 'pectoraux', is_default: true },
  { name: 'Pull-over', muscle_group: 'pectoraux', is_default: true },

  // Dos
  { name: 'Tractions', muscle_group: 'dos', is_default: true },
  { name: 'Rowing barre', muscle_group: 'dos', is_default: true },
  { name: 'Rowing haltère', muscle_group: 'dos', is_default: true },
  { name: 'Tirage vertical', muscle_group: 'dos', is_default: true },
  { name: 'Tirage horizontal', muscle_group: 'dos', is_default: true },
  { name: 'Soulevé de terre', muscle_group: 'dos', is_default: true },
  { name: 'Face pull', muscle_group: 'dos', is_default: true },

  // Jambes
  { name: 'Squat', muscle_group: 'jambes', is_default: true },
  { name: 'Front squat', muscle_group: 'jambes', is_default: true },
  { name: 'Presse à cuisses', muscle_group: 'jambes', is_default: true },
  { name: 'Leg curl', muscle_group: 'jambes', is_default: true },
  { name: 'Leg extension', muscle_group: 'jambes', is_default: true },
  { name: 'Fentes', muscle_group: 'jambes', is_default: true },
  { name: 'Bulgarian split squat', muscle_group: 'jambes', is_default: true },
  { name: 'Mollets debout', muscle_group: 'jambes', is_default: true },
  { name: 'Mollets assis', muscle_group: 'jambes', is_default: true },

  // Épaules
  { name: 'Développé militaire', muscle_group: 'epaules', is_default: true },
  { name: 'Développé Arnold', muscle_group: 'epaules', is_default: true },
  { name: 'Élévations latérales', muscle_group: 'epaules', is_default: true },
  { name: 'Élévations frontales', muscle_group: 'epaules', is_default: true },
  { name: 'Oiseau', muscle_group: 'epaules', is_default: true },
  { name: 'Rowing menton', muscle_group: 'epaules', is_default: true },

  // Biceps
  { name: 'Curl barre', muscle_group: 'biceps', is_default: true },
  { name: 'Curl haltères', muscle_group: 'biceps', is_default: true },
  { name: 'Curl marteau', muscle_group: 'biceps', is_default: true },
  { name: 'Curl pupitre', muscle_group: 'biceps', is_default: true },
  { name: 'Curl concentration', muscle_group: 'biceps', is_default: true },

  // Triceps
  { name: 'Dips triceps', muscle_group: 'triceps', is_default: true },
  { name: 'Extensions nuque', muscle_group: 'triceps', is_default: true },
  { name: 'Extensions poulie haute', muscle_group: 'triceps', is_default: true },
  { name: 'Kickback', muscle_group: 'triceps', is_default: true },
  { name: 'Barre au front', muscle_group: 'triceps', is_default: true },

  // Abdos
  { name: 'Crunch', muscle_group: 'abdos', is_default: true },
  { name: 'Planche', muscle_group: 'abdos', is_default: true },
  { name: 'Relevé de jambes', muscle_group: 'abdos', is_default: true },
  { name: 'Russian twist', muscle_group: 'abdos', is_default: true },
  { name: 'Mountain climbers', muscle_group: 'abdos', is_default: true },
  { name: 'Bicycle crunch', muscle_group: 'abdos', is_default: true },

  // Cardio
  { name: 'Rameur', muscle_group: 'cardio', is_default: true },
  { name: 'Escalier', muscle_group: 'cardio', is_default: true },
  { name: 'Vélo', muscle_group: 'cardio', is_default: true },
  { name: 'Skier', muscle_group: 'cardio', is_default: true },
];

export const EXERCISE_TAGS = [
  'Barre', 'Haltères', 'Machine', 'Poids de corps', 'Poulie',
  'Élastiques', 'Incliné', 'Décliné', 'Plat',
  'Unilatéral', 'Bilatéral', 'Prise large', 'Prise serrée', 'Prise neutre',
];

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  pectoraux: 'Pectoraux',
  dos: 'Dos',
  jambes: 'Jambes',
  epaules: 'Épaules',
  biceps: 'Biceps',
  triceps: 'Triceps',
  abdos: 'Abdos',
  cardio: 'Cardio',
};

export const MUSCLE_GROUP_DISPLAY = [
  { id: 'pectoraux', label: 'Pectoraux'    },
  { id: 'dos',       label: 'Dos'          },
  { id: 'epaules',   label: 'Épaules'      },
  { id: 'biceps',    label: 'Biceps'       },
  { id: 'triceps',   label: 'Triceps'      },
  { id: 'jambes',    label: 'Jambes'       },
  { id: 'abdos',     label: 'Abdos / Core' },
  { id: 'cardio',    label: 'Cardio'       },
] as const;

// ============================================================
// XP BARÈME
// ============================================================

export const XP_REWARDS = {
  WORKOUT_SESSION: 50,
  RUNNING_SESSION: 50,
  CALISTHENICS_SESSION: 50,
  CROSSFIT_SESSION: 60,
  HYBRID_SESSION_BONUS: 20,
  SKILL_UNLOCKED: 200,
  WEIGHT_ENTRY: 10,
  PERSONAL_RECORD: 100,
  PERSONAL_GOAL_COMPLETED: 150,
  COMMUNITY_CHALLENGE_COMPLETED: 200,
  FLASH_CHALLENGE_COMPLETED: 100,
  STREAK_7_DAYS: 200,
  STREAK_30_DAYS: 1000,
  MILESTONE: 300,
} as const;

// ============================================================
// CALISTHÉNIE
// ============================================================

export const CALISTHENICS_GROUPS = [
  { id: 'traction',  label: 'Traction / Tirage', emoji: '🔼',
    exercises: ['Pull-up', 'Chin-up', 'Muscle-up', 'Front lever', 'Australian pull-up', 'One arm pull-up', 'Reverse DL'] },
  { id: 'poussee',   label: 'Poussée',            emoji: '💪',
    exercises: ['Dip', 'Pike push-up', 'HSPU', 'Archer push-up', 'Ring push-up', 'Planche push-up', 'Push-up', 'Pompes inclinées', 'Pompes déclinées', 'Pompes spartiates', 'Skull Crusher'] },
  { id: 'core',      label: 'Core / Gainage',     emoji: '🔥',
    exercises: ['L-sit', 'Planche', 'Dragon flag', 'Hollow body', 'V-sit', 'Tuck planche', 'Ab wheel'] },
  { id: 'jambes',    label: 'Jambes',              emoji: '🦵',
    exercises: ['Squat', 'Pistol squat', 'Shrimp squat', 'Nordic curl', 'Jump squat', 'Corde à sauter', 'Montée de talons (mollets)'] },
  { id: 'isometrie', label: 'Isométrie / Tenu',   emoji: '⏱',
    exercises: ['Front lever hold', 'Back lever hold', 'Human flag', 'Ring support hold'] },
  { id: 'kettle',    label: 'Kettlebell',          emoji: '🫙',
    exercises: [
      'Swing à deux mains', 'Swing à une main', 'Swing alterné',
      'Clean', 'Snatch', 'High pull',
      'Military press (1 bras)', 'Push press (1 bras)', 'Jerk (1 bras)',
      'Double press', 'Floor press',
      'Row (1 bras)', 'Double row', 'Renegade row',
      'Halo', 'Goblet squat', 'Double front squat',
      'Pistol squat assisté', 'Pistol squat',
      'Sumo deadlift', 'Single-leg deadlift', 'Cossack squat',
      'Split squat', 'Lunge', 'Step-up',
      'Turkish get-up (TGU)', 'Windmill',
      'Suitcase carry (farmer\'s walk)', 'Rack carry', 'Overhead carry',
      'Side press', 'Arm bar',
      'Clean & press', 'Clean & jerk', 'Swing + snatch',
      'Long cycle (clean & jerk répété)',
    ] },
] as const;

export const RUNNING_RACE_DISTANCES = [
  { label: '5 km',          title: '5 km',         km: 5 },
  { label: '10 km',         title: '10 km',        km: 10 },
  { label: 'Semi-marathon', title: 'Semi-marathon', km: 21.0975 },
  { label: 'Marathon',      title: 'Marathon',      km: 42.195 },
] as const;

export const CALISTHENICS_EXERCISES = [
  'Pull-up', 'Chin-up', 'Dip', 'Push-up', 'Diamond Push-up', 'Pike Push-up',
  'Handstand Push-up', 'Muscle-up', 'L-sit', 'Handstand', 'Front Lever',
  'Back Lever', 'Planche', 'Dragon Flag', 'Squat', 'Pistol Squat', 'Burpee',
  'Tuck Planche', 'Inverted Row', 'Ring Dip', 'Ring Row',
  'Archer Push-up', 'Pseudo Planche Push-up', 'Hollow Body Hold', 'Superman Hold',
  'Pompes inclinées', 'Pompes déclinées', 'Pompes spartiates', 'Skull Crusher',
  'Corde à sauter', 'Montée de talons (mollets)', 'Reverse DL',
  // Kettlebell
  'Swing à deux mains', 'Swing à une main', 'Swing alterné',
  'Clean', 'Snatch', 'High pull',
  'Military press (1 bras)', 'Push press (1 bras)', 'Jerk (1 bras)',
  'Double press', 'Floor press',
  'Row (1 bras)', 'Double row', 'Renegade row',
  'Halo', 'Goblet squat', 'Double front squat',
  'Pistol squat assisté',
  'Sumo deadlift', 'Single-leg deadlift', 'Cossack squat',
  'Split squat', 'Lunge', 'Step-up',
  'Turkish get-up (TGU)', 'Windmill',
  "Suitcase carry (farmer's walk)", 'Rack carry', 'Overhead carry',
  'Side press', 'Arm bar',
  'Clean & press', 'Clean & jerk', 'Swing + snatch',
  'Long cycle (clean & jerk répété)',
];

export const CALISTHENICS_SKILLS = [
  { code: 'pullup_10',      label: '10 tractions',   description: '10 pull-ups consécutifs', xp: 100 },
  { code: 'pullup_20',      label: '20 tractions',   description: '20 pull-ups consécutifs', xp: 200 },
  { code: 'dip_15',         label: '15 dips',        description: '15 dips consécutifs',     xp: 100 },
  { code: 'pushup_50',      label: '50 pompes',      description: '50 push-ups consécutifs', xp: 150 },
  { code: 'lsit_30s',       label: 'L-sit 30s',      description: 'L-sit tenu 30 secondes',  xp: 200 },
  { code: 'handstand_20s',  label: 'Handstand 20s',  description: 'Handstand tenu 20s',      xp: 200 },
  { code: 'handstand_60s',  label: 'Handstand 60s',  description: 'Handstand tenu 60s',      xp: 400 },
  { code: 'muscle_up',      label: 'Muscle-up',      description: '1 muscle-up complet',     xp: 500 },
  { code: 'front_lever_5s', label: 'Front Lever 5s', description: 'Front lever tenu 5s',     xp: 600 },
  { code: 'planche_3s',     label: 'Planche 3s',     description: 'Planche tenu 3s',         xp: 800 },
] as const;

export type SkillCode = typeof CALISTHENICS_SKILLS[number]['code'];

// ============================================================
// CROSSFIT
// ============================================================

export const CROSSFIT_WOD_TYPES = [
  { id: 'emom',       label: 'EMOM',       description: 'Every Minute on the Minute' },
  { id: 'amrap',      label: 'AMRAP',      description: 'As Many Reps As Possible' },
  { id: 'benchmark',  label: 'BENCHMARK',  description: 'Épreuve test de progression' },
  { id: 'for_rounds', label: 'FOR ROUNDS', description: 'Nombre de rounds dans le temps' },
  { id: 'for_time',   label: 'FOR TIME',   description: 'Temps pour compléter le WOD' },
] as const;

export const CROSSFIT_GROUPS = [
  {
    id: 'haltero',
    label: 'Haltérophilie',
    emoji: '🏋️',
    exercises: [
      'Snatch', 'Clean & Jerk', 'Power Snatch', 'Power Clean', 'Hang Power Snatch',
      'Hang Power Clean', 'Overhead Squat', 'Front Squat', 'Clean', 'Jerk',
      'Push Jerk', 'Split Jerk', 'Hang Clean',
    ],
  },
  {
    id: 'power',
    label: 'Powerlifting & Force',
    emoji: '💪',
    exercises: [
      'Back Squat', 'Deadlift', 'Bench Press', 'Strict Press', 'Push Press',
      'Romanian Deadlift', 'Sumo Deadlift', 'Thruster', 'Farmer Carry',
      'Good Morning', 'Hip Thrust', 'Barbell Row',
    ],
  },
  {
    id: 'gymnastics_sol',
    label: 'Gymnastics sol',
    emoji: '🤸',
    exercises: [
      'Push-up', 'Diamond Push-up', 'Pike Push-up', 'Handstand Push-up', 'Planche Push-up',
      'Archer Push-up', 'Burpee', 'V-up', 'Sit-up', 'GHD Sit-up',
      'Back Extension', 'Superman Hold', 'Hollow Hold', 'Pistol Squat',
      'Air Squat', 'Lunge', 'Box Step-up', 'Wall Walk', 'Bear Crawl', 'Turkish Get-up',
    ],
  },
  {
    id: 'gymnastics_barre',
    label: 'Gymnastics barre & anneaux',
    emoji: '🔼',
    exercises: [
      'Pull-up', 'Chin-up', 'Kipping Pull-up', 'Butterfly Pull-up', 'Chest-to-Bar Pull-up',
      'Muscle-up (barre)', 'Toes-to-Bar', 'Knees-to-Elbow', 'L-sit (barre)',
      'Ring Dip', 'Ring Push-up', 'Ring Row', 'Ring Muscle-up', 'Ring L-sit',
      'Dip (barre)', 'Bar Muscle-up', 'Front Lever', 'Back Lever',
      'L-sit (anneaux)', 'Skin the Cat', 'Face Pull (anneaux)',
    ],
  },
  {
    id: 'sauts',
    label: 'Sauts & Pliométrie',
    emoji: '🦘',
    exercises: [
      'Box Jump', 'Box Jump Over', 'Broad Jump', 'Double Under',
      'Single Under', 'Jump Squat', 'Lateral Burpee', 'Depth Jump', 'Tuck Jump',
    ],
  },
  {
    id: 'monostructural',
    label: 'Monostructural',
    emoji: '🏃',
    exercises: [
      'Run 400m', 'Run 800m', 'Run 1km', 'Rowing (cal)', 'Rowing (m)',
      'Assault Bike (cal)', 'Ski Erg (cal)',
    ],
  },
  {
    id: 'kettlebell',
    label: 'Kettlebell',
    emoji: '🔔',
    exercises: [
      'KB Swing', 'KB Goblet Squat', 'KB Turkish Get-up', 'KB Snatch',
      'KB Clean & Press', 'KB Windmill', 'KB Deadlift', 'KB Farmer Carry',
    ],
  },
  {
    id: 'medball',
    label: 'Médecine-ball',
    emoji: '⚽',
    exercises: [
      'Wall Ball', 'Med Ball Clean', 'Med Ball Slam', 'Med Ball Sit-up',
      'Med Ball Carry', 'Med Ball Throw',
    ],
  },
  {
    id: 'carries',
    label: 'Carries & Objets lourds',
    emoji: '🪨',
    exercises: [
      'Sled Push', 'Sled Pull', 'Tire Flip', 'Yoke Carry', 'Atlas Stone',
      'Sandbag Carry', 'Sandbag Clean', 'Sandbag Squat', 'Log Press', 'Log Clean',
      'Heavy Bag Carry', 'Dumbbell Carry', 'D-ball Over Shoulder', 'Prowler Push', 'Plate Carry',
    ],
  },
  {
    id: 'elastiques',
    label: 'Bandes élastiques',
    emoji: '🎗️',
    exercises: [
      'Banded Pull-apart', 'Banded Good Morning', 'Banded Squat', 'Banded Deadlift',
    ],
  },
] as const;

// ============================================================
// BADGES
// ============================================================

export const BADGE_DEFINITIONS = [
  // Progression
  { code: 'bronze_level', name: 'Niveau Bronze', description: 'Atteindre le niveau 5', category: 'progression', rarity: 'common', is_secret: false },
  { code: 'silver_level', name: 'Niveau Argent', description: 'Atteindre le niveau 10', category: 'progression', rarity: 'rare', is_secret: false },
  { code: 'gold_level', name: 'Niveau Or', description: 'Atteindre le niveau 15', category: 'progression', rarity: 'epic', is_secret: false },
  { code: 'platinum_level', name: 'Niveau Platine', description: 'Atteindre le niveau 20', category: 'progression', rarity: 'legendary', is_secret: false },
  { code: 'diamond_level', name: 'Niveau Diamant', description: 'Atteindre le niveau 25', category: 'progression', rarity: 'legendary', is_secret: false },
  { code: 'runner_badge', name: 'Runner', description: 'Atteindre niveau 10 en course', category: 'progression', rarity: 'rare', is_secret: false },
  { code: 'lifter_badge', name: 'Lifter', description: 'Atteindre niveau 10 en musculation', category: 'progression', rarity: 'rare', is_secret: false },
  { code: 'transformer_badge', name: 'Transformer', description: 'Perdre ou gagner 10kg', category: 'progression', rarity: 'epic', is_secret: false },
  { code: 'week_streak', name: '7 jours consécutifs', description: 'Maintenir 7 jours d\'activité', category: 'progression', rarity: 'common', is_secret: false },
  { code: 'month_streak', name: '30 jours consécutifs', description: 'Maintenir 30 jours d\'activité', category: 'progression', rarity: 'rare', is_secret: false },
  { code: 'hundred_days', name: '100 jours consécutifs', description: 'Maintenir 100 jours d\'activité', category: 'progression', rarity: 'epic', is_secret: false },
  { code: 'year_streak', name: '365 jours consécutifs', description: 'Maintenir 1 an d\'activité', category: 'progression', rarity: 'legendary', is_secret: false },

  // Objectifs
  { code: 'first_goal', name: 'Premier objectif', description: 'Compléter son 1er objectif personnel', category: 'objectifs', rarity: 'common', is_secret: false },
  { code: 'ten_goals', name: 'Visionnaire', description: 'Compléter 10 objectifs personnels', category: 'objectifs', rarity: 'common', is_secret: false },
  { code: 'fifty_goals', name: 'Ambitieux', description: 'Compléter 50 objectifs personnels', category: 'objectifs', rarity: 'rare', is_secret: false },
  { code: 'hundred_goals', name: 'Déterminé', description: 'Compléter 100 objectifs personnels', category: 'objectifs', rarity: 'epic', is_secret: false },
  { code: 'challenge_participant', name: 'Participant', description: 'Participer à un objectif commun', category: 'objectifs', rarity: 'common', is_secret: false },
  { code: 'challenge_contributor', name: 'Contributeur', description: 'Compléter un objectif commun', category: 'objectifs', rarity: 'common', is_secret: false },
  { code: 'challenge_mvp', name: 'MVP communautaire', description: 'Compléter 10 objectifs communs', category: 'objectifs', rarity: 'epic', is_secret: false },
  { code: 'speedster', name: 'Speedster', description: 'Compléter un objectif flash', category: 'objectifs', rarity: 'rare', is_secret: false },
  { code: 'early_bird_flash', name: 'Early Bird', description: 'Compléter un objectif flash dans les 6h', category: 'objectifs', rarity: 'epic', is_secret: true },

  // Performance
  { code: 'first_pr', name: 'Premier record', description: 'Battre son 1er record personnel', category: 'performance', rarity: 'common', is_secret: false },
  { code: 'ten_prs', name: 'Progressiste', description: 'Battre 10 records personnels', category: 'performance', rarity: 'common', is_secret: false },
  { code: 'fifty_prs', name: 'Champion', description: 'Battre 50 records personnels', category: 'performance', rarity: 'rare', is_secret: false },
  { code: 'hundred_km', name: 'Centurion du km', description: 'Courir 100km cumulés', category: 'performance', rarity: 'common', is_secret: false },
  { code: 'five_hundred_km', name: 'Ultra runner', description: 'Courir 500km cumulés', category: 'performance', rarity: 'rare', is_secret: false },
  { code: 'thousand_km', name: 'Marathonien légendaire', description: 'Courir 1000km cumulés', category: 'performance', rarity: 'legendary', is_secret: false },
  { code: 'thousand_kg', name: 'Force Initiale', description: 'Soulever 1000kg cumulés', category: 'performance', rarity: 'common', is_secret: false },
  { code: 'five_thousand_kg', name: 'Force Intermédiaire', description: 'Soulever 5000kg cumulés', category: 'performance', rarity: 'rare', is_secret: false },
  { code: 'ten_thousand_kg', name: 'Force Légendaire', description: 'Soulever 10000kg cumulés', category: 'performance', rarity: 'epic', is_secret: false },
  { code: 'minus_5kg', name: 'Transformation -5kg', description: 'Perdre 5kg', category: 'performance', rarity: 'common', is_secret: false },
  { code: 'minus_10kg', name: 'Transformation -10kg', description: 'Perdre 10kg', category: 'performance', rarity: 'rare', is_secret: false },
  { code: 'minus_20kg', name: 'Transformation -20kg', description: 'Perdre 20kg', category: 'performance', rarity: 'epic', is_secret: false },
  { code: 'plus_5kg_muscle', name: 'Gain musculaire +5kg', description: 'Prendre 5kg', category: 'performance', rarity: 'common', is_secret: false },
  { code: 'plus_10kg_muscle', name: 'Gain musculaire +10kg', description: 'Prendre 10kg', category: 'performance', rarity: 'rare', is_secret: false },

  // Participation
  { code: 'ten_sessions', name: 'Démarrage', description: 'Enregistrer 10 séances', category: 'participation', rarity: 'common', is_secret: false },
  { code: 'fifty_sessions', name: 'Régulier', description: 'Enregistrer 50 séances', category: 'participation', rarity: 'common', is_secret: false },
  { code: 'hundred_sessions', name: 'Assidu', description: 'Enregistrer 100 séances', category: 'participation', rarity: 'rare', is_secret: false },
  { code: 'five_hundred_sessions', name: 'Dévoué', description: 'Enregistrer 500 séances', category: 'participation', rarity: 'epic', is_secret: false },
  { code: 'thousand_sessions', name: 'Légendaire', description: 'Enregistrer 1000 séances', category: 'participation', rarity: 'legendary', is_secret: false },
  { code: 'multi_sport_warrior', name: 'Guerrier multi-sport', description: 'Faire muscu + course dans la même semaine', category: 'participation', rarity: 'common', is_secret: false },
  { code: 'social_athlete', name: 'Athlète social', description: 'Liker 50 performances', category: 'participation', rarity: 'common', is_secret: false },
  { code: 'team_player', name: 'Team Player', description: 'Commenter 50 fois', category: 'participation', rarity: 'common', is_secret: false },

  // Secret
  { code: 'new_year_athlete', name: 'Nouvel An Sportif', description: 'Séance le 1er janvier', category: 'secret', rarity: 'rare', is_secret: true },
  { code: 'valentine_solo', name: 'Saint-Valentin solo', description: 'Séance le 14 février', category: 'secret', rarity: 'rare', is_secret: true },
  { code: 'resolution_keeper', name: 'Résolution tenue', description: '365 jours consécutifs', category: 'secret', rarity: 'legendary', is_secret: true },
  { code: 'four_seasons', name: 'Quatre saisons', description: 'Séance dans chaque saison', category: 'secret', rarity: 'epic', is_secret: true },
  { code: 'phoenix', name: 'Phoenix', description: 'Revenir après 30+ jours d\'inactivité', category: 'secret', rarity: 'epic', is_secret: true },
  { code: 'indestructible', name: 'Indestructible', description: '100 jours consécutifs', category: 'secret', rarity: 'epic', is_secret: true },
  { code: 'rainy_warrior', name: 'Guerrier de la pluie', description: '5 courses sous la pluie', category: 'secret', rarity: 'rare', is_secret: true },
  { code: 'winter_warrior', name: 'Guerrier de l\'hiver', description: '10 courses par <5°C', category: 'secret', rarity: 'rare', is_secret: true },
  { code: 'double_trouble', name: 'Doublé', description: 'Muscu + Course le même jour', category: 'secret', rarity: 'rare', is_secret: false },
  { code: 'triple_threat', name: 'Triplé', description: 'Muscu + Course + Pesée le même jour', category: 'secret', rarity: 'epic', is_secret: false },
  { code: 'speedster_week', name: 'Speedster', description: 'Battre 3 PRs en une semaine', category: 'secret', rarity: 'rare', is_secret: false },
  { code: 'titan', name: 'Titan', description: '10000kg de tonnage en une séance', category: 'secret', rarity: 'legendary', is_secret: true },
  { code: 'triple_seven', name: 'Triple 7', description: 'Séance le 07/07 entre 7h-8h', category: 'secret', rarity: 'legendary', is_secret: true },
  { code: 'perfect_balance', name: 'Équilibre parfait', description: '50% muscu / 50% course sur un mois', category: 'secret', rarity: 'epic', is_secret: true },
  { code: 'mad_collector', name: 'Collectionneur fou', description: 'Débloquer 50 badges', category: 'secret', rarity: 'legendary', is_secret: false },
  { code: 'leet', name: '1337', description: 'Atteindre exactement 1337 XP', category: 'secret', rarity: 'legendary', is_secret: true },
  { code: 'explorer', name: 'Explorateur', description: 'Utiliser tous les types de course', category: 'secret', rarity: 'common', is_secret: false },
  { code: 'polyvalent', name: 'Polyvalent', description: '10 exercices différents en muscu', category: 'secret', rarity: 'common', is_secret: false },
  { code: 'rainbow', name: 'Arc-en-ciel', description: 'Utiliser tous les feedbacks', category: 'secret', rarity: 'rare', is_secret: false },
  { code: 'first_supporter', name: 'Premier supporter', description: 'Premier à liker une performance', category: 'secret', rarity: 'rare', is_secret: true },
  { code: 'active_commenter', name: 'Commentateur actif', description: '100 commentaires postés', category: 'participation', rarity: 'rare', is_secret: false },
  { code: 'motivator', name: 'Motivateur', description: 'Recevoir 50 likes sur une performance', category: 'secret', rarity: 'epic', is_secret: true },
  { code: 'creator', name: 'Créateur', description: 'Créer le 1er objectif commun validé', category: 'secret', rarity: 'rare', is_secret: true },
] as const;

export type BadgeCode = typeof BADGE_DEFINITIONS[number]['code'];

// ============================================================
// NIVEAUX
// ============================================================

export const LEVEL_TITLES = [
  { min: 1, max: 5, title: 'Débutant' },
  { min: 6, max: 10, title: 'Intermédiaire' },
  { min: 11, max: 15, title: 'Avancé' },
  { min: 16, max: 20, title: 'Expert' },
  { min: 21, max: Infinity, title: 'Élite' },
] as const;

// ============================================================
// RUNNING
// ============================================================

export const RUN_TYPE_LABELS = {
  fractionne: 'Fractionné',
  endurance: 'Endurance',
  tempo: 'Tempo',
} as const;

export const WEATHER_LABELS = {
  ensoleille: '☀️ Ensoleillé',
  nuageux: '☁️ Nuageux',
  pluie: '🌧️ Pluie',
  vent: '💨 Vent',
  neige: '❄️ Neige',
} as const;

export const FEEDBACK_LABELS = {
  facile: 'Facile',
  difficile: 'Difficile',
  mort: 'Mort',
} as const;

export const FEEDBACK_COLORS = {
  facile: 'text-emerald-400',
  difficile: 'text-amber-400',
  mort: 'text-red-400',
} as const;

// Records distances course
export const RUNNING_RECORD_DISTANCES = [
  { label: '1 km', km: 1 },
  { label: '5 km', km: 5 },
  { label: '10 km', km: 10 },
  { label: 'Semi-marathon', km: 21.0975 },
  { label: 'Marathon', km: 42.195 },
] as const;

// Zones cardiaques
export const HEART_RATE_ZONES = [
  { zone: 'Z1', label: 'Récupération', min: 50, max: 60, color: '#6ee7b7' },
  { zone: 'Z2', label: 'Endurance fondamentale', min: 60, max: 70, color: '#34d399' },
  { zone: 'Z3', label: 'Tempo', min: 70, max: 80, color: '#fbbf24' },
  { zone: 'Z4', label: 'Seuil', min: 80, max: 90, color: '#f97316' },
  { zone: 'Z5', label: 'VO2 max', min: 90, max: 100, color: '#ef4444' },
] as const;

// Seuil d'alerte chaussures
export const SHOE_ALERT_KM = 800;

// Rareté des badges
export const BADGE_RARITY_CONFIG = {
  common: { label: 'Commun', color: '#94a3b8', bg: '#1e293b' },
  rare: { label: 'Rare', color: '#60a5fa', bg: '#1e3a5f' },
  epic: { label: 'Épique', color: '#a78bfa', bg: '#2e1065' },
  legendary: { label: 'Légendaire', color: '#fbbf24', bg: '#451a03' },
} as const;

export const BADGE_XP_REWARDS: Record<string, number> = {
  common: 50,
  uncommon: 50,
  rare: 250,
  epic: 250,
  legendary: 500,
};
