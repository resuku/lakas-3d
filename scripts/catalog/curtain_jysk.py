# JYSK HU készfüggönyök (/fuggonyok/keszfuggonyok/...): méret × szín variánsonként külön oldal.
import re, html, json, sys
sys.path.insert(0, 'scripts/catalog')
import lib

STORE = 'JYSK'
urls = []
for p in (1, 2, 3):
    u = f'https://jysk.hu/sitemap.xml?page={p}'
    if not lib.allowed(u):
        print('tiltott', u); continue
    x = lib.fetch(u) or ''
    urls += [l for l in re.findall(r'<loc>(.*?)</loc>', x) if '/fuggonyok/keszfuggonyok/' in l and l.count('/') >= 6]
urls = sorted(set(urls))
print('kesz fuggony url', len(urls), flush=True)
items, skipped = [], []
for u in urls:
    h = lib.fetch(u)
    if not h:
        continue
    t = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', h, flags=re.S)
    b = html.unescape(re.sub(r'\n\s*\n+', '\n', re.sub(r'<[^>]+>', '\n', t)))
    def fld(k):
        m = re.search(r'\n' + re.escape(k) + r'\n([^\n]+)\n', b)
        return m.group(1).strip() if m else None
    size = fld('Méret')
    ms = re.search(r'(\d)\s*x\s*SZ\s*(\d+)\s*x\s*MA\s*(\d+)', size or '')
    if not ms:
        mm = re.search(r'(\d{2,3})x(\d{3})', u)
        if not mm:
            skipped.append(u); continue
        n, w, l = 1, int(mm.group(1)), int(mm.group(2))
    else:
        n, w, l = int(ms.group(1)), int(ms.group(2)), int(ms.group(3))
    m1 = re.search(r'<h1[^>]*>(.*?)</h1>', h, re.S)
    name = html.unescape(re.sub(r'<[^>]+>', '', m1.group(1))).strip() if m1 else None
    felsz = (fld('Felszerelés') or '')
    path = u.split('/keszfuggonyok/')[1]
    low = (name or '').lower() + ' ' + felsz.lower() + ' ' + path
    if 'fenyzaro' in path or 'fényzáró' in felsz.lower():
        typ = 'dimout' if re.search(r'dimout', low) else 'blackout'
    elif 'dimout' in low or 'sötétítő' in felsz.lower():
        typ = 'dimout'
    elif path.startswith('vekony'):
        typ = 'sheer'
    elif path.startswith('vastag'):
        typ = 'dimout'
    else:
        skipped.append(u); continue
    img = None
    mi = re.search(r'<meta property="og:image" content="([^"]+)"', h)
    if mi:
        img = mi.group(1)
    hx = lib.image_hex(img, mode='object') if img else None
    if not hx or lib.loud(hx):
        skipped.append(u); continue
    mp = re.search(r'(\d[\d\s\.]{2,8}\d)\s*Ft\s*/?\s*db', b) or re.search(r'(\d[\d\s\.]{2,8}\d)\s*Ft', b)
    pr = re.sub(r'[\s\.]', '', mp.group(1)) if mp else None
    pk = fld('db/csomag')
    pack = '1 db' if (not pk or pk.startswith('1 darab')) else pk
    if n == 2:
        pack = '2 db'
    items.append({'id': f'curtain-jysk-{lib.slug(u.split("/")[-1], 80)}', 'store': STORE, 'name': name, 'colorName': fld('Szín'), 'article': None, 'type': typ,
                  'material': fld('Anyag'), 'size': {'w': w, 'l': l}, 'pack': pack, 'hex': hx, 'hexSource': 'photo-sample',
                  'price': lib.price(pr, STORE, f' / {pack}') if pr else None, 'url': u, 'checkedAt': lib.TODAY,
                  'note': ' '.join(x for x in [fld('Dizájn'), felsz, ('Súly ' + fld('Súly')) if fld('Súly') else '', fld('Függöny felsőrész')] if x)[:300]})
for i in items:
    i.pop('article')
    if not i.get('colorName'):
        mm = re.search(r'\d{2,3}x\d{2,3}\s+(.+)$', i['name'] or '')
        i['colorName'] = mm.group(1).strip() if mm else None
items = [i for i in items if i.get('colorName')]
from collections import Counter
print(len(items), Counter(i['type'] for i in items), 'kihagyva', len(skipped))
lib.save('curtain', STORE, items,
         'JYSK sitemap (?page=1..3): /fuggonyok/keszfuggonyok/* oldalak (méret × szín variánsonként). Típus: fényzáró → blackout (a „dimout” nevűek dimout), vékony → sheer, vastag/dimout → dimout '
         '(a „vastag függöny” besorolása becslés). Szín: og:image tárgyfotó-átlag (közelítés). Harsány szín kihagyva. Az ár az oldalszövegből.')
