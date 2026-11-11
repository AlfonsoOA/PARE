# PARE — Pain and Reward

*Earn your reward.*

App web instalable (PWA), gratuita y sin servidor, para entrenar fuerza, seguir una dieta por raciones o por pesada y ver el progreso. Todo se guarda en el móvil; los datos solo salen si el usuario los envía como archivo PARE.

## Qué hace (v0.1, pruebas)

- **Test de inicio** en 7 bloques (PAR-Q+ y molestias incluidos) que genera rutina y dieta.
- **Hoy**: lo que toca (la rutina es una secuencia; lo que te saltas queda pendiente), avisos, series semanales por grupo, comida del día y peso.
- **Entrenar**: sesión en curso con registro en dos toques, descanso visual sin sonido, superseries con comprobación anatómica y funcional, sustituciones, fin de sesión con récords y «Para la próxima» (doble progresión editable).
- **Comer**: raciones (fichas) o pesada, recetas, equivalencias, Mi menú y productos de etiqueta; opción de días de más hidratos.
- **Progreso**: estado de cada ejercicio (progresando, estable, estancado según nivel y fase de dieta), 1RM estimado, récords de repeticiones, volumen por grupo, peso con media de 7 días, cintura, % de grasa y gasto real estimado.
- **Yo**: perfil, molestias, rutina, dieta, archivo PARE (enviar al entrenador, abrir, copia de seguridad), modo entrenador y ajustes.

Las reglas están en el documento *PARE — Especificación funcional y algoritmos* y las pantallas en *PARE — Mapa de pantallas v1*.

## Datos

Los datos de la app (`public/data/pare.json`) salen de `datos/catalogo_pare.json`, que es la exportación del Excel maestro (`PARE_catalogo_maestro.xlsx`) hecha con `pare_catalogo.py`. Para actualizarlos: exportar de nuevo el JSON, copiarlo en `datos/` y subirlo; la publicación regenera el resto.

Fuentes: ejercicios e imágenes de free-exercise-db (dominio público); alimentos de USDA FoodData Central (dominio público) y valores típicos de etiqueta; actividad del 2024 Adult Compendium of Physical Activities.

## Desarrollo

```bash
npm install
npm run dev       # servidor de desarrollo
npm run build     # genera dist/ (datos + app + service worker)
npm run preview   # sirve dist/ en local
```

Svelte 5 + Vite. Datos en IndexedDB (`idb-keyval`). El service worker (`scripts/sw-plantilla.js`) guarda todo en caché para funcionar sin conexión.

## Publicación

Cada `push` a `main` construye y publica en GitHub Pages (`.github/workflows/pages.yml`). Hace falta activarlo una vez en *Settings → Pages → Source: GitHub Actions*.

PARE da criterios generales de entrenamiento y alimentación; no hace diagnósticos médicos.
