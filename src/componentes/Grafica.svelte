<script>
  // Gráfica de línea sencilla: puntos [{ f: 'AAAA-MM-DD', v }], y opcionalmente una segunda serie (media).
  // El eje X va por fechas reales: los huecos sin datos se ven como hueco (tramo discontinuo y tenue), no como datos.
  let { puntos = [], media = null, unidad = '', alto = 170, cero = false } = $props();
  const W = 340, P = 8, ABAJO = 34;
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const todos = $derived([...puntos, ...(media ?? [])].filter((p) => p.v != null));
  const x0 = $derived(todos.length ? Math.min(...todos.map((p) => Date.parse(p.f))) : 0);
  const x1 = $derived(todos.length ? Math.max(...todos.map((p) => Date.parse(p.f))) : 1);
  const y0 = $derived(todos.length ? Math.min(...todos.map((p) => p.v), ...(cero ? [0] : [])) : 0);
  const y1 = $derived(todos.length ? Math.max(...todos.map((p) => p.v), ...(cero ? [0] : [])) : 1);
  const X = (f) => P + ((Date.parse(f) - x0) / Math.max(1, x1 - x0)) * (W - 2 * P);
  const Y = (v) => alto - ABAJO - ((v - y0) / Math.max(1e-9, y1 - y0)) * (alto - ABAJO - 18);
  const fmt = (v) => v.toLocaleString('es-ES', { maximumFractionDigits: 1 });
  const fechaCorta = (f) => { const [a, m, d] = f.split('-'); return `${+d} ${MES[+m - 1]}${a !== String(new Date().getFullYear()) ? ` ${a.slice(2)}` : ''}`; };

  // Tramos: continuos entre registros normales; discontinuos donde hay un hueco grande (más de 3 veces el intervalo típico y de 3 semanas)
  function tramos(l) {
    const ps = l.filter((p) => p.v != null);
    const dif = ps.slice(1).map((p, i) => Date.parse(p.f) - Date.parse(ps[i].f)).sort((a, b) => a - b);
    const tipico = dif.length ? dif[Math.floor((dif.length - 1) / 2)] : 0;
    const limite = Math.max(21 * 864e5, 3 * tipico);
    return ps.slice(1).map((p, i) => ({ a: ps[i], b: p, hueco: Date.parse(p.f) - Date.parse(ps[i].f) > limite }));
  }
  const camino = (ts, hueco) => ts.filter((t) => t.hueco === hueco).map((t) => `M${X(t.a.f).toFixed(1)} ${Y(t.a.v).toFixed(1)}L${X(t.b.f).toFixed(1)} ${Y(t.b.v).toFixed(1)}`).join('');
  const tp = $derived(tramos(puntos));
  const tm = $derived(media ? tramos(media) : []);

  // Marcas del eje X: primera y última fecha, y el día 1 de los meses de en medio que quepan
  const marcas = $derived.by(() => {
    if (!todos.length) return [];
    const ini = new Date(x0), fin = new Date(x1);
    const meses = [];
    const d = new Date(Date.UTC(ini.getUTCFullYear(), ini.getUTCMonth() + 1, 1));
    while (d < fin) { meses.push(d.toISOString().slice(0, 10)); d.setUTCMonth(d.getUTCMonth() + 1); }
    const paso = Math.max(1, Math.ceil(meses.length / 4));
    const medio = meses.filter((_, i) => i % paso === 0).filter((f) => X(f) > P + 50 && X(f) < W - P - 50);
    return [ini.toISOString().slice(0, 10), ...medio, fin.toISOString().slice(0, 10)];
  });
</script>

{#if puntos.length < 2}
  <p class="sec peq">Hacen falta al menos dos registros para dibujar la evolución.</p>
{:else}
  <svg viewBox="0 0 {W} {alto}" width="100%" role="img" aria-label="Evolución de {fmt(puntos[0].v)} a {fmt(puntos.at(-1).v)} {unidad}, del {fechaCorta(puntos[0].f)} al {fechaCorta(puntos.at(-1).f)}">
    <line x1={P} x2={W - P} y1={Y(y1)} y2={Y(y1)} stroke="var(--borde)" />
    <line x1={P} x2={W - P} y1={Y(y0)} y2={Y(y0)} stroke="var(--borde)" />
    {#if cero && y0 <= 0 && y1 >= 0}
      <line x1={P} x2={W - P} y1={Y(0)} y2={Y(0)} stroke="var(--texto2)" stroke-dasharray="2 4" />
      <text x={P} y={Y(0) - 4} font-size="11" fill="var(--texto2)">0 = solo peso corporal</text>
    {/if}
    <!-- eje X: fechas -->
    <line x1={P} x2={W - P} y1={alto - ABAJO + 8} y2={alto - ABAJO + 8} stroke="var(--borde)" />
    {#each marcas as f, i}
      <line x1={X(f)} x2={X(f)} y1={alto - ABAJO + 5} y2={alto - ABAJO + 11} stroke="var(--texto2)" />
      <text x={X(f)} y={alto - ABAJO + 25} font-size="11" fill="var(--texto2)" text-anchor={i === 0 ? 'start' : i === marcas.length - 1 ? 'end' : 'middle'}>{i === 0 || i === marcas.length - 1 ? fechaCorta(f) : MES[+f.slice(5, 7) - 1]}</text>
    {/each}
    {#if media}
      <path d={camino(tm, false)} fill="none" stroke="var(--texto2)" stroke-width="2" stroke-dasharray="4 4" />
    {/if}
    <path d={camino(tp, false)} fill="none" stroke="var(--acento)" stroke-width="2.5" stroke-linecap="round" />
    <path d={camino(tp, true)} fill="none" stroke="var(--acento)" stroke-width="1.5" stroke-dasharray="3 5" opacity="0.45" />
    {#each puntos as p}<circle cx={X(p.f)} cy={Y(p.v)} r="3" fill="var(--acento)" />{/each}
    <text x={W - P} y={Y(y1) - 4} text-anchor="end" font-size="11" fill="var(--texto2)" stroke="var(--superficie)" stroke-width="4" paint-order="stroke">{fmt(y1)} {unidad}</text>
    <text x={W - P} y={Y(y0) - 4} text-anchor="end" font-size="11" fill="var(--texto2)" stroke="var(--superficie)" stroke-width="4" paint-order="stroke">{fmt(y0)} {unidad}</text>
  </svg>
  {#if tp.some((t) => t.hueco)}<p class="sec peq">Tramo punteado: semanas sin registros entre esas dos fechas.</p>{/if}
{/if}
