# Közös lámpa-besorolás a lamp_<forrás>.py szkriptekhez: típus, forma, kibocsátás, kizárások, rekordépítés.
# A letöltés mindig a lib.fetch / lib.image_hex-en át megy; ez a modul csak szöveget dolgoz fel.
import re, sys, unicodedata, collections
sys.path.insert(0, '/w/scripts/catalog')
import lib


def fold(s) -> str:
    s = str(s or '').replace('ø', ' atm ').replace('Ø', ' atm ').replace('⌀', ' atm ').replace('×', 'x')
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'\s+', ' ', s)


# --- kizárások --------------------------------------------------------------------------------------------------------
EXC = [
    ('kültéri', r'kulteri|kerti|terasz|udvari|napelem|erkely|lampion|szolo|cserepbe|talajba|leszurhato'),
    ('gyerek', r'gyerek|gyermek|\bbaba\b|bebi|unikornis|dinoz|mesesz|plussz?\b|jatek|iskolas|ovis|tundér|tunder|robot|macska|kutya|medve|nyuszi|oroszlan|elefant|\bauto\b|repulo|hercegno|szuperhos|disney|pokemon|fiu\b|kislany'),
    ('fürdőszobai', r'furdo|tukorvilagito|tukorlampa|zuhany|wc\b'),
    ('LED-szalag', r'led ?szalag|led ?csik|fenyfuzer|fenyfuzer|fenycso\b|neon\b|fenyszal|\bszalag\b'),
    ('izzó/fényforrás', r'^(?:led |filament |halogen |gyertya ?|globe )?izzo|^fenyforras|retrofit|^led ?modul|^led-?es izzo'),
    ('kristályos csillár', r'kristaly|crystal'),
    ('ipari/raktári', r'ipari|raktar|csarnok|high ?bay|muhely|\bufo\b|nagy teljesitmenyu|vilagito test .*ip6'),
    ('beépíthető', r'beepithet|beepitett|sullyeszt|downlight|\bdoboz?ba\b|falba epit|beepitheto'),
    ('reflektor/érzékelős', r'reflektor|mozgaserzekelo|radar|erzekelos|szenzoros kulter|fenyfal'),
    ('ünnepi/dekor', r'karacsony|ujev|halloween|hangulatvilagitas|mecses|gyertyatarto|gyertya|dugalj|ejszakai feny|ejjeli feny'),
    ('alkatrész/kiegészítő', r'^lampaernyo|^burak?\b|foglalat|^vezetek|^kabel|adapter|taviranyito|csatlakozo|szerelvény|szerelveny|tartozek|^kapcsolo|^dimmer|^trafo|^transzformator|konnektor|bura szett'),
    ('egyéb készülék', r'ventilator|projektor|\buv\b|rovar|fenyterapia|sterilizalo|akvarium|terrarium|noveny|butorvilagito|szekrenyvilagito|polcvilagito|pultmegvilagito|munkalap|fiokvilagito|vitrin|panel ?led|led ?panel|szimbolum|csillagszoro|projekcio|vetito|ejszakai'),
]


def ip_of(f: str):
    m = re.search(r'\bip ?(\d\d)\b', f)
    return int(m.group(1)) if m else None


def reject(name: str, cat: str = '', desc: str = '', name_only_for=('gyerek',)) -> str | None:
    """Kizárási ok (rövid cimke) vagy None. A név+kategória az elsődleges; a leírásból csak a biztos jelek."""
    n = fold(name)
    c = fold(cat)
    head = n + ' | ' + c
    for label, rx in EXC:
        if re.search(rx, head):
            return label
    d = fold(desc)
    ip = ip_of(n + ' ' + d)
    if ip and ip >= 54:
        return 'kültéri/nedves (IP54+)'
    if ip and ip >= 44 and re.search(r'furdo|kulter|kert|terasz', n + ' ' + d + ' ' + c):
        return 'fürdőszobai (IP44+)'
    if re.search(r'kulteri (?:hasznalat|lampa|vilagit)|kulteren|kulteri es belteri', d) and not re.search(r'belteri', n + c):
        # leírás szerint kültéri (a belteri/kültéri kettős nem kizáró, csak ha a név/kat. sem beltéri)
        return 'kültéri'
    if re.search(r'kristaly|crystal', d[:300]) and re.search(r'csillar', n):
        return 'kristályos csillár'
    if re.search(r'krom|chrome|tukorkrom|krómoz|nikkelezett kr', n + ' ' + c):
        return 'króm'
    return None


# --- típus ----------------------------------------------------------------------------------------------------------
def type_of(name: str, cat: str = '') -> str | None:
    n = fold(name)
    c = fold(cat)
    if re.search(r'\bsin(?:es|re|rendszer\w*|szett|ek)?\b|sinrendszer|sines|spotsor|szpot|spot ?(?:szett|sor)\b', n) and not re.search(r'fali|allo|asztali|olvaso', n):
        return 'track'
    if re.search(r'fuggeszt|fuggo\w*|fuggolampa|csillar|pendant', n) and not re.search(r'\ballo|asztali', n):
        return 'pendant'
    if re.search(r'\ballo ?lampa|\ballo\b|padlolampa|\bpadlo ?lampa|allo-', n):
        return 'floor'
    if re.search(r'\bfali\b|fali-|falikar|falilampa|falra|\bfali/', n) and not re.search(r'asztali', n):
        return 'wall'
    if re.search(r'asztali|ejjeli|olvasolampa|dolgozolampa|irasztal|iroasztal|ejjeliszekreny|munkalampa', n):
        return 'table'
    if re.search(r'mennyezeti|plafon|mennyezet|ceiling', n):
        return 'ceiling'
    if re.search(r'\bfali', n):
        return 'wall'
    # kategória
    if re.search(r'fuggeszt|fuggolamp|csillar', c): return 'pendant'
    if re.search(r'allolamp|allo lamp', c): return 'floor'
    if re.search(r'asztali|dolgozolamp|ejjeli|munkalamp', c): return 'table'
    if re.search(r'mennyezeti|plafon', c): return 'ceiling'
    if re.search(r'falilamp|falikar|fali spot|fali lamp|\bfali\b', c): return 'wall'
    if re.search(r'\bsin|spot', c): return 'track'
    return None


def classify(name: str, cat: str = '', desc: str = ''):
    """(típus, fejek száma) vagy (None, None). Több fejes mennyezeti spot → sín (spotsor); egy fejes sín nélküli spot → mennyezeti."""
    typ = type_of(name, cat)
    if not typ:
        return None, None
    n = fold(name)
    hd = heads_of(name, desc)
    if typ == 'ceiling' and re.search(r'spot', n) and (hd or 0) >= 2:
        typ = 'track'
    if typ == 'track':
        if not re.search(r'spot|lampa|vilagit|fejes|szpot|szal', n):
            return None, None  # puszta sín / tartozék
        if (hd or 0) < 2 and not re.search(r'\bsin|sines|sinrendszer|sinre', n):
            typ, hd = 'ceiling', None
    return typ, (hd if typ == 'track' else None)


def heads_of(name: str, desc: str = '') -> int | None:
    n = fold(name)
    m = re.search(r'(\d+) ?(?:-|x)? ?(?:spot|fejes|fejű|szalas|szaru|foglalat|lampa|izzos)|spot ?(\d+)\b|\b(\d+)(?:sz| ?db)? ?spot|(\d+) ?x ?(?:gu10|g9|e14|e27|gu5|g4|\d+ ?w)', n)
    if m:
        for g in m.groups():
            if g and 1 <= int(g) <= 12:
                return int(g)
    m = re.search(r'(\d+) ?x ?(?:gu10|g9|e14|e27|\d+(?:[.,]\d+)? ?w)', fold(desc))
    if m and 1 <= int(m.group(1)) <= 12:
        return int(m.group(1))
    return None


# --- forma, kibocsátás -------------------------------------------------------------------------------------------------
def shape_of(typ: str, text: str) -> str:
    f = fold(text)
    if typ == 'track':
        return 'rail' if re.search(r'\bsin\b|sines|sinrendszer|\bsinre\b|rail', f) else ('bar' if re.search(r'rud|sor\b|lecs|vonal', f) else 'rail')
    if re.search(r'felfele|uplight|fenyt felfele|mennyezetre vilagit|szort feny felfele|torchiere|fackel', f) and typ in ('floor', 'wall', 'table'):
        return 'uplight'
    if typ == 'floor' and re.search(r'\biv\b|\bives\b|arc\b|horgas|boltives|boltiv|ivlampa|karos', f):
        return 'arc'
    if re.search(r'goml?b|globe|golyo|gombol|\bgomb\b|buborek|\bbal\b|kor alaku bura', f):
        return 'globe'
    if re.search(r'kupol|dome|harang|felgomb|felgombol|fejtetos|mushroom|gomba', f):
        return 'dome'
    if re.search(r'henger|drum|dob\b|hengeres|csoves|cilinder|cylinder', f):
        return 'drum'
    if re.search(r'kupos|kup\b|kup alaku|tolcser|cone|trapez|lekerekitett kup', f):
        return 'cone'
    if typ == 'ceiling' and re.search(r'korong|lapos|disc|kerek|negyzet|szogletes|panel|plafon|plafonier|led lampa|led mennyezeti|led-es mennyezeti|fenyero', f):
        return 'disc'
    if re.search(r'korong|lapos|disc|plafonier', f):
        return 'disc'
    if re.search(r'vonalas|csik\b|racs\b|hosszu|rud|linear|lineris|bar\b|szogletes cso', f):
        return 'bar'
    if re.search(r'\bspot\b|spotlampa|szpot|iranyithato|billenthet', f):
        return 'spot'
    return {'pendant': 'dome', 'ceiling': 'disc', 'track': 'rail'}.get(typ, 'other')


def emit_of(typ: str, shape: str, text: str) -> str:
    f = fold(text)
    if shape == 'uplight':
        return 'up'
    if typ == 'track' or shape in ('spot', 'rail'):
        return 'spot'
    diffuse = re.search(r'textil|szovet|vaszon|opal|uveg|papir|rattan|fonott|bambusz|\blen\b|juta|akril|polikarbonat|muanyag|szitalt|homokfuvalt|szort|kristaly|ceruza|plisszirozott|rizspapir|pamut|fustuveg|opalfenyu|matt feher bura', f)
    opaque = re.search(r'\bfem\b|acel|alumin|\bfa\b|fabol|tolgy|diofa|fenyo|beton|keramia|porcelan|vas\b|rez\b|sargarez|bronz|merev bura|fem bura|fedett', f)
    if typ == 'ceiling':
        return 'down' if (opaque and not diffuse) else 'diffuse'
    if diffuse and not re.search(r'fem bura|fembura|acel bura|fa bura', f):
        return 'diffuse'
    if opaque:
        return 'down'
    return 'diffuse'


SOCKET_RX = re.compile(r'\b(e27|e14|gu10|g9)\b')


def socket_of(text: str, count_hint=None):
    f = fold(text)
    m = SOCKET_RX.search(f)
    if not m:
        return None
    t = m.group(1).upper()
    n = None
    m2 = re.search(r'(\d+) ?(?:x|db) ?(?:\d+(?:[.,]\d+)? ?w ?)?' + m.group(1), f) or re.search(m.group(1) + r' ?(?:x|\*) ?(\d+)\b', f)
    if m2:
        n = int(m2.group(1))
    if not n or n > 12:
        n = count_hint or 1
    return {'type': t, 'count': n}


# --- méretek -------------------------------------------------------------------------------------------------------------
def num(s) -> float | None:
    try:
        return float(str(s).replace(',', '.').replace(' ', ''))
    except ValueError:
        return None


def mm(v, unit: str) -> int | None:
    x = num(v)
    if x is None:
        return None
    u = unit.lower()
    return round(x * (10 if u == 'cm' else 1000 if u == 'm' else 1))


# --- szín -----------------------------------------------------------------------------------------------------------------
def bucket(hexs: str, name: str = '') -> str:
    """Jelentés-besorolás: fekete / antracit / sárgaréz-bronz / fa-natúr / fehér / szürke / egyéb (a szín neve előbbre való a fotó átlagánál)."""
    f = fold(name)
    if re.search(r'sargarez|arany|bronz|(?<![a-z])rez(?![a-z])|antik|rezes', f):
        return 'sárgaréz/bronz/arany'
    if re.search(r'fekete|black', f):
        return 'fekete'
    if re.search(r'antracit|grafit|sotetszurke|fustuveg|fust(?![a-z])', f):
        return 'antracit/füst/sötétszürke'
    if re.search(r'natur|rattan|bambusz|(?<![a-z])fa(?![a-z])|fabol|dio|tolgy|barna|bezs|juta|vaszon|len(?![a-z])|szovet|textil|krem|homok|drapp|bukk|akac|kokusz', f):
        return 'fa/natúr/textil/bézs'
    L, C, h = lib.lch(hexs)
    if L < 0.30 and C < 0.04:
        return 'fekete'
    if L < 0.46 and C < 0.04:
        return 'antracit/füst/sötétszürke'
    if C < 0.03:
        return 'fehér' if L > 0.88 else 'szürke'
    if 40 <= h <= 90 and C >= 0.03:
        return 'fa/natúr/textil/bézs'
    return 'egyéb'


# --- rekord ---------------------------------------------------------------------------------------------------------------
STATS = collections.Counter()


def finish(rec: dict, why_log: bool = True) -> dict | None:
    """Végső ellenőrzés: harsány szín, hiányzó adat kiszűrése. None = kimarad."""
    if not rec.get('color'):
        STATS['nincs szín (kép nem tölthető)'] += 1
        return None
    if lib.loud(rec['color']):
        STATS['harsány szín'] += 1
        return None
    if not rec['size'] or not (rec['size'].get('d') or rec['size'].get('l') or rec['size'].get('h') or rec['size'].get('proj')):
        STATS['nincs méret'] += 1
        return None
    ok = {'d': (50, 2500), 'h': (20, 2600), 'l': (200, 6000), 'drop': (200, 6000), 'proj': (20, 1500)}
    rec['size'] = {k: v for k, v in rec['size'].items() if v and ok[k][0] <= v <= ok[k][1]}
    if not rec['size']:
        STATS['nincs hihető méret'] += 1
        return None
    return {k: v for k, v in rec.items() if v not in (None, '', {})}


def build(store, name, url, typ, text_for_shape, color, colorName, size, *, brand=None, article=None, heads=None, socket=None,
          bulbIncluded=None, lm=None, K=None, price=None, note=None, emit_text=None, shape=None, emit=None, hexSource='photo-sample'):
    shp = shape or shape_of(typ, text_for_shape)
    em = emit or emit_of(typ, shp, emit_text if emit_text is not None else text_for_shape)
    rec = {
        'id': f'lamp-{lib.slug(store)}-{lib.slug(name, 52)}' + (f'-{lib.slug(article)[-9:]}' if article else ''),
        'store': store, 'brand': brand, 'name': name, 'article': article, 'type': typ, 'shape': shp,
        'color': color, 'colorName': colorName, 'size': size, 'heads': heads, 'lm': lm, 'K': K, 'socket': socket,
        'bulbIncluded': bulbIncluded, 'emit': em, 'hexSource': hexSource, 'price': price, 'url': url,
        'checkedAt': lib.TODAY, 'note': note,
    }
    return finish(rec)


def report(items: list[dict], extra=''):
    import json
    print('---- RÉSZLETEK', len(items))
    print('típus', dict(collections.Counter(i['type'] for i in items)))
    print('szín', dict(collections.Counter(bucket(i['color'], i.get('colorName', '') + ' ' + i['name']) for i in items)))
    print('kizárás/hiány', dict(STATS))
    print(extra)


# --- méret a szövegből ---------------------------------------------------------------------------------------------------
_N = r'(\d+(?:[.,]\d+)?)'
_U = r'\s*(cm|mm|m)\b'


def dims_text(text: str) -> dict:
    """Név/leírás szövegéből: dia, h, l, w, dep (mm); tri = (a, b, c) 'AxBxC cm', pair = (a, b) 'AxB cm'."""
    f = fold(text)
    d = {}
    m = re.search(r'(?:\batm(?:ero|\.)?|\bdia(?:meter)?|\bd)\s*[=:.]?\s*' + _N + _U, f) or re.search(_N + r'\s*(cm|mm)(?:-es)? atmero', f)
    if m:
        d['dia'] = mm(m.group(1), m.group(2))
    m = re.search(r'(?:\bh|\bmag(?:assag)?\.?|magassaga)\s*[=:.]?\s*' + _N + _U, f)
    if m:
        d['h'] = mm(m.group(1), m.group(2))
    m = re.search(r'(?:\bhossz(?:usag)?\.?|\bl|\bvezetek)\s*[=:.]?\s*' + _N + _U, f)
    if m:
        d['l'] = mm(m.group(1), m.group(2))
    m = re.search(r'(?:\bszeles(?:seg)?\.?|\bw|\bsz)\s*[=:.]?\s*' + _N + _U, f)
    if m:
        d['w'] = mm(m.group(1), m.group(2))
    m = re.search(r'(?:\bmelyseg|\bt)\s*[=:.]?\s*' + _N + _U, f)
    if m:
        d['dep'] = mm(m.group(1), m.group(2))
    m = re.search(_N + r'\s*x\s*' + _N + r'\s*x\s*' + _N + r'\s*(cm|mm)\b', f)
    if m:
        d['tri'] = tuple(mm(m.group(i), m.group(4)) for i in (1, 2, 3))
    else:
        m = re.search(_N + r'\s*x\s*' + _N + r'\s*(cm|mm)\b', f)
        if m:
            d['pair'] = tuple(mm(m.group(i), m.group(3)) for i in (1, 2))
    return d


def size_from(typ: str, dm: dict) -> dict:
    """dims_text eredményéből LampProduct.size (a háromszám = szél x mély x mag., a kettő = átm./szél x mag.)."""
    tri, pair = dm.get('tri'), dm.get('pair')
    dia = dm.get('dia') or (max(tri[0], tri[1]) if tri else None) or (pair[0] if pair else None) or dm.get('w') or (dm.get('l') if typ != 'track' else None)
    h = dm.get('h') or (tri[2] if tri else None) or (pair[1] if pair else None)
    sz = {}
    if typ == 'pendant':
        sz['d'] = dia
        if h and h >= 700:
            sz['drop'] = h
        else:
            sz['h'] = h
    elif typ == 'track':
        sz['l'] = dm.get('l') or (max(tri[0], tri[1]) if tri else None) or (pair[0] if pair else None) or dm.get('w')
        sz['h'] = h if h and h < 600 else None
    elif typ == 'wall':
        sz['d'] = dia
        sz['h'] = h
        sz['proj'] = dm.get('dep') or (min(tri[0], tri[1]) if tri else None)
    else:
        sz['d'] = dia
        sz['h'] = h
    return sz


COLOR_WORDS = ['matt fekete', 'fekete', 'antracit', 'sotetszurke', 'vilagosszurke', 'szurke', 'grafit', 'fust', 'barna', 'dio', 'tolgy', 'natur', 'fa', 'rattan',
               'bambusz', 'sargarez', 'bronz', 'rez', 'arany', 'rozsda', 'bezs', 'drapp', 'homok', 'krem', 'feher', 'opal', 'szurkes', 'tegla', 'cognac', 'konyak',
               'zold', 'kek', 'piros', 'sarga', 'narancs', 'rozsaszin', 'lila', 'turkiz', 'bordo', 'ezust', 'nikkel', 'fustuveg', 'beton', 'terrakotta', 'vaszon', 'len']
COLOR_HU = {'sotetszurke': 'sötétszürke', 'vilagosszurke': 'világosszürke', 'szurke': 'szürke', 'fust': 'füst', 'dio': 'dió', 'tolgy': 'tölgy', 'natur': 'natúr',
            'sargarez': 'sárgaréz', 'rez': 'réz', 'bezs': 'bézs', 'krem': 'krém', 'feher': 'fehér', 'szurkes': 'szürkés', 'zold': 'zöld', 'kek': 'kék',
            'sarga': 'sárga', 'rozsaszin': 'rózsaszín', 'turkiz': 'türkiz', 'ezust': 'ezüst', 'fustuveg': 'füstüveg', 'vaszon': 'vászon', 'len': 'len',
            'konyak': 'konyak', 'rozsda': 'rozsda'}


def color_name(text: str) -> str | None:
    """A termék szövegében szereplő színszavak (szóhatáron), a bolt szavaival; több szín '/' jellel."""
    f = ' ' + fold(text) + ' '
    found = []
    for w in COLOR_WORDS:
        suffix = '' if w in ('fa', 'len', 'rez') else r'(?:s|es|os|u|ju|vel|bol)?'
        if re.search(r'(?<![a-z])' + w + suffix + r'(?![a-z])', f) and not any(w in x or x in w for x in found):
            found.append(w)
    return '/'.join(COLOR_HU.get(w, w) for w in found[:3]) or None


def bulb_flags(f: str, sock, lm):
    """(bulbIncluded, ok) a szövegből (fold-olt): False ha kifejezetten külön kapható, True ha beépített/tartozék, különben None."""
    if re.search(r'fenyforras nelkul|izzo nelkul|nem tartozek|nem tartalmazza|nem tartalmaz|izzot nem|izzo nem tartozik|izzo nelkuli|fenyforras nem', f):
        return False
    if re.search(r'beepitett (?:led|fenyforras)|nem cserelheto|integralt led|fixen beepitett|izzoval egyutt|tartozek(?:a)? (?:a )?(?:led )?izzo|fenyforras(?:t)? tartalmaz|izzot tartalmaz', f):
        return True
    if lm and not sock:
        return True
    return None


def text_record(store, name, desc, url, cat, image, price, *, brand=None, article=None, color_hint=None, extra_reject_text=''):
    """Szöveges adatú boltok (Praktiker, Bonami, Watt): besorolás, méret a szövegből, kép → szín. (rekord | None, kizárási ok)"""
    why = lc_reject(name, cat, desc)
    if why:
        return None, why
    typ, hd = classify(name, cat, desc)
    if not typ:
        return None, 'nem lámpatípus'
    f = fold(name + ' ' + desc)
    dm = dims_text(name + ' ' + desc)
    sz = size_from(typ, dm)
    hd = heads_of(name, desc) if typ == 'track' else None
    sock = socket_of(name + ' ' + desc, hd)
    if typ == 'track' and (hd or 0) < 2 and not re.search(r'\bsin', fold(name)):
        typ = 'ceiling'; hd = None
        sz = size_from('ceiling', dm)
    m = re.search(r'(\d[\d .]{1,5}\d) ?(?:lm|lumen)\b|\b(\d{3,5}) ?(?:lm|lumen)\b', f)
    lm = int(re.sub(r'\D', '', m.group(1) or m.group(2))) if m else None
    if lm and not (50 <= lm <= 20000):
        lm = None
    m = re.search(r'\b([2-6]\d00) ?k\b', f)
    K = int(m.group(1)) if m else None
    cn = color_hint or color_name(name) or color_name(desc[:200])
    if cn and re.search(r'krom', fold(cn)):
        return None, 'króm'
    hx = photo_hex(image, cn or '') if image else None
    em_text = name + ' ' + desc[:500]
    rec = build(store, name, url, typ, name + ' ' + desc[:200], hx, cn, sz, brand=brand, article=article, heads=hd, socket=sock,
                bulbIncluded=bulb_flags(f, sock, lm), lm=lm, K=K, price=price, emit_text=em_text)
    return rec, (None if rec else 'hiányos adat (szín/méret/harsány)')


lc_reject = reject


def _alt_hex(url: str):
    """Vékony vázas / fehér hátterű fotónál (a lib.image_hex a szélhez nem kapcsolódó fehéret megtartja): minden nem-fehér pixel átlaga lineáris térben."""
    try:
        import io
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
    im.thumbnail((500, 500))
    a = np.asarray(im).astype(float)
    rgb, al = a[..., :3], a[..., 3]
    mx, mn = rgb.max(-1), rgb.min(-1)
    m = (al > 200) & ((mn < 228) | (mx - mn >= 16))
    px = rgb[m]
    if px.shape[0] < 120:
        return None
    lum = px @ np.array([0.2126, 0.7152, 0.0722])
    px = px[lum <= np.percentile(lum, 92)]
    mean = lib._srgb(lib._lin(px).mean(0))
    return '#%02X%02X%02X' % tuple(int(round(min(255, max(0, v)))) for v in mean)


def photo_hex(url: str, color_name_: str = ''):
    """lib.image_hex(object); ha az eredmény majdnem fehér, vagy sötét színnévhez (fekete/antracit) világos, a nem-fehér pixelek átlaga."""
    if not url:
        return None
    hx = lib.image_hex(url, 'object')
    if not hx:
        return None
    L, C, h = lib.lch(hx)
    dark_name = bool(re.search(r'fekete|antracit|grafit|sotetszurke|black', fold(color_name_)))
    if (L > 0.93 and C < 0.02) or (dark_name and L > 0.55):
        alt = _alt_hex(url)
        if alt:
            STATS['hex: nem-fehér pixelek átlaga'] += 1
            return alt
    return hx
