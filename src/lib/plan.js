// Del test de inicio al plan: rutina (plantillas de reparto + elección de ejercicios) y dieta.
import { cat, ej } from './catalogo.js';
import { uuid } from './estado.svelte.js';
import { descansoPorDefecto, duracionSesion, restriccion } from './entreno.js';

// ---------- Plantillas de reparto ----------
// Cada sesión es una lista de huecos: patrón de movimiento + papel (P = principal, A = accesorio).
const S = {
  fullA: ['Cuerpo completo A', [['sentadilla', 'P'], ['empuje_horizontal', 'P'], ['traccion_horizontal', 'P'], ['bisagra_cadera', 'A'], ['empuje_vertical', 'A'], ['core_estabilidad', 'A']]],
  fullB: ['Cuerpo completo B', [['bisagra_cadera', 'P'], ['empuje_vertical', 'P'], ['traccion_vertical', 'P'], ['zancada_unilateral', 'A'], ['aduccion_horizontal_hombro', 'A'], ['core_flexion', 'A']]],
  fullC: ['Cuerpo completo C', [['sentadilla', 'P'], ['traccion_vertical', 'P'], ['empuje_horizontal', 'P'], ['extension_cadera', 'A'], ['flexion_codo', 'A'], ['extension_codo', 'A']]],
  torsoA: ['Torso A', [['empuje_horizontal', 'P'], ['traccion_horizontal', 'P'], ['empuje_vertical', 'A'], ['traccion_vertical', 'A'], ['aduccion_horizontal_hombro', 'A'], ['flexion_codo', 'A'], ['extension_codo', 'A']]],
  torsoB: ['Torso B', [['traccion_vertical', 'P'], ['empuje_horizontal', 'P'], ['traccion_horizontal', 'A'], ['empuje_horizontal', 'A'], ['elevacion_hombro', 'A'], ['extension_codo', 'A'], ['flexion_codo', 'A']]],
  piernaA: ['Pierna A', [['sentadilla', 'P'], ['bisagra_cadera', 'A'], ['zancada_unilateral', 'A'], ['flexion_rodilla', 'A'], ['flexion_plantar', 'A'], ['core_estabilidad', 'A']], true],
  piernaB: ['Pierna B', [['bisagra_cadera', 'P'], ['sentadilla', 'A'], ['extension_cadera', 'A'], ['extension_rodilla', 'A'], ['flexion_plantar', 'A'], ['core_flexion', 'A']], true],
  brazos: ['Hombros y brazos', [['elevacion_hombro', 'A'], ['abduccion_horizontal_hombro', 'A'], ['flexion_codo', 'A'], ['extension_codo', 'A'], ['flexion_codo', 'A'], ['extension_codo', 'A']]],
  empuje: ['Empuje', [['empuje_horizontal', 'P'], ['empuje_vertical', 'P'], ['aduccion_horizontal_hombro', 'A'], ['elevacion_hombro', 'A'], ['extension_codo', 'A'], ['extension_codo', 'A']]],
  tiron: ['Tirón', [['traccion_vertical', 'P'], ['traccion_horizontal', 'P'], ['abduccion_horizontal_hombro', 'A'], ['elevacion_escapular', 'A'], ['flexion_codo', 'A'], ['flexion_codo', 'A']]],
};
export const PLANTILLAS = {
  2: { nombre: 'Cuerpo completo, 2 días', sesiones: ['fullA', 'fullB'] },
  3: { nombre: 'Cuerpo completo, 3 días', sesiones: ['fullA', 'fullB', 'fullC'] },
  4: { nombre: 'Torso / Pierna, 4 días', sesiones: ['torsoA', 'piernaA', 'torsoB', 'piernaB'] },
  5: { nombre: 'Torso / Pierna + hombros y brazos, 5 días', sesiones: ['torsoA', 'piernaA', 'torsoB', 'piernaB', 'brazos'] },
  6: { nombre: 'Empuje / Tirón / Pierna, 6 días', sesiones: ['empuje', 'tiron', 'piernaA', 'empuje', 'tiron', 'piernaB'] },
};

// Ejercicios preferidos por patrón, en orden (gimnasio). Si no encajan, se elige por puntuación.
const PREFERIDOS = {
  empuje_horizontal: ['EJ0044', 'EJ0222', 'EJ0344', 'EJ0053', 'EJ0459', 'EJ0417', 'EJ0571'],
  empuje_vertical: ['EJ0775', 'EJ0638', 'EJ0244', 'EJ0462', 'EJ0623'],
  traccion_vertical: ['EJ0861', 'EJ0563', 'EJ0176', 'EJ0838', 'EJ0160', 'EJ0036'],
  traccion_horizontal: ['EJ0629', 'EJ0080', 'EJ0486', 'EJ0936', 'EJ0228', 'EJ0356'],
  sentadilla: ['EJ0064', 'EJ0415', 'EJ0302', 'EJ0308', 'EJ0247', 'EJ0095'],
  bisagra_cadera: ['EJ0607', 'EJ0794', 'EJ0047', 'EJ0824', 'EJ0562'],
  zancada_unilateral: ['EJ0736', 'EJ0230', 'EJ0884', 'EJ0096'],
  extension_cadera: ['EJ0052', 'EJ0935', 'EJ0108'],
  flexion_rodilla: ['EJ0451', 'EJ0647', 'EJ0771', 'EJ0035'],
  extension_rodilla: ['EJ0413', 'EJ0684'],
  flexion_plantar: ['EJ0755', 'EJ0631', 'EJ0757', 'EJ0136'],
  core_estabilidad: ['EJ0542', 'EJ0192', 'EJ0940'],
  core_flexion: ['EJ0112', 'EJ0591', 'EJ0189'],
  aduccion_horizontal_hombro: ['EJ0111', 'EJ0109', 'EJ0227'],
  elevacion_hombro: ['EJ0668', 'EJ0937', 'EJ0130', 'EJ0655'],
  abduccion_horizontal_hombro: ['EJ0592', 'EJ0597', 'EJ0124'],
  flexion_codo: ['EJ0224', 'EJ0253', 'EJ0309', 'EJ0557', 'EJ0221'],
  extension_codo: ['EJ0829', 'EJ0126', 'EJ0254', 'EJ0761', 'EJ0825'],
  elevacion_escapular: ['EJ0245', 'EJ0060'],
};
const RANGO_NIVEL = { principiante: 0, intermedio: 1, avanzado: 2 };

/** Equipamiento disponible según el lugar y el material del test. */
export function equipamientoPermitido(perfil) {
  if (perfil.lugar !== 'casa') return null; // gimnasio: todo
  const m = new Set(perfil.material || []);
  const ok = new Set(['peso_corporal', 'ninguno']);
  if (m.has('mancuernas')) ok.add('mancuerna');
  if (m.has('barra')) { ok.add('barra'); ok.add('barra_z'); }
  if (m.has('kettlebell')) ok.add('kettlebell');
  if (m.has('bandas')) ok.add('bandas');
  if (m.has('fitball')) ok.add('fitball');
  return { ok, dominadas: m.has('dominadas') };
}
function permitido(e, perfil, eqOk) {
  if (e.mod === 'CROSSFIT' || e.tipo === 'cardio') return false;
  if (perfil.evitar?.includes(e.id)) return false;
  if (eqOk) {
    if (!eqOk.ok.has(e.eq)) return false;
    if (e.pat === 'traccion_vertical' && !eqOk.dominadas) return false;
  }
  const r = restriccion(e.id, perfil.molestias);
  return r?.nivel !== 'evitar';
}
export function elegirEjercicio(patron, perfil, usados, papel) {
  const eqOk = equipamientoPermitido(perfil);
  const nivel = RANGO_NIVEL[perfil.nivel] ?? 0;
  const pref = (PREFERIDOS[patron] || []).map(ej).filter(Boolean);
  // Un principiante empieza por la opción más guiada (mancuernas o máquina) en los básicos.
  const ordenados = nivel === 0 && papel === 'P'
    ? [...pref].sort((a, b) => (a.eq === 'barra') - (b.eq === 'barra')) : pref;
  for (const e of ordenados) {
    if (usados.has(e.id) || !permitido(e, perfil, eqOk)) continue;
    if ((RANGO_NIVEL[e.niv] ?? 0) > nivel) continue;
    return e;
  }
  const cand = cat.ejercicios.filter((e) => e.pat === patron && !usados.has(e.id) && permitido(e, perfil, eqOk));
  cand.sort((a, b) => puntos(b, nivel) - puntos(a, nivel));
  return cand[0] ?? null;
}
const puntos = (e, nivel) => (e.img ? 3 : 0) + ((RANGO_NIVEL[e.niv] ?? 0) <= nivel ? 2 : -3) + (e.mod === 'GYM' ? 1 : 0);

/** Series y repeticiones según objetivo y papel. */
export function prescripcion(objetivo, papel, e) {
  if (e?.ud === 'tiempo' || e?.carga === 'isometrico_peso_corporal') return { series: 3, repMin: 30, repMax: 45 };
  if (objetivo === 'fuerza') return papel === 'P' ? { series: 4, repMin: 4, repMax: 6 } : { series: 3, repMin: 6, repMax: 10 };
  if (objetivo === 'salud') return papel === 'P' ? { series: 3, repMin: 10, repMax: 12 } : { series: 2, repMin: 12, repMax: 15 };
  return papel === 'P' ? { series: 3, repMin: 6, repMax: 10 } : { series: 3, repMin: 10, repMax: 15 };
}
export const objetivoEntreno = (obj) =>
  obj === 'fuerza' ? 'fuerza' : obj === 'salud' ? 'salud' : 'hipertrofia';

export function nuevoItem(idEj, objetivo, papel = 'A') {
  const e = ej(idEj);
  return { uid: uuid(), ej: idEj, ...prescripcion(objetivo, papel, e), carga: null, descanso: descansoPorDefecto(idEj, objetivo), unir: false };
}

export function generarRutina(perfil, ajustes) {
  const dias = Math.min(6, Math.max(2, perfil.diasSemana || 3));
  const plantilla = PLANTILLAS[dias];
  const objetivo = objetivoEntreno(perfil.objetivo);
  const usados = new Set();
  const sesiones = plantilla.sesiones.map((clave) => {
    const [nombre, huecos, exigente] = S[clave];
    const items = [];
    for (const [patron, papel] of huecos) {
      const e = elegirEjercicio(patron, perfil, usados, papel);
      if (!e) continue;
      usados.add(e.id);
      items.push({ ...nuevoItem(e.id, objetivo, papel), papel });
    }
    // Ajustar a los minutos disponibles: primero se quitan accesorios del final, luego se baja a 2 series.
    const limite = (perfil.minutos || 60) * 60;
    while (duracionSesion(items, ajustes) > limite && items.filter((x) => x.papel === 'A').length > 2) {
      const k = items.map((x) => x.papel).lastIndexOf('A');
      items.splice(k, 1);
    }
    for (const it of items) if (duracionSesion(items, ajustes) > limite && it.papel === 'A') it.series = 2;
    return { id: uuid(), nombre, exigente: !!exigente, items };
  });
  // Nombres repetidos (6 días): Empuje 1 / Empuje 2
  const cuenta = {};
  for (const s of sesiones) cuenta[s.nombre] = (cuenta[s.nombre] || 0) + 1;
  const vistos = {};
  for (const s of sesiones) if (cuenta[s.nombre] > 1) s.nombre = `${s.nombre} ${(vistos[s.nombre] = (vistos[s.nombre] || 0) + 1)}`;
  return { id: uuid(), version: 1, creada: new Date().toISOString(), nombre: plantilla.nombre, objetivo, sesiones };
}

/** Las tres razones que se enseñan en "Tu plan". */
export function porQue(perfil, rutina) {
  const out = [`${perfil.diasSemana} días porque dijiste que puedes entrenar ${perfil.diasSemana} días a la semana.`];
  const obj = { perder_grasa: 'perder grasa', recomposicion: 'recomposición', ganar_musculo: 'ganar músculo', fuerza: 'fuerza', salud: 'salud' }[perfil.objetivo];
  if (obj) out.push(`Series y repeticiones pensadas para ${obj}; los descansos, según el tipo de ejercicio.`);
  if (perfil.molestias?.length) out.push(`Sin ejercicios a evitar por tus molestias; los de precaución llevan su aviso.`);
  else out.push(`Sesiones ajustadas a unos ${perfil.minutos} minutos.`);
  return out;
}

// ---------- Dieta ----------
const COMIDAS = {
  3: [['desayuno', 'Desayuno', '08:00', 0.3], ['comida', 'Comida', '14:00', 0.35], ['cena', 'Cena', '21:00', 0.35]],
  4: [['desayuno', 'Desayuno', '08:00', 0.25], ['comida', 'Comida', '14:00', 0.3], ['merienda', 'Merienda', '18:00', 0.15], ['cena', 'Cena', '21:00', 0.3]],
  5: [['desayuno', 'Desayuno', '08:00', 0.2], ['media', 'Media mañana', '11:00', 0.1], ['comida', 'Comida', '14:00', 0.3], ['merienda', 'Merienda', '18:00', 0.1], ['cena', 'Cena', '21:00', 0.3]],
};
/** % de grasa por la fórmula de la Marina de EE. UU. (cm). */
export function grasaNavy(p) {
  const { sexo, altura, cintura, cuello, cadera } = p;
  if (!altura || !cintura || !cuello) return null;
  if (sexo === 'mujer') {
    if (!cadera) return null;
    return 495 / (1.29579 - 0.35004 * Math.log10(cintura + cadera - cuello) + 0.221 * Math.log10(altura)) - 450;
  }
  return 495 / (1.0324 - 0.19077 * Math.log10(cintura - cuello) + 0.15456 * Math.log10(altura)) - 450;
}
export function mifflin(p) {
  return 10 * p.peso + 6.25 * p.altura - 5 * p.edad + (p.sexo === 'mujer' ? -161 : 5);
}
export function factorActividad(t) {
  let f = 1.2;
  f += { sentado: 0, de_pie: 0.1, fisico: 0.25 }[t.trabajo] ?? 0;
  f += { menos5k: 0, '5a8k': 0.1, '8a12k': 0.2, mas12k: 0.3 }[t.pasos] ?? 0.1;
  f += 0.04 * (t.diasSemana || 3) + 0.03 * (t.otrosDeportes || 0);
  return Math.min(1.9, f);
}
function repartir(total, pesos) {
  // Reparte un entero entre comidas por el método del mayor resto.
  const bruto = pesos.map((w) => total * w);
  const base = bruto.map(Math.floor);
  let resto = total - base.reduce((a, b) => a + b, 0);
  const orden = bruto.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0]);
  for (const [, i] of orden) { if (resto <= 0) break; base[i]++; resto--; }
  return base;
}
export function generarDieta(t) {
  const peso = t.peso, bmr = mifflin(t), tdee = bmr * factorActividad(t);
  const grasa = grasaNavy(t);
  const alta = grasa != null && grasa > (t.sexo === 'mujer' ? 32 : 25);
  const ajuste = { perder_grasa: -0.2, recomposicion: alta ? -0.15 : -0.1, ganar_musculo: 0.1, fuerza: 0, salud: 0 }[t.objetivo] ?? 0;
  const kcal = Math.round((tdee * (1 + ajuste)) / 50) * 50;
  const p = Math.round((Math.min(2.2, 1.8) * peso) / 5) * 5;
  const g = Math.round(Math.max(0.8 * peso, (kcal * 0.2) / 9) / 5) * 5;
  const hc = Math.max(0, Math.round((kcal - p * 4 - g * 9) / 4 / 5) * 5);
  const raciones = {
    P: Math.max(3, Math.round((p * 0.85) / 25)),
    HC: Math.max(1, Math.round(((hc - 30) * 0.85) / 40)),
    G: Math.max(2, Math.round((g * 0.6) / 10)),
    fruta: 2,
    lacteo: t.alergenos?.includes('leche') ? 0 : 0,
  };
  const n = [3, 4, 5].includes(+t.comidasDia) ? +t.comidasDia : 4;
  let defs = COMIDAS[n].map((c) => [...c]);
  if (t.hambre === 'noche') defs = defs.map((c) => (c[0] === 'cena' ? [c[0], c[1], c[2], c[3] + 0.08] : c));
  if (t.hambre === 'manana') defs = defs.map((c) => (c[0] === 'desayuno' ? [c[0], c[1], c[2], c[3] + 0.08] : c));
  const sum = defs.reduce((s, c) => s + c[3], 0);
  const pesos = defs.map((c) => c[3] / sum);
  const rep = {};
  for (const k of ['P', 'HC', 'G']) rep[k] = repartir(raciones[k], pesos);
  const comidas = defs.map(([id, nombre, hora], i) => ({
    id, nombre, hora,
    raciones: {
      P: rep.P[i], HC: rep.HC[i], G: rep.G[i],
      fruta: (id === 'desayuno' && raciones.fruta > 0 ? 1 : 0) + (['merienda', 'media'].includes(id) && raciones.fruta > 1 ? 1 : 0),
      lacteo: 0,
    },
    verdura: id === 'comida' || id === 'cena',
  }));
  // Si no hay merienda ni media mañana, la segunda fruta va al postre de la cena.
  const frutas = comidas.reduce((s, c) => s + c.raciones.fruta, 0);
  if (frutas < raciones.fruta) comidas.at(-1).raciones.fruta += raciones.fruta - frutas;
  return {
    objetivo: t.objetivo, bmr: Math.round(bmr), tdee: Math.round(tdee), grasa: grasa == null ? null : Math.round(grasa * 10) / 10,
    kcal, p, g, hc, raciones, comidas, hidratosExtra: false, menu: {}, creada: new Date().toISOString(),
  };
}
export const faseDeObjetivo = (obj, dieta) =>
  dieta && dieta.kcal < dieta.tdee - 100 ? 'deficit' : dieta && dieta.kcal > dieta.tdee + 100 ? 'superavit' : 'mantenimiento';

/** Raciones del día, con la opción de días de más hidratos (+1 HC en sesión exigente, compensado). */
export function racionesDelDia(dieta, esDiaExigente, rutina, diasSemana) {
  const r = { ...dieta.raciones };
  if (!dieta.hidratosExtra || !rutina) return r;
  const exigentes = rutina.sesiones.filter((s) => s.exigente).length;
  const porSemana = Math.round((exigentes / rutina.sesiones.length) * (diasSemana || rutina.sesiones.length));
  const descanso = Math.max(1, 7 - (diasSemana || rutina.sesiones.length));
  if (esDiaExigente) r.HC += 1;
  else if (esDiaExigente === null) r.HC -= Math.round((porSemana / descanso) * 10) / 10; // día sin entreno
  return r;
}
