# PPG Trilak színek: sitemap -> színoldalak (SSR HTML: rgb-value hex, név, PPG-kód, gyűjtemény).
# Az oldalak ~560 kB-osak, ezért nem a lib-gyorsítótárba mennek (cache=False); a feldolgozott sorok a PROGRESS fájlban,
# így megszakadás után folytatható.
import html as H, json, os, re, sys, urllib.parse
sys.path.insert(0, 'scripts/catalog')
import lib

PROGRESS = '/s/catalog/trilak_progress.jsonl'
urls = [u for u in lib.sitemap_urls('https://trilak.ppg.com/sitemap-index.xml') if '/hu-HU/szin/' in u]
urls = list(dict.fromkeys(urls))
print(len(urls), 'színoldal', flush=True)
done = {}
if os.path.exists(PROGRESS):
    for l in open(PROGRESS, encoding='utf-8'):
        r = json.loads(l)
        if not r.get('err'):  # hibás sorokat újrapróbáljuk
            done[r['url']] = r
f = open(PROGRESS, 'a', encoding='utf-8')
for i, u in enumerate(urls):
    if u in done:
        continue
    try:
        h = lib.fetch(urllib.parse.quote(u, safe=":/%"), cache=False)
    except lib.RobotsBlocked:
        r = {'url': u, 'err': 'robots'}
    else:
        if not h:
            r = {'url': u, 'err': 'nohtml'}
        else:
            mh = re.search(r'rgb-value:\s*(#[0-9a-fA-F]{6})', h)
            t = re.sub(r'<style.*?</style>|<script.*?</script>', '', h, flags=re.S)
            t = H.unescape(re.sub(r'\s*\|[\s|]*', '|', re.sub(r'<[^>]+>', '|', t)))
            mn = re.search(r'colorName"[^>]*>\s*([^<]+?)\s*</h1>', h)
            mk = re.search(r'\|(PPG[\w-]+)\|', t)
            mc = re.search(r'Gyűjtemény\|([^|]+)\|', t)
            mf = re.search(r'Színcsalád\|([^|]+)\|', t)
            r = {'url': u, 'hex': mh.group(1).upper() if mh else None,
                 'name': H.unescape(mn.group(1)).strip() if mn else None, 'code': mk.group(1) if mk else None,
                 'coll': mc.group(1).strip() if mc else None, 'fam': mf.group(1).strip() if mf else None}
    f.write(json.dumps(r, ensure_ascii=False) + '\n'); f.flush()
    done[u] = r
    if i % 100 == 0:
        print(i, flush=True)

items, seen, bad = [], {}, 0
for u in urls:
    r = done[u]
    if not r.get('hex') or not r.get('name'):
        bad += 1; continue
    cid = u.rsplit('/', 1)[1]
    pid = 'trilak-' + lib.slug(r['name'])
    if pid in seen:
        pid = 'trilak-' + lib.slug(r['name']) + '-' + cid[-6:].lower()
    seen[pid] = 1
    it = {'id': pid, 'brand': 'PPG Trilak', 'line': 'Trilak színpaletta' + (f" ({r['coll']})" if r.get('coll') else ''),
          'name': r['name'], 'code': r.get('code') or cid, 'hex': r['hex'], 'hexSource': 'official',
          'family': lib.paint_family(r['hex']), 'url': u}
    items.append(it)
lib.save('paint', 'trilak', items, f'trilak.ppg.com/hu-HU színoldalak (sitemap); hex az SSR HTML rgb-value CSS-változójából, kód: PPG-kód. Kihagyva (hiányzó hex/név): {bad}. A nevek többnyire angolok (gyártói név). Az azonosító trilak-<név slug>, névütközésnél a COLOR-kód vége hozzáfűzve.')
