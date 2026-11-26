# Közös segédek az ajtószkriptekhez: kiemelt dekorok (sötét, fekete, antracit, grafit, meleg semleges) és kialakítás-tipp.
import re, sys
sys.path.insert(0, 'scripts/catalog')
import lib

KW_DARK = r'fekete|antracit|anthracit|antracyt|grafit|gafit|graphit|nero|black|onyx|sötét|sotet|dark|füstöld|smoke|dió|dio\b|walnut|wenge|merbau|marone|barna|espresso|titano|lava|carbon'
KW_WARM = re.compile(r'kasmír|kasmir|cashmere|homok|bézs|bezs|beige|greige|taupe|krém|krem|drapp|mandula|karamell|caramel|gyapot|latte|mogyor|vanília|elefántcsont|ivory|cream|sand|champagne|pezsg', re.I)
KW_NOT = re.compile(r'sárga|piros|vörös|narancs|pink|lila|fuchsia|citrus|türkiz|kék|égkék|indigo|zöld|zsálya|padlizsán|rózsa', re.I)
KW_WOOD = re.compile(r'tölgy|tolgy|fenyő|fenyo|kőris|akác|hickory|oak|szil\b|bükk', re.I)


def priority(name: str, hexs: str | None) -> bool:
    """Kiemelt dekor: fekete / antracit / grafit / sötét dió-tölgy és meleg semleges (kasmír, homok, greige, meleg fehér)."""
    if not hexs or lib.loud(hexs):
        return False
    name = name or ''
    L, C, h = lib.lch(hexs)
    tone = lib.door_tone(hexs)
    if tone in ('black', 'dark'):
        return True
    if tone == 'grey' and L < 0.62:
        return True
    if re.search(r'fekete|antracit|anthracit|antracyt|grafit|gafit|graphit|nero|black', name, re.I):
        return True
    if tone == 'warm' and re.search(KW_DARK + r'|dohány', name, re.I):
        return True
    if tone in ('offwhite', 'light', 'natural') and 25 <= h <= 100 and C >= 0.012 and KW_WARM.search(name):
        return True
    if tone in ('offwhite', 'light') and 30 <= h <= 100 and 0.02 <= C < 0.06 and L > 0.78 and not KW_WOOD.search(name) \
            and not KW_NOT.search(name):
        return True
    return False


def style_from(text: str) -> str:
    t = (text or '').lower()
    if re.search(r'üveg|uveg|glass|vitrin', t):
        return 'glass'
    if re.search(r'mart|marás|maras|horony|hornyolt|díszcsík|diszcsik|csíkos|intarzi|rátétléc|ratetlec|vízszintes|lamell|domborít', t):
        return 'groove'
    return 'flat'


def tone_stats(items):
    from collections import Counter
    return dict(Counter(i['tone'] for i in items)), dict(Counter(i['style'] for i in items))
