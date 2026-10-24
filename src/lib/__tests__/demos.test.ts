import { describe, expect, it } from 'vitest';
import { DEMO_EXERCISE_IDS, demoFor, videoSearchUrl } from '../../data/exerciseDemos';
import { EXERCISE_BY_ID } from '../../data/exercises';

describe('démos d\'exercices', () => {
  it('ne référence que des exercices existants', () => {
    for (const id of DEMO_EXERCISE_IDS) expect(EXERCISE_BY_ID[id], id).toBeDefined();
  });
  it('construit deux images figées sur une version du dépôt', () => {
    const d = demoFor('goblet-squat')!;
    expect(d.images[0]).toMatch(/^https:\/\/raw\.githubusercontent\.com\/yuhonas\/free-exercise-db\/[0-9a-f]{40}\/exercises\/Goblet_Squat\/0\.jpg$/);
    expect(d.images[1]).toMatch(/\/1\.jpg$/);
    expect(demoFor('inexistant')).toBeUndefined();
  });
  it('propose une recherche vidéo pour tous les exercices', () => {
    expect(videoSearchUrl('Squat sur chaise')).toBe('https://www.youtube.com/results?search_query=Squat%20sur%20chaise%20exercice%20technique');
  });
});
