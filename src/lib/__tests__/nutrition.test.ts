import { describe, expect, it } from 'vitest';
import { bmrMifflin, computeTargets, macrosFor, sumEntries } from '../nutrition';
import type { Profile } from '../../types';

const base: Profile = {
  name: 'Test', sex: 'female', birthYear: 1996, heightCm: 165, weightKg: 60, activity: 'light',
  goal: 'tone', experience: 'beginner', trainingDays: [0, 2, 4], sessionMinutes: 45,
  equipment: ['bodyweight'], limitations: [], focus: 'balanced', cardio: 'walking', diet: 'omnivore',
  createdAt: '2026-01-01T00:00:00.000Z',
};
const now = new Date('2026-06-01');

describe('Mifflin-St Jeor', () => {
  it('calcule le métabolisme de base femme', () => {
    // 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161
    expect(bmrMifflin('female', 60, 165, 30)).toBeCloseTo(1320.25);
  });
  it('ajoute 166 kcal pour un homme à mesures égales', () => {
    expect(bmrMifflin('male', 60, 165, 30) - bmrMifflin('female', 60, 165, 30)).toBe(166);
  });
});

describe('computeTargets', () => {
  it('applique le facteur d\'activité et l\'objectif', () => {
    const t = computeTargets(base, 60, now);
    // 1320.25 * 1.375 * 0.9 = 1633.8 -> arrondi à la dizaine
    expect(t.kcal).toBe(1630);
    expect(t.protein).toBe(96); // 1.6 g/kg
    expect(t.fat).toBe(Math.round((1630 * 0.3) / 9));
    expect(t.protein * 4 + t.carbs * 4 + t.fat * 9).toBeGreaterThan(1600);
    expect(t.protein * 4 + t.carbs * 4 + t.fat * 9).toBeLessThan(1660);
  });
  it('ne descend pas sous le plancher de sécurité', () => {
    const t = computeTargets({ ...base, weightKg: 45, heightCm: 150, activity: 'sedentary', goal: 'lose_fat', birthYear: 1960 }, 45, now);
    expect(t.kcal).toBe(1200);
  });
});

describe('macros', () => {
  it('calcule au prorata des grammes', () => {
    const food = { id: 'x', name: 'x', kcal: 200, protein: 10, carbs: 20, fat: 5, source: 'custom' as const };
    expect(macrosFor(food, 50).kcal).toBe(100);
    expect(sumEntries([{ food, grams: 50 }, { food, grams: 150 }]).protein).toBe(20);
  });
});
