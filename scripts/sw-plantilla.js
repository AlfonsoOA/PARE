// Service worker de PARE (generado por scripts/precache.mjs). Todo en caché: la app funciona sin conexión.
const CACHE = 'pare-__VERSION__';
const ARCHIVOS = __ARCHIVOS__;

// cache: 'reload' = pedir a la red, no a la caché HTTP del navegador, los archivos que cambian sin cambiar de nombre
// (data/pare.json, plantillas…); si no, podían quedarse viejos. assets/ lleva hash en el nombre e img/ casi no cambia.
// Archivos de código que pide una página (index-XXXX.js / .css): sirve para comprobar que página y código son de la misma versión.
const codigoDe = (html) => [...html.matchAll(/(?:src|href)="\.?\/?(assets\/[^"]+\.(?:js|css))"/g)].map((m) => './' + m[1]);
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE)
    .then((c) => c.addAll(ARCHIVOS.map((u) => (/^\.\/(assets|img)\//.test(u) ? u : new Request(u, { cache: 'reload' })))).then(() => c))
    // Si mientras se instalaba se publicó otra versión, el index.html descargado apunta a código que no está en esta lista:
    // se aborta la instalación (sigue la versión anterior, que funciona) y se reintenta con el service worker nuevo.
    .then((c) => Promise.all(['./', './index.html'].map((u) => c.match(u).then((r) => (r ? r.text() : '')))))
    .then((htmls) => {
      if (htmls.some((h) => codigoDe(h).some((u) => !ARCHIVOS.includes(u)))) throw new Error('Versión a medio publicar');
    })
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith('pare-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  // «Compartir → PARE» desde WhatsApp, el gestor de archivos…: se guarda el archivo y se abre la app para que lo lea
  if (e.request.method === 'POST' && new URL(e.request.url).pathname.endsWith('/compartido')) {
    e.respondWith((async () => {
      try {
        const fd = await e.request.formData();
        const f = fd.getAll('archivo').find((x) => x && typeof x !== 'string');
        if (f) {
          const c = await caches.open('pare-compartido');
          await c.put('./archivo-compartido', new Response(f, { headers: { 'x-nombre': encodeURIComponent(f.name || 'archivo.json') } }));
        }
      } catch { /* si falla, se abre la app sin más */ }
      return Response.redirect('./?compartido=1', 303);
    })());
    return;
  }
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // La página en sí: primero la red (así nunca se sirve un index viejo que apunte a archivos borrados); sin red, la de caché.
  if (e.request.mode === 'navigate') {
    // con mala cobertura (gimnasio) no esperamos más de 3 s a la red
    const deCache = () => caches.match('./', { ignoreSearch: true }).then((r) => r || caches.match('./index.html'));
    // Si la red trae una página nueva pero su código no se puede descargar (cobertura que va y viene), mejor la de caché.
    const red = fetch(e.request).then(async (r) => {
      if (!r.ok) return r;
      const faltan = [];
      for (const u of codigoDe(await r.clone().text())) if (!(await caches.match(u, { ignoreSearch: true }))) faltan.push(u);
      if (!faltan.length) return r;
      try { await Promise.all(faltan.map((u) => fetch(u).then((x) => { if (!x.ok) throw new Error(); }))); return r; }
      catch { return (await deCache()) || r; }
    });
    e.respondWith(Promise.race([red, new Promise((ok) => setTimeout(ok, 3000))])
      .then((r) => r || deCache().then((c) => c || red))
      .catch(() => deCache()));
    return;
  }
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true, ignoreVary: true }).then((r) => r ||
      fetch(e.request).catch(() => (e.request.mode === 'navigate' ? caches.match('./') : undefined))),
  );
});
