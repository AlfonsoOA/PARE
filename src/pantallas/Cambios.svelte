<script>
  import { app, aviso, ir } from '../lib/estado.svelte.js';
  import { ej } from '../lib/catalogo.js';
  import { fmt, fmtFecha } from '../lib/unidades.js';
  import Icono from '../componentes/Icono.svelte';
  let d = $derived(app.datos);
  const c = app.datos.cambiosPropuestos;
  const linea = (it) => `${ej(it.ej)?.n} · ${it.series}×${it.repMin}-${it.repMax} · ${it.carga != null ? fmt(it.carga) : '—'}`;
  function rutina(si) {
    if (si) {
      if (d.rutina) d.rutinasAnteriores.push(d.rutina);
      // Las cargas propias se conservan en los ejercicios que coinciden.
      const cargas = {};
      for (const s of d.rutina?.sesiones ?? []) for (const it of s.items) if (it.carga != null) cargas[it.ej] = it.carga;
      const nueva = JSON.parse(JSON.stringify(c.rutina));
      for (const s of nueva.sesiones) for (const it of s.items) if (it.carga == null && cargas[it.ej] != null) it.carga = cargas[it.ej];
      d.rutina = { ...nueva, version: (d.rutina?.version ?? 0) + 1, de: c.de?.nombre };
      d.secuencia.saltos = {};
      const n = d.rutina.sesiones.length;
      if ((d.secuencia.siguiente ?? 0) >= n) d.secuencia.siguiente = 0;
      d.secuencia.pendientes = (d.secuencia.pendientes || []).filter((i) => i < n);
      aviso('Rutina actualizada');
    }
    c.rutina = null; cerrarSiVacio();
  }
  function dieta(si) {
    if (si) { d.dieta = { ...d.dieta, ...c.dieta }; aviso('Dieta actualizada'); }
    c.dieta = null; cerrarSiVacio();
  }
  function cerrarSiVacio() { if (!c.rutina && !c.dieta) { d.cambiosPropuestos = null; ir('hoy'); } }
</script>

{#if !c}
  <div class="pantalla"><p class="vacio">No hay cambios pendientes.</p></div>
{:else}
<div class="pantalla">
  <div class="fila"><button class="icono-b" onclick={() => (app.vista = null)} aria-label="Atrás"><Icono n="atras" /></button><span class="etiqueta">Cambios propuestos</span></div>
  <h1>{c.compartida ? `Rutina de ${c.de?.nombre ?? 'un compañero'}` : `Cambios de ${c.de?.nombre ?? 'tu entrenador'}`}</h1>
  <p class="sec peq">Del {fmtFecha(c.creado?.slice(0, 10))}. Nada cambia hasta que lo aceptes.{c.compartida ? ' Si la aceptas, sustituye a tu rutina; las cargas que ya tenías en los mismos ejercicios se conservan y el resto las pones tú el primer día.' : ''}</p>
  {#if c.nota}<div class="tarjeta"><p>«{c.nota}»</p></div>{/if}

  {#if c.rutina}
    <div class="tarjeta">
      <h2>Rutina</h2>
      {#each c.rutina.sesiones as s, i}
        {@const antes = c.compartida ? null : (d.rutina?.sesiones.find((x) => x.id === s.id) ?? d.rutina?.sesiones[i])}
        <b>{s.nombre}</b>
        {#each s.items as it, k}
          {@const a = antes?.items[k]}
          {@const cambia = !c.compartida && (!a || linea(a) !== linea(it))}
          <p class="peq" class:nuevo={cambia}>{linea(it)}{#if cambia && a}<span class="sec"> (antes: {linea(a)})</span>{/if}</p>
        {/each}
      {/each}
      <div class="fila"><button class="boton" style="flex:1" onclick={() => rutina(true)}>{c.compartida ? 'Usar esta rutina' : 'Aceptar'}</button><button class="boton sec2" style="flex:1" onclick={() => rutina(false)}>Rechazar</button></div>
    </div>
  {/if}
  {#if c.dieta}
    <div class="tarjeta">
      <h2>Dieta</h2>
      <p class="peq"><b>{c.dieta.kcal} kcal</b> (ahora {d.dieta?.kcal ?? '—'}) · {c.dieta.p} g prot · {c.dieta.hc} g hidr · {c.dieta.g} g grasa</p>
      {#each c.dieta.comidas as m}<p class="peq">{m.nombre}: {Object.entries(m.raciones).filter(([, n]) => n > 0).map(([g, n]) => `${n} ${g}`).join(', ')}</p>{/each}
      <div class="fila"><button class="boton" style="flex:1" onclick={() => dieta(true)}>Aceptar</button><button class="boton sec2" style="flex:1" onclick={() => dieta(false)}>Rechazar</button></div>
    </div>
  {/if}
</div>
{/if}

<style>
  .nuevo { color: var(--comer); }
</style>
