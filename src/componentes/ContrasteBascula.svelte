<script>
  import PorQue from '../componentes/PorQue.svelte';
  // Contraste: cambio de peso esperado por lo que se come (anotado o pautado) frente al real de la báscula.
  import { contrasteBascula } from '../lib/adherencia.js';
  import { fmtNum, fmtFecha, mostrar, ud } from '../lib/unidades.js';
  let { datos } = $props();
  const c = $derived(contrasteBascula(datos));
  const kgSem = (v) => { const x = v * (ud() === 'lb' ? 2.20462 : 1); return Math.abs(x) < 0.005 ? `±0 ${ud()}/semana` : `${x > 0 ? '+' : '−'}${fmtNum(Math.abs(x), 2)} ${ud()}/semana`; };
  const dp = $derived(datos.encuestas?.at(-1)?.r?.dp);
  const comes = $derived(c.ok && (c.modo === 'anotado' ? 'lo que anotas' : 'lo que marca tu dieta'));
  import { app } from '../lib/estado.svelte.js';
  // Propuesta de kcal a partir del gasto real: mantenimiento = el gasto; déficit −15 %; superávit +10 %; recomposición −5 %
  const propuesta = $derived.by(() => {
    if (!c.ok || !c.creible) return null;
    const f = datos.dieta?.objetivo === 'recomposicion' ? 0.95 : c.fase === 'deficit' ? 0.85 : c.fase === 'superavit' ? 1.1 : 1;
    const k = Math.round((c.gastoReal * f) / 50) * 50;
    return Math.abs(k - (datos.dieta?.kcal ?? 0)) >= 100 ? k : null;
  });
</script>

<div class="tarjeta" style="gap:8px">
  <span class="etiqueta">La báscula frente a lo que comes</span>
  {#if !c.ok}
    <p class="sec peq">{c.motivo} <PorQue id="bascula" /></p>
  {:else}
    <div class="fila entre envolver" style="gap:12px">
      <div><p class="cifra">{kgSem(c.esperado)}</p><p class="sec peq">esperado con {comes}</p></div>
      <div><p class="cifra">{kgSem(c.real)}</p><p class="sec peq">según la báscula</p></div>
    </div>
    <p class="sec peq">Con {comes}: {c.kcal.toLocaleString('es-ES')} kcal/día; gasto estimado: {c.tdee.toLocaleString('es-ES')} kcal/día.</p>
    {#if c.choque}
      <p class="peq"><b>Tu dieta en PARE no encaja con tu fase.</b> Tu fase es {({ deficit: 'déficit', mantenimiento: 'mantenimiento', superavit: 'superávit' })[c.fase]}, pero la dieta que tiene PARE marca {c.kcal.toLocaleString('es-ES')} kcal/día, {Math.abs(c.balance).toLocaleString('es-ES')} kcal {c.balance < 0 ? 'por debajo' : 'por encima'} de tu gasto estimado. Si ya no comes así, actualiza la dieta en Yo → Mi dieta (o la fase en Yo → Perfil) y esta comparación tendrá sentido.</p>
    {/if}
    <p class="peq">
      {#if c.lectura === 'cuadra'}
        <b>Cuadra.</b> Con {comes} y tu gasto estimado, la báscula hace lo que tiene que hacer.
      {:else if !c.creible}
        <b>La báscula no cuadra con {comes}.</b> Para que cuadrase, tu gasto tendría que ser de unas {c.gastoReal.toLocaleString('es-ES')} kcal/día, por debajo de tu metabolismo en reposo{c.basal ? ` (≈ ${c.basal.toLocaleString('es-ES')} kcal)` : ''}: no es realista. Lo más probable es que {comes} no sea lo que comes ahora{c.modo === 'plan' ? ' (una dieta antigua o de otra fase, o extras que no cuenta)' : ' (días sin anotar del todo)'}. Con el peso {Math.abs(c.real) < 0.25 ? 'estable' : c.real < 0 ? 'bajando' : 'subiendo'}, lo que comes de verdad está {Math.abs(c.real) < 0.25 ? 'alrededor de tu gasto' : c.real < 0 ? 'por debajo de tu gasto' : 'por encima de tu gasto'}.
      {:else if c.lectura === 'por_encima'}
        <b>La báscula va por encima de lo esperado</b>, como si comieras unas <b>{c.difKcal.toLocaleString('es-ES')} kcal/día más</b> que {comes}. O hay extras que no se cuentan (picoteo, aceite, bebidas, fines de semana), o tu gasto es menor del estimado.{#if c.modo === 'plan' && dp != null && dp < 100}{' '}En tu última revisión dijiste que seguías {dp === 90 ? 'casi todas' : `el ${dp}\u00a0%`} de las comidas: encaja.{/if}
      {:else}
        <b>Bajas más deprisa de lo esperado</b>, como si comieras unas <b>{Math.abs(c.difKcal).toLocaleString('es-ES')} kcal/día menos</b> que {comes}. O tu gasto es mayor del estimado, o comes menos de lo que crees. Si no buscas déficit, sube algo la ingesta.
      {/if}
    </p>
    {#if propuesta}
      <button class="boton sec2 ancho" onclick={() => (app.vista = { nombre: 'midieta', acento: 'comer', kcal: propuesta })}>Ajustar mi dieta a {propuesta.toLocaleString('es-ES')} kcal</button>
      <p class="sec peq" style="margin:0">{datos.dieta?.objetivo === 'recomposicion' ? 'Recomposición: un 5 % por debajo de tu gasto real.' : c.fase === 'deficit' ? 'Déficit: un 15 % por debajo de tu gasto real.' : c.fase === 'superavit' ? 'Superávit: un 10 % por encima de tu gasto real.' : 'Mantenimiento: tu gasto real.'} Antes de aplicarlo verás cada cambio del menú.</p>
    {/if}
    <p class="sec peq">{#if c.creible}Gasto real que sale de tus datos: <b>{c.gastoReal.toLocaleString('es-ES')} kcal</b> (estimado al empezar: {c.tdee.toLocaleString('es-ES')}). {/if}Del {fmtFecha(c.desde)} al {fmtFecha(c.hasta)}, {c.pesadas} pesadas{c.modo === 'anotado' ? `, ${c.diasAnotados} días anotados` : ''}. 1 kg ≈ 7.700 kcal; el agua mueve el peso de un día para otro, por eso se usa la tendencia de 4 semanas. <PorQue id="bascula" /></p>
  {/if}
</div>
