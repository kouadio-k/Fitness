import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEMO_FILES, demoFor } from '../../data/exerciseDemos';
import { EXERCISES, EXERCISE_BY_ID } from '../../data/exercises';

describe('démos dessinées', () => {
  it('ne référence que des exercices existants et des dessins présents', () => {
    for (const [exerciseId, files] of Object.entries(DEMO_FILES)) {
      expect(EXERCISE_BY_ID[exerciseId], exerciseId).toBeDefined();
      for (const f of files) expect(existsSync(`public/demos/${f}`), f).toBe(true);
    }
  });
  it('fournit les deux positions', () => {
    const d = demoFor('glute-bridge')!;
    expect(d.images[0]).toMatch(/demos\/\d{4}-1\.png$/);
    expect(d.images[1]).toMatch(/demos\/\d{4}-2\.png$/);
    expect(d.credit).toContain('Everkinetic');
  });
  it('fournit un seul dessin pour un exercice tenu, avec le crédit de sa source', () => {
    const d = demoFor('plank')!;
    expect(d.images).toHaveLength(1);
    expect(d.images[0]).toMatch(/demos\/wg-plank-1\.png$/);
    expect(d.credit).toContain('Workout Guide');
  });
  it('a un dessin pour tous les exercices sauf ceux sans source libre', () => {
    const without = EXERCISES.filter((e) => !demoFor(e.id)).map((e) => e.id);
    expect(without.sort()).toEqual(['band-chest-press', 'shadow-boxing']);
  });
});
