# Poli-Farbe beltéri falfesték színminták: a termékoldalak termekszin-picture képeiből (lib.image_hex swatch).
import re, sys, urllib.parse
sys.path.insert(0, 'scripts/catalog')
import lib

BASE = 'https://www.polifarbe.hu/'
PAGES = [
    ('poli-farbe-platinum-egyretegu-belteri-falfestek', 'Platinum (matt)', 'polifarbe-{c}', 'Platinum {c}'),
    ('poli-farbe-platinum-foltallo-belteri-latex-falfestek', 'Platinum Foltálló (latex)', 'polifarbe-foltallo-{c}', 'Platinum Foltálló {c}'),
    ('poli-farbe-platinum-decor-szines-belteri-falfestek', 'Platinum Decor', 'polifarbe-decor-{c}', None),
]
items = []
for slug, line, idf, namef in PAGES:
    url = BASE + 'termeklap/' + slug
    h = lib.fetch(url)
    for src, title in re.findall(r'<img src="([^"]+)" class="termekszin-picture" title="([^"]*)"', h):
        title = ' '.join(title.split())
        m = re.search(r'(\S+)$', title)
        if not m:
            print('kód nélkül', title); continue
        code = m.group(1)
        img = BASE + urllib.parse.quote(src, safe='/:')
        hx = lib.image_hex(img, mode='swatch', crop=0.15)
        if not hx:
            print('nincs hex', title); continue
        if namef:
            name = namef.format(c=code)
        else:  # Decor: "PLATINUM DECOR OLÍVA D60O" -> "Olíva"
            name = title.replace('PLATINUM DECOR', '').replace(code, '').strip().capitalize()
        items.append({'id': idf.format(c=code.lower()), 'brand': 'Poli-Farbe', 'line': line, 'name': name, 'code': code,
                      'hex': hx, 'hexSource': 'swatch-image', 'family': lib.paint_family(hx), 'url': url})
lib.save('paint', 'polifarbe', items, 'polifarbe.hu termékoldalak színminta-PNG-i (swatch, crop 0.15); a gyártó nem ad hexet. A név a színkód (a színnév az oldalon nem szerepel, kivéve Decor). Platinum, Platinum Foltálló és Platinum Decor beltéri falfestékek.')
