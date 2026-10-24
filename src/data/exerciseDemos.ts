/**
 * Démos dessinées : deux dessins par exercice (les deux positions extrêmes du mouvement), affichés en alternance.
 * L'ordre des deux dessins n'est pas toujours départ puis arrivée : l'interface les nomme « Position 1 » et « Position 2 ».
 *
 * Dessins : Everkinetic (https://github.com/everkinetic/data), créés par Greg Priday, publiés sous licence
 * Creative Commons Attribution - Partage dans les mêmes conditions 4.0 (CC BY-SA 4.0,
 * https://creativecommons.org/licenses/by-sa/4.0/deed.fr). Les fichiers de public/demos sont ces dessins rendus
 * depuis les SVG d'origine (certains PNG fournis étaient coupés), recadrés et redimensionnés (640 px).
 *
 * Tous les exercices ont aussi une démo 3D (vue 360°) : voir exercisePoses.ts.
 *
 * Chaque correspondance a été vérifiée visuellement ; `approx` signale un dessin du même mouvement avec un
 * matériel ou une position un peu différents. Les exercices sans dessin fiable n'ont pas d'entrée : la démo 3D
 * s'affiche alors directement.
 */
interface DemoRef {
  /** Identifiant Everkinetic : fichiers demos/<file>-1.png et demos/<file>-2.png */
  file: string;
  approx?: string;
}

const DEMOS: Record<string, DemoRef> = {
  'abductor-machine': { file: '0156' }, // thigh-abductor
  'assisted-pullup-machine': { file: '0087', approx: 'sans assistance' }, // pull-ups
  'back-squat': { file: '0160', approx: 'pieds écartés' }, // wide-stance-squat-with-barbell
  'band-assisted-pullup': { file: '0087', approx: 'sans élastique' }, // pull-ups
  'band-curl': { file: '0261' }, // quick-alternating-biceps-curls-with-band
  'band-good-morning': { file: '0101', approx: 'avec une barre' }, // barbell-good-mornings
  'band-kickback': { file: '0112', approx: 'à la poulie' }, // one-legged-cable-kickback
  'band-lateral-raise': { file: '0018', approx: 'avec haltères' }, // lateral-dumbbell-raises
  'band-pull-apart': { file: '0020', approx: 'un bras à la fois' }, // back-flys-exercise-band
  'band-pulldown': { file: '0096', approx: 'à la poulie' }, // v-bar-pull-down
  'band-pushdown': { file: '0205', approx: 'à la poulie' }, // triceps-pushdown-with-cable
  'band-row': { file: '0025', approx: 'à la poulie' }, // seated-cable-rows
  'barbell-rdl': { file: '0118' }, // romanian-dead-lift
  'bench-dip': { file: '0162', approx: 'pieds surélevés (plus difficile)' }, // bench-dips
  'box-squat': { file: '0136', approx: 'avec haltères, sur un banc' }, // squat-to-bench-with-dumbbells
  'bulgarian-split-squat': { file: '0147', approx: 'avec une barre' }, // one-leg-squat-with-barbell
  'bw-squat': { file: '0160', approx: 'avec une barre' }, // wide-stance-squat-with-barbell
  'cable-curl': { file: '0212' }, // standing-biceps-curl-with-cable
  'cable-kickback': { file: '0112' }, // one-legged-cable-kickback
  'cable-pushdown': { file: '0205' }, // triceps-pushdown-with-cable
  'cable-row': { file: '0025' }, // seated-cable-rows
  crunch: { file: '0291', approx: 'pieds posés sur un banc' }, // crunches
  'db-bench-press': { file: '0055' }, // bench-press-dumbbell
  'db-bulgarian-split-squat': { file: '0147', approx: 'avec une barre' }, // one-leg-squat-with-barbell
  'db-curl': { file: '0224' }, // biceps-curl-with-dumbbell
  'db-floor-press': { file: '0055', approx: 'sur un banc' }, // bench-press-dumbbell
  'db-kickback': { file: '0204' }, // triceps-kickback-with-dumbbell
  'db-lateral-raise': { file: '0018' }, // lateral-dumbbell-raises
  'db-overhead-extension': { file: '0194', approx: 'assise' }, // seated-triceps-press-with-dumbbell
  'db-rdl': { file: '0107' }, // dumbbell-dead-lifts
  'db-reverse-lunge': { file: '0129' }, // rear-lunges-with-dumbbell
  'db-row': { file: '0024' }, // rear-deltoid-row-dumbbell
  'db-shoulder-press': { file: '0038', approx: 'un bras à la fois' }, // one-arm-dumbbell-shoulder-press
  'glute-bridge': { file: '0109' }, // bridging
  'goblet-squat': { file: '0152', approx: 'haltère tenu bras tendus, pieds écartés' }, // pile-squat-with-dumbbell
  'hammer-curl': { file: '0227' }, // biceps-hammer-curl-with-dumbbell
  'kb-deadlift': { file: '0107', approx: 'avec haltères' }, // dumbbell-dead-lifts
  'kb-goblet-squat': { file: '0152', approx: 'avec un haltère, pieds écartés' }, // pile-squat-with-dumbbell
  'kb-row': { file: '0024', approx: 'avec un haltère' }, // rear-deltoid-row-dumbbell
  'lat-pulldown': { file: '0096', approx: 'prise serrée' }, // v-bar-pull-down
  'lateral-lunge': { file: '0131', approx: 'avec une barre' }, // side-squats-with-barbell
  'leg-curl': { file: '0117' }, // lying-leg-curl-machine
  'leg-press': { file: '0127' }, // leg-press
  'leg-raise': { file: '0021' }, // flat-bench-leg-raises
  'machine-chest-press': { file: '0066' }, // machine-bench-press
  'machine-shoulder-press': { file: '0004', approx: 'avec une barre' }, // seated-military-press
  'negative-pullup': { file: '0087', approx: 'traction complète ; en négatif, seule la descente compte' }, // pull-ups
  pullup: { file: '0087' }, // pull-ups
  pushup: { file: '0077' }, // push-ups
  'reverse-crunch': { file: '0287' }, // bent-knee-hip-raise
  'reverse-lunge': { file: '0129', approx: 'avec haltères' }, // rear-lunges-with-dumbbell
  'side-plank': { file: '0113', approx: 'sur la main' }, // side-plank
  'split-squat': { file: '0115', approx: 'avec haltères' }, // dumbbell-lunges
  'step-up': { file: '0137', approx: 'avec haltères' }, // step-ups-with-dumbbells
  'sumo-squat': { file: '0152' }, // pile-squat-with-dumbbell
  superman: { file: '0105' }, // supermans
  'walking-lunge': { file: '0121' }, // walking-lunges
};

export const DEMO_CREDIT = 'Dessins : Everkinetic (Greg Priday), licence CC BY-SA 4.0';
export const DEMO_LICENSE_URL = 'https://creativecommons.org/licenses/by-sa/4.0/deed.fr';

export interface ExerciseDemo {
  images: [string, string];
  approx?: string;
}

export function demoFor(exerciseId: string): ExerciseDemo | undefined {
  const d = DEMOS[exerciseId];
  if (!d) return undefined;
  const base = import.meta.env.BASE_URL + 'demos/' + d.file;
  return { images: [base + '-1.png', base + '-2.png'], approx: d.approx };
}

/** Exercice → identifiant de dessin (utilisé par les tests). */
export const DEMO_FILES: Record<string, string> = Object.fromEntries(Object.entries(DEMOS).map(([k, v]) => [k, v.file]));
