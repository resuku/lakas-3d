# Dulux színek: dulux.hu/hu/szinpaletta SSR JSON (akzo-color-wall -> colorGroups[].colors[]).
import json, re, sys
sys.path.insert(0, 'scripts/catalog')
import lib

URL = 'https://www.dulux.hu/hu/szinpaletta'
html = lib.fetch(URL)
ms = re.findall(r'<script[^>]*data-stencil-ssr-props-map[^>]*>(.*?)</script>', html, re.S)
data = [json.loads(x) for x in ms]
items, seen = [], set()
def walk(o):
    if isinstance(o, dict):
        if o.get('tagName') == 'akzo-color-wall':
            yield o
        for v in o.values():
            yield from walk(v)
    elif isinstance(o, list):
        for v in o:
            yield from walk(v)
for w in walk(data):
    for g in w['props'].get('colorGroups', []):
        for c in g.get('colors', []):
            hx = c.get('hex', '').upper()
            if not re.fullmatch(r'#[0-9A-F]{6}', hx):
                continue
            name = (c.get('name') or '').strip()
            href = c.get('href') or ''
            url = href if href.startswith('http') else 'https://www.dulux.hu' + href
            ccid = str(c.get('colorCollectionColorId') or '')
            if not ccid:
                mm = re.search(r'-(\d+)$', href)
                ccid = mm.group(1) if mm else ''
            is_code = bool(re.fullmatch(r'\d+[A-Z]{2} \d+/\d+', name))
            pid = 'dulux-' + (lib.slug(name) if is_code else ccid)
            if pid in seen:
                continue
            seen.add(pid)
            items.append({
                'id': pid, 'brand': 'Dulux', 'line': 'Dulux színpaletta (színkeverés)',
                'name': 'kevert szín' if is_code else name,
                'code': name if is_code else f'ccid {ccid}',
                'hex': hx, 'hexSource': 'official', 'family': lib.paint_family(hx), 'url': url,
            })
lib.save('paint', 'dulux', items, 'dulux.hu/hu/szinpaletta SSR JSON (akzo-color-wall colorGroups); gyártói képernyőszín. Csak az első fül ~384 színe; a teljes 3353 színoldalas lista nem lett letöltve (oldalanként ~500 kB). Az azonosító kódnevű színeknél dulux-<kód slug>, egyébként dulux-<ccid>.')
