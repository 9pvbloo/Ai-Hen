# Phase 3K.6.4.1 — Analytical Karesansui Relief, Pass A

Base aprobada: `e281d7b2d068dfbc31c1251df51f9cbbf98bb2a9`. Misma rama `phase-3k-cinematic-rebuild`. Sin push, sin Pass B, sin geometría física de surcos. Continuado desde el estado recuperado `d6678c449badad0f9c3fea2c1275af01aecb91a9`, preservando todos los cambios y artefactos existentes.

## Diagnóstico y arquitectura

Se auditaron los siete archivos solicitados, reportes y capturas de 3K.6.2/3/4, usando la skill threejs. El terreno macro tiene celdas de 0.5 unidades; los surcos tienen períodos aproximados de 0.19–0.23. La geometría no podía resolverlos. El shader anterior añadía un coseno de amplitud 0.0042 a la normal y ±2.5% de color, sin perfil de cresta/valle ni cavidad propia. La atenuación del camino borraba una franja demasiado amplia.

Ahora se calcula una muestra de samon por fragmento y se comparte entre los tratamientos de normal, roughness y cavidad:

- `gardenRakeField`: conserva fases y regiones de entrada, tramo medio, patio y contornos de doce islas/bancos. Los pesos de campos incompatibles no se solapan; conservan los márgenes sin rastrillar.
- `gardenRakeProfile`: `pow(smoothstep(0.18, 1.0, 0.5 + 0.5*cos(phase)), 1.6)`. La parte por encima de media altura ocupa aproximadamente 39% del período. Cresta redondeada, hombros continuos y valle más amplio; no usa el coseno bruto como altura final.
- `gardenRakeVisibility`: `1 - smoothstep(0.45, 1.8, fwidth(phase))`, aplicado a cada campo antes de combinar. Atenúa las frecuencias que dejan de poder resolverse por píxel.
- `gardenRakeHeight`: altura virtual pico-valle **0.017 unidades**, centrada restando 0.39 al perfil para reducir el abombamiento de las envolventes al desaparecer los campos. Primero se ensayó 0.012; no se utilizó el techo 0.022.
- `gardenRakeSample`: devuelve altura, cresta, valle y cobertura. Variación lenta de presión de 0.94–1.00, sin ruido por surco. El patio conserva su atenuación de hasta 40% y el borde plantado conserva su transición suave.
- `gardenRelief`, sin modificar, sigue convirtiendo derivadas de altura en normales. El micrograno/musgo se aplica primero; la altura mesoscópica del samon se aplica por separado después. No cambia `GardenGroundHeight` ni ningún vértice del terreno.

La altura efectiva se multiplica por cobertura, filtrado, presión, máscara grava/musgo y proximidad al camino; 0.017 es la altura nominal máxima, no un desplazamiento físico de todos los puntos.

## Parámetros finales

| Tratamiento | Valor / comportamiento |
|---|---|
| Altura virtual | 0.017 |
| Contribución de rake al albedo | **0%**; eliminado el término `rake * 0.025` |
| Cavidad | Hasta **5.5%** de reducción de luz difusa directa e indirecta, multiplicada por valle y máscara de grava |
| Lift artificial de cresta | **0%** |
| Roughness del campo resuelto | `0.967 - crest * 0.045 + (microRoughness - 0.94) * 0.12`, limitada a 0.90–0.98 |
| Cresta / valle típicos | Aproximadamente 0.922 / 0.967, con microvariación mineral |
| Transición de roughness | Mezcla con acabado previo según cobertura; musgo conserva su tratamiento |
| Micrograno | Mapas, mineral y amplitud de microaltura 0.0018 conservados |
| Atenuación de camino | `mix(0.30, 1.0, smoothstep(0.35, 0.95, pathDistance))` |

El camino conserva 30% de señal en su eje y recupera el relieve completo a 0.95 unidades, frente al antiguo cero hasta 0.78 y recuperación a 1.65. Queda una huella tenue entre las losas; no hay un corredor enteramente liso. Las 21 piedras, sus X/Z, dimensiones, geometría, enterrado y contacto son idénticos a la base.

## Evidencia visual y ablaciones

Las vistas rasantes usan una cámara exclusiva del harness a 0.28/0.30 unidades sobre el terreno. Capturan la escena real y sus luces existentes, sin cambiar la cámara de producción ni la exposición. La instrumentación de `Renderer.ts` se hace únicamente en la respuesta HTTP interceptada por Playwright; no se escribe ni se compila en el proyecto.

Se inspeccionaron directional, radial y lantern, sus variantes sin cavidad y sin normal analítica, la cuadrícula de nueve vistas normales solicitadas y los frames temporales. **La superficie muestra relieve de sombreado:** hombros iluminados, cara opuesta más oscura y valle entre crestas, incluida respuesta cálida junto al farol. El resultado sobrevive sin cavidad. Al eliminar la normal analítica vuelve predominantemente la superficie plana; no lo sostiene el albedo, cuya contribución de rake es cero.

En el recorte de suelo `[100,550,1000,850]`, diferencias medias RGB en escala 0–255:

| Vista | Sin cavidad vs final | Sin normal de samon vs final |
|---|---:|---:|
| Directional | 0.830 | 5.820 |
| Radial | 0.824 | 4.500 |
| Lantern | 0.777 | 3.937 |

Esto apoya la interpretación visual; no constituye por sí solo una medida perceptual de volumen. La respuesta es estilizada, más legible cerca que lejos. No hay parallax, autooclusión de las crestas ni cambio de silueta: a ras extremo puede reconocerse la superficie geométricamente plana. Pass A proporciona la ilusión local de relieve observada, no geometría física. No se implementó Pass B ni se declara aprobación estética del usuario.

## Estabilidad temporal

Se preservan doce frames antes y después de un desplazamiento lateral de 0.006 unidades/frame, y animaciones comparables. En la tira inspeccionada no se observan saltos abruptos de patrón, cruce de ondas ni Moiré evidente. Los surcos lejanos pierden detalle con el filtrado, de forma gradual. La transición a musgo y las costuras entre campos permanecen calmadas en las vistas revisadas.

Delta medio entre frames en el recorte `[100,390,1000,750]`: **1.189 → 2.255** niveles RGB; máximo medio por par: **1.194 → 2.268**. La señal es más contrastada al responder las normales, por lo que el movimiento produce más diferencia de imagen. Estos números incluyen desplazamiento intencional, no aíslan shimmer. No se detecta inestabilidad temporal inaceptable en esta muestra limitada; no se garantiza ausencia de crawling en todo ángulo, DPR o GPU. No se subió la altura después de la recuperación.

## Validación técnica y coste

- `npm run build`: PASS final, bundle 812.85 kB / 227.55 kB gzip. Persiste el aviso previo de chunk >500 kB.
- `git diff --check`: PASS. `git status` comprobado antes y después de guardar los commits.
- Verificador: 21 checkpoints antes y después; `errors: []`, sin errores JS/shader/consola registrados, sin pérdidas de contexto y `gl.getError() === 0` en los checkpoints. Compilan también las variantes diagnósticas.
- 6,006 muestras de cámara; 15 meshes y 417 instancias por layout con atributos y matrices finitos. No NaN/Infinity en la geometría comprobada. No se realizó un escaneo float de todos los valores internos del fragment shader.
- Asiento de piedras conservado: cara superior 0.075–0.157, bases enterradas al menos 0.042. Datum de mansión idéntico. Se mantiene la validación de pools y contacto.
- Solo dos archivos de producción difieren de la base: `GardenRakeShader.ts` y `GardenMaterials.ts`. Se comprobó además que las funciones de materiales de camino y rocas son idénticas a la base. Geometría del suelo, macro seating y `GardenSurfaceDetail.ts` están intactos; todos los sistemas congelados permanecen sin cambios.
- Un error intermedio por el identificador GLSL reservado `sample` fue corregido antes de las capturas finales. Los reportes finales no contienen ese fallo.

| Llegada, DPR 1 | Draw calls antes → después | Triángulos antes → después | Texturas | FPS observado |
|---|---:|---:|---:|---:|
| Desktop | 59 → 59 | 143158 → 143158 | 25 → 25 | 75 → 75 |
| Tablet | 58 → 58 | 143156 → 143156 | 25 → 25 | 75 → 75 |
| Portrait | 56 → 56 | 143090 → 143090 | 25 → 25 | 75 → 75 |

La igualdad de draw calls, triángulos y texturas se verificó en **los 21 checkpoints**, no solo en la llegada. Ninguna textura, geometría, luz o material de escena adicional. Cambia el programa del material del suelo: perfil vectorial, pesos compartidos, segundo tratamiento de normal, cavidad difusa y roughness. Mayor coste aritmético de fragmento, parcialmente compensado al evaluar una sola vez el campo compartido. No se midieron milisegundos GPU; 75 FPS locales no demuestran coste cero ni equivalen a hardware móvil. Los clones de material de ablación existen solo en el harness y se liberan después de cada captura.

## Archivos y commits

- `src/world/nightGarden/GardenRakeShader.ts`: campo/perfil/altura/filtrado y transición del camino.
- `src/world/nightGarden/GardenMaterials.ts`: integración de normales, cavidad y roughness del suelo.
- `scripts/verify-night-garden.cjs`: conexión opt-in del harness.
- `scripts/review-karesansui.cjs`: cámaras diagnósticas, ablaciones y secuencia temporal; exclusivamente revisión.
- Este reporte y `docs/reviews/phase-3k641/`.

Commits locales:

- `d6678c4 feat: shape karesansui relief with restrained cavity and roughness`
- `5b465a1 fix: preserve rake relief through stone approach transitions`
- `ccc06bd test: validate karesansui relief and temporal stability`
- Commit documental: `docs: archive Phase 3K.6.4.1 relief review` (hash en la entrega).

## Capturas y reproducción

Raíz absoluta: `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k641/`.

El [manifiesto de capturas](reviews/phase-3k641/capture-manifest.md) enumera enlaces absolutos exactos de cada BEFORE/AFTER solicitado, close-up, ablación y temporal. Se mantienen también las capturas normales/reducidas adicionales ya generadas.

- [Comparación normal desktop](reviews/phase-3k641/normal-comparison.jpg).
- [Nueve checkpoints finales solicitados](reviews/phase-3k641/normal-checkpoints.jpg).
- [Close-ups BEFORE/AFTER](reviews/phase-3k641/closeups-comparison.jpg).
- [Sin cavidad / sin normal analítica](reviews/phase-3k641/ablation-comparison.jpg).
- [Tira temporal](reviews/phase-3k641/temporal-filmstrip.jpg).
- [Temporal BEFORE](reviews/phase-3k641/temporal-before.webp), [temporal AFTER](reviews/phase-3k641/temporal-after.webp), [métricas](reviews/phase-3k641/temporal-metrics.json).
- [Validación y costes comparados](reviews/phase-3k641/validation-summary.json); reportes completos en `before/report.json` y `after/report.json`.

Para reproducir AFTER contra Vite: ejecutar `node scripts/verify-night-garden.cjs` con Playwright del entorno de revisión en `NODE_PATH`, `GARDEN_RELIEF_REVIEW=1`, `GARDEN_RELIEF_ABLATION=1` y `GARDEN_REVIEW_OUTPUT` apuntando a un directorio de salida nuevo. Ninguna dependencia se añadió al proyecto. La cámara de revisión no forma parte del bundle.
