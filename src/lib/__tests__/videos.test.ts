import { describe, expect, it } from 'vitest';
import { FEMALE_CREATORS, OTHER_CREATORS, videoQueryName, youtubeSearchUrl } from '../../data/exerciseVideos';

describe('liens vidéo', () => {
  it('retire la précision entre parenthèses', () => {
    expect(videoQueryName('Goblet squat (haltère)')).toBe('Goblet squat');
    expect(videoQueryName('Pompes inclinées (mains surélevées)')).toBe('Pompes inclinées');
  });
  it('cible la créatrice, ou des démonstrations par des femmes', () => {
    expect(youtubeSearchUrl('Hip thrust (haltère)', 'Juju Fitcats')).toBe('https://www.youtube.com/results?search_query=Juju%20Fitcats%20Hip%20thrust');
    expect(youtubeSearchUrl('Pont fessier')).toBe('https://www.youtube.com/results?search_query=Pont%20fessier%20exercice%20femme');
  });
  it('met les créatrices en premier et garde les autres coachs', () => {
    expect(FEMALE_CREATORS.map((c) => c.name)).toEqual(['Sissy Mua', 'Juju Fitcats']);
    expect(OTHER_CREATORS.map((c) => c.name)).toEqual(['Tibo InShape', 'Nassim Sahili']);
  });
});
