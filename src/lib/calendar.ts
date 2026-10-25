/**
 * Fichier de calendrier (.ics, format iCalendar, RFC 5545) des séances du programme : un événement qui se répète
 * chaque semaine pour chaque jour d'entraînement, avec une alerte facultative. Le calendrier du téléphone se charge
 * ensuite des rappels, sans serveur.
 *
 * Les heures sont « flottantes » (sans fuseau) : la séance reste à 18 h 30 heure locale, y compris au changement
 * d'heure ou en voyage.
 */
import { EXERCISE_BY_ID } from '../data/exercises';
import type { Program } from '../types';
import { estimateSessionMinutes } from './generator';

export interface CalendarOptions {
  /** Heure de début « HH:MM », heure locale. */
  time: string;
  /** Alerte, en minutes avant la séance ; null = pas d'alerte. */
  alarmMinutes: number | null;
  /** Nombre de semaines ; null = sans fin. */
  weeks: number | null;
}

export const CALENDAR_FILE_NAME = 'seances-bemis-fitness.ics';

const BYDAY = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

const pad = (n: number) => String(n).padStart(2, '0');
/** Date-heure locale sans fuseau : 20261026T183000 */
const floating = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const utc = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** Échappement des textes (RFC 5545, 3.3.11). */
export function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Coupe les lignes de plus de 75 octets (RFC 5545, 3.1), sans couper un caractère. */
export function foldLine(line: string): string {
  const enc = new TextEncoder();
  const parts: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    // 75 octets pour la première ligne, 74 ensuite (l'espace de continuation compte).
    if (bytes + n > (parts.length ? 74 : 75)) {
      parts.push(cur);
      cur = '';
      bytes = 0;
    }
    cur += ch;
    bytes += n;
  }
  parts.push(cur);
  return parts.join('\r\n ');
}

/** Première séance à venir pour ce jour (0 = lundi), à l'heure donnée. */
export function firstOccurrence(weekday: number, time: string, now = new Date()): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  const today = (now.getDay() + 6) % 7;
  d.setDate(d.getDate() + ((weekday - today + 7) % 7));
  if (d <= now) d.setDate(d.getDate() + 7);
  return d;
}

/** Télécharge le fichier : la notification de téléchargement propose ensuite de l'ouvrir avec Calendrier. */
export function downloadCalendarFile(ics: string): void {
  const url = URL.createObjectURL(new File([ics], CALENDAR_FILE_NAME, { type: 'text/calendar' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = CALENDAR_FILE_NAME;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export function programToICS(program: Program, opts: CalendarOptions, now = new Date()): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Bemis Fitness//Seances//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const day of program.schedule) {
    const session = program.sessions.find((s) => s.id === day.sessionId);
    if (!session) continue;
    const minutes = estimateSessionMinutes(session);
    const start = firstOccurrence(day.weekday, opts.time, now);
    const end = new Date(start.getTime() + minutes * 60000);
    const names = session.exercises.map((p) => EXERCISE_BY_ID[p.exerciseId]?.name).filter(Boolean);
    const description = [`Environ ${minutes} min · ${names.length} exercices`, names.length ? `Au programme : ${names.join(', ')}` : '', 'Ouvre Bémi\'s Fitness pour démarrer la séance.']
      .filter(Boolean)
      .join('\n');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${program.id}-${day.weekday}@bemis-fitness`,
      `DTSTAMP:${utc(now)}`,
      `DTSTART:${floating(start)}`,
      `DTEND:${floating(end)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${BYDAY[day.weekday]}${opts.weeks ? `;COUNT=${opts.weeks}` : ''}`,
      `SUMMARY:${escapeText(`Séance : ${session.name}`)}`,
      `DESCRIPTION:${escapeText(description)}`,
    );
    if (opts.alarmMinutes !== null) {
      lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeText(opts.alarmMinutes ? `Séance dans ${opts.alarmMinutes} min : ${session.name}` : `C'est l'heure de ta séance : ${session.name}`)}`,
        `TRIGGER:${opts.alarmMinutes ? `-PT${opts.alarmMinutes}M` : 'PT0S'}`,
        'END:VALARM',
      );
    }
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
