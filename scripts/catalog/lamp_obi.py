# OBI HU beltéri lámpák. Forrás: a lámpa-alkategóriák oldalai (?page=N, ItemList LD: név, márka, kép, ár), majd a termékoldal
# HTML spec-táblája (szín, anyag, fényszín, foglalat, méretek cm-ben). A sitemap túl nagy; a kategóriaoldalak jobbak.
import sys, re, json, html, collections
sys.path.insert(0, '/w/scripts/catalog')
import lib, lamp_common as lc

BASE = 'https://www.obi.hu'
SUBS = {  # alkategória -> a típus-felismerés kiegészítő szava
    'fueggolampak/c/4450': 'függeszték',
    'mennyezeti-lampak/c/4449': 'mennyezeti',
    'allolampak/c/4457': 'állólámpa',
    'asztali-lampak/c/4464': 'asztali',
    'fali-lampak/c/4452': 'fali',
    'spot-lampak/c/4451': 'spot',
    'csillarok/c/4456': 'csillár függeszték',
    'dizajn-lampak/c/4448': '',
    'munkalampak/c/2113': 'asztali munkalámpa',
    'alaepitheto-lampak/c/4561': 'mennyezeti',
}


def spec_of(p):
    t = re.sub(r'<script.*?</script>|<style.*?</style>', '', p, flags=re.S)
    rows = re.findall(r'<t[hd][^>]*>(.*?)</t[hd]>\s*<t[hd][^>]*>(.*?)</t[hd]>', t, flags=re.S)
    d = {}
    for a, b in rows:
        a = html.unescape(re.sub(r'<[^>]+>', '', a)).strip()
        b = html.unescape(re.sub(r'<[^>]+>', '', b)).strip()
        a = re.sub(r'^.*(Tömeg|Magasság|Szélesség|Mélység)', r'\1', a) if len(a) > 40 and 'Méretek' in a else a
        if a and len(a) < 60 and a not in d and 'Szállítás' not in a:
            d[a.rstrip(':').strip()] = b
    return d


def cm(spec, key):
    v = spec.get(key)
    if not v:
        return None
    m = re.match(r'([\d.,]+) ?(cm|mm|m|g|kg)\b', v)
    if not m or m.group(2) not in ('cm', 'mm', 'm'):
        return None
    return lc.mm(m.group(1).replace('.', '') if re.search(r'\d\.\d{3}\b', m.group(1)) else m.group(1), m.group(2))


listing = {}
for sub, hint in SUBS.items():
    pg = 1
    while pg < 30:
        u = f'{BASE}/belteri-lampak/{sub}' + (f'?page={pg}' if pg > 1 else '')
        try:
            h = lib.fetch(u)
        except (lib.RobotsBlocked, lib.BotCheck) as e:
            print('lista kihagyva', u, type(e).__name__); break
        il = lib.ld_of_type(h or '', 'ItemList')
        els = il[0].get('itemListElement', []) if il else []
        new = 0
        for e in els:
            it = e.get('item') or {}
            sku = it.get('sku')
            if sku and sku not in listing:
                listing[sku] = dict(it, hint=hint, sub=sub.split('/')[0]); new += 1
        print(sub, pg, len(els), new, flush=True)
        if not els or new == 0:
            break
        pg += 1
print('listázott', len(listing), flush=True)

items, rej = [], collections.Counter()
for n, (sku, it) in enumerate(listing.items()):
    name = it.get('name') or ''
    cat = (it.get('category') or '') + ' ' + it['hint']
    why = lc.reject(name, cat)
    typ, hd0 = lc.classify(name, cat)
    if why or not typ:
        rej[why or 'nem lámpatípus/kategória'] += 1
        continue
    u = it['url'] if it['url'].startswith('http') else BASE + it['url']
    try:
        p = lib.fetch(u)
    except (lib.RobotsBlocked, lib.BotCheck) as e:
        print('SKIP', type(e).__name__, u); continue
    if not p:
        continue
    sp = spec_of(p)
    colorName = sp.get('Szín')
    why = lc.reject(name, cat + ' ' + (colorName or ''), ' '.join(sp.values())[:600])
    if why:
        rej[why] += 1
        continue
    if re.search(r'gyerek|fuerdo|furdo', lc.fold(sp.get('Stílusirányzat', '') + sp.get('Helyiség', ''))):
        rej['gyerek/fürdő (spec)'] += 1
        continue
    mat = ' '.join([sp.get('Váz anyaga', ''), sp.get('Ernyő anyaga', ''), sp.get('Forma', '')])
    H, W, D = cm(sp, 'Magasság'), cm(sp, 'Szélesség'), cm(sp, 'Mélység')
    dia = cm(sp, 'Átmérő')
    size = {}
    if typ == 'pendant':
        size = {'d': dia or W, 'drop': H}
    elif typ == 'ceiling':
        size = {'d': dia or (max(W, D) if W and D else W or D), 'h': H}
    elif typ == 'track':
        size = {'l': max(W or 0, D or 0) or None, 'h': H}
    elif typ == 'wall':
        size = {'d': dia or W, 'h': H, 'proj': D}
    else:
        size = {'d': dia or (max(W, D) if W and D else W or D), 'h': H}
    if not size.get('d') and not size.get('l'):
        m = re.search(r'[øØ] ?(\d+(?:[.,]\d+)?) ?cm|(\d+) ?cm\b', name)
        if m:
            size['d'] = lc.mm(m.group(1) or m.group(2), 'cm')
    hd = lc.heads_of(name) or (int(sp['Fényforrások száma']) if sp.get('Fényforrások száma', '').isdigit() else None)
    if typ == 'track' and (hd or 0) < 2 and not re.search(r'\bsin', lc.fold(name)):
        typ = 'ceiling'
        size = {'d': dia or W, 'h': H}
        hd = None
    sock = lc.socket_of(sp.get('Foglalat', '') + ' ' + name, hd)
    if sock and sock['count'] == 1 and hd and hd > 1:
        sock['count'] = hd
    w = lc.fold(sp.get('Izzóval együtt', ''))
    bulb = False if 'izzo nelkul' in w else (True if w else None)
    lm = None
    for k, v in sp.items():
        if 'Fényáram' in k and re.match(r'\d+', v):
            lm = int(re.match(r'\d+', v.replace('.', '')).group(0))
    K = None
    m = re.search(r'([\d.]{4,6}) ?(?:-|–|kelvin|K)', sp.get('Fényszín', ''))
    if m:
        K = int(m.group(1).replace('.', ''))
    img = it.get('image')
    hexc = lc.photo_hex(img, (colorName or '') + ' ' + name) if img else None
    price = lib.price(float((it.get('offers') or {}).get('price') or 0) or None, 'OBI')
    text = name + ' ' + mat + ' ' + (colorName or '')
    ind = lc.fold(sp.get('Közvetett világítás', ''))
    em = 'up' if 'kozvetett' in ind and 'kozvetlen' not in ind and typ in ('floor', 'wall') else None
    rec = lc.build('OBI', name, u, typ, text, hexc, colorName, size, brand=it.get('brand'), article=str(sku), heads=hd if typ == 'track' else None,
                   socket=sock, bulbIncluded=bulb, lm=lm, K=K, price=price, emit_text=text, emit=em,
                   note=('OBI spec: ' + sp['Stílusirányzat']) if False else None)
    if rec:
        items.append(rec)
    if n % 100 == 0:
        print(n, len(listing), len(items), flush=True)

seen = set(); out = []
for x in items:
    if x['id'] not in seen:
        seen.add(x['id']); out.append(x)
note = ('OBI HU: a belteri-lampak alkategóriái (függő, mennyezeti, álló, asztali, fali, spot, csillár, dizájn, munka, alaépíthető) listaoldalai, '
        'majd termékoldal spec-táblája (szín, anyag, fényszín, foglalat, méret). Kizárva: beépíthető, LED-panel, fénycsík, konnektor-, fürdő-, '
        'gyerek-, DIY lámpák, króm, harsány szín. A pendant `drop` az OBI „Magasság” adata (az összmagasság a felfüggesztéssel), a bura '
        'magassága ismeretlen. Fényáram csak ha a spec megadja.')
lc.report(out, 'elutasítva: ' + str(dict(rej)))
lib.save('lamp', 'OBI', out, note)
