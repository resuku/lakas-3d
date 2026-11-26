# parkettawebaruhaz.hu – laminált, vízálló laminált, vinyl/SPC, halszálka, fapadló (HTML, nincs LD).
import re
import lib, fl

STORE = 'Parkettawebáruház'
HOST = 'https://www.parkettawebaruhaz.hu'
LABELS = ('Típus', 'Színek/Árnyalatok', 'Fafajok', 'Vastagság', 'Felhasználhatóság / Kopásállóság', 'Felületi hatás',
          'Felületi kialakítás', 'Nútkialakítás / Műszaki paraméterek', 'Gyártó', 'Lapméret', 'Csomagolás',
          'Származási hely', 'Illesztés módja', 'TERMÉK LEÍRÁS', 'Fázolás', 'Élkiképzés', 'Alátét', 'Garancia')


def media_urls(h):
    i = h.find('KISZERELÉSEK')
    seg = h[max(0, i - 7000):i] if i > 0 else ''
    seen, out = set(), []
    for m in re.finditer(r'(?:src|href|data-[a-z-]+)="(/storage/public/glide-cache/media/([^"/]+)/[^"]+)"', seg):
        if m.group(2) in seen:
            continue
        seen.add(m.group(2))
        out.append(HOST + m.group(1))
    return out


def parse(u, h):
    toks = fl.tokens(h)
    if not toks:
        return None
    title = toks[0]
    g = lambda k, n=3: fl.after(toks, k, LABELS, n)
    typ = ' '.join(g('Típus', 1))
    # morzsamenü: a 2. "Vissza" előtti szakasz
    crumb = ''
    if 'Vissza' in toks:
        j = toks.index('Vissza')
        crumb = ' '.join(toks[max(0, j - 8):j])
    tech = ' '.join(g('Nútkialakítás / Műszaki paraméterek', 2))
    t = fl.ftype(typ + ' ' + u.split('/')[-1].replace('-', ' '))
    if t == 'laminált' and re.search(r'v[ií]z[aá]ll', tech + ' ' + crumb, re.I):
        t = 'vízálló laminált'
    if not t:
        return None
    ls = ' '.join(g('Lapméret', 1))
    sz = fl.dims3(ls)
    if not sz:
        d = fl.dims2(ls)
        th = fl.num(' '.join(g('Vastagság', 1)))
        if d:
            sz = dict(d)
            if th:
                sz['t'] = round(th, 1) if th % 1 else round(th)
    if not sz or sz['l'] < 250:
        return None
    th = fl.num(' '.join(g('Vastagság', 1)))
    if th and 't' not in sz:
        sz['t'] = round(th, 1) if th % 1 else round(th)
    flat = ' | '.join(toks)
    pm = re.search(r'Egységár\s*\|\s*Ár\s*\|\s*([\d.,]+) m\s*\|\s*2\s*\|\s*([\d ]+) Ft\s*\|\s*([\d ]+) Ft/m\s*\|\s*2', flat)
    if pm:
        pr = lib.price(pm.group(3).replace(' ', ''), STORE, '/m²')
        pack = pm.group(1)
    else:
        m2 = re.search(r'([\d ]+) Ft/m\s*\|\s*2', flat)
        pr = lib.price(m2.group(1).replace(' ', ''), STORE, '/m²') if m2 else None
        pack = None
    man = (g('Gyártó', 1) or [None])[0]
    if not man:
        return None
    effect = ' '.join(g('Felületi hatás', 1))
    imgs = media_urls(h)
    order = imgs[1:2] + imgs[0:1] + imgs[2:3]
    img, interior = fl.pick_swatch(order) if order else (None, False)
    hx = lib.image_hex(img, 'swatch', 0.15) if img else None
    wearraw = ' '.join(g('Felhasználhatóság / Kopásállóság', 1))
    ac = re.search(r'AC\s?\d\s*/\s*(?:IP)?\s*\d{2}', wearraw)
    wear = re.sub(r'\s+', '', ac.group(0)).replace('/IP', '/') if ac else None
    pat = 'herringbone' if fl.herring(title, effect, crumb, u) else 'plank'
    notes = []
    if re.search(r'100\s*%\s*v[ií]z[aá]ll', tech, re.I):
        notes.append('100 % vízálló')
    elif t in ('SPC', 'vinyl'):
        notes.append('vízálló burkolat (vinyl/SPC)')
    for k in ('Illesztés módja', 'Felületi kialakítás', 'Alátét', 'Garancia'):
        if g(k, 1):
            notes.append(f'{k.lower()}: {g(k, 1)[0]}')
    if tech and 'Padlófűtés' in tech:
        notes.append('padlófűtésre alkalmas')
    if effect:
        notes.append('felületi hatás: ' + effect)
    if pack:
        notes.append(f'csomag {pack} m²')
    if g('Csomagolás', 1):
        notes.append('csomagolás: ' + g('Csomagolás', 1)[0])
    if hx and interior:
        notes.append('csak enteriőrfotó volt, a szín a képen látható padlóra becsült, kevésbé pontos')
    if not hx:
        notes.append('színkép nincs')
    if pat == 'plank' and sz['l'] / max(sz['w'], 1) < 2.0:
        pat = 'tile'
    dec = title.split(' ')[0] if re.match(r'^[A-Z0-9.-]*\d[A-Z0-9.-]*$', title.split(' ')[0]) else None
    coll = ''
    if 'Vissza' in toks:
        j = toks.index('Vissza')
        # morzsák: ... / kollekció / terméknév / típus
        parts = [x for x in toks[max(0, j - 8):j] if x != '/']
        coll = parts[-3] if len(parts) >= 3 else ''
    name = (coll + ' – ' + title) if coll and coll not in title and coll != title else title
    return fl.rec(id='parkettawebaruhaz-' + u.rstrip('/').split('/')[-1][:70], store=STORE, manufacturer=man, name=name,
                  decor=dec, type=t, pattern=pat, url=u, size=sz, hex=hx, price=pr, wear=wear, note='; '.join(notes))


def main():
    us = [u for u in lib.sitemap_urls(HOST + '/sitemap.xml') if '/termek/' in u]
    print('jelöltek', len(us), flush=True)
    items, skip, blocked = fl.crawl(us, parse, 'parkettawebaruhaz')
    items = fl.dedup(items)
    fl.save_floor(STORE, items,
             'Forrás: parkettawebaruhaz.hu sitemap, termékoldalak HTML (nincs LD). Kimaradt: szegélyléc, profil, falpanel, kiegészítő, '
             'ahol a lapméret nem adott. A kép 2–3 galériakép közül a dekor-/padlókép (kevés fal/fehér), ha csak enteriőr volt, a note jelzi. '
             'Az ár az első kiszerelés Ft/m² egységára.')


main()
