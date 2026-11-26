# Caparol: a hivatalos digitális színértékek (ASE, sRGB monitor) a caparol.de-ről. Futtatás: python -I (a zip nem megbízható).
# 1. lépés (letöltés): a zip a /s/catalog/caparol_dl mappába kerül. 2. lépés: a zipet memóriában olvassa, ASE-parse.
import io, os, re, struct, sys, zipfile
sys.path.insert(0, '/w/scripts/catalog')
import lib

URL = 'https://www.caparol.de/fileadmin/data/pdf/FDS/Caparol_DigitaleFarbwerte_Monitor_ASE_Swatches_sRGB.zip'
DL = '/s/catalog/caparol_dl'
zp = os.path.join(DL, 'ase_srgb.zip')
if not os.path.exists(zp):
    b = lib.fetch(URL, binary=True, cache=False)
    if not b:
        sys.exit('letöltés sikertelen')
    open(zp, 'wb').write(b)
z = zipfile.ZipFile(zp)
for n in z.namelist():
    print(n, z.getinfo(n).file_size)


def ase(data: bytes):
    """ASE blokkok: (típus, név, [modell, értékek]) – csak a színek (0x0001)."""
    assert data[:4] == b'ASEF'
    n = struct.unpack('>I', data[8:12])[0]
    p, out = 12, []
    for _ in range(n):
        t, ln = struct.unpack('>HI', data[p:p + 6]); p += 6
        blk = data[p:p + ln]; p += ln
        if t != 0x0001:
            out.append((t, blk[2:2 + 2 * (struct.unpack('>H', blk[:2])[0] - 1)].decode('utf-16-be', 'replace'), None)); continue
        nl = struct.unpack('>H', blk[:2])[0]
        name = blk[2:2 + nl * 2].decode('utf-16-be').rstrip('\0')
        model = blk[2 + nl * 2:6 + nl * 2].decode()
        k = 6 + nl * 2
        cnt = {'RGB ': 3, 'CMYK': 4, 'LAB ': 3, 'Gray': 1}[model]
        vals = struct.unpack('>' + 'f' * cnt, blk[k:k + 4 * cnt])
        out.append((t, name, (model, vals)))
    return out


items, seen = [], {}
for n in z.namelist():
    if not n.lower().endswith('.ase'):
        continue
    coll = os.path.splitext(os.path.basename(n))[0]
    for t, name, col in ase(z.read(n)):
        if col is None or col[0] != 'RGB ':
            continue
        r, g, bb = [int(round(v * 255)) for v in col[1]]
        hx = '#%02X%02X%02X' % (r, g, bb)
        items.append({'coll': coll, 'name': name, 'hex': hx})
import json
json.dump(items, open('/s/catalog/caparol_raw.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(len(items))

# beltéri falfestékre való kollekciók (a homlokzati Fassade_A1/Histolith/Disboroof, FloorColor és a 2012-es Trend kimarad)
KEEP = {'3D-System_plus': '3D-System Plus', 'CaparolColor-System': 'CaparolColor'}
out, ids = [], set()
for it in items:
    if it['coll'] not in KEEP:
        continue
    pid = 'caparol-' + lib.slug(it['name'])
    if pid in ids:
        continue
    ids.add(pid)
    hx = it['hex']
    out.append({'id': pid, 'brand': 'Caparol', 'line': KEEP[it['coll']], 'name': it['name'], 'code': it['name'],
                'hex': hx, 'hexSource': 'official', 'family': lib.paint_family(hx), 'url': 'https://www.caparol.hu/szolgaltatasok/digitalis-szolgaltatasok/digitalis-szinkollekciok'})
lib.save('paint', 'caparol', out, 'Caparol hivatalos digitális színértékek: caparol.de Caparol_DigitaleFarbwerte_Monitor_ASE_Swatches_sRGB.zip (sRGB ASE; a caparol.hu digitális színkollekciók oldaláról linkelt). Csak 3D-System Plus és CaparolColor kollekció; a nevek a gyártó (német) nevei, kód = név. Az url a kollekció-letöltőoldal, színenkénti oldal nincs.')
