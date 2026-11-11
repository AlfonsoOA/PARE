// Secuencia de sesiones, sesión en curso y cierre de sesión.
import { app, uuid, hoyISO } from './estado.svelte.js';
import { ej } from './catalogo.js';
import { duracionSesion, proponerSiguiente, usaPesoCorporal } from './entreno.js';

// ---------- Secuencia: lo que toca ----------
export function sesionPropuesta(d = app.datos) {
  const r = d.rutina;
  if (!r?.sesiones?.length) return null;
  const sec = d.secuencia;
  const n = r.sesiones.length;
  const pend = (sec.pendientes || []).filter((i) => i < n);
  const idx = pend.length ? pend[0] : (sec.siguiente ?? 0) % n;
  return { idx, sesion: r.sesiones[idx], pendiente: pend.length > 0 };
}
/** Registra que se ha hecho la sesión `j` y deja pendiente la que tocaba si era otra. */
export function marcarHecha(j) {
  const sec = app.datos.secuencia;
  const n = app.datos.rutina.sesiones.length;
  sec.pendientes ||= [];
  sec.saltos ||= {};
  const prop = sesionPropuesta();
  const r = app.datos.rutina;
  if (sec.pendientes.includes(j)) {
    sec.pendientes.splice(sec.pendientes.indexOf(j), 1);
  } else {
    const tocaba = (sec.siguiente ?? 0) % n;
    if (j !== tocaba && !sec.pendientes.includes(tocaba)) sec.pendientes.push(tocaba);
    sec.siguiente = (j + 1) % n;
  }
  if (prop && prop.idx !== j) {
    const id = r.sesiones[prop.idx].id;
    sec.saltos[id] = (sec.saltos[id] || 0) + 1;
  }
  sec.saltos[r.sesiones[j].id] = 0;
}
export function retomarDesdeElPrincipio() {
  app.datos.secuencia = { siguiente: 0, pendientes: [], saltos: {} };
}
export function diasSinEntrenar(d = app.datos) {
  const ult = d.sesiones.at(-1);
  if (!ult) return null;
  return Math.floor((new Date(hoyISO()) - new Date(ult.fecha)) / 864e5);
}
/** Aviso de sesión esquivada (dos veces seguidas). */
export function sesionEsquivada(d = app.datos) {
  const r = d.rutina;
  if (!r) return null;
  for (const s of r.sesiones) {
    const n = d.secuencia.saltos?.[s.id] || 0;
    if (n >= 2) {
      const ultima = [...d.sesiones].reverse().find((x) => x.sesionId === s.id);
      const dias = ultima ? Math.floor((new Date(hoyISO()) - new Date(ultima.fecha)) / 864e5) : null;
      const nombre = /pierna/i.test(s.nombre) ? 'la pierna' : `«${s.nombre}»`;
      const ella = /pierna/i.test(s.nombre) ? ' Ella no se olvida de ti.' : '';
      const tiempo = dias != null && dias >= 14 ? `${Math.floor(dias / 7)} semanas` : `${n} veces seguidas`;
      return { id: `esquiva-${s.id}-${n}`, texto: `Llevas ${tiempo} esquivando ${nombre}.${ella}` };
    }
  }
  return null;
}

// ---------- Sesión en curso ----------
export function pesoEnFecha(fecha, d = app.datos) {
  const ms = d.medidas.filter((m) => m.peso && m.fecha <= fecha);
  return (ms.at(-1) ?? d.medidas.find((m) => m.peso))?.peso ?? null;
}
export function ultimaVez(idEj, d = app.datos) {
  for (let i = d.sesiones.length - 1; i >= 0; i--) {
    const x = d.sesiones[i].ejercicios.find((e) => e.ej === idEj && e.series.some((z) => z.hecha));
    if (x) return { fecha: d.sesiones[i].fecha, series: x.series.filter((z) => z.hecha) };
  }
  return null;
}
function repsObjetivo(it, previa, k) {
  const z = previa?.series?.[k];
  if (z && it.carga != null && (z.carga ?? 0) === (it.carga ?? 0)) return Math.min(it.repMax, (z.reps || it.repMin) + 1);
  return it.repMin;
}
export function nuevaSerie(it, previa, k) {
  return { carga: it.carga, reps: repsObjetivo(it, previa, k), hecha: false, rir: null };
}
export function iniciarSesion(idx, items = null, nombre = null) {
  const r = app.datos.rutina;
  const s = idx != null ? r.sesiones[idx] : null;
  const base = items ?? s?.items ?? [];
  app.sesionActiva = {
    id: uuid(), fecha: hoyISO(), inicio: Date.now(), sesionIdx: idx, sesionId: s?.id ?? null,
    nombre: nombre ?? s?.nombre ?? 'Sesión libre', rutinaVersion: r?.version ?? null,
    estimada: duracionSesion(base, app.datos.ajustes),
    ejercicios: base.map((it) => {
      const previa = ultimaVez(it.ej);
      return {
        uid: it.uid ?? uuid(), ej: it.ej, unir: !!it.unir, descanso: it.descanso,
        objetivo: { series: it.series, repMin: it.repMin, repMax: it.repMax, carga: it.carga },
        series: Array.from({ length: it.series }, (_, k) => nuevaSerie(it, previa, k)),
      };
    }),
    descanso: null,
  };
  app.vista = { nombre: 'sesion', acento: 'entrenar' };
}
export function terminarSesion() {
  const sa = app.sesionActiva;
  if (!sa) return;
  const hecha = {
    id: sa.id, fecha: sa.fecha, inicio: new Date(sa.inicio).toISOString(), duracion: Math.round((Date.now() - sa.inicio) / 1000),
    estimada: sa.estimada, sesionId: sa.sesionId, nombre: sa.nombre, rutinaVersion: sa.rutinaVersion,
    ejercicios: sa.ejercicios.map((x) => ({ uid: x.uid, ej: x.ej, unir: x.unir, objetivo: x.objetivo, series: x.series.map((z) => ({ ...z })) })),
    nota: '', sensacion: null,
  };
  app.datos.sesiones.push(hecha);
  app.datos.sesiones.sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (sa.sesionIdx != null && app.datos.rutina) marcarHecha(sa.sesionIdx);
  app.sesionActiva = null;
  app.vista = { nombre: 'fin', id: hecha.id, acento: 'entrenar' };
}
export function cancelarSesion() {
  app.sesionActiva = null;
  app.vista = null;
}

/** Propuestas "para la próxima" de una sesión hecha, ítem a ítem de la rutina. */
export function propuestasPara(sesionHecha) {
  const r = app.datos.rutina;
  const ses = r?.sesiones.find((s) => s.id === sesionHecha.sesionId);
  if (!ses) return [];
  return ses.items.map((it) => {
    const hecho = sesionHecha.ejercicios.find((x) => x.uid === it.uid) ?? sesionHecha.ejercicios.find((x) => x.ej === it.ej);
    const { prop, motivo, sube } = proponerSiguiente(it, hecho, app.datos.ajustes);
    return { uid: it.uid, ej: it.ej, prop: { ...prop }, motivo, sube, bw: usaPesoCorporal(ej(it.ej)) };
  });
}
