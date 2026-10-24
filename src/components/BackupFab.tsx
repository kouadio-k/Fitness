import { useEffect, useRef, useState } from 'react';
import { normalizeState, useStore } from '../store';
import { backupIsDue, BACKUP_REMINDER_DAYS, isStoragePersistent, lastBackupDate, readBackup, saveBackup } from '../lib/backup';
import { Icon, Sheet, toast } from './ui';

/** Bouton flottant : état de la sauvegarde, copie de sauvegarde en un geste, restauration. */
export function BackupFab() {
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const due = backupIsDue(state);
  return (
    <>
      <button className="fab" onClick={() => setOpen(true)} aria-label={due ? 'Sauvegarde à faire' : 'Sauvegarde'}>
        <Icon name="save" />
        {due && <span className="fab-dot" />}
      </button>
      {open && <BackupSheet onClose={() => setOpen(false)} />}
    </>
  );
}

export function BackupSheet({ onClose }: { onClose: () => void }) {
  const { state, replace, saveError } = useStore();
  const [busy, setBusy] = useState(false);
  const [persistent, setPersistent] = useState<boolean | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<unknown>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const last = lastBackupDate();

  useEffect(() => {
    isStoragePersistent().then(setPersistent);
  }, []);

  const backup = async () => {
    setBusy(true);
    const r = await saveBackup(state);
    setBusy(false);
    if (r === 'shared') toast('Sauvegarde créée');
    if (r === 'downloaded') toast('Fichier de sauvegarde téléchargé');
  };

  return (
    <Sheet title="Sauvegarde" onClose={onClose}>
      <div className={`notice small ${saveError ? 'danger' : 'success'}`}>
        {saveError
          ? '⚠️ L\'enregistrement automatique a échoué (stockage plein ou navigation privée). Fais une copie de sauvegarde maintenant.'
          : '✅ Enregistrement automatique actif : chaque modification est enregistrée sur ce téléphone.'}
      </div>
      <div className="small">
        <b>Dernière copie de sauvegarde :</b>{' '}
        {last ? last.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'jamais'}
      </div>
      <p className="small muted">
        L'enregistrement automatique ne protège pas si le téléphone est perdu, changé, ou si les données du navigateur sont effacées. Garde une copie ailleurs (Fichiers, iCloud Drive, Google Drive, e-mail) au moins une fois par semaine : un point orange sur le bouton te le rappelle après {BACKUP_REMINDER_DAYS} jours.
      </p>
      <button className="btn block" onClick={backup} disabled={busy}>
        <Icon name="download" size={18} /> Faire une copie de sauvegarde
      </button>
      <button className="btn outline block" onClick={() => fileRef.current?.click()}>
        <Icon name="upload" size={18} /> Restaurer une copie
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          try {
            setConfirmRestore(await readBackup(f));
          } catch {
            toast('Ce fichier n\'est pas une sauvegarde de l\'application');
          }
        }}
      />
      {confirmRestore !== null && (
        <div className="notice warning small col">
          <span>Remplacer toutes les données actuelles par celles de la copie ? Ce qui a été saisi depuis sera perdu.</span>
          <div className="row">
            <button className="btn small outline" onClick={() => setConfirmRestore(null)}>
              Annuler
            </button>
            <button
              className="btn small"
              onClick={() => {
                replace(normalizeState(confirmRestore));
                setConfirmRestore(null);
                toast('Données restaurées');
                onClose();
              }}
            >
              Restaurer
            </button>
          </div>
        </div>
      )}
      {persistent !== null && (
        <p className="tiny muted">
          {persistent
            ? 'Stockage protégé : le navigateur s\'est engagé à ne pas effacer ces données pour libérer de la place.'
            : 'Stockage non protégé par le navigateur : installer l\'application sur l\'écran d\'accueil et faire des copies régulières limite le risque de perte.'}
        </p>
      )}
      <p className="tiny muted">La clé API de l'analyse photo n'est jamais incluse dans la copie.</p>
    </Sheet>
  );
}
