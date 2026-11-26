# diego.hu – laminált, vízálló laminált, SPC, LVT padlók. A robots miatt csak query nélküli URL (a sitemap ilyet ad).
import re
import lib, fl

STORE = 'DIEGO'
SM = 'https://diego.hu/media/sitemap.xml'
PAT = re.compile(r'/(?:[a-z0-9-]+/)?[a-z0-9-]*(?:laminalt|spc|lvt|vinyl)-padlo(?:-\d+)?$')


def specs(h):
    d = {}
    for m in re.finditer(r'<th[^>]*class="[^"]*label[^"]*"[^>]*>(.*?)</th>\s*<td[^>]*>(.*?)</td>', h, re.S):
        d[fl.txt(m.group(1))] = fl.txt(m.group(2))
    return d


def parse(u, h):
    m = re.search(r'<h1[^>]*>(.*?)</h1>', h, re.S)
    name = fl.txt(m.group(1)) if m else ''
    if not name:
        return None
    sp = specs(h)
    t = fl.ftype(name)
    if not t:
        return None
    if 'laminált' not in t and sp.get('Típus', '').upper() in ('SPC', 'LVT', 'VINYL'):
        t = 'SPC' if 'SPC' in sp.get('Típus', '').upper() else 'vinyl'
    size = fl.dims2(sp.get('Panelméret', ''))
    th = fl.num(sp.get('Vastagság'))
    if size and th:
        size['t'] = round(th, 1) if th % 1 else round(th)
    if size and size['l'] < 250:
        return None
    # ár: a termékazonosító utáni első "x Ft / m2" (listaár); doboz-ár a nyers LD-ben van
    body = fl.txt(re.sub(r'<script.*?</script>', '', h[h.find('<h1'):h.find('<h1') + 12000], flags=re.S))
    pm = re.search(r'Termékazonosító:\s*\S+\s+([\d ]+)\s*Ft\s*/\s*m\s*2', body)
    pr = lib.price(pm.group(1).replace(' ', ''), STORE, '/m²') if pm else None
    sale = re.search(r'Klubkártyával\s*([\d ]+)\s*Ft', body)
    # szín: a termék színmintaképe (a LD-ben szereplő képpel azonos gyorsítótár-azonosítóval)
    hh = h.replace('\\/', '/')
    ld = lib.ld_of_type(h, 'Product')
    main = lib.ld_image(ld[0].get('image')) if ld else None
    img = None
    if main:
        cache = re.search(r'/cache/([0-9a-f]+)/', main)
        if cache:
            c = [x for x in re.findall(r'https://www\.diego\.hu/media/catalog/product/cache/' + cache.group(1) + r'/[^"\' <>)]+', hh) if 'szinminta' in x]
            img = c[0] if c else None
    hx = lib.image_hex(img, 'swatch', 0.15) if img else None
    _t = fl.txt(re.sub(r'<script.*?</script>|<style.*?</style>', '', h, flags=re.S))
    ac = re.search(r'AC\s?\d\s*/\s*\d{2}', _t[_t.find('Tulajdonságok'):] if 'Tulajdonságok' in _t else '')
    wear = re.sub(r'\s+', '', ac.group(0)) if ac else (sp.get('Kopásállóság', '').split(' ')[0] or None)
    dec = re.search(r'-([a-z]{1,3}\d{2,5}[a-z]?)-', (img or main or '').split('/')[-1], re.I)
    notes = []
    if not size:
        notes.append('a lapméret az oldalon nem szerepel' + (f', vastagság {th:g} mm' if th else ''))
    if t in ('SPC', 'vinyl') or t == 'vízálló laminált':
        notes.append('vízálló')
    if sp.get('Hátoldal'):
        notes.append('hátoldal: ' + sp['Hátoldal'].lower())
    if sp.get('Lerakási mód'):
        notes.append('lerakás: ' + sp['Lerakási mód'].lower())
    if sp.get('Méret / Kiszerelés'):
        notes.append('kiszerelés ' + sp['Méret / Kiszerelés'])
    if sp.get('Rendszergarancia'):
        notes.append('garancia ' + sp['Rendszergarancia'])
    if sp.get('Padlófűtéshez alkalmazható'):
        notes.append('padlófűtés: ' + sp['Padlófűtéshez alkalmazható'].lower())
    if sp.get('Típus') and sp['Típus'] not in ('SPC', 'LVT'):
        notes.append('kollekció: ' + sp['Típus'])
    if sale:
        notes.append(f'klubkártyás ár: {sale.group(1).strip()} Ft/m²')
    notes.append('a gyártó a terméknév első szava (a bolt nem adja külön)')
    if not hx:
        notes.append('színminta-kép nincs')
    pat = 'herringbone' if fl.herring(name, u) else 'plank'
    return fl.rec(id='diego-' + lib.slug(u.split('/')[-1], 70), store=STORE, manufacturer=name.split()[0], name=name,
                  decor=dec.group(1).upper() if dec else None, type=t, pattern=pat, url=u, size=size, hex=hx, price=pr,
                  wear=wear, note='; '.join(notes))


def main():
    us = [u for u in lib.sitemap_urls(SM) if PAT.search(u) and 'termekminta' not in u and 'tekercses' not in u
          and 'szonyeg' not in u and '?' not in u]
    print('jelöltek', len(us), flush=True)
    items, skip, blocked = fl.crawl(us, parse, 'diego')
    items = fl.dedup(items)
    fl.save_floor(STORE, items,
             'Forrás: diego.hu sitemap, laminált / vízálló laminált / SPC / LVT termékoldalak (csak query nélküli URL, a robots miatt). '
             'Kimaradt: termékminta, tekercses vinyl, szőnyegpadló, szegélyléc, alátét, kiegészítő, WPC. A szín a színmintaképből; '
             'az ár a listaár Ft/m²; a gyártó a terméknév első szava.')


main()
