/**
 * Démos vidéo : un lien vers la recherche YouTube du nom de l'exercice, sans autre mot-clé.
 * Aucun identifiant de vidéo n'est codé en dur : la recherche reste valable même si une vidéo est supprimée.
 */

/** Nom de l'exercice tel qu'affiché, sans les parenthèses : « Goblet squat (haltère) » → « Goblet squat haltère ». */
export function videoQueryName(exerciseName: string): string {
  return exerciseName.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function videoSearchUrl(exerciseName: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(videoQueryName(exerciseName))}`;
}
