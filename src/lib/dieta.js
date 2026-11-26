// Registro de comida: por raciones (fichas) o por pesada (alimentos y recetas).
import { app, uuid } from './estado.svelte.js';
import { cat } from './catalogo.js';
import { racionesDelDia } from './plan.js';

/** Anota desde qué día rigen las kcal de la dieta (lo usa el contraste con la báscula). */
export function marcarVigencia(nueva, antes) {
  const hoy = new Date().toLocaleDateString('sv-SE');
  nueva.kcalDesde = antes && antes.kcal === nueva.kcal && antes.kcalDesde ? antes.kcalDesde : hoy;
  return nueva;
}

export const GRUPOS_RACION = ['P', 'HC', 'G', 'fruta', 'lacteo'];
export const NOMBRE_RACION = { P: 'Proteína', HC: 'Hidratos', G: 'Grasa', fruta: 'Fruta', lacteo: 'Lácteo' };
export const DEF_RACION = { P: '25 g de proteína', HC: '40 g de hidratos', G: '10 g de grasa', fruta: '15 g de hidratos', lacteo: '1 vaso de leche o 2 yogures' };
// Macros medios de una ración marcada sin pesar.
const MEDIA = {
  P: { kcal: 130, p: 25, hc: 1, g: 3 }, HC: { kcal: 180, p: 5, hc: 40, g: 1 }, G: { kcal: 90, p: 0, hc: 0, g: 10 },
  fruta: { kcal: 60, p: 0.5, hc: 15, g: 0 }, lacteo: { kcal: 110, p: 8, hc: 11, g: 4 },
};

// Raciones equivalentes según los macros (25 g de proteína, 40 g de hidratos, 10 g de grasa): así cuadran siempre con las kcal,
// aunque un alimento mezcle macros (lácteos, legumbres, carnes grasas…) o no tenga ración definida.
export const racionesDeMacros = (t) => ({ P: (t.p || 0) / 25, HC: (t.hc || 0) / 40, G: (t.g || 0) / 10 });
/** La pauta en esas mismas unidades: la fruta y los lácteos se reparten en hidratos, proteína y grasa. */
export const pautaEnMacros = (o) => ({ P: (o?.P || 0) + (o?.lacteo || 0) * 8 / 25, HC: (o?.HC || 0) + (o?.fruta || 0) * 15 / 40 + (o?.lacteo || 0) * 11 / 40, G: (o?.G || 0) + (o?.lacteo || 0) * 4 / 10 });

export const alimento = (id) => cat.alimentoPorId.get(id) ?? app.datos.productosPropios.find((a) => a.id === id);
export const receta = (id) => cat.recetaPorId.get(id) ?? app.datos.recetasPropias?.find((r) => r.id === id);

/** Raciones y macros que aporta una entrada del registro. */
export function aporte(e) {
  const r = { P: 0, HC: 0, G: 0, fruta: 0, lacteo: 0, kcal: 0, p: 0, hc: 0, g: 0 };
  if (e.tipo === 'racion') {
    r[e.grupo] += e.n;
    for (const k of ['kcal', 'p', 'hc', 'g']) r[k] += MEDIA[e.grupo][k] * e.n;
  } else if (e.tipo === 'alimento') {
    const a = alimento(e.aid);
    if (!a) return r;
    const f = e.g / 100;
    r.kcal += a.kcal * f; r.p += a.p * f; r.hc += a.hc * f; r.g += a.g * f;
    if (a.rac && ['P', 'HC', 'G', 'fruta', 'lacteo'].includes(a.cc)) r[a.cc] += e.g / a.rac;
  } else if (e.tipo === 'plato') {
    // plato del recetario ajustado: la suma de sus ingredientes pesados
    for (const it of e.items || []) {
      const a = aporte({ tipo: 'alimento', aid: it.aid, g: it.g });
      for (const k in r) r[k] += a[k];
    }
  } else if (e.tipo === 'receta') {
    const x = receta(e.rid);
    if (!x) return r;
    const n = e.porciones;
    r.kcal += x.kcal * n; r.p += x.p * n; r.hc += x.hc * n; r.g += x.g * n;
    r.P += (x.p * n) / 25; r.HC += (x.hc * n) / 40; r.G += (x.g * n) / 10;
  }
  return r;
}
export function sumar(entradas) {
  const t = { P: 0, HC: 0, G: 0, fruta: 0, lacteo: 0, kcal: 0, p: 0, hc: 0, g: 0 };
  for (const e of entradas) { const a = aporte(e); for (const k in t) t[k] += a[k]; }
  return t;
}
export const delDia = (fecha) => app.datos.comidas[fecha] ?? [];
export function anotar(fecha, entrada) {
  // (x ||= []).push() empujaría al array sin proxy (el primer registro del día se perdía): se asigna y se lee del estado
  if (!app.datos.comidas[fecha]) app.datos.comidas[fecha] = [];
  app.datos.comidas[fecha].push({ ...entrada, id: uuid() });
}
export function quitar(fecha, id) {
  const l = app.datos.comidas[fecha];
  if (!l) return;
  const i = l.findIndex((e) => e.id === id);
  if (i >= 0) l.splice(i, 1);
}
/** Tipo de día para la opción de más hidratos: true = sesión exigente hecha, null = día de descanso marcado. */
export function tipoDeDia(fecha) {
  const d = app.datos;
  const s = d.sesiones.filter((x) => x.fecha === fecha);
  if (s.length) return s.some((x) => d.rutina?.sesiones.find((y) => y.id === x.sesionId)?.exigente) ? true : false;
  if (app.sesionActiva?.fecha === fecha) {
    const y = d.rutina?.sesiones.find((z) => z.id === app.sesionActiva.sesionId);
    return y?.exigente ? true : false;
  }
  return d.descansos?.[fecha] ? null : false;
}
export function objetivoDelDia(fecha) {
  const d = app.datos;
  if (!d.dieta) return null;
  return racionesDelDia(d.dieta, tipoDeDia(fecha), d.rutina, d.perfil.diasSemana, d.perfil.diasWod);
}
/** Pauta de raciones de una comida, con el extra de hidratos sumado a la comida tras entrenar (la siguiente a la sesión). */
export function pautaComida(comida, fecha) {
  const d = app.datos;
  const base = { ...comida.raciones };
  const obj = objetivoDelDia(fecha);
  if (obj && d.dieta.hidratosExtra) {
    const dif = obj.HC - d.dieta.raciones.HC;
    const principal = comidaHidratosExtra(d);
    if (comida.id === principal.id) base.HC = Math.max(0, Math.round((base.HC + dif) * 10) / 10);
  }
  return base;
}
export const redondear = (v) => Math.round(v * 10) / 10;
export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const diaSemana = (fecha) => (new Date(fecha + 'T12:00:00').getDay() + 6) % 7;

// Hora típica de cada franja de entreno; la comida «de después» es la primera que cae al menos media hora después de la hora típica de empezar.
export const HORA_ENTRENO = { temprano: 7, manana: 10.5, mediodia: 13.5, tarde: 18, noche: 20.5 };
const aHoras = (h) => { const [a, b] = String(h || '0').split(':'); return +a + (+b || 0) / 60; };
/** Comida que va justo después de entrenar (ahí van los hidratos extra del día exigente). Sin hora: la comida. */
export function comidaTrasEntreno(comidas, franja) {
  const h = HORA_ENTRENO[franja];
  const porDefecto = comidas.find((c) => c.id === 'comida') ?? comidas[0];
  if (h == null) return porDefecto;
  const orden = [...comidas].sort((a, b) => aHoras(a.hora) - aHoras(b.hora));
  // un batido o una toma pequeña (≤ 1,5 raciones de P+HC+G) no cuenta: la siguiente comida de verdad
  const sustancial = (c) => (+c.raciones?.P || 0) + (+c.raciones?.HC || 0) + (+c.raciones?.G || 0) > 1.5;
  return orden.find((c) => aHoras(c.hora) >= h + 0.5 && sustancial(c)) ?? orden.find((c) => aHoras(c.hora) >= h + 0.5) ?? orden.at(-1);
}
/** Dónde van los hidratos extra: la comida que elija la persona en Mi dieta o, si no, la de después de entrenar. */
export function comidaHidratosExtra(d = app.datos) {
  const elegida = d.dieta?.comidas.find((c) => c.id === d.dieta.hidratosExtraEn);
  return elegida ?? comidaTrasEntreno(d.dieta?.comidas ?? [], d.perfil.horaEntreno);
}

/**
 * Objetivo en gramos de una comida (para pesar): los gramos del día repartidos según las raciones de esa comida.
 * Aquí se cuentan los macros de verdad de cada alimento (el huevo también trae grasa; las legumbres, proteína).
 */
export function objetivoComidaGramos(dieta, c) {
  const tot = (g) => dieta.comidas.reduce((s, x) => s + (+x.raciones[g] || 0), 0) || 1;
  const hcPeso = (x) => (+x.raciones.HC || 0) * 40 + (+x.raciones.fruta || 0) * 15;
  const totHC = dieta.comidas.reduce((s, x) => s + hcPeso(x), 0) || 1;
  const p = (dieta.p * (+c.raciones.P || 0)) / tot('P');
  const hc = (dieta.hc * hcPeso(c)) / totHC;
  const g = (dieta.g * (+c.raciones.G || 0)) / tot('G');
  // las kcal de las tablas incluyen fibra y factores propios de cada alimento: se reparte la cifra del día tal cual
  const kcalMacros = 4 * dieta.p + 4 * dieta.hc + 9 * dieta.g || 1;
  return { p, hc, g, kcal: ((4 * p + 4 * hc + 9 * g) * dieta.kcal) / kcalMacros };
}

// ── De dónde sale cada macro ──
const MACRO_NOMBRE = { kcal: 'Calorías', p: 'Proteína', hc: 'Hidratos', g: 'Grasa' };
export { MACRO_NOMBRE };
/** Partes de una entrada: [{clave, nombre, m: {kcal,p,hc,g}, hijos?}] (las recetas, con sus ingredientes). */
function partes(e) {
  const m = (x) => ({ kcal: x.kcal, p: x.p, hc: x.hc, g: x.g });
  if (e.tipo === 'racion') return { clave: 'r:' + e.grupo, nombre: `Ración de ${NOMBRE_RACION[e.grupo].toLowerCase()} (sin pesar)`, m: m(aporte(e)) };
  if (e.tipo === 'alimento') return { clave: 'a:' + e.aid, nombre: alimento(e.aid)?.n ?? 'Alimento', m: m(aporte(e)) };
  const x = receta(e.rid);
  const total = m(aporte(e));
  let hijos = [];
  if (e.tipo === 'plato') hijos = (e.items || []).map((it) => ({ clave: 'a:' + it.aid, nombre: alimento(it.aid)?.n ?? '¿?', m: m(aporte({ tipo: 'alimento', aid: it.aid, g: it.g })) }));
  else if (x?.ingredientes?.length) {
    const n = x.tipo === 'lote' ? Math.max(1, +x.porciones || 1) : 1;
    hijos = x.ingredientes.map((i) => ({ clave: 'a:' + i.id, nombre: alimento(i.id)?.n ?? i.n ?? '¿?', m: m(aporte({ tipo: 'alimento', aid: i.id, g: (i.g * e.porciones) / n })) }));
    // se reescalan para que sumen lo mismo que la receta (que puede llevar sus macros ya calculados)
    for (const k of ['kcal', 'p', 'hc', 'g']) { const s = hijos.reduce((a, h) => a + h.m[k], 0); if (s > 0) for (const h of hijos) h.m[k] *= total[k] / s; }
  }
  return { clave: 'x:' + e.rid, nombre: x?.n ?? 'Receta', m: total, hijos };
}
/**
 * Desglose de lo anotado en varios días: agrupa por alimento o receta y suma (los ingredientes de las recetas, también).
 * Devuelve { dias, lineas: [{clave, nombre, comidas:Set, veces, m, hijos:[…]}] } con m en total (divide entre dias para la media).
 */
export function desglose(fechas) {
  const mapa = new Map();
  let dias = 0;
  const sumarM = (a, b) => { for (const k of ['kcal', 'p', 'hc', 'g']) a[k] += b[k]; };
  for (const f of fechas) {
    const reg = delDia(f);
    if (!reg.length) continue;
    dias++;
    for (const e of reg) {
      const p = partes(e);
      let l = mapa.get(p.clave);
      if (!l) mapa.set(p.clave, (l = { clave: p.clave, nombre: p.nombre, comidas: new Set(), dias: new Set(), m: { kcal: 0, p: 0, hc: 0, g: 0 }, hijos: new Map() }));
      l.comidas.add(e.comida); l.dias.add(f);
      sumarM(l.m, p.m);
      for (const h of p.hijos || []) {
        let y = l.hijos.get(h.clave);
        if (!y) l.hijos.set(h.clave, (y = { nombre: h.nombre, m: { kcal: 0, p: 0, hc: 0, g: 0 } }));
        sumarM(y.m, h.m);
      }
    }
  }
  return { dias, lineas: [...mapa.values()].map((l) => ({ ...l, hijos: [...l.hijos.values()] })) };
}

// ── Fijar las kcal diarias a mano y que el menú se ajuste ──
// La proteína se queda como está (va por tu peso); lo que sube o baja son los hidratos y la grasa:
// las raciones de HC y G de cada comida y, en el menú, los gramos de los alimentos que cuentan como hidratos o grasa
// (arroz, pan, patata, aceite…). Carne, pescado, lácteos proteicos, fruta, verdura y especias no se tocan.
const ESCALA = new Set(['HC', 'G']);
const kcalDe = (aid, g) => { const a = alimento(aid); return a ? (a.kcal * g) / 100 : 0; };
const escalable = (aid) => ESCALA.has(alimento(aid)?.cc);
const redondeoG = (aid, g) => { const a = alimento(aid); const paso = g < 10 ? 0.5 : a?.cc === 'G' || g < 20 ? 1 : 5; return Math.max(paso, Math.round(g / paso) * paso); };
// Los platos de receta (una rebanada de tu pan, un guiso…) se dejan como están: se escalan los alimentos sueltos
function itemsDe(e) { return e.tipo === 'alimento' ? [e] : []; }
function itemsTodos(e) { return e.tipo === 'plato' ? e.items : e.tipo === 'alimento' ? [e] : []; }
/** kcal medias de un día de menú (solo días con algo) y parte que se puede escalar. */
function partesMenu(dieta) {
  const dias = Object.values(dieta.menu || {}).filter((M) => Object.values(M).some((l) => l?.length));
  if (!dias.length) return null;
  let fijo = 0, var_ = 0;
  for (const M of dias) for (const L of Object.values(M)) for (const e of L || []) for (const it of itemsTodos(e)) {
    const k = kcalDe(it.aid, it.g);
    if (e.tipo === 'alimento' && escalable(it.aid)) var_ += k; else fijo += k;
  }
  return { dias: dias.length, fijo: fijo / dias.length, var: var_ / dias.length };
}
/** Propuesta (sin aplicar) para que la dieta y el menú den «objetivo» kcal al día. */
export function propuestaKcal(dieta, objetivo) {
  const pm = partesMenu(dieta);
  const kcalPauta = (r) => { const m = pautaEnMacros(r); return m.P * 25 * 4 + m.HC * 40 * 4 + m.G * 10 * 9; };
  const antesPauta = dieta.comidas.reduce((s, c) => s + kcalPauta(c.raciones), 0);
  // factor: con menú, sobre lo que se come de verdad; sin menú, sobre la pauta
  let f, antes;
  if (pm && pm.var > 50) { antes = pm.fijo + pm.var; f = (objetivo - pm.fijo) / pm.var; }
  else {
    antes = antesPauta;
    const P = dieta.comidas.reduce((s, c) => s + pautaEnMacros(c.raciones).P, 0) * 100;
    f = (objetivo - P) / Math.max(1, antesPauta - P);
  }
  const limitado = f < 0.4 || f > 2.2;
  f = Math.min(2.2, Math.max(0.4, f));
  const nueva = JSON.parse(JSON.stringify(dieta));
  const cambios = [];
  for (const c of nueva.comidas) for (const g of ['HC', 'G']) c.raciones[g] = Math.round((+c.raciones[g] || 0) * f * 4) / 4;
  for (const [dia, M] of Object.entries(nueva.menu || {})) for (const [com, L] of Object.entries(M)) for (const e of L || []) for (const it of itemsDe(e)) {
    if (!escalable(it.aid) || it.g < 2) continue; // un par de puffs de aceite se quedan como están
    const de = it.g, a = redondeoG(it.aid, it.g * f);
    if (Math.abs(a - de) >= 0.5) { it.g = a; cambios.push({ dia: +dia, comida: com, n: alimento(it.aid)?.n, de, a }); }
  }
  for (const g of GRUPOS_RACION) nueva.raciones[g] = nueva.comidas.reduce((s, c) => s + (+c.raciones[g] || 0), 0);
  nueva.kcal = Math.round(objetivo);
  nueva.hc = Math.round((dieta.hc || 0) * f);
  nueva.g = Math.round((dieta.g || 0) * f);
  nueva.kcalFijadas = true;
  const pmN = partesMenu(nueva);
  return { f, limitado, antes: Math.round(antes), despues: Math.round(pmN ? pmN.fijo + pmN.var : objetivo), cambios, dieta: nueva };
}
