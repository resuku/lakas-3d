# A J-javaslatok megjelenített száma (2026-11-03): elöl a kiemelt javaslatok (amelyekhez aljavaslat van,
# src/data/subVariants.ts), utánuk a többi a korábbi sorrendben. Az azonosító (j5-melyzold, lj5) a régi számot őrzi,
# így a mentett beállítások és a vélemények megmaradnak. A gen_variants.py és a gen_lightplans.py használja.
# JR-javaslatok (2026-11-17, a meglévő világos laminálttal): saját számozás (jr1 → JR1), a J-javaslatok után.
# JF-javaslatok (2026-11-26, „fekete részletek”: fekete/antracit ajtó, kilincs és lámpák): saját számozás (jf1 → JF1),
# a J-k után, a JR-ek előtt.
ORDER = ['j5', 'j17', 'j18', 'j1', 'j2', 'j4', 'j6', 'j7', 'j8', 'j9', 'j10', 'j11', 'j13', 'j14', 'j15', 'j16']
FEATURED = ORDER[:3]
NUM = {k: i + 1 for i, k in enumerate(ORDER)}


# saját számozású családok: rendezési eltolás. 2026-11-26: JS (skandináv), JM (melegebb világos), JP (japandi) vonal.
# A választó csoportjai nem a számból, hanem a vonalból jönnek (gen_variants.py – LINES, VARIANT_GROUPS).
FAMILY_ORDER = {'jf': 60, 'js': 70, 'jm': 80, 'jp': 90, 'jr': 100}


def key(vid):
    """'j5-melyzold' / 'lj5' → 'j5'; 'jr2-zsalya' / 'ljr2' → 'jr2'; 'jf1-…' / 'ljf1' → 'jf1'."""
    return vid.split('-')[0].removeprefix('l')


def label(vid):
    """A megjelenített szám, pl. 'J1', 'JF3' vagy 'JR2'."""
    k = key(vid)
    return k.upper() if k[:2] in FAMILY_ORDER else f'J{NUM[k]}'


def order(vid):
    """Rendezési kulcs: a J-javaslatok a megjelenített szám szerint, utánuk a JF-, majd a JR-javaslatok."""
    k = key(vid)
    return FAMILY_ORDER[k[:2]] + int(k[2:]) if k[:2] in FAMILY_ORDER else NUM[k]


def refs(text):
    """A szövegben {j5} alakú hivatkozás → a megjelenített szám (J1); {jr2} → JR2; {jf1} → JF1."""
    import re
    return re.sub(r'\{(j[rfsmp]?\d+)\}', lambda m: label(m.group(1)), text)
