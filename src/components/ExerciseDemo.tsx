import { useEffect, useMemo, useState } from 'react';
import { DEMO_CREDIT, DEMO_LICENSE_URL, demoFor } from '../data/exerciseDemos';
import { sceneFor } from '../data/exercisePoses';
import { videoSearchUrl } from '../data/exerciseVideos';
import type { Exercise } from '../types';
import { Mannequin3D } from './Mannequin3D';

/**
 * Démo d'un exercice : les deux positions dessinées en alternance, un bouton « Vue 360° » qui ouvre le
 * mannequin 3D (on tourne autour), puis un lien vers des vidéos. Sans dessin, le mannequin 3D s'affiche directement.
 */
export function ExerciseDemo({ exercise }: { exercise: Exercise }) {
  // Mémorisé : l'écran de séance se redessine toutes les 0,5 s (chrono), ce qui ne doit pas relancer l'animation.
  const demo = useMemo(() => demoFor(exercise.id), [exercise.id]);
  const scene3d = useMemo(() => sceneFor(exercise.id), [exercise.id]);
  const hasDemo = !!demo;
  const [frame, setFrame] = useState(0);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const [view360, setView360] = useState(false);
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const drawings = hasDemo && !failed;
  const show3d = !!scene3d && (view360 || !drawings);

  useEffect(() => {
    if (!hasDemo || paused || reduceMotion || failed || show3d) return;
    const t = window.setInterval(() => setFrame((f) => 1 - f), 1300);
    return () => window.clearInterval(t);
  }, [hasDemo, paused, reduceMotion, failed, show3d]);

  // Exercice remplacé pendant la séance : on repart de la position de repos, en dessin.
  useEffect(() => {
    setFrame(0);
    setFailed(false);
    setView360(false);
  }, [exercise.id]);

  const show = (f: number) => {
    setPaused(true);
    setFrame(f);
  };

  return (
    <div className="col" style={{ gap: 10 }}>
      {drawings && !show3d && (
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
      {hasDemo && failed && <div className="tiny muted">Dessins indisponibles pour le moment.</div>}

      {show3d && scene3d && <Mannequin3D key={exercise.id} ex={scene3d} />}

      <div className="row wrap" style={{ gap: 8 }}>
        {drawings && scene3d && (
          <button type="button" className="btn secondary small" onClick={() => setView360((v) => !v)}>
            {view360 ? '← Revenir au dessin' : '⟳ Vue 360°'}
          </button>
        )}
        <a className="btn secondary small" href={videoSearchUrl(exercise.name)} target="_blank" rel="noopener noreferrer">
          ▶ Voir des vidéos de l'exercice
        </a>
      </div>
      {drawings && !show3d && (
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
