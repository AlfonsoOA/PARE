<script>
  // Gráfica de línea sencilla: puntos [{ f: 'AAAA-MM-DD', v }], y opcionalmente una segunda serie (media).
  let { puntos = [], media = null, unidad = '', alto = 160, cero = false } = $props();
  const W = 340, P = 8;
  const todos = $derived([...puntos, ...(media ?? [])].filter((p) => p.v != null));
  const x0 = $derived(todos.length ? Math.min(...todos.map((p) => Date.parse(p.f))) : 0);
  const x1 = $derived(todos.length ? Math.max(...todos.map((p) => Date.parse(p.f))) : 1);
  const y0 = $derived(todos.length ? Math.min(...todos.map((p) => p.v), ...(cero ? [0] : [])) : 0);
  const y1 = $derived(todos.length ? Math.max(...todos.map((p) => p.v), ...(cero ? [0] : [])) : 1);
  const X = (f) => P + ((Date.parse(f) - x0) / Math.max(1, x1 - x0)) * (W - 2 * P);
  const Y = (v) => alto - 22 - ((v - y0) / Math.max(1e-9, y1 - y0)) * (alto - 40);
  const linea = (l) => l.filter((p) => p.v != null).map((p, i) => `${i ? 'L' : 'M'}${X(p.f).toFixed(1)} ${Y(p.v).toFixed(1)}`).join('');
  const fmt = (v) => v.toLocaleString('es-ES', { maximumFractionDigits: 1 });
</script>

{#if puntos.length < 2}
  <p class="sec peq">Hacen falta al menos dos registros para dibujar la evolución.</p>
{:else}
  <svg viewBox="0 0 {W} {alto}" width="100%" role="img" aria-label="Evolución de {fmt(puntos[0].v)} a {fmt(puntos.at(-1).v)} {unidad}">
    <line x1={P} x2={W - P} y1={Y(y1)} y2={Y(y1)} stroke="var(--borde)" />
    <line x1={P} x2={W - P} y1={Y(y0)} y2={Y(y0)} stroke="var(--borde)" />
    <text x={W - P} y={Y(y1) - 4} text-anchor="end" font-size="11" fill="var(--texto2)">{fmt(y1)} {unidad}</text>
    <text x={W - P} y={Y(y0) + 14} text-anchor="end" font-size="11" fill="var(--texto2)">{fmt(y0)} {unidad}</text>
    {#if cero && y0 <= 0 && y1 >= 0}
      <line x1={P} x2={W - P} y1={Y(0)} y2={Y(0)} stroke="var(--texto2)" stroke-dasharray="2 4" />
      <text x={P} y={Y(0) - 4} font-size="11" fill="var(--texto2)">0 = solo peso corporal</text>
    {/if}
    {#if media}<path d={linea(media)} fill="none" stroke="var(--texto2)" stroke-width="2" stroke-dasharray="4 4" />{/if}
    <path d={linea(puntos)} fill="none" stroke="var(--acento)" stroke-width="2.5" stroke-linejoin="round" />
    {#each puntos as p}<circle cx={X(p.f)} cy={Y(p.v)} r="3" fill="var(--acento)" />{/each}
  </svg>
{/if}
