# Phase 2.3 — transición artesanal de los faroles grandes

Inicio: 7570817741e59ab9f5c20dee57e3d183f4d69a99, rama phase-2-3-genkan-interior-architecture, working tree limpio. Skill threejs aplicada.

Diagnóstico: el capitel ensanchado y la plataforma mineral inmediatamente bajo la cámara rompen la continuidad con su estructura oscura. Reutilizar ambas piezas en el lote de madera existente, estrechando su transición, conserva la estructura inferior y evita añadir una pieza superpuesta. Mantener cámara, techo, remate, papel e iluminación exactos. Sin Phase 2.4, capturas, vídeos, push ni PR.

Base fresca: scripts/toro-collar-before.json.

## Cambio realizado

Único archivo de producción modificado: src/world/nightGarden/PathToroGeometry.ts. Se reutilizan las dos piezas que formaban el capitel y la plataforma de piedra, trasladándolas al lote de madera oscura ya existente.

El cuello mantiene su asiento en y=0.612, junto al extremo del fuste, y se abre gradualmente hasta un radio de 0.184 en lugar de 0.238. La plataforma se reduce de 0.52×0.055×0.48 a 0.40×0.055×0.36; conserva altura, espesor, biseles y contacto con la cámara en y=0.735. Se obtiene una transición de madera más compacta, sin superponer un adorno ni aumentar el fuste.

Se mantienen exactamente las primeras seis piezas inferiores de piedra, toda la cámara previa, el papel, la cubierta mineral y el remate oscuro. No se modifican las definiciones de materiales, texturas, shaders, fuentes, colores, emisiones, alcances, halos o shadow maps. El material de transición es el mismo #302d25 mate de la cámara, con roughness 0.86 y relieve 0.004.

## Preservación comprobada

verify-toro-collar.cjs compara atributos e índices: base/fuste, cámara, cubierta, remate, papel y faroles secundarios permanecen idénticos. La transición queda acotada entre y=0.612 y 0.735. Comprueba geometría finita, índices, huella, altura y presupuesto. Además contrasta 116 archivos existentes contra el HEAD inicial, permitiendo modificar únicamente PathToroGeometry.ts.

Por prototipo: piedra 516 → 392 triángulos; madera 848 → 972; papel 48 → 48. Total 1412 → 1412, cinco faroles 7060 → 7060. Sin nuevos materiales, geometrías renderizables, texturas ni luces. La topología de las piezas se conserva y solo cambia su perfil/material de lote.

## Métricas BEFORE → AFTER

| Layout / pose | Draw calls | Triángulos |
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

Geometrías 70 → 70, texturas 41 → 41, programas calientes 52 → 52, luces 25 → 25 y luces con sombras 4 → 4. Casters 37 → 37, receivers 63 → 63. También permanecen idénticos calls/triángulos durante shadow refresh y el inventario completo de luces/sombras. Mismo número de materiales.

La comparación incluye la entrada al jardín (progreso 0.73), llegada, umbral e interior. Primer reveal desktop: 46 programas antes de calentar los otros pases, igual en ambos estados. FPS caliente jardín/interior: 75 → 75 en los tres viewports; no representa una prueba en hardware móvil ni una medición precisa de coste GPU.

## Validación final

- npm run build: PASS (TypeScript + Vite, 124 módulos, JS 893.40 kB / gzip 253.07 kB). Aviso previo de chunk >500 kB.
- git diff --check: PASS.
- verify-toro-collar.cjs: PASS, alcance y piezas conservadas verificados contra HEAD inicial.
- compare-toro-collar.cjs: PASS, igualdad exacta de presupuesto en las cuatro poses de cada layout, incluidos pases de sombras, renderer e inventario.
- Harness validate-premium-practicals.cjs: PASS en desktop 1440×900, tablet 820×1180 y portrait 390×844; flags LIGHTING_TORO_AUDIT=1, LIGHTING_HYBRID_AUDIT=1, LIGHTING_LEAF_AUDIT=1, LIGHTING_BUDGET_BASELINE=./toro-collar-before.json.
- Forward/reverse, scroll nativo, resize repetido, reduced motion, hidden pause/resume y bfcache: PASS.
- Camino despejado; barrido de cámara a más de una unidad de la caja de piedra; veinte rayos de paneles por layout verifican fuentes dentro de la cámara luminosa. Fuente/papel mínimo 0.0681 unidades.
- Haz foreground→camino y hall→rellano despejados, frustum lunar, caché y reutilización de mapas: PASS.
- Materiales path aislados, texturas compartidas y acabados secundarios conservados: PASS. Hojas congeladas en reduced motion y fase de resize conservada.
- Lifecycle/disposal: cada recurso de faroles se libera una vez incluso con dispose repetido. Al cerrar mundo: cero geometrías, cero programas y las mismas cuatro texturas retenidas del baseline; RAF y ScrollTrigger detenidos.
- Cero errores nuevos JS/shader de consola; WebGL getError=0.

Reproducción con Vite en 127.0.0.1:5174 y Playwright externo mediante NODE_PATH=C:/Users/PABLO/AppData/Local/Temp/ai-hen-review-tools/node_modules. Sin dependencias añadidas. Baseline medido antes de editar.

## Archivos

- src/world/nightGarden/PathToroGeometry.ts — único cambio de producción.
- scripts/verify-toro-collar.cjs — preservación de alcance y piezas.
- scripts/compare-toro-collar.cjs — comparación de presupuestos.
- scripts/toro-collar-before.json y scripts/toro-collar-after.json — métricas archivadas.
- docs/phase-2-3-toro-collar.md — informe.

## Límites y commits

No se generaron capturas ni vídeos ni se inspeccionaron píxeles. La continuidad estética y la lectura artesanal final quedan pendientes de revisión visual; geometría, fuentes, clearance y preservación se comprobaron numéricamente. Papel y sombras conservan sus aproximaciones aprobadas.

Cuatro commits reales: auditoría, una modificación funcional coherente de la unión, validación y documentación. El cuello y su asiento se tratan juntos para no dividir operaciones inseparables por alcanzar una cantidad artificial.

- 7f478d6 docs: audit stone to timber transition and record collar baseline
- 2ae76db feat: integrate a compact timber collar between stone shaft and luminous cage
- 772d1ff test: verify collar scope and unchanged responsive rendering budgets

El commit de cierre contiene este informe. HEAD final y estado limpio se verifican después de crearlo. No push performed. No PR. Seguimos en Phase 2.3.
