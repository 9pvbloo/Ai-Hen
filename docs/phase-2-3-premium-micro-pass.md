# Phase 2.3 — micro-pass de contraste nocturno

Inicio: 3c3d10e54be437ed49951ca3ad513c1341a2ab86, rama phase-2-3-genkan-interior-architecture, working tree limpio. Skill threejs aplicada. Sin Phase 2.4.

## Cambios visuales

- Grava/arena rastrillada: la luz lunar directa se multiplica por 0.84 en superficies horizontales completamente gravel. La reducción se desvanece entre normales Y=0.65 y 0.95 y según la mezcla de terreno. Musgo, verticales, cielo, luna, árboles, siluetas, stepping stones y arquitectura no reciben este filtro. El ambiente y rim tampoco se modifican. Se conserva el cálculo de sombras y la contención de prácticos anterior.
- Faroles: fuente #f4b05e → #f0aa53; emisión del papel #f6c17b → #f2b566; reflectancia #d0ba95 → #d4bc91. Se separa mejor el núcleo de los bordes mediante un factor periférico 0.68 → 0.58 y de borde 0.72 → 0.66. La compresión de altas luces aprobada sigue activa. Halos, fuentes, intensidades de jardín, alcances y sombras permanecen iguales.
- Primer farol del camino: ancla 0, (-3.05,-14.95), fuente garden-practical-foreground. Corrección de emisión de papel de 1 → 0.86 únicamente alrededor de su cámara luminosa. Un uniform vec4 y un varying compartidos evitan crear materiales, atributos, geometrías o programas adicionales. La fuente sigue dentro del papel; el pool y la sombra conservan su configuración. La selección de una sola instancia se verifica en runtime.
- Mansión: aumento moderado de shoji, marcos, postes y acceso; soporte de irradiancia 1.35 m y alcances físicos intactos. El cambio espectral reduce por sí solo la luminancia de la fuente al 93.75% y la del papel al 89.39%; se compensó para obtener una subida real, no únicamente más saturación. Por ejemplo, hall +5.47% de luminancia fuente y shoji cálido +7.27%, antes de compresión, iluminación incidente y niebla.
- Hojas: albedos algo más claros, siempre B>G>R en lineal. Sin emisión; reflejos cálidos locales siguen procediendo de la escena. No se cambian cantidades (144/12, 96/8, 64/5 suelo/aire), semillas, disposición, coreografía ni lifecycle.

## Calibración BEFORE → AFTER

| Parámetro | Antes → después |
|---|---|
| Respuesta lunar de grava horizontal | 1.00 → 0.84 |
| Emisión localizada de papel foreground | 1.00 → 0.86 |
| Shoji cálido / tenue / entrada | 0.90 / 0.42 / 1.00 → 1.08 / 0.46 / 1.18 |
| Hall / upper spill | 64 / 8.5 → 72 / 9.6 |
| Umbral / rellano | 5.2 / 12 → 5.9 / 13 |
| Irradiancia marcos cálidos / tenues | 1.05 / 0.46 → 1.20 / 0.52 |
| Cap irradiancia / aura existente | 1.20 / 0.46 → 1.32 / 0.49 |
| Alcances, posiciones de fuentes, halos y sombras | Sin cambios |

## Métricas reales

Medidas con el mismo harness y una base fresca del HEAD inicial. La comparación automática exige igualdad exacta por pose y layout, incluyendo refresh de sombras, inventario y renderer. Todas pasan.

| Layout / pose | Draw calls BEFORE → AFTER | Triángulos BEFORE → AFTER |
|---|---:|---:|
| desktop / garden | 83 → 83 | 316692 → 316692 |
| desktop / threshold | 70 → 70 | 245300 → 245300 |
| desktop / interior | 53 → 53 | 110856 → 110856 |
| tablet / garden | 82 → 82 | 273739 → 273739 |
| tablet / threshold | 64 → 64 | 189486 → 189486 |
| tablet / interior | 51 → 51 | 106326 → 106326 |
| portrait / garden | 77 → 77 | 235931 → 235931 |
| portrait / threshold | 66 → 66 | 187165 → 187165 |
| portrait / interior | 45 → 45 | 97068 → 97068 |

Geometrías 69 → 69, texturas 41 → 41, programas calientes 51 → 51, luces 25 → 25, luces con sombra 4 → 4, casters 37 → 37, receivers 63 → 63. En la primera pose desktop se registran 45 programas antes de calentar los demás pases; se reproduce en la base.

Mismos mapas: 2048² lunar, 1024² hall, 512² colgante y 512² foreground. Mismos bias, normalBias, frusta, filtros y ownership. Cero nuevas sombras de PointLight.

FPS caliente jardín/interior: 75 → 75 en los tres viewports. Hojas animadas: 75 en los tres. Son muestras cortas de Chrome de escritorio, limitadas por RAF; no son un benchmark de dispositivos móviles ni prueban coste de shader cero. Las primeras muestras con compilación son variables y no se usan como comparación de rendimiento sostenido.

## Validación

- Build TypeScript + Vite: PASS; 122 módulos, JS 891.44 kB / gzip 252.44 kB. Persiste el aviso previo de chunk >500 kB.
- git diff --check: PASS.
- verify-premium-micro-frozen.cjs: 109 archivos contrastados contra HEAD inicial. Cámara, rutas, timings, ownership, arquitectura, stepping stones, luna, sombras y comportamiento de hojas intactos.
- validate-premium-practicals.cjs con LIGHTING_MICRO_AUDIT=1, LIGHTING_LEAF_AUDIT=1 y LIGHTING_BUDGET_BASELINE=./premium-micro-before.json: PASS en desktop 1440×900, tablet 820×1180 y portrait 390×844.
- Filtro lunar compilado exclusivamente en los dos meshes de ground/rake que comparten material. Una sola directional con sombras, la luna. Fuente foreground dentro del papel; máscara afecta solo esa instancia. Hojas B>G>R y sin emisión.
- Forward/reverse, scroll nativo normal/reducido, resize repetido, puertas y cámara: PASS.
- Reduced-motion freeze, hidden pause/resume y bfcache: PASS.
- Sombras: caché y reutilización de mapas, cobertura lunar, haz hall→rellano y foreground→camino: PASS.
- Lifecycle/disposal: cero geometrías y programas; cuatro texturas retenidas, idénticas al baseline conocido; RAF detenido y ScrollTrigger cerrado.
- Cero errores JS/shader de consola y WebGL getError=0.

Reproducción: Vite en 127.0.0.1:5174, Playwright externo mediante NODE_PATH=C:/Users/PABLO/AppData/Local/Temp/ai-hen-review-tools/node_modules. Sin dependencias añadidas. Resultados archivados en scripts/premium-micro-before.json y scripts/premium-micro-after.json.

Comprobación adicional de reveal (progreso global 0.73): PASS con cero errores; el ancla 0 está a la derecha y delante de cámara. En desktop su centro está dentro de pantalla; en tablet/portrait queda fuera del lateral en ese instante por el encuadre aprobado, sin cambios en esta tarea. Se verificó también que el shader mantiene la contención de prácticos. Resultado: scripts/premium-micro-reveal.json.

## Límites

No se generaron capturas ni vídeos y no hubo inspección de píxeles. Los cambios de material/shader, confinamiento y presupuesto están comprobados; la lectura estética final requiere revisión visual. La irradiancia acotada y los rebotes existentes siguen sin oclusión propia; no se promete GI ni ausencia absoluta de fugas. No se modificó el sistema de sombras para ocultar estos límites.

No push. No PR. Sin solicitudes de input intermedio.

## Archivos

- docs/phase-2-3-premium-micro-pass.md
- scripts/premium-micro-after.json
- scripts/premium-micro-before.json
- scripts/validate-premium-micro-runtime.cjs
- scripts/validate-premium-practicals.cjs
- scripts/verify-premium-micro-frozen.cjs
- src/world/nightGarden/GardenAirLeaves.ts
- src/world/nightGarden/GardenGroundLeaves.ts
- src/world/nightGarden/GardenLanternMaterials.ts
- src/world/nightGarden/GardenLanterns.ts
- src/world/nightGarden/GardenMoonReceiver.ts
- src/world/nightGarden/GardenPracticalBounce.ts
- src/world/nightGarden/PracticalLightPalette.ts
- src/world/nightGarden/PremiumPracticalEnergy.ts
- scripts/premium-micro-reveal.json

## Commits de implementación y pruebas

- 21aa23f fix: soften lunar wash only on horizontal garden gravel
- 557fb8e feat: enrich honey paper cores while retaining softer ivory edges
- 1823924 fix: balance foreground lantern paper against its existing shadowed pool
- 45b19df feat: lift bounded mansion frame warmth and entrance response
- 586055d feat: lift blue leaf reflectance without changing density or motion
- 3023b09 fix: compose moon receiver filtering with existing practical containment
- d6e8aa5 fix: compensate mansion luminance for the richer amber spectrum
- 5b3e903 test: verify isolated moon response foreground balance and unchanged budgets

El commit que contiene este informe cierra la documentación. HEAD final y estado limpio se reportan tras crearlo.
