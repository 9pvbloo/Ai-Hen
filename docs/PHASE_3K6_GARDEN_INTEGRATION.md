# Phase 3K.6 — Garden Integration & Cinematic Finish

Estado: **ready for visual review**. Rama: `phase-3k-cinematic-rebuild`.
Fecha de revisión: 2026-09-28. Base anterior: `4a5dbb3`.

## 1. Diagnóstico anterior

El camino conservaba una curva útil, pero acababa en x=-0.85, z=-40.10,
desplazado respecto a la escalinata de la mansión (eje de llegada x≈2.89).
Tablet mostraba 14 piedras y portrait solo 10: el final del recorrido desaparecía.
Las piedras utilizaban una cota fija, independiente del relieve.

La grava formaba un campo estrecho con una transición muy difusa hacia el césped.
No había surcos ni islas de plantación que relacionaran rocas y vegetación con la
entrada. Los árboles pequeños tenían poca presencia y desaparecían en portrait.
La cámara llegaba a su máxima profundidad antes del final, retrocedía y cambiaba
bruscamente la atención desde el suelo hacia la fachada.

## 2. Referencias y estrategia

Se revisaron `docs/references/phase-3k6-garden-reference.png`,
`docs/references/phase-3k6-garden-target.png`, el storyboard y la visual bible.
Se aplicó la skill `threejs`. No se copiaron assets ni código externos.

Las referencias aportaron principios de composición: vacío mineral frente al
genkan, grava peinada alrededor de masas bajas, agrupaciones asimétricas de roca,
pinos de copas horizontales y una entrada cálida como punto de atención.
La ejecución mantuvo el lenguaje geométrico estilizado del proyecto.

El trabajo se separó en suelo/camino, plantación/rocas, integración responsive y
cámara. No se avanzó a otra fase del proyecto.

## 3. Cambios exactos

- Campo de grava más amplio y continuo, con una frontera compartida entre formatos.
- Cinco islas de musgo con relieve bajo, bordes más definidos y una costura mineral oscura.
- Surcos procedurales paralelos que pasan a contornos alrededor de las islas.
  El filtrado por derivadas atenúa las líneas demasiado pequeñas en pantalla.
- Malla del suelo de 104×140 segmentos para representar mejor esos bordes.
  Se eliminó un desplazamiento de vértices que separaba la malla de su muestreador de alturas.
- Camino de 21 piedras: curva inicial conservada, huellas de aproximadamente
  1.4–1.7 unidades de ancho, variación contenida de orientación y desplazamiento,
  y piedra terminal de 2.25×1.16 en x=2.89, z=-43.35.
- Rotación real de las huellas elípticas y altura tomada del terreno de cada formato.
  El final ahora apunta a la escalinata y permanece visible en todos los layouts.
- Once rocas en cinco grupos, relacionadas con las islas en vez de dispersas.
- Cuatro pinos niwaki activos por formato: tronco curvado, ramas horizontales y
  copas separadas. Ocho masas bajas de arbustos conectan el jardín con la base.
  El acento de bambú anterior deja de aparecer en la composición.
- Ajustes de posición y escala de los dos pinos de llegada para tablet/portrait.
- Corrección del winding de tapas de rocas y vegetación, actualización de límites
  de instancias al cambiar de layout y liberación explícita de buffers de instancias.
- Cámara derivada del eje del camino, avance sin retroceso, desaceleración final,
  elevación gradual de la mirada y dirección sostenida hacia el genkan tras el reveal.
- El modo de movimiento reducido mantiene interpolación sencilla y termina en
  el mismo encuadre final que el recorrido normal.

## 4. Archivos

Archivos de aplicación modificados o añadidos, todos en `src/world/nightGarden/`:

| Archivo | Responsabilidad en esta fase |
| --- | --- |
| `GardenApproach.ts` (nuevo) | Eje de piedras, llegada e islas compartidas |
| `DryGardenComposition.ts` | Campo mineral y borde común |
| `GardenGroundHeight.ts` | Islas y asiento del terreno |
| `GardenGround.ts` | Resolución y transición de superficies |
| `GardenRakeShader.ts` (nuevo) | Surcos originales y filtrado |
| `GardenMaterials.ts` | Integración de surcos y costura mineral |
| `GardenPath.ts` | Huellas, rotación, altura y recorrido completo |
| `GardenRocks.ts` | Composición, tapas y recursos de instancias |
| `GardenVegetation.ts` | Pinos, arbustos, layouts y recursos |
| `NightGarden.ts` | Actualización del camino al cambiar layout |
| `NightGardenConfig.ts` | Cantidades completas de piedras y rocas |
| `NightGardenCameraPath.ts` | Aproximación y atención de cámara |

Validación y entrega: `scripts/verify-night-garden.cjs`, este reporte y
`docs/reviews/phase-3k6/` con `before-desktop.png`, `desktop.png`, `tablet.png`,
`portrait.png`, `checkpoints.jpg` y `validation.json`.

No se modificaron archivos `GardenPavilion*`, arquitectura, paleta de la casa,
iluminación, faroles, background, luna, montañas, Shanshui, renderer ni atmósfera.
La cota de apoyo original de la mansión se verificó numéricamente en los tres layouts.
Las referencias y archivos de skills que ya estaban sin versionar permanecen sin tocar.

## 5. Commits en orden

1. `6c1440c` — `feat: connect raked garden terrain and stepping stones to the genkan`
2. `8078ab3` — `feat: frame the mansion with planted rock islands and niwaki pines`
3. `81fa436` — `fix: preserve mansion support and refine garden silhouettes across viewports`
4. `5594826` — `feat: choreograph a forward garden walk with a steady genkan reveal`
5. Commit de entrega — `test: document and verify phase 3k6 garden integration`

## 6. Validación técnica

- `npm run build`: PASS.
- `npm run build -- --base=/Ai-Hen/`: PASS.
- `git diff --check`: PASS.
- Chrome automatizado: desktop 1440×900, tablet 820×1180 y portrait 390×844, DPR 1.
- 21 checkpoints: 20/40/60/80/100% del jardín en cada formato, más 40/100%
  con `prefers-reduced-motion: reduce`.
- Las capturas esperan a que el progreso real se estabilice; no dependen de una
  pausa fija que pueda terminar antes de la primera compilación de shaders.
- Cero errores de consola JavaScript o shaders durante la validación.
- 6.006 muestras de cámara: avance sin reversión y separación del suelo >1.35 unidades.
  Desvío lateral máximo del eje normal: 0.130 unidades; reducido: 1.012 unidades
  por su interpolación recta simplificada.
- Las 21 piedras permanecen completas en los tres layouts. Las caras superiores
  quedan entre 0.113 y 0.196 unidades sobre el suelo.
- Misma cota original de apoyo de la casa, con tolerancia de 1e-7.
- Llegada: 51/50/48 draw calls y 67.576/67.574/67.508 triángulos para
  desktop/tablet/portrait respectivamente. Son mediciones de este navegador,
  no un benchmark de hardware móvil.

La prueba reproducible requiere Vite y Playwright disponible en el entorno de
revisión: `node scripts/verify-night-garden.cjs`. No se añadió Playwright ni
ninguna dependencia al bundle de la aplicación. `NODE_PATH` puede apuntar al
runtime de herramientas de Codex; la salida por defecto se guarda en
`logs/phase-3k6/verification/`. El informe exacto de esta ejecución está archivado
en [validation.json](reviews/phase-3k6/validation.json).

## 7. Observaciones visuales

Se revisaron los checkpoints del Camera Walk y las llegadas en los tres formatos.
El suelo ahora tiene dirección y jerarquía; las rocas pertenecen a zonas plantadas
y el camino llega a la escalinata. Los pinos enmarcan la residencia conservando
el acceso libre. El genkan permanece como foco tras el reveal, sin el paneo
excesivo detectado y corregido en una primera iteración.

En portrait, el encuadre prioriza entrada y camino y recorta las alas laterales;
no pretende contener toda la fachada panorámica. El último encuadre con movimiento
reducido coincide con el normal.

[Checkpoints](reviews/phase-3k6/checkpoints.jpg) ·
[Desktop](reviews/phase-3k6/desktop.png) ·
[Tablet](reviews/phase-3k6/tablet.png) ·
[Portrait](reviews/phase-3k6/portrait.png) ·
[Antes](reviews/phase-3k6/before-desktop.png)

## 8. Limitaciones remanentes

La vegetación sigue siendo escultórica y de geometría visible; no reproduce el
detalle fotográfico de las referencias. Los surcos son una respuesta de material,
sin desplazar físicamente la grava. La luz y el cielo conservan el aspecto oscuro
de la fase anterior, al estar fuera del alcance autorizado de reconstrucción.

La validación responsive usa viewports de Chrome en escritorio, no dispositivos
físicos ni Safari/iOS. Vite mantiene la advertencia de chunk mayor de 500 kB
(aproximadamente 796 kB minificado, 222 kB gzip). No se abordó la fase de optimización
global ni se desplegó o hizo push.

La entrega queda **ready for visual review**, sin reclamar aprobación visual.
