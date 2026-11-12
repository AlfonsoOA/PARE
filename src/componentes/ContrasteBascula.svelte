<script>
  // Contraste: cambio de peso esperado por lo que se come (anotado o pautado) frente al real de la báscula.
  import { contrasteBascula } from '../lib/adherencia.js';
  import { fmtNum, fmtFecha, mostrar, ud } from '../lib/unidades.js';
  let { datos } = $props();
  const c = $derived(contrasteBascula(datos));
  const kgSem = (v) => { const x = v * (ud() === 'lb' ? 2.20462 : 1); return Math.abs(x) < 0.005 ? `±0 ${ud()}/semana` : `${x > 0 ? '+' : '−'}${fmtNum(Math.abs(x), 2)} ${ud()}/semana`; };
  const comes = $derived(c.ok && (c.modo === 'anotado' ? 'lo que anotas' : 'lo que marca tu dieta'));
</script>

<div class="tarjeta" style="gap:8px">
  <span class="etiqueta">La báscula frente a lo que comes</span>
  {#if !c.ok}
    <p class="sec peq">{c.motivo}</p>
  {:else}
    <div class="fila entre envolver" style="gap:12px">
      <div><p class="cifra">{kgSem(c.esperado)}</p><p class="sec peq">esperado con {comes}</p></div>
      <div><p class="cifra">{kgSem(c.real)}</p><p class="sec peq">según la báscula</p></div>
    </div>
    <p class="peq">
      {#if c.lectura === 'cuadra'}
        <b>Cuadra.</b> Con {comes} ({c.kcal.toLocaleString('es-ES')} kcal/día) y tu gasto estimado, la báscula hace lo que tiene que hacer.
      {:else if c.lectura === 'por_encima'}
        <b>La báscula va por encima de lo esperado</b>, como si comieras unas <b>{c.difKcal.toLocaleString('es-ES')} kcal/día más</b> que {comes}. O hay extras que no se cuentan (picoteo, aceite, bebidas, fines de semana), o tu gasto es menor del estimado.
      {:else}
        <b>Bajas más deprisa de lo esperado</b>, como si comieras unas <b>{Math.abs(c.difKcal).toLocaleString('es-ES')} kcal/día menos</b> que {comes}. O tu gasto es mayor del estimado, o comes menos de lo que crees. Si no buscas déficit, sube algo la ingesta.
      {/if}
    </p>
    <p class="sec peq">Gasto real que sale de tus datos: <b>{c.gastoReal.toLocaleString('es-ES')} kcal</b> (estimado al empezar: {c.tdee.toLocaleString('es-ES')}). Del {fmtFecha(c.desde)} al {fmtFecha(c.hasta)}, {c.pesadas} pesadas{c.modo === 'anotado' ? `, ${c.diasAnotados} días anotados` : ''}. 1 kg ≈ 7.700 kcal; el agua mueve el peso de un día para otro, por eso se usa la tendencia de 4 semanas.</p>
  {/if}
</div>
