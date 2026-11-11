// Botón/gesto "atrás" del sistema (Android). Orden:
// 1) cierra la hoja abierta; 2) pulsa el "atrás" de la pantalla; 3) vuelve a Hoy;
// 4) en Hoy, la primera vez avisa y solo la segunda (en 2 s) sale de la app.
import { app, ir, aviso } from './estado.svelte.js';

const hojas = []; // funciones de cierre de las hojas abiertas, la última arriba
export function registrarHoja(cerrar) {
  hojas.push(cerrar);
  return () => { const i = hojas.lastIndexOf(cerrar); if (i >= 0) hojas.splice(i, 1); };
}

const VENTANA = 2000;
let armado = false;
let rearme = null;

function armar() {
  if (armado) return;
  history.pushState({ pare: true }, '');
  armado = true;
}

function manejar() {
  armado = false;
  if (hojas.length) { hojas.at(-1)?.(); return armar(); }
  const boton = document.querySelector('[data-atras]');
  if (boton) { boton.click(); return armar(); }
  if (app.vista) {
    // Pantallas sin flecha propia (tu plan recién generado, fin de sesión): no se abandonan por accidente.
    if (!['plan', 'fin', 'test'].includes(app.vista.nombre)) app.vista = null;
    return armar();
  }
  if (app.tab !== 'hoy') { ir('hoy'); return armar(); }
  // En Hoy: sin entrada de guarda durante 2 s, así la siguiente pulsación sale de la app.
  aviso('Pulsa otra vez para salir');
  clearTimeout(rearme);
  rearme = setTimeout(armar, VENTANA);
}

export function iniciarAtras() {
  window.addEventListener('popstate', manejar);
  // Chrome ignora entradas añadidas sin interacción: armamos con el primer toque y tras cada uno si hace falta.
  window.addEventListener('pointerdown', armar, { capture: true });
}
