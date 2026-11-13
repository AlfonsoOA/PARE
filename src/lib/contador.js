// Contador anónimo (GoatCounter, sin cookies ni datos personales): solo «+1» de unos pocos eventos.
// Ningún dato de entreno, dieta, peso ni encuestas sale del móvil.
const URL_CONTADOR = 'https://pare.goatcounter.com/count';
const ACTIVO = location.hostname === 'alfonsooa.github.io'; // en pruebas y en local no cuenta

function contar(evento) {
  if (!ACTIVO) return;
  try {
    const q = new URLSearchParams({ p: evento, t: evento, e: 'true', rnd: Math.random().toString(36).slice(2) });
    new Image().src = `${URL_CONTADOR}?${q}`;
  } catch { /* sin conexión o bloqueado: no pasa nada */ }
}
const marca = (k) => { try { return localStorage.getItem('pare-cnt-' + k); } catch { return null; } };
const marcar = (k, v = '1') => { try { localStorage.setItem('pare-cnt-' + k, v); } catch { /* sin almacenamiento */ } };

function semanaISO(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dia = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dia);
  const ini = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `${t.getUTCFullYear()}-S${String(Math.ceil(((t - ini) / 864e5 + 1) / 7)).padStart(2, '0')}`;
}

/** Al arrancar: persona nueva (una vez por móvil), entrada por el cartel, instalada y activa esta semana. */
export function contarArranque() {
  const params = new URLSearchParams(location.search);
  const desdeCartel = params.get('o') === 'cartel';
  if (desdeCartel) {
    contar('cartel');
    params.delete('o');
    try { history.replaceState(history.state, '', location.pathname + (params.toString() ? `?${params}` : '') + location.hash); } catch { /* da igual */ }
  }
  if (!marca('nuevo')) { contar(desdeCartel ? 'nuevo-cartel' : 'nuevo'); marcar('nuevo'); }
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
  if (standalone && !marca('instalada')) { contar('instalada'); marcar('instalada'); }
  window.addEventListener('appinstalled', () => { if (!marca('instalada')) { contar('instalada'); marcar('instalada'); } });
  const s = semanaISO();
  if (marca('semana') !== s) { contar('activo-semana'); marcar('semana', s); }
}
