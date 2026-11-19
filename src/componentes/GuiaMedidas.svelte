<script>
  // Cómo y dónde tomar cada medida: figura con la línea de cada punto y explicación breve (dibujo propio de PARE).
  let { inicial = 'cintura' } = $props();
  const SITIOS = [
    ['cuello', 'Cuello', 'Justo por debajo de la nuez, con la cinta un poco inclinada hacia abajo por delante. Mirando al frente, sin bajar la barbilla ni tensar el cuello.'],
    ['hombros', 'Hombros', 'Por la parte más ancha de los hombros, pasando por los deltoides. De pie y con los brazos relajados a los lados. Mejor si te mide otra persona.'],
    ['pecho', 'Pecho', 'A la altura de los pezones, por debajo de las axilas y por encima de los omóplatos. Brazos abajo y al final de una respiración normal, sin hinchar el pecho.'],
    ['cintura', 'Cintura', 'A la altura del ombligo. De pie, con el abdomen relajado (sin meter tripa) y al final de una respiración normal. Es la que usa la estimación de grasa con cintura y cuello.'],
    ['cadera', 'Cadera', 'Por la parte más saliente de los glúteos, con los pies juntos.'],
    ['brazo', 'Brazo relajado', 'Brazo colgando y relajado. A mitad de camino entre la punta del hombro y el codo: márcalo la primera vez para repetir siempre el mismo punto.'],
    ['brazoFlex', 'Brazo flexionado', 'Brazo levantado a la altura del hombro, codo doblado y bíceps contraído al máximo. Por la parte más gruesa del bíceps.'],
    ['muslo', 'Muslo', 'De pie, con el peso repartido entre las dos piernas. Por la parte más ancha del muslo, justo por debajo del pliegue del glúteo.'],
  ];
  // líneas de medida sobre la figura: [x1, x2, y]
  const LINEAS = { cuello: [86, 114, 55], hombros: [40, 160, 76], pecho: [62, 138, 104], cintura: [70, 130, 168], cadera: [64, 136, 222], brazo: [38, 64, 118], muslo: [70, 100, 252] };
  let sitio = $state(inicial);
  const sel = $derived(SITIOS.find((s) => s[0] === sitio));
</script>

<div class="guia-med">
  <div class="desliza">{#each SITIOS as [k, n]}<button class="chip mini" class:on={sitio === k} onclick={() => (sitio = k)}>{n}</button>{/each}</div>
  <div class="cuerpo-guia">
    <svg viewBox="0 0 200 350" role="img" aria-label="Dónde medir: {sel[1]}">
      <g fill="var(--borde)" stroke="var(--texto2)" stroke-width="1" stroke-linejoin="round">
        <circle cx="100" cy="28" r="18" />
        <path d="M91 44 L109 44 L111 62 L89 62 Z" />
        <!-- tronco -->
        <path d="M66 66 Q100 58 134 66 L140 92 L132 150 L128 190 L136 230 L64 230 L72 190 L68 150 L60 92 Z" />
        {#if sitio === 'brazoFlex'}
          <!-- brazo izquierdo levantado y flexionado -->
          <path d="M66 68 L26 76 L22 90 L60 88 Z" />
          <path d="M26 76 L14 40 L26 36 L36 78 Z" />
        {:else}
          <path d="M66 68 L54 72 L40 140 L36 206 L48 206 L54 142 L64 96 Z" />
        {/if}
        <path d="M134 68 L146 72 L160 140 L164 206 L152 206 L146 142 L136 96 Z" />
        <path d="M66 230 L99 230 L96 340 L76 340 Z" />
        <path d="M101 230 L134 230 L124 340 L104 340 Z" />
      </g>
      <circle cx="100" cy="168" r="1.8" fill="var(--texto2)" />
      {#each Object.entries(LINEAS) as [k, [a, b, y]]}
        {#if k !== sitio}<line x1={a} x2={b} y1={y} y2={y} stroke="var(--texto2)" stroke-width="1" stroke-dasharray="2 3" opacity="0.6" />{/if}
      {/each}
      {#if sitio === 'brazoFlex'}
        <line x1="34" x2="40" y1="66" y2="90" stroke="var(--acento)" stroke-width="4" stroke-linecap="round" />
      {:else}
        {@const l = LINEAS[sitio]}
        <line x1={l[0]} x2={l[1]} y1={l[2]} y2={l[2]} stroke="var(--acento)" stroke-width="4" stroke-linecap="round" />
      {/if}
    </svg>
    <div class="texto-guia">
      <b>{sel[1]}</b>
      <p class="peq">{sel[2]}</p>
    </div>
  </div>
  <p class="sec peq">Siempre igual: por la mañana, en ayunas y después de ir al baño. Cinta flexible, pegada a la piel sin hundirla y horizontal (compruébalo en un espejo). Mismo lado (el derecho) y mismo punto cada vez. Mide dos veces y apunta la media.</p>
  <p class="sec peq">Báscula de bioimpedancia (grasa, músculo, visceral): en las mismas condiciones y antes de beber, porque la hidratación la mueve mucho.</p>
</div>

<style>
  .guia-med { display: flex; flex-direction: column; gap: 10px; }
  .cuerpo-guia { display: flex; gap: 12px; align-items: center; }
  .cuerpo-guia svg { width: 42%; max-width: 170px; flex: none; }
  .texto-guia { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .texto-guia p { margin: 0; line-height: 1.45; }
</style>
