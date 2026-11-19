<script>
  // Mapa muscular del ejercicio: frente y espalda, con el músculo principal en color intenso y el secundario en el mismo
  // color más suave (un solo color en dos intensidades: se distingue también con daltonismo).
  import { FRENTE, ESPALDA } from '../lib/siluetas.js';
  let { principales = [], secundarios = [] } = $props();
  // músculos de PARE → zonas del dibujo
  const ZONAS = {
    pectoral: ['chest'], dorsal_ancho: ['upper-back'], espalda_media: ['upper-back'], trapecio: ['trapezius'],
    deltoides_anterior: ['front-deltoids'], deltoides_lateral: ['front-deltoids', 'back-deltoids'], deltoides_posterior: ['back-deltoids'],
    biceps: ['biceps'], triceps: ['triceps'], antebrazos: ['forearm'], abdominales: ['abs', 'obliques'], lumbares: ['lower-back'],
    gluteos: ['gluteal'], cuadriceps: ['quadriceps'], isquiotibiales: ['hamstring'], gemelos_soleo: ['calves', 'left-soleus', 'right-soleus'],
    aductores: ['adductor'], abductores: ['abductors'],
  };
  const zonas = (l) => new Set(l.flatMap((m) => ZONAS[m] ?? []));
  const zp = $derived(zonas(principales));
  const zs = $derived(zonas(secundarios));
  const clase = (m) => (zp.has(m) ? 'p' : zs.has(m) ? 's' : ['head', 'neck', 'knees'].includes(m) ? 'cuerpo' : 'resto');
</script>

<div class="mapa">
  {#each [['Frente', FRENTE], ['Espalda', ESPALDA]] as [titulo, partes]}
    <figure>
      <svg viewBox="0 0 100 200" role="img" aria-label="{titulo}: músculos trabajados">
        {#each partes as z}{#each z.p as pts}<polygon points={pts} class={clase(z.m)} />{/each}{/each}
      </svg>
      <figcaption class="sec peq">{titulo}</figcaption>
    </figure>
  {/each}
</div>
<p class="leyenda peq"><span class="cuadro p"></span> Principal <span class="cuadro s"></span> Secundario</p>

<style>
  .mapa { display: flex; justify-content: center; gap: 8px; }
  figure { margin: 0; flex: 1; max-width: 170px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
  svg { width: 100%; height: auto; }
  polygon { stroke: var(--fondo, #0f1115); stroke-width: 0.3; stroke-linejoin: round; }
  .resto { fill: #5b616b; }
  .cuerpo { fill: #474c55; }
  .p { fill: #ff5a1f; }
  .s { fill: #ff5a1f; fill-opacity: 0.42; }
  .leyenda { display: flex; justify-content: center; align-items: center; gap: 6px; margin: 0; color: var(--texto2); }
  .cuadro { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-left: 8px; }
  .cuadro.p { background: #ff5a1f; }
  .cuadro.s { background: rgba(255, 90, 31, 0.42); }
</style>
