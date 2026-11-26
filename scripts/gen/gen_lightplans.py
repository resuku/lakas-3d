# V0–V4 és LJ világítási tervek → src/data/lightPlans.ts (a termékazonosítók a lamps.json-ból ellenőrizve)
# Futtatás: MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W):/w" -w /w python:3.12-slim python -X utf8 scripts/gen/gen_lightplans.py
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from numbering import key, label, order
os.chdir(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))  # a tároló gyökere
L = {p['id']: p for p in json.load(open('src/data/products/lamps.json', encoding='utf-8'))['items']}

def pid(fragment):
    """Pontos azonosító, vagy egyértelmű részlet (a katalógusbővítés óta a rövid részletek többnyire nem egyértelműek)."""
    if fragment in L:
        return fragment
    hits = [k for k in L if fragment in k]
    assert len(hits) == 1, (fragment, hits)
    return hits[0]

RANARP = pid('lamp-ikea-ranarp-fuggolampa-fekete-38-cm'); SKURUP_P = pid('skurup-fuggo'); SINNERLIG = pid('lamp-ikea-sinnerlig-fuggolampa-bambusz-kezze'); NARRKOLV = pid('lamp-ikea-narrkolv-fuggolampa-rattan-56-cm')
MELLOW = pid('mellow'); NYMANE_C = pid('lamp-ikea-nymane-led-es-mennyezeti-lampa-ant'); KABOMBA = pid('kabomba'); BARLAST = pid('lamp-ikea-barlast-led-mennyezeti-falilampa-f')
NOSUND = pid('nosund'); TRUBB = pid('lamp-ikea-trubbrufse-mennyezeti-lampa-sas-45'); GONZALO = pid('gonzalo'); ALLAN = pid('allan'); LEANA = pid('leana2')
NYMANE_T = pid('lamp-ikea-nymane-mennyezeti-spot-4-antracit'); SKURUP_T = pid('skurup-mennyezeti-sin'); EASYT = pid('lamp-praktike-eglo-easyt-szpot-szett-gu10-4x10w'); ROGELIO = pid('lamp-praktike-rabalux-rogelio-mennyezeti-lampa-g')
NOXELLE = pid('lamp-praktike-rabalux-noxelle-mennyezeti-szpot-l'); ETNA = pid('etna')
MANIE_F = pid('allolampa-manie'); KLOVING = pid('kloving'); KINNAHULT = pid('kinnahult'); TRIPOD = pid('sotetszurke-natur')
MANIE_W = pid('fali-lampa-manie'); NYMANE_W = pid('lamp-ikea-nymane-fali-olvasolampa-antracit'); AMAR = pid('konnektorhoz')
TERTIAL = pid('tertial'); MONTAGNA = pid('lamp-bonami-fekete-natur-szinu-asztali-lampa-j'); TVARHAND = pid('tvarhand'); MANIE_T = pid('asztali-lampa-manie')

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
SERENE = pid('serene'); ANO = pid('ano-natur'); SJOMAKT = pid('lamp-ikea-sjomakt-fuggolampa-bezs-koris-38-c'); BUNKEFLO = pid('bunkeflo')
MUSURITA = pid('lamp-praktike-eglo-musurita-led-mennyezeti-lampa'); BENICARLO = pid('lamp-bonami-natur-szinu-allolampa-textil-burav'); SKOTTORP = pid('lamp-ikea-skottorp-skaftet-allolampa-ivelt-v')
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
# JR-javaslatok (2026-11-17, meglévő laminálttal): a hasonló színvilágú J-tervek termékeiből
JPLANS += [
    jplan('jr1', 'puha, rétegzett greige', 'Opálüveg gömb az étkező fölött, bézs szövet mennyezeti lámpa a nappali részen, pliszírozott szövetburás állólámpa; a hálóban szövet mennyezeti lámpa és falikarok. A greige falakhoz és a meglévő világos padlókhoz textil és opál, kemény kontraszt nélkül.',
          (P, SERENE), (C, ALLAN), BENICARLO, (C, ALLAN), ('wall', AMAR), (C, MUSURITA), ('table', TERTIAL), (C, ALLAN), (C, BARLAST)),
    jplan('jr2', 'natúr, könnyed', 'Bambusz függeszték az étkező fölött, szövetgömb a nappali részen, kőris lábú állólámpa; a hálóban fehér–nyír függeszték és szövetburás falikarok, a dolgozóban nyír mennyezeti lámpa. A zsályához és a világos tölgyhöz természetes anyagok, szórt fény.',
          (P, SINNERLIG), (P, MELLOW), KINNAHULT, (P, BUNKEFLO), ('wall', AMAR), (C, NOSUND), ('table', TERTIAL), (C, LEANA), (C, LEANA)),
    jplan('jr3', 'meleg, szórt fény a kakaóhoz', 'Bézs–kőris függeszték az étkező fölött, bézs szövet mennyezeti lámpa a nappali részen, sötétszürke–natúr szövetburás állólámpa; a hálóban rattan függeszték és szövet falikarok. A kakaó TV-fal és a travertin mellé meleg textil, fekete és króm nélkül.',
          (P, SJOMAKT), (C, ALLAN), TRIPOD, (P, NARRKOLV), ('wall', AMAR), (C, NYMANE_C), ('floor', KLOVING), (C, ALLAN), (C, LEANA)),
    jplan('jr4', 'napfényes, fonott', 'Juta henger az étkező fölött, szövetgömb a nappali részen, natúr szövetburás állólámpa; a hálóban sás mennyezeti lámpa és juta éjjeli lámpák. A terrakotta lap és az agyagos falak mellé fonott anyagok és fehér opál.',
          (P, ANO), (P, MELLOW), BENICARLO, (C, TRUBB), ('table', MONTAGNA), (C, NOSUND), ('table', TVARHAND), (C, MUSURITA), (C, BARLAST)),
    jplan('jr5', 'fekete, grafikus', 'Fekete kúpos függeszték az étkező fölött, fekete sín a nappali részen, antracit kétfejű állólámpa; a hálóban fekete–tölgy spotsor és antracit fali olvasólámpák; sínek az előszobában és a közlekedőben. A fekete ajtókhoz fekete lámpatestek.',
          (P, SKURUP_P), (T, EASYT), KLOVING, (T, NOXELLE), ('wall', NYMANE_W), (T, ROGELIO), ('table', PATRIK), (T, SKURUP_T), (T, EASYT)),
]
# JF-javaslatok (2026-11-26, fekete részletek): minden tervben fekete (vagy antracit) lámpatest, a kísérőanyag változik
# (opál, rattan, sárgaréz, opálüveg, minimál sín, plasztikus formák). Termékek a bővített lamps.json-ból.
BRUNSTA30 = pid('lamp-ikea-brunsta-havsdjup-fuggolampa-fekete-30-cm-95-755-66'); TAGARP = pid('tagarp')
NAVLINGE = pid('lamp-ikea-navlinge-led-es-iroasztallampa-fekete-04-044-22')
BERCESTE = pid('lamp-bonami-fekete-mennyezeti-lampa-fem-buraval-24-cm-berceste-o-1643956')
KAPPELAND45 = pid('lamp-ikea-kappeland-havsdjup-fuggolampa-fekete-rattan-45-cm-96-040-51')
KAPPELAND29 = pid('lamp-ikea-kappeland-havsdjup-fuggolampa-fekete-rattan-29-cm-96-172-92')
RATTAN70 = pid('lamp-bonami-fekete-mennyezeti-lampa-fem-rattan-buraval-10-5x70-c-1711478')
RATTAN28 = pid('lamp-bonami-fekete-mennyezeti-lampa-fem-rattan-buraval-10x28-cm-1711476')
TRIPOD_WOOD = pid('lamp-bonami-tripod-wood-fekete-allolampa-fa-labakkal-zuiver-21629')
PEAK_W = pid('lamp-bonami-fekete-fali-lampa-peak-markslojd'); JUTA_T = pid('lamp-bonami-fekete-natur-szinu-asztali-lampa-juta-buraval-magass-1592182')
PRIMA = pid('prima-gold'); OPSI = pid('lamp-bonami-matt-fekete-aranyszinu-fem-mennyezeti-lampa-opsi-nov-1938628'); CLOSY = pid('closy')
TRAMINO = pid('lamp-bonami-fekete-aranyszinu-fali-lampa-20-cm-tramino-opviq-lig-1643994')
GOLD_T = pid('fekete-aranyszinu-asztali'); GOLD_C = pid('lamp-bonami-fekete-aranyszinu-mennyezeti-lampa-fem-buraval-20-cm-1643978')
SAMBORD_P = pid('sambord-fuggolampa'); SAMBORD_F = pid('sambord-allo'); SAMBORD_T = pid('sambord-iroasztali')
RISE_C = pid('rise-markslojd-1540978'); RINGSTA_P = pid('ringsta-havsdjup'); PROFIL_W = pid('lamp-bonami-fekete-kremszinu-fali-lampa-18-cm-profil-opviq-light-1780756')
MILF = pid('feher-fekete-opaluveg-mennyezeti')
LENA = pid('lena-fekete'); FOLKBAT = pid('folkbat'); CREST_W = pid('crest-fekete-fali')
KVALLSDOPP = pid('kvallsdopp-havsdjup'); MARGOT = pid('margot'); DIONE_F = pid('allolampa-fem-buraval-dione')
JPLANS += [
    jplan('jf1', 'fekete kupolák, opál fény', 'Takarékos IKEA-terv: kis fekete kupola az étkező fölött, matt fekete opál LED-lámpa a nappali részen, fekete felfelé világító állólámpa; a hálóban ugyanaz a fekete opál lámpa és antracit fali olvasólámpák; a dolgozóban antracit LED-lámpa és fekete LED-es íróasztal-lámpa; az előszobában és a közlekedőben kis fekete fém mennyezeti lámpák.',
          (P, BRUNSTA30), (C, KABOMBA), TAGARP, (C, KABOMBA), ('wall', NYMANE_W), (C, NYMANE_C), ('table', NAVLINGE), (C, BERCESTE), (C, BERCESTE)),
    jplan('jf2', 'fekete fém és rattan', 'Fekete–rattan függeszték az étkező fölött, széles fekete–rattan mennyezeti lámpa a nappali részen, fekete burás, fa lábú háromlábú állólámpa; a hálóban kisebb fekete–rattan függeszték és fekete kúpos falikarok; a dolgozóban antracit LED-lámpa és fekete–juta asztali lámpa; az előszobában és a közlekedőben kis fekete–rattan lámpák. A mokka és a taupe mellé meleg fonott anyag.',
          (P, KAPPELAND45), (C, RATTAN70), TRIPOD_WOOD, (P, KAPPELAND29), ('wall', PEAK_W), (C, NYMANE_C), ('table', JUTA_T), (C, RATTAN28), (C, RATTAN28)),
    jplan('jf3', 'fekete és sárgaréz', 'Fekete–arany függeszték az étkező fölött, matt fekete–arany mennyezeti lámpa a nappali részen és a hálóban, fekete–arany állólámpa; a hálóban fekete–arany falikarok; a dolgozóban antracit LED-lámpa és fekete–arany asztali lámpa; az előszobában és a közlekedőben kis fekete–arany mennyezeti lámpák. Az olívához és a travertinhez meleg fémfény.',
          (P, PRIMA), (C, OPSI), CLOSY, (C, OPSI), ('wall', TRAMINO), (C, NYMANE_C), ('table', GOLD_T), (C, GOLD_C), (C, GOLD_C)),
    jplan('jf4', 'fekete és opálüveg', 'Háromfejű fekete–fehér függeszték az étkező fölött, fekete–opálüveg mennyezeti lámpa a nappali részen, fekete–fehér olvasó állólámpa; a hálóban fekete–fehér kupola és fekete–krém falikarok; a dolgozóban antracit LED-lámpa és fekete–fehér íróasztal-lámpa; az előszobában és a közlekedőben fehér–fekete opál mennyezeti lámpák. Klasszikus, „párizsias”.',
          (P, SAMBORD_P), (C, RISE_C), SAMBORD_F, (P, RINGSTA_P), ('wall', PROFIL_W), (C, NYMANE_C), ('table', SAMBORD_T), (C, MILF), (C, MILF)),
    jplan('jf5', 'minimál fekete sínek', 'Fekete kupola az étkező fölött, antracit 4 spotos spotsor a nappali részen, kétfejű fekete spot-állólámpa; a hálóban fekete sín és fekete falikarok; a dolgozóban fekete sín és LED-es íróasztal-lámpa; az előszobában antracit spotsor, a közlekedőben fekete sín. A sötét, tónusos falakhoz irányítható, falmosó fény.',
          (P, LENA), (T, NYMANE_T), FOLKBAT, (T, SKURUP_T), ('wall', CREST_W), (T, SKURUP_T), ('table', NAVLINGE), (T, NYMANE_T), (T, SKURUP_T)),
    jplan('jf6', 'plasztikus fekete formák', 'Nagy, 72 cm-es fekete kupola az étkező fölött, fekete fém mennyezeti lámpa a nappali részen, ívelt fekete állólámpa a kanapé fölé; a hálóban fekete kupola és Manie falikarok; a dolgozóban antracit LED-lámpa és Manie asztali lámpa; az előszobában fekete mennyezeti lámpa, a közlekedőben kis fekete lámpák. Kevés, de karakteres darab.',
          (P, KVALLSDOPP), (C, MARGOT), DIONE_F, (P, LENA), ('wall', MANIE_W), (C, NYMANE_C), ('table', MANIE_T), (C, MARGOT), (C, BERCESTE)),
]
# Stílusvonalak (2026-11-26): a JF7–JF12, JS1–JS5, JM1–JM4 és JP1–JP5 javaslatok világítása. Fekete: fekete lámpatestek;
# skandináv: fehér, nyír, kőris, opál; melegebb világos: sárgaréz, opál, textil; japandi: papír, sás, bambusz, rattan.
SELMA = pid('lamp-bonami-bezs-papir-fuggolampa-65-cm-selma-jotex-1942526')
SIV = pid('lamp-bonami-bezs-papir-fuggolampa-60-cm-siv-jotex-1942358')
MONSHI = pid('lamp-bonami-kremszinu-papir-mennyezeti-lampa-60-cm-monshi-jotex-1941712')
PAPER_T = pid('lamp-bonami-natur-szinu-asztali-lampa-papir-zsinor-buraval-magas-1569860')
PAPER_T2 = pid('lamp-bonami-barna-kremszinu-papir-asztali-lampa-magassag-44-cm-m-1942376')
VARPTROSS_W = pid('lamp-ikea-varptross-falilampa-bambusz-30-cm-06-108-53')
MANALG_W = pid('lamp-ikea-manalg-falilampa-sas-kezzel-keszult-04-838-92')
CAFE = pid('lamp-bonami-feher-opaluveg-fuggolampa-30x44-cm-cafe-nordlux-1951514')
AKTER_F = pid('lamp-ikea-akterspring-allolampa-opalfeh-uveg-sargarez-bev-162-06-143-14')
OKENSAND = pid('lamp-ikea-okensand-allolampa-bukk-feher-05-415-26')
OPAL_BRASS_P = pid('lamp-bonami-feher-sargarez-szinu-opaluveg-fuggolampa-54x41-5-cm-1951524')
BRASS_OPAL_C = pid('lamp-bonami-sargarez-szinu-opaluveg-mennyezeti-lampa-48-5x25-cm-1951268')
BRASS_TEXTIL_F = pid('lamp-bonami-kremszinu-sargarez-szinu-textil-allolampa-magassag-1-1941546')
ROE_W = pid('lamp-bonami-feher-sargarez-szinu-fali-lampa-roe-opviq-lights-1709356')
SOBER_T = pid('lamp-bonami-sober-feher-szinu-sargarez-asztali-lampa-markslojd-1379517')
OPAL_BRASS_W = pid('lamp-bonami-feher-sargarez-szinu-opaluveg-fali-lampa-21x16x14-5-1951526')
BAMBOO_P = pid('lamp-bonami-natur-szinu-fuggolampa-bambusz-buraval-42-cm-rodi-bl-1292400')
WALA_T = pid('lamp-bonami-wala-rattan-asztali-lampa-magassag-35-cm-sulion-1443461')
LEN_F = pid('lamp-bonami-bezs-sargarez-szinu-len-allolampa-hajlithato-szerkez-1950744')
OPAL_BRASS_T = pid('lamp-bonami-feher-sargarez-szinu-opaluveg-asztali-lampa-14-5x41-1951614')
OPAL_T = pid('lamp-bonami-bezs-opaluveg-asztali-lampa-27-5x21-cm-malti-nordlux-1951412')
BAROMETER = pid('lamp-ikea-barometer-mennyezeti-sin-5-spottal-sargarez-03-646-34')
SJOMAKT_T = pid('lamp-ikea-sjomakt-iroasztali-lampa-bezs-koris-05-956-66')
SJOMAKT_F = pid('lamp-ikea-sjomakt-allolampa-2-spottal-bezs-koris-05-956-67')
JPLANS += [
    # fekete/antracit vonal
    jplan('jf7', 'fekete kupola és fekete–rattan', 'Fekete kupola az étkező fölött, fekete–rattan függeszték a nappali részen és a hálóban, fekete felfelé világító állólámpa; antracit fali olvasólámpák, a dolgozóban antracit LED-lámpa és fekete íróasztal-lámpa; az előszobában fekete fém, a közlekedőben kis fekete–rattan lámpák.',
          (P, RANARP), (P, KAPPELAND45), TAGARP, (P, KAPPELAND29), ('wall', NYMANE_W), (C, NYMANE_C), ('table', NAVLINGE), (C, BERCESTE), (C, RATTAN28)),
    jplan('jf8', 'fekete kúp és sín', 'Fekete kúpos függeszték az étkező fölött, fekete spotsín a nappali részen, antracit kétfejű állólámpa; a hálóban matt fekete opál LED-lámpa és fekete kúpos falikarok; a dolgozóban Manie asztali lámpa; fekete mennyezeti lámpa az előszobában, sín a közlekedőben.',
          (P, SKURUP_P), (T, ETNA), KLOVING, (C, KABOMBA), ('wall', PEAK_W), (C, NYMANE_C), ('table', MANIE_T), (C, MARGOT), (T, SKURUP_T)),
    jplan('jf9', 'nagy fekete kupola, fekete és arany', 'Nagy, 72 cm-es fekete kupola az étkező fölött, matt fekete–arany mennyezeti lámpa a nappali részen, ívelt fekete állólámpa; a hálóban fekete mennyezeti lámpa és fekete–arany falikarok; a dolgozóban fekete–arany asztali lámpa. A sötét dió padlóhoz sok, meleg fény.',
          (P, KVALLSDOPP), (C, OPSI), DIONE_F, (C, MARGOT), ('wall', TRAMINO), (C, NYMANE_C), ('table', GOLD_T), (C, OPSI), (C, GOLD_C)),
    jplan('jf10', 'fekete–fehér, skandináv', 'Fekete kupola az étkező fölött, fehér–fekete üveg mennyezeti lámpa a nappali részen, fekete–fehér olvasó állólámpa; a hálóban fekete–fehér kupola és antracit falikarok; fehér–fekete opál lámpák az előszobában és a közlekedőben.',
          (P, BRUNSTA30), (C, RISE_C), SAMBORD_F, (P, RINGSTA_P), ('wall', NYMANE_W), (C, NYMANE_C), ('table', SAMBORD_T), (C, MILF), (C, MILF)),
    jplan('jf11', 'fekete fém és fonott anyag', 'Fekete–rattan függeszték az étkező fölött, széles fekete–rattan mennyezeti lámpa a nappali részen, sötétszürke–natúr szövetburás állólámpa; a hálóban sás mennyezeti lámpa és fekete Manie falikarok; fekete–juta asztali lámpa a dolgozóban; kis fekete–rattan lámpák az előszobában és a közlekedőben.',
          (P, KAPPELAND45), (C, RATTAN70), TRIPOD, (C, TRUBB), ('wall', MANIE_W), (C, NYMANE_C), ('table', JUTA_T), (C, RATTAN28), (C, RATTAN28)),
    jplan('jf12', 'fekete, arany és opál', 'Fekete–arany függeszték az étkező fölött, sárgaréz opálüveg mennyezeti lámpa a nappali részen, fekete–arany állólámpa; a hálóban matt fekete–arany mennyezeti lámpa és fekete–arany falikarok; kis fekete–arany lámpák az előszobában és a közlekedőben.',
          (P, PRIMA), (C, BRASS_OPAL_C), CLOSY, (C, OPSI), ('wall', TRAMINO), (C, NYMANE_C), ('table', GOLD_T), (C, GOLD_C), (C, GOLD_C)),
    # skandináv vonal
    jplan('js1', 'fehér és nyír', 'Fehér–nyír függeszték az étkező fölött, fehér–natúr LED-lámpa a nappali részen, kőris lábú állólámpa; a hálóban nyír mennyezeti lámpa és szürke asztali lámpák; nyír a dolgozóban, fehér LED-lámpák az előszobában és a közlekedőben.',
          (P, BUNKEFLO), (C, MUSURITA), KINNAHULT, (C, NOSUND), ('table', TERTIAL), (C, NOSUND), ('table', TERTIAL), (C, BARLAST), (C, BARLAST)),
    jplan('js2', 'opál és szövet', 'Fehér opálüveg függeszték az étkező fölött, szövetgömb a nappali részen, bükk–fehér állólámpa; a hálóban fehér–nyír függeszték és szövet falikarok; kőris íróasztal-lámpa a dolgozóban.',
          (P, CAFE), (P, MELLOW), OKENSAND, (P, BUNKEFLO), ('wall', AMAR), (C, NOSUND), ('table', SJOMAKT_T), (C, LEANA), (C, LEANA)),
    jplan('js3', 'bézs–kőris, hűvösebb fény', 'Bézs–kőris függeszték az étkező fölött, fehér–natúr LED-lámpa a nappali részen, ívelt, világosszürke burás állólámpa; a hálóban bézs szövet mennyezeti lámpa és antracit fali olvasólámpák; fehér LED-lámpák az előszobában és a közlekedőben.',
          (P, SJOMAKT), (C, MUSURITA), SKOTTORP, (C, ALLAN), ('wall', NYMANE_W), (C, GONZALO), ('table', TERTIAL), (C, BARLAST), (C, BARLAST)),
    jplan('js4', 'nyír, kőris és opál', 'Fehér–nyír függeszték az étkező fölött, nyír mennyezeti lámpa a nappali részen, kőris kétfejű állólámpa; a hálóban sás mennyezeti lámpa és bézs opál asztali lámpák; kőris íróasztal-lámpa a dolgozóban.',
          (P, BUNKEFLO), (C, NOSUND), SJOMAKT_F, (C, TRUBB), ('table', OPAL_T), (C, NOSUND), ('table', SJOMAKT_T), (C, LEANA), (C, LEANA)),
    jplan('js5', 'fekete–fehér kontraszt', 'Kis fekete kupola az étkező fölött, matt fekete opál LED-lámpa a nappali részen, fekete felfelé világító állólámpa; a hálóban fehér–nyír függeszték és antracit falikarok; fekete LED-es íróasztal-lámpa; fehér LED-lámpák az előszobában és a közlekedőben.',
          (P, BRUNSTA30), (C, KABOMBA), TAGARP, (P, BUNKEFLO), ('wall', NYMANE_W), (C, NYMANE_C), ('table', NAVLINGE), (C, BARLAST), (C, BARLAST)),
    # melegebb világos vonal
    jplan('jm1', 'sárgaréz és opál', 'Fehér–sárgaréz opálüveg függeszték az étkező fölött, sárgaréz opál mennyezeti lámpa a nappali részen, krém–sárgaréz textil állólámpa; a hálóban bézs szövet mennyezeti lámpa és fehér–sárgaréz falikarok; sárgaréz asztali lámpa a dolgozóban.',
          (P, OPAL_BRASS_P), (C, BRASS_OPAL_C), BRASS_TEXTIL_F, (C, ALLAN), ('wall', ROE_W), (C, MUSURITA), ('table', SOBER_T), (C, ALLAN), (C, LEANA)),
    jplan('jm2', 'bambusz, rattan és len', 'Bambusz függeszték az étkező fölött, szövetgömb a nappali részen, bézs–sárgaréz len állólámpa; a hálóban rattan függeszték és fehér–sárgaréz opál falikarok; opál–sárgaréz asztali lámpa a dolgozóban.',
          (P, SINNERLIG), (P, MELLOW), LEN_F, (P, NARRKOLV), ('wall', OPAL_BRASS_W), (C, NOSUND), ('table', OPAL_BRASS_T), (C, ALLAN), (C, LEANA)),
    jplan('jm3', 'opálgömb és sárgaréz sín', 'Opálüveg gömb az étkező fölött, bézs szövet mennyezeti lámpa a nappali részen, opál–sárgaréz állólámpa; a hálóban szövet mennyezeti lámpa és opál–sárgaréz asztali lámpák; sárgaréz opál lámpa az előszobában, sárgaréz spotsín a közlekedőben.',
          (P, SERENE), (C, ALLAN), AKTER_F, (C, ALLAN), ('table', OPAL_BRASS_T), (C, MUSURITA), ('table', TERTIAL), (C, BRASS_OPAL_C), (T, BAROMETER)),
    jplan('jm4', 'juta és rattan', 'Juta henger az étkező fölött, szövetgömb a nappali részen, natúr szövetburás állólámpa; a hálóban sás mennyezeti lámpa és rattan asztali lámpák; bambusz asztali lámpa a dolgozóban.',
          (P, ANO), (P, MELLOW), BENICARLO, (C, TRUBB), ('table', WALA_T), (C, NOSUND), ('table', TVARHAND), (C, ALLAN), (C, LEANA)),
    # japandi vonal
    jplan('jp1', 'papír és sás', 'Bézs papír függeszték az étkező fölött, krém papír mennyezeti lámpa a nappali részen, sötétszürke–natúr állólámpa; a hálóban papír függeszték és sás falikarok; papírzsinór asztali lámpa a dolgozóban; sás lámpák az előszobában és a közlekedőben.',
          (P, SELMA), (C, MONSHI), TRIPOD, (P, SIV), ('wall', MANALG_W), (C, NOSUND), ('table', PAPER_T), (C, TRUBB), (C, TRUBB)),
    jplan('jp2', 'papír és antracit', 'Bézs–kőris függeszték az étkező fölött, krém papír mennyezeti lámpa a nappali részen, antracit kétfejű állólámpa; a hálóban sás mennyezeti lámpa és antracit falikarok; papír asztali lámpa a dolgozóban.',
          (P, SJOMAKT), (C, MONSHI), KLOVING, (C, TRUBB), ('wall', NYMANE_W), (C, NYMANE_C), ('table', PAPER_T2), (C, ALLAN), (C, LEANA)),
    jplan('jp3', 'bambusz és papír', 'Bambusz függeszték az étkező fölött, bézs papír függeszték a nappali részen, fa lábú háromlábú állólámpa; a hálóban papír mennyezeti lámpa és bambusz falikarok; papírzsinór asztali lámpa a dolgozóban.',
          (P, BAMBOO_P), (P, SIV), TRIPOD_WOOD, (C, MONSHI), ('wall', VARPTROSS_W), (C, NOSUND), ('table', PAPER_T), (C, TRUBB), (C, TRUBB)),
    jplan('jp4', 'rattan és papír', 'Rattan függeszték az étkező fölött, nagy papír függeszték a nappali részen, sötétszürke–natúr állólámpa; a hálóban sás mennyezeti lámpa és papír asztali lámpák; fekete–juta asztali lámpa a dolgozóban.',
          (P, NARRKOLV), (P, SELMA), TRIPOD, (C, TRUBB), ('table', PAPER_T2), (C, NYMANE_C), ('table', JUTA_T), (C, ALLAN), (C, ALLAN)),
    jplan('jp5', 'bambusz, papír és bükk', 'Bambusz függeszték az étkező fölött, krém papír mennyezeti lámpa a nappali részen, bükk–fehér állólámpa; a hálóban papír függeszték és sás falikarok; kőris íróasztal-lámpa a dolgozóban.',
          (P, SINNERLIG), (C, MONSHI), OKENSAND, (P, SIV), ('wall', MANALG_W), (C, NOSUND), ('table', SJOMAKT_T), (C, LEANA), (C, LEANA)),
]
# a megjelenített szám és a sorrend: numbering.py (elöl a kiemelt javaslatok, a JR-javaslatok a végén)
PLANS += sorted(JPLANS, key=lambda p: order(p['id']))

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
