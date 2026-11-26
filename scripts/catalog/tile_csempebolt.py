# csempebolt.hu – padlóburkoló járólapok (Shoprenter; LD Product + adatok). A sitemap gz-s (a lib.fetch kicsomagolja).
import re
import lib, fl

STORE = 'Csempebolt'
SM = 'https://csempebolt.hu/sitemap.xml'


def cand(u):
    s = u.rstrip('/').split('/')[-1].lower()
    if '/spd/' in u or re.search(r'csaptelep|lefolyo|zuhany|kad|wc|mosdo', s):
        return False
    return bool(re.search(r'padl|jarol|gres|terburk|burkolat', s) or ('burkolo' in s and 'falburkolo' not in s))


def parse(u, h):
    prods = lib.ld_of_type(h, 'Product')
    if not prods:
        return None
    p = prods[0]
    off = p.get('offers') or {}
    if isinstance(off, list):
        off = off[0]
    cat = off.get('category', '')
    if not re.search(r'padl[oó]burkolat|j[aá]r[oó]lap', cat, re.I):
        return None
    ap = {x.get('name'): x.get('value') for x in p.get('additionalProperty', []) if isinstance(x, dict)}
    desc = p.get('description', '') or ''
    lcm, wcm = fl.num(ap.get('Hosszúság')), fl.num(ap.get('Szélesség'))
    sz = None
    if lcm and wcm:
        sz = {'l': round(max(lcm, wcm) * 10), 'w': round(min(lcm, wcm) * 10)}
    else:
        m = re.search(r'Méret(?: \(cm\))?:\s*([\d,.]+\s*[x×]\s*[\d,.]+)', desc)
        d2 = fl.dims2(m.group(1) + ' cm') if m else None
        sz = d2
    if not sz:
        return None
    if not (300 <= sz['l'] <= 1200 and sz['w'] >= 150):
        return None
    m = re.search(r'<h1[^>]*>(.*?)</h1>', h, re.S)
    name = fl.txt(m.group(1)) if m else fl.txt((re.search(r'<title>(.*?)</title>', h, re.S) or [None, ''])[1])
    toks = '|'.join(fl.tokens(h))
    pm = re.search(r'Doboz \(m²\):\s*([\d,]+)', desc)
    pack = pm.group(1) if pm else None
    cur = off.get('price')
    lst = None
    sl = re.search(r'\|(\d[\d ]*)\|Ft\|/\|m2\|(\d[\d ]*)\|Ft\|/\|m2', toks)
    if sl:
        lst = sl.group(1).replace(' ', '')
        if sl.group(2).replace(' ', '') != str(cur):
            lst = None
    imgs = p.get('image') or []
    img = imgs[0] if isinstance(imgs, list) and imgs else lib.ld_image(imgs)
    # fehér sávos tárgyfotó: a kép középső része (a lap) adja a színt
    hx = lib.image_hex(img, 'swatch', 0.3) if img else None
    pei = ap.get('Kopásállóság')
    rm = re.search(r'\bR\s?(9|10|11|12|13)\b', desc + ' ' + name)
    wear = '; '.join(x for x in (re.sub(r'(?i)pei\s*', 'PEI ', pei) if pei else None, ('R' + rm.group(1)) if rm else None) if x) or None
    pmat = ''
    t = 'gres járólap' if re.search(r'gres', name + desc, re.I) else 'járólap'
    if re.search(r'porcel[aá]n', name + desc, re.I):
        t = 'porcelán gres járólap'
    notes = []
    if ap.get('Burkolat hatás'):
        notes.append('hatás: ' + ap['Burkolat hatás'].lower())
    if ap.get('Felület'):
        notes.append('felület: ' + ap['Felület'].lower())
    if ap.get('Fagyállóság'):
        notes.append(ap['Fagyállóság'].lower())
    fh = re.search(r'Felhasználhatósága:([^:]+?)(?:Színárnyalat|Cikkszám|$)', desc.replace('\r', '').replace('\n', ''))
    if fh:
        notes.append('felhasználhatóság: ' + fh.group(1).strip().lower())
    if ap.get('Minőség'):
        notes.append(ap['Minőség'])
    if 'rektifik' in (name + desc).lower():
        notes.append('rektifikált')
    if ap.get('Színárnyalat'):
        notes.append('színárnyalat: ' + ap['Színárnyalat'].lower())
    if pack:
        notes.append(f'doboz {pack} m²')
    if lst:
        notes.append(f'akciós ár; lista ár {lib.ft(lst)}/m²')
    notes.append('vastagság nem szerepel az oldalon')
    if not hx:
        notes.append('színkép nincs')
    sku = p.get('sku') or u.rstrip('/').split('/')[-1]
    man = (p.get('brand') or {}).get('name') if isinstance(p.get('brand'), dict) else None
    return fl.rec(id=f'csempebolt-{lib.slug(str(sku), 40)}', store=STORE, manufacturer=man or 'ismeretlen', name=name,
                  decor=str(sku), type=t, pattern='tile', url=u, size=sz, hex=hx, price=lib.price(cur, STORE, '/m²'),
                  wear=wear, note='; '.join(notes))


def main():
    us = [u for u in lib.sitemap_urls(SM) if cand(u)]
    print('jelöltek', len(us), flush=True)
    items, skip, blocked = fl.crawl(us, parse, 'csempebolt')
    items = fl.dedup(items)
    lib.save('tile', STORE, items,
             'Forrás: csempebolt.hu gz sitemap; a slug alapján előszűrt jelöltek termékoldalai (LD Product). Felvétel: ajánlati kategória '
             '„Padlóburkolat, járólap”, hosszabb oldal 30–120 cm, rövidebb >= 15 cm (falicsempe, mozaik, dekor, lépcsőlap, szaniter kimarad). '
             'Az LD ár Ft/m² (az oldalon is így); a vastagság nem szerepel; a szín a termékkép középső részének átlaga.')


if __name__ == '__main__':
    main()
