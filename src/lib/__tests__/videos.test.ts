import { describe, expect, it } from 'vitest';
import { videoLinksFor, videoQueryName } from '../../data/exerciseVideos';

describe('liens vidéo', () => {
  it('retire la précision entre parenthèses', () => {
    expect(videoQueryName('Goblet squat (haltère)')).toBe('Goblet squat');
    expect(videoQueryName('Pompes inclinées (mains surélevées)')).toBe('Pompes inclinées');
  });
  it('affiche des libellés neutres, sans nom de créatrice ou de créateur', () => {
    const links = videoLinksFor('Hip thrust (haltère)');
    expect(links.map((l) => l.label)).toEqual(['Vidéo 1', 'Vidéo 2', 'Vidéo 3', 'Vidéo 4', 'Vidéo 5']);
    for (const l of links) expect(l.url.startsWith('https://www.youtube.com/results?search_query=')).toBe(true);
  });
  it('privilégie des démonstrations par des femmes', () => {
    const urls = videoLinksFor('Pont fessier').map((l) => decodeURIComponent(l.url));
    expect(urls[2]).toContain('Pont fessier exercice femme');
  });
});
