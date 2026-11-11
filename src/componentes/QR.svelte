<script>
  // Código QR dibujado en SVG (funciona sin conexión).
  import qrcode from 'qrcode-generator';
  let { texto, tam = 200 } = $props();
  const q = $derived.by(() => { const c = qrcode(0, 'M'); c.addData(texto); c.make(); return c; });
  const n = $derived(q.getModuleCount());
  const ruta = $derived.by(() => {
    let d = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += `M${x + 2} ${y + 2}h1v1h-1z`;
    return d;
  });
</script>

<svg viewBox="0 0 {n + 4} {n + 4}" width={tam} height={tam} role="img" aria-label="Código QR de {texto}" shape-rendering="crispEdges">
  <rect width={n + 4} height={n + 4} fill="#fff" rx="1" />
  <path d={ruta} fill="#0F1114" />
</svg>
