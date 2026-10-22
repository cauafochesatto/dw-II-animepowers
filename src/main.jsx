import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Service Worker (PWA offline). O caminho precisa respeitar o `base` do Vite
// — em produção a aplicação é servida em /poderesanime/.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // offline continua funcionando sem service worker; sem erro no console
    });
  });
}
