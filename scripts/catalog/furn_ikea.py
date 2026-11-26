# IKEA (ikea.com/hu) bútorgyűjtés: a termék-sitemap (prod-hu-HU_*.xml) URL-jeiből a névkulcsszavas előszűrés után a termékoldalak
# JSON-LD-jéből (név, ár, szín, kategória, kép) és a „Méretek” listából (pipf-measurements-tab) dolgozik.
import os, re, sys, time
sys.path.insert(0, os.path.dirname(__file__))
import lib, furn_common as C

KITCHEN = {'metod', 'maximera', 'faliszekreny', 'alsoszekreny', 'magasszekreny', 'konyha', 'mosogato', 'elszivo', 'mosdoallvany',
           'gardrob', 'pax', 'sueto', 'suetohoez'}
BAD = {'huzat', 'parnahuzat', 'kuelteri', 'kerti', 'gyerek', 'baba', 'gamer', 'teriti', 'terito', 'asztali', 'ora', 'lampa',
       'vilagitas', 'matrac'}


def candidate(u):
    t = u.split('/p/')[1].strip('/').split('-')
    s = set(t)
    if s & KITCHEN or s & BAD:
        return None
    t1 = t[1:5]
    if s & {'kanape', 'sarokkanape', 'kanapeagy', 'ulogarnitura', 'modularis'} or any(x.endswith('kanape') for x in t1):
        return 'sofa'
    if 'fotel' in t1:
        return 'armchair'
    if s & {'puff', 'labtarto', 'otoman'}:
        return 'ottoman'
    if 'dohanyzoasztal' in s:
        return 'coffeeTable'
    if 'tv' in t[:4] and (s & {'allvany', 'szekreny', 'butor', 'tarolo', 'elem', 'kombinacio', 'komb'}):
        return 'tvUnit'
    if s & {'talalo', 'talaloszekreny', 'komod'} or ('fiokos' in s and 'szekreny' in s):
        return 'sideboard'
    if 'konyvespolc' in s or ('polcos' in s and 'elem' in s) or 'polcrendszer' in s:
        return 'shelf'
    if 'szonyeg' in s:
        return 'rugLiving'
    if s & {'agykeret', 'boxspring'} or 'agy' in t1:
        return 'bed'
    if 'ejjeliszekreny' in s:
        return 'nightstand'
    if 'cipos' in s or 'cipotarolo' in s:
        return 'shoeCabinet'
    if 'terelvalaszto' in s:
        return 'divider'
    if 'iroasztal' in s and ('sarok' in s or 'l' in s):
        return 'deskCorner'
    if 'asztal' in t1 and 'es' not in s and 'szek' not in s:
        return 'diningTable'
    if 'szek' in t[1:3] and 'es' not in s and 'asztal' not in s:
        return 'chair'
    return None


ROW = re.compile(r'measurement-name">([^<]+)</span><span class="pipf-measurements-tab__measurement-value">([^<]+)</span>')


def small(i):
    j = i + '?f=s' if '?' not in i else i
    return j if lib.allowed(j) else i


def parse(h, url):
    ps = lib.ld_of_type(h, 'Product')
    if not ps:
        return None
    p = ps[0]
    name = p.get('name')
    if not name:
        return None
    off = p.get('offers') or {}
    if isinstance(off, list):
        off = off[0] if off else {}
    imgs = []
    for i in (p.get('image') or []):
        u = i.get('contentUrl') if isinstance(i, dict) else i
        if u:
            imgs.append(u)
    pe = [u for u in imgs if '_pe' in u]
    imgs = pe + [u for u in imgs if u not in pe]
    rows = {}
    for k, v in ROW.findall(h):
        rows.setdefault(k.strip(), v.strip())
    g = {}

    def m(k):
        return C.mm(rows[k]) if k in rows else None
    W, D, H = m('Szélesség'), m('Mélység'), m('Magasság')
    L = m('Hosszúság')
    cat_text = p.get('category') or ''
    ct = C.N(cat_text)
    if re.search(r'asztal', ct) or ('Átmérő' in rows and not W):
        # asztal: w = hosszúság (zárt hossz), d = szélesség
        if 'Átmérő' in rows:
            g['DIAM'] = m('Átmérő')
        else:
            g['W'], g['D'] = (L or W), (W if L else D)
        g['H'] = H
        for k, v in rows.items():
            if re.search(r'kihuz|bovit|nyitva|kinyit', C.N(k)) and C.mm(v):
                g['ext'] = max(g.get('ext', 0), C.mm(v))
    elif re.search(r'agy|bed', ct):
        g['W'], g['D'], g['H'] = (W or C.mm(p.get('width'))), (L or D or C.mm(p.get('depth'))), H
    elif re.search(r'szonyeg', ct):
        g['W'], g['D'] = (W or C.mm(p.get('width'))), (L or D or C.mm(p.get('depth')))
        g['pile'] = m('Szálmagasság') or m('Szál hossza')
        g['thick'] = m('Vastagság')
    else:
        g['W'] = W or C.mm(p.get('width'))
        g['D'] = D or C.mm(p.get('depth'))
        g['H'] = H or C.mm(p.get('height'))
    g['seatH'] = m('Ülésmagasság')
    g['sleepW'] = m('Fekvőfelület szélessége')
    g['sleepL'] = m('Fekvőfelület hosszúsága')
    g = {k: v for k, v in g.items() if v}
    ld_desc = p.get('description') or ''
    notes = []
    if re.search(r'Ülésmagasság', ' '.join(rows)):
        pass
    price = off.get('price')
    brand = (p.get('brand') or {}).get('name') or 'IKEA'
    return {'name': name, 'price': price, 'images': [small(i) for i in imgs[:3]],
            'color': p.get('color'), 'material': p.get('material') if p.get('material') not in ('Anyag', None) else None, 'brand': brand,
            'sku': p.get('mpn'), 'cat_text': cat_text, 'text': ld_desc[:300], 'dims': g, 'notes': notes,
            'white_first': bool(pe)}


def main():
    urls = []
    for i in range(1, 6):
        urls += [u for u in C.big_sitemap(f'https://www.ikea.com/sitemaps/prod-hu-HU_{i}.xml') if '/hu/hu/p/' in u]
    cands = [(u, candidate(u)) for u in urls]
    cands = [(u, c) for u, c in cands if c]
    # a kisebb kategóriák előre, hogy a hosszú futás korán adjon eredményt
    order = {'coffeeTable': 0, 'shoeCabinet': 0, 'nightstand': 0, 'divider': 0, 'ottoman': 1, 'armchair': 1, 'sideboard': 1,
             'tvUnit': 1, 'shelf': 2, 'rugLiving': 2, 'chair': 2, 'diningTable': 2, 'sofa': 3, 'bed': 3, 'deskCorner': 3}
    cands.sort(key=lambda x: order.get(x[1], 9))
    print(len(cands), 'jelölt', flush=True)
    note = ('IKEA (ikea.com/hu): a termék-sitemap URL-jei névkulcsszavas előszűréssel (kanapé, fotel, puff/lábtartó, dohányzóasztal, TV-állvány, '
            'komód/tálaló, könyvespolc/polcos elem, szőnyeg, ágykeret, éjjeliszekrény, cipősszekrény, térelválasztó, asztal, szék), majd a termékoldal '
            'JSON-LD kategóriája dönt. Méret: a „Méretek” lista (cm → mm); asztalnál w = hosszúság, d = szélesség; ágynál w/d = külső szélesség/hossz, '
            'a matracméret a névből; szőnyegnél w = hosszabb oldal. Szín: a fehér hátterű (pe) fő termékfotó mintavételezése. '
            'Szűrés: README táblázata + harsány szín kihagyva. A moduláris kanapé- és szekrényelemek külön oldalai közül csak a keretbe esők maradtak.')
    C.run('IKEA', cands, parse, note)


if __name__ == '__main__':
    main()
