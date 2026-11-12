// Adherencia: encuesta quincenal (preguntas adaptadas de PDAQ, EARS y SRBAI), métricas automáticas
// y contraste entre lo que se come (anotado o pautado) y lo que dice la báscula.
import { app, hoyISO } from './estado.svelte.js';
import { sumar } from './dieta.js';

export const CADA_DIAS = 14;
const dia = 864e5;
const menosDias = (iso, n) => new Date(Date.parse(iso + 'T12:00:00') - n * dia).toISOString().slice(0, 10);
const diasEntre = (a, b) => Math.round((Date.parse(b + 'T12:00:00') - Date.parse(a + 'T12:00:00')) / dia);

// ---------- Preguntas (todo de tocar, nada que escribir) ----------
// Dieta, adaptadas del PDAQ: días de los últimos 7 (0-7).
export const P_DIETA = [
  { id: 'd1', t: 'En los últimos 7 días, ¿cuántos días seguiste tu plan de comidas?' },
  { id: 'd2', t: '¿Cuántos días comiste más de la cuenta o picoteaste fuera del plan?', inversa: true },
];
// Entreno, adaptadas de la EARS (conducta): acuerdo 1-5.
export const P_ENTRENO = [
  { id: 'e1', t: 'Hice los ejercicios y las series tal como estaban pautados.' },
  { id: 'e2', t: 'Recorté o me salté ejercicios dentro de las sesiones.', inversa: true },
];
// Hábito, adaptadas del SRBAI (automaticidad): acuerdo 1-5.
export const P_HABITO = [
  { id: 'h1', t: 'Ir a entrenar es algo que hago sin tener que acordarme.' },
  { id: 'h2', t: 'Entrenar es algo que hago casi en automático.' },
  { id: 'h3', t: 'Comer según mi plan es algo que hago sin pensarlo.' },
];
export const ACUERDO = [[1, 'Nada'], [2, 'Poco'], [3, 'A medias'], [4, 'Bastante'], [5, 'Totalmente']];
// Estado de las dos semanas: 1-5.
export const P_ESTADO = [
  { id: 'hambre', t: 'Hambre', escala: [[1, 'Ninguna'], [2, 'Poca'], [3, 'Normal'], [4, 'Bastante'], [5, 'Mucha']] },
  { id: 'sueno', t: 'Sueño (cómo duermes)', escala: [[1, 'Fatal'], [2, 'Mal'], [3, 'Regular'], [4, 'Bien'], [5, 'Muy bien']] },
  { id: 'energia', t: 'Energía', escala: [[1, 'Por los suelos'], [2, 'Baja'], [3, 'Normal'], [4, 'Buena'], [5, 'A tope']] },
];

// ---------- Barreras y biblioteca de pautas ----------
export const BARRERAS = [
  ['tiempo', 'Falta de tiempo', [
    'Sesión exprés: haz solo los 1-2 básicos del día y una superserie. En 30 minutos cuenta como sesión.',
    'Cocina de una vez proteína y arroz o patata para 2-3 días (pollo al horno, legumbre cocida).',
  ]],
  ['cansancio', 'Cansancio', [
    'Si has dormido menos de 6 horas, baja una serie por ejercicio, pero no el peso.',
    'Entrena antes de sentarte en casa: ir directamente del trabajo cuesta mucho menos.',
  ]],
  ['hambre', 'Hambre', [
    'Pasa parte de las raciones a la comida en la que más hambre tengas (Mi dieta → raciones por comida).',
    'Proteína y verdura en cada comida, y un postre proteico (natillas, skyr) para el antojo dulce.',
  ]],
  ['picoteo', 'Picoteo', [
    'Lo que no hay en casa no se come: no compres lo que picas.',
    'Ten a mano picoteo de bajo coste: encurtidos, fruta, yogur proteico, gelatina sin azúcar.',
  ]],
  ['fuera', 'Comidas fuera o eventos', [
    'Elige carne o pescado a la plancha con guarnición; pan o postre, uno de los dos.',
    'Si sabes que hay cena, no llegues con hambre: proteína en la merienda y menos hidratos a mediodía.',
  ]],
  ['finde', 'Fin de semana', [
    'Mantén la hora de levantarte y el desayuno del plan también el sábado y el domingo.',
    'Una comida libre controlada, no un fin de semana libre.',
  ]],
  ['alcohol', 'Alcohol', [
    'Alterna cada bebida con agua y elige las que no llevan azúcar.',
    'Decide antes de salir cuántas vas a tomar; lo que no se decide, no se controla.',
  ]],
  ['molestias', 'Molestias o lesión', [
    'No entrenes con dolor: en la sesión, «Sustituir por otro» propone alternativas sin esa zona.',
    'Si la molestia dura más de 2 semanas, consulta con un fisioterapeuta.',
  ]],
  ['viajes', 'Viajes', [
    'Sesión libre de peso corporal de 20 minutos en el hotel o en casa.',
    'Proteína fácil en ruta: atún, pavo, yogur proteico, un puñado medido de frutos secos.',
  ]],
  ['motivacion', 'Motivación', [
    'Objetivo mínimo: ir y hacer solo el primer ejercicio. Casi siempre acabas la sesión.',
    'Mira tus récords en Progreso, o queda con alguien para entrenar: con compañía se falta menos.',
  ]],
  ['nada', 'Nada, todo bien', []],
];
export const NOMBRE_BARRERA = Object.fromEntries(BARRERAS.map(([id, l]) => [id, l]));
export const pautasDe = (id) => BARRERAS.find((b) => b[0] === id)?.[2] ?? [];

// ---------- Cuándo toca ----------
function inicioActividad(d) {
  const f = [d.sesiones[0]?.fecha, Object.keys(d.comidas || {}).sort()[0], d.medidas[0]?.fecha, d.creado?.slice(0, 10)].filter(Boolean).sort();
  return f[0] ?? hoyISO();
}
/** ¿Toca la encuesta? Cada 14 días desde la última (o desde que empezó a usar la app). */
export function encuestaPendiente(d = app.datos) {
  if (!d.rutina && !d.dieta) return false;
  const hoy = hoyISO();
  if (d.encuestaPospuesta && d.encuestaPospuesta >= hoy) return false;
  const base = d.encuestas?.at(-1)?.fecha ?? inicioActividad(d);
  return diasEntre(base, hoy) >= CADA_DIAS;
}
export const posponerEncuesta = (d = app.datos) => { d.encuestaPospuesta = hoyISO(); };

// ---------- Métricas automáticas (lo que la app ya sabe) ----------
export function metricasAuto(d = app.datos, hasta = hoyISO()) {
  const desde = menosDias(hasta, CADA_DIAS - 1);
  const dentro = (f) => f >= desde && f <= hasta;
  const hechas = d.sesiones.filter((s) => dentro(s.fecha)).length;
  const porSemana = (+d.perfil.diasSemana || 0) + (+d.perfil.diasWod || 0) || d.rutina?.sesiones.length || 0;
  const previstas = d.rutina ? porSemana * 2 : 0;
  const anotados = Object.keys(d.comidas || {}).filter((f) => dentro(f) && d.comidas[f]?.length).length;
  return { desde, hasta, hechas, previstas, anotados, dias: CADA_DIAS };
}

// ---------- Puntuaciones 0-100 ----------
const media = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const acuerdo01 = (v, inversa) => (v == null ? null : inversa ? (5 - v) / 4 : (v - 1) / 4);
export function puntuar(r, auto) {
  const pDieta = r.d1 != null ? 100 * (0.6 * (r.d1 / 7) + 0.4 * (1 - (r.d2 ?? 0) / 7)) : null;
  const items = media([acuerdo01(r.e1), acuerdo01(r.e2, true)].filter((x) => x != null));
  let pEntreno = null;
  if (auto?.previstas) pEntreno = 100 * (0.6 * Math.min(1, auto.hechas / auto.previstas) + 0.4 * (items ?? Math.min(1, auto.hechas / auto.previstas)));
  else if (items != null) pEntreno = 100 * items;
  const hab = media(['h1', 'h2', 'h3'].map((k) => acuerdo01(r[k])).filter((x) => x != null));
  const partes = [pDieta, pEntreno].filter((x) => x != null);
  const red = (x) => (x == null ? null : Math.round(x));
  return { dieta: red(pDieta), entreno: red(pEntreno), habito: red(hab == null ? null : 100 * hab), global: red(media(partes)) };
}
export const nivel = (p) => (p == null ? '' : p >= 80 ? 'Alta' : p >= 60 ? 'Media' : 'Baja');

export function guardarEncuesta(r, barreras, d = app.datos) {
  const auto = metricasAuto(d);
  const e = { fecha: hoyISO(), r: { ...r }, barreras: [...barreras], auto, puntos: puntuar(r, auto) };
  (d.encuestas ||= []).push(e);
  d.encuestaPospuesta = null;
  return e;
}

/** Barreras que se repiten en las últimas encuestas (las que piden pauta). */
export function barrerasFrecuentes(d = app.datos, n = 3) {
  const cuenta = {};
  for (const e of (d.encuestas || []).slice(-n)) for (const b of e.barreras || []) if (b !== 'nada') cuenta[b] = (cuenta[b] || 0) + 1;
  return Object.entries(cuenta).sort((a, b) => b[1] - a[1]).map(([id, veces]) => ({ id, veces }));
}

// ---------- Contraste con la báscula ----------
/**
 * Compara el cambio de peso esperado (por lo que comes frente a tu gasto estimado) con el real (recta de regresión
 * de las pesadas). Usa lo anotado si hay bastantes días; si no, lo pautado en la dieta (adherencia al plan).
 * 7.700 kcal ≈ 1 kg de peso corporal. Las pesadas sueltas varían por agua: por eso hace falta una ventana larga.
 */
export function contrasteBascula(d = app.datos, ventana = 28) {
  if (!d.dieta?.tdee) return { ok: false, motivo: 'Hace falta una dieta con gasto estimado (Yo → Mi dieta).' };
  const hasta = hoyISO(), desde = menosDias(hasta, ventana - 1);
  const ps = d.medidas.filter((m) => m.peso && m.fecha >= desde && m.fecha <= hasta);
  if (ps.length < 3 || diasEntre(ps[0].fecha, ps.at(-1).fecha) < 10) {
    return { ok: false, motivo: 'Hacen falta al menos 3 pesadas repartidas en 10 días o más (mejor 1-2 por semana, en ayunas).' };
  }
  // pendiente (kg/día) por mínimos cuadrados
  const x = ps.map((m) => diasEntre(ps[0].fecha, m.fecha)), y = ps.map((m) => m.peso);
  const mx = media(x), my = media(y);
  const sxx = x.reduce((s, v) => s + (v - mx) ** 2, 0);
  const pend = sxx ? x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0) / sxx : 0;
  const ini = ps[0].fecha, fin = ps.at(-1).fecha, n = diasEntre(ini, fin) + 1;
  const anot = Object.keys(d.comidas || {}).filter((f) => f >= ini && f <= fin && d.comidas[f]?.length);
  const modo = anot.length >= Math.max(7, 0.6 * n) ? 'anotado' : 'plan';
  const kcal = modo === 'anotado' ? media(anot.map((f) => sumar(d.comidas[f]).kcal)) : d.dieta.kcal;
  const esperado = ((kcal - d.dieta.tdee) * 7) / 7700; // kg/semana
  const real = pend * 7;
  const difKcal = Math.round(((real - esperado) * 7700) / 7 / 10) * 10; // + : la báscula va por encima de lo esperado
  const gastoReal = Math.round((kcal - pend * 7700) / 10) * 10;
  let lectura;
  if (Math.abs(difKcal) < 150) lectura = 'cuadra';
  else if (difKcal > 0) lectura = 'por_encima';
  else lectura = 'por_debajo';
  return { ok: true, modo, kcal: Math.round(kcal), tdee: d.dieta.tdee, esperado, real, difKcal, gastoReal, lectura, desde: ini, hasta: fin, pesadas: ps.length, diasAnotados: anot.length };
}
