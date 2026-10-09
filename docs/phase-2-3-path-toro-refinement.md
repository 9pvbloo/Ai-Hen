# Phase 2.3 — refined main-path stone tōrō

Inicio: rama phase-2-3-genkan-interior-architecture, HEAD 68f54491a42bf007c986c0b67ed7296122d0ce24, working tree limpio. Skill threejs aplicada. Alcance: solo los cinco faroles grandes del camino, sin Phase 2.4.

## Diseño

La construcción anterior tenía un pedestal cilíndrico y un bloque superior gruesos, un fuste ancho, pilares de cámara de 0.105, papel como caja sólida, retícula en dos caras y un remate esférico simple. Compartía piedra y papel con los faroles pequeños.

- Fuste: radios superior/inferior 0.14/0.185 → 0.112/0.148, reducción del 20%; moldura inferior y capitel de transición facetado.
- Base: cuatro niveles con taper visual y cantos biselados; contacto estable, menor masa en el pedestal superior. Bloques de ocho esquinas recortadas, bevel de un segmento, sin subdivisiones pesadas.
- Cámara: cuatro paneles delgados de 0.008 alrededor de una cavidad real. Fuente conservada en y local 0.94. Paneles de frente 0.272×0.36 y laterales 0.232×0.36; pilares de piedra 0.105 → 0.072, con biseles y un cabezal más fino.
- Retícula: cuatro caras con marcos de 0.008, separación ordenada y travesaños a distintas alturas. El eje de salida hacia el camino queda libre entre los montantes laterales.
- Techo: alero de menor espesor, borde suavemente levantado, perfil cóncavo y remate tallado con asiento pequeño. Radio máximo de cubierta 0.49 → 0.47 antes de la escala aprobada. Altura total permanece dentro de la envolvente anterior (<1.54).
- Piedra principal: material específico #6a6b63, roughness 0.91 frente a 0.88; relieve mineral 0.010 frente a 0.018. Reutiliza exactamente las texturas procedurales existentes. Los biseles aportan respuesta geométrica real; no se añadió suciedad ni un nuevo shader pesado.
- Papel principal: acabado independiente, misma familia cromática aprobada, relieve 0.004 frente a 0.006 y emisión ×0.94 (1.24 → 1.1656 a presencia completa). Conserva el shoulder de altas luces y la corrección foreground anterior. La nueva construcción reparte la emisión por paneles hundidos y deja leer sus bordes.
- Pool y halos: intensidades, posiciones, alcances, targets, radios/opacidades de halo y configuración de sombras intactos. Se recalcula naturalmente la sombra de la nueva piedra/retícula. Ninguna luz o shadow map nueva.

Anclas, escala de instancias, alturas de colocación y huella conservadora 0.4165 intactas. Toda la nueva geometría cabe en esa huella. La geometría secundaria es idéntica atributo por atributo e índice por índice al HEAD inicial. Los materiales específicos se liberan en el propietario existente; no se añadió un sistema ni un ciclo de vida nuevo.

## Archivos de producción

- Modificado: src/world/nightGarden/GardenLanternGeometry.ts — deriva la familia path al constructor aislado; conserva la secundaria y los tres lotes por familia.
- Modificado: src/world/nightGarden/GardenLanterns.ts — dos materiales específicos para piedra/papel path, mismos lotes y fuentes; disposal explícito.
- Nuevo: src/world/nightGarden/PathToroGeometry.ts — ensamblaje del tōrō principal.
- Nuevo: src/world/nightGarden/PathToroStone.ts — bloque tallado biselado estático.

## Presupuesto BEFORE → AFTER

| Prototipo path | Triángulos antes → después |
|---|---:|
| Piedra | 324 → 1004 |
| Retícula | 144 → 360 |
| Papel | 12 → 48 |
| Total por farol | 480 → 1412 |
| Cinco faroles | 2400 → 7060 (+4660) |

Se mantienen tres lotes path + tres secondary + un halo. Se añaden dos objetos Material, no meshes, geometrías renderizables ni texturas. El número de programas permanece igual al compartir la misma estructura de shader.

La comparación incluye reveal (progreso global 0.73), donde los faroles sí están delante de cámara; comparar solo la llegada ocultaría el coste visible. El estado histórico se sirvió desde git sin cambiar el checkout. La base fresca inicial de llegada se conserva en path-toro-before.json; el recorrido ampliado usa path-toro-review-before.json y path-toro-after.json.

| Layout / pose | Calls antes → después | Triángulos antes → después | Triángulos con refresh de sombras antes → después |
|---|---:|---:|---:|
| desktop/reveal | 87 → 87 | 319532 → 324192 | 586080 → 604180 |
| desktop/garden | 83 → 83 | 316692 → 316692 | 583240 → 596680 |
| desktop/threshold | 70 → 70 | 245300 → 245300 | 511848 → 525288 |
| desktop/interior | 53 → 53 | 110856 → 110856 | 377404 → 390844 |
| tablet/reveal | 84 → 84 | 275041 → 279701 | 541589 → 559689 |
| tablet/garden | 82 → 82 | 273739 → 273739 | 540287 → 553727 |
| tablet/threshold | 64 → 64 | 189486 → 189486 | 456034 → 469474 |
| tablet/interior | 51 → 51 | 106326 → 106326 | 372874 → 386314 |
| portrait/reveal | 81 → 81 | 215829 → 220489 | 482377 → 500477 |
| portrait/garden | 77 → 77 | 235931 → 235931 | 502479 → 515919 |
| portrait/threshold | 66 → 66 | 187165 → 187165 | 453713 → 467153 |
| portrait/interior | 45 → 45 | 97068 → 97068 | 363616 → 377056 |

Con el mismo recorrido ampliado: geometrías 70 → 70, texturas 41 → 41, programas calientes 52 → 52, luces 25 → 25, luces con sombras 4 → 4, casters 37 → 37 y receivers 63 → 63. La primera pose desktop registra 46 programas antes de calentar sombras/interior, también idénticos. Los 70/52 incluyen recursos existentes que no se calentaban al muestrear únicamente la llegada (69/51); no son nuevas asignaciones causadas por el diseño.

El detalle añade 13440 triángulos en una actualización completa de sombras, además de lo visible en pantalla. Los calls de refresh siguen idénticos. Mismos mapas 2048²/1024²/512²/512² y cero sombras PointLight nuevas. La caché de sombras sigue funcionando.

FPS caliente jardín/interior: 75 → 75 en los tres viewports; con hojas animadas, 75. Son muestras cortas de Chrome de escritorio limitadas por RAF, no una certificación de hardware móvil. El número de recursos estable no significa memoria de vértices o coste de rasterización idénticos: aumenta el detalle geométrico indicado.

## Validación ejecutada

- npm run build: PASS. TypeScript + Vite, 124 módulos; JS 893.19 kB / gzip 253.00 kB. Aviso existente de chunk >500 kB.
- git diff --check: PASS.
- verify-path-toro-geometry.cjs: PASS. Atributos e índices válidos/finitos, huella y altura dentro de envolvente, secundaria idéntica, presupuesto de detalle limitado.
- El mismo verificador compara 113 archivos existentes contra el HEAD inicial: cámara, recorrido, timings, ownership, hojas, mansión, moon gate, sky/moon, stepping stones y arquitectura principal intactos. Solo permite modificar los dos módulos existentes de faroles citados.
- validate-premium-practicals.cjs con LIGHTING_TORO_AUDIT=1 y LIGHTING_LEAF_AUDIT=1: PASS en 1440×900, 820×1180 y 390×844. Se ejecutó una primera validación completa y otra con muestreo ampliado reveal.
- compare-path-toro.cjs: PASS; igualdad de calls, geometrías, texturas, programas, inventario de luces/sombras, renderer y poses. Deltas de triángulos coinciden exactamente con las piezas añadidas.
- 20 rayos hacia paneles por layout verifican cuatro caras alrededor de cada fuente; distancia mínima fuente/papel 0.0681 unidades. Materiales path aislados y texturas compartidas verificados.
- Barrido de cámara a lo largo del jardín: separación mínima respecto a las cajas de piedra >1.02 unidades, además de la comprobación de huella respecto al camino.
- Rayos de salida foreground→camino y hall→rellano despejados; frustum lunar, cache de puertas y reutilización de mapas: PASS.
- Forward/reverse, scroll nativo, resize repetido, reduced motion, hidden pause/resume y bfcache: PASS.
- Hojas: cantidades, freeze, fase al resize, colocación y disposal: PASS; sus archivos permanecen idénticos.
- Disposal de fixtures: cada material/geometría/instancia se libera una vez, incluso al llamar dispose dos veces. La sonda de faroles pasa de 25 a 27 recursos por los dos materiales nuevos.
- Limpieza completa: cero geometrías, cero programas, cuatro texturas retenidas iguales al baseline documentado, RAF detenido y ScrollTrigger cerrado.
- Cero errores JS/shader de consola; WebGL getError=0.

Reproducción: Vite en 127.0.0.1:5174, Playwright externo mediante NODE_PATH=C:/Users/PABLO/AppData/Local/Temp/ai-hen-review-tools/node_modules. No se añadieron dependencias al proyecto. Para BEFORE ampliado: LIGHTING_STAGE=before, LIGHTING_TORO_AUDIT=1 y LIGHTING_BASELINE_REF=68f54491a42bf007c986c0b67ed7296122d0ce24.

## Límites y estado

No se generaron ni solicitaron capturas, galerías, contact sheets o vídeos. La construcción, proporciones, rayos, preservación de alcance y rendimiento se comprobaron numéricamente; queda la revisión estética visual del resultado y de la lectura de la retícula a distancia. El papel conserva el material opaco emisivo estilizado aprobado, no transmisión física volumétrica. Las sombras siguen limitadas a la selección y resolución existentes.

No Phase 2.4. No push. No PR.

## Commits de implementación y pruebas, en orden

- cf0620d refactor: isolate main path toro construction from secondary lanterns
- cc149fe feat: carve a lighter stepped toro pedestal with chamfered edges
- 1ac3e2a feat: slim toro shafts twenty percent and articulate their support collars
- 9fd05e6 feat: rebuild path light chambers with recessed panels and slender stone jambs
- 87d37e0 feat: refine toro hip roofs with thinner lifted eaves
- dd0a348 feat: finish path toro crowns with restrained carved jewel finials
- 2714b5b feat: add fine four-sided panel joinery around recessed toro cores
- 5ad4bea feat: tune carved path stone with softer mineral grain and matte response
- 8e8c572 feat: balance inset path paper against unchanged amber sources and pools
- b613024 test: verify refined toro cavities scope disposal and responsive geometry budgets

El commit que contiene este informe cierra la documentación. El HEAD final y working tree limpio se verifican después de crearlo.
