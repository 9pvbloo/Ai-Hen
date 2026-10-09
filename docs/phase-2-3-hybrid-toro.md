# Phase 2.3 — faroles híbridos del camino

Inicio: rama phase-2-3-genkan-interior-architecture, HEAD 6e732da3b307653857bbc39c9a89d03ef6482945, working tree limpio. Skill threejs aplicada. Sin Phase 2.4.

## Resultado y alcance

La cámara anterior conservaba cuatro pilares, umbral y dintel de piedra, lo que mantenía una lectura pesada incluso después de adelgazar el fuste. Ahora la base, pedestal, fuste y su apoyo superior permanecen exactamente iguales, mientras que la cámara luminosa se construye con madera oscura mate y papel cálido. El techo conserva una lectura mineral más ligera; el remate es oscuro y más pequeño.

- Postes: piedra de sección 0.072 → madera de sección 0.028. Centros x=±0.215/z=±0.20 → ±0.157/±0.145 dentro del mismo farol; las anclas de los faroles no se mueven. Se acerca la estructura al papel manteniendo su profundidad y la fuente centrada.
- Umbral de cámara: pieza oscura de 0.35×0.025×0.31, antes piedra de 0.43×0.025×0.39. Se conserva la altura de asiento sobre la plataforma mineral.
- Dintel: pieza oscura de 0.37×0.044×0.33, antes piedra de 0.52×0.044×0.48. Separa visualmente cámara y cubierta.
- Retícula: grosor 0.008 → 0.0065, con el patrón de cuatro caras y el eje de salida al camino conservados.
- Cubierta mineral: radio máximo 0.47 → 0.44, borde 0.016 → 0.012 y coronación 1.36 → 1.345 en coordenadas del prototipo. La huella no crece.
- Remate: pasa a madera oscura; radio ×0.72 y altura propia ×0.82, apoyado en la nueva coronación.
- Acabado de madera exclusivo path: #302d25, roughness 0.86, bumpScale 0.004. Reutiliza las texturas de madera existentes. Los faroles pequeños conservan #282721/0.78 y su geometría exacta.
- Papel, paleta cálida, emisión, fuentes, intensidades, falloff, targets, halos y configuración de sombras se mantienen. La nueva estructura genera naturalmente su sombra más fina.

No se cambiaron cámara, recorrido, timings, ownership, moon gate, sky/moon, mansión, stepping stones, hojas, faroles pequeños, murales, interiores ni arquitectura general. Solo se modificaron dos archivos de producción: GardenLanterns.ts y PathToroGeometry.ts.

## Presupuesto BEFORE → AFTER

| Prototipo path | Triángulos antes → después |
|---|---:|
| Piedra | 1004 → 516 |
| Estructura oscura/retícula/remate | 360 → 848 |
| Papel | 48 → 48 |
| Total por farol | 1412 → 1412 |
| Cinco faroles | 7060 → 7060 |

Se reutilizan los mismos tres lotes path, tres secondary y halo. Se añade un objeto Material para aislar la madera path; se libera explícitamente en el propietario existente. Sin nuevas geometrías, texturas, luces, sombras o programas GPU.

| Layout / pose | Draw calls antes → después | Triángulos antes → después |
|---|---:|---:|
| desktop/reveal | 87 → 87 | 324192 → 324192 |
| desktop/garden | 83 → 83 | 316692 → 316692 |
| desktop/threshold | 70 → 70 | 245300 → 245300 |
| desktop/interior | 53 → 53 | 110856 → 110856 |
| tablet/reveal | 84 → 84 | 279701 → 279701 |
| tablet/garden | 82 → 82 | 273739 → 273739 |
| tablet/threshold | 64 → 64 | 189486 → 189486 |
| tablet/interior | 51 → 51 | 106326 → 106326 |
| portrait/reveal | 81 → 81 | 220489 → 220489 |
| portrait/garden | 77 → 77 | 235931 → 235931 |
| portrait/threshold | 66 → 66 | 187165 → 187165 |
| portrait/interior | 45 → 45 | 97068 → 97068 |

Geometrías 70 → 70; texturas 41 → 41; programas calientes 52 → 52; luces 25 → 25; luces con sombra 4 → 4; casters 37 → 37; receivers 63 → 63. El muestreo incluye reveal a progreso global 0.73, además de llegada, umbral e interior. Primer reveal desktop: 46 programas antes de compilar todos los pases, igual en ambos estados. Calls y triángulos con shadow refresh también idénticos en cada pose y formato.

No se cambiaron resoluciones de mapas (2048²/1024²/512²/512²), bias, normalBias, filtros, frusta ni caché. Ninguna sombra PointLight añadida. Las cifras completas de cada pase están archivadas en scripts/hybrid-toro-before.json y scripts/hybrid-toro-after.json.

## Validaciones

- npm run build: PASS. TypeScript + Vite, 124 módulos, JS 893.40 kB / gzip 253.07 kB. Persiste el aviso previo de chunk >500 kB.
- git diff --check: PASS.
- verify-hybrid-toro.cjs: PASS. Atributos/índices finitos y válidos; huella y altura conservadoras respetadas; base/fuste/apoyo (primeras ocho piezas minerales) idénticos atributo por atributo; papel y faroles secundarios idénticos; no queda piedra en el intervalo de la cámara luminosa; total de triángulos idéntico.
- El mismo verificador compara 115 archivos de producción/configuración contra el HEAD inicial, excluyendo únicamente los dos módulos autorizados. Confirma el alcance congelado indicado arriba.
- validate-premium-practicals.cjs: PASS con LIGHTING_TORO_AUDIT=1, LIGHTING_HYBRID_AUDIT=1, LIGHTING_LEAF_AUDIT=1 y LIGHTING_BUDGET_BASELINE=./hybrid-toro-before.json.
- Desktop 1440×900, tablet 820×1180 y portrait 390×844; forward/reverse, scroll nativo, resize repetido, reduced motion, hidden pause/resume y bfcache: PASS.
- compare-hybrid-toro.cjs: PASS; igualdad exacta de presupuestos incluyendo reveal y shadow refresh, inventario, renderer y poses.
- Material de madera exclusivo path, texturas compartidas y acabado secundario intacto: PASS. La estructura oscura sigue proyectando y recibiendo sombras.
- Fuentes dentro del volumen luminoso, veinte rayos de paneles por layout y distancias positivas fuente/papel: PASS. Barrido de cámara con separación >1 unidad, huella del camino libre y rayo foreground→camino despejado.
- Hojas: freeze, fase al resize, cantidades, colocación y disposal: PASS. Archivos idénticos al inicio.
- Fixtures: cada material/geometría/instancia se libera una vez incluso al repetir dispose; sonda de recursos de faroles 27 → 28 por el único material añadido.
- Limpieza de mundo: cero geometrías, cero programas, cuatro texturas retenidas iguales al baseline documentado; RAF detenido y ScrollTrigger cerrado.
- Cero errores JS/shader en consola y WebGL getError=0.

Reproducción: Vite en 127.0.0.1:5174 y Playwright externo vía NODE_PATH=C:/Users/PABLO/AppData/Local/Temp/ai-hen-review-tools/node_modules; ninguna dependencia añadida. BEFORE se midió sobre el HEAD inicial limpio antes de editar. Las métricas FPS calientes se conservan en los JSON; son muestras de Chrome de escritorio con distintos viewports, no mediciones en hardware móvil.

## Límites de revisión

Sin capturas, galerías, vídeos ni inspección de píxeles. Se verificaron construcción, selección de materiales, conservación del color/luz, ubicación de fuentes, despeje y presupuesto; falta confirmar visualmente la lectura premium final y la retícula fina a distancia. El papel sigue siendo el material emisivo estilizado aprobado, no una simulación volumétrica de transmisión. Se conservan las limitaciones de las sombras selectivas existentes.

No Phase 2.4. No push. No PR.

## Archivos creados/modificados

- docs/phase-2-3-hybrid-toro.md
- scripts/compare-hybrid-toro.cjs
- scripts/hybrid-toro-after.json
- scripts/hybrid-toro-before.json
- scripts/validate-hybrid-toro-runtime.cjs
- scripts/validate-premium-practicals.cjs
- scripts/verify-hybrid-toro.cjs
- src/world/nightGarden/GardenLanterns.ts
- src/world/nightGarden/PathToroGeometry.ts

## Commits de implementación y validación

- a111af7 docs: audit hybrid path lantern scope and capture runtime baseline
- b84e1ed feat: isolate matte dark timber finish for main path lantern frames
- 14d91a9 feat: replace heavy chamber stone piers with slender timber corner posts
- e0af990 feat: seat warm paper in a fine timber sill above the stone support
- a4ab759 feat: separate the mineral canopy with a compact dark timber header
- 8d4dd11 feat: lighten the mineral eave above the hybrid luminous chamber
- 18c2c4c feat: replace the heavy stone crown with a slim dark finial
- b9ce038 feat: refine shoji lattice thickness within the dark timber cage
- 451149d test: verify hybrid materials frozen lower structure and identical responsive budgets

El commit de cierre contiene este informe; HEAD final y estado limpio se verifican después de crearlo.
