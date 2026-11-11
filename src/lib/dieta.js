// Registro de comida: por raciones (fichas) o por pesada (alimentos y recetas).
import { app, uuid } from './estado.svelte.js';
import { cat } from './catalogo.js';
import { racionesDelDia } from './plan.js';

export const GRUPOS_RACION = ['P', 'HC', 'G', 'fruta', 'lacteo'];
export const NOMBRE_RACION = { P: 'Proteína', HC: 'Hidratos', G: 'Grasa', fruta: 'Fruta', lacteo: 'Lácteo' };
export const DEF_RACION = { P: '25 g de proteína', HC: '40 g de hidratos', G: '10 g de grasa', fruta: '15 g de hidratos', lacteo: '1 vaso de leche o 2 yogures' };
// Macros medios de una ración marcada sin pesar.
const MEDIA = {
  P: { kcal: 130, p: 25, hc: 1, g: 3 }, HC: { kcal: 180, p: 5, hc: 40, g: 1 }, G: { kcal: 90, p: 0, hc: 0, g: 10 },
  fruta: { kcal: 60, p: 0.5, hc: 15, g: 0 }, lacteo: { kcal: 110, p: 8, hc: 11, g: 4 },
};

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
  (app.datos.comidas[fecha] ||= []).push({ ...entrada, id: uuid() });
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
