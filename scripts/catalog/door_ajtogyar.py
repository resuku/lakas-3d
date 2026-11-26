# Ajtógyár (ajtogyar.hu) beltéri ajtócsaládok. Előfeltétel: door_ajtogyar_fetch.py (→ /s/catalog/ajtogyar_pages.json).
# Rekordok: család (termékfotó színe) + dekoronként: a Pascal Optima minden dekora, a többi családnál a kiemelt dekorok.
import json, re, sys
sys.path.insert(0, 'scripts/catalog')
import lib
from door_common import priority, tone_stats

STORE = 'Ajtógyár'
pages = json.load(open('/s/catalog/ajtogyar_pages.json', encoding='utf-8'))

NOISE = {'3D', 'ÚJ', '!', 'OPTIMA', 'CPL', '', 'Új', 'Újdonság!'}
BADIMG = re.compile(r'Egyedi-jel|szinskala|paletta|logo|gomb|ikon|bf26|akcio|uvegtipus|katalog', re.I)
STOP = re.compile(r'^(Műszaki tartalom|Szabvány méretek?|Szabvány és egyedi méretek|Egyedi méretek?|Üvegkivágások.*|Műszaki specifikáció|Ajánlatkérés)$')
SECT = re.compile(r'^(Felületek|.{0,30}\s+felületek)$', re.I)


def clean(b):
    out = []
    for l in b.replace('https://ajtogyar.hu/wp-content/uploads/', 'U/').split('\n'):
        l = l.strip()
        m = re.match(r'^\[A [^\]]*\]\s*(.*)$', l)
        if m:
            if m.group(1):
                out.append(('A', m.group(1)))
            continue
        out.append(('T', l))
    return out


def parse(b):
    L = clean(b)
    i0 = 0
    for i, (k, l) in enumerate(L):
        if k == 'A' and l == 'Ajtócsaládok':
            i0 = i
    title, mainimg = None, None
    for k, l in L[i0 + 1:]:
        if k == 'T' and l and l not in ('|', 'Ajtócsaládok') and not l.startswith('[IMG') and title is None:
            title = l
        m = re.match(r'^\[IMG (U/[^\]]*)\]$', l)
        if m and title and not mainimg and not BADIMG.search(m.group(1)):
            mainimg = 'https://ajtogyar.hu/wp-content/uploads/' + m.group(1)[2:]
            break
    start = None
    for i in range(i0, len(L)):
        if L[i][0] == 'T' and SECT.match(L[i][1]):
            start = i
            break
    decors = []
    if start is not None:
        cur = None
        for k, l in L[start + 1:]:
            if k == 'T' and STOP.match(l):
                break
            m = re.match(r'^\[IMG ([^\]]*)\]$', l) if k == 'T' else None
            if m:
                if cur and cur['lines']:
                    decors.append(cur)
                cur = {'img': 'https://ajtogyar.hu/wp-content/uploads/' + m.group(1)[2:], 'lines': []} if not BADIMG.search(m.group(1)) else None
            elif cur is not None and l not in NOISE:
                if len(l) > 45 or re.search(r'felületek|Üvegtípusok|Egyedi méret|Raktári|Cpl extra', l):
                    cur['lines'].append('|END');
                if '|END' not in cur['lines']:
                    cur['lines'].append(l)
        if cur and cur['lines']:
            decors.append(cur)
    for d in decors:
        d['lines'] = [x for x in d['lines'] if x != '|END'][:4]
    return title, mainimg, decors


def decor_name(lines):
    parts = [x for x in lines if x and x not in NOISE]
    name = parts[0]
    name = re.sub(r'\s*\|.*$', '', name).strip()
    # "Fehér 048" → név + kód; "640 Grafit" → kód + név
    m = re.match(r'^(\d{3}|0[A-Z]\d)\s+(.*)$', name)
    code = None
    if m:
        code, name = m.group(1), m.group(2)
    else:
        m = re.match(r'^(.*?)\s+(\d{3})$', name)
        if m:
            name, code = m.group(1), m.group(2)
    if code is None:
        for x in parts[1:]:
            if re.search(r'\b[A-Z]{0,2}\d{2,5}\b', x) and len(x) < 30 and 'Egger' not in x[:0]:
                code = re.sub(r'^[/\s]*', '', x).strip(' /|')
                break
    return name.strip(), code


def family_style(slug, title):
    s = slug + ' ' + (title or '').lower()
    if re.search(r'vetrite|uvegajt|üveg-ajt', s) and 'tele-es' not in s:
        return 'glass'
    if re.search(r'intarzias|diszcsikos|ratetleces', s):
        return 'groove'
    return 'flat'


items = []
skipped = []
for u, b in pages.items():
    slug = u.rstrip('/').split('/')[-1]
    if re.search(r'toloajto', slug):
        skipped.append(slug)
        continue
    title, mainimg, decors = parse(b)
    title = re.sub(r'\s+', ' ', title or slug).replace(' ajtócsalád', '').strip()
    manuf = 'Pascal' if slug.startswith('pascal') else 'Jan' if slug.startswith('jan') else 'Pol-Skone' if slug.startswith('pol-skone') else 'Full Doors' if slug.startswith('full') else 'Ajtógyár'
    sty = family_style(slug, title)
    pm = re.search(r'(\d{2,3}\.\d{3}) Ft', b)
    pr = int(pm.group(1).replace('.', '')) if pm else None
    price = (f'{lib.ft(pr)}-tól – ajtólap + átfogó tok (tájékoztató bruttó „-tól” ár; kilincs nélkül) (Ajtógyár, {lib.TODAY})') if pr else None
    note_base = f'{title}: az Ajtógyár családoldala; méret egyedi/szabvány (az oldalon: 75/90/100 × 210 cm vagy egyedi), a modellek (tele, díszcsíkos, üveges) a család oldalán.'
    if mainimg:
        hx = lib.image_hex(mainimg, mode='object')
        if hx:
            items.append({'id': f'door-ajtogyar-{lib.slug(slug.replace("-belteri-ajtok", "").replace("-belteri-ajto", ""))}',
                          'store': STORE, 'manufacturer': manuf, 'line': title, 'name': title, 'style': sty,
                          'surface': 'CPL / dekorfólia / festett (családonként)', 'tone': lib.door_tone(hx), 'hex': hx,
                          'hexSource': 'photo-sample', 'price': price, 'url': u, 'checkedAt': lib.TODAY,
                          'note': note_base + ' A szín a család termékfotójáról (alapkép), a dekorok külön rekordok.'})
    seen = set()
    for d in decors:
        nm, code = decor_name(d['lines'])
        if re.search(r'színskála|paletta', nm, re.I):
            continue
        hx = lib.image_hex(d['img'], mode='swatch', crop=0.15)
        if not hx:
            continue
        key = (nm, code)
        if key in seen:
            continue
        seen.add(key)
        is_opt = slug.startswith('pascal-optima')
        if not (is_opt or priority(nm, hx)):
            continue
        surf = 'CPL (Egger)' if is_opt else 'RAL/NCS festett' if re.search(r'RAL|NCS', ' '.join(d['lines'])) else 'furnér' if 'furner' in d['img'].lower() else 'dekor / CPL'
        items.append({'id': f'door-ajtogyar-{lib.slug(slug.replace("-belteri-ajtok", "").replace("-belteri-ajto", ""))}-{lib.slug(nm + " " + (code or ""))}',
                      'store': STORE, 'manufacturer': manuf, 'line': title, 'name': f'{title} – {nm}', 'decor': (f'{nm} {code}'.strip()),
                      'style': sty, 'surface': surf, 'tone': lib.door_tone(hx), 'hex': hx, 'hexSource': 'swatch-image',
                      'price': price, 'url': u, 'checkedAt': lib.TODAY,
                      'note': note_base + ('' if is_opt else ' Kiemelt (sötét / meleg semleges) dekor a család felületlistájából.')})
print('kihagyva', skipped)
lib.save('door', STORE, items,
         'Ajtógyár családoldalak (sitemap: /termekek/ajtocsaladok/*), HTML. Család-rekord a termékfotó színével + dekoronkénti rekord: a Pascal Optima összes dekora, '
         'a többi családnál csak a fekete/antracit/grafit/sötét dió-tölgy és meleg semleges dekorok (swatch-image). A tolóajtó-családok kihagyva. '
         'Az ár a családoldali induló bruttó „-tól” ár (átfogó tokkal), nem dekor- és modellfüggő; sok Jan/Pol-Skone oldalon nincs ár. A stílus a család nevéből becsült.')
print(len(items), tone_stats(items))
