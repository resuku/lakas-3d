# Bútor1 (butor1.hu) – bútorgyűjtés. Listaoldal (CS-Cart, /page-N/) → termékoldal: JSON-LD (ár, kép) + "ty-product-feature" sorok (méret).
# Futtatás: lásd README.md. Kimenet: furniture-butor1.json
import re, sys, html
import lib
from furn_b_common import *

STORE, KEY, BASE = 'Bútor1', 'butor1', 'https://www.butor1.hu/'
import os
CAND_CAP = int(os.environ.get('CAND_CAP', 300))     # kategóriánként legfeljebb ennyi termékoldalt nézünk meg
KEEP_CAP = int(os.environ.get('KEEP_CAP', 200))     # és legfeljebb ennyit tartunk meg

CATS = [  # (kategória, [listaoldalak])
    ('sofa', ['karpitozott-butorok/kanapek/', 'karpitozott-butorok/kanapeagyak/', 'karpitozott-butorok/bor-kanapek/']),
    ('sofaChaise', ['karpitozott-butorok/sarokkanapek/', 'karpitozott-butorok/agyazhato-sarokkanapek/']),
    ('ottoman', ['karpitozott-butorok/puffok/']),
    ('tvUnit', ['tv-allvanyok/']),
    ('tvWall', ['nappali-butorok/nappali-butorszettek/']),
    ('nightstand', ['ejjeliszekrenyek/']),
    ('diningTable', ['konyha-es-etkezobutorok/konyha-es-etkezoasztalok/', 'asztalok/bovitheto-asztalok/']),
    ('chair', ['konyha-es-etkezobutorok/konyha-es-etkezoszekek/']),
    ('bed', ['agyak/franciaagyak/', 'agyak/kontinentalis-agyak/', 'agyak/agynemutartos-agyak/', 'agyak/']),
    ('deskCorner', ['iroasztalok/sarokiroasztalok/']),
    ('coffeeTable', ['dohanyzoasztalok/']),
    ('sideboard', ['komodok/', 'nappali-butorok/nappali-komodok/']),
    ('shelf', ['koenyvespolcok/']),
    ('armchair', ['karpitozott-butorok/fotelek/']),
    ('shoeCabinet', ['cipotarolok/']),
]
if len(sys.argv) > 1:
    CATS = [c for c in CATS if c[0] in sys.argv[1:]]

col = Collector(STORE, KEY)


def listing(path: str):
    """Termék-URL-ek + név a kategória összes oldaláról (alapértelmezett rendezés)."""
    seen = set()
    page = 1
    while True:
        u = BASE + path + ('' if page == 1 else f'page-{page}/')
        try:
            h = lib.fetch(u)
        except lib.RobotsBlocked:
            print('robots tiltja', u); return
        if not h:
            return
        new = 0
        for m in re.finditer(r'class="product-clickable"[^>]*href="([^"]+)"(.*?)(?=class="product-clickable"|$)', h, re.S):
            url = m.group(1)
            if url in seen:
                continue
            a = re.search(r'alt="([^"]*)"', m.group(2))
            seen.add(url); new += 1
            yield url, html.unescape(a.group(1)) if a else ''
        if not new or 'rel="next"' not in h:
            return
        page += 1


def feats(p: str) -> dict:
    out = {}
    for m in re.finditer(r'ty-product-feature_label">\s*(.*?)\s*</div>\s*<div class="ty-product-feature_value">(.*?)</div>\s*</div>', p, re.S):
        k = strip_tags(m.group(1)).rstrip(':').strip()
        v = strip_tags(m.group(2))
        if k and k not in out and len(k) < 60:
            out[k] = v
    return out


def mm(f, *keys):
    for k in keys:
        if k in f:
            m = re.match(r'\s*([\d.,]+)\s*(cm|mm)?', f[k])
            if m:
                v = num(m.group(1))
                if v is not None:
                    return round(v * (1 if m.group(2) == 'mm' else 10))
    return None


def product(cat: str, url: str, lname: str):
    p = lib.fetch(url)
    if not p:
        col.skip(cat, 'letöltési hiba', url); return
    f = feats(p)
    prods = [d for d in lib.jsonld(p) if str(d.get('@type', '')).endswith('Product') and d.get('offers')]
    ld = prods[0] if prods else {}
    name = ld.get('name') or lname or og(p, 'og:title') or url
    name = html.unescape(name)
    offers = ld.get('offers') or []
    offers = offers if isinstance(offers, list) else [offers]
    price = offers[0].get('price') if offers else None
    image = lib.ld_image(ld.get('image')) if ld else None
    image = image or og(p)
    H, W, D, L = mm(f, 'Magasság'), mm(f, 'Szélesség'), mm(f, 'Mélység'), mm(f, 'Hosszúság')
    diam = mm(f, 'Átmérő')
    notes = []
    size = {}
    extra = {}
    fields = {}
    ncat = cat
    low = name.lower()
    if cat == 'shelf' and 'térelválasztó' in low:
        ncat = 'divider'
        fields['dividerType'] = 'shelf'
    if cat in ('diningTable', 'coffeeTable'):
        if diam:
            size.update(w=diam, d=diam); fields['shape'] = 'round'
        elif L:
            size.update(w=L, d=W)       # a bolt: Hosszúság = hossz, Szélesség = az asztal mélysége
            fields['shape'] = shape_from(name + ' ' + f.get('Alak', '')) or 'rect'
        else:
            size.update(w=W, d=D)
            fields['shape'] = shape_from(name + ' ' + f.get('Alak', '')) or 'rect'
        size['h'] = H
        for k, v in f.items():
            if re.search(r'kihúz|bővít|hosszabb', k, re.I) and re.search(r'\d', v):
                e = mm({'x': v}, 'x')
                if e and e > (size.get('w') or 0):
                    size['ext'] = e
        if size.get('ext') is None and f.get('Hosszabbíthatóság', '').lower().startswith('igen'):
            notes.append('Bővíthető, a kinyitott hossz az oldalon nem szerepel.')
    elif cat == 'bed':
        size.update(w=W, d=L or D, h=H, headH=H)
        mt = mattress_from(f.get('Megfelelő matracméret', ''))
        extra['mattress'] = mt
        if mt:
            fields['mattress'] = mt
            size['sleepW'], size['sleepL'] = int(mt[:3]) * 10, 2000
        if f.get('Ágyneműtartó', '').lower().startswith('igen'):
            fields['storage'] = 'igen'
    elif cat == 'ottoman':
        size.update(w=diam or W, d=diam or D or L, h=H)
        if diam:
            fields['shape'] = 'round'
        if f.get('Tárolódoboz', '').lower().startswith('igen'):
            fields['storage'] = 'igen'
    else:
        size.update(w=W, d=D, h=H)
        if L and not D:
            if cat in ('sideboard', 'tvUnit', 'shelf', 'nightstand', 'shoeCabinet', 'tvWall'):
                notes.append(f'Hosszúság: {L // 10} cm – nem egyértelmű, hogy a mélység-e, ezért a mélység kimaradt.')
            elif cat == 'armchair':
                pass
    if cat == 'sofaChaise':
        w_, d_ = size.get('w'), size.get('d')
        if w_ and d_ and d_ > w_:
            size['w'], size['d'] = d_, w_
        fields['lType'] = 'chaise' if re.search(r'pihenő|heverő|récamié|chaise|lounge', low) else 'corner'
        sd = side_from(name)
        if sd:
            fields['chaiseSide'] = sd
    if cat in ('sofa', 'sofaChaise'):
        sw, sl, st = mm(f, 'A fekvőfelület szélessége'), mm(f, 'A fekvőfelület hossza'), mm(f, 'Ülésmagasság')
        fields['sleeper'] = f.get('Ágyfunkció', '').lower().startswith('igen')
        if sw and sl:
            size['sleepW'], size['sleepL'] = sw, sl
        if st:
            size['seatH'] = st
        if f.get('Ágyneműtartó', '').lower().startswith('igen'):
            fields['storage'] = 'igen'
    if cat == 'armchair':
        st = mm(f, 'Ülésmagasság')
        if st:
            size['seatH'] = st
    if cat == 'deskCorner':
        size['legL'] = size.get('d')
        side = side_from(name)
        if side:
            fields['chaiseSide'] = side
        if f.get('Univerzális bútorok', '').lower().startswith('igen'):
            fields['chaiseSide'] = 'reversible'
    color = f.get('Szín')
    if not color:
        k = [v for kk, v in f.items() if kk.startswith('Kárpit')]
        color = None
    mat = f.get('Anyag')
    if mat:
        mat = re.sub(r'\b(\w+(?: \w+)?) \1\b', r'\1', mat)
    col.add(ncat, url=url, name=name, size=size, price=price, image=image, extra=extra, note='; '.join(notes),
            article=str(ld.get('sku') or '') or None, brand=(ld.get('brand') or {}).get('name') if isinstance(ld.get('brand'), dict) else None,
            colorName=color, material=mat, **fields)


for cat, paths in CATS:
    cand = 0
    for path in paths:
        for url, lname in listing(path):
            if col.stats[cat]['ok'] >= KEEP_CAP or cand >= CAND_CAP:
                break
            if col.seen(url):
                continue
            if cat == 'bed' and re.search(r'\d{2,3}\s*[x×]\s*\d{3}', lname) and not mattress_from(lname):
                col.skip(cat, 'nem 180x200 / 200x200 matrac (névből)', url); continue
            cand += 1
            try:
                product(cat, url, lname)
            except lib.RobotsBlocked:
                col.skip(cat, 'robots tiltja', url)
            except lib.BotCheck:
                print('BOTCHECK', url); col.save('Bútor1 – megszakadt (botellenőrzés)'); raise
            except Exception as e:
                col.skip(cat, 'hiba: ' + type(e).__name__, url); print('HIBA', url, repr(e)[:100], flush=True)
            if cand % 25 == 0:
                print(cat, 'cand', cand, 'ok', col.stats[cat]['ok'], flush=True)
        if col.stats[cat]['ok'] >= KEEP_CAP or cand >= CAND_CAP:
            break
    print('==', cat, dict(col.stats[cat]), flush=True)
    col.save(f'Bútor1 (butor1.hu): listaoldal-bejárás kategóriánként (alapértelmezett sorrend, legfeljebb {CAND_CAP} megnézett / {KEEP_CAP} megtartott); '
             'méret a "Tulajdonságok és méretek" sorokból (Szélesség/Mélység/Magasság; asztalnál és ágynál a Hosszúság a hossz, a Szélesség a mélység); '
             'ár a JSON-LD-ből; szín a fő termékfotó átlagából (object).')
