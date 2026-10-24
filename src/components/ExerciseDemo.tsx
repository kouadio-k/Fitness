import { useEffect, useMemo, useState } from 'react';
import { DEMO_CREDIT, DEMO_LICENSE_URL, demoFor } from '../data/exerciseDemos';
import { FEMALE_CREATORS, OTHER_CREATORS, youtubeSearchUrl } from '../data/exerciseVideos';
import type { Exercise } from '../types';

/** Démo d'un exercice : les deux positions dessinées en alternance, puis liens vidéo (créatrices d'abord). */
export function ExerciseDemo({ exercise }: { exercise: Exercise }) {
  // Mémorisé : l'écran de séance se redessine toutes les 0,5 s (chrono), ce qui ne doit pas relancer l'animation.
  const demo = useMemo(() => demoFor(exercise.id), [exercise.id]);
  const hasDemo = !!demo;
  const [frame, setFrame] = useState(0);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!hasDemo || paused || reduceMotion || failed) return;
    const t = window.setInterval(() => setFrame((f) => 1 - f), 1300);
    return () => window.clearInterval(t);
  }, [hasDemo, paused, reduceMotion, failed]);

  // Exercice remplacé pendant la séance : on repart de la position de repos.
  useEffect(() => {
    setFrame(0);
    setFailed(false);
  }, [exercise.id]);

  const show = (f: number) => {
    setPaused(true);
    setFrame(f);
  };

  return (
    <div className="col" style={{ gap: 10 }}>
      {demo && !failed && (
        <>
          <button
            type="button"
            className="demo-frame"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Relancer l\'animation' : 'Mettre l\'animation en pause'}
          >
            {demo.images.map((src, i) => (
              <img key={src} src={src} alt={i === 0 ? 'Position 1' : 'Position 2'} onError={() => setFailed(true)} style={{ opacity: frame === i ? 1 : 0 }} />
            ))}
            <span className="demo-tag">{frame === 0 ? 'Position 1' : 'Position 2'}</span>
            {paused && <span className="demo-tag demo-tag-right">En pause</span>}
          </button>
          <div className="row wrap" style={{ gap: 6 }}>
            <button type="button" className={`chip ${frame === 0 ? 'active' : ''}`} onClick={() => show(0)}>
              Position 1
            </button>
            <button type="button" className={`chip ${frame === 1 ? 'active' : ''}`} onClick={() => show(1)}>
              Position 2
            </button>
            {demo.approx && <span className="tiny muted">Dessin : {demo.approx}.</span>}
          </div>
        </>
      )}
      {demo && failed && <div className="tiny muted">Dessins indisponibles pour le moment.</div>}

      <span className="bold small">Voir en vidéo</span>
      <div className="video-links">
        {FEMALE_CREATORS.map((c) => (
          <a key={c.name} className="video-link" href={youtubeSearchUrl(exercise.name, c.name)} target="_blank" rel="noopener noreferrer">
            <span className="bold">{c.name}</span>
            <span className="tiny muted">{c.hint}</span>
          </a>
        ))}
      </div>
      <a className="btn ghost small" style={{ alignSelf: 'flex-start' }} href={youtubeSearchUrl(exercise.name)} target="_blank" rel="noopener noreferrer">
        ▶ Autres démonstrations par des femmes
      </a>
      <div className="tiny muted">
        Autres coachs :{' '}
        {OTHER_CREATORS.map((c, i) => (
          <span key={c.name}>
            {i > 0 && ' · '}
            <a href={youtubeSearchUrl(exercise.name, c.name)} target="_blank" rel="noopener noreferrer">
              {c.name}
            </a>
          </span>
        ))}
      </div>
      {demo && !failed && (
        <div className="tiny muted">
          {DEMO_CREDIT} (
          <a href={DEMO_LICENSE_URL} target="_blank" rel="noopener noreferrer">
            conditions
          </a>
          ).
        </div>
      )}
    </div>
  );
}
