# parkettadiszkont.hu – laminált, vinyl, szalagparketta (WooCommerce, LD Product + leírás-tábla).
import re, json
import lib, fl

STORE = 'Parkettadiszkont'
SM = 'https://parkettadiszkont.hu/sitemap_index.xml'
LABELS = ('Gyártó', 'Kollekció', 'Dekorszám', 'Vastagság', 'Koptatóréteg vastagság', 'Koptatóréteg', 'Kopásállóság', 'Fózolás',
          'Felület', 'Csomagtartalom', 'Panelméret', 'Lerakás', 'Garancia', 'Padlófűtésre', 'Szegélyléc', 'Dekorkép',
          'Márkanév', 'Fa fajtája', 'Osztály', 'Felületkezelés', 'Egészség, / környezetvédelem', 'Előkészítettségi állapot',
          'Szín', 'Hatás', 'Fafaj', 'Megjelenés')


def parse(u, h):
    prods = lib.ld_of_type(h, 'Product')
    if not prods:
        return None
    p = prods[0]
    name = p.get('name', '')
    slug = u.rstrip('/').split('/')[-1]
    t = fl.ftype(name + ' ' + slug.replace('-', ' '))
    if not t:
        # a névben nincs típus („… padló 2,5 mm”): a leírás/lerakás alapján vinyl, ha vékony ragasztós lemez
        if re.search(r'padl', name, re.I) and re.search(r'(2|2,5|3|5|5,5)\s*mm', name):
            t = 'vinyl'
        else:
            return None
    toks = fl.tokens(h, 'Leírás')
    g = lambda k, n=4: fl.after(toks, k, LABELS, n)
    ps = ' | '.join(g('Panelméret', 3))
    sz = fl.dims3(ps) or None
    if not sz:
        return None
    if sz['l'] < 250:
        return None
    # több méret esetén az első; a többi a note-ba
    allsz = re.findall(r'\d+(?:[.,]\d+)?\s*[x×*]\s*\d+(?:[.,]\d+)?\s*[x×*]\s*\d+(?:[.,]\d+)?', ps)
    offers = (p.get('offers') or [{}])[0]
    specs = offers.get('priceSpecification') or []
    cur = specs[0].get('price') if specs else None
    lst = specs[1].get('price') if len(specs) > 1 else None
    img = lib.ld_image(p.get('image'))
    hx = lib.image_hex(img, 'swatch', 0.15) if img else None
    man = (g('Gyártó', 1) or g('Márkanév', 1) or [None])[0]
    if not man:
        return None
    wear = ' '.join(g('Kopásállóság', 1))
    ac = re.search(r'AC\s?\d(?:\s*/\s*\d{2})?', wear + ' ' + (p.get('description') or ''))
    cls = re.search(r'(?:Class|osztály)\s*(\d{2})', wear + ' ' + (p.get('description') or ''), re.I)
    wear_v = None
    if ac:
        wear_v = re.sub(r'\s+', '', ac.group(0))
        if '/' not in wear_v:
            c33 = re.search(r'\b(3[1-4])\b', wear + ' ' + (p.get('description') or ''))
            if c33:
                wear_v += '/' + c33.group(1)
    elif cls:
        wear_v = 'Class ' + cls.group(1)
    elif wear and not re.search(r'Bfl|NK', wear):
        wear_v = wear
    notes = []
    if t in ('SPC', 'vinyl'):
        notes.append('vízálló burkolat (vinyl/SPC)')
    elif t == 'vízálló laminált':
        notes.append('vízálló laminált')
    low = name.lower()
    if re.search(r'cseppáll|aqua|drop', low):
        notes.append('cseppálló laminált (nem teljesen vízálló)')
    if g('Lerakás', 1):
        notes.append('lerakás: ' + g('Lerakás', 1)[0].lower())
    if g('Csomagtartalom', 2):
        notes.append('csomag ' + ' / '.join(g('Csomagtartalom', 2)))
    if len(allsz) > 1:
        notes.append('további méret(ek): ' + '; '.join(allsz[1:]) + ' mm')
    for k, lab in (('Padlófűtésre', 'padlófűtés'), ('Garancia', 'garancia'), ('Felület', 'felület'), ('Felületkezelés', 'felületkezelés')):
        if g(k, 1):
            notes.append(f'{lab}: {g(k, 1)[0]}')
    if g('Koptatóréteg', 1):
        notes.append('kopóréteg ' + g('Koptatóréteg', 1)[0])
    if lst and cur and lst != cur:
        notes.append(f'akciós ár; lista ár {lib.ft(lst)}/m²')
    notes.append('az ár a bolt egyetlen megjelenített ára, az egység nincs jelölve (m²-es egységárnak vettem)')
    if not hx:
        notes.append('színkép nincs')
    pat = 'herringbone' if fl.herring(name, slug) else 'plank'
    if pat == 'plank' and sz['l'] / max(sz['w'], 1) < 2.0:
        pat = 'tile'
        notes.append('négyzethez közeli lapméret (tile-minta); a kőhatás a termékképről értelmezendő')
    decor = (g('Dekorszám', 1) or g('Fa fajtája', 1) or [None])[0]
    return fl.rec(id='parkettadiszkont-' + lib.slug(slug, 70), store=STORE, manufacturer=man, name=name, decor=decor,
                  type=t, pattern=pat, url=u, size=sz, hex=hx, price=lib.price(cur, STORE, '/m²'), wear=wear_v,
                  bevel=('fózolás: ' + g('Fózolás', 1)[0]) if g('Fózolás', 1) else None, note='; '.join(notes))


def main():
    us = [u for u in lib.sitemap_urls(SM) if '/termek/' in u]
    print('jelöltek', len(us), flush=True)
    items, skip, blocked = fl.crawl(us, parse, 'parkettadiszkont')
    items = fl.dedup(items)
    fl.save_floor(STORE, items,
             'Forrás: parkettadiszkont.hu product-sitemap, termékoldalak (LD Product + leírás-tábla). Kimaradt: nem padló termékek '
             '(alátét, szegélyléc, ragasztó…) és ahol a panelméret nem adott. A bolt egyetlen egységnélküli árat jelenít meg, ezt Ft/m²-nek vettem; '
             'akciós ár esetén az akciós ár, a listaár a note-ban.')


main()
