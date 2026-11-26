# A gyűjtők kimenetének (/s/catalog/out/<kind>-<bolt>.json) ellenőrzése és beolvasztása a src/data/products/*.json-ba.
# Futtatás (a tároló gyökeréből):
#   MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W):/w" -v "<scratchpad>:/s" -w /w python:3.12-slim \
#     python -X utf8 scripts/catalog/merge.py [--write]
# --write nélkül csak összesít (mit venne fel, mit dobna el és miért).
#
# Szabályok: a meglévő (kézzel felvett) rekord marad, ha ugyanaz az URL; az azonosító ütközésnél -2, -3… utótagot kap;
# hibás rekord (hiányzó kötelező mező, rossz érték) kimarad, az ok a jelentésbe kerül.
import collections, glob, json, os, re, sys, urllib.parse

OUT = os.environ.get('CATALOG_OUT', '/s/catalog/out')
DATA = 'src/data/products'
WRITE = '--write' in sys.argv

FILES = {'paint': 'paints', 'floor': 'floors', 'tile': 'floors', 'door': 'doors', 'lamp': 'lamps', 'curtain': 'curtains',
         'panel': 'panels', 'furniture': 'furniture'}
HEX = re.compile(r'^#[0-9A-Fa-f]{6}$')
PAINT_FAM = {'warmWhite', 'greige', 'sand', 'ochre', 'terracotta', 'brown', 'green', 'blueGrey', 'deep', 'grey', 'vivid'}
FLOOR_TONE = {'light', 'natural', 'honey', 'grey', 'dark'}
DOOR_TONE = {'white', 'offwhite', 'light', 'natural', 'warm', 'dark', 'grey', 'black'}
LAMP_TYPE = {'pendant', 'ceiling', 'track', 'floor', 'wall', 'table'}
LAMP_SHAPE = {'dome', 'drum', 'globe', 'cone', 'disc', 'rail', 'bar', 'spot', 'arc', 'uplight', 'other'}
FURN_CAT = {'sofa', 'sofaChaise', 'ottoman', 'tvUnit', 'tvWall', 'nightstand', 'diningTable', 'chair', 'rugLiving', 'rugBedroom',
            'divider', 'bed', 'deskCorner', 'acousticPanel', 'coffeeTable', 'sideboard', 'shelf', 'armchair', 'shoeCabinet'}
SOURCES = {'official', 'swatch-image', 'third-party', 'photo-sample', 'color-name', 'site-photo'}


def nurl(u: str) -> str:
    p = urllib.parse.urlsplit((u or '').strip())
    return f'{p.netloc.lower().removeprefix("www.")}{p.path.rstrip("/")}'.lower()


def price_num(p) -> float:
    m = re.match(r'^([\d\s]+)\s*Ft', str(p or ''))
    return float(m.group(1).replace(' ', '')) if m else float('inf')


def reduce_by_decor(items: list[dict], store: str) -> list[dict]:
    """Termék × dekor rekordok (JOLA: 703 termékcsalád × 44 dekor) összevonása dekor + kialakítás szerint: egy rekord a
    legolcsóbb termékkel; a note felsorolja a termékcsaládokat. A dekor nélküli termékrekord csak akkor marad, ha a
    termékcsaládnak nincs dekoros rekordja."""
    with_decor = [x for x in items if x.get('decor')]
    lines = {x.get('line') for x in with_decor}
    groups: dict[tuple, list[dict]] = collections.defaultdict(list)
    for x in with_decor:
        groups[(x['decor'], x['style'])].append(x)
    out = []
    for (decor, style), xs in groups.items():
        xs.sort(key=lambda x: price_num(x.get('price')))
        rep = dict(xs[0])
        fams = sorted({x.get('line') for x in xs if x.get('line')})
        rep['id'] = f'door-{store}-{re.sub(r"[^a-z0-9]+", "-", (decor + "-" + style).lower()).strip("-")}'
        rep['name'] = f'{decor} ({ {"flat": "tele", "groove": "mart / intarziás", "glass": "üveges"}[style] })'
        rep['note'] = (f'{len(fams)} termékcsaládban kapható ebben a dekorban és kialakításban; a legolcsóbb: {xs[0].get("line")}. '
                       f'További családok: {", ".join(fams[:8])}{" …" if len(fams) > 8 else ""}. ' + str(xs[0].get('note') or '')).strip()
        out.append(rep)
    # dekor nélküli termékrekord: a termékfotó színe (festett MDF-nél tetszőleges mintaszín – a kékes/lilás kimarad)
    out += [x for x in items if not x.get('decor') and x.get('line') not in lines and not cool_tint(x.get('hex', ''))]
    return out


def cool_tint(h: str) -> bool:
    """Kékes / lilás, enyhén színezett minta (pl. festett MDF ajtó tetszőleges mintaszínnel)."""
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import lib
    if not HEX.match(h or ''):
        return False
    L, C, hue = lib.lch(h)
    return 185 <= hue <= 345 and C > 0.02


# forrásonkénti előfeldolgozás (a kimenet neve szerint)
REDUCE = {'door-jola': lambda xs: reduce_by_decor(xs, 'jola')}
# kizárt termékek (név szerint): tűzgátló, bejárati, biztonsági ajtó
EXCLUDE = {'door': re.compile(r'tűzgátló|bejárati|biztonsági|harmonika', re.I)}


def vtext(x: dict) -> str:
    return re.sub(r'\s+', ' ', ' '.join(str(x.get(k) or '') for k in ('decor', 'colorName', 'name')).lower()).strip()


def same_as_existing(old: list[dict], x: dict) -> bool:
    """Az azonos URL-ű meglévő rekordok egyike-e ez. Ha a meglévőnek dekorkódja van (pl. H1346), az dönt; különben a
    színnév; ha egyik sincs, az URL egyezése elég (régi, kézzel felvett, egyváltozatos rekord)."""
    t = vtext(x)
    for o in old:
        code = str(o.get('decor') or '').lower().strip()
        if code:
            if code in t:
                return True
            continue
        cn = str(o.get('colorName') or '').lower().strip()
        if not cn or cn in t or str(x.get('colorName') or '').lower().strip() in ('', cn):
            return True
    return False


def vkey(x: dict) -> str:
    """Termékazonosság: normalizált URL + dekor (vagy színnév, ill. név). Ugyanaz az oldal más dekorral más termék."""
    v = x.get('decor') or x.get('colorName') or x.get('name') or ''
    return f'{nurl(x.get("url", ""))}|{re.sub(r"\s+", " ", str(v).strip().lower())}'


def problems(kind: str, x: dict) -> list[str]:
    e = []
    need = {'paint': ['id', 'brand', 'name', 'hex', 'hexSource', 'family', 'url'],
            'panel': ['id', 'brand', 'name', 'hex', 'hexSource', 'family', 'url'],
            'floor': ['id', 'store', 'name', 'type', 'pattern', 'tone', 'hex', 'hexSource', 'url', 'checkedAt'],
            'tile': ['id', 'store', 'name', 'type', 'pattern', 'tone', 'hex', 'hexSource', 'url', 'checkedAt'],
            'door': ['id', 'store', 'name', 'style', 'tone', 'hex', 'hexSource', 'url', 'checkedAt'],
            'lamp': ['id', 'store', 'name', 'type', 'shape', 'color', 'size', 'emit', 'hexSource', 'url', 'checkedAt'],
            'curtain': ['id', 'store', 'name', 'colorName', 'type', 'hex', 'hexSource', 'url', 'checkedAt'],
            'furniture': ['id', 'category', 'store', 'name', 'size', 'hex', 'hexSource', 'url', 'checkedAt']}[kind]
    e += [f'hiányzik: {k}' for k in need if x.get(k) in (None, '', [])]
    h = x.get('color' if kind == 'lamp' else 'hex')
    if h and not HEX.match(h):
        e.append(f'rossz hex: {h}')
    if x.get('hexSource') and x['hexSource'] not in SOURCES:
        e.append(f'rossz hexSource: {x["hexSource"]}')
    if not str(x.get('url', '')).startswith('http'):
        e.append('rossz url')
    if kind in ('paint', 'panel') and x.get('family') not in PAINT_FAM:
        e.append(f'rossz family: {x.get("family")}')
    if kind == 'floor' and x.get('pattern') not in ('plank', 'herringbone'):
        e.append(f'rossz pattern: {x.get("pattern")}')
    if kind == 'tile' and x.get('pattern') != 'tile':
        e.append('a járólap pattern-je nem tile')
    if kind in ('floor', 'tile'):
        if x.get('tone') not in FLOOR_TONE:
            e.append(f'rossz tone: {x.get("tone")}')
        s = x.get('size')
        if s and not (isinstance(s.get('l'), (int, float)) and isinstance(s.get('w'), (int, float)) and 50 <= s['w'] <= s['l'] <= 3000):
            e.append(f'gyanús méret: {s}')
    if kind == 'door':
        if x.get('style') not in ('flat', 'groove', 'glass'):
            e.append(f'rossz style: {x.get("style")}')
        if x.get('tone') not in DOOR_TONE:
            e.append(f'rossz tone: {x.get("tone")}')
    if kind == 'lamp':
        if x.get('type') not in LAMP_TYPE:
            e.append(f'rossz type: {x.get("type")}')
        if x.get('shape') not in LAMP_SHAPE:
            e.append(f'rossz shape: {x.get("shape")}')
        if x.get('emit') not in ('down', 'diffuse', 'up', 'spot'):
            e.append(f'rossz emit: {x.get("emit")}')
        sk = x.get('socket')
        if sk and (sk.get('type') not in ('E27', 'E14', 'GU10', 'G9') or not isinstance(sk.get('count'), int)):
            e.append(f'rossz socket: {sk}')
    if kind == 'curtain' and x.get('type') not in ('blackout', 'dimout', 'sheer'):
        e.append(f'rossz type: {x.get("type")}')
    if kind == 'furniture':
        if x.get('category') not in FURN_CAT:
            e.append(f'rossz category: {x.get("category")}')
        s = x.get('size') or {}
        if not isinstance(s.get('w'), (int, float)):
            e.append('hiányzik: size.w')
        for k, v in s.items():
            if not isinstance(v, (int, float)) or v <= 0 or v > 6000:
                e.append(f'gyanús méret: {k}={v}')
    return e


def main():
    outs = sorted(p for p in glob.glob(os.path.join(OUT, '*.json')) if not p.endswith('.stats.json'))
    if not outs:
        print('nincs kimenet:', OUT)
        return
    targets: dict[str, dict] = {}
    for f in set(FILES.values()):
        targets[f] = json.load(open(f'{DATA}/{f}.json', encoding='utf-8'))
    ids = {f: {x['id'] for x in d['items']} for f, d in targets.items()}
    # azonosság: URL + dekor/szín/név – egy oldalon több dekor (pl. Ajtógyár Optima) vagy színváltozat is lehet
    urls = {f: {vkey(x) for x in d['items'] if x.get('url')} for f, d in targets.items()}
    by_url: dict[str, dict[str, list[dict]]] = {f: collections.defaultdict(list) for f in targets}
    for f, d in targets.items():
        for x in d['items']:
            if x.get('url'):
                by_url[f][nurl(x['url'])].append(x)
    report = collections.defaultdict(collections.Counter)
    reasons = collections.defaultdict(collections.Counter)
    added = collections.defaultdict(list)
    for path in outs:
        name = os.path.basename(path)[:-5]
        kind = name.split('-', 1)[0]
        if kind not in FILES:
            print('ismeretlen fajta, kimarad:', name)
            continue
        f = FILES[kind]
        d = json.load(open(path, encoding='utf-8'))
        if not isinstance(d.get('items'), list):
            print('nem rekordlista, kimarad:', name)
            continue
        items = REDUCE[name](d['items']) if name in REDUCE else d['items']
        for x in items:
            if kind in EXCLUDE and EXCLUDE[kind].search(str(x.get('name', ''))):
                report[name]['kizárt'] += 1
                continue
            if kind == 'lamp' and isinstance(x.get('size'), dict) and not x['size']:
                x['size'] = {}
            pr = problems(kind, x)
            if pr:
                report[name]['hibás'] += 1
                for p in pr:
                    reasons[name][p.split(':')[0]] += 1
                continue
            u = vkey(x)
            old = by_url[f].get(nurl(x['url']))
            if kind not in ('paint',) and (u in urls[f] or (old and same_as_existing(old, x))):
                # festéknél a gyártói színoldal azonos lehet (más kód), ott az azonosító dönt
                report[name]['már megvan (URL)'] += 1
                continue
            if x['id'] in ids[f]:
                if kind == 'paint':
                    report[name]['már megvan (azonosító)'] += 1
                    continue
                base, n = x['id'], 2
                while f'{base}-{n}' in ids[f]:
                    n += 1
                x['id'] = f'{base}-{n}'
            ids[f].add(x['id'])
            urls[f].add(u)
            added[f].append(x)
            report[name]['új'] += 1
    for name in sorted(report):
        r = report[name]
        print(f'{name:40} új {r["új"]:5}  megvolt {r["már megvan (URL)"] + r["már megvan (azonosító)"]:4}  hibás {r["hibás"]:4}', dict(reasons[name]) if reasons[name] else '')
    print('\nfájlonként:')
    for f, d in sorted(targets.items()):
        print(f'  {f:10} {len(d["items"]):5} → {len(d["items"]) + len(added[f]):5}  (+{len(added[f])})')
    if WRITE:
        for f, new in added.items():
            if not new:
                continue
            d = targets[f]
            d['items'].extend(new)
            d['meta']['checkedAt'] = max(x.get('checkedAt', '') for x in new) or d['meta'].get('checkedAt')
            stores = sorted({x.get('store') or x.get('brand') for x in new})
            d['meta']['note'] = (d['meta'].get('note', '') + f' Bővítés 2026-11-25 (gépi gyűjtés, scripts/catalog/): +{len(new)} tétel – '
                                 + ', '.join(stores) + '. A szín a termékfotó vagy a gyártói színadat; a méret és az ár a termékoldalról.').strip()
            json.dump(d, open(f'{DATA}/{f}.json', 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=2)
            open(f'{DATA}/{f}.json', 'a', encoding='utf-8', newline='\n').write('\n')
        print('beírva.')


if __name__ == '__main__':
    main()
