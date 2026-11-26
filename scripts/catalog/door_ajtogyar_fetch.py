# Ajtógyár – 1. lépés: családoldalak letöltése és szövegesítése → /s/catalog/ajtogyar_pages.json
import json, re, html, sys
sys.path.insert(0, 'scripts/catalog')
import lib
def sm(u):
    x = lib.fetch(u) or ''
    locs = [l.replace('<![CDATA[', '').replace(']]>', '').strip() for l in re.findall(r'<loc>\s*(.*?)\s*</loc>', x, re.S)]
    return [y for l in locs for y in (sm(l) if l.endswith('.xml') else [l])]
urls = [u for u in sm('https://ajtogyar.hu/sitemap.xml') if re.search(r'/termekek/ajtocsaladok/[^/]+/?$', u)]
print(len(urls), flush=True)
out = {}
for u in urls:
    h = lib.fetch(u)
    if not h: continue
    t = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', h, flags=re.S)
    b = re.sub(r'<img[^>]*?(?:data-lazy-src|data-src|src)="([^"]*)"[^>]*>', r' [IMG \1] ', t)
    b = re.sub(r'<a [^>]*href="([^"]*)"[^>]*>', r' [A \1] ', b)
    b = re.sub(r'<[^>]+>', '\n', b)
    b = html.unescape(re.sub(r'\n[\s]*\n+', '\n', b)).replace('\u00ad', '')
    out[u] = b
json.dump(out, open('/s/catalog/ajtogyar_pages.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('kesz', len(out))
