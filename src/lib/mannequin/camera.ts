import { cross, dot, nrm, scl, sub, type Vec3 } from './core';
import type { Camera } from './render';

export const FOV = 30;
/** Marge autour de la scène : 1 = au ras du cadre. */
export const MARGIN = 1.16;

const dirFrom = (yawDeg: number, pitchDeg: number): Vec3 => {
  const y = (yawDeg * Math.PI) / 180, p = (pitchDeg * Math.PI) / 180;
  return [Math.cos(p) * Math.sin(y), Math.sin(p), Math.cos(p) * Math.cos(y)];
};

/** Distance qui garde toute la boîte `lo`–`hi` dans le cadre vu sous cet angle (± 20° autour, pour une rotation douce). */
export function fitDistance(bound: { c: Vec3; lo: Vec3; hi: Vec3 }, yawDeg: number, pitchDeg: number, aspect: number): number {
  const ty = Math.tan((FOV * Math.PI) / 360) / MARGIN;
  const tx = ty * aspect;
  const corners: Vec3[] = [];
  for (const x of [bound.lo[0], bound.hi[0]]) for (const y of [bound.lo[1], bound.hi[1]]) for (const z of [bound.lo[2], bound.hi[2]]) corners.push(sub([x, y, z], bound.c));
  let D = 0.5;
  for (let a = yawDeg - 20; a <= yawDeg + 20; a += 10) {
    const b = dirFrom(a, pitchDeg);
    const f = scl(b, -1);
    const r = nrm(cross(f, [0, 1, 0]));
    const u = cross(r, f);
    for (const q of corners) {
      const qb = dot(q, b);
      D = Math.max(D, Math.abs(dot(q, r)) / tx + qb, Math.abs(dot(q, u)) / ty + qb);
    }
  }
  return D;
}

/** Caméra en orbite autour de `target`. */
export function orbit(target: Vec3, yawDeg: number, pitchDeg: number, dist: number): Camera {
  const b = dirFrom(yawDeg, pitchDeg);
  return { pos: [target[0] + b[0] * dist, target[1] + b[1] * dist, target[2] + b[2] * dist], target, fov: FOV };
}
