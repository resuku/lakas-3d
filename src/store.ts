import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ROOMS } from './data/rooms';
import { SCENES } from './data/scenes';
import { DEFAULT_VARIANTS } from './data/variants';
import { DEFAULT_LIGHT_PLANS } from './data/lightPlans';
import { DEFAULT_CHOICES } from './data/choices';
import { suggestFurniture } from './lib/furnitureSets';
import type { DecorItem, LightPlan, LightSettings, Variant } from './model/types';

export type ViewMode = 'single' | 'compare';
export type SidebarTab = 'view' | 'variant' | 'materials' | 'light' | 'more';

export interface Layers {
  status: boolean;
  zones: boolean;
  dims: boolean;
  doorsOpen: boolean;
  /** Berendezési javaslat (kanapé, asztal, szőnyeg stb., data/furnishing.ts). */
  furniture: boolean;
  /** Elhelyezett dekorelemek (növények, képek, akusztikus panelek); alapból rejtve. */
  decor: boolean;
}

export interface CamPose {
  pos: [number, number, number];
  target: [number, number, number];
}

interface State {
  roomId: string;
  viewMode: ViewMode;
  /** Teljes lakás nézet: minden helyiség a helyén; a kiválasztott helyiség a szerkesztett és a kamera célja. */
  whole: boolean;
  variants: Variant[];
  activeId: string;
  compareId: string;
  sceneId: string;
  light: LightSettings;
  layers: Layers;
  lightPlans: LightPlan[];
  activePlanId: string;
  /** Egyenként lekapcsolt lámpák (`${roomId}.${fixtureId}`), a 3D nézetben kattintással. */
  lampsOff: Record<string, boolean>;
  /** A J-javaslat kiválasztásakor a hozzá illesztett világítási terv is bekapcsol. */
  planFollowsVariant: boolean;
  /** Néző-szintű beállítások: csak ezen a gépen, a konfigurációs fájlba nem kerülnek. */
  viewerName: string;
  /** Részletes (tervezői) nézet: rétegek, ellenőrzések, források, lámpaszerkesztés; egyébként egyszerű nézet. */
  details: boolean;
  /** Könnyített megjelenítés gyengébb gépekhez: árnyék nélkül, kisebb felbontással. */
  lowQuality: boolean;
  helpSeen: boolean;
  /** Az oldalsáv aktív füle. */
  sidebarTab: SidebarTab;
  /** Nyitott műszaki lehetőségek választása (data/choices.ts). */
  choices: Record<string, string>;
  /** Berendezés: termékhelyenként (FurnSpec.slot) a választott katalógusbútor (products/furniture.json); hiányában helyőrző. */
  furniturePicks: Record<string, string>;
  /** A J-javaslat (változat) kiválasztásakor a hozzá illő bútorok is betöltődnek (lib/furnitureSets.ts). */
  furnitureFollowsVariant: boolean;
  /** Elhelyezett dekorelemek (minden helyiségben, a színváltozattól függetlenül). */
  decor: DecorItem[];
  /** Elhelyezés kattintással: új elem típusa vagy áthelyezendő elem; nem mentődik. */
  placing: { typeId?: string; moveId?: string } | null;
  /** A kijelölt dekorelem; nem mentődik. */
  selectedDecor: string | null;
  /** Gyorsinfó (Alt nyomva tartva vagy I-vel rögzítve): az egér alatti elem leírása; nem mentődik. */
  inspect: { on: boolean; sticky: boolean; info: { title: string; lines: string[] } | null; x: number; y: number };
  /** Kameraváltási kérés: preset index vagy 'overview'. */
  camRequest: { key: string; n: number };
  /** Összehasonlító nézetben a két kamera szinkronja. */
  camSync: CamPose & { from: string; n: number };
  /** Bejárás (WASD) mód; nem mentődik. */
  walk: boolean;

  setRoom(id: string): void;
  setViewMode(m: ViewMode): void;
  setWhole(on: boolean): void;
  setActive(id: string): void;
  setCompare(id: string): void;
  updateVariant(id: string, fn: (v: Variant) => Variant): void;
  duplicateVariant(id: string): void;
  deleteVariant(id: string): void;
  replaceVariants(vs: Variant[]): void;
  applyScene(id: string): void;
  setLight(fn: (l: LightSettings) => LightSettings): void;
  setLayer(k: keyof Layers, v: boolean): void;
  requestCamera(key: string): void;
  publishCamera(pose: CamPose, from: string): void;
  setWalk(on: boolean): void;
  setActivePlan(id: string): void;
  updatePlan(id: string, fn: (p: LightPlan) => LightPlan): void;
  duplicatePlan(id: string): void;
  deletePlan(id: string): void;
  toggleLamp(key: string): void;
  setChoice(group: string, option: string): void;
  /** Bútortermék egy termékhelyre (undefined: vissza a helyőrzőre). */
  setFurniturePick(slot: string, id: string | undefined): void;
  /** Több termékhely egyszerre (pl. a javasolt bútorok betöltése). */
  setFurniturePicks(picks: Record<string, string>): void;
  addDecor(item: DecorItem): void;
  updateDecor(id: string, patch: Partial<DecorItem>): void;
  removeDecor(id: string): void;
  setPlacing(p: State['placing']): void;
  selectDecor(id: string | null): void;
  setPlanFollowsVariant(on: boolean): void;
  setFurnitureFollowsVariant(on: boolean): void;
  setViewer(patch: Partial<Pick<State, 'viewerName' | 'details' | 'lowQuality' | 'helpSeen' | 'sidebarTab'>>): void;
  /** A saját visszajelzés (viewerName néven) az adott változathoz. */
  setFeedback(variantId: string, patch: { fav?: boolean; note?: string }): void;
  /** Más konfigurációs fájljából a visszajelzések (és az ott létrehozott új változatok) átvétele. */
  mergeFeedback(data: unknown): string;
  setInspect(fn: (i: State['inspect']) => State['inspect']): void;
  /** Konfigurációs fájl betöltése; hibánál a hiba szövegét adja vissza. */
  loadConfig(data: unknown): string | null;
  /** Minden beállítás és változat vissza a kezdeti állapotra. */
  resetAll(): void;
}

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

/** A mentett (és alaphelyzetbe állítható) beállítások kezdeti értéke. */
function initialSettings() {
  return {
    roomId: ROOMS[0].id,
    viewMode: 'single' as ViewMode,
    whole: false,
    variants: clone(DEFAULT_VARIANTS),
    activeId: DEFAULT_VARIANTS[0].id,
    compareId: DEFAULT_VARIANTS[1].id,
    sceneId: SCENES[0].id,
    light: clone(SCENES[0].settings),
    layers: { status: false, zones: false, dims: false, doorsOpen: false, furniture: true, decor: false },
    lightPlans: clone(DEFAULT_LIGHT_PLANS),
    // az első javaslat saját világítása (ha van)
    activePlanId: DEFAULT_LIGHT_PLANS.find((p) => p.id === DEFAULT_VARIANTS[0].lightPlanId)?.id ?? DEFAULT_LIGHT_PLANS[0].id,
    lampsOff: {} as Record<string, boolean>,
    choices: { ...DEFAULT_CHOICES },
    furniturePicks: suggestFurniture(DEFAULT_VARIANTS[0]).picks,
    furnitureFollowsVariant: true,
    decor: [] as DecorItem[],
    planFollowsVariant: true,
  };
}

/** A mentett állapot verziója (localStorage és konfigurációs fájl). */
export const STORE_VERSION = 9;

/** A v6-ban törölt alapváltozatok (halszálkás J3, J12; termék nélküli A/B/C koncepciók) és terveik. */
const REMOVED_VARIANTS = ['v-meleg', 'v-japandi', 'v-zsalya', 'j3-homok-agyag', 'j12-mediterran'];
const REMOVED_PLANS = ['lj3', 'lj12'];

const PERSISTED_KEYS = [
  'roomId',
  'viewMode',
  'whole',
  'variants',
  'activeId',
  'compareId',
  'sceneId',
  'light',
  'layers',
  'lightPlans',
  'activePlanId',
  'lampsOff',
  'choices',
  'furniturePicks',
  'furnitureFollowsVariant',
  'decor',
  'planFollowsVariant',
] as const;
type Persisted = Pick<State, (typeof PERSISTED_KEYS)[number]>;

function pickPersisted(s: State): Persisted {
  return Object.fromEntries(PERSISTED_KEYS.map((k) => [k, s[k]])) as Persisted;
}

/** A böngészőben megmaradó állapot: a konfiguráció + a néző-szintű beállítások. */
const LOCAL_KEYS = [...PERSISTED_KEYS, 'viewerName', 'details', 'lowQuality', 'helpSeen', 'sidebarTab'] as const;
function pickLocal(s: State) {
  return Object.fromEntries(LOCAL_KEYS.map((k) => [k, s[k]]));
}

/** Telefon / tablet: durva mutató vagy keskeny képernyő – ilyenkor alapból könnyített megjelenítés. */
export function smallDevice() {
  try {
    return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 900;
  } catch {
    return false;
  }
}

// v2: a javasolt (katalógustermékes) változatok hozzáadása a már mentett változatokhoz
// v3: a J-javaslatok ajtóval és függönnyel bővültek – a mentett J-változatok helyére a frissek kerülnek
// v4: világítási tervek – a hiányzó alapértelmezett tervek hozzáadása
// v5: a J-javaslatok saját világítási tervei (lj1–lj18) és a változatok hivatkozása rájuk
// v6: a halszálkás J3 és J12, valamint az A/B/C koncepciópéldák törlése (a többi J száma marad)
// v7: berendezési javaslat (layers.furniture, alapból be; furniturePicks: választott bútortermékek, alapból üres);
//     a nappali étkező-függesztéke az asztal fölé (z 1700 → 2050), az állólámpa a kanapé erkély felőli végéhez
//     (z 3800 → 7100) – a tervekben ott, ahol még a régi helyőrzőn áll
// v8: dekorelemek (decor, layers.decor – alapból rejtve)
// v9: a változathoz illő bútorok (furnitureFollowsVariant, alapból be); üres választásnál az aktív változat bútorai
const MOVED_FIXTURES: { id: string; from: [number, number]; to: [number, number] }[] = [
  { id: 'etk', from: [1720, 1700], to: [1720, 2050] },
  { id: 'allo', from: [300, 3800], to: [300, 7100] },
];
function migrateState(persisted: unknown, version: number) {
  const s = persisted as {
    variants?: Variant[];
    lightPlans?: LightPlan[];
    layers?: Partial<Layers>;
    decor?: DecorItem[];
    activeId?: string;
    furniturePicks?: Record<string, string>;
    furnitureFollowsVariant?: boolean;
  };
  if (version < 3 && s.variants) {
    const fresh = new Map(DEFAULT_VARIANTS.filter((v) => v.id.startsWith('j')).map((v) => [v.id, v]));
    s.variants = s.variants.map((v) => (fresh.has(v.id) ? clone(fresh.get(v.id)!) : v));
    const have = new Set(s.variants.map((v) => v.id));
    s.variants = [...s.variants, ...clone(DEFAULT_VARIANTS.filter((v) => !have.has(v.id)))];
  }
  if (version < 5 && s.variants) {
    const byId = new Map(DEFAULT_VARIANTS.map((v) => [v.id, v]));
    s.variants = s.variants.map((v) => (byId.get(v.id)?.lightPlanId && !v.lightPlanId ? { ...v, lightPlanId: byId.get(v.id)!.lightPlanId } : v));
  }
  if (version < 5 && s.lightPlans) {
    const have = new Set(s.lightPlans.map((p) => p.id));
    s.lightPlans = [...s.lightPlans, ...clone(DEFAULT_LIGHT_PLANS.filter((p) => !have.has(p.id)))];
  }
  if (version < 6) {
    const st = s as { variants?: Variant[]; lightPlans?: LightPlan[]; activeId?: string; compareId?: string; activePlanId?: string };
    if (st.variants) {
      const left = st.variants.filter((v) => !REMOVED_VARIANTS.includes(v.id));
      st.variants = left.length ? left : clone(DEFAULT_VARIANTS);
      if (!st.variants.some((v) => v.id === st.activeId)) st.activeId = st.variants[0].id;
      if (!st.variants.some((v) => v.id === st.compareId)) st.compareId = st.variants[Math.min(1, st.variants.length - 1)].id;
    }
    if (st.lightPlans) {
      st.lightPlans = st.lightPlans.filter((p) => !REMOVED_PLANS.includes(p.id));
      if (!st.lightPlans.some((p) => p.id === st.activePlanId)) st.activePlanId = st.lightPlans[0]?.id;
    }
  }
  if (version < 7) {
    if (s.layers && s.layers.furniture === undefined) s.layers = { ...s.layers, furniture: true };
    for (const p of s.lightPlans ?? [])
      for (const f of p.rooms.nappali ?? []) {
        const m = MOVED_FIXTURES.find((m) => m.id === f.id && m.from[0] === f.x && m.from[1] === f.z);
        if (m) [f.x, f.z] = m.to;
      }
  }
  if (version < 8) {
    if (s.layers && s.layers.decor === undefined) s.layers = { ...s.layers, decor: false };
    s.decor = s.decor ?? [];
  }
  if (version < 9) {
    s.furnitureFollowsVariant = s.furnitureFollowsVariant ?? true;
    const v = s.variants?.find((x) => x.id === s.activeId) ?? s.variants?.[0];
    if (v && !Object.keys(s.furniturePicks ?? {}).length) s.furniturePicks = suggestFurniture(v).picks;
  }
  return s;
}

/** Konfigurációs fájl: a teljes mentett beállítás, hogy máshol (vagy később) visszatölthető legyen. */
export interface ConfigFile {
  app: 'lakas-3d';
  version: number;
  savedAt: string;
  state: Persisted;
}

export function configSnapshot(): ConfigFile {
  return { app: 'lakas-3d', version: STORE_VERSION, savedAt: new Date().toISOString(), state: clone(pickPersisted(useStore.getState())) };
}

export const isConfigFile = (d: unknown): d is ConfigFile =>
  !!d && typeof d === 'object' && (d as ConfigFile).app === 'lakas-3d' && typeof (d as ConfigFile).version === 'number' && !!(d as ConfigFile).state;

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initialSettings(),
      camRequest: { key: '0', n: 0 },
      camSync: { pos: [0, 0, 0], target: [0, 0, 0], from: '', n: 0 },
      walk: false,
      placing: null,
      selectedDecor: null,
      inspect: { on: false, sticky: false, info: null, x: 0, y: 0 },
      viewerName: '',
      details: false,
      lowQuality: smallDevice(),
      helpSeen: false,
      sidebarTab: 'variant',

      setRoom: (id) => set((s) => ({ roomId: id, camRequest: { key: '0', n: s.camRequest.n + 1 } })),
      setViewMode: (m) => set({ viewMode: m }),
      setWhole: (on) => set((s) => ({ whole: on, camRequest: { key: on ? 'overview' : '0', n: s.camRequest.n + 1 } })),
      setActive: (id) =>
        set((s) => {
          const v = s.variants.find((x) => x.id === id);
          const plan = v?.lightPlanId;
          const follow = s.planFollowsVariant && plan && s.lightPlans.some((p) => p.id === plan);
          return {
            activeId: id,
            ...(follow ? { activePlanId: plan, lampsOff: {} } : {}),
            ...(s.furnitureFollowsVariant && v ? { furniturePicks: suggestFurniture(v).picks } : {}),
          };
        }),
      setCompare: (id) => set({ compareId: id }),
      updateVariant: (id, fn) => set((s) => ({ variants: s.variants.map((v) => (v.id === id ? fn(clone(v)) : v)) })),
      duplicateVariant: (id) => {
        const src = get().variants.find((v) => v.id === id);
        if (!src) return;
        const copy = { ...clone(src), id: `v-${Date.now().toString(36)}`, name: `${src.name} (másolat)` };
        set((s) => ({ variants: [...s.variants, copy], activeId: copy.id }));
      },
      deleteVariant: (id) =>
        set((s) => {
          if (s.variants.length <= 1) return s;
          const variants = s.variants.filter((v) => v.id !== id);
          return {
            variants,
            activeId: s.activeId === id ? variants[0].id : s.activeId,
            compareId: s.compareId === id ? variants[Math.min(1, variants.length - 1)].id : s.compareId,
          };
        }),
      replaceVariants: (vs) => set({ variants: vs, activeId: vs[0].id, compareId: vs[Math.min(1, vs.length - 1)].id }),
      applyScene: (id) => {
        const sc = SCENES.find((x) => x.id === id);
        if (sc) set((s) => ({ sceneId: id, light: { ...clone(sc.settings), ev: s.light.ev } }));
      },
      setLight: (fn) => set((s) => ({ light: fn(clone(s.light)), sceneId: '' })),
      setLayer: (k, v) => set((s) => ({ layers: { ...s.layers, [k]: v } })),
      requestCamera: (key) => set((s) => ({ camRequest: { key, n: s.camRequest.n + 1 } })),
      publishCamera: (pose, from) => set((s) => ({ camSync: { ...pose, from, n: s.camSync.n + 1 } })),
      setWalk: (on) => set({ walk: on }),
      setActivePlan: (id) => set({ activePlanId: id, lampsOff: {} }),
      updatePlan: (id, fn) => set((s) => ({ lightPlans: s.lightPlans.map((p) => (p.id === id ? fn(clone(p)) : p)) })),
      duplicatePlan: (id) => {
        const src = get().lightPlans.find((p) => p.id === id);
        if (!src) return;
        const copy = { ...clone(src), id: `l-${Date.now().toString(36)}`, name: `${src.name} (másolat)` };
        set((s) => ({ lightPlans: [...s.lightPlans, copy], activePlanId: copy.id }));
      },
      deletePlan: (id) =>
        set((s) => {
          if (s.lightPlans.length <= 1) return s;
          const lightPlans = s.lightPlans.filter((p) => p.id !== id);
          return { lightPlans, activePlanId: s.activePlanId === id ? lightPlans[0].id : s.activePlanId };
        }),
      toggleLamp: (key) => set((s) => ({ lampsOff: { ...s.lampsOff, [key]: !s.lampsOff[key] } })),
      setChoice: (group, option) => set((s) => ({ choices: { ...s.choices, [group]: option } })),
      setFurniturePick: (slot, id) =>
        set((s) => {
          const furniturePicks = { ...s.furniturePicks };
          if (id) furniturePicks[slot] = id;
          else delete furniturePicks[slot];
          return { furniturePicks };
        }),
      setFurniturePicks: (picks) => set({ furniturePicks: { ...picks } }),
      addDecor: (item) => set((s) => ({ decor: [...s.decor, item], selectedDecor: item.id, layers: { ...s.layers, decor: true } })),
      updateDecor: (id, patch) => set((s) => ({ decor: s.decor.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
      removeDecor: (id) => set((s) => ({ decor: s.decor.filter((d) => d.id !== id), selectedDecor: s.selectedDecor === id ? null : s.selectedDecor })),
      setPlacing: (p) => set((s) => ({ placing: p, layers: p ? { ...s.layers, decor: true } : s.layers })),
      selectDecor: (id) => set({ selectedDecor: id }),
      setPlanFollowsVariant: (on) => set({ planFollowsVariant: on }),
      setFurnitureFollowsVariant: (on) => set({ furnitureFollowsVariant: on }),
      setViewer: (patch) => set(patch),
      setFeedback: (variantId, patch) =>
        set((s) => {
          const name = s.viewerName.trim() || 'én';
          return {
            variants: s.variants.map((v) => {
              if (v.id !== variantId) return v;
              const fb = { ...(v.feedback ?? {}) };
              const next = { ...(fb[name] ?? {}), ...patch, at: new Date().toISOString().slice(0, 10) };
              if (!next.fav && !next.note) delete fb[name];
              else fb[name] = next;
              return { ...v, feedback: fb };
            }),
          };
        }),
      mergeFeedback: (data) => {
        if (!isConfigFile(data)) return 'A fájl nem a Lakás 3D konfigurációs fájlja.';
        const theirs = (migrateState(clone(data.state), data.version) as Partial<Persisted>).variants ?? [];
        let notes = 0;
        let added = 0;
        set((s) => {
          const mine = new Map(s.variants.map((v) => [v.id, v]));
          for (const t of theirs) {
            const m = mine.get(t.id);
            if (!m) {
              // a másik gépen létrehozott (pl. másolt, átszínezett) változat
              mine.set(t.id, clone(t));
              added++;
              continue;
            }
            if (!t.feedback) continue;
            const fb = { ...(m.feedback ?? {}) };
            for (const [who, f] of Object.entries(t.feedback)) {
              if (!fb[who] || (f.at ?? '') >= (fb[who].at ?? '')) fb[who] = f;
              notes++;
            }
            mine.set(t.id, { ...m, feedback: fb });
          }
          return { variants: [...mine.values()] };
        });
        return `${notes} visszajelzés${added ? ` és ${added} új változat` : ''} átvéve.`;
      },
      loadConfig: (data) => {
        if (!isConfigFile(data)) return 'A fájl nem a Lakás 3D konfigurációs fájlja.';
        if (data.version > STORE_VERSION) return 'A fájl a program újabb változatával készült – frissítsd az oldalt.';
        const st = migrateState(clone(data.state), data.version) as Partial<Persisted>;
        if (!Array.isArray(st.variants) || !st.variants.length || !st.variants.every((v) => v && v.id && v.name && v.floor)) return 'A fájlban nincs érvényes változatlista.';
        const merged = { ...initialSettings(), ...st };
        if (!merged.variants.some((v) => v.id === merged.activeId)) merged.activeId = merged.variants[0].id;
        if (!merged.variants.some((v) => v.id === merged.compareId)) merged.compareId = merged.variants[Math.min(1, merged.variants.length - 1)].id;
        if (!merged.lightPlans.some((p) => p.id === merged.activePlanId)) merged.activePlanId = merged.lightPlans[0].id;
        if (!ROOMS.some((r) => r.id === merged.roomId)) merged.roomId = ROOMS[0].id;
        set((s) => ({ ...merged, walk: false, camRequest: { key: merged.whole ? 'overview' : '0', n: s.camRequest.n + 1 } }));
        return null;
      },
      setInspect: (fn) => set((s) => ({ inspect: fn(s.inspect) })),
      resetAll: () => set((s) => ({ ...initialSettings(), walk: false, camRequest: { key: '0', n: s.camRequest.n + 1 } })),
    }),
    {
      name: 'lakas-3d',
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      // a verziók és a migráció leírása: migrateState
      migrate: (persisted, version) => migrateState(persisted, version) as State,
      partialize: pickLocal,
    },
  ),
);

export function useActivePlan(): LightPlan | undefined {
  return useStore((s) => s.lightPlans.find((p) => p.id === s.activePlanId) ?? s.lightPlans[0]);
}

export function useVariant(id: string): Variant {
  return useStore((s) => s.variants.find((v) => v.id === id) ?? s.variants[0]);
}
