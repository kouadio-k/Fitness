import { describe, expect, it } from 'vitest';
import { videoQueryName, videoSearchUrl } from '../../data/exerciseVideos';

describe('lien vidéo', () => {
  it('recherche uniquement le nom de l\'exercice', () => {
    expect(videoQueryName('Squat sur chaise')).toBe('Squat sur chaise');
    expect(videoQueryName('Goblet squat (haltère)')).toBe('Goblet squat haltère');
    expect(videoSearchUrl('Pont fessier')).toBe('https://www.youtube.com/results?search_query=Pont%20fessier');
  });
});
