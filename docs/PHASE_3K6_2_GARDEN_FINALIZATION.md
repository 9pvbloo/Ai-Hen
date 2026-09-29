# Phase 3K.6.2 — Garden Atmosphere & Surface Finalization

## Estudio y alcance

Rama `phase-3k-cinematic-rebuild`, inicio `89bda72`. Antes de editar: git status limpio, log de 20 commits revisado, git diff --check sin errores. Se utilizó la skill threejs. Se estudiaron la referencia local `docs/references/phase-3k6-2-garden-cinematic-reference.png`, el código de suelo, superficies, piedras, rocas, vegetación, composición y cámara, y las capturas previas; se capturó también el estado inicial ejecutable.

Diagnóstico: surcos uniformes y de contraste fuerte, biseles regulares, verde acumulado en tres capas del follaje, cierre lateral débil. La referencia orienta material mineral, follaje frío, vacío central y mayor peso izquierdo. No se copiaron código ni assets externos; no se añadieron dependencias.

## Cambios

- Grava: frecuencia de surcos de 39.27 a 32 rad/unidad, giro regional suave, influencia más amplia de los contornos de islas y atenuación ceremonial en el forecourt. Menor contraste pintado y relieve más contenido; albedo mineral gris azulado y grano filtrado.
- Camino: mismas 21 posiciones y dimensiones, tres perfiles de superelipse, 12 lados con intervalos angulares irregulares, bisel estrecho erosionado, caras superiores coplanares. Datum reducido 0.027 unidades para asiento parcial.
- Rocas: once piezas, coronas más amplias, mayor enterrado; grupo izquierdo principal con mayor jerarquía. Tres geometrías compartidas.
- Musgo: lóbulos de escala media y transición de 0.60 unidades; mantiene los cinco territorios y el vacío central.
- Niwaki: azules desaturados en textura, color por vértice e instancia; oscurecimiento interior y bordes más claros. Cuatro árboles, ramas, bifurcaciones y huecos preservados; leve expansión del árbol hero izquierdo.
- Laterales: cuatro arbustos nuevos (tres izquierdos, uno derecho), doce en total. Cierre bajo asimétrico de piedra y madera abierta: 17 zócalos y 189 piezas de madera en dos lotes instanciados. Sin luces nuevas. Geometría y materiales con disposal explícito.
- NightGarden solo conecta construcción, layout, visibilidad y disposal del nuevo GardenBoundary.

Mansión, materiales arquitectónicos, occupancy, techos, luna, montañas, renderer, tone mapping, luces, atmósfera global y cámara permanecen sin cambios. Sin reset, revert, rebase, squash ni push.

## Validación

`npm run build` y `git diff --check`: PASS. Aviso previo de chunk >500 kB: bundle final 801.96 kB / 224.50 kB gzip.

`node scripts/verify-night-garden.cjs`: PASS en Chrome local, viewports desktop 1440×900, tablet 820×1180 y portrait 390×844. 21 capturas: 20/40/60/80/100 normales y 40/100 reduced-motion por formato. Sin errores de consola, JS ni shader registrados.

6,006 muestras de cámara: avance estable, distancia de mirada >4, clearance normal mínimo 1.355 y reducido 1.452. En cada formato: 12 meshes y 237 instancias comprobados; atributos y matrices sin NaN/Infinity. Caras de piedras expuestas 0.087–0.169 unidades; todos los vértices de su base quedan enterrados al menos 0.030 unidades respecto al muestreo del terreno. Datum de mansión idéntico dentro de 1e-7. El chequeo no instrumenta valores internos de píxeles GPU.

| Llegada | Draw calls antes → después | Triángulos antes → después | Texturas |
|---|---:|---:|---:|
| Desktop | 53 → 55 | 114702 → 122114 | 25 |
| Tablet | 52 → 54 | 114700 → 122112 | 25 |
| Portrait | 50 → 52 | 114634 → 122046 | 25 |

Incremento desktop: 2 draw calls y 7,412 triángulos (~6.5%). FPS observado 75 a DPR 1; son viewports emulados, no benchmarks de hardware móvil. No se añadieron cálculos por frame.

## Observaciones visuales

Revisadas la cuadrícula de los 15 checkpoints normales y capturas individuales desktop 20/60, tablet 60 y portrait 100. Sin clipping grave, piedras flotantes, árboles neón ni bloqueo de entrada visibles en los puntos inspeccionados. El izquierdo tiene mayor peso; el derecho queda secundario. En portrait el encuadre aprobado recorta los laterales y mantiene camino/genkan legibles.

La imagen conserva el carácter oscuro y estilizado del checkpoint aprobado: este pass aproxima materiales y paleta, pero no iguala el detalle fotográfico ni la iluminación de la referencia. Los surcos conservan una lectura regular a media distancia y las hojas mantienen la geometría original. La aprobación estética queda pendiente de revisión del usuario; no se avanza a otra fase.

## Commits de implementación y validación

- `5cf3045 feat: refine moonlit regional rake and mineral gravel`
- `9b982ad feat: balance dry mineral grain and groove relief`
- `f7d73aa feat: refine flat stepping slabs and eroded buried edges`
- `6cfe746 feat: ground asymmetric rock groups in organic moss banks`
- `0a4e43d feat: establish layered blue lunar niwaki foliage`
- `b5de1d2 feat: frame garden laterals with low timber enclosure and understory`
- `8d379f0 test: verify garden boundary geometry and buried slab undersides`
- Commit documental final: `docs: archive phase 3k6.2 garden review and captures`.

## Archivos fuente y validación modificados

- `scripts/verify-night-garden.cjs`
- `src/world/nightGarden/GardenApproach.ts`
- `src/world/nightGarden/GardenBoundary.ts`
- `src/world/nightGarden/GardenGround.ts`
- `src/world/nightGarden/GardenMaterials.ts`
- `src/world/nightGarden/GardenPath.ts`
- `src/world/nightGarden/GardenPineGeometry.ts`
- `src/world/nightGarden/GardenRakeShader.ts`
- `src/world/nightGarden/GardenRocks.ts`
- `src/world/nightGarden/GardenVegetation.ts`
- `src/world/nightGarden/GardenVegetationMaterials.ts`
- `src/world/nightGarden/NightGarden.ts`

## Artefactos de revisión

Rutas relativas a `C:/Users/PABLO/Documents/ai-hen/`:

- `docs/reviews/phase-3k62/checkpoints.jpg`
- `docs/reviews/phase-3k62/comparison.jpg`
- `docs/reviews/phase-3k62/desktop-100.png`
- `docs/reviews/phase-3k62/desktop-20.png`
- `docs/reviews/phase-3k62/desktop-40.png`
- `docs/reviews/phase-3k62/desktop-60.png`
- `docs/reviews/phase-3k62/desktop-80.png`
- `docs/reviews/phase-3k62/desktop-reduced-100.png`
- `docs/reviews/phase-3k62/desktop-reduced-40.png`
- `docs/reviews/phase-3k62/portrait-100.png`
- `docs/reviews/phase-3k62/portrait-20.png`
- `docs/reviews/phase-3k62/portrait-40.png`
- `docs/reviews/phase-3k62/portrait-60.png`
- `docs/reviews/phase-3k62/portrait-80.png`
- `docs/reviews/phase-3k62/portrait-reduced-100.png`
- `docs/reviews/phase-3k62/portrait-reduced-40.png`
- `docs/reviews/phase-3k62/report.json`
- `docs/reviews/phase-3k62/tablet-100.png`
- `docs/reviews/phase-3k62/tablet-20.png`
- `docs/reviews/phase-3k62/tablet-40.png`
- `docs/reviews/phase-3k62/tablet-60.png`
- `docs/reviews/phase-3k62/tablet-80.png`
- `docs/reviews/phase-3k62/tablet-reduced-100.png`
- `docs/reviews/phase-3k62/tablet-reduced-40.png`
- `docs/PHASE_3K6_2_GARDEN_FINALIZATION.md` (este reporte).

## Estado final previsto

Todos los cambios y artefactos del pass quedan en commits locales; sin push. Se verifica git status limpio tras el commit documental. El resumen de entrega incluye el hash final confirmado.
