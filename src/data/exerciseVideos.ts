/**
 * Démos vidéo : liens de recherche YouTube ciblant des créateurs fitness francophones de
 * référence. Aucun identifiant de vidéo n'est codé en dur : la recherche « créateur + exercice »
 * reste valable même si une vidéo est supprimée, mais le créateur n'a pas forcément une vidéo
 * pour chaque exercice (YouTube affiche alors des vidéos proches).
 */
export const VIDEO_CREATORS: { name: string; hint: string }[] = [
  { name: 'Nassim Sahili', hint: 'musculation, technique' },
  { name: 'Tibo InShape', hint: 'musculation, débutants' },
  { name: 'Sissy Mua', hint: 'fitness, séances à la maison' },
  { name: 'Juju Fitcats', hint: 'fitness, fessiers, à la maison' },
];

/** Nom de l'exercice sans la précision entre parenthèses : « Goblet squat (haltère) » → « Goblet squat ». */
export function videoQueryName(exerciseName: string): string {
  return exerciseName.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
}

export function youtubeSearchUrl(exerciseName: string, creator?: string): string {
  const q = [creator, videoQueryName(exerciseName), creator ? '' : 'exercice technique'].filter(Boolean).join(' ');
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}
