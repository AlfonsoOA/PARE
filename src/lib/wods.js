// CrossFit: WOD (formatos, biblioteca de referencia, identidad, comparación de resultados).
// Un WOD se compara solo con el mismo WOD y la misma escala, y nunca suma volumen de musculación.
import { app, uuid } from './estado.svelte.js';
import { ej } from './catalogo.js';

export const FORMATOS = {
  fortime: { n: 'For time', d: 'Terminar el trabajo lo antes posible (con tiempo límite)' },
  amrap: { n: 'AMRAP', d: 'Tantas rondas como puedas en un tiempo fijo' },
  emom: { n: 'EMOM', d: 'Cada minuto (o cada N), un trabajo; lo que sobra del minuto, descanso' },
  tabata: { n: 'Tabata / intervalos', d: 'Trabajo y descanso alternos (Tabata: 8 × 20 s / 10 s)' },
  carga: { n: 'Carga máxima', d: 'Buscar el máximo de un movimiento o complejo' },
  maxreps: { n: 'Máximas repeticiones', d: 'Cuantas más repeticiones mejor, en un tiempo o sin parar' },
};
export const UNIDADES = { reps: 'reps', m: 'm', cal: 'cal', s: 's' };
export const ESCALAS = { rx: 'RX', escalado: 'Escalado', personal: 'Personalizado' };

/** WOD vacío para el editor. */
export function wodNuevo(formato = 'fortime') {
  return { id: 'W-' + uuid(), nombre: '', formato, cap: formato === 'fortime' ? 15 * 60 : null, duracion: formato === 'amrap' ? 12 * 60 : formato === 'emom' ? 10 * 60 : null,
    intervalo: 60, rondas: formato === 'tabata' ? 8 : 1, esquema: null, trabajo: 20, descanso: 10, movimientos: [], notas: '' };
}
const mv = (ej, reps, extra = {}) => ({ ej, reps, unidad: 'reps', carga: null, cargaM: null, nota: '', ...extra });

// Biblioteca de WOD de referencia («Girls» y «Heroes» más conocidos). Cargas RX en kg (hombre / mujer).
export const BENCHMARKS = [
  { id: 'BM-fran', nombre: 'Fran', formato: 'fortime', cap: 10 * 60, esquema: [21, 15, 9], rondas: 1,
    movimientos: [mv('EJ0877', null, { carga: 43, cargaM: 29 }), mv('EJ0563', null)], notas: '21-15-9 de thrusters y dominadas.' },
  { id: 'BM-grace', nombre: 'Grace', formato: 'fortime', cap: 10 * 60, rondas: 1, movimientos: [mv('EJ0167', 30, { carga: 61, cargaM: 43 })], notas: '30 dos tiempos.' },
  { id: 'BM-isabel', nombre: 'Isabel', formato: 'fortime', cap: 10 * 60, rondas: 1, movimientos: [mv('EJ0719', 30, { carga: 61, cargaM: 43 })], notas: '30 arrancadas.' },
  { id: 'BM-diane', nombre: 'Diane', formato: 'fortime', cap: 12 * 60, esquema: [21, 15, 9], rondas: 1,
    movimientos: [mv('EJ0047', null, { carga: 102, cargaM: 70 }), mv('EJ0313', null)], notas: '21-15-9 de peso muerto y flexiones en pino.' },
  { id: 'BM-elizabeth', nombre: 'Elizabeth', formato: 'fortime', cap: 12 * 60, esquema: [21, 15, 9], rondas: 1,
    movimientos: [mv('EJ0163', null, { carga: 61, cargaM: 43 }), mv('EJ0603', null)], notas: '21-15-9 de cargadas y fondos en anillas.' },
  { id: 'BM-helen', nombre: 'Helen', formato: 'fortime', cap: 20 * 60, rondas: 3,
    movimientos: [mv('EJ0923', 400, { unidad: 'm' }), mv('EJ0892', 21, { carga: 24, cargaM: 16 }), mv('EJ0563', 12)], notas: '3 rondas.' },
  { id: 'BM-cindy', nombre: 'Cindy', formato: 'amrap', duracion: 20 * 60, rondas: 1,
    movimientos: [mv('EJ0563', 5), mv('EJ0571', 10), mv('EJ0095', 15)], notas: 'AMRAP 20 minutos.' },
  { id: 'BM-mary', nombre: 'Mary', formato: 'amrap', duracion: 20 * 60, rondas: 1,
    movimientos: [mv('EJ0313', 5), mv('EJ0900', 10), mv('EJ0563', 15)], notas: 'AMRAP 20 minutos.' },
  { id: 'BM-chelsea', nombre: 'Chelsea', formato: 'emom', duracion: 30 * 60, intervalo: 60, rondas: 1,
    movimientos: [mv('EJ0563', 5), mv('EJ0571', 10), mv('EJ0095', 15)], notas: 'EMOM 30 minutos.' },
  { id: 'BM-annie', nombre: 'Annie', formato: 'fortime', cap: 15 * 60, esquema: [50, 40, 30, 20, 10], rondas: 1,
    movimientos: [mv('EJ0920', null), mv('EJ0904', null)], notas: '50-40-30-20-10 de dobles combas y sit-ups.' },
  { id: 'BM-karen', nombre: 'Karen', formato: 'fortime', cap: 15 * 60, rondas: 1, movimientos: [mv('EJ0927', 150, { carga: 9, cargaM: 6 })], notas: '150 wall balls.' },
  { id: 'BM-jackie', nombre: 'Jackie', formato: 'fortime', cap: 15 * 60, rondas: 1,
    movimientos: [mv('EJ0614', 1000, { unidad: 'm' }), mv('EJ0877', 50, { carga: 20, cargaM: 15 }), mv('EJ0563', 30)] },
  { id: 'BM-nancy', nombre: 'Nancy', formato: 'fortime', cap: 25 * 60, rondas: 5,
    movimientos: [mv('EJ0923', 400, { unidad: 'm' }), mv('EJ0526', 15, { carga: 43, cargaM: 29 })], notas: '5 rondas.' },
  { id: 'BM-kelly', nombre: 'Kelly', formato: 'fortime', cap: 40 * 60, rondas: 5,
    movimientos: [mv('EJ0923', 400, { unidad: 'm' }), mv('EJ0287', 30, { nota: 'cajón 60/50 cm' }), mv('EJ0927', 30, { carga: 9, cargaM: 6 })], notas: '5 rondas.' },
  { id: 'BM-dt', nombre: 'DT', formato: 'fortime', cap: 20 * 60, rondas: 5,
    movimientos: [mv('EJ0047', 12, { carga: 70, cargaM: 47 }), mv('EJ0879', 9, { carga: 70, cargaM: 47 }), mv('EJ0880', 6, { carga: 70, cargaM: 47 })], notas: '5 rondas, la misma barra.' },
  { id: 'BM-murph', nombre: 'Murph', formato: 'fortime', cap: 70 * 60, rondas: 1,
    movimientos: [mv('EJ0923', 1600, { unidad: 'm' }), mv('EJ0563', 100), mv('EJ0571', 200), mv('EJ0095', 300), mv('EJ0923', 1600, { unidad: 'm' })],
    notas: 'RX con chaleco de 9 kg (6 kg mujeres). Las dominadas, flexiones y sentadillas se pueden repartir como quieras.' },
  { id: 'BM-tabata-sent', nombre: 'Tabata de sentadillas', formato: 'tabata', rondas: 8, trabajo: 20, descanso: 10, movimientos: [mv('EJ0095', null)], notas: 'Puntúa la ronda más baja.' },
];

const wodPorId = new Map(BENCHMARKS.map((w) => [w.id, w]));
/** WOD guardado por id: biblioteca de referencia o los propios (guardados o recibidos). */
export function wodGuardado(id) {
  return wodPorId.get(id) ?? (app.datos.wodsGuardados || []).find((w) => w.id === id) ?? null;
}
export const wodsPropios = () => app.datos.wodsGuardados || [];

/** Identidad de un WOD: mismo formato, movimientos, repeticiones, cargas y tiempos. Los de referencia, por su nombre. */
export function claveWod(w) {
  if (w.id?.startsWith('BM-') && wodPorId.has(w.id)) return w.id;
  const m = (w.movimientos || []).map((x) => [x.ej, x.reps, x.unidad, x.carga].join(':')).join('|');
  return [w.formato, w.cap, w.duracion, w.intervalo, w.rondas, (w.esquema || []).join('-'), w.trabajo, w.descanso, m].join('#');
}

/** Repeticiones de una ronda completa (para pasar un AMRAP a repeticiones totales). */
export function repsPorRonda(w) {
  return (w.movimientos || []).reduce((s, x) => s + (+x.reps || 0), 0) || 1;
}

/** Número para ordenar resultados del mismo WOD y escala: mayor = mejor. */
export function puntos(w, r) {
  if (!r) return -Infinity;
  switch (w.formato) {
    case 'fortime': return r.cap ? -1e7 + (+r.reps || 0) : -(+r.tiempo || 1e7); // terminar siempre gana a un CAP
    case 'amrap': return (+r.rondas || 0) * repsPorRonda(w) + (+r.reps || 0);
    case 'emom': return (+r.intervalos || 0) * 1000 + (+r.carga || 0);
    case 'tabata': return r.porRonda?.length ? Math.min(...r.porRonda.map(Number)) * 1000 + r.porRonda.reduce((a, b) => a + +b, 0) : +r.total || 0;
    case 'carga': return +r.carga || 0;
    case 'maxreps': return +r.reps || 0;
    default: return 0;
  }
}

export const reloj = (s) => { s = Math.max(0, Math.round(+s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

/** Resultado en texto: «4:32», «CAP + 12», «7 + 12», «28/30 intervalos», «85 kg»… */
export function textoResultado(w, r) {
  if (!r) return '—';
  switch (w.formato) {
    case 'fortime': return r.cap ? `CAP + ${r.reps || 0} reps` : reloj(r.tiempo);
    case 'amrap': return `${r.rondas || 0} + ${r.reps || 0}`;
    case 'emom': return `${r.intervalos ?? 0}/${totalIntervalos(w)} intervalos${r.carga ? ` · ${r.carga} kg` : ''}`;
    case 'tabata': return r.porRonda?.length ? `${Math.min(...r.porRonda.map(Number))} (total ${r.porRonda.reduce((a, b) => a + +b, 0)})` : `${r.total || 0} reps`;
    case 'carga': return `${r.carga || 0} kg`;
    case 'maxreps': return `${r.reps || 0} reps`;
    default: return '';
  }
}
export const totalIntervalos = (w) => Math.max(1, Math.round((w.duracion || 600) / (w.intervalo || 60)));

/** Descripción corta del WOD: «21-15-9 · Thruster con barra 43/29 kg · Dominadas». */
export function resumenWod(w) {
  const f = FORMATOS[w.formato]?.n ?? w.formato;
  const tiempo = w.formato === 'amrap' || w.formato === 'emom' ? ` ${Math.round((w.duracion || 0) / 60)} min` : w.formato === 'tabata' ? ` ${w.rondas} × ${w.trabajo}/${w.descanso} s` : w.cap ? ` (cap ${Math.round(w.cap / 60)} min)` : '';
  const rondas = w.esquema?.length ? `${w.esquema.join('-')} · ` : w.rondas > 1 && w.formato === 'fortime' ? `${w.rondas} rondas · ` : '';
  const movs = (w.movimientos || []).map((x) => `${x.reps ? `${x.reps}${x.unidad !== 'reps' ? ` ${x.unidad}` : ''} ` : ''}${ej(x.ej)?.n ?? x.ej}${x.carga ? ` ${x.carga}${x.cargaM ? `/${x.cargaM}` : ''} kg` : ''}`).join(' · ');
  return `${f}${tiempo} · ${rondas}${movs}`;
}

/** Resultados guardados de un WOD (misma clave), del más reciente al más antiguo. */
export function historialWod(clave, sesiones = app.datos.sesiones) {
  return sesiones.filter((s) => s.tipo === 'wod' && s.clave === clave).slice().reverse();
}
/** Mejor resultado por escala. */
export function mejoresWod(clave, sesiones = app.datos.sesiones) {
  const out = {};
  for (const s of sesiones) {
    if (s.tipo !== 'wod' || s.clave !== clave) continue;
    const p = puntos(s.wod, s.resultado);
    if (!out[s.escala] || p > out[s.escala].p) out[s.escala] = { p, s };
  }
  return out;
}
/** Todos los WOD hechos, agrupados por clave, con su último resultado. */
export function wodsHechos(sesiones = app.datos.sesiones) {
  const m = new Map();
  for (const s of sesiones) {
    if (s.tipo !== 'wod') continue;
    const g = m.get(s.clave) ?? { clave: s.clave, wod: s.wod, n: 0, ultima: null };
    g.n++; g.ultima = s; g.wod = s.wod;
    m.set(s.clave, g);
  }
  return [...m.values()].sort((a, b) => b.ultima.fecha.localeCompare(a.ultima.fecha));
}

/** Guarda una copia del WOD en la biblioteca propia (para repetirlo). */
export function guardarWod(w) {
  app.datos.wodsGuardados ||= [];
  const copia = JSON.parse(JSON.stringify(w));
  if (!copia.id || copia.id.startsWith('BM-')) copia.id = 'W-' + uuid();
  const i = app.datos.wodsGuardados.findIndex((x) => x.id === copia.id);
  if (i >= 0) app.datos.wodsGuardados[i] = copia; else app.datos.wodsGuardados.unshift(copia);
  return copia;
}
