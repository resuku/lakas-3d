import { useMemo, useState } from 'react';
import { findCurtain, findDoor, findFloor, findPaint } from '../data/products';
import { REMIX_LABEL, REMIX_LEVELS, remixCandidates, remixKeys, type RemixKey, type RemixLevel } from '../lib/remix';
import type { Variant } from '../model/types';
import { useStore } from '../store';
import { Field, RowGroup, Segmented } from './controls';

// Hozzáillő változat (2026-11-26, user): a bepipált elemek maradnak, a többihez 4 jelölt (lib/remix.ts). A „Megnézem”
// egy vázlatváltozatba tölti a jelöltet (ugyanabba, amíg nincs mentve); a „Mentés” megtartja, az „Elvetés” törli és
// visszaáll a kiinduló változatra. A panel bezárásakor a vázlat megmarad (a Saját változatok között).

const HANDLE = { steel: 'inox', black: 'fekete', brass: 'sárgaréz' } as const;
const SKIRT = { wall: 'falszínű', door: 'ajtószínű', white: 'fehér' } as const;
const DRAFT = ' (vázlat)';

function currentValue(k: RemixKey, v: Variant, planName: string): { hex?: string; text: string } {
  const p = v.products ?? {};
  switch (k) {
    case 'wall':
      return { hex: v.wall, text: findPaint(p.wall)?.name ?? v.wall };
    case 'accents': {
      const keys = Object.keys(v.accents);
      return { hex: v.accents[keys[0]], text: keys.map((x) => findPaint(p[`accent:${x}`])?.name ?? v.accents[x]).join(', ') };
    }
    case 'floor': {
      const f = findFloor(p.floor);
      return { hex: v.floor.tone, text: f ? (f.existing ? `meglévő ${f.name.toLowerCase()}` : f.name) : v.floor.tone };
    }
    case 'hall':
      return { hex: v.hallFloor?.tone, text: findFloor(p.hallFloor)?.name ?? v.hallFloor?.tone ?? '' };
    case 'door':
      return { hex: v.door, text: findDoor(p.door)?.name ?? v.door };
    case 'handle':
      return { text: HANDLE[v.handle ?? 'steel'] };
    case 'skirting':
      return { text: `${v.skirting.h} mm, ${SKIRT[v.skirting.mode]}` };
    case 'curtain':
      return { hex: v.curtain.color, text: findCurtain(p.curtain)?.name ?? v.curtain.color };
    case 'light':
      return { text: planName };
  }
}

export function RemixPanel() {
  const s = useStore();
  const [srcId] = useState(s.activeId);
  const src = s.variants.find((v) => v.id === srcId);
  const [pins, setPins] = useState<RemixKey[]>([]);
  const [level, setLevel] = useState<RemixLevel>('medium');
  const [seed, setSeed] = useState(1);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [shown, setShown] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const favKey = s.variants
    .filter((v) => Object.values(v.feedback ?? {}).some((f) => f.fav))
    .map((v) => v.id)
    .join(',');
  const pinKey = [...pins].sort().join(',');
  const cands = useMemo(
    () => (src ? remixCandidates(src, new Set(pins), level, seed, 4, new Set(favKey.split(',').filter(Boolean))) : []),
    [src, pinKey, level, seed, favKey],
  );
  if (!src) return <p className="note">A kiinduló változat már nincs meg.</p>;
  const keys = remixKeys(src);
  const planName = (id?: string) => s.lightPlans.find((p) => p.id === id)?.name ?? 'nincs';
  const draftAlive = !!draftId && s.variants.some((v) => v.id === draftId);

  const reset = () => setShown(null);
  const toggle = (k: RemixKey) => {
    setPins((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
    reset();
  };
  const show = (i: number) => {
    const v = { ...cands[i].variant, name: cands[i].variant.name + DRAFT };
    const id = draftAlive ? draftId! : `v-${Date.now().toString(36)}`;
    if (draftAlive) s.updateVariant(id, () => ({ ...v, id }));
    else {
      s.addVariant({ ...v, id });
      setDraftId(id);
    }
    s.setActive(id);
    setShown(i);
    setMsg(null);
  };
  const save = () => {
    if (!draftAlive) return;
    const name = s.variants.find((v) => v.id === draftId)!.name.replace(DRAFT, '');
    s.updateVariant(draftId!, (x) => ({ ...x, name }));
    setMsg(`Elmentve a Saját változatok közé: ${name}`);
    setDraftId(null);
    setShown(null);
  };
  const discard = () => {
    if (draftAlive) s.deleteVariant(draftId!);
    s.setActive(srcId);
    setDraftId(null);
    setShown(null);
    setMsg(null);
  };

  return (
    <div className="remix">
      <p className="note">
        Pipáld be, ami tetszik a(z) <b>{src.name}</b> változatból. A többi elemhez a program a beépített javaslatok párosításai és arányai alapján valós
        katalógustermékeket választ. Gépi összeállítás, nem lakberendezői javaslat.
      </p>
      <RowGroup title="Megtartom">
        <div className="remix-pins">
          {keys.map((k) => {
            const c = currentValue(k, src, planName(src.lightPlanId));
            return (
              <label key={k} className="remix-pin" title={c.text}>
                <input type="checkbox" checked={pins.includes(k)} onChange={() => toggle(k)} />
                {c.hex ? <span className="nav-swatch" style={{ background: c.hex }} /> : <span className="nav-swatch empty" />}
                <span className="remix-pin-label">{REMIX_LABEL[k]}</span>
                <span className="remix-pin-value">{c.text}</span>
              </label>
            );
          })}
        </div>
      </RowGroup>
      <Field label="Eltérés a többi elemben">
        <Segmented
          value={level}
          options={REMIX_LEVELS.map((l) => ({ v: l.v, label: l.label }))}
          onChange={(l) => {
            setLevel(l);
            reset();
          }}
        />
        <p className="note">{REMIX_LEVELS.find((l) => l.v === level)?.hint}</p>
      </Field>
      <div className="row">
        <button
          onClick={() => {
            setSeed((x) => x + 1);
            reset();
          }}
          title="Új jelöltek ugyanezekkel a beállításokkal"
        >
          Újabb jelöltek
        </button>
        {draftAlive && (
          <>
            <button className="on" onClick={save} title="A látható vázlat megmarad a Saját változatok között">
              Mentés
            </button>
            <button onClick={discard} title="A vázlat törlése, vissza a kiinduló változathoz">
              Elvetés
            </button>
          </>
        )}
      </div>
      {msg && <p className="note ok-text">{msg}</p>}
      {pins.length === keys.length && <p className="note warn-text">Minden elem be van pipálva – nincs mit cserélni.</p>}
      <div className="remix-cands">
        {cands.map((c, i) => (
          <div key={i} className={`remix-card ${shown === i ? 'on' : ''}`}>
            <div className="remix-strip">
              {c.parts.map((p, j) => (
                <span key={j} className={p.kept ? 'kept' : ''} style={{ background: p.hex }} title={`${p.label}: ${p.name}${p.kept ? ' (megtartva)' : ''}`} />
              ))}
            </div>
            <b>{c.variant.name.replace('Hozzáillő – ', '')}</b>
            <ul className="remix-parts">
              {c.parts
                .filter((p) => !p.kept)
                .map((p, j) => (
                  <li key={j}>
                    <span className="nav-swatch" style={{ background: p.hex }} /> {p.label}: {p.name}
                  </li>
                ))}
              {!pins.includes('light') && <li>Világítás: {planName(c.variant.lightPlanId)}</li>}
            </ul>
            <p className="note">Minta: {c.donor.name}</p>
            {c.warnings.length > 0 && <p className="note warn-text">⚠ {c.warnings.join('; ')}.</p>}
            <button className={shown === i ? 'on' : ''} onClick={() => show(i)}>
              {shown === i ? 'Ez látható a 3D nézetben' : 'Megnézem'}
            </button>
          </div>
        ))}
      </div>
      <p className="note">
        A „Megnézem” egy vázlatváltozatba tölti a jelöltet, a bútorok és a világítás is igazodik hozzá. A vázlat a panel bezárása után is megmarad; törölni a
        Műveletek menüben lehet.
      </p>
    </div>
  );
}
