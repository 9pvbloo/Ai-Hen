# Phase 3K.6.3 — Garden Depth & Perimeter Architecture

## Checkpoint y estudio

Misma rama `phase-3k-cinematic-rebuild`, inicio `e3b9ae0`, ocho commits locales previos preservados. Git status inicialmente limpio; log y git diff --check revisados antes de editar. Se utilizó la skill threejs. Se inspeccionaron antes de editar las tres referencias obligatorias:

- `docs/references/phase-3k6-2-garden-cinematic-reference.png`
- `docs/references/phase-3k6-garden-reference.png`
- `docs/references/phase-3k6-garden-target.png`

Diagnóstico: la baranda abierta no daba suficiente masa ni profundidad lateral; faltaba una capa arquitectónica detrás de las plantaciones. Los campos de rastrillado superpuestos generaban cruces y una lectura repetitiva. Se capturó BEFORE ejecutable antes de modificar el jardín. Implementación original sin assets externos ni dependencias nuevas.

## Resultado y decisiones

Perímetro: veinte tramos en seis recorridos asimétricos, con 120 bloques de piedra en dos hiladas, 186 piezas de madera, veinte paneles retranqueados y veinte coronaciones a dos aguas. Cuatro lotes instanciados y dos geometrías compartidas. Altura nominal del muro 1.25–1.65 unidades, más coronación. El izquierdo es más largo y tiene un retorno corto; el derecho tiene una interrupción y queda más bajo. El retorno se ajustó tras la comparativa intermedia para mantener presencia al 60–100% sin cambiar la cámara.

Paneles gris verdoso sobrio con un término emisivo local muy bajo (`#40505a`, intensidad 0.10) para conservar legibilidad en la cara izquierda en sombra. Esto no añade luces, bloom ni cambios al renderer o a la iluminación global. Los marcos, zócalos y coronaciones mantienen su respuesta estándar a las luces existentes.

Integración: cinco nuevos bancos de musgo conectan el terreno con el perímetro. Seis rocas auxiliares y ocho arbustos nuevos, reutilizando geometrías y materiales existentes. Totales: 17 rocas, 20 arbustos y los mismos cuatro niwaki. El fondo izquierdo se retranquea respecto a los arbustos y al grupo principal, evitando cerrar el camino. Se recolocaron algunos apoyos laterales durante el ajuste de encuadre.

Suelo: los contornos incluyen los nuevos bancos. Se separan las ondas de rastrillado con una transición de grava sin surcos en vez de superponer patrones; cambia suavemente su orientación e intensidad regional. La distancia al eje aprobado del camino se calcula al generar el terreno y se interpola por vértice: atenúa los surcos entre 0.65 y 1.45 unidades del eje, dando un apoyo visual más calmado a las piedras. Paleta gris azulada y grano fino preservados.

Las 21 stepping stones permanecen exactamente iguales. También permanecen iguales la mansión y sus materiales, árboles principales y paleta, cámara, luces, renderer, luna, montañas, cielo y atmósfera. NightGardenConfig cambia únicamente los tres valores de rockCount de 11 a 17. No hubo push, reset, revert, rebase ni squash.

## Validación técnica

- `npm run build`: PASS. Bundle 806.20 kB / 225.79 kB gzip; persiste el aviso previo de chunk >500 kB.
- `git diff --check`: PASS.
- `scripts/verify-night-garden.cjs`: PASS; no errores JS, consola ni shader registrados.
- 6,006 muestras de cámara, normal y reduced-motion. Distancia mínima horizontal a muros, descontando 0.5 unidades de ancho: 6.796. Clearance mínimo sobre el terreno: 1.355. Avance y mirada estables.
- Cada layout: 14 meshes y 391 instancias revisados, capacidades válidas, atributos y matrices finitos. Comprobados veinte paneles y veinte coronaciones, cinco bancos de musgo y distancia cero del campo de camino en los 21 anclajes.
- Piedras: exposición superior 0.087–0.169; todas las bases bajo el terreno, con enterrado mínimo 0.030. Datum de mansión preservado dentro de 1e-7.
- 21 capturas AFTER: desktop 1440×900, tablet 820×1180, portrait 390×844. 20/40/60/80/100 normales y 40/100 reduced-motion en cada formato.

## Coste observado en la llegada

| Formato | Draw calls BEFORE → AFTER | Triángulos BEFORE → AFTER | Texturas |
|---|---:|---:|---:|
| Desktop | 55 → 57 | 122114 → 135244 | 25 → 25 |
| Tablet | 54 → 56 | 122112 → 135242 | 25 → 25 |
| Portrait | 52 → 54 | 122046 → 135176 | 25 → 25 |

+2 draw calls y +13,130 triángulos (~10.8% desktop). Materiales compartidos, geometría estática, sin nuevas luces ni cálculos por frame; recursos GPU liberados explícitamente. El shader de suelo ahora evalúa diez contornos en vez de cinco, sin texturas nuevas. FPS local observado: 75 a DPR 1. No es una medición de hardware móvil ni un perfil aislado del fragment shader.

## Revisión visual y límites

Inspeccionadas capturas desktop 20/60/100 y cuadrícula de checkpoints; tablet 100 y portrait 60 también a tamaño completo. No se observan clipping grave, piedras flotantes, árboles neón ni obstrucción del genkan en las vistas inspeccionadas. La composición lateral es más densa y el muro aparece detrás de las plantaciones, con primer plano, masa vegetal intermedia y cierre posterior.

En tablet/portrait parte del perímetro queda fuera del encuadre aprobado; no se alteró la cámara para mostrarlo. El suelo conserva una lectura regular a media distancia y un aspecto estilizado: no reproduce el detalle fotográfico de las referencias. No se añaden luces cálidas perimetrales porque el lighting setup está congelado. La inspección de capturas no equivale a una prueba exhaustiva de cada píxel o frame; no se instrumentaron valores internos GPU. Aprobación estética pendiente del usuario, sin avanzar de fase.

## Commits

- `8c3c970 feat: build asymmetric Japanese perimeter walls and gabled coping`
- `3924ce7 feat: layer perimeter moss pockets with rocks and blue understory`
- `e34f644 feat: separate rake fields and settle gravel along the garden walk`
- `b68c448 fix: retain layered perimeter framing through the genkan arrival`
- `71eb0de test: verify perimeter seating and camera walk clearances`
- Commit documental final: `docs: archive phase 3k6.3 perimeter review and comparisons`.

## Archivos modificados

- `scripts/verify-night-garden.cjs`
- `src/world/nightGarden/GardenApproach.ts`
- `src/world/nightGarden/GardenBoundary.ts`
- `src/world/nightGarden/GardenGround.ts`
- `src/world/nightGarden/GardenGroundHeight.ts`
- `src/world/nightGarden/GardenMaterials.ts`
- `src/world/nightGarden/GardenPerimeterComposition.ts`
- `src/world/nightGarden/GardenRakeShader.ts`
- `src/world/nightGarden/GardenRocks.ts`
- `src/world/nightGarden/GardenVegetation.ts`
- `src/world/nightGarden/NightGardenConfig.ts`
- `docs/PHASE_3K6_3_GARDEN_DEPTH.md`
- Artefactos de revisión listados abajo.

## Capturas y comparativas

Todas las rutas son relativas a `C:/Users/PABLO/Documents/ai-hen/`. BEFORE desktop 20/60/100 se conserva a resolución completa junto con su reporte.

- `docs/reviews/phase-3k63/before/desktop-100.png`
- `docs/reviews/phase-3k63/before/desktop-20.png`
- `docs/reviews/phase-3k63/before/desktop-60.png`
- `docs/reviews/phase-3k63/before/report.json`
- `docs/reviews/phase-3k63/checkpoints.jpg`
- `docs/reviews/phase-3k63/comparison.jpg`
- `docs/reviews/phase-3k63/desktop-100.png`
- `docs/reviews/phase-3k63/desktop-20.png`
- `docs/reviews/phase-3k63/desktop-40.png`
- `docs/reviews/phase-3k63/desktop-60.png`
- `docs/reviews/phase-3k63/desktop-80.png`
- `docs/reviews/phase-3k63/desktop-reduced-100.png`
- `docs/reviews/phase-3k63/desktop-reduced-40.png`
- `docs/reviews/phase-3k63/portrait-100.png`
- `docs/reviews/phase-3k63/portrait-20.png`
- `docs/reviews/phase-3k63/portrait-40.png`
- `docs/reviews/phase-3k63/portrait-60.png`
- `docs/reviews/phase-3k63/portrait-80.png`
- `docs/reviews/phase-3k63/portrait-reduced-100.png`
- `docs/reviews/phase-3k63/portrait-reduced-40.png`
- `docs/reviews/phase-3k63/report.json`
- `docs/reviews/phase-3k63/tablet-100.png`
- `docs/reviews/phase-3k63/tablet-20.png`
- `docs/reviews/phase-3k63/tablet-40.png`
- `docs/reviews/phase-3k63/tablet-60.png`
- `docs/reviews/phase-3k63/tablet-80.png`
- `docs/reviews/phase-3k63/tablet-reduced-100.png`
- `docs/reviews/phase-3k63/tablet-reduced-40.png`

## Git

Trabajo guardado en commits locales sobre la misma rama; sin push. El git status final se comprueba después del commit documental y se comunica en la entrega.
