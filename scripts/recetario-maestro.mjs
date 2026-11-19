// Recetario maestro: aplica los Excel subidos a datos/recetario/entrada/ sobre datos/recetas.json
// (el recetario que ven todos), estima precios, recalcula macros y deja la copia al día en
// datos/recetario/recetario_maestro.xlsx. Si algo no cuadra, no cambia nada y sale con error.
//   node scripts/recetario-maestro.mjs            → procesa la carpeta de entrada
//   node scripts/recetario-maestro.mjs --exportar → solo regenera recetario_maestro.xlsx
import { readFileSync, writeFileSync, readdirSync, existsSync, unlinkSync, mkdirSync } from 'node:fs';
import { leerXlsx } from '../src/lib/xlsx.js';
import { crearXlsx } from '../src/lib/xlsxEscribir.js';
import { libroRecetario, ESTILOS, ESTILO_DE, MOMENTOS, leerCeldaIngredientes, parecidos } from '../src/lib/recetarioFormato.js';

const ENTRADA = 'datos/recetario/entrada', MAESTRO = 'datos/recetario/recetario_maestro.xlsx', RECETAS = 'datos/recetas.json';
const cat = JSON.parse(readFileSync('datos/catalogo_pare.json', 'utf8'));
const precios = JSON.parse(readFileSync('datos/precios_alimentos.json', 'utf8')).precios;
const alimentos = cat.alimentos.filter((a) => a.activo === 'SI');
const porId = new Map(alimentos.map((a) => [a.id_alimento, a]));
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const porNombre = new Map(alimentos.map((a) => [norm(a.nombre_es), a]));
const base = existsSync(RECETAS) ? JSON.parse(readFileSync(RECETAS, 'utf8')) : { recetas: cat.recetas, receta_ingredientes: cat.receta_ingredientes };
let recetas = base.recetas.map((r) => ({ ...r })), ings = base.receta_ingredientes.map((i) => ({ ...i }));

// ---------- formato de la app ⇄ formato del catálogo ----------
const aApp = (r) => ({
  id: r.id_receta, n: r.nombre_es, porciones: r.porciones, tipo: r.tipo || 'lote', momento: r.momento,
  momentos: String(r.momento || '').split(';').map((x) => x.trim()).filter(Boolean), tiempo: r.tiempo_min ?? null, estilo: r.estilo,
  etq: r.etiquetas || [], pesoFinal: r.peso_final_g ?? null, notas: r.notas ?? '', pasos: r.pasos ? String(r.pasos).split('|').map((x) => x.trim()).filter(Boolean) : [],
  ingredientes: ings.filter((i) => i.id_receta === r.id_receta).sort((a, b) => a.orden - b.orden).map((i) => ({ id: i.id_alimento, g: i.gramos, nota: i.nota })),
});
async function exportar() {
  mkdirSync('datos/recetario', { recursive: true });
  const activas = recetas.filter((r) => r.activo === 'SI').map(aApp);
  const blob = crearXlsx(libroRecetario(activas, { nombreAlimento: (id) => porId.get(id)?.nombre_es, alimentos: alimentos.map((a) => a.nombre_es), maestro: true }), 1);
  writeFileSync(MAESTRO, Buffer.from(await blob.arrayBuffer()));
}

// ---------- leer un Excel ----------
const txt = (v) => (v == null ? '' : String(v).trim());
const num = (v) => { if (v == null || v === '') return null; const m = String(v).replace(',', '.').match(/\d+(\.\d+)?/); return m ? +m[0] : null; };
const cab = (t) => norm(t).replace(/[^a-z0-9]+/g, ' ').trim();
function tabla(hojas, req) {
  for (const [n, filas] of Object.entries(hojas)) {
    if (/instruc/i.test(n)) continue;
    for (let i = 0; i < Math.min(filas.length, 10); i++) {
      const h = (filas[i] || []).map(cab);
      if (h.filter(Boolean).length < 2 || h.some((x) => x.length > 30)) continue;
      if (req.every((r) => h.some((x) => x.startsWith(r)))) return { h, filas: filas.slice(i + 1).map((f, k) => ({ f, fila: i + k + 2 })), hoja: n };
    }
  }
  return null;
}
const ind = (h, ...ns) => h.findIndex((x) => ns.some((n) => x.startsWith(n)));

const errores = [], resumen = { nuevas: [], actualizadas: [], retiradas: [], ignoradas: 0 };
function siguienteId() {
  const n = Math.max(0, ...recetas.map((r) => +String(r.id_receta).replace(/\D/g, '') || 0)) + 1;
  return `RE${String(n).padStart(3, '0')}`;
}
function calcular(r, lista) {
  const t = { kcal: 0, p: 0, hc: 0, g: 0, fib: 0 }, alerg = new Set();
  let crudo = 0, coste = 0;
  for (const i of lista) {
    const a = porId.get(i.id_alimento), f = i.gramos / 100;
    t.kcal += a.kcal_100g * f; t.p += a.proteina_100g * f; t.hc += a.hidratos_100g * f; t.g += a.grasa_100g * f; t.fib += (a.fibra_100g || 0) * f;
    for (const x of a.alergenos || []) alerg.add(x);
    crudo += i.gramos; coste += (precios[i.id_alimento] ?? 0) * i.gramos / 1000;
  }
  const n = r.tipo === 'lote' ? Math.max(1, +r.porciones || 1) : 1;
  const etq = new Set((r.etiquetas || []).filter((x) => x === 'vegetariano' || x === 'vegano'));
  if (!alerg.has('gluten')) etq.add('sin_gluten');
  if (!alerg.has('leche')) etq.add('sin_lactosa');
  Object.assign(r, {
    kcal_porcion: Math.round(t.kcal / n), proteina_porcion: +(t.p / n).toFixed(1), hidratos_porcion: +(t.hc / n).toFixed(1), grasa_porcion: +(t.g / n).toFixed(1),
    fibra_porcion: +(t.fib / n).toFixed(1), peso_total_g: Math.round(crudo), alergenos: [...alerg].sort(), etiquetas: [...etq],
    coste_porcion: Math.round((coste / n) * 100) / 100,
    cuenta_como: r.tipo === 'lote' ? `${n} porciones; cada una: ${Math.round(t.p / n / 25 * 10) / 10} P · ${Math.round(t.hc / n / 40 * 10) / 10} HC · ${Math.round(t.g / n / 10 * 10) / 10} G` : 'Plato completo: se ajusta a las raciones de tu comida',
  });
}

async function procesar(archivo) {
  const { hojas } = await leerXlsx(readFileSync(archivo).buffer.slice(0));
  const tr = tabla(hojas, ['nombre', 'momento']), ti = tabla(hojas, ['receta', 'ingrediente', 'gramos']); // la hoja «Ingredientes» solo en archivos antiguos
  if (!tr) { errores.push(`${archivo}: no encuentro la hoja «Recetas». Usa el recetario que descarga la app o recetario_maestro.xlsx.`); return; }
  const h = tr.h, c = { id: ind(h, 'id'), or: ind(h, 'origen'), n: ind(h, 'nombre'), tipo: ind(h, 'tipo'), por: ind(h, 'porciones'), mom: ind(h, 'momento'), t: ind(h, 'tiempo'), est: ind(h, 'estilo'),
    dieta: ind(h, 'dieta'), peso: ind(h, 'peso final'), ing: ind(h, 'ingredientes'), notas: ind(h, 'notas'), pasos: ind(h, 'protocolo', 'pasos'), borrar: ind(h, 'borrar'), base: ind(h, 'basada') };
  const hi = ti?.h ?? [], ci = { rec: ind(hi, 'receta'), al: ind(hi, 'ingrediente'), g: ind(hi, 'gramos'), nota: ind(hi, 'nota') };
  const nombresAl = alimentos.map((a) => a.nombre_es), existe = (n) => porNombre.has(norm(n));
  for (const { f, fila } of tr.filas) {
    const nombre = txt(f[c.n]);
    if (!nombre) continue;
    if (/^mi/i.test(norm(f[c.or]))) { resumen.ignoradas++; continue; } // las «Mía» no pasan al recetario de todos
    const idArchivo = txt(f[c.id]), baseId = txt(f[c.base]);
    let r = recetas.find((x) => x.id_receta === idArchivo) ?? (baseId ? recetas.find((x) => x.id_receta === baseId) : null)
      ?? recetas.find((x) => norm(x.nombre_es) === norm(nombre.replace(/\s*\(mi version\)$/i, '').replace(/\s*\(mi versión\)$/i, '')));
    if (/^(s|si|x|1|true)/i.test(norm(f[c.borrar]))) { if (r && r.activo === 'SI') { r.activo = 'NO'; resumen.retiradas.push(r.nombre_es); } continue; }
    // ingredientes: de la columna «Ingredientes» (un ingrediente por línea) o, en archivos antiguos, de la hoja «Ingredientes»
    const celda = c.ing >= 0 ? txt(f[c.ing]) : '';
    const lista = celda
      ? leerCeldaIngredientes(celda, existe).map((x) => ({ ...x, donde: `Recetas, fila ${fila} («${nombre}»)` }))
      : (ti?.filas ?? []).filter(({ f: g }) => { const k = txt(g[ci.rec]); return k && (k === idArchivo || norm(k) === norm(nombre)); })
        .map(({ f: g, fila: fi }) => ({ nombre: txt(g[ci.al]), g: num(g[ci.g]), nota: txt(g[ci.nota]), texto: txt(g[ci.al]), donde: `Ingredientes, fila ${fi} («${nombre}»)` })).filter((x) => x.nombre);
    // ¿Los ingredientes vienen en un párrafo (todo en una línea, separado por comas)? Se avisa con claridad.
    if (celda && !/\n/.test(celda.trim()) && (celda.match(/,/g) ?? []).length >= 2) {
      errores.push(`Recetas, fila ${fila} («${nombre}»): los ingredientes están en un párrafo. Pon un ingrediente por línea dentro de la celda (Alt+Intro en Excel), con los gramos delante y el nombre de la hoja «Alimentos»: «300 g Plátano». Los macros aproximados y los opcionales van en «Notas».`);
      continue;
    }
    const nuevos = [];
    for (const x of lista) {
      const a = porNombre.get(norm(x.nombre));
      if (!x.g && !a) { const p = parecidos(x.nombre.replace(/^[\d.,]+\s*/, ''), nombresAl, 1); errores.push(`${x.donde}: en «${x.texto}» faltan los gramos. Escríbelo con los gramos delante y el nombre de la hoja «Alimentos»${p.length ? `, por ejemplo: «60 g ${p[0]}»` : ': «300 g Plátano»'}.`); continue; }
      if (!a) { const p = parecidos(x.nombre, nombresAl); errores.push(`${x.donde}: «${x.nombre}» no está en la lista de alimentos.${p.length ? ` ¿Quisiste decir «${p.join('» o «')}»?` : ' Cópialo de la hoja «Alimentos» o pide que se añada.'}`); continue; }
      if (!x.g) { errores.push(`${x.donde}: faltan los gramos en «${x.texto}». Escríbelo así: «300 g ${a.nombre_es}».`); continue; }
      nuevos.push({ id_alimento: a.id_alimento, nombre_alimento: a.nombre_es, gramos: x.g, nota: x.nota || null });
    }
    if (!lista.length) { errores.push(`Recetas, fila ${fila} («${nombre}»): no tiene ingredientes. Ponlos en la columna «Ingredientes», uno por línea: «300 g Plátano».`); continue; }
    const momentos = txt(f[c.mom]).split(/[;,/]+/).map((m) => norm(m)).map((m) => MOMENTOS.find((x) => m.startsWith(x.slice(0, 4)))).filter(Boolean);
    const estT = norm(f[c.est]);
    const estilo = ESTILOS.find(([v, l]) => norm(l).startsWith(estT.slice(0, 5)) || norm(v) === estT)?.[0] ?? (estT.startsWith('caser') ? 'casera' : r?.estilo ?? 'española');
    const lote = /lote/i.test(txt(f[c.tipo])) || (num(f[c.por]) ?? 1) > 1;
    const dieta = norm(f[c.dieta]);
    const datos = {
      nombre_es: nombre.replace(/\s*\(mi versi[oó]n\)$/i, ''), tipo: lote ? 'lote' : 'plato', porciones: lote ? Math.max(1, Math.round(num(f[c.por]) ?? 1)) : 1,
      momento: [...new Set(momentos.length ? momentos : ['comida'])].join(';'), tiempo_min: num(f[c.t]), estilo, peso_final_g: num(f[c.peso]),
      notas: txt(f[c.notas]) || null, pasos: txt(f[c.pasos]).split(/\r?\n/).map((x) => x.trim()).filter(Boolean).join(' | ') || null,
      etiquetas: dieta.startsWith('vegan') ? ['vegano', 'vegetariano'] : dieta.startsWith('vegeta') ? ['vegetariano'] : [],
    };
    const firma = (x, l) => JSON.stringify([x.nombre_es, x.tipo, +x.porciones, x.momento, x.tiempo_min == null || x.tiempo_min === '' ? null : +x.tiempo_min, ESTILO_DE[x.estilo] ?? x.estilo, x.peso_final_g ? +x.peso_final_g : null, x.notas || null, x.pasos || null,
      (x.etiquetas || []).filter((e) => e === 'vegano' || e === 'vegetariano').sort(), l.map((i) => [i.id_alimento, Math.round(i.gramos), i.nota || null])]);
    if (r) {
      const antes = ings.filter((i) => i.id_receta === r.id_receta).sort((a, b) => a.orden - b.orden);
      if (firma({ ...r }, antes) === firma(datos, nuevos) && r.activo === 'SI') continue;
      Object.assign(r, datos, { activo: 'SI' });
      resumen.actualizadas.push(r.nombre_es);
    } else {
      r = { id_receta: siguienteId(), ...datos, activo: 'SI', fuente: 'Recetario maestro (GitHub)', cuenta_como: '' };
      recetas.push(r);
      resumen.nuevas.push(`${r.id_receta} ${r.nombre_es}`);
    }
    ings = ings.filter((i) => i.id_receta !== r.id_receta).concat(nuevos.map((i, k) => ({ id_receta: r.id_receta, nombre_receta: r.nombre_es, orden: k + 1, ...i })));
    calcular(r, nuevos);
  }
}

const soloExportar = process.argv.includes('--exportar');
const archivos = !soloExportar && existsSync(ENTRADA) ? readdirSync(ENTRADA).filter((f) => /\.xlsx$/i.test(f)).sort().map((f) => `${ENTRADA}/${f}`) : [];
for (const a of archivos) await procesar(a);
if (errores.length) {
  console.error(`\n✗ No se ha publicado nada. Corrige esto en el Excel y vuelve a subirlo:\n\n- ${errores.join('\n- ')}\n`);
  process.exit(1);
}
writeFileSync(RECETAS, JSON.stringify({ nota: 'Recetario de PARE (el que ven todos). Se actualiza subiendo un Excel a datos/recetario/entrada.', recetas, receta_ingredientes: ings }, null, 1));
await exportar();
for (const a of archivos) unlinkSync(a);
console.log(archivos.length ? `Recetario maestro: ${resumen.nuevas.length} nuevas, ${resumen.actualizadas.length} actualizadas, ${resumen.retiradas.length} retiradas, ${resumen.ignoradas} filas «Mía» ignoradas.` +
  [['Nuevas', resumen.nuevas], ['Actualizadas', resumen.actualizadas], ['Retiradas', resumen.retiradas]].filter(([, l]) => l.length).map(([t, l]) => `\n  ${t}: ${l.join('; ')}`).join('') : 'Recetario maestro regenerado.');
