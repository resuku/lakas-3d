// Nyitott műszaki lehetőségek, amelyek a színváltozattól függetlenül kapcsolhatók (nem döntések).
// A helyiségadatok elemei a `choice` / `coverGroup` mezővel hivatkoznak ide.

export interface ChoiceGroup {
  id: string;
  roomId: string;
  label: string;
  options: { id: string; label: string; note?: string }[];
  default: string;
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
];

export const DEFAULT_CHOICES: Record<string, string> = Object.fromEntries(CHOICE_GROUPS.map((g) => [g.id, g.default]));
