import type { AppState } from '../types';
import { toISODate } from './dates';

/**
 * Les données sont enregistrées automatiquement sur l'appareil (localStorage) à chaque
 * modification. Ce module gère en plus la copie de sauvegarde que l'utilisatrice garde
 * ailleurs (Fichiers, iCloud Drive, e-mail…) pour ne rien perdre en changeant de téléphone.
 */
const LAST_BACKUP_KEY = 'fitness-coach-last-backup';
export const BACKUP_REMINDER_DAYS = 7;

export function lastBackupDate(): Date | null {
  try {
    const v = localStorage.getItem(LAST_BACKUP_KEY);
    return v ? new Date(v) : null;
  } catch {
    return null;
  }
}

function markBackedUp() {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
  } catch {
    /* stockage indisponible */
  }
}

export function backupIsDue(state: AppState, now = new Date()): boolean {
  if (!state.profile) return false;
  const last = lastBackupDate();
  if (!last) return true;
  return now.getTime() - last.getTime() > BACKUP_REMINDER_DAYS * 86400000;
}

export function backupFileName(): string {
  return `bemis-fitness-sauvegarde-${toISODate()}.json`;
}

/**
 * Crée le fichier de sauvegarde. Sur téléphone, la feuille de partage permet de l'enregistrer
 * dans Fichiers / iCloud Drive / Google Drive ou de se l'envoyer ; sinon le fichier est téléchargé.
 * Renvoie « cancelled » si l'utilisatrice a fermé la feuille de partage.
 */
export async function saveBackup(state: AppState): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const json = JSON.stringify(state, null, 2);
  const file = new File([json], backupFileName(), { type: 'application/json' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: 'Sauvegarde Bémi\'s Fitness app' });
      markBackedUp();
      return 'shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled';
      // Partage refusé par le navigateur : on bascule sur le téléchargement.
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  markBackedUp();
  return 'downloaded';
}

export async function readBackup(file: File): Promise<unknown> {
  const data = JSON.parse(await file.text());
  if (!data || typeof data !== 'object' || !('profile' in data)) throw new Error('format');
  return data;
}

/**
 * Demande au navigateur de ne pas effacer les données de l'application quand il manque
 * de place (API Storage). Le navigateur peut refuser ; sans effet s'il ne la connaît pas.
 */
export async function requestPersistentStorage(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

export async function isStoragePersistent(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persisted) return null;
    return await navigator.storage.persisted();
  } catch {
    return null;
  }
}
