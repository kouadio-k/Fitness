import type { ActivityLevel, Food, FoodEntry, Goal, NutritionTargets, Profile } from '../types';

/**
 * Facteurs d'activité classiquement associés à l'équation de Mifflin-St Jeor
 * pour estimer la dépense énergétique totale (DET = métabolisme de base × facteur).
 */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, { label: string; hint: string }> = {
  sedentary: { label: 'Sédentaire', hint: 'Travail assis, peu de marche' },
  light: { label: 'Légèrement actif', hint: 'Marche quotidienne ou 1-3 séances / semaine' },
  moderate: { label: 'Modérément actif', hint: 'Debout une bonne partie de la journée ou 3-5 séances' },
  active: { label: 'Très actif', hint: 'Métier physique ou 6-7 séances' },
  very_active: { label: 'Extrêmement actif', hint: 'Métier très physique + entraînement intense' },
};

/**
 * Ajustement calorique selon l'objectif (choix de l'application, modéré volontairement) :
 * un déficit d'environ 20 % reste soutenable et limite la perte musculaire,
 * un léger surplus suffit pour la prise de muscle.
 */
export const GOAL_ADJUSTMENT: Record<Goal, number> = {
  lose_fat: -0.2,
  tone: -0.1,
  fitness: 0,
  strength: 0.05,
  build_muscle: 0.1,
};

/** Protéines en g/kg/jour — dans la fourchette 1,4-2,0 g/kg de la position de l'ISSN (Jäger et al., 2017). */
export const PROTEIN_PER_KG: Record<Goal, number> = {
  lose_fat: 1.8,
  tone: 1.6,
  fitness: 1.4,
  strength: 1.8,
  build_muscle: 1.8,
};

/** Part des lipides dans l'apport énergétique (EFSA : fourchette de référence 20-35 %). */
export const FAT_SHARE = 0.3;

/** Plancher calorique de sécurité appliqué par l'application (pas de régime très hypocalorique sans suivi médical). */
export const KCAL_FLOOR: Record<Profile['sex'], number> = { female: 1200, male: 1500 };

export function ageFromBirthYear(birthYear: number, now = new Date()): number {
  return now.getFullYear() - birthYear;
}

/** Métabolisme de base — Mifflin MD, St Jeor ST et al., Am J Clin Nutr 1990;51:241-247. */
export function bmrMifflin(sex: Profile['sex'], weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'female' ? base - 161 : base + 5;
}

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(value: number): string {
  // Seuils OMS chez l'adulte
  if (value < 18.5) return 'Insuffisance pondérale';
  if (value < 25) return 'Corpulence normale';
  if (value < 30) return 'Surpoids';
  return 'Obésité';
}

export interface EnergyBreakdown {
  bmr: number;
  tdee: number;
  adjustment: number;
}

export function energyBreakdown(profile: Profile, weightKg = profile.weightKg, now = new Date()): EnergyBreakdown {
  const age = ageFromBirthYear(profile.birthYear, now);
  const bmr = bmrMifflin(profile.sex, weightKg, profile.heightCm, age);
  const tdee = bmr * ACTIVITY_FACTORS[profile.activity];
  return { bmr, tdee, adjustment: GOAL_ADJUSTMENT[profile.goal] };
}

export function computeTargets(profile: Profile, weightKg = profile.weightKg, now = new Date()): NutritionTargets {
  const { tdee } = energyBreakdown(profile, weightKg, now);
  let kcal = tdee * (1 + GOAL_ADJUSTMENT[profile.goal]);
  kcal = Math.max(kcal, KCAL_FLOOR[profile.sex]);
  kcal = Math.round(kcal / 10) * 10;

  // En cas d'IMC élevé, les protéines sont calculées sur un poids de référence (IMC 25)
  // pour éviter des quantités excessives.
  const refWeight = bmi(weightKg, profile.heightCm) > 30 ? 25 * (profile.heightCm / 100) ** 2 : weightKg;
  const protein = Math.round(PROTEIN_PER_KG[profile.goal] * refWeight);
  const fat = Math.round((kcal * FAT_SHARE) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));

  return {
    kcal,
    protein,
    carbs,
    fat,
    // ANSES : 30 g de fibres / jour pour l'adulte
    fiber: 30,
    // EFSA (2010) : apport adéquat en eau totale 2,0 L (femme) / 2,5 L (homme)
    waterMl: profile.sex === 'female' ? 2000 : 2500,
  };
}

export function targetsFloorApplied(profile: Profile, weightKg = profile.weightKg): boolean {
  const { tdee } = energyBreakdown(profile, weightKg);
  return tdee * (1 + GOAL_ADJUSTMENT[profile.goal]) < KCAL_FLOOR[profile.sex];
}

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export const ZERO_MACROS: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

export function macrosFor(food: Food, grams: number): Macros {
  const k = grams / 100;
  return {
    kcal: food.kcal * k,
    protein: food.protein * k,
    carbs: food.carbs * k,
    fat: food.fat * k,
    fiber: (food.fiber ?? 0) * k,
  };
}

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
    fiber: a.fiber + b.fiber,
  };
}

export function sumEntries(entries: Pick<FoodEntry, 'food' | 'grams'>[]): Macros {
  return entries.reduce((acc, e) => addMacros(acc, macrosFor(e.food, e.grams)), ZERO_MACROS);
}
