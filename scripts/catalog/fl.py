# Padló / járólap gyűjtők közös segédei (a lib.py-t kiegészíti; a lib.py-t nem módosítjuk).
import re, sys, html as _html
import lib

HERRING = re.compile(r'hal\s?sz[aá]l[kl]|herring|heringbone|herringbone|chevron|francia\s*h[aá]l', re.I)


def txt(s: str) -> str:
    return re.sub(r'\s+', ' ', _html.unescape(re.sub(r'<[^>]+>', ' ', s or ''))).strip()


def num(s) -> float | None:
    if s is None:
        return None
    m = re.search(r'\d+(?:[.,]\d+)?', str(s).replace('\xa0', ' '))
    return float(m.group(0).replace(',', '.')) if m else None


def dims3(s: str):
    """'1220 x 180 x 2,5 mm' / '1285x192x7' → (l, w, t) mm, a hosszabb oldal l. None, ha nincs 3 szám."""
    m = re.search(r'(\d+(?:[.,]\d+)?)\s*(?:mm)?\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*(?:mm)?\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*(mm|cm)?', s or '', re.I)
    if not m:
        return None
    a, b, c = [float(m.group(i).replace(',', '.')) for i in (1, 2, 3)]
    if (m.group(4) or '').lower() == 'cm':
        a, b, c = a * 10, b * 10, c * 10
    if b < c and c >= 50 and b <= 30:
        b, c = c, b
    l, w = max(a, b), min(a, b)
    return {'l': round(l), 'w': round(w), 't': round(c, 1) if c % 1 else round(c)}


def dims2(s: str):
    """'30x60 cm' / '60 x 60' / '120x60cm' → (l, w) mm; cm-t feltételez, ha az értékek < 300 (a mm-t, ha >= 300)."""
    m = re.search(r'(\d+(?:[.,]\d+)?)\s*(cm|mm)?\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*(cm|mm)?', s or '', re.I)
    if not m:
        return None
    a, b = float(m.group(1).replace(',', '.')), float(m.group(3).replace(',', '.'))
    unit = (m.group(4) or m.group(2) or '').lower()
    if unit == 'cm' or (not unit and max(a, b) < 300):
        a, b = a * 10, b * 10
    return {'l': round(max(a, b)), 'w': round(min(a, b))}


def pack_m2(s: str):
    m = re.search(r'(\d+(?:[.,]\d+)?)\s*m\s*(?:2|²)', s or '', re.I)
    return float(m.group(1).replace(',', '.')) if m else None


def ftype(text: str) -> str | None:
    """Padlótípus a névből / kategóriából. None: nem padló (szegélyléc, fal, kiegészítő…)."""
    t = text.lower()
    if re.search(r'szeg[eé]ly|profil|alátét|alatet|fólia|tisztít|mintadarab|termékminta|falburkol|falpanel|kerít|kerit|lépcső|lecsap|zárószerelv|szegőléc|szegolec', t):
        return None
    wp = bool(re.search(r'v[ií]z[aá]ll|aqua|water|waterproof|hydro|wet', t))
    if re.search(r'\bspc\b|stone plastic|kőpolimer', t):
        return 'SPC'
    if re.search(r'wpc', t):
        return None
    if re.search(r'vinyl|pvc|lvt|rigid|click vinyl|ceramin', t):
        return 'vinyl'
    if re.search(r'lamin[aá]lt|laminate', t):
        return 'vízálló laminált' if wp else 'laminált'
    if re.search(r'szalag\s?parketta|parketta|massz[ií]v|h[aá]rom\s?r[eé]teg|[ée]p[ií]tett|rétegelt|fa\s?padl', t):
        return 'szalagparketta'
    return None


def herring(*texts) -> bool:
    return any(HERRING.search(t or '') for t in texts)


def rec(*, id, store, manufacturer=None, name, decor=None, type, pattern, url, size, hex=None, price=None, wear=None,
        bevel=None, note=''):
    r = {'id': id, 'store': store, 'manufacturer': manufacturer, 'name': name, 'decor': decor, 'type': type,
         'pattern': pattern}
    if hex:
        r['hex'] = hex
        r['tone'] = lib.wood_tone(hex)
        r['hexSource'] = 'photo-sample'
    r.update({'price': price, 'url': url, 'checkedAt': lib.TODAY, 'size': size, 'wear': wear, 'bevel': bevel,
              'note': note})
    return {k: v for k, v in r.items() if v not in (None, '')}


def crawl(urls, parse, label):
    """parse(url, html) → rekord | None. Robots-tiltott / hibás oldalt kihagy, számlálja."""
    out, skip, blocked = [], 0, 0
    for i, u in enumerate(urls):
        try:
            h = lib.fetch(u)
            if not h:
                skip += 1
                continue
            r = parse(u, h)
        except lib.RobotsBlocked:
            blocked += 1
            continue
        except lib.BotCheck:
            print('BOTCHECK', label, u, flush=True)
            raise
        except Exception as e:
            print('PARSEHIBA', u, repr(e)[:100], flush=True)
            skip += 1
            continue
        if r:
            out.append(r)
        if i % 50 == 0:
            print(label, i, '/', len(urls), 'rekord', len(out), flush=True)
    print(label, 'kész: rekord', len(out), 'kihagyva', skip, 'robots-tiltott', blocked, flush=True)
    return out, skip, blocked


def dedup(items):
    seen, out = set(), []
    for r in items:
        if r['url'] in seen:
            continue
        seen.add(r['url'])
        out.append(r)
    return out


def tokens(h: str, start='') -> list[str]:
    """HTML → szövegtoken-lista (a script/style nélkül)."""
    h = re.sub(r'<script.*?</script>|<style.*?</style>|<!--.*?-->', '', h, flags=re.S)
    parts = [txt(x) for x in re.split(r'<[^>]+>', h)]
    parts = [p for p in parts if p]
    if start and start in parts:
        parts = parts[parts.index(start):]
    return parts


def after(toks: list[str], label: str, labels: tuple, maxn=4) -> list[str]:
    """A label utáni tokenek a következő ismert címkéig."""
    for i, t in enumerate(toks):
        if t.strip(': ').lower() == label.lower():
            out = []
            for x in toks[i + 1:i + 1 + maxn]:
                if x.strip(': ') in labels:
                    break
                out.append(x)
            return out
    return []


def interior_frac(url: str) -> float | None:
    """A kép világos, telítetlen (fal, bútor, ég) pixeleinek aránya: dekor-/padlókép ~0, enteriőrfotó > 0,12."""
    try:
        import io
        import numpy as np
        from PIL import Image
        b = lib.fetch(url, binary=True)
        if not b:
            return None
        im = Image.open(io.BytesIO(b)).convert('RGB')
        im.thumbnail((200, 200))
        a = np.asarray(im).astype(int)
        mx, mn = a.max(-1), a.min(-1)
        return float(((mn > 190) & (mx - mn < 22)).mean())
    except Exception:
        return None


def pick_swatch(urls: list[str]):
    """A galéria képei közül a dekor-/padlóképet választja (legkevesebb fal/fehér). → (url, interior_only: bool)."""
    best, bf = None, 9.0
    for u in urls[:3]:
        f = interior_frac(u)
        if f is None:
            continue
        if f < bf:
            best, bf = u, f
        if f < 0.04:
            break
    return best, (bf > 0.10)


def save_floor(store, items, note):
    """floor-fájl: csak plank/herringbone, hex+tone kötelező; a tile mintájú rekordok a tile-fájlba kerülnek."""
    good = []
    for r in items:
        if not r.get('hex'):
            continue
        r['tone'] = lib.wood_tone(r['hex'])
        s = r.get('size')
        if s and not (50 <= s['w'] <= s['l'] <= 3000):
            r.pop('size')
            r['note'] = (r.get('note', '') + '; a lapméret az oldalon következetlen, kihagyva').strip('; ')
        good.append(r)
    fl_items = [r for r in good if r['pattern'] != 'tile']
    ti = [r for r in good if r['pattern'] == 'tile']
    dropped = len(items) - len(good)
    lib.save('floor', store, fl_items, note + f' Szín nélküli (kép híján) rekord kihagyva: {dropped}.')
    if ti:
        lib.save('tile', store, ti, note + ' Ez a fájl a négyzetes/lap alakú (pattern tile) padlótermékeket tartalmazza (vinyl/laminált/SPC lap).')
