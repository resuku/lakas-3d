# V0–V4 és LJ világítási tervek → src/data/lightPlans.ts (a termékazonosítók a lamps.json-ból ellenőrizve)
# Futtatás: MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W):/w" -w /w python:3.12-slim python -X utf8 scripts/gen/gen_lightplans.py
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from numbering import NUM, key, label
os.chdir(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))  # a tároló gyökere
L = {p['id']: p for p in json.load(open('src/data/products/lamps.json', encoding='utf-8'))['items']}

def pid(fragment):
    hits = [k for k in L if fragment in k]
    assert len(hits) == 1, (fragment, hits)
    return hits[0]

RANARP = pid('ranarp'); SKURUP_P = pid('skurup-fuggo'); SINNERLIG = pid('sinnerlig'); NARRKOLV = pid('narrkolv')
MELLOW = pid('mellow'); NYMANE_C = pid('nymane-led-es-mennyezeti'); KABOMBA = pid('kabomba'); BARLAST = pid('barlast')
NOSUND = pid('nosund'); TRUBB = pid('trubbrufse'); GONZALO = pid('gonzalo'); ALLAN = pid('allan'); LEANA = pid('leana2')
NYMANE_T = pid('nymane-mennyezeti-spot'); SKURUP_T = pid('skurup-mennyezeti-sin'); EASYT = pid('easyt'); ROGELIO = pid('rogelio')
NOXELLE = pid('noxelle'); ETNA = pid('etna')
MANIE_F = pid('allolampa-manie'); KLOVING = pid('kloving'); KINNAHULT = pid('kinnahult'); TRIPOD = pid('sotetszurke-natur')
MANIE_W = pid('fali-lampa-manie'); NYMANE_W = pid('nymane-fali'); AMAR = pid('konnektorhoz')
TERTIAL = pid('tertial'); MONTAGNA = pid('fekete-natur-szinu-asztali'); TVARHAND = pid('tvarhand'); MANIE_T = pid('asztali-lampa-manie')

def fx(id, type, x, z, product=None, y=None, rot=None, label=None):
    o = {'id': id, 'type': type}
    if product: o['productId'] = product
    o['x'] = x; o['z'] = z
    if y is not None: o['y'] = y
    if rot is not None: o['rot'] = rot
    if label: o['label'] = label
    return o

# Felmért mennyezeti kiállások: nappali L-N2 (1720, 2050) étkező (a berendezési javaslat asztala fölött), L-N1 (1720, 5400) nappali rész;
# a nappali állólámpája (300, 7100) a kanapé erkély felőli végénél (data/furnishing.ts);
# háló L-H1 (1832, 1721); dolgozó L-D1 (964, 1715); előszoba L-E1 (1400, 698); közlekedő L-K1 (420, 2490).
# Az ágy feje a háló x0 falánál, z = 690–2790 mm; az olvasólámpák az ágy két oldalán.
PLANS = [
    {
        'id': 'v1-tervezoi', 'name': 'V1 – Tervezői koncepció (fekete részletek, sín)',
        'note': 'A lakberendezői műleírás szerint: 2700–3000 K mindenhol; nappali: fekete függeszték az étkezőasztal fölött, fekete sín spotokkal a nappali részen, a konszignáció Manie állólámpája; háló: rattan függeszték és két fekete olvasó falikar; dolgozó: általános LED fény és állítható olvasó állólámpa munkafénynek; előszoba és közlekedő: spotsor.',
        'rooms': {
            'nappali': [fx('etk', 'pendant', 1720, 2050, RANARP, y=1600, label='Étkező függeszték'), fx('sin', 'track', 1720, 5400, EASYT, rot=90, label='Nappali sín'), fx('allo', 'floor', 300, 7100, MANIE_F, label='Olvasó állólámpa')],
            'halo': [fx('fo', 'pendant', 1832, 1721, NARRKOLV, y=2080, label='Általános függeszték'), fx('ol1', 'wall', 120, 470, MANIE_W, y=1150, label='Olvasólámpa (ajtó felől)'), fx('ol2', 'wall', 120, 3010, MANIE_W, y=1150, label='Olvasólámpa (ablak felől)')],
            'dolgozo': [fx('fo', 'ceiling', 964, 1715, NYMANE_C, label='Általános fény'), fx('munka', 'floor', 2180, 2850, KLOVING, label='Munkafény')],
            'eloszoba': [fx('fo', 'track', 1400, 698, NYMANE_T, rot=0, label='Spotsor')],
            'kozlekedo': [fx('fo', 'track', 420, 1700, SKURUP_T, rot=90, label='Sín')],
        },
    },
    {
        'id': 'v2-egyszeru', 'name': 'V2 – Egyszerű: LED mennyezeti lámpák',
        'note': 'Minden kiálláson lapos, beépített LED-es mennyezeti lámpa (2700–3000 K), a nappaliban szövetburás állólámpa, a hálóban két éjjeli lámpa. Olcsó, könnyen karbantartható, egyenletes fény; kevésbé hangulatos.',
        'rooms': {
            'nappali': [fx('etk', 'ceiling', 1720, 2050, NYMANE_C, label='Étkező'), fx('fo', 'ceiling', 1720, 5400, NYMANE_C, label='Nappali rész'), fx('allo', 'floor', 300, 7100, KINNAHULT, label='Állólámpa')],
            'halo': [fx('fo', 'ceiling', 1832, 1721, KABOMBA, label='Általános fény'), fx('ej1', 'table', 220, 440, MONTAGNA, label='Éjjeli lámpa'), fx('ej2', 'table', 220, 3020, MONTAGNA, label='Éjjeli lámpa')],
            'dolgozo': [fx('fo', 'ceiling', 964, 1715, GONZALO, label='Általános fény'), fx('munka', 'table', 2180, 2850, TERTIAL, label='Munkafény (asztali)')],
            'eloszoba': [fx('fo', 'ceiling', 1400, 698, LEANA, label='Mennyezeti lámpa')],
            'kozlekedo': [fx('fo1', 'ceiling', 420, 900, BARLAST, label='Mennyezeti lámpa'), fx('fo2', 'ceiling', 420, 2490, BARLAST, label='Mennyezeti lámpa')],
        },
    },
    {
        'id': 'v3-natur', 'name': 'V3 – Hangulatos, natúr anyagok (függesztett)',
        'note': 'Szórt fényű, természetes anyagú burák: bambusz függeszték az étkező fölött, szövetgömb a nappali rész fölött (alsó éle 2,05 m), fa lábú szövetburás állólámpa; a hálóban sás mennyezeti lámpa és szövetburás falikarok; a dolgozóban nyír mennyezeti lámpa és asztali lámpa. Meleg, puha fény; a szórt burák a mennyezetet is megvilágítják.',
        'rooms': {
            'nappali': [fx('etk', 'pendant', 1720, 2050, SINNERLIG, y=1550, label='Étkező függeszték'), fx('fo', 'pendant', 1720, 5400, MELLOW, y=2050, label='Nappali függeszték'), fx('allo', 'floor', 300, 7100, TRIPOD, label='Állólámpa')],
            'halo': [fx('fo', 'ceiling', 1832, 1721, TRUBB, label='Általános fény'), fx('ol1', 'wall', 120, 470, AMAR, y=1200, label='Olvasólámpa'), fx('ol2', 'wall', 120, 3010, AMAR, y=1200, label='Olvasólámpa')],
            'dolgozo': [fx('fo', 'ceiling', 964, 1715, NOSUND, label='Általános fény'), fx('munka', 'table', 2180, 2850, TVARHAND, label='Asztali lámpa')],
            'eloszoba': [fx('fo', 'ceiling', 1400, 698, ALLAN, label='Mennyezeti lámpa')],
            'kozlekedo': [fx('fo1', 'ceiling', 420, 900, LEANA, label='Mennyezeti lámpa'), fx('fo2', 'ceiling', 420, 2490, LEANA, label='Mennyezeti lámpa')],
        },
    },
    {
        'id': 'v4-sines', 'name': 'V4 – Sínes, modern',
        'note': 'Irányítható spotok: a nappaliban két sín (a nappali részen 4 spot, az átmenetnél 3 spot) és fekete kúpos függeszték az étkező fölött; a hálóban fekete–tölgy spotsor és két fali olvasólámpa; a közlekedőben a teljes hosszon 192 cm-es sín. A spotok a falakat és a képeket emelik ki; egyenletes alapfényhez kevésbé alkalmas.',
        'rooms': {
            'nappali': [fx('etk', 'pendant', 1720, 2050, SKURUP_P, y=1600, label='Étkező függeszték'), fx('sin1', 'track', 1720, 5400, ETNA, rot=90, label='Sín – nappali rész'), fx('sin2', 'track', 1720, 3300, ROGELIO, rot=0, label='Sín – átmenet'), fx('allo', 'floor', 300, 7100, KLOVING, label='Olvasó állólámpa')],
            'halo': [fx('fo', 'track', 1832, 1721, NOXELLE, rot=0, label='Spotsor'), fx('ol1', 'wall', 120, 470, NYMANE_W, y=1150, label='Olvasólámpa'), fx('ol2', 'wall', 120, 3010, NYMANE_W, y=1150, label='Olvasólámpa')],
            'dolgozo': [fx('fo', 'track', 964, 1715, ROGELIO, rot=90, label='Spotsor'), fx('munka', 'table', 2180, 2850, MANIE_T, label='Asztali lámpa')],
            'eloszoba': [fx('fo', 'track', 1400, 698, SKURUP_T, rot=0, label='Sín')],
            'kozlekedo': [fx('fo', 'track', 420, 1660, EASYT, rot=90, label='Sín')],
        },
    },
]

# --- J-javaslatokhoz illesztett világítás ---
SERENE = pid('serene'); ANO = pid('ano-natur'); SJOMAKT = pid('sjomakt'); BUNKEFLO = pid('bunkeflo')
MUSURITA = pid('musurita'); BENICARLO = pid('natur-szinu-allolampa-textil'); SKOTTORP = pid('skottorp')
PATRIK = pid('patrik')

def jplan(jid, name, note, dining, lounge, floor, halo_main, halo_read, dol_main, dol_task, hall, corr):
    """Egységes elrendezés a felmért kiállásokra; a termékek a javaslat színvilágához választva.
    dining/lounge/halo_main/dol_main/hall: (típus, termék); halo_read: ('wall'|'table', termék);
    dol_task: ('floor'|'table', termék); corr: ('ceiling', termék) két lámpával vagy ('track', termék) eggyel."""
    def main(id, room_xz, spec, label, y_pend):
        t, p = spec
        x, z = room_xz
        extra = {'y': y_pend} if t == 'pendant' else {'rot': 90} if t == 'track' else {}
        return fx(id, t, x, z, p, label=label, **extra)
    rooms = {
        'nappali': [
            main('etk', (1720, 2050), dining, 'Étkező', 1580),
            main('fo', (1720, 5400), lounge, 'Nappali rész', 2050),
            fx('allo', 'floor', 300, 7100, floor, label='Állólámpa'),
        ],
        'halo': [main('fo', (1832, 1721), halo_main, 'Általános fény', 2080)]
        + ([fx('ol1', 'wall', 120, 470, halo_read[1], y=1150, label='Olvasólámpa'), fx('ol2', 'wall', 120, 3010, halo_read[1], y=1150, label='Olvasólámpa')]
           if halo_read[0] == 'wall' else
           [fx('ej1', 'table', 220, 440, halo_read[1], label='Éjjeli lámpa'), fx('ej2', 'table', 220, 3020, halo_read[1], label='Éjjeli lámpa')]),
        'dolgozo': [main('fo', (964, 1715), dol_main, 'Általános fény', 2080), fx('munka', dol_task[0], 2180, 2850, dol_task[1], label='Munkafény')],
        'eloszoba': [main('fo', (1400, 698), hall, 'Előszoba', 2080)],
        'kozlekedo': ([fx('fo1', 'ceiling', 420, 900, corr[1], label='Közlekedő'), fx('fo2', 'ceiling', 420, 2490, corr[1], label='Közlekedő')]
                      if corr[0] == 'ceiling' else [fx('fo', 'track', 420, 1660, corr[1], rot=90, label='Sín')]),
    }
    if lounge[0] == 'track':
        rooms['nappali'][1]['rot'] = 90
    if hall[0] == 'track':
        rooms['eloszoba'][0]['rot'] = 0
    return {'id': f'l{jid}', 'name': f'{label(jid)} – {name}', 'note': note, 'rooms': rooms}

C, P, T = 'ceiling', 'pendant', 'track'
JPLANS = [
    jplan('j1', 'natúr, könnyed', 'Bambusz függeszték az étkező fölött, szövetgömb a nappali részen, kőris lábú állólámpa; a hálóban fehér–nyír függeszték és szövetburás falikarok, a dolgozóban nyír mennyezeti lámpa. A zsálya és a világos tölgy mellé természetes anyagok, szórt fény.',
          (P, SINNERLIG), (P, MELLOW), KINNAHULT, (P, BUNKEFLO), ('wall', AMAR), (C, NOSUND), ('table', TERTIAL), (C, LEANA), (C, LEANA)),
    jplan('j2', 'puha, rétegzett semleges', 'Opálüveg gömb az étkező fölött, bézs szövet mennyezeti lámpa a nappali részen, pliszírozott szövetburás állólámpa; a hálóban szövet mennyezeti lámpa és falikarok. A greige alaphoz textil és opál, kemény kontraszt nélkül.',
          (P, SERENE), (C, ALLAN), BENICARLO, (C, ALLAN), ('wall', AMAR), (C, MUSURITA), ('table', TERTIAL), (C, ALLAN), (C, BARLAST)),
    jplan('j4', 'friss, opál és szürke', 'Fehér–nyír függeszték az étkező fölött, fekete-opál mennyezeti lámpa a nappali részen, világosszürke burás íves állólámpa; a hálóban fehér–nyír függeszték és antracit fali olvasólámpák. A kékesszürke kiemeléshez hűvösebb, letisztult formák.',
          (P, BUNKEFLO), (C, KABOMBA), SKOTTORP, (P, BUNKEFLO), ('wall', NYMANE_W), (C, NYMANE_C), ('table', TERTIAL), (C, BARLAST), (C, BARLAST)),
    jplan('j5', 'fekete kontraszt a mélyzöldhöz', 'Fekete kupola az étkező fölött (a TV-fal mélyzöldjéhez és a fekete TV-hez), szövetgömb a nappali részen, kőris állólámpa; a hálóban fehér–nyír függeszték és szövet falikarok.',
          (P, RANARP), (P, MELLOW), KINNAHULT, (P, BUNKEFLO), ('wall', AMAR), (C, NOSUND), ('table', TERTIAL), (C, LEANA), (C, LEANA)),
    jplan('j6', 'a lakberendező terve szerint', 'Azonos a V1 tervvel: fekete függeszték az étkező fölött, fekete sín spotokkal a nappali részen, Manie állólámpa; rattan függeszték és fekete falikarok a hálóban; spotsor az előszobában és a közlekedőben.',
          (P, RANARP), (T, EASYT), MANIE_F, (P, NARRKOLV), ('wall', MANIE_W), (C, NYMANE_C), ('floor', KLOVING), (T, NYMANE_T), (T, SKURUP_T)),
    jplan('j7', 'tervezői, lágyabban', 'Fekete függeszték az étkező fölött, 3 spotos fekete spotsor a nappali részen, Manie állólámpa; a hálóban rattan függeszték és Manie falikarok. A dió falpanelhez fekete részletek, de kevesebb sín, mint a V1-ben.',
          (P, RANARP), (T, ROGELIO), MANIE_F, (P, NARRKOLV), ('wall', MANIE_W), (C, NYMANE_C), ('floor', KLOVING), (C, LEANA), (C, LEANA)),
    jplan('j8', 'kávéházi melegség', 'Rattan függeszték az étkező fölött, szövetgömb a nappali részen, pliszírozott natúr állólámpa; a hálóban sás mennyezeti lámpa és juta éjjeli lámpák; az előszobában bézs szövet mennyezeti lámpa.',
          (P, NARRKOLV), (P, MELLOW), BENICARLO, (C, TRUBB), ('table', MONTAGNA), (C, NOSUND), ('table', TVARHAND), (C, ALLAN), (C, LEANA)),
    jplan('j9', 'meleg, szórt fény a mokkához', 'Bézs–kőris függeszték az étkező fölött, bézs szövet mennyezeti lámpa a nappali részen, sötétszürke–natúr szövetburás állólámpa; a hálóban rattan függeszték és szövet falikarok. A mokka TV-fal mellé meleg textil, fekete és króm nélkül.',
          (P, SJOMAKT), (C, ALLAN), TRIPOD, (P, NARRKOLV), ('wall', AMAR), (C, NYMANE_C), ('floor', KLOVING), (C, LEANA), (C, LEANA)),
    jplan('j10', 'napfényes, natúr', 'Juta henger az étkező fölött, szövetgömb a nappali részen, natúr szövetburás állólámpa; a hálóban sás mennyezeti lámpa és juta éjjeli lámpák. A terrakottához fonott anyagok és fehér opál.',
          (P, ANO), (P, MELLOW), BENICARLO, (C, TRUBB), ('table', MONTAGNA), (C, NOSUND), ('table', TVARHAND), (C, MUSURITA), (C, BARLAST)),
    jplan('j11', 'fekete részletek az olívához', 'Fekete kúpos függeszték az étkező fölött, fekete spotsor a nappali részen, Manie állólámpa; a hálóban bézs–kőris függeszték és Manie falikarok; a közlekedőben sín. Az olíva–dió kombinációhoz fekete fém.',
          (P, SKURUP_P), (T, ETNA), MANIE_F, (P, SJOMAKT), ('wall', MANIE_W), (T, ROGELIO), ('table', MANIE_T), (T, SKURUP_T), (T, EASYT)),
    jplan('j13', 'skandináv egyszerűség', 'Fehér–nyír függeszték az étkező fölött, fehér–natúr LED mennyezeti lámpa a nappali részen, kőris állólámpa; a hálóban nyír mennyezeti lámpa és szürke asztali lámpák. Világos fa és fehér, egyszerű formák.',
          (P, BUNKEFLO), (C, MUSURITA), KINNAHULT, (C, NOSUND), ('table', TERTIAL), (C, NOSUND), ('table', TERTIAL), (C, BARLAST), (C, BARLAST)),
    jplan('j14', 'meleg, vidám', 'Bambusz függeszték az étkező fölött, szövetgömb a nappali részen, kőris állólámpa; a hálóban sás mennyezeti lámpa és juta éjjeli lámpák. A mustár kiemeléshez natúr fonott és fehér opál.',
          (P, SINNERLIG), (P, MELLOW), KINNAHULT, (C, TRUBB), ('table', MONTAGNA), (C, NOSUND), ('table', TVARHAND), (C, LEANA), (C, LEANA)),
    jplan('j15', 'tónusos, puha', 'Bézs–kőris függeszték az étkező fölött, bézs szövet mennyezeti lámpák, sötétszürke–natúr állólámpa; a hálóban szövet mennyezeti lámpa és falikarok. A gombaszínekhez textil, csillogás nélkül.',
          (P, SJOMAKT), (C, ALLAN), TRIPOD, (C, ALLAN), ('wall', AMAR), (C, MUSURITA), ('table', TERTIAL), (C, ALLAN), (C, BARLAST)),
    jplan('j16', 'barackos, fonott', 'Juta henger az étkező fölött, rattan függeszték a nappali részen, natúr szövetburás állólámpa; a hálóban sás mennyezeti lámpa és juta éjjeli lámpák.',
          (P, ANO), (P, NARRKOLV), BENICARLO, (C, TRUBB), ('table', MONTAGNA), (C, NOSUND), ('table', TVARHAND), (C, LEANA), (C, LEANA)),
    jplan('j17', 'fekete, grafikus', 'Fekete kúpos függeszték az étkező fölött, fekete sín a nappali részen, antracit kétfejű állólámpa; a hálóban fekete–tölgy spotsor és antracit fali olvasólámpák; sínek az előszobában és a közlekedőben. A fekete ajtókhoz fekete lámpatestek.',
          (P, SKURUP_P), (T, EASYT), KLOVING, (T, NOXELLE), ('wall', NYMANE_W), (T, ROGELIO), ('table', PATRIK), (T, SKURUP_T), (T, EASYT)),
    jplan('j18', 'kakaó és bambusz', 'Bambusz függeszték az étkező fölött, szövetgömb a nappali részen, sötétszürke–natúr állólámpa; a hálóban rattan függeszték és szövet falikarok. A kakaó TV-fal és a karamell bársony mellé meleg, fonott anyagok.',
          (P, SINNERLIG), (P, MELLOW), TRIPOD, (P, NARRKOLV), ('wall', AMAR), (C, NYMANE_C), ('floor', KLOVING), (C, ALLAN), (C, LEANA)),
]
# a megjelenített szám és a sorrend: numbering.py (elöl a kiemelt javaslatok)
PLANS += sorted(JPLANS, key=lambda p: NUM[key(p['id'])])

def lit(v, ind):
    # TypeScript-literál a projekt stílusában (egyszeres idézőjel, idézőjel nélküli kulcsok)
    pad = '  ' * ind
    if isinstance(v, str):
        return "'" + v.replace('\\', '\\\\').replace("'", "\\'") + "'"
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, list):
        return '[\n' + ''.join(pad + '  ' + lit(x, ind + 1) + ',\n' for x in v) + pad + ']'
    if isinstance(v, dict):
        if 'type' in v:  # lámpa: egy sorban
            return '{ ' + ', '.join(f'{k}: {lit(x, ind)}' for k, x in v.items()) + ' }'
        key = lambda k: k if k.isidentifier() else lit(k, ind)
        return '{\n' + ''.join(f'{pad}  {key(k)}: {lit(x, ind + 1)},\n' for k, x in v.items()) + pad + '}'
    raise TypeError(v)

def ts(v, ind=1):
    return lit(v, ind)

body = ',\n  '.join(ts(p) for p in PLANS)
src = f"""import type {{ LightPlan }} from '../model/types';

// Kiinduló világítási tervek – javaslatok, nem döntések. Koordináták a helyiség saját rendszerében (mm).
// A V0 a felmért kiállások és helyőrzők helyén, termék nélkül mutatja a lámpákat; a V1–V4 valós termékekkel
// (src/data/products/lamps.json), a felmért mennyezeti kiállásokra építve.
export const DEFAULT_LIGHT_PLANS: LightPlan[] = [
  {{
    id: 'v0-felmert',
    name: 'V0 – Felmért helyek (általános lámpák)',
    note: 'A felmért mennyezeti kiállások és a helyőrző álló- és asztali lámpák, termék nélkül. A fényáram a fényjelenet beállításából jön.',
    rooms: {{}},
  }},
  {body},
];
"""
open('src/data/lightPlans.ts', 'w', encoding='utf-8', newline='\n').write(src)
print('ok')
