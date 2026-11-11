// Unidades: todo se guarda en kg; se muestra en kg o lb según los ajustes.
import { app } from './estado.svelte.js';

const LB = 2.20462;
export const enLb = () => app.datos.ajustes.unidades === 'lb';
export const ud = () => (enLb() ? 'lb' : 'kg');

/** kg guardados -> número a mostrar */
export function mostrar(kg) {
  if (kg == null || kg === '') return null;
  const v = enLb() ? kg * LB : kg;
  return Math.round(v * 4) / 4;
}
/** número tecleado -> kg a guardar */
export function guardar(v) {
  if (v == null || v === '' || Number.isNaN(+v)) return null;
  return enLb() ? +v / LB : +v;
}
export function fmt(kg, conUd = true) {
  const v = mostrar(kg);
  if (v == null) return '—';
  const s = v.toLocaleString('es-ES', { maximumFractionDigits: 2 });
  return conUd ? `${s} ${ud()}` : s;
}
export const fmtNum = (n, dec = 0) =>
  n == null ? '—' : Number(n).toLocaleString('es-ES', { maximumFractionDigits: dec, minimumFractionDigits: 0 });

export function fmtFecha(iso, largo = false) {
  if (!iso) return '';
  const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''));
  return d.toLocaleDateString('es-ES', largo ? { weekday: 'long', day: 'numeric', month: 'long' } : { day: 'numeric', month: 'short' });
}
export function fmtMin(seg) {
  const m = Math.round(seg / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`;
}
export function fmtReloj(seg) {
  const s = Math.max(0, Math.round(seg));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Carga legible: con peso corporal, «PC», «PC + 10» o «PC − 20»; si no, la carga normal. */
export function fmtCarga(carga, pesoCorporal, conUd = true) {
  if (!pesoCorporal) return fmt(carga, conUd);
  if (!carga) return 'PC';
  return `PC ${carga > 0 ? '+' : '−'} ${fmt(Math.abs(carga), conUd)}`;
}
