# Közös segédfüggvények a katalógusgyűjtő szkriptekhez (scripts/catalog/*.py).
# Futtatás konténerben (a tároló gyökeréből):
#   MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W):/w" -v "<scratchpad>:/s" -w /w python:3.12-slim \
#     sh -c "pip -q install pillow numpy >/dev/null 2>&1; python -X utf8 scripts/catalog/<forrás>.py"
#
# Szabályok (CLAUDE.md, 2026-11-25):
# - Minden kérés előtt robots.txt-ellenőrzés: a `*`, a `ClaudeBot`, az `anthropic-ai` és a `Claude-Web` csoport is engedje
#   az útvonalat; ha bármelyik tiltja, a kérés elmarad (RobotsBlocked). A Crawl-delay-t betartjuk, legalább 1,2 s szünet
#   hostonként.
# - Botellenőrzést (Cloudflare, captcha) nem kerülünk meg: ha a válasz ilyen, BotCheck kivétel, a forrást ki kell hagyni.
# - Gyorsítótár: CACHE alatt URL-enként; ismételt futtatás nem tölt le újra.
import gzip, hashlib, io, json, os, re, time, urllib.error, urllib.parse, urllib.request

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
CACHE = os.environ.get('CATALOG_CACHE', '/s/catalog/cache')
OUT = os.environ.get('CATALOG_OUT', '/s/catalog/out')
TODAY = time.strftime('%Y-%m-%d')
AI_AGENTS = ('*', 'ClaudeBot', 'anthropic-ai', 'Claude-Web')
MIN_GAP = 1.2

os.makedirs(CACHE, exist_ok=True)
os.makedirs(OUT, exist_ok=True)


class RobotsBlocked(Exception):
    pass


class BotCheck(Exception):
    pass


_robots: dict[str, 'Robots'] = {}
_last: dict[str, float] = {}


class Robots:
    """robots.txt (RFC 9309): csoportok user-agent szerint, `*` és `$` minták, a leghosszabb illeszkedő szabály dönt,
    egyenlőségnél az Allow. Egy ügynökre a nevét tartalmazó csoport(ok) érvényesek, ha nincs ilyen, a `*` csoport."""

    def __init__(self, text: str):
        self.groups: list[tuple[list[str], list[tuple[bool, str]], float | None]] = []
        agents: list[str] = []
        rules: list[tuple[bool, str]] = []
        delay = None
        in_rules = False
        for raw in text.splitlines():
            line = raw.split('#', 1)[0].strip()
            if ':' not in line:
                continue
            k, v = [x.strip() for x in line.split(':', 1)]
            k = k.lower()
            if k == 'user-agent':
                if in_rules:
                    self.groups.append((agents, rules, delay))
                    agents, rules, delay, in_rules = [], [], None, False
                agents.append(v.lower())
            elif k in ('allow', 'disallow'):
                in_rules = True
                if v:
                    rules.append((k == 'allow', v))
            elif k == 'crawl-delay':
                in_rules = True
                try:
                    delay = float(v)
                except ValueError:
                    pass
        if agents:
            self.groups.append((agents, rules, delay))

    def _groups(self, agent: str):
        a = agent.lower()
        own = [g for g in self.groups if any(x != '*' and x in a for x in g[0])]
        return own or [g for g in self.groups if '*' in g[0]]

    @staticmethod
    def _match(pat: str, path: str) -> bool:
        rx = '^' + re.escape(pat).replace(r'\*', '.*')
        if rx.endswith(r'\$'):
            rx = rx[:-2] + '$'
        return re.match(rx, path) is not None

    def can_fetch(self, agent: str, url: str) -> bool:
        p = urllib.parse.urlsplit(url)
        path = (p.path or '/') + (('?' + p.query) if p.query else '')
        best: tuple[int, bool] | None = None
        for _, rules, _ in self._groups(agent):
            for allow, pat in rules:
                if self._match(pat, path):
                    cand = (len(pat), allow)
                    if best is None or cand[0] > best[0] or (cand[0] == best[0] and allow):
                        best = cand
        return True if best is None else best[1]

    def crawl_delay(self, agent='*') -> float | None:
        ds = [g[2] for g in self._groups(agent) if g[2] is not None]
        return max(ds) if ds else None


def _raw(url: str, timeout=40, maxb=8_000_000) -> tuple[int, bytes, str]:
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': '*/*', 'Accept-Language': 'hu,en;q=0.8'})
    try:
        r = urllib.request.urlopen(req, timeout=timeout)
        body, st, ct = r.read(maxb), r.status, r.headers.get('Content-Type', '')
    except urllib.error.HTTPError as e:
        body, st, ct = e.read(maxb), e.code, e.headers.get('Content-Type', '') if e.headers else ''
    if body[:2] == b'\x1f\x8b':
        try:
            body = gzip.decompress(body)
        except Exception:
            pass
    return st, body, ct


def robots(host_url: str) -> Robots:
    p = urllib.parse.urlsplit(host_url)
    base = f'{p.scheme}://{p.netloc}'
    if base not in _robots:
        try:
            st, body, _ = _raw(base + '/robots.txt', timeout=20)
            text = body.decode('utf-8', 'replace') if st == 200 else ''
        except Exception:
            text = ''
        _robots[base] = Robots(text)
    return _robots[base]


def allowed(url: str) -> bool:
    rp = robots(url)
    return all(rp.can_fetch(a, url) for a in AI_AGENTS)


def _gap(host: str) -> float:
    rp = _robots.get(host)
    cds = [rp.crawl_delay(a) for a in AI_AGENTS] if rp else []
    return max([MIN_GAP] + [c for c in cds if c])


def fetch(url: str, binary=False, cache=True, gap: float | None = None) -> str | bytes | None:
    """GET a cache-sel és az udvariassági szabályokkal; None, ha a válasz nem 200. Robots-tiltásnál RobotsBlocked."""
    key = hashlib.sha1(url.encode()).hexdigest()
    path = os.path.join(CACHE, key[:2], key)
    if cache and os.path.exists(path):
        b = open(path, 'rb').read()
        return b if binary else b.decode('utf-8', 'replace')
    if not allowed(url):
        raise RobotsBlocked(url)
    p = urllib.parse.urlsplit(url)
    host = f'{p.scheme}://{p.netloc}'
    wait = (gap or _gap(host)) - (time.time() - _last.get(host, 0))
    if wait > 0:
        time.sleep(wait)
    _last[host] = time.time()
    try:
        st, body, ct = _raw(url)
    except Exception as e:
        print('HIBA', url, str(e)[:80], flush=True)
        return None
    head = body[:4000].decode('utf-8', 'replace')
    if st in (403, 503) and ('Just a moment' in head or 'cf-chl' in head or 'captcha' in head.lower()):
        raise BotCheck(url)
    if st != 200:
        print('HTTP', st, url, flush=True)
        return None
    if cache:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        open(path, 'wb').write(body)
    return body if binary else body.decode('utf-8', 'replace')


def jsonld(html: str) -> list:
    out = []
    for m in re.findall(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', html, re.S | re.I):
        try:
            d = json.loads(m.strip())
        except Exception:
            continue
        stack = [d]
        while stack:
            x = stack.pop()
            if isinstance(x, list):
                stack.extend(x)
            elif isinstance(x, dict):
                out.append(x)
                if '@graph' in x:
                    stack.append(x['@graph'])
    return out


def ld_of_type(html: str, t: str) -> list[dict]:
    return [d for d in jsonld(html) if t in (d.get('@type') if isinstance(d.get('@type'), list) else [d.get('@type')])]


def ld_image(x) -> str | None:
    """JSON-LD `image` mező (szöveg, lista vagy ImageObject) → az első kép URL-je."""
    if isinstance(x, list):
        x = x[0] if x else None
    if isinstance(x, dict):
        x = x.get('contentUrl') or x.get('url')
    return x if isinstance(x, str) else None


def sitemap_urls(url: str, depth=0) -> list[str]:
    """Sitemap (index is) → URL-lista."""
    x = fetch(url)
    if not x:
        return []
    locs = re.findall(r'<loc>\s*(.*?)\s*</loc>', x)
    if '<sitemapindex' in x and depth < 3:
        out = []
        for l in locs:
            out += sitemap_urls(l.replace('&amp;', '&'), depth + 1)
        return out
    return [l.replace('&amp;', '&') for l in locs]


def slug(s: str, n=60) -> str:
    import unicodedata
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')[:n].strip('-')


def ft(n: float | int | str | None) -> str | None:
    """Szám → '12 990 Ft' (ezres tagolás szóközzel)."""
    if n in (None, ''):
        return None
    try:
        v = round(float(str(n).replace(' ', '').replace(',', '.')))
    except ValueError:
        return None
    return f'{v:,}'.replace(',', ' ') + ' Ft' if v > 0 else None


def price(n, store: str, unit='') -> str | None:
    """'12 990 Ft/m² (bolt, 2026-11-25)' – a projekt árformátuma."""
    f = ft(n)
    return f'{f}{unit} ({store}, {TODAY})' if f else None


def cm_to_mm(v) -> int | None:
    try:
        return round(float(str(v).replace(',', '.')) * 10)
    except (TypeError, ValueError):
        return None


# --- szín a termékfotóból -------------------------------------------------------------------------------------------

def _lin(c):
    import numpy as np
    c = c / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def _srgb(l):
    import numpy as np
    return np.where(l <= 0.0031308, l * 12.92, 1.055 * np.power(l, 1 / 2.4) - 0.055) * 255


def image_hex(url: str, mode='object', crop=0.0) -> str | None:
    """A termékfotó átlagszíne lineáris térben, hex.
    mode='object': a közel fehér/átlátszó háttér (és a nagyon világos, telítetlen pixelek a kép szélével összefüggően)
                   nélkül – fehér hátterű bútor-, lámpa-, ajtófotóhoz;
    mode='swatch': a teljes kép (opcionális `crop` szél levágásával) – dekorkép, színminta, padló, csempe."""
    try:
        import numpy as np
        from PIL import Image
    except ImportError:
        return None
    b = fetch(url, binary=True)
    if not b:
        return None
    try:
        im = Image.open(io.BytesIO(b))
        im = im.convert('RGBA')
    except Exception:
        return None
    im.thumbnail((400, 400))
    a = np.asarray(im).astype(float)
    if crop:
        h, w = a.shape[:2]
        a = a[int(h * crop): int(h * (1 - crop)), int(w * crop): int(w * (1 - crop))]
    rgb, alpha = a[..., :3], a[..., 3]
    mask = alpha > 200
    if mode == 'object':
        mx, mn = rgb.max(-1), rgb.min(-1)
        bg = (mn > 232) & (mx - mn < 14)
        # csak a széllel összefüggő háttér maradjon ki (a fehér bútor ne tűnjön el): a sorok/oszlopok szélső futamai
        edge = np.zeros_like(bg)
        for i in range(bg.shape[0]):
            row = bg[i]
            j = 0
            while j < row.size and row[j]:
                edge[i, j] = True; j += 1
            j = row.size - 1
            while j >= 0 and row[j]:
                edge[i, j] = True; j -= 1
        for j in range(bg.shape[1]):
            col = bg[:, j]
            i = 0
            while i < col.size and col[i]:
                edge[i, j] = True; i += 1
            i = col.size - 1
            while i >= 0 and col[i]:
                edge[i, j] = True; i -= 1
        mask &= ~edge
    px = rgb[mask]
    if px.shape[0] < 50:
        px = rgb.reshape(-1, 3)
    if mode == 'object':
        # tárgyfotó: a fényfoltok és árnyékok ne húzzák el – a világosság szerinti középső 50 % átlaga
        import numpy as np
        lum = px @ np.array([0.2126, 0.7152, 0.0722])
        lo, hi = np.percentile(lum, [25, 75])
        core = px[(lum >= lo) & (lum <= hi)]
        px = core if core.shape[0] >= 20 else px
    m = _srgb(_lin(px).mean(0))
    return '#%02X%02X%02X' % tuple(int(round(min(255, max(0, v)))) for v in m)


# --- színtónus-besorolás --------------------------------------------------------------------------------------------

def lch(hexs: str) -> tuple[float, float, float]:
    """OKLCh: L 0–1, C, h fok."""
    import math
    h = hexs.lstrip('#')
    r, g, b = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = f(r), f(g), f(b)
    l = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s
    A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s
    B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    return L, math.hypot(A, B), (math.degrees(math.atan2(B, A)) + 360) % 360


def loud(hexs: str) -> bool:
    """Harsány szín (élénk piros, narancs, citromsárga, türkiz, rózsaszín, lila, neonzöld, élénkkék): a fekete részletes,
    meleg irányhoz nem illik, a bútor- és textilgyűjtés kihagyja. A konyak, okker, terrakotta és mustár (h 35–95°) marad."""
    L, C, h = lch(hexs)
    if 35 <= h <= 95:
        return C > 0.17
    return C > 0.12


def paint_family(hexs: str) -> str:
    """Festékszín-család (PaintFamily, src/model/types.ts; új: 'grey' semleges és hideg szürkék, antracit; 'vivid' élénk)."""
    L, C, h = lch(hexs)
    if L < 0.5:
        return 'deep'
    if C < 0.008:
        return 'warmWhite' if L > 0.95 else 'grey'
    if C < 0.03:
        if 25 <= h <= 95:
            return 'warmWhite' if L > 0.93 else 'greige'
        if 95 < h < 180 and C >= 0.015:
            return 'green'
        if 180 <= h <= 300:
            return 'blueGrey' if C >= 0.018 else 'grey'
        return 'greige' if C >= 0.015 else 'grey'
    warm = 20 <= h <= 110
    if L > 0.92 and C < 0.06:
        return 'warmWhite' if warm else 'blueGrey'
    if 200 <= h <= 290:
        return 'blueGrey' if C < 0.09 else 'vivid'
    if 110 < h < 200:
        return 'green' if C < 0.12 else 'vivid'
    if C < 0.045:
        return 'greige'
    if h < 20 or h > 290:
        return 'terracotta' if C < 0.12 else 'vivid'
    if h < 55:
        return 'terracotta' if C >= 0.07 else ('brown' if L < 0.65 else 'sand')
    if h < 85:
        return 'brown' if L < 0.62 else ('sand' if C < 0.09 else 'ochre')
    return 'ochre' if C >= 0.08 else 'sand'


def wood_tone(hexs: str) -> str:
    """Padló / ajtó fatónus: light | natural | honey | grey | dark."""
    L, C, h = lch(hexs)
    if L < 0.52:
        return 'dark'
    if C < 0.03:
        return 'light' if L > 0.85 else 'grey'
    if L > 0.76:
        return 'light'
    if C > 0.075 and 45 < h < 85:
        return 'honey'
    return 'natural'


def door_tone(hexs: str) -> str:
    """DoorProduct.tone: white | offwhite | light | natural | warm | dark | grey | black."""
    L, C, h = lch(hexs)
    if L < 0.38:
        return 'black'
    if L > 0.95 and C < 0.015:
        return 'white'
    if C < 0.03 and 180 <= h <= 300:
        return 'grey'
    if C < 0.022:
        return 'offwhite' if L >= 0.7 else 'grey'
    if L > 0.86:
        return 'offwhite' if C < 0.04 else 'light'
    if L < 0.55:
        return 'dark'
    if L > 0.74:
        return 'light'
    return 'warm' if (L < 0.65 or C > 0.06) else 'natural'


def save(kind: str, store: str, items: list[dict], note: str):
    """Kimenet: OUT/<kind>-<store>.json – {meta, items}; a beolvasztás (scripts/catalog/merge.py) innen olvas."""
    path = os.path.join(OUT, f'{kind}-{slug(store)}.json')
    json.dump({'meta': {'checkedAt': TODAY, 'store': store, 'note': note, 'count': len(items)}, 'items': items},
              open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('mentve', path, len(items), flush=True)
