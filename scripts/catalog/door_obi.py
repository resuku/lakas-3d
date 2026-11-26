# OBI HU beltéri ajtók: /ajtok/belteri-ajtok/c/953 kategória (ItemList-LD, ?page=N). Balos/jobbos és méretváltozatok egy rekordba vonva.
import re, html, sys
sys.path.insert(0, 'scripts/catalog')
import lib
from door_common import style_from, tone_stats

STORE = 'OBI'
BASE = 'https://www.obi.hu'
CAT = BASE + '/ajtok/belteri-ajtok/c/953'
raw = []
for p in range(1, 12):
    u = CAT if p == 1 else f'{CAT}?page={p}'
    try:
        h = lib.fetch(u)
    except lib.RobotsBlocked:
        print('tiltott', u); break
    if not h:
        break
    n0 = len(raw)
    for d in lib.ld_of_type(h, 'ItemList')[:1]:
        for e in d.get('itemListElement', []):
            it = e.get('item', e)
            if it.get('url'):
                raw.append((it['url'], html.unescape(it.get('name') or ''), (it.get('offers') or {}).get('price'), lib.ld_image(it.get('image'))))
    print('oldal', p, len(raw) - n0, flush=True)
    if len(raw) == n0:
        break
seen = {}
for r in raw:
    seen[r[0]] = r
raw = list(seen.values())
print('termek', len(raw), flush=True)

EXC = re.compile(r'toloajto|tolóajtó|harmonika|ajtóborítás|ajtoboritas|ajtótok|\btok\b(?!kal)|kilincs|zár\b|ütköző|szigetel|küszöb|biztons|bejárati|borítás|fólia|szerelőhab|szellőző|rács|csillap|pánt|závár|illesztő|burkolat\b|ajtóstopper|ajtótartó|ajtócsengő|szúnyog', re.I)


def norm(n):
    n = re.sub(r'\b(balos|jobbos|bal|jobb|J/B|jobb oldali|bal oldali|din [rl])\b', '', n, flags=re.I)
    n = re.sub(r'\d+([,.]\d+)?\s*(cm|mm)?\s*[x×]\s*\d+([,.]\d+)?\s*(cm|mm)?(\s*j/b)?', '', n, flags=re.I)
    n = re.sub(r'\b\d{2,3}\s*cm\b', '', n, flags=re.I)
    return re.sub(r'\s+', ' ', n).strip(' -,')


groups, skipped = {}, []
for url, name, price, img in raw:
    if EXC.search(name):
        skipped.append(name); continue
    k = norm(name)
    g = groups.setdefault(k, {'name': k, 'variants': []})
    g['variants'].append((url, name, price, img))
print('csoport', len(groups), 'kihagyva', len(skipped), flush=True)

items = []
for k, g in groups.items():
    vs = g['variants']
    prices = [float(v[2]) for v in vs if v[2]]
    url = vs[0][0] if vs[0][0].startswith('http') else BASE + vs[0][0]
    img = next((v[3] for v in vs if v[3]), None)
    if not img:
        h = lib.fetch(url)
        mi = re.search(r'<meta property="og:image" content="([^"]+)"', h or '')
        img = mi.group(1) if mi else None
    if not img:
        continue
    hx = lib.image_hex(img, mode='object')
    if not hx:
        continue
    sizes = sorted({m for v in vs for m in re.findall(r'\d+\s*(?:cm)?\s*[x×]\s*\d+\s*(?:cm)?', v[1])})
    low = k.lower()
    incl = ('ajtólap (tok és kilincs nélkül)' if 'ajtólap' in low else 'ajtó átfogó/blokk tokkal, kilincs nélkül' if re.search(r'blokk tok|gerébtok|tokkal', low)
            else 'ajtó (a listaoldalon nincs megadva, hogy tok/kilincs tartozik-e hozzá)')
    surf = ('dekorfóliás MDF' if 'dekorfóli' in low else 'lakkozott' if 'lakkozott' in low else 'lemezelt (CPL/dekorlemez)' if 'lemezelt' in low
            else 'festett' if 'festett' in low else 'tömörfenyő' if 'tömörfenyő' in low else 'furnér/dekor (a név nem jelöli)')
    sty = 'glass' if re.search(r'üveg', low) else ('groove' if re.search(r'keretes|8p\b|panel|mart|csíkos|intarz', low) else style_from(low))
    pr = None
    if prices:
        pr = f'{lib.ft(min(prices))}-tól – {incl}; változatok: {len(vs)} (méret/nyitásirány), ár {lib.ft(min(prices))}–{lib.ft(max(prices))} (OBI, {lib.TODAY})'
    items.append({'id': f'door-obi-{lib.slug(k, 70)}', 'store': STORE, 'manufacturer': 'OBI (forgalmazott márka)', 'line': k.split(' ')[0], 'name': k, 'style': sty, 'surface': surf,
                  'tone': lib.door_tone(hx), 'hex': hx, 'hexSource': 'photo-sample', 'price': pr, 'url': url, 'checkedAt': lib.TODAY,
                  'note': ('Méretek: ' + ', '.join(sizes[:8]) if sizes else 'Méret a névben/oldalon.') + ' Balos/jobbos nyitásirány külön termékoldal. A szín a termékfotó átlaga.'})
print(len(items), tone_stats(items))
lib.save('door', STORE, items,
         'OBI.hu beltéri ajtók kategória (c/953, 513 lista-tétel, ItemList-LD), a nyitásirány- és méretváltozatok egy rekordba vonva (ár: legolcsóbb változat). Kihagyva: tolóajtó, harmonikaajtó, ajtóborítás, tok/kilincs/tartozék. '
         'A szín a termékfotóból (photo-sample); a lista nem nevezi meg a dekort, ezért decor nincs. A tok/kilincs tartalom a névből becsült.')
