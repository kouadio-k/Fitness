import type { Weekday } from '../types';

/** Date locale au format YYYY-MM-DD (pas d'UTC pour éviter les décalages en soirée). */
export function toISODate(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: string, n: number): string {
  const d = parseISODate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** 0 = lundi … 6 = dimanche */
export function weekdayOf(s: string | Date): Weekday {
  const d = typeof s === 'string' ? parseISODate(s) : s;
  return ((d.getDay() + 6) % 7) as Weekday;
}

/** Lundi de la semaine contenant la date. */
export function startOfWeek(s: string): string {
  return addDays(s, -weekdayOf(s));
}

export const WEEKDAY_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
export const WEEKDAY_LONG = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export function formatLong(s: string): string {
  return parseISODate(s).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function formatShort(s: string): string {
  return parseISODate(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function relativeDay(s: string, today = toISODate()): string {
  if (s === today) return "Aujourd'hui";
  if (s === addDays(today, -1)) return 'Hier';
  if (s === addDays(today, 1)) return 'Demain';
  return formatLong(s);
}
