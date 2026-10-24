/**
 * Mannequin féminin en 3D : squelette (angles ou cibles de mains / pieds) → primitives géométriques
 * (cônes arrondis, sphères, cylindres, boîtes, tores) rendues par lancer de rayons (voir render.ts).
 *
 * Repère : mètres, Y vers le haut, la mannequin regarde vers +Z, son côté gauche est en +X.
 * Les angles des poses sont en degrés. Les valeurs données pour les bras / jambes sont celles du côté
 * gauche (« vers l'extérieur » = +X) ; elles sont symétrisées pour le côté droit.
 */

export type Vec3 = [number, number, number];
type Mat3 = number[];

/** Primitive : t = 0 cône arrondi (a, ra → b, rb), 1 sphère (a, ra), 2 cylindre (a → b, rayon ra),
 *  3 boîte (centre a, lacet ra en radians, demi-côtés b, arrondi rb, tangage `pitch`), 4 tore (centre a,
 *  grand rayon ra, axe b, petit rayon rb). m = matière, g = groupe, k = lissage avec le reste du groupe. */
export interface Prim {
  t: 0 | 1 | 2 | 3 | 4;
  a: Vec3;
  ra: number;
  b: Vec3;
  rb: number;
  m: number;
  g: number;
  k: number;
  pitch?: number;
}

export const MAT = {
  skin: 0, top: 1, bottom: 2, shoe: 3, hair: 4, chrome: 5, rubber: 6, wood: 7, mat: 8, pad: 9, band: 10, frame: 11,
} as const;
/** Groupes (accélèrent le rendu) : 0 tronc, 1 tête, 2-3 bras, 4-5 jambes, 6 matériel. */
export const NG = 7;
export const EQUIP = 6;

// ---------- maths ----------
const DEG = Math.PI / 180;
export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scl = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const len = (a: Vec3): number => Math.sqrt(dot(a, a));
export const nrm = (a: Vec3): Vec3 => scl(a, 1 / (len(a) || 1));
export const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const mid = (a: Vec3, b: Vec3): Vec3 => scl(add(a, b), 0.5);
export const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => add(a, scl(sub(b, a), t));
function mm(A: Mat3, B: Mat3): Mat3 {
  const C = new Array<number>(9);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) C[r * 3 + c] = A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c];
  return C;
}
const mv = (M: Mat3, p: Vec3): Vec3 => [
  M[0] * p[0] + M[1] * p[1] + M[2] * p[2],
  M[3] * p[0] + M[4] * p[1] + M[5] * p[2],
  M[6] * p[0] + M[7] * p[1] + M[8] * p[2],
];
function rx(a: number): Mat3 { const c = Math.cos(a * DEG), s = Math.sin(a * DEG); return [1, 0, 0, 0, c, -s, 0, s, c]; }
function ry(a: number): Mat3 { const c = Math.cos(a * DEG), s = Math.sin(a * DEG); return [c, 0, s, 0, 1, 0, -s, 0, c]; }
function rz(a: number): Mat3 { const c = Math.cos(a * DEG), s = Math.sin(a * DEG); return [c, -s, 0, s, c, 0, 0, 0, 1]; }
/** Rotation d'un vecteur : lacet (autour de Y) puis tangage (autour de X), en degrés. */
export const rotYX = (v: Vec3, yaw: number, pitch = 0): Vec3 => mv(mm(ry(yaw), rx(pitch)), v);
interface Frame { o: Vec3; R: Mat3 }
const frame = (o: Vec3, R: Mat3): Frame => ({ o, R });
const at = (f: Frame, p: Vec3): Vec3 => add(f.o, mv(f.R, p));
/** Repère à partir de ses axes (colonnes X, Y, Z). */
const axes = (X: Vec3, Y: Vec3, Z: Vec3): Mat3 => [X[0], Y[0], Z[0], X[1], Y[1], Z[1], X[2], Y[2], Z[2]];
const ortho = (v: Vec3, n: Vec3): Vec3 => nrm(sub(v, scl(n, dot(v, n))));
const mirror = (v: Vec3, s: number): Vec3 => [v[0] * s, v[1], v[2]];

/** IK à deux segments : le coude / genou est placé du côté `pole`. */
function ik2(J: Vec3, T: Vec3, L1: number, L2: number, pole: Vec3, bendFront: boolean) {
  const d = sub(T, J);
  let dist = len(d);
  const u = scl(d, 1 / (dist || 1));
  dist = Math.min(Math.max(dist, Math.abs(L1 - L2) + 1e-4), L1 + L2 - 1e-4);
  const ca = (L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist);
  const a = Math.acos(Math.max(-1, Math.min(1, ca)));
  const w = ortho(pole, u);
  const m = add(J, scl(add(scl(u, Math.cos(a)), scl(w, Math.sin(a))), L1));
  const end = add(J, scl(u, dist));
  const d1 = nrm(sub(m, J)), d2 = nrm(sub(end, m));
  // Avant du segment haut : côté vers lequel se plie le segment bas (genou : vers le pôle ; coude : à l'opposé).
  const Z1 = ortho(bendFront ? w : scl(w, -1), d1);
  const Y1 = scl(d1, -1);
  const X = cross(Y1, Z1);
  const Y2 = scl(d2, -1);
  const Z2 = cross(X, Y2);
  return { up: frame(J, axes(X, Y1, Z1)), lo: frame(m, axes(X, Y2, Z2)), mid: m, end };
}

// ---------- poses ----------
/** Cible d'IK : coordonnées monde, ou repère du buste / bassin / tête (`rel`), qui suit alors le corps. */
export interface Target { to: Vec3; pole?: Vec3; rel?: 'chest' | 'pelvis' | 'head' }
export interface ArmPose {
  flex?: number; abd?: number; rot?: number; elbow?: number; wrist?: number; twist?: number;
  hand?: 'open' | 'fist';
  /** Poignet amené en `to` (coordonnées monde), coude pointé vers `pole`. */
  ik?: Target;
  /** Orientation de la main dans le monde : direction des doigts et largeur de la paume. */
  palm?: { fingers: Vec3; width: Vec3 };
}
export interface LegPose {
  flex?: number; abd?: number; rot?: number; knee?: number; ankle?: number;
  /** Cheville amenée en `to`, genou pointé vers `pole`. */
  ik?: Target;
  /** Orientation du pied dans le monde : yaw vers l'extérieur, pitch = pointe relevée. */
  foot?: { yaw?: number; pitch?: number };
}
export interface Pose {
  /** pos : bassin (centre des hanches) ; y = null → descendu jusqu'au contact avec le sol. */
  root?: { pos?: [number, number | null, number]; yaw?: number; pitch?: number; roll?: number };
  spine?: { pitch?: number; roll?: number; yaw?: number };
  head?: { pitch?: number; yaw?: number; roll?: number };
  arms?: ArmPose; armL?: ArmPose; armR?: ArmPose;
  legs?: LegPose; legL?: LegPose; legR?: LegPose;
}
interface FullArm extends Required<Omit<ArmPose, 'ik' | 'palm'>> { ik?: Target; palm?: ArmPose['palm'] }
interface FullLeg extends Required<Omit<LegPose, 'ik' | 'foot'>> { ik?: Target; foot?: LegPose['foot'] }
interface FullPose {
  root: { pos?: [number, number | null, number]; yaw: number; pitch: number; roll: number };
  spine: { pitch: number; roll: number; yaw: number };
  head: { pitch: number; yaw: number; roll: number };
  armL: FullArm; armR: FullArm; legL: FullLeg; legR: FullLeg;
}
const ARM0: FullArm = { flex: 0, abd: 0, rot: 0, elbow: 0, wrist: 0, twist: 0, hand: 'open' };
const LEG0: FullLeg = { flex: 0, abd: 0, rot: 0, knee: 0, ankle: 0 };
export function fullPose(p: Pose): FullPose {
  return {
    root: { yaw: 0, pitch: 0, roll: 0, ...p.root },
    spine: { pitch: 0, roll: 0, yaw: 0, ...p.spine },
    head: { pitch: 0, yaw: 0, roll: 0, ...p.head },
    armL: { ...ARM0, ...p.arms, ...p.armL },
    armR: { ...ARM0, ...p.arms, ...p.armR },
    legL: { ...LEG0, ...p.legs, ...p.legL },
    legR: { ...LEG0, ...p.legs, ...p.legR },
  };
}
/** Interpolation de deux poses complètes (nombres, vecteurs ; le reste bascule à mi-chemin). */
function lerpAny(a: unknown, b: unknown, t: number): unknown {
  // Un angle absent d'une position vaut 0 (sa valeur par défaut) : il s'interpole quand même.
  if (typeof a === 'number' && b === undefined) return a * (1 - t);
  if (a === undefined && typeof b === 'number') return b * t;
  if (b === undefined) return a;
  if (a === undefined) return b;
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * t;
  if (Array.isArray(a) && Array.isArray(b)) return a.map((v, i) => (v === null || b[i] === null ? null : (v as number) + ((b[i] as number) - (v as number)) * t));
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const o: Record<string, unknown> = {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) o[k] = lerpAny((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], t);
    return o;
  }
  return t < 0.5 ? a : b;
}

// ---------- corps ----------
export type Pts = Record<string, Vec3>;
export interface Body { prims: Prim[]; pts: Pts; ikGroups: number[] }

/** Construit le corps, bassin en `origin`. Avec `skipIK`, les membres en IK sont omis (sert au contact au sol). */
function buildBody(pose: FullPose, origin: Vec3, skipIK: boolean): Body {
  const prims: Prim[] = [];
  const cone = (a: Vec3, ra: number, b: Vec3, rb: number, m: number, g: number, k = 0.03) => prims.push({ t: 0, a, ra, b, rb, m, g, k });
  const ball = (a: Vec3, r: number, m: number, g: number, k = 0.03) => prims.push({ t: 1, a, ra: r, b: a, rb: r, m, g, k });
  const pts: Pts = {};
  const ikGroups: number[] = [];

  const Rp = mm(mm(ry(pose.root.yaw), rx(pose.root.pitch)), rz(pose.root.roll));
  const pel = frame(origin, Rp);
  const sp = pose.spine;
  const half = mm(mm(ry(sp.yaw / 2), rx(sp.pitch / 2)), rz(sp.roll / 2));
  const waist = frame(at(pel, [0, 0.13, 0]), mm(Rp, half));
  const chest = frame(at(waist, [0, 0.17, 0]), mm(waist.R, half));
  const hd = pose.head;
  const head = frame(at(chest, [0, 0.185, -0.02]), mm(chest.R, mm(mm(ry(hd.yaw), rx(hd.pitch)), rz(hd.roll))));

  // Bassin et fessiers (legging taille haute)
  for (const s of [1, -1]) ball(at(pel, [s * 0.07, -0.015, 0]), 0.098, MAT.bottom, 0);
  cone(at(pel, [-0.06, 0.02, 0]), 0.1, at(pel, [0.06, 0.02, 0]), 0.1, MAT.bottom, 0);
  for (const s of [1, -1]) ball(at(pel, [s * 0.056, -0.05, -0.068]), 0.084, MAT.bottom, 0);
  cone(at(pel, [-0.045, 0.04, 0.018]), 0.088, at(pel, [0.045, 0.04, 0.018]), 0.088, MAT.bottom, 0);
  // Taille, cage thoracique, poitrine (débardeur)
  for (const s of [1, -1]) {
    cone(at(waist, [s * 0.04, -0.04, 0]), 0.086, at(waist, [s * 0.048, 0.07, -0.004]), 0.08, MAT.top, 0);
    cone(at(chest, [s * 0.05, -0.06, -0.002]), 0.082, at(chest, [s * 0.06, 0.075, -0.012]), 0.09, MAT.top, 0);
    ball(at(chest, [s * 0.056, 0.045, 0.072]), 0.057, MAT.top, 0, 0.035);
    cone(at(chest, [s * 0.035, 0.16, -0.03]), 0.046, at(chest, [s * 0.14, 0.15, -0.025]), 0.042, MAT.top, 0);
  }
  cone(at(chest, [-0.1, 0.13, -0.022]), 0.06, at(chest, [0.1, 0.13, -0.022]), 0.06, MAT.top, 0);
  cone(at(chest, [0, 0.14, -0.022]), 0.05, at(head, [0, 0.075, 0.004]), 0.042, MAT.skin, 0); // cou

  // Tête, cheveux, chignon (groupe 1)
  ball(at(head, [0, 0.15, -0.006]), 0.086, MAT.skin, 1, 0.025);
  ball(at(head, [0, 0.112, 0.03]), 0.068, MAT.skin, 1, 0.025);
  cone(at(head, [0, 0.092, 0.024]), 0.056, at(head, [0, 0.058, 0.058]), 0.03, MAT.skin, 1, 0.025);
  cone(at(head, [0, 0.128, 0.088]), 0.011, at(head, [0, 0.104, 0.101]), 0.012, MAT.skin, 1, 0.012);
  for (const s of [1, -1]) ball(at(head, [s * 0.082, 0.116, -0.004]), 0.017, MAT.skin, 1, 0.012);
  ball(at(head, [0, 0.162, -0.02]), 0.09, MAT.hair, 1, 0.01);
  cone(at(head, [0, 0.205, -0.05]), 0.03, at(head, [0, 0.238, -0.052]), 0.043, MAT.hair, 1, 0.02);
  pts.head = at(head, [0, 0.13, 0]);
  pts.headTop = at(head, [0, 0.25, -0.03]);
  pts.chin = at(head, [0, 0.05, 0.06]);
  pts.nape = at(head, [0, 0.06, -0.07]);

  // Bras (groupes 2 et 3)
  for (const s of [1, -1]) {
    const a = s > 0 ? pose.armL : pose.armR;
    const g = s > 0 ? 2 : 3;
    const L = s > 0 ? 'L' : 'R';
    const sh = at(chest, [s * 0.155, 0.152, -0.022]);
    pts['shoulder' + L] = sh;
    let ua: Frame, fa: Frame, elbow: Vec3, wrist: Vec3;
    if (a.ik) {
      ikGroups.push(g);
      if (skipIK) continue;
      const F = a.ik.rel === 'chest' ? chest : a.ik.rel === 'pelvis' ? pel : a.ik.rel === 'head' ? head : null;
      const T = F ? at(F, mirror(a.ik.to, s)) : mirror(a.ik.to, s);
      const pole = mirror(a.ik.pole ?? [0, 0, -1], s);
      const r = ik2(sh, T, 0.285, 0.235, F ? mv(F.R, pole) : pole, false);
      ua = r.up; fa = r.lo; elbow = r.mid; wrist = r.end;
    } else {
      ua = frame(sh, mm(chest.R, mm(mm(rz(s * a.abd), rx(-a.flex)), ry(s * a.rot))));
      elbow = at(ua, [0, -0.285, 0]);
      fa = frame(elbow, mm(ua.R, rx(-a.elbow)));
      wrist = at(fa, [0, -0.235, 0]);
    }
    let hand: Frame;
    if (a.palm) {
      const Yh = scl(nrm(mirror(a.palm.fingers, s)), -1);
      const Zh = ortho(mirror(a.palm.width, s), Yh);
      hand = frame(wrist, axes(cross(Yh, Zh), Yh, Zh));
    } else {
      hand = frame(wrist, mm(fa.R, mm(rx(-a.wrist), ry(-s * a.twist))));
    }
    ball(at(ua, [s * 0.008, -0.022, 0]), 0.05, MAT.skin, g);
    cone(sh, 0.043, elbow, 0.03, MAT.skin, g);
    ball(at(ua, [0, -0.13, 0.004]), 0.039, MAT.skin, g, 0.04);
    cone(elbow, 0.031, wrist, 0.021, MAT.skin, g);
    ball(at(fa, [0, -0.065, 0.002]), 0.033, MAT.skin, g, 0.04);
    if (a.hand === 'fist') {
      cone(at(hand, [0, -0.012, 0]), 0.024, at(hand, [0, -0.07, 0.008]), 0.03, MAT.skin, g, 0.02);
      pts['grip' + L] = at(hand, [0, -0.06, 0.008]);
    } else {
      // Main à plat : deux cônes côte à côte dans la largeur de la paume (axe Z local).
      for (const w of [-1, 1]) {
        cone(at(hand, [0, -0.012, w * 0.014]), 0.019, at(hand, [0, -0.095, w * 0.018]), 0.015, MAT.skin, g, 0.02);
        cone(at(hand, [0, -0.095, w * 0.018]), 0.014, at(hand, [0, -0.165, w * 0.014]), 0.01, MAT.skin, g, 0.015);
      }
      pts['grip' + L] = at(hand, [0, -0.07, 0]);
    }
    pts['handAxis' + L] = mv(hand.R, [0, 0, 1]);
    pts['handDir' + L] = mv(hand.R, [0, -1, 0]);
    pts['hand' + L] = at(hand, [0, -0.08, 0]);
    pts['wrist' + L] = wrist;
    pts['elbow' + L] = elbow;
  }

  // Jambes (groupes 4 et 5)
  for (const s of [1, -1]) {
    const l = s > 0 ? pose.legL : pose.legR;
    const g = s > 0 ? 4 : 5;
    const L = s > 0 ? 'L' : 'R';
    const hip = at(pel, [s * 0.085, 0, 0]);
    pts['hip' + L] = hip;
    let th: Frame, sk: Frame, knee: Vec3, ankle: Vec3;
    if (l.ik) {
      ikGroups.push(g);
      if (skipIK) continue;
      const F = l.ik.rel === 'pelvis' ? pel : l.ik.rel === 'chest' ? chest : null;
      const T = F ? at(F, mirror(l.ik.to, s)) : mirror(l.ik.to, s);
      const pole = mirror(l.ik.pole ?? [0, 0, 1], s);
      const r = ik2(hip, T, 0.41, 0.405, F ? mv(F.R, pole) : pole, true);
      th = r.up; sk = r.lo; knee = r.mid; ankle = r.end;
    } else {
      th = frame(hip, mm(Rp, mm(mm(rz(s * l.abd), rx(-l.flex)), ry(s * l.rot))));
      knee = at(th, [0, -0.41, 0]);
      sk = frame(knee, mm(th.R, rx(l.knee)));
      ankle = at(sk, [0, -0.405, 0]);
    }
    const ft = l.foot ? frame(ankle, mm(ry(s * (l.foot.yaw ?? 0)), rx(-(l.foot.pitch ?? 0)))) : frame(ankle, mm(sk.R, rx(-l.ankle)));
    cone(hip, 0.086, knee, 0.048, MAT.bottom, g);
    ball(at(th, [s * 0.004, -0.16, 0.01]), 0.066, MAT.bottom, g, 0.08);
    cone(knee, 0.044, ankle, 0.03, MAT.bottom, g, 0.045);
    ball(at(sk, [0, -0.12, -0.018]), 0.046, MAT.bottom, g, 0.08);
    ball(ankle, 0.036, MAT.shoe, g, 0.02);
    ball(at(ft, [0, -0.04, -0.038]), 0.037, MAT.shoe, g, 0.02);
    cone(at(ft, [0, -0.044, -0.03]), 0.037, at(ft, [0, -0.05, 0.14]), 0.03, MAT.shoe, g, 0.02);
    ball(at(ft, [0, -0.052, 0.158]), 0.027, MAT.shoe, g, 0.02);
    pts['ankle' + L] = ankle;
    pts['heel' + L] = at(ft, [0, -0.077, -0.04]);
    pts['toe' + L] = at(ft, [0, -0.05, 0.16]);
    pts['knee' + L] = knee;
    pts['thigh' + L] = at(th, [0, -0.2, 0]);
    pts['shinBack' + L] = at(sk, [0, -0.32, -0.07]);
    pts['sole' + L] = at(ft, [0, -0.085, 0.05]);
  }
  pts.pelvis = pel.o;
  pts.navel = at(pel, [0, 0.1, 0.1]);
  pts.chest = chest.o;
  pts.sternum = at(chest, [0, 0.06, 0.12]);
  pts.upperBack = at(chest, [0, 0.08, -0.1]);
  pts.gluteL = at(pel, [0.056, -0.05, -0.068]);
  pts.gluteR = at(pel, [-0.056, -0.05, -0.068]);
  pts.hipFront = at(pel, [0, 0.0, 0.12]);
  // Axes (directions) du bassin et du buste, pour placer du matériel contre le corps.
  pts.pelvisX = mv(pel.R, [1, 0, 0]); pts.pelvisY = mv(pel.R, [0, 1, 0]); pts.pelvisZ = mv(pel.R, [0, 0, 1]);
  pts.chestX = mv(chest.R, [1, 0, 0]); pts.chestY = mv(chest.R, [0, 1, 0]); pts.chestZ = mv(chest.R, [0, 0, 1]);
  return { prims, pts, ikGroups };
}

// ---------- matériel ----------
const P = (t: Prim['t'], a: Vec3, ra: number, b: Vec3, rb: number, m: number, pitch?: number): Prim => ({ t, a, ra, b, rb, m, g: EQUIP, k: 0, pitch });
/** Boîte arrondie : centre, demi-côtés, lacet / tangage en degrés. */
export const box = (c: Vec3, half: Vec3, m: number, yaw = 0, pitch = 0, round = 0.008): Prim => P(3, c, yaw * DEG, half, round, m, pitch * DEG);
export const capsule = (a: Vec3, b: Vec3, r: number, m: number): Prim => P(0, a, r, b, r, m);
export const cyl = (a: Vec3, b: Vec3, r: number, m: number): Prim => P(2, a, r, b, 0, m);
export const sphere = (c: Vec3, r: number, m: number): Prim => P(1, c, r, c, r, m);
export const torus = (c: Vec3, R: number, axis: Vec3, r: number, m: number): Prim => P(4, c, R, nrm(axis), r, m);

export const EQ = {
  dumbbell(c: Vec3, axis: Vec3, size = 1): Prim[] {
    const ax = nrm(axis);
    const h = 0.075 * size, e = 0.118 * size, r = 0.048 * size;
    return [
      capsule(add(c, scl(ax, -h)), add(c, scl(ax, h)), 0.015, MAT.chrome),
      cyl(add(c, scl(ax, h)), add(c, scl(ax, e)), r, MAT.rubber),
      cyl(add(c, scl(ax, -e)), add(c, scl(ax, -h)), r, MAT.rubber),
    ];
  },
  /** Kettlebell : `c` = centre de la poignée (là où on la tient), `up` = vers le haut de la kettlebell. */
  kettlebell(c: Vec3, up: Vec3 = [0, 1, 0], handleDir: Vec3 = [1, 0, 0]): Prim[] {
    const u = nrm(up);
    const body = add(c, scl(u, -0.12));
    return [sphere(body, 0.085, MAT.rubber), torus(add(c, scl(u, -0.035)), 0.055, cross(u, nrm(handleDir)), 0.012, MAT.rubber)];
  },
  barbell(c: Vec3, axis: Vec3 = [1, 0, 0], plateR = 0.225): Prim[] {
    const ax = nrm(axis);
    const pt = (d: number) => add(c, scl(ax, d));
    return [
      capsule(pt(-0.78), pt(0.78), 0.014, MAT.chrome),
      capsule(pt(0.78), pt(1.0), 0.025, MAT.chrome),
      capsule(pt(-1.0), pt(-0.78), 0.025, MAT.chrome),
      cyl(pt(0.8), pt(0.86), plateR, MAT.rubber),
      cyl(pt(-0.86), pt(-0.8), plateR, MAT.rubber),
    ];
  },
  /** Banc plat : `top` = centre du dessus du coussin, long selon Z local. */
  bench(top: Vec3, yaw = 0, length = 1.15, width = 0.3): Prim[] {
    const Pt = (x: number, y: number, z: number): Vec3 => add([top[0], 0, top[2]], rotYX([x, y, z], yaw));
    const H = top[1];
    return [
      box(Pt(0, H - 0.04, 0), [width / 2, 0.04, length / 2], MAT.pad, yaw, 0, 0.03),
      box(Pt(0, H - 0.1, 0), [0.04, 0.02, length / 2 - 0.08], MAT.frame, yaw),
      ...[1, -1].map((z) => box(Pt(0, (H - 0.1) / 2, z * (length / 2 - 0.12)), [0.03, (H - 0.1) / 2, 0.03], MAT.frame, yaw)),
      ...[1, -1].map((z) => box(Pt(0, 0.02, z * (length / 2 - 0.12)), [width / 2 + 0.03, 0.02, 0.035], MAT.frame, yaw)),
    ];
  },
  /** Chaise : `seat` = centre du dessus de l'assise, dossier côté -Z local. */
  chair(seat: Vec3, yaw = 0): Prim[] {
    const Pt = (x: number, y: number, z: number): Vec3 => add([seat[0], 0, seat[2]], rotYX([x, y, z], yaw));
    const H = seat[1];
    const out = [box(Pt(0, H - 0.02, 0), [0.215, 0.02, 0.215], MAT.wood, yaw, 0, 0.012)];
    for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) out.push(box(Pt(x * 0.185, (H - 0.04) / 2, z * 0.185), [0.018, (H - 0.04) / 2, 0.018], MAT.wood, yaw, 0, 0.006));
    for (const x of [1, -1]) out.push(box(Pt(x * 0.185, H + 0.21, -0.19), [0.018, 0.21, 0.016], MAT.wood, yaw, 0, 0.006));
    out.push(box(Pt(0, H + 0.33, -0.195), [0.2, 0.09, 0.014], MAT.wood, yaw, 0, 0.01));
    return out;
  },
  /** Marche / step : `top` = centre du dessus. */
  step(top: Vec3, yaw = 0, w = 0.62, d = 0.36): Prim[] {
    return [box([top[0], top[1] / 2, top[2]], [w / 2, top[1] / 2, d / 2], MAT.pad, yaw, 0, 0.02)];
  },
  /** Tapis de sol centré en `c`, long selon Z local. */
  mat(c: Vec3, yaw = 0, length = 1.8): Prim[] {
    return [box([c[0], 0.005, c[2]], [0.31, 0.005, length / 2], MAT.mat, yaw, 0, 0.004)];
  },
  /** Mur : face avant en z = `z` (côté +Z), centré en x. */
  wall(x: number, z: number, width = 1.3, height = 1.5): Prim[] {
    return [box([x, height / 2, z - 0.05], [width / 2, height / 2, 0.05], MAT.frame, 0, 0, 0.01)];
  },
  /** Barre de traction : `c` = centre de la barre (axe X), avec deux montants. */
  pullupBar(c: Vec3, width = 1.15): Prim[] {
    const out = [capsule([c[0] - width / 2, c[1], c[2]], [c[0] + width / 2, c[1], c[2]], 0.016, MAT.chrome)];
    for (const s of [1, -1]) out.push(box([c[0] + s * (width / 2 + 0.03), c[1] / 2 + 0.05, c[2] - 0.04], [0.03, c[1] / 2 + 0.05, 0.03], MAT.frame));
    return out;
  },
  /** Élastique passant par les points donnés. */
  band(points: Vec3[], r = 0.008): Prim[] {
    const out: Prim[] = [];
    for (let i = 0; i + 1 < points.length; i++) out.push(capsule(points[i], points[i + 1], r, MAT.band));
    return out;
  },
  /** Mini-band autour des deux cuisses, juste au-dessus des genoux. */
  miniBand(pts: Pts): Prim[] {
    const a = lerp3(pts.kneeL, pts.thighL, 0.25), b = lerp3(pts.kneeR, pts.thighR, 0.25);
    const ax = nrm(sub(a, b));
    return [torus(a, 0.052, ax, 0.009, MAT.band), torus(b, 0.052, ax, 0.009, MAT.band), capsule(add(a, [0, 0, 0.045]), add(b, [0, 0, 0.045]), 0.008, MAT.band), capsule(add(a, [0, 0, -0.045]), add(b, [0, 0, -0.045]), 0.008, MAT.band)];
  },
  /** Colonne de poulie posée au sol en (x, z), poulie à la hauteur `pulleyY`, poulie tournée vers +Z local. */
  cableTower(x: number, z: number, pulleyY: number, yaw = 0, height = 2.1): { prims: Prim[]; pulley: Vec3 } {
    const f = rotYX([0, 0, 1], yaw);
    const pulley = add([x, pulleyY, z], scl(f, 0.12));
    return {
      pulley,
      prims: [
        box([x, height / 2, z], [0.09, height / 2, 0.09], MAT.frame, yaw, 0, 0.01),
        box(add([x, 0.03, z], scl(f, 0.05)), [0.3, 0.03, 0.3], MAT.frame, yaw, 0, 0.01),
        cyl(add(pulley, rotYX([-0.02, 0, 0], yaw)), add(pulley, rotYX([0.02, 0, 0], yaw)), 0.045, MAT.rubber),
      ],
    };
  },
  cable(a: Vec3, b: Vec3): Prim[] {
    return [capsule(a, b, 0.004, MAT.rubber)];
  },
  /** Poignée droite entre les deux mains. */
  handle(a: Vec3, b: Vec3, r = 0.016): Prim[] {
    return [capsule(a, b, r, MAT.chrome)];
  },
};

// ---------- scène d'un exercice ----------
export interface ExerciseScene {
  /** Positions successives (au moins 2) ; l'animation boucle de l'une à l'autre. */
  keys: Pose[];
  labels?: string[];
  /** Pause sur chaque position (s) ; 0,7 s par défaut. */
  holds?: number[];
  /** Durée d'un passage d'une position à la suivante (s) ; 0,9 s par défaut. */
  move?: number;
  /** Durées propres à chaque passage (position k → k+1), prioritaires sur `move`. */
  moves?: number[];
  /** Précision affichée sous la démo quand elle diffère un peu de l'exercice réel. */
  note?: string;
  cam?: { yaw: number; pitch: number };
  /** Sans root.pos : point ramené en X = Z = 0 (pieds par défaut), point le plus bas posé au sol. */
  anchor?: 'feet' | 'toes' | 'hands' | 'pelvis' | 'knees';
  /** Matériel immobile, calculé une fois d'après le corps dans chaque position. */
  fixed?: (bodies: Body[]) => Prim[];
  /** Matériel qui suit le corps (haltères, poignées…). */
  held?: (pts: Pts, fixedPts: Pts) => Prim[];
  /** Points de référence fixes (poulie…) partagés entre `fixed` et `held`. */
  refs?: (bodies: Body[]) => Pts;
}

export function lowestY(prims: Prim[]): number {
  let m = Infinity;
  for (const p of prims) {
    if (p.t >= 3) m = Math.min(m, bounds([p]).lo[1]);
    else m = Math.min(m, p.a[1] - p.ra, p.b[1] - p.rb);
  }
  return m;
}

function placedBody(ex: ExerciseScene, pose: FullPose): Body {
  const pos = pose.root.pos;
  const notIK = (b: Body) => b.prims.filter((p) => !b.ikGroups.includes(p.g));
  if (pos) {
    const origin: Vec3 = [pos[0], pos[1] ?? 1, pos[2]];
    if (pos[1] === null) origin[1] -= lowestY(notIK(buildBody(pose, origin, true)));
    return buildBody(pose, origin, false);
  }
  const probe = buildBody(pose, [0, 0, 0], true);
  const q = probe.pts;
  const anc = ex.anchor === 'hands' ? mid(q.handL, q.handR)
    : ex.anchor === 'toes' ? mid(q.toeL, q.toeR)
    : ex.anchor === 'knees' ? mid(q.kneeL, q.kneeR)
    : ex.anchor === 'pelvis' ? q.pelvis
    : mid(q.ankleL, q.ankleR);
  return buildBody(pose, [-anc[0], -lowestY(notIK(probe)), -anc[2]], false);
}

interface Cache { full: FullPose[]; bodies: Body[]; fixed: Prim[]; refs: Pts }
const cache = new WeakMap<ExerciseScene, Cache>();
function prepared(ex: ExerciseScene): Cache {
  let c = cache.get(ex);
  if (!c) {
    const full = ex.keys.map(fullPose);
    const bodies = full.map((p) => placedBody(ex, p));
    c = { full, bodies, fixed: ex.fixed ? ex.fixed(bodies) : [], refs: ex.refs ? ex.refs(bodies) : {} };
    for (const p of c.fixed) { p.g = EQUIP; p.k = 0; }
    cache.set(ex, c);
  }
  return c;
}

/** Scène à la phase `phase` ∈ [0, n) : 0 = position 1, 1 = position 2… (n = nombre de positions, boucle). */
export function scene(ex: ExerciseScene, phase: number): { prims: Prim[]; pts: Pts } {
  const c = prepared(ex);
  const n = c.full.length;
  const k = ((Math.floor(phase) % n) + n) % n;
  const t = phase - Math.floor(phase);
  const a = c.full[k], b = c.full[(k + 1) % n];
  const pose = t === 0 ? a : (lerpAny(a, b, t) as FullPose);
  if (t > 0) {
    // Un pied qui se déplace au sol décolle en chemin (pas de glissement).
    for (const L of ['legL', 'legR'] as const) {
      const p = a[L].ik?.to, q = b[L].ik?.to, cur = pose[L].ik;
      if (!p || !q || !cur) continue;
      const d = Math.hypot(q[0] - p[0], q[2] - p[2]);
      if (d > 0.12) cur.to = [cur.to[0], cur.to[1] + Math.min(0.12, 0.25 * d) * Math.sin(Math.PI * t), cur.to[2]];
    }
  }
  const body = placedBody(ex, pose);
  const held = ex.held ? ex.held(body.pts, c.refs) : [];
  for (const p of held) { p.g = EQUIP; p.k = 0; }
  return { prims: body.prims.concat(held, c.fixed), pts: body.pts };
}

/** Boîte englobante (et sphère) d'une liste de primitives. */
export function bounds(prims: Prim[]): { c: Vec3; r: number; lo: Vec3; hi: Vec3 } {
  const lo: Vec3 = [Infinity, Infinity, Infinity], hi: Vec3 = [-Infinity, -Infinity, -Infinity];
  const grow = (q: Vec3, e: Vec3) => {
    for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], q[i] - e[i]); hi[i] = Math.max(hi[i], q[i] + e[i]); }
  };
  for (const p of prims) {
    if (p.t === 3) {
      if (p.pitch) { const r = len(p.b); grow(p.a, [r, r, r]); continue; }
      const c = Math.abs(Math.cos(p.ra)), s = Math.abs(Math.sin(p.ra));
      grow(p.a, [c * p.b[0] + s * p.b[2], p.b[1], s * p.b[0] + c * p.b[2]]);
    } else if (p.t === 4) {
      const r = p.ra + p.rb; grow(p.a, [r, r, r]);
    } else {
      grow(p.a, [p.ra, p.ra, p.ra]);
      grow(p.b, [p.rb, p.rb, p.rb]);
    }
  }
  const c = mid(lo, hi);
  return { c, r: len(sub(hi, c)), lo, hi };
}

/** Point dans le repère (bassin ou buste) d'un corps : origine + x·X + y·Y + z·Z. */
export function local(pts: Pts, frameName: 'pelvis' | 'chest', p: Vec3): Vec3 {
  const o = pts[frameName];
  return add(add(add(o, scl(pts[frameName + 'X'], p[0])), scl(pts[frameName + 'Y'], p[1])), scl(pts[frameName + 'Z'], p[2]));
}

/** Englobant de toutes les positions d'un exercice (cadrage stable pendant l'animation). */
export function sceneBounds(ex: ExerciseScene): { c: Vec3; r: number; lo: Vec3; hi: Vec3 } {
  const n = ex.keys.length;
  const all: Prim[] = [];
  for (let i = 0; i < n; i++) for (const t of [0, 0.5]) all.push(...scene(ex, i + t).prims);
  return bounds(all);
}
