// ---------- Profil ----------

export type Sex = 'female' | 'male';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type Goal = 'lose_fat' | 'tone' | 'build_muscle' | 'strength' | 'fitness';

export type Experience = 'beginner' | 'intermediate' | 'advanced';

export type Equipment = 'bodyweight' | 'dumbbells' | 'bands' | 'kettlebell' | 'bench' | 'pullup_bar' | 'gym';

export type Limitation = 'knees' | 'lower_back' | 'shoulders' | 'wrists' | 'no_jumping';

export type Focus = 'balanced' | 'glutes_legs' | 'upper_body' | 'core';

export type CardioPreference = 'none' | 'walking' | 'running' | 'cycling' | 'hiit' | 'swimming';

export type DietPreference = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian';

/** 0 = lundi … 6 = dimanche */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Profile {
  name: string;
  sex: Sex;
  birthYear: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg?: number;
  activity: ActivityLevel;
  goal: Goal;
  experience: Experience;
  trainingDays: Weekday[];
  sessionMinutes: number;
  equipment: Equipment[];
  limitations: Limitation[];
  focus: Focus;
  cardio: CardioPreference;
  diet: DietPreference;
  createdAt: string;
}

export interface NutritionTargets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  waterMl: number;
}

// ---------- Exercices & programme ----------

export type Pattern =
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'glute'
  | 'push_h'
  | 'push_v'
  | 'pull_h'
  | 'pull_v'
  | 'core'
  | 'arms_bi'
  | 'arms_tri'
  | 'shoulders_iso'
  | 'calves'
  | 'conditioning';

export type Muscle =
  | 'quadriceps'
  | 'ischios'
  | 'fessiers'
  | 'mollets'
  | 'adducteurs'
  | 'dos'
  | 'pectoraux'
  | 'epaules'
  | 'biceps'
  | 'triceps'
  | 'abdos'
  | 'lombaires'
  | 'cardio';

export interface Exercise {
  id: string;
  name: string;
  pattern: Pattern;
  muscles: Muscle[];
  /** L'exercice est faisable si TOUS les équipements listés sont disponibles. Vide = poids du corps. */
  equipment: Equipment[];
  level: 1 | 2 | 3;
  /** Zones sensibles pour lesquelles on évite l'exercice. */
  avoidIf: Limitation[];
  /** Exercice mesuré en secondes (gainage, cardio) plutôt qu'en répétitions. */
  timed?: boolean;
  /** Exercice unilatéral (reps par côté). */
  unilateral?: boolean;
  /** Mouvement polyarticulaire "principal". */
  compound?: boolean;
  /** Charge externe possible (pour afficher un champ poids). */
  loadable?: boolean;
  cues: string[];
}

export interface PlannedExercise {
  uid: string;
  exerciseId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  /** Pour les exercices chronométrés : durée par série en secondes. */
  seconds?: number;
  restSec: number;
  note?: string;
}

export interface SessionTemplate {
  id: string;
  name: string;
  description?: string;
  warmup: string[];
  exercises: PlannedExercise[];
  finisher?: string;
  custom?: boolean;
}

export interface WeekPlanDay {
  weekday: Weekday;
  sessionId: string;
}

export interface Program {
  id: string;
  name: string;
  createdAt: string;
  splitLabel: string;
  rationale: string[];
  sessions: SessionTemplate[];
  schedule: WeekPlanDay[];
  cardioAdvice: string;
  /** Durée du cycle en semaines (la dernière est une semaine allégée). */
  cycleWeeks: number;
}

// ---------- Journal d'entraînement ----------

export interface LoggedSet {
  reps: number;
  weight: number;
  seconds?: number;
  done: boolean;
}

export interface LoggedExercise {
  exerciseId: string;
  sets: LoggedSet[];
}

export interface WorkoutLog {
  id: string;
  sessionId: string;
  sessionName: string;
  date: string; // YYYY-MM-DD
  startedAt: string;
  durationMin: number;
  exercises: LoggedExercise[];
  /** Ressenti 1 (très facile) → 10 (maximal) */
  rpe?: number;
  notes?: string;
}

export interface CardioLog {
  id: string;
  date: string;
  type: CardioPreference | 'other';
  minutes: number;
  notes?: string;
}

// ---------- Nutrition ----------

export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export interface Food {
  id: string;
  name: string;
  /** Valeurs pour 100 g (ou 100 ml) */
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  /** Portion usuelle en grammes */
  portionG?: number;
  portionLabel?: string;
  category?: string;
  source: 'builtin' | 'custom' | 'openfoodfacts';
  brand?: string;
  barcode?: string;
  vegan?: boolean;
  vegetarian?: boolean;
}

export interface FoodEntry {
  id: string;
  date: string;
  slot: MealSlot;
  foodId: string;
  /** Copie des valeurs nutritionnelles au moment de l'ajout (l'aliment peut être supprimé ensuite) */
  food: Food;
  grams: number;
}

export interface SavedMeal {
  id: string;
  name: string;
  items: { food: Food; grams: number }[];
}

// ---------- Suivi corporel ----------

export interface WeightEntry {
  date: string;
  kg: number;
}

export interface Measurement {
  date: string;
  waist?: number;
  hips?: number;
  chest?: number;
  thigh?: number;
  arm?: number;
}

// ---------- État global ----------

export interface AppState {
  version: number;
  profile: Profile | null;
  targetsOverride: Partial<NutritionTargets> | null;
  program: Program | null;
  customSessions: SessionTemplate[];
  workouts: WorkoutLog[];
  cardio: CardioLog[];
  foods: Food[];
  entries: FoodEntry[];
  savedMeals: SavedMeal[];
  water: Record<string, number>;
  weights: WeightEntry[];
  measurements: Measurement[];
  activeWorkout: ActiveWorkout | null;
}

export interface ActiveWorkout {
  sessionId: string;
  startedAt: string;
  exercises: (LoggedExercise & { planned: PlannedExercise })[];
}
