# Közös rész a bútorgyűjtő szkriptekhez (furn_<bolt>.py): kategorizálás, méretszűrés (README táblázata), szín, rekordépítés.
# A letöltés kizárólag a lib.fetch / lib.image_hex útján történik (robots.txt, szünet, gyorsítótár).
import io, json, os, re, time, traceback
import lib

FILTER_TXT = {
    'sofa': 'w 1700–2500, d ≤ 1100', 'sofaChaise': 'w 1800–3000, rövid ág ≤ 2000', 'ottoman': 'w 400–1100, h 300–500',
    'tvUnit': 'w 1200–2400, d 300–500, h ≤ 700', 'tvWall': 'w 1500–2800', 'nightstand': 'w 300–650, h 350–700',
    'diningTable': 'hossz/ø ≤ 1800', 'chair': 'w ≤ 600', 'rugLiving': '230–300 × 160–200 cm', 'divider': 'w 800–2000',
    'bed': '180×200 / 200×200 matrac, külső hossz ≤ 2300', 'deskCorner': 'hosszú ág 1400–2200', 'acousticPanel': '–',
    'coffeeTable': 'w 500–1300, h 300–550', 'sideboard': 'w 800–1800, d 300–500, h 600–1000',
    'shelf': 'w 400–1200, d 200–400, h 800–2200', 'armchair': 'w 600–950', 'shoeCabinet': 'w 500–1200, d 170–400',
}


def N(s) -> str:
    """Kisbetűs, ékezetmentes szöveg szóközökkel (kereséshez)."""
    return lib.slug(s or '', 600).replace('-', ' ')


def num(s):
    """'2,300.00' / '96,5' / '2 300' / '1.250,5' → float."""
    if s is None:
        return None
    if isinstance(s, (int, float)):
        return float(s)
    t = re.sub(r'[^\d,.\-]', '', str(s).replace('\xa0', '').replace(' ', ''))
    if not t:
        return None
    if ',' in t and '.' in t:
        # az utolsó elválasztó a tizedes
        if t.rfind(',') > t.rfind('.'):
            t = t.replace('.', '').replace(',', '.')
        else:
            t = t.replace(',', '')
    elif ',' in t:
        t = t.replace(',', '.')
    try:
        return float(t)
    except ValueError:
        return None


def mm(s, default_unit='cm') -> int | None:
    """'244 cm' / '2,300.00 mm' / '1.2 m' / 96 → mm (egész)."""
    if s is None:
        return None
    if isinstance(s, (int, float)):
        v = float(s)
        u = default_unit
    else:
        m = re.search(r'(-?[\d.,\s]+\d|\d)\s*(mm|cm|m)?\b', str(s).replace('\xa0', ' '))
        if not m:
            return None
        v = num(m.group(1))
        u = (m.group(2) or default_unit)
    if v is None:
        return None
    return round(v * {'mm': 1, 'cm': 10, 'm': 1000}[u])


# --- kategorizálás --------------------------------------------------------------------------------------------------

EXCL = re.compile(r'\b(kerti|kulteri|outdoor|gyerek|baba|jatszo|huzat|parnahuzat|derekalj|matrac|agyalap|agyracs|fejtamla|'
                  r'agyvegek|fejveg|agylab|labak|lab|paplan|parna|takaro|lepedo|fugg|lampa|tukor|vaza|gyertya)\b')


def classify(text: str) -> str | None:
    """Szöveg (bolti kategória + terméknév) → FurnCategory vagy None. A bútorkategóriák zárt halmaza."""
    t = N(text)
    if re.search(r'\b(kerti|kulteri|outdoor|gyerek\w*|baba\w*|ifjusagi|jatszo)\b|trofast|tarolokombinacio', t):
        return None
    if re.search(r'\b(akusztikus|hangszigetelo)\b', t) and 'panel' in t:
        return 'acousticPanel'
    if re.search(r'\b(cipos|cipo|cipotarolo)\b', t) and re.search(r'szekreny|tarolo|pad|polc|komod', t):
        return 'shoeCabinet'
    if re.search(r'ejjeli', t):
        return 'nightstand'
    if re.search(r'dohanyzo', t):
        return 'coffeeTable'
    if re.search(r'\btv\b|televizio', t):
        return 'tvWall' if re.search(r'\bfal\b|falegyseg|nappali fal|szekrenysor', t) else 'tvUnit'
    if re.search(r'szekrenysor|nappali fal|falegyseg|nappali szett|nappali butorszett', t):
        return 'tvWall'
    if re.search(r'szonyeg|\brug\b', t) and not re.search(r'furdo|alatet|csuszasgatlo|lepcso|futo\b', t):
        return 'rugLiving'
    if re.search(r'terelvalaszto|paravan|room divider', t):
        return 'divider'
    if re.search(r'iroasztal|szamitogepasztal|\bdesk', t):
        return 'deskCorner' if re.search(r'sarok|\bl alaku|\bl\b|corner', t) else None
    sofaish = re.search(r'kanape|ulogarnitura|\bsofa\b|kanapeagy', t)
    if re.search(r'\b(agykeret|franciaagy|boxspring|kontinentalis agy|agyak?|bed)\b', t) and (not sofaish or re.search(r'agykeret|franciaagy|boxspring', t)) and not re.search(
            r'agy alatti|agyalatti|agy es matrac|agyvegek|fejveg|agylab|agyrac|agyalap|agyterito|agytakaro|agykiegeszito|agy kiegeszito|agynemu', t):
        return 'bed'
    if sofaish and not re.search(r'parna|huzat', t):
        if re.search(r'sarokkanape|sarok ulogarnitura|sarokgarnitura|sarokulo|\bsarok\b|l alaku|u alaku|hevero|chaise|corner|fekvofotel', t):
            return 'sofaChaise'
        return 'sofa'
    if re.search(r'\bpuff|labtarto|ottoman|otoman|footstool|pouf', t):
        return 'ottoman'
    if re.search(r'\bfotel|armchair|fules szek', t) and not re.search(r'\b(irodai|gamer|babzsak)\b', t):
        return 'armchair'
    if re.search(r'etkezoasztal|etkezo asztal|dining table|kihuzhato asztal', t):
        return 'diningTable'
    if re.search(r'etkezoszek|etkezo szek|dining chair|\bszek(ek)?\b', t) and not re.search(
            r'\b(irodai|gamer|forgo\w*|bar|barszek\w*|hinta\w*|pad|zsamoly|pihenoszek|lepcso|babzsak|asztal|ulo)\b', t):
        return 'chair'
    if re.search(r'konyvespolc|polcos elem|regal|nyitott polc|polcrendszer|bookcase|bookshelf|\bpolc\b', t) and not re.search(
            r'\b(fali|falra|konyha\w*|furdo\w*|kosar)\b', t):
        return 'shelf'
    if re.search(r'talalo|komod|sideboard|fiokos szekreny|vitrin|kredenc|chest of drawers', t) and not re.search(
            r'\b(ruha\w*|gardrob\w*|konyha\w*|furdo\w*)\b', t):
        return 'sideboard'
    return None


def refine(cat: str | None, name: str) -> str | None:
    """Az alapkategória finomítása a névből (egyenes ↔ L kanapé)."""
    if cat in ('sofa', 'sofaChaise'):
        t = N(name)
        if re.search(r'sarokkanape|sarok ulogarnitura|sarokgarnitura|sarokulo|\bl alaku|\bu alaku|hevero|chaise|corner|fekvofotel|\b(jobb|bal) oldali.*sarok|sarok', t):
            return 'sofaChaise'
        return 'sofa'
    return cat


# --- méretszűrés ----------------------------------------------------------------------------------------------------

def _in(v, lo=None, hi=None):
    return v is not None and (lo is None or v >= lo) and (hi is None or v <= hi)


def check(cat: str, size: dict, d: dict) -> str | None:
    """None, ha a méret átmegy; különben a kihagyás oka. A hiányzó méret nem kizáró, a szélesség (w) kötelező."""
    w, dd, h = size.get('w'), size.get('d'), size.get('h')
    if w is None:
        return 'nincs szélesség'

    def opt(v, lo=None, hi=None):
        return v is None or _in(v, lo, hi)

    if cat == 'sofa':
        ok = _in(w, 1700, 2500) and opt(dd, None, 1100)
    elif cat == 'sofaChaise':
        short = size.get('chaiseD')
        ok = _in(w, 1800, 3000) and opt(short, None, 2000)
    elif cat == 'ottoman':
        ok = _in(w, 400, 1100) and opt(h, 300, 500)
    elif cat == 'tvUnit':
        ok = _in(w, 1200, 2400) and opt(dd, 300, 500) and opt(h, None, 700)
    elif cat == 'tvWall':
        ok = _in(w, 1500, 2800)
    elif cat == 'nightstand':
        ok = _in(w, 300, 650) and opt(h, 350, 700)
    elif cat == 'diningTable':
        ok = _in(w, 700, 1800) and opt(h, 650, 820)   # a 650–820 mm magasság kiszűri a kisasztalt és a bárasztalt
    elif cat == 'chair':
        ok = _in(w, None, 600) and w >= 300 and opt(h, 650, 1100)
    elif cat in ('rugLiving', 'rugBedroom'):
        ok = _in(w, 2300, 3000) and _in(dd, 1600, 2000)
    elif cat == 'divider':
        ok = _in(w, 800, 2000)
    elif cat == 'bed':
        ok = (size.get('sleepW'), size.get('sleepL')) in ((1800, 2000), (2000, 2000)) and opt(dd, None, 2300)
    elif cat == 'deskCorner':
        ok = _in(w, 1400, 2200)
    elif cat == 'acousticPanel':
        ok = True
    elif cat == 'coffeeTable':
        ok = _in(w, 500, 1300) and opt(h, 300, 550)
    elif cat == 'sideboard':
        ok = _in(w, 800, 1800) and opt(dd, 300, 500) and opt(h, 600, 1000)
    elif cat == 'shelf':
        ok = _in(w, 400, 1200) and opt(dd, 200, 400) and opt(h, 800, 2200)
    elif cat == 'armchair':
        ok = _in(w, 600, 950)
    elif cat == 'shoeCabinet':
        ok = _in(w, 500, 1200) and opt(dd, 170, 400)
    else:
        return 'ismeretlen kategória'
    return None if ok else 'méret a kereten kívül'


def build_size(cat: str, d: dict) -> dict:
    """A bolti parse() `dims` mezőjéből a FurnitureProduct.size (mm)."""
    g = d.get('dims', {})
    W, D, H = g.get('W'), g.get('D'), g.get('H')
    z = {}
    if cat in ('rugLiving', 'rugBedroom'):
        if W and D:
            z['w'], z['d'] = max(W, D), min(W, D)
        if g.get('thick'):
            z['h'] = g['thick']
        if g.get('pile'):
            z['pile'] = g['pile']
        return z
    if cat == 'sofaChaise':
        if W and D:
            z['w'], z['chaiseD'] = max(W, D), min(W, D)
        elif W:
            z['w'] = W
        if H:
            z['h'] = H
        for k in ('seatH', 'sleepW', 'sleepL', 'chaiseW'):
            if g.get(k):
                z[k] = g[k]
        return z
    if g.get('DIAM'):
        W = D = g['DIAM']
    if W:
        z['w'] = W
    if D:
        z['d'] = D
    if H:
        z['h'] = H
    for k in ('seatH', 'sleepW', 'sleepL', 'ext', 'headH', 'legL', 'legD'):
        if g.get(k):
            z[k] = g[k]
    return z


# --- képek, szín ----------------------------------------------------------------------------------------------------

def white_bg(url: str) -> bool | None:
    """True, ha a kép szélei (nagyrészt) fehérek – tárgyfotó. None, ha nem tölthető le."""
    try:
        import numpy as np
        from PIL import Image
    except ImportError:
        return None
    b = lib.fetch(url, binary=True)
    if not b:
        return None
    try:
        im = Image.open(io.BytesIO(b)).convert('RGBA')
    except Exception:
        return None
    im.thumbnail((200, 200))
    a = np.asarray(im).astype(float)
    rgb, al = a[..., :3], a[..., 3]
    edge = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    ea = np.concatenate([al[0], al[-1], al[:, 0], al[:, -1]])
    white = ((edge.min(-1) > 235) & (edge.max(-1) - edge.min(-1) < 18)) | (ea < 40)
    return bool(white.mean() > 0.85)


def pick_image(urls: list[str], tries=3) -> tuple[str | None, bool]:
    """Az első fehér hátterű fotó a képek közül (max. `tries` db). Ha nincs, az első kép és False."""
    urls = [u for u in urls if u]
    if not urls:
        return None, False
    for u in urls[:tries]:
        try:
            r = white_bg(u)
        except lib.RobotsBlocked:
            r = None
        if r:
            return u, True
    return urls[0], False


def object_hex(url: str) -> str | None:
    """Fehér hátterű tárgyfotó átlagszíne: a háttér a sarkokból kiinduló flood-fill-lel (a lábak közötti hátteret is kivágja,
    amit a lib.image_hex csak a széllel érintkező futamokként tesz), majd a világosság szerinti középső 50 % lineáris átlaga.
    Ha a sarkok nem fehérek (enteriőrkép), a lib.image_hex(mode='object') eredménye."""
    try:
        import numpy as np
        from PIL import Image, ImageDraw
    except ImportError:
        return None
    b = lib.fetch(url, binary=True)
    if not b:
        return None
    try:
        im = Image.open(io.BytesIO(b))
        if im.mode in ('RGBA', 'LA', 'P'):
            im = im.convert('RGBA')
            bgim = Image.new('RGBA', im.size, (255, 255, 255, 255))
            bgim.alpha_composite(im)
            im = bgim
        im = im.convert('RGB')
    except Exception:
        return None
    im.thumbnail((320, 320))
    w, h = im.size
    a0 = np.asarray(im).astype(int)
    corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    if not all(a0[y, x].min() > 225 for x, y in corners):
        return lib.image_hex(url, mode='object')
    mark = (255, 0, 255)
    for x, y in corners:
        if tuple(im.getpixel((x, y))) != mark:
            ImageDraw.floodfill(im, (x, y), mark, thresh=9)
    a = np.asarray(im).astype(float)
    bg = (a[..., 0] == 255) & (a[..., 1] == 0) & (a[..., 2] == 255)
    grow = bg.copy()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        grow |= np.roll(bg, (dy, dx), (0, 1))
    px = np.asarray(Image.open(io.BytesIO(b)).convert('RGB').resize((w, h))).astype(float)[~grow]
    if px.shape[0] < 50:
        px = np.asarray(Image.open(io.BytesIO(b)).convert('RGB').resize((w, h))).astype(float).reshape(-1, 3)
    lum = px @ np.array([0.2126, 0.7152, 0.0722])
    # a lábak/keret által bezárt háttér (nem érintkezik a sarokkal): ha a nem fehér pixelek mediánja sötét/színes, a fehérek háttérnek számítanak
    white = (px.min(-1) > 238) & (px.max(-1) - px.min(-1) < 10)
    if (~white).sum() >= 50 and (~white).mean() >= 0.3 and np.median(lum[~white]) < 170:
        px, lum = px[~white], lum[~white]
    lo, hi = np.percentile(lum, [25, 75])
    core = px[(lum >= lo) & (lum <= hi)]
    px = core if core.shape[0] >= 20 else px
    m = lib._srgb(lib._lin(px).mean(0))
    return '#%02X%02X%02X' % tuple(int(round(min(255, max(0, v)))) for v in m)


# --- rekord ---------------------------------------------------------------------------------------------------------

SLEEP = re.compile(r'kinyithat|nyithat|agyazhat|kanapeagy|szethuzhat|kihuzhat|kihajthat|futon|agyfunkcio|alvasra|alvo|sofa bed|sleeper|fekvofelulet')
STORE = re.compile(r'taroloval|tarolohely|tarolos|agynemutarto|tarolodoboz|taroloteres|tarolo ?lada|tarololadaval|fiokos|storage')


def make(store: str, hint: str | None, d: dict, seen: set) -> tuple[dict | None, str | None, str | None]:
    """→ (rekord, kategória, kihagyás oka). `d` kulcsai: url, name, price, images[], color, material, brand, sku, cat_text,
    text (leírás a sleeper/storage felismeréshez), dims{W,D,H,DIAM,seatH,sleepW,sleepL,ext,thick,pile,...}, notes[]."""
    name = d['name']
    if d.get('cat_text'):
        cat = classify(d['cat_text'] + ' ' + name) or (hint if hint in ('tvWall', 'divider', 'acousticPanel') else None)
    else:
        cat = hint or classify(name)
    if cat is None:
        return None, None, 'nem bútorkategória'
    cat = refine(cat, name + ' ' + d.get('type_text', ''))
    size = build_size(cat, d)
    t = N(name + ' ' + d.get('text', ''))
    # ágynál a matracméret
    if cat == 'bed':
        m = re.search(r'(\d{3})\s*[x×*]\s*(\d{3})\s*(?:cm)?', name + ' ' + (d.get('text') or ''))
        sw, sl = d.get('dims', {}).get('sleepW'), d.get('dims', {}).get('sleepL')
        if not sw and m:
            sw, sl = int(m.group(1)) * 10, int(m.group(2)) * 10
        if sw and sl:
            size['sleepW'], size['sleepL'] = sw, sl
    why = check(cat, size, d)
    if why:
        return None, cat, why
    if cat == 'bed' and 'sleepW' not in size:
        return None, cat, 'nincs matracméret'
    url = d['url']
    seg = url.rstrip('/').split('/')[-1].replace('.html', '')
    sid = lib.slug(seg, 300) or lib.slug(name, 60)
    if len(sid) > 64:
        import hashlib
        sid = sid[:50].rstrip('-') + '-' + hashlib.sha1(seg.encode()).hexdigest()[:8]
    rid = f"furn-{lib.slug(store)}-{sid}"
    if rid in seen:
        return None, cat, 'duplikátum'
    # szín
    if d.get('white_first') and d.get('images'):
        img, white = d['images'][0], True
    else:
        img, white = pick_image(d.get('images') or [])
    hexv = None
    if img:
        try:
            hexv = object_hex(img)
        except lib.RobotsBlocked:
            hexv = None
    if hexv and lib.loud(hexv):
        return None, cat, 'harsány szín'
    seen.add(rid)
    rec = {'id': rid, 'category': cat, 'store': store}
    if d.get('brand'):
        rec['brand'] = d['brand']
    rec['name'] = name
    if d.get('sku'):
        rec['article'] = str(d['sku'])
    rec['size'] = size
    if cat in ('diningTable', 'coffeeTable'):
        rec['shape'] = d.get('shape') or ('round' if d.get('dims', {}).get('DIAM') else ('oval' if re.search(r'ovalis|oval', t) else 'rect'))
    if cat in ('sofa', 'sofaChaise'):
        rec['sleeper'] = bool(d['sleeper']) if 'sleeper' in d else bool(SLEEP.search(t))
    if cat == 'sofaChaise':
        rec['lType'] = 'chaise' if re.search(r'hevero|chaise|recamier|fekvofotel|otoman', t + ' ' + N(d.get('type_text', ''))) else 'corner'
    if cat == 'bed':
        rec['mattress'] = f"{size['sleepW'] // 10}x{size['sleepL'] // 10}"
    if d.get('color'):
        rec['colorName'] = d['color']
    if d.get('material'):
        rec['material'] = d['material']
    if cat in ('sofa', 'sofaChaise', 'bed') and (d['storage'] if 'storage' in d else bool(STORE.search(t))):
        rec['storage'] = 'igen'
    if hexv:
        rec['hex'] = hexv
        rec['hexSource'] = 'photo-sample'
    if d.get('price'):
        rec['price'] = lib.price(d['price'], store)
    rec['url'] = url
    if img:
        rec['imageUrl'] = img
    rec['checkedAt'] = lib.TODAY
    notes = list(d.get('notes') or [])
    if img and not white:
        notes.append('a fotó nem fehér hátterű tárgyfotó (a szín közelítő)')
    if not hexv:
        notes.append('a szín nem mintavételezhető (nincs használható fotó)')
    if cat == 'sofaChaise' and d.get('dims', {}).get('W') and d['dims'].get('D') and d['dims']['W'] < d['dims']['D']:
        notes.append('a bolt szélessége kisebb a mélységnél; w = a hosszabb, chaiseD = a rövidebb méret')
    if notes:
        rec['note'] = '; '.join(notes)
    return rec, cat, None


def run(store: str, cands, parse, note: str, cap: dict | None = None, kind='furniture', save_every=150, stats_extra=None):
    """cands: [(url, hint)] vagy callable-iterátor. parse(html, url) → d vagy None. cap: kategóriánkénti maximum."""
    items: list[dict] = []
    seen: set = set()
    per = {}
    rejects = {}
    errs = {'robots': 0, 'nincs oldal': 0, 'hiba': 0}
    t0 = time.time()
    n = 0
    botcheck = False
    limit = int(os.environ.get('FURN_LIMIT', 0))
    for url, hint in cands:
        n += 1
        if limit and n > limit:
            break
        if cap and hint and per.get(hint, 0) >= cap.get(hint, 10 ** 9):
            continue
        try:
            html = lib.fetch(url)
        except lib.RobotsBlocked:
            errs['robots'] += 1
            continue
        except lib.BotCheck:
            print('BOTCHECK', url, flush=True)
            botcheck = True
            break
        if not html:
            errs['nincs oldal'] += 1
            continue
        try:
            d = parse(html, url)
            if not d:
                rejects['nincs termékadat'] = rejects.get('nincs termékadat', 0) + 1
                continue
            d.setdefault('url', url)
            rec, cat, why = make(store, hint, d, seen)
        except lib.RobotsBlocked:
            errs['robots'] += 1
            continue
        except lib.BotCheck:
            print('BOTCHECK', url, flush=True)
            botcheck = True
            break
        except Exception as e:
            errs['hiba'] += 1
            print('HIBA', url, repr(e)[:120], flush=True)
            if errs['hiba'] <= 3:
                traceback.print_exc()
            continue
        if rec:
            if cap and per.get(cat, 0) >= cap.get(cat, 10 ** 9):
                continue
            items.append(rec)
            per[cat] = per.get(cat, 0) + 1
        else:
            k = f'{cat or "-"}: {why}'
            rejects[k] = rejects.get(k, 0) + 1
        if n % 50 == 0:
            print(f'[{store}] {n} oldal, {len(items)} elem, {int(time.time() - t0)} s; {per}', flush=True)
        if len(items) and len(items) % save_every == 0:
            lib.save(kind, store, items, 'részeredmény')
    stat = {'store': store, 'pages': n, 'items': len(items), 'perCategory': per, 'rejects': rejects, 'errors': errs,
            'botcheck': botcheck, 'seconds': int(time.time() - t0)}
    if stats_extra:
        stat.update(stats_extra)
    stxt = '; '.join(f'{k}: {v}' for k, v in sorted(per.items()))
    lib.save(kind, store, items, f'{note} Darab kategóriánként: {stxt}.' + (' BOTELLENŐRZÉS miatt megszakadt.' if botcheck else ''))
    json.dump(stat, open(os.path.join(lib.OUT, f'{kind}-{lib.slug(store)}.stats.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(json.dumps(stat, ensure_ascii=False, indent=1), flush=True)
    return items


def cdata(u: str) -> str:
    return re.sub(r'<!\[CDATA\[|\]\]>', '', u).strip()


def big_sitemap(url: str, maxb=120_000_000) -> list[str]:
    """Nagy (>8 MB) sitemap letöltése a lib robots-ellenőrzésével és szünetével, saját lemezgyorsítótárral; → <loc> URL-ek."""
    import hashlib
    path = os.path.join(lib.CACHE, 'big_' + hashlib.sha1(url.encode()).hexdigest())
    if os.path.exists(path):
        body = open(path, 'rb').read()
    else:
        if not lib.allowed(url):
            raise lib.RobotsBlocked(url)
        time.sleep(lib.MIN_GAP)
        st, body, ct = lib._raw(url, timeout=300, maxb=maxb)
        if st != 200:
            print('HTTP', st, url, flush=True)
            return []
        open(path, 'wb').write(body)
    txt = body.decode('utf-8', 'replace')
    return [cdata(u).replace('&amp;', '&') for u in re.findall(r'<loc>\s*(.*?)\s*</loc>', txt)]
