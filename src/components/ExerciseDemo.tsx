import { VIDEO_CREATORS, youtubeSearchUrl } from '../data/exerciseVideos';
import type { Exercise } from '../types';

/** Démo d'un exercice : liens vers des vidéos YouTube de créateurs fitness de référence. */
export function ExerciseDemo({ exercise }: { exercise: Exercise }) {
  return (
    <div className="col" style={{ gap: 8 }}>
      <span className="bold small">▶ Voir la démo en vidéo</span>
      <div className="video-links">
        {VIDEO_CREATORS.map((c) => (
          <a key={c.name} className="video-link" href={youtubeSearchUrl(exercise.name, c.name)} target="_blank" rel="noopener noreferrer">
            <span className="bold">{c.name}</span>
            <span className="tiny muted">{c.hint}</span>
          </a>
        ))}
      </div>
      <a className="tiny" href={youtubeSearchUrl(exercise.name)} target="_blank" rel="noopener noreferrer">
        Toutes les vidéos sur cet exercice
      </a>
      <span className="tiny muted">Ouvre YouTube sur les résultats de recherche : si le créateur n'a pas de vidéo sur cet exercice, des vidéos proches s'affichent.</span>
    </div>
  );
}
