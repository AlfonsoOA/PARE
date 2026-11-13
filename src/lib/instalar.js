// Instalación como app (PWA) y enlace para compartir PARE.
export const URL_PARE = 'https://alfonsooa.github.io/PARE/';
// Formulario de opiniones (Google Forms de la cuenta de PARE). Vacío = el botón no se enseña.
export const URL_OPINION = 'https://forms.gle/A8E7SkMVsfASQ5wA9';

let aviso = null; // evento beforeinstallprompt (Chrome/Android): permite ofrecer un botón «Instalar»
const oyentes = new Set();
export function vigilarInstalacion() {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); aviso = e; oyentes.forEach((f) => f()); });
  window.addEventListener('appinstalled', () => { aviso = null; oyentes.forEach((f) => f()); });
}
export const puedeInstalar = () => !!aviso;
export function alCambiar(f) { oyentes.add(f); return () => oyentes.delete(f); }
export async function instalar() {
  if (!aviso) return false;
  aviso.prompt();
  const r = await aviso.userChoice.catch(() => null);
  aviso = null; oyentes.forEach((f) => f());
  return r?.outcome === 'accepted';
}
export const instalada = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

export function plataforma() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'otro';
}
/** Navegador dentro de otra app (Instagram, WhatsApp, lector de QR…): no deja instalar. */
export const navegadorInterno = () => /FBAN|FBAV|Instagram|Line\/|WhatsApp|wv\)|GSA\//i.test(navigator.userAgent);

export async function compartirPare() {
  const datos = { title: 'PARE · Pain and Reward', text: 'PARE: rutina, dieta y progreso, gratis y sin cuentas. Earn your reward.', url: URL_PARE };
  try {
    if (navigator.share) { await navigator.share(datos); return 'compartido'; }
  } catch (e) { if (e?.name === 'AbortError') return 'cancelado'; }
  try { await navigator.clipboard.writeText(URL_PARE); return 'copiado'; } catch { return 'nada'; }
}
