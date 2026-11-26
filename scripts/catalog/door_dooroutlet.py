# Dooroutlet (dooroutlet.hu) beltéri ajtók: család × színváltozat. Az oldal ISO-8859-2 kódolású.
import re, html, sys
sys.path.insert(0, 'scripts/catalog')
import lib
from door_common import style_from, tone_stats

STORE = 'Dooroutlet'
BASE = 'https://dooroutlet.hu'


def get(u):
    b = lib.fetch(u, binary=True)
    return b.decode('iso-8859-2', 'replace') if b else None


idx = get(BASE + '/ajtok')
fams = {}
for u, i in re.findall(r'href="(https://dooroutlet\.hu/webshop/termekek/(?:ajtok|belteri-ajto)/[^"/]+/(\d+))"', idx):
    fams.setdefault(i, u)
idx_body = html.unescape(re.sub(r'<[^>]+>', '\n', idx))
print('csaladok', len(fams), list(fams.values()), flush=True)

SKIP = re.compile(r'tol[oó]ajt[oó]|toloajto|diva', re.I)
items, skipped = [], []
for fid, u in fams.items():
    h = get(u)
    if not h:
        continue
    t = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', h, flags=re.S)
    body = html.unescape(re.sub(r'\s*\n\s*', '\n', re.sub(r'<[^>]+>', '\n', t))).strip()
    m = re.search(r'<h1[^>]*>(.*?)</h1>', t, re.S)
    title = html.unescape(re.sub(r'<[^>]+>', '', m.group(1))).strip() if m else body.split('\n')[0].strip()
    if SKIP.search(u) or SKIP.search(title or ''):
        skipped.append((title, u))
        continue
    desc = ''
    mm = re.search(re.escape(title) + r'\n([^\n]+)\n', body, re.I)
    if mm:
        desc = mm.group(1)
    pr = re.search(r'(\d{2,3}\.\d{3})\s*\n?,?-?\s*\n?Ft\s*\n?-?tól', body)
    prices = re.findall(r'model\s*\d+\s*([\d\.]+),-\s*Ft', body)
    price_from = None
    if pr:
        price_from = int(pr.group(1).replace('.', ''))
    elif prices:
        price_from = min(int(p.replace('.', '')) for p in prices)
    tech = ''
    mt = re.search(r'MŰSZAKI TARTALOM\n(.*?)\n(?:ÜVEGEZÉS|AJTÓ TOK)', body, re.S)
    if mt:
        tech = mt.group(1).replace('\n', '; ')
    mtok = re.search(r'AJTÓ TOK\n(.*?)\n[A-ZÁÉÍÓÖŐÚÜŰ ]{6,}\n', body, re.S)
    toktxt = mtok.group(1).replace('\n', '; ')[:200] if mtok else ''
    mixed = re.search(r'tele és üveg|tele és üvegezett', (desc + ' ' + tech).lower())
    sty = 'flat' if mixed else style_from(title + ' ' + desc)
    sty = {'demeter': 'glass', 'tosca': 'glass', 'discovery': 'groove', 'linea premium': 'groove', 'kofano': 'groove'}.get(title.lower(), sty)
    if fid == '18':
        price_from = 74900
    colors = []
    for src, nm in re.findall(r'<img src="(https://dooroutlet\.hu/files/fotoalbum3/szinek/[^"]+)" title="([^"]*)"', h):
        nm = html.unescape(nm).strip()
        if (nm, src) not in colors:
            colors.append((nm, src))
    print(title, price_from, len(colors), sty, flush=True)
    for nm, src in colors:
        hx = lib.image_hex(src, mode='swatch', crop=0.15)
        if not hx:
            continue
        low = nm.lower()
        surf = ('Prémium 3D dekorfólia' if low.startswith('3d') else 'CPL' if low.startswith('cpl')
                else 'Iridium laminált (IR)' if low.startswith('ir') else 'dekorfólia / festett')
        price = None
        if price_from:
            price = f'{lib.ft(price_from)}-tól – családi induló ár (modellfüggő): ajtólap + tok, kilincs nélkül (Dooroutlet, {lib.TODAY})'
        note = (desc + (' Műszaki tartalom: ' + tech if tech else '')).strip()[:600]
        if toktxt:
            note += ' Tok: ' + toktxt
        items.append({
            'id': f'door-dooroutlet-{lib.slug(title)}-{lib.slug(nm)}', 'store': STORE, 'manufacturer': 'DoorOutlet (Arcadia 98 Kft.)',
            'line': title, 'name': f'{title} – {nm}', 'decor': nm, 'style': sty, 'surface': surf,
            'tone': lib.door_tone(hx), 'hex': hx, 'hexSource': 'swatch-image',
            'price': price, 'url': u, 'checkedAt': lib.TODAY, 'note': note,
        })
print('mind', len(items), 'kihagyva', skipped)
lib.save('door', STORE, items,
         'Dooroutlet.hu családoldalak (webshop/termekek/ajtok és belteri-ajto), ISO-8859-2; család × színváltozat (minden szín, nincs szűrés), '
         'a szín a színminta-képből (swatch-image, szélvágás 15 %). Tolóajtó-rendszerek (Díva, Tolóajtó) kihagyva. Az ár a család „-tól” ára '
         '(modellfüggő, nem színfüggő). A stílus a családleírásból becsült (modellenként eltérhet: a családok tele és üveges modelleket is tartalmaznak).')
print(tone_stats(items))
