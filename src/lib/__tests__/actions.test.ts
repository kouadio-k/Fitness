import { describe, expect, it } from 'vitest';
import { buildActiveWorkout, finishWorkout, personalRecords, weekStreak } from '../actions';
import { generateProgram } from '../generator';
import { EMPTY_STATE, normalizeState } from '../../store';
import type { AppState, Profile, WorkoutLog } from '../../types';

const profile: Profile = {
  name: 'Test', sex: 'female', birthYear: 1996, heightCm: 165, weightKg: 60, activity: 'light',
  goal: 'tone', experience: 'beginner', trainingDays: [0, 2, 4], sessionMinutes: 45,
  equipment: ['dumbbells'], limitations: [], focus: 'balanced', cardio: 'walking', diet: 'omnivore',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const log = (date: string): WorkoutLog => ({
  id: date, sessionId: 's', sessionName: 'A', date, startedAt: date + 'T10:00:00Z', durationMin: 40,
  exercises: [{ exerciseId: 'goblet-squat', sets: [{ reps: 10, weight: 12, done: true }, { reps: 12, weight: 10, done: true }] }],
});

describe('séance en cours', () => {
  it('pré-remplit les séries puis enregistre seulement les séries validées', () => {
    const program = generateProgram(profile, 0, new Date('2026-01-01'));
    let state: AppState = { ...EMPTY_STATE, profile, program };
    const session = program.sessions[0];
    state = { ...state, activeWorkout: buildActiveWorkout(state, session, new Date('2026-01-02T10:00:00')) };
    expect(state.activeWorkout!.exercises).toHaveLength(session.exercises.length);
    const a = state.activeWorkout!;
    a.exercises[0].sets[0].done = true;
    state = finishWorkout(state, { rpe: 6 }, new Date('2026-01-02T10:42:00'));
    expect(state.activeWorkout).toBeNull();
    expect(state.workouts).toHaveLength(1);
    expect(state.workouts[0].durationMin).toBe(42);
    expect(state.workouts[0].exercises).toHaveLength(1);
    expect(state.workouts[0].exercises[0].sets).toHaveLength(1);
  });
});

describe('statistiques', () => {
  it('compte les semaines consécutives', () => {
    // 2026-01-05 est un lundi
    const ws = [log('2026-01-06'), log('2026-01-13'), log('2026-01-21')];
    expect(weekStreak(ws, '2026-01-22')).toBe(3);
    expect(weekStreak(ws, '2026-01-27')).toBe(3); // semaine en cours pas encore faite
    expect(weekStreak(ws, '2026-02-04')).toBe(0);
  });
  it('trouve les records (1RM estimé)', () => {
    const prs = personalRecords([log('2026-01-06')]);
    expect(prs[0].weight).toBe(12);
    expect(prs[0].est1RM).toBeCloseTo(16);
  });
  it('complète un état importé incomplet', () => {
    const s = normalizeState({ profile });
    expect(s.workouts).toEqual([]);
    expect(s.water).toEqual({});
  });
});
