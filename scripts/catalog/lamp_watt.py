# Watt Webshop lámpák: a lamp_watt_raw.py által kinyert nyers mezőkből (microdata + leírás) rekordok. A besorolás a közös lamp_common-ban.
import sys, re, json, collections
sys.path.insert(0, '/w/scripts/catalog')
import lib, lamp_common as lc

raw = json.load(open('/s/lamp/raw-watt.json', encoding='utf-8'))
OKCAT = re.compile(r'mennyezeti|fuggeszt|fali|asztali|allo|munkalamp|ejjeli|tukor|kepmegvil', re.I)
items, rej = [], collections.Counter()
for r in raw:
    cat = r.get('cat') or ''
    bc = ' '.join(r.get('bc') or [])
    if not re.search(r'mennyezeti|fuggeszt|fali|asztali|allo|munkalamp|ejjeli', lc.fold(cat)) or re.search(r'kulteri|kerti|beepit|tukor|izzo|szerelv', lc.fold(cat + ' ' + bc)):
        rej['nem beltéri lámpa kategória (' + cat[:22] + ')'] += 1
        continue
    desc = r.get('desc') or ''
    kv = {}
    for k, v in re.findall(r'(?m)^(Anyag|Szín|Méret|IP védettség|Teljesítmény|Fényerő|Fényáram|Színhőmérséklet|Foglalat|Fényforrás|Megjegyzések)\s*:?\s*\n?\s*(.+)$', desc):
        kv.setdefault(k, v.strip())
    colorHint = kv.get('Szín')
    desc2 = ' '.join(f'{k}: {v}' for k, v in kv.items()) + ' ' + desc[:600].replace('\n', ' ')
    price = lib.price(float(r['price']) if r.get('price') else None, 'Watt Webshop')
    rec, why = lc.text_record('Watt Webshop', r['title'], desc2, r['url'], cat, r.get('image'), price, brand=r.get('brand'), article=r.get('sku'),
                              color_hint=colorHint if colorHint and not re.search(r'krom', lc.fold(colorHint)) else None)
    if rec is None:
        rej[why] += 1
        continue
    items.append(rec)

seen = set(); out = []
for x in items:
    if x['id'] not in seen:
        seen.add(x['id']); out.append(x)
note = ('Watt Webshop (Shoprenter): a sitemap termékoldalai; kategória: mennyezeti, függeszték, fali, asztali/éjjeli/munka-, állólámpa. A szín a "Szín:" sor '
        '(a bolt neve), a hex a termékfotó átlaga; méret a név/"Méret:" sorból (a szöveges méret sorrendje bizonytalan: háromszám = szél. x mély. x mag.). '
        'Fényáram/színhőmérséklet/foglalat a leírás-szövegből (regex). Kizárva: kültéri, beépíthető, tükörvilágító, izzó, szerelvény, króm, harsány.')
lc.report(out, 'elutasítva: ' + str(dict(rej)))
lib.save('lamp', 'Watt Webshop', out, note)
