import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { seedInitialDataIfNeeded } from './db/seed'

// Inicializar Dexie con datos semilla si es primera vez
seedInitialDataIfNeeded().catch(console.error);

// Solicitar al navegador persistencia permanente de IndexedDB en disco
if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
