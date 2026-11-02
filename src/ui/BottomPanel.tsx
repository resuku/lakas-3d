import { useMemo, useState } from 'react';
import { getRoom, ROOMS } from '../data/rooms';
import { CATALOG_CHECKED, COLOR_SOURCE_LABEL, CURTAIN_TYPE_LABEL, DOOR_STYLE_LABEL, usedProducts } from '../data/products';
import { runChecks } from '../lib/checks';
import { collectVals, STATUS_INFO } from '../lib/status';
import { FIXTURE_LABEL, LAMPS_CHECKED, findLamp, fixtureSpec } from '../lib/fixtures';
import { useActivePlan, useStore, useVariant } from '../store';
import { shoppingCsv, shoppingList, shoppingTotal } from '../lib/shopping';

export function BottomPanel() {
  const details = useStore((s) => s.details);
  const [tabState, setTab] = useState<'checks' | 'data' | 'products' | 'off'>(details ? 'checks' : 'off');
  // egyszerű nézetben csak a Termékek fül
  const tab = !details && (tabState === 'checks' || tabState === 'data') ? 'products' : tabState;
  const roomId = useStore((s) => s.roomId);
  const activeId = useStore((s) => s.activeId);
  const room = getRoom(roomId);
  const variant = useVariant(activeId);
  const choices = useStore((s) => s.choices);
  const furnishOn = useStore((s) => s.layers.furniture);
  const picks = useStore((s) => s.furniturePicks);
  const furnish = furnishOn ? picks : null;
  const findings = useMemo(() => runChecks(room, variant, choices, furnish), [room, variant, choices, furnish]);
  const rows = useMemo(() => collectVals(room), [room]);
  const warnCount = findings.filter((f) => f.level === 'warn').length;
  const used = useMemo(() => usedProducts(variant, Object.fromEntries(ROOMS.map((r) => [r.id, r]))), [variant]);
  const plan = useActivePlan();
  const light = useStore((s) => s.light);
  // az aktív világítási terv termékes lámpái, helyiségenként
  const lamps = useMemo(
    () =>
      ROOMS.flatMap((r) =>
        (plan?.rooms[r.id] ?? []).filter((f) => findLamp(f.productId)).map((f) => ({ room: r, f, p: findLamp(f.productId)!, spec: fixtureSpec(f, light) })),
      ),
    [plan, light],
  );

  const decorOn = useStore((s) => s.layers.decor);
  const decorItems = useStore((s) => s.decor);
  const shopping = useMemo(() => shoppingList(variant, plan, choices, furnish, decorOn ? decorItems : []), [variant, plan, choices, furnish, decorOn, decorItems]);
  const total = shoppingTotal(shopping);
  const furniture = shopping.filter((r) => r.category === 'Bútor' || r.category === 'Akusztikus falpanel');
  const saveCsv = () => {
    const title = `Lakás 3D – bevásárlólista: ${variant.name}${plan ? `, ${plan.name}` : ''} (${new Date().toISOString().slice(0, 10)}, becslés)`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([shoppingCsv(shopping, title)], { type: 'text/csv;charset=utf-8' }));
    a.download = `lakas-3d-bevasarlolista-${variant.id}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <section className={`bottom ${tab === 'off' ? 'collapsed' : ''}`}>
      <nav>
        {details && (
          <>
            <button className={tab === 'checks' ? 'on' : ''} onClick={() => setTab('checks')}>
              Ellenőrzések {warnCount > 0 && <b className="badge">{warnCount}</b>}
            </button>
            <button className={tab === 'data' ? 'on' : ''} onClick={() => setTab('data')}>
              Adatok és források ({rows.length})
            </button>
          </>
        )}
        <button className={tab === 'products' ? 'on' : ''} onClick={() => setTab('products')}>
          Termékek ({used.length + lamps.length + furniture.length})
        </button>
        <button onClick={saveCsv} title="Az aktuális változat és világítás termékei becsült mennyiséggel és összeggel, Excelben megnyitható CSV-ben">
          Bevásárlólista (CSV)
        </button>
        <span className="src">
          {details
            ? room.source
            : total > 0
              ? `Becsült anyagköltség: kb. ${Math.round(total / 1000).toLocaleString('hu-HU')} ezer Ft (munkadíj nélkül)`
              : 'Ebben a változatban nincs katalógustermék – a J-javaslatokban van.'}
        </span>
        <button className="collapse" onClick={() => setTab(tab === 'off' ? (details ? 'checks' : 'products') : 'off')}>
          {tab === 'off' ? '▲' : '▼'}
        </button>
      </nav>
      {tab === 'checks' && (
        <ul className="findings">
          {findings.map((f, i) => (
            <li key={i} className={f.level}>
              {f.text}
            </li>
          ))}
        </ul>
      )}
      {tab === 'products' && (
        <div className="table-wrap">
          {used.length === 0 ? (
            <p className="note" style={{ padding: 10 }}>
              Ebben a változatban nincs katalógustermék. A Felületek panelen a „Katalógus” részből választhatsz valós festéket, padlót, ajtót és függönyt.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Felület</th>
                  <th>Termék</th>
                  <th>Kód / méret</th>
                  <th>Modellszín</th>
                  <th>Ár</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                {used.map((u) => {
                  const { paint: p, floor: f, door: d, curtain: c } = u;
                  const item = p ?? f ?? d ?? c;
                  const name = p
                    ? `${p.brand} ${p.line} – ${p.name}`
                    : f
                      ? `${f.store}: ${f.manufacturer} ${f.name}`
                      : d
                        ? `${d.store}: ${d.manufacturer} ${d.line} – ${d.name}`
                        : c
                          ? `${c.store}: ${c.name}, ${c.colorName}`
                          : 'ismeretlen termék';
                  const spec = p
                    ? p.code
                    : f
                      ? `${f.size ? `${f.size.l} × ${f.size.w}${f.size.t ? ` × ${f.size.t}` : ''} mm, ` : ''}${f.type}${f.wear ? `, ${f.wear}` : ''}`
                      : d
                        ? [d.decor, DOOR_STYLE_LABEL[d.style], d.surface].filter(Boolean).join(', ')
                        : c
                          ? [CURTAIN_TYPE_LABEL[c.type], c.size && `${c.size.w} × ${c.size.l} cm`, c.pack, c.article].filter(Boolean).join(', ')
                          : '';
                  return (
                    <tr key={u.slot}>
                      <td>{u.label}</td>
                      <td>{name}</td>
                      <td>{spec}</td>
                      <td>
                        {item && (
                          <>
                            <span className="status" style={{ background: item.hex }}>
                              &nbsp;&nbsp;
                            </span>{' '}
                            {item.hex} <small>({COLOR_SOURCE_LABEL[item.hexSource]})</small>
                          </>
                        )}
                      </td>
                      <td>{item?.price ?? '–'}</td>
                      <td>
                        {item && (
                          <a href={p?.shopUrl ?? item.url} target="_blank" rel="noreferrer">
                            megnyitás
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {lamps.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Lámpa ({plan?.name})</th>
                  <th>Termék</th>
                  <th>Méret</th>
                  <th>Fényáram</th>
                  <th>Ár</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                {lamps.map(({ room: r, f, p, spec }) => (
                  <tr key={`${r.id}.${f.id}`}>
                    <td>
                      {r.name} – {f.label ?? FIXTURE_LABEL[f.type]}
                    </td>
                    <td>
                      {p.store}: {p.brand ? `${p.brand} ` : ''}
                      {p.name}
                      {p.colorName ? `, ${p.colorName}` : ''}
                    </td>
                    <td>{[p.size.d && `Ø ${p.size.d}`, p.size.h && `m ${p.size.h}`, p.size.l && `h ${p.size.l}`].filter(Boolean).join(' · ')} mm</td>
                    <td>
                      {Math.round(spec.lm)} lm{spec.lmSource === 'bulb' ? ` (${p.socket?.count}× ${p.socket?.type} izzóval)` : ''}
                      {spec.K ? `, ${spec.K} K` : ''}
                    </td>
                    <td>{p.price ?? '–'}</td>
                    <td>
                      <a href={p.url} target="_blank" rel="noreferrer">
                        megnyitás
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {furniture.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Bútor (berendezési javaslat)</th>
                  <th>Termék</th>
                  <th>Méret</th>
                  <th>Db</th>
                  <th>Ár</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                {furniture.map((r) => (
                  <tr key={r.place}>
                    <td>{r.place}</td>
                    <td>
                      {r.store}: {r.product}
                    </td>
                    <td>{r.spec}</td>
                    <td>{r.qty}</td>
                    <td>{r.unitPrice || '–'}</td>
                    <td>
                      <a href={r.url} target="_blank" rel="noreferrer">
                        megnyitás
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="note" style={{ padding: '6px 10px' }}>
            Katalógus ellenőrizve: festékek {CATALOG_CHECKED.paints}, padlók {CATALOG_CHECKED.floors}, ajtók {CATALOG_CHECKED.doors}, függönyök {CATALOG_CHECKED.curtains}, lámpák {LAMPS_CHECKED}, bútorok {CATALOG_CHECKED.furniture}. Az árak és az elérhetőség változhat; a képernyőszín közelítés, végső döntés előtt fizikai minta kell.
          </p>
        </div>
      )}
      {tab === 'data' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Elem</th>
                <th>Adat</th>
                <th className="num">Érték (mm)</th>
                <th>Státusz</th>
                <th>Forrás</th>
                <th>Megjegyzés</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.group}</td>
                  <td>{r.label}</td>
                  <td className="num">{r.v === null ? '–' : r.v}</td>
                  <td>
                    <span className="status" style={{ background: STATUS_INFO[r.s].color }}>
                      {r.s}
                    </span>{' '}
                    {STATUS_INFO[r.s].label}
                  </td>
                  <td>{r.refs}</td>
                  <td>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
