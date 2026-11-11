// Genera public/data/pare.json (lo que carga la app) a partir de datos/catalogo_pare.json,
// que es la exportación del Excel maestro hecha con pare_catalogo.py.
// Solo se incluyen los ejercicios activos y los campos que usa la app.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const c = JSON.parse(readFileSync('datos/catalogo_pare.json', 'utf8'));
const activos = c.ejercicios.filter((e) => e.activo === 'SI');
const ids = new Set(activos.map((e) => e.id_ejercicio));
const fichas = Object.fromEntries(c.fichas_tecnicas.map((f) => [f.id_ejercicio, f]));

const ejercicios = activos.map((e) => {
  const id = e.id_ejercicio;
  const f = fichas[id] || {};
  return {
    id,
    n: e.nombre_es,
    en: e.nombre_en,
    mod: e.modalidad,
    tipo: e.tipo_ejercicio,
    pat: e.patron_movimiento,
    fam: e.familia_variantes || null,
    gp: e.grupos_principales,
    gs: e.grupos_secundarios,
    mp: e.musculos_principales,
    ms: e.musculos_secundarios,
    carga: e.tipo_carga,
    ud: e.unidad_registro,
    frac: e.fraccion_peso_corporal,
    mec: e.mecanica,
    niv: e.nivel,
    eq: e.equipamiento_principal,
    eqa: e.equipamiento_adicional,
    vol: e.computa_volumen_muscular === 'SI',
    img: existsSync(`public/img/${id}_1.webp`),
    ficha: {
      ejecucion: f.ejecucion_es || null,
      recomendaciones: f.recomendaciones_es || null,
      errores: f.errores_es || null,
      precauciones: f.precauciones_es || null,
    },
  };
});

const etiquetas = {};
for (const v of c.vocabularios) {
  (etiquetas[v.vocabulario] ||= {})[v.codigo] = v.etiqueta_es;
}
const grupoDeMusculo = Object.fromEntries(
  c.vocabularios.filter((v) => v.vocabulario === 'musculo').map((v) => [v.codigo, v.grupo]),
);

const variantes = {};
for (const v of c.variantes) {
  if (!ids.has(v.id_ejercicio)) continue;
  (variantes[v.familia] ||= []).push(v.id_ejercicio);
}

const salida = {
  esquema: 1,
  generado: c.generado,
  ejercicios,
  etiquetas,
  grupoDeMusculo,
  variantes,
  descansos: c.descansos,
  rangosVolumen: c.rangos_volumen,
  restricciones: c.restricciones_dolor
    .filter((r) => r.tipo === 'patron' || ids.has(r.objetivo))
    .map((r) => ({
      id: r.id_regla, zona: r.zona, nivel: r.nivel, tipo: r.tipo, objetivo: r.objetivo,
      motivo: r.motivo, alternativas: (r.alternativas || []).filter((a) => ids.has(a)),
    })),
  alimentos: c.alimentos.filter((a) => a.activo === 'SI').map((a) => ({
    id: a.id_alimento, n: a.nombre_es, grupo: a.grupo, cc: a.cuenta_como, estado: a.estado,
    kcal: a.kcal_100g, p: a.proteina_100g, hc: a.hidratos_100g, g: a.grasa_100g, fib: a.fibra_100g,
    az: a.azucares_100g, sal: a.sal_100g, rac: a.racion_g, medida: a.medida_casera, gm: a.g_medida,
    alerg: a.alergenos, etq: a.etiquetas, notas: a.notas,
  })),
  recetas: c.recetas.filter((r) => r.activo === 'SI').map((r) => ({
    id: r.id_receta, n: r.nombre_es, porciones: r.porciones, kcal: r.kcal_porcion, p: r.proteina_porcion,
    hc: r.hidratos_porcion, g: r.grasa_porcion, cuenta: r.cuenta_como, momento: r.momento,
    alerg: r.alergenos, notas: r.notas,
    ingredientes: c.receta_ingredientes.filter((i) => i.id_receta === r.id_receta)
      .map((i) => ({ id: i.id_alimento, n: i.nombre_alimento, g: i.gramos, nota: i.nota })),
  })),
  actividades: c.actividades_met.filter((a) => a.activo === 'SI' && a.destacada === 'SI')
    .map((a) => ({ id: a.id_actividad, n: a.nombre_es, cat: a.categoria, met: a.met })),
  suplementos: c.suplementos,
};

writeFileSync('public/data/pare.json', JSON.stringify(salida));
console.log(`pare.json: ${ejercicios.length} ejercicios, ${salida.alimentos.length} alimentos, ` +
  `${salida.recetas.length} recetas, ${(JSON.stringify(salida).length / 1024).toFixed(0)} KB`);
