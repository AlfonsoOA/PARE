<script>
  // Alterna los dos fotogramas (inicio y final) del ejercicio. Sin GIF ni vídeo.
  import { onDestroy } from 'svelte';
  let { id, tam = 'grande' } = $props();
  let f = $state(1);
  const t = setInterval(() => (f = f === 1 ? 2 : 1), 1100);
  onDestroy(() => clearInterval(t));
</script>

<div class="anim {tam}">
  <img src="./img/{id}_1.webp" alt="Posición inicial" class:vis={f === 1} />
  <img src="./img/{id}_2.webp" alt="Posición final" class:vis={f === 2} />
</div>

<style>
  .anim { position: relative; background: #fff; border-radius: 12px; overflow: hidden; aspect-ratio: 4 / 3; width: 100%; max-width: 100%; }
  .anim.peq { width: 120px; flex-shrink: 0; }
  img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; opacity: 0; transition: opacity 0.25s; }
  img.vis { opacity: 1; }
</style>
