import { describe, expect, it } from 'vitest';
import { EXERCISES } from '../../data/exercises';
import { EXERCISE_SCENES } from '../../data/exercisePoses';
import { EQUIP, lowestY, scene, sceneBounds } from '../mannequin/core';
import { MAX_PRIMS } from '../mannequin/render';

describe('démos 3D (vue 360°)', () => {
  it('chaque exercice a un mannequin 3D, et aucune scène ne vise un exercice inconnu', () => {
    const ids = EXERCISES.map((e) => e.id);
    expect(ids.filter((id) => !EXERCISE_SCENES[id])).toEqual([]);
    expect(Object.keys(EXERCISE_SCENES).filter((id) => !ids.includes(id))).toEqual([]);
  });

  for (const [id, ex] of Object.entries(EXERCISE_SCENES)) {
    it(`${id} : positions valides, corps au-dessus du sol`, () => {
      const n = ex.keys.length;
      expect(n).toBeGreaterThanOrEqual(2);
      for (const list of [ex.labels, ex.holds, ex.moves]) if (list) expect(list.length).toBe(n);
      for (let k = 0; k < n; k++) {
        for (const t of [0, 0.5]) {
          const { prims } = scene(ex, k + t);
          expect(prims.length).toBeLessThanOrEqual(MAX_PRIMS);
          for (const p of prims) for (const v of [...p.a, ...p.b, p.ra, p.rb]) expect(Number.isFinite(v)).toBe(true);
          // Contact au sol toléré (quelques centimètres d'écrasement), pas de membre enfoncé dans le sol.
          expect(lowestY(prims.filter((p) => p.g !== EQUIP))).toBeGreaterThan(-0.05);
        }
      }
      const b = sceneBounds(ex);
      expect(b.r).toBeGreaterThan(0.3);
      expect(b.r).toBeLessThan(2.5);
    });
  }
});
