# JOLA (belteriajtobirodalom.hu) – 1. lépés: termékoldalak letöltése és értelmezése → /s/catalog/jola_parsed.json
import json, re, html, sys
sys.path.insert(0, 'scripts/catalog')
import lib

SM = 'https://belteriajtobirodalom.hu/ba_product-sitemap.xml'
urls = [u for u in lib.sitemap_urls(SM) if '/termek/' in u]
print('termek url', len(urls), flush=True)
out = []
for i, u in enumerate(urls):
    try:
        h = lib.fetch(u)
    except lib.RobotsBlocked:
        print('tiltott', u); continue
    if not h:
        continue
    prod = None
    for d in lib.ld_of_type(h, 'Product'):
        prod = d; break
    t = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', h, flags=re.S)
    m = re.search(r'<h1[^>]*>(.*?)</h1>', t, re.S)
    name = html.unescape(re.sub(r'<[^>]+>', '', m.group(1))).strip() if m else (prod or {}).get('name')
    # dekorlista: a "Válasszon színt" blokk előtti képek + nevek; az első blokkot használjuk
    decors = []
    for im, nm in re.findall(r'<img[^>]*src="(https://img\.belteriajtobirodalom\.hu/ajtok/szinek/[^"]+)"[^>]*>\s*(?:<[^>]+>\s*)*([^<\n][^<]*)', t):
        nm = html.unescape(nm).strip()
        im = im.split('?')[0]
        if nm and (nm, im) not in decors:
            decors.append((nm, im))
    body = re.sub(r'<img[^>]*>', '', t)
    body = re.sub(r'<[^>]+>', '\n', body)
    body = html.unescape(re.sub(r'\n\s*\n+', '\n', body))
    def fld(k):
        mm = re.search(re.escape(k) + r':?\s*\n([^\n]+)', body)
        return mm.group(1).strip() if mm else None
    offers = (prod or {}).get('offers')
    if isinstance(offers, list):
        offers = offers[0] if offers else {}
    out.append({
        'url': u, 'name': name, 'image': lib.ld_image((prod or {}).get('image')),
        'price': (offers or {}).get('price') or (offers or {}).get('lowPrice'),
        'desc': (prod or {}).get('description'),
        'decors': decors, 'felulet': fld('Felület'), 'meretrend': fld('Méretrend'),
        'falvast': fld('Falvastagság tartomány'), 'tok': fld('Átfogó (UTH) tok'), 'kilincs': fld('Kilincs'),
        'tolo': fld('Tolóajtó'), 'kiviteli': fld('Kiviteli formák a kategóriában'),
        'ar_megj': fld('Az ár'),
    })
    if i % 50 == 0:
        print(i, name, flush=True)
json.dump(out, open('/s/catalog/jola_parsed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('kesz', len(out))
