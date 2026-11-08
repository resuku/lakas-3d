import type { ElecKind, ElecPoint } from '../model/types';

// Villamosság réteg: színek és feliratok (a jelzések: scene/Electrical.tsx, a jelmagyarázat: ui/Sidebar.tsx).

export const ELEC_COLOR = {
  socket: '#e8590c',
  switch: '#1c7ed6',
  light: '#f08c00',
  low: '#7048e8',
  new: '#2f9e44',
  disused: '#868e96',
};

export const ELEC_LEGEND: [string, string][] = [
  ['Dugalj', ELEC_COLOR.socket],
  ['Kapcsoló', ELEC_COLOR.switch],
  ['Lámpakiállás', ELEC_COLOR.light],
  ['Gyengeáram, elosztó', ELEC_COLOR.low],
  ['Új kiállás (tervezett)', ELEC_COLOR.new],
  ['Régi, lezárt', ELEC_COLOR.disused],
];

export const ELEC_KIND_LABEL: Record<ElecKind, string> = {
  socket: 'Dugalj',
  switch: 'Kapcsoló',
  ceiling: 'Mennyezeti lámpakiállás',
  wallLight: 'Fali lámpakiállás',
  data: 'Adat- / optikai bevezetés',
  panel: 'Elosztótábla',
  intercom: 'Kaputelefon',
};

export const ELEC_STATE_LABEL: Record<ElecPoint['state'], string> = { existing: 'meglévő', new: 'új, tervezett', disused: 'régi, lezárt' };

export function elecColor(p: ElecPoint) {
  if (p.state === 'new') return ELEC_COLOR.new;
  if (p.state === 'disused') return ELEC_COLOR.disused;
  if (p.kind === 'socket') return ELEC_COLOR.socket;
  if (p.kind === 'switch') return ELEC_COLOR.switch;
  if (p.kind === 'ceiling' || p.kind === 'wallLight') return ELEC_COLOR.light;
  return ELEC_COLOR.low;
}
