import { useEffect, useState } from 'react';
import { useStore } from './store';
import { generateProgram } from './lib/generator';
import { Icon, ToastHost, type IconName } from './components/ui';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Meals } from './pages/Meals';
import { Training } from './pages/Training';
import { Progress } from './pages/Progress';
import { Profile } from './pages/Profile';
import { WorkoutPlayer } from './pages/WorkoutPlayer';
import { toISODate } from './lib/dates';
import { BackupFab } from './components/BackupFab';

export type Page = 'home' | 'meals' | 'training' | 'progress' | 'profile';

const NAV: { page: Page; label: string; icon: IconName }[] = [
  { page: 'home', label: 'Accueil', icon: 'home' },
  { page: 'meals', label: 'Repas', icon: 'meal' },
  { page: 'training', label: 'Séances', icon: 'dumbbell' },
  { page: 'progress', label: 'Progrès', icon: 'chart' },
  { page: 'profile', label: 'Profil', icon: 'user' },
];

export function App() {
  const { state, update, saveError } = useStore();
  const [page, setPage] = useState<Page>('home');
  const [minimized, setMinimized] = useState(false);

  // Une nouvelle séance s'ouvre toujours en plein écran.
  useEffect(() => {
    setMinimized(false);
  }, [state.activeWorkout?.startedAt]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  if (!state.profile) {
    return (
      <>
        <Onboarding
          onDone={(profile) =>
            update((s) => ({
              ...s,
              profile,
              program: generateProgram(profile),
              weights: [{ date: toISODate(), kg: profile.weightKg }],
            }))
          }
        />
        <ToastHost />
      </>
    );
  }

  const go = (p: Page) => setPage(p);

  return (
    <>
      <main className="app">
        {saveError && <div className="notice danger" style={{ marginBottom: 12 }}>⚠️ Impossible d'enregistrer les données (stockage plein ou navigation privée). Exporte une sauvegarde depuis le profil.</div>}
        {state.activeWorkout && minimized && page !== 'home' && (
          <button className="btn success block" style={{ marginBottom: 12 }} onClick={() => setMinimized(false)}>
            <Icon name="timer" size={18} /> Séance en cours — reprendre
          </button>
        )}
        {page === 'home' && <Dashboard go={go} resume={() => setMinimized(false)} />}
        {page === 'meals' && <Meals />}
        {page === 'training' && <Training />}
        {page === 'progress' && <Progress />}
        {page === 'profile' && <Profile />}
      </main>
      <nav className="nav" aria-label="Navigation principale">
        <div className="nav-inner">
          {NAV.map((n) => (
            <button key={n.page} className={page === n.page ? 'active' : ''} onClick={() => go(n.page)} aria-current={page === n.page ? 'page' : undefined}>
              <Icon name={n.icon} />
              {n.label}
            </button>
          ))}
        </div>
      </nav>
      <BackupFab />
      {state.activeWorkout && !minimized && <WorkoutPlayer onMinimize={() => setMinimized(true)} />}
      <ToastHost />
    </>
  );
}
