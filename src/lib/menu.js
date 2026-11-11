// Propuesta automática de menú semanal a partir de las raciones de cada comida.
// Es una propuesta general: el deportista la cambia en Comer → Mi menú.
import { app } from './estado.svelte.js';
import { cat, normalizar } from './catalogo.js';
import { platos, momentosDe, ajustarReceta, recetasOrdenadas, usosRecetas } from './recetas.js';

// Opciones por tipo de comida y grupo de ración (IDs de ALIMENTOS). Se van rotando por día.
const OPCIONES = {
  desayuno: {
    P: ['AL0183', 'AL0044', 'AL0186', 'AL0042', 'AL0185', 'AL0179', 'AL0044', 'AL0190', 'AL0215'],
    HC: ['AL0080', 'AL0063', 'AL0194', 'AL0063', 'AL0080', 'AL0067', 'AL0194'],
    G: ['AL0156', 'AL0159', 'AL0156', 'AL0160', 'AL0156', 'AL0123', 'AL0159'],
    fruta: ['AL0103', 'AL0110', 'AL0106', 'AL0101', 'AL0104', 'AL0103', 'AL0106'],
    lacteo: ['AL0047', 'AL0049'],
  },
  principal: {
    P: ['AL0001', 'AL0192', 'AL0011', 'AL0035', 'AL0004', 'AL0026', 'AL0014', 'AL0034', 'AL0001', 'AL0042', 'AL0038', 'AL0004', 'AL0192', 'AL0011', 'AL0215', 'AL0216', 'AL0096'],
    HC: ['AL0065', 'AL0084', 'AL0068', 'AL0091', 'AL0085', 'AL0065', 'AL0088', 'AL0194', 'AL0084', 'AL0068', 'AL0065', 'AL0085', 'AL0091', 'AL0084'],
    G: ['AL0156'],
    fruta: ['AL0101', 'AL0104', 'AL0110', 'AL0103', 'AL0106'],
    lacteo: ['AL0049'],
  },
  ligera: {
    P: ['AL0183', 'AL0186', 'AL0181', 'AL0185', 'AL0179', 'AL0183', 'AL0181', 'AL0190', 'AL0215'],
    HC: ['AL0067', 'AL0080', 'AL0063'],
    G: ['AL0160', 'AL0159', 'AL0123'],
    fruta: ['AL0101', 'AL0103', 'AL0110', 'AL0104', 'AL0106', 'AL0101', 'AL0110'],
    lacteo: ['AL0049', 'AL0047'],
  },
};
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
      const op = OPCIONES[tipo];
      const items = [];
      // la cena desfasada respecto a la comida para no repetir el mismo plato el mismo día
      const k = dia * 2 + (c.id === 'cena' ? 7 : 0) + ci;
      let cubiertos = new Set();
      const plato = c.id === 'comida' ? elegirPlato(listaComida, dia * 3) : c.id === 'cena' && dia % 2 === 0 ? elegirPlato(listaCena, dia * 5 + 1) : null;
      if (plato) {
        usadosSemana.add(plato.id);
        const aj = ajustarReceta(plato, c.raciones);
        items.push({ tipo: 'plato', rid: plato.id, items: aj.items.map(({ aid, g }) => ({ aid, g })) });
        cubiertos = new Set(['P', 'HC', 'G'].filter((g) => !aj.faltan[g]));
      }
      for (const g of ['P', 'HC', 'G', 'fruta', 'lacteo']) {
        const n = +c.raciones[g] || 0;
        if (n <= 0 || cubiertos.has(g)) continue;
        const a = elegir(op[g], k, perfil, aversiones, usadosDia);
        if (!a?.rac) continue;
        usadosDia.add(a.id);
        items.push({ tipo: 'alimento', aid: a.id, g: redondear5(a.rac * n) });
      }
      menu[dia][c.id] = items;
    });
  }
  return menu;
}
