# JYSK (jysk.hu) bútorgyűjtés: a sitemap termék-URL-jeinek elérési útja adja a kategóriát; a termékoldal ProductGroup JSON-LD-je
# (az oldal saját változata: név, ár, képek) és a HTML specifikációs tábla („Méret összeszerelve”) adja a méretet.
import os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
import lib, furn_common as C

DIRS = [  # (útvonal-előtag, kategória, megjegyzés)
    ('nappali/kanapek/', 'sofa', None), ('nappali/kanapeagyak/', 'sofa', 'sleeper'), ('nappali/modularis-kanapek/', 'sofa', None),
    ('nappali/fotelek/', 'armchair', None), ('nappali/puffok/', 'ottoman', None),
    ('nappali/dohanyzoasztalok-es-kisasztalok/', 'coffeeTable', None), ('nappali/tv-allvanyok/', 'tvUnit', None),
    ('tarolas/komodok/', 'sideboard', None), ('etkezo/talaloszekrenyek/', 'sideboard', None),
    ('tarolas/polcok-es-terelvalasztok/', None, None), ('tarolas/cipotarolas/', 'shoeCabinet', None),
    ('haloszoba/agyak/agyalapok-agyracsok-agykeretek/agykeretek/', 'bed', None), ('haloszoba/agyak/kontinentalis-agyak/', 'bed', None),
    ('haloszoba/ejjeliszekrenyek/', 'nightstand', None), ('etkezo/etkezoasztalok/', 'diningTable', None),
    ('etkezo/etkezoszekek/', 'chair', None), ('lakberendezes/szonyegek/nagy-szonyegek/', 'rugLiving', None),
    ('lakberendezes/szonyegek/belteri-szonyegek-es-kulteri-szonyegek/', 'rugLiving', None),
    ('dolgozoszoba/iroasztalok/', None, None), ('dolgozoszoba/allithato-iroasztalok/', None, None),
]


def spec(h):
    rows = {}
    for k, v in re.findall(r'<tr[^>]*>\s*<th[^>]*>([^<]+)</th>\s*<td[^>]*>(.*?)</td>', h, re.S):
        rows.setdefault(k.strip(), re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', v)).strip())
    return rows


def parse_dims(s):
    out = {}
    for k, v, u in re.findall(r'([A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű ]+?):\s*([\d.,]+)\s*(cm|mm|m)?\b', s or ''):
        out[k.strip()] = C.mm(f'{v} {u or "cm"}')
    return out


def parse(h, url):
    grp = [d for d in lib.jsonld(h) if d.get('@type') == 'ProductGroup']
    path = url.split('jysk.hu/')[1]
    if not grp:
        pr = lib.ld_of_type(h, 'Product')
        if not pr:
            return None
        p0 = pr[0]
        o = p0.get('offers') or {}
        o = o[0] if isinstance(o, list) and o else o
        g0 = p0
        me = (p0, o if isinstance(o, dict) else {})
    else:
        g0 = grp[0]
        me = None
        for v in g0.get('hasVariant') or []:
            o = v.get('offers') or {}
            if isinstance(o, list):
                o = o[0] if o else {}
            if (o.get('url') or '').split('#')[0].rstrip('/') == url.rstrip('/'):
                me = (v, o)
                break
        if not me:
            vs = g0.get('hasVariant') or []
            if not vs:
                return None
            o = vs[0].get('offers') or {}
            me = (vs[0], o[0] if isinstance(o, list) else o)
    v, o = me
    rows = spec(h)
    dm = parse_dims(rows.get('Méret összeszerelve', ''))
    if not dm:
        dm = parse_dims(rows.get('Méret', ''))
    W, D, H, L = dm.get('Szélesség'), dm.get('Mélység'), dm.get('Magasság'), dm.get('Hosszúság')
    g = {}
    cat_dir = path.split('/')[0:2]
    is_table = 'asztal' in path.split('/')[1] or 'asztal' in path
    if 'Átmérő' in dm:
        g['DIAM'] = dm['Átmérő']
        g['H'] = H
    elif path.startswith(('etkezo/etkezoasztalok', 'nappali/dohanyzoasztalok', 'dolgozoszoba')):
        g['W'], g['D'], g['H'] = (L or W), (W if L else D), H
    elif path.startswith('haloszoba/agyak'):
        g['W'], g['D'], g['H'] = W, (L or D), H
    elif path.startswith('lakberendezes/szonyegek'):
        g['W'], g['D'] = W, L
        kp = rows.get('Kötegmagasság')
        if kp:
            g['pile'] = C.mm(kp, 'mm')
    else:
        g['W'], g['D'], g['H'] = W, D, H
    sh = C.mm(rows.get('Ülésmagasság'), 'cm') if rows.get('Ülésmagasság') else None
    if sh:
        g['seatH'] = sh
    # kihúzható asztal
    for k, val in rows.items():
        if re.search(r'kihuz|bovit|hosszabbit|nyitva', C.N(k)) and re.search(r'\d', val):
            pd = parse_dims(val)
            for kk, vv in pd.items():
                if vv and vv > g.get('W', 0) and 'Hossz' in kk:
                    g['ext'] = vv
    g = {k: x for k, x in g.items() if x}
    imgs = v.get('image') or []
    if isinstance(imgs, str):
        imgs = [imgs]
    imgs = [i.replace('wd3.medium', 'wd3.large') if False else i for i in imgs]
    name = v.get('name') or g0.get('name')
    price = o.get('price')
    if isinstance(price, str):
        price = C.num(price)
    desc = (v.get('description') or '')[:300]
    d = {'name': name, 'price': price, 'images': imgs[:3], 'color': rows.get('Szín'), 'material': None,
         'brand': (g0.get('brand') or {}).get('name') or 'JYSK', 'sku': v.get('sku'), 'text': desc + ' ' + rows.get('Típus', '') + ' ' + rows.get('Jó tudni', ''),
         'dims': g, 'notes': []}
    if rows.get('Alak') and 'kerek' in C.N(rows['Alak']):
        d['shape'] = 'round'
    elif rows.get('Alak') and 'oval' in C.N(rows['Alak']):
        d['shape'] = 'oval'
    return d


def main():
    us = lib.sitemap_urls('https://jysk.hu/sitemap.xml')
    cands = []
    for u in us:
        p = u.split('jysk.hu/')[1].split('?')[0].strip('/')
        for pre, cat, flag in DIRS:
            if p.startswith(pre) and p.count('/') == pre.count('/'):
                cands.append((u.split('?')[0], cat, flag))
                break
    print(len(cands), 'jelölt', flush=True)
    sleeper_urls = {u for u, c, f in cands if f == 'sleeper'}

    def wrapped(h, url):
        d = parse(h, url)
        if d and url in sleeper_urls:
            d['sleeper'] = True
        # a vegyes könyvtárak (None kategória): a név dönt
        return d
    cl = [(u, c) for u, c, f in cands]
    note = ('JYSK (jysk.hu): a sitemap termék-URL-jei a kategóriakönyvtár szerint (kanapék, kanapéágyak, moduláris kanapék, fotelek, puffok, '
            'dohányzó- és kisasztalok, TV-állványok, komódok, tálalószekrények, polcok/térelválasztók, cipőtárolás, ágykeretek, kontinentális ágyak, '
            'éjjeliszekrények, étkezőasztalok, étkezőszékek, szőnyegek, íróasztalok). Méret: a „Méret összeszerelve” (cm → mm); asztalnál w = hosszúság, '
            'ágynál w/d = külső szélesség/hossz (a matracméret a névből), szőnyegnél w = hosszabb oldal, pile = kötegmagasság. '
            'Ár/név/kép: az oldal saját JSON-LD változata; szín: a „Szín” spec, fotómintavétel az első fehér hátterű képből. A moduláris kanapék elemei '
            'külön oldalak (csak a keretbe esők). Színváltozat külön URL esetén külön rekord; az articlelookup-változatok URL-je nem külön oldal, azok kimaradtak.')
    C.run('JYSK', cl, wrapped, note)


if __name__ == '__main__':
    main()
