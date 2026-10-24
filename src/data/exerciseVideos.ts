/**
 * Démos vidéo : liens de recherche YouTube. Aucun identifiant de vidéo n'est codé en dur : la recherche
 * « créatrice + exercice » reste valable même si une vidéo est supprimée, mais la créatrice n'a pas forcément
 * une vidéo pour chaque exercice (YouTube affiche alors des vidéos proches).
 *
 * Priorité aux démonstrations par des femmes : créatrices fitness francophones d'abord, puis une recherche
 * générale « exercice femme », puis les coachs proposés au départ.
 */
export interface VideoCreator {
  name: string;
  hint: string;
}

export const FEMALE_CREATORS: VideoCreator[] = [
  { name: 'Sissy Mua', hint: 'fitness, séances à la maison' },
  { name: 'Juju Fitcats', hint: 'fessiers, renforcement à la maison' },
];

export const OTHER_CREATORS: VideoCreator[] = [
  { name: 'Tibo InShape', hint: 'musculation, débutants' },
  { name: 'Nassim Sahili', hint: 'musculation, technique' },
];

/** Nom de l'exercice sans la précision entre parenthèses : « Goblet squat (haltère) » → « Goblet squat ». */
export function videoQueryName(exerciseName: string): string {
  return exerciseName.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
}

/** Recherche ciblée sur une créatrice, ou recherche générale de démonstrations par des femmes. */
export function youtubeSearchUrl(exerciseName: string, creator?: string): string {
  const q = creator ? `${creator} ${videoQueryName(exerciseName)}` : `${videoQueryName(exerciseName)} exercice femme`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}
