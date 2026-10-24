import { describe, expect, it } from 'vitest';
import { adjustForWeek, cycleWeek, estimateSessionMinutes, generateProgram, suggestLoad } from '../generator';
import { getExercise } from '../../data/exercises';
import type { Equipment, Experience, Goal, Limitation, Profile, Weekday, WorkoutLog } from '../../types';

const base: Profile = {
  name: 'Test', sex: 'female', birthYear: 1996, heightCm: 165, weightKg: 60, activity: 'light',
  goal: 'tone', experience: 'beginner', trainingDays: [0, 2, 4], sessionMinutes: 45,
  equipment: ['bodyweight'], limitations: [], focus: 'balanced', cardio: 'walking', diet: 'omnivore',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const equipments: Equipment[][] = [['bodyweight'], ['dumbbells'], ['bands'], ['gym'], ['dumbbells', 'bands', 'bench', 'pullup_bar', 'kettlebell']];
const goals: Goal[] = ['lose_fat', 'tone', 'build_muscle', 'strength', 'fitness'];
const levels: Experience[] = ['beginner', 'intermediate', 'advanced'];
const dayCounts: Weekday[][] = [[2], [0, 3], [0, 2, 4], [0, 1, 3, 4], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4, 5]];

describe('generateProgram', () => {
  it('génère des séances valides pour toutes les combinaisons', () => {
    for (const equipment of equipments)
      for (const goal of goals)
        for (const experience of levels)
          for (const trainingDays of dayCounts)
            for (const sessionMinutes of [20, 30, 45, 60, 75]) {
              const p = generateProgram({ ...base, equipment, goal, experience, trainingDays, sessionMinutes });
              expect(p.schedule).toHaveLength(trainingDays.length);
              for (const s of p.sessions) {
                expect(s.exercises.length).toBeGreaterThanOrEqual(3);
                const ids = s.exercises.map((e) => e.exerciseId);
                expect(new Set(ids).size).toBe(ids.length); // pas de doublon dans une séance
                for (const pe of s.exercises) {
                  const ex = getExercise(pe.exerciseId)!;
                  expect(ex).toBeDefined();
                  expect(pe.sets).toBeGreaterThan(0);
                }
                // reste raisonnablement dans la durée demandée
                expect(estimateSessionMinutes(s)).toBeLessThanOrEqual(sessionMinutes + 12);
              }
            }
  });

  it('respecte le matériel disponible', () => {
    const p = generateProgram({ ...base, equipment: ['bodyweight'] });
    for (const s of p.sessions) for (const pe of s.exercises) expect(getExercise(pe.exerciseId)!.equipment).toEqual([]);
  });

  it('écarte les exercices déconseillés', () => {
    const limitations: Limitation[] = ['knees', 'no_jumping', 'lower_back', 'wrists', 'shoulders'];
    const p = generateProgram({ ...base, equipment: ['gym'], limitations, goal: 'lose_fat' });
    for (const s of p.sessions)
      for (const pe of s.exercises) {
        const ex = getExercise(pe.exerciseId)!;
        expect(ex.avoidIf.filter((l) => limitations.includes(l))).toEqual([]);
      }
  });

  it('choisit le découpage selon le nombre de jours', () => {
    expect(generateProgram({ ...base, trainingDays: [0, 2, 4] }).sessions.map((s) => s.name)).toEqual(['Full body A', 'Full body B', 'Full body C']);
    expect(generateProgram({ ...base, trainingDays: [0, 1, 3, 4] }).sessions).toHaveLength(4);
  });

  it('est déterministe pour une même graine et varie avec une autre', () => {
    const profile = { ...base, equipment: ['gym'] as Equipment[] };
    const ids = (seed: number) => generateProgram(profile, seed).sessions.flatMap((s) => s.exercises.map((e) => e.exerciseId)).join();
    expect(ids(1)).toBe(ids(1));
    const variants = new Set([1, 2, 3, 4, 5].map(ids));
    expect(variants.size).toBeGreaterThan(1);
  });
});

describe('progression', () => {
  it('allège la dernière semaine du cycle', () => {
    const pe = { uid: 'a', exerciseId: 'goblet-squat', sets: 3, repsMin: 10, repsMax: 12, restSec: 60 };
    expect(adjustForWeek(pe, 4, 4).sets).toBe(2);
    expect(adjustForWeek(pe, 3, 4).sets).toBe(4);
    expect(adjustForWeek(pe, 1, 4).sets).toBe(3);
  });

  it('calcule la semaine du cycle', () => {
    const program = { createdAt: '2026-01-01T00:00:00.000Z', cycleWeeks: 4 };
    expect(cycleWeek(program, new Date('2026-01-03'))).toBe(1);
    expect(cycleWeek(program, new Date('2026-01-23'))).toBe(4);
    expect(cycleWeek(program, new Date('2026-01-30'))).toBe(1);
  });

  it('suggère d\'augmenter la charge quand le haut de fourchette est atteint', () => {
    const pe = { uid: 'a', exerciseId: 'goblet-squat', sets: 3, repsMin: 10, repsMax: 12, restSec: 60 };
    const log: WorkoutLog = {
      id: 'w', sessionId: 's', sessionName: 'A', date: '2026-01-05', startedAt: '2026-01-05T10:00:00Z', durationMin: 40,
      exercises: [{ exerciseId: 'goblet-squat', sets: [1, 2, 3].map(() => ({ reps: 12, weight: 10, done: true })) }],
    };
    expect(suggestLoad(pe, [log]).weight).toBe(11);
    const hard = { ...log, exercises: [{ exerciseId: 'goblet-squat', sets: [1, 2, 3].map(() => ({ reps: 7, weight: 10, done: true })) }] };
    expect(suggestLoad(pe, [hard]).weight).toBe(10);
  });
});
