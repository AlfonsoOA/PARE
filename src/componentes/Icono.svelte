<script>
  // Iconos de trazo (24 × 24). Decorativos: el texto de al lado da el significado.
  let { n, tam = 24 } = $props();
  const P = {
    hoy: 'M3 10h18M8 3v4M16 3v4M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
    entrenar: 'M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12',
    comer: 'M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 21V3c-2 1-3 4-3 7h3',
    progreso: 'M3 20h18M5 16l5-5 4 3 6-7',
    yo: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4-6 8-6s7 2 8 6',
    mas: 'M12 5v14M5 12h14',
    menos: 'M5 12h14',
    cerrar: 'M6 6l12 12M18 6L6 18',
    atras: 'M15 5l-7 7 7 7',
    info: 'M12 8h.01M11 12h1v5h1M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
    puntos: 'M5 12h.01M12 12h.01M19 12h.01',
    check: 'M5 12.5l4.5 4.5L19 7',
    reloj: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
    arriba: 'M6 15l6-6 6 6',
    abajo: 'M6 9l6 6 6-6',
    enlace: 'M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1',
    buscar: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
    lapiz: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4',
    papelera: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
    compartir: 'M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5',
    aviso: 'M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
    trofeo: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4',
    peso: 'M6 21h12l-2-11H8L6 21zM12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  };
</script>

<svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d={P[n] ?? ''} />
</svg>
