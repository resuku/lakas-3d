# Bútormirek (butormirek.hu) bútorgyűjtés: a sitemap termék-URL-jeinek könyvtára adja a kategóriát; a termékoldal JSON-LD Product
# mezői (width/height/depth + additionalProperty), ár, kép, szín.
import os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
import lib, furn_common as C

DIRMAP = {
    'sarok-uelogarniturak': 'sofa', 'kanapek': 'sofa', 'u-alaku-kanapek': 'sofaChaise', 'uelogarniturak': 'sofa',
    'fotelek-kanapekhoz-fules-fotelek': 'armchair', 'puffok': 'ottoman', 'dohanyzoasztalok': 'coffeeTable',
    'tv-asztalkak-tv-komodok': 'tvUnit', 'tolgyfa-tv-komodok': 'tvUnit', 'komodok': 'sideboard', 'komodok-nappaliba': 'sideboard',
    'talaloszekrenyek': 'sideboard', 'szekrenysorok': 'tvWall', 'tolgy-nappali-falak-es-osszeallitasok': 'tvWall',
    'fa-polcos-szekrenyek': 'shelf', 'ejjeliszekrenyek': 'nightstand', 'ciposszekrenyek': 'shoeCabinet',
    'etkezoasztalok': 'diningTable', 'etkezoszek': 'chair', 'tomorfa-agyak': 'bed', 'karpitozott-agyak': 'bed', 'boxspring-agyak': 'bed',
    'toemoerfa-franciaagyak': 'bed', 'gerenda-agyak': 'bed', 'szamitogep-asztalok': None, 'helsinki-kollekcio': None,
    'fa-butor': None, 'rosty': None, 'texas-kollekcio-haloszoba': None,
}


def props(p):
    out = {}
    for a in p.get('additionalProperty') or []:
        if isinstance(a, dict) and a.get('name'):
            out.setdefault(a['name'].strip(), str(a.get('value', '')).strip())
    return out


def qv(x):
    if isinstance(x, dict) and x.get('value') is not None:
        u = (x.get('unitCode') or 'CMT')
        return C.mm(f"{x['value']} {'mm' if u == 'MMT' else 'cm'}")
    return None


def two(s):
    m = re.search(r'(\d+[.,]?\d*)\s*[x×*]\s*(\d+[.,]?\d*)', s or '')
    return (C.num(m.group(1)), C.num(m.group(2))) if m else (None, None)


def parse(h, url):
    ps = lib.ld_of_type(h, 'Product')
    if not ps:
        return None
    p = ps[0]
    pr = props(p)
    name = p.get('name')
    if not name:
        return None
    W = C.mm(pr['Szélesség']) if pr.get('Szélesség') else qv(p.get('width'))
    D = C.mm(pr['Mélység']) if pr.get('Mélység') else qv(p.get('depth'))
    H = C.mm(pr['Magasság']) if pr.get('Magasság') else qv(p.get('height'))
    g = {}
    cat = p.get('category') or ''
    d_ = url.split('butormirek.hu/')[1].split('/')[0]
    hint = DIRMAP.get(d_)
    ctx = C.N(cat + ' ' + name)
    texts = [pr.get('Az asztallap mérete'), pr.get('Méret'), pr.get('Asztallap mérete')]
    a_b = next(((x, y) for x, y in (two(t) for t in texts) if x), (None, None))
    if hint == 'diningTable' or hint == 'coffeeTable':
        if re.search(r'kor alaku|kerek|atmero', C.N(pr.get('Forma', ''))) or pr.get('Átmérő'):
            dm = C.mm(pr.get('Átmérő')) if pr.get('Átmérő') else (round(a_b[0] * 10) if a_b[0] else None)
            if dm:
                g['DIAM'] = dm
        elif a_b[0]:
            g['W'], g['D'] = round(a_b[0] * 10), round(a_b[1] * 10)
        else:
            m = re.search(r'(\d{2,3})\s*[x×]\s*(\d{2,3})', name)
            if m:
                g['W'], g['D'] = int(m.group(1)) * 10, int(m.group(2)) * 10
            else:
                g['W'], g['D'] = W, D
        g['H'] = H
    elif hint == 'bed':
        g['W'], g['D'], g['H'] = W, D, H
        a, b = two(pr.get('Méret', '')) if pr.get('Méret') else two(name)
        if a and b:
            g['sleepW'], g['sleepL'] = round(a * 10), round(b * 10)
    elif hint == 'sofaChaise' or (hint == 'sofa' and re.search(r'sarok', C.N(pr.get('Fotel típusa', '') + name))):
        g['W'], g['D'], g['H'] = W, D, H
    else:
        g['W'], g['D'], g['H'] = W, D, H
        if not W and a_b[0]:
            g['W'], g['D'] = round(a_b[0] * 10), round(a_b[1] * 10)
    g = {k: v for k, v in g.items() if v}
    imgs = p.get('image') or []
    imgs = [imgs] if isinstance(imgs, str) else [i if isinstance(i, str) else (i.get('url') or i.get('contentUrl')) for i in imgs]
    off = p.get('offers') or {}
    off = off[0] if isinstance(off, list) and off else off
    d = {'name': name, 'price': (off or {}).get('price'), 'images': imgs[:3], 'color': (p.get('color') or '').split(',')[0].strip() or None,
         'material': p.get('material'), 'brand': (p.get('brand') or {}).get('name'), 'sku': p.get('mpn') or p.get('sku'),
         'text': ' '.join(filter(None, [pr.get('Termék típusa'), pr.get('Fotel típusa')])), 'type_text': ' '.join(filter(None, [pr.get('Fotel típusa'), pr.get('Termék típusa')])),
         'dims': g, 'notes': []}
    if hint:
        d['_hint'] = hint
    sl = pr.get('Kinyitható – alvófunkció') or pr.get('Kinyitható')
    if sl is not None:
        d['sleeper'] = bool(re.match(r'alvofunkcioval|igen|kinyithato', C.N(sl)))
    st = pr.get('Tárolóhely')
    if st is not None:
        d['storage'] = C.N(st).startswith('taroloh') and 'nelkul' not in C.N(st)
    fm = C.N(pr.get('Forma', ''))
    if 'ovalis' in fm:
        d['shape'] = 'oval'
    return d


def main():
    x = lib.fetch('https://www.butormirek.hu/1_index_sitemap.xml')
    sm = [C.cdata(u) for u in re.findall(r'<loc>(.*?)</loc>', x)]
    urls = []
    for s in sm:
        if 'sitemap' in s:
            urls += [C.cdata(u) for u in re.findall(r'<loc>(.*?)</loc>', lib.fetch(s) or '')]
    cands = []
    for u in urls:
        if not u.endswith('.html'):
            continue
        d = u.split('butormirek.hu/')[1].split('/')[0]
        if d in DIRMAP:
            cands.append((u, DIRMAP[d]))
    print(len(cands), 'jelölt', flush=True)
    note = ('Bútormirek (butormirek.hu): a sitemap termék-URL-jei a kategóriakönyvtár szerint (ülőgarnitúrák, kanapék, fotelek, puffok, dohányzóasztalok, '
            'TV-komódok, komódok, tálalók, szekrénysorok/nappali falak, éjjeliszekrények, cipősszekrények, étkezőasztalok, étkezőszékek, ágyak). '
            'Méret: JSON-LD width/height/depth + additionalProperty (cm → mm); asztalnál az „asztallap mérete”, ágynál a külső méret + a matracméret '
            'a „Méret” mezőből / névből. Ár, szín, kép: JSON-LD. Szín: az első fehér hátterű fotó mintavétele. A termékcímek részben gépi fordítás; '
            'a sarokkanapék depth mezője gyakran hiányzik (ilyenkor csak a szélesség szerepel).')
    C.run('Bútormirek', cands, parse, note)


if __name__ == '__main__':
    main()
