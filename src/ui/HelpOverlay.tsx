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
            A 3D nézet fölötti <b>eszköztáron</b>: a <b>helyiség gombjai</b>, a kész <b>nézőpontok</b> (pl. „Erkély felől”), a <b>fényjelenet</b> (nappal, este…), a <b>Nézet</b> és a <b>Rétegek</b> menü (pl. bútorok, ajtók nyitva) és a képernyőkép.
          </li>
          <li>
            <b>Teljes lakás</b>: minden helyiség a helyén. <b>Bejárás</b>: séta szemmagasságban – <b>W A S D</b> vagy nyilak, egérhúzással körbenézés, Esc: kilépés.
          </li>
          <li>
            <b>Alt</b> nyomva tartva (vagy <b>I</b>): az egér alatti elem – fal, padló, ajtó, lámpa, bútor – pontos terméke; <b>Ctrl</b> (Macen <b>⌘</b>) + kattintás: a termék oldala új lapon. Egy lámpára kattintva ki- és bekapcsol.
          </li>
          <li>
            <b>T</b>: <b>termékhű nézet</b> be/ki – semleges stúdiófényben a szemből látott felület a katalógus (termékfotó) színét mutatja. A fényjelenet azt mutatja, milyen lesz a lakás fényében.
          </li>
        </ul>
        <h3>Javaslatok</h3>
        <ul>
          <li>
            Az oldalsáv tetején választható a <b>javaslat</b>, stílusvonalak szerint csoportosítva: fekete/antracit, skandináv, melegebb világos, japandi, egyéb, alul a meglévő padlót megtartók. A hozzá illő világítás és bútorok magától betöltődnek. A <b>Leírás és vélemények</b> alatt olvasható, mit tartalmaz. Az esti hatást az eszköztár fényjelenetével nézd meg.
          </li>
          <li>
            A <b>Berendezés</b> fül <b>Illő bútorszínek</b> csoportja mutatja, milyen színű kanapé és bútor illik az adott javaslathoz.
          </li>
          <li>
            Bátran kísérletezz: a <b>Másolat</b> gombbal saját változatot készíthetsz. A <b>Felületek</b> fülön egy sorra (fal, padló, ajtó…) kattintva nyílik a katalógus; a <b>Vissza</b> gomb (vagy Esc) visz vissza a listához.
          </li>
        </ul>
        <h3>Berendezés és dekor</h3>
        <ul>
          <li>
            A <b>Berendezés</b> fülön választható a kanapé (egyenes vagy L alakú), a TV alatti szekrény vagy TV-fal, az asztal és az ágy, hozzájuk valós termék is (<b>◆</b> a javaslathoz illő, <b>★</b> a tervezet).
          </li>
          <li>
            Néhány javaslatnál (J1, J2, J3) a javaslat alatt <b>aljavaslat</b> is választható (pl. J1-B): ugyanaz a szín- és anyagirány, más bútorokkal és előre elrendezett dekorral. A saját dekor megmarad.
          </li>
          <li>
            A <b>⚠ Elüt a javaslat színvilágától</b> jelzés olyan bútort vagy dekort mutat, amelynek a színe ehhez a javaslathoz kerülendő – figyelmeztetés, nem tiltás.
          </li>
          <li>
            A Berendezés fül <b>Dekor</b> csoportjában növény, kép, tükör vagy akusztikus panel tehető ki: válaszd ki, a halvány előnézettel keresd meg a helyét, és kattints (Esc: mégse). Mozgatás: <b>M</b> nyomva tartva húzd az elemet.
          </li>
        </ul>
        <h3>Véleményezés</h3>
        <ul>
          <li>
            Jelöld a kedvenceidet a <b>☆ Kedvenc</b> gombbal; a <b>Leírás és vélemények</b> alatt írd be a <b>neved</b>, és írj megjegyzést a változathoz.
          </li>
          <li>
            A <b>Továbbiak</b> fülön a <b>Konfiguráció mentése</b> gombbal egy fájlba mented – ezt küldd vissza. A beállításaid ebben a böngészőben is megmaradnak.
          </li>
        </ul>
        <p className="note">A színek képernyős közelítések, a mennyiségek és árak becslések. A Súgó gombbal ez az ablak bármikor újra előhozható. A tervezői részletek (méretek, források, ellenőrzések) a Beállítások menüben kapcsolhatók be.</p>
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
