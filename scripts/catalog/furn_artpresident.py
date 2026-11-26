# Artpresident (artpresident.hu, WooCommerce) – bútorgyűjtés. A product-sitemapból (shop/butor/...) a slug alapján kategorizál,
# a termékoldalon a leírás "Méretek ..." szakaszából olvassa a méretet (Szélesség/Mélység/Magasság: N cm), ár a JSON-LD-ből.
# Kimenet: furniture-artpresident.json
import re, sys, os, html
import lib
from furn_b_common import *

STORE, KEY = 'Artpresident', 'artpresident'
CAND_CAP = int(os.environ.get('CAND_CAP', 600))
KEEP_CAP = int(os.environ.get('KEEP_CAP', 200))
SKIP_GROUPS = ('matracok', 'furdoszobabutorok', 'barszekek-butor')


def cat_of(url: str):
    p = url.replace('https://artpresident.hu/', '').strip('/').split('/')
    if len(p) < 4 or p[0] != 'shop' or p[1] != 'butor' or p[2] in SKIP_GROUPS:
        return None
    g, s = p[2], p[-1]
    if re.search(r'matrac|agyracs|gardrob|ruha|fogas|tukor|lampa|forgo|irodai|gamer|barszek|bar-szek|gyerek', s) and not re.search(r'iroasztal', s):
        return None
    if 'ejjeliszekreny' in s: return 'nightstand'
    if 'cipo' in s: return 'shoeCabinet'
    if re.search(r'tv-allvany|tv-szekreny|rtv|tv-asztal', s): return 'tvUnit'
    if re.search(r'terelvalaszto|paravan', s): return 'divider'
    if re.search(r'dohanyzoasztal|kavezoasztal|lerakoasztal|asztalka|dohanyzo', s) or g == 'dohanyzoasztalok': return 'coffeeTable'
    if 'iroasztal' in s or g == 'iroasztalok':
        return 'deskCorner' if re.search(r'sarok|l-alak', s) else None
    if 'asztal' in s: return 'diningTable'
    if re.search(r'puff|ulokek|labtarto', s): return 'ottoman'
    if re.search(r'kanape|ulogarnitura|sofa', s):
        return 'sofaChaise' if re.search(r'sarok|l-alak|u-alak', s) else 'sofa'
    if re.search(r'fotel|karosszek', s): return 'armchair'
    if re.search(r'(^|-)(franciaagy|agy|agykeret|boxspring)(-|$)|franciaagy', s) or g == 'agyak': return 'bed'
    if re.search(r'komod|tarolo|talalo|vitrin|szekreny', s): return 'sideboard'
    if re.search(r'polc|regal|konyvtar', s): return 'shelf'
    if re.search(r'(^|-)szek(-|$)|szek-|etkezoszek', s) or g == 'szekek': return 'chair'
    return None


col = Collector(STORE, KEY)


def desc_text(p: str) -> str:
    i = p.find('id="tab-description"')
    if i < 0:
        i = p.find('woocommerce-product-details__short-description')
    j = p.find('id="tab-additional_information"', i + 1)
    seg = p[i: j if j > i else i + 20000]
    seg = re.sub(r'<(script|style).*?</\1>', ' ', seg, flags=re.S)
    return strip_tags(seg)


def attr_text(p: str) -> str:
    i = p.find('id="tab-additional_information"')
    if i < 0:
        return ''
    j = p.find('id="tab-reviews"', i + 1)
    return strip_tags(re.sub(r'<(script|style).*?</\1>', ' ', p[i: j if j > i else i + 8000], flags=re.S))


def dims(t: str, attrs: str = '') -> dict:
    """Termékadatok tábla (Szélesség 125 cm) és/vagy a leírás 'Méretek' szakasza: címke: N cm (vagy N × M × K cm)."""
    i = t.find('Méretek')
    seg = attrs + ' ' + (t[i: i + 700] if i >= 0 else '')
    out = {}
    NUM = r'(\d+(?:[.,]\s?\d+)?)'
    lab = r'(Szélesség|Mélység|Magasság|Hosszúság|Átmérő|Ülőlap magassága|Ülésmagasság)(?:\s*/\s*hosszúság)?\s*(?:\(cm\))?\s*:?\s*'
    for m in re.finditer(lab + NUM + r'(?!\s*[/+\d])(?:\s*cm)?', seg):
        k = m.group(1)
        if k not in out:
            out[k] = (num(m.group(2).replace(' ', '')), None)
    for m in re.finditer(r'Fekvőfelület(?: mérete)?\s*:?\s*' + NUM + r'\s*[x×]\s*' + NUM + r'\s*cm', seg):
        out.setdefault('Fekvőfelület', (num(m.group(1).replace(' ', '')), num(m.group(2).replace(' ', ''))))
    m = re.search(r'Szélesség\s*/\s*mélység\s*/\s*magasság\s*[–-]?\s*(\d+)\s*/\s*(\d+)\s*/\s*(\d+)\s*cm', seg, re.I)
    if m:
        for k, g in (('Szélesség', 1), ('Mélység', 2), ('Magasság', 3)):
            out.setdefault(k, (float(m.group(g)), None))
    return out


def price_of(ld):
    offers = ld.get('offers')
    offers = offers if isinstance(offers, list) else [offers] if offers else []
    for o in offers:
        if o.get('price'):
            return o['price'], False
        for ps in o.get('priceSpecification') or []:
            if ps.get('price'):
                return ps['price'], False
        if o.get('lowPrice'):
            return o['lowPrice'], True
    return None, False


def real_image(u):
    if not u:
        return None
    m = re.search(r'(https://artpresident\.hu/wp-content/[^\s"]+)$', u)
    return m.group(1) if m else u


def product(cat, url):
    p = lib.fetch(url)
    if not p:
        col.skip(cat, 'letöltési hiba', url); return
    ld = (lib.ld_of_type(p, 'Product') or [{}])[0]
    name = html.unescape(ld.get('name') or strip_tags((re.search(r'<h1[^>]*>(.*?)</h1>', p, re.S) or [0, ''])[1]))
    t = desc_text(p)
    d = dims(t, attr_text(p))
    def v(k):
        x = d.get(k)
        return round(x[0] * 10) if x and x[0] else None
    W, D, H, L, dia = v('Szélesség'), v('Mélység'), v('Magasság'), v('Hosszúság'), v('Átmérő')
    price, from_ = price_of(ld)
    image = real_image(lib.ld_image(ld.get('image'))) or real_image(og(p))
    size, extra, fields, notes = {}, {}, {}, []
    low = name.lower()
    if from_:
        notes.append('Több kivitel; az ár a legalacsonyabb.')
    if 'választható' in low:
        fields['colorName'] = 'választható'
    if cat in ('diningTable', 'coffeeTable'):
        if dia:
            size.update(w=dia, d=dia); fields['shape'] = 'round'
        else:
            size.update(w=L or W, d=D if L else None)
            if L and W and not D:
                size['d'] = W
            elif not L:
                size['d'] = D
            fields['shape'] = shape_from(name) or None
        size['h'] = H
        if 'Hosszúság' not in d and 'Szélesség' in d and 'Mélység' not in d:
            notes.append('Csak a szélesség szerepel az oldalon.')
    elif cat == 'bed':
        size.update(w=W, d=L or D, h=H, headH=H)
        mt = mattress_from(name) or mattress_from(t[:1500])
        extra['mattress'] = mt
        if mt:
            fields['mattress'] = mt
            size['sleepW'], size['sleepL'] = int(mt[:3]) * 10, 2000
        if re.search(r'ágyneműtartó', t.lower()):
            fields['storage'] = 'igen'
    elif cat == 'ottoman':
        size.update(w=dia or W, d=dia or D, h=H)
    else:
        size.update(w=W or L, d=D, h=H)
    if cat in ('sofa', 'sofaChaise'):
        fk = d.get('Fekvőfelület')
        if fk and fk[0] and fk[1]:
            size['sleepW'], size['sleepL'] = round(fk[0] * 10), round(fk[1] * 10)
            fields['sleeper'] = True
        else:
            fields['sleeper'] = bool(re.search(r'ágyazható|kanapéágy|franciaággyá|nyitható|alvásra', (name + ' ' + t[:1500]).lower()))
        st = v('Ülőlap magassága') or v('Ülésmagasság')
        if st:
            size['seatH'] = st
        if re.search(r'ágyneműtartó', t.lower()):
            fields['storage'] = 'igen'
    if cat == 'sofaChaise':
        a, b = size.get('w'), size.get('d')
        if a and b and b > a:
            size['w'], size['d'] = b, a
        fields['lType'] = 'corner'
        sd = side_from(name)
        if sd:
            fields['chaiseSide'] = sd
        elif re.search(r'univerz|jobbos és balos|balos.*jobbos|jobbos.*balos', (name + t[:800]).lower()):
            fields['chaiseSide'] = 'reversible'
    if cat == 'armchair':
        st = v('Ülőlap magassága') or v('Ülésmagasság')
        if st:
            size['seatH'] = st
    if cat == 'deskCorner':
        size['legL'] = size.get('d')
    col.add(cat, url=url, name=name, size=size, price=price, image=image, extra=extra, note='; '.join(notes),
            article=ld.get('sku'), **fields)


urls = lib.sitemap_urls('https://artpresident.hu/sitemap_index.xml')
by = {}
for u in urls:
    c = cat_of(u)
    if c:
        by.setdefault(c, []).append(u)
print({k: len(v) for k, v in by.items()}, flush=True)
order = [c for c in ('sofa', 'sofaChaise', 'ottoman', 'tvUnit', 'nightstand', 'diningTable', 'chair', 'divider', 'bed', 'deskCorner',
                    'coffeeTable', 'sideboard', 'shelf', 'armchair', 'shoeCabinet')]
if len(sys.argv) > 1:
    order = [c for c in order if c in sys.argv[1:]]
for cat in order:
    cand = 0
    for url in by.get(cat, []):
        if col.stats[cat]['ok'] >= KEEP_CAP or cand >= CAND_CAP:
            break
        if col.seen(url):
            continue
        cand += 1
        try:
            product(cat, url)
        except lib.RobotsBlocked:
            col.skip(cat, 'robots tiltja', url)
        except lib.BotCheck:
            print('BOTCHECK', url); col.save('Artpresident – megszakadt (botellenőrzés)'); raise
        except Exception as e:
            col.skip(cat, 'hiba: ' + type(e).__name__, url); print('HIBA', url, repr(e)[:100], flush=True)
        if cand % 25 == 0:
            print(cat, 'cand', cand, 'ok', col.stats[cat]['ok'], flush=True)
    print('==', cat, len(by.get(cat, [])), dict(col.stats[cat]), flush=True)
    col.save('Artpresident (artpresident.hu): product-sitemap (shop/butor/...), kategória a slugból; méret a leírás "Méretek" szakaszából '
             '(csak az oldalon szereplő Szélesség/Mélység/Magasság: N cm; ha a szélesség nincs, kimarad); ár a JSON-LD-ből; szín a fő termékfotó átlaga. '
             'Szőnyeg, térelválasztó, akusztikus panel nincs a kínálatban.')
