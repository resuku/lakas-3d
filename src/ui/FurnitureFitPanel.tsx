import { useMemo } from 'react';
import { furnitureFit, type FitItem, type Verdict } from '../lib/furnitureFit';
import type { Variant } from '../model/types';

// A változathoz illő bútorszínek (heurisztika, a felületek színeiből újraszámolva).

const MARK: Record<Verdict, string> = { good: '✓', ok: '≈', bad: '✕' };
const TITLE: Record<Verdict, string> = { good: 'Jól megy', ok: 'Elmegy', bad: 'Kerülendő' };

function Chips({ items }: { items: FitItem[] }) {
  return (
    <>
      {(['good', 'ok', 'bad'] as Verdict[]).map((vd) => {
        const list = items.filter((i) => i.verdict === vd);
        if (!list.length) return null;
        return (
          <div key={vd} className={`fit-row ${vd}`}>
            <span className="fit-label">
              {MARK[vd]} {TITLE[vd]}
            </span>
            <div className="fit-chips">
              {list.map((i) => (
                <span key={i.id} className="fit-chip" title={i.reasons.join('; ') || 'nincs különösebb ellen- vagy mellette szóló érv'}>
                  <i style={{ background: i.hex }} />
                  {i.label}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

export function FurnitureFitPanel({ v }: { v: Variant }) {
  const fit = useMemo(() => furnitureFit(v), [v]);
  return (
    <>
      <p className="note">
        A változat fal-, padló- és ajtószíneiből számolva ({fit.temp === 'warm' ? 'meleg' : fit.temp === 'cool' ? 'hűvös' : 'semleges'} alap). Heurisztika: az
        egeret a színre víve látszik az indok; végső döntés anyagmintával.
      </p>
      <div className={`fit-ease ${fit.ease.level === 'könnyű' ? 'good' : fit.ease.level === 'közepes' ? 'ok' : 'bad'}`}>
        Beszerezhetőség: <b>{fit.ease.level}</b> – {fit.ease.text}
      </div>
      <div className="fit-group">
        <b>Kanapé, kárpit</b>
        <Chips items={fit.sofa} />
      </div>
      <div className="fit-group">
        <b>Bútortest, asztal, polc</b>
        <Chips items={fit.wood} />
      </div>
      <div className="fit-group">
        <b>Fém (lábak, lámpák, fogantyúk)</b>
        <Chips items={fit.metal} />
      </div>
    </>
  );
}
