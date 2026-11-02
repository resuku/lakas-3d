import type { LightPlan } from '../model/types';

// Kiinduló világítási tervek – javaslatok, nem döntések. Koordináták a helyiség saját rendszerében (mm).
// A V0 a felmért kiállások és helyőrzők helyén, termék nélkül mutatja a lámpákat; a V1–V4 valós termékekkel
// (src/data/products/lamps.json), a felmért mennyezeti kiállásokra építve.
export const DEFAULT_LIGHT_PLANS: LightPlan[] = [
  {
    id: 'v0-felmert',
    name: 'V0 – Felmért helyek (általános lámpák)',
    note: 'A felmért mennyezeti kiállások és a helyőrző álló- és asztali lámpák, termék nélkül. A fényáram a fényjelenet beállításából jön.',
    rooms: {},
  },
  {
    id: 'v1-tervezoi',
    name: 'V1 – Tervezői koncepció (fekete részletek, sín)',
    note: 'A lakberendezői műleírás szerint: 2700–3000 K mindenhol; nappali: fekete függeszték az étkezőasztal fölött, fekete sín spotokkal a nappali részen, a konszignáció Manie állólámpája; háló: rattan függeszték és két fekete olvasó falikar; dolgozó: általános LED fény és állítható olvasó állólámpa munkafénynek; előszoba és közlekedő: spotsor.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-ranarp-fuggolampa-fekete-38-cm', x: 1720, z: 1700, y: 1600, label: 'Étkező függeszték' },
        { id: 'sin', type: 'track', productId: 'lamp-praktike-eglo-easyt-szpot-szett-gu10-4x10w', x: 1720, z: 5400, rot: 90, label: 'Nappali sín' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-fekete-allolampa-manie-kave-home', x: 300, z: 3800, label: 'Olvasó állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'pendant', productId: 'lamp-ikea-narrkolv-fuggolampa-rattan-56-cm', x: 1832, z: 1721, y: 2080, label: 'Általános függeszték' },
        { id: 'ol1', type: 'wall', productId: 'lamp-bonami-fekete-fem-fali-lampa-manie-kave-h', x: 120, z: 470, y: 1150, label: 'Olvasólámpa (ajtó felől)' },
        { id: 'ol2', type: 'wall', productId: 'lamp-bonami-fekete-fem-fali-lampa-manie-kave-h', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa (ablak felől)' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nymane-led-es-mennyezeti-lampa-ant', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'floor', productId: 'lamp-ikea-kloving-allolampa-antracit', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'track', productId: 'lamp-ikea-nymane-mennyezeti-spot-4-antracit', x: 1400, z: 698, rot: 0, label: 'Spotsor' },
      ],
      kozlekedo: [
        { id: 'fo', type: 'track', productId: 'lamp-ikea-skurup-mennyezeti-sin-3-spot-feket', x: 420, z: 1700, rot: 90, label: 'Sín' },
      ],
    },
  },
  {
    id: 'v2-egyszeru',
    name: 'V2 – Egyszerű: LED mennyezeti lámpák',
    note: 'Minden kiálláson lapos, beépített LED-es mennyezeti lámpa (2700–3000 K), a nappaliban szövetburás állólámpa, a hálóban két éjjeli lámpa. Olcsó, könnyen karbantartható, egyenletes fény; kevésbé hangulatos.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'ceiling', productId: 'lamp-ikea-nymane-led-es-mennyezeti-lampa-ant', x: 1720, z: 1700, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nymane-led-es-mennyezeti-lampa-ant', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-kinnahult-allolampa-koris-feher-15', x: 300, z: 3800, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-kabomba-led-es-mennyezeti-lampa-ma', x: 1832, z: 1721, label: 'Általános fény' },
        { id: 'ej1', type: 'table', productId: 'lamp-bonami-fekete-natur-szinu-asztali-lampa-j', x: 220, z: 440, label: 'Éjjeli lámpa' },
        { id: 'ej2', type: 'table', productId: 'lamp-bonami-fekete-natur-szinu-asztali-lampa-j', x: 220, z: 3020, label: 'Éjjeli lámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-praktike-rabalux-gonzalo-led-mennyezeti-lam', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-ikea-tertial-asztali-lampa-sotetszurke', x: 2180, z: 2850, label: 'Munkafény (asztali)' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-praktike-rabalux-leana2-led-mennyezeti-lamp', x: 1400, z: 698, label: 'Mennyezeti lámpa' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-ikea-barlast-led-mennyezeti-falilampa-f', x: 420, z: 900, label: 'Mennyezeti lámpa' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-ikea-barlast-led-mennyezeti-falilampa-f', x: 420, z: 2490, label: 'Mennyezeti lámpa' },
      ],
    },
  },
  {
    id: 'v3-natur',
    name: 'V3 – Hangulatos, natúr anyagok (függesztett)',
    note: 'Szórt fényű, természetes anyagú burák: bambusz függeszték az étkező fölött, szövetgömb a nappali rész fölött (alsó éle 2,05 m), fa lábú szövetburás állólámpa; a hálóban sás mennyezeti lámpa és szövetburás falikarok; a dolgozóban nyír mennyezeti lámpa és asztali lámpa. Meleg, puha fény; a szórt burák a mennyezetet is megvilágítják.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-sinnerlig-fuggolampa-bambusz-kezze', x: 1720, z: 1700, y: 1550, label: 'Étkező függeszték' },
        { id: 'fo', type: 'pendant', productId: 'lamp-bonami-mellow-feher-fuggolampa-textil-bur', x: 1720, z: 5400, y: 2050, label: 'Nappali függeszték' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-sotetszurke-natur-szinu-allolampa', x: 300, z: 3800, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-trubbrufse-mennyezeti-lampa-sas-45', x: 1832, z: 1721, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-bonami-fekete-bezs-konnektorhoz-csatlakoz', x: 120, z: 470, y: 1200, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-bonami-fekete-bezs-konnektorhoz-csatlakoz', x: 120, z: 3010, y: 1200, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nosund-mennyezeti-lampa-nyir-44-cm', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-ikea-tvarhand-asztali-lampa-fekete-bamb', x: 2180, z: 2850, label: 'Asztali lámpa' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-allan-bezs-textil-mennyezeti-lampa', x: 1400, z: 698, label: 'Mennyezeti lámpa' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-praktike-rabalux-leana2-led-mennyezeti-lamp', x: 420, z: 900, label: 'Mennyezeti lámpa' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-praktike-rabalux-leana2-led-mennyezeti-lamp', x: 420, z: 2490, label: 'Mennyezeti lámpa' },
      ],
    },
  },
  {
    id: 'v4-sines',
    name: 'V4 – Sínes, modern',
    note: 'Irányítható spotok: a nappaliban két sín (a nappali részen 4 spot, az átmenetnél 3 spot) és fekete kúpos függeszték az étkező fölött; a hálóban fekete–tölgy spotsor és két fali olvasólámpa; a közlekedőben a teljes hosszon 192 cm-es sín. A spotok a falakat és a képeket emelik ki; egyenletes alapfényhez kevésbé alkalmas.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-skurup-fuggolampa-fekete-38-cm', x: 1720, z: 1700, y: 1600, label: 'Étkező függeszték' },
        { id: 'sin1', type: 'track', productId: 'lamp-bonami-etna-fekete-spotlampa-8x80-cm', x: 1720, z: 5400, rot: 90, label: 'Sín – nappali rész' },
        { id: 'sin2', type: 'track', productId: 'lamp-praktike-rabalux-rogelio-mennyezeti-lampa-g', x: 1720, z: 3300, rot: 0, label: 'Sín – átmenet' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-kloving-allolampa-antracit', x: 300, z: 3800, label: 'Olvasó állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'track', productId: 'lamp-praktike-rabalux-noxelle-mennyezeti-szpot-l', x: 1832, z: 1721, rot: 0, label: 'Spotsor' },
        { id: 'ol1', type: 'wall', productId: 'lamp-ikea-nymane-fali-olvasolampa-antracit', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-ikea-nymane-fali-olvasolampa-antracit', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'track', productId: 'lamp-praktike-rabalux-rogelio-mennyezeti-lampa-g', x: 964, z: 1715, rot: 90, label: 'Spotsor' },
        { id: 'munka', type: 'table', productId: 'lamp-bonami-fekete-fem-asztali-lampa-manie-kav', x: 2180, z: 2850, label: 'Asztali lámpa' },
      ],
      eloszoba: [
        { id: 'fo', type: 'track', productId: 'lamp-ikea-skurup-mennyezeti-sin-3-spot-feket', x: 1400, z: 698, rot: 0, label: 'Sín' },
      ],
      kozlekedo: [
        { id: 'fo', type: 'track', productId: 'lamp-praktike-eglo-easyt-szpot-szett-gu10-4x10w', x: 420, z: 1660, rot: 90, label: 'Sín' },
      ],
    },
  },
  {
    id: 'lj1',
    name: 'J1 – natúr, könnyed',
    note: 'Bambusz függeszték az étkező fölött, szövetgömb a nappali részen, kőris lábú állólámpa; a hálóban fehér–nyír függeszték és szövetburás falikarok, a dolgozóban nyír mennyezeti lámpa. A zsálya és a világos tölgy mellé természetes anyagok, szórt fény.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-sinnerlig-fuggolampa-bambusz-kezze', x: 1720, z: 1700, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'pendant', productId: 'lamp-bonami-mellow-feher-fuggolampa-textil-bur', x: 1720, z: 5400, y: 2050, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-kinnahult-allolampa-koris-feher-15', x: 300, z: 3800, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'pendant', productId: 'lamp-ikea-bunkeflo-fuggolampa-feher-nyir-36', x: 1832, z: 1721, y: 2080, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-bonami-fekete-bezs-konnektorhoz-csatlakoz', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-bonami-fekete-bezs-konnektorhoz-csatlakoz', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nosund-mennyezeti-lampa-nyir-44-cm', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-ikea-tertial-asztali-lampa-sotetszurke', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-praktike-rabalux-leana2-led-mennyezeti-lamp', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-praktike-rabalux-leana2-led-mennyezeti-lamp', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-praktike-rabalux-leana2-led-mennyezeti-lamp', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
  {
    id: 'lj2',
    name: 'J2 – puha, rétegzett semleges',
    note: 'Opálüveg gömb az étkező fölött, bézs szövet mennyezeti lámpa a nappali részen, pliszírozott szövetburás állólámpa; a hálóban szövet mennyezeti lámpa és falikarok. A greige alaphoz textil és opál, kemény kontraszt nélkül.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-bonami-serene-feher-fuggolampa-uveg-burav', x: 1720, z: 1700, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-allan-bezs-textil-mennyezeti-lampa', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-natur-szinu-allolampa-textil-burav', x: 300, z: 3800, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-allan-bezs-textil-mennyezeti-lampa', x: 1832, z: 1721, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-bonami-fekete-bezs-konnektorhoz-csatlakoz', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-bonami-fekete-bezs-konnektorhoz-csatlakoz', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-praktike-eglo-musurita-led-mennyezeti-lampa', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-ikea-tertial-asztali-lampa-sotetszurke', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-allan-bezs-textil-mennyezeti-lampa', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-ikea-barlast-led-mennyezeti-falilampa-f', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-ikea-barlast-led-mennyezeti-falilampa-f', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
  {
    id: 'lj4',
    name: 'J4 – friss, opál és szürke',
    note: 'Fehér–nyír függeszték az étkező fölött, fekete-opál mennyezeti lámpa a nappali részen, világosszürke burás íves állólámpa; a hálóban fehér–nyír függeszték és antracit fali olvasólámpák. A kékesszürke kiemeléshez hűvösebb, letisztult formák.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-bunkeflo-fuggolampa-feher-nyir-36', x: 1720, z: 1700, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-kabomba-led-es-mennyezeti-lampa-ma', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-skottorp-skaftet-allolampa-ivelt-v', x: 300, z: 3800, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'pendant', productId: 'lamp-ikea-bunkeflo-fuggolampa-feher-nyir-36', x: 1832, z: 1721, y: 2080, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-ikea-nymane-fali-olvasolampa-antracit', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-ikea-nymane-fali-olvasolampa-antracit', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nymane-led-es-mennyezeti-lampa-ant', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-ikea-tertial-asztali-lampa-sotetszurke', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-barlast-led-mennyezeti-falilampa-f', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-ikea-barlast-led-mennyezeti-falilampa-f', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-ikea-barlast-led-mennyezeti-falilampa-f', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
  {
    id: 'lj5',
    name: 'J5 – fekete kontraszt a mélyzöldhöz',
    note: 'Fekete kupola az étkező fölött (a TV-fal mélyzöldjéhez és a fekete TV-hez), szövetgömb a nappali részen, kőris állólámpa; a hálóban fehér–nyír függeszték és szövet falikarok.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-ranarp-fuggolampa-fekete-38-cm', x: 1720, z: 1700, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'pendant', productId: 'lamp-bonami-mellow-feher-fuggolampa-textil-bur', x: 1720, z: 5400, y: 2050, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-kinnahult-allolampa-koris-feher-15', x: 300, z: 3800, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'pendant', productId: 'lamp-ikea-bunkeflo-fuggolampa-feher-nyir-36', x: 1832, z: 1721, y: 2080, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-bonami-fekete-bezs-konnektorhoz-csatlakoz', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-bonami-fekete-bezs-konnektorhoz-csatlakoz', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nosund-mennyezeti-lampa-nyir-44-cm', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-ikea-tertial-asztali-lampa-sotetszurke', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-praktike-rabalux-leana2-led-mennyezeti-lamp', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-praktike-rabalux-leana2-led-mennyezeti-lamp', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-praktike-rabalux-leana2-led-mennyezeti-lamp', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
  {
    id: 'lj6',
    name: 'J6 – a lakberendező terve szerint',
    note: 'Azonos a V1 tervvel: fekete függeszték az étkező fölött, fekete sín spotokkal a nappali részen, Manie állólámpa; rattan függeszték és fekete falikarok a hálóban; spotsor az előszobában és a közlekedőben.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-ranarp-fuggolampa-fekete-38-cm', x: 1720, z: 1700, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'track', productId: 'lamp-praktike-eglo-easyt-szpot-szett-gu10-4x10w', x: 1720, z: 5400, rot: 90, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-fekete-allolampa-manie-kave-home', x: 300, z: 3800, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'pendant', productId: 'lamp-ikea-narrkolv-fuggolampa-rattan-56-cm', x: 1832, z: 1721, y: 2080, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-bonami-fekete-fem-fali-lampa-manie-kave-h', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-bonami-fekete-fem-fali-lampa-manie-kave-h', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nymane-led-es-mennyezeti-lampa-ant', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'floor', productId: 'lamp-ikea-kloving-allolampa-antracit', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'track', productId: 'lamp-ikea-nymane-mennyezeti-spot-4-antracit', x: 1400, z: 698, rot: 0, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo', type: 'track', productId: 'lamp-ikea-skurup-mennyezeti-sin-3-spot-feket', x: 420, z: 1660, rot: 90, label: 'Sín' },
      ],
    },
  },
  {
    id: 'lj7',
    name: 'J7 – tervezői, lágyabban',
    note: 'Fekete függeszték az étkező fölött, 3 spotos fekete spotsor a nappali részen, Manie állólámpa; a hálóban rattan függeszték és Manie falikarok. A dió falpanelhez fekete részletek, de kevesebb sín, mint a V1-ben.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-ranarp-fuggolampa-fekete-38-cm', x: 1720, z: 1700, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'track', productId: 'lamp-praktike-rabalux-rogelio-mennyezeti-lampa-g', x: 1720, z: 5400, rot: 90, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-fekete-allolampa-manie-kave-home', x: 300, z: 3800, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'pendant', productId: 'lamp-ikea-narrkolv-fuggolampa-rattan-56-cm', x: 1832, z: 1721, y: 2080, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-bonami-fekete-fem-fali-lampa-manie-kave-h', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-bonami-fekete-fem-fali-lampa-manie-kave-h', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nymane-led-es-mennyezeti-lampa-ant', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'floor', productId: 'lamp-ikea-kloving-allolampa-antracit', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-praktike-rabalux-leana2-led-mennyezeti-lamp', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-praktike-rabalux-leana2-led-mennyezeti-lamp', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-praktike-rabalux-leana2-led-mennyezeti-lamp', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
  {
    id: 'lj8',
    name: 'J8 – kávéházi melegség',
    note: 'Rattan függeszték az étkező fölött, szövetgömb a nappali részen, pliszírozott natúr állólámpa; a hálóban sás mennyezeti lámpa és juta éjjeli lámpák; az előszobában bézs szövet mennyezeti lámpa.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-narrkolv-fuggolampa-rattan-56-cm', x: 1720, z: 1700, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'pendant', productId: 'lamp-bonami-mellow-feher-fuggolampa-textil-bur', x: 1720, z: 5400, y: 2050, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-natur-szinu-allolampa-textil-burav', x: 300, z: 3800, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-trubbrufse-mennyezeti-lampa-sas-45', x: 1832, z: 1721, label: 'Általános fény' },
        { id: 'ej1', type: 'table', productId: 'lamp-bonami-fekete-natur-szinu-asztali-lampa-j', x: 220, z: 440, label: 'Éjjeli lámpa' },
        { id: 'ej2', type: 'table', productId: 'lamp-bonami-fekete-natur-szinu-asztali-lampa-j', x: 220, z: 3020, label: 'Éjjeli lámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nosund-mennyezeti-lampa-nyir-44-cm', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-ikea-tvarhand-asztali-lampa-fekete-bamb', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-allan-bezs-textil-mennyezeti-lampa', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-praktike-rabalux-leana2-led-mennyezeti-lamp', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-praktike-rabalux-leana2-led-mennyezeti-lamp', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
  {
    id: 'lj9',
    name: 'J9 – meleg, szórt fény a mokkához',
    note: 'Bézs–kőris függeszték az étkező fölött, bézs szövet mennyezeti lámpa a nappali részen, sötétszürke–natúr szövetburás állólámpa; a hálóban rattan függeszték és szövet falikarok. A mokka TV-fal mellé meleg textil, fekete és króm nélkül.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-sjomakt-fuggolampa-bezs-koris-38-c', x: 1720, z: 1700, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-allan-bezs-textil-mennyezeti-lampa', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-sotetszurke-natur-szinu-allolampa', x: 300, z: 3800, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'pendant', productId: 'lamp-ikea-narrkolv-fuggolampa-rattan-56-cm', x: 1832, z: 1721, y: 2080, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-bonami-fekete-bezs-konnektorhoz-csatlakoz', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-bonami-fekete-bezs-konnektorhoz-csatlakoz', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nymane-led-es-mennyezeti-lampa-ant', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'floor', productId: 'lamp-ikea-kloving-allolampa-antracit', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-praktike-rabalux-leana2-led-mennyezeti-lamp', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-praktike-rabalux-leana2-led-mennyezeti-lamp', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-praktike-rabalux-leana2-led-mennyezeti-lamp', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
  {
    id: 'lj10',
    name: 'J10 – napfényes, natúr',
    note: 'Juta henger az étkező fölött, szövetgömb a nappali részen, natúr szövetburás állólámpa; a hálóban sás mennyezeti lámpa és juta éjjeli lámpák. A terrakottához fonott anyagok és fehér opál.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-bonami-ano-natur-szinu-fuggolampa-textil', x: 1720, z: 1700, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'pendant', productId: 'lamp-bonami-mellow-feher-fuggolampa-textil-bur', x: 1720, z: 5400, y: 2050, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-natur-szinu-allolampa-textil-burav', x: 300, z: 3800, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-trubbrufse-mennyezeti-lampa-sas-45', x: 1832, z: 1721, label: 'Általános fény' },
        { id: 'ej1', type: 'table', productId: 'lamp-bonami-fekete-natur-szinu-asztali-lampa-j', x: 220, z: 440, label: 'Éjjeli lámpa' },
        { id: 'ej2', type: 'table', productId: 'lamp-bonami-fekete-natur-szinu-asztali-lampa-j', x: 220, z: 3020, label: 'Éjjeli lámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nosund-mennyezeti-lampa-nyir-44-cm', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-ikea-tvarhand-asztali-lampa-fekete-bamb', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-praktike-eglo-musurita-led-mennyezeti-lampa', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-ikea-barlast-led-mennyezeti-falilampa-f', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-ikea-barlast-led-mennyezeti-falilampa-f', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
  {
    id: 'lj11',
    name: 'J11 – fekete részletek az olívához',
    note: 'Fekete kúpos függeszték az étkező fölött, fekete spotsor a nappali részen, Manie állólámpa; a hálóban bézs–kőris függeszték és Manie falikarok; a közlekedőben sín. Az olíva–dió kombinációhoz fekete fém.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-skurup-fuggolampa-fekete-38-cm', x: 1720, z: 1700, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'track', productId: 'lamp-bonami-etna-fekete-spotlampa-8x80-cm', x: 1720, z: 5400, rot: 90, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-fekete-allolampa-manie-kave-home', x: 300, z: 3800, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'pendant', productId: 'lamp-ikea-sjomakt-fuggolampa-bezs-koris-38-c', x: 1832, z: 1721, y: 2080, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-bonami-fekete-fem-fali-lampa-manie-kave-h', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-bonami-fekete-fem-fali-lampa-manie-kave-h', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'track', productId: 'lamp-praktike-rabalux-rogelio-mennyezeti-lampa-g', x: 964, z: 1715, rot: 90, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-bonami-fekete-fem-asztali-lampa-manie-kav', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'track', productId: 'lamp-ikea-skurup-mennyezeti-sin-3-spot-feket', x: 1400, z: 698, rot: 0, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo', type: 'track', productId: 'lamp-praktike-eglo-easyt-szpot-szett-gu10-4x10w', x: 420, z: 1660, rot: 90, label: 'Sín' },
      ],
    },
  },
  {
    id: 'lj13',
    name: 'J13 – skandináv egyszerűség',
    note: 'Fehér–nyír függeszték az étkező fölött, fehér–natúr LED mennyezeti lámpa a nappali részen, kőris állólámpa; a hálóban nyír mennyezeti lámpa és szürke asztali lámpák. Világos fa és fehér, egyszerű formák.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-bunkeflo-fuggolampa-feher-nyir-36', x: 1720, z: 1700, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-praktike-eglo-musurita-led-mennyezeti-lampa', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-kinnahult-allolampa-koris-feher-15', x: 300, z: 3800, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nosund-mennyezeti-lampa-nyir-44-cm', x: 1832, z: 1721, label: 'Általános fény' },
        { id: 'ej1', type: 'table', productId: 'lamp-ikea-tertial-asztali-lampa-sotetszurke', x: 220, z: 440, label: 'Éjjeli lámpa' },
        { id: 'ej2', type: 'table', productId: 'lamp-ikea-tertial-asztali-lampa-sotetszurke', x: 220, z: 3020, label: 'Éjjeli lámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nosund-mennyezeti-lampa-nyir-44-cm', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-ikea-tertial-asztali-lampa-sotetszurke', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-barlast-led-mennyezeti-falilampa-f', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-ikea-barlast-led-mennyezeti-falilampa-f', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-ikea-barlast-led-mennyezeti-falilampa-f', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
  {
    id: 'lj14',
    name: 'J14 – meleg, vidám',
    note: 'Bambusz függeszték az étkező fölött, szövetgömb a nappali részen, kőris állólámpa; a hálóban sás mennyezeti lámpa és juta éjjeli lámpák. A mustár kiemeléshez natúr fonott és fehér opál.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-sinnerlig-fuggolampa-bambusz-kezze', x: 1720, z: 1700, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'pendant', productId: 'lamp-bonami-mellow-feher-fuggolampa-textil-bur', x: 1720, z: 5400, y: 2050, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-kinnahult-allolampa-koris-feher-15', x: 300, z: 3800, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-trubbrufse-mennyezeti-lampa-sas-45', x: 1832, z: 1721, label: 'Általános fény' },
        { id: 'ej1', type: 'table', productId: 'lamp-bonami-fekete-natur-szinu-asztali-lampa-j', x: 220, z: 440, label: 'Éjjeli lámpa' },
        { id: 'ej2', type: 'table', productId: 'lamp-bonami-fekete-natur-szinu-asztali-lampa-j', x: 220, z: 3020, label: 'Éjjeli lámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nosund-mennyezeti-lampa-nyir-44-cm', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-ikea-tvarhand-asztali-lampa-fekete-bamb', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-praktike-rabalux-leana2-led-mennyezeti-lamp', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-praktike-rabalux-leana2-led-mennyezeti-lamp', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-praktike-rabalux-leana2-led-mennyezeti-lamp', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
  {
    id: 'lj15',
    name: 'J15 – tónusos, puha',
    note: 'Bézs–kőris függeszték az étkező fölött, bézs szövet mennyezeti lámpák, sötétszürke–natúr állólámpa; a hálóban szövet mennyezeti lámpa és falikarok. A gombaszínekhez textil, csillogás nélkül.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-sjomakt-fuggolampa-bezs-koris-38-c', x: 1720, z: 1700, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-allan-bezs-textil-mennyezeti-lampa', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-sotetszurke-natur-szinu-allolampa', x: 300, z: 3800, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-allan-bezs-textil-mennyezeti-lampa', x: 1832, z: 1721, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-bonami-fekete-bezs-konnektorhoz-csatlakoz', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-bonami-fekete-bezs-konnektorhoz-csatlakoz', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-praktike-eglo-musurita-led-mennyezeti-lampa', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-ikea-tertial-asztali-lampa-sotetszurke', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-allan-bezs-textil-mennyezeti-lampa', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-ikea-barlast-led-mennyezeti-falilampa-f', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-ikea-barlast-led-mennyezeti-falilampa-f', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
  {
    id: 'lj16',
    name: 'J16 – barackos, fonott',
    note: 'Juta henger az étkező fölött, rattan függeszték a nappali részen, natúr szövetburás állólámpa; a hálóban sás mennyezeti lámpa és juta éjjeli lámpák.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-bonami-ano-natur-szinu-fuggolampa-textil', x: 1720, z: 1700, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'pendant', productId: 'lamp-ikea-narrkolv-fuggolampa-rattan-56-cm', x: 1720, z: 5400, y: 2050, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-natur-szinu-allolampa-textil-burav', x: 300, z: 3800, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-trubbrufse-mennyezeti-lampa-sas-45', x: 1832, z: 1721, label: 'Általános fény' },
        { id: 'ej1', type: 'table', productId: 'lamp-bonami-fekete-natur-szinu-asztali-lampa-j', x: 220, z: 440, label: 'Éjjeli lámpa' },
        { id: 'ej2', type: 'table', productId: 'lamp-bonami-fekete-natur-szinu-asztali-lampa-j', x: 220, z: 3020, label: 'Éjjeli lámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nosund-mennyezeti-lampa-nyir-44-cm', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-ikea-tvarhand-asztali-lampa-fekete-bamb', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-praktike-rabalux-leana2-led-mennyezeti-lamp', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-praktike-rabalux-leana2-led-mennyezeti-lamp', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-praktike-rabalux-leana2-led-mennyezeti-lamp', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
  {
    id: 'lj17',
    name: 'J17 – fekete, grafikus',
    note: 'Fekete kúpos függeszték az étkező fölött, fekete sín a nappali részen, antracit kétfejű állólámpa; a hálóban fekete–tölgy spotsor és antracit fali olvasólámpák; sínek az előszobában és a közlekedőben. A fekete ajtókhoz fekete lámpatestek.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-skurup-fuggolampa-fekete-38-cm', x: 1720, z: 1700, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'track', productId: 'lamp-praktike-eglo-easyt-szpot-szett-gu10-4x10w', x: 1720, z: 5400, rot: 90, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-kloving-allolampa-antracit', x: 300, z: 3800, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'track', productId: 'lamp-praktike-rabalux-noxelle-mennyezeti-szpot-l', x: 1832, z: 1721, rot: 90, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-ikea-nymane-fali-olvasolampa-antracit', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-ikea-nymane-fali-olvasolampa-antracit', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'track', productId: 'lamp-praktike-rabalux-rogelio-mennyezeti-lampa-g', x: 964, z: 1715, rot: 90, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-jysk-asztali-lampa-patrik-atm14xma45cm', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'track', productId: 'lamp-ikea-skurup-mennyezeti-sin-3-spot-feket', x: 1400, z: 698, rot: 0, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo', type: 'track', productId: 'lamp-praktike-eglo-easyt-szpot-szett-gu10-4x10w', x: 420, z: 1660, rot: 90, label: 'Sín' },
      ],
    },
  },
  {
    id: 'lj18',
    name: 'J18 – kakaó és bambusz',
    note: 'Bambusz függeszték az étkező fölött, szövetgömb a nappali részen, sötétszürke–natúr állólámpa; a hálóban rattan függeszték és szövet falikarok. A kakaó TV-fal és a karamell bársony mellé meleg, fonott anyagok.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-sinnerlig-fuggolampa-bambusz-kezze', x: 1720, z: 1700, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'pendant', productId: 'lamp-bonami-mellow-feher-fuggolampa-textil-bur', x: 1720, z: 5400, y: 2050, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-sotetszurke-natur-szinu-allolampa', x: 300, z: 3800, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'pendant', productId: 'lamp-ikea-narrkolv-fuggolampa-rattan-56-cm', x: 1832, z: 1721, y: 2080, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-bonami-fekete-bezs-konnektorhoz-csatlakoz', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-bonami-fekete-bezs-konnektorhoz-csatlakoz', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nymane-led-es-mennyezeti-lampa-ant', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'floor', productId: 'lamp-ikea-kloving-allolampa-antracit', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-allan-bezs-textil-mennyezeti-lampa', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-praktike-rabalux-leana2-led-mennyezeti-lamp', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-praktike-rabalux-leana2-led-mennyezeti-lamp', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
];
