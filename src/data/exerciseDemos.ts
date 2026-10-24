/**
 * Photos de démonstration (position de départ et d'arrivée) issues de free-exercise-db
 * (https://github.com/yuhonas/free-exercise-db), jeu de données publié sous licence
 * Unlicense (domaine public déclaré par son auteur). Les images ne sont pas copiées dans
 * l'application : elles sont chargées depuis le dépôt d'origine, figé sur une version précise.
 *
 * Chaque correspondance a été vérifiée visuellement. `approx` signale une démo du même
 * mouvement avec un matériel différent ; les exercices sans photo fiable n'ont pas d'entrée
 * (seule la recherche vidéo est alors proposée).
 */
const COMMIT = 'f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5';
const BASE = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${COMMIT}/exercises/`;

interface DemoRef {
  id: string;
  approx?: string;
}

const DEMOS: Record<string, DemoRef> = {
  'box-squat': { id: 'Bodyweight_Squat', approx: 'squat sans chaise' },
  'bw-squat': { id: 'Bodyweight_Squat' },
  'goblet-squat': { id: 'Goblet_Squat', approx: 'avec une kettlebell' },
  'kb-goblet-squat': { id: 'Goblet_Squat' },
  'sumo-squat': { id: 'Plie_Dumbbell_Squat' },
  'band-squat': { id: 'Squats_-_With_Bands' },
  'leg-press': { id: 'Leg_Press' },
  'back-squat': { id: 'Barbell_Full_Squat' },
  'db-rdl': { id: 'Stiff-Legged_Dumbbell_Deadlift' },
  'kb-swing': { id: 'One-Arm_Kettlebell_Swings', approx: 'swing à une main' },
  'band-good-morning': { id: 'Band_Good_Morning' },
  'sl-rdl': { id: 'Kettlebell_One-Legged_Deadlift', approx: 'avec une kettlebell' },
  'barbell-rdl': { id: 'Romanian_Deadlift' },
  'leg-curl': { id: 'Lying_Leg_Curls' },
  superman: { id: 'Superman' },
  'reverse-lunge': { id: 'Dumbbell_Rear_Lunge', approx: 'avec haltères' },
  'db-reverse-lunge': { id: 'Dumbbell_Rear_Lunge' },
  'split-squat': { id: 'Split_Squats' },
  'step-up': { id: 'Dumbbell_Step_Ups', approx: 'avec haltères' },
  'bulgarian-split-squat': { id: 'Split_Squat_with_Dumbbells', approx: 'avec haltères' },
  'db-bulgarian-split-squat': { id: 'Split_Squat_with_Dumbbells' },
  'walking-lunge': { id: 'Dumbbell_Lunges' },
  'lateral-lunge': { id: 'Barbell_Side_Split_Squat', approx: 'avec une barre' },
  'glute-bridge': { id: 'Butt_Lift_Bridge' },
  'sl-glute-bridge': { id: 'Single_Leg_Glute_Bridge' },
  'db-hip-thrust': { id: 'Barbell_Hip_Thrust', approx: 'avec une barre' },
  'barbell-hip-thrust': { id: 'Barbell_Hip_Thrust' },
  'donkey-kick': { id: 'Glute_Kickback' },
  'band-kickback': { id: 'One-Legged_Cable_Kickback', approx: 'à la poulie' },
  'cable-kickback': { id: 'One-Legged_Cable_Kickback' },
  'abductor-machine': { id: 'Thigh_Abductor' },
  'incline-pushup': { id: 'Incline_Push-Up' },
  pushup: { id: 'Pushups' },
  'db-floor-press': { id: 'Dumbbell_Floor_Press' },
  'db-bench-press': { id: 'Dumbbell_Bench_Press' },
  'band-chest-press': { id: 'Standing_Cable_Chest_Press', approx: 'à la poulie' },
  'machine-chest-press': { id: 'Leverage_Chest_Press' },
  'db-shoulder-press': { id: 'Dumbbell_Shoulder_Press' },
  'band-shoulder-press': { id: 'Shoulder_Press_-_With_Bands' },
  'machine-shoulder-press': { id: 'Leverage_Shoulder_Press' },
  'db-row': { id: 'One-Arm_Dumbbell_Row' },
  'kb-row': { id: 'Alternating_Kettlebell_Row', approx: 'avec deux kettlebells' },
  'band-row': { id: 'Seated_Cable_Rows', approx: 'à la poulie' },
  'cable-row': { id: 'Seated_Cable_Rows' },
  'lat-pulldown': { id: 'Wide-Grip_Lat_Pulldown' },
  'band-pulldown': { id: 'Wide-Grip_Lat_Pulldown', approx: 'à la poulie' },
  'negative-pullup': { id: 'Pullups', approx: 'traction complète ; en négatif, seule la descente compte' },
  'band-assisted-pullup': { id: 'Band_Assisted_Pull-Up' },
  pullup: { id: 'Pullups' },
  plank: { id: 'Plank' },
  'side-plank': { id: 'Side_Bridge' },
  'dead-bug': { id: 'Dead_Bug' },
  crunch: { id: 'Crunches' },
  'reverse-crunch': { id: 'Reverse_Crunch' },
  'pallof-press': { id: 'Pallof_Press', approx: 'à la poulie' },
  'leg-raise': { id: 'Flat_Bench_Lying_Leg_Raise', approx: 'sur un banc' },
  'russian-twist': { id: 'Russian_Twist', approx: 'avec un disque' },
  'db-curl': { id: 'Dumbbell_Bicep_Curl' },
  'hammer-curl': { id: 'Hammer_Curls' },
  'cable-curl': { id: 'Standing_Biceps_Cable_Curl' },
  'bench-dip': { id: 'Bench_Dips', approx: 'pieds surélevés (plus difficile)' },
  'db-overhead-extension': { id: 'Standing_Dumbbell_Triceps_Extension' },
  'db-kickback': { id: 'Tricep_Dumbbell_Kickback' },
  'band-pushdown': { id: 'Triceps_Pushdown', approx: 'à la poulie' },
  'cable-pushdown': { id: 'Triceps_Pushdown' },
  'db-lateral-raise': { id: 'Side_Lateral_Raise' },
  'band-lateral-raise': { id: 'Lateral_Raise_-_With_Bands' },
  'band-pull-apart': { id: 'Band_Pull_Apart' },
  'face-pull': { id: 'Face_Pull' },
  'squat-jump': { id: 'Freehand_Jump_Squat' },
};

export interface ExerciseDemo {
  images: [string, string];
  approx?: string;
}

export function demoFor(exerciseId: string): ExerciseDemo | undefined {
  const d = DEMOS[exerciseId];
  if (!d) return undefined;
  return { images: [`${BASE}${d.id}/0.jpg`, `${BASE}${d.id}/1.jpg`], approx: d.approx };
}

/** Recherche vidéo YouTube (lien externe, aucune vidéo n'est choisie à l'avance). */
export function videoSearchUrl(exerciseName: string): string {
  const name = exerciseName.replace(/[()]/g, '');
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} exercice technique`)}`;
}

export const DEMO_EXERCISE_IDS = Object.keys(DEMOS);
