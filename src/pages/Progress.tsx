import { useState } from 'react';
import { useStore, useTargets } from '../store';
import { BarChart, Icon, LineChart, NumberInput, Sheet, toast } from '../components/ui';
import { personalRecords, weekStreak, workoutVolume } from '../lib/actions';
import { addDays, formatShort, startOfWeek, toISODate, WEEKDAY_SHORT } from '../lib/dates';
import { sumEntries } from '../lib/nutrition';
import { getExercise } from '../data/exercises';
import { WeightSheet } from './Dashboard';
import type { Measurement } from '../types';

const MEASURE_FIELDS: { key: keyof Omit<Measurement, 'date'>; label: string }[] = [
  { key: 'waist', label: 'Taille' },
  { key: 'hips', label: 'Hanches' },
  { key: 'chest', label: 'Poitrine' },
  { key: 'thigh', label: 'Cuisse' },
  { key: 'arm', label: 'Bras' },
];

/** Moyenne mobile sur 7 jours calendaires — lisse les variations quotidiennes (eau, sel, cycle…). */
function movingAverage(points: { x: string; y: number }[]) {
  return points.map((p) => {
    const from = addDays(p.x, -6);
    const win = points.filter((q) => q.x >= from && q.x <= p.x);
    return { x: p.x, y: win.reduce((s, q) => s + q.y, 0) / win.length };
  });
}

export function Progress() {
  const { state, update } = useStore();
  const targets = useTargets();
  const [weightOpen, setWeightOpen] = useState(false);
  const [measureOpen, setMeasureOpen] = useState(false);
  const today = toISODate();

  const weights = [...state.weights].sort((a, b) => a.date.localeCompare(b.date));
  const points = weights.map((w) => ({ x: w.date, y: w.kg }));
  const trend = movingAverage(points);
  const first = weights[0];
  const last = weights.at(-1);

  const last7 = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const kcalDays = last7.map((d) => ({ label: WEEKDAY_SHORT[(new Date(d + 'T12:00').getDay() + 6) % 7].slice(0, 2), value: Math.round(sumEntries(state.entries.filter((e) => e.date === d)).kcal) }));
  const loggedDays = kcalDays.filter((d) => d.value > 0);
  const avgKcal = loggedDays.length ? Math.round(loggedDays.reduce((s, d) => s + d.value, 0) / loggedDays.length) : 0;

  const monday = startOfWeek(today);
  const monthStart = today.slice(0, 8) + '01';
  const sessionsMonth = state.workouts.filter((w) => w.date >= monthStart).length;
  const cardioWeek = state.cardio.filter((c) => c.date >= monday).reduce((s, c) => s + c.minutes, 0);
  const volume = state.workouts.reduce((s, w) => s + workoutVolume(w), 0);
  const prs = personalRecords(state.workouts).slice(0, 8);
  const measurements = [...state.measurements].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="page">
      <div className="page-header">
        <h1>Progrès</h1>
      </div>

      <div className="grid-2">
        <div className="stat">
          <span className="value">{state.workouts.length}</span>
          <span className="label">séances au total</span>
        </div>
        <div className="stat">
          <span className="value">{sessionsMonth}</span>
          <span className="label">séances ce mois-ci</span>
        </div>
        <div className="stat">
          <span className="value">{weekStreak(state.workouts, today)}</span>
          <span className="label">semaines d'affilée</span>
        </div>
        <div className="stat">
          <span className="value">{volume >= 1000 ? `${(volume / 1000).toFixed(1)} t` : `${Math.round(volume)} kg`}</span>
          <span className="label">soulevés au total</span>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <h3>
            <Icon name="scale" size={20} /> Poids
          </h3>
          <button className="btn secondary small" onClick={() => setWeightOpen(true)}>
            <Icon name="plus" size={16} /> Pesée
          </button>
        </div>
        {first && last && first !== last && (
          <div className="small">
            {last.kg - first.kg > 0 ? '+' : ''}
            {(last.kg - first.kg).toFixed(1)} kg depuis le {formatShort(first.date)}
            {trend.length > 1 && <span className="muted"> · tendance (moyenne 7 j) : {trend.at(-1)!.y.toFixed(1)} kg</span>}
          </div>
        )}
        <LineChart data={points} trend={points.length >= 4 ? trend : undefined} unit=" kg" goal={state.profile?.targetWeightKg} />
        {weights.length > 0 && (
          <details className="disclosure">
            <summary className="small">Toutes les pesées</summary>
            <div className="list">
              {[...weights].reverse().map((w) => (
                <div key={w.date} className="list-item static small">
                  <span className="grow">{formatShort(w.date)}</span>
                  <span className="kbd-num bold">{w.kg.toFixed(1)} kg</span>
                  <button className="icon-btn plain" aria-label="Supprimer" onClick={() => update((s) => ({ ...s, weights: s.weights.filter((x) => x.date !== w.date) }))}>
                    <Icon name="trash" size={18} />
                  </button>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      <div className="card">
        <div className="card-title">
          <h3>📏 Mensurations</h3>
          <button className="btn secondary small" onClick={() => setMeasureOpen(true)}>
            <Icon name="plus" size={16} /> Mesurer
          </button>
        </div>
        <p className="small muted">Le tour de taille et de hanches montre souvent les progrès mieux que la balance, surtout quand on prend du muscle.</p>
        {measurements.length === 0 ? (
          <div className="empty">Aucune mensuration.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="small" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr className="muted">
                  <th style={{ textAlign: 'left' }}>Date</th>
                  {MEASURE_FIELDS.map((f) => (
                    <th key={f.key} style={{ textAlign: 'right' }}>
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {measurements.slice(0, 8).map((m) => (
                  <tr key={m.date}>
                    <td style={{ padding: '6px 0' }}>{formatShort(m.date)}</td>
                    {MEASURE_FIELDS.map((f) => (
                      <td key={f.key} style={{ textAlign: 'right' }} className="kbd-num">
                        {m[f.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="tiny muted">en cm</div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">
          <h3>🍽️ Calories (7 derniers jours)</h3>
          {avgKcal > 0 && <span className="small muted">moy. {avgKcal} kcal</span>}
        </div>
        <BarChart data={kcalDays} target={targets?.kcal} />
        <div className="tiny muted">Ligne verte : ton objectif ({targets?.kcal} kcal). Moyenne calculée sur les jours renseignés uniquement.</div>
      </div>

      <div className="card">
        <div className="card-title">
          <h3>🏃 Cardio cette semaine</h3>
          <span className="small muted">{cardioWeek} / 150 min</span>
        </div>
        <div className="bar">
          <div style={{ width: `${Math.min(100, (cardioWeek / 150) * 100)}%`, background: 'var(--success)' }} />
        </div>
        <div className="tiny muted">Repère OMS (2020) : 150 à 300 min d'activité modérée par semaine.</div>
      </div>

      <div className="card">
        <h3>🏆 Records personnels</h3>
        {prs.length === 0 ? (
          <div className="empty">Tes meilleures séries avec charge apparaîtront ici.</div>
        ) : (
          <div className="list">
            {prs.map((r) => (
              <div key={r.exerciseId} className="list-item static">
                <div className="grow">
                  <div className="bold small">{getExercise(r.exerciseId)?.name}</div>
                  <div className="tiny muted">{formatShort(r.date)}</div>
                </div>
                <div className="center">
                  <div className="bold kbd-num">
                    {r.weight} kg × {r.reps}
                  </div>
                  <div className="tiny muted">1RM estimé ≈ {Math.round(r.est1RM)} kg</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {weightOpen && <WeightSheet onClose={() => setWeightOpen(false)} />}
      {measureOpen && <MeasureSheet onClose={() => setMeasureOpen(false)} />}
    </div>
  );
}

function MeasureSheet({ onClose }: { onClose: () => void }) {
  const { state, update } = useStore();
  const lastM = [...state.measurements].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  const [m, setM] = useState<Measurement>({ date: toISODate() });
  return (
    <Sheet title="Mensurations" onClose={onClose}>
      <p className="small muted">Mesure toujours au même endroit, ruban à plat, sans serrer. Taille : au niveau du nombril. Hanches : à l'endroit le plus large des fesses.</p>
      <div className="grid-2">
        {MEASURE_FIELDS.map((f) => (
          <label key={f.key} className="field">
            {f.label}
            <NumberInput value={m[f.key]} onChange={(v) => setM({ ...m, [f.key]: v })} suffix="cm" step={0.1} placeholder={lastM?.[f.key]?.toString()} />
          </label>
        ))}
        <label className="field">
          Date
          <input type="date" className="input" value={m.date} max={toISODate()} onChange={(e) => setM({ ...m, date: e.target.value })} />
        </label>
      </div>
      <button
        className="btn block"
        disabled={!MEASURE_FIELDS.some((f) => m[f.key])}
        onClick={() => {
          update((s) => ({ ...s, measurements: [...s.measurements.filter((x) => x.date !== m.date), m] }));
          toast('Mensurations enregistrées');
          onClose();
        }}
      >
        Enregistrer
      </button>
    </Sheet>
  );
}
