<script>
  // Comer → Suplementos: guía con evidencia, dosis, momento, pros y contras, y bibliografía en APA 7.
  import { SUPLEMENTOS, NIVELES } from '../lib/suplementos.js';
  import { REFS } from '../lib/referencias.gen.js';
  import Icono from './Icono.svelte';
  let abierto = $state(null);
</script>

<p class="sec peq">Ningún suplemento sustituye a comer bien, entrenar y dormir. Esta guía dice cuáles tienen respaldo, para quién y cómo tomarlos. Si tienes alguna enfermedad, tomas medicación o estás embarazada, consúltalo antes con tu médico.</p>

{#each NIVELES as [nivel, titulo, sub]}
  {@const lista = SUPLEMENTOS.filter((x) => x.nivel === nivel)}
  {#if lista.length}
    <div class="col" style="gap:4px"><span class="etiqueta">{titulo}</span><span class="sec peq">{sub}</span></div>
    {#each lista as s (s.id)}
      <section class="tarjeta supl">
        <button class="cab" onclick={() => (abierto = abierto === s.id ? null : s.id)} aria-expanded={abierto === s.id}>
          <span class="col" style="gap:2px;align-items:flex-start;min-width:0"><b>{s.n}</b>{#if s.cond}<span class="sec peq">{s.cond}</span>{/if}</span>
          <span class="flecha" class:abierta={abierto === s.id}><Icono n="atras" tam={18} /></span>
        </button>
        {#if abierto === s.id}
          <div class="cuerpo">
            <p>{s.para}</p>
            <dl>
              {#if s.dosis}<dt>Cuánto</dt><dd>{s.dosis}</dd>{/if}
              {#if s.cuando}<dt>Cuándo</dt><dd>{s.cuando}</dd>{/if}
              {#if s.como}<dt>Cómo</dt><dd>{s.como}</dd>{/if}
            </dl>
            <div class="pc">
              <div><span class="etiqueta">A favor</span><ul>{#each s.pros as x}<li>{x}</li>{/each}</ul></div>
              <div><span class="etiqueta">En contra</span><ul>{#each s.contras as x}<li>{x}</li>{/each}</ul></div>
            </div>
            <span class="etiqueta">Referencias</span>
            <ul class="refs">
              {#each s.refs as r}
                {@const ref = REFS[r]}
                {#if ref}<li class="peq">{#each ref.apa.split('*') as trozo, k}{#if k % 2}<i>{trozo}</i>{:else}{trozo}{/if}{/each}{#if ref.url}{' '}<a href={ref.url} target="_blank" rel="noopener">{ref.url}</a>{/if}</li>{/if}
              {/each}
            </ul>
          </div>
        {/if}
      </section>
    {/each}
  {/if}
{/each}
<p class="sec peq">Si compites, usa solo productos con certificado antidopaje (Informed Sport o similar): los suplementos no pasan los controles de un medicamento y algunos llevan sustancias no declaradas.</p>

<style>
  .supl { padding: 0; gap: 0; }
  .cab { all: unset; box-sizing: border-box; width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 14px 16px; cursor: pointer; font-size: 16px; min-height: 52px; }
  .cab:focus-visible { outline: 2px solid var(--acento); outline-offset: -2px; border-radius: 12px; }
  .flecha { transform: rotate(-90deg); color: var(--texto2); transition: transform 0.15s; display: flex; flex: none; }
  .flecha.abierta { transform: rotate(90deg); }
  .cuerpo { padding: 0 16px 16px; display: flex; flex-direction: column; gap: 10px; line-height: 1.45; }
  .cuerpo p { margin: 0; }
  dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 6px 12px; }
  dt { font-weight: 700; color: var(--acento); }
  dd { margin: 0; }
  .pc { display: grid; grid-template-columns: 1fr; gap: 8px; }
  .pc ul { margin: 4px 0 0; padding-left: 18px; display: flex; flex-direction: column; gap: 4px; }
  .refs { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; color: var(--texto2); }
  .refs li { padding-left: 1.4em; text-indent: -1.4em; overflow-wrap: anywhere; }
  .refs a { color: var(--acento); }
</style>
