"""Helyi fotótextúrák a termékfotókból (scripts/textures/sources.json → public/textures-local/).

A képek a gyártók / boltok termékfotói: csak helyben használhatók. A letöltések (textures-src/) és a kimenet
(public/textures-local/) gitignore-oltak, a kirakott oldalra nem kerülnek. A program a kimenetet a
`textures-local/index.json` alapján tölti be (src/lib/localTextures.ts); ha nincs, a sima színek maradnak.

Futtatás (konténerben):
  MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W):/w" -w /w python:3.12-slim \
    sh -c "pip -q install pillow numpy && python -I scripts/textures/prep_textures.py [termékazonosító ...]"

Fajták:
  floor – felülnézeti dekorkép vízszintes lapokkal: a lapokat a sötét illesztések mentén keresi meg (rows/cols),
          a program laponként egy-egy valódi lapot rajzol belőlük (src/lib/floorTexture.ts);
  wood  – faminta: egész kép, vagy `quad` (4 sarok: bal felső, jobb felső, jobb alsó, bal alsó) perspektíva-korrigálva;
          `mask` (u0, v0, u1, v1 a kimenetben) sáv az alatta lévő sorok tükrével pótolva; `size` a valós méret (m).
Közös mezők: `rotate` (fok, az óramutatóval ellentétesen; pl. függőleges lapoknál 90, halszálkánál −45), `crop`
(x0, y0, x1, y1 a forgatás után), `same` (ugyanaz a dekor, mint egy másik tételnél – a fájl közös). Padlónál `rects`
(kézzel kijelölt lapok a forgatott képen, felismerés helyett) és `flat: false` (fényátmenet-kiegyenlítés nélkül).
`matchHex` ('catalog' vagy hex): szobafotónál / rendernél, ahol a kép fénye nem a bútor színét mutatja, az átlagszín a
referenciára igazítva (az erezet a fotóból, a szín a katalógusból). Fehér hátterű termékfotónál nem kell.
A nagy léptékű fényátmenetet kiegyenlíti (flat-field); a textúra átlagszínét összeveti a katalógus színével.
"""

import datetime
import hashlib
import json
import pathlib
import sys
import time
import urllib.request

import numpy as np
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parents[2]
SOURCES = ROOT / 'scripts' / 'textures' / 'sources.json'
CACHE = ROOT / 'textures-src'
OUT = ROOT / 'public' / 'textures-local'
PRODUCTS = ROOT / 'src' / 'data' / 'products'
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'


def catalog_hex(pid):
    for f in PRODUCTS.glob('*.json'):
        d = json.loads(f.read_text(encoding='utf-8'))
        for it in d.get('items', d if isinstance(d, list) else []):
            if isinstance(it, dict) and it.get('id') == pid:
                return it.get('hex')
    return None


def fetch(url, path):
    if path.exists():
        return
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        path.write_bytes(r.read())
    time.sleep(3)


def to_lin(a):
    a = a / 255.0
    return np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)


def to_srgb8(lin):
    lin = np.clip(lin, 0, 1)
    s = np.where(lin <= 0.0031308, lin * 12.92, 1.055 * lin ** (1 / 2.4) - 0.055)
    return np.clip(np.round(s * 255), 0, 255).astype(np.uint8)


def hex_lin(h):
    h = h.lstrip('#')
    return to_lin(np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=float))


def lin_hex(v):
    return '#' + ''.join(f'{c:02x}' for c in to_srgb8(np.asarray(v)))


def lab(lin):
    m = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.072175], [0.0193339, 0.119192, 0.9503041]])
    x, y, z = m @ lin / np.array([0.95047, 1.0, 1.08883])
    f = lambda t: np.cbrt(t) if t > (6 / 29) ** 3 else t / (3 * (6 / 29) ** 2) + 4 / 29
    return np.array([116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))])


def box_blur(a, r, axis):
    r = max(1, int(r))
    pad = [(0, 0)] * a.ndim
    pad[axis] = (r + 1, r)
    c = np.cumsum(np.pad(a, pad, mode='edge'), axis=axis)
    n = a.shape[axis]
    hi = np.take(c, np.arange(2 * r + 1, 2 * r + 1 + n), axis=axis)
    lo = np.take(c, np.arange(0, n), axis=axis)
    return (hi - lo) / (2 * r + 1)


def blur(a, r):
    for _ in range(3):
        a = box_blur(box_blur(a, r, 0), r, 1)
    return a


def flat_field(lin, frac):
    """A nagy léptékű fényátmenet kiegyenlítése: osztás a világosság erősen elmosott képével."""
    L = lin @ np.array([0.2126, 0.7152, 0.0722])
    B = blur(L, min(L.shape) * frac / 2)
    return lin * (L.mean() / np.maximum(B, 1e-4))[..., None]


def perspective(img, quad, out):
    """A kimenet (0..W, 0..H) képpontjait a bemeneti négyszögre képezi (PIL PERSPECTIVE együtthatók)."""
    W, H = out
    dst = [(0, 0), (W, 0), (W, H), (0, H)]
    A, b = [], []
    for (x, y), (u, v) in zip(dst, quad):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y])
        b += [u, v]
    coef = np.linalg.solve(np.array(A, float), np.array(b, float))
    return img.transform((W, H), Image.PERSPECTIVE, tuple(coef), Image.BICUBIC)


def fill_mask(lin, mask):
    """A maszk sávja az alatta lévő sorok tükrével, a szélein átúsztatva (vízszintes erezetnél nem feltűnő)."""
    H, W, _ = lin.shape
    u0, v0, u1, v1 = mask
    x0, x1, y0, y1 = int(u0 * W), int(u1 * W), int(v0 * H), int(v1 * H)
    h = y1 - y0
    # a pótlás a maszk alatti, ha ott nincs elég sor, a fölötte lévő sorok tükre; ha egyik oldalon sincs elég, a kettő
    # együtt (a maszkon belüli sorok soha, hogy a fogantyú ne másolódjon vissza)
    if H - y1 >= h:
        src = lin[y1:y1 + h][::-1]
    elif y0 >= h:
        src = lin[y0 - h:y0][::-1]
    else:
        pool = np.concatenate([lin[:y0], lin[y1:]], 0)
        src = np.concatenate([pool] * (h // max(1, pool.shape[0]) + 1), 0)[:h]
    out = lin.copy()
    feather = 12
    wx = np.clip(np.minimum(np.arange(x0, x1) - x0, x1 - 1 - np.arange(x0, x1)) / feather, 0, 1)
    wy = np.clip((np.arange(y0, y1) - y0) / max(8, h * 0.25), 0, 1)
    w = (wy[:, None] * wx[None, :])[..., None]
    out[y0:y1, x0:x1] = w * src[:, x0:x1] + (1 - w) * lin[y0:y1, x0:x1]
    return out


def moving_avg(p, n):
    k = np.ones(n) / n
    return np.convolve(np.pad(p, n // 2, mode='edge'), k, mode='valid')[: len(p)]


def groups(idx, gap=2):
    out = []
    for i in idx:
        if out and i - out[-1][-1] <= gap:
            out[-1].append(i)
        else:
            out.append([i])
    return [int(np.mean(g)) for g in out]


def detect_planks(gray):
    """Lapok a dekorképen: sorok a vízszintes, lapok a függőleges sötét illesztések között (x, y, w, h)."""
    H, W = gray.shape
    prof = gray.mean(1)
    d = prof - moving_avg(prof, 41)
    # élletörésnél az illesztés két közeli vonal: a H 4 %-ánál közelebbi vonalak egy illesztés
    rows = groups(np.where(d < -max(2.5 * d.std(), 0.01))[0], gap=max(2, int(H * 0.04)))
    edges = [0, *rows, H]
    # sormagasság: a sávok (a képszélekkel együtt) mediánja; a néhány sorból álló képen is
    gaps = [g for g in np.diff(edges) if g > H * 0.05]
    P = float(np.median(gaps)) if gaps else H
    rects = []
    for a, b in zip(edges[:-1], edges[1:]):
        if b - a < 0.6 * P:
            continue
        m = max(3, int(P * 0.05))
        y0, y1 = a + m, b - m
        cp = gray[y0:y1].mean(0)
        cd = cp - moving_avg(cp, 61)
        cols = groups(np.where(cd < -max(3 * cd.std(), 0.015))[0], gap=max(2, int(P * 0.25)))
        xs = [0, *cols, W]
        for c0, c1 in zip(xs[:-1], xs[1:]):
            x0, x1 = c0 + m, c1 - m
            if x1 - x0 >= 1.5 * (y1 - y0):
                rects.append([int(x0), int(y0), int(x1 - x0), int(y1 - y0)])
    return rects, P


def orient(img, item):
    """Forgatás (fok, az óramutatóval ellentétesen; a 90 többszörösei veszteség nélkül), majd kivágás (x0, y0, x1, y1)."""
    rot = item.get('rotate', 0) % 360
    if rot in (90, 180, 270):
        img = img.transpose({90: Image.ROTATE_90, 180: Image.ROTATE_180, 270: Image.ROTATE_270}[rot])
    elif rot:
        img = img.rotate(rot, resample=Image.BICUBIC, expand=True, fillcolor=(255, 255, 255))
    if 'crop' in item:
        # a `ref` méretű (kicsinyített) képen mért kivágás a letöltött kép méretére skálázva
        sx, sy = (img.width / item['ref'][0], img.height / item['ref'][1]) if 'ref' in item else (1, 1)
        x0, y0, x1, y1 = item['crop']
        img = img.crop((round(x0 * sx), round(y0 * sy), round(x1 * sx), round(y1 * sy)))
    return img


def process(item, done):
    pid = item['id']
    if 'same' in item:
        # ugyanaz a dekor, mint egy másik terméknél (pl. azonos termékcsalád): a fájl közös
        src = done[item['same']]
        print(f'  = {item["same"]}')
        return {**src, 'same': item['same']}
    # a letöltés neve az URL kivonatával: más forrásra váltva újra letölti
    raw = CACHE / f'{pid}-{hashlib.sha1(item["url"].encode()).hexdigest()[:8]}.img'
    fetch(item['url'], raw)
    img = orient(Image.open(raw).convert('RGB'), item)
    entry = {'kind': item['kind'], 'file': f'{pid}.jpg', 'src': item['url']}
    if item['kind'] == 'floor':
        if img.width > 2048 and 'rects' not in item:
            img = img.resize((2048, round(img.height * 2048 / img.width)), Image.LANCZOS)
        lin = to_lin(np.asarray(img, float))
        if item.get('flat', True):
            lin = flat_field(lin, 0.8)
        gray = lin @ np.array([0.2126, 0.7152, 0.0722])
        if 'rects' in item:
            rects, P = item['rects'], float(np.median([r[3] for r in item['rects']]))
        else:
            rects, P = detect_planks(gray)
        if not rects:
            print('  FIGYELEM: nem talált lapot – az egész kép egy lap')
            rects, P = [[0, 0, img.width, img.height]], float(img.height)
        entry['planks'] = rects
        entry['size'] = [img.width, img.height]
        dbg = Image.fromarray(to_srgb8(lin))
        dr = ImageDraw.Draw(dbg)
        for x, y, w, h in rects:
            dr.rectangle([x, y, x + w, y + h], outline=(255, 0, 0), width=3)
        (CACHE / 'debug').mkdir(exist_ok=True)
        dbg.save(CACHE / 'debug' / f'{pid}_planks.jpg', quality=80)
        print(f'  {len(rects)} lap, sormagasság kb. {P:.0f} px')
    else:
        if 'quad' in item:
            sx, sy = (img.width / item['ref'][0], img.height / item['ref'][1]) if 'ref' in item else (1, 1)
            quad = [(x * sx, y * sy) for x, y in item['quad']]
            img = perspective(img, quad, tuple(item['out']))
        lin = to_lin(np.asarray(img, float))
        if 'mask' in item:
            lin = fill_mask(lin, item['mask'])
        lin = flat_field(lin, 0.6)
        entry['size'] = item['size']
        entry['grain'] = item.get('grain', 'x')
    if item['kind'] == 'floor':
        # padlónál a lapok átlaga (a kép széle, háttere nem számít)
        mean = np.concatenate([lin[y:y + h, x:x + w].reshape(-1, 3) for x, y, w, h in entry['planks']]).mean(0)
    else:
        mean = lin.reshape(-1, 3).mean(0)
    if 'matchHex' in item:
        # szobafotó / render: a fény színe és ereje nem a bútoré – az erezet marad, az átlagszín a referencia lesz
        target = hex_lin(catalog_hex(pid) if item['matchHex'] == 'catalog' else item['matchHex'])
        gain = target / np.maximum(mean, 1e-4)
        print(f'  színigazítás {lin_hex(mean)} → {lin_hex(target)} (szorzó {", ".join(f"{g:.2f}" for g in gain)})')
        lin = lin * gain
        mean = target
    entry['meanHex'] = lin_hex(mean)
    hexc = catalog_hex(pid)
    if hexc:
        dl = lab(mean) - lab(hex_lin(hexc))
        print(f'  átlag {entry["meanHex"]} – katalógus {hexc}: ΔE76 {np.linalg.norm(dl):.1f} (ΔL {dl[0]:+.1f})')
    Image.fromarray(to_srgb8(lin)).save(OUT / entry['file'], quality=88)
    return entry


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(parents=True, exist_ok=True)
    want = set(sys.argv[1:])
    items = json.loads(SOURCES.read_text(encoding='utf-8'))['items']
    idx_path = OUT / 'index.json'
    index = json.loads(idx_path.read_text(encoding='utf-8')) if idx_path.exists() else {'items': {}}
    for it in items:
        if want and it['id'] not in want and not ('same' in it and it['same'] in want):
            continue
        print(it['id'])
        index['items'][it['id']] = process(it, index['items'])
    index['generatedAt'] = datetime.datetime.now().isoformat(timespec='seconds')
    index['note'] = 'Helyi fotótextúrák termékfotókból – csak helyi használatra, nem kerülhet a tárolóba (scripts/textures/prep_textures.py).'
    idx_path.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'{len(index["items"])} textúra: {idx_path.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
