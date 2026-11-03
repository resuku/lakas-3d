// Nyitott műszaki lehetőségek, amelyek a színváltozattól függetlenül kapcsolhatók (nem döntések).
// A helyiségadatok elemei a `choice` / `coverGroup` mezővel hivatkoznak ide.

export interface ChoiceGroup {
  id: string;
  roomId: string;
  label: string;
  options: { id: string; label: string; note?: string }[];
  default: string;
  /** Berendezési lehetőség: az Anyagok fül bútor-csoportjában jelenik meg, és csak bekapcsolt bútoroknál számít. */
  furniture?: boolean;
}

export const CHOICE_GROUPS: ChoiceGroup[] = [
  {
    id: 'halo-klima',
    roomId: 'halo',
    label: 'Klíma a hálóban',
    options: [
      { id: 'none', label: 'nincs' },
      {
        id: 'A',
        label: 'A: ágyfal, ablak mellett',
        note: 'Az ágy feje fölött, a homlokzati fal mellett. Nem ütközik a függönnyel és a radiátorral; a „radiátorig” függöny jól sötétít, a radiátort szabadon hagyja; a csőút a kültéri egységhez rövid. A légáram az ágy fölött a lábvég felé fúj – a lamellákat felfelé/vízszintesre érdemes állítani.',
      },
      {
        id: 'B',
        label: 'B: radiátor fölött',
        note: 'Az ablakfalon, a radiátor és a gardrób közti 890 mm-en (D-018). A függöny itt csak az ablak széléig érhet; a teljes sötétítéshez az ablakkeretbe szerelt fényzáró roló kell, a függöny akkor díszítő szerepű. A légáram a szoba hossztengelyében, az ágy mellett fúj.',
      },
      {
        id: 'C',
        label: 'C: ajtófal',
        note: 'A szemközti (ajtó felőli) falon, az ablak felé fúj, az ágyat oldalról éri el. Nem ütközik függönnyel és radiátorral, a teljes sötétítő maradhat; a csőút viszont hosszú (kb. 3,5 m a mennyezet mentén, csőtakaróval a homlokzatig).',
      },
    ],
    default: 'none',
  },
  {
    id: 'tarolo-takaras',
    roomId: 'eloszoba',
    label: 'Tároló takarása',
    options: [
      { id: 'open', label: 'nyitott (tok)' },
      { id: 'curtain', label: 'textil függöny', note: 'A tokba szerelt rúdon vagy mennyezeti sínen; a függöny színe a változat függönyszíne.' },
      { id: 'panel', label: 'falon futó tolólap', note: 'Ajtószínű lap a fal előtt, a bejárat felé eltolva (a tároló bal oldalán kb. 1 m szabad falszakasz van). Nem nyílik ki, nem kell küszöb.' },
    ],
    default: 'open',
  },
  {
    id: 'nappali-kanape',
    roomId: 'nappali',
    label: 'Kanapé',
    furniture: true,
    options: [
      {
        id: 'egyenes',
        label: 'egyenes + puff',
        note: 'ND-007 elsődleges irány: egyenes, ágyazható kanapé a hosszú falon, előtte mozgatható puff. Ágyként kinyitva kb. 2 m mély, ilyenkor a puffot el kell tolni.',
      },
      {
        id: 'chaise',
        label: 'L az erkély felé',
        note: 'ND-007 alternatíva, a user szerint (2026-11-02) az L alak is befér. Az L ága (chaise) az erkélyfal felé: a hosszú faltól legfeljebb kb. 180 cm-re nyúlhat, különben az erkélyajtó vonalába lóg (az ajtómező a modellben 1735 mm-nél kezdődik, fotóbecslés). Az ellenőrzés és a funkcionális zónák réteg ezt mutatja; a katalógus chaise-es kanapéi felcserélhető oldalúak.',
      },
      {
        id: 'chaise-etk',
        label: 'L az étkező felé',
        note: 'Az L ága az étkező (térelválasztó) felé: a kanapé maga is elválasztja a két zónát, ezért a lamellás térelválasztó mögötte elhagyható vagy máshova tehető. Az étkező felől a chaise oldala látszik, a chaise-ről a TV ferdén látszik. Az ág itt hosszabb is lehet (a TV-szekrényig kb. 1,2–1,5 m marad), a közlekedőből (AJ-07) a chaise vége mellett lehet bejutni.',
      },
    ],
    default: 'egyenes',
  },
  {
    id: 'nappali-tv',
    roomId: 'nappali',
    label: 'TV alatt',
    furniture: true,
    options: [
      { id: 'alacsony', label: 'alacsony TV-szekrény', note: 'ND-006: falra szerelt TV alatt kb. 180–200 cm széles, 35–45 cm mély alacsony szekrény.' },
      {
        id: 'tvfal',
        label: 'TV-fal (szekrénysor)',
        note: 'Alacsony pad és falra szerelt vagy magas elemek. A falszakasz a közlekedői átjáró és a radiátor között 281 cm; a radiátortól legalább ~30 cm szabadon marad, ezért a TV-fal legfeljebb kb. 250 cm széles. A napló (ND-006) csak visszafogott, részleges falfelületet javasolt – ezt érdemes a képen megítélni.',
      },
    ],
    default: 'alacsony',
  },
  {
    id: 'nappali-asztal',
    roomId: 'nappali',
    label: 'Étkezőasztal',
    furniture: true,
    options: [
      { id: 'kor', label: 'kör ø120, 4 szék', note: 'Napi használat: a kör asztal négy székkel.' },
      { id: 'bovitett', label: 'bővítve 196 cm', note: 'Vendégség, társasjáték: a toldólappal 196 cm hosszú ovális, a székek a hosszú oldalakon; a két vége szabadon marad, így a dolgozó ajtaja előtt is.' },
    ],
    default: 'kor',
  },
  {
    id: 'nappali-terelvalaszto',
    roomId: 'nappali',
    label: 'Térelválasztó',
    furniture: true,
    options: [
      { id: 'lamella', label: 'lamellás' },
      { id: 'none', label: 'nincs' },
    ],
    default: 'lamella',
  },
  {
    id: 'halo-agy',
    roomId: 'halo',
    label: 'Ágy',
    furniture: true,
    options: [
      {
        id: 'uj180',
        label: 'új ágy (legalább 180 × 200)',
        note: 'A user szerint (2026-11-02, este): az ágy nem kötött, nem kell mindenáron megtartani; legalább 180 × 200-as matrachoz, azon túl szabad a választás (200 × 200 is). A napló még a megtartást írja (D-009, K-011) – a következő naplóverzióban, jóváhagyással frissítendő. Termék nélkül 180 × 200-as helyőrző.',
      },
      { id: 'meglevo', label: 'meglévő keret (210 × 200)', note: 'A meglévő egyedi keret (2000 × 2000-es matrachoz); a user szerint nem kötelező megtartani.' },
    ],
    default: 'uj180',
  },
  {
    id: 'dolgozo-asztal',
    roomId: 'dolgozo',
    label: 'Íróasztal',
    furniture: true,
    options: [
      { id: 'meglevo', label: 'meglévő nagy asztal', note: 'A user szerint (2026-11-02) kb. 3000 × 1030 mm, nem kötelező megtartani. A hely (a külső oldalfal mentén, az ajtó felőli saroktól) a user megerősítésével (DD-007).' },
      {
        id: 'sarok',
        label: 'sarokasztal az ajtó mellett',
        note: 'Ha asztalcsere, akkor sarokasztal legalább 3 monitorhoz és laptophoz (user, 2026-11-02). A hosszú ág a külső oldalfal mentén, a rövid ág az ajtófal mentén, az ajtónyílás előtt megáll; az ablakos sarokba a radiátor miatt nem kerülhet. A kapható sarokasztalok rövid ága többnyire 135–180 cm – ide csak a legfeljebb ~125 cm-es fér.',
      },
      {
        id: 'sziget',
        label: 'L félszigetként',
        note: 'A hosszú ág a külső oldalfal mentén, a rövid ág a szobába nyúlik az ajtó és az ablak között (nem falnak állítva) – így a 140–170 cm-es rövid ágú sarokasztalok is elférnek; a háló felőli fal mentén ~80 cm-es közlekedő marad.',
      },
    ],
    default: 'meglevo',
  },
  {
    id: 'nappali-etkezo-tarolo',
    roomId: 'nappali',
    label: 'Étkező – tároló',
    furniture: true,
    options: [
      { id: 'none', label: 'nincs' },
      { id: 'talalo', label: 'tálaló', note: 'Alacsony tálaló a dolgozó ajtajától balra, a bontott tükrös szekrény helyén (120 × 40 cm); a dolgozó felőli szék mögött kb. 60 cm marad. Fölé tükör vagy nagy kép illik.' },
      { id: 'polc', label: 'társasjáték-polc', note: 'Nyitott, 2 × 4 rekeszes polc a sarokban (77 × 39 × 147 cm) társasjátékoknak és könyveknek.' },
    ],
    default: 'none',
  },
  {
    id: 'nappali-etkezo-ules',
    roomId: 'nappali',
    label: 'Étkező – ülés',
    furniture: true,
    options: [
      { id: 'szekek', label: 'székek' },
      { id: 'pad', label: 'pad a hosszú oldalon', note: 'A hosszú fal felőli két szék helyett pad (160 × 38 cm) – csak bővített asztalnál; társasjáték-estére.' },
    ],
    default: 'szekek',
  },
  {
    id: 'nappali-zsurkocsi',
    roomId: 'nappali',
    label: 'Zsúrkocsi',
    furniture: true,
    options: [
      { id: 'none', label: 'nincs' },
      { id: 'van', label: 'van', note: 'Guruló, 2 szintes tálaló a hosszú falnál, a térelválasztó előtt; vendégségkor az asztalhoz húzható.' },
    ],
    default: 'none',
  },
  {
    id: 'dolgozo-sarok',
    roomId: 'dolgozo',
    label: 'Dolgozó – ablak felőli sarok',
    furniture: true,
    options: [
      { id: 'none', label: 'nincs' },
      { id: 'konyvespolc', label: 'keskeny könyvespolc', note: '28 cm mély, 2 m magas polc a háló felőli fal ablak felőli végén – a szék mozgásterén kívül.' },
      { id: 'fotel', label: 'olvasófotel', note: 'Kis fotel (72 × 75 cm) a radiátor mellett, a háló felőli sarokban; mellé állólámpa és kis lerakóasztal.' },
    ],
    default: 'none',
  },
  {
    id: 'eloszoba-tarolo',
    roomId: 'eloszoba',
    label: 'Előszoba – a bejárat mellett',
    furniture: true,
    options: [
      { id: 'none', label: 'nincs' },
      { id: 'cipos', label: 'cipősszekrény', note: 'Keskeny, billenőajtós cipősszekrény (80 × 24 × 100 cm) a konyhafalon, a bejárati ajtó nyílásán kívül; fölé tükör.' },
      { id: 'pad', label: 'ülőpad', note: 'Ülőpad cipőtartó polccal (80 × 35 cm) a cipősszekrény helyett, ha a leülés fontosabb.' },
    ],
    default: 'none',
  },
  {
    id: 'eloszoba-konzol',
    roomId: 'eloszoba',
    label: 'Előszoba – konzolasztal',
    furniture: true,
    options: [
      { id: 'none', label: 'nincs' },
      { id: 'van', label: 'van', note: 'Keskeny (22 cm) konzolasztal a konyhafalon, a nappali felőli átjárónál; fölé kép.' },
    ],
    default: 'none',
  },
];

export const DEFAULT_CHOICES: Record<string, string> = Object.fromEntries(CHOICE_GROUPS.map((g) => [g.id, g.default]));
