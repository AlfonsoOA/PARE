// Avisos del día (pantalla Hoy). Tono: el dato primero y, cuando cabe, la gracia; en salud, nada de bromas.
import { app, hoyISO } from './estado.svelte.js';
import { ej, GRUPOS, NOMBRE_GRUPO } from './catalogo.js';
import { estadoEjercicio, historialEjercicio, volumenPlanificado, banda } from './entreno.js';
import { sesionEsquivada, pesoEnFecha, diasSinEntrenar } from './sesiones.js';

export function estadosEjercicios(d = app.datos) {
  const ids = new Set(d.rutina?.sesiones.flatMap((s) => s.items.map((i) => i.ej)) ?? []);
  for (const s of d.sesiones) for (const x of s.ejercicios) ids.add(x.ej);
  const out = {};
  for (const id of ids) {
    const h = historialEjercicio(d.sesiones, id, (f) => pesoEnFecha(f, d));
    out[id] = { hist: h, ...estadoEjercicio(h, d.perfil.nivel, d.perfil.faseDieta, hoyISO()) };
  }
  return out;
}

export function avisosDeHoy() {
  const d = app.datos;
  const out = [];
  if (d.cambiosPropuestos) out.push({ id: 'cambios', tipo: 'accion', texto: d.cambiosPropuestos.compartida ? 'Tienes una rutina compartida pendiente de abrir.' : 'Tu entrenador te propone cambios.', accion: { nombre: 'cambios' } });
  const esq = sesionEsquivada(d);
  if (esq) out.push({ ...esq, tipo: 'pique' });
  const dias = diasSinEntrenar(d);
  if (dias != null && dias >= 7 && d.rutina && ((d.secuencia.pendientes?.length ?? 0) > 0 || d.secuencia.siguiente)) {
    out.push({ id: `retomar-${d.sesiones.at(-1).fecha}`, tipo: 'retomar', texto: `Llevas ${dias} días sin entrenar. ¿Retomamos la rutina desde el principio?` });
  }
  const est = estadosEjercicios(d);
  for (const [id, e] of Object.entries(est)) {
    const n = ej(id)?.n;
    if (!n) continue;
    if (e.estado === 'estancado') out.push({ id: `estanca-${id}-${Math.floor(e.dias / 7)}`, tipo: 'dato', texto: `${n}: ${Math.floor(e.dias / 7)} semanas sin mejorar. Toca cambiar algo: rango, variante o descanso.`, accion: { nombre: 'progresoEj', id } });
    if (e.estado === 'bajando') out.push({ id: `baja-${id}-${e.hist.length}`, tipo: 'dato', texto: `${n}: tus últimas sesiones están por debajo de tu mejor marca. Revisa descanso, sueño y comida.`, accion: { nombre: 'progresoEj', id } });
  }
  if (d.rutina) {
    const v = volumenPlanificado(d.rutina, d.perfil.diasSemana);
    for (const g of ['pecho', 'espalda', 'hombros', 'piernas']) {
      if (v[g] > banda(g, d.perfil.diasSemana).max + 2) out.push({ id: `volalto-${g}-${d.rutina.version}`, tipo: 'dato', texto: `${NOMBRE_GRUPO[g]}: ${v[g]} series a la semana en tu rutina. Más no es mejor, es más cansancio.` });
      if (v[g] < banda(g, d.perfil.diasSemana).min - 2) out.push({ id: `volbajo-${g}-${d.rutina.version}`, tipo: 'dato', texto: `${NOMBRE_GRUPO[g]}: ${v[g]} series a la semana en tu rutina. Se queda corta.` });
    }
  }
  const ult = d.ajustes.ultimaCopia;
  const diasCopia = ult ? (Date.now() - new Date(ult)) / 864e5 : null;
  if (d.sesiones.length >= 3 && (diasCopia == null || diasCopia > (d.ajustes.recordatorioCopiaDias || 14))) {
    out.push({ id: `copia-${hoyISO()}`, tipo: 'accion', texto: diasCopia == null ? 'Aún no has hecho ninguna copia de seguridad. Si pierdes el móvil, pierdes esto.' : `Hace ${Math.floor(diasCopia)} días de tu última copia. Si pierdes el móvil, pierdes esto.`, accion: { nombre: 'archivo', acento: 'yo' } });
  }
  return out.filter((a) => !d.avisosDescartados[a.id]);
}
export function descartar(id) { app.datos.avisosDescartados[id] = hoyISO(); }
export { GRUPOS };
