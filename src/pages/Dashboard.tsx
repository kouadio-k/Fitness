import { useState } from 'react';
import { currentWeight, useStore, useTargets } from '../store';
import { sumEntries } from '../lib/nutrition';
import { addDays, startOfWeek, toISODate, WEEKDAY_SHORT, weekdayOf } from '../lib/dates';
import { buildActiveWorkout, plannedSessionFor, weekStreak, workoutsOn } from '../lib/actions';
import { estimateSessionMinutes } from '../lib/generator';
import { getExercise } from '../data/exercises';
import { Icon, NumberInput, Sheet, toast } from '../components/ui';
import { DaySummary, WaterCard } from './Meals';
import { CardioSheet } from './Training';
import type { Page } from '../App';

const TIPS = [
  'La régularité compte plus que l\'intensité : mieux vaut 3 séances par semaine pendant des mois que 6 pendant 2 semaines.',
  'Le poids varie naturellement d\'un jour à l\'autre (eau, sel, cycle menstruel). Regarde la tendance sur plusieurs semaines plutôt qu\'une pesée isolée.',
  'Répartir les protéines sur les repas (petit-déjeuner compris) aide à atteindre ton objectif quotidien sans y penser.',
  'Une bonne technique avant la charge : augmente les poids seulement quand le mouvement est maîtrisé.',
  'Le sommeil fait partie de l\'entraînement : c\'est pendant la récupération que le corps progresse.',
  'Les courbatures ne sont pas un indicateur d\'efficacité. Une douleur articulaire, elle, est un signal d\'arrêt.',
  'Les légumes et les fruits apportent des fibres qui aident à la satiété — vise des légumes à chaque repas principal.',
  'Marcher davantage au quotidien augmente ta dépense énergétique sans fatiguer tes muscles pour les séances.',
];

export function Dashboard({ go, resume }: { go: (p: Page) => void; resume: () => void }) {
  const { state, update } = useStore();
  const targets = useTargets();
  const [weightOpen, setWeightOpen] = useState(false);
  const [cardioOpen, setCardioOpen] = useState(false);
  const profile = state.profile!;
  const today = toISODate();
  const session = plannedSessionFor(state, today);
  const doneToday = workoutsOn(state, today);
  const totals = sumEntries(state.entries.filter((e) => e.date === today));
  const monday = startOfWeek(today);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const plannedDays = new Set(state.program?.schedule.map((d) => d.weekday) ?? []);
  const doneThisWeek = state.workouts.filter((w) => w.date >= monday && w.date <= addDays(monday, 6)).length;
  const cardioThisWeek = state.cardio.filter((c) => c.date >= monday && c.date <= addDays(monday, 6)).reduce((s, c) => s + c.minutes, 0);
  const streak = weekStreak(state.workouts, today);
  const weight = currentWeight(state);
  const tip = TIPS[Math.floor(new Date(today).getTime() / 86400000) % TIPS.length];
  const hour = new Date().getHours();
  const hello = hour < 5 ? 'Bonne nuit' : hour < 18 ? 'Bonjour' : 'Bonsoir';

  const start = () => {
    if (!session) return;
    update((s) => ({ ...s, activeWorkout: buildActiveWorkout(s, session) }));
  };

  // Prochaine séance si rien aujourd'hui
  let next: { date: string; name: string } | undefined;
  if (!session || doneToday.length) {
    for (let i = 1; i <= 7; i++) {
      const d = addDays(today, i);
      const s = plannedSessionFor(state, d);
      if (s) {
        next = { date: d, name: s.name };
        break;
      }
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="sub">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <h1>
            {hello} {profile.name} 👋
          </h1>
        </div>
      </div>

      {state.activeWorkout ? (
        <div className="card highlight">
          <h2>Séance en cours</h2>
          <p className="small muted">Tu as une séance commencée.</p>
          <button className="btn light" onClick={resume}>
            Reprendre
          </button>
        </div>
      ) : doneToday.length ? (
        <div className="card highlight">
          <h2>Séance du jour terminée ✅</h2>
          <p className="small muted">
            {doneToday.map((w) => w.sessionName).join(', ')} — bravo ! Pense à bien manger et à t'hydrater pour récupérer.
          </p>
          {next && (
            <p className="small">
              Prochaine séance : <b>{next.name}</b> ({WEEKDAY_SHORT[weekdayOf(next.date)].toLowerCase()}.)
            </p>
          )}
        </div>
      ) : session ? (
        <div className="card highlight">
          <div className="small muted">Séance du jour · ~{estimateSessionMinutes(session)} min</div>
          <h2>{session.name}</h2>
          <p className="small muted">
            {session.exercises
              .slice(0, 4)
              .map((e) => getExercise(e.exerciseId)?.name)
              .join(' · ')}
            {session.exercises.length > 4 ? '…' : ''}
          </p>
          <button className="btn light" onClick={start}>
            <Icon name="play" size={18} /> Commencer la séance
          </button>
        </div>
      ) : (
        <div className="card highlight">
          <h2>Jour de repos 🌙</h2>
          <p className="small muted">
            Récupération active : une marche, du vélo tranquille ou des étirements.
            {next ? ` Prochaine séance : ${next.name} (${WEEKDAY_SHORT[weekdayOf(next.date)].toLowerCase()}.).` : ''}
          </p>
          <div className="row wrap">
            <button className="btn light" onClick={() => setCardioOpen(true)}>
              <Icon name="run" size={18} /> Noter une activité
            </button>
            <button className="btn light" onClick={() => go('training')}>
              Séance libre
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">
          <h3>Ma semaine</h3>
          <span className="small muted">
            {doneThisWeek}/{plannedDays.size} séances · {cardioThisWeek} min cardio
          </span>
        </div>
        <div className="week-strip">
          {weekDates.map((d, i) => {
            const done = state.workouts.some((w) => w.date === d);
            const planned = plannedDays.has(weekdayOf(d));
            return (
              <div key={d} className={`week-day ${done ? 'done' : planned ? 'planned' : ''} ${d === today ? 'today' : ''}`}>
                <div className="dot">{done ? '✓' : new Date(d + 'T12:00').getDate()}</div>
                {WEEKDAY_SHORT[i]}
              </div>
            );
          })}
        </div>
        {streak > 0 && <div className="small">🔥 {streak} semaine(s) d'affilée avec au moins une séance</div>}
      </div>

      {targets && (
        <button style={{ all: 'unset', cursor: 'pointer' }} onClick={() => go('meals')} aria-label="Voir les repas">
          <DaySummary totals={totals} targets={targets} compact />
        </button>
      )}

      <WaterCard date={today} />

      <div className="grid-2">
        <button className="card" style={{ border: 0, textAlign: 'left', cursor: 'pointer' }} onClick={() => setWeightOpen(true)}>
          <div className="row muted small">
            <Icon name="scale" size={18} /> Poids
          </div>
          <div className="bold kbd-num" style={{ fontSize: '1.4rem' }}>
            {weight?.toFixed(1)} kg
          </div>
          <div className="tiny muted">Toucher pour une nouvelle pesée</div>
        </button>
        <button className="card" style={{ border: 0, textAlign: 'left', cursor: 'pointer' }} onClick={() => go('progress')}>
          <div className="row muted small">
            <Icon name="chart" size={18} /> Séances
          </div>
          <div className="bold kbd-num" style={{ fontSize: '1.4rem' }}>
            {state.workouts.length}
          </div>
          <div className="tiny muted">au total · voir mes progrès</div>
        </button>
      </div>

      <div className="card flat">
        <div className="row small">
          <span>💡</span>
          <span>{tip}</span>
        </div>
      </div>

      {weightOpen && <WeightSheet onClose={() => setWeightOpen(false)} />}
      {cardioOpen && <CardioSheet onClose={() => setCardioOpen(false)} />}
    </div>
  );
}

export function WeightSheet({ onClose }: { onClose: () => void }) {
  const { state, update } = useStore();
  const [kg, setKg] = useState<number | undefined>(currentWeight(state));
  const [date, setDate] = useState(toISODate());
  return (
    <Sheet title="Nouvelle pesée" onClose={onClose}>
      <p className="small muted">Pour comparer d'une fois à l'autre : pèse-toi le matin, à jeun, après être passée aux toilettes.</p>
      <div className="grid-2">
        <label className="field">
          Poids
          <NumberInput value={kg} onChange={setKg} suffix="kg" step={0.1} min={30} max={300} />
        </label>
        <label className="field">
          Date
          <input type="date" className="input" value={date} max={toISODate()} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>
      <button
        className="btn block"
        disabled={!kg}
        onClick={() => {
          update((s) => ({ ...s, weights: [...s.weights.filter((w) => w.date !== date), { date, kg: kg! }].sort((a, b) => a.date.localeCompare(b.date)) }));
          toast('Pesée enregistrée');
          onClose();
        }}
      >
        Enregistrer
      </button>
    </Sheet>
  );
}
