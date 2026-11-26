# Bonami HU lámpák. Kategóriaoldalak (?p=N lapozás) -> terméklinkek -> terméklap LD Product (név, leírás "Típus (Márka) - szín, anyag, méret",
# kép, ár). A robots.txt a ClaudeBot-ra 1 s szünetet ír elő; a lib.fetch legalább 1,2 s-t tart.
import sys, re, json, html, collections
sys.path.insert(0, '/w/scripts/catalog')
import lib, lamp_common as lc

BASE = 'https://www.bonami.hu'
CATS = {'mennyezeti-lampak-fuggolampak': '', 'csillarok-fuggolampak': 'függeszték', 'mennyezeti-lampak-spotlampak': 'spot', 'allolampak': 'állólámpa',
        'asztali-ejjelilampak': 'asztali', 'falilampak': 'fali', 'design-lampak-amik-felpezsditik-otthonod': '', 'pont-lampak': '', 'okos-vilagitas': ''}
P = re.compile(r'href="(?:https://www\.bonami\.hu)?(/p/[a-z0-9-]+)"')
prods = {}
for c, hint in CATS.items():
    seen_c = set()
    for pg in range(0, 40):
        u = f'{BASE}/c/{c}' + (f'?p={pg}' if pg else '')
        try:
            h = lib.fetch(u)
        except (lib.RobotsBlocked, lib.BotCheck) as e:
            print('lista kihagyva', u, type(e).__name__); break
        if not h:
            break
        links = [x for x in dict.fromkeys(P.findall(h))]
        new = [x for x in links if x not in seen_c]
        seen_c.update(new)
        for x in new:
            prods.setdefault(x, hint)
        print(c, pg, len(links), len(new), flush=True)
        if not new:
            break
print('termék-URL', len(prods), flush=True)

items, rej = [], collections.Counter()
for n, (path, hint) in enumerate(prods.items()):
    slugname = path[3:].replace('-', ' ')
    why = lc.reject(slugname, hint)
    if why:
        rej[why] += 1
        continue
    typ, _ = lc.classify(slugname, hint)
    if not typ:
        rej['nem lámpatípus (URL)'] += 1
        continue
    u = BASE + path
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
    desc = html.unescape(re.sub(r'\s+', ' ', d.get('description') or ''))
    m = re.search(r'\(([^)]+)\)', desc)
    brand = m.group(1).strip() if m else (name.split('–')[-1].strip() if '–' in name else None)
    pr = d.get('offers') or {}
    pr = pr[0] if isinstance(pr, list) and pr else pr
    price = lib.price(pr.get('price') if isinstance(pr, dict) else None, 'Bonami')
    rec, why = lc.text_record('Bonami', name, desc, u, hint, lib.ld_image(d.get('image')), price, brand=brand, article=str(d.get('sku') or ''))
    if rec is None:
        rej[why] += 1
        continue
    items.append(rec)
    if n % 100 == 0:
        print(n, len(prods), len(items), flush=True)

seen = set(); out = []
for x in items:
    if x['id'] not in seen:
        seen.add(x['id']); out.append(x)
note = ('Bonami HU: lámpakategóriák (függő/mennyezeti, csillár, spot, álló, asztali/éjjeli, fali, design) listaoldalai, terméklap LD Product. A leírás '
        '"Típus (Márka) - szín, anyag, SzxMxM cm" formáját olvassa (háromszám = szél. x mély. x mag.); a szín a név színszava, a hex a fotó átlaga. '
        'A foglalat/izzó adata ritkán szerepel, ilyenkor a rekordból kimarad. Kizárva: kültéri, gyerek, fürdő, kristályos csillár, króm, harsány szín.')
lc.report(out, 'elutasítva: ' + str(dict(rej)))
lib.save('lamp', 'Bonami', out, note)
