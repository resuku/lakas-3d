import { createContext, useContext } from 'react';
import { useStore } from '../store';

/**
 * A vászon termékhű nézete: a két nézetes módban (ViewMode 'split') vásznanként rögzített (bal: fényjelenet, jobb:
 * termékhű); egy nézetben null, ekkor a néző kapcsolója (store.productView, T billentyű) dönt.
 */
export const StudioContext = createContext<boolean | null>(null);

export function useStudio(): boolean {
  const forced = useContext(StudioContext);
  const pref = useStore((s) => s.productView);
  return forced ?? pref;
}
