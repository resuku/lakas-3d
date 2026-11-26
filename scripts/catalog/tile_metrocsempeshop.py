# metrocsempeshop.hu – padlólapok / greslapok (LD Product + leírás-szöveg). Az ár bruttó Ft/négyzetméter.
import re
import lib, fl

STORE = 'MetrocsempeShop'
SM = 'https://metrocsempeshop.hu/sitemap.xml'


def parse(u, h):
    prods = lib.ld_of_type(h, 'Product')
    if not prods:
        return None
    p = prods[0]
    name = p.get('name', '')
    desc = fl.txt(p.get('description', '') or '')
    low = (name + ' ' + desc).lower()
    if re.search(r'z[aá]r[oó]elem|sarokelem|d[ií]sz[ií]t[oő]elem|fugáz|szegély|bordür|bord[uü]r|lépcsőlap|profil', low):
        return None
    if not re.search(r'padl[oó]|j[aá]r[oó]lap|greslap|gres', low):
        return None
    if re.search(r'csak fal|fali csempe', low) and not re.search(r'padl', low):
        return None
    sz = None
    m = re.search(r'(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*cm\s*(?:lapm|/ ?darab|csempe|burkolat|lap)', desc, re.I)
    if m:
        sz = fl.dims2(m.group(0))
    if not sz:
        m = re.match(r'(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)', name)
        if m:
            sz = fl.dims2(m.group(0) + ' cm')
    if not sz:
        return None
    if not (300 <= sz['l'] <= 1200 and sz['w'] >= 150):
        return None
    th = re.search(r'Vastagság\w*:?\s*(\d+(?:[.,]\d+)?)\s*mm', desc)
    if th:
        v = float(th.group(1).replace(',', '.'))
        sz['t'] = round(v, 1) if v % 1 else round(v)
    body = fl.txt(h)
    pm = re.search(r'\(\s*([\d  ]+)\s*Ft\s*/\s*Négyzetméter\s*\)', body.replace('\xa0', ' '))
    cur = pm.group(1).replace(' ', '') if pm else None
    unit_ok = bool(cur)
    if not cur:
        cur = (p.get('offers') or {}).get('price')
    img = lib.ld_image(p.get('image'))
    hx = lib.image_hex(img, 'swatch', 0.3) if img else None
    rm = re.search(r'\bR\s?(9|10|11|12|13)\b', desc + ' ' + name)
    wear = ('R' + rm.group(1)) if rm else None
    t = 'porcelán gres járólap' if re.search(r'porcel[aá]n', low) else ('gres járólap' if re.search(r'gres', low) else 'járólap')
    notes = []
    for rx, lab in ((r'(matt|fényes|félfényes|polírozott|lappato|rusztikus)', 'felület'),):
        m2 = re.search(rx, low)
        if m2:
            notes.append(f'{lab}: {m2.group(1)}')
    eff = [e for e in ('márvány', 'fahatású', 'fa hatású', 'beton', 'terrazzo', 'terazzo', 'kő', 'kőhatású', 'cement', 'onyx', 'cotto', 'terrakotta') if e in low]
    if eff:
        notes.append('hatás: ' + ', '.join(sorted(set(eff))))
    pk = re.search(r'1 kiszerelés[^.]*?([\d,]+)\s*négyzetméter', desc, re.I) or re.search(r'([\d,]+)\s*m2\s*/\s*kiszerelés', desc)
    if pk:
        notes.append(f'kiszerelés {pk.group(1)} m²')
    if 'csúszásmentes' in low:
        notes.append('csúszásmentes')
    if 'rektifik' in low:
        notes.append('rektifikált')
    if re.search(r'fagyáll', low):
        notes.append('fagyálló' if not re.search(r'nem fagyáll', low) else 'nem fagyálló')
    if not unit_ok:
        notes.append('az egységár (Ft/m²) nem volt kiolvasható, az LD ár egysége bizonytalan')
    notes.append('bruttó ár; vastagság: ' + (f"{sz['t']} mm" if 't' in sz else 'nem szerepel'))
    if not hx:
        notes.append('színkép nincs')
    return fl.rec(id='metrocsempeshop-' + lib.slug(u.rstrip('/').split('/')[-1].replace('.html', ''), 70), store=STORE,
                  manufacturer=('ismeretlen (a bolt a márkát nem adja meg)'), name=name, type=t, pattern='tile', url=u,
                  size=sz, hex=hx, price=lib.price(cur, STORE, '/m²'), wear=wear, note='; '.join(notes))


def main():
    us = [u for u in lib.sitemap_urls(SM) if '/termek/' in u]
    print('jelöltek', len(us), flush=True)
    items, skip, blocked = fl.crawl(us, parse, 'metro')
    items = fl.dedup(items)
    lib.save('tile', STORE, items,
             'Forrás: metrocsempeshop.hu sitemap, minden termékoldal (LD Product + leírás-szöveg); felvétel: a leírás padlóra/járólapra utal, '
             'hosszabb oldal 30–120 cm, rövidebb >= 15 cm (zárólem, díszítőelem, kis metrócsempe kimarad). Az ár bruttó Ft/m² '
             '(az oldal „Ft / Négyzetméter” sora); a gyártót a bolt nem adja meg.')


if __name__ == '__main__':
    main()
