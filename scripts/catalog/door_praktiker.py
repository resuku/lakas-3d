# Praktiker HU beltéri ajtók: c/1087 kategória (?page=N), termékoldali LD Product. Balos/jobbos és méretváltozatok egy rekordba vonva.
import re, html, sys
sys.path.insert(0, 'scripts/catalog')
import lib
from door_common import style_from, tone_stats

STORE = 'Praktiker'
BASE = 'https://www.praktiker.hu'
CAT = BASE + '/epites-felujitas/ajto-ablak/ajto-es-kiegeszito/c/1087'
links = {}
for p in range(1, 40):
    u = CAT if p == 1 else f'{CAT}?page={p}'
    try:
        h = lib.fetch(u)
    except lib.RobotsBlocked:
        print('tiltott', u); break
    if not h:
        break
    n0 = len(links)
    for l in re.findall(r'href="(/epites-felujitas/ajto-ablak/ajto-es-kiegeszito/[a-z0-9\-]+/p/\d+)"', h):
        links[l] = 1
    print('oldal', p, len(links) - n0, flush=True)
    if len(links) == n0:
        break
print('linkek', len(links), flush=True)
EXC = re.compile(r'toloajto|harmonika|bejarati|biztonsagi|kilincs|zar\b|utkozo|szigetel|kuszob|tokszeles|ajtotok|pant|ajtoborit|szellozo|racs|stopper|csengo|szunyog|vasalat|ajtolap-borit|szervizajto|ajtofolia|szelvedo', re.I)


def norm(n):
    n = re.sub(r'\b(balos|jobbos|bal|jobb)\b', '', n, flags=re.I)
    n = re.sub(r'\d+([,.]\d+)?\s*(cm|mm)?\s*[x×]\s*\d+([,.]\d+)?\s*(cm|mm)?', '', n, flags=re.I)
    return re.sub(r'\s+', ' ', n).strip(' -,')


groups, skipped = {}, []
for l in links:
    slug = l.split('/')[-3]
    if EXC.search(slug) or not re.search(r'belteri|ajtolap|ajto', slug):
        skipped.append(slug); continue
    u = BASE + l
    h = lib.fetch(u)
    if not h:
        continue
    ld = lib.ld_of_type(h, 'Product')
    if not ld:
        continue
    d = ld[0]
    name = html.unescape(d.get('name') or '')
    if re.search(r'toló|harmonika|bejárati|biztonsági|kilincs|szerviz', name, re.I) or not re.search(r'beltéri|ajtólap|szobaajtó|gerébtok|ajtó', name, re.I):
        skipped.append(name); continue
    offers = d.get('offers')
    offers = offers[0] if isinstance(offers, list) and offers else (offers or {})
    k = norm(name)
    groups.setdefault(k, []).append((u, name, offers.get('price'), lib.ld_image(d.get('image')), html.unescape(d.get('description') or '')))
print('csoport', len(groups), 'kihagyva', len(skipped), flush=True)

items = []
for k, vs in groups.items():
    prices = [float(v[2]) for v in vs if v[2]]
    img = next((v[3] for v in vs if v[3]), None)
    if not img:
        continue
    hx = lib.image_hex(img, mode='object')
    if not hx:
        continue
    low = (k + ' ' + vs[0][4]).lower()
    incl = ('ajtólap (tok és kilincs nélkül)' if 'ajtólap' in k.lower() else 'ajtó gerébtokkal/blokktokkal, kilincs nélkül' if re.search(r'tok', k.lower())
            else 'ajtó (tok/kilincs tartalma a listán nem egyértelmű)')
    sizes = sorted({m for v in vs for m in re.findall(r'\d+\s*[x×]\s*\d+\s*(?:cm)?', v[1])})
    surf = ('dekorfóliás' if 'dekorfóli' in low else 'CPL' if 'cpl' in low else 'lakkozott' if 'lakkozott' in low else 'festett' if 'festett' in low else 'tömör fa' if re.search(r'tömör|fenyő', low) else 'dekor/furnér (nem jelölt)')
    sty = 'glass' if 'üveg' in k.lower() else ('groove' if re.search(r'mart|csíkos|intarz|keretes|panel', low) else style_from(k))
    pr = None
    if prices:
        pr = f'{lib.ft(min(prices))}-tól – {incl}; változatok: {len(vs)}, ár {lib.ft(min(prices))}–{lib.ft(max(prices))} (Praktiker, {lib.TODAY})'
    items.append({'id': f'door-praktiker-{lib.slug(k, 70)}', 'store': STORE, 'manufacturer': 'Praktiker (forgalmazott márka)', 'line': k.split(' ')[0], 'name': k, 'style': sty, 'surface': surf,
                  'tone': lib.door_tone(hx), 'hex': hx, 'hexSource': 'photo-sample', 'price': pr, 'url': vs[0][0], 'checkedAt': lib.TODAY,
                  'note': ('Méretek: ' + ', '.join(sizes[:8]) + '. ' if sizes else '') + 'A szín a termékfotó átlaga.'})
print(len(items), tone_stats(items))
lib.save('door', STORE, items,
         'Praktiker.hu „Ajtó és kiegészítő” kategória (c/1087, 532 tétel, ?page=N) beltéri ajtó/ajtólap termékei; nyitásirány- és méretváltozatok egy rekordba vonva (ár: legolcsóbb). Kihagyva: bejárati, '
         'biztonsági, tolóajtó, harmonikaajtó, tok/kilincs/tartozék. A szín a termékfotóból (photo-sample), dekor nincs külön megnevezve; a tok/kilincs tartalom a névből becsült.')
