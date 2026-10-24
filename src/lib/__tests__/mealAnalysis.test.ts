import { describe, expect, it } from 'vitest';
import { ANALYSIS_SCHEMA, buildUserText, CRITERIA, itemToFood, normalizeAnalysis, scoreLabel, SYSTEM_PROMPT } from '../mealAnalysis';

const meta = { model: 'claude-opus-5-5', date: '2026-10-24', now: new Date('2026-10-24T12:00:00Z') };

describe('grille', () => {
  it('totalise 10 points', () => {
    expect(CRITERIA.reduce((s, c) => s + c.max, 0)).toBe(10);
  });
  it('le prompt contient chaque critère et le schéma les énumère', () => {
    for (const c of CRITERIA) expect(SYSTEM_PROMPT).toContain(c.id);
    expect(ANALYSIS_SCHEMA.properties.criteria.items.properties.id.enum).toEqual(CRITERIA.map((c) => c.id));
  });
});

describe('normalizeAnalysis', () => {
  const raw = {
    is_food: true,
    meal_name: 'Poulet, riz, brocoli',
    items: [
      { name: 'Blanc de poulet grillé', grams: 120, kcal: 198, protein: 37, carbs: 0, fat: 4.3, fiber: 0 },
      { name: 'Riz blanc', grams: 150, kcal: 195, protein: 4, carbs: 42, fat: 0.5, fiber: 0.6 },
      { name: '', grams: 10, kcal: 1, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    ],
    criteria: [
      { id: 'legumes_fruits', score: 2.6, comment: 'Brocoli présent mais un quart de l\'assiette.' },
      { id: 'proteines', score: 5, comment: 'Poulet en bonne quantité.' },
      { id: 'feculents_fibres', score: 1, comment: 'Riz blanc raffiné.' },
      { id: 'transformation', score: 1.5, comment: 'Fait maison.' },
      // gras_sucre_sel manquant
    ],
    strengths: ['Bonne source de protéines', ''],
    improvements: ['Riz complet'],
    confidence: 'bonne',
    caveats: 'Huile de cuisson non visible.',
    goal_comment: 'Bon repas pour ton objectif.',
  };

  it('borne les notes au maximum, arrondit au quart et recalcule le total', () => {
    const a = normalizeAnalysis(raw, meta);
    const by = Object.fromEntries(a.criteria.map((c) => [c.id, c.score]));
    expect(by.legumes_fruits).toBe(2.5);
    expect(by.proteines).toBe(2); // 5 ramené au max 2
    expect(by.gras_sucre_sel).toBe(0); // absent
    expect(a.score).toBe(7);
    expect(a.items).toHaveLength(2); // nom vide écarté
    expect(a.strengths).toEqual(['Bonne source de protéines']);
    expect(a.confidence).toBe('bonne');
  });

  it('met tout à zéro quand la photo ne montre pas de repas', () => {
    const a = normalizeAnalysis({ ...raw, is_food: false }, meta);
    expect(a.isFood).toBe(false);
    expect(a.score).toBe(0);
    expect(a.items).toEqual([]);
  });

  it('résiste à une réponse vide', () => {
    const a = normalizeAnalysis(null, meta);
    expect(a.score).toBe(0);
    expect(a.criteria).toHaveLength(5);
  });
});

describe('conversions', () => {
  it('ramène un aliment estimé à 100 g', () => {
    const f = itemToFood({ name: 'Riz', grams: 150, kcal: 195, protein: 4, carbs: 42, fat: 0.5, fiber: 0.6 });
    expect(f.kcal).toBe(130);
    expect(f.carbs).toBe(28);
    expect(f.source).toBe('ai');
  });
  it('décrit le contexte de la journée', () => {
    const t = buildUserText({
      goal: 'lose_fat', diet: 'vegetarian',
      targets: { kcal: 1700, protein: 100, carbs: 180, fat: 57, fiber: 30, waterMl: 2000 },
      consumed: { kcal: 420.4, protein: 21, carbs: 50, fat: 12, fiber: 6 },
    });
    expect(t).toContain('perte de poids');
    expect(t).toContain('végétarienne');
    expect(t).toContain('420 kcal');
  });
  it('libellés de note', () => {
    expect(scoreLabel(8).tone).toBe('success');
    expect(scoreLabel(6).tone).toBe('warning');
    expect(scoreLabel(3).tone).toBe('danger');
  });
});
