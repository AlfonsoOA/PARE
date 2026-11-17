# Entrada del recetario maestro

Sube aquí el Excel del recetario (el que descarga la app en Comer → Recetas → Recetario en Excel, o el `recetario_maestro.xlsx` de la carpeta de arriba) con **Add file → Upload files → Commit changes**.

Una fila por receta en la hoja «Recetas». En la columna **Ingredientes**, uno por línea con los gramos delante (`300 g Plátano`, `60 g Huevo entero (1 huevo L)`), con los nombres de la hoja «Alimentos». En **Protocolo**, los pasos, uno por línea.

Al hacer el commit, GitHub:

1. aplica los cambios al recetario que ven todos (`datos/recetas.json`): las filas con ID actualizan esa receta, las filas sin ID son recetas nuevas, «sí» en Borrar la retira y las filas con Origen = «Mía» se ignoran;
2. estima el precio por ración y recalcula macros, alérgenos y etiquetas;
3. borra el Excel de esta carpeta, guarda la copia al día en `datos/recetario/recetario_maestro.xlsx` y publica la app.

Si un ingrediente no existe o falta algún dato, no se publica nada y la ejecución de *Actions* sale en rojo con la fila que falla y el nombre parecido que quizá querías (GitHub avisa por correo).
