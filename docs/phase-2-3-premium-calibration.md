# Phase 2.3 — Premium lighting calibration

Inicio: HEAD 7103bc1e53d47606dc94d4db3574c5d3c8906231, rama phase-2-3-genkan-interior-architecture, working tree limpio. Skill threejs aplicada. Seguimos en Phase 2.3. Último commit de producción validado: 722a2d6; los siguientes incorporan pruebas, resultados y documentación.

## Diagnóstico y resultado

La atenuación inversa al cuadrado se multiplicaba por un cutoff corto: las fuentes del camino (3.8–4.6, radios 2.7–3.0 m) perdían buena parte de su energía antes de llegar a piedras/grava adyacentes. Los ocho emisores secundarios analíticos tenían una ganancia uniforme de 1.8. La irradiancia de marcos y las emisiones de habitaciones estaban demasiado contenidas. Cambiar únicamente el color no resolvía esa pérdida.

Se centralizó la energía en PremiumPracticalEnergy. Los faroles ganan potencia y soporte local; los secundarios mantienen diferencias de intensidad. Se reforzaron las 24 fuentes de marcos ya existentes, las habitaciones ocupadas, la luz interior, el porche y el genkan. No se añadieron luces, mapas, texturas, geometrías, overlays ni bloom.

Un probe de visibilidad detectó que la tarima y las contrahuellas bloquean físicamente la luz del salón hacia parte de la escalera. Esa sombra se conserva. Se elevó únicamente el relleno existente del porche de y=3.10 a 3.85 local, conservando x=0 y z=6.15, para repartir mejor su energía entre rellano y escalones. No se movió arquitectura. El último escalón sigue siendo una transición hacia la noche, más tenue que el centro del acceso.

El color fuente pasó de #f2b465 a #f4b05e, la emisión del papel de #f5c181 a #f6c17b, el rebote de #d5a168 a #d9a05d y las habitaciones tenues de #e5b477 a #e7b16c. El albedo marfil aprobado del papel se conserva. Una compresión local de altas luces conserva las proporciones RGB del papel: empieza a 0.78 y se aproxima a 0.98 en radiancia lineal antes de la salida. Actúa sobre luz reflejada más emitida y mantiene la distribución de núcleo/borde existente; no cambia exposición ni tone mapping global.

La luna, ambiente frío, cielo, dirección y shadow architecture lunar están intactos. No hizo falta compensación ambiental: se recuperó el contraste desde las fuentes cálidas. La proporción artística 60–65% frío / 35–40% cálido no se presenta como un porcentaje global de píxeles ni como suma de intensidades de luces.

Las hojas de suelo y aéreas tienen ahora albedo azul/azul grisáceo, sin emisión. Densidad, semillas, distribución, geometría, movimiento y ownership idénticos. Cantidades suelo/aire: desktop 144/12, tablet 96/8, portrait 64/5. Mantienen reflejos cálidos locales por la iluminación existente.

## Intensidades y alcances: BEFORE → AFTER

Valores de las luces realmente instanciadas a visibilidad completa. Intensidades Three.js; distancias en unidades de mundo.

| Fuente | Intensidad antes → después | Alcance antes → después |
|---|---:|---:|
| pavilion-inner-threshold | 2.9 → 5.2 | 2.4 → 2.4 |
| pavilion-covered-landing | 2.6 → 12 | 3.2 → 4.8 |
| pavilion-hall-spill | 25.5 → 64 | 12 → 12 |
| pavilion-upper-spill | 4.8 → 8.5 | 3.5 → 3.5 |
| genkan-pendant-spill | 4.9 → 7.2 | 4.8 → 4.8 |
| genkan-display-lamp | 1.8 → 2.4 | 2.05 → 2.05 |
| genkan-andon-local | 0.49 → 0.72 | 1.45 → 1.45 |
| genkan-pendant-upper-diffusion | 0.62 → 0.9 | 1.45 → 1.45 |
| garden-practical-foreground | 4.6 → 10.5 | 3 → 3.8 |
| garden-practical-path-bend | 4.3 → 9.6 | 2.9 → 3.7 |
| garden-practical-path-middle | 4 → 9 | 2.8 → 3.6 |
| garden-practical-mid-path | 4.6 → 10 | 3 → 3.8 |
| garden-practical-arrival | 3.8 → 8.8 | 2.7 → 3.5 |
| garden-practical-left-perimeter | 2.9 → 5.8 | 2.2 → 2.8 |
| garden-practical-right-perimeter | 2.9 → 5.8 | 2.2 → 2.8 |
| garden-wall-practical-0 | 2.35 → 4.2 | 2.05 → 2.4 |
| garden-wall-practical-1 | 2.35 → 4.2 | 2.05 → 2.4 |
| garden-wall-practical-2 | 2.35 → 4.2 | 2.05 → 2.4 |
| garden-wall-practical-3 | 2.35 → 4.2 | 2.05 → 2.4 |

| Contribución de material/shader | Antes → después |
|---|---|
| Secundarios analíticos (8 fuentes) | 1.8 uniforme → 2.944–4.104, según familia/índice |
| Soporte secundarios perímetro/islas | 2.0 / 1.65 → 2.4 / 2.1 |
| Rebote de suelo | 0.15 → 0.24 |
| Papel faroles jardín / muro / interior | 0.94 / 0.80 / 0.74 → 1.24 / 1.08 / 0.96 |
| Shoji ocupado / tenue / entrada | 0.50 / 0.23 / 0.58 → 0.90 / 0.42 / 1.00 |
| Ganancia marcos cálidos / tenues | 0.58 / 0.25 → 1.05 / 0.46 |
| Tope de irradiancia de marcos | 0.75 → 1.20 |
| Soporte de marcos | 1.35 → 1.35; mismo transporte unilateral |
| Multiplicador aura existente | 0.32 → 0.46; mismos planos y huellas |

## Respuesta numérica local

Proxy de luminancia difusa incidente: atenuación/cutoff/conos de Three, normal vertical y rayos contra los shadow casters actuales. No incluye albedo, normal maps, especular, niebla, emisión, bounce analítico ni percepción en pantalla. El hemisferio usa un promedio simplificado. Es evidencia de transporte directo y contraste local, no una certificación visual. Mismos puntos y aporte frío antes/después. El histórico se sirvió desde git sin cambiar rama ni checkout; sus métricas coincidieron con la base fresca.

| Punto desktop | Cálido antes → después | Ganancia | Fracción cálida antes → después |
|---|---:|---:|---:|
| path-0 | 0.1390 → 0.4328 | 3.11× | 13.5% → 32.8% |
| path-1 | 0.2461 → 0.6181 | 2.51× | 21.7% → 41.0% |
| path-2 | 0.4289 → 1.0215 | 2.38× | 32.6% → 53.5% |
| path-3 | 0.2529 → 0.6032 | 2.39× | 22.2% → 40.5% |
| path-4 | 0.2065 → 0.5359 | 2.60× | 18.9% → 37.6% |
| threshold | 0.4915 → 1.1857 | 2.41× | 92.8% → 96.9% |
| landing | 0.2152 → 1.2076 | 5.61× | 19.5% → 57.6% |
| upper-stair | 1.1144 → 1.9935 | 1.79× | 55.7% → 69.2% |
| middle-stair | 0.1068 → 0.5582 | 5.23× | 10.7% → 38.6% |
| outer-stair | 0.0021 → 0.1393 | 65.54× | 0.2% → 13.6% |
| cold-control | 0.0000 → 0.0000 | — | 0.0% → 0.0% |

Los ocho pools secundarios analíticos suben 1.64–2.25× en los probes a 0.65 m de su fuente. El gran cociente del escalón exterior parte de un valor casi nulo: su fracción cálida final es solo 13.6%; no equivale a multiplicar la luminosidad de la escena por 65.5. El control frío mantiene energía cálida cero.

## Presupuesto BEFORE → AFTER

Todos los valores siguientes son idénticos antes/después. Shadow refresh fuerza la actualización de los cuatro mapas, frente al frame con caché caliente.

| Layout / pose | Draw calls antes → después | Triángulos antes → después | Calls con shadow refresh | Triángulos con shadow refresh |
|---|---:|---:|---:|---:|
| desktop / garden | 83 → 83 | 316692 → 316692 | 200 → 200 | 583240 → 583240 |
| desktop / threshold | 70 → 70 | 245300 → 245300 | 187 → 187 | 511848 → 511848 |
| desktop / interior | 53 → 53 | 110856 → 110856 | 170 → 170 | 377404 → 377404 |
| tablet / garden | 82 → 82 | 273739 → 273739 | 199 → 199 | 540287 → 540287 |
| tablet / threshold | 64 → 64 | 189486 → 189486 | 181 → 181 | 456034 → 456034 |
| tablet / interior | 51 → 51 | 106326 → 106326 | 168 → 168 | 372874 → 372874 |
| portrait / garden | 77 → 77 | 235931 → 235931 | 194 → 194 | 502479 → 502479 |
| portrait / threshold | 66 → 66 | 187165 → 187165 | 183 → 183 | 453713 → 453713 |
| portrait / interior | 45 → 45 | 97068 → 97068 | 162 → 162 | 363616 → 363616 |

Geometrías 69 → 69; texturas 41 → 41; programas calientes 51 → 51 (primer jardín desktop: 45 → 45 antes de compilar interior); luces totales 25 → 25; luces con sombras 4 → 4; casters 37 → 37; receivers 63 → 63. Cero sombras PointLight. Ninguna dependencia nueva.

Mapas: luna 2048², hall 1024², colgante 512², primer farol 512². Resoluciones, bias, normalBias y suavidad conservados. Solo el far plane del primer farol cambia 3.0 → 3.8 para acompañar su alcance y evitar corte de sombras. Caché, invalidación de puertas y reutilización de mapas pasan.

FPS sincronizado con GPU y shaders calientes: 75 → 75 en jardín/interior en los tres viewports; con hojas animadas, 75 en los tres. Son muestras cortas en Chrome de escritorio con distintos viewports, limitadas por el ritmo observado de RAF; no son pruebas en hardware móvil ni demuestran coste GPU cero.

## Validaciones ejecutadas

- npm run build: PASS (TypeScript + Vite). Aviso ya existente de chunk >500 kB; bundle 889.69 kB, gzip 252.04 kB.
- git diff --check: PASS.
- verify-premium-calibration-frozen.cjs: PASS, 97 archivos contrastados; cámara, recorrido, tiempos, ownership, luna, geometrías y comportamiento de hojas conservados. Anclas de faroles idénticas; único cambio permitido de shadow settings: far del primer farol.
- validate-premium-practicals.cjs: PASS en 1440×900, 820×1180, 390×844, con LIGHTING_CONTRAST_AUDIT=1 y LIGHTING_LEAF_AUDIT=1.
- compare-premium-calibration.cjs: PASS, presupuestos iguales a la base fresca/histórica, poses/exposición iguales, aporte frío igual y ganancia cálida >1.5× en cada receptor iluminado muestreado.
- Forward/reverse y scroll nativo normal/reducido, puertas, resize repetido y cambios de layout: PASS.
- Hojas: reduced-motion freeze, hidden pause, fase conservada al resize, colocación y disposal: PASS.
- Fuentes dentro de faroles/colgante; camino y haz hall→rellano despejados, frustum lunar cubre mansión, mapas reutilizados: PASS.
- Compilación efectiva de shoulder de papel y transferencia de ventanas acotada; albedo frío de cada hoja: PASS.
- 484 rayos de recinto por layout, cero huecos detectados; 112 muestras de suelo, sin soportes faltantes ni caras superiores coplanares. Son pruebas geométricas, no una prueba exhaustiva de fugas luminosas.
- Hidden/resume y bfcache: PASS. Disposal: 0 geometrías, 0 programas, 4 texturas retenidas (idénticas al baseline documentado), frame detenido y ScrollTrigger cerrado. Sin crecimiento en ciclos de resize.
- Errores JS/shader de consola: ninguno. WebGL getError: 0.

Reproducción: Playwright externo instalado en C:/Users/PABLO/AppData/Local/Temp/ai-hen-review-tools/node_modules, vía NODE_PATH; Vite en 127.0.0.1:5174. No se añadió Playwright al proyecto. Para regenerar el histórico usar LIGHTING_STAGE=before y LIGHTING_BASELINE_REF=7103bc1e53d47606dc94d4db3574c5d3c8906231. Los JSON archivados permiten repetir la comparación sin navegador.

## Límites reales

Sin capturas ni inspección de píxeles en esta tarea. La diferencia de energía es sustancial y medida; el resultado estético, acne, peter-panning, contacto y ausencia absoluta de fugas deben revisarse visualmente. Los transportes secundarios/marcos y el rebote de porche siguen siendo aproximaciones acotadas sin oclusión propia; no equivalen a GI ni garantizan oclusión por cualquier pieza. El soporte del porche termina en z local 1.35 hacia atrás y no llega al recinto trasero; no se aumentó el número de sombras para ocultar estos límites.

No Phase 2.4. No screenshots, galerías, contact sheets ni vídeos. No assets externos nuevos. No push performed. No PR.

## Archivos creados/modificados en esta continuación

- A: docs/phase-2-3-premium-calibration.md
- A: scripts/compare-premium-calibration.cjs
- A: scripts/premium-calibration-after.json
- A: scripts/premium-calibration-before.json
- A: scripts/premium-calibration-historical-before.json
- A: scripts/probe-practical-contrast-runtime.cjs
- A: scripts/validate-premium-calibration-runtime.cjs
- M: scripts/validate-premium-practicals.cjs
- A: scripts/verify-premium-calibration-frozen.cjs
- M: src/world/nightGarden/GardenAirLeaves.ts
- M: src/world/nightGarden/GardenGroundLeaves.ts
- M: src/world/nightGarden/GardenLanternIrradiance.ts
- M: src/world/nightGarden/GardenLanternMaterials.ts
- M: src/world/nightGarden/GardenLanternNetwork.ts
- M: src/world/nightGarden/GardenLanterns.ts
- M: src/world/nightGarden/GardenPavilionGlow.ts
- M: src/world/nightGarden/GardenPavilionLighting.ts
- M: src/world/nightGarden/GardenPavilionOccupancy.ts
- M: src/world/nightGarden/GardenPavilionSource.ts
- M: src/world/nightGarden/GardenPracticalBounce.ts
- M: src/world/nightGarden/GardenShadowSettings.ts
- M: src/world/nightGarden/GardenWallLanterns.ts
- M: src/world/nightGarden/GardenWindowIrradiance.ts
- M: src/world/nightGarden/GenkanInterior.ts
- M: src/world/nightGarden/GenkanInteriorLighting.ts
- A: src/world/nightGarden/PaperHighlightResponse.ts
- M: src/world/nightGarden/PracticalLightPalette.ts
- A: src/world/nightGarden/PremiumPracticalEnergy.ts

## Commits de implementación y validación

- 63eb9ce docs: audit practical attenuation and record premium calibration baseline
- 6aba97e refactor: centralize premium practical source and receiver energy targets
- 09ad784 feat: strengthen path pools and align existing shadow reach with falloff
- b031fe7 feat: energize every secondary and wall lantern with distinct bounded pools
- 1289ff4 feat: enrich warm paper cores with a hue-preserving highlight shoulder
- 45ba424 feat: amplify occupied shoji and bounded mansion frame aura
- e98a187 feat: deliver stronger shadowed hall and landing energy to the entrance
- 0c519c5 feat: balance pendant and genkan practicals with the brighter entrance
- 2c7ea6a fix: preserve blue-grey leaf albedo while allowing local warm reflections
- 722a2d6 fix: spread existing porch bounce across shadowed stair treads
- 20773af test: verify stronger practical transport and stable responsive GPU budgets

El commit que contiene esta versión final del informe cierra la documentación. El HEAD final y git status se entregan después de crearlo.
