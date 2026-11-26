# obi.hu – laminált padlók, vinyl padlók, parketták (kategóriaoldalak LD ItemList + termékoldal th/td).
import re, json
import lib, fl

STORE = 'OBI'
HOST = 'https://www.obi.hu'
CATS = ['/laminalt-padlok-vinylpadlok-parkettak/laminalt-padlok/c/514',
        '/laminalt-padlok-vinylpadlok-parkettak/vinyl-padlok/c/1175',
        '/laminalt-padlok-vinylpadlok-parkettak/parkettak/c/596']
OKCAT = re.compile(r'^(Laminált padlók|Vinyl padlók|Parketták|Parketta|Vinil padlók)$', re.I)


def listing():
    found = {}
    for c in CATS:
        n = 1
        while True:
            url = HOST + c + ('' if n == 1 else f'?page={n}')
            h = lib.fetch(url)
            if not h:
                break
            il = lib.ld_of_type(h, 'ItemList')
            els = il[0].get('itemListElement', []) if il else []
            if not els:
                break
            total = il[0].get('numberOfItems') or 0
            new = 0
            for e in els:
                it = e.get('item', {})
                u = it.get('url')
                if not u:
                    continue
                if u.startswith('/'):
                    u = HOST + u
                if u not in found:
                    found[u] = it
                    new += 1
            print('lista', c, n, 'új', new, flush=True)
            if new == 0 or n * 80 >= total + 80:
                break
            n += 1
    return found


def pairs(h):
    d = {}
    for m in re.finditer(r'<th[^>]*scope="row"[^>]*>(.*?)</th>\s*<td[^>]*>(.*?)</td>', h, re.S):
        d[fl.txt(m.group(1)).rstrip(': ')] = fl.txt(m.group(2))
    return d


def gallery(h):
    og = re.search(r'og:image"\s+content="([^"]+)"', h)
    out = []
    seen = set()
    cut = h.find('Hasonló termék')
    body = h[:cut] if cut > 0 else h
    cands = ([og.group(1)] if og else []) + re.findall(r'https://bilder\.obi\.hu/[0-9a-f-]{36}/prZZ[A-Z]/[^"\' <>)\s,]+', body)
    for c in cands:
        m = re.search(r'bilder\.obi\.hu/([0-9a-f-]{36})/', c)
        if m and m.group(1) not in seen:
            seen.add(m.group(1))
            out.append(c)
    return out


def parse_factory(items):
    def parse(u, h):
        it = items.get(u, {})
        cat = it.get('category', '')
        if cat and not OKCAT.match(cat):
            return None
        name = it.get('name') or ''
        d = pairs(h)
        if not name:
            return None
        low = (name + ' ' + d.get('Terméktípus', '') + ' ' + d.get('Anyag', '')).lower()
        if re.search(r'szegély|alátét|profil|lépcső|minta|ragaszt|tisztít|lakk|olaj', low) and not re.search(r'padló|parketta', low):
            return None
        wet = d.get('Vízálló', '') + ' ' + d.get('Vizes helyiségben használható', '')
        wv, wr = d.get('Vízálló', ''), d.get('Vizes helyiségben használható', '')
        waterproof = (bool(wv) and not wv.lower().startswith('nem')) or (bool(wr) and not wr.lower().startswith('nem') and 'alkalmas' in wr.lower())
        if re.search(r'spc|vinil|vinyl', low) or cat.lower().startswith('vinyl'):
            t = 'SPC' if 'spc' in low else 'vinyl'
        elif re.search(r'lamin', low) or cat.lower().startswith('lamin'):
            t = 'vízálló laminált' if (waterproof or re.search(r'v[ií]z[aá]ll', name, re.I)) else 'laminált'
        elif re.search(r'parketta|massz|rétegű|fa', low):
            t = 'szalagparketta'
        else:
            return None
        w, l = fl.num(d.get('Szélesség')), fl.num(d.get('Mélység'))
        th = fl.num(d.get('Vastagság (mm)') or d.get('Vastagság'))
        sz = None
        if w and l:
            a, b = w * 10, l * 10
            sz = {'l': round(max(a, b)), 'w': round(min(a, b))}
        else:
            sz = fl.dims3(name) or None
            if sz:
                th = th or sz.get('t')
        if not sz:
            m3 = re.search(r'(\d{3,4})\s*(?:mm)?\s*x\s*(\d{2,4})\s*mm', name)
            if m3:
                a, b = float(m3.group(1)), float(m3.group(2))
                sz = {'l': round(max(a, b)), 'w': round(min(a, b))}
        if not sz or sz['l'] < 250:
            return None
        if th:
            sz['t'] = round(th, 1) if th % 1 else round(th)
        # ár: "Online shop ár" és "Áfával növelt ár" között a Ft / m² tokenek (utolsó = aktuális, első = lista, ha eltér)
        toks = fl.tokens(h)
        try:
            i0 = toks.index('Online shop ár')
            i1 = toks.index('Áfával növelt ár', i0)
        except ValueError:
            i0, i1 = 0, len(toks)
        ps = [m.group(1) for x in toks[i0:i1] for m in [re.match(r'^([\d ]+) Ft / m²$', x)] if m]
        cur = ps[-1].replace(' ', '') if ps else None
        lst = ps[0].replace(' ', '') if ps else None
        if not cur:
            return None
        imgs = gallery(h)
        img = imgs[0] if imgs else None
        interior = False
        # az OBI képe fehér hátterű padlómintakép (üres sávokkal): háttér nélküli átlag
        hx = lib.image_hex(img, 'object') if img else None
        ac = (d.get('Kopási osztály') or '').replace(' ', '')
        uc = re.sub(r'^\D*(\d+/)?', '', d.get('Használati osztály', ''))
        wear = (ac + '/' + uc) if ac and uc else (ac or None)
        notes = []
        if waterproof:
            notes.append('vízálló / nedves helyiségbe alkalmas')
        else:
            notes.append('nem vízálló' + (' (' + wr.lower() + ')' if wr else ''))
        if d.get('Lépéshang-szigetelés'):
            notes.append(d['Lépéshang-szigetelés'].lower() + ' (beépített alátét)' if 'szigeteléssel' in d['Lépéshang-szigetelés'].lower() else d['Lépéshang-szigetelés'].lower())
        if d.get('Lerakási mód'):
            notes.append('lerakás: ' + d['Lerakási mód'].lower())
        if d.get('Padlófűtéshez alkalmas'):
            notes.append('padlófűtés: ' + d['Padlófűtéshez alkalmas'].lower())
        if d.get('Dekor-utánzat'):
            notes.append('dekor: ' + d['Dekor-utánzat'].lower() + 'hatás')
        if d.get('Anyag'):
            notes.append('anyag: ' + d['Anyag'])
        pk = re.search(r'A csomag tartalma:\s*([\d,]+)\s*m', ' '.join(toks))
        if pk:
            notes.append(f'csomag {pk.group(1)} m²')
        if lst and lst != cur:
            notes.append(f'akciós ár, lista ár {lib.ft(lst)}/m²')
        if hx and interior:
            notes.append('csak enteriőrfotó volt, a szín becslés')
        if not hx:
            notes.append('színkép nincs')
        pat = 'herringbone' if fl.herring(name, d.get('Mintázat', '')) else 'plank'
        if pat == 'plank' and sz['l'] / max(sz['w'], 1) < 2.0:
            pat = 'tile'
        can = re.search(r'<link rel="canonical" href="([^"]+)"', h)
        if can:
            u = can.group(1)
        sku = it.get('sku') or u.rstrip('/').split('/')[-1]
        return fl.rec(id=f'obi-{sku}', store=STORE, manufacturer=(it.get('brand') if it.get('brand') not in (None, '', '-') else 'OBI (saját márka / nem jelölt)'), name=name, type=t, pattern=pat,
                      url=u, size=sz, hex=hx, price=lib.price(cur, STORE, '/m²'), wear=wear,
                      bevel=('élforma: ' + d['Élforma']) if d.get('Élforma') else None, note='; '.join(notes))
    return parse


def main():
    items = listing()
    print('jelöltek', len(items), flush=True)
    out, skip, blocked = fl.crawl(list(items), parse_factory(items), 'obi')
    out = fl.dedup(out)
    fl.save_floor(STORE, out,
             'Forrás: obi.hu kategóriaoldalak (laminált padlók, vinyl padlók, parketták; LD ItemList lapozva ?page=N), termékoldal th/td. '
             'Szűrés: csak a Laminált/Vinyl/Parketta kategória, szegélyléc/alátét/minta kimarad. Ár: az oldalon látható online ár Ft/m² '
             '(akciónál az akciós ár, a lista ár a note-ban). Méret: Szélesség × Mélység (cm), vastagság.')


main()
