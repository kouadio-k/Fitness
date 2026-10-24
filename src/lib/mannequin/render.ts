/**
 * Rendu WebGL 2 par lancer de rayons sur champ de distance : union lissée des primitives du corps
 * (peau continue aux articulations), ombres douces, occlusion ambiante, sol avec ombre portée.
 */
import { EQUIP, NG, bounds, cross, nrm, sub, add, scl, type Prim, type Vec3 } from './core';

const MAXP = 160;

const VS = `#version 300 es
in vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FS = `#version 300 es
precision highp float;
#define MAXP ${MAXP}
#define NG ${NG}
#define EQUIP ${EQUIP}
#define NM 12
uniform vec2 uRes;
uniform vec3 uRo, uCr, uCu, uCf;
uniform float uFoc;
uniform highp sampler2D uPT; // primitives : 3 texels par ligne
uniform int uGS[NG + 1];
uniform vec4 uG[NG];
uniform vec4 uScene;
uniform vec3 uL;
uniform vec3 uBg;
uniform float uDark;
uniform vec3 uAlb[NM];
uniform vec4 uMP[NM]; // spéculaire, brillance, diffusion (wrap), métal
out vec4 fragColor;

float smin(float a, float b, float k) {
  if (k <= 0.0) return min(a, b);
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}
float sdRC(vec3 p, vec3 a, vec3 b, float r1, float r2) {
  vec3 ba = b - a; float l2 = dot(ba, ba); float rr = r1 - r2; float a2 = l2 - rr * rr; float il2 = 1.0 / l2;
  vec3 pa = p - a; float y = dot(pa, ba); float z = y - l2;
  vec3 xv = pa * l2 - ba * y; float x2 = dot(xv, xv); float y2 = y * y * l2; float z2 = z * z * l2;
  float k = sign(rr) * rr * rr * x2;
  if (sign(z) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - r2;
  if (sign(y) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - r1;
  return (sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}
float sdCyl(vec3 p, vec3 a, vec3 b, float r) {
  vec3 ba = b - a; vec3 pa = p - a; float baba = dot(ba, ba); float paba = dot(pa, ba);
  float x = length(pa * baba - ba * paba) - r * baba; float y = abs(paba - baba * 0.5) - baba * 0.5;
  float x2 = x * x; float y2 = y * y * baba;
  float d = (max(x, y) < 0.0) ? -min(x2, y2) : (((x > 0.0) ? x2 : 0.0) + ((y > 0.0) ? y2 : 0.0));
  return sign(d) * sqrt(abs(d)) / baba;
}
float sdBox(vec3 p, vec3 c, float yaw, float pitch, vec3 b, float r) {
  vec3 q = p - c; float cs = cos(yaw), sn = sin(yaw);
  q = vec3(cs * q.x - sn * q.z, q.y, sn * q.x + cs * q.z);
  if (pitch != 0.0) { float cp = cos(pitch), sp = sin(pitch); q = vec3(q.x, cp * q.y + sp * q.z, -sp * q.y + cp * q.z); }
  vec3 d = abs(q) - b + r;
  return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0) - r;
}
float sdTorus(vec3 p, vec3 c, float R, vec3 n, float r) {
  vec3 q = p - c; float h = dot(q, n);
  return length(vec2(length(q - n * h) - R, h)) - r;
}
float prim(int i, vec3 p) {
  vec4 A = texelFetch(uPT, ivec2(0, i), 0), B = texelFetch(uPT, ivec2(1, i), 0), C = texelFetch(uPT, ivec2(2, i), 0);
  if (C.x < 0.5) return sdRC(p, A.xyz, B.xyz, A.w, B.w);
  if (C.x < 1.5) return length(p - A.xyz) - A.w;
  if (C.x < 2.5) return sdCyl(p, A.xyz, B.xyz, A.w);
  if (C.x < 3.5) return sdBox(p, A.xyz, A.w, C.w, B.xyz, B.w);
  return sdTorus(p, A.xyz, A.w, B.xyz, B.w);
}
float map(vec3 p) {
  float d = 1e5;
  for (int g = 0; g < NG; g++) {
    int s = uGS[g], e = uGS[g + 1];
    if (s >= e) continue;
    float bd = length(p - uG[g].xyz) - uG[g].w;
    if (bd > d + 0.06) { d = min(d, bd); continue; }
    float dg = 1e5;
    if (g == EQUIP) { for (int i = s; i < e; i++) dg = min(dg, prim(i, p)); d = min(d, dg); }
    else { for (int i = s; i < e; i++) dg = smin(dg, prim(i, p), texelFetch(uPT, ivec2(2, i), 0).w); d = smin(d, dg, 0.022); }
  }
  return d;
}
vec3 calcNormal(vec3 p) {
  const vec2 k = vec2(1.0, -1.0); const float h = 0.0012;
  return normalize(k.xyy * map(p + k.xyy * h) + k.yyx * map(p + k.yyx * h) + k.yxy * map(p + k.yxy * h) + k.xxx * map(p + k.xxx * h));
}
float softShadow(vec3 ro, vec3 rd, float tmax) {
  float res = 1.0, t = 0.02;
  for (int i = 0; i < 40; i++) {
    float h = map(ro + rd * t);
    res = min(res, 9.0 * h / t);
    t += clamp(h, 0.015, 0.2);
    if (res < 0.004 || t > tmax) break;
  }
  res = clamp(res, 0.0, 1.0);
  return res * res * (3.0 - 2.0 * res);
}
float calcAO(vec3 p, vec3 n) {
  float occ = 0.0, sca = 1.0;
  for (int i = 0; i < 5; i++) {
    float h = 0.012 + 0.05 * float(i);
    occ += (h - map(p + h * n)) * sca;
    sca *= 0.82;
  }
  return clamp(1.0 - 2.4 * occ, 0.0, 1.0);
}
// Matière au point touché : mélange doux des primitives les plus proches.
void material(vec3 p, out vec3 alb, out vec4 mp) {
  vec3 a = vec3(0.0); vec4 m = vec4(0.0); float ws = 0.0;
  for (int i = 0; i < MAXP; i++) {
    if (i >= uGS[NG]) break;
    float w = exp(-clamp(prim(i, p), -0.02, 0.1) * 900.0);
    int id = int(texelFetch(uPT, ivec2(2, i), 0).y + 0.5);
    a += w * uAlb[id]; m += w * uMP[id]; ws += w;
  }
  alb = a / ws; mp = m / ws;
}

void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - uRes) / uRes.y;
  vec3 rd = normalize(uCf * uFoc + uCr * uv.x + uCu * uv.y);
  vec3 ro = uRo;
  vec3 col = uBg;
  float tHit = -1.0;
  vec3 oc = ro - uScene.xyz; float b = dot(oc, rd); float c = dot(oc, oc) - uScene.w * uScene.w; float hh = b * b - c;
  if (hh > 0.0) {
    hh = sqrt(hh);
    float t = max(-b - hh, 0.0), tEnd = -b + hh;
    for (int i = 0; i < 128; i++) {
      float d = map(ro + rd * t);
      if (d < 0.0006 * t) { tHit = t; break; }
      t += d;
      if (t > tEnd) break;
    }
  }
  float tFloor = rd.y < 0.0 ? -ro.y / rd.y : 1e9;
  if (tHit > 0.0 && tHit < tFloor) {
    vec3 p = ro + rd * tHit;
    vec3 n = calcNormal(p);
    vec3 alb; vec4 mp; material(p, alb, mp);
    float occ = calcAO(p, n);
    float ndl = dot(n, uL);
    float wrap = mp.z;
    float dif = clamp((ndl + wrap) / (1.0 + wrap), 0.0, 1.0);
    float sh = dif > 0.001 ? softShadow(p + n * 0.003, uL, 2.5) : 0.0;
    vec3 hv = normalize(uL - rd);
    float fre = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 4.0);
    float spe = pow(clamp(dot(n, hv), 0.0, 1.0), mp.y) * mp.x * (0.75 + 0.75 * fre) * sh;
    // Peau : bord d'ombre légèrement rougi (lumière diffusée sous la surface).
    vec3 sss = mix(vec3(1.0), vec3(1.0, 0.55, 0.45), clamp(wrap * 2.0, 0.0, 1.0) * (1.0 - clamp(ndl * 3.0, 0.0, 1.0)));
    vec3 sky = mix(vec3(0.42, 0.40, 0.44), vec3(0.98, 0.98, 1.0), n.y * 0.5 + 0.5);
    vec3 lin = 2.2 * vec3(1.0, 0.96, 0.9) * dif * sh * sss + 0.55 * sky * occ
      + 0.35 * vec3(0.9, 0.92, 1.0) * clamp(dot(n, normalize(vec3(-uL.x, 0.2, -uL.z))), 0.0, 1.0) * occ;
    col = alb * lin;
    vec3 ref = reflect(rd, n);
    vec3 env = mix(vec3(0.25), vec3(1.0), smoothstep(-0.2, 0.6, ref.y));
    col = mix(col, alb * env * (0.4 + 0.8 * occ) + spe * 2.0, mp.w);
    col += (1.0 - mp.w) * spe * vec3(1.0, 0.97, 0.94);
    col += fre * 0.12 * occ * sky;
    col = 1.0 - exp(-col * 1.15);
    col = pow(col, vec3(1.0 / 2.2));
  } else if (tFloor < 1e8) {
    // Sol : teinte du fond, assombrie par l'ombre portée et l'occlusion au contact.
    vec3 p = ro + rd * tFloor;
    float sh = softShadow(p + vec3(0.0, 0.001, 0.0), uL, 2.5);
    float occ = calcAO(p, vec3(0.0, 1.0, 0.0));
    float r = length(p.xz - uScene.xz);
    float fade = 1.0 - smoothstep(uScene.w * 0.7, uScene.w * 1.6, r);
    float stage = (1.0 - smoothstep(uScene.w * 0.55, uScene.w * 0.95, r)) * 0.045;
    float dark = (1.0 - sh) * 0.32 + (1.0 - occ) * 0.45;
    col = uBg * (1.0 - fade * (dark + stage) * (uDark > 0.5 ? 0.85 : 1.0));
  }
  fragColor = vec4(col, 1.0);
}`;

export type SkinTone = 'claire' | 'medium' | 'mate' | 'foncee';
export const SKIN_TONES: Record<SkinTone, { label: string; rgb: Vec3; css: string }> = {
  claire: { label: 'Claire', rgb: [0.93, 0.76, 0.66], css: '#edc2a8' },
  medium: { label: 'Médium', rgb: [0.84, 0.62, 0.48], css: '#d6a07b' },
  mate: { label: 'Mate', rgb: [0.66, 0.45, 0.32], css: '#a8714f' },
  foncee: { label: 'Foncée', rgb: [0.42, 0.27, 0.19], css: '#6b442f' },
};
// Matières : couleur sRGB + [spéculaire, brillance, diffusion, métal]. Ordre = MAT dans core.ts.
const MATERIALS: { c: Vec3; p: [number, number, number, number] }[] = [
  { c: SKIN_TONES.medium.rgb, p: [0.22, 28, 0.45, 0] }, // peau
  { c: [0.42, 0.36, 0.86], p: [0.08, 12, 0.12, 0] }, // débardeur (violet de l'appli)
  { c: [0.16, 0.16, 0.22], p: [0.12, 18, 0.1, 0] }, // legging
  { c: [0.94, 0.94, 0.96], p: [0.15, 20, 0.1, 0] }, // baskets
  { c: [0.2, 0.13, 0.09], p: [0.3, 36, 0.15, 0] }, // cheveux
  { c: [0.85, 0.86, 0.9], p: [0.9, 80, 0, 1] }, // chrome
  { c: [0.12, 0.12, 0.14], p: [0.18, 20, 0, 0] }, // caoutchouc
  { c: [0.62, 0.45, 0.3], p: [0.12, 16, 0.05, 0] }, // bois
  { c: [0.55, 0.5, 0.85], p: [0.05, 10, 0.05, 0] }, // tapis
  { c: [0.2, 0.2, 0.24], p: [0.1, 14, 0.05, 0] }, // rembourrage
  { c: [1.0, 0.48, 0.35], p: [0.2, 24, 0.1, 0] }, // élastique (corail de l'appli)
  { c: [0.5, 0.52, 0.58], p: [0.35, 40, 0.02, 0] }, // structure métallique peinte
];
const toLin = (c: Vec3) => c.map((v) => Math.pow(v, 2.2));

export interface Camera { pos: Vec3; target: Vec3; fov: number }

export class MannequinRenderer {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private tex: WebGLTexture;
  private buf = new Float32Array(MAXP * 12);
  private colors = MATERIALS.map((m) => m.c.slice() as Vec3);
  private bg: Vec3 = [1, 1, 1];
  private dark = 0;
  /** Facteur de résolution (baissé automatiquement si l'appareil peine). */
  scale = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) throw new Error('WebGL 2 indisponible');
    this.gl = gl;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'programme');
    gl.useProgram(prog);
    const vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const n of ['uRes', 'uRo', 'uCr', 'uCu', 'uCf', 'uFoc', 'uPT', 'uGS', 'uG', 'uScene', 'uL', 'uBg', 'uDark', 'uAlb', 'uMP']) this.u[n] = gl.getUniformLocation(prog, n);
    this.tex = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(this.u.uPT, 0);
    this.uploadColors();
  }

  setSkin(tone: SkinTone) {
    this.colors[0] = SKIN_TONES[tone].rgb;
    this.uploadColors();
  }

  /** Couleur du fond (sRGB 0-1) et thème sombre (ombres un peu atténuées). */
  setBackground(bg: Vec3, dark: boolean) {
    this.bg = bg;
    this.dark = dark ? 1 : 0;
  }

  private uploadColors() {
    const gl = this.gl;
    gl.uniform3fv(this.u.uAlb, new Float32Array(this.colors.flatMap(toLin)));
    gl.uniform4fv(this.u.uMP, new Float32Array(MATERIALS.flatMap((m) => m.p)));
  }

  /** Dessine `prims` ; `scene` = sphère englobante (limite le lancer de rayons). */
  draw(prims: Prim[], cam: Camera, sceneBound: { c: Vec3; r: number }) {
    const gl = this.gl, c = this.canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, 2) * this.scale;
    const w = Math.max(1, Math.round(c.clientWidth * dpr)), h = Math.max(1, Math.round(c.clientHeight * dpr));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    gl.viewport(0, 0, w, h);

    const sorted = prims.slice(0, MAXP).sort((a, b) => a.g - b.g);
    const gs = new Int32Array(NG + 1);
    const gb = new Float32Array(NG * 4);
    let gi = 0;
    for (let g = 0; g < NG; g++) {
      gs[g] = gi;
      const start = gi;
      while (gi < sorted.length && sorted[gi].g === g) gi++;
      if (gi > start) {
        const bb = bounds(sorted.slice(start, gi));
        gb.set([bb.c[0], bb.c[1], bb.c[2], bb.r + 0.03], g * 4);
      }
    }
    gs[NG] = sorted.length;
    const buf = this.buf;
    buf.fill(0);
    sorted.forEach((p, i) => {
      const o = i * 12;
      buf.set([p.a[0], p.a[1], p.a[2], p.ra, p.b[0], p.b[1], p.b[2], p.rb, p.t, p.m, p.g, p.t === 3 ? p.pitch ?? 0 : p.k], o);
    });
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 3, MAXP, 0, gl.RGBA, gl.FLOAT, buf);
    gl.uniform1iv(this.u.uGS, gs);
    gl.uniform4fv(this.u.uG, gb);
    gl.uniform4f(this.u.uScene, sceneBound.c[0], sceneBound.c[1], sceneBound.c[2], sceneBound.r);

    const f = nrm(sub(cam.target, cam.pos));
    const r = nrm(cross(f, [0, 1, 0]));
    const u = cross(r, f);
    gl.uniform2f(this.u.uRes, w, h);
    gl.uniform3fv(this.u.uRo, cam.pos);
    gl.uniform3fv(this.u.uCr, r);
    gl.uniform3fv(this.u.uCu, u);
    gl.uniform3fv(this.u.uCf, f);
    gl.uniform1f(this.u.uFoc, 1 / Math.tan((cam.fov * Math.PI) / 360));
    // Lumière principale : en haut à gauche de l'observateur, un peu de face.
    const fl = nrm([f[0], 0, f[2]]), rl = nrm([r[0], 0, r[2]]);
    gl.uniform3fv(this.u.uL, nrm(add(add(scl(rl, -0.55), [0, 0.95, 0]), scl(fl, -0.55))));
    gl.uniform3fv(this.u.uBg, this.bg);
    gl.uniform1f(this.u.uDark, this.dark);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** Libère le contexte WebGL (un seul mannequin affiché à la fois). */
  dispose() {
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

export const MAX_PRIMS = MAXP;
