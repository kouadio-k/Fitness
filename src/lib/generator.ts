import { EXERCISES, getExercise } from '../data/exercises';
import type {
  Equipment,
  Exercise,
  Experience,
  Goal,
  Pattern,
  PlannedExercise,
  Profile,
  Program,
  SessionTemplate,
  WorkoutLog,
} from '../types';
import { uid } from './id';

// ---------------------------------------------------------------------------
// Filtrage des exercices disponibles
// ---------------------------------------------------------------------------

const MAX_LEVEL: Record<Experience, 1 | 2 | 3> = { beginner: 1, intermediate: 2, advanced: 3 };

/** Une salle de sport donne en pratique accès aux haltères, bancs, barres de traction, kettlebells et élastiques. */
export function expandEquipment(equipment: Equipment[]): Set<Equipment> {
  const set = new Set<Equipment>(equipment);
  set.add('bodyweight');
  if (set.has('gym')) {
    (['dumbbells', 'bench', 'pullup_bar', 'kettlebell', 'bands'] as Equipment[]).forEach((e) => set.add(e));
  }
  return set;
}

export function isAvailable(ex: Exercise, profile: Pick<Profile, 'equipment' | 'limitations'>): boolean {
  const eq = expandEquipment(profile.equipment);
  if (!ex.equipment.every((e) => eq.has(e))) return false;
  if (ex.avoidIf.some((l) => profile.limitations.includes(l))) return false;
  return true;
}

export function availableExercises(profile: Pick<Profile, 'equipment' | 'limitations'>): Exercise[] {
  return EXERCISES.filter((ex) => isAvailable(ex, profile));
}

/** Exercices de remplacement possibles (même schéma moteur), pour la fonction "remplacer". */
export function alternativesFor(exerciseId: string, profile: Pick<Profile, 'equipment' | 'limitations'>): Exercise[] {
  const ex = getExercise(exerciseId);
  if (!ex) return [];
  return availableExercises(profile).filter((e) => e.pattern === ex.pattern && e.id !== ex.id);
}

// ---------------------------------------------------------------------------
// Prescription séries / répétitions / repos
// ---------------------------------------------------------------------------

interface Prescription {
  sets: number;
  repsMin: number;
  repsMax: number;
  restSec: number;
}

/**
 * Fourchettes inspirées de la position de l'ACSM sur la progression en musculation (2009) :
 * 8-12 répétitions pour débuter / l'hypertrophie, charges plus lourdes (≤ 6 rép.) et repos plus longs pour la force,
 * répétitions plus nombreuses et repos courts pour l'endurance musculaire.
 */
const PRESCRIPTIONS: Record<Goal, { main: Prescription; accessory: Prescription }> = {
  lose_fat: { main: { sets: 3, repsMin: 10, repsMax: 12, restSec: 75 }, accessory: { sets: 3, repsMin: 12, repsMax: 15, restSec: 60 } },
  tone: { main: { sets: 3, repsMin: 10, repsMax: 12, restSec: 75 }, accessory: { sets: 3, repsMin: 12, repsMax: 15, restSec: 60 } },
  build_muscle: { main: { sets: 4, repsMin: 8, repsMax: 12, restSec: 120 }, accessory: { sets: 3, repsMin: 10, repsMax: 15, restSec: 75 } },
  strength: { main: { sets: 4, repsMin: 5, repsMax: 6, restSec: 180 }, accessory: { sets: 3, repsMin: 8, repsMax: 12, restSec: 90 } },
  fitness: { main: { sets: 3, repsMin: 12, repsMax: 15, restSec: 60 }, accessory: { sets: 2, repsMin: 15, repsMax: 20, restSec: 45 } },
};

const CORE_SECONDS: Record<Experience, number> = { beginner: 25, intermediate: 40, advanced: 50 };

export function prescribe(ex: Exercise, slotIndex: number, profile: Pick<Profile, 'goal' | 'experience'>): Omit<PlannedExercise, 'uid' | 'exerciseId'> {
  const isMain = slotIndex < 2 && !!ex.compound;
  const base = { ...(isMain ? PRESCRIPTIONS[profile.goal].main : PRESCRIPTIONS[profile.goal].accessory) };

  if (profile.experience === 'beginner') {
    // Débutante : volume plus faible et charges modérées pour apprendre la technique.
    base.sets = Math.min(base.sets, isMain ? 3 : 2);
    if (profile.goal === 'strength') {
      base.repsMin = Math.max(base.repsMin, 8);
      base.repsMax = Math.max(base.repsMax, 10);
    }
  } else if (profile.experience === 'advanced' && isMain) {
    base.sets = Math.min(base.sets + 1, 5);
  }

  // Exercices sans charge : on vise plus de répétitions.
  if (!ex.loadable && !ex.timed && base.repsMax < 12) {
    base.repsMin = 10;
    base.repsMax = 15;
  }

  if (ex.timed) {
    const seconds = ex.pattern === 'conditioning' ? 30 : CORE_SECONDS[profile.experience];
    return {
      sets: profile.experience === 'beginner' ? 2 : 3,
      repsMin: 0,
      repsMax: 0,
      seconds,
      restSec: ex.pattern === 'conditioning' ? 30 : 45,
      note: ex.unilateral ? 'par côté' : undefined,
    };
  }

  return { ...base, note: ex.unilateral ? 'par côté' : undefined };
}

/** Durée estimée d'un exercice en minutes (séries + repos + mise en place). */
export function estimateExerciseMinutes(p: Pick<PlannedExercise, 'sets' | 'repsMax' | 'seconds' | 'restSec' | 'note'>): number {
  const work = p.seconds ?? p.repsMax * 3.5;
  const sides = p.note === 'par côté' ? 2 : 1;
  return (p.sets * (work * sides + p.restSec) + 60) / 60;
}

export function estimateSessionMinutes(session: SessionTemplate): number {
  const warmup = session.warmup.length ? 7 : 0;
  const finisher = session.finisher ? 8 : 0;
  return Math.round(warmup + finisher + session.exercises.reduce((s, p) => s + estimateExerciseMinutes(p), 0));
}

// ---------------------------------------------------------------------------
// Découpage (split) de la semaine
// ---------------------------------------------------------------------------

interface SessionBlueprint {
  key: string;
  name: string;
  description: string;
  slots: Pattern[];
  kind: 'full' | 'lower' | 'upper' | 'metabolic';
}

const FULL_A: SessionBlueprint = {
  key: 'full_a', name: 'Full body A', kind: 'full', description: 'Tout le corps : squat, poussée, charnière, tirage',
  slots: ['squat', 'push_h', 'hinge', 'pull_h', 'glute', 'core', 'shoulders_iso', 'lunge', 'arms_bi'],
};
const FULL_B: SessionBlueprint = {
  key: 'full_b', name: 'Full body B', kind: 'full', description: 'Tout le corps : fentes, tirage vertical, fessiers',
  slots: ['lunge', 'pull_v', 'glute', 'push_v', 'hinge', 'core', 'arms_tri', 'calves', 'core'],
};
const FULL_C: SessionBlueprint = {
  key: 'full_c', name: 'Full body C', kind: 'full', description: 'Tout le corps : charnière, poussée, unilatéral',
  slots: ['hinge', 'push_h', 'lunge', 'pull_h', 'squat', 'core', 'glute', 'shoulders_iso', 'arms_tri'],
};
const LOWER_A: SessionBlueprint = {
  key: 'lower_a', name: 'Bas du corps A', kind: 'lower', description: 'Quadriceps & fessiers',
  slots: ['squat', 'hinge', 'lunge', 'glute', 'core', 'calves', 'glute'],
};
const LOWER_B: SessionBlueprint = {
  key: 'lower_b', name: 'Bas du corps B', kind: 'lower', description: 'Fessiers & ischio-jambiers',
  slots: ['glute', 'lunge', 'hinge', 'squat', 'glute', 'core', 'core'],
};
const UPPER_A: SessionBlueprint = {
  key: 'upper_a', name: 'Haut du corps A', kind: 'upper', description: 'Poitrine, dos, épaules',
  slots: ['push_h', 'pull_h', 'push_v', 'pull_v', 'shoulders_iso', 'core', 'arms_bi', 'arms_tri'],
};
const UPPER_B: SessionBlueprint = {
  key: 'upper_b', name: 'Haut du corps B', kind: 'upper', description: 'Dos, épaules, bras',
  slots: ['pull_v', 'push_h', 'pull_h', 'shoulders_iso', 'push_v', 'core', 'arms_tri', 'arms_bi'],
};
const PUSH: SessionBlueprint = {
  key: 'push', name: 'Poussée', kind: 'upper', description: 'Pectoraux, épaules, triceps',
  slots: ['push_h', 'push_v', 'push_h', 'shoulders_iso', 'arms_tri', 'core', 'core'],
};
const PULL: SessionBlueprint = {
  key: 'pull', name: 'Tirage', kind: 'upper', description: 'Dos, biceps, arrière d\'épaules',
  slots: ['pull_v', 'pull_h', 'pull_h', 'shoulders_iso', 'arms_bi', 'core', 'hinge'],
};
const LEGS: SessionBlueprint = {
  key: 'legs', name: 'Jambes & fessiers', kind: 'lower', description: 'Squat, charnière, fentes, fessiers',
  slots: ['squat', 'hinge', 'lunge', 'glute', 'calves', 'core', 'glute'],
};
const METABOLIC: SessionBlueprint = {
  key: 'metabolic', name: 'Full body cardio', kind: 'metabolic', description: 'Circuit tout le corps pour le cardio',
  slots: ['squat', 'push_h', 'conditioning', 'glute', 'pull_h', 'conditioning', 'core', 'lunge'],
};
const GLUTE_DAY: SessionBlueprint = {
  key: 'glutes', name: 'Fessiers & gainage', kind: 'lower', description: 'Séance spéciale fessiers',
  slots: ['glute', 'hinge', 'glute', 'lunge', 'core', 'glute', 'core'],
};

function chooseSplit(profile: Profile): { label: string; blueprints: SessionBlueprint[]; why: string } {
  const n = Math.max(1, Math.min(6, profile.trainingDays.length));
  if (n <= 3) {
    return {
      label: n === 1 ? 'Full body (1 séance)' : `Full body (${n} séances)`,
      blueprints: [FULL_A, FULL_B, FULL_C].slice(0, n),
      why: 'Avec 1 à 3 séances par semaine, travailler tout le corps à chaque séance permet de solliciter chaque muscle 2 à 3 fois par semaine — la fréquence recommandée pour débuter (ACSM, 2009).',
    };
  }
  if (n === 4) {
    return {
      label: 'Haut / Bas (4 séances)',
      blueprints: [LOWER_A, UPPER_A, LOWER_B, UPPER_B],
      why: 'Avec 4 séances, alterner haut et bas du corps permet de travailler chaque groupe musculaire 2 fois par semaine avec une bonne récupération.',
    };
  }
  if (n === 5) {
    const fifth = profile.focus === 'glutes_legs' ? GLUTE_DAY : METABOLIC;
    return {
      label: 'Haut / Bas + séance bonus (5 séances)',
      blueprints: [LOWER_A, UPPER_A, LOWER_B, UPPER_B, fifth],
      why: `4 séances haut/bas pour la force et la tonicité, plus une séance « ${fifth.name} » adaptée à ton objectif.`,
    };
  }
  return {
    label: 'Poussée / Tirage / Jambes ×2 (6 séances)',
    blueprints: [PUSH, PULL, LEGS, { ...PUSH, key: 'push2', name: 'Poussée B' }, { ...PULL, key: 'pull2', name: 'Tirage B' }, { ...LEGS, key: 'legs2', name: 'Jambes & fessiers B', slots: LOWER_B.slots }],
    why: 'Avec 6 séances, la répartition poussée / tirage / jambes répartit la charge de travail pour garder une bonne récupération entre deux séances du même groupe musculaire.',
  };
}

/** Applique la zone prioritaire choisie : on insère des exercices ciblés tôt dans la séance. */
function applyFocus(slots: Pattern[], blueprint: SessionBlueprint, focus: Profile['focus']): Pattern[] {
  const s = [...slots];
  if (focus === 'glutes_legs' && blueprint.kind !== 'upper') s.splice(2, 0, 'glute');
  if (focus === 'upper_body' && blueprint.kind === 'full') s.splice(2, 0, 'pull_h', 'shoulders_iso');
  if (focus === 'core') s.splice(3, 0, 'core');
  return s;
}

/** Si aucun exercice ne correspond à un schéma (ex. tirage vertical sans matériel), on se replie sur un schéma proche. */
const FALLBACK: Partial<Record<Pattern, Pattern[]>> = {
  pull_v: ['pull_h', 'shoulders_iso'],
  pull_h: ['shoulders_iso', 'hinge'],
  push_v: ['push_h', 'shoulders_iso'],
  shoulders_iso: ['pull_h', 'push_v'],
  arms_bi: ['pull_h'],
  arms_tri: ['push_h'],
  hinge: ['glute'],
  calves: ['glute'],
  conditioning: ['squat'],
};

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

interface PickContext {
  pool: Exercise[];
  maxLevel: 1 | 2 | 3;
  usedInProgram: Map<string, number>;
  usedInSession: Set<string>;
  focus: Profile['focus'];
  hasEquipment: boolean;
  seed: number;
}

function pickExercise(pattern: Pattern, slotIndex: number, ctx: PickContext, depth = 0): Exercise | undefined {
  let candidates = ctx.pool.filter((e) => e.pattern === pattern && !ctx.usedInSession.has(e.id) && e.level <= ctx.maxLevel);
  if (!candidates.length) {
    candidates = ctx.pool.filter((e) => e.pattern === pattern && !ctx.usedInSession.has(e.id) && e.level <= ctx.maxLevel + 1);
  }
  if (!candidates.length) {
    if (depth > 1) return undefined;
    for (const fb of FALLBACK[pattern] ?? []) {
      const found = pickExercise(fb, slotIndex, ctx, depth + 1);
      if (found) return found;
    }
    return undefined;
  }

  const score = (e: Exercise) => {
    let s = 0;
    if (slotIndex < 2 && e.compound) s += 3;
    if (e.level === ctx.maxLevel) s += 1.5;
    else if (e.level === ctx.maxLevel - 1) s += 1;
    if (ctx.hasEquipment && e.loadable) s += 1.5;
    if (ctx.focus === 'glutes_legs' && e.muscles.includes('fessiers')) s += 1;
    if (ctx.focus === 'upper_body' && (e.muscles.includes('dos') || e.muscles.includes('epaules'))) s += 1;
    s -= (ctx.usedInProgram.get(e.id) ?? 0) * 3;
    s += (hash(e.id + ':' + ctx.seed) % 100) / 100; // départage déterministe, varie avec la graine
    return s;
  };
  return candidates.reduce((best, e) => (score(e) > score(best) ? e : best));
}

function warmupFor(kind: SessionBlueprint['kind'], profile: Profile): string[] {
  const lowImpact = profile.limitations.includes('no_jumping') || profile.limitations.includes('knees');
  const cardio = lowImpact ? '3 min de cardio léger : marche rapide sur place, jacks sans saut' : '3 min de cardio léger : jumping jacks, montées de genoux';
  const mobility =
    kind === 'upper'
      ? 'Mobilité : rotations d\'épaules, chat-vache, ouvertures thoraciques (2 min)'
      : kind === 'lower'
        ? 'Mobilité : cercles de hanches, balancés de jambes, squats lents (2 min)'
        : 'Mobilité : cercles de hanches, rotations d\'épaules, chat-vache (2 min)';
  return [cardio, mobility, '1 à 2 séries légères du premier exercice'];
}

function finisherFor(profile: Profile, pool: Exercise[]): string | undefined {
  if (profile.goal !== 'lose_fat' && profile.goal !== 'fitness' && profile.goal !== 'tone') return undefined;
  if (profile.sessionMinutes < 30) return undefined;
  const cond = pool.filter((e) => e.pattern === 'conditioning' && e.level <= MAX_LEVEL[profile.experience] + (profile.experience === 'beginner' ? 0 : 1));
  if (!cond.length) return undefined;
  const names = cond.slice(0, 4).map((e) => e.name.toLowerCase());
  return `Finisher cardio (optionnel, ~8 min) : 30 s d'effort / 30 s de récupération en alternant ${names.join(', ')}.`;
}

function cardioAdvice(profile: Profile): string {
  const kind: Record<Profile['cardio'], string> = {
    none: 'de la marche active',
    walking: 'de la marche rapide',
    running: 'de la course à pied (en alternant marche/course au début)',
    cycling: 'du vélo',
    hiit: 'des intervalles (HIIT) au maximum 2 fois par semaine, le reste en intensité modérée',
    swimming: 'de la natation',
  };
  const restDays = 7 - profile.trainingDays.length;
  const target = profile.goal === 'lose_fat' ? '150 à 300' : '150';
  return `L'OMS (2020) recommande au moins 150 à 300 minutes d'activité d'endurance modérée par semaine, en plus du renforcement musculaire. Objectif proposé : ${target} min / semaine, par exemple ${kind[profile.cardio]}${restDays > 0 ? ` sur tes ${restDays} jour(s) sans séance` : ''}. La marche du quotidien compte aussi !`;
}

// ---------------------------------------------------------------------------
// Génération
// ---------------------------------------------------------------------------

/** Nombre d'exercices pour tenir dans la durée souhaitée (échauffement ~7 min inclus). */
function fillSession(
  blueprint: SessionBlueprint,
  profile: Profile,
  ctx: PickContext,
): PlannedExercise[] {
  const budget = profile.sessionMinutes - 7 - (finisherFor(profile, ctx.pool) ? 8 : 0);
  const slots = applyFocus(blueprint.slots, blueprint, profile.focus);
  const result: PlannedExercise[] = [];
  let used = 0;
  ctx.usedInSession = new Set();

  for (let i = 0; i < slots.length; i++) {
    const ex = pickExercise(slots[i], result.length, ctx);
    if (!ex) continue;
    const p: PlannedExercise = { uid: uid(), exerciseId: ex.id, ...prescribe(ex, result.length, profile) };
    if (blueprint.kind === 'metabolic') {
      // Circuit : repos courts
      p.restSec = Math.min(p.restSec, 45);
    }
    const minutes = estimateExerciseMinutes(p);
    if (result.length >= 3 && used + minutes > budget) break;
    result.push(p);
    used += minutes;
    ctx.usedInSession.add(ex.id);
    ctx.usedInProgram.set(ex.id, (ctx.usedInProgram.get(ex.id) ?? 0) + 1);
  }
  return fitToBudget(result, budget);
}

/** Séance trop longue (ex. 30 min en force) : on raccourcit d'abord les repos (45 s minimum), puis on retire des séries (2 minimum). */
function fitToBudget(list: PlannedExercise[], budget: number): PlannedExercise[] {
  const total = () => list.reduce((s, p) => s + estimateExerciseMinutes(p), 0);
  let guard = 0;
  while (total() > budget && guard++ < 50) {
    const longRest = list.filter((p) => p.restSec > 45).sort((a, b) => b.restSec - a.restSec)[0];
    if (longRest) {
      longRest.restSec -= 15;
      continue;
    }
    const manySets = list.filter((p) => p.sets > 2).sort((a, b) => b.sets - a.sets)[0];
    if (manySets) {
      manySets.sets -= 1;
      continue;
    }
    break;
  }
  return list;
}

export function generateProgram(profile: Profile, seed = 0, now = new Date()): Program {
  const pool = availableExercises(profile);
  const split = chooseSplit(profile);
  const ctx: PickContext = {
    pool,
    maxLevel: MAX_LEVEL[profile.experience],
    usedInProgram: new Map(),
    usedInSession: new Set(),
    focus: profile.focus,
    hasEquipment: profile.equipment.some((e) => e !== 'bodyweight'),
    seed,
  };

  const finisher = finisherFor(profile, pool);
  const sessions: SessionTemplate[] = split.blueprints.map((bp) => ({
    id: uid(),
    name: bp.name,
    description: bp.description,
    warmup: warmupFor(bp.kind, profile),
    exercises: fillSession(bp, profile, ctx),
    finisher: bp.kind === 'metabolic' ? undefined : finisher,
  }));

  const days = [...profile.trainingDays].sort((a, b) => a - b);
  const schedule = days.map((weekday, i) => ({ weekday, sessionId: sessions[i % sessions.length].id }));

  const rationale = [split.why];
  const p = PRESCRIPTIONS[profile.goal];
  rationale.push(
    `Objectif « ${GOAL_LABELS[profile.goal]} » : exercices principaux en ${p.main.repsMin}-${p.main.repsMax} répétitions, exercices complémentaires en ${p.accessory.repsMin}-${p.accessory.repsMax}.`,
  );
  rationale.push(
    'Progression : quand tu réussis le haut de la fourchette de répétitions sur toutes les séries, augmente légèrement la charge (ou passe à une variante plus difficile). L\'application te le suggère automatiquement.',
  );
  rationale.push('Cycle de 4 semaines : la 4e semaine est allégée (une série de moins) pour bien récupérer avant le cycle suivant.');
  if (profile.limitations.length) {
    rationale.push('Les exercices déconseillés pour tes zones sensibles ont été écartés. En cas de douleur, arrête l\'exercice et demande conseil à un professionnel de santé.');
  }
  const eq = expandEquipment(profile.equipment);
  if (!eq.has('bands') && !eq.has('dumbbells') && !eq.has('pullup_bar')) {
    rationale.push('Conseil matériel : sans matériel, le dos est difficile à travailler. Un simple jeu d\'élastiques permet d\'ajouter des exercices de tirage.');
  }

  return {
    id: uid(),
    name: `Programme ${GOAL_LABELS[profile.goal].toLowerCase()}`,
    createdAt: now.toISOString(),
    splitLabel: split.label,
    rationale,
    sessions,
    schedule,
    cardioAdvice: cardioAdvice(profile),
    cycleWeeks: 4,
  };
}

export const GOAL_LABELS: Record<Goal, string> = {
  lose_fat: 'Perte de poids',
  tone: 'Tonifier / raffermir',
  build_muscle: 'Prise de muscle',
  strength: 'Force',
  fitness: 'Forme & endurance',
};

// ---------------------------------------------------------------------------
// Progression
// ---------------------------------------------------------------------------

/** Semaine du cycle (1..cycleWeeks) depuis la création du programme. */
export function cycleWeek(program: Pick<Program, 'createdAt' | 'cycleWeeks'>, now = new Date()): number {
  const start = new Date(program.createdAt);
  const days = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return (Math.floor(Math.max(0, days) / 7) % program.cycleWeeks) + 1;
}

/** Ajuste la prescription selon la semaine du cycle : semaine 3 un peu plus de volume, dernière semaine allégée. */
export function adjustForWeek(p: PlannedExercise, week: number, cycleWeeks: number): PlannedExercise {
  if (week === cycleWeeks) return { ...p, sets: Math.max(1, p.sets - 1) };
  if (week === 3) {
    const ex = getExercise(p.exerciseId);
    if (ex?.compound) return { ...p, sets: Math.min(p.sets + 1, 5) };
  }
  return p;
}

export interface LoadSuggestion {
  weight: number;
  message: string;
  lastDate?: string;
}

/** Retrouve la dernière performance sur un exercice. */
export function lastPerformance(exerciseId: string, workouts: WorkoutLog[]) {
  const sorted = [...workouts].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  for (const w of sorted) {
    const ex = w.exercises.find((e) => e.exerciseId === exerciseId && e.sets.some((s) => s.done));
    if (ex) return { date: w.date, sets: ex.sets.filter((s) => s.done) };
  }
  return undefined;
}

/**
 * Double progression : si toutes les séries ont atteint le haut de la fourchette,
 * on augmente la charge d'environ 5 % (minimum 1 kg) ; sinon on garde la charge et on vise plus de répétitions.
 */
export function suggestLoad(planned: PlannedExercise, workouts: WorkoutLog[]): LoadSuggestion {
  const ex = getExercise(planned.exerciseId);
  const last = lastPerformance(planned.exerciseId, workouts);
  if (!last) {
    return {
      weight: 0,
      message: ex?.loadable ? 'Première fois : choisis une charge qui te laisse 2-3 répétitions en réserve.' : 'Première fois : concentre-toi sur la technique.',
    };
  }
  const maxWeight = Math.max(...last.sets.map((s) => s.weight));
  if (planned.seconds) {
    const allHeld = last.sets.every((s) => (s.seconds ?? 0) >= (planned.seconds ?? 0));
    return {
      weight: maxWeight,
      lastDate: last.date,
      message: allHeld ? 'Tu as tenu toutes les séries : ajoute 5 à 10 secondes.' : 'Objectif : tenir toute la durée sur chaque série.',
    };
  }
  const topSets = last.sets.filter((s) => s.weight === maxWeight);
  const allTop = last.sets.length >= planned.sets && topSets.every((s) => s.reps >= planned.repsMax);
  const struggled = topSets.filter((s) => s.reps < planned.repsMin).length >= Math.ceil(topSets.length / 2);

  if (allTop) {
    if (maxWeight > 0) {
      const next = Math.round((maxWeight + Math.max(1, maxWeight * 0.05)) * 2) / 2;
      return { weight: next, lastDate: last.date, message: `Bravo ! Tu as atteint ${planned.repsMax} rép. partout : passe à ${next} kg.` };
    }
    return { weight: 0, lastDate: last.date, message: 'Tu as atteint le haut de la fourchette : ajoute du lest, ralentis la descente ou choisis une variante plus difficile.' };
  }
  if (struggled && maxWeight > 0) {
    return { weight: maxWeight, lastDate: last.date, message: 'Dernière fois c\'était dur : garde la même charge (ou baisse un peu) et soigne la technique.' };
  }
  return { weight: maxWeight, lastDate: last.date, message: 'Garde la même charge et essaie de faire 1 répétition de plus par série.' };
}
