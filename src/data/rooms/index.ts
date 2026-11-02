import type { Room } from '../../model/types';
import halo from './halo.json';
import dolgozo from './dolgozo.json';
import nappali from './nappali.json';
import eloszoba from './eloszoba.json';
import kozlekedo from './kozlekedo.json';

export const ROOMS: Room[] = [halo, dolgozo, nappali, eloszoba, kozlekedo] as unknown as Room[];

export function getRoom(id: string): Room {
  return ROOMS.find((r) => r.id === id) ?? ROOMS[0];
}
