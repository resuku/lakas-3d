# praktiker.hu – laminált, vinyl/SPC, svédpadló, (tile_praktiker.py: beltéri padlólap). LD Product + tulajdonságok.
import re
import lib, fl

STORE = 'Praktiker'
SM = 'https://www.praktiker.hu/xml/sitemap-index.xml'
FLOOR_CATS = ('/epites-felujitas/padloburkolat/laminalt-padlo/', '/epites-felujitas/padloburkolat/vinyl-padlo-spc-padlo/',
              '/epites-felujitas/padloburkolat/vinyl-padlo-svedpadlo/', '/epites-felujitas/padloburkolat/hajopadlo/',
              '/epites-felujitas/padloburkolat/fa-szegelylec/')
TILE_CATS = ('/epites-felujitas/hidegburkolat-es-tartozek/belteri-padlolap-jarolap/',)


def props(toks):
    d = {}
    for i, t in enumerate(toks):
        if t.endswith(':') and len(t) < 50 and i + 1 < len(toks):
            d.setdefault(t[:-1].strip(), toks[i + 1])
    return d


def common(u, h):
    """Közös értelmezés: (LD Product, tulajdonságok, név, méret, ár, csomag m², lista ár, kép-hex, megjegyzések)."""
    prods = lib.ld_of_type(h, 'Product')
    if not prods:
        return None
    p = prods[0]
    name = p.get('name', '')
    toks = fl.tokens(h, 'Kezdőoldal')
    d = props(toks)
    desc = p.get('description', '') or ''
    flat = ' '.join(toks)
    mm = re.search(r'(\d+[.,]\d+)\s*m(?:2|²)\s*(?:/\s*(?:cs|csomag|doboz))?', name + ' ' + desc)
    pack = float(mm.group(1).replace(',', '.')) if mm else None
    off = p.get('offers') or {}
    if isinstance(off, list):
        off = off[0]
    ldp = off.get('price')
    cur = lst = None
    sale = re.search(r'-\d+\s*%\s*\|?\s*([\d.]+)\s*Ft\s*/\s*m2', ' | '.join(toks))
    if ldp and pack:
        lst = round(float(ldp) / pack)
    if sale:
        cur = int(sale.group(1).replace('.', ''))
    else:
        cur = lst
    return p, d, name, desc, pack, cur, lst


def build_note(d, desc, pack, cur, lst, extra=None):
    notes = []
    if d.get('Vízálló') and d['Vízálló'].lower() == 'igen':
        notes.append('vízálló' + (f" ({d['Vízállóság jellemzője']})" if d.get('Vízállóság jellemzője') else ''))
    elif d.get('Vízálló'):
        notes.append('nem vízálló')
    if d.get('Alkalmas-e padlófűtéshez'):
        notes.append('padlófűtés: ' + d['Alkalmas-e padlófűtéshez'].lower())
    if pack:
        notes.append(f'csomag {str(pack).replace(".", ",")} m²; az ár a csomagárból átszámolva Ft/m²')
    if lst and cur and lst != cur:
        notes.append(f'akciós ár; lista ár {lib.ft(lst)}/m²')
    if extra:
        notes += extra
    return notes


def parse_floor(u, h):
    c = common(u, h)
    if not c:
        return None
    p, d, name, desc, pack, cur, lst = c
    t = fl.ftype(name)
    if not t:
        return None
    if t == 'laminált' and re.search(r'v[ií]z[aá]ll', name + ' ' + desc, re.I):
        t = 'vízálló laminált'
    if 'svédpadló' in name.lower() and t in ('vinyl', 'SPC'):
        pass
    sz = fl.dims3(name) or fl.dims3(desc)
    th = fl.num(d.get('Vastagság'))
    if not sz:
        m = re.search(r'(?:Méret|Panel mérete)[^0-9]*(\d+)\s*[×x]\s*(\d+)\s*mm', desc)
        if m:
            a, b = float(m.group(1)), float(m.group(2))
            sz = {'l': round(max(a, b)), 'w': round(min(a, b))}
            tt = re.search(r'Vastagság[^0-9]*(\d+(?:[.,]\d+)?)\s*mm', desc)
            th = th or (float(tt.group(1).replace(',', '.')) if tt else None)
            if th:
                sz['t'] = round(th, 1) if th % 1 else round(th)
    if not sz or sz['l'] < 250:
        return None
    img = lib.ld_image(p.get('image'))
    hx = lib.image_hex(img, 'object') if img else None
    wm = re.search(r'AC\s?\d\s*[/(]\s*\d{2}', d.get('Kopásállósági osztály', '') + ' ' + desc)
    wear = re.sub(r'\s+', '', wm.group(0)).replace('(', '/').replace(')', '') if wm else None
    extra = []
    if not hx:
        extra.append('színkép nincs')
    pat = 'herringbone' if fl.herring(name, desc[:300]) else 'plank'
    if pat == 'plank' and sz['l'] / max(sz['w'], 1) < 2.0:
        pat = 'tile'
    if not cur:
        extra.append('ár: a csomag m²-e nem volt kiolvasható, a csomagár nincs átszámolva')
    man = (p.get('brand') or {}).get('name') if isinstance(p.get('brand'), dict) else p.get('brand')
    return fl.rec(id='praktiker-' + str(p.get('sku') or u.rstrip('/').split('/')[-1]), store=STORE, manufacturer=man or d.get('Márka') or 'Praktiker',
                  name=name, type=t, pattern=pat, url=u, size=sz, hex=hx, price=lib.price(cur, STORE, '/m²'), wear=wear,
                  note='; '.join(build_note(d, desc, pack, cur, lst, extra)))


def urls(cats):
    return [u for u in lib.sitemap_urls(SM) if '/p/' in u and any(c in u for c in cats)]


def main():
    us = urls(FLOOR_CATS)
    print('jelöltek', len(us), flush=True)
    items, skip, blocked = fl.crawl(us, parse_floor, 'praktiker')
    items = fl.dedup(items)
    fl.save_floor(STORE, items,
             'Forrás: praktiker.hu sitemap, laminált / vinyl-SPC / svédpadló kategória termékoldalai (LD Product + tulajdonságok). '
             'Kimaradt: szegélyléc, alátét, profil, PVC tekercspadló, szőnyegpadló. Az LD ár csomagár, a csomag m²-éből (névből/leírásból) '
             'átszámolva Ft/m²; ahol az oldal akciós Ft/m² árat mutat, az az ár és a lista ár a note-ban.')


if __name__ == '__main__':
    main()
