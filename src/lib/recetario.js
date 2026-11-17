// Recetario en Excel: exportar todas las recetas (de PARE y propias) e importarlas de vuelta.
// Regla: se actualiza por ID; sin ID es nueva; nada se borra por no estar en el archivo (solo con «Borrar» = sí).
// Las de PARE no se tocan: si alguien cambia una, se guarda como receta suya («mi versión»).
import { cat, normalizar } from './catalogo.js';
import { app, uuid, hoyISO } from './estado.svelte.js';
import { todasRecetas, calcularReceta, momentosDe } from './recetas.js';
import { ESTILOS, MOMENTOS, DIETA, libroRecetario, leerCeldaIngredientes } from './recetarioFormato.js';
import { emparejar } from './plantillas.js';
import { crearXlsx } from './xlsxEscribir.js';

const alimento = (id) => cat.alimentoPorId.get(id) ?? app.datos.productosPropios?.find((a) => a.id === id);
/** El recetario completo como .xlsx (sirve de plantilla y de base de datos). */
export function recetarioXlsx() {
  const lista = [...(app.datos.productosPropios ?? []), ...cat.alimentos];
  return crearXlsx(libroRecetario(todasRecetas(), { nombreAlimento: (id) => alimento(id)?.n, alimentos: lista.map((a) => a.n) }), 1);
}
export const nombreRecetario = () => `PARE_recetario_${hoyISO()}.xlsx`;

// ---------- Importar ----------
const cab = (t) => normalizar(String(t ?? '')).replace(/[^a-z0-9]+/g, ' ').trim();
const texto = (v) => (v == null ? '' : String(v).trim());
const num = (v) => { if (v == null || v === '') return null; const m = String(v).replace(',', '.').match(/\d+(\.\d+)?/); return m ? +m[0] : null; };
function tabla(hojas, requeridas) {
  for (const [nombre, filas] of Object.entries(hojas)) {
    if (/instruc/i.test(nombre)) continue;
    for (let i = 0; i < Math.min(filas.length, 10); i++) {
      const h = (filas[i] || []).map(cab);
      if (h.filter(Boolean).length < 2 || h.some((x) => x.length > 30)) continue;
      if (requeridas.every((r) => h.some((x) => x.startsWith(r)))) return { cabecera: h, filas: filas.slice(i + 1) };
    }
  }
  return null;
}
const ind = (h, ...ns) => h.findIndex((x) => ns.some((n) => x.startsWith(n)));
export const esRecetario = (hojas) => { const t = tabla(hojas, ['nombre', 'momento']); return !!(t && (t.cabecera.some((x) => x.startsWith('ingredientes')) || tabla(hojas, ['receta', 'ingrediente', 'gramos']))); };

export function leerRecetario(hojas) {
  const tr = tabla(hojas, ['nombre', 'momento']), ti = tabla(hojas, ['receta', 'ingrediente', 'gramos']);
  if (!tr) return null; // la hoja «Ingredientes» (ti) solo existe en archivos antiguos
  const h = tr.cabecera;
  const c = { id: ind(h, 'id'), n: ind(h, 'nombre'), tipo: ind(h, 'tipo'), por: ind(h, 'porciones'), mom: ind(h, 'momento'), t: ind(h, 'tiempo'), est: ind(h, 'estilo'),
    dieta: ind(h, 'dieta'), peso: ind(h, 'peso final'), ing: ind(h, 'ingredientes'), notas: ind(h, 'notas'), pasos: ind(h, 'protocolo', 'pasos'), borrar: ind(h, 'borrar') };
  const hi = ti?.cabecera ?? [];
  const ci = { rec: ind(hi, 'receta'), al: ind(hi, 'ingrediente'), g: ind(hi, 'gramos'), nota: ind(hi, 'nota') };
  const lista = [...(app.datos.productosPropios ?? []), ...cat.alimentos];
  const recetas = [];
  const existe = (n) => lista.some((a) => normalizar(a.n) === normalizar(n));
  for (const f of tr.filas) {
    const n = texto(f[c.n]);
    if (!n) continue;
    const momentos = texto(f[c.mom]).split(/[;,/]+/).map((m) => normalizar(m).trim()).map((m) => MOMENTOS.find((x) => m.startsWith(x.slice(0, 4))) ?? (m.startsWith('almu') ? 'comida' : m.startsWith('dulce') ? 'postre' : null)).filter(Boolean);
    const estTxt = normalizar(texto(f[c.est]));
    const estilo = ESTILOS.find(([v, l]) => normalizar(l).startsWith(estTxt.slice(0, 5)) || normalizar(v) === estTxt)?.[0] ?? (estTxt.startsWith('caser') ? 'casera' : estTxt || 'española');
    const lote = /lote/i.test(texto(f[c.tipo])) || (num(f[c.por]) ?? 1) > 1;
    recetas.push({
      idArchivo: texto(f[c.id]), n, tipo: lote ? 'lote' : 'plato', porciones: lote ? Math.max(1, Math.round(num(f[c.por]) ?? 1)) : 1,
      momentos: momentos.length ? [...new Set(momentos)] : ['comida'], tiempo: num(f[c.t]), estilo,
      dieta: normalizar(texto(f[c.dieta])), pesoFinal: num(f[c.peso]), notas: texto(f[c.notas]),
      pasos: texto(f[c.pasos]).split(/\r?\n/).map((x) => x.trim()).filter(Boolean), borrar: /^(s|si|sí|x|1|true)/i.test(texto(f[c.borrar])), deCelda: c.ing >= 0 && !!texto(f[c.ing]),
      ingredientes: c.ing >= 0 ? leerCeldaIngredientes(texto(f[c.ing]), existe).map((x) => ({ texto: x.texto, ...emparejar(x.nombre, lista), g: x.g ?? 0, nota: x.nota })) : [],
    });
  }
  for (const f of ti?.filas ?? []) {
    const clave = texto(f[ci.rec]), nombre = texto(f[ci.al]);
    if (!clave || !nombre) continue;
    const r = recetas.find((x) => x.idArchivo && x.idArchivo === clave) ?? recetas.find((x) => normalizar(x.n) === normalizar(clave));
    if (!r || r.deCelda) continue;
    r.ingredientes.push({ texto: nombre, ...emparejar(nombre, lista), g: num(f[ci.g]) ?? 0, nota: texto(f[ci.nota]) });
  }
  for (const r of recetas) r.estado = estadoDe(r);
  return { tipo: 'recetas', recetas };
}

// ¿Qué pasará con cada receta al guardar?
function firma(r) {
  return JSON.stringify([normalizar(r.n), r.tipo, +r.porciones || 1, [...momentosDe(r)].sort(), r.tiempo ?? null, r.pesoFinal ?? null, (r.notas || '').trim(),
    (r.pasos || []).map((x) => x.trim()), r.ingredientes.map((i) => [i.id, Math.round(+i.g || 0), (i.nota || '').trim()]), DIETA(r)]);
}
function comoReceta(x, base = {}) {
  const etqDieta = x.dieta.startsWith('vegan') ? ['vegano', 'vegetariano'] : x.dieta.startsWith('vegeta') ? ['vegetariano'] : [];
  return { ...base, n: x.n, tipo: x.tipo, porciones: x.porciones, momentos: x.momentos, momento: x.momentos.join(';'), tiempo: x.tiempo ?? base.tiempo ?? null,
    estilo: x.estilo, pesoFinal: x.pesoFinal ?? null, notas: x.notas, pasos: x.pasos, etq: etqDieta,
    ingredientes: x.ingredientes.filter((i) => i.id).map((i) => ({ id: i.id, g: i.g, nota: i.nota || null })) };
}
export function estadoDe(x) {
  const propia = (app.datos.recetasPropias || []).find((r) => r.id === x.idArchivo) ?? (!x.idArchivo ? (app.datos.recetasPropias || []).find((r) => normalizar(r.n) === normalizar(x.n)) : null);
  const deCat = cat.recetaPorId.get(x.idArchivo) ?? (!x.idArchivo && !propia ? cat.recetas.find((r) => normalizar(r.n) === normalizar(x.n)) : null);
  if (x.borrar) return propia ? { tipo: 'borrar', id: propia.id } : deCat ? { tipo: 'ocultar', id: deCat.id } : { tipo: 'nada' };
  const nueva = comoReceta(x, propia ?? deCat ?? {});
  if (propia) return firma(nueva) === firma(propia) ? { tipo: 'igual', id: propia.id } : { tipo: 'actualizar', id: propia.id };
  if (deCat) return firma(nueva) === firma(deCat) ? { tipo: 'igual', id: deCat.id } : { tipo: 'version', id: deCat.id };
  return { tipo: 'nueva' };
}
export const TEXTO_ESTADO = { nueva: 'Nueva', actualizar: 'Se actualiza', version: 'Tu versión de una de PARE', igual: 'Sin cambios', borrar: 'Se borra', ocultar: 'Se oculta para ti', nada: 'No existe: se ignora' };

// Calcula macros y alérgenos, y añade las etiquetas sin gluten / sin lactosa como en el recetario de PARE.
function calcular(r) {
  calcularReceta(r);
  const etq = new Set(r.etq || []);
  if (!r.alerg.includes('gluten')) etq.add('sin_gluten');
  if (!r.alerg.includes('leche')) etq.add('sin_lactosa');
  r.etq = [...etq];
  return r;
}

/** Aplica la importación. Devuelve el resumen. */
export function guardarRecetario(lectura) {
  const d = app.datos;
  d.recetasPropias ||= []; d.gustosRecetas ||= {};
  const res = { nuevas: 0, actualizadas: 0, versiones: 0, borradas: 0, ocultas: 0 };
  for (const x of lectura.recetas) {
    const e = estadoDe(x);
    if (e.tipo === 'igual' || e.tipo === 'nada') continue;
    if (x.ingredientes.some((i) => !i.id) && !['borrar', 'ocultar'].includes(e.tipo)) continue;
    if (e.tipo === 'borrar') { d.recetasPropias = d.recetasPropias.filter((r) => r.id !== e.id); delete d.gustosRecetas[e.id]; res.borradas++; continue; }
    if (e.tipo === 'ocultar') { d.gustosRecetas[e.id] = -1; res.ocultas++; continue; }
    if (e.tipo === 'actualizar') {
      const i = d.recetasPropias.findIndex((r) => r.id === e.id);
      d.recetasPropias[i] = calcular(comoReceta(x, d.recetasPropias[i]));
      res.actualizadas++; continue;
    }
    if (e.tipo === 'version') {
      const base = cat.recetaPorId.get(e.id);
      const r = calcular(comoReceta(x, { id: 'MR-' + uuid(), propia: true, basadaEn: e.id, coste: base.coste ?? null }));
      if (normalizar(r.n) === normalizar(base.n)) r.n = `${r.n} (mi versión)`;
      d.recetasPropias.unshift(r); d.gustosRecetas[e.id] = -1; // la original deja de proponerse
      res.versiones++; continue;
    }
    const id = x.idArchivo && /^MR-/.test(x.idArchivo) ? x.idArchivo : 'MR-' + uuid();
    d.recetasPropias.unshift(calcular(comoReceta(x, { id, propia: true, coste: null })));
    res.nuevas++;
  }
  return res;
}

/** Macros por 100 g: del plato o lote ya cocinado si se sabe su peso; si no, de la mezcla en crudo. */
export function por100(r) {
  const t = { kcal: 0, p: 0, hc: 0, g: 0 };
  let crudo = 0;
  for (const i of r.ingredientes || []) {
    const a = alimento(i.id);
    if (!a) continue;
    crudo += +i.g || 0;
    const f = (+i.g || 0) / 100;
    t.kcal += a.kcal * f; t.p += a.p * f; t.hc += a.hc * f; t.g += a.g * f;
  }
  const base = +r.pesoFinal || crudo;
  if (!base) return null;
  const k = 100 / base;
  return { kcal: Math.round(t.kcal * k), p: +(t.p * k).toFixed(1), hc: +(t.hc * k).toFixed(1), g: +(t.g * k).toFixed(1), cocinado: !!+r.pesoFinal, total: Math.round(base) };
}
