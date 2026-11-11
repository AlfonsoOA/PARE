// Tras `vite build`: genera dist/sw.js con la lista de todos los archivos de dist,
// para que la app funcione sin conexión desde la primera visita.
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const raiz = 'dist';
const archivos = [];
(function recorrer(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) recorrer(p);
    else if (!f.endsWith('.map') && f !== 'sw.js') archivos.push('./' + relative(raiz, p).split('\\').join('/'));
  }
})(raiz);

const hash = createHash('sha256');
for (const a of archivos.sort()) hash.update(a + readFileSync(join(raiz, a)).length);
const version = hash.digest('hex').slice(0, 10);

const sw = readFileSync('scripts/sw-plantilla.js', 'utf8')
  .replace('__VERSION__', version)
  .replace('__ARCHIVOS__', JSON.stringify(archivos.filter((a) => a !== './index.html').concat('./')));
writeFileSync(join(raiz, 'sw.js'), sw);
console.log(`sw.js: ${archivos.length} archivos, versión ${version}`);
