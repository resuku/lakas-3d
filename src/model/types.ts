// Adatbiztonsági jelölések (módszertan 3. fejezet):
// M = mért, D = mért adatokból levezetett, S = szkennelt (LiDAR),
// P = fényképről azonosított, A = közelítő feltételezés, U = ismeretlen.
export type Status = 'M' | 'D' | 'S' | 'P' | 'A' | 'U';

/** Hivatkozás a tervezési napló egy sorára: a `key` a sor első cellája, `n` a sorban szereplő szám. */
export interface Src {
  sheet: string;
  key: string;
  n: number;
}

/** Egy projektadat (mm) a státuszával és forrásával. */
export interface Val {
  v: number;
  s: Status;
  note?: string;
  src?: Src[];
}

/**
 * Falazonosítók a helyiség saját koordinátarendszerében (felülnézet):
 * x0 / x1 = az x tengely két végén lévő fal, z0 / z1 = a z tengely két végén lévő fal.
 * A falon mért pozíció (offset) mindig a pozitív tengelyirányban, a kisebb koordinátájú saroktól értendő.
 */
export type WallId = 'z0' | 'x1' | 'z1' | 'x0';

export interface WallDef {
  name: string;
  t: Val;
}

export interface Leaf {
  width: Val;
  height: Val;
  hinge: 'start' | 'end';
  existing: boolean;
  /** Új, opcionális ajtólap (pl. dolgozó) – a változatban kapcsolható. */
  optional?: boolean;
  /** A lap a fal túloldalán ül és onnan nyílik (a szomszéd helyiség felé). */
  away?: boolean;
  /** Nem része az egységes ajtócserének (pl. bejárati ajtó): saját szín és kialakítás. */
  fixed?: { color: string; style: DoorStyle; note?: string };
}

export interface Opening {
  id: string;
  /** passage = teljes belmagasságú, tok nélküli átjáró (pl. előszoba → közlekedő). */
  kind: 'door' | 'window' | 'passage';
  label: string;
  wall: WallId;
  offset: Val;
  width: Val;
  height: Val;
  bottom: Val;
  leaf?: Leaf;
  transom?: { top: Val };
  trim?: boolean;
  sill?: { depth: Val };
  /** Vízszintes osztások a nyílás aljától (mm). */
  splits?: { at: number; s: Status }[];
  /** A legalsó üvegmező színe (pl. borostyán fix üveg). */
  lowerTint?: string;
  /** Függőleges osztások a nyílás kezdetétől (mm), pl. erkélyajtó és ablakmező határa. */
  vsplits?: { at: number; s: Status }[];
  /** Ajtószárny ablakos nyílásban (erkélyajtó): a függőleges osztások szerinti mező indexe. */
  doorPane?: { index: number; hinge: 'start' | 'end'; outward: boolean; leaf: Val };
  /** Szomszéd helyiségből beszűrődő nappali fény ablakfelület-egyenértékként (0–1); ablaktalan helyiségekhez. */
  borrowLight?: number;
  /** A nyílás takarása választható (pl. tároló: nyitott, függöny, tolólap) – a csoport azonosítója. */
  coverGroup?: string;
  note?: string;
}

/** Falra szerelt berendezés (pl. split klíma beltéri egysége). */
export interface WallUnit {
  id: string;
  label: string;
  kind: 'ac';
  wall: WallId;
  offset: Val;
  width: Val;
  height: Val;
  bottom: Val;
  depth: Val;
  /** Változatlehetőség (pl. a klíma két jelölt helye): csak akkor jelenik meg, ha a csoportban ez a választott. */
  choice?: { group: string; option: string };
  note?: string;
}

/** Egyszerű bútor (pl. éjjeliszekrény) alaprajzi téglalappal, mm. */
export interface FurnitureItem {
  id: string;
  label: string;
  kind: 'nightstand';
  x0: number;
  z0: number;
  sx: number;
  sz: number;
  h: number;
  s: Status;
  note?: string;
}

/** Bútortermék-kategóriák a katalógusban (products/furniture.json). */
export type FurnCategory =
  | 'sofa'
  | 'sofaChaise'
  | 'ottoman'
  | 'tvUnit'
  | 'tvWall'
  | 'nightstand'
  | 'diningTable'
  | 'chair'
  | 'rugLiving'
  | 'rugBedroom'
  | 'divider'
  | 'bed'
  | 'deskCorner'
  | 'acousticPanel';

/** TV-fal (szekrénysor) eleme: alacsony pad, falra szerelt szekrény, magas oldalszekrény vagy nyitott polc (mm). */
export interface FurnPart {
  kind: 'low' | 'wall' | 'tall' | 'shelf';
  w: number;
  d: number;
  h: number;
  /** Alsó él a padló fölött (falra szerelt elem). */
  y?: number;
  side?: 'left' | 'right' | 'center';
  qty?: number;
  /** Az elem formája (talp, frontosztás, fogantyú) a termékfotó alapján. */
  form?: CabinetForm;
}

/** Frontcella: nyíló ajtó, fiók, billenőajtó, nyitott rekesz, üvegajtó, lamellás díszbetét. */
export type FrontKind = 'door' | 'drawer' | 'flap' | 'open' | 'glass' | 'slats';
/** Frontcella, `h`: relatív magasság az oszlopon belül (alapból 1). */
export type FrontCell = FrontKind | { k: FrontKind; h: number };

/**
 * Dobozbútor (TV-szekrény, éjjeliszekrény, TV-fal eleme) formája a termékfotó és a termékoldal alapján; a paraméteres
 * modell (scene/CabinetModel.tsx) ebből rajzol. Méret nincs benne – az a termék `size`-a –, csak arányok és típusok.
 */
export interface CabinetForm {
  /** Talp: lábak, lábazat, keretes alváz (lábak + összekötő keret), falra szerelt, a padlón álló test. */
  base: 'legs' | 'plinth' | 'frame' | 'wall' | 'none';
  /** A talp magassága (mm), a teljes magasságon belül; falra szerelt elemnél az alsó él a padló fölött (a magasságon kívül). */
  baseH?: number;
  /** Láb: vékony szögletes, kerek, kúpos és kifelé dőlő (skandináv). */
  leg?: 'square' | 'round' | 'tapered';
  /** A lábazat beljebb húzása (mm); 0 = a fronttal egy síkban. Alapból 25. */
  setback?: number;
  /** A talp színe: 'body' (a testé, alapértelmezés), 'black', 'metal' (a változat fémszíne) vagy hex. */
  baseColor?: string;
  /** Alsó polc a lábak között: a polc teteje a padló fölött (mm) – asztalkaszerű éjjeliszekrény. */
  lowerShelf?: number;
  /** A keret lapvastagsága (mm), alapból 18. */
  panel?: number;
  /** Frontok oszloponként balról jobbra, az oszlopon belül felülről lefelé. */
  cols?: FrontCell[][];
  /** Az oszlopok relatív szélessége (hiányában egyenlő). */
  colW?: number[];
  /** Tolóajtók száma a teljes szélességen, két síkon (a `cols` helyett). */
  sliding?: number;
  /** A frontok a keretbe süllyesztve (a keret körben látszik); alapból ráütve, a testet takarva. */
  inset?: boolean;
  /** Fogantyú: nincs (nyomásra nyíló), gomb, rúd, fogóbemetszés a front tetején, függőleges fogóvájat. */
  handle?: 'none' | 'knob' | 'bar' | 'grip' | 'slot';
  /** A fogantyú színe: 'black', 'metal', 'brass', 'steel', 'body' vagy hex. */
  handleColor?: string;
  /** Kéttónusú bútor: a test, illetve a frontok színe, ha eltér a termék színétől (`hex`). */
  bodyHex?: string;
  frontHex?: string;
  /**
   * Melyik felületre kerül a helyi fotótextúra (lib/localTextures.ts). Alapból arra, amelynek nincs külön színe
   * (`bodyHex` / `frontHex`); kéttónusú bútornál itt adható meg, melyik a fotón látható dekor.
   */
  woodOn?: 'body' | 'front' | 'all' | 'none';
  /** Magasfényű front. */
  gloss?: boolean;
  /** Honnan: termékfotó (a kép alapján, arányok becsülve), termékoldal (leírás), vagy mindkettő. */
  src: 'photo' | 'page' | 'photo+page';
  note?: string;
}

/** Valós bútortermék a magyar kínálatból; a méret mm-ben, a termékoldal szerint (ami ott nincs, hiányzik). */
export interface FurnitureProduct {
  id: string;
  category: FurnCategory;
  store: string;
  brand?: string;
  name: string;
  article?: string;
  /** w = szélesség (szőnyegnél a hosszabb oldal, asztalnál a zárt hossz vagy átmérő), d = mélység, h = magasság;
   *  ext = bővített hossz, sleep = fekvőfelület, openD = kinyitott mélység, chaise = a chaise szélessége / mélysége,
   *  pile = szálmagasság, headH = fejvég magassága. */
  size: {
    w?: number;
    d?: number;
    h?: number;
    seatH?: number;
    sleepW?: number;
    sleepL?: number;
    openD?: number;
    chaiseW?: number;
    chaiseD?: number;
    ext?: number;
    pile?: number;
    headH?: number;
    frameH?: number;
    /** Sarokasztal: a rövid ág teljes hossza (a hosszú ág hátsó élétől) és mélysége. */
    legL?: number;
    legD?: number;
    hMin?: number;
    hMax?: number;
    /** Akusztikus panel: léc szélessége és köze, hatszög elem szélessége. */
    slatW?: number;
    slatGap?: number;
    tileW?: number;
  };
  /** L alakú kanapé: chaise (récamié) vagy valódi sarokkanapé (a rövid ágnak is van háttámlája). */
  lType?: 'chaise' | 'corner';
  /** TV-fal elemei, ha a termékoldal felsorolja. */
  parts?: FurnPart[];
  /** Dobozbútor formája (TV-szekrény, éjjeliszekrény; elemlista nélküli TV-falnál az alsó elemé). */
  form?: CabinetForm;
  heightAdjustable?: boolean;
  panelType?: 'slat' | 'hexagon' | 'felt';
  absorption?: string;
  feltColor?: string;
  shape?: 'round' | 'oval' | 'rect';
  sleeper?: boolean;
  storage?: string;
  chaiseSide?: 'left' | 'right' | 'reversible';
  mattress?: string;
  dividerType?: 'slatKit' | 'screen' | 'shelf';
  base?: string;
  material?: string;
  colorName?: string;
  hex: string;
  hexSource: ColorSource;
  variants?: string[];
  price?: string;
  url: string;
  /** A Wayback Machine mentése, ha az adat onnan való (az élő oldal botellenőrzés mögött van); ekkor a checkedAt a mentés dátuma. */
  archiveUrl?: string;
  imageUrl?: string;
  checkedAt: string;
  note?: string;
}

/** A berendezési javaslat bútortípusai (data/furnishing.ts). */
export type FurnKind =
  | 'sofa'
  | 'ottoman'
  | 'tvUnit'
  | 'tvWall'
  | 'tv'
  | 'table'
  | 'chair'
  | 'divider'
  | 'rug'
  | 'bed'
  | 'nightstand'
  | 'desk'
  | 'officeChair'
  | 'sideboard'
  | 'shoeCabinet'
  | 'bookcase'
  | 'bench'
  | 'cart'
  | 'console'
  | 'armchair';
/** A bútor színszerepe: a szín a változat bútor-színvilágából jön (lib/furnitureFit.ts – furniturePalette). */
export type FurnColor = 'upholstery' | 'upholstery2' | 'wood' | 'body' | 'rug' | 'black';

/**
 * Bútor-specifikáció: típus, befoglaló méret és hely a helyiség saját rendszerében (mm), paraméteres modellel.
 * Nem kiválasztott termék; a méret forrása a `basis`-ban (naplósor, lakberendezői konszignáció vagy feltételezés).
 */
export interface FurnSpec {
  id: string;
  kind: FurnKind;
  label: string;
  /** Termékhely: az azonos helyen álló darabok (pl. a 4 szék) egy terméket kapnak (store.furniturePicks). */
  slot?: string;
  /** Milyen katalógustermék kerülhet ide (products/furniture.json); hiányában nem választható (pl. a meglévő TV). */
  category?: FurnCategory;
  /** Alaprajzi középpont. */
  x: number;
  z: number;
  /** Elforgatás fokban: 0 = az eleje +z felé néz, 90 = +x felé, −90 = −x felé, 180 = −z felé. */
  rot?: number;
  /** Befoglaló méret: szélesség (a bútor saját vízszintes tengelye), mélység (előre), magasság. */
  w: number;
  d: number;
  h: number;
  /** Alsó él a padló fölött (falra szerelt TV). */
  y?: number;
  /**
   * L alak: kanapénál a chaise / sarokrész, sarokasztalnál a rövid ág. `side`: a bútor helyi −x (right) vagy +x (left) végén
   * (kanapén ülve nézve jobb / bal); `d` a teljes mélység a háttól; `corner`: a rövid ágnak is van háttámlája.
   */
  chaise?: { side: 'left' | 'right'; w: number; d: number; corner?: boolean };
  /** TV-fal: az elemek (helyőrzőnél is). */
  parts?: FurnPart[];
  /** Íróasztal: monitorok száma (jelzésszerű, 27 colos) és laptop. */
  monitors?: number;
  /** Asztallap: kör, ovális (bővített) vagy téglalap. */
  shape?: 'round' | 'oval' | 'rect';
  color: FurnColor;
  /** Rögzített szín (meglévő bútor, pl. a dolgozó asztala) – a változat színvilága helyett. */
  hex?: string;
  s: Status;
  basis: string;
  note?: string;
  /** Csak akkor jelenik meg, ha a választásban (data/choices.ts) ez az opció él. */
  choice?: { group: string; option: string };
  /** További feltételek (mind teljesüljön), pl. az étkezőpad csak bővített asztalnál. */
  when?: { group: string; option: string }[];
  /** Nem jelenik meg, ha ez az opció él (pl. a hosszú oldali szék, ha ott pad van). */
  unless?: { group: string; option: string };
  /** Megjelenésekor elrejti a helyiség felmért elemeit (ágy, éjjeliszekrény azonosítója). */
  replaces?: string[];
}

/**
 * Elhelyezett dekorelem (data/decor.ts típusai), a helyiség saját rendszerében (mm). Falra kerülő elemnél `wall` és `a`
 * (a középpont a fal mentén) adja a helyet, `y` az alsó él; padlón vagy bútoron álló elemnél `x`, `z` a középpont,
 * `y` az alap magassága (0 = padló), `rot` az elforgatás fokban.
 */
export interface DecorItem {
  id: string;
  type: string;
  roomId: string;
  wall?: WallId;
  a?: number;
  x?: number;
  z?: number;
  y: number;
  rot?: number;
  /** Méret felülírása (akusztikus panel szélessége, magassága). */
  w?: number;
  h?: number;
  /** Szín- vagy mintaváltozat (a típus `variants` listájából). */
  variant?: string;
  /** Akusztikus panelnél a katalógustermék (products/furniture.json, acousticPanel). */
  productId?: string;
  /** Aljavaslatból betöltött elem (pl. 'sub:j5-a'): aljavaslat-váltáskor cserélődik; a saját elemeknél hiányzik. */
  origin?: string;
}

export interface Radiator {
  id: string;
  label: string;
  wall: WallId;
  offset: Val;
  width: Val;
  height: Val;
  bottom: Val;
  gap: Val;
  depth: Val;
}

/** Csőszakasz a fal síkjában: 'h' = vízszintes (from–to a fal mentén), 'v' = függőleges (y0–y1). */
export interface PipeRun {
  id: string;
  label: string;
  s: Status;
  note?: string;
  wall: WallId;
  kind: 'h' | 'v';
  from?: number;
  to?: number;
  y?: number;
  at?: number;
  y0?: number;
  y1?: number;
  /** A cső tengelyének távolsága a fal síkjától (mm). */
  z: number;
  d: number;
}

export interface Wardrobe {
  id: string;
  label: string;
  wall: WallId;
  from: Val;
  to: Val;
  depth: Val;
  height: Val;
  doors: number;
  keep: boolean;
  note?: string;
}

export interface Bed {
  id: string;
  label: string;
  keep: boolean;
  x0: Val;
  z0: Val;
  /** Méret x irányban (fejvégtől lábvégig). */
  sx: Val;
  /** Méret z irányban (szélesség). */
  sz: Val;
  h: Val;
  mattressH: Val;
  headH: Val;
  frameColor: string;
  note?: string;
}

export interface CeilingLight {
  id: string;
  label: string;
  x: Val;
  z: Val;
}

export interface AccentLight {
  id: string;
  label: string;
  kind: 'table' | 'floor';
  x: number;
  z: number;
  s: Status;
  note?: string;
}

export interface CameraPreset {
  name: string;
  pos: [number, number, number];
  target: [number, number, number];
}

export interface Room {
  id: string;
  name: string;
  source: string;
  size: { x: Val; z: Val; h: Val };
  north: { wall: WallId; s: Status; note: string };
  walls: Record<WallId, WallDef>;
  openings: Opening[];
  radiators: Radiator[];
  pipes: PipeRun[];
  units?: WallUnit[];
  /** Eltérő padló lehetősége (pl. járólap az előszobában); csak akkor látszik, ha a változatban floorAll = false. */
  floor?: { pattern: FloorPattern; tone: string; plank?: { l: number; w: number }; note: string };
  wardrobe?: Wardrobe;
  beds: Bed[];
  furniture?: FurnitureItem[];
  ceilingLights: CeilingLight[];
  accentLights: AccentLight[];
  cameras: CameraPreset[];
  conflicts: string[];
  missing: string[];
}

// ---------------------------------------------------------------------------
// Tervezési változat (színpaletta és felületek) – lakásszintű, falankénti felülírással

export type FloorPattern = 'plank' | 'herringbone' | 'tile';
export type WardrobeFront = 'mirror' | 'white' | 'wood' | 'mirrorWood';

// ---------------------------------------------------------------------------
// Termékkatalógus (valós, Magyarországon beszerezhető termékek)

/**
 * A modellszín eredete: official = gyártói hex/RGB; swatch-image = gyártói színmintaképből mintavételezve;
 * third-party = színadatbázisból; photo-sample = termékfotóból mintavételezve (fényviszonyfüggő);
 * color-name = a termék színnevéből becsülve (pl. fekete lámpatest, ahol a fotó mintavételezése megbízhatatlan).
 */
export type ColorSource = 'official' | 'swatch-image' | 'third-party' | 'photo-sample' | 'color-name';

export type PaintFamily = 'warmWhite' | 'greige' | 'sand' | 'ochre' | 'terracotta' | 'brown' | 'green' | 'blueGrey' | 'deep';

export interface PaintProduct {
  id: string;
  brand: string;
  line: string;
  name: string;
  code: string;
  hex: string;
  hexSource: ColorSource;
  family: PaintFamily;
  /** Gyártói színoldal. */
  url: string;
  /** Webáruházi termékoldal, ha van. */
  shopUrl?: string;
  price?: string;
  finishes?: string;
  note?: string;
}

export interface FloorProduct {
  id: string;
  store: string;
  manufacturer: string;
  name: string;
  decor?: string;
  type: string;
  /** Lapméret mm-ben: hossz × szélesség × vastagság; hiányzik, ha a forrás nem adja meg. */
  size?: { l: number; w: number; t?: number };
  wear?: string;
  bevel?: string;
  pattern: 'plank' | 'herringbone';
  tone: 'light' | 'natural' | 'honey' | 'grey' | 'dark';
  hex: string;
  hexSource: ColorSource;
  price?: string;
  url: string;
  /** A Wayback Machine mentése, ha az adat onnan való; ekkor a checkedAt a mentés dátuma. */
  archiveUrl?: string;
  checkedAt: string;
  note?: string;
}

export type DoorStyle = 'flat' | 'groove' | 'glass';
export type HandleFinish = 'steel' | 'black' | 'brass';

export interface DoorProduct {
  id: string;
  store: string;
  manufacturer: string;
  line: string;
  name: string;
  decor?: string;
  style: DoorStyle;
  surface?: string;
  tone: 'white' | 'offwhite' | 'light' | 'natural' | 'warm' | 'dark' | 'grey' | 'black';
  hex: string;
  hexSource: ColorSource;
  price?: string;
  url: string;
  /** A Wayback Machine mentése, ha az adat onnan való; ekkor a checkedAt a mentés dátuma. */
  archiveUrl?: string;
  checkedAt: string;
  note?: string;
}

export interface CurtainProduct {
  id: string;
  store: string;
  name: string;
  colorName: string;
  article?: string;
  type: 'blackout' | 'dimout' | 'sheer';
  material?: string;
  /** Lapméret cm-ben (szélesség × hossz). */
  size?: { w: number; l: number };
  pack?: string;
  hex: string;
  hexSource: ColorSource;
  price?: string;
  url: string;
  checkedAt: string;
  note?: string;
}

// ---------------------------------------------------------------------------
// Világítás: lámpatermékek és világítási tervek

/** Mennyezeti csoport: függeszték, mennyezeti lámpa, sín; kiegészítő csoport: álló, fali, asztali. */
export type FixtureType = 'pendant' | 'ceiling' | 'track' | 'floor' | 'wall' | 'table';

export interface LampProduct {
  id: string;
  store: string;
  brand?: string;
  name: string;
  article?: string;
  type: FixtureType;
  /** Egyszerűsített forma a megjelenítéshez. */
  shape: 'dome' | 'drum' | 'globe' | 'cone' | 'disc' | 'rail' | 'bar' | 'spot' | 'arc' | 'uplight' | 'other';
  /** Test / bura színe. */
  color: string;
  colorName?: string;
  /** Méretek mm-ben: d = bura- vagy korongátmérő, h = magasság, l = sín hossza, drop = max. függesztési hossz, proj = falitól mért kinyúlás. */
  size: { d?: number; h?: number; l?: number; drop?: number; proj?: number };
  /** Spotok száma (sín). */
  heads?: number;
  beamDeg?: number;
  /** Beépített LED fényárama (összesen). */
  lm?: number;
  K?: number;
  socket?: { type: 'E27' | 'E14' | 'GU10' | 'G9'; count: number };
  bulbIncluded?: boolean;
  /** Fénykibocsátás: lefelé (fedett bura), szórt (áttetsző bura), felfelé, irányított. */
  emit: 'down' | 'diffuse' | 'up' | 'spot';
  hexSource: ColorSource;
  price?: string;
  url: string;
  checkedAt: string;
  note?: string;
}

/** Egy lámpa a világítási tervben, a helyiség saját rendszerében (mm). */
export interface Fixture {
  id: string;
  type: FixtureType;
  productId?: string;
  x: number;
  z: number;
  /** Függeszték: a bura alsó éle; fali lámpa: a lámpafej magassága (mm). */
  y?: number;
  /** Sín iránya: 0 = x mentén, 90 = z mentén. */
  rot?: number;
  label?: string;
}

export interface LightPlan {
  id: string;
  name: string;
  note?: string;
  /** Helyiségenként a lámpák; ha egy helyiség hiányzik, a felmért helyőrzők jelennek meg. */
  rooms: Record<string, Fixture[]>;
}

/** A változatban használt termék egy felülethez: kulcs pl. 'wall', 'ceiling', 'floor', 'door', 'curtain', 'sheer', 'accent:nappali.x1'. */
export type ProductSlots = Record<string, string>;

export interface Variant {
  id: string;
  name: string;
  wall: string;
  wallFinish: 'matt' | 'selyem';
  /** Kiemelt falak: kulcs = `${roomId}.${wallId}` */
  accents: Record<string, string>;
  /** Fa falpanellel burkolt kiemelt falak (kulcsok az `accents`-ből); a szín a dekor átlagszíne. */
  accentWood?: string[];
  ceiling: string;
  /** `plank`: lapméret mm-ben (katalógustermékből); hiányában 1285 × 193 mm (hajópadló) ill. 600 × 100 mm (halszálka). */
  floor: { pattern: FloorPattern; tone: string; dir: 'x' | 'z'; plank?: { l: number; w: number } };
  /** A változat padlója az eltérő padlólehetőséggel rendelkező helyiségekben (előszoba, közlekedő) is; hiányában igen. */
  floorAll?: boolean;
  /** Felületenként kiválasztott katalógustermék (id). Ha a szín kézzel módosul, a hozzárendelés törlődik. */
  products?: ProductSlots;
  /** Rövid indoklás (javaslatoknál). */
  note?: string;
  /** A javaslathoz illesztett világítási terv (data/lightPlans.ts). */
  lightPlanId?: string;
  /** Visszajelzések név szerint (kedvenc, megjegyzés) – a konfigurációs fájllal gyűjthetők. */
  feedback?: Record<string, { fav?: boolean; note?: string; at?: string }>;
  door: string;
  /** Ajtólap kialakítása; hiányában sima. */
  doorStyle?: DoorStyle;
  /** Kilincs felülete; hiányában inox. */
  handle?: HandleFinish;
  skirting: { h: number; mode: 'wall' | 'door' | 'white' };
  curtain: {
    on: boolean;
    color: string;
    sheer: boolean;
    /** window = ablak + 25 cm; wall = falszéles; clear = falszéles, de a radiátor és a falra szerelt egység (klíma) előtt megáll. */
    span: 'window' | 'wall' | 'clear';
    length: 'floor' | 'sill';
    closed: boolean;
    /** Második, áttetsző réteg színe a vastag függöny mögött (mindig behúzva); hiányában egyrétegű. */
    sheerLayer?: string;
  };
  wardrobeFront: WardrobeFront;
  textile: string;
  doorLeafOptional: boolean;
}

// ---------------------------------------------------------------------------
// Fényjelenet

export interface LampGroup {
  on: boolean;
  lm: number;
  K: number;
  dim: number;
}

export interface LightSettings {
  sky: 'clear' | 'overcast';
  month: number;
  day: number;
  /** Helyi idő órában (pl. 19.75 = 19:45). */
  hour: number;
  ceiling: LampGroup;
  accent: LampGroup;
  /** Expozíció-korrekció fényértékben (EV). */
  ev: number;
}
