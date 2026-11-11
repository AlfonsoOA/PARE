// Propuesta automática de menú semanal a partir de las raciones de cada comida.
// Es una propuesta general: el deportista la cambia en Comer → Mi menú.
import { app } from './estado.svelte.js';
import { alimento, objetivoComidaGramos } from './dieta.js';
import { cat, normalizar } from './catalogo.js';
import { platos, momentosDe, ajustarReceta, recetasOrdenadas, usosRecetas, topeGramos } from './recetas.js';

// Opciones por tipo de comida y grupo de ración (IDs de ALIMENTOS). Se van rotando por día.
const OPCIONES = {
  desayuno: {
    P: ['AL0183', 'AL0044', 'AL0186', 'AL0042', 'AL0185', 'AL0179', 'AL0044'],
    HC: ['AL0080', 'AL0063', 'AL0194', 'AL0063', 'AL0080', 'AL0067', 'AL0194'],
    G: ['AL0156', 'AL0159', 'AL0156', 'AL0160', 'AL0156', 'AL0123', 'AL0159'],
    fruta: ['AL0103', 'AL0110', 'AL0106', 'AL0101', 'AL0104', 'AL0103', 'AL0106'],
    lacteo: ['AL0047', 'AL0049'],
  },
  principal: {
    P: ['AL0001', 'AL0192', 'AL0011', 'AL0035', 'AL0004', 'AL0026', 'AL0014', 'AL0034', 'AL0001', 'AL0042', 'AL0038', 'AL0004', 'AL0192', 'AL0011'],
    HC: ['AL0065', 'AL0084', 'AL0068', 'AL0091', 'AL0085', 'AL0065', 'AL0088', 'AL0194', 'AL0084', 'AL0068', 'AL0065', 'AL0085', 'AL0091', 'AL0084'],
    G: ['AL0156'],
    fruta: ['AL0101', 'AL0104', 'AL0110', 'AL0103', 'AL0106'],
    lacteo: ['AL0049'],
  },
  ligera: {
    P: ['AL0183', 'AL0186', 'AL0181', 'AL0185', 'AL0179', 'AL0183', 'AL0181'],
    HC: ['AL0067', 'AL0080', 'AL0063'],
    G: ['AL0160', 'AL0159', 'AL0123'],
    fruta: ['AL0101', 'AL0103', 'AL0110', 'AL0104', 'AL0106', 'AL0101', 'AL0110'],
    lacteo: ['AL0049', 'AL0047'],
  },
};
// Proteína vegetal: solo para quien no come carne ni pescado (vegetariano o vegano).
const VEGETAL = { desayuno: ['AL0190', 'AL0215'], principal: ['AL0215', 'AL0216', 'AL0096'], ligera: ['AL0190', 'AL0215'] };
// Para completar un plato o repartir una ración que no cabe en un solo alimento: lo de toda la vida.
const ACOMPANA = { HC: ['AL0080', 'AL0194'], P: ['AL0186', 'AL0183', 'AL0042'], G: ['AL0156'], fruta: ['AL0103', 'AL0101', 'AL0110'], lacteo: ['AL0049'] };
const tipoDeComida = (id) => (id === 'desayuno' ? 'desayuno' : id === 'comida' || id === 'cena' ? 'principal' : 'ligera');

function apto(a, perfil, aversiones) {
  if (!a) return false;
  if ((a.alerg || []).some((x) => (perfil.alergenos || []).includes(x))) return false;
  const dieta = perfil.cocina?.dieta;
  if (dieta === 'vegetariana' && !(a.etq || []).includes('vegetariano')) return false;
  if (dieta === 'vegana' && !(a.etq || []).includes('vegano')) return false;
  const n = normalizar(a.n);
  return !aversiones.some((w) => w.length > 2 && n.includes(w));
}
function elegir(lista, k, perfil, aversiones, usados) {
  for (let j = 0; j < lista.length; j++) {
    const a = cat.alimentoPorId.get(lista[(k + j) % lista.length]);
    if (apto(a, perfil, aversiones) && !usados.has(a.id)) return a;
  }
  for (let j = 0; j < lista.length; j++) {
    const a = cat.alimentoPorId.get(lista[(k + j) % lista.length]);
    if (apto(a, perfil, aversiones)) return a;
  }
  return null;
}
const redondear5 = (g) => Math.max(5, Math.round(g / 5) * 5);

/** Devuelve { [dia 0-6]: { [comidaId]: [entradas] } } a partir de la pauta. */
export function proponerMenu(dieta, perfil = app.datos.perfil, azar = 0) {
  const aversiones = normalizar(perfil.test?.aversiones || '').split(/[,;\n]+| y /).map((s) => s.trim()).filter(Boolean);
  const menu = {};
  // Platos del recetario: la comida, todos los días; la cena, en días alternos (las otras, algo sencillo).
  // ordenados por lo que mejor encaja con su objetivo, su tiempo, su presupuesto y sus gustos
  const ctx = { perfil, gustos: app.datos.gustosRecetas || {}, usos: usosRecetas(app.datos.comidas) };
  const deMomento = (m) => recetasOrdenadas(platos().filter((r) => momentosDe(r).includes(m)), { ...ctx, momento: m }, azar)
    .filter((x) => !x.vetada).map((x) => x.r);
  const listaComida = deMomento('comida'), listaCena = deMomento('cena');
  const usadosSemana = new Set();
  const elegirPlato = (lista, k) => {
    for (const r of lista) if (!usadosSemana.has(r.id)) return r;
    return lista.length ? lista[k % lista.length] : null;
  };
  for (let dia = 0; dia < 7; dia++) {
    menu[dia] = {};
    const usadosDia = new Set();
    dieta.comidas.forEach((c, ci) => {
      const tipo = tipoDeComida(c.id);
      const veg = ['vegetariana', 'vegana'].includes(perfil.cocina?.dieta);
      const op = veg ? { ...OPCIONES[tipo], P: [...VEGETAL[tipo], ...OPCIONES[tipo].P] } : OPCIONES[tipo];
      const items = [];
      // la cena desfasada respecto a la comida para no repetir el mismo plato el mismo día
      const k = dia * 2 + (c.id === 'cena' ? 7 : 0) + ci;
      let pendiente = null; // raciones que quedan por cubrir después del plato
      const plato = c.id === 'comida' ? elegirPlato(listaComida, dia * 3) : c.id === 'cena' && dia % 2 === 0 ? elegirPlato(listaCena, dia * 5 + 1) : null;
      if (plato) {
        usadosSemana.add(plato.id);
        const aj = ajustarReceta(plato, c.raciones);
        items.push({ tipo: 'plato', rid: plato.id, items: aj.items.map(({ aid, g }) => ({ aid, g })) });
        for (const it of aj.items) usadosDia.add(it.aid); // no repetir aparte lo que ya lleva el plato
        pendiente = { P: aj.faltan.P || 0, HC: aj.faltan.HC || 0, G: 0 };
      }
      for (const g of ['P', 'HC', 'G', 'fruta', 'lacteo']) {
        let n = pendiente && g in pendiente ? pendiente[g] : +c.raciones[g] || 0;
        // un alimento hasta su tope razonable; lo que sobre, con otro del mismo grupo (patata + pan, no 500 g de patata)
        for (let vuelta = 0; n > 0.2 && vuelta < 3; vuelta++) {
          // tras un plato, o para lo que no cabe en el primer alimento: pan, un lácteo… (no otro plato de pasta)
          const lista = pendiente || vuelta > 0 ? (veg && g === 'P' ? VEGETAL[tipo] : ACOMPANA[g]) : op[g];
          const a = elegir(lista, k + vuelta, perfil, aversiones, usadosDia);
          if (!a?.rac) break;
          usadosDia.add(a.id);
          const caben = Math.max(1, Math.floor((topeGramos(a) / a.rac) * 2) / 2);
          const r = Math.min(n, caben);
          items.push({ tipo: 'alimento', aid: a.id, g: redondear5(a.rac * r) });
          n -= r;
        }
      }
      cuadrarComida(items, objetivoComidaGramos(dieta, c));
      menu[dia][c.id] = items;
    });
  }
  return menu;
}

/**
 * Ajusta los gramos de una comida para que sus macros REALES (todos los de cada alimento, no solo el principal)
 * se acerquen al objetivo de esa comida: proteína con los alimentos proteicos, grasa con las grasas e hidratos con
 * los hidratos. La fruta, la verdura y los condimentos se quedan como están.
 */
export function cuadrarComida(items, obj) {
  const piezas = [];
  for (const e of items) {
    if (e.tipo === 'alimento') piezas.push(e);
    else if (e.tipo === 'plato') piezas.push(...e.items);
  }
  const macro = (k, lista = piezas) => lista.reduce((s, x) => s + ((alimento(x.aid)?.[k] || 0) * x.g) / 100, 0);
  const grupo = (cc) => piezas.filter((x) => alimento(x.aid)?.cc === cc);
  const K = { P: 'p', G: 'g', HC: 'hc' };
  for (let vuelta = 0; vuelta < 6; vuelta++) {
    for (const cc of ['P', 'G', 'HC']) {
      const k = K[cc], ps = grupo(cc);
      const propio = macro(k, ps);
      if (propio <= 0.5) continue;
      const falta = obj[k] - macro(k);
      const f = Math.min(1.6, Math.max(cc === 'G' ? 0.3 : 0.4, (propio + falta) / propio));
      for (const x of ps) x.g = Math.min(topeGramos(alimento(x.aid)), x.g * f);
    }
    // al final, las kcal: lo que falte o sobre lo absorben los hidratos (sin tocar la proteína)
    const hcs = grupo('HC'), kHC = macro('kcal', hcs);
    if (kHC > 20) {
      const f = Math.min(1.3, Math.max(0.6, (kHC + obj.kcal - macro('kcal')) / kHC));
      for (const x of hcs) x.g = Math.min(topeGramos(alimento(x.aid)), x.g * f);
    }
  }
  for (const x of piezas) {
    const a = alimento(x.aid);
    if (/^1 huevo/.test(a?.medida || '') && a.gm) x.g = Math.max(a.gm, Math.round(x.g / a.gm) * a.gm);
    else x.g = x.g < 20 ? Math.max(1, Math.round(x.g)) : Math.round(x.g / 5) * 5;
  }
  return items;
}
