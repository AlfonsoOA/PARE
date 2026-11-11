// Recetas: «platos» (para una persona, se ajustan a las raciones de cada comida) y «lotes» (tartas, pan:
// se hacen enteras y se toman por porciones).
import { cat, normalizar } from './catalogo.js';
import { alimento } from './dieta.js';

const BASE = { P: ['p', 25], HC: ['hc', 40], G: ['g', 10] };
export const MOMENTO_DE_COMIDA = { desayuno: 'desayuno', media: 'merienda', comida: 'comida', merienda: 'merienda', cena: 'cena' };
export const NOMBRE_MOMENTO = { desayuno: 'Desayuno', comida: 'Comida', cena: 'Cena', merienda: 'Merienda', postre: 'Postres y dulces' };

/** Raciones de proteína, hidratos y grasa que aportan unos ingredientes [{aid, g}]. */
export function racionesDe(items) {
  const r = { P: 0, HC: 0, G: 0 };
  for (const it of items) {
    const a = alimento(it.aid);
    if (!a || !BASE[a.cc]) continue;
    const [k, b] = BASE[a.cc];
    r[a.cc] += ((a[k] || 0) * it.g) / 100 / b;
  }
  return r;
}
const redondearG = (g) => (g < 20 ? Math.max(1, Math.round(g)) : Math.round(g / 5) * 5);
const ingredientesBase = (r) => r.ingredientes.map((i) => ({ aid: i.id, g: i.g, nota: i.nota ?? null }));

/**
 * Ajusta un plato a las raciones de una comida: escala los ingredientes que cuentan como P, HC o G para que
 * cuadren; verdura, fruta y condimentos se quedan igual. Si el plato no tiene hidratos (o proteína…) y la
 * comida sí los pide, lo devuelve en `faltan` para completarlo aparte.
 */
export function ajustarReceta(r, objetivo = null) {
  const base = ingredientesBase(r);
  if (!objetivo || r.tipo !== 'plato') return { items: base, faltan: {}, factores: { P: 1, HC: 1, G: 1 } };
  const c = racionesDe(base);
  const factores = {};
  for (const g of ['P', 'HC', 'G']) {
    const obj = +objetivo[g] || 0;
    factores[g] = c[g] > 0.05 ? obj / c[g] : 1;
    if (g === 'G') factores[g] = Math.max(0.3, factores[g]); // algo de aceite para cocinar siempre
  }
  const items = [];
  for (const it of base) {
    const a = alimento(it.aid);
    const f = a && BASE[a.cc] ? factores[a.cc] : 1;
    if (f === 1) { items.push(it); continue; }
    let g = it.g * f;
    // huevos enteros: unidades completas
    if (/^1 huevo/.test(a?.medida || '') && a.gm) g = Math.round(g / a.gm) * a.gm;
    g = g > 0 ? redondearG(g) : 0;
    if (g > 0) items.push({ ...it, g, nota: /\d/.test(it.nota || '') ? null : it.nota });
  }
  const faltan = {};
  for (const g of ['P', 'HC']) if ((+objetivo[g] || 0) >= 0.5 && c[g] <= 0.05) faltan[g] = +objetivo[g];
  return { items, faltan, factores };
}

/** Unidades caseras para orientar: «≈ 2 huevos», «≈ 1 lata pequeña». */
export function enCasero(it) {
  const a = alimento(it.aid);
  if (!a?.gm || !a.medida || !/^1 /.test(a.medida)) return '';
  const n = it.g / a.gm;
  if (n < 0.4 || n > 8) return '';
  const r = Math.round(n * 2) / 2;
  const txt = a.medida.replace(/^1 /, '');
  return `≈ ${String(r).replace('.', ',')} ${r === 1 ? txt : plural(txt)}`;
}
function plural(t) {
  const [p, ...resto] = t.split(' ');
  const pl = /[aeiou]$/.test(p) ? p + 's' : /[lnrd]$/.test(p) ? p + 'es' : p;
  return [pl, ...resto].join(' ');
}

/** ¿Se puede proponer a esta persona? Sin sus alérgenos ni lo que no le gusta. */
export function recetaApta(r, perfil) {
  if ((r.alerg || []).some((x) => (perfil.alergenos || []).includes(x))) return false;
  const aversiones = normalizar(perfil.test?.aversiones || '').split(/[,;\n]+| y /).map((s) => s.trim()).filter((w) => w.length > 2);
  if (!aversiones.length) return true;
  return !r.ingredientes.some((i) => aversiones.some((w) => normalizar(i.n).includes(w))) && !aversiones.some((w) => normalizar(r.n).includes(w));
}

export const platos = () => cat.recetas.filter((r) => r.tipo === 'plato');
export const momentosDe = (r) => (r.momentos?.length ? r.momentos : [r.momento].filter(Boolean));

/** Entrada de registro/menú para un plato ajustado. */
export function entradaPlato(r, objetivo) {
  const { items } = ajustarReceta(r, objetivo);
  return { tipo: 'plato', rid: r.id, items: items.map(({ aid, g }) => ({ aid, g })) };
}

// ---------- Recomendación: qué platos salen primero para cada persona ----------
// No filtra (todas siguen disponibles): ordena. Pesan el objetivo, el día, el tiempo para cocinar, el
// presupuesto y los gustos (me gusta / no me gusta y lo que más anota).

/** Métricas de la receta base, calculadas una vez. */
const metricas = new Map();
function medir(r) {
  if (metricas.has(r.id)) return metricas.get(r.id);
  let peso = 0, verdura = 0;
  for (const i of r.ingredientes) {
    const a = alimento(i.id);
    if (!a || a.grupo === 'condimento' && a.kcal < 10) continue; // agua, caldo, sal: no cuentan para la densidad
    peso += i.g;
    if (a.grupo === 'verdura') verdura += i.g;
  }
  const kcal = r.kcal || 1;
  const m = { densidad: kcal / Math.max(1, peso), verdura, prot: (r.p * 4) / kcal, hidr: (r.hc * 4) / kcal };
  metricas.set(r.id, m);
  return m;
}

export const preferenciasCocina = (perfil) => ({
  tiempo: perfil.cocina?.tiempo ?? perfil.test?.cocinaTiempo ?? 'normal',
  presupuesto: perfil.cocina?.presupuesto ?? perfil.test?.presupuesto ?? 'normal',
});
const enDeficit = (perfil) => perfil.faseDieta === 'deficit' || ['perder_grasa', 'recomposicion'].includes(perfil.objetivo);
const ganando = (perfil) => perfil.faseDieta === 'superavit' || perfil.objetivo === 'ganar_musculo';

/** Veces que cada receta se ha anotado. */
export function usosRecetas(comidas) {
  const u = {};
  for (const lista of Object.values(comidas || {})) for (const e of lista) if (e.rid) u[e.rid] = (u[e.rid] || 0) + 1;
  return u;
}

/**
 * Puntuación de una receta para esta persona y por qué. ctx: { perfil, gustos, usos, momento?, exigente? }.
 * Los motivos son las etiquetas que se enseñan en la lista ("Sacia mucho", "Rápida"…).
 */
export function puntuarReceta(r, { perfil, gustos = {}, usos = {}, momento = null, exigente = false, momentoPost = 'comida' }) {
  const motivos = [];
  let p = 0;
  if (gustos[r.id] === -1) return { puntos: -100, motivos: ['No te gusta'], vetada: true };
  if (!recetaApta(r, perfil)) return { puntos: -50, motivos: [], vetada: true };
  if (r.tipo === 'plato') {
    const m = medir(r);
    if (enDeficit(perfil)) {
      p += Math.max(-1, Math.min(1, (1.2 - m.densidad) / 0.5)) * 2;
      if (m.verdura >= 150) p += 1;
      if (m.prot >= 0.27) p += 1;
      if (m.densidad < 1.05 || m.verdura >= 250) motivos.push('Sacia mucho');
    }
    if (ganando(perfil)) {
      p += m.hidr >= 0.42 ? 2 : m.hidr >= 0.34 ? 1 : 0;
      if (m.verdura > 250) p -= 0.5;
      if (m.hidr >= 0.38) motivos.push('Rica en hidratos');
    }
    if (exigente && (momento === momentoPost || momento === null) && momentosDe(r).includes(momentoPost)) {
      p += m.hidr >= 0.42 ? 2 : m.hidr >= 0.34 ? 1 : -0.5;
      if (m.hidr >= 0.38) motivos.push('Para después de tu entreno fuerte');
    }
    const { tiempo, presupuesto } = preferenciasCocina(perfil);
    const t = r.tiempo ?? 30, c = r.coste ?? 2;
    if (tiempo === 'poco') p += t <= 15 ? 2 : t <= 20 ? 1 : t > 30 ? -2 : 0;
    else if (tiempo === 'normal' && t > 40) p -= 1;
    if (t <= 15) motivos.push('Rápida');
    if (presupuesto === 'ajustado') p += c <= 1.3 ? 2 : c <= 1.7 ? 1 : c > 2.2 ? -1.5 : 0;
    else if (c > 2.5) p -= 0.5;
    if (c <= 1.3) motivos.push('Barata');
  }
  if (gustos[r.id] === 1) { p += 3; motivos.unshift('Te gusta'); }
  const n = usos[r.id] || 0;
  if (n) p += Math.min(2, Math.log2(1 + n));
  if (n >= 2 && gustos[r.id] !== 1) motivos.unshift('La sueles comer');
  return { puntos: p, motivos: motivos.slice(0, 3), vetada: false };
}

/** Recetas ordenadas para esta persona (las vetadas, al final). `azar` > 0 baraja un poco los empates. */
export function recetasOrdenadas(lista, ctx, azar = 0) {
  return lista
    .map((r, k) => ({ r, ...puntuarReceta(r, ctx), k: azar ? Math.random() * azar : -k * 1e-6 }))
    .sort((a, b) => b.puntos + b.k - (a.puntos + a.k));
}
