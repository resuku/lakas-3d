import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { furnitureFit } from './lib/furnitureFit';

// Fejlesztői segéd a képernyőkép- és galériaszkriptekhez (scripts/shot.mjs „eval” lépés)
if (import.meta.env.DEV) Object.assign(window, { __lakas: { furnitureFit } });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
