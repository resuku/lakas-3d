# JOLA (belteriajtobirodalom.hu) beltéri ajtók. Előfeltétel: door_jola_fetch.py (→ /s/catalog/jola_parsed.json).
# Rekordok: termék (a termékfotó színe, LD ár) + termék × kiemelt dekor (fekete/antracit/grafit/sötét/meleg semleges; a dekor-minta képéből).
import json, re, sys
sys.path.insert(0, 'scripts/catalog')
import lib
from door_common import priority, style_from, tone_stats

STORE = 'JOLA'
data = json.load(open('/s/catalog/jola_parsed.json', encoding='utf-8'))
swatch = {}


def sw(url):
    if url not in swatch:
        swatch[url] = lib.image_hex(url, mode='swatch', crop=0.15)
    return swatch[url]


items, skipped = [], []
for p in data:
    name = p['name'] or ''
    if re.search(r'bejárati|biztonsági|harmonika', name, re.I) or not p['image'] or not p['price']:
        skipped.append(name); continue
    slug = p['url'].rstrip('/').split('/')[-1]
    low = name.lower()
    sty = 'glass' if 'üveges' in low else ('groove' if re.search(r'mart|hornyolt|intarzi|csíkos|vízszintes|lamell', low) else style_from(''))
    surf = p['felulet'] or 'nincs megadva'
    tolo = p['tolo'] or ''
    incl = 'ajtólap + átfogó tok, zárbetéttel; kilincs és küszöb nélkül'
    price = f'{lib.ft(p["price"])}-tól – {incl} (irányár, JOLA/belteriajtobirodalom.hu, {lib.TODAY})'
    note = f'{p["meretrend"] or ""}. Tok: átfogó (UTH) {p["tok"] or "n/a"}; gerébtok: lásd oldal. Kilincs: {p["kilincs"] or "n/a"}. Falvastagság: {p["falvast"] or "n/a"}. Tolóajtó: {tolo or "n/a"}'
    if re.search(r'toló', name, re.I):
        note += ' (tolóajtó-lap is lehet)'
    note = note.strip()[:500]
    hx = lib.image_hex(p['image'], mode='object')
    base = {'store': STORE, 'manufacturer': 'JOLA', 'line': name, 'style': sty, 'surface': surf, 'price': price, 'url': p['url'], 'checkedAt': lib.TODAY}
    if hx and not lib.loud(hx):
        items.append({**base, 'id': f'door-jola-{slug}', 'name': name, 'tone': lib.door_tone(hx), 'hex': hx, 'hexSource': 'photo-sample',
                      'note': note + f' A szín a termékfotó (alap dekor) átlaga; {len(p["decors"])} dekor választható.'})
    for nm, img in p['decors']:
        h2 = sw(img)
        if not h2 or not priority(nm, h2):
            continue
        items.append({**base, 'id': f'door-jola-{slug}-{lib.slug(nm)}', 'name': f'{name} – {nm}', 'decor': nm, 'tone': lib.door_tone(h2), 'hex': h2,
                      'hexSource': 'swatch-image', 'note': note + ' Kiemelt (sötét / meleg semleges) dekor; a modell képe nem ebben a dekorban látszik.'})
print(len(items), 'kihagyva', len(skipped), tone_stats(items))
lib.save('door', STORE, items,
         'JOLA / belteriajtobirodalom.hu (738 termékoldal, LD Product + HTML): termék-rekord a termékfotó színével + termék × kiemelt dekor rekord (fekete, antracit, grafit, sötét dió/tölgy, meleg semleges; a dekor-minta képéből). '
         'Az ár a termék „-tól” irányára (átfogó tokkal, zárbetéttel, kilincs és küszöb nélkül), nem dekorfüggő. Tolóajtó-lap külön jelölve a note-ban, ahol a név jelzi. A stílus a névből becsült (üveges → glass; mart/intarziás/csíkos → groove, egyébként flat); '
         '15 termék dekorlista nélkül (csak termék-rekord). Bejárati/biztonsági/harmonika kihagyva.')
