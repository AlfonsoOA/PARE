// «Qué dicen tus medidas»: lectura orientativa de la tendencia del peso, la cintura y la fuerza según tu fase (déficit,
// mantenimiento o superávit). Umbrales de la bibliografía (ver «En qué se basa PARE» → «Cómo lee PARE tus medidas»).
import { estadosEjercicios } from './avisos.js';

const DIA = 864e5;
const dias = (a, b) => (Date.parse(b) - Date.parse(a)) / DIA;
const f1 = (v) => v.toLocaleString('es-ES', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const f2 = (v) => v.toLocaleString('es-ES', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

/** Tendencia del peso: regresión de las últimas 4 semanas (o 6 si hay pocas pesadas). */
export function tendenciaPeso(medidas, hoy) {
  for (const ventana of [28, 42]) {
    const ps = medidas.filter((m) => m.peso && dias(m.fecha, hoy) <= ventana && dias(m.fecha, hoy) >= 0);
    if (ps.length < 3 || dias(ps[0].fecha, ps.at(-1).fecha) < 14) continue;
    const xs = ps.map((m) => dias(ps[0].fecha, m.fecha)), ys = ps.map((m) => m.peso);
    const mx = xs.reduce((s, x) => s + x, 0) / xs.length, my = ys.reduce((s, y) => s + y, 0) / ys.length;
    const pend = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / Math.max(1e-9, xs.reduce((s, x) => s + (x - mx) ** 2, 0));
    return { kgSem: pend * 7, pctSem: (pend * 7 / my) * 100, semanas: Math.round(dias(ps[0].fecha, ps.at(-1).fecha) / 7), desde: ps[0].fecha };
  }
  return null;
}

/** Cambio de cintura: la última frente a la medida más cercana a 4-8 semanas antes (mínimo 3 semanas). */
export function cambioCintura(medidas) {
  const cs = medidas.filter((m) => m.cintura);
  if (cs.length < 2) return null;
  const ult = cs.at(-1);
  const previas = cs.filter((m) => dias(m.fecha, ult.fecha) >= 21);
  if (!previas.length) return null;
  const ref = previas.filter((m) => dias(m.fecha, ult.fecha) <= 63).at(0) ?? previas.at(-1);
  return { cm: ult.cintura - ref.cintura, desde: ref.fecha, hasta: ult.fecha, semanas: Math.round(dias(ref.fecha, ult.fecha) / 7), ultima: ult.cintura };
}

/** Devuelve [{ tipo: 'bien' | 'aviso' | 'neutro', t }] para la tarjeta. */
export function interpretarMedidas(d, hoy) {
  const fase = d.perfil.faseDieta || 'mantenimiento';
  const out = [];
  const tp = tendenciaPeso(d.medidas, hoy);
  const cc = cambioCintura(d.medidas);
  const baja = cc && cc.cm <= -1, sube = cc && cc.cm >= 1; // la cinta tiene ~1 cm de error

  if (!tp && !cc) return [{ tipo: 'neutro', t: 'Hacen falta al menos 3 pesadas en 2 semanas, o dos medidas de cintura separadas 3 semanas, para poder leer la tendencia.' }];

  if (tp) {
    const ritmo = `${tp.kgSem > 0 ? '+' : ''}${f2(tp.kgSem)} kg/semana (${tp.pctSem > 0 ? '+' : ''}${f2(tp.pctSem)} %) en las últimas ${tp.semanas} semanas`;
    if (fase === 'deficit') {
      if (tp.pctSem < -1) out.push({ tipo: 'aviso', t: `Peso: ${ritmo}. Bajas más rápido del 1 % semanal: a ese ritmo es más fácil perder músculo y fuerza. Valora comer algo más.` });
      else if (tp.pctSem <= -0.5) out.push({ tipo: 'bien', t: `Peso: ${ritmo}. Dentro del ritmo recomendado para perder grasa conservando el músculo (0,5-1 % semanal).` });
      else if (tp.pctSem <= -0.25) out.push({ tipo: 'bien', t: `Peso: ${ritmo}. Ritmo lento pero válido: conserva muy bien el músculo, aunque tarda más.` });
      else out.push({ tipo: 'aviso', t: `Peso: ${ritmo}. En déficit, el peso debería bajar: ahora mismo estás más bien en mantenimiento.${baja ? ' Eso sí, la cintura baja: sigues perdiendo grasa.' : ' Revisa lo que comes o ajusta el plan.'}` });
    } else if (fase === 'superavit') {
      if (tp.pctSem > 0.5) out.push({ tipo: 'aviso', t: `Peso: ${ritmo}. Subes más rápido del 0,5 % semanal: a ese ritmo, buena parte será grasa.` });
      else if (tp.pctSem >= 0.1) out.push({ tipo: 'bien', t: `Peso: ${ritmo}. Dentro del ritmo recomendado para ganar músculo con poca grasa (0,25-0,5 % semanal; algo menos si llevas años entrenando).` });
      else out.push({ tipo: 'aviso', t: `Peso: ${ritmo}. En superávit, el peso debería subir poco a poco: ahora no sube.` });
    } else {
      if (Math.abs(tp.pctSem) <= 0.25) out.push({ tipo: 'bien', t: `Peso: ${ritmo}. Estable, como corresponde al mantenimiento.` });
      else if (tp.pctSem < 0) out.push({ tipo: 'neutro', t: `Peso: ${ritmo}. Bajas aunque tu fase es mantenimiento: comes algo por debajo de tu gasto.` });
      else out.push({ tipo: 'neutro', t: `Peso: ${ritmo}. Subes aunque tu fase es mantenimiento: comes algo por encima de tu gasto.` });
    }
  }

  if (cc) {
    const txt = `Cintura: ${cc.cm > 0 ? '+' : ''}${f1(cc.cm)} cm en ${cc.semanas} semanas`;
    const pesoEstable = tp && Math.abs(tp.pctSem) <= 0.25;
    if (baja && pesoEstable) out.push({ tipo: 'bien', t: `${txt}, con el peso estable. Es la señal típica de recomposición: menos grasa abdominal y el mismo o más músculo.` });
    else if (baja) out.push({ tipo: 'bien', t: `${txt}. La cintura es la mejor pista casera de la grasa abdominal: va en la buena dirección.` });
    else if (sube && fase === 'superavit') out.push({ tipo: cc.cm >= 2 ? 'aviso' : 'neutro', t: `${txt}. En superávit es normal que suba algo; si sube más deprisa que el brazo o el muslo, es más grasa que músculo.` });
    else if (sube) out.push({ tipo: 'aviso', t: `${txt}. Puede ser grasa o una medida tomada distinto: repítela en las mismas condiciones antes de sacar conclusiones.` });
    else out.push({ tipo: 'neutro', t: `${txt}: sin cambios por encima del error de la cinta (unos 1 cm).${pesoEstable ? ' Con el peso estable, la composición cambia despacio: mira la fuerza.' : ''}` });
  }

  const est = Object.values(estadosEjercicios(d));
  const suben = est.filter((e) => e.estado === 'progresando').length, bajan = est.filter((e) => e.estado === 'bajando').length;
  if (suben + bajan) {
    if (bajan >= 2 && bajan >= suben) out.push({ tipo: 'aviso', t: `Fuerza: ${bajan} ejercicios bajan.${fase === 'deficit' ? ' En déficit puede ser señal de que te pasas: valora comer algo más o recortar volumen.' : ' Revisa descanso, sueño y comida.'}` });
    else if (suben) out.push({ tipo: 'bien', t: `Fuerza: ${suben} ${suben === 1 ? 'ejercicio progresa' : 'ejercicios progresan'}${bajan ? ` y ${bajan} ${bajan === 1 ? 'baja' : 'bajan'}` : ''}. Que la fuerza suba es la mejor señal de que conservas o ganas músculo.` });
  }

  const alt = +d.perfil.altura;
  if (cc && alt) {
    const r = cc.ultima / alt;
    const zona = r < 0.4 ? 'por debajo de 0,4 (muy bajo)' : r < 0.48 ? 'por debajo de 0,5: zona saludable' : r < 0.5 ? 'justo por debajo de 0,5: zona saludable, en el límite' : r < 0.6 ? 'entre 0,5 y 0,59: riesgo cardiometabólico aumentado' : '0,6 o más: riesgo alto';
    out.push({ tipo: r >= 0.5 ? 'aviso' : 'bien', t: `Cintura/altura: ${r.toLocaleString('es-ES', { maximumFractionDigits: 3, minimumFractionDigits: 3 })}, ${zona}. Es el indicador casero de grasa abdominal con más respaldo; la referencia es «tu cintura, menos de la mitad de tu altura».` });
  }
  return out;
}
