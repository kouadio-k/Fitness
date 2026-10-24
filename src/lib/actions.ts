import type { ActiveWorkout, AppState, SessionTemplate, WorkoutLog } from '../types';
import { adjustForWeek, cycleWeek, suggestLoad } from './generator';
import { addDays, startOfWeek, toISODate, weekdayOf } from './dates';
import { uid } from './id';

export function allSessions(state: AppState): SessionTemplate[] {
  return [...(state.program?.sessions ?? []), ...state.customSessions];
}

export function findSession(state: AppState, id: string): SessionTemplate | undefined {
  return allSessions(state).find((s) => s.id === id);
}

/** Séance prévue un jour donné selon le planning du programme. */
export function plannedSessionFor(state: AppState, date: string): SessionTemplate | undefined {
  const wd = weekdayOf(date);
  const slot = state.program?.schedule.find((d) => d.weekday === wd);
  return slot ? findSession(state, slot.sessionId) : undefined;
}

export function workoutsOn(state: AppState, date: string): WorkoutLog[] {
  return state.workouts.filter((w) => w.date === date);
}

/** Prépare une séance en cours : prescriptions ajustées à la semaine du cycle, charges pré-remplies. */
export function buildActiveWorkout(state: AppState, session: SessionTemplate, now = new Date()): ActiveWorkout {
  const week = state.program && !session.custom ? cycleWeek(state.program, now) : 1;
  const cycleWeeks = state.program?.cycleWeeks ?? 4;
  return {
    sessionId: session.id,
    startedAt: now.toISOString(),
    exercises: session.exercises.map((p0) => {
      const planned = session.custom ? p0 : adjustForWeek(p0, week, cycleWeeks);
      const suggestion = suggestLoad(planned, state.workouts);
      return {
        exerciseId: planned.exerciseId,
        planned,
        sets: Array.from({ length: planned.sets }, () => ({
          reps: planned.seconds ? 0 : planned.repsMax,
          seconds: planned.seconds,
          weight: suggestion.weight,
          done: false,
        })),
      };
    }),
  };
}

export function finishWorkout(state: AppState, extra: { rpe?: number; notes?: string }, now = new Date()): AppState {
  const a = state.activeWorkout;
  if (!a) return state;
  const session = findSession(state, a.sessionId);
  const started = new Date(a.startedAt);
  const log: WorkoutLog = {
    id: uid(),
    sessionId: a.sessionId,
    sessionName: session?.name ?? 'Séance',
    date: toISODate(started),
    startedAt: a.startedAt,
    durationMin: Math.max(1, Math.round((now.getTime() - started.getTime()) / 60000)),
    exercises: a.exercises
      .map((e) => ({ exerciseId: e.exerciseId, sets: e.sets.filter((s) => s.done) }))
      .filter((e) => e.sets.length > 0),
    rpe: extra.rpe,
    notes: extra.notes?.trim() || undefined,
  };
  return { ...state, activeWorkout: null, workouts: [...state.workouts, log] };
}

/** Volume total (kg × répétitions) d'une séance. */
export function workoutVolume(w: WorkoutLog): number {
  return w.exercises.reduce((s, e) => s + e.sets.reduce((t, x) => t + x.weight * x.reps, 0), 0);
}

/** Estimation du 1RM (formule d'Epley) — indicatif uniquement. */
export function epley1RM(weight: number, reps: number): number {
  return reps <= 1 ? weight : weight * (1 + reps / 30);
}

export interface PersonalRecord {
  exerciseId: string;
  weight: number;
  reps: number;
  date: string;
  est1RM: number;
}

export function personalRecords(workouts: WorkoutLog[]): PersonalRecord[] {
  const best = new Map<string, PersonalRecord>();
  for (const w of workouts)
    for (const e of w.exercises)
      for (const s of e.sets) {
        if (!s.done || s.weight <= 0 || s.reps <= 0) continue;
        const est = epley1RM(s.weight, s.reps);
        const cur = best.get(e.exerciseId);
        if (!cur || est > cur.est1RM) best.set(e.exerciseId, { exerciseId: e.exerciseId, weight: s.weight, reps: s.reps, date: w.date, est1RM: est });
      }
  return [...best.values()].sort((a, b) => b.est1RM - a.est1RM);
}

/** Nombre de semaines consécutives (jusqu'à la semaine en cours) avec au moins une séance. */
export function weekStreak(workouts: WorkoutLog[], today = toISODate()): number {
  const weeks = new Set(workouts.map((w) => startOfWeek(w.date)));
  let streak = 0;
  let cursor = startOfWeek(today);
  // La semaine en cours ne casse pas la série si elle n'a pas encore de séance.
  if (!weeks.has(cursor)) cursor = addDays(cursor, -7);
  while (weeks.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -7);
  }
  return streak;
}
