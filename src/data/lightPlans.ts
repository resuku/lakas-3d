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
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-ranarp-fuggolampa-fekete-38-cm', x: 1720, z: 2050, y: 1600, label: 'Étkező függeszték' },
        { id: 'sin', type: 'track', productId: 'lamp-praktike-eglo-easyt-szpot-szett-gu10-4x10w', x: 1720, z: 5400, rot: 90, label: 'Nappali sín' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-fekete-allolampa-manie-kave-home', x: 300, z: 7100, label: 'Olvasó állólámpa' },
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
        { id: 'etk', type: 'ceiling', productId: 'lamp-ikea-nymane-led-es-mennyezeti-lampa-ant', x: 1720, z: 2050, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nymane-led-es-mennyezeti-lampa-ant', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-kinnahult-allolampa-koris-feher-15', x: 300, z: 7100, label: 'Állólámpa' },
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
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-sinnerlig-fuggolampa-bambusz-kezze', x: 1720, z: 2050, y: 1550, label: 'Étkező függeszték' },
        { id: 'fo', type: 'pendant', productId: 'lamp-bonami-mellow-feher-fuggolampa-textil-bur', x: 1720, z: 5400, y: 2050, label: 'Nappali függeszték' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-sotetszurke-natur-szinu-allolampa', x: 300, z: 7100, label: 'Állólámpa' },
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
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-skurup-fuggolampa-fekete-38-cm', x: 1720, z: 2050, y: 1600, label: 'Étkező függeszték' },
        { id: 'sin1', type: 'track', productId: 'lamp-bonami-etna-fekete-spotlampa-8x80-cm', x: 1720, z: 5400, rot: 90, label: 'Sín – nappali rész' },
        { id: 'sin2', type: 'track', productId: 'lamp-praktike-rabalux-rogelio-mennyezeti-lampa-g', x: 1720, z: 3300, rot: 0, label: 'Sín – átmenet' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-kloving-allolampa-antracit', x: 300, z: 7100, label: 'Olvasó állólámpa' },
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
    id: 'lj5',
    name: 'J1 – fekete kontraszt a mélyzöldhöz',
    note: 'Fekete kupola az étkező fölött (a TV-fal mélyzöldjéhez és a fekete TV-hez), szövetgömb a nappali részen, kőris állólámpa; a hálóban fehér–nyír függeszték és szövet falikarok.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-ranarp-fuggolampa-fekete-38-cm', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'pendant', productId: 'lamp-bonami-mellow-feher-fuggolampa-textil-bur', x: 1720, z: 5400, y: 2050, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-kinnahult-allolampa-koris-feher-15', x: 300, z: 7100, label: 'Állólámpa' },
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
    id: 'lj17',
    name: 'J2 – fekete, grafikus',
    note: 'Fekete kúpos függeszték az étkező fölött, fekete sín a nappali részen, antracit kétfejű állólámpa; a hálóban fekete–tölgy spotsor és antracit fali olvasólámpák; sínek az előszobában és a közlekedőben. A fekete ajtókhoz fekete lámpatestek.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-skurup-fuggolampa-fekete-38-cm', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'track', productId: 'lamp-praktike-eglo-easyt-szpot-szett-gu10-4x10w', x: 1720, z: 5400, rot: 90, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-kloving-allolampa-antracit', x: 300, z: 7100, label: 'Állólámpa' },
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
    name: 'J3 – kakaó és bambusz',
    note: 'Bambusz függeszték az étkező fölött, szövetgömb a nappali részen, sötétszürke–natúr állólámpa; a hálóban rattan függeszték és szövet falikarok. A kakaó TV-fal és a karamell bársony mellé meleg, fonott anyagok.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-sinnerlig-fuggolampa-bambusz-kezze', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'pendant', productId: 'lamp-bonami-mellow-feher-fuggolampa-textil-bur', x: 1720, z: 5400, y: 2050, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-sotetszurke-natur-szinu-allolampa', x: 300, z: 7100, label: 'Állólámpa' },
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
  {
    id: 'lj1',
    name: 'J4 – natúr, könnyed',
    note: 'Bambusz függeszték az étkező fölött, szövetgömb a nappali részen, kőris lábú állólámpa; a hálóban fehér–nyír függeszték és szövetburás falikarok, a dolgozóban nyír mennyezeti lámpa. A zsálya és a világos tölgy mellé természetes anyagok, szórt fény.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-sinnerlig-fuggolampa-bambusz-kezze', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'pendant', productId: 'lamp-bonami-mellow-feher-fuggolampa-textil-bur', x: 1720, z: 5400, y: 2050, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-kinnahult-allolampa-koris-feher-15', x: 300, z: 7100, label: 'Állólámpa' },
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
    name: 'J5 – puha, rétegzett semleges',
    note: 'Opálüveg gömb az étkező fölött, bézs szövet mennyezeti lámpa a nappali részen, pliszírozott szövetburás állólámpa; a hálóban szövet mennyezeti lámpa és falikarok. A greige alaphoz textil és opál, kemény kontraszt nélkül.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-bonami-serene-feher-fuggolampa-uveg-burav', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-allan-bezs-textil-mennyezeti-lampa', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-natur-szinu-allolampa-textil-burav', x: 300, z: 7100, label: 'Állólámpa' },
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
    name: 'J6 – friss, opál és szürke',
    note: 'Fehér–nyír függeszték az étkező fölött, fekete-opál mennyezeti lámpa a nappali részen, világosszürke burás íves állólámpa; a hálóban fehér–nyír függeszték és antracit fali olvasólámpák. A kékesszürke kiemeléshez hűvösebb, letisztult formák.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-bunkeflo-fuggolampa-feher-nyir-36', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-kabomba-led-es-mennyezeti-lampa-ma', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-skottorp-skaftet-allolampa-ivelt-v', x: 300, z: 7100, label: 'Állólámpa' },
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
    id: 'lj6',
    name: 'J7 – a lakberendező terve szerint',
    note: 'Azonos a V1 tervvel: fekete függeszték az étkező fölött, fekete sín spotokkal a nappali részen, Manie állólámpa; rattan függeszték és fekete falikarok a hálóban; spotsor az előszobában és a közlekedőben.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-ranarp-fuggolampa-fekete-38-cm', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'track', productId: 'lamp-praktike-eglo-easyt-szpot-szett-gu10-4x10w', x: 1720, z: 5400, rot: 90, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-fekete-allolampa-manie-kave-home', x: 300, z: 7100, label: 'Állólámpa' },
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
    name: 'J8 – tervezői, lágyabban',
    note: 'Fekete függeszték az étkező fölött, 3 spotos fekete spotsor a nappali részen, Manie állólámpa; a hálóban rattan függeszték és Manie falikarok. A dió falpanelhez fekete részletek, de kevesebb sín, mint a V1-ben.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-ranarp-fuggolampa-fekete-38-cm', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'track', productId: 'lamp-praktike-rabalux-rogelio-mennyezeti-lampa-g', x: 1720, z: 5400, rot: 90, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-fekete-allolampa-manie-kave-home', x: 300, z: 7100, label: 'Állólámpa' },
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
    name: 'J9 – kávéházi melegség',
    note: 'Rattan függeszték az étkező fölött, szövetgömb a nappali részen, pliszírozott natúr állólámpa; a hálóban sás mennyezeti lámpa és juta éjjeli lámpák; az előszobában bézs szövet mennyezeti lámpa.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-narrkolv-fuggolampa-rattan-56-cm', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'pendant', productId: 'lamp-bonami-mellow-feher-fuggolampa-textil-bur', x: 1720, z: 5400, y: 2050, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-natur-szinu-allolampa-textil-burav', x: 300, z: 7100, label: 'Állólámpa' },
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
    name: 'J10 – meleg, szórt fény a mokkához',
    note: 'Bézs–kőris függeszték az étkező fölött, bézs szövet mennyezeti lámpa a nappali részen, sötétszürke–natúr szövetburás állólámpa; a hálóban rattan függeszték és szövet falikarok. A mokka TV-fal mellé meleg textil, fekete és króm nélkül.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-sjomakt-fuggolampa-bezs-koris-38-c', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-allan-bezs-textil-mennyezeti-lampa', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-sotetszurke-natur-szinu-allolampa', x: 300, z: 7100, label: 'Állólámpa' },
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
    name: 'J11 – napfényes, natúr',
    note: 'Juta henger az étkező fölött, szövetgömb a nappali részen, natúr szövetburás állólámpa; a hálóban sás mennyezeti lámpa és juta éjjeli lámpák. A terrakottához fonott anyagok és fehér opál.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-bonami-ano-natur-szinu-fuggolampa-textil', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'pendant', productId: 'lamp-bonami-mellow-feher-fuggolampa-textil-bur', x: 1720, z: 5400, y: 2050, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-natur-szinu-allolampa-textil-burav', x: 300, z: 7100, label: 'Állólámpa' },
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
    name: 'J12 – fekete részletek az olívához',
    note: 'Fekete kúpos függeszték az étkező fölött, fekete spotsor a nappali részen, Manie állólámpa; a hálóban bézs–kőris függeszték és Manie falikarok; a közlekedőben sín. Az olíva–dió kombinációhoz fekete fém.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-skurup-fuggolampa-fekete-38-cm', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'track', productId: 'lamp-bonami-etna-fekete-spotlampa-8x80-cm', x: 1720, z: 5400, rot: 90, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-fekete-allolampa-manie-kave-home', x: 300, z: 7100, label: 'Állólámpa' },
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
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-bunkeflo-fuggolampa-feher-nyir-36', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-praktike-eglo-musurita-led-mennyezeti-lampa', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-kinnahult-allolampa-koris-feher-15', x: 300, z: 7100, label: 'Állólámpa' },
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
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-sinnerlig-fuggolampa-bambusz-kezze', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'pendant', productId: 'lamp-bonami-mellow-feher-fuggolampa-textil-bur', x: 1720, z: 5400, y: 2050, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-kinnahult-allolampa-koris-feher-15', x: 300, z: 7100, label: 'Állólámpa' },
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
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-sjomakt-fuggolampa-bezs-koris-38-c', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-allan-bezs-textil-mennyezeti-lampa', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-sotetszurke-natur-szinu-allolampa', x: 300, z: 7100, label: 'Állólámpa' },
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
        { id: 'etk', type: 'pendant', productId: 'lamp-bonami-ano-natur-szinu-fuggolampa-textil', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'pendant', productId: 'lamp-ikea-narrkolv-fuggolampa-rattan-56-cm', x: 1720, z: 5400, y: 2050, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-natur-szinu-allolampa-textil-burav', x: 300, z: 7100, label: 'Állólámpa' },
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
    id: 'ljf1',
    name: 'JF1 – fekete kupolák, opál fény',
    note: 'Takarékos IKEA-terv: kis fekete kupola az étkező fölött, matt fekete opál LED-lámpa a nappali részen, fekete felfelé világító állólámpa; a hálóban ugyanaz a fekete opál lámpa és antracit fali olvasólámpák; a dolgozóban antracit LED-lámpa és fekete LED-es íróasztal-lámpa; az előszobában és a közlekedőben kis fekete fém mennyezeti lámpák.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-brunsta-havsdjup-fuggolampa-fekete-30-cm-95-755-66', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-kabomba-led-es-mennyezeti-lampa-ma', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-tagarp-allo-mennymegvil-olvasolamp', x: 300, z: 7100, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-kabomba-led-es-mennyezeti-lampa-ma', x: 1832, z: 1721, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-ikea-nymane-fali-olvasolampa-antracit', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-ikea-nymane-fali-olvasolampa-antracit', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nymane-led-es-mennyezeti-lampa-ant', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-ikea-navlinge-led-es-iroasztallampa-fekete-04-044-22', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-fekete-mennyezeti-lampa-fem-buraval-24-cm-berceste-o-1643956', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-bonami-fekete-mennyezeti-lampa-fem-buraval-24-cm-berceste-o-1643956', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-bonami-fekete-mennyezeti-lampa-fem-buraval-24-cm-berceste-o-1643956', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
  {
    id: 'ljf2',
    name: 'JF2 – fekete fém és rattan',
    note: 'Fekete–rattan függeszték az étkező fölött, széles fekete–rattan mennyezeti lámpa a nappali részen, fekete burás, fa lábú háromlábú állólámpa; a hálóban kisebb fekete–rattan függeszték és fekete kúpos falikarok; a dolgozóban antracit LED-lámpa és fekete–juta asztali lámpa; az előszobában és a közlekedőben kis fekete–rattan lámpák. A mokka és a taupe mellé meleg fonott anyag.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-kappeland-havsdjup-fuggolampa-fekete-rattan-45-cm-96-040-51', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-fekete-mennyezeti-lampa-fem-rattan-buraval-10-5x70-c-1711478', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-tripod-wood-fekete-allolampa-fa-labakkal-zuiver-21629', x: 300, z: 7100, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'pendant', productId: 'lamp-ikea-kappeland-havsdjup-fuggolampa-fekete-rattan-29-cm-96-172-92', x: 1832, z: 1721, y: 2080, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-bonami-fekete-fali-lampa-peak-markslojd', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-bonami-fekete-fali-lampa-peak-markslojd', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nymane-led-es-mennyezeti-lampa-ant', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-bonami-fekete-natur-szinu-asztali-lampa-juta-buraval-magass-1592182', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-fekete-mennyezeti-lampa-fem-rattan-buraval-10x28-cm-1711476', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-bonami-fekete-mennyezeti-lampa-fem-rattan-buraval-10x28-cm-1711476', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-bonami-fekete-mennyezeti-lampa-fem-rattan-buraval-10x28-cm-1711476', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
  {
    id: 'ljf3',
    name: 'JF3 – fekete és sárgaréz',
    note: 'Fekete–arany függeszték az étkező fölött, matt fekete–arany mennyezeti lámpa a nappali részen és a hálóban, fekete–arany állólámpa; a hálóban fekete–arany falikarok; a dolgozóban antracit LED-lámpa és fekete–arany asztali lámpa; az előszobában és a közlekedőben kis fekete–arany mennyezeti lámpák. Az olívához és a travertinhez meleg fémfény.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-bonami-fekete-aranyszinu-fuggolampa-35-cm-prima-gold-candel-1523614', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-matt-fekete-aranyszinu-fem-mennyezeti-lampa-opsi-nov-1938628', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-fekete-aranyszinu-allolampa-magassag-172-cm-closy-ma-1829304', x: 300, z: 7100, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-matt-fekete-aranyszinu-fem-mennyezeti-lampa-opsi-nov-1938628', x: 1832, z: 1721, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-bonami-fekete-aranyszinu-fali-lampa-20-cm-tramino-opviq-lig-1643994', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-bonami-fekete-aranyszinu-fali-lampa-20-cm-tramino-opviq-lig-1643994', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nymane-led-es-mennyezeti-lampa-ant', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-bonami-fekete-aranyszinu-asztali-lampa-fem-buraval-magassag-1644180', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-fekete-aranyszinu-mennyezeti-lampa-fem-buraval-20-cm-1643978', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-bonami-fekete-aranyszinu-mennyezeti-lampa-fem-buraval-20-cm-1643978', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-bonami-fekete-aranyszinu-mennyezeti-lampa-fem-buraval-20-cm-1643978', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
  {
    id: 'ljf4',
    name: 'JF4 – fekete és opálüveg',
    note: 'Háromfejű fekete–fehér függeszték az étkező fölött, fekete–opálüveg mennyezeti lámpa a nappali részen, fekete–fehér olvasó állólámpa; a hálóban fekete–fehér kupola és fekete–krém falikarok; a dolgozóban antracit LED-lámpa és fekete–fehér íróasztal-lámpa; az előszobában és a közlekedőben fehér–fekete opál mennyezeti lámpák. Klasszikus, „párizsias”.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-sambord-fuggolampa-3-lampaval-fekete-feher-05-869-61', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-feher-fekete-uveg-mennyezeti-lampa-rise-markslojd-1540978', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-sambord-allo-olvasolampa-fekete-feher-05-494-02', x: 300, z: 7100, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'pendant', productId: 'lamp-ikea-ringsta-havsdjup-fuggolampa-fekete-feher-42-cm-96-101-21', x: 1832, z: 1721, y: 2080, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-bonami-fekete-kremszinu-fali-lampa-18-cm-profil-opviq-light-1780756', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-bonami-fekete-kremszinu-fali-lampa-18-cm-profil-opviq-light-1780756', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nymane-led-es-mennyezeti-lampa-ant', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-ikea-sambord-iroasztali-lampa-fekete-feher-05-869-49', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-feher-fekete-opaluveg-mennyezeti-lampa-25x19-cm-milf-1951250', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-bonami-feher-fekete-opaluveg-mennyezeti-lampa-25x19-cm-milf-1951250', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-bonami-feher-fekete-opaluveg-mennyezeti-lampa-25x19-cm-milf-1951250', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
  {
    id: 'ljf5',
    name: 'JF5 – minimál fekete sínek',
    note: 'Fekete kupola az étkező fölött, antracit 4 spotos spotsor a nappali részen, kétfejű fekete spot-állólámpa; a hálóban fekete sín és fekete falikarok; a dolgozóban fekete sín és LED-es íróasztal-lámpa; az előszobában antracit spotsor, a közlekedőben fekete sín. A sötét, tónusos falakhoz irányítható, falmosó fény.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-bonami-lena-fekete-fuggolampa-37-cm-white-label-1386339', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'track', productId: 'lamp-ikea-nymane-mennyezeti-spot-4-antracit', x: 1720, z: 5400, rot: 90, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-folkbat-allolampa-2-spottal-fekete-05-666-69', x: 300, z: 7100, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'track', productId: 'lamp-ikea-skurup-mennyezeti-sin-3-spot-feket', x: 1832, z: 1721, rot: 90, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-bonami-crest-fekete-fali-lampa-magassag-17-cm-markslojd-1413329', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-bonami-crest-fekete-fali-lampa-magassag-17-cm-markslojd-1413329', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'track', productId: 'lamp-ikea-skurup-mennyezeti-sin-3-spot-feket', x: 964, z: 1715, rot: 90, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-ikea-navlinge-led-es-iroasztallampa-fekete-04-044-22', x: 2180, z: 2850, label: 'Munkafény' },
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
    id: 'ljf6',
    name: 'JF6 – plasztikus fekete formák',
    note: 'Nagy, 72 cm-es fekete kupola az étkező fölött, fekete fém mennyezeti lámpa a nappali részen, ívelt fekete állólámpa a kanapé fölé; a hálóban fekete kupola és Manie falikarok; a dolgozóban antracit LED-lámpa és Manie asztali lámpa; az előszobában fekete mennyezeti lámpa, a közlekedőben kis fekete lámpák. Kevés, de karakteres darab.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-kvallsdopp-havsdjup-fuggolampa-fekete-72-cm-96-268-94', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-margot-mennyezeti-lampa-kave-home-744820', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-fekete-allolampa-fem-buraval-dione', x: 300, z: 7100, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'pendant', productId: 'lamp-bonami-lena-fekete-fuggolampa-37-cm-white-label-1386339', x: 1832, z: 1721, y: 2080, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-bonami-fekete-fem-fali-lampa-manie-kave-h', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-bonami-fekete-fem-fali-lampa-manie-kave-h', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nymane-led-es-mennyezeti-lampa-ant', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-bonami-fekete-fem-asztali-lampa-manie-kav', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-margot-mennyezeti-lampa-kave-home-744820', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-bonami-fekete-mennyezeti-lampa-fem-buraval-24-cm-berceste-o-1643956', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-bonami-fekete-mennyezeti-lampa-fem-buraval-24-cm-berceste-o-1643956', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
  {
    id: 'ljf7',
    name: 'JF7 – fekete kupola és fekete–rattan',
    note: 'Fekete kupola az étkező fölött, fekete–rattan függeszték a nappali részen és a hálóban, fekete felfelé világító állólámpa; antracit fali olvasólámpák, a dolgozóban antracit LED-lámpa és fekete íróasztal-lámpa; az előszobában fekete fém, a közlekedőben kis fekete–rattan lámpák.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-ranarp-fuggolampa-fekete-38-cm', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'pendant', productId: 'lamp-ikea-kappeland-havsdjup-fuggolampa-fekete-rattan-45-cm-96-040-51', x: 1720, z: 5400, y: 2050, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-tagarp-allo-mennymegvil-olvasolamp', x: 300, z: 7100, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'pendant', productId: 'lamp-ikea-kappeland-havsdjup-fuggolampa-fekete-rattan-29-cm-96-172-92', x: 1832, z: 1721, y: 2080, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-ikea-nymane-fali-olvasolampa-antracit', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-ikea-nymane-fali-olvasolampa-antracit', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nymane-led-es-mennyezeti-lampa-ant', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-ikea-navlinge-led-es-iroasztallampa-fekete-04-044-22', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-fekete-mennyezeti-lampa-fem-buraval-24-cm-berceste-o-1643956', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-bonami-fekete-mennyezeti-lampa-fem-rattan-buraval-10x28-cm-1711476', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-bonami-fekete-mennyezeti-lampa-fem-rattan-buraval-10x28-cm-1711476', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
  {
    id: 'ljf8',
    name: 'JF8 – fekete kúp és sín',
    note: 'Fekete kúpos függeszték az étkező fölött, fekete spotsín a nappali részen, antracit kétfejű állólámpa; a hálóban matt fekete opál LED-lámpa és fekete kúpos falikarok; a dolgozóban Manie asztali lámpa; fekete mennyezeti lámpa az előszobában, sín a közlekedőben.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-skurup-fuggolampa-fekete-38-cm', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'track', productId: 'lamp-bonami-etna-fekete-spotlampa-8x80-cm', x: 1720, z: 5400, rot: 90, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-kloving-allolampa-antracit', x: 300, z: 7100, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-kabomba-led-es-mennyezeti-lampa-ma', x: 1832, z: 1721, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-bonami-fekete-fali-lampa-peak-markslojd', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-bonami-fekete-fali-lampa-peak-markslojd', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nymane-led-es-mennyezeti-lampa-ant', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-bonami-fekete-fem-asztali-lampa-manie-kav', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-margot-mennyezeti-lampa-kave-home-744820', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo', type: 'track', productId: 'lamp-ikea-skurup-mennyezeti-sin-3-spot-feket', x: 420, z: 1660, rot: 90, label: 'Sín' },
      ],
    },
  },
  {
    id: 'ljf9',
    name: 'JF9 – nagy fekete kupola, fekete és arany',
    note: 'Nagy, 72 cm-es fekete kupola az étkező fölött, matt fekete–arany mennyezeti lámpa a nappali részen, ívelt fekete állólámpa; a hálóban fekete mennyezeti lámpa és fekete–arany falikarok; a dolgozóban fekete–arany asztali lámpa. A sötét dió padlóhoz sok, meleg fény.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-kvallsdopp-havsdjup-fuggolampa-fekete-72-cm-96-268-94', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-matt-fekete-aranyszinu-fem-mennyezeti-lampa-opsi-nov-1938628', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-fekete-allolampa-fem-buraval-dione', x: 300, z: 7100, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-margot-mennyezeti-lampa-kave-home-744820', x: 1832, z: 1721, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-bonami-fekete-aranyszinu-fali-lampa-20-cm-tramino-opviq-lig-1643994', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-bonami-fekete-aranyszinu-fali-lampa-20-cm-tramino-opviq-lig-1643994', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nymane-led-es-mennyezeti-lampa-ant', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-bonami-fekete-aranyszinu-asztali-lampa-fem-buraval-magassag-1644180', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-matt-fekete-aranyszinu-fem-mennyezeti-lampa-opsi-nov-1938628', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-bonami-fekete-aranyszinu-mennyezeti-lampa-fem-buraval-20-cm-1643978', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-bonami-fekete-aranyszinu-mennyezeti-lampa-fem-buraval-20-cm-1643978', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
  {
    id: 'ljf10',
    name: 'JF10 – fekete–fehér, skandináv',
    note: 'Fekete kupola az étkező fölött, fehér–fekete üveg mennyezeti lámpa a nappali részen, fekete–fehér olvasó állólámpa; a hálóban fekete–fehér kupola és antracit falikarok; fehér–fekete opál lámpák az előszobában és a közlekedőben.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-brunsta-havsdjup-fuggolampa-fekete-30-cm-95-755-66', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-feher-fekete-uveg-mennyezeti-lampa-rise-markslojd-1540978', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-sambord-allo-olvasolampa-fekete-feher-05-494-02', x: 300, z: 7100, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'pendant', productId: 'lamp-ikea-ringsta-havsdjup-fuggolampa-fekete-feher-42-cm-96-101-21', x: 1832, z: 1721, y: 2080, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-ikea-nymane-fali-olvasolampa-antracit', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-ikea-nymane-fali-olvasolampa-antracit', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nymane-led-es-mennyezeti-lampa-ant', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-ikea-sambord-iroasztali-lampa-fekete-feher-05-869-49', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-feher-fekete-opaluveg-mennyezeti-lampa-25x19-cm-milf-1951250', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-bonami-feher-fekete-opaluveg-mennyezeti-lampa-25x19-cm-milf-1951250', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-bonami-feher-fekete-opaluveg-mennyezeti-lampa-25x19-cm-milf-1951250', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
  {
    id: 'ljf11',
    name: 'JF11 – fekete fém és fonott anyag',
    note: 'Fekete–rattan függeszték az étkező fölött, széles fekete–rattan mennyezeti lámpa a nappali részen, sötétszürke–natúr szövetburás állólámpa; a hálóban sás mennyezeti lámpa és fekete Manie falikarok; fekete–juta asztali lámpa a dolgozóban; kis fekete–rattan lámpák az előszobában és a közlekedőben.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-kappeland-havsdjup-fuggolampa-fekete-rattan-45-cm-96-040-51', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-fekete-mennyezeti-lampa-fem-rattan-buraval-10-5x70-c-1711478', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-sotetszurke-natur-szinu-allolampa', x: 300, z: 7100, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-trubbrufse-mennyezeti-lampa-sas-45', x: 1832, z: 1721, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-bonami-fekete-fem-fali-lampa-manie-kave-h', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-bonami-fekete-fem-fali-lampa-manie-kave-h', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nymane-led-es-mennyezeti-lampa-ant', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-bonami-fekete-natur-szinu-asztali-lampa-juta-buraval-magass-1592182', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-fekete-mennyezeti-lampa-fem-rattan-buraval-10x28-cm-1711476', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-bonami-fekete-mennyezeti-lampa-fem-rattan-buraval-10x28-cm-1711476', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-bonami-fekete-mennyezeti-lampa-fem-rattan-buraval-10x28-cm-1711476', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
  {
    id: 'ljs1',
    name: 'JS1 – fehér és nyír',
    note: 'Fehér–nyír függeszték az étkező fölött, fehér–natúr LED-lámpa a nappali részen, kőris lábú állólámpa; a hálóban nyír mennyezeti lámpa és szürke asztali lámpák; nyír a dolgozóban, fehér LED-lámpák az előszobában és a közlekedőben.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-bunkeflo-fuggolampa-feher-nyir-36', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-praktike-eglo-musurita-led-mennyezeti-lampa', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-kinnahult-allolampa-koris-feher-15', x: 300, z: 7100, label: 'Állólámpa' },
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
    id: 'ljf12',
    name: 'JF12 – fekete, arany és opál',
    note: 'Fekete–arany függeszték az étkező fölött, sárgaréz opálüveg mennyezeti lámpa a nappali részen, fekete–arany állólámpa; a hálóban matt fekete–arany mennyezeti lámpa és fekete–arany falikarok; kis fekete–arany lámpák az előszobában és a közlekedőben.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-bonami-fekete-aranyszinu-fuggolampa-35-cm-prima-gold-candel-1523614', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-sargarez-szinu-opaluveg-mennyezeti-lampa-48-5x25-cm-1951268', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-fekete-aranyszinu-allolampa-magassag-172-cm-closy-ma-1829304', x: 300, z: 7100, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-matt-fekete-aranyszinu-fem-mennyezeti-lampa-opsi-nov-1938628', x: 1832, z: 1721, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-bonami-fekete-aranyszinu-fali-lampa-20-cm-tramino-opviq-lig-1643994', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-bonami-fekete-aranyszinu-fali-lampa-20-cm-tramino-opviq-lig-1643994', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nymane-led-es-mennyezeti-lampa-ant', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-bonami-fekete-aranyszinu-asztali-lampa-fem-buraval-magassag-1644180', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-fekete-aranyszinu-mennyezeti-lampa-fem-buraval-20-cm-1643978', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-bonami-fekete-aranyszinu-mennyezeti-lampa-fem-buraval-20-cm-1643978', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-bonami-fekete-aranyszinu-mennyezeti-lampa-fem-buraval-20-cm-1643978', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
  {
    id: 'ljs2',
    name: 'JS2 – opál és szövet',
    note: 'Fehér opálüveg függeszték az étkező fölött, szövetgömb a nappali részen, bükk–fehér állólámpa; a hálóban fehér–nyír függeszték és szövet falikarok; kőris íróasztal-lámpa a dolgozóban.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-bonami-feher-opaluveg-fuggolampa-30x44-cm-cafe-nordlux-1951514', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'pendant', productId: 'lamp-bonami-mellow-feher-fuggolampa-textil-bur', x: 1720, z: 5400, y: 2050, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-okensand-allolampa-bukk-feher-05-415-26', x: 300, z: 7100, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'pendant', productId: 'lamp-ikea-bunkeflo-fuggolampa-feher-nyir-36', x: 1832, z: 1721, y: 2080, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-bonami-fekete-bezs-konnektorhoz-csatlakoz', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-bonami-fekete-bezs-konnektorhoz-csatlakoz', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nosund-mennyezeti-lampa-nyir-44-cm', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-ikea-sjomakt-iroasztali-lampa-bezs-koris-05-956-66', x: 2180, z: 2850, label: 'Munkafény' },
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
    id: 'ljs3',
    name: 'JS3 – bézs–kőris, hűvösebb fény',
    note: 'Bézs–kőris függeszték az étkező fölött, fehér–natúr LED-lámpa a nappali részen, ívelt, világosszürke burás állólámpa; a hálóban bézs szövet mennyezeti lámpa és antracit fali olvasólámpák; fehér LED-lámpák az előszobában és a közlekedőben.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-sjomakt-fuggolampa-bezs-koris-38-c', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-praktike-eglo-musurita-led-mennyezeti-lampa', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-skottorp-skaftet-allolampa-ivelt-v', x: 300, z: 7100, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-allan-bezs-textil-mennyezeti-lampa', x: 1832, z: 1721, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-ikea-nymane-fali-olvasolampa-antracit', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-ikea-nymane-fali-olvasolampa-antracit', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-praktike-rabalux-gonzalo-led-mennyezeti-lam', x: 964, z: 1715, label: 'Általános fény' },
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
    id: 'ljs4',
    name: 'JS4 – nyír, kőris és opál',
    note: 'Fehér–nyír függeszték az étkező fölött, nyír mennyezeti lámpa a nappali részen, kőris kétfejű állólámpa; a hálóban sás mennyezeti lámpa és bézs opál asztali lámpák; kőris íróasztal-lámpa a dolgozóban.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-bunkeflo-fuggolampa-feher-nyir-36', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nosund-mennyezeti-lampa-nyir-44-cm', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-sjomakt-allolampa-2-spottal-bezs-koris-05-956-67', x: 300, z: 7100, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-trubbrufse-mennyezeti-lampa-sas-45', x: 1832, z: 1721, label: 'Általános fény' },
        { id: 'ej1', type: 'table', productId: 'lamp-bonami-bezs-opaluveg-asztali-lampa-27-5x21-cm-malti-nordlux-1951412', x: 220, z: 440, label: 'Éjjeli lámpa' },
        { id: 'ej2', type: 'table', productId: 'lamp-bonami-bezs-opaluveg-asztali-lampa-27-5x21-cm-malti-nordlux-1951412', x: 220, z: 3020, label: 'Éjjeli lámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nosund-mennyezeti-lampa-nyir-44-cm', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-ikea-sjomakt-iroasztali-lampa-bezs-koris-05-956-66', x: 2180, z: 2850, label: 'Munkafény' },
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
    id: 'ljs5',
    name: 'JS5 – fekete–fehér kontraszt',
    note: 'Kis fekete kupola az étkező fölött, matt fekete opál LED-lámpa a nappali részen, fekete felfelé világító állólámpa; a hálóban fehér–nyír függeszték és antracit falikarok; fekete LED-es íróasztal-lámpa; fehér LED-lámpák az előszobában és a közlekedőben.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-brunsta-havsdjup-fuggolampa-fekete-30-cm-95-755-66', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-kabomba-led-es-mennyezeti-lampa-ma', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-tagarp-allo-mennymegvil-olvasolamp', x: 300, z: 7100, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'pendant', productId: 'lamp-ikea-bunkeflo-fuggolampa-feher-nyir-36', x: 1832, z: 1721, y: 2080, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-ikea-nymane-fali-olvasolampa-antracit', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-ikea-nymane-fali-olvasolampa-antracit', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nymane-led-es-mennyezeti-lampa-ant', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-ikea-navlinge-led-es-iroasztallampa-fekete-04-044-22', x: 2180, z: 2850, label: 'Munkafény' },
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
    id: 'ljm1',
    name: 'JM1 – sárgaréz és opál',
    note: 'Fehér–sárgaréz opálüveg függeszték az étkező fölött, sárgaréz opál mennyezeti lámpa a nappali részen, krém–sárgaréz textil állólámpa; a hálóban bézs szövet mennyezeti lámpa és fehér–sárgaréz falikarok; sárgaréz asztali lámpa a dolgozóban.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-bonami-feher-sargarez-szinu-opaluveg-fuggolampa-54x41-5-cm-1951524', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-sargarez-szinu-opaluveg-mennyezeti-lampa-48-5x25-cm-1951268', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-kremszinu-sargarez-szinu-textil-allolampa-magassag-1-1941546', x: 300, z: 7100, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-allan-bezs-textil-mennyezeti-lampa', x: 1832, z: 1721, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-bonami-feher-sargarez-szinu-fali-lampa-roe-opviq-lights-1709356', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-bonami-feher-sargarez-szinu-fali-lampa-roe-opviq-lights-1709356', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-praktike-eglo-musurita-led-mennyezeti-lampa', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-bonami-sober-feher-szinu-sargarez-asztali-lampa-markslojd-1379517', x: 2180, z: 2850, label: 'Munkafény' },
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
    id: 'ljm2',
    name: 'JM2 – bambusz, rattan és len',
    note: 'Bambusz függeszték az étkező fölött, szövetgömb a nappali részen, bézs–sárgaréz len állólámpa; a hálóban rattan függeszték és fehér–sárgaréz opál falikarok; opál–sárgaréz asztali lámpa a dolgozóban.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-sinnerlig-fuggolampa-bambusz-kezze', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'pendant', productId: 'lamp-bonami-mellow-feher-fuggolampa-textil-bur', x: 1720, z: 5400, y: 2050, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-bezs-sargarez-szinu-len-allolampa-hajlithato-szerkez-1950744', x: 300, z: 7100, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'pendant', productId: 'lamp-ikea-narrkolv-fuggolampa-rattan-56-cm', x: 1832, z: 1721, y: 2080, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-bonami-feher-sargarez-szinu-opaluveg-fali-lampa-21x16x14-5-1951526', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-bonami-feher-sargarez-szinu-opaluveg-fali-lampa-21x16x14-5-1951526', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nosund-mennyezeti-lampa-nyir-44-cm', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-bonami-feher-sargarez-szinu-opaluveg-asztali-lampa-14-5x41-1951614', x: 2180, z: 2850, label: 'Munkafény' },
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
    id: 'ljm3',
    name: 'JM3 – opálgömb és sárgaréz sín',
    note: 'Opálüveg gömb az étkező fölött, bézs szövet mennyezeti lámpa a nappali részen, opál–sárgaréz állólámpa; a hálóban szövet mennyezeti lámpa és opál–sárgaréz asztali lámpák; sárgaréz opál lámpa az előszobában, sárgaréz spotsín a közlekedőben.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-bonami-serene-feher-fuggolampa-uveg-burav', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-allan-bezs-textil-mennyezeti-lampa', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-akterspring-allolampa-opalfeh-uveg-sargarez-bev-162-06-143-14', x: 300, z: 7100, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-allan-bezs-textil-mennyezeti-lampa', x: 1832, z: 1721, label: 'Általános fény' },
        { id: 'ej1', type: 'table', productId: 'lamp-bonami-feher-sargarez-szinu-opaluveg-asztali-lampa-14-5x41-1951614', x: 220, z: 440, label: 'Éjjeli lámpa' },
        { id: 'ej2', type: 'table', productId: 'lamp-bonami-feher-sargarez-szinu-opaluveg-asztali-lampa-14-5x41-1951614', x: 220, z: 3020, label: 'Éjjeli lámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-praktike-eglo-musurita-led-mennyezeti-lampa', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-ikea-tertial-asztali-lampa-sotetszurke', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-sargarez-szinu-opaluveg-mennyezeti-lampa-48-5x25-cm-1951268', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo', type: 'track', productId: 'lamp-ikea-barometer-mennyezeti-sin-5-spottal-sargarez-03-646-34', x: 420, z: 1660, rot: 90, label: 'Sín' },
      ],
    },
  },
  {
    id: 'ljm4',
    name: 'JM4 – juta és rattan',
    note: 'Juta henger az étkező fölött, szövetgömb a nappali részen, natúr szövetburás állólámpa; a hálóban sás mennyezeti lámpa és rattan asztali lámpák; bambusz asztali lámpa a dolgozóban.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-bonami-ano-natur-szinu-fuggolampa-textil', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'pendant', productId: 'lamp-bonami-mellow-feher-fuggolampa-textil-bur', x: 1720, z: 5400, y: 2050, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-natur-szinu-allolampa-textil-burav', x: 300, z: 7100, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-trubbrufse-mennyezeti-lampa-sas-45', x: 1832, z: 1721, label: 'Általános fény' },
        { id: 'ej1', type: 'table', productId: 'lamp-bonami-wala-rattan-asztali-lampa-magassag-35-cm-sulion-1443461', x: 220, z: 440, label: 'Éjjeli lámpa' },
        { id: 'ej2', type: 'table', productId: 'lamp-bonami-wala-rattan-asztali-lampa-magassag-35-cm-sulion-1443461', x: 220, z: 3020, label: 'Éjjeli lámpa' },
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
    id: 'ljp1',
    name: 'JP1 – papír és sás',
    note: 'Bézs papír függeszték az étkező fölött, krém papír mennyezeti lámpa a nappali részen, sötétszürke–natúr állólámpa; a hálóban papír függeszték és sás falikarok; papírzsinór asztali lámpa a dolgozóban; sás lámpák az előszobában és a közlekedőben.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-bonami-bezs-papir-fuggolampa-65-cm-selma-jotex-1942526', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-kremszinu-papir-mennyezeti-lampa-60-cm-monshi-jotex-1941712', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-sotetszurke-natur-szinu-allolampa', x: 300, z: 7100, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'pendant', productId: 'lamp-bonami-bezs-papir-fuggolampa-60-cm-siv-jotex-1942358', x: 1832, z: 1721, y: 2080, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-ikea-manalg-falilampa-sas-kezzel-keszult-04-838-92', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-ikea-manalg-falilampa-sas-kezzel-keszult-04-838-92', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nosund-mennyezeti-lampa-nyir-44-cm', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-bonami-natur-szinu-asztali-lampa-papir-zsinor-buraval-magas-1569860', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-trubbrufse-mennyezeti-lampa-sas-45', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-ikea-trubbrufse-mennyezeti-lampa-sas-45', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-ikea-trubbrufse-mennyezeti-lampa-sas-45', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
  {
    id: 'ljp2',
    name: 'JP2 – papír és antracit',
    note: 'Bézs–kőris függeszték az étkező fölött, krém papír mennyezeti lámpa a nappali részen, antracit kétfejű állólámpa; a hálóban sás mennyezeti lámpa és antracit falikarok; papír asztali lámpa a dolgozóban.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-sjomakt-fuggolampa-bezs-koris-38-c', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-kremszinu-papir-mennyezeti-lampa-60-cm-monshi-jotex-1941712', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-kloving-allolampa-antracit', x: 300, z: 7100, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-trubbrufse-mennyezeti-lampa-sas-45', x: 1832, z: 1721, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-ikea-nymane-fali-olvasolampa-antracit', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-ikea-nymane-fali-olvasolampa-antracit', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nymane-led-es-mennyezeti-lampa-ant', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-bonami-barna-kremszinu-papir-asztali-lampa-magassag-44-cm-m-1942376', x: 2180, z: 2850, label: 'Munkafény' },
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
    id: 'ljp3',
    name: 'JP3 – bambusz és papír',
    note: 'Bambusz függeszték az étkező fölött, bézs papír függeszték a nappali részen, fa lábú háromlábú állólámpa; a hálóban papír mennyezeti lámpa és bambusz falikarok; papírzsinór asztali lámpa a dolgozóban.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-bonami-natur-szinu-fuggolampa-bambusz-buraval-42-cm-rodi-bl-1292400', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'pendant', productId: 'lamp-bonami-bezs-papir-fuggolampa-60-cm-siv-jotex-1942358', x: 1720, z: 5400, y: 2050, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-tripod-wood-fekete-allolampa-fa-labakkal-zuiver-21629', x: 300, z: 7100, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-kremszinu-papir-mennyezeti-lampa-60-cm-monshi-jotex-1941712', x: 1832, z: 1721, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-ikea-varptross-falilampa-bambusz-30-cm-06-108-53', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-ikea-varptross-falilampa-bambusz-30-cm-06-108-53', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nosund-mennyezeti-lampa-nyir-44-cm', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-bonami-natur-szinu-asztali-lampa-papir-zsinor-buraval-magas-1569860', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-trubbrufse-mennyezeti-lampa-sas-45', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-ikea-trubbrufse-mennyezeti-lampa-sas-45', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-ikea-trubbrufse-mennyezeti-lampa-sas-45', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
  {
    id: 'ljp4',
    name: 'JP4 – rattan és papír',
    note: 'Rattan függeszték az étkező fölött, nagy papír függeszték a nappali részen, sötétszürke–natúr állólámpa; a hálóban sás mennyezeti lámpa és papír asztali lámpák; fekete–juta asztali lámpa a dolgozóban.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-narrkolv-fuggolampa-rattan-56-cm', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'pendant', productId: 'lamp-bonami-bezs-papir-fuggolampa-65-cm-selma-jotex-1942526', x: 1720, z: 5400, y: 2050, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-sotetszurke-natur-szinu-allolampa', x: 300, z: 7100, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-trubbrufse-mennyezeti-lampa-sas-45', x: 1832, z: 1721, label: 'Általános fény' },
        { id: 'ej1', type: 'table', productId: 'lamp-bonami-barna-kremszinu-papir-asztali-lampa-magassag-44-cm-m-1942376', x: 220, z: 440, label: 'Éjjeli lámpa' },
        { id: 'ej2', type: 'table', productId: 'lamp-bonami-barna-kremszinu-papir-asztali-lampa-magassag-44-cm-m-1942376', x: 220, z: 3020, label: 'Éjjeli lámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nymane-led-es-mennyezeti-lampa-ant', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-bonami-fekete-natur-szinu-asztali-lampa-juta-buraval-magass-1592182', x: 2180, z: 2850, label: 'Munkafény' },
      ],
      eloszoba: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-allan-bezs-textil-mennyezeti-lampa', x: 1400, z: 698, label: 'Előszoba' },
      ],
      kozlekedo: [
        { id: 'fo1', type: 'ceiling', productId: 'lamp-bonami-allan-bezs-textil-mennyezeti-lampa', x: 420, z: 900, label: 'Közlekedő' },
        { id: 'fo2', type: 'ceiling', productId: 'lamp-bonami-allan-bezs-textil-mennyezeti-lampa', x: 420, z: 2490, label: 'Közlekedő' },
      ],
    },
  },
  {
    id: 'ljp5',
    name: 'JP5 – bambusz, papír és bükk',
    note: 'Bambusz függeszték az étkező fölött, krém papír mennyezeti lámpa a nappali részen, bükk–fehér állólámpa; a hálóban papír függeszték és sás falikarok; kőris íróasztal-lámpa a dolgozóban.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-sinnerlig-fuggolampa-bambusz-kezze', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-kremszinu-papir-mennyezeti-lampa-60-cm-monshi-jotex-1941712', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-okensand-allolampa-bukk-feher-05-415-26', x: 300, z: 7100, label: 'Állólámpa' },
      ],
      halo: [
        { id: 'fo', type: 'pendant', productId: 'lamp-bonami-bezs-papir-fuggolampa-60-cm-siv-jotex-1942358', x: 1832, z: 1721, y: 2080, label: 'Általános fény' },
        { id: 'ol1', type: 'wall', productId: 'lamp-ikea-manalg-falilampa-sas-kezzel-keszult-04-838-92', x: 120, z: 470, y: 1150, label: 'Olvasólámpa' },
        { id: 'ol2', type: 'wall', productId: 'lamp-ikea-manalg-falilampa-sas-kezzel-keszult-04-838-92', x: 120, z: 3010, y: 1150, label: 'Olvasólámpa' },
      ],
      dolgozo: [
        { id: 'fo', type: 'ceiling', productId: 'lamp-ikea-nosund-mennyezeti-lampa-nyir-44-cm', x: 964, z: 1715, label: 'Általános fény' },
        { id: 'munka', type: 'table', productId: 'lamp-ikea-sjomakt-iroasztali-lampa-bezs-koris-05-956-66', x: 2180, z: 2850, label: 'Munkafény' },
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
    id: 'ljr1',
    name: 'JR1 – puha, rétegzett greige',
    note: 'Opálüveg gömb az étkező fölött, bézs szövet mennyezeti lámpa a nappali részen, pliszírozott szövetburás állólámpa; a hálóban szövet mennyezeti lámpa és falikarok. A greige falakhoz és a meglévő világos padlókhoz textil és opál, kemény kontraszt nélkül.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-bonami-serene-feher-fuggolampa-uveg-burav', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-allan-bezs-textil-mennyezeti-lampa', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-natur-szinu-allolampa-textil-burav', x: 300, z: 7100, label: 'Állólámpa' },
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
    id: 'ljr2',
    name: 'JR2 – natúr, könnyed',
    note: 'Bambusz függeszték az étkező fölött, szövetgömb a nappali részen, kőris lábú állólámpa; a hálóban fehér–nyír függeszték és szövetburás falikarok, a dolgozóban nyír mennyezeti lámpa. A zsályához és a világos tölgyhöz természetes anyagok, szórt fény.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-sinnerlig-fuggolampa-bambusz-kezze', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'pendant', productId: 'lamp-bonami-mellow-feher-fuggolampa-textil-bur', x: 1720, z: 5400, y: 2050, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-kinnahult-allolampa-koris-feher-15', x: 300, z: 7100, label: 'Állólámpa' },
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
    id: 'ljr3',
    name: 'JR3 – meleg, szórt fény a kakaóhoz',
    note: 'Bézs–kőris függeszték az étkező fölött, bézs szövet mennyezeti lámpa a nappali részen, sötétszürke–natúr szövetburás állólámpa; a hálóban rattan függeszték és szövet falikarok. A kakaó TV-fal és a travertin mellé meleg textil, fekete és króm nélkül.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-sjomakt-fuggolampa-bezs-koris-38-c', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'ceiling', productId: 'lamp-bonami-allan-bezs-textil-mennyezeti-lampa', x: 1720, z: 5400, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-sotetszurke-natur-szinu-allolampa', x: 300, z: 7100, label: 'Állólámpa' },
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
  {
    id: 'ljr4',
    name: 'JR4 – napfényes, fonott',
    note: 'Juta henger az étkező fölött, szövetgömb a nappali részen, natúr szövetburás állólámpa; a hálóban sás mennyezeti lámpa és juta éjjeli lámpák. A terrakotta lap és az agyagos falak mellé fonott anyagok és fehér opál.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-bonami-ano-natur-szinu-fuggolampa-textil', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'pendant', productId: 'lamp-bonami-mellow-feher-fuggolampa-textil-bur', x: 1720, z: 5400, y: 2050, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-bonami-natur-szinu-allolampa-textil-burav', x: 300, z: 7100, label: 'Állólámpa' },
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
    id: 'ljr5',
    name: 'JR5 – fekete, grafikus',
    note: 'Fekete kúpos függeszték az étkező fölött, fekete sín a nappali részen, antracit kétfejű állólámpa; a hálóban fekete–tölgy spotsor és antracit fali olvasólámpák; sínek az előszobában és a közlekedőben. A fekete ajtókhoz fekete lámpatestek.',
    rooms: {
      nappali: [
        { id: 'etk', type: 'pendant', productId: 'lamp-ikea-skurup-fuggolampa-fekete-38-cm', x: 1720, z: 2050, y: 1580, label: 'Étkező' },
        { id: 'fo', type: 'track', productId: 'lamp-praktike-eglo-easyt-szpot-szett-gu10-4x10w', x: 1720, z: 5400, rot: 90, label: 'Nappali rész' },
        { id: 'allo', type: 'floor', productId: 'lamp-ikea-kloving-allolampa-antracit', x: 300, z: 7100, label: 'Állólámpa' },
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
];
