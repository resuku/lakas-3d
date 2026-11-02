import lamps from '../data/products/lamps.json';
import type { Fixture, FixtureType, LampProduct, LightPlan, LightSettings, Room } from '../model/types';

// Világítási terv: lámpák feloldása termékre, fényáram és színhőmérséklet a fényjelenethez.

export const LAMP_PRODUCTS = lamps.items as LampProduct[];
export const LAMPS_CHECKED = lamps.meta.checkedAt;

export function findLamp(id: string | undefined) {
  return id ? LAMP_PRODUCTS.find((p) => p.id === id) : undefined;
}

export const FIXTURE_LABEL: Record<FixtureType, string> = {
  pendant: 'függeszték',
  ceiling: 'mennyezeti lámpa',
  track: 'sín spotokkal',
  floor: 'állólámpa',
  wall: 'fali lámpa',
  table: 'asztali lámpa',
};

/** Mennyezeti csoport (a fényjelenet „mennyezeti” kapcsolója) vagy kiegészítő csoport. */
export const isCeilingGroup = (t: FixtureType) => t === 'pendant' || t === 'ceiling' || t === 'track';

/** Jellemző meleg (2700 K) LED izzók fényárama foglalatonként, ha a lámpa izzó nélkül kapható. */
export const BULB_LM: Record<string, number> = { E27: 806, E14: 470, GU10: 345, G9: 280 };

/** Termék nélküli (általános) lámpa méretei, mm. */
const GENERIC: Record<FixtureType, LampProduct['size'] & { shape: LampProduct['shape']; emit: LampProduct['emit']; heads?: number }> = {
  pendant: { d: 380, h: 240, shape: 'dome', emit: 'down' },
  ceiling: { d: 400, h: 90, shape: 'disc', emit: 'diffuse' },
  track: { l: 1000, shape: 'rail', emit: 'spot', heads: 3 },
  floor: { d: 400, h: 1550, shape: 'drum', emit: 'diffuse' },
  wall: { d: 120, h: 180, proj: 350, shape: 'spot', emit: 'spot' },
  table: { d: 260, h: 420, shape: 'drum', emit: 'diffuse' },
};

export interface FixtureSpec {
  type: FixtureType;
  product?: LampProduct;
  shape: LampProduct['shape'];
  emit: LampProduct['emit'];
  color: string;
  /** méter */
  d: number;
  h: number;
  l: number;
  proj: number;
  heads: number;
  beamDeg: number;
  /** Teljes fényáram teljes fényerőn (lm) és eredete. */
  lm: number;
  lmSource: 'product' | 'bulb' | 'scene';
  K?: number;
}

export function fixtureSpec(f: Fixture, ls: LightSettings): FixtureSpec {
  const p = findLamp(f.productId);
  const g = GENERIC[f.type];
  const size = { ...g, ...(p?.size ?? {}) };
  const group = isCeilingGroup(f.type) ? ls.ceiling : ls.accent;
  let lm = group.lm;
  let lmSource: FixtureSpec['lmSource'] = 'scene';
  if (p?.lm) {
    lm = p.lm;
    lmSource = 'product';
  } else if (p?.socket) {
    lm = (BULB_LM[p.socket.type] ?? 600) * p.socket.count;
    lmSource = 'bulb';
  }
  return {
    type: f.type,
    product: p,
    shape: p?.shape ?? g.shape,
    emit: p?.emit ?? g.emit,
    color: p?.color ?? (f.type === 'track' || f.type === 'wall' ? '#2b2a28' : '#efe9df'),
    d: (size.d ?? 300) / 1000,
    h: (size.h ?? 200) / 1000,
    l: (size.l ?? 1000) / 1000,
    proj: (size.proj ?? 300) / 1000,
    heads: p?.heads ?? g.heads ?? 1,
    beamDeg: p?.beamDeg ?? 40,
    lm,
    lmSource,
    K: p?.K,
  };
}

/** Egyenként lekapcsolt lámpák kulcsa: `${roomId}.${fixtureId}`. */
export const lampKey = (roomId: string, f: Fixture) => `${roomId}.${f.id}`;

/** A lámpa pillanatnyi fényárama a fényjelenetben (csoportkapcsoló, fényerő, egyedi lekapcsolás). */
export function fixtureOutput(f: Fixture, spec: FixtureSpec, ls: LightSettings, off = false) {
  const g = isCeilingGroup(f.type) ? ls.ceiling : ls.accent;
  return { lm: g.on && !off ? spec.lm * g.dim : 0, K: spec.K ?? g.K };
}

/** A helyiség bekapcsolt lámpáinak összes fényárama (lm) – az expozícióhoz és a megvilágításbecsléshez. */
export function roomLampLm(room: Room, plan: LightPlan | undefined, ls: LightSettings, lampsOff: Record<string, boolean>) {
  return roomFixtures(plan, room).reduce((a, f) => a + fixtureOutput(f, fixtureSpec(f, ls), ls, !!lampsOff[lampKey(room.id, f)]).lm, 0);
}

/** A felmért helyőrzők lámpaként (termék nélkül). */
export function placeholderFixtures(room: Room): Fixture[] {
  return [
    ...room.ceilingLights.map((c) => ({ id: c.id, type: 'ceiling' as const, x: c.x.v, z: c.z.v, label: c.label })),
    ...room.accentLights.map((a) => ({ id: a.id, type: a.kind === 'table' ? ('table' as const) : ('floor' as const), x: a.x, z: a.z, label: a.label })),
  ];
}

/** A terv lámpái a helyiségben; ha a terv a helyiséget nem tartalmazza, a felmért helyőrzők. */
export function roomFixtures(plan: LightPlan | undefined, room: Room): Fixture[] {
  return plan?.rooms[room.id] ?? placeholderFixtures(room);
}
