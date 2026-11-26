# Közös rész a Bútor1 / Mindigbútor / Artpresident / Kanapékirály / BútorCity / Wilsondo szkriptekhez (furn_b_*.py):
# méretszűrés kategóriánként, rekordépítés, statisztika, mentés. (A furn_common.py más szkripteké.)
# A letöltés mindig a lib.fetch / lib.image_hex útján megy (robots.txt, Crawl-delay, BotCheck).
import re, collections, urllib.parse, html as H
import lib

BED_MATTRESS = ('180x200', '200x200')


def object_hex(url: str, hint: str = ''):
    """lib.image_hex(object); ha a fotó háttere nem fehér (a sarokpixelek egységes világos/szürke színe), akkor a
    háttérszínhez hasonló, a széllel összefüggő pixelek kihagyásával számol (ugyanazon a lib.fetch-es letöltésen át).
    Visszatérés: (hex, módszer) vagy (None, None)."""
    try:
        import io, numpy as np
        from PIL import Image
        b = lib.fetch(url, binary=True)
        if b:
            im = Image.open(io.BytesIO(b)).convert('RGBA')
            im.thumbnail((400, 400))
            a = np.asarray(im).astype(float)
            alpha = a[..., 3:4] / 255.0
            rgb = a[..., :3] * alpha + 255.0 * (1 - alpha)
            border = np.concatenate([rgb[:2].reshape(-1, 3), rgb[-2:].reshape(-1, 3), rgb[:, :2].reshape(-1, 3), rgb[:, -2:].reshape(-1, 3)])
            bg = np.median(border, axis=0)
            if border.std(axis=0).max() < 10 and not (bg.min() > 232 and bg.max() - bg.min() < 14):
                bgm = (np.abs(rgb - bg).max(-1) < 16)
                edge = np.zeros_like(bgm)
                for arr, ed in ((bgm, edge), (bgm.T, edge.T)):
                    for i in range(arr.shape[0]):
                        row = arr[i]
                        j = 0
                        while j < row.size and row[j]:
                            ed[i, j] = True; j += 1
                        j = row.size - 1
                        while j >= 0 and row[j]:
                            ed[i, j] = True; j -= 1
                px = rgb[~edge]
                if px.shape[0] >= 200:
                    lum = px @ np.array([0.2126, 0.7152, 0.0722])
                    lo, hi = np.percentile(lum, [25, 75])
                    core = px[(lum >= lo) & (lum <= hi)]
                    px = core if core.shape[0] >= 20 else px
                    m = lib._srgb(lib._lin(px).mean(0))
                    return '#%02X%02X%02X' % tuple(int(round(min(255, max(0, v)))) for v in m), 'corner-bg'
            if bg.min() > 232 and bg.max() - bg.min() < 14 and not re.search(r'feh[eé]r|kr[eé]m|ekr|elefánt|fehérített|hó|white|cream|ivory', hint.lower()):
                # fehér hátterű fotó: a nem szélhez kötött közel fehér pixelek (drótváz, lábak közti rés) is kimaradnak
                keep = ~((rgb.min(-1) > 226) & (rgb.max(-1) - rgb.min(-1) < 14))
                if keep.mean() >= 0.04 and keep.sum() >= 200:
                    px = rgb[keep]
                    lum = px @ np.array([0.2126, 0.7152, 0.0722])
                    lo, hi = np.percentile(lum, [25, 75])
                    core = px[(lum >= lo) & (lum <= hi)]
                    px = core if core.shape[0] >= 20 else px
                    m = lib._srgb(lib._lin(px).mean(0))
                    return '#%02X%02X%02X' % tuple(int(round(min(255, max(0, v)))) for v in m), 'white-bg-all'
    except (lib.RobotsBlocked, lib.BotCheck):
        return None, None
    except Exception:
        pass
    try:
        return lib.image_hex(url, mode='object'), 'lib'
    except (lib.RobotsBlocked, lib.BotCheck):
        return None, None


def _in(v, lo=None, hi=None):
    if v is None:
        return True
    return (lo is None or v >= lo) and (hi is None or v <= hi)


def check(cat: str, s: dict, extra: dict | None = None) -> str | None:
    """None, ha a méret átmegy a szűrésen (README táblázata); különben a kizárás oka."""
    extra = extra or {}
    w, d, h = s.get('w'), s.get('d'), s.get('h')
    if w is None:
        return 'nincs szélesség'
    ok = True
    if cat == 'sofa':
        ok = _in(w, 1700, 2500) and _in(d, None, 1100)
    elif cat == 'sofaChaise':
        ok = _in(w, 1800, 3000) and _in(d, None, 2000)
    elif cat == 'ottoman':
        ok = _in(w, 400, 1100) and _in(h, 300, 500)
    elif cat == 'tvUnit':
        ok = _in(w, 1200, 2400) and _in(d, 300, 500) and _in(h, None, 700)
    elif cat == 'tvWall':
        ok = _in(w, 1500, 2800)
    elif cat == 'nightstand':
        ok = _in(w, 300, 650) and _in(h, 350, 700)
    elif cat == 'diningTable':
        ok = _in(w, 600, 1800)
    elif cat == 'chair':
        ok = _in(w, 300, 600)
    elif cat in ('rugLiving', 'rugBedroom'):
        ok = _in(w, 2300, 3000) and _in(d, 1600, 2000)
    elif cat == 'divider':
        ok = _in(w, 800, 2000)
    elif cat == 'bed':
        if extra.get('mattress') not in BED_MATTRESS:
            return 'nem 180x200 / 200x200 matrac'
        ok = _in(d, None, 2300)
    elif cat == 'deskCorner':
        ok = _in(w, 1400, 2200)
    elif cat == 'coffeeTable':
        ok = _in(w, 500, 1300) and _in(h, 300, 550)
    elif cat == 'sideboard':
        ok = _in(w, 800, 1800) and _in(d, 300, 500) and _in(h, 600, 1000)
    elif cat == 'shelf':
        ok = _in(w, 400, 1200) and _in(d, 200, 400) and _in(h, 800, 2200)
    elif cat == 'armchair':
        ok = _in(w, 600, 950)
    elif cat == 'shoeCabinet':
        ok = _in(w, 500, 1200) and _in(d, 170, 400)
    return None if ok else 'méret a kereten kívül'


def num(s) -> float | None:
    """'1 234,5' / '2,300.00' / '263' → float."""
    if s is None:
        return None
    t = str(s).replace('\xa0', ' ').strip().replace(' ', '')
    if re.fullmatch(r'\d{1,3}(,\d{3})+(\.\d+)?', t):
        t = t.replace(',', '')
    elif re.fullmatch(r'\d{1,3}(\.\d{3})+', t):
        t = t.replace('.', '')
    else:
        t = t.replace(',', '.')
    try:
        return float(t)
    except ValueError:
        return None


def strip_tags(s: str) -> str:
    return re.sub(r'\s+', ' ', H.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()


def og(html_: str, prop='og:image') -> str | None:
    for pat in (r'<meta[^>]+(?:property|name)=["\']%s["\'][^>]+content=["\']([^"\']+)',
                r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']%s["\']'):
        m = re.search(pat % re.escape(prop), html_, re.I)
        if m:
            return H.unescape(m.group(1))
    return None


def mattress_from(text: str) -> str | None:
    """'180x200', '180 x 200 cm' – matracméret a szövegből (csak 180/200 széles, 200 hosszú)."""
    for m in re.finditer(r'(?<!\d)(\d{3})\s*[x×*]\s*(\d{3})(?!\d)', (text or '').lower()):
        a, b = m.group(1), m.group(2)
        if a in ('180', '200') and b == '200':
            return f'{a}x{b}'
    return None


def side_from(name: str) -> str | None:
    n = name.lower()
    if re.search(r'univerz|felcserélhető|bármelyik oldal|bal/jobb|jobb/bal|bal-jobb|bal és jobb', n):
        return 'reversible'
    bal = re.search(r'\bbal(os|\b)', n)
    jobb = re.search(r'\bjobb(os|\b)', n)
    if bal and not jobb:
        return 'left'
    if jobb and not bal:
        return 'right'
    return None


def shape_from(text: str) -> str | None:
    n = (text or '').lower()
    if re.search(r'kerek|ø|átmérő', n):
        return 'round'
    if re.search(r'ovális|oval', n):
        return 'oval'
    if re.search(r'téglalap|négyszög|szögletes|egyenes', n):
        return 'rect'
    return None


class Collector:
    def __init__(self, store: str, key: str):
        self.store, self.key = store, key
        self.items: list[dict] = []
        self.seen_url: set[str] = set()
        self.seen_id: set[str] = set()
        self.stats: dict[str, collections.Counter] = collections.defaultdict(collections.Counter)

    def seen(self, url: str) -> bool:
        return url in self.seen_url

    def skip(self, cat: str, why: str, url: str | None = None):
        self.stats[cat][why] += 1
        if url:
            self.seen_url.add(url)

    def add(self, cat: str, *, url: str, name: str, size: dict, price=None, image: str | None = None,
            extra: dict | None = None, note: str = '', article: str | None = None, brand: str | None = None,
            colorName: str | None = None, material: str | None = None, list_price=None, **fields):
        """Méretszűrés → szín a fotóból → rekord. Visszatérés: a rekord vagy None (kimaradt)."""
        extra = extra or {}
        self.seen_url.add(url)
        size = {k: v for k, v in size.items() if v is not None}
        why = check(cat, size, extra)
        if why:
            self.stats[cat][why] += 1
            return None
        hexv = None
        notes = [note] if note else []
        if image:
            hexv, how = object_hex(image, name + ' ' + (colorName or ''))
            if hexv and how == 'corner-bg':
                notes.append('Szín: a fotó háttere nem fehér, a háttér kihagyásával számolva.')
        if hexv and lib.loud(hexv):
            self.stats[cat]['harsány szín'] += 1
            return None
        if not hexv:
            notes.append('Szín: nincs használható fő termékfotó, a hex hiányzik.')
            self.stats[cat]['nincs hex (megtartva)'] += 1
        sp = urllib.parse.urlsplit(url)
        tail = sp.path.rstrip('/').rsplit('/', 1)[-1] + (('-' + sp.query) if sp.query else '')
        base = lib.slug(re.sub(r'\.html?$', '', tail), 64) or lib.slug(name, 64)
        rid = f'furn-{self.key}-{base}'
        n = 2
        while rid in self.seen_id:
            rid = f'furn-{self.key}-{base}-{n}'
            n += 1
        self.seen_id.add(rid)
        rec = {'id': rid, 'category': cat, 'store': self.store}
        if brand:
            rec['brand'] = brand
        rec['name'] = name
        if article:
            rec['article'] = article
        rec['size'] = size
        for k, v in fields.items():
            if v not in (None, '', []):
                rec[k] = v
        if colorName:
            rec['colorName'] = colorName
        if material:
            rec['material'] = material
        if hexv:
            rec['hex'] = hexv
            rec['hexSource'] = 'photo-sample'
        p = lib.price(price, self.store) if price else None
        if p:
            rec['price'] = p
        try:
            if list_price and price and float(list_price) > float(price):
                notes.append(f'akciós ár, eredeti: {lib.ft(list_price)}')
        except ValueError:
            pass
        rec['url'] = url
        if image:
            rec['imageUrl'] = image
        rec['checkedAt'] = lib.TODAY
        if notes:
            rec['note'] = '; '.join(notes)
        self.items.append(rec)
        self.stats[cat]['ok'] += 1
        return rec

    def report(self) -> str:
        return ' | '.join(f'{cat}: ' + ', '.join(f'{k}={v}' for k, v in c.most_common())
                          for cat, c in sorted(self.stats.items()))

    def save(self, note: str):
        lib.save('furniture', self.key, self.items, note + ' STAT: ' + self.report())
        print(self.report(), flush=True)
