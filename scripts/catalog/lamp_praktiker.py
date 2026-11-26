# Praktiker HU lámpák. URL-ek: a termék-sitemapek (products-*-sitemap.xml), a /vilagitas-lampa/<alkategória>/ útvonallal; a terméklap LD Product
# (név, leírás, kép, ár, márka). Méret, foglalat, fényáram a név/leírás szövegéből (regex).
import sys, re, json, html, collections
sys.path.insert(0, '/w/scripts/catalog')
import lib, lamp_common as lc

OKSUB = {'mennyezeti-lampa': 'mennyezeti', 'csillar': 'függeszték', 'spot-lampa': 'spot', 'asztali-lampa': 'asztali', 'falilampa': 'fali',
         'fali-lampa': 'fali', 'allolampa': 'állólámpa', 'belteri-lampa': '', 'egyeb-belteri-lampa': '', 'konyhai-lampa': ''}
x = lib.fetch('https://www.praktiker.hu/xml/sitemap-index.xml') or ''
urls = []
for s in re.findall(r'<loc>(https://www.praktiker.hu/xml/products-[^<]*)</loc>', x):
    t = lib.fetch(s) or ''
    urls += [u for u in re.findall(r'<loc>\s*([^<]*)</loc>', t) if '/vilagitas-lampa/' in u]
print('lámpa-URL', len(urls), flush=True)

items, rej = [], collections.Counter()
todo = []
for u in urls:
    parts = u.split('/')
    sub = parts[5] if len(parts) > 6 else ''
    if sub not in OKSUB:
        rej['kategória: ' + sub] += 1
        continue
    slugname = parts[-3].replace('-', ' ') if '/p/' in u else ''
    why = lc.reject(slugname, OKSUB[sub])
    if why:
        rej[why] += 1
        continue
    typ, _ = lc.classify(slugname, OKSUB[sub])
    if not typ:
        rej['nem lámpatípus (URL)'] += 1
        continue
    todo.append((u, sub))
print('letöltendő', len(todo), flush=True)
for n, (u, sub) in enumerate(todo):
    try:
        h = lib.fetch(u)
    except (lib.RobotsBlocked, lib.BotCheck) as e:
        print('SKIP', type(e).__name__, u); continue
    if not h:
        continue
    ld = lib.ld_of_type(h, 'Product')
    if not ld:
        continue
    d = ld[0]
    name = html.unescape(d.get('name') or '')
    desc = html.unescape(re.sub(r'<[^>]+>', ' ', d.get('description') or ''))
    br = d.get('brand')
    brand = br.get('name') if isinstance(br, dict) else br
    pr = (d.get('offers') or {})
    pr = pr[0] if isinstance(pr, list) and pr else pr
    price = lib.price(pr.get('price') if isinstance(pr, dict) else None, 'Praktiker')
    rec, why = lc.text_record('Praktiker', name, desc, u, OKSUB[sub], lib.ld_image(d.get('image')), price, brand=brand, article=str(d.get('sku') or ''))
    if rec is None:
        rej[why] += 1
        continue
    items.append(rec)
    if n % 100 == 0:
        print(n, len(todo), len(items), flush=True)

seen = set(); out = []
for x in items:
    if x['id'] not in seen:
        seen.add(x['id']); out.append(x)
note = ('Praktiker HU: a termék-sitemapek /vilagitas-lampa/ útvonalú URL-jei (mennyezeti, csillár, spot, asztali, fali, álló, beltéri, egyéb, konyhai '
        'alkategória), terméklap LD Product. Méret, foglalat, fényáram, színhőmérséklet a név/leírás szövegéből (regex: ø/átm., H, AxBxC cm); a szín a név '
        'színszava (colorName hiányzik, ha a név nem tartalmaz), a hex a fotó átlaga. Kizárva: kültéri, szolár, elemes, beépíthető/süllyesztett, '
        'izzó/fénycső, LED-szalag, fürdő, ipari, reflektor, króm, harsány szín.')
lc.report(out, 'elutasítva: ' + str(dict(rej)))
lib.save('lamp', 'Praktiker', out, note)
