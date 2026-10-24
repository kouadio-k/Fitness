import { useEffect, useState, type ReactNode } from 'react';

// ---------- Icônes (traits simples, 24×24) ----------

const paths: Record<string, ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  meal: <><path d="M7 3v8a2 2 0 0 0 2 2v8" /><path d="M11 3v8a2 2 0 0 1-2 2" /><path d="M7 3h0M9 3v5" /><path d="M17 21V3c-2 1-3 3.5-3 7h3" /></>,
  dumbbell: <><path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" /></>,
  chart: <><path d="M4 20V4" /><path d="M4 20h16" /><path d="m7 15 4-5 3 3 5-6" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></>,
  swap: <><path d="M4 8h13l-3-3M20 16H7l3 3" /></>,
  play: <path d="M7 4.5v15l12-7.5z" />,
  timer: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5M9 2h6" /></>,
  flame: <path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z" />,
  water: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />,
  scale: <><rect x="3" y="4" width="18" height="16" rx="4" /><path d="M9 9a4 4 0 0 1 6 0l-3 3" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>,
  save: <><path d="M5 4h11l3 3v13H5z" /><path d="M8 4v5h7V4M8 20v-6h8v6" /></>,
  heart: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />,
  run: <><circle cx="14" cy="4.5" r="1.8" /><path d="m6 20 3.5-5 3 2V21M8 11l3-3 3 2 2 3h3M11 8l-1.5 5" /></>,
  calendar: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></>,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />,
  barcode: <path d="M4 5v14M7 5v14M10 5v14M14 5v14M17 5v14M20 5v14" />,
  download: <><path d="M12 4v11m0 0-4-4m4 4 4-4" /><path d="M5 20h14" /></>,
  upload: <><path d="M12 15V4m0 0L8 8m4-4 4 4" /><path d="M5 20h14" /></>,
  refresh: <><path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4" /><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4" /></>,
  book: <><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" /><path d="M5 17a3 3 0 0 1 3-3h11" /></>,
};

export type IconName = keyof typeof paths;

export function Icon({ name, size = 24, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

// ---------- Bottom sheet ----------

export function Sheet({
  title,
  onClose,
  children,
  full,
  footer,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  full?: boolean;
  footer?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className={`sheet ${full ? 'full' : ''}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="sheet-header">
          <h2 className="grow">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">
            <Icon name="close" />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div style={{ padding: '0 16px 16px' }}>{footer}</div>}
      </div>
    </div>
  );
}

// ---------- Sélecteurs ----------

export function Chips<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | T[];
  onChange: (v: T) => void;
}) {
  const selected = Array.isArray(value) ? value : [value];
  return (
    <div className="chips">
      {options.map((o) => (
        <button
          type="button"
          key={String(o.value)}
          className={`chip ${selected.includes(o.value) ? 'active' : ''}`}
          onClick={() => onChange(o.value)}
          aria-pressed={selected.includes(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Options<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; hint?: string; emoji?: string }[];
  value: T | T[];
  onChange: (v: T) => void;
}) {
  const selected = Array.isArray(value) ? value : [value];
  return (
    <div className="options">
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          className={`option ${selected.includes(o.value) ? 'active' : ''}`}
          onClick={() => onChange(o.value)}
          aria-pressed={selected.includes(o.value)}
        >
          {o.emoji && <span className="emoji">{o.emoji}</span>}
          <span className="grow">
            <div className="option-label">{o.label}</div>
            {o.hint && <div className="option-hint">{o.hint}</div>}
          </span>
        </button>
      ))}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={t.value === value} className={t.value === value ? 'active' : ''} onClick={() => onChange(t.value)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Champ numérique qui accepte la virgule et laisse l'utilisateur vider le champ pendant la saisie. */
export function NumberInput({
  value,
  onChange,
  suffix,
  step = 1,
  min,
  max,
  placeholder,
  ariaLabel,
  className,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const [text, setText] = useState(value === undefined || Number.isNaN(value) ? '' : String(value));
  useEffect(() => {
    const parsed = parseFloat(text.replace(',', '.'));
    if (value === undefined && text !== '') setText('');
    else if (value !== undefined && parsed !== value) setText(String(value));
  }, [value]);

  const input = (
    <input
      className={`input ${className ?? ''}`}
      inputMode={step < 1 ? 'decimal' : 'numeric'}
      value={text}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const t = e.target.value.replace(/[^0-9.,-]/g, '');
        setText(t);
        if (t === '') return onChange(undefined);
        let n = parseFloat(t.replace(',', '.'));
        if (Number.isNaN(n)) return;
        if (max !== undefined) n = Math.min(max, n);
        if (min !== undefined && n < min) return;
        onChange(n);
      }}
    />
  );
  if (!suffix) return input;
  return (
    <div className="input-suffix">
      {input}
      <span>{suffix}</span>
    </div>
  );
}

// ---------- Visualisations ----------

export function Ring({
  value,
  max,
  size = 120,
  stroke = 12,
  color = 'var(--primary)',
  children,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const over = max > 0 && value > max * 1.05;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-2)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={over ? 'var(--warning)' : color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <div className="ring-label">{children}</div>
    </div>
  );
}

export function MacroBar({ label, value, target, color, unit = 'g' }: { label: string; value: number; target: number; color: string; unit?: string }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div className="macro-row">
      <div className="row between">
        <span className="bold">{label}</span>
        <span className="muted kbd-num">
          {Math.round(value)} / {Math.round(target)} {unit}
        </span>
      </div>
      <div className="bar">
        <div style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export interface Point {
  x: string; // date ISO
  y: number;
}

/** Courbe simple en SVG, avec une seconde série optionnelle (ex. moyenne mobile). */
export function LineChart({ data, trend, height = 160, unit = '', goal }: { data: Point[]; trend?: Point[]; height?: number; unit?: string; goal?: number }) {
  if (data.length < 2) return <div className="empty">Ajoute au moins 2 mesures pour voir la courbe.</div>;
  const W = 320;
  const H = height;
  const pad = { l: 34, r: 10, t: 10, b: 20 };
  const ys = [...data.map((d) => d.y), ...(trend ?? []).map((d) => d.y), ...(goal !== undefined ? [goal] : [])];
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);
  if (maxY - minY < 1) {
    minY -= 0.5;
    maxY += 0.5;
  }
  const t0 = new Date(data[0].x).getTime();
  const t1 = new Date(data[data.length - 1].x).getTime();
  const sx = (x: string) => pad.l + ((new Date(x).getTime() - t0) / Math.max(1, t1 - t0)) * (W - pad.l - pad.r);
  const sy = (y: number) => pad.t + (1 - (y - minY) / (maxY - minY)) * (H - pad.t - pad.b);
  const path = (pts: Point[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');
  const ticks = [minY, (minY + maxY) / 2, maxY];
  const fmt = (x: string) => new Date(x).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Graphique d'évolution">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={sy(t)} y2={sy(t)} stroke="var(--border)" strokeDasharray="3 3" />
          <text x={pad.l - 4} y={sy(t) + 3} textAnchor="end">
            {t.toFixed(1)}
          </text>
        </g>
      ))}
      {goal !== undefined && (
        <g>
          <line x1={pad.l} x2={W - pad.r} y1={sy(goal)} y2={sy(goal)} stroke="var(--success)" strokeDasharray="5 4" />
          <text x={W - pad.r} y={sy(goal) - 4} textAnchor="end" style={{ fill: 'var(--success)' }}>
            objectif {goal}
            {unit}
          </text>
        </g>
      )}
      <path d={path(data)} fill="none" stroke="var(--primary)" strokeOpacity={trend ? 0.35 : 1} strokeWidth={2} />
      {data.map((p) => (
        <circle key={p.x} cx={sx(p.x)} cy={sy(p.y)} r={2.5} fill="var(--primary)" fillOpacity={trend ? 0.5 : 1} />
      ))}
      {trend && trend.length > 1 && <path d={path(trend)} fill="none" stroke="var(--primary)" strokeWidth={2.5} />}
      <text x={pad.l} y={H - 4}>
        {fmt(data[0].x)}
      </text>
      <text x={W - pad.r} y={H - 4} textAnchor="end">
        {fmt(data[data.length - 1].x)}
      </text>
    </svg>
  );
}

/** Histogramme simple (ex. calories des 7 derniers jours). */
export function BarChart({ data, target, height = 130 }: { data: { label: string; value: number }[]; target?: number; height?: number }) {
  const W = 320;
  const H = height;
  const pad = { l: 6, r: 6, t: 10, b: 18 };
  const max = Math.max(1, ...data.map((d) => d.value), target ?? 0) * 1.1;
  const bw = (W - pad.l - pad.r) / data.length;
  const sy = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Histogramme">
      {data.map((d, i) => (
        <g key={i}>
          <rect
            x={pad.l + i * bw + bw * 0.18}
            y={sy(d.value)}
            width={bw * 0.64}
            height={Math.max(0, H - pad.b - sy(d.value))}
            rx={4}
            fill={target && d.value > target * 1.1 ? 'var(--warning)' : 'var(--primary)'}
            fillOpacity={d.value ? 0.85 : 0.2}
          />
          <text x={pad.l + i * bw + bw / 2} y={H - 4} textAnchor="middle">
            {d.label}
          </text>
        </g>
      ))}
      {target !== undefined && <line x1={pad.l} x2={W - pad.r} y1={sy(target)} y2={sy(target)} stroke="var(--success)" strokeDasharray="5 4" />}
    </svg>
  );
}

// ---------- Toast ----------

let toastListener: ((msg: string) => void) | null = null;

export function toast(msg: string) {
  toastListener?.(msg);
}

export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let t: number | undefined;
    toastListener = (m) => {
      setMsg(m);
      window.clearTimeout(t);
      t = window.setTimeout(() => setMsg(null), 2200);
    };
    return () => {
      toastListener = null;
      window.clearTimeout(t);
    };
  }, []);
  return msg ? (
    <div className="toast" role="status">
      {msg}
    </div>
  ) : null;
}

export function confirmAction(message: string): boolean {
  return window.confirm(message);
}
