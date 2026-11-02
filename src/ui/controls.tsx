import type { ReactNode } from 'react';
import type { Swatch } from '../data/catalog';

export function Section({ title, children, open = true }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="section" open={open}>
      <summary>{title}</summary>
      <div className="section-body">{children}</div>
    </details>
  );
}

/** Összecsukható alcsoport egy fülön belül (pl. Anyagok: Padló, Függöny). */
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

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
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
