import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Swatch } from '../data/catalog';

/** Felugró menü: gomb + alatta lebegő panel; kattintás a panelen kívül vagy Esc zárja. */
export function Popover({ label, title, children, align = 'left', className = '' }: { label: ReactNode; title?: string; children: ReactNode; align?: 'left' | 'right'; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', down);
    window.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down);
      window.removeEventListener('keydown', key);
    };
  }, [open]);
  return (
    <div className={`popover ${className}`} ref={ref}>
      <button className={open ? 'on' : ''} onClick={() => setOpen(!open)} title={title} aria-expanded={open}>
        {label}
      </button>
      {open && <div className={`popover-panel ${align}`}>{children}</div>}
    </div>
  );
}

/** Tömör sor egy beállításhoz: címke, színminta, az aktuális érték; kattintásra megnyílik a szerkesztője. */
export function NavRow({ label, value, swatch, onClick, title, stacked }: { label: string; value: ReactNode; swatch?: string; onClick: () => void; title?: string; stacked?: boolean }) {
  // `stacked`: hosszú címkéhez – a címke felül, az érték alatta
  return (
    <button className={`nav-row ${stacked ? 'stacked' : ''}`} onClick={onClick} title={title}>
      <span className="nav-label">{label}</span>
      <span className="nav-line">
        {swatch !== undefined && <i className="nav-swatch" style={{ background: swatch }} />}
        <span className="nav-value">{value}</span>
      </span>
      <span className="nav-chevron">›</span>
    </button>
  );
}

/** Mező, amelynek a magyarázata a címke melletti ⓘ jelre víve olvasható (a hosszú megjegyzések helyett). */
export function InfoField({ label, info, children }: { label: string; info?: string; children: ReactNode }) {
  return (
    <div className="field">
      <div className="field-label">
        {label}
        {info && (
          <span className="info-mark" title={info}>
            {' '}
            ⓘ
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/** Csoportcím a tömör sorok fölött. */
export function RowGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="row-group">
      <div className="row-group-title">{title}</div>
      {children}
    </div>
  );
}

export function Section({ title, children, open = true }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="section" open={open}>
      <summary>{title}</summary>
      <div className="section-body">{children}</div>
    </details>
  );
}

/** Összecsukható alcsoport egy fülön belül (pl. Berendezés: Illő bútorszínek). */
export function Sub({ title, children, open = false, hint }: { title: string; children: ReactNode; open?: boolean; hint?: string }) {
  return (
    <details className="sub" open={open}>
      <summary>
        {title}
        {hint && <span className="sub-hint">{hint}</span>}
      </summary>
      <div className="sub-body">{children}</div>
    </details>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      {children}
    </div>
  );
}

export function SwatchPicker({ value, onChange, swatches }: { value: string; onChange: (hex: string) => void; swatches: Swatch[] }) {
  const current = swatches.find((s) => s.hex.toLowerCase() === value.toLowerCase());
  return (
    <div className="swatches">
      {swatches.map((s) => (
        <button
          key={s.hex}
          className={`swatch ${s.hex.toLowerCase() === value.toLowerCase() ? 'on' : ''}`}
          style={{ background: s.hex }}
          title={`${s.name} (${s.hex})`}
          onClick={() => onChange(s.hex)}
        />
      ))}
      <label className="swatch custom" title="Egyéni szín">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
      <span className="swatch-name">{current ? current.name : value}</span>
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button key={o.v} className={o.v === value ? 'on' : ''} onClick={() => onChange(o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="toggle" title={hint}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
    </label>
  );
}

export function Slider({ value, min, max, step, onChange, format }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  return (
    <div className="slider">
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span>{format ? format(value) : value}</span>
    </div>
  );
}
