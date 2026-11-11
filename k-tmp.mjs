import { createServer } from 'vite';
import { readFileSync } from 'node:fs';
const srv = await createServer({ root: process.cwd(), server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const c = await srv.ssrLoadModule('/src/lib/catalogo.js');
const d = JSON.parse(readFileSync('public/data/pare.json', 'utf8'));
Object.assign(c.cat, d); c.cat.porId = new Map(d.ejercicios.map((e) => [e.id, e])); c.cat.alimentoPorId = new Map(d.alimentos.map((a) => [a.id, a])); c.cat.recetaPorId = new Map(d.recetas.map((r) => [r.id, r]));
const est = await srv.ssrLoadModule('/src/lib/estado.svelte.js');
const plan = await srv.ssrLoadModule('/src/lib/plan.js');
const menu = await srv.ssrLoadModule('/src/lib/menu.js');
const dt = await srv.ssrLoadModule('/src/lib/dieta.js');
const casos = [
  ['Alfonso recomp', { sexo: 'hombre', edad: 45, altura: 178, peso: 84, objetivo: 'recomposicion', diasSemana: 5, trabajo: 'sentado', pasos: '8000-12000', deportes: 0, comidasDia: 4, cintura: 92, cuello: 40 }],
  ['Mujer perder', { sexo: 'mujer', edad: 35, altura: 165, peso: 70, objetivo: 'perder_grasa', diasSemana: 3, trabajo: 'de_pie', pasos: '5000-8000', deportes: 0, comidasDia: 4 }],
  ['Joven ganar', { sexo: 'hombre', edad: 22, altura: 180, peso: 70, objetivo: 'ganar_musculo', diasSemana: 4, trabajo: 'sentado', pasos: '5000-8000', deportes: 0, comidasDia: 5 }],
];
for (const [nom, p] of casos) {
  est.app.datos.perfil = { ...est.app.datos.perfil, ...p, alergenos: [], test: { aversiones: '' } };
  const dieta = plan.generarDieta(est.app.datos.perfil);
  const m = menu.proponerMenu(dieta, est.app.datos.perfil);
  const dias = [];
  for (let dia = 0; dia < 7; dia++) { const t = dt.sumar(Object.values(m[dia]).flat()); dias.push(t); }
  const media = (k) => dias.reduce((s, t) => s + t[k], 0) / 7;
  const rng = (k) => `${Math.round(Math.min(...dias.map((t) => t[k])))}-${Math.round(Math.max(...dias.map((t) => t[k])))}`;
  console.log(`${nom}: objetivo ${dieta.kcal} kcal P${dieta.p} HC${dieta.hc} G${dieta.g} | raciones ${JSON.stringify(dieta.raciones)}`);
  console.log(`   menú medio ${Math.round(media('kcal'))} kcal (${rng('kcal')}) P${Math.round(media('p'))} (${rng('p')}) HC${Math.round(media('hc'))} G${Math.round(media('g'))} → ${(100 * (media('kcal') / dieta.kcal - 1)).toFixed(0)} %`);
}
await srv.close();
