/**
 * Démos 3D : positions du mannequin pour chaque exercice (l'animation boucle d'une position à l'autre).
 *
 * Repère : mètres, la mannequin regarde vers +Z, son côté gauche est en +X, le sol est à y = 0.
 * Bras / jambes : valeurs du côté gauche, symétrisées pour le côté droit (armR / legR s'écrivent aussi
 * « vers l'extérieur = +X »). Angles en degrés : root.pitch > 0 penche vers l'avant (90 = à plat ventre,
 * -90 = sur le dos), flex > 0 lève le membre vers l'avant, abd > 0 l'écarte, knee / elbow > 0 plient.
 * Les cibles `ik` placent poignet / cheville ; `rel: 'chest'` les rend solidaires du buste.
 */
import {
  EQ, MAT, add, box, capsule, cyl, local, lerp3, lowestY, mid, nrm, scl, sub, torus,
  type Body, type ExerciseScene, type LegPose, type Pose, type Pts, type Prim, type Vec3,
} from '../lib/mannequin/core';

// ---------- briques communes ----------
const feet = (x = 0.155, z = 0, yaw = 14, pole: Vec3 = [0.26, 0, 0.97]): LegPose => ({ ik: { to: [x, 0.078, z], pole }, foot: { yaw } });
const ARMS_DOWN = { abd: 7, elbow: 8 };
const dumbbells = (p: Pts): Prim[] => [...EQ.dumbbell(p.gripL, p.handAxisL), ...EQ.dumbbell(p.gripR, p.handAxisR)];
const bandsFromFeet = (p: Pts): Prim[] => [...EQ.band([p.soleL, p.gripL]), ...EQ.band([p.soleR, p.gripR])];
const torsoOf = (b: Body) => b.prims.filter((q) => q.g === 0);
const matUnder = (b: Body, length = 1.8): Prim[] => {
  const c = mid(b.pts.head, mid(b.pts.ankleL, b.pts.ankleR));
  const along = sub(b.pts.head, mid(b.pts.ankleL, b.pts.ankleR));
  return EQ.mat([c[0], 0, c[2]], (Math.atan2(along[0], along[2]) * 180) / Math.PI, length);
};
const ISO = ['Mise en place', 'Maintien'];

// ---------- squats ----------
const boxSquat: ExerciseScene = {
  cam: { yaw: 50, pitch: 12 },
  keys: [
    { root: { pos: [0, 0.888, 0] }, legs: feet(), arms: ARMS_DOWN },
    { root: { pos: [0, 0.545, -0.27], pitch: 40 }, spine: { pitch: 6 }, head: { pitch: -36 }, legs: feet(), arms: { flex: 136, abd: 8, elbow: 4 } },
  ],
  // Chaise juste sous les fessiers en position basse : on l'effleure.
  fixed: ([, b]) => EQ.chair([0, lowestY(torsoOf(b)) + 0.004, mid(b.pts.gluteL, b.pts.gluteR)[2] - 0.04]),
};

const bwSquat: ExerciseScene = {
  cam: { yaw: 45, pitch: 10 },
  keys: [
    { root: { pos: [0, 0.885, 0] }, legs: feet(0.165, 0, 15, [0.3, 0, 0.95]), arms: ARMS_DOWN },
    { root: { pos: [0, 0.5, -0.25], pitch: 42 }, spine: { pitch: 4 }, head: { pitch: -38 }, legs: feet(0.165, 0, 15, [0.3, 0, 0.95]), arms: { flex: 140, abd: 6, elbow: 4 } },
  ],
};

// Haltère tenue verticalement contre la poitrine, mains sous le disque du haut.
const gobletArms = { ik: { to: [0.07, 0.0, 0.19] as Vec3, pole: [0.3, -1, 0.1] as Vec3, rel: 'chest' as const }, hand: 'fist' as const };
const gobletKeys = (): Pose[] => [
  { root: { pos: [0, 0.885, 0] }, legs: feet(0.16, 0, 15, [0.3, 0, 0.95]), arms: gobletArms },
  { root: { pos: [0, 0.5, -0.2], pitch: 25 }, head: { pitch: -20 }, legs: feet(0.16, 0, 15, [0.3, 0, 0.95]), arms: gobletArms },
];
const gobletSquat: ExerciseScene = {
  cam: { yaw: 25, pitch: 10 },
  keys: gobletKeys(),
  held: (p) => EQ.dumbbell(add(mid(p.gripL, p.gripR), scl(p.chestY, -0.075)), p.chestY, 1.15),
};
const kbGobletSquat: ExerciseScene = {
  cam: { yaw: 25, pitch: 10 },
  keys: gobletKeys(),
  held: (p) => EQ.kettlebell(add(mid(p.gripL, p.gripR), scl(p.chestY, 0.03)), p.chestY, p.chestX),
};

const sumoArms = { ik: { to: [0.035, -0.36, 0.13] as Vec3, pole: [0.5, 0, -1] as Vec3, rel: 'chest' as const }, hand: 'fist' as const };
const sumoSquat: ExerciseScene = {
  cam: { yaw: 20, pitch: 10 },
  keys: [
    { root: { pos: [0, 0.85, 0] }, legs: feet(0.3, 0, 35, [0.8, 0, 0.6]), arms: sumoArms },
    { root: { pos: [0, 0.56, -0.08], pitch: 15 }, head: { pitch: -10 }, legs: feet(0.3, 0, 35, [0.8, 0, 0.6]), arms: sumoArms },
  ],
  held: (p) => EQ.dumbbell(add(mid(p.gripL, p.gripR), [0, -0.13, 0]), [0, 1, 0], 1.15),
};

const rackArms = { ik: { to: [0.2, 0.14, 0.08] as Vec3, pole: [0.3, -1, 0.2] as Vec3, rel: 'chest' as const }, hand: 'fist' as const };
const bandSquat: ExerciseScene = {
  cam: { yaw: 35, pitch: 10 },
  keys: [
    { root: { pos: [0, 0.885, 0] }, legs: feet(0.15, 0, 12, [0.3, 0, 0.95]), arms: rackArms },
    { root: { pos: [0, 0.52, -0.24], pitch: 35 }, head: { pitch: -30 }, legs: feet(0.15, 0, 12, [0.3, 0, 0.95]), arms: rackArms },
  ],
  held: bandsFromFeet,
};

// Presse à cuisses inclinée à 45° : le chariot glisse selon SLED.
const SLED: Vec3 = [0, Math.SQRT1_2, Math.SQRT1_2];
const pressFoot = { yaw: 10, pitch: 135 };
const legPress: ExerciseScene = {
  cam: { yaw: 75, pitch: 14 },
  keys: [
    { root: { pos: [0, 0.5, -0.35], pitch: -50 }, head: { pitch: 25 }, legs: { ik: { to: [0.14, 0.93, 0.3], pole: [0.2, 0.6, 0.8] }, foot: pressFoot },
      arms: { ik: { to: [0.26, 0.02, 0.08], pole: [1, 0, -0.3], rel: 'pelvis' }, hand: 'fist' } },
    { root: { pos: [0, 0.5, -0.35], pitch: -50 }, head: { pitch: 25 }, legs: { ik: { to: [0.14, 0.732, 0.102], pole: [0.2, 0.6, 0.8] }, foot: pressFoot },
      arms: { ik: { to: [0.26, 0.02, 0.08], pole: [1, 0, -0.3], rel: 'pelvis' }, hand: 'fist' } },
  ],
  fixed: ([a]) => {
    const p = a.pts;
    const back = add(mid(p.chest, p.pelvis), scl(p.chestZ, -0.15));
    return [
      box([0, 0.03, 0.0], [0.18, 0.03, 0.75], MAT.frame),
      box([0, 0.2, -0.35], [0.06, 0.18, 0.06], MAT.frame),
      box(add(p.pelvis, [0, -0.15, 0.04]), [0.24, 0.035, 0.22], MAT.pad, 0, -12, 0.02),
      box(back, [0.24, 0.34, 0.04], MAT.pad, 0, -50, 0.03),
      ...[1, -1].map((s) => capsule([s * 0.33, 0.45, -0.02], [s * 0.33, 1.12, 0.65], 0.025, MAT.frame)),
      ...[1, -1].map((s) => box([s * 0.33, 0.24, 0.3], [0.03, 0.24, 0.03], MAT.frame)),
      ...[1, -1].map((s) => capsule([s * 0.3, p.pelvis[1] - 0.12, p.pelvis[2] + 0.06], [s * 0.3, p.pelvis[1] + 0.02, p.pelvis[2] + 0.06], 0.018, MAT.rubber)),
    ];
  },
  held: (p) => [box(add(mid(p.soleL, p.soleR), add(scl(SLED, 0.035), [0, 0.06, -0.06])), [0.34, 0.3, 0.02], MAT.frame, 0, -45, 0.015)],
};

const backSquatArms = { ik: { to: [0.4, 0.12, -0.1] as Vec3, pole: [0.2, -1, -0.5] as Vec3, rel: 'chest' as const }, hand: 'fist' as const };
const backSquat: ExerciseScene = {
  cam: { yaw: 40, pitch: 10 },
  keys: [
    { root: { pos: [0, 0.885, 0] }, legs: feet(0.17, 0, 15, [0.3, 0, 0.95]), arms: backSquatArms },
    { root: { pos: [0, 0.53, -0.27], pitch: 38 }, head: { pitch: -30 }, legs: feet(0.17, 0, 15, [0.3, 0, 0.95]), arms: backSquatArms },
  ],
  // Barre posée sur les trapèzes, derrière la nuque.
  held: (p) => EQ.barbell(local(p, 'chest', [0, 0.16, -0.11]), p.chestX),
};

const wallSit: ExerciseScene = {
  cam: { yaw: 70, pitch: 10 },
  labels: ISO,
  holds: [0.5, 1.6],
  keys: [
    { root: { pos: [0, 0.765, -0.05] }, legs: { ik: { to: [0.13, 0.078, 0.36] }, foot: { yaw: 8 } }, arms: ARMS_DOWN },
    { root: { pos: [0, 0.488, -0.05] }, legs: { ik: { to: [0.13, 0.078, 0.36] }, foot: { yaw: 8 } }, arms: ARMS_DOWN },
  ],
  fixed: () => EQ.wall(0, -0.205),
};

// ---------- charnière de hanche ----------
const rdlFeet = feet(0.12, 0, 8, [0.1, 0, 1]);
const dbRdl: ExerciseScene = {
  cam: { yaw: 75, pitch: 8 },
  keys: [
    { root: { pos: [0, 0.885, 0] }, legs: rdlFeet, arms: { flex: 8, abd: -3, elbow: 5, twist: 90, hand: 'fist' } },
    { root: { pos: [0, 0.82, -0.3], pitch: 60 }, head: { pitch: -10 }, legs: rdlFeet, arms: { flex: 52, abd: -2, elbow: 5, twist: 90, hand: 'fist' } },
  ],
  held: dumbbells,
};

const kbFeet = feet(0.19, 0, 15, [0.35, 0, 0.94]);
const kbHand = { hand: 'fist' as const, palm: { fingers: [0, -1, 0.1] as Vec3, width: [1, 0, 0] as Vec3 } };
const kbDeadlift: ExerciseScene = {
  cam: { yaw: 60, pitch: 10 },
  keys: [
    { root: { pos: [0, 0.52, -0.25], pitch: 55 }, head: { pitch: -25 }, legs: kbFeet, arms: { ik: { to: [0.045, 0.29, 0.03], pole: [0.3, 0, -1] }, ...kbHand } },
    { root: { pos: [0, 0.88, 0] }, legs: kbFeet, arms: { ik: { to: [0.045, 0.7, 0.07], pole: [0.3, 0, -1] }, ...kbHand } },
  ],
  held: (p) => EQ.kettlebell(mid(p.gripL, p.gripR), [0, 1, 0], [1, 0, 0]),
};

const kbSwing: ExerciseScene = {
  cam: { yaw: 70, pitch: 10 },
  holds: [0.15, 0.25],
  move: 0.6,
  keys: [
    { root: { pos: [0, 0.8, -0.24], pitch: 62 }, head: { pitch: -20 }, legs: kbFeet, arms: { flex: 32, abd: -13, twist: 90, hand: 'fist' } },
    { root: { pos: [0, 0.885, 0], pitch: -3 }, legs: kbFeet, arms: { flex: 90, abd: -12, twist: 90, hand: 'fist' } },
  ],
  held: (p) => EQ.kettlebell(mid(p.gripL, p.gripR), scl(p.handDirL, -1), [1, 0, 0]),
};

const neckArms = { ik: { to: [0.17, 0.24, -0.1] as Vec3, pole: [0.3, -1, -0.1] as Vec3, rel: 'chest' as const }, hand: 'fist' as const };
const bandGoodMorning: ExerciseScene = {
  cam: { yaw: 75, pitch: 10 },
  keys: [
    { root: { pos: [0, 0.885, 0] }, legs: feet(0.13, 0, 8, [0.1, 0, 1]), arms: neckArms },
    { root: { pos: [0, 0.83, -0.25], pitch: 75 }, head: { pitch: -10 }, legs: feet(0.13, 0, 8, [0.1, 0, 1]), arms: neckArms },
  ],
  held: (p) => EQ.band([p.soleL, p.gripL, p.gripR, p.soleR]),
};

const slRdl: ExerciseScene = {
  cam: { yaw: 80, pitch: 10 },
  keys: [
    { root: { pos: [0, 0.885, 0] }, legL: { ik: { to: [0.09, 0.078, 0], pole: [0.1, 0, 1] }, foot: { yaw: 5 } }, legR: { abd: 3, knee: 12 }, arms: ARMS_DOWN },
    { root: { pos: [0.02, 0.87, -0.1], pitch: 80 }, head: { pitch: -10 }, legL: { ik: { to: [0.09, 0.078, 0], pole: [0.1, 0, 1] }, foot: { yaw: 5 } }, legR: { flex: -8, abd: 3, knee: 5 }, arms: { flex: 78, elbow: 8 } },
  ],
};

const barbellRdl: ExerciseScene = {
  cam: { yaw: 70, pitch: 8 },
  keys: [
    { root: { pos: [0, 0.885, 0] }, legs: rdlFeet, arms: { flex: 8, abd: 5, elbow: 5, twist: 90, hand: 'fist' } },
    { root: { pos: [0, 0.82, -0.3], pitch: 60 }, head: { pitch: -10 }, legs: rdlFeet, arms: { flex: 52, abd: 5, elbow: 5, twist: 90, hand: 'fist' } },
  ],
  held: (p) => EQ.barbell(mid(p.gripL, p.gripR), sub(p.gripL, p.gripR)),
};

// Leg curl allongée : banc le long de Z, rouleau derrière les chevilles.
const curlArms = { ik: { to: [0.21, 0.42, 0.98] as Vec3, pole: [0.5, 1, -0.2] as Vec3 }, hand: 'fist' as const };
const legCurl: ExerciseScene = {
  cam: { yaw: 70, pitch: 16 },
  keys: [
    { root: { pos: [0, 0.61, 0], pitch: 88 }, head: { pitch: -15 }, legs: { abd: 3, knee: 5 }, arms: curlArms },
    { root: { pos: [0, 0.61, 0], pitch: 88 }, head: { pitch: -15 }, legs: { abd: 3, knee: 115, ankle: 10 }, arms: curlArms },
  ],
  fixed: () => [
    box([0, 0.46, 0.33], [0.15, 0.04, 0.66], MAT.pad, 0, 0, 0.03),
    box([0, 0.38, 0.33], [0.04, 0.03, 0.6], MAT.frame),
    ...[-0.25, 0.9].map((z) => box([0, 0.19, z], [0.035, 0.19, 0.035], MAT.frame)),
    ...[-0.25, 0.9].map((z) => box([0, 0.02, z], [0.25, 0.02, 0.04], MAT.frame)),
    ...[1, -1].map((s) => capsule([s * 0.2, 0.42, 1.0], [s * 0.2, 0.32, 1.0], 0.018, MAT.rubber)),
  ],
  held: (p) => {
    const axis = (L: 'L' | 'R') => lerp3(p['knee' + L], p['ankle' + L], 0.79);
    const c = mid(axis('L'), axis('R'));
    const back = nrm(sub(mid(p.shinBackL, p.shinBackR), c));
    const roller = add(c, scl(back, 0.11));
    const pivot: Vec3 = [0.26, 0.5, -0.41];
    return [
      cyl(add(roller, [-0.2, 0, 0]), add(roller, [0.2, 0, 0]), 0.045, MAT.pad),
      capsule(add(roller, [0.24, 0, 0]), pivot, 0.022, MAT.frame),
      cyl(add(pivot, [-0.02, 0, 0]), add(pivot, [0.03, 0, 0]), 0.04, MAT.frame),
    ];
  },
};

const superman: ExerciseScene = {
  cam: { yaw: 65, pitch: 16 },
  holds: [0.6, 2.0],
  keys: [
    { root: { pos: [0, null, 0], pitch: 93 }, legs: { abd: 6 }, arms: { flex: 168, abd: 18, elbow: 5 } },
    { root: { pos: [0, null, 0], pitch: 93 }, spine: { pitch: -18 }, head: { pitch: -6 }, legs: { abd: 6, flex: -14 }, arms: { flex: 188, abd: 18, elbow: 5 } },
  ],
  fixed: ([a]) => matUnder(a),
};


// ---------- fentes ----------
const front = (z = 0): LegPose => ({ ik: { to: [0.1, 0.078, z], pole: [0.1, 0, 1] }, foot: { yaw: 5 } });
const backToes = (z: number, y = 0.19): LegPose => ({ ik: { to: [0.1, y, z], pole: [0, -1, 0.15] }, foot: { pitch: -60 } });
const DB_ARMS = { abd: 6, elbow: 5, hand: 'fist' as const };

const reverseLunge: ExerciseScene = {
  cam: { yaw: 70, pitch: 10 },
  keys: [
    { root: { pos: [0, 0.885, 0] }, legL: front(), legR: front(), arms: ARMS_DOWN },
    { root: { pos: [0, 0.49, -0.4] }, legL: front(), legR: backToes(-0.82), arms: ARMS_DOWN },
  ],
};
const dbReverseLunge: ExerciseScene = {
  cam: { yaw: 70, pitch: 10 },
  keys: [
    { root: { pos: [0, 0.885, 0] }, legL: front(), legR: front(), arms: DB_ARMS },
    { root: { pos: [0, 0.5, -0.38], pitch: 10 }, legL: front(), legR: backToes(-0.82), arms: DB_ARMS },
  ],
  held: dumbbells,
};
const splitSquat: ExerciseScene = {
  cam: { yaw: 70, pitch: 10 },
  keys: [
    { root: { pos: [0, 0.79, -0.4] }, legL: front(), legR: backToes(-0.82), arms: ARMS_DOWN },
    { root: { pos: [0, 0.49, -0.4] }, legL: front(), legR: backToes(-0.82), arms: ARMS_DOWN },
  ],
};

const stepUp: ExerciseScene = {
  cam: { yaw: 65, pitch: 10 },
  keys: [
    { root: { pos: [0, 0.86, -0.02], pitch: 12 }, legL: { ik: { to: [0.1, 0.378, 0.33], pole: [0.1, 0, 1] }, foot: { yaw: 5 } }, legR: front(-0.02), arms: ARMS_DOWN },
    { root: { pos: [0, 1.18, 0.3] }, legL: { ik: { to: [0.1, 0.378, 0.33], pole: [0.1, 0, 1] }, foot: { yaw: 5 } }, legR: { ik: { to: [0.12, 0.75, 0.38], pole: [0, 0.2, 1] }, foot: { pitch: -20 } }, arms: ARMS_DOWN },
  ],
  fixed: () => EQ.step([0, 0.3, 0.35]),
};

// Pied arrière posé sur un banc (dessus du pied).
const rearOnBench: LegPose = { ik: { to: [0.1, 0.5, -0.74], pole: [0, -1, 0.25] }, foot: { pitch: -150 } };
const bulgarianKeys = (arms: Pose['arms']): Pose[] => [
  { root: { pos: [0, 0.8, -0.3], pitch: 8 }, legL: front(), legR: rearOnBench, arms },
  { root: { pos: [0, 0.5, -0.32], pitch: 8 }, legL: front(), legR: rearOnBench, arms },
];
const benchBehind = () => EQ.bench([0, 0.45, -0.85], 90);
const bulgarian: ExerciseScene = { cam: { yaw: 70, pitch: 12 }, keys: bulgarianKeys(ARMS_DOWN), fixed: benchBehind };
const dbBulgarian: ExerciseScene = { cam: { yaw: 70, pitch: 12 }, keys: bulgarianKeys(DB_ARMS), fixed: benchBehind, held: dumbbells };

const lungeFwd = (side: 1 | -1): Pose => {
  const fwd: LegPose = { ik: { to: [0.1, 0.078, 0.62], pole: [0.1, 0, 1] }, foot: { yaw: 5 } };
  const back = backToes(-0.2);
  return { root: { pos: [0, 0.49, 0.21], pitch: 4 }, legL: side > 0 ? fwd : back, legR: side > 0 ? back : fwd, arms: DB_ARMS };
};
const standDb: Pose = { root: { pos: [0, 0.885, 0] }, legL: front(), legR: front(), arms: DB_ARMS };
const walkingLunge: ExerciseScene = {
  cam: { yaw: 70, pitch: 10 },
  note: 'montrées sur place : en vrai, on avance à chaque fente',
  holds: [0.3, 0.6, 0.3, 0.6],
  keys: [standDb, lungeFwd(1), standDb, lungeFwd(-1)],
  held: dumbbells,
};

const latLunge = (side: 1 | -1): Pose => {
  const bent: LegPose = { ik: { to: [0.75, 0.078, 0], pole: [0.3, 0, 0.95] }, foot: { yaw: 20 } };
  const straight: LegPose = { ik: { to: [0.1, 0.078, 0], pole: [0, 0, 1] }, foot: { yaw: 0 } };
  return {
    root: { pos: [side * 0.6, 0.58, -0.12], pitch: 35 }, head: { pitch: -25 },
    legL: side > 0 ? bent : straight, legR: side > 0 ? straight : bent,
    arms: { flex: 75, abd: -8, elbow: 35, hand: 'fist' },
  };
};
const stand: Pose = { root: { pos: [0, 0.885, 0] }, legL: front(), legR: front(), arms: ARMS_DOWN };
const lateralLunge: ExerciseScene = { cam: { yaw: 15, pitch: 10 }, keys: [stand, latLunge(1), stand, latLunge(-1)] };

const clasp = { ik: { to: [0.04, 0.02, 0.22] as Vec3, pole: [0.5, -1, 0] as Vec3, rel: 'chest' as const }, hand: 'fist' as const };
const curtsy = (side: 1 | -1): Pose => {
  const fr: LegPose = { ik: { to: [0.12, 0.078, 0.02], pole: [0.1, 0, 1] }, foot: { yaw: 5 } };
  const cr: LegPose = { ik: { to: [-0.28, 0.185, -0.5], pole: [0, -0.6, 0.8] }, foot: { pitch: -55 } };
  return { root: { pos: [side * 0.06, 0.55, -0.2] }, legL: side > 0 ? fr : cr, legR: side > 0 ? cr : fr, arms: clasp };
};
const standClasp: Pose = { root: { pos: [0, 0.885, 0] }, legL: front(), legR: front(), arms: clasp };
const curtsyLunge: ExerciseScene = { cam: { yaw: 30, pitch: 10 }, keys: [standClasp, curtsy(1), standClasp, curtsy(-1)] };

// ---------- fessiers ----------
const bridgeFeet: LegPose = { ik: { to: [0.13, 0.078, 0], pole: [0.15, 1, 0.2] }, foot: { yaw: 5 } };
const floorPalms = { palm: { fingers: [0.12, 0, 1] as Vec3, width: [1, 0, 0] as Vec3 } };
const gluteBridge: ExerciseScene = {
  cam: { yaw: 70, pitch: 18 },
  keys: [
    { root: { pos: [0, null, -0.56], pitch: -90 }, legs: bridgeFeet, arms: { flex: -10, abd: 12, ...floorPalms } },
    { root: { pos: [0, null, -0.54], pitch: -122 }, head: { pitch: 58 }, legs: bridgeFeet, arms: { flex: -28, abd: 12, ...floorPalms } },
  ],
  fixed: ([a]) => matUnder(a, 1.75),
};
const slGluteBridge: ExerciseScene = {
  cam: { yaw: 70, pitch: 18 },
  keys: [
    { root: { pos: [0, null, -0.56], pitch: -90 }, legL: bridgeFeet, legR: { flex: 38, knee: 2, abd: 4 }, arms: { flex: -10, abd: 12, ...floorPalms } },
    { root: { pos: [0, null, -0.54], pitch: -122 }, head: { pitch: 58 }, legL: bridgeFeet, legR: { flex: 6, knee: 2, abd: 4 }, arms: { flex: -28, abd: 12, ...floorPalms } },
  ],
  fixed: ([a]) => matUnder(a, 1.75),
};

const thrustFeet: LegPose = { ik: { to: [0.15, 0.078, 0.43], pole: [0.1, 1, 0.2] }, foot: { yaw: 6 } };
const thrustKeys = (arms: Pose['arms']): Pose[] => [
  { root: { pos: [0, 0.26, -0.1], pitch: -62 }, head: { pitch: 15 }, legs: thrustFeet, arms },
  { root: { pos: [0, 0.5, 0], pitch: -90 }, head: { pitch: 38 }, legs: thrustFeet, arms },
];
// Banc en travers, sous le haut du dos (position haute).
const benchUnderBack = ([, b]: Body[]): Prim[] => {
  const back = torsoOf(b).filter((q) => q.a[2] < -0.25);
  return EQ.bench([0, lowestY(back), b.pts.upperBack[2] - 0.12], 90);
};
const dbHipThrust: ExerciseScene = {
  cam: { yaw: 70, pitch: 14 },
  keys: thrustKeys({ ik: { to: [0.12, 0.08, 0.17], pole: [1, 0.3, 0], rel: 'pelvis' }, hand: 'fist' }),
  fixed: benchUnderBack,
  held: (p) => EQ.dumbbell(local(p, 'pelvis', [0, 0.02, 0.15]), p.pelvisX, 1.1),
};
const barbellHipThrust: ExerciseScene = {
  cam: { yaw: 70, pitch: 14 },
  keys: thrustKeys({ ik: { to: [0.36, 0.08, 0.17], pole: [0.6, -0.2, -0.8], rel: 'pelvis' }, hand: 'fist' }),
  fixed: benchUnderBack,
  held: (p) => {
    const c = local(p, 'pelvis', [0, 0.03, 0.17]);
    return [...EQ.barbell(c, p.pelvisX), cyl(add(c, scl(p.pelvisX, -0.2)), add(c, scl(p.pelvisX, 0.2)), 0.04, MAT.pad)];
  },
};

const seatedHands = { ik: { to: [0.24, -0.06, 0.05] as Vec3, pole: [1, 0, -0.3] as Vec3, rel: 'pelvis' as const }, palm: { fingers: [0.2, -1, 0.2] as Vec3, width: [0, 0, 1] as Vec3 } };
const seatedFeet = (pole: Vec3): LegPose => ({ ik: { to: [0.14, 0.078, 0.42], pole }, foot: { yaw: 8 } });
const chairUnder = ([a]: Body[]): Prim[] => EQ.chair([0, lowestY(torsoOf(a)), mid(a.pts.gluteL, a.pts.gluteR)[2] + 0.06]);
const bandHipAbduction: ExerciseScene = {
  cam: { yaw: 20, pitch: 14 },
  keys: [
    { root: { pos: [0, 0.585, -0.02], pitch: 12 }, legs: seatedFeet([0.05, 0.1, 1]), arms: seatedHands },
    { root: { pos: [0, 0.585, -0.02], pitch: 12 }, legs: seatedFeet([0.75, 0.1, 0.65]), arms: seatedHands },
  ],
  fixed: chairUnder,
  held: (p) => EQ.miniBand(p),
};

// Allongée sur le côté droit (tête vers -X), hanches et genoux fléchis.
const clamTop = (pole: Vec3): LegPose => ({ ik: { to: [-0.01, -0.576, 0.004], pole, rel: 'pelvis' } });
const clamBase: Pose = {
  root: { pos: [0, null, 0], roll: 90 },
  legR: { flex: 45, knee: 90 },
  armR: { flex: 165, abd: 10, elbow: 30 },
  armL: { ik: { to: [-0.05, 0.0, 0.3], pole: [0.3, -1, 0], rel: 'chest' } },
};
const clamshell: ExerciseScene = {
  cam: { yaw: 10, pitch: 20 },
  keys: [{ ...clamBase, legL: clamTop([0, 0, 1]) }, { ...clamBase, legL: clamTop([0.85, 0, 0.5]) }],
  fixed: ([a]) => matUnder(a, 1.7),
};

// À quatre pattes : mains sous les épaules, genoux sous les hanches.
const quadHands = { ik: { to: [0.17, 0.02, 0.5] as Vec3, pole: [0.3, 0, -1] as Vec3 }, palm: { fingers: [0.1, 0, 1] as Vec3, width: [1, 0, 0] as Vec3 } };
const quadKnee: LegPose = { ik: { to: [0.1, 0.045, -0.4], pole: [0, -0.7, 0.7] }, foot: { pitch: -170 } };
const QUAD_ROOT = { pos: [0, 0.47, 0] as [number, number, number], pitch: 82 };
const donkeyKick: ExerciseScene = {
  cam: { yaw: 75, pitch: 14 },
  keys: [
    { root: QUAD_ROOT, legs: quadKnee, arms: quadHands },
    { root: QUAD_ROOT, legL: { ik: { to: [0.085, 0.86, -0.41], pole: [0, -0.7, -0.7] }, foot: { pitch: -175 } }, legR: quadKnee, arms: quadHands },
  ],
  fixed: () => EQ.mat([0, 0, 0.05], 0, 1.4),
};

const ankleBand = (p: Pts): Prim[] => [
  ...EQ.band([p.ankleL, p.ankleR]),
  ...(['L', 'R'] as const).map((L) => torus(p['ankle' + L], 0.042, sub(p['knee' + L], p['ankle' + L]), 0.008, MAT.band)),
];
const chairHands = { ik: { to: [0.17, 0.92, 0.42] as Vec3, pole: [0.4, -0.3, -1] as Vec3 }, palm: { fingers: [0, -0.3, 1] as Vec3, width: [1, 0, 0] as Vec3 } };
const bandKickback: ExerciseScene = {
  cam: { yaw: 80, pitch: 10 },
  keys: [
    { root: { pos: [0, 0.875, -0.05], pitch: 15 }, legR: front(-0.02), legL: { flex: 2, knee: 12, abd: 3 }, arms: chairHands },
    { root: { pos: [0, 0.875, -0.05], pitch: 15 }, legR: front(-0.02), legL: { flex: -32, knee: 4, abd: 3, ankle: -15 }, arms: chairHands },
  ],
  fixed: () => EQ.chair([0, 0.45, 0.62]),
  held: ankleBand,
};

const kickTower = EQ.cableTower(0.15, 0.75, 0.12, 180);
const cableKickback: ExerciseScene = {
  cam: { yaw: 80, pitch: 10 },
  keys: [
    { root: { pos: [0, 0.86, 0.05], pitch: 25 }, legR: front(0.05), legL: { flex: 4, knee: 11, abd: 3 }, arms: { ik: { to: [0.13, 1.15, 0.62], pole: [0.5, -0.5, -1] }, hand: 'fist' } },
    { root: { pos: [0, 0.86, 0.05], pitch: 25 }, legR: front(0.05), legL: { flex: -35, knee: 8, abd: 3, ankle: -10 }, arms: { ik: { to: [0.13, 1.15, 0.62], pole: [0.5, -0.5, -1] }, hand: 'fist' } },
  ],
  fixed: () => kickTower.prims,
  held: (p) => [...EQ.cable(kickTower.pulley, add(p.ankleL, [0, 0, 0.04])), torus(p.ankleL, 0.042, sub(p.kneeL, p.ankleL), 0.01, MAT.rubber)],
};

const abductorMachine: ExerciseScene = {
  cam: { yaw: 20, pitch: 14 },
  keys: [
    { root: { pos: [0, 0.64, -0.05], pitch: 18 }, legs: { ik: { to: [0.15, 0.22, 0.42], pole: [0.1, 0.2, 1] }, foot: { yaw: 5, pitch: 10 } }, arms: { ik: { to: [0.26, -0.02, 0.12], pole: [1, 0, -0.3], rel: 'pelvis' }, hand: 'fist' } },
    { root: { pos: [0, 0.64, -0.05], pitch: 18 }, legs: { ik: { to: [0.15, 0.22, 0.42], pole: [0.75, 0.2, 0.65] }, foot: { yaw: 5, pitch: 10 } }, arms: { ik: { to: [0.26, -0.02, 0.12], pole: [1, 0, -0.3], rel: 'pelvis' }, hand: 'fist' } },
  ],
  fixed: ([a]) => {
    const seat = lowestY(torsoOf(a));
    return [
      box([0, seat - 0.035, 0.0], [0.22, 0.035, 0.24], MAT.pad, 0, 0, 0.02),
      box([0, seat + 0.36, -0.27], [0.22, 0.32, 0.04], MAT.pad, 0, -12, 0.03),
      box([0, (seat - 0.07) / 2, 0], [0.06, (seat - 0.07) / 2, 0.06], MAT.frame),
      box([0, 0.03, 0.1], [0.3, 0.03, 0.55], MAT.frame),
      ...[1, -1].map((s) => capsule([s * 0.2, 0.15, 0.42], [s * 0.2, 0.15, 0.5], 0.02, MAT.chrome)),
      ...[1, -1].map((s) => capsule([s * 0.29, seat - 0.02, 0.02], [s * 0.29, seat + 0.12, 0.02], 0.018, MAT.rubber)),
    ];
  },
  held: (p) => {
    const m = mid(p.kneeL, p.kneeR);
    return (['L', 'R'] as const).flatMap((L) => {
      const out = nrm([p['knee' + L][0] - m[0], 0, p['knee' + L][2] - m[2] + 1e-6]);
      const c = add(p['knee' + L], scl(out, 0.075));
      return [box(c, [0.03, 0.09, 0.11], MAT.pad, (Math.atan2(out[0], out[2]) * 180) / Math.PI - 90, 0, 0.02), capsule(add(c, [0, -0.08, 0]), [out[0] * 0.12, 0.3, 0.3], 0.02, MAT.frame)];
    });
  },
};

// ---------- poussées ----------
const flatPalm = { fingers: [0.15, 0, 1] as Vec3, width: [1, 0, 0] as Vec3 };
const pushArms = (z: number, y = 0.02) => ({ ik: { to: [0.27, y, z] as Vec3, pole: [0.6, 0.55, -0.5] as Vec3 }, palm: flatPalm });
const pushup: ExerciseScene = {
  anchor: 'toes',
  cam: { yaw: 60, pitch: 14 },
  keys: [
    { root: { pitch: 75.5 }, head: { pitch: 10 }, legs: { abd: 3 }, arms: pushArms(1.25) },
    { root: { pitch: 89 }, head: { pitch: 6 }, legs: { abd: 3 }, arms: pushArms(1.25) },
  ],
};
const inclinePushup: ExerciseScene = {
  anchor: 'toes',
  cam: { yaw: 60, pitch: 12 },
  keys: [
    { root: { pitch: 51 }, head: { pitch: 8 }, legs: { abd: 3 }, arms: pushArms(0.98, 0.47) },
    { root: { pitch: 63 }, head: { pitch: 6 }, legs: { abd: 3 }, arms: pushArms(0.98, 0.47) },
  ],
  fixed: () => EQ.bench([0, 0.45, 1.02], 90),
};
const kneePushup: ExerciseScene = {
  anchor: 'knees',
  cam: { yaw: 60, pitch: 14 },
  keys: [
    { root: { pitch: 60 }, head: { pitch: 10 }, legs: { abd: 3, knee: 75, ankle: -20 }, arms: pushArms(0.9) },
    { root: { pitch: 75 }, head: { pitch: 6 }, legs: { abd: 3, knee: 60, ankle: -20 }, arms: pushArms(0.9) },
  ],
  fixed: () => EQ.mat([0, 0, 0.35], 0, 1.4),
};

const pressPalm = { hand: 'fist' as const, palm: { fingers: [0, 1, 0.05] as Vec3, width: [1, 0, 0] as Vec3 } };
const dbFloorPress: ExerciseScene = {
  cam: { yaw: 40, pitch: 22 },
  keys: [
    { root: { pos: [0, null, -0.56], pitch: -90 }, legs: bridgeFeet, arms: { flex: -14, abd: 55, elbow: 90, ...pressPalm } },
    { root: { pos: [0, null, -0.56], pitch: -90 }, legs: bridgeFeet, arms: { flex: 90, abd: 8, ...pressPalm } },
  ],
  fixed: ([a]) => matUnder(a, 1.75),
  held: dumbbells,
};
const dbBenchPress: ExerciseScene = {
  cam: { yaw: 45, pitch: 20 },
  keys: [
    { root: { pos: [0, 0.58, 0.05], pitch: -90 }, legs: { ik: { to: [0.25, 0.078, 0.5], pole: [0.3, 0.6, 0.6] }, foot: { yaw: 15 } }, arms: { flex: -12, abd: 62, elbow: 82, ...pressPalm } },
    { root: { pos: [0, 0.58, 0.05], pitch: -90 }, legs: { ik: { to: [0.25, 0.078, 0.5], pole: [0.3, 0.6, 0.6] }, foot: { yaw: 15 } }, arms: { flex: 90, abd: 8, ...pressPalm } },
  ],
  fixed: ([a]) => EQ.bench([0, lowestY(torsoOf(a)), -0.38]),
  held: dumbbells,
};

const stagger = { legL: { ik: { to: [0.12, 0.078, 0.22], pole: [0.1, 0, 1] }, foot: { yaw: 10 } } as LegPose, legR: { ik: { to: [0.12, 0.078, -0.25], pole: [0.1, 0, 1] }, foot: { yaw: 20 } } as LegPose };
const fwdFist = { hand: 'fist' as const, palm: { fingers: [0, -0.1, 1] as Vec3, width: [1, 0, 0] as Vec3 } };
const chestIn = { ik: { to: [0.21, 0.1, 0.1] as Vec3, pole: [0.5, -0.4, -1] as Vec3, rel: 'chest' as const }, ...fwdFist };
const chestOut = { ik: { to: [0.13, 0.12, 0.56] as Vec3, pole: [0.5, -0.4, -1] as Vec3, rel: 'chest' as const }, ...fwdFist };
const BAND_ANCHOR: Vec3 = [0, 1.25, -0.65];
const bandChestPress: ExerciseScene = {
  cam: { yaw: 55, pitch: 10 },
  keys: [
    { root: { pos: [0, 0.86, 0], pitch: 8 }, ...stagger, arms: chestIn },
    { root: { pos: [0, 0.86, 0], pitch: 8 }, ...stagger, arms: chestOut },
  ],
  fixed: () => [box(BAND_ANCHOR, [0.03, 0.03, 0.03], MAT.frame)],
  held: (p) => [
    ...EQ.band([BAND_ANCHOR, [0.33, 1.27, -0.12], p.gripL]),
    ...EQ.band([BAND_ANCHOR, [-0.33, 1.27, -0.12], p.gripR]),
  ],
};

const seatedFeetFwd: LegPose = { ik: { to: [0.16, 0.078, 0.42], pole: [0.2, 0.3, 1] }, foot: { yaw: 8 } };
const SEATED_ROOT = { pos: [0, 0.585, -0.05] as [number, number, number], pitch: -6 };
const machineSeat = (b: Body, recline = -6): Prim[] => {
  const seat = lowestY(torsoOf(b));
  const back = add(local(b.pts, 'chest', [0, 0, -0.16]), [0, 0.05, 0]);
  return [
    box([0, seat - 0.035, b.pts.pelvis[2] + 0.04], [0.23, 0.035, 0.22], MAT.pad, 0, 0, 0.02),
    box(back, [0.22, 0.34, 0.04], MAT.pad, 0, recline, 0.03),
    box([0, (seat - 0.07) / 2, b.pts.pelvis[2]], [0.06, (seat - 0.07) / 2, 0.06], MAT.frame),
    box([0, 0.03, b.pts.pelvis[2] + 0.1], [0.32, 0.03, 0.5], MAT.frame),
    box([0, 0.95, back[2] - 0.12], [0.07, 0.95, 0.07], MAT.frame),
  ];
};
const vertHandle = { hand: 'fist' as const, palm: { fingers: [-0.15, 0, 1] as Vec3, width: [0, 1, 0] as Vec3 } };
const machineChestPress: ExerciseScene = {
  cam: { yaw: 50, pitch: 12 },
  keys: [
    { root: SEATED_ROOT, legs: seatedFeetFwd, arms: { ...chestIn, ...vertHandle } },
    { root: SEATED_ROOT, legs: seatedFeetFwd, arms: { ...chestOut, ...vertHandle } },
  ],
  fixed: ([a]) => machineSeat(a),
  held: (p) => (['L', 'R'] as const).flatMap((L) => {
    const g = p['grip' + L];
    const s = L === 'L' ? 1 : -1;
    return [capsule(add(g, [0, -0.07, 0]), add(g, [0, 0.07, 0]), 0.017, MAT.rubber), capsule(add(g, [0, 0.07, 0]), [s * 0.36, 1.5, p.pelvis[2] - 0.2], 0.022, MAT.frame)];
  }),
};

const pikeArms = { ik: { to: [0.25, 0.02, 1.0] as Vec3, pole: [0.6, 0.3, -0.6] as Vec3 }, palm: flatPalm };
const pikePushup: ExerciseScene = {
  anchor: 'toes',
  cam: { yaw: 75, pitch: 12 },
  keys: [
    { root: { pitch: 145 }, legs: { abd: 3, flex: 105 }, arms: pikeArms },
    { root: { pitch: 155 }, legs: { abd: 3, flex: 105 }, arms: pikeArms },
  ],
  fixed: () => EQ.mat([0, 0, 0.55], 0, 1.4),
};

const ohFist = { hand: 'fist' as const, palm: { fingers: [0, 1, 0] as Vec3, width: [1, 0, 0] as Vec3 } };
const shoulderPressKeys = (): Pose[] => [
  { legs: { abd: 6, rot: 8, knee: 4 }, arms: { abd: 80, rot: 90, elbow: 95, ...ohFist } },
  { legs: { abd: 6, rot: 8, knee: 4 }, arms: { abd: 166, rot: 90, elbow: 10, ...ohFist } },
];
const dbShoulderPress: ExerciseScene = { cam: { yaw: 30, pitch: 8 }, keys: shoulderPressKeys(), held: dumbbells };
const bandShoulderPress: ExerciseScene = { cam: { yaw: 30, pitch: 8 }, keys: shoulderPressKeys(), held: bandsFromFeet };
const machineShoulderPress: ExerciseScene = {
  cam: { yaw: 40, pitch: 10 },
  keys: [
    { root: { ...SEATED_ROOT, pitch: -4 }, legs: seatedFeetFwd, arms: { abd: 80, rot: 90, elbow: 95, ...ohFist } },
    { root: { ...SEATED_ROOT, pitch: -4 }, legs: seatedFeetFwd, arms: { abd: 160, rot: 90, elbow: 12, ...ohFist } },
  ],
  fixed: ([a]) => machineSeat(a, -4),
  held: (p) => (['L', 'R'] as const).flatMap((L) => {
    const g = p['grip' + L];
    const s = L === 'L' ? 1 : -1;
    return [capsule(add(g, [-0.07 * s, 0, 0]), add(g, [0.05 * s, 0, 0]), 0.017, MAT.rubber), capsule(add(g, [0.05 * s, 0, 0]), [s * 0.34, 1.1, p.pelvis[2] - 0.32], 0.022, MAT.frame)];
  }),
};

// ---------- tirages ----------
const dbRow: ExerciseScene = {
  cam: { yaw: 120, pitch: 14 },
  keys: [0, 1].map((k): Pose => ({
    root: { pos: [0, 0.86, -0.25], pitch: 88 }, head: { pitch: -5 },
    legL: { ik: { to: [0.08, 0.5, -0.66], pole: [0, -0.6, 0.8] }, foot: { pitch: -170 } },
    legR: { ik: { to: [0.25, 0.078, -0.15], pole: [0.2, 0, 1] }, foot: { yaw: 10 } },
    armL: { ik: { to: [0.12, 0.47, 0.35], pole: [0.3, 0, -1] }, palm: flatPalm },
    armR: k === 0 ? { flex: 88, elbow: 5, hand: 'fist' } : { flex: 15, abd: 5, elbow: 95, hand: 'fist' },
  })),
  fixed: () => EQ.bench([0, 0.45, 0.0]),
  held: (p) => EQ.dumbbell(p.gripR, p.handAxisR),
};

const kbRow: ExerciseScene = {
  cam: { yaw: 115, pitch: 12 },
  keys: [0, 1].map((k): Pose => ({
    root: { pos: [0, 0.82, -0.1], pitch: 50 }, head: { pitch: -15 },
    legL: { ik: { to: [0.12, 0.078, 0.3], pole: [0.1, 0, 1] }, foot: { yaw: 8 } },
    legR: { ik: { to: [0.12, 0.078, -0.3], pole: [0.1, 0, 1] }, foot: { yaw: 20 } },
    armL: { ik: { to: [0.13, 0.62, 0.4], pole: [0.6, 0, -0.6] }, palm: { fingers: [0, -0.4, 1], width: [1, 0, 0] } },
    armR: k === 0 ? { flex: 50, elbow: 5, hand: 'fist' } : { flex: 5, abd: 5, elbow: 95, hand: 'fist' },
  })),
  held: (p) => EQ.kettlebell(p.gripR, scl(p.handDirR, -1), p.handAxisR),
};

const bandRow: ExerciseScene = {
  cam: { yaw: 70, pitch: 16 },
  keys: [
    { root: { pos: [0, null, 0], pitch: -4 }, legs: { flex: 84, knee: 6, ankle: 10, abd: 4 }, arms: { flex: 88, abd: 6, elbow: 4, hand: 'fist' } },
    { root: { pos: [0, null, 0], pitch: -6 }, legs: { flex: 84, knee: 6, ankle: 10, abd: 4 }, arms: { flex: -15, abd: 12, elbow: 105, hand: 'fist' } },
  ],
  fixed: ([a]) => matUnder(a, 1.5),
  held: (p) => EQ.band([p.gripL, p.toeL, p.toeR, p.gripR]),
};

const rowTower = EQ.cableTower(0, 1.15, 0.42, 180);
const cableRow: ExerciseScene = {
  cam: { yaw: 70, pitch: 14 },
  keys: [
    { root: { pos: [0, 0.56, 0], pitch: 18 }, head: { pitch: -8 }, legs: { ik: { to: [0.14, 0.38, 0.62], pole: [0.2, 1, 0.4] }, foot: { pitch: 70, yaw: 5 } },
      arms: { ik: { to: [0.05, 0.75, 0.62], pole: [0.3, -1, -0.2] }, hand: 'fist', palm: { fingers: [0, -0.2, 1], width: [0, 1, 0] } } },
    { root: { pos: [0, 0.56, 0], pitch: -6 }, legs: { ik: { to: [0.14, 0.38, 0.62], pole: [0.2, 1, 0.4] }, foot: { pitch: 70, yaw: 5 } },
      arms: { ik: { to: [0.05, 0.72, 0.2], pole: [0.3, -1, -0.6] }, hand: 'fist', palm: { fingers: [0, -0.2, 1], width: [0, 1, 0] } } },
  ],
  fixed: ([a]) => [
    ...rowTower.prims,
    box([0, lowestY(torsoOf(a)) - 0.035, -0.05], [0.16, 0.035, 0.5], MAT.pad, 0, 0, 0.02),
    box([0, (lowestY(torsoOf(a)) - 0.07) / 2, -0.05], [0.05, (lowestY(torsoOf(a)) - 0.07) / 2, 0.4], MAT.frame),
    box([0, 0.36, 0.72], [0.28, 0.2, 0.02], MAT.frame, 0, -20, 0.01),
  ],
  held: (p) => {
    const c = mid(p.gripL, p.gripR);
    return [...EQ.handle(p.gripL, p.gripR, 0.015), capsule(c, add(c, [0, 0, 0.07]), 0.012, MAT.chrome), ...EQ.cable(add(c, [0, 0, 0.07]), rowTower.pulley)];
  },
};

const ytwBase: Pose = { root: { pos: [0, null, 0], pitch: 93 }, head: { pitch: 4 }, legs: { abd: 5 } };
const proneYtw: ExerciseScene = {
  cam: { yaw: 35, pitch: 30 },
  labels: ['Y', 'T', 'W'],
  holds: [0.8, 0.8, 0.8],
  keys: [
    { ...ytwBase, arms: { abd: 135, flex: -14, hand: 'fist' } },
    { ...ytwBase, arms: { abd: 90, flex: -14, hand: 'fist' } },
    { ...ytwBase, arms: { abd: 50, rot: 90, elbow: 95, flex: -14, hand: 'fist' } },
  ],
  fixed: ([a]) => matUnder(a),
};

const latFeet: LegPose = { ik: { to: [0.15, 0.078, 0.42], pole: [0.1, 0.3, 1] }, foot: { yaw: 8 } };
const LAT_PULLEY: Vec3 = [0, 2.25, 0.05];
const latPulldown: ExerciseScene = {
  cam: { yaw: 40, pitch: 8 },
  keys: [
    { root: { pos: [0, 0.585, 0], pitch: -5 }, legs: latFeet, arms: { ik: { to: [0.42, 1.62, 0.05], pole: [0.6, 0.2, -0.5] }, hand: 'fist' } },
    { root: { pos: [0, 0.585, 0], pitch: -14 }, head: { pitch: -10 }, legs: latFeet, arms: { ik: { to: [0.33, 1.06, 0.12], pole: [0.5, -1, -0.3] }, hand: 'fist' } },
  ],
  fixed: ([a]) => {
    const seat = lowestY(torsoOf(a));
    const pad = add(mid(a.pts.thighL, a.pts.thighR), [0, 0.12, 0.08]);
    return [
      box([0, seat - 0.035, 0], [0.22, 0.035, 0.22], MAT.pad, 0, 0, 0.02),
      box([0, (seat - 0.07) / 2, 0.15], [0.06, (seat - 0.07) / 2, 0.06], MAT.frame),
      box([0, 0.03, 0.3], [0.3, 0.03, 0.45], MAT.frame),
      box([0, 1.15, 0.55], [0.1, 1.15, 0.1], MAT.frame),
      capsule([0, 2.28, 0.55], [0, 2.28, 0.02], 0.04, MAT.frame),
      cyl([-0.02, LAT_PULLEY[1], LAT_PULLEY[2]], [0.02, LAT_PULLEY[1], LAT_PULLEY[2]], 0.045, MAT.rubber),
      cyl(add(pad, [-0.22, 0, 0]), add(pad, [0.22, 0, 0]), 0.05, MAT.pad),
      capsule(add(pad, [0, 0, 0.02]), [0, 0.3, 0.45], 0.02, MAT.frame),
    ];
  },
  held: (p) => {
    const c = mid(p.gripL, p.gripR);
    const ax = nrm(sub(p.gripL, p.gripR));
    return [capsule(add(c, scl(ax, -0.58)), add(c, scl(ax, 0.58)), 0.015, MAT.chrome), ...EQ.cable(c, LAT_PULLEY)];
  },
};

const DOOR_ANCHOR: Vec3 = [0, 2.1, 0.64];
const bandPulldown: ExerciseScene = {
  cam: { yaw: 110, pitch: 8 },
  keys: [
    { root: { pos: [0, 0.88, 0], pitch: 8 }, legs: feet(0.14, 0, 10, [0.1, 0, 1]), arms: { ik: { to: [0.22, 1.95, 0.32], pole: [0.5, 0, -1] }, hand: 'fist' } },
    { root: { pos: [0, 0.88, 0], pitch: 8 }, legs: feet(0.14, 0, 10, [0.1, 0, 1]), arms: { ik: { to: [0.28, 1.2, 0.12], pole: [0.5, -1, -0.3] }, hand: 'fist' } },
  ],
  fixed: () => [box([0, 1.02, 0.7], [0.42, 1.02, 0.025], MAT.wood), box(DOOR_ANCHOR, [0.04, 0.03, 0.04], MAT.frame)],
  held: (p) => [...EQ.band([DOOR_ANCHOR, p.gripL]), ...EQ.band([DOOR_ANCHOR, p.gripR])],
};

const hangArms = { ik: { to: [0.3, 1.99, 0.06] as Vec3, pole: [0.4, -0.5, -0.6] as Vec3 }, hand: 'fist' as const };
const assistedPullup: ExerciseScene = {
  cam: { yaw: 45, pitch: 8 },
  keys: [
    { root: { pos: [0, 0.98, -0.02] }, legs: { flex: -5, knee: 95, ankle: -20, abd: 4 }, arms: hangArms },
    { root: { pos: [0, 1.5, -0.08] }, head: { pitch: -10 }, legs: { flex: -5, knee: 95, ankle: -20, abd: 4 }, arms: hangArms },
  ],
  fixed: () => [
    ...[1, -1].map((s) => box([s * 0.45, 1.12, 0.15], [0.04, 1.12, 0.04], MAT.frame)),
    capsule([-0.45, 2.22, 0.15], [0.45, 2.22, 0.15], 0.03, MAT.frame),
    ...[1, -1].map((s) => capsule([s * 0.45, 2.0, 0.12], [s * 0.22, 2.0, 0.06], 0.018, MAT.rubber)),
    box([0, 0.03, 0.1], [0.5, 0.03, 0.4], MAT.frame),
  ],
  held: (p) => {
    const c = add(mid(p.kneeL, p.kneeR), [0, -0.075, -0.15]);
    return [box(c, [0.24, 0.03, 0.22], MAT.pad, 0, 0, 0.02), capsule(add(c, [0, -0.03, 0.2]), [0, 0.35, 0.25], 0.025, MAT.frame)];
  },
};

const BAR: Vec3 = [0, 2.15, 0];
const barArms = { ik: { to: [0.3, 2.09, 0.0] as Vec3, pole: [0.5, -0.4, -0.6] as Vec3 }, hand: 'fist' as const };
const hang: Pose = { root: { pos: [0, 1.1, -0.02] }, legs: { flex: 10, knee: 35, abd: 3 }, arms: barArms };
const top: Pose = { root: { pos: [0, 1.6, -0.14] }, head: { pitch: -15 }, legs: { flex: 10, knee: 35, abd: 3 }, arms: barArms };
const pullup: ExerciseScene = { cam: { yaw: 35, pitch: 6 }, keys: [hang, top], fixed: () => EQ.pullupBar(BAR) };
const negativePullup: ExerciseScene = {
  cam: { yaw: 35, pitch: 6 },
  keys: [top, hang],
  moves: [3.5, 1.2],
  fixed: () => [...EQ.pullupBar(BAR), ...EQ.chair([0, 0.45, -0.75])],
};
const bandAssistedPullup: ExerciseScene = {
  cam: { yaw: 35, pitch: 6 },
  keys: [
    { ...hang, legR: { flex: 20, knee: 95, abd: 3 } },
    { ...top, legR: { flex: 20, knee: 95, abd: 3 } },
  ],
  fixed: () => EQ.pullupBar(BAR),
  held: (p) => EQ.band([[-0.05, 2.15, 0], add(p.soleR, [0, -0.02, 0]), [0.05, 2.15, 0]], 0.01),
};

// ---------- gainage / abdos ----------
const forearms = { ik: { to: [0.12, 0.05, 1.5] as Vec3, pole: [0.3, -1, -0.4] as Vec3 }, palm: { fingers: [0, 0, 1] as Vec3, width: [1, 0, 0] as Vec3 } };
const plank: ExerciseScene = {
  cam: { yaw: 65, pitch: 14 },
  labels: ISO,
  holds: [0.6, 1.8],
  keys: [
    { root: { pos: [0, 0.155, 0.8], pitch: 75 }, head: { pitch: 6 }, legs: { abd: 3, knee: 65, ankle: -20 }, arms: forearms },
    { root: { pos: [0, 0.25, 0.85], pitch: 86 }, head: { pitch: 4 }, legs: { abd: 3 }, arms: forearms },
  ],
  fixed: () => EQ.mat([0, 0, 0.75], 0, 1.8),
};

// Sur le côté droit (tête vers -X), avant-bras droit au sol sous l'épaule.
const sideForearm = { ik: { to: [1.25, 0.035, 0.22] as Vec3, pole: [0, -1, -0.3] as Vec3 }, palm: { fingers: [0, 0, 1] as Vec3, width: [1, 0, 0] as Vec3 } };
const sidePlank: ExerciseScene = {
  anchor: 'feet',
  cam: { yaw: 5, pitch: 10 },
  labels: ISO,
  holds: [0.6, 1.8],
  keys: [
    { root: { pos: [-0.803, 0.18, 0], roll: 84 }, spine: { roll: -44 }, legs: { abd: -5 }, armR: sideForearm, armL: { abd: 2, elbow: 5 } },
    { root: { pos: [-0.772, 0.311, 0], roll: 72 }, legs: { abd: -5 }, armR: sideForearm, armL: { abd: 90, elbow: 5 } },
  ],
  fixed: () => EQ.mat([-0.6, 0, 0.05], 90, 1.8),
};

const SUPINE = { pos: [0, null, 0] as [number, number | null, number], pitch: -90 };
const deadBug: ExerciseScene = {
  cam: { yaw: 40, pitch: 22 },
  keys: [
    { root: SUPINE, legs: { flex: 90, knee: 90, abd: 4 }, arms: { flex: 90, abd: 6 } },
    { root: SUPINE, legL: { flex: 18, knee: 5, abd: 4 }, legR: { flex: 90, knee: 90, abd: 4 }, armL: { flex: 90, abd: 6 }, armR: { flex: 168, abd: 6 } },
    { root: SUPINE, legs: { flex: 90, knee: 90, abd: 4 }, arms: { flex: 90, abd: 6 } },
    { root: SUPINE, legR: { flex: 18, knee: 5, abd: 4 }, legL: { flex: 90, knee: 90, abd: 4 }, armR: { flex: 90, abd: 6 }, armL: { flex: 168, abd: 6 } },
  ],
  fixed: () => EQ.mat([0, 0, -0.45], 0, 1.8),
};

const birdBase: Pose = { root: QUAD_ROOT, legs: quadKnee, arms: quadHands };
const reachArm = { ik: { to: [0.15, 0.53, 0.98] as Vec3, pole: [0, -1, 0] as Vec3 }, palm: { fingers: [0, 0, 1] as Vec3, width: [1, 0, 0] as Vec3 } };
const kickLeg: LegPose = { ik: { to: [0.1, 0.47, -0.82], pole: [0, -1, 0] }, foot: { pitch: -90 } };
const birdDog: ExerciseScene = {
  cam: { yaw: 70, pitch: 14 },
  keys: [birdBase, { ...birdBase, armR: reachArm, legL: kickLeg }, birdBase, { ...birdBase, armL: reachArm, legR: kickLeg }],
  fixed: () => EQ.mat([0, 0, 0.05], 0, 1.6),
};

const templeHands = { ik: { to: [0.11, 0.07, -0.03] as Vec3, pole: [1, 0, 0.3] as Vec3, rel: 'head' as const } };
const crunch: ExerciseScene = {
  cam: { yaw: 70, pitch: 16 },
  keys: [
    { root: { pos: [0, null, -0.56], pitch: -90 }, legs: bridgeFeet, arms: templeHands },
    { root: { pos: [0, null, -0.56], pitch: -90 }, spine: { pitch: 32 }, head: { pitch: 8 }, legs: bridgeFeet, arms: templeHands },
  ],
  fixed: ([a]) => matUnder(a, 1.75),
};

const sidePalms = { flex: -8, abd: 10, palm: { fingers: [0.1, 0, 1] as Vec3, width: [1, 0, 0] as Vec3 } };
const reverseCrunch: ExerciseScene = {
  cam: { yaw: 70, pitch: 16 },
  keys: [
    { root: SUPINE, legs: { flex: 90, knee: 90, abd: 4 }, arms: sidePalms },
    { root: { ...SUPINE, pitch: -118 }, spine: { pitch: 26 }, legs: { flex: 112, knee: 95, abd: 4 }, arms: sidePalms },
  ],
  fixed: () => EQ.mat([0, 0, -0.45], 0, 1.8),
};

const hollowHold: ExerciseScene = {
  cam: { yaw: 70, pitch: 16 },
  labels: ['Version facile', 'Version complète'],
  holds: [1.2, 1.6],
  keys: [
    { root: SUPINE, spine: { pitch: 18 }, head: { pitch: 10 }, legs: { flex: 80, knee: 90, abd: 3 }, arms: { flex: 60, abd: 6 } },
    { root: SUPINE, spine: { pitch: 22 }, head: { pitch: 10 }, legs: { flex: 22, abd: 3 }, arms: { flex: 165, abd: 6 } },
  ],
  fixed: () => EQ.mat([0, 0, -0.3], 0, 1.9),
};

const PALLOF_ANCHOR: Vec3 = [0.95, 1.15, 0.05];
const pallofHands = (z: number) => ({ ik: { to: [0.03, 0.05, z] as Vec3, pole: [0.5, -1, -0.2] as Vec3, rel: 'chest' as const }, hand: 'fist' as const });
const pallofPress: ExerciseScene = {
  cam: { yaw: 330, pitch: 10 },
  keys: [
    { root: { pos: [0, 0.875, 0] }, legs: feet(0.17, 0, 10, [0.2, 0, 1]), arms: pallofHands(0.17) },
    { root: { pos: [0, 0.875, 0] }, legs: feet(0.17, 0, 10, [0.2, 0, 1]), arms: pallofHands(0.55) },
  ],
  fixed: () => [box(PALLOF_ANCHOR, [0.03, 0.04, 0.03], MAT.frame), box([1.0, 1.0, 0.05], [0.025, 1.0, 0.4], MAT.wood)],
  held: (p) => EQ.band([PALLOF_ANCHOR, mid(p.gripL, p.gripR)]),
};

const legRaise: ExerciseScene = {
  cam: { yaw: 70, pitch: 16 },
  keys: [
    { root: SUPINE, legs: { flex: 90, abd: 3 }, arms: { flex: -6, abd: 4, palm: { fingers: [0, 0, 1], width: [1, 0, 0] } } },
    { root: SUPINE, legs: { flex: 14, abd: 3 }, arms: { flex: -6, abd: 4, palm: { fingers: [0, 0, 1], width: [1, 0, 0] } } },
  ],
  fixed: () => EQ.mat([0, 0, -0.3], 0, 1.9),
};

const twistHands = { ik: { to: [0.03, 0.03, 0.32] as Vec3, pole: [0.6, -1, 0] as Vec3, rel: 'chest' as const }, hand: 'fist' as const };
const twistFeet: LegPose = { ik: { to: [0.12, 0.078, 0.5], pole: [0.1, 1, 0.3] }, foot: { yaw: 5 } };
const russianTwist: ExerciseScene = {
  cam: { yaw: 25, pitch: 18 },
  keys: [
    { root: { pos: [0, null, 0], pitch: -40 }, spine: { pitch: 6, yaw: 38 }, legs: twistFeet, arms: twistHands },
    { root: { pos: [0, null, 0], pitch: -40 }, spine: { pitch: 6, yaw: -38 }, legs: twistFeet, arms: twistHands },
  ],
  fixed: () => EQ.mat([0, 0, 0.1], 0, 1.4),
};

// ---------- bras ----------
const STAND_LEGS = { abd: 6, rot: 8, knee: 4 };
const curlKeys = (twist: number): Pose[] => [
  { legs: STAND_LEGS, arms: { abd: 6, elbow: 5, twist, hand: 'fist' } },
  { legs: STAND_LEGS, arms: { abd: 6, flex: 8, elbow: 135, twist, hand: 'fist' } },
];
const dbCurl: ExerciseScene = { cam: { yaw: 35, pitch: 8 }, keys: curlKeys(90), held: dumbbells };
const hammerCurl: ExerciseScene = { cam: { yaw: 35, pitch: 8 }, keys: curlKeys(0), held: dumbbells };
const bandCurl: ExerciseScene = { cam: { yaw: 35, pitch: 8 }, keys: curlKeys(90), held: bandsFromFeet };
const curlTower = EQ.cableTower(0, 0.62, 0.15, 180);
const cableCurl: ExerciseScene = {
  cam: { yaw: 60, pitch: 8 },
  keys: curlKeys(90),
  fixed: () => curlTower.prims,
  held: (p) => [...EQ.handle(add(p.gripL, scl(sub(p.gripL, p.gripR), 0.15)), add(p.gripR, scl(sub(p.gripR, p.gripL), 0.15))), ...EQ.cable(mid(p.gripL, p.gripR), curlTower.pulley)],
};

const dipHands = { ik: { to: [0.2, 0.49, -0.2] as Vec3, pole: [0, 0, -1] as Vec3 }, palm: { fingers: [0, -0.5, 0.86] as Vec3, width: [1, 0, 0] as Vec3 } };
const dipFeet: LegPose = { ik: { to: [0.13, 0.078, 0.45], pole: [0.1, 1, 0.3] }, foot: { yaw: 6 } };
const benchDip: ExerciseScene = {
  cam: { yaw: 65, pitch: 10 },
  keys: [
    { root: { pos: [0, 0.55, -0.08], pitch: 5 }, legs: dipFeet, arms: dipHands },
    { root: { pos: [0, 0.33, -0.1], pitch: 5 }, legs: dipFeet, arms: dipHands },
  ],
  fixed: () => EQ.chair([0, 0.45, -0.42]),
};

const dbOverheadExtension: ExerciseScene = {
  cam: { yaw: 60, pitch: 8 },
  keys: [
    { legs: STAND_LEGS, arms: { ik: { to: [0.05, 0.64, 0.03], pole: [0.3, 1, 0.2], rel: 'chest' }, hand: 'fist' } },
    { legs: STAND_LEGS, arms: { ik: { to: [0.06, 0.22, -0.2], pole: [0.3, 1, 0.4], rel: 'chest' }, hand: 'fist' } },
  ],
  held: (p) => EQ.dumbbell(add(mid(p.gripL, p.gripR), [0, -0.1, 0]), [0, 1, 0], 1.1),
};

const dbKickback: ExerciseScene = {
  cam: { yaw: 80, pitch: 8 },
  keys: [
    { root: { pos: [0, 0.84, -0.2], pitch: 65 }, head: { pitch: -10 }, legs: feet(0.13, 0, 8, [0.1, 0, 1]), arms: { flex: -8, abd: 5, elbow: 95, hand: 'fist' } },
    { root: { pos: [0, 0.84, -0.2], pitch: 65 }, head: { pitch: -10 }, legs: feet(0.13, 0, 8, [0.1, 0, 1]), arms: { flex: -12, abd: 5, elbow: 3, hand: 'fist' } },
  ],
  held: dumbbells,
};

const pushdownKeys = (): Pose[] => [
  { root: { pos: [0, 0.875, 0], pitch: 8 }, legs: feet(0.15, 0, 10, [0.1, 0, 1]), arms: { flex: 15, abd: 5, elbow: 95, twist: 90, hand: 'fist' } },
  { root: { pos: [0, 0.875, 0], pitch: 8 }, legs: feet(0.15, 0, 10, [0.1, 0, 1]), arms: { flex: 5, abd: 5, elbow: 8, twist: 90, hand: 'fist' } },
];
const PUSHDOWN_ANCHOR: Vec3 = [0, 2.0, 0.58];
const bandPushdown: ExerciseScene = {
  cam: { yaw: 110, pitch: 8 },
  keys: pushdownKeys(),
  fixed: () => [box([0, 1.02, 0.64], [0.42, 1.02, 0.025], MAT.wood), box(PUSHDOWN_ANCHOR, [0.04, 0.03, 0.04], MAT.frame)],
  held: (p) => [...EQ.band([PUSHDOWN_ANCHOR, p.gripL]), ...EQ.band([PUSHDOWN_ANCHOR, p.gripR])],
};
const pushTower = EQ.cableTower(0, 0.62, 1.95, 180);
const cablePushdown: ExerciseScene = {
  cam: { yaw: 70, pitch: 8 },
  keys: pushdownKeys(),
  fixed: () => pushTower.prims,
  held: (p) => [...EQ.handle(p.gripL, p.gripR), ...EQ.cable(mid(p.gripL, p.gripR), pushTower.pulley)],
};

// ---------- épaules ----------
const raiseKeys = (): Pose[] => [
  { legs: STAND_LEGS, arms: { abd: 9, elbow: 10, hand: 'fist' } },
  { legs: STAND_LEGS, arms: { abd: 84, flex: 14, elbow: 16, hand: 'fist' } },
];
const dbLateralRaise: ExerciseScene = { cam: { yaw: 25, pitch: 8 }, keys: raiseKeys(), held: dumbbells };
const bandLateralRaise: ExerciseScene = { cam: { yaw: 25, pitch: 8 }, keys: raiseKeys(), held: bandsFromFeet };

const apartHands = (to: Vec3) => ({ ik: { to, pole: [0.3, -1, 0] as Vec3, rel: 'chest' as const }, hand: 'fist' as const, palm: { fingers: [0, -0.2, 1] as Vec3, width: [0, 1, 0] as Vec3 } });
const bandPullApart: ExerciseScene = {
  cam: { yaw: 30, pitch: 10 },
  keys: [
    { legs: STAND_LEGS, arms: apartHands([0.17, 0.15, 0.53]) },
    { legs: STAND_LEGS, arms: apartHands([0.52, 0.15, 0.12]) },
  ],
  held: (p) => EQ.band([p.gripL, p.gripR], 0.01),
};

const faceTower = EQ.cableTower(0, 0.95, 1.62, 180);
const facePull: ExerciseScene = {
  cam: { yaw: 60, pitch: 10 },
  keys: [
    { root: { pos: [0, 0.86, 0], pitch: 6 }, ...stagger, arms: { ik: { to: [0.07, 1.48, 0.55], pole: [0.5, 0, -1] }, hand: 'fist', palm: { fingers: [0, 0, 1], width: [0, 1, 0] } } },
    { root: { pos: [0, 0.86, 0], pitch: 6 }, ...stagger, arms: { ik: { to: [0.2, 1.52, 0.1], pole: [0.7, 0.4, -0.6] }, hand: 'fist', palm: { fingers: [0, 0, 1], width: [0, 1, 0] } } },
  ],
  fixed: () => faceTower.prims,
  held: (p) => {
    const knot = add(mid(p.gripL, p.gripR), [0, 0, 0.14]);
    return [capsule(p.gripL, knot, 0.012, MAT.rubber), capsule(p.gripR, knot, 0.012, MAT.rubber), ...EQ.cable(knot, faceTower.pulley)];
  },
};

// ---------- mollets ----------
const calfRaise: ExerciseScene = {
  cam: { yaw: 75, pitch: 10 },
  keys: [
    { root: { pos: [0, 0.99, -0.05] }, legs: { ik: { to: [0.1, 0.196, -0.056], pole: [0.1, 0, 1] }, foot: { pitch: 15, yaw: 4 } }, arms: ARMS_DOWN },
    { root: { pos: [0, 1.08, 0.0] }, legs: { ik: { to: [0.1, 0.284, 0.028], pole: [0.1, 0, 1] }, foot: { pitch: -35, yaw: 4 } }, arms: ARMS_DOWN },
  ],
  fixed: () => EQ.step([0, 0.15, 0.26], 0, 0.7, 0.36),
};

// ---------- cardio ----------
const standIK = (y = 0.885): Pose => ({ root: { pos: [0, y, 0] }, legL: front(), legR: front(), arms: ARMS_DOWN });
const stepOut = (side: 1 | -1): Pose => {
  const out: LegPose = { ik: { to: [0.42, 0.078, 0.02], pole: [0.2, 0, 1] }, foot: { yaw: 15 } };
  return { root: { pos: [side * 0.04, 0.84, 0] }, legL: side > 0 ? out : front(), legR: side > 0 ? front() : out, arms: { abd: 150, elbow: 10 } };
};
const stepJacks: ExerciseScene = { cam: { yaw: 15, pitch: 8 }, holds: [0.2, 0.3, 0.2, 0.3], move: 0.55, keys: [standIK(), stepOut(1), standIK(), stepOut(-1)] };

const kneeUp: LegPose = { ik: { to: [0.1, 0.48, 0.41], pole: [0, 0.2, 1] }, foot: { pitch: -20 } };
const highKnee = (side: 1 | -1): Pose => ({
  root: { pos: [0, 0.885, 0] },
  legL: side > 0 ? kneeUp : front(), legR: side > 0 ? front() : kneeUp,
  armL: side > 0 ? { flex: -30, elbow: 90, hand: 'fist' } : { flex: 45, elbow: 90, hand: 'fist' },
  armR: side > 0 ? { flex: 45, elbow: 90, hand: 'fist' } : { flex: -30, elbow: 90, hand: 'fist' },
});
const marchHighKnees: ExerciseScene = { cam: { yaw: 50, pitch: 8 }, holds: [0.2, 0.2], move: 0.5, keys: [highKnee(1), highKnee(-1)] };

const guardL = { ik: { to: [0.1, 0.25, 0.22] as Vec3, pole: [0.6, -1, -0.2] as Vec3, rel: 'chest' as const }, hand: 'fist' as const };
const guardR = { ik: { to: [0.08, 0.23, 0.18] as Vec3, pole: [0.6, -1, -0.2] as Vec3, rel: 'chest' as const }, hand: 'fist' as const };
const punch = { ik: { to: [0.04, 0.27, 0.62] as Vec3, pole: [0.6, -1, -0.2] as Vec3, rel: 'chest' as const }, hand: 'fist' as const };
const boxStance = {
  legL: { ik: { to: [0.13, 0.078, 0.18], pole: [0.2, 0, 1] }, foot: { yaw: 25 } } as LegPose,
  legR: { ik: { to: [0.15, 0.078, -0.22], pole: [0.2, 0, 1] }, foot: { yaw: 40 } } as LegPose,
};
const BOX_ROOT = { pos: [0, 0.85, -0.02] as [number, number, number], yaw: -20 };
const shadowBoxing: ExerciseScene = {
  cam: { yaw: 55, pitch: 8 },
  holds: [0.25, 0.15, 0.25, 0.15],
  move: 0.35,
  keys: [
    { root: BOX_ROOT, head: { pitch: 8 }, ...boxStance, armL: guardL, armR: guardR },
    { root: BOX_ROOT, head: { pitch: 8 }, ...boxStance, armL: punch, armR: guardR },
    { root: BOX_ROOT, head: { pitch: 8 }, ...boxStance, armL: guardL, armR: guardR },
    { root: { ...BOX_ROOT, yaw: -5 }, spine: { yaw: 25 }, head: { pitch: 8 }, ...boxStance, armL: guardL, armR: punch },
  ],
};

const jackLegs = (x: number, y: number, yaw = 8): LegPose => ({ ik: { to: [x, y, 0], pole: [0.3, 0, 1] }, foot: { yaw, pitch: y > 0.1 ? -30 : 0 } });
const jumpingJacks: ExerciseScene = {
  cam: { yaw: 15, pitch: 8 },
  holds: [0.15, 0, 0.15, 0],
  move: 0.28,
  keys: [
    { root: { pos: [0, 0.885, 0] }, legs: jackLegs(0.08, 0.078), arms: { abd: 6, elbow: 8 } },
    { root: { pos: [0, 0.95, 0] }, legs: jackLegs(0.24, 0.16), arms: { abd: 95, elbow: 10 } },
    { root: { pos: [0, 0.83, 0] }, legs: jackLegs(0.4, 0.078, 15), arms: { abd: 172, elbow: 10 } },
    { root: { pos: [0, 0.95, 0] }, legs: jackLegs(0.24, 0.16), arms: { abd: 95, elbow: 10 } },
  ],
};

const plankRoot = { pos: [0, 0.385, 0.8] as [number, number, number], pitch: 75.5 };
const tuck: LegPose = { ik: { to: [0.1, 0.22, 0.74], pole: [0, 0.3, 1] }, foot: { pitch: -55 } };
const backLeg: LegPose = { ik: { to: [0.12, 0.19, 0.02], pole: [0, 0.2, 1] }, foot: { pitch: -75 } };
const mountainClimber: ExerciseScene = {
  cam: { yaw: 65, pitch: 12 },
  holds: [0.1, 0.1],
  move: 0.45,
  keys: [
    { root: plankRoot, head: { pitch: 10 }, legL: tuck, legR: backLeg, arms: pushArms(1.25) },
    { root: plankRoot, head: { pitch: 10 }, legL: backLeg, legR: tuck, arms: pushArms(1.25) },
  ],
};

const squatJump: ExerciseScene = {
  cam: { yaw: 50, pitch: 8 },
  holds: [0.3, 0.05],
  move: 0.45,
  keys: [
    { root: { pos: [0, 0.52, -0.22], pitch: 38 }, head: { pitch: -30 }, legs: feet(0.16, 0, 15, [0.3, 0, 0.95]), arms: { flex: -30, elbow: 10 } },
    { root: { pos: [0, 1.08, 0.02] }, legs: { ik: { to: [0.16, 0.28, 0], pole: [0.3, 0, 0.95] }, foot: { yaw: 15, pitch: -40 } }, arms: { flex: 160, abd: 10, elbow: 5 } },
  ],
};

const skaterLand = (side: 1 | -1): Pose => {
  const land: LegPose = { ik: { to: [0.45, 0.078, 0], pole: [0.2, 0, 1] }, foot: { yaw: 10 } };
  const cross: LegPose = { ik: { to: [-0.25, 0.18, -0.38], pole: [0, -0.5, 1] }, foot: { pitch: -50 } };
  const fwd = { flex: 60, abd: -15, elbow: 30, hand: 'fist' as const };
  const back = { flex: -35, elbow: 20, hand: 'fist' as const };
  return {
    root: { pos: [side * 0.38, 0.72, -0.05], pitch: 30 }, head: { pitch: -15 },
    legL: side > 0 ? land : cross, legR: side > 0 ? cross : land,
    armL: side > 0 ? back : fwd, armR: side > 0 ? fwd : back,
  };
};
const skaterAir: Pose = { root: { pos: [0, 0.9, 0], pitch: 10 }, legs: { ik: { to: [0.12, 0.2, -0.05], pole: [0.1, 0, 1] }, foot: { pitch: -30 } }, arms: { abd: 10, elbow: 20, hand: 'fist' } };
const skater: ExerciseScene = { cam: { yaw: 15, pitch: 8 }, holds: [0.25, 0, 0.25, 0], move: 0.4, keys: [skaterLand(1), skaterAir, skaterLand(-1), skaterAir] };

const floorHands = { ik: { to: [0.22, 0.02, 0.35] as Vec3, pole: [0.5, 0.3, -0.8] as Vec3 }, palm: flatPalm };
const burpee: ExerciseScene = {
  cam: { yaw: 65, pitch: 10 },
  labels: ['Debout', 'Mains au sol', 'Planche', 'Mains au sol', 'Saut'],
  holds: [0.3, 0.15, 0.3, 0.15, 0.05],
  move: 0.55,
  keys: [
    { root: { pos: [0, 0.885, 0] }, legs: feet(0.14, 0, 12, [0.2, 0, 1]), arms: { ik: { to: [0.2, 0.8, 0.05], pole: [0.3, 0, -1] }, hand: 'fist' } },
    { root: { pos: [0, 0.4, -0.1], pitch: 72 }, head: { pitch: -10 }, legs: feet(0.14, 0, 12, [0.2, 0, 1]), arms: floorHands },
    { root: { pos: [0, 0.385, -0.1], pitch: 75.5 }, head: { pitch: 10 }, legs: { ik: { to: [0.12, 0.19, -0.89], pole: [0.1, 0.3, 1] }, foot: { pitch: -75 } }, arms: floorHands },
    { root: { pos: [0, 0.4, -0.1], pitch: 72 }, head: { pitch: -10 }, legs: feet(0.14, 0, 12, [0.2, 0, 1]), arms: floorHands },
    { root: { pos: [0, 1.05, 0.02] }, legs: { ik: { to: [0.14, 0.25, 0], pole: [0.2, 0, 1] }, foot: { yaw: 12, pitch: -40 } }, arms: { ik: { to: [0.2, 2.0, 0.05], pole: [0.5, 0, -1] }, hand: 'fist' } },
  ],
};

const kbSwingCardio: ExerciseScene = { ...kbSwing, holds: [0.1, 0.15], move: 0.5 };

export const EXERCISE_SCENES: Record<string, ExerciseScene> = {
  'box-squat': boxSquat,
  'bw-squat': bwSquat,
  'goblet-squat': gobletSquat,
  'kb-goblet-squat': kbGobletSquat,
  'sumo-squat': sumoSquat,
  'band-squat': bandSquat,
  'leg-press': legPress,
  'back-squat': backSquat,
  'wall-sit': wallSit,
  'db-rdl': dbRdl,
  'kb-deadlift': kbDeadlift,
  'kb-swing': kbSwing,
  'band-good-morning': bandGoodMorning,
  'sl-rdl': slRdl,
  'barbell-rdl': barbellRdl,
  'leg-curl': legCurl,
  superman,
  'reverse-lunge': reverseLunge,
  'db-reverse-lunge': dbReverseLunge,
  'split-squat': splitSquat,
  'step-up': stepUp,
  'bulgarian-split-squat': bulgarian,
  'db-bulgarian-split-squat': dbBulgarian,
  'walking-lunge': walkingLunge,
  'lateral-lunge': lateralLunge,
  'curtsy-lunge': curtsyLunge,
  'glute-bridge': gluteBridge,
  'sl-glute-bridge': slGluteBridge,
  'db-hip-thrust': dbHipThrust,
  'barbell-hip-thrust': barbellHipThrust,
  'band-hip-abduction': bandHipAbduction,
  clamshell,
  'donkey-kick': donkeyKick,
  'band-kickback': bandKickback,
  'cable-kickback': cableKickback,
  'abductor-machine': abductorMachine,
  'incline-pushup': inclinePushup,
  'knee-pushup': kneePushup,
  pushup,
  'db-floor-press': dbFloorPress,
  'db-bench-press': dbBenchPress,
  'band-chest-press': bandChestPress,
  'machine-chest-press': machineChestPress,
  'pike-pushup': pikePushup,
  'db-shoulder-press': dbShoulderPress,
  'band-shoulder-press': bandShoulderPress,
  'machine-shoulder-press': machineShoulderPress,
  'db-row': dbRow,
  'kb-row': kbRow,
  'band-row': bandRow,
  'cable-row': cableRow,
  'prone-ytw': proneYtw,
  'lat-pulldown': latPulldown,
  'band-pulldown': bandPulldown,
  'assisted-pullup-machine': assistedPullup,
  'negative-pullup': negativePullup,
  'band-assisted-pullup': bandAssistedPullup,
  pullup,
  plank,
  'side-plank': sidePlank,
  'dead-bug': deadBug,
  'bird-dog': birdDog,
  crunch,
  'reverse-crunch': reverseCrunch,
  'hollow-hold': hollowHold,
  'pallof-press': pallofPress,
  'leg-raise': legRaise,
  'russian-twist': russianTwist,
  'db-curl': dbCurl,
  'hammer-curl': hammerCurl,
  'band-curl': bandCurl,
  'cable-curl': cableCurl,
  'bench-dip': benchDip,
  'db-overhead-extension': dbOverheadExtension,
  'db-kickback': dbKickback,
  'band-pushdown': bandPushdown,
  'cable-pushdown': cablePushdown,
  'db-lateral-raise': dbLateralRaise,
  'band-lateral-raise': bandLateralRaise,
  'band-pull-apart': bandPullApart,
  'face-pull': facePull,
  'calf-raise': calfRaise,
  'step-jacks': stepJacks,
  'march-high-knees': marchHighKnees,
  'shadow-boxing': shadowBoxing,
  'jumping-jacks': jumpingJacks,
  'mountain-climber': mountainClimber,
  'squat-jump': squatJump,
  skater,
  burpee,
  'kb-swing-cardio': kbSwingCardio,
};

/** Démo 3D d'un exercice (undefined s'il n'en a pas). */
export function sceneFor(exerciseId: string): ExerciseScene | undefined {
  return EXERCISE_SCENES[exerciseId];
}
