// Cálculos de entrenamiento: descansos, duración, volumen, progresión, récords, avisos.
// Las reglas vienen de la especificación (sección Algoritmos y Decisiones de diseño de la v1).
import { cat, ej, GRUPOS } from './catalogo.js';

export const PONDERACION = { principal: 1, secundario: 0.5 };

// ---------- Superseries: bloques ----------
/** Agrupa los ítems de una sesión en bloques (una superserie = varios ítems unidos con `unir`). */
export function bloques(items) {
  const out = [];
  let actual = [];
  items.forEach((it, i) => {
    actual.push({ it, i });
    if (!it.unir || i === items.length - 1) { out.push(actual); actual = []; }
  });
  return out;
}
/** Etiqueta tipo A1, A2, B1… para los ítems en superserie; '' para series simples. */
export function etiquetasBloque(items) {
  const et = items.map(() => '');
  let letra = 0;
  for (const b of bloques(items)) {
    if (b.length > 1) {
      const L = String.fromCharCode(65 + letra++);
      b.forEach((x, k) => (et[x.i] = `${L}${k + 1}`));
    }
  }
  return et;
}

// ---------- Descansos (hoja DESCANSOS) ----------
const COMPUESTO_PESADO = new Set([
  'empuje_horizontal', 'empuje_vertical', 'traccion_vertical', 'traccion_horizontal', 'sentadilla',
  'bisagra_cadera', 'levantamiento_olimpico', 'sentadilla_empuje', 'zancada_unilateral',
]);
/** Multiarticular básico: compuesto de un patrón principal (press, remo, jalón, sentadilla, bisagra…). */
export const esBasico = (e) => !!e && e.mec === 'compuesto' && COMPUESTO_PESADO.has(e.pat);
export function esExigente(e) {
  return esBasico(e) && (e.carga === 'externa' || e.carga === 'peso_corporal');
}
export function descansoPorDefecto(idEj, objetivo) {
  const e = ej(idEj);
  if (!e) return 90;
  if (e.pat === 'levantamiento_olimpico') return 180;
  if (e.pat === 'salto') return 90;
  if (e.pat === 'locomocion_cardio' || e.ud !== 'repeticiones') return 60;
  const compuesto = e.mec === 'compuesto';
  if (objetivo === 'fuerza') return compuesto ? 240 : 150;
  if (objetivo === 'resistencia') return 60;
  return compuesto ? 150 : 90;
}
export const DESCANSO_ENTRE_SUPERSERIE = 15;

// ---------- Incremento de carga según equipamiento ----------
export function incremento(idEj, ajustes) {
  const e = ej(idEj);
  const inc = ajustes?.incrementos ?? { barra: 2.5, mancuerna: 2, maquina: 5, polea: 5, otro: 2.5 };
  if (!e) return inc.otro;
  if (e.eq === 'barra' || e.eq === 'barra_z') return inc.barra;
  if (e.eq === 'mancuerna' || e.eq === 'kettlebell') return inc.mancuerna;
  if (e.eq === 'maquina') return inc.maquina;
  if (e.eq === 'polea') return inc.polea;
  return inc.otro;
}

// ---------- Carga efectiva y 1RM estimado ----------
export const usaPesoCorporal = (e) => e && (e.carga === 'peso_corporal' || e.carga === 'isometrico_peso_corporal');

/** Carga que mueve de verdad la serie: externa, o peso corporal × fracción + lastre − asistencia. */
export function cargaEfectiva(e, serie, pesoCorporal) {
  if (!e) return 0;
  if (usaPesoCorporal(e)) return (pesoCorporal || 0) * (e.frac ?? 1) + (serie.carga || 0);
  return serie.carga || 0;
}
export const e1rm = (carga, reps) => (carga > 0 && reps > 0 ? carga * (1 + reps / 30) : 0);

// ---------- Duración estimada ----------
export function duracionSesion(items, ajustes) {
  const seg = ajustes?.segPorSerie ?? 40;
  let t = 0;
  for (const b of bloques(items)) {
    const rondas = Math.max(...b.map((x) => x.it.series || 0));
    const tiempoSerie = (x) => (ej(x.it.ej)?.ud === 'tiempo' ? x.it.repMax || seg : seg);
    if (b.length === 1) {
      const x = b[0];
      t += x.it.series * tiempoSerie(x) + Math.max(0, x.it.series - 1) * (x.it.descanso || 90);
    } else {
      const rondaT = b.reduce((s, x) => s + tiempoSerie(x), 0) + (b.length - 1) * DESCANSO_ENTRE_SUPERSERIE;
      const desc = Math.max(...b.map((x) => x.it.descanso || 90));
      t += rondas * rondaT + Math.max(0, rondas - 1) * desc;
    }
    t += 60; // cambio de ejercicio o de bloque
  }
  return t;
}

// ---------- Volumen semanal por grupo (conteo fraccional, máx. una vez por grupo) ----------
export function pesosGrupo(idEj) {
  const e = ej(idEj);
  const w = {};
  if (!e || !e.vol) return w;
  for (const g of e.gp || []) w[g] = Math.max(w[g] || 0, PONDERACION.principal);
  for (const g of e.gs || []) w[g] = Math.max(w[g] || 0, PONDERACION.secundario);
  return w;
}
export function lunes(iso) {
  const d = new Date(iso + 'T12:00:00');
  const dia = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dia);
  return d.toISOString().slice(0, 10);
}
export function volumenSesionHecha(s) {
  const v = Object.fromEntries(GRUPOS.map((g) => [g, 0]));
  for (const x of s.ejercicios) {
    const n = x.series.filter((z) => z.hecha).length;
    for (const [g, w] of Object.entries(pesosGrupo(x.ej))) v[g] += n * w;
  }
  return v;
}
export function volumenSemana(sesiones, isoLunes) {
  const v = Object.fromEntries(GRUPOS.map((g) => [g, 0]));
  for (const s of sesiones) {
    if (lunes(s.fecha) !== isoLunes) continue;
    const vs = volumenSesionHecha(s);
    for (const g of GRUPOS) v[g] += vs[g];
  }
  return v;
}
/** Series semanales previstas por la rutina (cada sesión de la secuencia, una vez por semana si caben). */
export function volumenPlanificado(rutina, diasSemana) {
  const v = Object.fromEntries(GRUPOS.map((g) => [g, 0]));
  if (!rutina?.sesiones?.length) return v;
  const ses = rutina.sesiones;
  const factor = (diasSemana || ses.length) / ses.length;
  for (const s of ses) for (const it of s.items) {
    for (const [g, w] of Object.entries(pesosGrupo(it.ej))) v[g] += it.series * w * factor;
  }
  for (const g of GRUPOS) v[g] = Math.round(v[g] * 2) / 2;
  return v;
}
export const BANDA = { min: 10, max: 20 }; // RANGOS_VOLUMEN V02 (moderado), por grupo y semana
// "Piernas" junta cuádriceps, isquios, glúteos y gemelos: su banda es mayor. Antebrazos, core y cuello, más baja.
export const BANDA_GRUPO = { piernas: { min: 16, max: 40 }, core: { min: 4, max: 20 }, antebrazos: { min: 0, max: 16 }, cuello: { min: 0, max: 12 } };
export const banda = (g) => BANDA_GRUPO[g] ?? BANDA;

// ---------- Comprobación de superseries (criterio anatómico y funcional) ----------
export function comprobarSuperserie(idA, idB) {
  const a = ej(idA), b = ej(idB);
  if (!a || !b) return null;
  const musA = new Set([...(a.mp || []), ...(a.ms || [])]);
  const comparten = [...(b.mp || []), ...(b.ms || [])].filter((m) => musA.has(m));
  const gruposComunes = (a.gp || []).filter((g) => (b.gp || []).includes(g));
  if (esExigente(a) && esExigente(b)) {
    return { nivel: 'aviso', tipo: 'exigente', texto: `${a.n} + ${b.n}: dos básicos pesados seguidos. El segundo va a salir peor.` };
  }
  if (esBasico(a) && esBasico(b) && comparten.length) {
    const m = cat.etiquetas.musculo?.[comparten[0]] ?? comparten[0];
    return { nivel: 'aviso', tipo: 'comparten', texto: `${b.n} tras ${a.n}: comparten ${m.toLowerCase()}, que ya llega cansado.` };
  }
  // Un básico + un ejercicio de apoyo del mismo grupo (fondos + aperturas): superserie buscada, solo se etiqueta.
  if ((gruposComunes.length || comparten.length) && esBasico(a) !== esBasico(b)) {
    return { nivel: 'etiqueta', tipo: esBasico(a) ? 'agotamiento' : 'prefatiga',
      texto: esBasico(a) ? 'Superserie de agotamiento' : 'Superserie de prefatiga' };
  }
  return null;
}
export function avisosSuperseries(items) {
  const out = [];
  for (const b of bloques(items)) {
    for (let k = 0; k < b.length - 1; k++) {
      const r = comprobarSuperserie(b[k].it.ej, b[k + 1].it.ej);
      if (r) out.push({ ...r, i: b[k + 1].i });
    }
  }
  return out;
}

// ---------- Molestias (RESTRICCIONES_DOLOR) ----------
/** Regla que se aplica a un ejercicio para las zonas declaradas. Manda la regla del ejercicio sobre la del patrón. */
export function restriccion(idEj, zonas) {
  if (!zonas?.length) return null;
  const e = ej(idEj);
  if (!e) return null;
  const orden = { evitar: 3, precaucion: 2, recomendado: 1 };
  let mejor = null;
  for (const z of zonas) {
    const deEj = cat.restricciones.filter((r) => r.zona === z && r.tipo === 'ejercicio' && r.objetivo === idEj);
    const dePat = cat.restricciones.filter((r) => r.zona === z && r.tipo === 'patron' && r.objetivo === e.pat);
    const cand = deEj.length ? deEj : dePat;
    for (const r of cand) if (!mejor || orden[r.nivel] > orden[mejor.nivel]) mejor = r;
  }
  return mejor;
}

// ---------- Progresión y récords ----------
/** Historial de un ejercicio: [{fecha, series:[{carga, reps, efectiva}]}], de más antiguo a más reciente. */
export function historialEjercicio(sesiones, idEj, pesoEn) {
  const e = ej(idEj);
  const out = [];
  for (const s of sesiones) {
    for (const x of s.ejercicios) {
      if (x.ej !== idEj) continue;
      const pc = pesoEn ? pesoEn(s.fecha) : 0;
      const series = x.series.filter((z) => z.hecha && z.reps > 0)
        .map((z) => ({ carga: z.carga, reps: z.reps, efectiva: cargaEfectiva(e, z, pc) }));
      if (series.length) out.push({ fecha: s.fecha, sesion: s.id, series });
    }
  }
  return out.sort((a, b) => a.fecha.localeCompare(b.fecha));
}
export function mejorSerie(series) {
  let m = null;
  for (const z of series) {
    const v = e1rm(z.efectiva, z.reps);
    if (!m || v > m.e1rm) m = { ...z, e1rm: v };
  }
  return m;
}
/** Récords de repeticiones: para cada nº de repeticiones, la mayor carga efectiva. */
export function recordsReps(hist) {
  const r = {};
  for (const h of hist) for (const z of h.series) {
    if (!r[z.reps] || z.efectiva > r[z.reps].efectiva) r[z.reps] = { ...z, fecha: h.fecha };
  }
  return r;
}
/** Qué se ha batido en la última sesión respecto a todo lo anterior. */
export function novedades(hist) {
  if (!hist.length) return [];
  const ult = hist.at(-1), previas = hist.slice(0, -1);
  if (!previas.length) return [];
  const out = [];
  const mejorAntes = Math.max(...previas.map((h) => mejorSerie(h.series).e1rm));
  const mUlt = mejorSerie(ult.series);
  if (mUlt.e1rm > mejorAntes + 0.01) out.push({ tipo: '1rm', serie: mUlt });
  const rec = recordsReps(previas);
  for (const z of ult.series) {
    // récord de repeticiones: más carga que nunca para ese número de repeticiones o más
    const antes = Object.entries(rec).filter(([r]) => +r >= z.reps).map(([, v]) => v.efectiva);
    if (z.efectiva > 0 && (!antes.length || z.efectiva > Math.max(...antes) + 0.01)) {
      out.push({ tipo: 'reps', serie: z }); break;
    }
  }
  return out;
}
export const PLAZO_ESTANCAMIENTO = { principiante: 17, intermedio: 35, avanzado: 70 }; // días (2,5 / 5 / 10 semanas)

/** Estado de un ejercicio: progresando, estable, estancado o bajando (en déficit, mantener cuenta como bien). */
export function estadoEjercicio(hist, nivel, faseDieta, hoy) {
  if (hist.length < 3) return { estado: 'nuevo' };
  let mejor = 0, ultimaMejora = hist[0].fecha;
  const recs = {};
  for (const h of hist) {
    const m = mejorSerie(h.series).e1rm;
    let mejora = m > mejor + 0.01;
    for (const z of h.series) {
      const antes = Object.entries(recs).filter(([r]) => +r >= z.reps).map(([, v]) => v);
      if (antes.length && z.efectiva > Math.max(...antes) + 0.01) mejora = true;
      if (!recs[z.reps] || z.efectiva > recs[z.reps]) recs[z.reps] = z.efectiva;
    }
    if (mejora) ultimaMejora = h.fecha;
    mejor = Math.max(mejor, m);
  }
  const dias = (new Date(hoy) - new Date(ultimaMejora)) / 864e5;
  const ultimas = hist.slice(-3).map((h) => mejorSerie(h.series).e1rm);
  const bajando = ultimas.every((v) => v < mejor * 0.95);
  if (bajando) return { estado: 'bajando', dias };
  const plazo = PLAZO_ESTANCAMIENTO[nivel] ?? 35;
  if (dias > plazo) {
    if (faseDieta === 'deficit') return { estado: 'mantiene', dias };
    return { estado: 'estancado', dias };
  }
  return { estado: dias < 14 ? 'progresando' : 'estable', dias };
}

/** Doble progresión: propuesta para la próxima vez a partir de lo hecho hoy. */
export function proponerSiguiente(item, hecho, ajustes) {
  const e = ej(item.ej);
  const series = (hecho?.series || []).filter((z) => z.hecha);
  const prop = { ...item };
  if (!series.length) return { prop, motivo: 'Sin series hechas: se mantiene.' };
  const cargaHoy = Math.max(...series.map((z) => z.carga ?? 0));
  if (item.carga == null) prop.carga = cargaHoy;
  const completas = series.length >= item.series && series.every((z) => (z.reps || 0) >= item.repMax && (z.carga ?? 0) >= (prop.carga ?? 0));
  if (!completas) return { prop, motivo: `Aún no has llegado a ${item.repMax} repeticiones en todas las series: misma carga.` };
  if (usaPesoCorporal(e) && !(prop.carga > 0)) {
    if (item.repMax < 20) {
      prop.repMin = item.repMin + 2; prop.repMax = item.repMax + 2;
      return { prop, motivo: `Todas las series a ${item.repMax}: sube el rango a ${prop.repMin}-${prop.repMax} (o añade lastre).` };
    }
    prop.carga = incremento(item.ej, ajustes);
    return { prop, motivo: 'Rango alto completado: empieza a añadir lastre.' };
  }
  prop.carga = (prop.carga ?? 0) + incremento(item.ej, ajustes);
  return { prop, motivo: `Todas las series a ${item.repMax}: sube la carga y vuelve a ${item.repMin} repeticiones.`, sube: true };
}

// ---------- Nivel ----------
const MESES_EXPERIENCIA = { nunca: 0, menos6m: 3, '6a24m': 12, '2a5a': 36, mas5a: 72 };
export function nivelActual(perfil, sesiones) {
  let meses = MESES_EXPERIENCIA[perfil?.test?.experiencia] ?? (perfil?.nivel === 'avanzado' ? 36 : perfil?.nivel === 'intermedio' ? 12 : 0);
  if (sesiones.length) {
    const primera = sesiones.reduce((m, s) => (s.fecha < m ? s.fecha : m), sesiones[0].fecha);
    const mesesApp = (Date.now() - new Date(primera)) / (864e5 * 30.4);
    const porSemana = sesiones.length / Math.max(1, mesesApp * 4.35);
    if (porSemana >= 2) meses += mesesApp;
  }
  return meses < 9 ? 'principiante' : meses < 48 ? 'intermedio' : 'avanzado';
}
