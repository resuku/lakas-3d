# Watt Webshop: nyers mezők kinyerése a termékoldalakról (lámpa). A besorolás a lamp_watt.py-ban.
import sys, re, json, html
sys.path.insert(0, '/w/scripts/catalog')
import lib

def meta(h, k):
    m = re.search(r'<meta[^>]*itemprop="%s"[^>]*content="([^"]*)"' % k, h)
    return html.unescape(m.group(1)) if m else None

def og(h, k):
    m = re.search(r'<meta[^>]*property="og:%s"[^>]*content="([^"]*)"' % k, h)
    return html.unescape(m.group(1)) if m else None

def text(h):
    t = re.sub(r'<script.*?</script>|<style.*?</style>', '', h, flags=re.S)
    t = html.unescape(re.sub(r'<[^>]+>', '\n', t))
    return re.sub(r'[ \t]+', ' ', re.sub(r'\n\s*\n+', '\n', t))

urls = [u for u in lib.sitemap_urls('https://wattwebshop.hu/sitemap.xml') if u.count('/') == 3]
out = []
for i, u in enumerate(urls):
    try:
        h = lib.fetch(u)
    except (lib.RobotsBlocked, lib.BotCheck) as e:
        print('SKIP', type(e).__name__, u); continue
    if not h or 'itemprop="sku"' not in h:
        continue
    bc = re.findall(r'<span itemprop="name">([^<]*)</span>', h)
    man = re.search(r'manufacturer-param">\s*<a[^>]*aria-label="([^"]*)"', h)
    t = text(h)
    j = t.find('\nLeírás\n')
    desc = t[j + 8: t.find('\nVélemények', j)] if j >= 0 else ''
    out.append(dict(url=u, title=og(h, 'title'), image=og(h, 'image'), price=meta(h, 'price'), sku=meta(h, 'sku'),
                    cat=meta(h, 'category'), bc=bc, brand=html.unescape(man.group(1)) if man else None, desc=desc.strip()))
    if i % 50 == 0:
        print(i, len(urls), flush=True)
json.dump(out, open('/s/lamp/raw-watt.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('raw', len(out))
