import { useEffect, useRef, useState } from 'react';
import { scene, sceneBounds, type ExerciseScene } from '../lib/mannequin/core';
import { MannequinRenderer, SKIN_TONES, type SkinTone } from '../lib/mannequin/render';
import { fitDistance, orbit } from '../lib/mannequin/camera';

const SKIN_KEY = 'fitness-coach-skin';
function readSkin(): SkinTone {
  try {
    const v = localStorage.getItem(SKIN_KEY);
    if (v && v in SKIN_TONES) return v as SkinTone;
  } catch {
    // stockage indisponible : teinte par défaut
  }
  return 'medium';
}

const HOLD = 0.7;
const MOVE = 0.9;
const ease = (x: number) => x * x * (3 - 2 * x);

/** Phase continue (0 = position 1, 1 = position 2…) à l'instant `clock` du cycle. */
function phaseAt(ex: ExerciseScene, clock: number): number {
  const n = ex.keys.length;
  const holds = ex.keys.map((_, k) => ex.holds?.[k] ?? HOLD);
  const moves = ex.keys.map((_, k) => ex.moves?.[k] ?? ex.move ?? MOVE);
  const total = holds.reduce((a, b) => a + b, 0) + moves.reduce((a, b) => a + b, 0);
  let x = clock % total;
  for (let k = 0; k < n; k++) {
    if (x < holds[k]) return k;
    x -= holds[k];
    if (x < moves[k]) return k + ease(x / moves[k]);
    x -= moves[k];
  }
  return 0;
}

const parseRgb = (css: string): [number, number, number] => {
  const m = css.match(/\d+(\.\d+)?/g);
  return m && m.length >= 3 ? [+m[0] / 255, +m[1] / 255, +m[2] / 255] : [0.94, 0.93, 0.97];
};

/** Mannequin 3D animé : on tourne autour au doigt (ou bouton 360°), on zoome au pincement ou avec − / +. */
export function Mannequin3D({ ex }: { ex: ExerciseScene }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [playing, setPlaying] = useState(!reduceMotion);
  const [shown, setShown] = useState(0);
  const [skin, setSkin] = useState<SkinTone>(readSkin);
  const [failed, setFailed] = useState(false);
  // État de la caméra et de l'animation, hors React : l'écran de séance se redessine toutes les 0,5 s.
  const st = useRef({ yaw: ex.cam?.yaw ?? 30, pitch: ex.cam?.pitch ?? 10, zoom: 1, clock: 0, fixed: 0, spin: null as null | { from: number; t0: number }, dirty: true, playing: !reduceMotion, fitD: 0 });
  const rendererRef = useRef<MannequinRenderer | null>(null);
  const n = ex.keys.length;
  const labels = ex.keys.map((_, k) => ex.labels?.[k] ?? `Position ${k + 1}`);

  useEffect(() => {
    st.current.playing = playing;
    st.current.dirty = true;
  }, [playing]);

  useEffect(() => {
    rendererRef.current?.setSkin(skin);
    st.current.dirty = true;
    try {
      localStorage.setItem(SKIN_KEY, skin);
    } catch {
      // stockage indisponible : la teinte n'est pas mémorisée
    }
  }, [skin]);

  useEffect(() => {
    const canvas = canvasRef.current, stage = stageRef.current;
    if (!canvas || !stage) return;
    let renderer: MannequinRenderer;
    try {
      renderer = new MannequinRenderer(canvas);
    } catch {
      setFailed(true);
      return;
    }
    rendererRef.current = renderer;
    renderer.setSkin(readSkin());
    const s = st.current;
    Object.assign(s, { yaw: ex.cam?.yaw ?? 30, pitch: ex.cam?.pitch ?? 10, zoom: 1, clock: 0, fixed: 0, spin: null, dirty: true, fitD: 0 });
    const bound = sceneBounds(ex);

    const applyTheme = () => {
      const bg = parseRgb(getComputedStyle(stage).backgroundColor);
      renderer.setBackground(bg, (bg[0] + bg[1] + bg[2]) / 3 < 0.4);
      s.dirty = true;
    };
    applyTheme();
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    mq?.addEventListener?.('change', applyTheme);

    let visible = true;
    const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([e]) => { visible = e.isIntersecting; s.dirty = true; }) : null;
    io?.observe(stage);

    // Rotation au doigt / à la souris, zoom au pincement / à la molette.
    const pointers = new Map<number, [number, number]>();
    let pinch0 = 0, zoom0 = 1;
    const down = (e: PointerEvent) => {
      canvas.setPointerCapture?.(e.pointerId);
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      s.spin = null;
      if (pointers.size === 2) {
        const [p, q] = [...pointers.values()];
        pinch0 = Math.hypot(p[0] - q[0], p[1] - q[1]);
        zoom0 = s.zoom;
      }
    };
    const move = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (pointers.size === 1) {
        s.yaw -= (e.clientX - prev[0]) * 0.5;
        if (e.pointerType === 'mouse') s.pitch = Math.max(-4, Math.min(70, s.pitch + (e.clientY - prev[1]) * 0.3));
      } else if (pointers.size === 2 && pinch0 > 0) {
        const [p, q] = [...pointers.values()];
        s.zoom = Math.max(0.55, Math.min(1.8, (zoom0 * pinch0) / Math.max(1, Math.hypot(p[0] - q[0], p[1] - q[1]))));
      }
      s.dirty = true;
    };
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      pinch0 = 0;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      s.zoom = Math.max(0.55, Math.min(1.8, s.zoom * Math.exp(e.deltaY * 0.001)));
      s.dirty = true;
    };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', wheel, { passive: false });
    const lost = (e: Event) => { e.preventDefault(); setFailed(true); };
    canvas.addEventListener('webglcontextlost', lost);

    let raf = 0, last = performance.now(), slow = 0, lastShown = -1;
    const tick = (now: number) => {
      // 30 images par seconde suffisent : on épargne la batterie du téléphone.
      if (now - last < 30) { raf = requestAnimationFrame(tick); return; }
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (s.spin) {
        const k = Math.min(1, (now - s.spin.t0) / 6000);
        s.yaw = s.spin.from + 360 * ease(k);
        if (k >= 1) s.spin = null;
        s.dirty = true;
      }
      if (s.playing) { s.clock += dt; s.dirty = true; }
      if (s.dirty && visible && !document.hidden) {
        const phase = s.playing ? phaseAt(ex, s.clock) : s.fixed;
        const near = Math.round(phase) % n;
        if (near !== lastShown) { lastShown = near; setShown(near); }
        const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
        const want = fitDistance(bound, s.yaw, s.pitch, aspect);
        // Le cadrage suit l'angle de vue en douceur : le corps reste entier sans devenir minuscule.
        s.fitD = s.fitD ? s.fitD + (want - s.fitD) * Math.min(1, dt * 6) : want;
        s.dirty = Math.abs(want - s.fitD) > 0.002;
        renderer.draw(scene(ex, phase).prims, orbit(bound.c, s.yaw, s.pitch, s.fitD * s.zoom), bound);
        // Qualité adaptative : on baisse la résolution si l'appareil peine.
        if (dt > 0.05) slow++;
        else slow = Math.max(0, slow - 1);
        if (slow > 6 && renderer.scale > 0.5) { renderer.scale = Math.max(0.5, renderer.scale * 0.8); slow = 0; }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      mq?.removeEventListener?.('change', applyTheme);
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      canvas.removeEventListener('wheel', wheel);
      canvas.removeEventListener('webglcontextlost', lost);
      rendererRef.current = null;
      renderer.dispose();
    };
  }, [ex, n]);

  const show = (k: number) => {
    setPlaying(false);
    st.current.fixed = k;
    st.current.dirty = true;
    setShown(k);
  };
  const turn = (yaw: number) => {
    st.current.spin = null;
    st.current.yaw = yaw;
    st.current.dirty = true;
  };
  const zoomBy = (f: number) => {
    st.current.zoom = Math.max(0.55, Math.min(1.8, st.current.zoom * f));
    st.current.dirty = true;
  };

  if (failed) return <div className="tiny muted">La vue 3D n'est pas disponible sur cet appareil.</div>;

  return (
    <div className="col" style={{ gap: 8 }}>
      <div className="m3d-stage" ref={stageRef}>
        <canvas ref={canvasRef} aria-label="Mannequin 3D : glisse pour tourner autour" />
        <span className="demo-tag">{labels[shown]}</span>
        <span className="m3d-hint">↔ glisse pour tourner</span>
        <div className="m3d-zoom">
          <button type="button" aria-label="Reculer" onClick={() => zoomBy(1.15)}>−</button>
          <button type="button" aria-label="Rapprocher" onClick={() => zoomBy(1 / 1.15)}>+</button>
        </div>
      </div>
      <div className="row wrap" style={{ gap: 6 }}>
        <button type="button" className="btn small" onClick={() => setPlaying((p) => !p)}>
          {playing ? 'Pause' : 'Lecture'}
        </button>
        {labels.map((l, k) => (
          <button key={k} type="button" className={`chip ${!playing && shown === k ? 'active' : ''}`} onClick={() => show(k)}>
            {l}
          </button>
        ))}
      </div>
      <div className="row wrap" style={{ gap: 6 }}>
        <button type="button" className="btn secondary small" onClick={() => { st.current.spin = { from: st.current.yaw, t0: performance.now() }; st.current.dirty = true; }}>
          Tour à 360°
        </button>
        <button type="button" className="btn outline small" onClick={() => turn(0)}>Face</button>
        <button type="button" className="btn outline small" onClick={() => turn(90)}>Profil</button>
        <button type="button" className="btn outline small" onClick={() => turn(180)}>Dos</button>
      </div>
      <div className="row wrap" style={{ gap: 8, alignItems: 'center' }} role="group" aria-label="Teinte de peau">
        <span className="tiny muted">Peau</span>
        {(Object.keys(SKIN_TONES) as SkinTone[]).map((k) => (
          <button
            key={k}
            type="button"
            className={`m3d-swatch ${skin === k ? 'active' : ''}`}
            style={{ background: SKIN_TONES[k].css }}
            aria-label={SKIN_TONES[k].label}
            aria-pressed={skin === k}
            onClick={() => setSkin(k)}
          />
        ))}
      </div>
      {ex.note && <div className="tiny muted">Démo 3D : {ex.note}.</div>}
    </div>
  );
}
