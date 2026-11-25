// Compartir una receta para leerla fuera de PARE (WhatsApp…): como texto formateado o como imagen tipo ficha.
// Las cantidades son las que se ven en pantalla (ajustadas a la comida elegida, receta base o lote).
import { fmtNum } from './unidades.js';

const URL_PARE = 'alfonsooa.github.io/PARE';
// Las etiquetas de búsqueda («Etiquetas: saciante, …») son para el buscador, no para quien lee la receta
const limpiarNotas = (t) => (t || '').replace(/\s*Etiquetas:[^.]*\.?/gi, '').trim();
const mayus = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const partirPaso = (p) => { const i = p.indexOf(':'); return i > 0 && i < 40 ? [p.slice(0, i).trim(), mayus(p.slice(i + 1).trim())] : [null, p]; };

/** datos: { titulo, para, ingredientes: [{ n, g, casero, nota }], resumen, pasos: [texto], notas, tiempo } */
export function textoReceta(d) {
  const l = [`*${d.titulo}*`];
  const info = [d.para, d.tiempo ? `${d.tiempo} min` : ''].filter(Boolean).join(' · ');
  if (info) l.push(`_${info}_`);
  l.push('', '*Ingredientes*');
  for (const i of d.ingredientes) l.push(`• ${fmtNum(i.g)} g ${i.n}${i.casero ? ` (${i.casero})` : ''}${i.nota ? ` — ${i.nota}` : ''}`);
  if (d.resumen) l.push(`_${d.resumen}_`);
  if (d.pasos?.length) {
    l.push('', '*Cómo se hace*');
    d.pasos.forEach((p, k) => { const [t, x] = partirPaso(p); l.push(`${k + 1}. ${t ? `*${t}:* ` : ''}${x}`); });
  }
  const n = limpiarNotas(d.notas);
  if (n) l.push('', n);
  l.push('', `Receta de PARE · ${URL_PARE}`);
  return l.join('\n');
}

// ---------- Imagen tipo ficha ----------
const C = { fondo: '#0F1114', sup: '#1A1D22', borde: '#2F343C', texto: '#F2F3F5', texto2: '#A3A9B3', acento: '#4CC97A' };
function lineas(ctx, texto, ancho) {
  const out = [];
  for (const parrafo of String(texto).split('\n')) {
    let linea = '';
    for (const w of parrafo.split(/\s+/)) {
      const prueba = linea ? `${linea} ${w}` : w;
      if (ctx.measureText(prueba).width > ancho && linea) { out.push(linea); linea = w; } else linea = prueba;
    }
    out.push(linea);
  }
  return out;
}

export async function imagenReceta(d) {
  try { await document.fonts?.ready; } catch { /* sin fuentes cargadas, usa las del sistema */ }
  const W = 1080, M = 72, A = W - 2 * M;
  const TIT = "800 76px 'Barlow Condensed', 'Inter', sans-serif";
  const SUB = "600 34px 'Barlow Condensed', 'Inter', sans-serif";
  const NOR = "400 30px 'Inter', sans-serif";
  const NEG = "600 30px 'Inter', sans-serif";
  const PEQ = "400 26px 'Inter', sans-serif";
  const cv = document.createElement('canvas');
  const ctx = cv.getContext('2d');

  // Se dibuja dos veces: la primera solo mide la altura
  const dibujar = (pintar) => {
    let y = M;
    const txt = (t, font, color, x, ancho, alto) => {
      ctx.font = font;
      for (const l of lineas(ctx, t, ancho)) { if (pintar) { ctx.fillStyle = color; ctx.fillText(l, x, y); } y += alto; }
    };
    // marca
    ctx.font = "800 32px 'Barlow Condensed', sans-serif";
    if (pintar) { ctx.fillStyle = C.acento; ctx.fillText('PARE · RECETA', M, y + 24); }
    y += 70;
    ctx.textBaseline = 'top';
    txt(d.titulo, TIT, C.texto, M, A, 78);
    const info = [d.para, d.tiempo ? `${d.tiempo} min` : ''].filter(Boolean).join(' · ');
    if (info) { y += 14; txt(info, PEQ, C.texto2, M, A, 36); }
    y += 28;
    // ingredientes en tarjeta
    const y0 = y;
    y += 34;
    const filas = [];
    ctx.font = NOR;
    for (const i of d.ingredientes) {
      const cant = `${fmtNum(i.g)} g`;
      ctx.font = NEG; const wc = ctx.measureText(cant).width;
      ctx.font = NOR;
      const nombre = `${i.n}${i.casero ? ` · ${i.casero}` : ''}`;
      filas.push({ cant, wc, ls: lineas(ctx, nombre, A - 64 - wc - 24) });
    }
    const altoTarjeta = 34 + 50 + filas.reduce((s, f) => s + f.ls.length * 40 + 10, 0) + (d.resumen ? lineas(ctx, d.resumen, A - 64).length * 34 + 16 : 0) + 24;
    if (pintar) {
      ctx.fillStyle = C.sup; ctx.strokeStyle = C.borde; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(M, y0, A, altoTarjeta, 28); ctx.fill(); ctx.stroke();
      ctx.font = SUB; ctx.fillStyle = C.acento; ctx.fillText('INGREDIENTES', M + 32, y);
    }
    y += 50;
    for (const f of filas) {
      if (pintar) {
        ctx.font = NEG; ctx.fillStyle = C.texto; ctx.textAlign = 'right'; ctx.fillText(f.cant, M + A - 32, y); ctx.textAlign = 'left';
        ctx.font = NOR; f.ls.forEach((l, k) => { ctx.fillStyle = C.texto; ctx.fillText(l, M + 32, y + k * 40); });
      }
      y += f.ls.length * 40 + 10;
    }
    if (d.resumen) { y += 16; txt(d.resumen, PEQ, C.texto2, M + 32, A - 64, 34); }
    y = y0 + altoTarjeta + 40;
    // pasos
    if (d.pasos?.length) {
      ctx.font = SUB; if (pintar) { ctx.fillStyle = C.acento; ctx.fillText('CÓMO SE HACE', M, y); }
      y += 54;
      d.pasos.forEach((p, k) => {
        const [t, x] = partirPaso(p);
        const yN = y;
        if (pintar) {
          ctx.fillStyle = C.acento; ctx.beginPath(); ctx.arc(M + 22, yN + 18, 22, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = C.fondo; ctx.font = "800 28px 'Barlow Condensed', sans-serif"; ctx.textAlign = 'center'; ctx.fillText(String(k + 1), M + 22, yN + 3); ctx.textAlign = 'left';
        }
        if (t) txt(t, NEG, C.texto, M + 64, A - 64, 40);
        txt(x, NOR, C.texto2, M + 64, A - 64, 40);
        y += 22;
      });
    }
    const n = limpiarNotas(d.notas);
    if (n) { y += 6; txt(n, PEQ, C.texto2, M, A, 36); y += 10; }
    // pie
    y += 30;
    if (pintar) { ctx.strokeStyle = C.borde; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(M, y); ctx.lineTo(W - M, y); ctx.stroke(); }
    y += 26;
    ctx.font = PEQ; if (pintar) { ctx.fillStyle = C.texto2; ctx.fillText(`Receta de PARE · ${URL_PARE}`, M, y); }
    y += 36 + M;
    ctx.textBaseline = 'alphabetic';
    return y;
  };

  cv.width = W; cv.height = 10;
  const alto = Math.ceil(dibujar(false));
  cv.width = W; cv.height = alto;
  ctx.fillStyle = C.fondo; ctx.fillRect(0, 0, W, alto);
  dibujar(true);
  return await new Promise((res) => cv.toBlob(res, 'image/png'));
}

const nombreFichero = (t) => `${t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').slice(0, 50) || 'receta'}.png`;

/** Comparte la receta. modo: 'texto' | 'imagen'. Devuelve 'compartido' | 'copiado' | 'descargado' | 'cancelado'. */
export async function compartirRecetaComo(d, modo) {
  try {
    if (modo === 'texto') {
      const text = textoReceta(d);
      if (navigator.share) { await navigator.share({ title: d.titulo, text }); return 'compartido'; }
      await navigator.clipboard.writeText(text);
      return 'copiado';
    }
    const blob = await imagenReceta(d);
    const file = new File([blob], nombreFichero(d.titulo), { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: d.titulo }); return 'compartido'; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return 'descargado';
  } catch (e) {
    if (e?.name === 'AbortError') return 'cancelado';
    throw e;
  }
}
