import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-800.css';
import './estilos.css';
import { mount } from 'svelte';
import App from './App.svelte';

mount(App, { target: document.getElementById('app') });

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  // Cuando se publica una versión nueva, recarga sola (salvo en mitad de una sesión: lo hará al salir).
  let recargada = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (recargada) return;
    const recargar = () => { if (!recargada) { recargada = true; location.reload(); } };
    if (document.querySelector('.sesion')) document.addEventListener('visibilitychange', recargar, { once: true });
    else recargar();
  });
}
