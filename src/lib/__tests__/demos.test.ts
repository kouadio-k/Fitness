import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEMO_FILES, demoFor } from '../../data/exerciseDemos';
import { EXERCISE_BY_ID } from '../../data/exercises';

describe('démos dessinées', () => {
  it('ne référence que des exercices existants et des dessins présents', () => {
    for (const [exerciseId, file] of Object.entries(DEMO_FILES)) {
      expect(EXERCISE_BY_ID[exerciseId], exerciseId).toBeDefined();
      expect(existsSync(`public/demos/${file}-1.png`), `${file}-1.png`).toBe(true);
      expect(existsSync(`public/demos/${file}-2.png`), `${file}-2.png`).toBe(true);
    }
  });
  it('fournit les deux positions', () => {
    const d = demoFor('glute-bridge')!;
    expect(d.images[0]).toMatch(/demos\/\d{4}-1\.png$/);
    expect(d.images[1]).toMatch(/demos\/\d{4}-2\.png$/);
    expect(demoFor('wall-sit')).toBeUndefined();
  });
});
