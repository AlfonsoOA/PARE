// Medidas corporales además del peso, la cintura y el cuello: perímetros y lo que da una báscula de bioimpedancia.
export const MEDIDAS_EXTRA = [
  ['cadera', 'Cadera', 'cm'], ['pecho', 'Pecho', 'cm'], ['hombros', 'Hombros', 'cm'],
  ['brazo', 'Brazo relajado', 'cm'], ['brazoFlex', 'Brazo flexionado', 'cm'], ['muslo', 'Muslo', 'cm'],
  ['grasaBascula', 'Grasa (báscula)', '%'], ['musculoBascula', 'Músculo (báscula)', '%'], ['visceral', 'Grasa visceral (báscula)', 'nivel'],
];
export const CAMPOS_MEDIDA = ['peso', 'cintura', 'cuello', ...MEDIDAS_EXTRA.map(([k]) => k)];

/** Junta medidas por fecha: lo que trae el archivo rellena o corrige ese día; nada se borra. Devuelve cuántos días ha tocado. */
export function fundirMedidas(destino, nuevas) {
  let n = 0;
  for (const m of nuevas ?? []) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(m?.fecha ?? '')) continue;
    const limpio = Object.fromEntries(CAMPOS_MEDIDA.filter((k) => m[k] != null && m[k] !== '' && isFinite(+m[k])).map((k) => [k, +m[k]]));
    if (!Object.keys(limpio).length) continue;
    const i = destino.findIndex((x) => x.fecha === m.fecha);
    if (i >= 0) destino[i] = { ...destino[i], ...limpio }; else destino.push({ fecha: m.fecha, ...limpio });
    n++;
  }
  destino.sort((a, b) => a.fecha.localeCompare(b.fecha));
  return n;
}
