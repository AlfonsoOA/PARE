// Del test de inicio al plan: rutina (plantillas de reparto + elección de ejercicios) y dieta.
import { cat, ej } from './catalogo.js';
import { uuid } from './estado.svelte.js';
import { descansoPorDefecto, duracionSesion, restriccion, volumenPlanificado, pesosGrupo, banda, pesosDeltoides, deltoidesPlanificado, MIN_CABEZA } from './entreno.js';
import { GRUPOS } from './catalogo.js';

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
  torso: ['Torso', [['empuje_horizontal', 'P'], ['traccion_vertical', 'P'], ['empuje_vertical', 'A'], ['traccion_horizontal', 'A'], ['aduccion_horizontal_hombro', 'A'], ['flexion_codo', 'A'], ['extension_codo', 'A']]],
  pierna: ['Pierna', [['sentadilla', 'P'], ['bisagra_cadera', 'P'], ['zancada_unilateral', 'A'], ['flexion_rodilla', 'A'], ['extension_rodilla', 'A'], ['flexion_plantar', 'A']], true],
  pechoW: ['Pecho', [['empuje_horizontal', 'P'], ['empuje_horizontal', 'A'], ['aduccion_horizontal_hombro', 'A'], ['empuje_horizontal', 'A'], ['core_flexion', 'A']]],
  espaldaW: ['Espalda', [['traccion_vertical', 'P'], ['traccion_horizontal', 'P'], ['traccion_vertical', 'A'], ['traccion_horizontal', 'A'], ['elevacion_escapular', 'A']]],
  piernaW: ['Pierna', [['sentadilla', 'P'], ['bisagra_cadera', 'P'], ['zancada_unilateral', 'A'], ['flexion_rodilla', 'A'], ['extension_rodilla', 'A'], ['flexion_plantar', 'A']], true],
  hombrosW: ['Hombros', [['empuje_vertical', 'P'], ['elevacion_hombro', 'A'], ['abduccion_horizontal_hombro', 'A'], ['elevacion_hombro', 'A'], ['core_estabilidad', 'A']]],
  brazosW: ['Brazos', [['flexion_codo', 'A'], ['extension_codo', 'A'], ['flexion_codo', 'A'], ['extension_codo', 'A'], ['flexion_codo', 'A'], ['antebrazo_agarre', 'A']]],
};

/** Repartos disponibles. `dias` = días por semana con los que encaja. */
export const REPARTOS = [
  { id: 'completo', nombre: 'Cuerpo completo', dias: [2, 3], sesiones: (n) => ['fullA', 'fullB', 'fullC'].slice(0, n), nota: 'Todo el cuerpo en cada sesión. Ideal con pocos días.' },
  { id: 'torso_pierna', nombre: 'Torso / Pierna', dias: [2, 4], sesiones: (n) => (n === 2 ? ['torso', 'pierna'] : ['torsoA', 'piernaA', 'torsoB', 'piernaB']), nota: 'Cada grupo dos veces por semana con 4 días.' },
  { id: 'torso_pierna_extra', nombre: 'Torso / Pierna + extra', dias: [5], sesiones: () => ['torsoA', 'piernaA', 'torsoB', 'piernaB', 'brazos'], nota: 'El quinto día, hombros y brazos.' },
  { id: 'ppl', nombre: 'Empuje / Tirón / Pierna', dias: [3, 6], sesiones: (n) => (n === 3 ? ['empuje', 'tiron', 'piernaA'] : ['empuje', 'tiron', 'piernaA', 'empuje', 'tiron', 'piernaB']), nota: 'Con 6 días, cada grupo dos veces por semana.' },
  { id: 'ppl_tp', nombre: 'Empuje / Tirón / Pierna + Torso / Pierna', dias: [5], sesiones: () => ['empuje', 'tiron', 'piernaA', 'torso', 'piernaB'], nota: 'Mezcla los dos repartos más usados.' },
  { id: 'ppl_tp_extra', nombre: 'Empuje / Tirón / Pierna + Torso / Pierna + extra', dias: [6], sesiones: () => ['empuje', 'tiron', 'piernaA', 'torso', 'piernaB', 'brazos'], nota: 'El sexto día, hombros y brazos.' },
  { id: 'weider', nombre: 'Un grupo por día (Weider)', dias: [4, 5], sesiones: (n) => (n === 4 ? ['pechoW', 'espaldaW', 'piernaW', 'hombrosW'] : ['pechoW', 'espaldaW', 'piernaW', 'hombrosW', 'brazosW']), nota: 'Cada grupo una vez por semana: sesiones largas por músculo. Con el mismo volumen semanal, rinde parecido a repartos más frecuentes.' },
];
export const REPARTO_POR_DEFECTO = { 2: 'completo', 3: 'completo', 4: 'torso_pierna', 5: 'torso_pierna_extra', 6: 'ppl' };
export const repartosPara = (dias) => REPARTOS.filter((r) => r.dias.includes(dias));

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

export function generarRutina(perfil, ajustes, repartoId = null, cargasPrevias = null) {
  const dias = Math.min(6, Math.max(2, perfil.diasSemana || 3));
  const pedido = REPARTOS.find((r) => r.id === (repartoId ?? perfil.reparto));
  const reparto = pedido && pedido.dias.includes(dias) ? pedido : REPARTOS.find((r) => r.id === REPARTO_POR_DEFECTO[dias]);
  const objetivo = objetivoEntreno(perfil.objetivo);
  const usados = new Set();
  const sesiones = reparto.sesiones(dias).map((clave) => {
    const [nombre, huecos, exigente] = S[clave];
    const items = [];
    for (const [patron, papel] of huecos) {
      // en repartos de un grupo por día se repiten patrones: se permiten ejercicios distintos del mismo patrón
      const e = elegirEjercicio(patron, perfil, usados, papel);
      if (!e) continue;
      usados.add(e.id);
      const it = { ...nuevoItem(e.id, objetivo, papel), papel };
      if (cargasPrevias?.[e.id] != null) it.carga = cargasPrevias[e.id];
      items.push(it);
    }
    return { id: uuid(), nombre, exigente: !!exigente, items };
  });
  const cuenta = {};
  for (const s of sesiones) cuenta[s.nombre] = (cuenta[s.nombre] || 0) + 1;
  const vistos = {};
  for (const s of sesiones) if (cuenta[s.nombre] > 1) s.nombre = `${s.nombre} ${(vistos[s.nombre] = (vistos[s.nombre] || 0) + 1)}`;
  const rutina = { id: uuid(), version: 1, creada: new Date().toISOString(), nombre: `${reparto.nombre}, ${dias} días`, reparto: reparto.id, objetivo, sesiones };
  balancearVolumen(rutina, dias);
  ajustarDuracion(rutina, perfil, ajustes);
  completarDeltoides(rutina, dias, perfil, usados, objetivo);
  balancearVolumen(rutina, dias);
  return rutina;
}

/** Que las cabezas lateral y posterior lleguen a su mínimo: primero más series del ejercicio que las trabaja
 *  directamente; si no hay ninguno, se añade una elevación lateral o un pájaro en la sesión más corta de torso. */
const PATRON_CABEZA = { lateral: 'elevacion_hombro', posterior: 'abduccion_horizontal_hombro' };
function completarDeltoides(rutina, dias, perfil, usados, objetivo) {
  for (const c of ['lateral', 'posterior']) {
    for (let vuelta = 0; vuelta < 8; vuelta++) {
      if (deltoidesPlanificado(rutina, dias)[c] >= MIN_CABEZA(dias)) break;
      const items = rutina.sesiones.flatMap((s) => s.items).filter((it) => pesosDeltoides(it.ej)[c] === 1);
      const subir = items.filter((it) => it.series < 4).sort((a, b) => a.series - b.series)[0];
      if (subir) { subir.series++; continue; }
      if (items.length >= rutina.sesiones.length) break; // ya hay uno por sesión: no más
      const e = elegirEjercicio(PATRON_CABEZA[c], perfil, usados, 'A');
      if (!e) break;
      usados.add(e.id);
      const torso = rutina.sesiones.filter((s) => !/pierna/i.test(s.nombre) && !s.items.some((it) => pesosDeltoides(it.ej)[c] === 1));
      const destino = (torso.length ? torso : rutina.sesiones).reduce((a, b) => (a.items.length <= b.items.length ? a : b));
      destino.items.push({ ...nuevoItem(e.id, objetivo, 'A'), series: 2, papel: 'A' });
    }
  }
}

/** Ajusta series para que cada grupo quede dentro de su banda semanal: la rutina que propone PARE no debe saltar sus propios avisos. */
export function balancearVolumen(rutina, dias) {
  const todos = () => rutina.sesiones.flatMap((s) => s.items.map((it) => ({ s, it })));
  for (let vuelta = 0; vuelta < 60; vuelta++) {
    const v = volumenPlanificado(rutina, dias);
    const alto = GRUPOS.find((g) => v[g] > banda(g, dias).max);
    const bajo = GRUPOS.find((g) => ['pecho', 'espalda', 'hombros', 'piernas'].includes(g) && v[g] < banda(g, dias).min);
    if (alto) {
      // primero bajar series de accesorios que trabajan ese grupo; si ya están a 2, quitar el accesorio
      const cand = todos().filter(({ it }) => pesosGrupo(it.ej)[alto] && it.papel !== 'P').sort((a, b) => (pesosGrupo(b.it.ej)[alto] || 0) - (pesosGrupo(a.it.ej)[alto] || 0));
      const bajar = cand.find(({ it }) => it.series > 2);
      if (bajar) { bajar.it.series--; continue; }
      const quitar = cand.find(({ s }) => s.items.length > 3);
      if (quitar) { quitar.s.items.splice(quitar.s.items.indexOf(quitar.it), 1); continue; }
      break;
    }
    if (bajo) {
      const cand = todos().filter(({ it }) => (pesosGrupo(it.ej)[bajo] || 0) === 1 && it.series < 4).sort((a, b) => a.it.series - b.it.series);
      if (cand.length) { cand[0].it.series++; continue; }
      break;
    }
    break;
  }
}
function ajustarDuracion(rutina, perfil, ajustes) {
  const limite = (perfil.minutos || 60) * 60;
  for (const s of rutina.sesiones) {
    while (duracionSesion(s.items, ajustes) > limite && s.items.filter((x) => x.papel === 'A').length > 2) {
      const k = s.items.map((x) => x.papel).lastIndexOf('A');
      s.items.splice(k, 1);
    }
    for (const it of s.items) if (duracionSesion(s.items, ajustes) > limite && it.papel === 'A' && it.series > 2) it.series = 2;
  }
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
