import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { EXERCISES, getExercise, MUSCLE_LABELS, PATTERN_LABELS } from '../data/exercises';
import { cycleWeek, estimateSessionMinutes, generateProgram, isAvailable, prescribe } from '../lib/generator';
import { buildActiveWorkout, workoutVolume } from '../lib/actions';
import { formatLong, toISODate, WEEKDAY_LONG, weekdayOf } from '../lib/dates';
import { uid } from '../lib/id';
import { Chips, Icon, NumberInput, Sheet, Tabs, toast } from '../components/ui';
import { SwapList } from './WorkoutPlayer';
import { ExerciseDemo } from '../components/ExerciseDemo';
import type { CardioLog, Exercise, Muscle, PlannedExercise, SessionTemplate } from '../types';
import { CARDIO_OPTIONS, EQUIPMENT_LABEL } from '../lib/labels';

type Tab = 'program' | 'custom' | 'history' | 'library';

export function Training() {
  const [tab, setTab] = useState<Tab>('program');
  return (
    <div className="page">
      <div className="page-header">
        <h1>Entraînement</h1>
      </div>
      <Tabs<Tab>
        tabs={[
          { value: 'program', label: 'Programme' },
          { value: 'custom', label: 'Mes séances' },
          { value: 'history', label: 'Historique' },
          { value: 'library', label: 'Exercices' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'program' && <ProgramView />}
      {tab === 'custom' && <CustomSessions />}
      {tab === 'history' && <History />}
      {tab === 'library' && <Library />}
    </div>
  );
}

// ---------------------------------------------------------------------------

function ProgramView() {
  const { state, update } = useStore();
  const program = state.program;
  const [cardioOpen, setCardioOpen] = useState(false);
  if (!program || !state.profile) return <div className="empty">Aucun programme. Complète ton profil pour en générer un.</div>;
  const week = cycleWeek(program);
  const today = weekdayOf(toISODate());

  const regenerate = () => {
    if (!window.confirm('Générer une nouvelle variante du programme ? Tes modifications manuelles des séances seront remplacées (l\'historique est conservé).')) return;
    update((s) => ({ ...s, program: s.profile ? generateProgram(s.profile, Math.floor(Math.random() * 1e6)) : s.program }));
    toast('Nouveau programme généré');
  };

  return (
    <>
      <div className="card highlight">
        <div className="row between">
          <div>
            <div className="small muted">{program.splitLabel}</div>
            <h2>{program.name}</h2>
          </div>
          <span className="badge" style={{ background: 'rgba(255,255,255,.2)', color: 'inherit' }}>
            Semaine {week}/{program.cycleWeeks}
          </span>
        </div>
        {week === program.cycleWeeks && <div className="small">🌙 Semaine allégée : une série de moins par exercice pour récupérer.</div>}
        {week === 3 && <div className="small">📈 Semaine de surcharge : une série de plus sur les exercices principaux.</div>}
      </div>

      <div className="card">
        <h3>Planning de la semaine</h3>
        <div className="list">
          {program.schedule.map((d) => {
            const s = program.sessions.find((x) => x.id === d.sessionId);
            return (
              <div key={d.weekday} className="list-item static">
                <span className={`badge ${d.weekday === today ? '' : 'neutral'}`} style={{ minWidth: 76, justifyContent: 'center' }}>
                  {WEEKDAY_LONG[d.weekday]}
                </span>
                <span className="grow">{s?.name}</span>
                <span className="small muted">{s ? `~${estimateSessionMinutes(s)} min` : ''}</span>
              </div>
            );
          })}
        </div>
        <p className="small muted">🏃 {program.cardioAdvice}</p>
        <button className="btn secondary small" onClick={() => setCardioOpen(true)}>
          <Icon name="run" size={18} /> Noter une activité cardio
        </button>
      </div>

      {program.sessions.map((s) => (
        <SessionCard key={s.id} session={s} />
      ))}

      <details className="card disclosure">
        <summary>Pourquoi ce programme ?</summary>
        <div>
          <ul className="clean small">
            {program.rationale.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </details>

      <button className="btn outline block" onClick={regenerate}>
        <Icon name="refresh" size={18} /> Générer une autre variante
      </button>
      {cardioOpen && <CardioSheet onClose={() => setCardioOpen(false)} />}
    </>
  );
}

export function CardioSheet({ onClose }: { onClose: () => void }) {
  const { update } = useStore();
  const [type, setType] = useState<CardioLog['type']>('walking');
  const [minutes, setMinutes] = useState<number | undefined>(30);
  const [date, setDate] = useState(toISODate());
  return (
    <Sheet title="Activité cardio" onClose={onClose}>
      <Chips<CardioLog['type']>
        options={[...CARDIO_OPTIONS.filter((o) => o.value !== 'none'), { value: 'other', label: 'Autre' }]}
        value={type}
        onChange={setType}
      />
      <div className="grid-2">
        <label className="field">
          Durée
          <NumberInput value={minutes} onChange={setMinutes} suffix="min" min={1} />
        </label>
        <label className="field">
          Date
          <input type="date" className="input" value={date} max={toISODate()} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>
      <button
        className="btn block"
        disabled={!minutes}
        onClick={() => {
          update((s) => ({ ...s, cardio: [...s.cardio, { id: uid(), date, type, minutes: minutes! }] }));
          toast('Activité enregistrée');
          onClose();
        }}
      >
        Enregistrer
      </button>
    </Sheet>
  );
}

function SessionCard({ session }: { session: SessionTemplate }) {
  const { state, update } = useStore();
  const [editing, setEditing] = useState(false);
  const start = () => {
    if (state.activeWorkout && !window.confirm('Une séance est déjà en cours. La remplacer ?')) return;
    update((s) => ({ ...s, activeWorkout: buildActiveWorkout(s, session) }));
  };
  return (
    <div className="card">
      <div className="card-title">
        <div className="grow">
          <h3>{session.name}</h3>
          <div className="small muted">
            {session.description ? `${session.description} · ` : ''}~{estimateSessionMinutes(session)} min · {session.exercises.length} exercices
          </div>
        </div>
        <button className="icon-btn" onClick={() => setEditing(true)} aria-label="Modifier la séance">
          <Icon name="edit" />
        </button>
      </div>
      <ol className="clean small" style={{ paddingLeft: 20 }}>
        {session.exercises.map((p) => (
          <li key={p.uid}>
            {getExercise(p.exerciseId)?.name} <span className="muted">— {prescriptionText(p)}</span>
          </li>
        ))}
      </ol>
      <button className="btn block" onClick={start}>
        <Icon name="play" size={18} /> Commencer
      </button>
      {editing && <SessionEditor session={session} onClose={() => setEditing(false)} />}
    </div>
  );
}

export function prescriptionText(p: PlannedExercise): string {
  const base = p.seconds ? `${p.sets} × ${p.seconds} s` : `${p.sets} × ${p.repsMin === p.repsMax ? p.repsMax : `${p.repsMin}-${p.repsMax}`}`;
  return `${base}${p.note ? ` ${p.note}` : ''}`;
}

/** Remplace une séance (programme ou perso) dans l'état. */
function saveSession(s: SessionTemplate) {
  return (state: import('../types').AppState) => {
    if (s.custom) {
      const exists = state.customSessions.some((x) => x.id === s.id);
      return { ...state, customSessions: exists ? state.customSessions.map((x) => (x.id === s.id ? s : x)) : [...state.customSessions, s] };
    }
    if (!state.program) return state;
    return { ...state, program: { ...state.program, sessions: state.program.sessions.map((x) => (x.id === s.id ? s : x)) } };
  };
}

function SessionEditor({ session, onClose }: { session: SessionTemplate; onClose: () => void }) {
  const { state, update } = useStore();
  const [draft, setDraft] = useState<SessionTemplate>(session);
  const [swapUid, setSwapUid] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const patch = (u: string, p: Partial<PlannedExercise>) => setDraft((d) => ({ ...d, exercises: d.exercises.map((e) => (e.uid === u ? { ...e, ...p } : e)) }));
  const move = (i: number, dir: -1 | 1) =>
    setDraft((d) => {
      const list = [...d.exercises];
      const j = i + dir;
      if (j < 0 || j >= list.length) return d;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...d, exercises: list };
    });

  const save = () => {
    update(saveSession({ ...draft, name: draft.name.trim() || 'Ma séance' }));
    toast('Séance enregistrée');
    onClose();
  };

  const remove = () => {
    if (!window.confirm('Supprimer cette séance ?')) return;
    update((s) => ({ ...s, customSessions: s.customSessions.filter((x) => x.id !== session.id) }));
    onClose();
  };

  return (
    <Sheet
      title={session.custom && !state.customSessions.some((s) => s.id === session.id) ? 'Nouvelle séance' : 'Modifier la séance'}
      onClose={onClose}
      full
      footer={
        <div className="row">
          {session.custom && state.customSessions.some((s) => s.id === session.id) && (
            <button className="btn danger" onClick={remove}>
              <Icon name="trash" size={18} />
            </button>
          )}
          <button className="btn block grow" onClick={save} disabled={!draft.exercises.length}>
            Enregistrer
          </button>
        </div>
      }
    >
      <label className="field">
        Nom
        <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
      </label>
      {draft.exercises.map((p, i) => {
        const ex = getExercise(p.exerciseId);
        return (
          <div key={p.uid} className="card flat" style={{ gap: 8 }}>
            <div className="row">
              <span className="ex-number">{i + 1}</span>
              <span className="bold grow">{ex?.name}</span>
              <button className="icon-btn plain" onClick={() => move(i, -1)} aria-label="Monter" disabled={i === 0}>
                ↑
              </button>
              <button className="icon-btn plain" onClick={() => move(i, 1)} aria-label="Descendre" disabled={i === draft.exercises.length - 1}>
                ↓
              </button>
              <button className="icon-btn" onClick={() => setSwapUid(p.uid)} aria-label="Remplacer">
                <Icon name="swap" />
              </button>
              <button className="icon-btn" onClick={() => setDraft((d) => ({ ...d, exercises: d.exercises.filter((e) => e.uid !== p.uid) }))} aria-label="Retirer">
                <Icon name="trash" />
              </button>
            </div>
            <div className="grid-3">
              <label className="field tiny">
                Séries
                <NumberInput value={p.sets} min={1} max={10} onChange={(v) => v && patch(p.uid, { sets: v })} />
              </label>
              {p.seconds !== undefined ? (
                <label className="field tiny">
                  Secondes
                  <NumberInput value={p.seconds} min={5} onChange={(v) => v && patch(p.uid, { seconds: v })} />
                </label>
              ) : (
                <label className="field tiny">
                  Rép. min-max
                  <div className="row" style={{ gap: 4 }}>
                    <NumberInput value={p.repsMin} min={1} onChange={(v) => v && patch(p.uid, { repsMin: v })} />
                    <NumberInput value={p.repsMax} min={1} onChange={(v) => v && patch(p.uid, { repsMax: Math.max(v, p.repsMin) })} />
                  </div>
                </label>
              )}
              <label className="field tiny">
                Repos (s)
                <NumberInput value={p.restSec} min={0} onChange={(v) => v !== undefined && patch(p.uid, { restSec: v })} />
              </label>
            </div>
          </div>
        );
      })}
      <button className="btn secondary block" onClick={() => setAdding(true)}>
        <Icon name="plus" size={18} /> Ajouter un exercice
      </button>
      <p className="small muted">Durée estimée : ~{estimateSessionMinutes(draft)} min</p>

      {swapUid && (
        <Sheet title="Remplacer l'exercice" onClose={() => setSwapUid(null)}>
          <SwapList
            exerciseId={draft.exercises.find((e) => e.uid === swapUid)!.exerciseId}
            onPick={(id) => {
              patch(swapUid, { exerciseId: id });
              setSwapUid(null);
            }}
          />
        </Sheet>
      )}
      {adding && (
        <Sheet title="Ajouter un exercice" onClose={() => setAdding(false)} full>
          <ExercisePicker
            onPick={(ex) => {
              const pres = state.profile ? prescribe(ex, draft.exercises.length, state.profile) : { sets: 3, repsMin: 10, repsMax: 12, restSec: 60 };
              setDraft((d) => ({ ...d, exercises: [...d.exercises, { uid: uid(), exerciseId: ex.id, ...pres }] }));
              setAdding(false);
            }}
          />
        </Sheet>
      )}
    </Sheet>
  );
}

// ---------------------------------------------------------------------------

function CustomSessions() {
  const { state, update } = useStore();
  const [editing, setEditing] = useState<SessionTemplate | null>(null);
  const newSession = (): SessionTemplate => ({
    id: uid(),
    name: 'Ma séance',
    warmup: ['3 min de cardio léger', 'Mobilité des articulations (2 min)', '1 série légère du premier exercice'],
    exercises: [],
    custom: true,
  });
  return (
    <>
      <p className="small muted">Construis tes propres séances à partir de la bibliothèque d'exercices : idéal pour une séance express, à l'hôtel, ou avec une amie.</p>
      <button className="btn block" onClick={() => setEditing(newSession())}>
        <Icon name="plus" size={18} /> Créer une séance
      </button>
      {state.customSessions.length === 0 && <div className="empty">Aucune séance personnalisée pour l'instant.</div>}
      {state.customSessions.map((s) => (
        <SessionCard key={s.id} session={s} />
      ))}
      {state.program && (
        <details className="card disclosure">
          <summary>Copier une séance du programme</summary>
          <div className="list">
            {state.program.sessions.map((s) => (
              <button
                key={s.id}
                className="list-item"
                onClick={() => {
                  update((st) => ({ ...st, customSessions: [...st.customSessions, { ...s, id: uid(), name: `${s.name} (copie)`, custom: true, exercises: s.exercises.map((e) => ({ ...e, uid: uid() })) }] }));
                  toast('Séance copiée');
                }}
              >
                <span className="grow">{s.name}</span>
                <Icon name="copy" />
              </button>
            ))}
          </div>
        </details>
      )}
      {editing && <SessionEditor session={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

// ---------------------------------------------------------------------------

function History() {
  const { state, update } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const items = useMemo(
    () =>
      [
        ...state.workouts.map((w) => ({ kind: 'w' as const, date: w.date, sort: w.startedAt, w })),
        ...state.cardio.map((c) => ({ kind: 'c' as const, date: c.date, sort: c.date + 'T23', c })),
      ].sort((a, b) => b.sort.localeCompare(a.sort)),
    [state.workouts, state.cardio],
  );
  if (!items.length) return <div className="empty">Aucune séance enregistrée. Lance ta première séance depuis l'onglet Programme 💪</div>;
  const cardioLabel = (t: string) => CARDIO_OPTIONS.find((o) => o.value === t)?.label ?? 'Cardio';

  return (
    <div className="col" style={{ gap: 10 }}>
      {items.map((it) =>
        it.kind === 'c' ? (
          <div key={it.c.id} className="card flat" style={{ gap: 4 }}>
            <div className="row">
              <span>🏃</span>
              <div className="grow">
                <div className="bold">{cardioLabel(it.c.type)} · {it.c.minutes} min</div>
                <div className="small muted">{formatLong(it.c.date)}</div>
              </div>
              <button
                className="icon-btn plain"
                aria-label="Supprimer"
                onClick={() => window.confirm('Supprimer cette activité ?') && update((s) => ({ ...s, cardio: s.cardio.filter((x) => x.id !== it.c.id) }))}
              >
                <Icon name="trash" />
              </button>
            </div>
          </div>
        ) : (
          <div key={it.w.id} className="card flat" style={{ gap: 6 }}>
            <button className="row" style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', cursor: 'pointer' }} onClick={() => setOpen(open === it.w.id ? null : it.w.id)}>
              <span>🏋️</span>
              <div className="grow">
                <div className="bold">{it.w.sessionName}</div>
                <div className="small muted">
                  {formatLong(it.w.date)} · {it.w.durationMin} min · {it.w.exercises.reduce((s, e) => s + e.sets.length, 0)} séries
                  {workoutVolume(it.w) > 0 && ` · ${Math.round(workoutVolume(it.w))} kg soulevés`}
                </div>
              </div>
              {it.w.rpe && <span className="badge neutral">RPE {it.w.rpe}</span>}
            </button>
            {open === it.w.id && (
              <div className="col small">
                {it.w.exercises.map((e, i) => (
                  <div key={i}>
                    <b>{getExercise(e.exerciseId)?.name ?? e.exerciseId}</b> :{' '}
                    <span className="muted">
                      {e.sets.map((s) => (s.seconds ? `${s.seconds}s` : `${s.reps}${s.weight ? `×${s.weight}kg` : ''}`)).join(', ')}
                    </span>
                  </div>
                ))}
                {it.w.notes && <div className="notice">📝 {it.w.notes}</div>}
                <button
                  className="btn danger small"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => window.confirm('Supprimer cette séance de l\'historique ?') && update((s) => ({ ...s, workouts: s.workouts.filter((x) => x.id !== it.w.id) }))}
                >
                  <Icon name="trash" size={16} /> Supprimer
                </button>
              </div>
            )}
          </div>
        ),
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

const MUSCLE_FILTERS: Muscle[] = ['fessiers', 'quadriceps', 'ischios', 'dos', 'pectoraux', 'epaules', 'biceps', 'triceps', 'abdos', 'cardio'];

function ExercisePicker({ onPick }: { onPick?: (ex: Exercise) => void }) {
  const { state } = useStore();
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState<Muscle | 'all'>('all');
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const list = EXERCISES.filter(
    (e) =>
      (!q || norm(e.name).includes(norm(q))) &&
      (muscle === 'all' || e.muscles.includes(muscle)) &&
      (!onlyAvailable || !state.profile || isAvailable(e, state.profile)),
  );
  return (
    <>
      <input className="input" placeholder="Rechercher un exercice…" value={q} onChange={(e) => setQ(e.target.value)} />
      <Chips<Muscle | 'all'>
        options={[{ value: 'all', label: 'Tous' }, ...MUSCLE_FILTERS.map((m) => ({ value: m, label: MUSCLE_LABELS[m] }))]}
        value={muscle}
        onChange={setMuscle}
      />
      <label className="row small">
        <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} /> Seulement avec mon matériel et adaptés à mes zones sensibles
      </label>
      <div className="small muted">{list.length} exercice(s) · touche un exercice pour voir sa démo</div>
      <div className="list">
        {list.map((e) => (
          <div key={e.id} className="list-item static" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
            <div className="row">
              <button className="grow" style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', cursor: 'pointer' }} onClick={() => setOpen(open === e.id ? null : e.id)}>
                <div className="bold">{e.name}</div>
                <div className="small muted">
                  {PATTERN_LABELS[e.pattern]} · {e.muscles.map((m) => MUSCLE_LABELS[m]).join(', ')} · niv. {e.level}
                </div>
              </button>
              {onPick && (
                <button className="icon-btn" onClick={() => onPick(e)} aria-label="Ajouter">
                  <Icon name="plus" />
                </button>
              )}
            </div>
            {open === e.id && (
              <div className="notice small col" style={{ gap: 8 }}>
                <ExerciseDemo exercise={e} />
                <ul className="clean">
                  {e.cues.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                {e.equipment.length > 0 && <div className="tiny muted" style={{ marginTop: 6 }}>Matériel : {e.equipment.map((x) => EQUIPMENT_LABEL[x]).join(', ')}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function Library() {
  return <ExercisePicker />;
}
