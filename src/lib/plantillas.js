// Plantillas de Excel: leer la rutina o la dieta que alguien ha rellenado y pasarlas al formato de PARE.
import { cat, normalizar, palabras } from './catalogo.js';
import { app, uuid } from './estado.svelte.js';
import { descansoPorDefecto } from './entreno.js';

export const URL_PLANTILLA_RUTINA = './plantillas/PARE_plantilla_rutina.xlsx';
export const URL_PLANTILLA_DIETA = './plantillas/PARE_plantilla_dieta.xlsx';

// ---------- Emparejar nombres escritos a mano con el catálogo ----------
const ALIAS = [
  [/\bjaca\b/, 'sentadilla hack'], [/press superior/, 'press inclinado'], [/\bvuelos? posteriores?\b/, 'pajaro'],
  [/\bfacepull\b/, 'face pull'], [/\bsmith\b/, 'multipower'], [/\bcuadriceps\b/, 'cuadriceps'],
  [/\babdominales? inferiores?\b/, 'crunch inverso'], [/\bremo frontal\b/, 'remo sentado en polea'], [/\bdead ?bug\b/, 'dead bug'], [/\bbird ?-?dog\b/, 'bird dog'], [/\bproteic[oa]s?\b/, 'proteinas'], [/\bpeso muerto rumano\b/, 'peso muerto rumano'],
];
function aliar(t) { let s = normalizar(t); for (const [re, r] of ALIAS) s = s.replace(re, r); return s; }

// Dos palabras «son la misma» si coinciden o una empieza por la otra y se parecen de largo (curl/curls, tricep/triceps;
// no trap/trapecio ni bar/barra).
function igual(a, b) {
  if (a === b) return true;
  const [c, l] = a.length <= b.length ? [a, b] : [b, a];
  return c.length >= 4 && l.startsWith(c) && c.length / l.length >= 0.6;
}
const VARIANTE = /^(declin|inclin|cerrad|abiert|supin|pron|unilateral|lastr|alterno|cruzad|explosiv|pausa|deficit)/;
const MATERIAL = /mancuern|maquin|polea|multipower|kettlebell|banda|cable|smith|disco/;
function puntuar(qw, nombre) {
  const ew = palabras(nombre);
  if (!qw.length || !ew.length) return 0;
  const aciertos = qw.filter((w) => ew.some((x) => igual(x, w))).length;
  const cubre = ew.filter((x) => qw.some((w) => igual(x, w))).length;
  // sin material en lo escrito, el de barra es el «normal» (press banca = con barra)
  const barra = !qw.some((w) => MATERIAL.test(w)) && ew.some((x) => x.startsWith('barr')) ? 0.12 : 0;
  // variantes que no se han pedido (declinado, agarre cerrado, a una mano…) restan: «press banca» es el normal
  const variantes = ew.filter((x) => VARIANTE.test(x) && !qw.some((w) => igual(x, w))).length;
  return aciertos / qw.length + 0.35 * (cubre / ew.length) + barra - 0.1 * variantes;
}
/** Mejores candidatos del catálogo para un texto. `ok` = encaja con seguridad (todas las palabras están). */
export function emparejar(texto, lista) {
  const t = String(texto ?? '').trim();
  if (!t) return { id: null, ok: false, cand: [] };
  const exacto = lista.find((x) => normalizar(x.n) === normalizar(t));
  if (exacto) return { id: exacto.id, ok: true, cand: [exacto.id] };
  const qw = palabras(aliar(t));
  const punt = lista.map((x) => [x, puntuar(qw, `${x.n} ${x.en ?? ''}`)]).filter(([, s]) => s > 0.3).sort((a, b) => b[1] - a[1]);
  const cand = punt.slice(0, 5).map(([x]) => x.id);
  return { id: cand[0] ?? null, ok: (punt[0]?.[1] ?? 0) >= 1.1, cand };
}

// ---------- Utilidades de lectura ----------
const cab = (t) => normalizar(String(t ?? '')).replace(/[^a-z0-9]+/g, ' ').trim();
function buscarTabla(hojas, requeridas) {
  // primero las hojas con nombre de tabla (Rutina, Dieta…), al final las de instrucciones
  const orden = Object.entries(hojas).sort(([a], [b]) => (/instruc/i.test(a) ? 1 : 0) - (/instruc/i.test(b) ? 1 : 0));
  for (const [nombre, filas] of orden) {
    for (let i = 0; i < Math.min(filas.length, 15); i++) {
      const h = (filas[i] || []).map(cab);
      // una cabecera de verdad tiene varias columnas cortas, no una frase
      if (h.filter(Boolean).length < 2 || h.some((x) => x.length > 30)) continue;
      if (requeridas.every((r) => h.some((x) => x.startsWith(r)))) return { nombre, cabecera: h, filas: filas.slice(i + 1) };
    }
  }
  return null;
}
const indice = (h, ...nombres) => h.findIndex((x) => nombres.some((n) => x.startsWith(n)));
const num = (v) => { if (v == null || v === '') return null; const m = String(v).replace(',', '.').match(/\d+(\.\d+)?/); return m ? +m[0] : null; };
const texto = (v) => (v == null ? '' : String(v).trim());
const si = (v) => v === true || /^(s|si|sí|x|1|true|yes|top)/i.test(texto(v));

/** ¿Qué hay en la hoja? 'rutina', 'dieta' o null. */
export function detectar(hojas) {
  if (buscarTabla(hojas, ['ejercicio'])) return 'rutina';
  if (buscarTabla(hojas, ['alimento', 'gramos'])) return 'dieta';
  return null;
}

// ---------- Rutina ----------
export function leerRutina(hojas) {
  const t = buscarTabla(hojas, ['ejercicio']);
  if (!t) return null;
  const h = t.cabecera;
  const c = { dia: indice(h, 'dia', 'sesion'), ej: indice(h, 'ejercicio'), series: indice(h, 'series'), rmin: indice(h, 'reps min', 'repeticiones min', 'reps'), rmax: indice(h, 'reps max', 'repeticiones max'),
    rpe: indice(h, 'rpe'), rir: indice(h, 'rir'), top: indice(h, 'top'), bi: indice(h, 'biserie', 'superserie'), desc: indice(h, 'descanso'), nota: indice(h, 'nota') };
  const dias = [];
  for (const f of t.filas) {
    const nombre = texto(f[c.ej]);
    if (!nombre) continue;
    const dia = texto(f[c.dia]) || dias.at(-1)?.nombre || 'Día 1';
    let d = dias.find((x) => x.nombre === dia);
    if (!d) dias.push((d = { nombre: dia, filas: [] }));
    let rmin = num(f[c.rmin]), rmax = c.rmax >= 0 ? num(f[c.rmax]) : null;
    const rango = String(f[c.rmin] ?? '').match(/(\d+)\s*[-–a]\s*(\d+)/);
    if (rango) { rmin = +rango[1]; rmax = +rango[2]; }
    rmin ??= 10; rmax ??= rmin;
    let rpe = texto(f[c.rpe]).replace(/^rpe\s*/i, ''), rir = texto(f[c.rir]).replace(/^rir\s*/i, '');
    if (rpe && !rir && /^\d+(\.\d+)?$/.test(rpe.replace(',', '.'))) rir = String(Math.max(0, 10 - +rpe.replace(',', '.')));
    if (rir && !rpe && /^\d+$/.test(rir)) rpe = String(10 - +rir);
    const m = emparejar(nombre, cat.ejercicios);
    d.filas.push({ texto: nombre, ...m, series: Math.max(1, Math.round(num(f[c.series]) ?? 3)), repMin: Math.min(rmin, rmax), repMax: Math.max(rmin, rmax),
      rpe, rir, topSet: c.top >= 0 && si(f[c.top]), biserie: texto(f[c.bi]).toUpperCase(), descanso: num(f[c.desc]), nota: texto(f[c.nota]) });
  }
  return dias.length ? { tipo: 'rutina', dias } : null;
}

export function construirRutina(lectura, nombre = 'Mi rutina') {
  const sesiones = lectura.dias.map((d) => {
    const filas = d.filas.filter((x) => x.id);
    const items = filas.map((x, i) => {
      const letra = x.biserie.replace(/\d+/g, '');
      const sig = filas[i + 1];
      const unir = !!letra && !!sig && sig.biserie.replace(/\d+/g, '') === letra;
      const enBiserie = !!letra && (unir || (filas[i - 1]?.biserie.replace(/\d+/g, '') === letra));
      return { uid: uuid(), ej: x.id, series: x.series, repMin: x.repMin, repMax: x.repMax, carga: null,
        descanso: x.descanso ?? (enBiserie ? 75 : descansoPorDefecto(x.id, 'hipertrofia')), unir, nota: x.nota, rpe: x.rpe || null, rir: x.rir || null, topSet: x.topSet };
    });
    const piernas = items.filter((it) => cat.porId.get(it.ej)?.gp?.includes('piernas')).length;
    return { id: uuid(), nombre: d.nombre, exigente: piernas >= 3, items };
  });
  return { id: uuid(), version: 1, nombre, objetivo: app.datos.perfil.objetivo || 'hipertrofia', sesiones };
}

// ---------- Dieta ----------
const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
export function diasDe(v) {
  const t = normalizar(texto(v));
  if (!t || /todos|diario|cada dia|siempre/.test(t)) return [0, 1, 2, 3, 4, 5, 6];
  if (/entre semana|l-v|lunes a viernes/.test(t)) return [0, 1, 2, 3, 4];
  if (/fin de semana|finde/.test(t)) return [5, 6];
  const r = t.match(/(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\s*(a|-)\s*(lunes|martes|miercoles|jueves|viernes|sabado|domingo)/);
  if (r) { const a = DIAS.indexOf(r[1]), b = DIAS.indexOf(r[3]); return DIAS.map((_, i) => i).filter((i) => i >= a && i <= b); }
  return DIAS.map((d, i) => (t.includes(d) ? i : -1)).filter((i) => i >= 0);
}
const ID_COMIDA = { desayuno: 'desayuno', 'media manana': 'media', almuerzo: 'comida', comida: 'comida', merienda: 'merienda', cena: 'cena' };
const idComida = (n) => ID_COMIDA[cab(n)] ?? (cab(n).replace(/\s+/g, '-') || 'comida');

export function leerDieta(hojas) {
  const t = buscarTabla(hojas, ['alimento', 'gramos']);
  if (!t) return null;
  const h = t.cabecera;
  const c = { dia: indice(h, 'dia'), comida: indice(h, 'comida'), hora: indice(h, 'hora'), al: indice(h, 'alimento'), g: indice(h, 'gramos') };
  const filas = [];
  const lista = [...(app.datos.productosPropios ?? []), ...cat.alimentos];
  for (const f of t.filas) {
    const nombre = texto(f[c.al]);
    if (!nombre) continue;
    const comida = texto(f[c.comida]) || 'Comida';
    filas.push({ texto: nombre, ...emparejar(nombre, lista), dias: diasDe(f[c.dia]), comida, hora: texto(f[c.hora]), g: num(f[c.g]) ?? 100 });
  }
  return filas.length ? { tipo: 'dieta', filas } : null;
}

const alimento = (id) => cat.alimentoPorId.get(id) ?? app.datos.productosPropios?.find((a) => a.id === id);
export function construirDieta(lectura) {
  const filas = lectura.filas.filter((x) => x.id);
  const orden = [];
  for (const x of filas) if (!orden.some((o) => o.id === idComida(x.comida))) orden.push({ id: idComida(x.comida), nombre: x.comida, hora: x.hora });
  for (const o of orden) if (!o.hora) o.hora = filas.find((x) => idComida(x.comida) === o.id && x.hora)?.hora ?? '';
  const horaNum = (h) => { const [a, b] = String(h || '99').split(/[:.h]/); return +a + (+b || 0) / 60; };
  orden.sort((a, b) => horaNum(a.hora) - horaNum(b.hora));
  const menu = {};
  for (let d = 0; d < 7; d++) {
    menu[d] = {};
    for (const o of orden) menu[d][o.id] = filas.filter((x) => idComida(x.comida) === o.id && x.dias.includes(d)).map((x) => ({ tipo: 'alimento', aid: x.id, g: x.g }));
  }
  const mac = (items) => items.reduce((t, e) => { const a = alimento(e.aid); if (!a) return t; const k = e.g / 100; return { p: t.p + a.p * k, hc: t.hc + a.hc * k, g: t.g + a.g * k }; }, { p: 0, hc: 0, g: 0 });
  const conComida = [0, 1, 2, 3, 4, 5, 6].filter((d) => Object.values(menu[d]).some((l) => l.length));
  const n = conComida.length || 1;
  const r5 = (v) => Math.round(v * 2) / 2;
  const T = { p: 0, hc: 0, g: 0 };
  const comidas = orden.map((o) => {
    const m = conComida.reduce((t, d) => { const x = mac(menu[d][o.id]); return { p: t.p + x.p / n, hc: t.hc + x.hc / n, g: t.g + x.g / n }; }, { p: 0, hc: 0, g: 0 });
    T.p += m.p; T.hc += m.hc; T.g += m.g;
    return { id: o.id, nombre: o.nombre, hora: o.hora || '', raciones: { P: r5(m.p / 25), HC: r5(m.hc / 40), G: r5(m.g / 10), fruta: 0, lacteo: 0 }, verdura: ['comida', 'cena'].includes(o.id) };
  });
  const p = Math.round(T.p / 5) * 5, hc = Math.round(T.hc / 5) * 5, g = Math.round(T.g / 5) * 5;
  const raciones = ['P', 'HC', 'G', 'fruta', 'lacteo'].reduce((o, k) => ({ ...o, [k]: comidas.reduce((s, x) => s + x.raciones[k], 0) }), {});
  return { objetivo: app.datos.perfil.objetivo || 'recomposicion', kcal: Math.round((4 * p + 4 * hc + 9 * g) / 50) * 50, p, hc, g, raciones, comidas, hidratosExtra: false, menu, creada: new Date().toISOString(), origen: 'Plantilla de Excel' };
}
