<script>
  // Alterna los dos fotogramas (inicio y final) del ejercicio. Sin GIF ni vídeo.
  // El fotograma inicial está siempre debajo y el final aparece y desaparece encima con un fundido lento:
  // así nunca se ve el fondo blanco entre uno y otro (antes, al fundirse los dos a la vez, salía un «flash»).
  import { onDestroy } from 'svelte';
  let { id, tam = 'grande' } = $props();
  let fin = $state(false);
  const t = setInterval(() => (fin = !fin), 1400);
  onDestroy(() => clearInterval(t));
</script>

<div class="anim {tam}">
  <img src="./img/{id}_1.webp" alt="Posición inicial" />
  <img src="./img/{id}_2.webp" alt="Posición final" class="final" class:vis={fin} />
</div>

<style>
  .anim { position: relative; background: #fff; border-radius: 12px; overflow: hidden; aspect-ratio: 4 / 3; width: 100%; max-width: 100%; }
  .anim.peq { width: 120px; flex-shrink: 0; }
  img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
  .final { opacity: 0; transition: opacity 0.6s ease-in-out; }
  .final.vis { opacity: 1; }
  @media (prefers-reduced-motion: reduce) { .final { transition: none; } }
</style>
