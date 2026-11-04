# A J-javaslatok megjelenített száma (2026-11-03): elöl a kiemelt javaslatok (amelyekhez aljavaslat van,
# src/data/subVariants.ts), utánuk a többi a korábbi sorrendben. Az azonosító (j5-melyzold, lj5) a régi számot őrzi,
# így a mentett beállítások és a vélemények megmaradnak. A gen_variants.py és a gen_lightplans.py használja.
ORDER = ['j5', 'j17', 'j18', 'j1', 'j2', 'j4', 'j6', 'j7', 'j8', 'j9', 'j10', 'j11', 'j13', 'j14', 'j15', 'j16']
FEATURED = ORDER[:3]
NUM = {k: i + 1 for i, k in enumerate(ORDER)}


def key(vid):
    """'j5-melyzold' / 'lj5' → 'j5'."""
    return vid.split('-')[0].removeprefix('l')


def label(vid):
    """A megjelenített szám, pl. 'J1'."""
    return f'J{NUM[key(vid)]}'


def refs(text):
    """A szövegben {j5} alakú hivatkozás → a megjelenített szám (J1)."""
    import re
    return re.sub(r'\{(j\d+)\}', lambda m: f'J{NUM[m.group(1)]}', text)
