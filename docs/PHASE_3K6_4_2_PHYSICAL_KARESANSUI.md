# Phase 3K.6.4.2 — Physical Karesansui Ridge Pass B

Base local exacta: `fefb91e2291f292790c38c13e1150bf3a5240753`, rama `phase-3k-cinematic-rebuild`. Auditoría inicial: árbol limpio, cuatro commits de Pass A por delante de origin. Se preservaron `d6678c4`, `5b465a1`, `ccc06bd` y `fefb91e`; no reset, checkout, rebase, squash, revert ni push. Se usó la skill instalada `threejs`.

## Arquitectura y parámetros

`GardenRakeRelief` genera cintas CPU indexadas en **una sola Mesh**, compartiendo exactamente la instancia `groundMaterial` y sus mapas. Se genera una vez por layout; un cambio de tamaño dentro del mismo layout no reconstruye las cintas. No tiene método update, animación de vértices, cambio de topología por frame, luces, sombras, texturas o controles de usuario nuevos. Geometría anterior liberada al cambiar layout; geometría y objeto liberados al destruir el sistema. Los materiales/mapas conservan su propietario `GardenMaterials`.

Cada cinta tiene **7 muestras transversales**, en fases −2.2, −1.45, −0.75, 0, 0.75, 1.45 y 2.2. Usa el perfil redondeado de Pass A: `pow(smoothstep(.18, 1, .5+.5*cos(phase)), 1.6)`. La zona superior visible ocupa aproximadamente 39% del período; no es una cresta triangular. Altura nominal máxima **0.017 unidades** sobre `sampleDryGardenGroundWorldY`. La presión, las regiones y el patio reducen la altura efectiva. No se utilizó el techo 0.022.

Espaciado nominal de entrada ≈0.209, medio ≈0.202 y patio ≈0.236 unidades; la deriva varía ligeramente estas cifras. Los anillos conservan la métrica elíptica de Pass A: período 0.196 en el eje menor y separación mayor en el eje largo (hasta aproximadamente 0.26 en la isla más alargada). No se afirma que cada separación euclídea sea exactamente 0.19–0.23. Se priorizó coincidencia con el patrón analítico existente para evitar dos trenes distintos de ondas.

El muestreo longitudinal es 0.46 desktop, 0.58 tablet y 0.68 portrait. Las crestas mantienen su espaciado entre layouts. El perfil solo añade relieve superficial; **GardenGroundHeight no cambia** y todos los objetos conservan su soporte macro.

## Cobertura, campos y recorte

La cámara aprobada avanza aproximadamente de z=−10 a −28, mirando hacia el recorrido y el patio final. La máscara usa distancia al `GARDEN_ROUTE` existente: radio máximo 5.8 desktop, 4.8 tablet y 3.8 portrait, con transición suave de 1.3 unidades. Se desvanece longitudinalmente entre z=−9/−11 y −43.5/−46. Esto concentra geometría en entrada, tramo central y patio visible, sin subdividir el plano de 52×70.

Las cintas direccionales resuelven `phase=2πk` mediante cinco iteraciones CPU y reproducen las tres fases, deriva y pesos regionales de Pass A. Los contornos físicos se generan alrededor de las primeras cuatro islas principales, con radio y perturbación de fase equivalentes al shader. Los pesos direccional/radial no se solapan. Se detienen los anillos antes de cambiar a la isla/banco más cercano; esto corrigió 32 triángulos invertidos detectados durante el desarrollo. El resultado final tiene cero inversiones y cero degeneraciones.

El terreno base actúa como valle. Los hombros convergen hacia él y terminan 0.006 por debajo del sampler macro. La comprobación contra la interpolación real de los triángulos del terreno confirma que incluso el hombro menos enterrado queda bajo la superficie: 0.00193 desktop, 0.00209 tablet y 0.00239 portrait. No se usa polygon offset ni transparencia.

Los contornos de las **21 piedras existentes** se leen de sus vértices de bisel. No se copian ni cambian placements, geometría o material. La altura se atenúa entre 0.035 y 0.19 unidades fuera de cada contorno. Una fila enterrada cierra cada tramo recortado: se corrigieron extremos abiertos observados en el close-up de piedra. La máscara de grava se activa entre 0.30 y 0.65 de distancia hacia dentro del campo mineral; excluye islas, musgo y bancos periféricos. Los grupos de rocas y muros quedan en los territorios excluidos. El test final comprueba que los vértices elevados no invaden grava plantada ni footprints de piedras; la inspección visual complementa ese test, no pretende demostrar intersección cero con cada triángulo de cada roca.

## Material y transición a Pass A

La malla base conserva Pass A íntegro. En cintas se añade el atributo `physicalRake`; la normal macro analítica se multiplica por `1-physicalRake`. La cobertura disminuye cerca del borde de las zonas y de las piedras mientras disminuye la altura física. En cobertura completa, la forma macro procede de las normales de geometría; el micrograno, paleta, mapas, roughness, mineral y cavidad de Pass A se mantienen. Las cintas usan tono macro neutral 0.93, dentro del rango 0.89–0.97 del suelo.

El suelo bajo las cintas sigue siendo el fallback y conserva las porciones de valle. No se elimina el filtrado `fwidth` de Pass A. No hay LOD temporal con umbrales: la transición está construida en el espacio, y no depende de la cámara. El render físico OFF del harness simplemente oculta la única malla; como el suelo no pierde su amplitud analítica, recupera Pass A sin introducir otro material de producción.

## Validación y coste final

`npm run build`: PASS, bundle 816.87 kB / 229.12 kB gzip. Permanece el aviso preexistente de chunk >500 kB. `git diff --check`: PASS.

Verificador final: **21 checkpoints**, incluyendo normal/reduced motion, y **25 posiciones del Camera Walk de producción**. Cero errores JS, shader, WebGL o pérdidas de contexto. Se conserva el mismo ID de geometría durante los 25 puntos. Se mantienen las 6,006 muestras de cámara, soporte de mansión, piedras enterradas, pools, contacto y comprobaciones previas del jardín.

La geometría nueva pasa atributos/matrices finitos, índices y winding ascendente, normales unitarias en triángulos usados, bounds válidos, altura limitada, footprints, hombros enterrados, reconstrucción determinista y liberación de recursos. El harness regenera cada layout y compara todos los atributos/índices exactamente; no añade la geometría de prueba a las capturas finales.

| Llegada, DPR 1 | Triángulos antes → final | Añadidos | Draw calls antes → final | Texturas | FPS observado |
|---|---:|---:|---:|---:|---:|
| Desktop | 143158 → **179866** | 36708 | 59 → **60** | 25 | 75 |
| Tablet | 143156 → **168176** | 25020 | 58 → **59** | 25 | 75 |
| Portrait | 143090 → **160466** | 17376 | 56 → **57** | 25 | 75 |

Las cifras finales incluyen las filas enterradas de cierre. Los 75 FPS son la lectura local del panel en Chrome headless, no una medición de milisegundos GPU ni una prueba en dispositivos móviles físicos. Cero texturas/luces nuevas y cero sombras dinámicas nuevas.

## Evidencia visual y aceptación

Capturas normales: desktop 20/40/60/80/100, tablet 60/100 y portrait 60/100, además de checkpoints adicionales/reduced. Close-ups directional, radial, lantern y stone a 0.24, 0.25, 0.24 y 0.19 sobre terreno, respectivamente. Un diagnóstico extremo adicional está a 0.022; no es la cámara de producción.

El A/B mantiene escena, cámara y luces idénticas y oculta solo la malla física. Se archivaron directional/radial/lantern/stone, así como desktop 40/60. El primer plano muestra hombros geométricos y oclusión de las partes bajas; la mejora no depende únicamente de una franja de albedo o más contraste. El albedo de rake continúa en 0%.

**Parallax:** ocho posiciones laterales, separación 0.055 entre frames, con secuencia física y Pass A. La misma cresta del mundo se desplaza respecto a la escena lejana. Se proyectan también esa cresta y su base macro: su separación pasa de **19.075 a 29.021 píxeles**, usando altura sin exagerar. Esto es evidencia geométrica adicional; mover una cámara sobre una superficie plana también desplaza textura, por lo que el movimiento de imagen por sí solo no se toma como demostración.

**Silueta:** una sección estrecha del terreno real se renderiza con material uniforme sin luz, normal map, cavidad ni color de surcos. El contorno de Pass A sigue únicamente la pendiente macro; con la malla física aparecen crestas sobre ese mismo perfil. Se usan clipping planes solo en el harness, sin desplazar vértices. La lámina recorta la imagen para facilitar lectura; no exagera verticalmente el relieve. Es un diagnóstico aislado de sección, no una afirmación de que toda la línea del horizonte natural de la escena muestre crestas. También se conserva el close-up extremo en la escena completa.

**Camera Walk real:** sí, el primer plano de las zonas cubiertas se lee más físicamente rastrillado; el A/B normal muestra la diferencia con una altura contenida. A media/larga distancia sigue predominando el relieve analítico, intencionalmente. En los frames inspeccionados no se observan saltos grandes de LOD, bandas cruzadas, grietas abiertas o penetración visible de piedras. No se declara ausencia universal de aliasing/crawling en cualquier GPU, DPR o ángulo: son secuencias muestreadas, no una medición temporal exhaustiva.

**Diagnósticos rasantes:** sí, prueban silueta y parallax físicos. La vista extrema puede revelar la discretización longitudinal y la oclusión del primer surco; no se cambió cámara, luz o altura para ocultarlo. Aprobación estética pendiente del usuario.

## Archivos, preservación y commits

Producción: `GardenRakeRelief.ts` (nuevo), `GardenGround.ts` (atributo cero, ninguna modificación de posiciones), `GardenMaterials.ts` (atributo/varying y atenuación macro) y `NightGarden.ts` (construcción, layout, visibilidad y dispose). Tooling: `review-physical-karesansui.cjs` nuevo, integración opcional en `verify-night-garden.cjs`, compatibilidad de ablación anterior en `review-karesansui.cjs`. Este informe y `docs/reviews/phase-3k642/` contienen la evidencia.

Se verificó que **todos los demás archivos de producción son idénticos a la base**. Además, los métodos de materiales de piedras y rocas son idénticos. Mansión/GardenPavilion*, muros, vegetación, rocas, lantern logic, luces, atmósfera, fondo, montañas, renderer, tone mapping, exposición, producción Camera Path, puerta/interior y macro terreno permanecen congelados. Referencias siguen tracked; `.agents/` y `skills-lock.json` siguen ignored.

- `3080053 feat: add physical karesansui hero ribbons with analytical handoff`
- `63f294c test: verify physical rake geometry parallax and camera walk`
- `8ba6dda fix: bury clipped ridge ends beside stepping stones`
- Commit documental: `docs: archive Phase 3K.6.4.2 physical relief review` (SHA en la entrega).

## Capturas y reproducción

Raíz: `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k642/`.

El [manifiesto](reviews/phase-3k642/capture-manifest.md) enlaza todas las capturas finales, frames y animaciones mediante rutas absolutas. Los reportes completos están en `before/report.json` y `after/report.json`; resumen en `validation-summary.json`, congelación en `frozen-audit.json`.

- `normal-desktop.jpg`, `normal-responsive.jpg`: encuadres solicitados.
- `normal-ab.jpg`, `closeups-ab.jpg`: Pass A / Pass A + Physical.
- `parallax-physical.webp`, `parallax-pass-a.webp`, `parallax-filmstrip.jpg`: prueba lateral.
- `silhouette-proof.jpg`: sección uniforme comparada.
- `camera-walk.webp`, `walk-filmstrip.jpg`: recorrido aprobado muestreado.

Ejecutar Vite y después `node scripts/verify-night-garden.cjs` con `GARDEN_PHYSICAL_REVIEW=1`, `GARDEN_REVIEW_URL=http://127.0.0.1:5174/?debug=1`, `GARDEN_REVIEW_OUTPUT` apuntando a un directorio de revisión y Playwright disponible por `NODE_PATH`. No se añade dependencia al proyecto. El hook del renderer se inyecta únicamente en la respuesta HTTP del harness.

Sin push. Sin Phase 3K.6.5.
