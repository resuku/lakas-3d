# parkettabirodalom.hu (JOLA parketta) – laminált, SPC/vinyl, parketta; LD Product + tábla.
import re, json, sys
import lib, fl

STORE = 'Parkettabirodalom'
SM = 'https://parkettabirodalom.hu/sitemap_index.xml'
KEYS = ('Gyártó', 'Kollekció', 'Dekorszám', 'Vastagság', 'Panelméret', 'Kopásállóság', 'Csomagtartalom', 'Fózolás',
        'Garancia', 'Felület', 'Szín', 'Telepítés módja', 'Padlófűtésnél használható', 'Hozzáadás')


def table(body):
    kv = {}
    for k in KEYS:
        m = re.search(r'(?<![\wÁ-ű])' + re.escape(k) + r'\s+(.+?)\s+(?=' + '|'.join(KEYS) + r')', body)
        if m and len(m.group(1)) < 60:
            kv[k] = m.group(1)
    return kv


def parse(u, h):
    slug = u.rstrip('/').split('/')[-1]
    prods = lib.ld_of_type(h, 'Product')
    if not prods:
        return None
    p = prods[0]
    name = p.get('name', '')
    cat = p.get('category', '') or ''
    props = {x.get('name'): x.get('value') for x in p.get('additionalProperty', []) if isinstance(x, dict)}
    t = fl.ftype(name + ' ' + cat + ' ' + slug.replace('-', ' '))
    if not t:
        return None
    l, w, th = [p.get(k, {}).get('value') if isinstance(p.get(k), dict) else None for k in ('width', 'depth', 'height')]
    body = fl.txt(h) + ' Hozzáadás'
    kv = table(body)
    size = fl.dims3(kv.get('Panelméret', ''))
    if not size and l and w:
        size = {'l': round(max(l, w)), 'w': round(min(l, w)), 't': th}
    if not size or not size.get('l') or size['l'] < 250:
        return None
    pat = 'herringbone' if fl.herring(name, cat, slug) else 'plank'
    off = p.get('offers') or {}
    if isinstance(off, list):
        off = off[0]
    pr = off.get('price')
    img = lib.ld_image(p.get('image'))
    hx = lib.image_hex(img, 'swatch', 0.15) if img else None
    man = (p.get('manufacturer') or {}).get('name') or kv.get('Gyártó')
    notes = []
    if t in ('SPC', 'vinyl'):
        notes.append('vízálló burkolat (SPC/vinyl)')
    elif t == 'vízálló laminált':
        notes.append('vízálló laminált')
    if kv.get('Telepítés módja'):
        notes.append('telepítés: ' + kv['Telepítés módja'].lower())
    if kv.get('Csomagtartalom'):
        notes.append('csomag ' + kv['Csomagtartalom'])
    if kv.get('Padlófűtésnél használható'):
        notes.append('padlófűtés: ' + kv['Padlófűtésnél használható'].lower())
    if kv.get('Garancia'):
        notes.append('garancia ' + kv['Garancia'])
    m2 = re.search(r'([\d ]+)\s*Ft/m²\s*helyett', body)
    if m2:
        notes.append(f'akciós ár, lista ár {m2.group(1).strip()} Ft/m²')
    notes.append('az ár a „-tól” ár')
    if not hx:
        notes.append('a színhez nincs használható kép')
    wear = props.get('Kopásállóság') or kv.get('Kopásállóság')
    return fl.rec(id=f'parkettabirodalom-{lib.slug(slug, 70)}', store=STORE, manufacturer=man,
                  name=re.sub(r'\s*\d{8,}\s*', ' ', name).strip(), decor=kv.get('Dekorszám') or p.get('sku'),
                  type=t, pattern=pat, url=u, size=size, hex=hx, price=lib.price(pr, STORE, '/m²'),
                  wear=re.sub(r'\s+', '', wear) if wear else None,
                  bevel=('fózolás: ' + kv['Fózolás']) if kv.get('Fózolás') else None,
                  note='; '.join(notes))


def main():
    us = [u for u in lib.sitemap_urls(SM) if '/termek/' in u]
    us = [u for u in us if re.search(r'padlo|parketta|laminalt|vinyl|spc|ceramin|click', u.split('/')[-2])]
    print('jelöltek', len(us), flush=True)
    items, skip, blocked = fl.crawl(us, parse, 'parkettabirodalom')
    items = fl.dedup(items)
    fl.save_floor(STORE, items,
             'Forrás: parkettabirodalom.hu sitemap, termékoldalak LD Product + paramétertábla. Szűrés: padlótermékek '
             '(szegélyléc, profil, falpanel, WPC, kiegészítő kimarad). Hibás/elavult URL (404): %d, robots-tiltott: %d. '
             'Az ár a „-tól” ár.' % (skip, blocked))


main()
