# Lamellakirály (lamellakiraly.hu) lamellás / fa falpanelek – WooCommerce termékoldalak (LD Product + attribútumtábla).
import re, html, json, sys
sys.path.insert(0, 'scripts/catalog')
import lib

STORE = 'Lamellakirály'
urls = [u for u in lib.sitemap_urls('https://lamellakiraly.hu/product-sitemap.xml') if '/termekek/' in u]
print('urls', len(urls), flush=True)
SKIP = re.compile(r'térelválasztó|mobil|kültéri|mintakészlet|minta\b|minták|kiegészít|ragasztó|profil|szögmérő|kupak|csavar|gyorskötöző|ajándék|szerszám', re.I)
items, skipped, rows = [], [], []
for u in urls:
    h = lib.fetch(u)
    if not h:
        continue
    ld = lib.ld_of_type(h, 'Product')
    if not ld:
        continue
    d = ld[0]
    name = html.unescape(d.get('name') or '').strip()
    attrs = {}
    for k, v in re.findall(r'<th[^>]*class="[^"]*attributes-item__label[^"]*"[^>]*>(.*?)</th>\s*<td[^>]*>(.*?)</td>', h, re.S):
        attrs[html.unescape(re.sub(r'<[^>]+>', '', k)).strip().rstrip(':')] = html.unescape(re.sub(r'<[^>]+>', ' ', v)).strip()
    cats = re.findall(r'rel="tag">([^<]*)</a>', h)
    cats = [html.unescape(c) for c in re.findall(r'<span class="posted_in">(.*?)</span>', h, re.S) for c in re.findall(r'>([^<]+)</a>', c)]
    offers = d.get('offers')
    if isinstance(offers, list):
        offers = offers[0] if offers else {}
    offers = offers or {}
    ps = offers.get('priceSpecification')
    p = offers.get('price') or offers.get('lowPrice')
    if not p and isinstance(ps, list) and ps:
        p = ps[0].get('price')
    elif not p and isinstance(ps, dict):
        p = ps.get('price')
    img = lib.ld_image(d.get('image'))
    rows.append((name, cats, attrs, p, img, u))
json.dump(rows, open('/s/catalog/lamellakiraly_rows.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('rows', len(rows))
EXCL = re.compile(r'térelválasztó|mobil|kültéri|mintakészlet|minta|kiegészít|ragasztó|profil|csavar|tartozék', re.I)
for name, cats, attrs, p, img, u in rows:
    cj = ' '.join(cats)
    if EXCL.search(name) or EXCL.search(cj) or 'Válassz' in cj:
        skipped.append(name); continue
    if not img:
        continue
    hx = lib.image_hex(img, mode='object')
    if not hx:
        continue
    dim = attrs.get('Méretek')
    mat = attrs.get('Anyag')
    line = cats[-1] if cats else 'Lamellakirály'
    code = attrs.get('szín')
    price = lib.price(p, STORE, ' / db') if p else None
    nt = ' '.join(x for x in [('Méret: ' + dim.replace(' ', '') + ' cm') if dim else None, ('anyag: ' + mat) if mat else None,
                              'akusztikus (filcen)' if re.search(r'akusztik|filc', name + cj, re.I) else None,
                              'egyedi léc (nem teljes panel)' if re.search(r'lamella (léc|lap)|léc|lamella -', name, re.I) and not re.search(r'panel', name, re.I) else None] if x)
    items.append({'id': f'panel-lamellakiraly-{lib.slug(re.sub(r"https://lamellakiraly.hu/termekek/", "", u), 70)}', 'brand': STORE, 'line': line, 'name': name,
                  'code': code, 'hex': hx, 'hexSource': 'photo-sample', 'family': lib.paint_family(hx), 'url': u, 'price': price, 'note': nt})
from collections import Counter
print(len(items), 'kihagyva', len(skipped), Counter(i['family'] for i in items))
lib.save('panel', STORE, items,
         'Lamellakirály (WooCommerce) 224 termékoldal; kihagyva a térelválasztók (kész csomag, mobil), kültéri lamella, mintakészletek, kiegészítők. A méret és az anyag az attribútumtáblából (Méretek: hossz × szél × vastagság cm); '
         'a lamella-lécek egyedi lécek (nem teljes panel). A szín a termékfotó átlaga (photo-sample), a „code” a bolt színneve. Az ár / db (panel vagy léc).')
