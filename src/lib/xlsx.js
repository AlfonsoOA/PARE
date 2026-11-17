// Lector mínimo de .xlsx (y .csv) sin librerías: un .xlsx es un zip con XML dentro.
// Devuelve { hojas: { nombre: [[celda, …], …] } } con las celdas como texto o número.

async function inflar(datos, metodo) {
  if (metodo === 0) return datos;
  if (metodo !== 8) throw new Error('Compresión no soportada');
  const ds = new DecompressionStream('deflate-raw');
  const flujo = new Blob([datos]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(flujo).arrayBuffer());
}

async function leerZip(buf) {
  const v = new DataView(buf), u8 = new Uint8Array(buf);
  let fin = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 70000); i--) if (v.getUint32(i, true) === 0x06054b50) { fin = i; break; }
  if (fin < 0) throw new Error('No es un archivo .xlsx');
  const n = v.getUint16(fin + 10, true);
  let p = v.getUint32(fin + 16, true);
  const dec = new TextDecoder();
  const archivos = {};
  for (let k = 0; k < n; k++) {
    if (v.getUint32(p, true) !== 0x02014b50) break;
    const metodo = v.getUint16(p + 10, true), comp = v.getUint32(p + 20, true);
    const ln = v.getUint16(p + 28, true), le = v.getUint16(p + 30, true), lc = v.getUint16(p + 32, true);
    const local = v.getUint32(p + 42, true);
    const nombre = dec.decode(u8.subarray(p + 46, p + 46 + ln));
    const ini = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
    archivos[nombre] = { metodo, datos: u8.subarray(ini, ini + comp) };
    p += 46 + ln + le + lc;
  }
  return {
    async texto(nombre) {
      const a = archivos[nombre];
      return a ? dec.decode(await inflar(a.datos, a.metodo)) : null;
    },
  };
}

// XML por expresiones regulares (sirve igual en el navegador y en Node, sin DOMParser)
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const desc = (t) => t.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => (e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : +e.slice(1)) : ENT[e] ?? m));
const attr = (tag, n) => tag.match(new RegExp(`\\s${n}="([^"]*)"`))?.[1] ?? null;
const textos = (frag) => [...frag.matchAll(/<(?:\w+:)?t(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?t>|<(?:\w+:)?t\s*\/>/g)].map((m) => desc(m[1] ?? '')).join('');
const col = (ref) => { let c = 0; for (const ch of ref.replace(/\d+/g, '')) c = c * 26 + (ch.charCodeAt(0) - 64); return c - 1; };

export async function leerXlsx(buf) {
  const zip = await leerZip(buf);
  const comp = (await zip.texto('xl/sharedStrings.xml')) ?? '';
  const compartidas = [...comp.matchAll(/<(?:\w+:)?si>([\s\S]*?)<\/(?:\w+:)?si>/g)].map((m) => textos(m[1]));
  const libro = (await zip.texto('xl/workbook.xml')) ?? '';
  const rels = (await zip.texto('xl/_rels/workbook.xml.rels')) ?? '';
  const destino = {};
  for (const m of rels.matchAll(/<Relationship\b[^>]*>/g)) destino[attr(m[0], 'Id')] = attr(m[0], 'Target');
  const hojas = {};
  for (const m of libro.matchAll(/<(?:\w+:)?sheet\b[^>]*>/g)) {
    const rid = attr(m[0], 'r:id');
    let ruta = destino[rid] ?? '';
    ruta = ruta.startsWith('/') ? ruta.slice(1) : 'xl/' + ruta.replace(/^\.\//, '');
    const t = await zip.texto(ruta);
    if (!t) continue;
    const filas = [];
    for (const fr of t.matchAll(/<(?:\w+:)?row\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?row>/g)) {
      const fila = [];
      for (const c of fr[2].matchAll(/<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g)) {
        const a = c[1], dentro = c[2] ?? '';
        const tipo = attr(a, 't'), v = dentro.match(/<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/)?.[1];
        let val = null;
        if (tipo === 's') val = compartidas[+v] ?? '';
        else if (tipo === 'inlineStr') val = textos(dentro);
        else if (tipo === 'b') val = v === '1';
        else if (v != null) val = tipo === 'str' || tipo === 'e' ? desc(v) : Number(v);
        fila[col(attr(a, 'r') ?? 'A')] = val;
      }
      filas[(+attr(fr[1], 'r') || filas.length + 1) - 1] = fila;
    }
    hojas[desc(attr(m[0], 'name') ?? 'Hoja')] = Array.from(filas, (f) => Array.from(f ?? [], (x) => (x === undefined ? null : x)));
  }
  return { hojas };
}

export function leerCsv(texto) {
  const lineas = texto.replace(/\r/g, '').split('\n').filter((l) => l.trim());
  const sep = (lineas[0]?.match(/;/g)?.length ?? 0) > (lineas[0]?.match(/,/g)?.length ?? 0) ? ';' : ',';
  const filas = lineas.map((l) => {
    const out = []; let cur = '', q = false;
    for (let i = 0; i < l.length; i++) {
      const ch = l[i];
      if (q) { if (ch === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
      else if (ch === '"') q = true; else if (ch === sep) { out.push(cur); cur = ''; } else cur += ch;
    }
    out.push(cur);
    return out.map((x) => (x !== '' && !isNaN(+x.replace(',', '.')) ? +x.replace(',', '.') : x));
  });
  return { hojas: { Hoja1: filas } };
}

export async function leerHojaDeCalculo(file) {
  if (/\.csv$/i.test(file.name)) return leerCsv(await file.text());
  return leerXlsx(await file.arrayBuffer());
}
