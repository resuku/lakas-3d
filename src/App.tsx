import { Viewport } from './scene/RoomScene';
import { BottomPanel } from './ui/BottomPanel';
import { Sidebar } from './ui/Sidebar';
import { useStore } from './store';
import { InspectTip, useInspectKeys } from './scene/Inspector';
import { HelpOverlay, SmallScreenNotice } from './ui/HelpOverlay';

function ViewHeader({ side }: { side: 'a' | 'b' }) {
  const variants = useStore((s) => s.variants);
  const id = useStore((s) => (side === 'a' ? s.activeId : s.compareId));
  const set = useStore((s) => (side === 'a' ? s.setActive : s.setCompare));
  return (
    <div className="view-header">
      <b>{side.toUpperCase()}</b>
      <select value={id} onChange={(e) => set(e.target.value)}>
        {variants.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>
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

export default function App() {
  useInspectKeys();
  const viewMode = useStore((s) => s.viewMode);
  const activeId = useStore((s) => s.activeId);
  const compareId = useStore((s) => s.compareId);
  const compare = viewMode === 'compare';
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <div className={`viewports ${compare ? 'compare' : ''}`}>
          <div className="viewport">
            {compare && <ViewHeader side="a" />}
            <Viewport variantId={activeId} viewId="a" />
            <WalkHint />
          </div>
          {compare && (
            <div className="viewport">
              <ViewHeader side="b" />
              <Viewport variantId={compareId} viewId="b" />
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
