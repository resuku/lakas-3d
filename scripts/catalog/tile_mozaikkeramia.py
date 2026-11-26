# mozaikkeramia.hu – járólapok (jarolap-… URL-ek; Shoprenter, LD Product). Az ár az oldalon látható Ft/m².
import re
import lib, fl

STORE = 'Mozaik Kerámia'
SM = 'https://www.mozaikkeramia.hu/sitemap.xml'


def parse(u, h):
    prods = lib.ld_of_type(h, 'Product')
    if not prods:
        return None
    p = prods[0]
    name = p.get('name', '')
    desc = fl.txt(p.get('description', '') or '')
    ap = {x.get('name'): x.get('value') for x in p.get('additionalProperty', []) if isinstance(x, dict)}
    low = (name + ' ' + desc).lower()
    if re.search(r'szegély|lépcső|zárólap|profil|mozaik|dekor|falicsempe|fali csempe|kerti|terasz|2 cm|20 mm', low):
        return None
    m = re.search(r'mérete:\s*(\d+(?:[.,]\d+)?\s*[x×]\s*\d+(?:[.,]\d+)?)\s*cm', desc, re.I)
    sz = fl.dims2(m.group(1) + ' cm') if m else None
    if not sz:
        m = re.search(r'(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(?:cm|mm)?', name)
        sz = fl.dims2(m.group(0)) if m else None
    if not sz:
        return None
    if not (300 <= sz['l'] <= 1200 and sz['w'] >= 150):
        return None
    toks = '|'.join(fl.tokens(h))
    pm = re.search(r'\|([\d ]+)\|Ft\|/\|m2\|Kosárba', toks)
    cur = pm.group(1).replace(' ', '') if pm else None
    if not cur:
        return None
    imgs = p.get('image') or []
    img = imgs[0] if isinstance(imgs, list) and imgs else lib.ld_image(imgs)
    hx = lib.image_hex(img, 'swatch', 0.3) if img else None
    pk = re.search(r'csomagolásban:\s*([\d,]+)', desc)
    wear = None
    rm = re.search(r'\bR\s?(9|10|11|12|13)\b', low)
    if rm:
        wear = 'R' + rm.group(1)
    t = 'porcelán gres járólap' if re.search(r'porcel[aá]n', low) else ('gres járólap' if 'gres' in low else 'járólap')
    notes = []
    if ap.get('Járólap felülete'):
        notes.append('felület: ' + ap['Járólap felülete'].lower())
    if desc and re.search(r'színe:\s*(\S+)', desc):
        notes.append('szín: ' + re.search(r'színe:\s*(\S+)', desc).group(1).lower())
    if ap.get('Járólap fagyállósága'):
        notes.append(ap['Járólap fagyállósága'].lower())
    eff = [e for e in ('márvány', 'fahatású', 'fa hatású', 'beton', 'terrazzo', 'kőhatású', 'cement', 'onyx', 'cotto', 'stone') if e in low]
    if eff:
        notes.append('hatás (névből): ' + ', '.join(sorted(set(eff))))
    if pk:
        notes.append(f'csomag {pk.group(1)} m²')
    if 'rektifik' in low or re.search(r'\bret\b', low):
        notes.append('rektifikált')
    notes.append('az ár az oldalon látható Ft/m² (az LD ár csomagár); vastagság nem szerepel')
    if not hx:
        notes.append('színkép nincs')
    man = (p.get('brand') or {}).get('name') if isinstance(p.get('brand'), dict) else None
    sku = p.get('sku') or u.rsplit('-', 1)[-1].replace('.html', '')
    return fl.rec(id='mozaikkeramia-' + lib.slug(str(sku), 40), store=STORE, manufacturer=man or ap.get('Gyártó') or 'ismeretlen',
                  name=name, decor=str(sku), type=t, pattern='tile', url=u, size=sz, hex=hx, price=lib.price(cur, STORE, '/m²'),
                  wear=wear, note='; '.join(notes))


def main():
    us = [u for u in lib.sitemap_urls(SM) if u.split('/')[-1].startswith(('jarolap-', 'padlolap-', 'greslap-')) and u.endswith('.html')]
    print('jelöltek', len(us), flush=True)
    items, skip, blocked = fl.crawl(us, parse, 'mozaik')
    items = [r for r in fl.dedup(items) if r.get('hex')]
    lib.save('tile', STORE, items,
             'Forrás: mozaikkeramia.hu gz sitemap, jarolap-/padlolap-/greslap- URL-ek termékoldalai (LD Product + Ft/m² az oldalról). '
             'Felvétel: hosszabb oldal 30–120 cm, rövidebb >= 15 cm; szegély, lépcsőlap, mozaik, dekor, kerti/terasz kimarad. '
             'Szín nélküli rekord kihagyva. R-érték csak ha szerepel; vastagság nincs.')


if __name__ == '__main__':
    main()
