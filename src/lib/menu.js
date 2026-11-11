// Propuesta automática de menú semanal a partir de las raciones de cada comida.
// Es una propuesta general: el deportista la cambia en Comer → Mi menú.
import { app } from './estado.svelte.js';
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
      menu[dia][c.id] = items;
    });
  }
  return menu;
}
