import { beforeEach, describe, expect, it } from 'vitest';
import { backupIsDue } from '../backup';
import { EMPTY_STATE } from '../../store';
import type { Profile } from '../../types';

const mem = new Map<string, string>();
beforeEach(() => {
  mem.clear();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
    clear: () => mem.clear(),
    key: () => null,
    length: 0,
  };
});

describe('rappel de sauvegarde', () => {
  const state = { ...EMPTY_STATE, profile: { name: 'L' } as Profile };
  it('rien à sauvegarder sans profil', () => {
    expect(backupIsDue(EMPTY_STATE)).toBe(false);
  });
  it('rappelle tant qu\'aucune copie n\'a été faite, puis après 7 jours', () => {
    expect(backupIsDue(state)).toBe(true);
    mem.set('fitness-coach-last-backup', '2026-10-01T10:00:00Z');
    expect(backupIsDue(state, new Date('2026-10-05T10:00:00Z'))).toBe(false);
    expect(backupIsDue(state, new Date('2026-10-09T10:00:00Z'))).toBe(true);
  });
});
