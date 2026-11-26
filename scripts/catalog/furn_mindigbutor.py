# Mindigbútor (mindigbutor.hu, Shoprenter) – bútorgyűjtés. Listaoldal (?page=N) → termékoldal: microdata ár, og:image, "Paraméterek" táblázat.
# Kimenet: furniture-mindigbutor.json
import re, sys, os, html
import lib
from furn_b_common import *

STORE, KEY = 'Mindigbútor', 'mindigbutor'
B = 'https://mindigbutor.hu/butorok-abc-szerint-5097/'
CAND_CAP = int(os.environ.get('CAND_CAP', 300))
KEEP_CAP = int(os.environ.get('KEEP_CAP', 200))
K = 'nappali-szoba-butorok-260/karpitozott-butorok-4949/'
CATS = [
    ('sofa', [K + 'kanape-4967', K + 'ulogarnitura-4988']),
    ('sofaChaise', [K + 'sarokgarnitura-4973']),
    ('ottoman', [K + 'puff-pad-hintaszek-4970']),
    ('tvUnit', ['nappali-szoba-butorok-260/tv-szekreny-191']),
    ('tvWall', ['nappali-szoba-butorok-260/szekrenysor-194']),
    ('nightstand', ['haloszoba-butorok-256/ejjeliszekreny-201']),
    ('diningTable', ['konyhabutorok-etkezobutorok-251/etkezoasztal-186']),
    ('chair', ['konyhabutorok-etkezobutorok-251/etkezoszek-187']),
    ('rugLiving', ['dekoraciok-lakaskiegeszitok-261/szonyeg-232']),
    ('bed', ['haloszoba-butorok-256/franciaagy-322']),
    ('deskCorner', ['irodabutor-4955/iroasztal-4958']),
    ('coffeeTable', ['nappali-szoba-butorok-260/dohanyzoasztal-196']),
    ('sideboard', ['nappali-szoba-butorok-260/komod-200', 'konyhabutorok-etkezobutorok-251/talalo-190']),
    ('shelf', ['nappali-szoba-butorok-260/konyvespolc-konyvszekreny-206', 'nappali-szoba-butorok-260/polc-203']),
    ('armchair', [K + 'fotel-es-uloke-4952']),
    ('shoeCabinet', ['eloszoba-butorok-254/ciposszekreny-205']),
]
if len(sys.argv) > 1:
    CATS = [c for c in CATS if c[0] in sys.argv[1:]]
col = Collector(STORE, KEY)


def listing(path):
    seen, page = set(), 1
    while True:
        u = B + path + ('' if page == 1 else f'?page={page}')
        try:
            h = lib.fetch(u)
        except lib.RobotsBlocked:
            print('robots tiltja', u); return
        if not h:
            return
        new = 0
        for m in re.finditer(r'class="img-thumbnail-link"\s+href="([^"]+)"\s+title="([^"]*)"', h):
            if m.group(1) in seen:
                continue
            seen.add(m.group(1)); new += 1
            yield m.group(1), html.unescape(m.group(2))
        if not new or 'rel="next"' not in h:
            return
        page += 1


def params(p: str) -> dict:
    out = {}
    for a, b in re.findall(r'<tr>\s*<td>(.*?)</td>\s*<td><strong>(.*?)</strong>', p, re.S):
        a, b = strip_tags(a), strip_tags(b)
        if a and a not in out:
            out[a] = b
    return out


def cm(f, *keys):
    for k in keys:
        v = f.get(k)
        if v:
            m = re.match(r'\s*([\d.,]+)\s*(cm|mm|m)?\b', v)
            if m:
                x = num(m.group(1))
                if x is not None:
                    return round(x * {'mm': 1, 'm': 1000}.get(m.group(2), 10))
    return None


def desc_dims(p: str):
    """Leírásból: 'Méretek (szélesség x mélység x magasság): 44 x 42 x 49 cm' vagy 'Méretek: Szélesség: 39 cm Magasság: 52 cm Mélység: 30 cm'."""
    i = p.find('id="tab-productdescription')
    t = strip_tags(re.sub(r'<(script|style).*?</\1>', ' ', p[i: i + 9000], flags=re.S)) if i >= 0 else ''
    for m in re.finditer(r'\(([^()]{3,60})\)\s*:?\s*(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*cm', t):
        labs = re.findall(r'(szél|mély|mag|\bsz\b|\bmé\b|\bma\b)', m.group(1).lower())
        keys = [{'szél': 'w', 'sz': 'w', 'mély': 'd', 'mé': 'd', 'mag': 'h', 'ma': 'h'}[l.strip()] for l in labs]
        if sorted(keys) == ['d', 'h', 'w'] and re.search(r'Méretek?\s*$', t[max(0, m.start() - 14): m.start()]):
            v = dict(zip(keys, [round(num(m.group(k)) * 10) for k in (2, 3, 4)]))
            return v['w'], v['d'], v['h']
    j = t.find('Méretek')
    seg = t[j: j + 400] if j >= 0 else ''
    got = {}
    for m in re.finditer(r'(Szélesség|Mélység|Magasság)\s*:?\s*(\d+(?:[.,]\d+)?)\s*cm', seg):
        got.setdefault(m.group(1), round(num(m.group(2)) * 10))
    if 'Szélesség' in got:
        return got['Szélesség'], got.get('Mélység'), got.get('Magasság')
    return None, None, None


def product(cat, url, lname):
    p = lib.fetch(url)
    if not p:
        col.skip(cat, 'letöltési hiba', url); return
    f = params(p)
    nm = re.search(r'class="product-page-product-name"[^>]*>(.*?)</span>', p, re.S)
    name = html.unescape(strip_tags(nm.group(1))) if nm else html.unescape(og(p, 'og:title') or lname)
    pm = re.search(r'itemprop="price" content="(\d+)"', p)
    price = pm.group(1) if pm else None
    image = og(p)
    art = re.search(r'Cikkszám:</span>\s*([^\s<]+)', p)
    brand = f.get('Gyártó') if f.get('Gyártó') != STORE else None
    H, W, D = cm(f, 'Magasság'), cm(f, 'Szélesség'), cm(f, 'Mélység')
    if W is None:
        dw, dd, dh = desc_dims(p)
        if dw:
            W, D, H = dw, dd or D, dh or H
            notes0 = 'Méret a leírásból.'
        elif cat in ('tvWall', 'sideboard', 'shelf') and cm(f, 'Hosszúság'):
            W = cm(f, 'Hosszúság')
            notes0 = 'A szélesség a "Hosszúság" paraméterből (összhossz).'
        else:
            notes0 = ''
    else:
        notes0 = ''
    low = name.lower()
    size, extra, fields, notes = {}, {}, {}, ([notes0] if notes0 else [])
    ncat = cat
    if cat in ('diningTable', 'coffeeTable'):
        L = cm(f, 'Asztal hossza', 'Hosszúság')
        ext = cm(f, 'Az asztal hossza kinyújtott állapotban')
        form = (f.get('forma', '') + ' ' + f.get('Táblázat alakja', '')).lower()
        if 'kerek' in form and 'ovál' not in form and W:
            size.update(w=W, d=W); fields['shape'] = 'round'
        else:
            size.update(w=L or W, d=cm(f, 'Asztalmélység') or D)
            fields['shape'] = 'oval' if 'ovál' in form and 'szögletes' not in form else ('rect' if form.strip() else None)
        size['h'] = cm(f, 'Asztal magassága') or H
        if ext and ext > (size.get('w') or 0):
            size['ext'] = ext
    elif cat == 'bed':
        size.update(w=W, d=D, h=H)
        mt = mattress_from(name)
        extra['mattress'] = mt
        if mt:
            fields['mattress'] = mt
            size['sleepW'], size['sleepL'] = int(mt[:3]) * 10, 2000
        if f.get('Ágyneműtartós', '').lower().startswith('igen'):
            fields['storage'] = 'igen'
        if W is None:
            notes.append('külső szélesség nincs')
    elif cat == 'rugLiving':
        m = re.search(r'(?<!\d)(\d{2,3})\s*[x×]\s*(\d{2,3})(?!\d)', name.lower())
        if m:
            a, b = int(m.group(1)) * 10, int(m.group(2)) * 10
            size.update(w=max(a, b), d=min(a, b))
        t = cm(f, 'Mélység')
        if t and t <= 60:
            size['h'] = t
            fields['pile'] = None
        notes.append('Méret a termék nevéből (cm), a szálmagasság az oldalon nincs.')
    elif cat == 'ottoman':
        size.update(w=W, d=D, h=H)
    else:
        size.update(w=W, d=D, h=H)
    if cat == 'sofaChaise':
        a, b = size.get('w'), size.get('d')
        if a and b and b > a:
            size['w'], size['d'] = b, a
        fields['lType'] = 'chaise' if re.search(r'pihenő|heverő|récamié|chaise|lounge', low) else 'corner'
        sd = side_from(name)
        if sd:
            fields['chaiseSide'] = sd
    if cat in ('sofa', 'sofaChaise'):
        fields['sleeper'] = f.get('Ágyazható', '').lower().startswith('igen') or bool(re.search(r'ágyazható|nyitható|kinyitható', low))
    if cat == 'deskCorner':
        if not re.search(r'sarok|l alakú|l-alakú|l formájú', low):
            col.skip(cat, 'nem L alakú (névből)', url); return
        size['legL'] = size.get('d')
        sd = side_from(name)
        if sd:
            fields['chaiseSide'] = sd
    color = None
    for k in ('Szín', 'Színe', 'Kárpit színe', 'Test színe', 'Pult színe'):
        if f.get(k):
            color = f[k]; break
    col.add(ncat, url=url, name=name, size=size, price=price, image=image, extra=extra, note='; '.join(notes),
            article=art.group(1) if art else None, brand=brand, colorName=color, material=f.get('Anyag') or f.get('Test anyaga'), **fields)


for cat, paths in CATS:
    cand = 0
    done = False
    for path in paths:
        for url, lname in listing(path):
            if col.stats[cat]['ok'] >= KEEP_CAP or cand >= CAND_CAP:
                done = True; break
            if col.seen(url):
                continue
            if cat == 'bed' and not mattress_from(lname):
                col.skip(cat, 'nem 180x200 / 200x200 matrac (névből)', url); continue
            cand += 1
            try:
                product(cat, url, lname)
            except lib.RobotsBlocked:
                col.skip(cat, 'robots tiltja', url)
            except lib.BotCheck:
                print('BOTCHECK', url); col.save('Mindigbútor – megszakadt (botellenőrzés)'); raise
            except Exception as e:
                col.skip(cat, 'hiba: ' + type(e).__name__, url); print('HIBA', url, repr(e)[:100], flush=True)
            if cand % 25 == 0:
                print(cat, 'cand', cand, 'ok', col.stats[cat]['ok'], flush=True)
        if done:
            break
    print('==', cat, dict(col.stats[cat]), flush=True)
    col.save(f'Mindigbútor (mindigbutor.hu): listaoldal-bejárás (alapértelmezett sorrend, legfeljebb {CAND_CAP} megnézett / {KEEP_CAP} megtartott); '
             'méret a "Paraméterek" táblából (Szélesség/Mélység/Magasság, asztalnál Asztal hossza/Asztalmélység); az ágynál csak a névben szereplő '
             '180x200 / 200x200 matrac; a szőnyeg mérete a névből; ár microdata, szín az og:image fotó átlaga.')
