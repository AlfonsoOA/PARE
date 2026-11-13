// Estado de la app. Todo lo de `datos` se guarda en el móvil (IndexedDB) y viaja en el archivo PARE.
import { get, set } from 'idb-keyval';

const CLAVE = 'pare-datos';
export const ESQUEMA = 1;

export const uuid = () =>
  globalThis.crypto?.randomUUID?.() ??
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

export const hoyISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export function datosVacios() {
  return {
    esquema: ESQUEMA,
    dispositivo: uuid(),
    creado: new Date().toISOString(),
    ajustes: {
      unidades: 'kg',
      incrementos: { barra: 2.5, mancuerna: 2, maquina: 5, polea: 5, otro: 2.5 },
      segPorSerie: 40,
      pantallaEncendida: true,
      ultimaCopia: null,
      recordatorioCopiaDias: 14,
    },
    perfil: {
      id: uuid(), nombre: '', sexo: '', edad: null, altura: null, nivel: 'principiante', objetivo: '',
      faseDieta: 'mantenimiento', diasSemana: 3, minutos: 60, lugar: 'gimnasio', material: [],
      molestias: [], alergenos: [], evitar: [], test: null, testFecha: null,
      cocina: { tiempo: 'normal', presupuesto: 'normal' },
      diasWod: 0,
    },
    rutina: null, // { id, version, nombre, objetivo, sesiones: [...] }
    rutinasAnteriores: [],
    secuencia: { siguiente: 0, pendientes: [] },
    sesiones: [], // sesiones hechas
    medidas: [], // { fecha, peso, cintura, cuello }
    dieta: null, // { objetivo, kcal, p, hc, g, raciones, comidas, hidratosExtra, menu }
    comidas: {}, // fecha -> [{ id, comida, tipo, ... }]
    descansos: {}, // fecha -> true (día marcado como descanso)
    productosPropios: [],
    favoritos: [],
    gustosRecetas: {}, // rid -> 1 (me gusta) | -1 (no me gusta)
    recetasPropias: [], // recetas creadas por el deportista o recibidas en un archivo
    wodsGuardados: [], // WOD propios o recibidos (biblioteca personal)
    encuestas: [], // encuesta quincenal de adherencia: { fecha, r, barreras, auto, puntos }
    encuestaPospuesta: null,
    guiaVista: false, // abrió «Cómo se usa» o descartó el aviso
    ayudas: {}, // ayudas de primera vez ya vistas (comer…)
    avisosDescartados: {},
    entrenador: { activo: false, deportistas: [] },
    cambiosPropuestos: null,
  };
}

export const app = $state({
  listo: false,
  tab: 'hoy',
  vista: null, // subpantalla dentro de una pestaña: { nombre, ...params }
  hoja: null, // hoja inferior abierta
  sesionActiva: null, // sesión en curso (también se guarda para no perderla)
  toast: null,
  subProgreso: 'ejercicios',
  subComer: 'dia',
  filtroRecetas: 'parati',
  archivoPendiente: null,
  datos: datosVacios(),
});

let temporizador = null;
export async function cargarDatos() {
  try {
    const guardado = await get(CLAVE);
    if (guardado?.datos) {
      app.datos = { ...datosVacios(), ...guardado.datos };
      app.datos.ajustes = { ...datosVacios().ajustes, ...guardado.datos.ajustes };
      app.datos.perfil = { ...datosVacios().perfil, ...guardado.datos.perfil };
      app.sesionActiva = guardado.sesionActiva ?? null;
    }
  } catch (e) {
    console.warn('No se pudieron leer los datos guardados', e);
  }
  $effect.root(() => {
    $effect(() => {
      const copia = JSON.stringify({ datos: app.datos, sesionActiva: app.sesionActiva });
      clearTimeout(temporizador);
      temporizador = setTimeout(() => set(CLAVE, JSON.parse(copia)).catch(() => {}), 250);
    });
  });
  // Pide al navegador que no borre los datos si le falta espacio.
  navigator.storage?.persist?.().catch(() => {});
}

export function ir(tab, vista = null) {
  app.tab = tab;
  app.vista = vista;
  app.hoja = null;
  window.scrollTo(0, 0);
}

export function aviso(texto) {
  app.toast = texto;
  setTimeout(() => { if (app.toast === texto) app.toast = null; }, 2600);
}

/** Reemplaza todos los datos (restaurar copia). */
export function reemplazarDatos(nuevos) {
  app.datos = { ...datosVacios(), ...nuevos };
}
