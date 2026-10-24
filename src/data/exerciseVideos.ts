/**
 * Démos vidéo : liens de recherche YouTube. Aucun identifiant de vidéo n'est codé en dur : une recherche
 * reste valable même si une vidéo est supprimée. L'interface n'affiche aucun nom de créatrice ou de créateur,
 * seulement « Vidéo 1 », « Vidéo 2 »… ; les recherches privilégient des démonstrations faites par des femmes.
 */

/** Préfixes de recherche, dans l'ordre d'affichage (chaîne vide = recherche générale « exercice femme »). */
const VIDEO_SOURCES = ['Sissy Mua', 'Juju Fitcats', '', 'Tibo InShape', 'Nassim Sahili'];

/** Nom de l'exercice sans la précision entre parenthèses : « Goblet squat (haltère) » → « Goblet squat ». */
export function videoQueryName(exerciseName: string): string {
  return exerciseName.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
}

function searchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export interface VideoLink {
  label: string;
  url: string;
}

export function videoLinksFor(exerciseName: string): VideoLink[] {
  const name = videoQueryName(exerciseName);
  return VIDEO_SOURCES.map((source, i) => ({
    label: `Vidéo ${i + 1}`,
    url: searchUrl(source ? `${source} ${name}` : `${name} exercice femme`),
  }));
}
