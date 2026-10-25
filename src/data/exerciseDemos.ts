/**
 * Démos dessinées : en général deux dessins par exercice (les deux positions extrêmes du mouvement), affichés en
 * alternance. L'ordre des deux dessins n'est pas toujours départ puis arrivée : l'interface les nomme « Position 1 »
 * et « Position 2 ». Quelques exercices n'ont qu'un dessin (`single`) : exercice tenu, ou pas de seconde position
 * cohérente dans la source.
 *
 * Sources, toutes deux sous licence Creative Commons Attribution - Partage dans les mêmes conditions 4.0
 * (CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/deed.fr) :
 * - Everkinetic (https://github.com/everkinetic/data), dessins de Greg Priday : rendus depuis les SVG d'origine
 *   (certains PNG fournis étaient coupés), recadrés et redimensionnés (640 px).
 * - Workout Guide (https://github.com/bryllim/workout-guide), images de Bryl Lim (`source: 'wg'`) : encre passée en
 *   noir sur blanc, contours doublés fusionnés, traits harmonisés entre les deux positions, recadrées (640 px).
 *   L'auteur ne précise pas comment ces images ont été réalisées ; une ou deux des trois images fournies par
 *   exercice ont été retenues (les autres étaient incohérentes ou montraient un autre mouvement).
 * Détail des modifications : public/demos/LICENCE.txt.
 *
 * Chaque correspondance a été vérifiée visuellement ; `approx` signale un dessin du même mouvement avec un
 * matériel ou une position un peu différents. Les exercices sans dessin fiable n'ont pas d'entrée : seuls les
 * liens vidéo sont proposés.
 */
interface DemoRef {
  /** Fichiers demos/<file>-1.png et demos/<file>-2.png (un seul dessin : demos/<file>-1.png). */
  file: string;
  approx?: string;
  /** Source : Everkinetic par défaut, 'wg' pour Workout Guide. */
  source?: 'wg';
  /** Un seul dessin. */
  single?: true;
}

const DEMOS: Record<string, DemoRef> = {
  'abductor-machine': { file: '0156' }, // thigh-abductor
  'assisted-pullup-machine': { file: '0087', approx: 'sans assistance' }, // pull-ups
  'back-squat': { file: '0160', approx: 'pieds écartés' }, // wide-stance-squat-with-barbell
  'band-assisted-pullup': { file: '0087', approx: 'sans élastique' }, // pull-ups
  'band-curl': { file: '0261' }, // quick-alternating-biceps-curls-with-band
  'band-good-morning': { file: '0101', approx: 'avec une barre' }, // barbell-good-mornings
  'band-hip-abduction': { file: 'wg-banded-seated-hip-abduction', source: 'wg' }, // Workout Guide banded-seated-hip-abduction, images 3 et 1
  'band-kickback': { file: '0112', approx: 'à la poulie' }, // one-legged-cable-kickback
  'band-lateral-raise': { file: '0018', approx: 'avec haltères' }, // lateral-dumbbell-raises
  'band-pull-apart': { file: '0020', approx: 'un bras à la fois' }, // back-flys-exercise-band
  'band-pulldown': { file: '0096', approx: 'à la poulie' }, // v-bar-pull-down
  'band-pushdown': { file: '0205', approx: 'à la poulie' }, // triceps-pushdown-with-cable
  'band-row': { file: '0025', approx: 'à la poulie' }, // seated-cable-rows
  'band-shoulder-press': { file: 'wg-standing-dumbbell-press', approx: 'avec haltères', source: 'wg' }, // Workout Guide standing-dumbbell-press, images 3 et 1
  'band-squat': { file: '0155' }, // squats-with-exercise-bands
  'barbell-hip-thrust': { file: 'wg-hip-thrust', source: 'wg' }, // Workout Guide hip-thrust, images 3 et 1
  'barbell-rdl': { file: '0118' }, // romanian-dead-lift
  'bench-dip': { file: '0162', approx: 'pieds surélevés (plus difficile)' }, // bench-dips
  'bird-dog': { file: 'wg-bird-dog', source: 'wg', single: true }, // Workout Guide bird-dog, image 1
  'box-squat': { file: '0136', approx: 'avec haltères, sur un banc' }, // squat-to-bench-with-dumbbells
  'bulgarian-split-squat': { file: '0147', approx: 'avec une barre' }, // one-leg-squat-with-barbell
  burpee: { file: 'wg-burpee', approx: 'l\'étape accroupie n\'est pas dessinée', source: 'wg' }, // Workout Guide burpee, images 1 et 3
  'bw-squat': { file: '0160', approx: 'avec une barre' }, // wide-stance-squat-with-barbell
  'cable-curl': { file: '0212' }, // standing-biceps-curl-with-cable
  'cable-kickback': { file: '0112' }, // one-legged-cable-kickback
  'cable-pushdown': { file: '0205' }, // triceps-pushdown-with-cable
  'cable-row': { file: '0025' }, // seated-cable-rows
  'calf-raise': { file: '0281', approx: 'avec une barre' }, // standing-barbell-calf-raise
  clamshell: { file: 'wg-clamshell', approx: 'avec mini-band', source: 'wg' }, // Workout Guide clamshell, images 3 et 1
  crunch: { file: '0291', approx: 'pieds posés sur un banc' }, // crunches
  'curtsy-lunge': { file: 'wg-curtsy-lunge', source: 'wg' }, // Workout Guide curtsy-lunge, images 3 et 1
  'db-bench-press': { file: '0055' }, // bench-press-dumbbell
  'db-bulgarian-split-squat': { file: '0147', approx: 'avec une barre' }, // one-leg-squat-with-barbell
  'db-curl': { file: '0224' }, // biceps-curl-with-dumbbell
  'db-floor-press': { file: '0055', approx: 'sur un banc' }, // bench-press-dumbbell
  'db-hip-thrust': { file: 'wg-dumbbell-hip-thrust', source: 'wg' }, // Workout Guide dumbbell-hip-thrust, images 3 et 1
  'db-kickback': { file: '0204' }, // triceps-kickback-with-dumbbell
  'db-lateral-raise': { file: '0018' }, // lateral-dumbbell-raises
  'db-overhead-extension': { file: '0194', approx: 'assise' }, // seated-triceps-press-with-dumbbell
  'db-rdl': { file: '0107' }, // dumbbell-dead-lifts
  'db-reverse-lunge': { file: '0129' }, // rear-lunges-with-dumbbell
  'db-row': { file: '0024' }, // rear-deltoid-row-dumbbell
  'db-shoulder-press': { file: '0038', approx: 'un bras à la fois' }, // one-arm-dumbbell-shoulder-press
  'dead-bug': { file: 'wg-dead-bug', source: 'wg' }, // Workout Guide dead-bug, images 3 et 1
  'donkey-kick': { file: 'wg-donkey-kick', source: 'wg' }, // Workout Guide donkey-kick, images 3 et 1
  'face-pull': { file: 'wg-face-pull', source: 'wg' }, // Workout Guide face-pull, images 3 et 1
  'glute-bridge': { file: '0109' }, // bridging
  'goblet-squat': { file: '0152', approx: 'haltère tenu bras tendus, pieds écartés' }, // pile-squat-with-dumbbell
  'hammer-curl': { file: '0227' }, // biceps-hammer-curl-with-dumbbell
  'hollow-hold': { file: 'wg-hollow-body-hold', source: 'wg', single: true }, // Workout Guide hollow-body-hold, image 1
  'incline-pushup': { file: 'wg-incline-push-up', source: 'wg' }, // Workout Guide incline-push-up, images 1 et 3
  'jumping-jacks': { file: 'wg-jumping-jack', source: 'wg' }, // Workout Guide jumping-jack, images 3 et 1
  'kb-deadlift': { file: '0107', approx: 'avec haltères' }, // dumbbell-dead-lifts
  'kb-goblet-squat': { file: '0152', approx: 'avec un haltère, pieds écartés' }, // pile-squat-with-dumbbell
  'kb-row': { file: '0024', approx: 'avec un haltère' }, // rear-deltoid-row-dumbbell
  'kb-swing': { file: 'wg-kettlebell-swing', source: 'wg' }, // Workout Guide kettlebell-swing, images 3 et 1
  'kb-swing-cardio': { file: 'wg-kettlebell-swing', source: 'wg' }, // Workout Guide kettlebell-swing, images 3 et 1
  'knee-pushup': { file: 'wg-knee-push-up', source: 'wg' }, // Workout Guide knee-push-up, images 3 et 1
  'lat-pulldown': { file: '0096', approx: 'prise serrée' }, // v-bar-pull-down
  'lateral-lunge': { file: '0131', approx: 'avec une barre' }, // side-squats-with-barbell
  'leg-curl': { file: '0117' }, // lying-leg-curl-machine
  'leg-press': { file: '0127' }, // leg-press
  'leg-raise': { file: '0021' }, // flat-bench-leg-raises
  'machine-chest-press': { file: '0066' }, // machine-bench-press
  'machine-shoulder-press': { file: '0004', approx: 'avec une barre' }, // seated-military-press
  'march-high-knees': { file: 'wg-high-knees', source: 'wg', single: true }, // Workout Guide high-knees, image 1
  'mountain-climber': { file: 'wg-mountain-climber', source: 'wg' }, // Workout Guide mountain-climber, images 2 et 1
  'negative-pullup': { file: '0087', approx: 'traction complète ; en négatif, seule la descente compte' }, // pull-ups
  'pallof-press': { file: 'wg-banded-pallof-press', source: 'wg' }, // Workout Guide banded-pallof-press, images 2 et 1
  'pike-pushup': { file: 'wg-pike-push-up', source: 'wg' }, // Workout Guide pike-push-up, images 3 et 1
  plank: { file: 'wg-plank', source: 'wg', single: true }, // Workout Guide plank, image 1
  'prone-ytw': { file: 'wg-prone-y-raise', approx: 'positions Y et T (le W n\'est pas dessiné)', source: 'wg' }, // Workout Guide prone-y-raise, images 1 et 2
  pullup: { file: '0087' }, // pull-ups
  pushup: { file: '0077' }, // push-ups
  'reverse-crunch': { file: '0287' }, // bent-knee-hip-raise
  'reverse-lunge': { file: '0129', approx: 'avec haltères' }, // rear-lunges-with-dumbbell
  'russian-twist': { file: 'wg-russian-twist', approx: 'avec un médecine-ball', source: 'wg' }, // Workout Guide russian-twist, images 1 et 3
  'side-plank': { file: '0113', approx: 'sur la main' }, // side-plank
  skater: { file: 'wg-skater-hop', source: 'wg' }, // Workout Guide skater-hop, images 1 et 3
  'sl-glute-bridge': { file: 'wg-single-leg-glute-bridge', source: 'wg' }, // Workout Guide single-leg-glute-bridge, images 3 et 1
  'sl-rdl': { file: 'wg-single-leg-romanian-deadlift', approx: 'avec haltères', source: 'wg', single: true }, // Workout Guide single-leg-romanian-deadlift, image 1
  'split-squat': { file: '0115', approx: 'avec haltères' }, // dumbbell-lunges
  'squat-jump': { file: 'wg-jump-squat', source: 'wg' }, // Workout Guide jump-squat, images 3 et 1
  'step-jacks': { file: 'wg-jumping-jack', approx: 'avec saut (sans saut : une jambe après l\'autre)', source: 'wg' }, // Workout Guide jumping-jack, images 3 et 1
  'step-up': { file: '0137', approx: 'avec haltères' }, // step-ups-with-dumbbells
  'sumo-squat': { file: '0152' }, // pile-squat-with-dumbbell
  superman: { file: '0105' }, // supermans
  'walking-lunge': { file: '0121' }, // walking-lunges
  'wall-sit': { file: 'wg-wall-sit', source: 'wg', single: true }, // Workout Guide wall-sit, image 1
};

export const DEMO_LICENSE_URL = 'https://creativecommons.org/licenses/by-sa/4.0/deed.fr';
const CREDITS = {
  ek: 'Dessins : Everkinetic (Greg Priday), licence CC BY-SA 4.0',
  wg: 'Dessins : Workout Guide (Bryl Lim), licence CC BY-SA 4.0, modifiés',
};

export interface ExerciseDemo {
  /** Un ou deux dessins. */
  images: string[];
  approx?: string;
  credit: string;
}

export function demoFor(exerciseId: string): ExerciseDemo | undefined {
  const d = DEMOS[exerciseId];
  if (!d) return undefined;
  const base = import.meta.env.BASE_URL + 'demos/' + d.file;
  return {
    images: d.single ? [base + '-1.png'] : [base + '-1.png', base + '-2.png'],
    approx: d.approx,
    credit: CREDITS[d.source ?? 'ek'],
  };
}

/** Exercice → fichiers de dessin dans public/demos (utilisé par les tests). */
export const DEMO_FILES: Record<string, string[]> = Object.fromEntries(
  Object.entries(DEMOS).map(([k, v]) => [k, v.single ? [v.file + '-1.png'] : [v.file + '-1.png', v.file + '-2.png']]),
);
