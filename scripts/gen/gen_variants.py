# J-javaslatok generálása a katalógusból (színek, lapméretek pontosan a termékadatokból) → src/data/variants.ts.
# A fájl J-blokkját teljesen újraírja; a J3 és J12 szándékosan hiányzik (a többi szám marad).
# Futtatás: MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W):/w" -w /w python:3.12-slim python -X utf8 scripts/gen/gen_variants.py
import json, os
os.chdir(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))  # a tároló gyökere

cat = {}
for name in ('paints', 'floors', 'doors', 'curtains', 'panels'):
    for it in json.load(open(f'src/data/products/{name}.json', encoding='utf-8'))['items']:
        cat[it['id']] = it

def hx(pid):
    return cat[pid]['hex']

OKAPI = 'panel-premiumlamellak-wow-f05-okapi'
C = {  # függönyök rövid nevei
    'annakajsa': 'curtain-ikea-annakajsa-sotetitofugg-bezs',
    'annakajsa-okker': 'curtain-ikea-annakajsa-sotetitofugg-sarga-barna',
    'vilborg': 'curtain-ikea-vilborg-sotetitofuggon-bezs',
    'dytag': 'curtain-ikea-dytag-fuggonypar-bezs',
    'korgmott': 'curtain-ikea-korgmott-fenyzaro-fugg-bezs',
    'sanela-bezs': 'curtain-ikea-sanela-fuggonypar-vilagosbezs',
    'austra': 'curtain-jysk-fuggony-austra-vilagosbarna',
    'leka': 'curtain-jysk-fenyzaro-fuggony-leka-meleg-szurke',
    'olympe': 'curtain-bonami-barna-barsony-fuggony-barna',
    'stockholm': 'curtain-ikea-stockholm-2025-attetsz-tortfeher',
    'hallebracka': 'curtain-ikea-hallebracka-attetszo-f-vilagosbezs',
    'rosenrobinia': 'curtain-ikea-rosenrobinia-attetszo-bezs',
    'silverlonn': 'curtain-ikea-silverlonn-attetszo-fu-feher',
    'unnen-homok': 'curtain-jysk-fuggony-unnen-homokszinu',
}
D = {
    'gleccser': 'door-ajtogyar-gleccser-feher',
    'szil': 'door-ajtogyar-spanyol-szil',
    'szil-zen': 'door-ajtogyar-spanyol-szil-zen-02-diszcsik',
    'mandula': 'door-ajtogyar-mandula-bezs',
    'kendal': 'door-ajtogyar-natural-kendal-tolgy',
    'alda': 'door-ajtogyar-alda-dio-tabak',
    'sherman': 'door-ajtogyar-sherman-antracit-tolgy',
    'kasmir': 'door-ajto-diszk-porta-cpl-1-1-kasmir-matt',
    'porta-dio': 'door-ajto-diszk-porta-cpl-1-1-termeszetes-di',
    'vektor': 'door-ajto-diszk-porta-vektor-e-feher',
    'charleston': 'door-ajtomester-charleston-tolgy',
    'prius': 'door-obi-prius-10-feher',
}

V = [
    dict(id='j1-zsalya', name='J1 – Zsálya fókusz, világos tölgy',
         note='Meleg, világos alap (Dulux Pirított szezám); a 2027-es Dulux év színe (Illatos somlyó) a nappali TV-falán és a háló ágy mögötti falán. Hosszú, széles világos tölgy (DIEGO EL2431). Fehér sima ajtók inox kilinccsel; natúr lenfüggöny (IKEA DYTÅG) törtfehér fátyollal. Nyugodt, természetes, nem köt egy stílushoz.',
         wall='dulux-1144047', acc={'nappali.x1': 'dulux-3177465', 'halo.x0': 'dulux-3177465'}, floor='diego-el2431',
         door='gleccser', handle='steel', curtain='dytag', sheer='stockholm', skirting=(80, 'wall'), textile='#D8CCB8'),
    dict(id='j2-greige', name='J2 – Tónusos greige, natúr tölgy',
         note='Világos greige falak (Dulux Izlandi reggel), mélyebb taupe kiemelés: nappali TV-fal Szabad part, háló ágyfal Bódító kardamon. Natúr tölgy (Parkettadiszkont K4420). Kasmír színű matt ajtók (Porta CPL) fekete kilinccsel, bézs sötétítő (IKEA VILBORG) világosbézs fátyollal. Meleg, rétegzett semleges.',
         wall='dulux-1975160', acc={'nappali.x1': 'dulux-3190956', 'halo.x0': 'dulux-1144056'}, floor='parkettadisz-k4420',
         door='kasmir', handle='black', curtain='vilborg', sheer='hallebracka', skirting=(80, 'door'), textile='#C9B79C'),
    dict(id='j4-kekesszurke', name='J4 – Kékesszürke nappali, meleg háló',
         note='Frissebb irány: semleges törtfehér (Dulux Ragyogó gyöngyház), a nappali TV-falán szürkéskék (Békés sodrás); az északi hálóba meleg greige (Gyapjú szőttes). Szürkés tölgy (Parkettadiszkont K2737). Fehér, vízszintesen mart ajtók (Porta Vektor) fekete kilinccsel, világos bézs függöny fehér fátyollal.',
         wall='dulux-1144045', acc={'nappali.x1': 'dulux-3190952', 'halo.x0': 'dulux-1144053'}, floor='parkettadisz-k2737',
         door='vektor', handle='black', curtain='korgmott', sheer='silverlonn', skirting=(80, 'white'), textile='#3D4A5E'),
    dict(id='j5-melyzold', name='J5 – Mélyzöld TV-fal (bátrabb)',
         note='A J1 alapja egy bátrabb nappalival: a TV-fal mélyzöld (Dulux Béka tutaj), így a kikapcsolt TV fekete felülete beleolvad; a háló ágyfala világos zöldesszürke (Füvészkert). Széles világos tölgy (K4423). Fehér ajtók sárgaréz kilinccsel, okkerbarna sötétítő (ANNAKAJSA). A modell a teljes falat színezi; a valóságban a TV-s falszakasz is elég.',
         wall='dulux-1144047', acc={'nappali.x1': 'dulux-2434218', 'halo.x0': 'dulux-2844408'}, floor='parkettadisz-k4423',
         door='gleccser', handle='brass', curtain='annakajsa-okker', sheer='stockholm', skirting=(80, 'wall'), textile='#C9A040'),
    # --- új javaslatok (meleg fókusz) ---
    dict(id='j6-tervezoi', name='J6 – A lakberendező terve (eredeti)',
         note='A lakberendezői konszignáció anyagai: Poli-Farbe Platinum Foltálló H5 Harmatos írisz falak, Okapi dió falpanel a TV-falon és az ágy mögött, QuickStep sötétbarna vászon tölgy vinyl, Ajtógyár Optima Spanyol Szil ajtók, IKEA ANNAKAJSA bézs sötétítő. Markáns, sötét, hangulatos – a sötét padló és a dió panel a déli fényben is sok fényt elnyel. A H5 színe a gyártói dobozképből; teszter kell.',
         wall='polifarbe-h5', acc={'nappali.x1': OKAPI, 'halo.x0': OKAPI}, wood=['nappali.x1', 'halo.x0'], floor='parkettaweba-sgmpc20330',
         door='szil', handle='black', curtain='annakajsa', sheer=None, skirting=(80, 'door'), textile='#4A4038'),
    dict(id='j7-tervezoi-vilagos', name='J7 – Tervezői hangulat, világosabban',
         note='A J6 lágyabb változata: a dió falpanel csak a nappali TV-falán marad, a háló ágyfala meleg taupe festés (Dulux Zarándok útja); a padló meleg középtónusú tölgy (Parkettadiszkont Aviva Vernal), a falak világos meleg fehérek (Dulux Igazgyöngy). Spanyol Szil ajtók díszcsíkkal (ZEN-02), fekete kilincs, világosbézs bársonyfüggöny (IKEA SANELA) fátyollal.',
         wall='dulux-1452155', acc={'nappali.x1': OKAPI, 'halo.x0': 'dulux-1356829'}, wood=['nappali.x1'], floor='parkettadisz-k2752',
         door='szil-zen', handle='black', curtain='sanela-bezs', sheer='stockholm', skirting=(80, 'door'), textile='#8C6E55'),
    dict(id='j8-karamell', name='J8 – Karamell és krém',
         note='Krémes falak (Dulux Papirusz tekercs), karamell kiemelés a nappaliban (Fűszeres nektár), fahéjszín a hálóban (Illatos fahéj). Mézes gesztenye tölgy (DIEGO Atlantic Tawny Chestnut), meleg tölgy ajtók (Charleston), sárgaréz kilincs, okkerbarna sötétítő. Nagyon meleg, „kávéházi” hangulat; világos és barna kanapé is illik hozzá.',
         wall='dulux-1452171', acc={'nappali.x1': 'dulux-2434265', 'halo.x0': 'dulux-1144057'}, floor='diego-5537',
         door='charleston', handle='brass', curtain='annakajsa-okker', sheer='hallebracka', skirting=(80, 'door'), textile='#E8DCC8'),
    dict(id='j9-mokka', name='J9 – Mokka TV-fal, diószín ajtók',
         note='Gyapjúszín falak (Dulux Gyapjú szőttes) és mély mokkabarna TV-fal (Dulux 30YR 12/122, keverve) – a tervező sötét irányát festéssel, falpanel nélkül hozza. A háló ágyfala tölgyháncs (Tölgyfa háncs). Füstös natúr tölgy padló (DIEGO Smoke Olchon), dió ajtók (Alda dió tabak), fekete kilincs, világos bársonyfüggöny.',
         wall='dulux-1144053', acc={'nappali.x1': 'dulux-3177461', 'halo.x0': 'dulux-1452179'}, floor='diego-el2858',
         door='alda', handle='black', curtain='sanela-bezs', sheer='rosenrobinia', skirting=(80, 'wall'), textile='#CDBBA6'),
    dict(id='j10-terrakotta', name='J10 – Terrakotta naplemente (bátrabb)',
         note='Meleg törtfehér alap (Dulux Gyantás bor), a nappali TV-falán tompa rozsda-terrakotta (Dulux 50YR 21/318, keverve), a hálóban púderes agyag (Púder pamacs). Natúr tölgy (K4420), fehér ajtók sárgaréz kilinccsel, natúr lenfüggöny fátyollal. Mediterrán, napos hatás; esti fényben mélyebb.',
         wall='dulux-1144048', acc={'nappali.x1': 'dulux-3177463', 'halo.x0': 'dulux-2434268'}, floor='parkettadisz-k4420',
         door='gleccser', handle='brass', curtain='dytag', sheer='stockholm', skirting=(80, 'wall'), textile='#C9A07A'),
    dict(id='j11-oliva-dio', name='J11 – Olíva és dió',
         note='Vajszínű falak (Trilak Dán keksz), mély olíva TV-fal (Dulux 45YY 20/168, keverve), a hálóban világos khaki (47YY 40/227). Diópadló (Parkettadiszkont Lago dió) és dió ajtók (Porta CPL Természetes dió), fekete kilincs, lenfüggöny. Földközeli, nyugodt; a zöld és a barna bútorokkal is könnyen párosítható.',
         wall='trilak-dan-keksz', acc={'nappali.x1': 'dulux-3177482', 'halo.x0': 'dulux-3177476'}, floor='parkettadisz-k2596',
         door='porta-dio', handle='black', curtain='dytag', sheer='hallebracka', skirting=(80, 'door'), textile='#D8C9A8'),
    dict(id='j13-skandinav', name='J13 – Skandináv meleg (legsemlegesebb)',
         note='Mézes fehér falak kiemelés nélkül (Dulux Mézes halva), világos tölgy padló (DIEGO Light Baronia Oak), natúr tölgy ajtók (Ajtógyár Optima Natural Kendal), inox kilincs, világos bézs függöny fehér fátyollal. A legkevésbé kötött alap: bármilyen bútor és későbbi kiemelés mehet rá.',
         wall='dulux-1144050', acc={}, floor='diego-el2132',
         door='kendal', handle='steel', curtain='korgmott', sheer='silverlonn', skirting=(80, 'wall'), textile='#E9E1D3'),
    dict(id='j14-okker', name='J14 – Okker kiemelés, natúr tölgy',
         note='Világos meleg fehér (Pirított szezám), a nappali TV-falán tompa mustár (Dulux Mustár mag), a hálóban barackos krém (Szikrázó napkelte). Natúr tölgy (Parkettadiszkont Sundance Oak), fehér ajtók sárgaréz kilinccsel, lenfüggöny. Vidám, de nem harsány; szürke vagy barna kanapéval is működik.',
         wall='dulux-1144047', acc={'nappali.x1': 'dulux-2539475', 'halo.x0': 'dulux-1144071'}, floor='parkettadisz-k326',
         door='gleccser', handle='brass', curtain='dytag', sheer='stockholm', skirting=(80, 'wall'), textile='#7A6A4F'),
    dict(id='j15-gomba', name='J15 – Gomba, tónus a tónusban',
         note='Egyszínű, „beburkolt” hatás: gombaszín falak (Dulux Mester vászon), egy árnyalattal mélyebb kiemelés (Tölgyfa háncs a nappaliban, Agyag korsó a hálóban), szürkésbarna tölgy (Mushroom Carpenter Oak), kasmír ajtók, fekete kilincs, taupe bársonyfüggöny (JYSK AUSTRA). Elegáns, nyugodt, nem fehér – a szegély falszínű.',
         wall='dulux-1452163', acc={'nappali.x1': 'dulux-1452179', 'halo.x0': 'dulux-2434266'}, floor='parkettadisz-k478',
         door='kasmir', handle='black', curtain='austra', sheer='hallebracka', skirting=(80, 'wall'), textile='#B8A79A'),
    dict(id='j16-barack', name='J16 – Barackfény',
         note='Lágy barackos krém falak (Dulux Szikrázó napkelte), a nappaliban fahéj (Illatos fahéj), a hálóban gyömbér (Gyömbér cseppek). Széles, világos-meleg tölgy (K4423), fehér ajtók, sárgaréz kilincs, bézs sötétítő fátyollal. Napos, barátságos; az északi hálót melegíti.',
         wall='dulux-1144071', acc={'nappali.x1': 'dulux-1144057', 'halo.x0': 'dulux-1459681'}, floor='parkettadisz-k4423',
         door='gleccser', handle='brass', curtain='vilborg', sheer='rosenrobinia', skirting=(80, 'white'), textile='#E3C7A8'),
    dict(id='j17-kontraszt', name='J17 – Meleg fehér, fekete ajtók, konyakos tölgy',
         note='Kontrasztos modern, de meleg: krémfehér falak (Gyantás bor), homok TV-fal (Bengáli ösvény), meleg szürkésbarna háló ágyfal (Dulux 62YR 22/051, keverve). Konyakszínű tölgy (DIEGO Cognac Brown Sherman Oak), antracit tölgy ajtók (Ajtógyár Sherman) fekete kilinccsel, meleg szürke sötétítő fehér fátyollal.',
         wall='dulux-1144048', acc={'nappali.x1': 'dulux-1144118', 'halo.x0': 'dulux-3177472'}, floor='diego-el2402',
         door='sherman', handle='black', curtain='leka', sheer='silverlonn', skirting=(80, 'door'), textile='#2F2B28'),
    dict(id='j18-kakao', name='J18 – Kakaó TV-fal, világos tölgy',
         note='A tervező sötét-meleg hangulata világos padlóval: meleg fehér falak (Igazgyöngy), mély kakaóbarna TV-fal (Dulux 48YR 09/077, keverve), paliszander háló ágyfal (Meleg paliszander). Mézes tölgy (Aviva Vernal), natúr tölgy ajtók, fekete kilincs, karamell bársonyfüggöny (Bonami Olympe – karikás, rúd kell) fátyollal.',
         wall='dulux-1452155', acc={'nappali.x1': 'dulux-3177471', 'halo.x0': 'dulux-3177462'}, floor='parkettadisz-k2752',
         door='kendal', handle='black', curtain='olympe', sheer='hallebracka', skirting=(80, 'wall'), textile='#D9C7B0'),
]

def ts(v):
    fl = cat[v['floor']]
    plank = f", plank: {{ l: {fl['size']['l']}, w: {fl['size']['w']} }}" if fl.get('size') else ''
    door = cat[D[v['door']]]
    cur = cat[C[v['curtain']]]
    sheer_only = v.get('sheerOnly', False)
    sh = cat[C[v['sheer']]] if v.get('sheer') else None
    accents = ', '.join(f"'{k}': '{hx(p)}'" for k, p in v['acc'].items())
    prods = {'wall': v['wall'], 'ceiling': 'polifarbe-b15'}
    prods.update({f'accent:{k}': p for k, p in v['acc'].items()})
    prods.update({'floor': v['floor'], 'door': D[v['door']], 'curtain': C[v['curtain']]})
    if sh:
        prods['sheer'] = C[v['sheer']]
    pr = ', '.join(f"{k if k.isidentifier() else repr(k)}: '{p}'" for k, p in prods.items())
    curtain = f"{{ on: true, color: '{cur['hex']}', sheer: {str(sheer_only).lower()}, span: 'wall', length: 'floor', closed: false" + (f", sheerLayer: '{sh['hex']}'" if sh else '') + ' }'
    wood = f"\n    accentWood: {json.dumps(v['wood'])}," if v.get('wood') else ''
    note = v['note'].replace("'", "\\'")
    return f"""  {{
    id: '{v['id']}',
    lightPlanId: 'l{v['id'].split('-')[0]}',
    name: '{v['name']}',
    note: '{note}',
    wall: '{hx(v['wall'])}',
    wallFinish: 'matt',
    accents: {{ {accents} }},{wood}
    ceiling: '{hx('polifarbe-b15')}',
    floor: {{ pattern: '{fl['pattern']}', tone: '{fl['hex']}', dir: 'z'{plank} }},
    door: '{door['hex']}',
    doorStyle: '{door['style']}',
    handle: '{v['handle']}',
    skirting: {{ h: {v['skirting'][0]}, mode: '{v['skirting'][1]}' }},
    curtain: {curtain},
    wardrobeFront: 'mirror',
    textile: '{v['textile']}',
    doorLeafOptional: true,
    products: {{ {pr} }},
  }},"""

p = 'src/data/variants.ts'
s = open(p, encoding='utf-8').read()
head = s[: s.index("  // Javaslatok valós katalógustermékekkel")]
body = '\n'.join(ts(v) for v in V)
s = head + """  // Javaslatok valós katalógustermékekkel (2026-11-01): fal, mennyezet, padló, ajtó és függöny – „kész”,
  // berendezetlen állapot. Az ágytextil általános szín; az opcionális dolgozóajtó-lap mindegyikben be van kapcsolva.
  // A padló lakásszintű (DD-006: a háló, nappali és dolgozó laminált padlója egységesen cserélődik).
  // A színek és a lapméretek a hozzárendelt katalógustermékek adataiból származnak.
""" + body + '\n];\n'
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print(len(V), 'javaslat')
