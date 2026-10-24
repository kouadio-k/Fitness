import { useEffect, useState } from 'react';
import { demoFor, videoSearchUrl } from '../data/exerciseDemos';
import type { Exercise } from '../types';

/** Démo d'un exercice : alternance des photos départ / arrivée + lien vers une recherche vidéo. */
export function ExerciseDemo({ exercise }: { exercise: Exercise }) {
  const demo = demoFor(exercise.id);
  const [frame, setFrame] = useState(0);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!demo || paused || reduceMotion || failed) return;
    const t = window.setInterval(() => setFrame((f) => 1 - f), 1300);
    return () => window.clearInterval(t);
  }, [demo, paused, reduceMotion, failed]);

  return (
    <div className="col" style={{ gap: 8 }}>
      {demo && !failed && (
        <>
          <button
            type="button"
            className="demo-frame"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Relancer l\'animation' : 'Mettre l\'animation en pause'}
          >
            {demo.images.map((src, i) => (
              <img key={src} src={src} alt={i === 0 ? 'Position 1' : 'Position 2'} loading="lazy" onError={() => setFailed(true)} style={{ opacity: frame === i ? 1 : 0 }} />
            ))}
            <span className="demo-tag">
              {frame === 0 ? 'Position 1' : 'Position 2'}
              {paused ? ' · pause' : ''}
            </span>
          </button>
          <div className="row wrap tiny muted" style={{ gap: 6 }}>
            <button type="button" className="chip" style={{ minHeight: 30, padding: '4px 10px' }} onClick={() => { setPaused(true); setFrame(0); }}>
              Position 1
            </button>
            <button type="button" className="chip" style={{ minHeight: 30, padding: '4px 10px' }} onClick={() => { setPaused(true); setFrame(1); }}>
              Position 2
            </button>
            {demo.approx && <span>Variante montrée : {demo.approx}.</span>}
          </div>
        </>
      )}
      {demo && failed && <div className="tiny muted">Photos de démonstration indisponibles (pas de connexion ?).</div>}
      <a className="btn ghost small" style={{ alignSelf: 'flex-start' }} href={videoSearchUrl(exercise.name)} target="_blank" rel="noopener noreferrer">
        ▶ Voir des vidéos de l'exercice
      </a>
      {demo && !failed && <div className="tiny muted">Photos : free-exercise-db. Vidéos : recherche YouTube, choisis de préférence une vidéo d'un·e coach diplômé·e.</div>}
    </div>
  );
}
