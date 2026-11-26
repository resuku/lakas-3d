# Bonami HU kész függönyök (sitemap product_0.xml → fuggony-slugú termékek, méret a névben).
import re, html, json, sys
sys.path.insert(0, 'scripts/catalog')
import lib

STORE = 'Bonami'
locs = []
for u in ['https://www.bonami.hu/sitemap/product_0.xml']:
    x = lib.fetch(u) or ''
    locs += re.findall(r'<loc>(.*?)</loc>', x)
print('sitemap url', len(locs), flush=True)
ACC = re.compile(r'karnis|rud|rolo|zuhany|szalag|fuggonyrud|paraván|parna|takaro|agytakar|csipesz|tarto|kiegesz|gyuru|akaszto|sin\b', re.I)
urls = [u for u in locs if '/p/' in u and re.search(r'fuggony|fatyol|sotetito|dimout|blackout', u.split('/p/')[1]) and not ACC.search(u.split('/p/')[1])]
print('jelolt', len(urls), flush=True)
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
    m = re.search(r'(\d{2,3})\s*[x×]\s*(\d{2,3})\s*cm', name + ' ' + u, re.I)
    low = (name + ' ' + html.unescape(d.get('description') or '')).lower()
    if not m or not re.search(r'függöny|fuggony|fátyol', low) or re.search(r'karnis|rúd|roló|zuhany|szalagfüggöny|ajtófüggöny', low):
        skipped.append(u); continue
    w, l = int(m.group(1)), int(m.group(2))
    if w < 60 or l < 100:
        skipped.append(u); continue
    if re.search(r'dimout|részleges sötétítő|fényszűrő|félig|szűrt', name.lower()):
        typ = 'dimout'
    elif re.search(r'sötétítő|blackout|fényzáró', low):
        typ = 'blackout'
    elif re.search(r'fátyol|áttetsző|átlátszó|voile|vékony|könnyű', low):
        typ = 'sheer'
    else:
        skipped.append(u); continue
    img = lib.ld_image(d.get('image'))
    hx = lib.image_hex(img, mode='object') if img else None
    if not hx or lib.loud(hx):
        skipped.append(u); continue
    offers = d.get('offers')
    offers = offers[0] if isinstance(offers, list) and offers else (offers or {})
    pk = '2 db' if re.search(r'2\s*db|2 darab|\bpár\b|készlet', low) else '1 db'
    items.append({'id': f'curtain-bonami-{lib.slug(u.split("/p/")[1], 80)}', 'store': STORE, 'name': name, 'colorName': None, 'article': d.get('sku'), 'type': typ,
                  'size': {'w': w, 'l': l}, 'pack': pk, 'hex': hx, 'hexSource': 'photo-sample',
                  'price': lib.price(offers.get('price'), STORE, f' / {pk}'), 'url': u, 'checkedAt': lib.TODAY,
                  'note': re.sub(r'\s+', ' ', html.unescape(d.get('description') or ''))[:300]})
STOP = re.compile(r'dimout|sötétít|átlátsz|bársony|mikro|termo|függöny|len|vászon|szövött|díszes|mintás|csíkos|virágos|fátyol|csipk|jacquard|puha|gyerek|szett|készlet|\d', re.I)
out = []
for i in items:
    if not i['article']:
        i.pop('article')
    # a bolt a termék nevét a színnel kezdi („Szürke dimout … függöny”): a színnév a név elejéről
    cw = []
    for w in re.sub(r'\s+', ' ', i['name']).split(' '):
        if STOP.search(w):
            break
        cw.append(w)
    if not cw or len(cw) > 3:
        continue
    i['colorName'] = ' '.join(cw).lower()
    out.append(i)
items = out
from collections import Counter
print(len(items), Counter(i['type'] for i in items), 'kihagyva', len(skipped))
lib.save('curtain', STORE, items,
         'Bonami.hu sitemap (product_0.xml; a lib 8 MB-os korlátja alatt) fuggony-slugú termékei; a méret és a típus a névből/leírásból (sötétítő → blackout, dimout/fényszűrő → dimout, fátyol/áttetsző → sheer). '
         'A kiszerelés (1 db vagy 2 db) a leírás alapján becsült. Szín: termékfotó-átlag (közelítés). Harsány szín kihagyva.')
