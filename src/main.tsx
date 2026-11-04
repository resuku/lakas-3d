import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { furnitureFit } from './lib/furnitureFit';
import { useStore } from './store';
import { suggestFurniture } from './lib/furnitureSets';

// Fejlesztői segéd a képernyőkép-szkripthez (scripts/shot.mjs „eval” / „dumpEval” lépés)
if (import.meta.env.DEV) Object.assign(window, { __lakas: { furnitureFit, suggestFurniture, store: useStore } });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
