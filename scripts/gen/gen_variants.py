# J-javaslatok generálása a katalógusból (színek, lapméretek pontosan a termékadatokból) → src/data/variants.ts.
# A fájl J-blokkját teljesen újraírja. A megjelenített szám és a sorrend a numbering.py-ból jön (elöl a kiemelt javaslatok);
# a `name` itt szám nélküli cím, a leírásban {j5} alakban hivatkozhatók más javaslatok. A J3 és J12 (halszálka) törölve.
# Futtatás: MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W):/w" -w /w python:3.12-slim python -X utf8 scripts/gen/gen_variants.py
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from numbering import key, label, order, refs
os.chdir(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))  # a tároló gyökere

cat = {}
for name in ('paints', 'floors', 'floors-existing', 'doors', 'curtains', 'panels'):
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
    # 2026-11-26: a stílusvonalak új javaslataihoz
    'dytag-zold': 'curtain-ikea-dytag-fuggonypar-szurke-zold',
    'barsony-krem': 'curtain-bonami-kremszinu-barsony-dimout-reszleges-sotetito-fuggony-140x245-cm-pleat-restilo',
    'barsony-barnabezs': 'curtain-bonami-barna-bezs-barsony-dimout-reszleges-sotetito-fuggony-140x270-cm-pleat-restilo',
    'storavan': 'curtain-jysk-fuggony-storavan-140x300-natur',
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
    # fekete/antracit ajtók (JF-javaslatok, 2026-11-26-i katalógusbővítés)
    'fresh-fekete': 'door-ajtogyar-pascal-fresh-matt-fekete-391',
    'loretto-grafit': 'door-ajtogyar-pascal-loretto-matt-gafit-375',
    'jola-szaten-antracit': 'door-jola-szat-n-antracit-flat',
    'jola-thermo': 'door-jola-thermo-t-lgy-flat',
    'jola-fekete-mart': 'door-jola-fekete-groove',
    # 2026-11-26: a stílusvonalak új javaslataihoz
    'jola-fekete': 'door-jola-fekete-flat',
    'loretto-fekete': 'door-ajtogyar-pascal-loretto-matt-fekete-391',
    'haptic-fekete': 'door-ajtogyar-pol-skone-haptic-feket-644',
    'haptic-grafit': 'door-ajtogyar-pol-skone-haptic-grafit-640',
    'egett-fa': 'door-ajtogyar-full-doors-tele-es-uvegezett-egett-fa-egetet-fa-lamitex-1960',
    'jola-palladium': 'door-jola-pall-dium-sz-rke-flat',
    'feher-len': 'door-ajtogyar-pascal-optima-feher-len-f4232',
    'kaya-skandi-tolgy': 'door-obi-kaya-teli-skandinav-tolgy',
    'polar-aland': 'door-jola-sos-cpl-polar-aland-fenyo',
    'jola-natur-tolgy': 'door-jola-dekor-plus-natur-tolgy',
    'sonoma-greko': 'door-jola-alfold-e-dekor-sonoma-greko',
    'bardolino': 'door-ajtogyar-pascal-optima-natur-bardolino-tolgy-h1145',
    'cegled-homokbezs': 'door-jola-cegled-femintarzias-cpl-homokbezs',
    'haptic-bezs': 'door-ajtogyar-pol-skone-haptic-bezs-643',
    'lorenzo-tolgy': 'door-ajtogyar-pascal-optima-lorenzo-tolgy-h3146',
    'jola-antracit-tolgy': 'door-jola-antracit-t-lgy-flat',
    'molina-koris': 'door-ajtogyar-pascal-optima-molina-homok-koris-h1267',
    'meszes-tolgy': 'door-jola-kisber-dekorfolias-meszes-tolgy',
    'halifax-tolgy': 'door-ajtogyar-pascal-optima-halifax-feher-tolgy-h1176',
}

V = [
    dict(id='j1-zsalya', name='Zsálya fókusz, világos tölgy',
         note='Meleg, világos alap (Dulux Pirított szezám); a 2027-es Dulux év színe (Illatos somlyó) a nappali TV-falán és a háló ágy mögötti falán. Hosszú, széles világos tölgy (DIEGO EL2431). Fehér sima ajtók inox kilinccsel; natúr lenfüggöny (IKEA DYTÅG) törtfehér fátyollal. Nyugodt, természetes, nem köt egy stílushoz.',
         wall='dulux-1144047', acc={'nappali.x1': 'dulux-3177465', 'halo.x0': 'dulux-3177465'}, floor='diego-el2431',
         door='gleccser', handle='steel', curtain='dytag', sheer='stockholm', skirting=(80, 'wall'), textile='#D8CCB8'),
    dict(id='j2-greige', name='Tónusos greige, natúr tölgy',
         note='Világos greige falak (Dulux Izlandi reggel), mélyebb taupe kiemelés: nappali TV-fal Szabad part, háló ágyfal Bódító kardamon. Natúr tölgy (Parkettadiszkont K4420). Kasmír színű matt ajtók (Porta CPL) fekete kilinccsel, bézs sötétítő (IKEA VILBORG) világosbézs fátyollal. Meleg, rétegzett semleges.',
         wall='dulux-1975160', acc={'nappali.x1': 'dulux-3190956', 'halo.x0': 'dulux-1144056'}, floor='parkettadisz-k4420',
         door='kasmir', handle='black', curtain='vilborg', sheer='hallebracka', skirting=(80, 'door'), textile='#C9B79C'),
    dict(id='j4-kekesszurke', name='Kékesszürke nappali, meleg háló',
         note='Frissebb irány: semleges törtfehér (Dulux Ragyogó gyöngyház), a nappali TV-falán szürkéskék (Békés sodrás); az északi hálóba meleg greige (Gyapjú szőttes). Szürkés tölgy (Parkettadiszkont K2737). Fehér, vízszintesen mart ajtók (Porta Vektor) fekete kilinccsel, világos bézs függöny fehér fátyollal.',
         wall='dulux-1144045', acc={'nappali.x1': 'dulux-3190952', 'halo.x0': 'dulux-1144053'}, floor='parkettadisz-k2737',
         door='vektor', handle='black', curtain='korgmott', sheer='silverlonn', skirting=(80, 'white'), textile='#3D4A5E'),
    dict(id='j5-melyzold', name='Mélyzöld TV-fal (bátrabb)',
         note='A {j1} alapja egy bátrabb nappalival: a TV-fal mélyzöld (Dulux Béka tutaj), így a kikapcsolt TV fekete felülete beleolvad; a háló ágyfala világos zöldesszürke (Füvészkert). Széles világos tölgy (K4423). Fehér ajtók sárgaréz kilinccsel, okkerbarna sötétítő (ANNAKAJSA). A modell a teljes falat színezi; a valóságban a TV-s falszakasz is elég.',
         wall='dulux-1144047', acc={'nappali.x1': 'dulux-2434218', 'halo.x0': 'dulux-2844408'}, floor='parkettadisz-k4423',
         door='gleccser', handle='brass', curtain='annakajsa-okker', sheer='stockholm', skirting=(80, 'wall'), textile='#C9A040'),
    # --- új javaslatok (meleg fókusz) ---
    dict(id='j6-tervezoi', name='A lakberendező terve (eredeti)',
         note='A lakberendezői konszignáció anyagai: Poli-Farbe Platinum Foltálló H5 Harmatos írisz falak, Okapi dió falpanel a TV-falon és az ágy mögött, QuickStep sötétbarna vászon tölgy vinyl, Ajtógyár Optima Spanyol Szil ajtók, IKEA ANNAKAJSA bézs sötétítő. Markáns, sötét, hangulatos – a sötét padló és a dió panel a déli fényben is sok fényt elnyel. A H5 színe a gyártói dobozképből; teszter kell.',
         wall='polifarbe-h5', acc={'nappali.x1': OKAPI, 'halo.x0': OKAPI}, wood=['nappali.x1', 'halo.x0'], floor='parkettaweba-sgmpc20330',
         door='szil', handle='black', curtain='annakajsa', sheer=None, skirting=(80, 'door'), textile='#4A4038'),
    dict(id='j7-tervezoi-vilagos', name='Tervezői hangulat, világosabban',
         note='A {j6} lágyabb változata: a dió falpanel csak a nappali TV-falán marad, a háló ágyfala meleg taupe festés (Dulux Zarándok útja); a padló meleg középtónusú tölgy (Parkettadiszkont Aviva Vernal), a falak világos meleg fehérek (Dulux Igazgyöngy). Spanyol Szil ajtók díszcsíkkal (ZEN-02), fekete kilincs, világosbézs bársonyfüggöny (IKEA SANELA) fátyollal.',
         wall='dulux-1452155', acc={'nappali.x1': OKAPI, 'halo.x0': 'dulux-1356829'}, wood=['nappali.x1'], floor='parkettadisz-k2752',
         door='szil-zen', handle='black', curtain='sanela-bezs', sheer='stockholm', skirting=(80, 'door'), textile='#8C6E55'),
    dict(id='j8-karamell', name='Karamell és krém',
         note='Krémes falak (Dulux Papirusz tekercs), karamell kiemelés a nappaliban (Fűszeres nektár), fahéjszín a hálóban (Illatos fahéj). Mézes gesztenye tölgy (DIEGO Atlantic Tawny Chestnut), meleg tölgy ajtók (Charleston), sárgaréz kilincs, okkerbarna sötétítő. Nagyon meleg, „kávéházi” hangulat; világos és barna kanapé is illik hozzá.',
         wall='dulux-1452171', acc={'nappali.x1': 'dulux-2434265', 'halo.x0': 'dulux-1144057'}, floor='diego-5537',
         door='charleston', handle='brass', curtain='annakajsa-okker', sheer='hallebracka', skirting=(80, 'door'), textile='#E8DCC8'),
    dict(id='j9-mokka', name='Mokka TV-fal, diószín ajtók',
         note='Gyapjúszín falak (Dulux Gyapjú szőttes) és mély mokkabarna TV-fal (Dulux 30YR 12/122, keverve) – a tervező sötét irányát festéssel, falpanel nélkül hozza. A háló ágyfala tölgyháncs (Tölgyfa háncs). Füstös natúr tölgy padló (DIEGO Smoke Olchon), dió ajtók (Alda dió tabak), fekete kilincs, világos bársonyfüggöny.',
         wall='dulux-1144053', acc={'nappali.x1': 'dulux-3177461', 'halo.x0': 'dulux-1452179'}, floor='diego-el2858',
         door='alda', handle='black', curtain='sanela-bezs', sheer='rosenrobinia', skirting=(80, 'wall'), textile='#CDBBA6'),
    dict(id='j10-terrakotta', name='Terrakotta naplemente (bátrabb)',
         note='Meleg törtfehér alap (Dulux Gyantás bor), a nappali TV-falán tompa rozsda-terrakotta (Dulux 50YR 21/318, keverve), a hálóban púderes agyag (Púder pamacs). Natúr tölgy (K4420), fehér ajtók sárgaréz kilinccsel, natúr lenfüggöny fátyollal. Mediterrán, napos hatás; esti fényben mélyebb.',
         wall='dulux-1144048', acc={'nappali.x1': 'dulux-3177463', 'halo.x0': 'dulux-2434268'}, floor='parkettadisz-k4420',
         door='gleccser', handle='brass', curtain='dytag', sheer='stockholm', skirting=(80, 'wall'), textile='#C9A07A'),
    dict(id='j11-oliva-dio', name='Olíva és dió',
         note='Vajszínű falak (Trilak Dán keksz), mély olíva TV-fal (Dulux 45YY 20/168, keverve), a hálóban világos khaki (47YY 40/227). Diópadló (Parkettadiszkont Lago dió) és dió ajtók (Porta CPL Természetes dió), fekete kilincs, lenfüggöny. Földközeli, nyugodt; a zöld és a barna bútorokkal is könnyen párosítható.',
         wall='trilak-dan-keksz', acc={'nappali.x1': 'dulux-3177482', 'halo.x0': 'dulux-3177476'}, floor='parkettadisz-k2596',
         door='porta-dio', handle='black', curtain='dytag', sheer='hallebracka', skirting=(80, 'door'), textile='#D8C9A8'),
    dict(id='j13-skandinav', name='Skandináv meleg (legsemlegesebb)',
         note='Mézes fehér falak kiemelés nélkül (Dulux Mézes halva), világos tölgy padló (DIEGO Light Baronia Oak), natúr tölgy ajtók (Ajtógyár Optima Natural Kendal), inox kilincs, világos bézs függöny fehér fátyollal. A legkevésbé kötött alap: bármilyen bútor és későbbi kiemelés mehet rá.',
         wall='dulux-1144050', acc={}, floor='diego-el2132',
         door='kendal', handle='steel', curtain='korgmott', sheer='silverlonn', skirting=(80, 'wall'), textile='#E9E1D3'),
    dict(id='j14-okker', name='Okker kiemelés, natúr tölgy',
         note='Világos meleg fehér (Pirított szezám), a nappali TV-falán tompa mustár (Dulux Mustár mag), a hálóban barackos krém (Szikrázó napkelte). Natúr tölgy (Parkettadiszkont Sundance Oak), fehér ajtók sárgaréz kilinccsel, lenfüggöny. Vidám, de nem harsány; szürke vagy barna kanapéval is működik.',
         wall='dulux-1144047', acc={'nappali.x1': 'dulux-2539475', 'halo.x0': 'dulux-1144071'}, floor='parkettadisz-k326',
         door='gleccser', handle='brass', curtain='dytag', sheer='stockholm', skirting=(80, 'wall'), textile='#7A6A4F'),
    dict(id='j15-gomba', name='Gomba, tónus a tónusban',
         note='Egyszínű, „beburkolt” hatás: gombaszín falak (Dulux Mester vászon), egy árnyalattal mélyebb kiemelés (Tölgyfa háncs a nappaliban, Agyag korsó a hálóban), szürkésbarna tölgy (Mushroom Carpenter Oak), kasmír ajtók, fekete kilincs, taupe bársonyfüggöny (JYSK AUSTRA). Elegáns, nyugodt, nem fehér – a szegély falszínű.',
         wall='dulux-1452163', acc={'nappali.x1': 'dulux-1452179', 'halo.x0': 'dulux-2434266'}, floor='parkettadisz-k478',
         door='kasmir', handle='black', curtain='austra', sheer='hallebracka', skirting=(80, 'wall'), textile='#B8A79A'),
    dict(id='j16-barack', name='Barackfény',
         note='Lágy barackos krém falak (Dulux Szikrázó napkelte), a nappaliban fahéj (Illatos fahéj), a hálóban gyömbér (Gyömbér cseppek). Széles, világos-meleg tölgy (K4423), fehér ajtók, sárgaréz kilincs, bézs sötétítő fátyollal. Napos, barátságos; az északi hálót melegíti.',
         wall='dulux-1144071', acc={'nappali.x1': 'dulux-1144057', 'halo.x0': 'dulux-1459681'}, floor='parkettadisz-k4423',
         door='gleccser', handle='brass', curtain='vilborg', sheer='rosenrobinia', skirting=(80, 'white'), textile='#E3C7A8'),
    dict(id='j17-kontraszt', name='Meleg fehér, fekete ajtók, konyakos tölgy',
         note='Kontrasztos modern, de meleg: krémfehér falak (Gyantás bor), homok TV-fal (Bengáli ösvény), meleg szürkésbarna háló ágyfal (Dulux 62YR 22/051, keverve). Konyakszínű tölgy (DIEGO Cognac Brown Sherman Oak), antracit tölgy ajtók (Ajtógyár Sherman) fekete kilinccsel, meleg szürke sötétítő fehér fátyollal.',
         wall='dulux-1144048', acc={'nappali.x1': 'dulux-1144118', 'halo.x0': 'dulux-3177472'}, floor='diego-el2402',
         door='sherman', handle='black', curtain='leka', sheer='silverlonn', skirting=(80, 'door'), textile='#2F2B28'),
    dict(id='j18-kakao', name='Kakaó TV-fal, világos tölgy',
         note='A tervező sötét-meleg hangulata világos padlóval: meleg fehér falak (Igazgyöngy), mély kakaóbarna TV-fal (Dulux 48YR 09/077, keverve), paliszander háló ágyfal (Meleg paliszander). Mézes tölgy (Aviva Vernal), natúr tölgy ajtók, fekete kilincs, karamell bársonyfüggöny (Bonami Olympe – karikás, rúd kell) fátyollal.',
         wall='dulux-1452155', acc={'nappali.x1': 'dulux-3177471', 'halo.x0': 'dulux-3177462'}, floor='parkettadisz-k2752',
         door='kendal', handle='black', curtain='olympe', sheer='hallebracka', skirting=(80, 'wall'), textile='#D9C7B0'),
]

# --- JR-javaslatok (2026-11-17): a meglévő világos laminált marad (háló, nappali, dolgozó), a meglévő ágy és nagy asztal is.
# `hall`: a járólapos zóna (előszoba, közlekedő, a nappali dolgozó felőli sávja) burkolata – a meglévő járólap vagy új lap.
# Az ajtók: világos fa nem (a laminált, az asztal és az ágy mellé negyedik világos fa lenne).
LAM = 'meglevo-laminalt'
OLD_TILE = 'meglevo-jarolap'
KEEP = {'halo-agy': 'meglevo', 'dolgozo-asztal': 'meglevo'}
JR_INTRO = 'A meglévő világos laminált marad (háló, nappali, dolgozó), a meglévő ágy és nagy asztal is. '
V += [
    dict(id='jr1-greige', name='Meglévő padlók, meleg greige',
         note=JR_INTRO + 'A járólap is marad (előszoba, közlekedő, a nappali dolgozó felőli sávja). A falszín a kettő közé hidal: meleg greige alap (Poli-Farbe Frézia), amely a bézsesszürke járólapot és a sárgás tölgyet is „befogadja”; a nappali TV-fala mélyebb taupe (Dulux Tölgyfa háncs), a háló ágyfala agyagos greige (Agyag korsó). Sima fehér ajtók fekete kilinccsel, bézs sötétítő világosbézs fátyollal. A legolcsóbb, legbiztonságosabb irány; a hideg szürke falak cseréje önmagában sokat melegít.',
         wall='polifarbe-f90', acc={'nappali.x1': 'dulux-1452179', 'halo.x0': 'dulux-2434266'}, floor=LAM, hall=OLD_TILE,
         door='gleccser', handle='black', curtain='vilborg', sheer='hallebracka', skirting=(80, 'wall'), textile='#C9B79C', choices=KEEP),
    dict(id='jr2-zsalya', name='Meglévő padlók, zsálya',
         note=JR_INTRO + 'A járólap is marad. A zsálya a szürkés járólappal és a sárgás tölggyel is rokon, ezért a két burkolatot összeköti: meleg fehér alap (Dulux Pirított szezám), a nappali TV-fala mély zsálya-olíva (Suttogó fenyves), a háló ágyfala világos zöldesszürke (Füvészkert). Fehér ajtók sárgaréz kilinccsel, natúr lenfüggöny törtfehér fátyollal. Nyugodt, természetes; a fa bútorok és a zöld növények jól mutatnak előtte.',
         wall='dulux-1144047', acc={'nappali.x1': 'dulux-3190961', 'halo.x0': 'dulux-2844408'}, floor=LAM, hall=OLD_TILE,
         door='gleccser', handle='brass', curtain='dytag', sheer='stockholm', skirting=(80, 'wall'), textile='#D8CCB8', choices=KEEP),
    dict(id='jr3-kakao', name='Kakaó TV-fal, travertin előszoba',
         note=JR_INTRO + 'A régi járólap helyére (előszoba, közlekedő, a nappali dolgozó felőli sávja) meleg bézs travertin hatású, nagy lap kerül (Flaviker Navona Honey Vein 60 × 120, Csempebolt): kőből, nem fából, így a laminálttal nem versenyez, és a szürkés tónus eltűnik. Falak: meleg fehér (Dulux Igazgyöngy), a nappali TV-fala mély kakaóbarna (48YR 09/077, keverve), a háló ágyfala paliszander (Meleg paliszander). Mandula bézs ajtók (Ajtógyár Optima) fekete kilinccsel, barna bársonyfüggöny (Bonami) világosbézs fátyollal. A sötét-meleg, hangulatos irány a világos padlóval.',
         wall='dulux-1452155', acc={'nappali.x1': 'dulux-3177471', 'halo.x0': 'dulux-3177462'}, floor=LAM, hall='csempebolt-navona-honey-vein',
         door='mandula', handle='black', curtain='olympe', sheer='hallebracka', skirting=(80, 'wall'), textile='#D9C7B0', choices=KEEP),
    dict(id='jr4-cotto', name='Cotto előszoba, agyagos falak (bátrabb)',
         note=JR_INTRO + 'A járólapos zónába matt terrakotta 20 × 20-as lap (Equipe Bauhome Terrakotta, MetrocsempeShop): a nappali dolgozó felőli sávja és a közlekedő mediterrán „burkolt szigetté” válik, a laminált mellett szándékos, nem véletlen váltás. Falak: lágy meleg fehér (Dulux Könnyed ébredés), a nappali TV-fala tompa rózsásbarna (Selymes szantál), a háló ágyfala púderes agyag (Púder pamacs). Fehér ajtók sárgaréz kilinccsel, okkerbarna sötétítő törtfehér fátyollal. A legmelegebb, legmarkánsabb JR; a terrakotta lap színe a termékfotó egyszínű mintájából, a valódi lap tónusváltozatos – mintát kell kérni.',
         wall='dulux-2539464', acc={'nappali.x1': 'dulux-1144059', 'halo.x0': 'dulux-2434268'}, floor=LAM, hall='metrocsempeshop-equipe-bauhome-terrakotta',
         door='gleccser', handle='brass', curtain='annakajsa-okker', sheer='stockholm', skirting=(80, 'wall'), textile='#C9A07A', choices=KEEP),
    dict(id='jr5-fekete', name='Fekete ajtók, barna kő előszoba',
         note=JR_INTRO + 'Grafikus, kontrasztos irány: a járólapos zónába közepesen sötét, meleg barna kőhatású lap (CER Ground, 60 × 60, R10, Forma Vivendi), amely a fekete ajtókat „lehorgonyozza”, és a nappali dolgozó felőli sávját határozottan elválasztja. Falak: semleges meleg fehér (Dulux Ragyogó gyöngyház), a nappali TV-fala homok (Bengáli ösvény), a háló ágyfala meleg szürkésbarna (62YR 22/051, keverve). Antracit tölgy ajtók (Ajtógyár Sherman) fekete kilinccsel, bézs fényzáró függöny fehér fátyollal. A világos laminált itt kontrasztként dolgozik, nem alapszínként.',
         wall='dulux-1144045', acc={'nappali.x1': 'dulux-1144118', 'halo.x0': 'dulux-3177472'}, floor=LAM, hall='formavivendi-cer-ground-barna',
         door='sherman', handle='black', curtain='korgmott', sheer='silverlonn', skirting=(80, 'wall'), textile='#857A74', choices=KEEP),
]

# --- JF-javaslatok (2026-11-26, „fekete részletek”): a {j17} vonala – fekete vagy antracit ajtó, fekete kilincs és fekete
# lámpatestek (terveik a gen_lightplans.py-ban) –, a többi elem a feketéhez illő meleg árnyalatokból. JF1–JF3: a meglévő
# világos laminált marad (az ágy és az asztal is); JF4–JF6: új padló. A fal-, padló- és ajtókombinációk változnak.
JF_KEEP = 'A meglévő világos laminált marad (háló, nappali, dolgozó), a meglévő ágy és nagy asztal is. '
JF_NEW = 'Új padló a hálóban, a nappaliban és a dolgozóban. '
V += [
    dict(id='jf1-matt-fekete', name='Meglévő padlók, matt fekete ajtók, taupe',
         note=JF_KEEP + 'A járólap is marad – ez a legolcsóbb fekete irány: csak festés, ajtócsere és lámpák. Világos greige alap (Dulux Izlandi reggel), amely a bézsesszürke járólapot és a sárgás tölgyet is elviseli; a nappali TV-fala középtónusú taupe (Tölgyfa háncs), a háló ágyfala világosabb taupe (Szabad part) – a fekete ajtók a semleges, meleg falakon grafikusan kirajzolódnak. Matt fekete, sima ajtók (Ajtógyár Pascal Fresh, a legolcsóbb fekete a katalógusban) fekete kilinccsel, bézs sötétítő világosbézs fátyollal. Világítás: IKEA fekete kupolák és opál LED-lámpák.',
         wall='dulux-1975160', acc={'nappali.x1': 'dulux-1452179', 'halo.x0': 'dulux-3190956'}, floor=LAM, hall=OLD_TILE,
         door='fresh-fekete', handle='black', curtain='vilborg', sheer='hallebracka', skirting=(80, 'wall'), textile='#C9B79C', choices=KEEP),
    dict(id='jf2-antracit-mokka', name='Meglévő laminált, antracit kő előszoba, mokka',
         note=JF_KEEP + 'A régi járólap helyére meleg antracit, matt kőhatású lap (Paradyz Ibis Antracite 30 × 60, Mozaik Kerámia): az előszoba, a közlekedő és a nappali dolgozó felőli sávja sötét „szőnyeg” lesz, amely az antracit ajtókat összeköti, és a szürkés régi lapot eltünteti. Falak: meleg fehér (Dulux Igazgyöngy), a nappali TV-fala mokkabarna (30YR 12/122, keverve), a háló ágyfala taupe (Tölgyfa háncs). Szatén antracit, sima ajtók (JOLA) fekete kilinccsel, taupe bársonyfüggöny (JYSK AUSTRA) fátyollal. Világítás: fekete fém és rattan.',
         wall='dulux-1452155', acc={'nappali.x1': 'dulux-3177461', 'halo.x0': 'dulux-1452179'}, floor=LAM, hall='mozaikkeramia-web000096',
         door='jola-szaten-antracit', handle='black', curtain='austra', sheer='hallebracka', skirting=(80, 'wall'), textile='#B8A79A', choices=KEEP),
    dict(id='jf3-travertin-oliva', name='Meglévő laminált, travertin előszoba, olíva',
         note=JF_KEEP + 'A járólapos zónába meleg travertin hatású, nagy lap (GE Marvet Supreme 60 × 120, MetrocsempeShop). Falak: meleg fehér (Dulux Pirított szezám), a nappali TV-fala tompa olíva (45YY 20/168, keverve), a háló ágyfala világos khaki (47YY 40/227). Ajtó: feketésbarna erezett tölgy (JOLA Thermo tölgy) – fekete hatású, de látszik rajta a fa, így a világos laminált mellett is természetes; fekete kilincs. Natúr lenfüggöny törtfehér fátyollal. Világítás: fekete és sárgaréz.',
         wall='dulux-1144047', acc={'nappali.x1': 'dulux-3177482', 'halo.x0': 'dulux-3177476'}, floor=LAM, hall='metrocsempeshop-60x120-ge-marvet-supreme-kohatasu-travertin-jarolap',
         door='jola-thermo', handle='black', curtain='dytag', sheer='stockholm', skirting=(80, 'wall'), textile='#D8C9A8', choices=KEEP),
    dict(id='jf4-parketta-konyak', name='Natúr tölgy parketta, fekete mart ajtók, konyak',
         note=JF_NEW + 'Valódi fa: natúr tölgy 3 sávos szalagparketta (JOLA 92300/40) az egész lakásban, a járólapos zónában is. Falak: krémes meleg fehér (Dulux Gyantás bor), a nappali TV-fala konyakbarna (70YR 13/259, keverve), a háló ágyfala homok (Bengáli ösvény). Fekete, mart (keretmintás) ajtók (JOLA Fekete) fekete kilinccsel – klasszikusabb, „párizsias” hatás; okkerbarna sötétítő törtfehér fátyollal. Világítás: fekete és opálüveg.',
         wall='dulux-1144048', acc={'nappali.x1': 'dulux-70yr-13-259', 'halo.x0': 'dulux-1144118'}, floor='jola-92300-40',
         door='jola-fekete-mart', handle='black', curtain='annakajsa-okker', sheer='stockholm', skirting=(80, 'wall'), textile='#E3C7A8'),
    dict(id='jf5-fustos-grafit', name='Füstös tölgy, grafit ajtók, mély olíva',
         note=JF_NEW + 'Középtónusú, füstös tölgy vinyl (Quick-Step Alpha Vinyl Bloom AVMPU 40317) az egész lakásban. Tónusos, „beburkolt” falak: gombaszín alap (Dulux Mester vászon), a nappali TV-fala mély olíva (90YY 13/177, keverve), a háló ágyfala agyagos greige (Agyag korsó). Matt grafit, sima ajtók (Ajtógyár Pascal Loretto) és grafit szegély, fekete kilincs; meleg szürke sötétítő bézs fátyollal. A legsötétebb, legegységesebb JF – sok világítás kell hozzá. Világítás: minimál fekete spotsínek.',
         wall='dulux-1452163', acc={'nappali.x1': 'dulux-90yy-13-177', 'halo.x0': 'dulux-2434266'}, floor='parkettawebaruhaz-3417-avmpu-40317-elegans-fustos-tolgy-vinyl-padlo',
         door='loretto-grafit', handle='black', curtain='leka', sheer='rosenrobinia', skirting=(80, 'door'), textile='#857A74'),
    dict(id='jf6-vilagos-sotetko', name='Világos tölgy, antracit tölgy ajtók, szénszürke TV-fal',
         note=JF_NEW + 'A {j17} ajtaja világosabb alappal: széles, világos meleg tölgy (Parkettadiszkont Evoke Crystal), a járólapos zónában sötét, meleg barna-antracit nagy lap (Italica Teal Brown 60 × 120, Mozaik Kerámia), amely a bejárati részt elválasztja. Falak: semleges meleg fehér (Dulux Ragyogó gyöngyház), a nappali TV-fala meleg szénszürke (30YY 05/044, keverve) – a TV, az ajtók és az előszoba lapja egy sötét keretet ad a világos padlón –, a háló ágyfala rózsás taupe (Bódító kardamon). A modell a teljes TV-falat színezi; a valóságban a TV-s falszakasz is elég. Antracit tölgy ajtók (Ajtógyár Sherman) fekete kilinccsel, bézs fényzáró függöny fehér fátyollal. Világítás: plasztikus fekete lámpatestek.',
         wall='dulux-1144045', acc={'nappali.x1': 'dulux-30yy-05-044', 'halo.x0': 'dulux-1144056'}, floor='parkettadisz-k4423', hall='mozaikkeramia-69299',
         door='sherman', handle='black', curtain='korgmott', sheer='silverlonn', skirting=(80, 'wall'), textile='#2F2B28'),
]

# --- Stílusvonalak (2026-11-26, user): a választó csoportjai. Az azonosító és a szám nem változik (mentett beállítások,
# vélemények); a csoport a `line`. Új javaslatok: JF7–JF12 (fekete vonal, új padló), JS1–JS5 (skandináv), JM1–JM4 (melegebb
# világos), JP1–JP5 (japandi). A meglévő padlót megtartók (JF1–JF3, JR1–JR5) külön csoportban, alul.
JF_NEW2 = 'Új padló a hálóban, a nappaliban és a dolgozóban; fekete kilincs, fekete lámpatestek. '
JS = 'Skandináv: világos padló, fehér vagy világos falak, kevés, tiszta kiemelés, natúr textil. '
JM = 'Melegebb világos: krémes falak, mézes-világos fa, sárgaréz és opál. '
JP = 'Japandi: alacsony kontraszt, agyag- és gombaszínek, natúr fa, len, papír és fonott lámpák, néhány sötét részlet. '
V += [
    dict(id='jf7-mezes-zsalya', line='fekete', name='Mézes tölgy, matt fekete ajtók, zsálya TV-fal',
         note=JF_NEW2 + 'Meleg fehér falak (Dulux Mézes halva), a nappali TV-fala mély zsálya (Suttogó fenyves), a háló ágyfala világos zöldesszürke (Füvészkert). Mézes tölgy laminált (Kaindl Comfort Brione, OBI), sima, fekete ajtók (JOLA Fekete), natúr lenfüggöny törtfehér fátyollal. A fekete vonal legtermészetesebb, legzöldebb tagja.',
         wall='dulux-1144050', acc={'nappali.x1': 'dulux-3190961', 'halo.x0': 'dulux-2844408'}, floor='obi-5101449',
         door='jola-fekete', handle='black', curtain='dytag', sheer='stockholm', skirting=(80, 'wall'), textile='#D8CCB8'),
    dict(id='jf8-greige-terrakotta', line='fekete', name='Natúr tölgy, fekete ajtók, terrakotta TV-fal',
         note=JF_NEW2 + 'Gyapjúszín falak (Dulux Gyapjú szőttes), a nappali TV-fala tompa rozsda-terrakotta (50YR 21/318, keverve), a háló ágyfala púderes agyag (Púder pamacs). Natúr tölgy laminált (Egger Natursense Belfort, Praktiker), matt fekete ajtók (Ajtógyár Pascal Loretto), világosbézs bársonyfüggöny fátyollal. Mediterrán meleg a fekete keretben.',
         wall='dulux-1144053', acc={'nappali.x1': 'dulux-3177463', 'halo.x0': 'dulux-2434268'}, floor='praktiker-430705',
         door='loretto-fekete', handle='black', curtain='sanela-bezs', sheer='hallebracka', skirting=(80, 'wall'), textile='#C9A07A'),
    dict(id='jf9-dio-krem', line='fekete', name='Sötét dió padló, krémes falak, fekete ajtók',
         note=JF_NEW2 + 'A legsötétebb padlós fekete javaslat: sötét dió laminált (Comfort Tobacco, OBI), krémes falak (Dulux Papirusz tekercs), a nappali TV-fala homok (Bengáli ösvény), a háló ágyfala fahéj (Illatos fahéj). Fekete, sima ajtók (Pol-Skone Haptic), krém bársonyfüggöny fátyollal. Klasszikus, esti hangulat; sok fény kell hozzá.',
         wall='dulux-1452171', acc={'nappali.x1': 'dulux-1144118', 'halo.x0': 'dulux-1144057'}, floor='obi-3902962',
         door='haptic-fekete', handle='black', curtain='barsony-krem', sheer='stockholm', skirting=(80, 'wall'), textile='#E8DCC8'),
    dict(id='jf10-vilagos-grafit', line='fekete', name='Nagyon világos tölgy, grafit ajtók, greige',
         note=JF_NEW2 + 'Skandináv alap fekete részletekkel: nagyon világos tölgy laminált (Cotton Greenvale Oak), semleges meleg fehér falak (Dulux Ragyogó gyöngyház), a nappali TV-fala greige (Poli-Farbe Platinum Foltálló H40), a háló ágyfala gombaszín (Mester vászon). Matt grafit ajtók (Pol-Skone Haptic), bézs fényzáró függöny fehér fátyollal.',
         wall='dulux-1144045', acc={'nappali.x1': 'polifarbe-foltallo-h40', 'halo.x0': 'dulux-1452163'}, floor='parkettabirodalom-cotton-greenvale-oak-laminalt-padlo-8mm',
         door='haptic-grafit', handle='black', curtain='korgmott', sheer='silverlonn', skirting=(80, 'wall'), textile='#B8A79A'),
    dict(id='jf11-egett-fa', line='fekete', name='Füstös tölgy, égetett fa ajtók, agyag',
         note=JF_NEW2 + 'Tónusos, földszínű: agyagos greige falak (Dulux Agyag korsó), a nappali TV-fala tölgyháncs (Tölgyfa háncs), a háló ágyfala rózsás taupe (Bódító kardamon). Füstös tölgy SPC padló (Smoked Oak), feketésbarna, égetett fa hatású ajtók (Ajtógyár Full Doors, Égett fa) – fekete hatású, de fa erezettel. Taupe bársonyfüggöny fátyollal.',
         wall='dulux-2434266', acc={'nappali.x1': 'dulux-1452179', 'halo.x0': 'dulux-1144056'}, floor='parkettabirodalom-spc-optimal-vinyl-smoked-oak-padlo-6-mm',
         door='egett-fa', handle='black', curtain='austra', sheer='hallebracka', skirting=(80, 'door'), textile='#857A74'),
    dict(id='jf12-antracit-karamell', line='fekete', name='Mézes SPC, antracit ajtók, karamell',
         note=JF_NEW2 + 'Meleg fehér falak (Dulux Igazgyöngy), a nappali TV-fala karamell (Fűszeres nektár), a háló ágyfala paliszander (Meleg paliszander). Mézes, világos tölgy SPC padló (Kronostep Aralia), antracit, sima ajtók (JOLA Palládium szürke), okkerbarna sötétítő törtfehér fátyollal. A legmelegebb fekete javaslat.',
         wall='dulux-1452155', acc={'nappali.x1': 'dulux-2434265', 'halo.x0': 'dulux-3177462'}, floor='parkettawebaruhaz-r283-aralia',
         door='jola-palladium', handle='black', curtain='annakajsa-okker', sheer='stockholm', skirting=(80, 'wall'), textile='#E3C7A8'),
    # Skandináv
    dict(id='js1-feher-tolgy', line='skandinav', name='Fehér falak, fehéres tölgy, fehér ajtók',
         note=JS + 'Semleges meleg fehér falak (Dulux Ragyogó gyöngyház), a nappali TV-fala gyapjúszín (Gyapjú szőttes), a háló ágyfala világos taupe (Szabad part). Fehéres tölgy laminált (Egger NatureSense White Treviso Oak, DIEGO), fehér len hatású ajtók (Ajtógyár Pascal Optima) inox kilinccsel, bézs fényzáró függöny fehér fátyollal. A legvilágosabb, legnyugodtabb javaslat.',
         wall='dulux-1144045', acc={'nappali.x1': 'dulux-1144053', 'halo.x0': 'dulux-3190956'}, floor='diego-naturesense-aqua-classic-white-treviso-oak-10-mm-vizallo-laminalt-padl',
         door='feher-len', handle='steel', curtain='korgmott', sheer='silverlonn', skirting=(80, 'white'), textile='#E9E1D3'),
    dict(id='js2-oliva-tolgy-ajto', line='skandinav', name='Olíva TV-fal, világos tölgy ajtók',
         note=JS + 'Vasvirág falak (Poli-Farbe), a nappali TV-fala szürkés olíva (Poli-Farbe Decor Olíva), a háló ágyfala ezüstös zöld (Ezüst cserje). Világos tölgy laminált (Egger NatureSense Brook, OBI), skandináv tölgy ajtók (OBI Kaya – olcsó, csak ajtólap) fekete kilinccsel, natúr lenfüggöny fehér fátyollal.',
         wall='polifarbe-v30', acc={'nappali.x1': 'polifarbe-decor-d60o', 'halo.x0': 'polifarbe-e50'}, floor='obi-5285697',
         door='kaya-skandi-tolgy', handle='black', curtain='dytag', sheer='silverlonn', skirting=(80, 'wall'), textile='#D8CCB8'),
    dict(id='js3-fjord', line='skandinav', name='Halvány kék-szürke, krémes tölgy (hűvösebb)',
         note=JS + 'A skandináv vonal hűvösebb tagja: világos greige falak (Dulux Izlandi reggel), a nappali TV-fala halvány kékesszürke (Üveghegy), a háló ágyfala zöldesszürke fehér (Poli-Farbe Lisztes üröm). Krémes tölgy laminált (Cream Darcy, Parkettawebáruház), tört fehér fenyő dekor ajtók (JOLA SOS Polar Aland) inox kilinccsel, bézs fényzáró függöny fehér fátyollal.',
         wall='dulux-1975160', acc={'nappali.x1': 'dulux-2844403', 'halo.x0': 'polifarbe-l30'}, floor='parkettawebaruhaz-3547-k844-cream-darcy-tolgy-laminalt-padlo',
         door='polar-aland', handle='steel', curtain='korgmott', sheer='silverlonn', skirting=(80, 'white'), textile='#D5DEDB'),
    dict(id='js4-homok-tolgy', line='skandinav', name='Homok kiemelés, natúr tölgy ajtók',
         note=JS + 'Vajfehér falak (Poli-Farbe Platinum H25), a nappali TV-fala homok (Dulux Gangeszi kavics), a háló ágyfala masala tea (Masala tea). Világos, enyhén mézes tölgy (Kaindl Excellent Evoke, OBI), világos natúr tölgy ajtók (JOLA Dekor Plus) fekete kilinccsel, világosbézs bársonyfüggöny fátyollal.',
         wall='polifarbe-h25', acc={'nappali.x1': 'dulux-1144054', 'halo.x0': 'dulux-1144058'}, floor='obi-5573688',
         door='jola-natur-tolgy', handle='black', curtain='sanela-bezs', sheer='stockholm', skirting=(80, 'wall'), textile='#E8D3BD'),
    dict(id='js5-feher-grafit', line='skandinav', name='Fehér és grafit, fehérolajos tölgy parketta',
         note=JS + 'Kontrasztos skandináv: fehér falak (Ragyogó gyöngyház), a nappali TV-fala grafit (Dulux Füstös rúnakő) – a TV beleolvad –, a háló ágyfala ezüstös zöld (Poli-Farbe Ezüst cserje). Jégfehér lakkozott, natúr tölgy szalagparketta (Parkettabirodalom), fehér ajtók (Ajtógyár Gleccser) fekete kilinccsel, bézs fényzáró függöny natúr pamut fátyollal (JYSK STORAVAN).',
         wall='dulux-1144045', acc={'nappali.x1': 'dulux-1389001', 'halo.x0': 'polifarbe-e50'}, floor='parkettabirodalom-tolgy-natur-3-savos-jegfeher-lakkozott-szalagparketta',
         door='gleccser', handle='black', curtain='korgmott', sheer='storavan', skirting=(80, 'white'), textile='#4F5050'),
    # Melegebb világos
    dict(id='jm1-vaj-gyomber', line='meleg', name='Vajszín, gyömbér, vanília tölgy',
         note=JM + 'Gyantás bor falak (Dulux), a nappali TV-fala homok (Gangeszi kavics), a háló ágyfala gyömbér (Gyömbér cseppek). Vaníliás világos tölgy (Tölgy Evoke Vanillia, Parkettadiszkont), meleg sonoma dekor ajtók (JOLA Alföld) sárgaréz kilinccsel, bézs sötétítő bézs fátyollal.',
         wall='dulux-1144048', acc={'nappali.x1': 'dulux-1144054', 'halo.x0': 'dulux-1459681'}, floor='parkettadiszkont-tolgy-evoke-vanillia-vizallo-laminalt-padlo-8-mm',
         door='sonoma-greko', handle='brass', curtain='vilborg', sheer='rosenrobinia', skirting=(80, 'wall'), textile='#F4D8B6'),
    dict(id='jm2-homok-mez', line='meleg', name='Homok és mézes tölgy, natúr tölgy ajtók',
         note=JM + 'Igazgyöngy falak (Dulux), a nappali TV-fala homok (Bengáli ösvény), a háló ágyfala masala tea. Mézes tölgy laminált (Kaindl Comfort Brione, OBI), natúr Bardolino tölgy ajtók (Ajtógyár Pascal Optima) sárgaréz kilinccsel, bézs sötétítő világosbézs fátyollal.',
         wall='dulux-1452155', acc={'nappali.x1': 'dulux-1144118', 'halo.x0': 'dulux-1144058'}, floor='obi-5573647',
         door='bardolino', handle='brass', curtain='annakajsa', sheer='hallebracka', skirting=(80, 'door'), textile='#D9C7B0'),
    dict(id='jm3-roza-koris', line='meleg', name='Rózsás krém, fahéj, kőris parketta',
         note=JM + 'Lágy, rózsás meleg fehér falak (Dulux Könnyed ébredés), a nappali TV-fala fahéj (Illatos fahéj), a háló ágyfala cseresznyevirág (Poli-Farbe Cseresznyevirág). Natúr kőris szalagparketta (BEFAG Moment), homokbézs ajtók (JOLA Cegléd, fémintarzia) sárgaréz kilinccsel, krém bársonyfüggöny fátyollal.',
         wall='dulux-2539464', acc={'nappali.x1': 'dulux-1144057', 'halo.x0': 'polifarbe-cs70'}, floor='parkettabirodalom-koris-natur-befag-moment-3-savos-szalagparketta',
         door='cegled-homokbezs', handle='brass', curtain='barsony-krem', sheer='stockholm', skirting=(80, 'wall'), textile='#CFB8B2'),
    dict(id='jm4-barack-sonara', line='meleg', name='Barackos TV-fal, mézes SPC, bézs ajtók',
         note=JM + 'Mézes fehér falak (Dulux Mézes halva), a nappali TV-fala barackos homok (Poli-Farbe Platinum Foltálló I20), a háló ágyfala homok (Gangeszi kavics). Mézes tölgy SPC padló (Sonara, Parkettabirodalom), bézs ajtók (Pol-Skone Haptic) sárgaréz kilinccsel, natúr lenfüggöny bézs fátyollal.',
         wall='dulux-1144050', acc={'nappali.x1': 'polifarbe-foltallo-i20', 'halo.x0': 'dulux-1144054'}, floor='parkettabirodalom-tolgy-sonara-spc-padlo-41mm',
         door='haptic-bezs', handle='brass', curtain='dytag', sheer='rosenrobinia', skirting=(80, 'wall'), textile='#E3C7A8'),
    # Japandi
    dict(id='jp1-agyag-tolgy', line='japandi', name='Agyag és natúr tölgy',
         note=JP + 'Gyapjúszín falak (Dulux Gyapjú szőttes), a nappali TV-fala agyagos greige (Agyag korsó), a háló ágyfala gombaszín (Mester vászon). Natúr tölgy laminált (Nova Middle, DIEGO), szürkésbarna tölgy ajtók (Ajtógyár Pascal Optima Lorenzo) fekete kilinccsel, natúr lenfüggöny bézs fátyollal.',
         wall='dulux-1144053', acc={'nappali.x1': 'dulux-2434266', 'halo.x0': 'dulux-1452163'}, floor='diego-nova-middle-tolgy-8-mm-vizallo-laminalt-padlo-3',
         door='lorenzo-tolgy', handle='black', curtain='dytag', sheer='rosenrobinia', skirting=(80, 'wall'), textile='#C9BDB2'),
    dict(id='jp2-szen-tolgy', line='japandi', name='Szénszürke TV-fal, antracit tölgy ajtók',
         note=JP + 'Meleg greige falak (Poli-Farbe Platinum Foltálló P20), a nappali TV-fala szénszürke (Dulux Füstös rúnakő), a háló ágyfala greige (Platinum Foltálló H40). Világos, szürkés-füstös tölgy (Smoked Light Grey Oak), antracit tölgy ajtók (JOLA) fekete kilinccsel, világosbézs bársonyfüggöny fátyollal. A japandi sötét részletekkel.',
         wall='polifarbe-foltallo-p20', acc={'nappali.x1': 'dulux-1389001', 'halo.x0': 'polifarbe-foltallo-h40'}, floor='parkettabirodalom-smoked-light-grey-oak-344-loc0-laminalt-padlo-8-mm',
         door='jola-antracit-tolgy', handle='black', curtain='sanela-bezs', sheer='hallebracka', skirting=(80, 'door'), textile='#4F5050'),
    dict(id='jp3-oliva-papir', line='japandi', name='Olíva, kőris ajtók, papírlámpák',
         note=JP + 'Vasvirág falak (Poli-Farbe), a nappali TV-fala szürkés olíva (Poli-Farbe Decor Olíva), a háló ágyfala khaki (Dulux Pálma bungaló). Natúr fa szalagparketta (Vision Helsinki), homokszínű kőris ajtók (Ajtógyár Pascal Optima Molina) fekete kilinccsel, szürke-zöld lenfüggöny törtfehér fátyollal.',
         wall='polifarbe-v30', acc={'nappali.x1': 'polifarbe-decor-d60o', 'halo.x0': 'dulux-1975157'}, floor='parkettawebaruhaz-1445-helsinki-fa-szalagparketta',
         door='molina-koris', handle='black', curtain='dytag-zold', sheer='stockholm', skirting=(80, 'wall'), textile='#C1BEA2'),
    dict(id='jp4-gomba-dio', line='japandi', name='Gomba és dió, meszes tölgy ajtók',
         note=JP + 'Gombaszín falak (Dulux Mester vászon), a nappali TV-fala mély gombabarna (Poli-Farbe Platinum Cs50), a háló ágyfala agyagos greige (Agyag korsó). Világos dió laminált (Egger Natursense Perganti, Praktiker), meszes tölgy ajtók (JOLA Kisbér) fekete kilinccsel, taupe bársonyfüggöny fátyollal.',
         wall='dulux-1452163', acc={'nappali.x1': 'polifarbe-cs50', 'halo.x0': 'dulux-2434266'}, floor='praktiker-430725',
         door='meszes-tolgy', handle='black', curtain='austra', sheer='hallebracka', skirting=(80, 'door'), textile='#B8A79A'),
    dict(id='jp5-mosott-ko', line='japandi', name='Mosott kő, fehéres tölgy ajtók',
         note=JP + 'Világos greige falak (Dulux Izlandi reggel), a nappali TV-fala kőszürkés barna (Poli-Farbe Platinum M60), a háló ágyfala homokos taupe (Platinum Foltálló SZ40). Szürkésbézs tölgy laminált (Wiparquet Resist Lodge, DIEGO), fehéres Halifax tölgy ajtók (Ajtógyár) fekete kilinccsel, barna-bézs bársonyfüggöny fehér fátyollal.',
         wall='dulux-1975160', acc={'nappali.x1': 'polifarbe-m60', 'halo.x0': 'polifarbe-foltallo-sz40'}, floor='diego-wiparquet-resist-lodge-8-mm-vizallo-laminalt-padlo',
         door='halifax-tolgy', handle='black', curtain='barsony-barnabezs', sheer='silverlonn', skirting=(80, 'wall'), textile='#C5B2A2'),
]

# A meglévő javaslatok vonala (a többi „egyéb”): a J2 (j17) a fekete vonal kiindulópontja; JF1–JF3 és a JR-ek a meglévő padlóval.
LINE_OF = {'j17-kontraszt': 'fekete', 'jf4-parketta-konyak': 'fekete', 'jf5-fustos-grafit': 'fekete', 'jf6-vilagos-sotetko': 'fekete',
           'j13-skandinav': 'skandinav', 'j1-zsalya': 'meleg', 'j16-barack': 'meleg', 'j15-gomba': 'japandi',
           'jf1-matt-fekete': 'meglevo', 'jf2-antracit-mokka': 'meglevo', 'jf3-travertin-oliva': 'meglevo'}
LINES = [
    ('fekete', 'Fekete/antracit vonal'),
    ('skandinav', 'Skandináv vonal'),
    ('meleg', 'Melegebb világos vonal'),
    ('japandi', 'Japandi vonal'),
    ('egyeb', 'Egyéb javaslatok'),
    ('meglevo', 'Meglévő padlóval (laminált, járólap)'),
]


def line_of(v):
    return v.get('line') or LINE_OF.get(v['id']) or ('meglevo' if v['id'].startswith('jr') else 'egyeb')

def ts(v):
    fl = cat[v['floor']]
    plank = f", plank: {{ l: {fl['size']['l']}, w: {fl['size']['w']} }}" if fl.get('size') else ''
    hall = ''
    if v.get('hall'):
        hf = cat[v['hall']]
        hp = f", plank: {{ l: {hf['size']['l']}, w: {hf['size']['w']} }}" if hf.get('size') else ''
        hall = f"\n    hallFloor: {{ pattern: '{hf['pattern']}', tone: '{hf['hex']}'{hp} }},"
    choices = ''
    if v.get('choices'):
        choices = '\n    choices: { ' + ', '.join(f"'{k}': '{o}'" for k, o in v['choices'].items()) + ' },'
    door = cat[D[v['door']]]
    cur = cat[C[v['curtain']]]
    sheer_only = v.get('sheerOnly', False)
    sh = cat[C[v['sheer']]] if v.get('sheer') else None
    accents = ', '.join(f"'{k}': '{hx(p)}'" for k, p in v['acc'].items())
    prods = {'wall': v['wall'], 'ceiling': 'polifarbe-b15'}
    prods.update({f'accent:{k}': p for k, p in v['acc'].items()})
    prods.update({'floor': v['floor']})
    if v.get('hall'):
        prods['hallFloor'] = v['hall']
    prods.update({'door': D[v['door']], 'curtain': C[v['curtain']]})
    if sh:
        prods['sheer'] = C[v['sheer']]
    pr = ', '.join(f"{k if k.isidentifier() else repr(k)}: '{p}'" for k, p in prods.items())
    curtain = f"{{ on: true, color: '{cur['hex']}', sheer: {str(sheer_only).lower()}, span: 'wall', length: 'floor', closed: false" + (f", sheerLayer: '{sh['hex']}'" if sh else '') + ' }'
    wood = f"\n    accentWood: {json.dumps(v['wood'])}," if v.get('wood') else ''
    note = refs(v['note'])
    if label(v['id']) != key(v['id']).upper():
        note += f" Korábbi száma: {key(v['id']).upper()}."
    note = note.replace("'", "\\'")
    return f"""  {{
    id: '{v['id']}',
    lightPlanId: 'l{v['id'].split('-')[0]}',
    name: '{label(v['id'])} – {v['name']}',
    note: '{note}',
    wall: '{hx(v['wall'])}',
    wallFinish: 'matt',
    accents: {{ {accents} }},{wood}
    ceiling: '{hx('polifarbe-b15')}',
    floor: {{ pattern: '{fl['pattern']}', tone: '{fl['hex']}', dir: 'z'{plank} }},{hall}
    door: '{door['hex']}',
    doorStyle: '{door['style']}',
    handle: '{v['handle']}',
    skirting: {{ h: {v['skirting'][0]}, mode: '{v['skirting'][1]}' }},
    curtain: {curtain},
    wardrobeFront: 'mirror',
    textile: '{v['textile']}',
    doorLeafOptional: true,{choices}
    products: {{ {pr} }},
  }},"""

def groups_ts():
    srt = sorted(V, key=lambda v: order(v['id']))
    rows = []
    for lid, lab in LINES:
        ids = ', '.join(f"'{v['id']}'" for v in srt if line_of(v) == lid)
        rows.append(f"  {{ id: '{lid}', label: '{lab}', ids: [{ids}] }},")
    return ('\n/** A javaslatválasztó csoportjai (stílusvonalak, 2026-11-26; scripts/gen/gen_variants.py – LINES, LINE_OF). */\n'
            'export const VARIANT_GROUPS: { id: string; label: string; ids: string[] }[] = [\n' + '\n'.join(rows) + '\n];\n')


p = 'src/data/variants.ts'
s = open(p, encoding='utf-8').read()
head = s[: s.index("  // Javaslatok valós katalógustermékekkel")]
body = '\n'.join(ts(v) for v in sorted(V, key=lambda v: order(v['id'])))
s = head + """  // Javaslatok valós katalógustermékekkel (2026-11-01): fal, mennyezet, padló, ajtó és függöny – „kész”,
  // berendezetlen állapot. Az ágytextil általános szín; az opcionális dolgozóajtó-lap mindegyikben be van kapcsolva.
  // A padló lakásszintű (DD-006: a háló, nappali és dolgozó laminált padlója egységesen cserélődik); a JR-javaslatokban
  // (2026-11-17) a meglévő laminált marad, a járólapos zóna (hallFloor) a meglévő vagy új járólap. A JF-javaslatok
  // (2026-11-26) fekete/antracit ajtóval és fekete lámpákkal; a JF1–JF3 a meglévő laminálttal, a JF4–JF6 új padlóval.
  // A színek és a lapméretek a hozzárendelt katalógustermékek adataiból származnak.
""" + body + '\n];\n' + groups_ts()
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print(len(V), 'javaslat')
