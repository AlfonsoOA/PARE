PARE — PAIN AND REWARD
Versión inicial funcional (prototipo de puesta en marcha)

CONTENIDO
- index.html, style.css, app.js: aplicación web.
- data/catalogo.json: catálogo completo exportado del Excel PARE_catalogo_maestro.xlsx.
- manifest.webmanifest, sw.js, assets/icon.svg: soporte PWA/offline.

FUNCIONES
- Inicio y actividad reciente.
- Crear/editar rutinas.
- Registrar sesiones y series (reps, carga, realizada).
- Catálogo con búsqueda, filtros y fichas técnicas disponibles.
- Historial, volumen de carga x repeticiones y peso corporal.
- Copia de seguridad e importación/exportación JSON.
- Diseño responsive y service worker para uso offline tras primera visita.

LIMITACIONES CONOCIDAS
- Es una primera versión funcional, no una versión validada para uso definitivo.
- El volumen mostrado es tonelaje registrado, no volumen muscular ponderado.
- El catálogo respeta activo/inactivo y fichas incompletas del Excel; no inventa instrucciones.
- No implementa aún CrossFit como WOD estructurado (AMRAP/For Time/EMOM etc.); el catálogo de formatos está incluido como datos.
- No hay sincronización entre dispositivos, cuentas, modo entrenador ni nutrición.
- No incluye todavía progresión automática, gráficos avanzados, RIR/RPE ni exportación PDF.
- Las ponderaciones musculares del Excel se conservan como datos, pero no se aplican a métricas hasta cerrar el algoritmo.
- El icono SVG es un icono provisional. Para iOS conviene añadir PNG 180x180 y PNG 192/512.

PROBAR EN ORDENADOR
No abrir index.html con doble clic: el navegador puede bloquear la carga del JSON.
Desde la carpeta PARE_app, ejecutar:
  python -m http.server 8000
Abrir http://localhost:8000

PUBLICAR
Subir el contenido completo de la carpeta a un hosting estático con HTTPS (por ejemplo GitHub Pages, Cloudflare Pages o Netlify). No renombrar ni omitir data/catalogo.json ni sw.js.
Después abrir la URL en Safari (iPhone) > Compartir > Añadir a pantalla de inicio.
La instalación PWA y el funcionamiento offline requieren HTTPS y una primera visita online.

DATOS
La información de entrenamiento se guarda en el almacenamiento local del navegador. Exportar copias desde Datos > Exportar datos. La limpieza de datos del navegador puede borrarlos.
