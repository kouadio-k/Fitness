import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { getExercise, MUSCLE_LABELS } from '../data/exercises';
import { alternativesFor, suggestLoad } from '../lib/generator';
import { findSession, finishWorkout } from '../lib/actions';
import { Icon, NumberInput, Sheet, toast } from '../components/ui';
import type { ActiveWorkout } from '../types';

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Bip court via WebAudio (aucun fichier audio nécessaire). */
function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.25, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.5);
    o.onended = () => ctx.close();
  } catch {
    /* audio indisponible */
  }
  navigator.vibrate?.([200, 100, 200]);
}

export function WorkoutPlayer({ onMinimize }: { onMinimize: () => void }) {
  const { state, update } = useStore();
  const active = state.activeWorkout!;
  const session = findSession(state, active.sessionId);
  const [now, setNow] = useState(Date.now());
  const [restEnd, setRestEnd] = useState<number | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [showCues, setShowCues] = useState<Record<number, boolean>>({});
  /** Chrono d'effort pour les exercices en secondes (gainage, cardio). */
  const [work, setWork] = useState<{ ei: number; si: number; end: number } | null>(null);
  const beeped = useRef(false);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, []);

  const restLeft = restEnd ? Math.max(0, Math.round((restEnd - now) / 1000)) : 0;
  useEffect(() => {
    if (restEnd && restLeft === 0 && !beeped.current) {
      beeped.current = true;
      beep();
      const t = window.setTimeout(() => setRestEnd(null), 1500);
      return () => window.clearTimeout(t);
    }
  }, [restEnd, restLeft]);

  const workLeft = work ? Math.max(0, Math.ceil((work.end - now) / 1000)) : 0;
  useEffect(() => {
    if (work && workLeft === 0) {
      setWork(null);
      toggleDone(work.ei, work.si);
      beep();
    }
    // toggleDone est recréée à chaque rendu ; seule la fin du chrono doit déclencher l'effet
  }, [work, workLeft]);

  const elapsed = (now - new Date(active.startedAt).getTime()) / 1000;
  const totalSets = active.exercises.reduce((s, e) => s + e.sets.length, 0);
  const doneSets = active.exercises.reduce((s, e) => s + e.sets.filter((x) => x.done).length, 0);

  const setActive = (fn: (a: ActiveWorkout) => ActiveWorkout) =>
    update((s) => (s.activeWorkout ? { ...s, activeWorkout: fn(s.activeWorkout) } : s));

  const updateSet = (ei: number, si: number, patch: Partial<ActiveWorkout['exercises'][number]['sets'][number]>) =>
    setActive((a) => ({
      ...a,
      exercises: a.exercises.map((e, i) => (i !== ei ? e : { ...e, sets: e.sets.map((x, j) => (j === si ? { ...x, ...patch } : x)) })),
    }));

  const toggleDone = (ei: number, si: number) => {
    const ex = active.exercises[ei];
    const wasDone = ex.sets[si].done;
    updateSet(ei, si, { done: !wasDone });
    if (!wasDone) {
      beeped.current = false;
      setRestEnd(Date.now() + ex.planned.restSec * 1000);
    }
  };

  const addSet = (ei: number) =>
    setActive((a) => ({
      ...a,
      exercises: a.exercises.map((e, i) => (i !== ei ? e : { ...e, sets: [...e.sets, { ...(e.sets.at(-1) ?? { reps: e.planned.repsMax, weight: 0 }), done: false }] })),
    }));

  const removeSet = (ei: number) =>
    setActive((a) => ({
      ...a,
      exercises: a.exercises.map((e, i) => (i !== ei || e.sets.length <= 1 ? e : { ...e, sets: e.sets.slice(0, -1) })),
    }));

  const swap = (ei: number, newId: string) => {
    setActive((a) => ({
      ...a,
      exercises: a.exercises.map((e, i) => {
        if (i !== ei) return e;
        const planned = { ...e.planned, exerciseId: newId };
        const sug = suggestLoad(planned, state.workouts);
        return { ...e, exerciseId: newId, planned, sets: e.sets.map((x) => ({ ...x, weight: sug.weight })) };
      }),
    }));
    setSwapIndex(null);
  };

  const abandon = () => {
    if (window.confirm('Abandonner la séance ? Les séries ne seront pas enregistrées.')) {
      update((s) => ({ ...s, activeWorkout: null }));
    }
  };

  return (
    <div className="workout">
      <div className="workout-inner">
        <div className="workout-top">
          <button className="icon-btn" onClick={abandon} aria-label="Abandonner">
            <Icon name="close" />
          </button>
          <div className="center grow">
            <div className="bold ellipsis">{session?.name ?? 'Séance'}</div>
            <div className="small muted kbd-num">
              {fmtTime(elapsed)} · {doneSets}/{totalSets} séries
            </div>
          </div>
          <button className="icon-btn" onClick={onMinimize} aria-label="Réduire">
            <Icon name="minus" />
          </button>
          <button className="btn success small" onClick={() => setFinishing(true)}>
            Terminer
          </button>
        </div>
        <div className="bar">
          <div style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%`, background: 'var(--success)' }} />
        </div>

        {session && session.warmup.length > 0 && (
          <details className="card flat disclosure">
            <summary>🔥 Échauffement (5-8 min)</summary>
            <div>
              <ul className="clean small">
                {session.warmup.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          </details>
        )}

        {active.exercises.map((e, ei) => {
          const ex = getExercise(e.exerciseId);
          if (!ex) return null;
          const sug = suggestLoad(e.planned, state.workouts);
          const allDone = e.sets.every((s) => s.done);
          const target = e.planned.seconds
            ? `${e.planned.sets} × ${e.planned.seconds} s`
            : `${e.planned.sets} × ${e.planned.repsMin}-${e.planned.repsMax} rép.`;
          return (
            <div key={ei} className={`card ex-card ${allDone ? 'done' : ''}`}>
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <span className="ex-number">{allDone ? '✓' : ei + 1}</span>
                <div className="grow">
                  <h3>{ex.name}</h3>
                  <div className="small muted">
                    {target}
                    {e.planned.note ? ` ${e.planned.note}` : ''} · repos {e.planned.restSec} s
                  </div>
                </div>
                <button className="icon-btn" aria-label="Conseils" onClick={() => setShowCues((c) => ({ ...c, [ei]: !c[ei] }))}>
                  <Icon name="info" />
                </button>
                <button className="icon-btn" aria-label="Remplacer" onClick={() => setSwapIndex(ei)}>
                  <Icon name="swap" />
                </button>
              </div>
              {showCues[ei] && (
                <div className="notice small">
                  <div className="tiny muted" style={{ marginBottom: 4 }}>
                    {ex.muscles.map((m) => MUSCLE_LABELS[m]).join(' · ')}
                  </div>
                  <ul className="clean">
                    {ex.cues.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="small" style={{ color: 'var(--primary-strong)' }}>
                💡 {sug.message}
              </div>
              <div className="set-grid">
                <span className="head">#</span>
                <span className="head center">{ex.loadable ? 'kg' : ex.timed ? 'chrono' : 'kg (lest)'}</span>
                <span className="head center">{ex.timed ? 'secondes' : 'rép.'}</span>
                <span />
                {e.sets.map((s, si) => (
                  <div key={si} style={{ display: 'contents' }} className={s.done ? 'set-row-done' : ''}>
                    <span className="muted bold center">{si + 1}</span>
                    {ex.timed ? (
                      <button
                        className="btn secondary small"
                        disabled={s.done || !!work}
                        onClick={() => {
                          setRestEnd(null);
                          setWork({ ei, si, end: Date.now() + (s.seconds || e.planned.seconds || 30) * 1000 });
                        }}
                      >
                        <Icon name="play" size={16} /> Go
                      </button>
                    ) : (
                      <NumberInput value={s.weight} step={0.5} min={0} onChange={(v) => updateSet(ei, si, { weight: v ?? 0 })} ariaLabel={`Charge série ${si + 1}`} />
                    )}
                    {ex.timed ? (
                      <NumberInput value={s.seconds} min={0} onChange={(v) => updateSet(ei, si, { seconds: v ?? 0 })} ariaLabel={`Durée série ${si + 1}`} />
                    ) : (
                      <NumberInput value={s.reps} min={0} onChange={(v) => updateSet(ei, si, { reps: v ?? 0 })} ariaLabel={`Répétitions série ${si + 1}`} />
                    )}
                    <button className={`set-check ${s.done ? 'done' : ''}`} onClick={() => toggleDone(ei, si)} aria-label={s.done ? 'Annuler la série' : 'Valider la série'}>
                      <Icon name="check" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="row">
                <button className="btn ghost small" onClick={() => addSet(ei)}>
                  <Icon name="plus" size={16} /> Série
                </button>
                {e.sets.length > 1 && (
                  <button className="btn ghost small" onClick={() => removeSet(ei)}>
                    <Icon name="minus" size={16} /> Série
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {session?.finisher && (
          <div className="card flat">
            <h3>⚡ Finisher</h3>
            <p className="small">{session.finisher}</p>
          </div>
        )}

        <div className="card flat">
          <h3>🧘 Retour au calme</h3>
          <p className="small muted">3 à 5 minutes de marche lente et d'étirements doux des muscles travaillés, en respirant calmement.</p>
        </div>

        <button className="btn success block" onClick={() => setFinishing(true)}>
          Terminer la séance
        </button>
      </div>

      {work && (
        <div className="rest-banner" role="timer" style={{ background: 'var(--primary-strong)', color: '#fff' }}>
          <Icon name="flame" />
          <div className="grow">
            <div className="tiny" style={{ opacity: 0.8 }}>
              Effort · {getExercise(active.exercises[work.ei].exerciseId)?.name}
            </div>
            <div className="time">{fmtTime(workLeft)}</div>
          </div>
          <button className="btn small" onClick={() => setWork(null)}>
            Annuler
          </button>
          <button
            className="btn small"
            onClick={() => {
              const startedFor = active.exercises[work.ei].sets[work.si].seconds ?? 0;
              updateSet(work.ei, work.si, { seconds: Math.max(0, startedFor - workLeft) });
              setWork(null);
              toggleDone(work.ei, work.si);
            }}
          >
            Stop
          </button>
        </div>
      )}

      {restEnd && !work && (
        <div className="rest-banner" role="timer">
          <Icon name="timer" />
          <div className="grow">
            <div className="tiny" style={{ opacity: 0.7 }}>
              {restLeft > 0 ? 'Repos' : 'C\'est reparti !'}
            </div>
            <div className="time">{fmtTime(restLeft)}</div>
          </div>
          <button className="btn small" onClick={() => setRestEnd((r) => (r ?? Date.now()) + 15000)}>
            +15 s
          </button>
          <button className="btn small" onClick={() => setRestEnd(null)}>
            Passer
          </button>
        </div>
      )}

      {swapIndex !== null && (
        <Sheet title="Remplacer l'exercice" onClose={() => setSwapIndex(null)}>
          {state.profile && <SwapList exerciseId={active.exercises[swapIndex].exerciseId} onPick={(id) => swap(swapIndex, id)} />}
        </Sheet>
      )}

      {finishing && (
        <FinishSheet
          doneSets={doneSets}
          onClose={() => setFinishing(false)}
          onSave={(rpe, notes) => {
            update((s) => finishWorkout(s, { rpe, notes }));
            toast('Séance enregistrée, bravo ! 🎉');
          }}
        />
      )}
    </div>
  );
}

export function SwapList({ exerciseId, onPick }: { exerciseId: string; onPick: (id: string) => void }) {
  const { state } = useStore();
  const alts = state.profile ? alternativesFor(exerciseId, state.profile) : [];
  if (!alts.length) return <div className="empty">Aucune alternative disponible avec ton matériel.</div>;
  return (
    <div className="list">
      {alts.map((a) => (
        <button key={a.id} className="list-item" onClick={() => onPick(a.id)}>
          <div className="grow">
            <div className="bold">{a.name}</div>
            <div className="small muted">
              {a.muscles.map((m) => MUSCLE_LABELS[m]).join(' · ')} · niveau {a.level}
            </div>
          </div>
          <Icon name="chevronRight" />
        </button>
      ))}
    </div>
  );
}

function FinishSheet({ doneSets, onClose, onSave }: { doneSets: number; onClose: () => void; onSave: (rpe: number | undefined, notes: string) => void }) {
  const [rpe, setRpe] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');
  return (
    <Sheet title="Fin de séance" onClose={onClose}>
      {doneSets === 0 && <div className="notice warning">Aucune série validée : la séance sera enregistrée vide.</div>}
      <div className="field">
        <span className="bold">Comment c'était ? (difficulté ressentie)</span>
        <div className="chips">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button key={n} className={`chip ${rpe === n ? 'active' : ''}`} onClick={() => setRpe(n)} style={{ minWidth: 42 }}>
              {n}
            </button>
          ))}
        </div>
        <span className="tiny muted">1 = très facile · 5 = modéré · 10 = effort maximal</span>
      </div>
      <label className="field">
        Notes
        <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Sensations, douleurs, ce qui était facile ou difficile…" />
      </label>
      <button className="btn success block" onClick={() => onSave(rpe, notes)}>
        Enregistrer la séance
      </button>
    </Sheet>
  );
}
