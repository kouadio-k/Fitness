import { describe, expect, it } from 'vitest';
import { escapeText, firstOccurrence, foldLine, openFileHint, programToICS } from '../calendar';
import { generateProgram } from '../generator';
import type { Profile } from '../../types';

const profile: Profile = {
  name: 'Test', sex: 'female', birthYear: 1996, heightCm: 165, weightKg: 60, activity: 'light',
  goal: 'tone', experience: 'beginner', trainingDays: [0, 2, 4], sessionMinutes: 45,
  equipment: ['dumbbells', 'bands'], limitations: [], focus: 'balanced', cardio: 'walking', diet: 'omnivore',
  createdAt: '2026-01-01T00:00:00.000Z',
};
const bytes = (s: string) => new TextEncoder().encode(s).length;

describe('fichier de calendrier', () => {
  it('échappe les textes', () => {
    expect(escapeText('Squat, fentes; gainage\\fin\nOK')).toBe('Squat\\, fentes\\; gainage\\\\fin\\nOK');
  });

  it('coupe les lignes longues à 75 octets sans couper un caractère accentué', () => {
    const line = 'DESCRIPTION:' + 'é'.repeat(100);
    const folded = foldLine(line);
    for (const l of folded.split('\r\n')) expect(bytes(l)).toBeLessThanOrEqual(75);
    expect(folded.split('\r\n ').join('')).toBe(line);
    expect(foldLine('SUMMARY:court')).toBe('SUMMARY:court');
  });

  it('trouve la prochaine séance du bon jour', () => {
    const lundi10h = new Date(2026, 9, 26, 10, 0); // lundi 26 octobre 2026
    expect(firstOccurrence(0, '18:30', lundi10h)).toEqual(new Date(2026, 9, 26, 18, 30));
    expect(firstOccurrence(0, '08:00', lundi10h)).toEqual(new Date(2026, 10, 2, 8, 0)); // heure passée : lundi suivant
    expect(firstOccurrence(2, '18:30', lundi10h)).toEqual(new Date(2026, 9, 28, 18, 30)); // mercredi
    expect(firstOccurrence(6, '09:15', lundi10h)).toEqual(new Date(2026, 10, 1, 9, 15)); // dimanche
  });

  it('crée un événement hebdomadaire par jour d\'entraînement, avec alerte', () => {
    const program = generateProgram(profile, 1);
    const ics = programToICS(program, { time: '18:30', alarmMinutes: 30, weeks: 8 }, new Date(2026, 9, 26, 10, 0));
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(3);
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=8');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=WE;COUNT=8');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=FR;COUNT=8');
    expect(ics).toContain('DTSTART:20261026T183000');
    expect(ics.match(/TRIGGER:-PT30M/g)).toHaveLength(3);
    for (const l of ics.split('\r\n')) expect(bytes(l)).toBeLessThanOrEqual(75);
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/\n/);
  });

  it('sans alerte et sans fin', () => {
    const program = generateProgram(profile, 1);
    const ics = programToICS(program, { time: '07:00', alarmMinutes: null, weeks: null });
    expect(ics).not.toContain('VALARM');
    expect(ics).toMatch(/RRULE:FREQ=WEEKLY;BYDAY=MO\r\n/);
  });

  it('explique comment ouvrir le fichier selon le téléphone', () => {
    const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
    const ipad = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
    const samsung = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
    expect(openFileHint(iphone, 5)).toContain('app Fichiers');
    expect(openFileHint(ipad, 5)).toContain('app Fichiers');
    expect(openFileHint(ipad, 0)).toContain('avec ton agenda'); // vrai Mac
    expect(openFileHint(samsung, 5)).toContain('Mes fichiers');
  });

  it('alerte à l\'heure de la séance', () => {
    const ics = programToICS(generateProgram(profile, 1), { time: '07:00', alarmMinutes: 0, weeks: 4 });
    expect(ics).toContain('TRIGGER:PT0S');
  });
});
