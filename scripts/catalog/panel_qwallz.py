# QWALLZ (qwallz.eu) lamellás akusztikus és fa falpanelek (LD Product + oldalfej)
import re, html, json, sys
sys.path.insert(0, 'scripts/catalog')
import lib

urls = [u for u in lib.sitemap_urls('https://qwallz.eu/sitemap_index.xml') if '/termek/' in u]
print('urls', len(urls), flush=True)
rows = []
for u in urls:
    h = lib.fetch(u)
    if not h:
        continue
    ld = lib.ld_of_type(h, 'Product')
    if not ld:
        continue
    d = ld[0]
    t = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', h, flags=re.S)
    b = html.unescape(re.sub(r'\n\s*\n+', '\n', re.sub(r'<[^>]+>', '\n', t)))
    i = b.find('Kalkulátor')
    head = b[max(0, i - 400): i + 30]
    imgs = [x.get('url') if isinstance(x, dict) else x for x in (d.get('image') if isinstance(d.get('image'), list) else [d.get('image')])]
    rows.append({'url': u, 'name': html.unescape(d.get('name') or ''), 'sku': d.get('sku'), 'cat': html.unescape(d.get('category') or ''),
                 'desc': html.unescape(d.get('description') or ''), 'w': (d.get('width') or {}).get('value'), 'l': (d.get('depth') or {}).get('value'),
                 't': (d.get('height') or {}).get('value'), 'imgs': imgs[:2], 'head': head, 'offers': d.get('offers')})
json.dump(rows, open('/s/catalog/qwallz_rows.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('rows', len(rows))

EXC = re.compile(r'SPC|mozaik|stone series|metal series|kiegészít|szerelési|minta|WPC|alátétpanel|csavar|ragasztó|profil', re.I)
INC = re.compile(r'akusztikus|wood series|lamella series|zenvia', re.I)
items = []
for r in rows:
    nm, cat = r['name'], r['cat']
    if not INC.search(nm + ' ' + cat) or EXC.search(cat) or EXC.search(nm):
        continue
    if not r['imgs'] or not r['imgs'][0]:
        continue
    hx = lib.image_hex(r['imgs'][0], mode='object')
    if not hx:
        continue
    o = r['offers']
    o = o[0] if isinstance(o, list) and o else (o or {})
    pr = o.get('price') or (o.get('priceSpecification') or {}).get('price') if isinstance(o, dict) else None
    low = o.get('lowPrice') if isinstance(o, dict) else None
    unit = re.search(r'/\s*(tábla|db|szál|panel|m²)[^\n]*', r['head'])
    u = unit.group(0).strip() if unit else '/ db'
    dim = f"{r['w']}×{r['l']} cm, vastagság {r['t']} cm" if r['w'] and r['l'] else None
    mat = ('BPC (bambusz-műanyag kompozit), fa hatású' if 'wood series' in nm.lower() else 'MDF/furnér akusztikus lamellás panel filc háttérrel' if re.search(r'akusztikus', nm + cat, re.I) else
           'lamellás 3D falpanel')
    if 'zenvia' in (nm + cat).lower():
        mat = 'technikai fafurnéros akusztikus panel'
    name = re.sub(r'\s*-\s*QWALLZ( Falpanelek)?$', '', nm)
    items.append({'id': f'panel-qwallz-{lib.slug(r["url"].rstrip("/").split("/")[-1], 70)}', 'brand': 'QWALLZ', 'line': cat.split('>')[-1].strip(), 'name': name,
                  'code': r['sku'], 'hex': hx, 'hexSource': 'photo-sample', 'family': lib.paint_family(hx), 'url': r['url'],
                  'price': lib.price(pr or low, 'qwallz.eu', ' ' + u) if (pr or low) else None, 'note': f'Méret: {dim}; anyag: {mat}.' if dim else f'Anyag: {mat}.'})
from collections import Counter
print(len(items), Counter(i['family'] for i in items))
lib.save('panel', 'QWALLZ', items,
         'QWALLZ (qwallz.eu): a sitemap 128 termék-URL-jéből 67-nek van LD Product-ja; ebből a lamellás/akusztikus/fa hatású panelek (Akusztikus falpanel, Wood Series BPC, Lamella Series 3D, Zenvia): kihagyva SPC/kő/fém/mozaik, '
         'a kültéri WPC falburkolatok, kiegészítők, mintacsomag. A méret az LD width×depth×height (cm) mezőkből; az anyag a kategóriából/leírásból (becslés). A szín a termékfotó átlaga (a fotón a panel mintázata látszik).')
