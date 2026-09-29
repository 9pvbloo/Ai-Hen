# Phase 3K.6.4 — Lantern Atmosphere + Ground Refinement + Perimeter Wall Upgrade

Implementada sobre `phase-3k-cinematic-rebuild`, base `25b1004`. Árbol inicialmente limpio. Trabajo local, sin push ni avance a la siguiente fase. La aprobación estética corresponde a la revisión del usuario.

## Auditoría y dirección

Se inspeccionaron los sistemas del jardín, cámara, terreno compartido, materiales, verificador existente, reportes 3K.6.2/3 y las tres imágenes de `docs/references/`, además del storyboard y visual bible de `public/references/`. Se utilizó la skill `threejs`.

Referencias de principios: documentación local de [Kage](https://mengto.github.io/kage/), estudio local de [Seijaku](https://seijaku.mengto.here.now/) en `C:/Users/PABLO/Documents/study-proyect/seijaku.mengto.here.now/a/index.html` y estructura de [seijaku-study](https://github.com/dvnvlone/seijaku-study). Ritmo de piedras, islas de musgo, vacío entre masas y contraste cálido/frío orientan esta implementación original. No se incorporaron código, assets ni dependencias de esos proyectos.

El estado ejecutable inicial quedó registrado en 21 capturas BEFORE. Diagnóstico: papel emisivo uniforme; shader de pools sin transformación de instancia; grano fino dominante; muros bajos con poco retranqueo; dos huecos laterales que podían recibir plantaciones bajas.

## Cambios, en el orden solicitado

1. **Faroles.** Material estándar con gradiente emisivo local, centro cálido y margen suave. Halo instanciado pequeño, con depth test y niebla. Pools fusionados en una sola geometría, adaptados al terreno en cada layout, corrigiendo el shader anterior que no aplicaba las matrices de instancia. Las mismas cinco luces puntuales, sin sombras adicionales: intensidad máxima 0.62 y alcance 3.35. No bloom ni cambios de exposición. Disposal de materiales, geometrías e instancias explícito.
2. **Grava.** Tres regiones con direcciones distintas y márgenes sin rastrillar entre campos, contornos alrededor de islas y bancos, atenuación en el patio final. Se amplía la transición calmada junto al camino. Microrelieve granular de 0.0045 a 0.0018; relieve de surcos de 0.0038 a 0.0042, con filtrado por derivadas. Microvariación mineral y roughness contenidas. Sin nuevas texturas ni geometría de terreno.
3. **Piedras.** Las mismas 21 losas, posiciones X/Z, dimensiones, perfiles y lógica de recorrido. Datum vertical reducido 0.012 unidades. Franja de contacto estrecha, derivada del contorno real de cada losa y asentada sobre el terreno, en una única malla. Laterales más oscuros y relieve mineral más suave. Exposición de las caras superiores: 0.075–0.157 unidades; todas las bases enterradas al menos 0.042.
4. **Muros.** Se conservan seis recorridos y veinte tramos. Alturas nominales de 1.25–1.65 a 1.66–2.13: aumento de cuerpo de 29–33%, aproximadamente 24–27% incluyendo coronación. Dos hiladas más altas, remate de piedra, paneles más gruesos y retranqueados, postes oscuros más sólidos y alero ligero de perfil quebrado. Siguen siendo cuatro lotes instanciados; 366 piezas frente a 346.
5. **Laterales.** Dos pequeños bancos de musgo en los huecos intermedios, cuatro arbustos bajos y dos rocas auxiliares. Totales: siete bancos perimetrales, 24 arbustos, 19 rocas y los mismos cuatro árboles. Se reutilizan geometrías y materiales, sin nuevos lotes ni luces para vegetación.

## Elementos congelados

Comparados con `25b1004`: ningún cambio en `src/core`, arquitectura/materiales de mansión (`GardenPavilion*`), `NightGardenCameraPath`, `GardenAtmosphere`, `GardenBackground`, `GardenApproach`, `DryGardenComposition`, Moon Gate o Shanshui. Renderer y tone mapping globales intactos; lógica de puerta e interior intacta. El único cambio en `NightGardenConfig` es rockCount de 17 a 19 para los tres layouts.

La validación confirma también que el datum de apoyo de la mansión permanece idéntico dentro de 1e-7. No se añadieron rutas de assets, dependencias ni cálculos JavaScript continuos. Se conserva el ciclo de pausa al ocultar la página y el render bajo demanda para reduced-motion del núcleo aprobado.

## Validación

- `npm run build`: PASS después de cada bloque y al final. Bundle final: 811.47 kB / 227.05 kB gzip. Persiste el aviso previo de chunk mayor de 500 kB.
- `git diff --check`: PASS.
- `scripts/verify-night-garden.cjs`: PASS tras cada bloque importante; 21 checkpoints en cada ejecución satisfactoria. El primer intento intermedio de faroles terminó por timeout; se completaron los uniforms de niebla y las ejecuciones siguientes finalizaron correctamente.
- Final: cero errores JS/consola/shader registrados; cero warnings WebGL/shader; `gl.getError() === 0` y cero pérdidas de contexto en los 21 checkpoints.
- 6,006 muestras de cámara normal/reducida: avance estable, mirada válida, clearance mínimo al suelo 1.355; separación horizontal mínima al perímetro 6.796 descontando su semiancho de 0.5.
- Por layout: 15 meshes, 417 instancias, capacidades correctas, atributos y matrices finitos. Veinte paneles y veinte cubiertas; alturas dentro del incremento solicitado.
- Por layout: 845 vértices de pools y 504 de contacto asentados sobre el terreno compartido; cinco luces locales dentro del presupuesto y apagado comprobado.
- Capturas desktop 1440×900, tablet 820×1180 y portrait 390×844: 20%, 40%, 60%, 80%, 100%; adicionalmente 40% y 100% con movimiento reducido. La tolerancia de convergencia del progreso es 0.002.

Evidencia: `reviews/phase-3k64/report.json`, `validation-summary.json` y `build.txt`. El resumen conserva métricas por bloque y las rutas protegidas comparadas con la base.

## Coste observado al 100%

| Formato | Draw calls antes → después | Triángulos antes → después | Texturas |
|---|---:|---:|---:|
| Desktop | 57 → 59 | 135244 → 143158 | 25 → 25 |
| Tablet | 56 → 58 | 135242 → 143156 | 25 → 25 |
| Portrait | 54 → 56 | 135176 → 143090 | 25 → 25 |

Incremento: **2 draw calls y 7,914 triángulos**, aproximadamente 5.85% de triángulos desktop. Desglose: faroles +1 call/+1,290 triángulos; suelo sin cambio de geometría; contacto +1 call/+504; muros +560; laterales +5,560. Las luces siguen siendo cinco y no hay texturas nuevas. El shader de suelo añade dos campos regionales y dos contornos de bancos; ese coste de fragmentos no está incluido en el recuento de triángulos.

FPS observado: 75 a DPR 1. Es Chrome local con viewports emulados, no una prueba de rendimiento en hardware móvil ni un perfil GPU aislado.

## Revisión visual y límites

Inspeccionados los quince checkpoints normales en la cuadrícula, detalles comparados y capturas completas desktop 20/40/60/100, tablet 60/100 y portrait 20/100 durante el proceso. Los faroles conservan gradiente, los surcos tienen menos grano superpuesto, las bases de piedras permanecen enterradas y los muros adquieren mayor presencia. La entrada sigue despejada y la mansión conserva su identidad.

El resultado mantiene el carácter oscuro y estilizado de la base aprobada; no equivale al detalle fotográfico de las referencias. Los muros siguen siendo geometría estilizada y el contacto de las piedras es una aproximación estática, no ambient occlusion global. Los pools son un apoyo local sin sombras dinámicas. La grava conserva cierta regularidad visible en los surcos. En tablet y sobre todo portrait, buena parte de la mejora lateral queda fuera del encuadre aprobado; no se cambió la cámara para mostrarla. Las capturas no prueban cada frame ni todos los dispositivos.

## Archivos modificados

Todos bajo `C:/Users/PABLO/Documents/ai-hen/`:

- `src/world/nightGarden/GardenLanterns.ts`
- `src/world/nightGarden/GardenLanternMaterials.ts` (nuevo)
- `src/world/nightGarden/GardenRakeShader.ts`
- `src/world/nightGarden/GardenMaterials.ts`
- `src/world/nightGarden/GardenPath.ts`
- `src/world/nightGarden/GardenPathContact.ts` (nuevo)
- `src/world/nightGarden/GardenBoundary.ts`
- `src/world/nightGarden/GardenPerimeterComposition.ts`
- `src/world/nightGarden/GardenVegetation.ts`
- `src/world/nightGarden/GardenRocks.ts`
- `src/world/nightGarden/NightGardenConfig.ts`
- `scripts/verify-night-garden.cjs`
- Este reporte y los artefactos de `docs/reviews/phase-3k64/`.

## Commits

- `570077b feat: enrich garden lantern local light response`
- `ec08304 feat: regionalize raked gravel and refine mineral ground response`
- `fb5529c fix: improve stepping stone ground integration`
- `0688dff feat: upgrade side perimeter walls with taller japanese proportions`
- `950bd01 feat: deepen lateral garden composition around the perimeter`
- `fcaa1ac test: verify local lanterns contact seating and WebGL health`
- Commit documental: `docs: archive Phase 3K.6.4 validation and comparisons` (hash confirmado en la entrega).

## Capturas y comparativas

Directorio absoluto: `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k64/`.

- [Comparación desktop antes/después, 20/60/100](reviews/phase-3k64/comparison.jpg).
- [Detalles de farol, perímetro, suelo y piedras](reviews/phase-3k64/details.jpg).
- [Cuadrícula de los quince checkpoints finales](reviews/phase-3k64/checkpoints.jpg).
- Capturas completas: `{desktop,tablet,portrait}-{20,40,60,80,100}.png`.
- Movimiento reducido: `{desktop,tablet,portrait}-reduced-{40,100}.png`.
- Las mismas 21 capturas iniciales y su reporte se encuentran en `before/`.

Los artefactos son capturas del navegador real; las comparativas solo componen y reducen imágenes, sin retoque de luz, color o contenido.
