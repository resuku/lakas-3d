# DIEGO (diego.hu) kész függönyök (méretes kész darab; a tekercses méteráru kimarad). Csak query nélküli URL (robots: Disallow /*?).
import re, html, json, sys
sys.path.insert(0, 'scripts/catalog')
import lib

STORE = 'DIEGO'
urls = [u for u in lib.sitemap_urls('https://diego.hu/media/sitemap.xml') if re.search(r'/fuggony/[^/]+$', u) or re.search(r'diego\.hu/[^/]*fuggony[^/]*$', u)]
urls = [u for u in urls if re.search(r'\d{2,3}x\d{2,3}-?cm', u) and '?' not in u]
print('kesz fuggony url', len(urls), flush=True)
items, skipped = [], []
TYPE_SKIP = re.compile(r'karnis|rolo|tapeta|zuhany|ajtofuggony-szalag|szalagfuggony|parna|takaro|folia|szunyog', re.I)
for u in urls:
    if TYPE_SKIP.search(u):
        skipped.append(u); continue
    h = lib.fetch(u)
    if not h:
        continue
    ld = lib.ld_of_type(h, 'Product')
    if not ld:
        continue
    d = ld[0]
    name = html.unescape(d.get('name') or '').strip()
    attrs = {}
    for k, v in re.findall(r'<th[^>]*class="col label"[^>]*>(.*?)</th>\s*<td[^>]*>(.*?)</td>', h, re.S):
        attrs[re.sub(r'<[^>]+>', '', k).strip()] = html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', v))).strip()
    m = re.search(r'(\d{2,3})\s*[x×]\s*(\d{2,3})\s*cm', name + ' ' + u.replace('x', 'x'), re.I) or re.search(r'(\d{2,3})x(\d{2,3})-?cm', u)
    if not m:
        continue
    w, l = int(m.group(1)), int(m.group(2))
    if w < 60 or l < 100:
        continue
    zar = (attrs.get('Függönyanyag fényzárás', '') + ' ' + attrs.get('Függönyanyag típus', '') + ' ' + name + ' ' + u).lower()
    if re.search(r'sötétítő|sotetito|blackout|fényzáró', zar):
        typ = 'blackout'
    if re.search(r'dimout|fényszűrő|felig|félig', zar) and not re.search(r'sötétítő.*fényzáró', zar):
        typ = 'dimout'
    elif not re.search(r'sötétítő|sotetito|blackout|fényzáró', zar):
        if re.search(r'fátyol|fatyol|voile|áttetsző|attetszo|fényáteresztő|fenyatereszto|sheer', zar):
            typ = 'sheer'
        else:
            skipped.append(u); continue
    if 'dimout' in u and 'sotetito' in u:
        typ = 'dimout'
    offers = d.get('offers')
    offers = offers[0] if isinstance(offers, list) and offers else (offers or {})
    price = offers.get('price')
    img = lib.ld_image(d.get('image'))
    hx = None
    if img:
        hx = lib.image_hex(img, mode='swatch', crop=0.2) if 'szinminta' in img else lib.image_hex(img, mode='object')
    if not hx or lib.loud(hx):
        skipped.append(u); continue
    colr = attrs.get('Szín')
    pack = '1 db'
    ms = attrs.get('Méret / Kiszerelés', '')
    if re.search(r'pár|par\b', ms, re.I) or re.search(r'2\s*db', ms):
        pack = '1 pár' if re.search(r'pár|par\b', ms, re.I) else '2 db'
    items.append({
        'id': f'curtain-diego-{lib.slug(re.sub(r"https://www.diego.hu/(fuggony/)?", "", u), 80)}', 'store': STORE, 'name': name, 'colorName': colr,
        'type': typ, 'material': attrs.get('Alapanyag'), 'size': {'w': w, 'l': l}, 'pack': pack, 'hex': hx,
        'hexSource': 'swatch-image' if 'szinminta' in (img or '') else 'photo-sample',
        'price': lib.price(price, STORE, f' / {pack}'), 'url': u, 'checkedAt': lib.TODAY,
        'note': ' '.join(x for x in [attrs.get('Méret / Kiszerelés'), attrs.get('Függönyanyag minta'), attrs.get('Felfogatás') or attrs.get('Függönyanyag felfogatás')] if x)[:300] or None,
    })
for i in items:
    i['article'] = None
    if not i['note']:
        i.pop('note')
    i.pop('article')
print('db', len(items), 'kihagyva', len(skipped))
from collections import Counter
print(Counter(i['type'] for i in items))
lib.save('curtain', STORE, items,
         'DIEGO sitemap: a fuggony-slugú, „NNNxNNN cm” méretű kész függönyök (a tekercses/méteráru, karnis, roló kimarad). Típus: a „Függönyanyag fényzárás/típus” és a név alapján '
         '(sötétítő → blackout, dimout/fényszűrő → dimout, fényáteresztő/fátyol → sheer). Szín: LD-kép (színminta-kép esetén swatch, különben tárgyfotó-átlag; a fotók hangulatfotók is lehetnek, közelítés). '
         'Harsány szín kihagyva. A kiszerelés (db/pár) a Méret/Kiszerelés mezőből, ha hiányzik, 1 db.')
