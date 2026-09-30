# Phase 3K.6.5 — Lantern Network & Mansion Warmth

Base: `ae4ac571db2c6505baaa109c7b801c8c5a720edf`. Rama `phase-3k-cinematic-rebuild`. Trabajo local, sin push ni alteración de historia. La recuperación solicitada encontró HEAD `7eb240fdee436069fde9338299ea294c1ffefc12`, implementación y tests ya comprometidos, y únicamente evidencia visual nueva sin seguimiento. Se preservó todo y se completó la inspección individual y el archivo documental.

## Resultado y composición

Referencia principal inspeccionada: `docs/references/phase-3k6-2-garden-cinematic-reference.png`. Se conserva el contraste exterior frío / prácticos ámbar y se aproxima la distribución de luz de la referencia sin copiar su escena ni modificar iluminación global.

Red de **5 → 15 faroles**: cinco originales del camino, seis de perímetro (tres por lateral) y cuatro acentos bajos junto a islas. Los faroles periféricos son piezas apoyadas cerca del muro, no luminarias montadas atravesándolo. Comparten geometrías instanciadas, materiales, halos y un batch de pools conformado al terreno. Los pools nuevos tienen radios 0.85 y 0.65, subordinados a los del camino. Se conserva la intensidad original del papel/halo/pool. No hay nuevas texturas, materiales, dependencias ni sombras dinámicas.

Los diez apoyos nuevos toman el mínimo de las cuatro esquinas de su huella y se entierran 0.006 unidades. Se verifican enterrado <0.08, distancia al recorrido >1.6 y separación del muro mayor que el radio de cubierta más 0.16. El farol 8 se separó del muro antes de la captura final. La revisión individual posterior detectó follaje delante del papel del farol 6; su ancla se movió de (−10.9, −25.7) a (−10.1, −26.25), sin mover vegetación. El follaje cercano puede ocluir parcialmente una base desde cámaras diagnósticas: integración natural, sin cambiar las plantas congeladas.

Se mantienen escalas decrecientes y distribución no simétrica. Los focos laterales enriquecen entrada y tramo medio; en portrait y en la llegada avanzada, parte del perímetro queda fuera del encuadre aprobado. No se cambia la cámara para mostrar artificialmente todos los faroles a la vez. No se busca llenar cada zona oscura: se mantiene espacio negativo nocturno. La inspección no muestra grupos desproporcionadamente brillantes ni obstrucciones visibles del camino.

## Mansión y luces reales

Solo se ajustan estados de emisión de paneles existentes y sus acabados compartidos. No cambia la geometría de ningún panel ni la arquitectura, puerta o iluminación real de la mansión.

| Grupo | Color emisivo | Intensidad anterior → final |
|---|---|---:|
| Genkan | `#efb46b` | 0.30 → **0.55** |
| Hall y planta superior cálidos | `#e7a96c` | 0.16 → **0.30** |
| Paneles subordinados / alas | `#ce925b` | 0.10 → **0.16** |

Se conservan paneles fríos y atenuados; no todos los shoji quedan iguales. La entrada es el foco cálido dominante, el cuerpo central es moderado y las alas permanecen subordinadas. Los dos PointLights arquitectónicos existentes mantienen 4.2/1.8 y sus posiciones/rangos originales. No se cambia exposición para conseguir la calidez.

**Inventario completo para evitar ocultar coste:**

- PointLights de faroles: **5 → 7**, los dos nuevos a intensidad 0.48, rango 3.35 y decay 2.
- PointLights de mansión: **2 → 2**, sin cambios.
- PointLights encendidos en Night Garden a la llegada: **7 → 9**.
- PointLights existentes en todo el scene graph: **8 → 10**, incluyendo uno de Moon Gate a intensidad cero.
- Todas las luces del scene graph: **13 → 15**. En llegada tienen intensidad positiva **10 → 12**; se conservan tres luces de Moon Gate con intensidad cero y `visible=true` heredado. No se asume que las luces de intensidad cero tengan coste de shader nulo.

Los dos nuevos PointLights bastan para la lectura local de ambos perímetros; los otros ocho prácticos nuevos son emisivos con soporte de halo/pool. No se añadieron más luces tras la recuperación. El coste de dos luces por fragmento existe aunque los draw calls no aumenten.

## Validación final

- `npm run build`: PASS, 817.20 kB / 229.27 kB gzip; persiste advertencia preexistente de chunk >500 kB.
- `git diff --check`: PASS final. Se corrigió una línea vacía al EOF añadida por PowerShell; sin cambio funcional.
- `verify-night-garden.cjs`: 21 checkpoints BEFORE y 21 AFTER, cinco posiciones normales por layout y dos reduced motion. Cero errores JS/shader/WebGL, cero pérdidas de contexto. Conserva las comprobaciones anteriores de cámara, terreno, soporte de mansión, piedras y pools.
- Nuevos checks: 15 instancias de papel, 7 luces locales, matrices finitas, cuatro esquinas asentadas por nuevo farol, recorrido despejado, separación de muros y orden de intensidad interior.
- `review-lantern-network.cjs`: 15 cámaras diagnósticas individuales, sin modificar cámara/renderer de producción; cero errores o pérdidas de contexto. El inventario real de luces queda en `individual/report.json`.
- Inspección visual de 15 faroles, láminas normal/responsive, halos, pools sobre relieve y entrada. Sin flotación evidente, enterrado excesivo o colisión visible con rocas/muros en las vistas finales. No es una prueba exhaustiva de intersección con cada hoja o triángulo de roca.
- El recorte de mansión en desktop llegada tiene máximos RGB 235/193/182 y 0% de píxeles con los tres canales >245. Es una comprobación de ausencia de saturación blanca del framebuffer en ese encuadre, no una medida HDR ni una garantía fotométrica.

| Llegada DPR 1 | Draw calls antes → después | Triángulos antes → después | Texturas | FPS antes → después |
|---|---:|---:|---:|---:|
| Desktop | 60 → 60 | 179866 → 184646 | 25 → 25 | 75 → 75 |
| Tablet | 59 → 59 | 168176 → 172956 | 25 → 25 | 75 → 75 |
| Portrait | 57 → 57 | 160466 → 165246 | 25 → 25 | 75 → 75 |

Incremento: **4,780 triángulos**, cero draw calls y cero texturas en llegada. FPS observado en Chrome headless local; no se midieron milisegundos GPU ni dispositivos móviles físicos. La reutilización de batches mantiene draw calls, pero las luces adicionales incrementan trabajo de fragmento.

## Sistemas congelados y archivos

Se comparó producción contra la base: solo cambian `GardenLanternNetwork.ts` (nuevo), `GardenLanterns.ts` y `GardenPavilionOccupancy.ts`. Todos los demás archivos de producción son idénticos: relieve físico/analítico, macro terreno, stepping stones, muros, vegetación, rocas, mansión/puerta/arquitectura, iluminación global, luna, montañas, fondo, niebla, atmósfera, renderer, exposición/tone mapping y cámara/path. Las modificaciones de ocupación se limitan a asignaciones de emisión de paneles existentes, autorizadas en esta fase.

Tooling: `scripts/verify-night-garden.cjs` ampliado y `scripts/review-lantern-network.cjs` nuevo. Documentación: este informe y `docs/reviews/phase-3k65/`. El inventario exhaustivo, incluidas todas las imágenes y reportes, está en `docs/reviews/phase-3k65/changed-files.txt`.

Commits de implementación/pruebas:

- `a352a4b feat: layer garden lantern network and warm mansion shoji`
- `7eb240f test: validate lantern seating clearance and warmth hierarchy`
- Corrección del farol lateral y harness individual: `fix: clear lateral lantern foliage and verify every fixture`.
- Archivo documental: `docs: archive Phase 3K.6.5 lighting review`.

## Evidencia y reproducción

Raíz absoluta: `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k65/`.

- `after/desktop-20.png`, `desktop-40.png`, `desktop-60.png`, `desktop-80.png`, `desktop-100.png`.
- `after/tablet-60.png`, `tablet-100.png`; `after/portrait-60.png`, `portrait-100.png`.
- BEFORE correspondientes en `before/`.
- `desktop-comparison.jpg`, `tablet-comparison.jpg`, `portrait-comparison.jpg`.
- `individual/lantern-01.png` hasta `lantern-15.png`, y `lantern-contact-sheet.jpg`.
- `before/report.json`, `after/report.json`, `individual/report.json`, `validation-summary.json`.
- `capture-manifest.md`: enlaces absolutos a cada evidencia.

Contra Vite en `http://127.0.0.1:5174/?debug=1`, ejecutar `node scripts/verify-night-garden.cjs` con `GARDEN_REVIEW_URL` y `GARDEN_REVIEW_OUTPUT`, y `node scripts/review-lantern-network.cjs` con `GARDEN_LANTERN_OUTPUT` si se desea otra ruta. Playwright se aporta mediante `NODE_PATH` del entorno de revisión, sin dependencia nueva del proyecto.

La escena se aprecia más habitada, con contraste frío/cálido preservado y genkan dominante. Se deja LOCAL para aprobación visual. Sin push ni inicio de otra fase.
