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

const xml = (t) => new DOMParser().parseFromString(t, 'application/xml');
const col = (ref) => { let c = 0; for (const ch of ref.replace(/\d+/g, '')) c = c * 26 + (ch.charCodeAt(0) - 64); return c - 1; };

export async function leerXlsx(buf) {
  const zip = await leerZip(buf);
  const comp = (await zip.texto('xl/sharedStrings.xml')) ?? '';
  const compartidas = comp ? [...xml(comp).getElementsByTagName('si')].map((si) => [...si.getElementsByTagName('t')].map((t) => t.textContent).join('')) : [];
  const libro = xml(await zip.texto('xl/workbook.xml'));
  const rels = xml((await zip.texto('xl/_rels/workbook.xml.rels')) ?? '<r/>');
  const destino = {};
  for (const r of rels.getElementsByTagName('Relationship')) destino[r.getAttribute('Id')] = r.getAttribute('Target');
  const hojas = {};
  for (const s of libro.getElementsByTagName('sheet')) {
    const rid = s.getAttribute('r:id') ?? s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
    let ruta = destino[rid] ?? '';
    ruta = ruta.startsWith('/') ? ruta.slice(1) : 'xl/' + ruta.replace(/^\.\//, '');
    const t = await zip.texto(ruta);
    if (!t) continue;
    const filas = [];
    for (const row of xml(t).getElementsByTagName('row')) {
      const fila = [];
      for (const c of row.getElementsByTagName('c')) {
        const tipo = c.getAttribute('t'), vEl = c.getElementsByTagName('v')[0];
        let val = null;
        if (tipo === 's') val = compartidas[+vEl?.textContent] ?? '';
        else if (tipo === 'inlineStr') val = [...c.getElementsByTagName('t')].map((x) => x.textContent).join('');
        else if (tipo === 'b') val = vEl?.textContent === '1';
        else if (vEl) val = tipo === 'str' || tipo === 'e' ? vEl.textContent : Number(vEl.textContent);
        fila[col(c.getAttribute('r') ?? 'A')] = val;
      }
      filas[(+row.getAttribute('r') || filas.length + 1) - 1] = fila;
    }
    hojas[s.getAttribute('name')] = Array.from(filas, (f) => f ?? []);
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
