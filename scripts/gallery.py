# Javaslatgaléria: a shot.mjs képeiből (screenshots/<id>_<nézet>.png) és a változatok mentéséből
# (screenshots/variants.json, a shot.mjs "dump" lépése) egy helyben megnyitható HTML oldal.
# Futtatás konténerben (Pillow kell): python scripts/gallery.py [--public]
#   alapból: screenshots/javaslatok.html + screenshots/javaslatok/*.jpg (helyi megnyitáshoz)
#   --public: public/galeria/index.html + public/galeria/kepek/*.jpg (a kirakott oldal része, visszalinkkel)
import html, json, os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, 'screenshots')
PUBLIC = '--public' in sys.argv
GDIR = os.path.join(ROOT, 'public', 'galeria') if PUBLIC else SHOTS
IMG_REL = 'kepek' if PUBLIC else 'javaslatok'
OUT = os.path.join(GDIR, IMG_REL)
HTML = os.path.join(GDIR, 'index.html' if PUBLIC else 'javaslatok.html')
VIEWS = [
    ('nappali_tv', 'Nappali – TV-fal'),
    ('nappali_ablak', 'Nappali – erkély felé'),
    ('nappali_dolgozo', 'Nappali – dolgozó felé'),
    ('halo_agy', 'Háló – ágyfal'),
    ('halo_ajto', 'Háló – ajtó és gardrób'),
]
# A képernyőkép 3D-s része (bal oldalsáv és alsó panel nélkül)
CROP = (330, 0, 1600, 770)

sys.path.insert(0, os.path.join(ROOT, 'scripts', 'gen'))
from numbering import FEATURED, key as jkey  # kiemelt javaslatok (aljavaslatokkal a programban)

state = json.load(open(os.path.join(SHOTS, 'variants.json'), encoding='utf-8'))['state']
variants = [v for v in state['variants'] if v['id'].startswith('j')]
plans = {p['id']: p for p in state.get('lightPlans', [])}
# bútor-színvilág a programból (shot.mjs „dumpEval”: window.__lakas.furnitureFit), ha van
fit_path = os.path.join(SHOTS, 'furniture_fit.json')
fits = json.load(open(fit_path, encoding='utf-8')) if os.path.exists(fit_path) else {}
# bútorjavaslat változatonként (shot.mjs „dumpEval”: window.__lakas.suggestFurniture), ha van
sets_path = os.path.join(SHOTS, 'furniture_sets.json')
furn_sets = {x['id']: x for x in json.load(open(sets_path, encoding='utf-8'))} if os.path.exists(sets_path) else {}
ROOM_NAME = {'nappali': 'Nappali', 'halo': 'Háló', 'dolgozo': 'Dolgozó', 'eloszoba': 'Előszoba', 'kozlekedo': 'Közlekedő'}
prod = {}
for name in ('paints', 'floors', 'doors', 'curtains', 'panels', 'lamps'):
    for it in json.load(open(os.path.join(ROOT, 'src/data/products', f'{name}.json'), encoding='utf-8'))['items']:
        prod[it['id']] = (name, it)

SLOT_LABEL = {'wall': 'Fal', 'ceiling': 'Mennyezet', 'floor': 'Padló', 'door': 'Ajtó', 'curtain': 'Függöny', 'sheer': 'Áttetsző réteg'}

def slot_label(k):
    if k.startswith('accent:'):
        room, _ = k[7:].split('.')
        return {'nappali': 'Kiemelés – nappali', 'halo': 'Kiemelés – háló', 'dolgozo': 'Kiemelés – dolgozó'}.get(room, k)
    return SLOT_LABEL.get(k, k)

def product_name(kind, p):
    if kind in ('paints', 'panels'):
        return f"{p['brand']} – {p['name']}" + (f" ({p['code']})" if p.get('code') and kind == 'panels' else '')
    if kind == 'floors':
        size = f", {p['size']['l']}×{p['size']['w']} mm" if p.get('size') else ''
        return f"{p['store']}: {p['manufacturer']} {p['name']}{size}"
    if kind == 'doors':
        return f"{p['store']}: {p['line']} – {p['name']}"
    return f"{p['store']}: {p['name']}, {p['colorName']}"

os.makedirs(OUT, exist_ok=True)
cards = []
for v in variants:
    imgs = []
    for key, label in VIEWS:
        src = os.path.join(SHOTS, f"{v['id']}_{key}.png")
        if not os.path.exists(src):
            continue
        dst = f"{v['id']}_{key}.jpg"
        Image.open(src).convert('RGB').crop(CROP).save(os.path.join(OUT, dst), quality=84)
        imgs.append((f'{IMG_REL}/{dst}', label))
    order = ['wall', 'ceiling'] + sorted(k for k in v.get('products', {}) if k.startswith('accent:')) + ['floor', 'door', 'curtain', 'sheer']
    rows = []
    for k in order:
        pid = v.get('products', {}).get(k)
        if not pid or pid not in prod:
            continue
        kind, p = prod[pid]
        price = html.escape(p.get('price', '')).split(' (')[0]
        rows.append(
            f'<li><span class="sw" style="background:{p["hex"]}"></span><b>{slot_label(k)}</b> '
            f'<a href="{html.escape(p.get("shopUrl") or p["url"])}" target="_blank" rel="noreferrer">{html.escape(product_name(kind, p))}</a>'
            f'{f" <small>{price}</small>" if price else ""}</li>'
        )
    # világítás: a javaslathoz illesztett terv lámpái, termékenként összevonva
    lamp_rows = []
    plan = plans.get(v.get('lightPlanId', ''))
    if plan:
        seen = {}
        for room_id, fixtures in plan['rooms'].items():
            for f in fixtures:
                if f.get('productId') in prod:
                    seen.setdefault(f['productId'], []).append(ROOM_NAME.get(room_id, room_id))
        for pid, rooms in seen.items():
            p = prod[pid][1]
            where = ', '.join(sorted(set(rooms), key=rooms.index))
            cnt = f' ×{len(rooms)}' if len(rooms) > 1 else ''
            lamp_rows.append(
                f'<li><b>{html.escape(where)}</b> <a href="{html.escape(p["url"])}" target="_blank" rel="noreferrer">{html.escape(p["store"])}: {html.escape(p["name"])}</a>{cnt}'
                f'{f" <small>{html.escape(p.get("price", "").split(" (")[0])}</small>" if p.get("price") else ""}</li>'
            )
    lamps_html = f'<h3>Világítás – {html.escape(plan["name"])}</h3><p class="pn">{html.escape(plan.get("note", ""))}</p><ul class="prods">{"".join(lamp_rows)}</ul>' if plan else ''
    fit = fits.get(v['id'])
    fit_html = ''
    if fit:
        def chips(items, vd):
            return ''.join(f'<span class="chip" title="{html.escape("; ".join(i["reasons"]))}"><i style="background:{i["hex"]}"></i>{html.escape(i["label"])}</span>' for i in items if i['verdict'] == vd)
        fit_rows = ''.join(
            f'<tr><th>{lbl}</th><td class="good">{chips(fit[k], "good")}</td><td>{chips(fit[k], "ok")}</td><td class="bad">{chips(fit[k], "bad")}</td></tr>'
            for k, lbl in (('sofa', 'Kanapé, kárpit'), ('wood', 'Bútortest'), ('metal', 'Fém'))
        )
        fit_html = (f'<h3>Bútorok színvilága</h3><p class="pn">Beszerezhetőség: <b>{fit["ease"]["level"]}</b> – {html.escape(fit["ease"]["text"])}</p>'
                    f'<table class="fit"><tr><th></th><th>✓ jól megy</th><th>≈ elmegy</th><th>✕ kerülendő</th></tr>{fit_rows}</table>')
    fs = furn_sets.get(v['id'])
    furn_html = ''
    if fs:
        frows = ''.join(
            f'<li><span class="sw" style="background:{l["hex"]}"></span><b>{html.escape(l["label"])}</b> '
            f'<a href="{html.escape(l["url"])}" target="_blank" rel="noreferrer">{html.escape(l["name"])}</a>'
            f'{f" <small>{html.escape(l["price"].split(" (")[0])}</small>" if l.get("price") else ""}'
            f' <small class="{"good" if l["verdict"] == "good" else ""}">{"✓" if l["verdict"] == "good" else "≈"} {html.escape(l["why"])}</small></li>'
            for l in fs['lines']
        )
        furn_html = (f'<h3>Bútorjavaslat</h3><p class="pn">A katalógusból a méretkeretbe férő, a változat színeihez legjobban illő termék termékhelyenként (heurisztika, nem döntés); '
                     f'a képeken az alapértelmezett lehetőségek látszanak (egyenes kanapé, alacsony TV-szekrény, kör asztal, új ágy). {html.escape(fs.get("note") or "")}</p><ul class="prods">{frows}</ul>')
    figs = ''.join(f'<figure><img src="{s}" loading="lazy" alt="{html.escape(l)}"><figcaption>{html.escape(l)}</figcaption></figure>' for s, l in imgs)
    cards.append(
        f'<section id="{v["id"]}"><h2>{html.escape(v["name"])}'
        + ('<span class="tag">Kiemelt – a programban 5 aljavaslattal (Javaslat fül)</span>' if jkey(v['id']) in FEATURED else '')
        + '</h2>'
        f'<p>{html.escape(v.get("note", ""))}</p><div class="shots">{figs}</div><ul class="prods">{"".join(rows)}</ul>{lamps_html}{furn_html}{fit_html}</section>'
    )

toc = ''.join(f'<a href="#{v["id"]}"{" class=hl" if jkey(v["id"]) in FEATURED else ""}>{html.escape(v["name"].split(" – ")[0])}</a>' for v in variants)
back = '<a href="../" class="back">← 3D program</a>' if PUBLIC else ''
page = f'''<!doctype html><html lang="hu"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Lakás – szín- és anyagjavaslatok</title>
<style>
body{{margin:0;font:15px/1.45 system-ui,sans-serif;background:#f4f1ec;color:#2b2622}}
header{{position:sticky;top:0;background:#f4f1ecf2;padding:10px 20px;border-bottom:1px solid #ddd5ca;z-index:1}}
header h1{{font-size:18px;margin:0 0 6px}} header nav a{{margin-right:10px;color:#7a5a3a;text-decoration:none;font-weight:600}}
header nav a.back{{color:#2b2622;margin-right:18px}} header nav a.hl{{background:#7a5a3a;color:#fff;padding:1px 6px;border-radius:4px}}
.tag{{display:inline-block;margin-left:10px;padding:2px 8px;border-radius:4px;background:#efe4d6;color:#7a5a3a;font-size:12.5px;font-weight:600;vertical-align:3px}}
main{{max-width:1500px;margin:0 auto;padding:0 20px 40px}}
section{{background:#fff;border-radius:10px;padding:16px 20px;margin:22px 0;box-shadow:0 1px 3px #0001}}
h2{{margin:0 0 4px;font-size:20px}} section>p{{margin:0 0 12px;color:#5b5249;max-width:1100px}}
.shots{{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:8px}}
figure{{margin:0}} figure img{{width:100%;display:block;border-radius:6px}} figcaption{{font-size:12px;color:#7d746a;margin-top:2px}}
.prods{{list-style:none;padding:0;margin:12px 0 0;columns:2 420px;font-size:13.5px}} .prods li{{margin:3px 0;break-inside:avoid}}
.prods a{{color:#2b2622}} .prods small{{color:#8a7f73}} .prods small.good{{color:#2e6b30}}
h3{{font-size:15px;margin:14px 0 2px}} .pn{{margin:0 0 6px;color:#5b5249;font-size:13.5px;max-width:1100px}}
table.fit{{border-collapse:collapse;font-size:13px}} table.fit th,table.fit td{{text-align:left;padding:3px 10px 3px 0;vertical-align:top}}
table.fit td.good{{color:#2e6b30}} table.fit td.bad{{color:#9a4a10}}
.chip{{display:inline-flex;align-items:center;gap:4px;margin:0 8px 2px 0;cursor:help}} .chip i{{width:12px;height:12px;border-radius:3px;border:1px solid #0002}}
.sw{{display:inline-block;width:14px;height:14px;border-radius:3px;border:1px solid #0002;vertical-align:-2px;margin-right:6px}}
footer{{color:#8a7f73;font-size:13px;max-width:1100px}}
</style>
<header><h1>Szín-, anyag- és bútorjavaslatok</h1><nav>{back}{toc}</nav></header>
<main>{"".join(cards)}
<footer><p>A bútorok befoglaló méretű, jelzésszerű modellek a választott termék méretével és színével (a szín a termékfotóból vagy a színnévből becsült). A képek a lakas-3d modellből készültek („Nappal – derült” fényjelenet, okt. 15. 13:00). A színek képernyős közelítések: a festékeknél a gyártói képernyőszín, a padló-, ajtó- és függönytermékeknél a termékfotóból vett átlagszín. A modell égboltfénye a vöröses barnákat és taupe-okat a képen kissé lilásabbnak mutatja; a termékek valódi színe a listában lévő színmintán látszik. Végső döntés előtt teszter, padló- és dekorminta kell, nappali és esti fényben.</p></footer>
</main></html>'''
open(HTML, 'w', encoding='utf-8', newline='\n').write(page)
print(len(variants), 'változat,', sum(len(c) for c in cards) // 1024, 'kB HTML')
