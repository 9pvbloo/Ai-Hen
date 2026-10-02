# Faroles activos — lighting pass local

Base: `f1699b5`, rama `phase-3k-cinematic-rebuild`. Se conservan los 15 faroles, sus posiciones y las 7 PointLight de la red. Los 15 aportan respuesta verificable al entorno; los ocho sin luz propia reciben un rebote de terreno más legible. No se añadieron luces, sombras, geometrías, texturas ni dependencias.

## Cambio y límites

- `GardenPracticalBounce.ts`: configura núcleo y caída amplia según el grupo y la presencia de luz real. Refuerza sobre todo los faroles 02, 03, 06, 08, 09, 11, 14 y 15. El 14 tiene ajuste específico para musgo oscuro. La respuesta de musgo pasa de 0,45 a 0,70; la de grava sigue en 1.
- El shader actúa sobre los fragmentos reales del suelo y las crestas, con sus normales físicas. Mantiene máximo entre campos en lugar de suma, caída suave cuadrática y la máscara interior de muros. No hay planos superpuestos ni discos emisivos.
- `GardenPavilionLighting.ts`: `covered-landing` pasa de 6,4 a 6,9; `hall-spill` de 20 a 21,5. Posiciones, alcance, orientación y las otras dos luces de la casa permanecen iguales. Es un apoyo pequeño a escalones/umbral, no una nueva iluminación de fachada.
- Arquitectura, puerta/animación, cámara, stepping stones, relieve y perfil fino del karesansui, árboles, muros, materiales base, atmósfera, renderer, exposición y tone mapping: sin cambios de código.
- Los faroles sin PointLight aportan sobre grava/musgo, no una simulación de sombras ni nueva irradiancia sobre toda roca o muro vecino. Las siete luces reales conservan su respuesta previa sobre roca y muro. La contención es analítica; una abertura real del muro puede transmitir luz.

## Inventario y resolución

IDs del informe = índice del ancla + 1. La visibilidad depende del punto del recorrido y del viewport; se audita el conjunto completo, incluidos periféricos que quedan fuera de campo u ocultos en algunos checkpoints.

| ID | Grupo / ubicación (x, z) | Contribución final |
|---|---|---|
| 01 | Camino, −3,05 / −14,95 | PointLight + apoyo leve de terreno |
| 02 | Camino, −6,45 / −20,15 | Pool sobre grava y crestas reforzado |
| 03 | Camino, −1,25 / −27,95 | Pool sobre grava y crestas reforzado |
| 04 | Camino, −2,05 / −33 | PointLight + apoyo leve de terreno |
| 05 | Llegada, 0,75 / −39,15 | PointLight + terreno; conexión con spill de casa |
| 06 | Perímetro izquierdo, −10,1 / −26,25 | Rebote sobre borde de grava/musgo |
| 07 | Perímetro izquierdo, −11 / −32,1 | PointLight existente sobre entorno/muro + terreno |
| 08 | Perímetro izquierdo posterior, −8,25 / −44 | Rebote sobre terreno visible entre vegetación |
| 09 | Perímetro derecho, 11,7 / −28,5 | Rebote local sobre musgo |
| 10 | Perímetro derecho, 12,1 / −37,5 | PointLight existente sobre entorno/muro + terreno |
| 11 | Perímetro derecho posterior, 12,4 / −45,9 | Rebote local sobre musgo; closeup despejado |
| 12 | Isla izquierda, −5,7 / −25,8 | PointLight sobre roca/musgo + terreno |
| 13 | Isla derecha, 4,9 / −32,8 | PointLight sobre roca/musgo + terreno |
| 14 | Isla posterior izquierda, −3,1 / −40,8 | Rebote específico sobre musgo oscuro |
| 15 | Isla posterior derecha, 8,3 / −42 | Rebote sobre borde de grava |

En el BEFORE, 01/04/05/07/10/12/13 ya tenían influencia real clara. Los otros ocho tenían campos débiles: especialmente 09/11/14, que apenas respondían sobre musgo. El refuerzo conserva esa jerarquía sin volver todos los faroles focos fuertes.

Parámetros de rebote final, en unidades de escena para radios y pesos de irradiancia para ganancias:

| Grupo | Radio / núcleo | Ganancia núcleo / amplia |
|---|---|---|
| Camino con luz real | 3,10 / 1,45 | 0,14 / 0,035 |
| Camino sin luz real | 3,10 / 1,45 | 0,60 / 0,11 |
| Perímetro con luz real | 2,80 / 1,40 | 0,14 / 0,035 |
| Perímetro sin luz real | 2,80 / 1,40 | 0,68 / 0,12 |
| Islas con luz real | 2,35 / 1,15 | 0,14 / 0,035 |
| Isla 14, musgo | 2,65 / 1,45 | 0,90 / 0,16 |
| Isla 15, grava | 2,35 / 1,15 | 0,50 / 0,09 |

Color lineal `(0,95, 0,56, 0,27)` y elipse `(0,94, 1,06)` conservados. La contribución sigue la visibilidad existente del jardín.

## Evidencias visuales

- [BEFORE/AFTER desktop: 20/40/60/80/100%](desktop-comparison.jpg)
- [Tablet y portrait: 20/60/100%](responsive-comparison.jpg)
- [Tablet por separado](tablet-comparison.jpg) · [Portrait por separado](portrait-comparison.jpg)
- [Contact sheet individual de los 15 faroles](all-fifteen-contact-sheet.jpg)
- [Tabla individual: categoría, PointLight, rebote, medición, píxeles, cámara y PASS/FAIL](individual-validation.md)
- [Closeups de los cinco faroles del camino](path-closeups.jpg)
- [Closeups de los seis faroles perimetrales](perimeter-closeups.jpg)
- [Closeups de los cuatro acentos de islas](islands-closeups.jpg)
- [Llegada al genkan y caras exteriores de muros](arrival-and-boundaries.jpg)
- [Debug por fuente: 15 contribuciones aisladas](source-contributions.png)

El debug es la diferencia real entre cada farol ON/OFF, multiplicada por 6 para verla. Verde identifica fuentes con PointLight + rebote; ámbar identifica rebote de terreno. No es un mapa pintado ni una imagen de producción. Se excluye un rectángulo alrededor del papel/halo del farol para medir el receptor. Los otros 14 faroles siguen activos durante cada ablación. No se apaga el material emisivo del farol evaluado.

48 capturas principales por estado: 15 checkpoints normales (cinco por formato), 15 closeups con sus 15 ablaciones y tres controles de llegada/exterior. Se comprobaron cámaras idénticas en las 48 parejas. Además se ejecuta el módulo existente `review-practical-validation.cjs`: tres ablaciones de iluminación y tres vistas reduced-motion por estado, con salud de recursos y coherencia CPU/GLSL. Para el farol 11 se sustituyó la cámara genérica de auditoría, obstruida por roca/muro, por una vista cercana despejada en ambos estados. Ninguna cámara de producción cambió.

Los PNG originales sin pérdida se conservan localmente en `logs/lantern-coverage/raw/` (ignorados por Git). Las láminas comparativas y los informes se versionan aquí, evitando añadir unos 150 MB de capturas duplicadas al repositorio. Las métricas se calcularon sobre PNG, no sobre los JPEG de presentación.

## Validación y rendimiento

- Build TypeScript/Vite correcto; 75 módulos. Permanece el aviso de bundle mayor de 500 kB, sin nueva dependencia.
- `git diff --check` y revisión de sintaxis del script: correctos.
- Cero errores JS/shader/WebGL y cero pérdidas de contexto en las capturas.
- Validación física responsive y reduced-motion: [informe](physical/report.json). Sin nuevos problemas de apoyo, matrices no finitas, relieve, z-fighting observado ni faroles/piedras flotando.
- [Mediciones por fuente y controles](measurements.json): los 15 superan el umbral diagnóstico (>500 píxeles receptores con delta RGB medio >2/255 y media de los 2.500 píxeles más afectados >3/255). Este umbral complementa la inspección visual; no equivale a lux ni garantiza percepción idéntica en toda pantalla.
- Franja superior de 160 px: diferencia cero en los 15 controles medidos. Una sonda de grava fría entre fuentes y dos sondas de 25×25 px detrás de tramos sólidos de muro: diferencia cero. No se ha levantado el fondo ni extendido el rebote tras esos muros. Valores exactos en `measurements.json` y tabla de controles abajo.

| Formato | Draw calls antes → final | Triángulos antes → final | Texturas | FPS observadas |
|---|---|---|---|---|
| Desktop 1440×900 | 60 → 60 | 232.026 → 232.026 | 25 → 25 | ≈75 → ≈75 |
| Tablet 820×1180 | 59 → 59 | 196.664 → 196.664 | 25 → 25 | ≈75 → ≈75 |
| Portrait 390×844 | 58 → 58 | 174.950 → 174.950 | 25 → 25 | ≈75 → ≈75 |

Muestreo secuencial de animación de producción en Chrome local: 90 intervalos rAF después de descartar 15; p95 final 13,5/13,5/13,6 ms en desktop/tablet/portrait. FPS finales: 74,9875 / 74,9813 / 74,9813. Viewports emulados, no hardware móvil físico; la cadencia local cercana a 75 Hz limita lo que estas cifras permiten concluir. Presupuesto Night Garden: 9 PointLight (7 faroles + 2 casa), 2 SpotLight y 3 luces globales = 14 contribuyentes, igual que antes. Geometrías GPU 50 → 50; programas 25 → 25; texturas 25 → 25.

Controles de oscuridad: medias RGB de 8 bits, BEFORE y FINAL idénticos píxel a píxel. La tabla muestra cuatro decimales; JSON conserva la precisión completa y las posiciones de mundo/proyección.

| Control | BEFORE RGB | FINAL RGB | Delta absoluto medio |
|---|---|---|---:|
| Fondo desktop 60%, franja superior | 5,6769 / 12,2507 / 15,4108 | 5,6769 / 12,2507 / 15,4108 | 0 |
| Grava fría entre fuentes, mundo (2; −4,66176; −23) | 55,7904 / 65,5776 / 74,3488 | 55,7904 / 65,5776 / 74,3488 | 0 |
| Detrás del muro sólido izquierdo | 22,2784 / 34,5664 / 30,6448 | 22,2784 / 34,5664 / 30,6448 | 0 |
| Detrás del muro sólido derecho | 66,9488 / 77,4032 / 84,5680 | 66,9488 / 77,4032 / 84,5680 | 0 |

No se observa contaminación ámbar global: los cambios se concentran alrededor de fuentes y en la llegada. Estas sondas y las vistas exteriores prueban los tramos inspeccionados; no se presentan como simulación de oclusión por sombras en cualquier posición imaginable.

## Archivos exactos y alcance final

Producción: `src/world/nightGarden/GardenPracticalBounce.ts` y `src/world/nightGarden/GardenPavilionLighting.ts`.

Verificación: `scripts/review-lantern-coverage.cjs` y `scripts/measure-lantern-coverage.py`. Reutilizan, sin modificarlos, `review-practical-validation.cjs`, `verify-rake-coherence.cjs` y `verify-night-garden.cjs`/`review-physical-karesansui.cjs`.

Evidencias: los archivos bajo `docs/reviews/lantern-coverage/`; los PNG originales permanecen en `logs/lantern-coverage/raw/`. [Comparación de sistemas congelados](frozen-systems.json): 67 archivos de producción/dependencias comparados con la base, 65 idénticos y únicamente los dos módulos permitidos modificados. No se añadió ninguna dependencia ni se alteró la cámara o el renderer.

Salud: 1.288.951 componentes de geometría, 98 matrices de objetos y 13 uniformes de materiales revisados como finitos; además, comprobación de uniformes escalares/vectores/matrices del shader receptor. Coherencia CPU/GLSL: 128 muestras, error de fase 0,00015968, error de peso 0,00000170635, discontinuidad mineral 0. Los detalles finales figuran en `after/report.json`.

## Reproducción

Con Vite en `127.0.0.1:5174` y Playwright del entorno de revisión disponible mediante `NODE_PATH`:

1. Ejecutar `scripts/review-lantern-coverage.cjs` con `LANTERN_STAGE=before` y `LANTERN_BASELINE=1`. Reproduce los dos módulos desde `f1699b5` interceptando respuestas Vite; no hace checkout ni modifica el repositorio.
2. Ejecutarlo con `LANTERN_STAGE=after` y sin `LANTERN_BASELINE` ni `LANTERN_ONLY`.
3. Ejecutar `scripts/measure-lantern-coverage.py` con Python/Pillow/NumPy del entorno. Produce métricas y láminas.
4. Ejecutar `scripts/verify-night-garden.cjs` con `GARDEN_PHYSICAL_REVIEW=1`, `GARDEN_REVIEW_URL=http://127.0.0.1:5174/?debug=1` y una ruta de salida local. El informe final está archivado en `physical/report.json`.
5. `npm run build` y `git diff --check`.

No se añadieron controles de diagnóstico a producción. Trabajo local, sin push; misma rama.

## Cierre local y aceptación

- `d568d90` — `feat: reinforce environmental response for all garden lanterns`: los dos módulos de producción, incluido el apoyo de llegada al genkan.
- La verificación, documentación y láminas de esta revisión se archivan juntas en el commit `test: validate and archive fifteen-lantern coverage` (posterior al anterior; consultar `git log` para su hash).
- [Resultado final de aceptación](final-acceptance.json): build, 15/15 fuentes, salud WebGL, uniformes, comprobaciones físicas y presupuesto observado.

Respuesta a la aceptación visual: sí, los quince faroles tienen lectura local sobre su entorno en las vistas auditadas, manteniendo la oscuridad entre fuentes. La respuesta sobre musgo es deliberadamente más suave que sobre grava; la oclusión de faroles periféricos por vegetación/rocas y su salida de campo en ciertos formatos siguen siendo parte de la composición congelada. No se afirma que los quince sean simultáneamente visibles desde cualquier cámara.
