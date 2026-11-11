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
