# IKEA HU lámpák. Forrás: a sitemap (az 5 prod-hu-HU fájl első 8 MB-ja, lib.fetch-korlát), a lámpakategóriák első oldala
# (24 db / kategória, az ?page= nem működik) és a terméklapok „kapcsolódó” linkjei (csak lámpa-slug). A terméklap LD Product
# + a `measurements` JSON adja a méretet.
import sys, re, json, html, collections
sys.path.insert(0, '/w/scripts/catalog')
import lib, lamp_common as lc

LAMP_SLUG = re.compile(r'lampa|lampas|spot|-sin-|sinrendszer|fueggo|fuggo|vilagit|mennyezeti|led-es|plafon|falikar|asztali|allo')
SKIP_SLUG = re.compile(r'izzo|vezetek|ernyo|talp|foglalat|kapcsolo|taviranyito|gyertya|fenyfuzer|szalag|tuekoer|tukor|szekreny|asztal-|-asztal|kanape|fotel|agy-|polc|matrac|konyha|szek-|szoenyeg|fuggony|ruha|parna|takaro|tartaly|adapter|trafo|kabel|hosszabbit|elosztó|elosztok|ventilator|dugalj|okos-')
CATS = ['fueggolampak-18751', 'mennyezeti-lampak-18752', 'mennyezeti-spotlampak-18753', 'allolampak-10731', 'asztali-lampak-10732',
        'falilampak-20504', 'falilampak-es-fali-spotlampak-20503', 'fali-spotlampak-20505', 'spotlampak-20506', 'sinrendszeres-vilagitas-25209',
        'dolgozolampak-20502', 'hordozhato-lampak-700512', 'asztali-dekor-lampa-700179', 'dekoracios-fueggolampak-700177',
        'lampak-li002', 'mennyezeti-vilagitas-18750', 'okos-lampak-59308', 'led-es-lampak-20516', 'lampasok-20491',
        'belteri-lampasok-54941']
P = re.compile(r'/hu/hu/p/([a-z0-9-]+)/')


def pdp_links(h):
    return ['https://www.ikea.com/hu/hu/p/%s/' % s for s in dict.fromkeys(P.findall(h or ''))]


def lampish(u):
    s = u.rsplit('/p/', 1)[-1]
    return bool(LAMP_SLUG.search(s)) and not SKIP_SLUG.search(s)


queue = []
seen = set()


def add(u):
    if u not in seen and lampish(u):
        seen.add(u)
        queue.append(u)


for i in range(1, 6):
    x = lib.fetch(f'https://www.ikea.com/sitemaps/prod-hu-HU_{i}.xml') or ''
    for u in re.findall(r'<loc>\s*(https://www.ikea.com/hu/hu/p/[^<]*)</loc>', x):
        add(u)
print('sitemap után', len(queue), flush=True)
for c in CATS:
    try:
        h = lib.fetch(f'https://www.ikea.com/hu/hu/cat/{c}/')
    except (lib.RobotsBlocked, lib.BotCheck) as e:
        print('cat kihagyva', c, type(e).__name__); continue
    for u in pdp_links(h):
        add(u)
print('kategóriák után', len(queue), flush=True)

MAXP = 1100
items, raw, rejected = [], [], collections.Counter()
i = 0
while i < len(queue) and i < MAXP:
    u = queue[i]; i += 1
    try:
        h = lib.fetch(u)
    except (lib.RobotsBlocked, lib.BotCheck) as e:
        print('SKIP', type(e).__name__, u); continue
    if not h:
        continue
    for v in pdp_links(h):  # kapcsolódó lámpák (színváltozatok, sorozat)
        add(v)
    ld = lib.ld_of_type(h, 'Product')
    if not ld:
        continue
    d = ld[0]
    name = html.unescape(d.get('name') or '')
    cat = d.get('category') or ''
    desc = html.unescape(d.get('description') or '')
    why = lc.reject(name, cat, desc)
    typ, hd = lc.classify(name, cat, desc)
    if why or not typ:
        rejected[why or 'nem lámpatípus (' + cat[:25] + ')'] += 1
        continue
    meas = {}
    for mv, mn in re.findall(r'\{"measure":"([^"]+)","name":"([^"]+)"', h):
        meas.setdefault(mn, mv)
    sz = {}

    def val(k):
        for kk, vv in meas.items():
            if kk.lower().startswith(k.lower()):
                mm_ = re.match(r'([\d.,]+) ?(cm|mm|m)\b', vv)
                if mm_:
                    return lc.mm(mm_.group(1), mm_.group(2))
        return None
    sz['d'] = val('Ernyő átmérő') or val('Átmérő') or val('Szélesség')
    sz['h'] = val('Magasság')
    if typ == 'track':
        sz['l'] = val('Hosszúság') or val('Szélesség')
        if sz['l'] == sz['d']:
            sz['d'] = None
    if typ == 'pendant':
        sz['drop'] = val('Vezeték hosszúság') or val('Hosszúság')
    if typ == 'wall':
        sz['proj'] = val('Mélység') or val('Kinyúlás')
    if typ in ('ceiling',) and not sz['d']:
        sz['d'] = val('Hosszúság')
    img = lib.ld_image(d.get('image'))
    hexc = lc.photo_hex(img, d.get('color') or name) if img else None
    low = lc.fold(name + ' ' + desc)
    sock = lc.socket_of(desc + ' ' + name)
    led_int = bool(re.search(r'led-?es|integralt led|beepitett led', low)) and not sock
    lmm = re.search(r'(\d{3,5}) ?(?:lm|lumen)\b', low)
    price = lib.price((d.get('offers') or {}).get('price'), 'IKEA')
    rec = lc.build('IKEA', name, u, typ, name + ' ' + desc[:200], hexc, d.get('color'), sz, brand='IKEA', article=d.get('mpn'),
                   heads=hd, socket=sock, bulbIncluded=True if led_int else (False if sock else None),
                   lm=int(lmm.group(1)) if lmm else None, price=price, emit_text=name + ' ' + desc + ' ' + (d.get('material') or ''))
    if rec:
        items.append(rec)
    if i % 50 == 0:
        print(i, len(queue), len(items), flush=True)

# azonos id ütközés: az első marad
seenid = set(); out = []
for x in items:
    if x['id'] in seenid:
        continue
    seenid.add(x['id']); out.append(x)
note = ('IKEA HU: terméklapok LD Product (név, szín, ár, kép) + a méretlista (measurements). URL-gyűjtés: a prod-hu-HU sitemap-ek első 8 MB-ja '
        '(a lib.fetch korlátja), a lámpakategóriák első 24 terméke és a terméklapokról követett lámpa-linkek; a lista nem teljes. '
        'A bura/test színe a LD színneve, a hex a termékfotó átlaga. Izzó külön kapható, hacsak a név nem LED-es. '
        'Kizárva: kültéri, gyerek, fürdő, szalag, izzó, króm, harsány szín, egyfejű spot.')
lc.report(out, 'elutasítva: ' + str(dict(rejected)) + ' bejárt oldal: %d/%d' % (i, len(queue)))
lib.save('lamp', 'IKEA', out, note)
