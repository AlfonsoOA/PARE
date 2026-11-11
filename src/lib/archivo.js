// Archivo PARE: un solo tipo de archivo (JSON) que cualquier copia de la app sabe abrir.
// tipo 'copia' = copia de seguridad completa · 'deportista' = lo que el deportista manda a su entrenador
// · 'cambios' = lo que el entrenador devuelve (rutina o dieta propuestas).
import { app, aviso, reemplazarDatos, hoyISO, ESQUEMA, ir } from './estado.svelte.js';

export const INCLUYE = [['rutina', 'Rutina'], ['dieta', 'Dieta'], ['progreso', 'Progreso (sesiones y medidas)'], ['test', 'Test de inicio']];

export function archivoDeportista(incluye, autorizaCentro) {
  const d = app.datos;
  const datos = { perfil: { ...d.perfil, borradorTest: undefined } };
  if (!incluye.includes('test')) { datos.perfil.test = null; }
  if (incluye.includes('rutina')) { datos.rutina = d.rutina; datos.secuencia = d.secuencia; }
  if (incluye.includes('dieta')) { datos.dieta = d.dieta; datos.comidas = d.comidas; }
  if (incluye.includes('progreso')) { datos.sesiones = d.sesiones; datos.medidas = d.medidas; }
  return cabecera('deportista', { incluye, autoriza: { entrenador: true, centro: !!autorizaCentro }, datos });
}
/** Una rutina para compartir (por ejemplo, con quien entrenas): sin cargas, cada uno pone las suyas. */
export function archivoRutina(rutina, nota = '') {
  const limpia = JSON.parse(JSON.stringify(rutina));
  for (const s of limpia.sesiones) for (const it of s.items) it.carga = null;
  return cabecera('rutina', { datos: { rutina: limpia }, nota });
}
export function archivoCopia() {
  return cabecera('copia', { incluye: ['todo'], datos: app.datos });
}
export function archivoCambios(dep) {
  return cabecera('cambios', { para: { id: dep.id, nombre: dep.nombre }, datos: dep.propuesta, nota: dep.propuesta?.nota ?? '' });
}
function cabecera(tipo, resto) {
  const p = app.datos.perfil;
  return { pare: 'archivo', esquema: ESQUEMA, tipo, creado: new Date().toISOString(), de: { id: p.id, nombre: p.nombre || null, dispositivo: app.datos.dispositivo }, ...resto };
}

const nombreArchivo = (tipo, quien) => `PARE_${tipo}_${(quien || 'yo').replace(/[^\p{L}\p{N}]+/gu, '-')}_${hoyISO()}.json`;

/** Comparte el archivo con el menú del móvil (WhatsApp, correo…) o, si no se puede, lo descarga. */
export async function compartir(obj, quien) {
  const nombre = nombreArchivo(obj.tipo, quien);
  const texto = JSON.stringify(obj);
  const file = new File([texto], nombre, { type: 'application/json' });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Archivo PARE', text: 'Ábrelo con la app PARE (Yo → Archivo PARE → Abrir un archivo).' });
      return 'compartido';
    }
  } catch (e) {
    if (e?.name === 'AbortError') return 'cancelado';
  }
  const url = URL.createObjectURL(new Blob([texto], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'descargado';
}

/** Abre un archivo PARE y lo coloca donde toca. */
export async function abrirArchivo(file) {
  let obj;
  try { obj = JSON.parse(await file.text()); } catch { aviso('Ese archivo no es un archivo PARE.'); return; }
  if (obj?.pare === 'cuestionario_inicial') { aviso('Es un cuestionario del formulario web: el test se hace ahora dentro de la app.'); return; }
  if (obj?.pare !== 'archivo' || !obj.tipo) { aviso('Ese archivo no es un archivo PARE.'); return; }
  const d = app.datos;
  if (obj.tipo === 'copia') {
    const vacio = !d.rutina && !d.sesiones.length;
    if (vacio) { reemplazarDatos(obj.datos); aviso('Copia restaurada'); ir('hoy'); return; }
    app.archivoPendiente = obj;
    app.vista = { nombre: 'archivo', acento: 'yo' };
    return;
  }
  if (obj.tipo === 'deportista') {
    if (obj.de?.id === d.perfil.id) { aviso('Es tu propio archivo.'); return; }
    d.entrenador.activo = true;
    const lista = d.entrenador.deportistas;
    const previo = lista.find((x) => x.id === obj.de.id);
    const reg = { id: obj.de.id, nombre: obj.de.nombre || 'Deportista sin nombre', recibido: new Date().toISOString(), creado: obj.creado, incluye: obj.incluye, autoriza: obj.autoriza, datos: obj.datos, propuesta: previo?.propuesta ?? null };
    if (previo) Object.assign(previo, reg); else lista.push(reg);
    aviso(previo ? `${reg.nombre}: datos actualizados` : `${reg.nombre} añadido a tus deportistas`);
    app.tab = 'yo';
    app.vista = { nombre: 'deportista', id: obj.de.id, acento: 'yo' };
    return;
  }
  if (obj.tipo === 'rutina') {
    if (!obj.datos?.rutina?.sesiones?.length) { aviso('El archivo no trae ninguna rutina.'); return; }
    d.cambiosPropuestos = { de: obj.de, creado: obj.creado, nota: obj.nota, rutina: obj.datos.rutina, dieta: null, compartida: true };
    app.vista = { nombre: 'cambios', acento: 'yo' };
    return;
  }
  if (obj.tipo === 'cambios') {
    if (obj.para?.id && obj.para.id !== d.perfil.id) { aviso('Estos cambios son para otro deportista.'); return; }
    d.cambiosPropuestos = { de: obj.de, creado: obj.creado, nota: obj.nota, rutina: obj.datos?.rutina ?? null, dieta: obj.datos?.dieta ?? null };
    app.vista = { nombre: 'cambios', acento: 'yo' };
    return;
  }
  if (obj.tipo === 'recetas') {
    const nuevas = obj.datos?.recetas ?? [];
    if (!nuevas.length) { aviso('El archivo no trae recetas.'); return; }
    for (const a of obj.datos.productos ?? []) if (!d.productosPropios.some((x) => x.id === a.id)) d.productosPropios.push(a);
    d.recetasPropias ||= [];
    for (const r of nuevas) {
      const i = d.recetasPropias.findIndex((x) => x.id === r.id);
      const reg = { ...r, propia: true, de: obj.de?.nombre || r.de || null };
      if (i >= 0) d.recetasPropias[i] = reg; else d.recetasPropias.push(reg);
    }
    aviso(nuevas.length === 1 ? `Receta añadida: ${nuevas[0].n}` : `${nuevas.length} recetas añadidas`);
    app.subComer = 'recetas'; app.filtroRecetas = 'mias';
    app.vista = null; app.tab = 'comer';
    return;
  }
  aviso('Tipo de archivo PARE desconocido.');
}

/** Archivo con recetas propias (y los productos propios que usan) para pasárselas a otros. */
export function archivoRecetas(recetas) {
  const ids = new Set(recetas.flatMap((r) => r.ingredientes.map((i) => i.id)));
  const productos = app.datos.productosPropios.filter((a) => ids.has(a.id));
  return cabecera('recetas', { datos: { recetas: JSON.parse(JSON.stringify(recetas)), productos: JSON.parse(JSON.stringify(productos)) } });
}

export async function hacerCopia() {
  const r = await compartir(archivoCopia(), app.datos.perfil.nombre);
  if (r !== 'cancelado') { app.datos.ajustes.ultimaCopia = new Date().toISOString(); aviso('Copia de seguridad hecha'); }
}
