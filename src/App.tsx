import { Viewport } from './scene/RoomScene';
import { BottomPanel } from './ui/BottomPanel';
import { Sidebar } from './ui/Sidebar';
import { useStore } from './store';
import { InspectTip, useInspectKeys, useMoveKey, useProductViewKey } from './scene/Inspector';
import { HelpOverlay, SmallScreenNotice } from './ui/HelpOverlay';

/** A két nézetes mód felirata: melyik nézet melyik oldalon (mindkettő az aktív javaslat). */
function ViewHeader({ studio }: { studio: boolean }) {
  const name = useStore((s) => s.variants.find((v) => v.id === s.activeId)?.name ?? '');
  return (
    <div className="view-header" title={studio ? 'Semleges stúdiófény: a szemből látott felület a katalógus (termékfotó) színét mutatja.' : 'A Világítás fül fényjelenete: milyen lesz a lakás fényében.'}>
      <b>{studio ? 'Termékhű nézet' : 'Fényjelenet'}</b>
      <span>{name}</span>
    </div>
  );
}

function WalkHint() {
  const walk = useStore((s) => s.walk);
  const setWalk = useStore((s) => s.setWalk);
  if (!walk) return null;
  return (
    <div className="walk-hint">
      <b>Bejárás</b> W A S D / nyilak: mozgás · egérhúzás: körbenézés · Shift: gyorsabban ·{' '}
      <button onClick={() => setWalk(false)}>Kilépés (Esc)</button>
    </div>
  );
}

/** A termékhű nézet jelzése a 3D nézet sarkában (képernyőképen is látszik, melyik nézet). */
function ProductViewBadge() {
  const on = useStore((s) => s.productView);
  const setViewer = useStore((s) => s.setViewer);
  if (!on) return null;
  return (
    <button className="mode-badge" onClick={() => setViewer({ productView: false })} title="Semleges stúdiófény: a szemből látott felület a katalógus színét mutatja. Kattintás vagy T: vissza a fényjelenethez.">
      Termékhű nézet · T
    </button>
  );
}

export default function App() {
  useInspectKeys();
  useMoveKey();
  useProductViewKey();
  const viewMode = useStore((s) => s.viewMode);
  const activeId = useStore((s) => s.activeId);
  const split = viewMode === 'split';
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <div className={`viewports ${split ? 'split' : ''}`}>
          <div className="viewport">
            {split && <ViewHeader studio={false} />}
            <Viewport variantId={activeId} viewId="a" studio={split ? false : undefined} />
            <WalkHint />
            {!split && <ProductViewBadge />}
          </div>
          {split && (
            <div className="viewport">
              <ViewHeader studio />
              <Viewport variantId={activeId} viewId="b" studio />
            </div>
          )}
        </div>
        <BottomPanel />
        <InspectTip />
        <HelpOverlay />
        <SmallScreenNotice />
      </main>
    </div>
  );
}
