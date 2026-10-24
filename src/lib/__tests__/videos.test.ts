import { describe, expect, it } from 'vitest';
import { VIDEO_CREATORS, videoQueryName, youtubeSearchUrl } from '../../data/exerciseVideos';

describe('liens vidéo', () => {
  it('retire la précision entre parenthèses', () => {
    expect(videoQueryName('Goblet squat (haltère)')).toBe('Goblet squat');
    expect(videoQueryName('Pompes inclinées (mains surélevées)')).toBe('Pompes inclinées');
    expect(videoQueryName('Pont fessier')).toBe('Pont fessier');
  });
  it('cible le créateur dans la recherche YouTube', () => {
    expect(youtubeSearchUrl('Hip thrust (haltère)', 'Juju Fitcats')).toBe('https://www.youtube.com/results?search_query=Juju%20Fitcats%20Hip%20thrust');
    expect(youtubeSearchUrl('Pont fessier')).toBe('https://www.youtube.com/results?search_query=Pont%20fessier%20exercice%20technique');
  });
  it('propose les quatre créateurs demandés', () => {
    expect(VIDEO_CREATORS.map((c) => c.name)).toEqual(['Nassim Sahili', 'Tibo InShape', 'Sissy Mua', 'Juju Fitcats']);
  });
});
