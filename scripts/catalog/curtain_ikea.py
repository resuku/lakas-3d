# IKEA HU kész függönyök. URL-források: a függönykategória-oldalak termékei + a termék-sitemapek (a lib 8 MB-nál vág, tehát a fájlok eleje) fueggoeny-slugú termékei.
import re, html, json, sys
sys.path.insert(0, 'scripts/catalog')
import lib

STORE = 'IKEA'
cats = ['soetetito-fueggoenyoek-700218', 'szobai-soetetito-fueggoenyoek-700219', 'fenyszuro-fueggoenyoek-700220',
        'atlatszo-es-diszfueggoenyoek-700221', 'fueggoenyoek-10700']
cand = {}
for c in cats:
    try:
        h = lib.fetch(f'https://www.ikea.com/hu/hu/cat/{c}/')
    except lib.RobotsBlocked:
        continue
    for p in re.findall(r'https://www\.ikea\.com/hu/hu/p/[a-z0-9\-]+/', h or '') + ['https://www.ikea.com' + x for x in re.findall(r'"(/hu/hu/p/[a-z0-9\-]+/)"', h or '')]:
        cand[p] = 1
print('kategoriabol', len(cand), flush=True)
for n in range(1, 6):
    try:
        x = lib.fetch(f'https://www.ikea.com/sitemaps/prod-hu-HU_{n}.xml')
    except lib.RobotsBlocked:
        continue
    if not x:
        continue
    for p in re.findall(r'<loc>(https://www\.ikea\.com/hu/hu/p/[^<]+)</loc>', x):
        cand[p] = 1
print('osszes jelolt', len(cand), flush=True)
ACC = re.compile(r'rud|-sin-|sinek|karnis|karika|akaszto|csipesz|tarto|fueggoenyrancolo-szalag-|zuhany|rolo|arnyekolo|vegzod|gomb|fuggonyrud|kiegeszito|lancos|fuegg?oenysor-|sorjasz|szunyog|parna|takar|asztalterito|agytakar|szoenyeg|tartozek|szett|horog|kampo|vezet', re.I)
urls = [u for u in cand if re.search(r'fueggoeny', u) and not ACC.search(u.split('/p/')[1].replace('fueggoeny', ''))]
print('fuggony jelolt', len(urls), flush=True)
items, skipped = [], []
for u in urls:
    h = lib.fetch(u)
    if not h:
        continue
    ld = lib.ld_of_type(h, 'Product')
    if not ld:
        continue
    d = ld[0]
    name = html.unescape(d.get('name') or '')
    cat = html.unescape(d.get('category') or '')
    m = re.search(r'(\d{2,3})\s*x\s*(\d{2,3})\s*cm', name)
    if not m or not re.search(r'függöny|fuggony', name + cat, re.I) or re.search(r'rúd|karnis|roló|sín\b|zuhany', name + cat, re.I):
        skipped.append(u); continue
    w, l = int(m.group(1)), int(m.group(2))
    low = (name + ' ' + cat + ' ' + html.unescape(d.get('description') or '')).lower()
    if re.search(r'szobai sötétítő|room.?darkening', low):
        typ = 'dimout'
    elif re.search(r'sötétítő|fényzáró', low):
        typ = 'blackout'
    elif re.search(r'fényszűrő|fényáteresztő|dimout', low):
        typ = 'dimout'
    elif re.search(r'áttetsző|átlátszó|fátyol|hálós|csipke|voile', low):
        typ = 'sheer'
    else:
        skipped.append(u); continue
    img = lib.ld_image(d.get('image'))
    hx = lib.image_hex(img, mode='object') if img else None
    if not hx or lib.loud(hx):
        skipped.append(u); continue
    offers = d.get('offers') or {}
    pk = re.search(r'(\d+)\s*(pár|db)', name)
    pack = f'{pk.group(1)} {pk.group(2)}' if pk else '1 db'
    items.append({'id': f'curtain-ikea-{lib.slug(u.split("/p/")[1].strip("/"), 80)}', 'store': STORE, 'name': re.sub(r',?\s*\d+ (pár|db).*$', '', name).strip(),
                  'colorName': d.get('color'), 'article': d.get('mpn'), 'type': typ, 'material': d.get('material'), 'size': {'w': w, 'l': l}, 'pack': pack,
                  'hex': hx, 'hexSource': 'photo-sample', 'price': lib.price(offers.get('price'), STORE, f' / {pack}'), 'url': u, 'checkedAt': lib.TODAY,
                  'note': f'{cat}. A méret csomagonként/darabonként a névből ({w}x{l} cm).'})
for i in items:
    if not i.get('colorName'):
        m = re.search(r' - ([^,/]+(?:/[^,/]+)*?)(?:/függönyráncoló| \d+x\d+| \d+ ?pár|$)', i['name'] + ' ' + i['note'])
        mm = re.search(r'(?:pár|db)? ?- (.+?)(?:/függönyráncoló szalaggal)?(?: \d+x\d+ cm)?$', html.unescape(i['name']))
        i['colorName'] = (mm.group(1) if mm else None)
items = [i for i in items if i.get('colorName')]
from collections import Counter
print(len(items), Counter(i['type'] for i in items), 'kihagyva', len(skipped))
lib.save('curtain', STORE, items,
         'IKEA HU: a függönykategória-oldalak (1. oldal) és a termék-sitemapek első 8 MB-jának fueggoeny-slugú termékei; a kategória-lapozás JS-es, a sitemapek 8 MB fölött csonkolva (a lib korlátja), '
         'ezért a lista nem biztosan teljes. Típus: sötétítő/fényzáró → blackout, „szobai sötétítő”/fényszűrő → dimout, áttetsző/átlátszó → sheer. Szín: termékfotó-átlag (közelítés). Harsány szín kihagyva.')
