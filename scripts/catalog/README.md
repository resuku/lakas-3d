# Katalógusgyűjtés (2026-11-25)

Boltonkénti szkriptek, amelyek a webshopok nyilvános termékoldalairól gyűjtenek a 3D-tervező katalógusába. A kimenet
egy ideiglenes mappába kerül (`/s/catalog/out`), a projekt `src/data/products/*.json` fájljaiba csak a beolvasztás
(`merge.py`) ír, ellenőrzés után.

## Futtatás

A tároló gyökeréből, konténerben (a hoston nincs Python):

```bash
S="<ideiglenes munkamappa, a tárolón kívül>"   # pl. a rendszer TEMP mappájában; a cache és a kimenet ide kerül
MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W):/w" -v "$S:/s" -w /w python:3.12-slim \
  sh -c "pip -q install pillow numpy >/dev/null 2>&1; python -X utf8 scripts/catalog/<szkript>.py"
```

Hosszú futásnál a Bash eszköz `run_in_background` módját használd. A `lib.fetch` gyorsítótáraz (`/s/catalog/cache`),
ezért megszakadt futás újraindítva onnan folytatja, ahol tartott.

## Kötelező szabályok

- Minden letöltés a `lib.fetch`-en (és a `lib.image_hex`-en) át menjen. Ez minden kérés előtt ellenőrzi a robots.txt-t
  a `*`, a `ClaudeBot`, az `anthropic-ai` és a `Claude-Web` ügynökre (`*`/`$` mintákkal), betartja a Crawl-delay-t
  (legalább 1,2 s hostonként), és `RobotsBlocked` kivételt dob, ha bármelyik tiltja. Ilyenkor az URL kimarad; ha a
  forrás egésze tiltott, a forrás kimarad. Saját HTTP-klienst, más User-Agentet, cookie- vagy fejléc-trükköt ne használj.
- Botellenőrzés (Cloudflare, captcha) → `BotCheck`: a forrás kimarad, nem kerüljük meg.
- Kitalált adat nincs. Ami a termékoldalon nem szerepel (méret, ár, szín), az a rekordból kimarad. A méretek mm-ben
  (padló, ajtó, lámpa), függönynél cm-ben – lásd a típusokat (`src/model/types.ts`).
- Ár: `lib.price(szám, bolt, egység)` → „12 990 Ft/m² (Bolt, 2026-11-25)”. Akciós árnál az akciós ár, a lista ár a `note`-ba.
- Szín: `lib.image_hex(képURL, mode)` – `object` fehér hátterű tárgyfotóhoz (bútor, lámpa, ajtó), `swatch` dekorképhez
  (padló, csempe, festékminta; `crop=0.1–0.2`). `hexSource: "photo-sample"` (festéknél a gyártói hexnél `"official"`,
  színminta-képnél `"swatch-image"`). A `colorName` a bolt színneve.
- Az azonosító egyedi és stabil: lásd a rekordformákat lent. Ugyanaz a termék más színben külön rekord, ha külön URL-je
  (vagy színváltozat-paramétere) van.
- Mentés: `lib.save(kind, store, items, note)` → `/s/catalog/out/<kind>-<bolt>.json`. A `note` írja le a forrást, a
  szűrést és a bizonytalanságokat.
- A szkript a `scripts/catalog/<kind>_<forrás>.py` fájlba kerüljön; a `lib.py`-t ne módosítsd (ha hiányzik valami, a saját
  szkriptedben írd meg).

## Rekordformák (a `src/model/types.ts` típusai szerint)

- **paint** (`PaintProduct`): `id` `"<márka>-<kód>"` (pl. `dulux-1144047`, `trilak-<kód>`, `polifarbe-<kód>`), `brand`, `line`,
  `name`, `code`, `hex`, `hexSource`, `family` = `lib.paint_family(hex)`, `url` (gyártói színoldal), opcionális `shopUrl`,
  `price`, `finishes`, `note`.
- **floor** (`FloorProduct`, hajópadló és halszálka): `id` `"<bolt>-<dekorkód vagy slug>"`, `store`, `manufacturer`, `name`,
  `decor`, `type` (pl. „laminált”, „vízálló laminált”, „SPC”, „vinyl”, „szalagparketta”), `pattern` `plank`|`herringbone`,
  `tone` = `lib.wood_tone(hex)`, `hex`, `hexSource`, `price` (Ft/m²), `url`, `checkedAt`, `size` `{l, w, t}` mm, `wear`
  (pl. „AC4/32”), `bevel`, `note` (vízállóság, alátét, garancia).
- **tile** (`FloorProduct`, `pattern: "tile"`): mint a floor; `type` pl. „porcelán gres járólap”; `size` `{l, w, t}` mm
  (a hosszabb oldal az `l`); `wear` (R-érték, PEI, ha van). Csak padlóra alkalmas lap, 30–120 cm-es oldal.
- **door** (`DoorProduct`): `id` `"door-<bolt>-<slug>"`, `store`, `manufacturer`, `line`, `name`, `decor`, `style`
  `flat`|`groove`|`glass`, `surface` (CPL, dekorfólia, festett…), `tone` = `lib.door_tone(hex)`, `hex`, `hexSource`, `price`
  („… Ft – ajtólap + tok”, mi van benne), `url`, `checkedAt`, `note` (méretrend, tok).
- **lamp** (`LampProduct`): `id` `"lamp-<bolt>-<slug>"`, `store`, `brand`, `name`, `article`, `type`
  `pendant`|`ceiling`|`track`|`floor`|`wall`|`table`, `shape` `dome`|`drum`|`globe`|`cone`|`disc`|`rail`|`bar`|`spot`|`arc`|`uplight`|`other`,
  `color` (hex, test/bura), `colorName`, `size` `{d, h, l, drop, proj}` mm, `heads`, `beamDeg`, `lm`, `K`, `socket`
  `{type: E27|E14|GU10|G9, count}`, `bulbIncluded`, `emit` `down`|`diffuse`|`up`|`spot`, `hexSource`, `price`, `url`,
  `checkedAt`, `note`. Csak beltéri, lakásba való lámpa (nem kültéri, nem gyerek-, nem fürdőszobai, nem LED-szalag).
- **curtain** (`CurtainProduct`): `id` `"curtain-<bolt>-<slug>"`, `store`, `name`, `colorName`, `article`, `type`
  `blackout`|`dimout`|`sheer`, `material`, `size` `{w, l}` **cm**, `pack` (pl. „1 pár”), `hex`, `hexSource`, `price`, `url`,
  `checkedAt`, `note`.
- **panel** (fa / lamellás falpanel, a `PaintProduct` formájában): `id` `"panel-<bolt>-<slug>"`, `brand` (bolt/gyártó),
  `line`, `name`, `code`, `hex`, `hexSource`, `family` = `lib.paint_family(hex)`, `url`, `price`, `note` (méret).
- **furniture** (`FurnitureProduct`): `id` `"furn-<bolt>-<slug>"`, `category`, `store`, `brand`, `name`, `article`, `size`
  (mm: `w`, `d`, `h`, és ami van: `seatH`, `sleepW`, `sleepL`, `ext`, `chaiseW`, `chaiseD`, `pile`, `headH`, `legL`, `legD`),
  `shape` (`round`|`rect`|`oval` asztalnál), `sleeper`, `storage`, `lType`, `colorName`, `material`, `hex`, `hexSource`,
  `price`, `url`, `imageUrl`, `checkedAt`, `note`. A `form` (dobozbútor-forma) kézi – ne töltsd ki.

## Bútorkategóriák és méretszűrés (mm)

Ami a kereten kívül esik, kimarad (a hiányzó méret nem kizáró, de a szélesség kötelező). Harsány szín (`lib.loud(hex)`) kimarad.

| category | jelentés | szűrés |
|---|---|---|
| sofa | egyenes kanapé (ágyazható is) | w 1700–2500, d ≤ 1100 |
| sofaChaise | L / sarokkanapé | w 1800–3000, a rövid ág ≤ 2000 |
| ottoman | puff, lábtartó | w 400–1100, h 300–500 |
| tvUnit | TV-szekrény | w 1200–2400, d 300–500, h ≤ 700 |
| tvWall | TV-fal, szekrénysor | w 1500–2800 |
| nightstand | éjjeliszekrény | w 300–650, h 350–700 |
| diningTable | étkezőasztal | zárt hossz / ø ≤ 1800 |
| chair | étkezőszék | w ≤ 600 |
| rugLiving, rugBedroom | szőnyeg | 230–300 × 160–200 cm |
| divider | térelválasztó | w 800–2000 |
| bed | ágy 180×200 vagy 200×200 matrachoz | külső hossz ≤ 2300 |
| deskCorner | L alakú íróasztal | hosszú ág 1400–2200 |
| acousticPanel | akusztikus falpanel | – |
| coffeeTable (új) | dohányzóasztal | w 500–1300, h 300–550 |
| sideboard (új) | tálaló, komód | w 800–1800, d 300–500, h 600–1000 |
| shelf (új) | könyvespolc, nyitott polc | w 400–1200, d 200–400, h 800–2200 |
| armchair (új) | fotel | w 600–950 |
| shoeCabinet (új) | cipősszekrény | w 500–1200, d 170–400 |
