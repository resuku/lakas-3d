import { useState } from 'react';
import { smallDevice, useStore } from '../store';

// Rövid használati útmutató az első megnyitáskor (és a Súgó gombbal), valamint figyelmeztetés kis kijelzőn.

export function HelpOverlay() {
  const seen = useStore((s) => s.helpSeen);
  const setViewer = useStore((s) => s.setViewer);
  if (seen) return null;
  const close = () => setViewer({ helpSeen: true });
  return (
    <div className="help-backdrop" onClick={close}>
      <div className="help" onClick={(e) => e.stopPropagation()}>
        <h2>Lakás 3D – így használd</h2>
        <p>A lakás felújítási terveinek 3D-s nézete: falszínek, padló, ajtók, függönyök, világítás és berendezés valós termékekkel. A bútorok javaslatok, nem kiválasztott darabok.</p>
        <h3>Nézelődés</h3>
        <ul>
          <li>
            <b>Egér húzása</b>: forgatás, <b>görgő</b>: közelítés, <b>jobb gomb húzása</b>: eltolás.
          </li>
          <li>
            Fent a <b>helyiség gombjai</b>, a <b>Nézet</b> fülön a kész <b>nézőpontok</b> (pl. „Erkély felől”).
          </li>
          <li>
            <b>Teljes lakás</b>: minden helyiség a helyén. <b>Bejárás</b>: séta szemmagasságban – <b>W A S D</b> vagy nyilak, egérhúzással körbenézés, Esc: kilépés.
          </li>
          <li>
            <b>Alt</b> nyomva tartva (vagy <b>I</b>): az egér alatti elem – fal, padló, ajtó, lámpa, bútor – pontos terméke; <b>Ctrl</b> (Macen <b>⌘</b>) + kattintás: a termék oldala új lapon. Egy lámpára kattintva ki- és bekapcsol.
          </li>
        </ul>
        <h3>Javaslatok</h3>
        <ul>
          <li>
            Az oldalsáv <b>Javaslat</b> fülén a <b>J</b> szín- és anyagjavaslatok; a hozzájuk illő világítás és bútorok magától betöltődnek. Az esti hatást a <b>Világítás</b> fül fényjeleneteivel nézd meg.
          </li>
          <li>
            Ugyanott a <b>Bútorok színvilága</b> mutatja, milyen színű kanapé és bútor illik az adott javaslathoz.
          </li>
          <li>
            Bátran kísérletezz: a <b>Másolat</b> gombbal saját változatot készíthetsz, a színeket az <b>Anyagok</b> fülön állíthatod.
          </li>
        </ul>
        <h3>Berendezés és dekor</h3>
        <ul>
          <li>
            Az <b>Anyagok</b> fül <b>Bútor</b> csoportjában választható a kanapé (egyenes vagy L alakú), a TV alatti szekrény vagy TV-fal, az asztal és az ágy, hozzájuk valós termék is (<b>◆</b> a javaslathoz illő, <b>★</b> a tervezet).
          </li>
          <li>
            A <b>Dekor</b> csoportban növény, kép, tükör vagy akusztikus panel tehető ki: válaszd ki, a halvány előnézettel keresd meg a helyét, és kattints (Esc: mégse). Mozgatás: <b>M</b> nyomva tartva húzd az elemet.
          </li>
        </ul>
        <h3>Véleményezés</h3>
        <ul>
          <li>
            Írd be a <b>neved</b>, jelöld a kedvenceidet <b>★</b>-gal, és írj megjegyzést a változatokhoz.
          </li>
          <li>
            A <b>Továbbiak</b> fülön a <b>Konfiguráció mentése</b> gombbal egy fájlba mented – ezt küldd vissza. A beállításaid ebben a böngészőben is megmaradnak.
          </li>
        </ul>
        <p className="note">A színek képernyős közelítések, a mennyiségek és árak becslések. A Súgó gombbal ez az ablak bármikor újra előhozható.</p>
        <button className="on" onClick={close}>
          Kezdjük
        </button>
      </div>
    </div>
  );
}

export function SmallScreenNotice() {
  const [hidden, setHidden] = useState(!smallDevice());
  if (hidden) return null;
  return (
    <div className="small-notice">
      A program számítógépre készült – telefonon lassú és nehezen kezelhető lehet. A könnyített megjelenítés be van kapcsolva.
      <button onClick={() => setHidden(true)}>Rendben</button>
    </div>
  );
}
