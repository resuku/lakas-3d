# Lakás 3D – berendezés- és színtervező

Helyben futó webes 3D nézet a lakásfelújításhoz. Az üres helyiségeket a felmérésből
(V14 tervezési napló) építi fel, és ezekben lehet falszínt, padlót, ajtót, szegélyt,
függönyt, gardróbfrontot és textilt próbálni, többféle fényjelenetben.

A projekt forrásadatai a `../Felujítás` mappában vannak; ez a program csak olvassa őket.

## Futtatás

```bash
docker compose up -d
docker compose exec dev npm install          # első alkalommal
docker compose exec -d dev npm run dev -- --host 0.0.0.0
```

Böngészőben: <http://localhost:5173>

Ha a változások nem jelennek meg, indítsd újra a konténert:
`docker compose down && docker compose up -d`, majd a fenti `npm run dev`.

Git Bash alatt a konténeren belüli abszolút útvonalakhoz (`/data`) `MSYS_NO_PATHCONV=1` kell.

## Adatellenőrzés

```bash
docker compose exec dev npm run check-data
```

Ez a legfrissebb live tervezési naplót keresi meg (`Felujítás/Doc`, az `old` mappa nélkül).
Minden helyiségadatnál ellenőrzi, hogy a hivatkozott sorban szerepel-e a modellben használt
szám, és státuszonként összesíti az adatokat. Ha a napló új verziója jelenik meg (V14…),
erre külön figyelmeztet.

## Szkennelés beolvasása (OpenPlan3D / RoomPlan)

Az OpenPlan3D „Editable plan JSON” exportja (a teljes adatcsomagban `room.json` néven)
az Apple RoomPlan nyers geometriáját tartalmazza.

```bash
docker compose exec dev sh -c 'node scripts/import-scan.mjs "/data/Képek/Scan/openplan-….json" nappali-kozlekedo'
```

A kimenet a `src/data/scans/<név>.json`: falszakaszok, nyílások és tárgyak mm-ben, a falakhoz
igazított síkrajzon. Ha létezik `src/data/scans/<név>.controls.json`, a szkript tételesen
összeveti a szkennelést a lézeres mérésekkel.

Az első szkennelés (nappali, előszoba, közlekedő; 2026-11-01) tapasztalatai:

- A fal menti pozíciók pontosak: a nyílások kezdete 2–25 mm-re egyezik a lézerrel,
  a belmagasság 2 mm-re.
- A mindkét oldalról szkennelt falak síkja a fal belsejébe esik. A szabad méreteket ezért
  a lézeres mérés adja, a falvastagság a kettő különbségéből levezethető.
- A nyílásszélességek ±65 mm-rel szórnak, ezekre a lézeres érték az irányadó.
- Az erkélyablakot a RoomPlan nem ismerte fel, a radiátort és a klímát nem is keresi.

## Termékkatalógus (festék, padló, ajtó, függöny)

A `src/data/products/` mappában valós, Magyarországon kapható termékek vannak; ellenőrzés: 2026-11-01.

- `paints.json`: 63 falfestékszín (Dulux, Poli-Farbe Platinum, PPG Trilak Héra), színcsaládok szerint.
- `floors.json`: 26 padló (DIEGO, Parkettadiszkont, Praktiker, OBI, Parkettawebáruház), halszálkák is.
- `doors.json`: 22 beltéri ajtó (Ajtógyár Pascal Optima dekorok, OBI, Praktiker, Porta, AjtóMester), sima, marással díszített és üvegbetétes.
- `curtains.json`: 28 függöny (IKEA, JYSK, Bonami és kisebb hazai webshopok): sötétítő, fényszűrő és áttetsző.
- `panels.json`: fa falpanel kiemelt falra (a lakberendezői tervben szereplő Okapi dió).
- `lamps.json`: 49 lámpa (IKEA, Bonami, Praktiker, OBI, JYSK, Watt Webshop): függeszték, mennyezeti lámpa, sín / spotsor, álló-, fali és asztali lámpa, köztük a konszignáció Manie állólámpája. Izzó nélküli lámpánál a modell meleg LED izzóval számol (E27 806 lm, E14 470 lm, GU10 345 lm, G9 kb. 280 lm).

A modellszín eredete minden terméknél jelölve van:

| Jelölés | Jelentés |
|---|---|
| gyártói színkód | a gyártó saját képernyőszíne (Dulux: dulux.hu, Trilak: trilak.ppg.com) |
| gyártói színmintából | a gyártó színmintaképéből mintavételezve (Poli-Farbe) |
| termékfotóból | a termékfotó átlagszíne, háttér nélkül; fényviszonyfüggő közelítés |

Az Anyagok fülön a „Katalógus” részből lehet választani. A padlónál a lapméret, az ajtónál
a kialakítás (sima, marással, üvegbetétes) is átkerül a modellbe. A függöny kétrétegű is lehet:
áttetsző réteg a fal felőli sínen, előtte a vastag függöny. A változatban használt termékek az alsó panel Termékek fülén látszanak, árral és
linkkel. Ha egy felület színét kézzel módosítod, a termék-hozzárendelés törlődik.

A J-kezdetű változatok (16 db; a halszálkás J3 és J12 törölve, a számozás marad) javaslatok ezekből a termékekből („kész”, berendezetlen állapot: fal,
mennyezet, padló, ajtó, függöny); nem jóváhagyott döntések. Áttekintő galéria:

```bash
scripts/shot.sh '<lépések>'   # a képek: screenshots/<változat-id>_<nézet>.png, a mentés: {"dump":"variants.json"}
MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W):/w" -w /w python:3.12-slim \
  sh -c "pip -q install pillow && python scripts/gallery.py"
```

Az eredmény: `screenshots/javaslatok.html` (böngészőben megnyitható). A bútor-színvilág a
`{"dumpEval":["furniture_fit.json","…window.__lakas.furnitureFit…"]}` lépéssel kerül a galériába
(csak fejlesztői szerveren érhető el).

## Adatmodell

A helyiségek leírása a `src/data/rooms/*.json` fájlokban van, kézzel karbantartva.
Minden méret a következő formában szerepel:

```json
{ "v": 1253, "s": "M", "note": "…", "src": [{ "sheet": "10 Háló", "key": "M-006", "n": 1253 }] }
```

| Státusz | Jelentés |
|---|---|
| M | közvetlenül mért |
| D | mért adatokból levezetett (a megjegyzés megmondja, miből) |
| S | szkennelt (LiDAR), még nincs használatban |
| P | fényképről azonosított |
| A | közelítő feltételezés, például fotóbecslés |
| U | ismeretlen |

Koordináták: minden helyiségnek saját x/z tengelye van. Ennek leírása a JSON `source`
mezőjében és az Adatok fülön olvasható. A falon mért pozíció mindig a kisebb koordinátájú
saroktól értendő.

A `src/data/variants.ts` (J-javaslatok) és a `src/data/lightPlans.ts` (világítási tervek) generált fájl.
A forrásuk a `scripts/gen/gen_variants.py` és a `scripts/gen/gen_lightplans.py`; a futtatás módja a
szkriptek fejlécében olvasható.

## Funkciók

- Helyiségek: háló, dolgozó, nappali, előszoba és közlekedő. Az előszoba és a közlekedő alapból a lakás padlóját kapja (új burkolat lesz); járólap kapcsolóval mutatható. A nappali a bontás utáni állapotot mutatja (tükrös szekrény és gipszkarton nélkül), a szkennelés, a lézeres napló és a 2026-11-01-i kiegészítő mérések alapján. Az előszoba és a közlekedő két téglalap, köztük teljes magasságú átjáró; a nyílások helye a szkennelésből (S), a méretek a 40-es lapról. Saját (meglévő járólap) padlójuk van; a változat padlója kapcsolóval ide is kiterjeszthető.
- Teljes lakás nézet: mind az öt helyiség a helyén (`src/data/layout.ts`, a szkennelés közös rendszerében, a háló és a dolgozó az ajtóik alapján illesztve). A kiválasztott helyiség a szerkesztett, a kameragombjai oda visznek. A nem modellezett helyiségek (konyha, fürdő, WC, tároló) ajtaja mögött szürke helyőrző áll.
- Bejárás: szemmagasságú séta W A S D / nyilakkal, egérhúzással körbenézve (Shift: gyorsabban, Esc: kilépés). A falakon belül marad; teljes lakás nézetben az ajtókon és átjárókon át a szomszéd helyiségbe is át lehet menni.
- Oldalsáv fülekkel (a fejléc görgetéskor is látszik): Nézet, Javaslat, Anyagok (összecsukható alcsoportok: falak és
  mennyezet, padló, ajtók és szegély, függöny, bútor), Világítás, Továbbiak. A választott fül a böngészőben megmarad.
- Alaphelyzet (Továbbiak fül): minden beállítás és változat vissza a kezdetire, megerősítéssel.
- Nyitott lehetőségek (`src/data/choices.ts`): még eldöntetlen műszaki megoldások a színváltozattól
  függetlenül kapcsolva – a háló klímájának három jelölt helye (A ágyfal, B radiátor fölött, C ajtófal)
  és a tároló takarása (nyitott, függöny, falon futó tolólap). Az ellenőrzések jelzik a klíma ütközését
  a függönnyel és a fűtéscsővel; a függöny „radiátorig” szélessége a radiátor és a klíma előtt megáll.
- Bútorok színvilága (`src/lib/furnitureFit.ts`): a változat fal-, kiemelés-, padló- és ajtószíneiből
  (OKLab) heurisztikusan pontozza a jellemző kanapé-, bútortest- és fémszíneket (jól megy / elmegy /
  kerülendő, indoklással), és becsli a beszerezhetőséget. Minden színváltoztatásra újraszámol.
- A J-javaslatokhoz illesztett világítási tervek (LJ1–LJ18); a javaslat választásakor a hozzá illő
  világítás bekapcsol (kikapcsolható).
- Egyszerű és részletes nézet (fejléc): az egyszerű a családnak szól – a rétegek, az ellenőrzések, a források és a lámpaszerkesztés rejtve.
  Első megnyitáskor rövid súgó (újra: Súgó gomb); telefonon figyelmeztetés és könnyített megjelenítés.
- Könnyített megjelenítés (Nézet): árnyéktérképek nélkül, 1-es pixelaránnyal, gyengébb gépekre.
- Vélemények: név, kedvenc (★) és megjegyzés változatonként; a konfigurációs fájllal visszaküldhetők, és a
  „Visszajelzések átvétele fájlból…” gombbal egyesíthetők (a saját beállítások maradnak, az ott létrehozott új változatok bekerülnek).
- Konfiguráció mentése / betöltése (oldalsáv alja): a teljes beállítás JSON-fájlban (`app`, `version`, `savedAt`, `state`);
  régebbi fájlt a tárolt állapottal azonos migráció hoz a mostani formára. A néző-szintű beállítások (név, nézetmód,
  könnyített megjelenítés, súgó) nem kerülnek a fájlba.
- Bevásárlólista (Termékek fül, CSV, Excelhez pontosvesszővel): az aktív változat és világítási terv termékei becsült
  mennyiséggel és összeggel (`src/lib/shopping.ts`: padló +10 %, festék 2 réteg / 12 m²/l, függöny kétszeres ráncolás, izzók foglalat szerint).
- Gyorsinfó: Alt nyomva tartva (vagy I-vel rögzítve) az egér alatti elem – fal, padló, mennyezet, ajtó,
  ablak, függöny, radiátor, klíma, cső, lámpa, bútor – leírása buborékban (termék, kód, szín, ár).
- Világítási terv (lakásszintű, a színváltozattól független; `src/data/lightPlans.ts`): helyiségenként lámpák
  típussal (függeszték, mennyezeti, sín spotokkal, álló, fali, asztali), katalógustermékkel, pozícióval,
  függesztési magassággal és síniránnyal. A lámpák egyszerű, jelzésszerű formák, és valós fényforrásként
  világítanak (a fényáram és a színhőmérséklet a termékből). A panel becsli a helyiség átlagos
  megvilágítását és irányértékkel veti össze. A 3D nézetben a lámpára kattintva az adott lámpa ki- és
  bekapcsol; a fényjelenet „mennyezeti” és „kiegészítő” kapcsolója főkapcsolóként működik.
  Kiinduló tervek: V0 felmért helyek (termék nélkül), V1 tervezői koncepció, V2 LED mennyezeti lámpák,
  V3 natúr anyagú függesztékek, V4 sínes.
- Változatok (paletták): lakásszintű falszín, helyiségenként egy kiemelt fal, mennyezet,
  fa falpanel a kiemelt falon, padló (hajópadló, halszálka vagy 60×60-as lap; tónus és irány),
  ajtók (szín, kialakítás, kilincs), szegély, függöny (anyag, szélesség, hossz, nyitva vagy
  behúzva, áttetsző második réteg), gardróbfront, textil.
  Másolni, átnevezni és exportálni/importálni (JSON) is lehet őket.
- A/B összehasonlítás: két változat egymás mellett, szinkronizált kamerával.
- Fényjelenetek: dátum, időpont és égbolt (napállás Budapestre, valós tájolással),
  mennyezeti és kiegészítő lámpák lumennel, színhőmérséklettel és fényerővel,
  expozíció-korrekció. A jelenetek egymáshoz viszonyítva összevethetők, az abszolút
  fényerő nem hiteles.
- Rétegek: adatbiztonság-színezés, funkcionális zónák (ajtónyitás, erkélyajtó megközelítése, klíma légárama, a radiátor előtti
  szabad zóna), méretcímkék, nyitott ajtók.
- Ellenőrzések: függöny és radiátor ütközése (a sarokban is), közlekedősáv szélessége, ellentmondások
  és hiányzó adatok a JSON-ból.
- Képernyőkép mentése (összehasonlító nézetben a két kép egymás mellé kerül).

A színek képernyős közelítések, nem gyártói kódok. Végső döntés előtt fizikai színminta kell.

## Képernyőképek automatikusan

```bash
scripts/shot.sh '[{"shot":"start"},{"click":"Dolgozó"},{"shot":"dolgozo"}]'
```

Fej nélküli Chromium fut Playwright-konténerben, a képek a `screenshots/` mappába kerülnek.
A lépések: `click` (gombfelirat), `toggle` (jelölőnégyzet felirata), `select` (`[sorszám, felirat]` vagy `["auto", felirat]`), `wait` (ms),
`shot` (fájlnév), `eval` (kifejezés kiértékelése a böngészőben), `dump` (a mentett állapot
kiírása fájlba), `hold` (billentyű nyomva tartása, pl. `["w",1500]`), `drag` (egérhúzás a 3D
nézetben, pl. `[200,0]`) `clickAt` (kattintás oldalkoordinátán, pl. `[969,107]`) `mouse` (egér mozgatása, pl. `[900,400]`), `download` (`[gombfelirat, fájlnév]`), `upload` (`[fájlmező-szelektor, fájlnév]`), `fill` (`[helykitöltő szöveg, érték]`) és `dumpEval` (`[fájlnév, kifejezés]`). Ha az első lépés `{"helpShot":"név"}`, a nyitó súgóról is kép készül; a súgót a szkript utána bezárja.

## Kirakás (GitHub Pages)

A `main` ágra történő feltöltés után a `.github/workflows/pages.yml` lefordítja (`npm ci`, `npm run build`)
és kirakja a programot: <https://resuku.github.io/lakas-3d/>. A Vite relatív útvonalakkal fordít (`base: './'`),
az oldal `noindex` jelzést kap. A galéria a kirakott oldal része (`public/galeria/`):

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W):/w" -w /w python:3.12-slim   sh -c "pip -q install pillow && python scripts/gallery.py --public"
```

Levétel: a tároló Settings → Pages oldalán a kirakás kikapcsolása (vagy `gh api -X DELETE repos/resuku/lakas-3d/pages`).
A tároló commitjai a GitHub noreply címével készülnek (tárolószintű `git config`).

## Következő lépések

1. Beépített LED-sávok (médiafal, polcok, mennyezeti koszorú) a bútorokkal együtt; a kiválasztott festékek, padló- és ajtódekorok fizikai mintáinak fotója szürkekártyával.
2. A közlekedő hosszának közvetlen mérése; a WC- és fürdőajtó nyitásiránya; falvastagságok (lásd a helyiségek „missing” listáját).
3. Bútor-specifikációk (típus, maximális befoglaló méret, szín), paraméteres bútormodellekkel.
4. Bútorkatalógus a beszerzési forrásokból, specifikáció szerinti szűréssel.
5. Dekorelemek: szőnyeg, növény, térelválasztó.
