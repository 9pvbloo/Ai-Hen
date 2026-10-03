# Phase 3K.6.6 — Karesansui Ground Rewrite & Controlled Color Enrichment

Revisión local, 2026-09-30. Rama `phase-3k-cinematic-rebuild`. Base exacta `27de6bbe80f8e652de8f1cfb1a402c8e8b263835`, inicialmente limpia. No se hizo push.

La mejora principal es física: crestas más altas, perfil mejor muestreado, mayor cobertura y un material mineral más definido. La mejora cromática es deliberadamente contenida y procede exclusivamente del material del suelo. Se conserva la atmósfera nocturna; no se pretende igualar toda la iluminación/composición de la referencia cambiando los sistemas congelados.

Referencias revisadas: `docs/references/phase-3k6-2-garden-cinematic-reference.png` como principal, además de `phase-3k6-garden-reference.png` y `phase-3k6-garden-target.png`. Se utilizó la skill `threejs`.

## Auditoría y decisión

El sistema anterior ya combinaba cintas geométricas y relieve analítico. Sus crestas de 0.017 m, siete muestras transversales, cobertura limitada y mapas suaves producían una lectura débil en cámara general. Se refinó ese sistema sin sustituir la topografía ni mover los elementos apoyados sobre ella.

Se capturó `before/` antes de editar producción, con el harness físico de la fase anterior. `after/` contiene la implementación final y la verificación ampliada. Las pruebas intermedias llevaron a reducir un grano demasiado circular y a estrechar las transiciones excesivamente vacías entre campos.

## Relieve y continuidad

- Altura física máxima: **0.038 m**, antes 0.017 m. Hombros/extremos enterrados 0.006 m; no hay superficies coplanares colocadas sobre la base.
- Nueve muestras transversales frente a siete. Perfil coseno suavizado con `smoothstep(0.18, 1)` elevado a 1.6: cresta redondeada, hombros progresivos y valles separados.
- Frecuencias compartidas CPU/GLSL: `[25, 27, 24, 26]` radianes por coordenada de campo; períodos nominales 0.251/0.233/0.262/0.242 m, modulados por la dirección y deformación de cada campo.
- Variación de presión determinista de baja amplitud en dos escalas: factor 0.91 ±0.09. Evita que todas las crestas tengan exactamente la misma altura, sin animación ni ruido temporal.
- Tres campos direccionales y contornos elípticos de las cinco islas principales. Los pesos no superponen trenes de surcos; los límites de región se suavizan con márgenes más estrechos.
- La respuesta de la zona del genkan conserva el 82% de la presión del campo, frente al 60% anterior.
- Cobertura física desde la entrada del jardín hasta z≈−49; radio respecto al recorrido de 7.2/5.6/4.2 m en desktop/tablet/portrait. Resolución longitudinal 0.34/0.48/0.62 m. La cobertura se desvanece hacia el material analítico fuera de las áreas útiles.
- Se conserva la exclusión de las huellas reales de las stepping stones. Se añade enterrado alrededor de las bases de los faroles, sin moverlos ni alterar sus luces.
- Una sola malla estática indexada con el material compartido. No hay topología dependiente de la cámara ni reconstrucción por frame; el cambio de layout sustituye y libera la geometría.

`GardenRakeProfile.ts` centraliza altura, enterrado, sección y frecuencias. La geometría usa normales físicas y atenúa la perturbación analítica mediante `physicalRake`; el resto del suelo mantiene el perfil analítico y el filtrado por huella de píxel. No se convirtió el jardín en pavimento pétreo.

## Material mineral y color

`GardenGravelMineral.ts` genera granos angulares con posición, orientación, proporción, tamaño y altura variables. La búsqueda de nueve celdas vecinas ocurre al construir los mapas de 256×256, no por fragmento ni por frame. El campo de altura es periódico. Se reutilizan los cuatro mapas existentes de grava: color, altura, normal y roughness.

El material combina muestras a distintas escalas, mapas con mipmaps, microdetalle filtrado por derivadas y variación mineral amplia en coordenadas de mundo. La contribución de color de cada grano se mantiene pequeña para evitar puntos blancos repetitivos. La rugosidad del rastrillado parte de 0.96 y baja hasta aproximadamente 0.81 en las crestas, con límites 0.78–0.98. Metalness permanece en cero.

La cavity difusa aumenta de 0.055 a 0.14; su peso indirecto es 1.25 veces el directo. El tinte mineral varía entre multiplicadores RGB lineales `(0.90,0.98,1.12)` y `(1.08,1.025,0.95)`. Es una variación local del albedo; no hay corrección global, luces nuevas ni emisión añadida al suelo.

Los surcos responden a las luces existentes mediante normales y BRDF. El resultado gana detalle frío y reflejos locales cálidos, pero la extensión de la luz ámbar sigue limitada por la red aprobada. No se alteró esa red para reproducir los grandes baños cálidos de la referencia.

## Sistemas congelados

El diff de producción desde la base contiene solamente cinco archivos:

1. `src/world/nightGarden/GardenRakeProfile.ts` — nuevo contrato de dimensiones.
2. `src/world/nightGarden/GardenRakeRelief.ts` — geometría, cobertura y exclusiones.
3. `src/world/nightGarden/GardenRakeShader.ts` — campos analíticos coordinados.
4. `src/world/nightGarden/GardenGravelMineral.ts` — nuevo generador de micrograno.
5. `src/world/nightGarden/GardenMaterials.ts` — únicamente comportamiento de grava/suelo; materiales de piedras y rocas conservados.

Sin cambios en mansión, puerta, cámara/recorrido, stepping stones, faroles, luces globales, muros, vegetación, rocas, topografía/datum, atmósfera, luna, montañas, fondo, renderer, exposición o tone mapping. Sin nuevas dependencias. El recorte de fachada del close-up de farol es pixel-identical before/after (delta absoluto medio 0).

## Coste medido

Checkpoint 100%, cámara normal, DPR 1:

| Layout | Draw calls antes → después | Triángulos antes → después | Diferencia | Texturas |
| --- | --- | --- | --- | --- |
| Desktop | 61 → 61 | 184702 → 219242 | +34540 / +18.7% | 25 → 25 |
| Tablet | 60 → 60 | 173012 → 190904 | +17892 / +10.3% | 25 → 25 |
| Portrait | 58 → 58 | 165302 → 173254 | +7952 / +4.8% | 25 → 25 |

La malla física aislada pasa de 36708 a 71248 triángulos en desktop, 25020 a 42912 en tablet y 17376 a 25328 en portrait. Su incremento se dedica a sección transversal, cobertura y resolución longitudinal; no hay draw calls, mapas, luces o sombras adicionales. Los checkpoints tempranos pueden incluir más geometría de transición, pero el delta de esta fase es constante por layout.

FPS observados: 75 antes/después en los checkpoints estables y en los tres layouts al 100%. En la ejecución final aparece una muestra de 1 FPS en tablet 20%, inmediatamente después del cambio desde reduced motion; los siguientes checkpoints son 75. El contador acumula intervalos alrededor del cambio de modo: no es evidencia de un rendimiento sostenido de 1 FPS ni debe ocultarse. Son observaciones de Chrome headless local, no un benchmark móvil ni GPU timings.

## Validación

- `npm run build`: PASS, TypeScript + Vite, 73 módulos. JS 823.75 kB / gzip 231.06 kB. Persiste la advertencia de chunk >500 kB.
- `git diff --check` y comprobaciones del staged diff: PASS.
- 21 checkpoints de producción: cinco normales y dos reduced-motion por layout.
- 25 muestras del recorrido desktop 20–100%; cero reconstrucciones de geometría durante ese recorrido.
- Cinco close-ups con y sin malla física; ocho posiciones laterales con ambas variantes; secciones con material plano, sin iluminación ni perturbación de normales.
- Cero errores JS/console/shader/WebGL recopilados; cero context loss en todos los checkpoints y diagnósticos.
- Todos los atributos geométricos y matrices revisados son finitos; normales unitarias orientadas hacia arriba; triángulos con área positiva; bounds válidos; regeneración determinista y dispose comprobado.
- Crestas medidas: máximo 0.037996 m en desktop. Los hombros quedan bajo la superficie triangulada real al menos 0.001404 m. Enterrado mínimo aproximadamente −0.006 m, con tolerancia Float32.
- Separación mínima de vértices elevados respecto a piedras: 0.07499/0.07509/0.07837 m. Respecto a plintos de farol: 0.08128/0.07762/0.07644 m (desktop/tablet/portrait).
- Hay vértices elevados en los cuatro campos de cada layout; en la llegada z<−40 se verifican 2723/1594/816 vértices elevados.
- Invariantes previas de trazado, distancia a muros, asiento de piedras, datum de mansión, vegetación y presupuesto de faroles: PASS. La altura máxima del rastrillado sigue por debajo de la altura mínima comprobada de las superficies superiores de las stepping stones.
- Revisión visual de desktop 20/40/60/80/100, tablet/portrait, close-ups y secuencias: sin nuevo z-fighting visible, clipping evidente o piedras flotantes observado. No se invade la huella del camino.

### Prueba del sistema híbrido

`verify-rake-coherence.cjs` renderiza el campo GLSL a un render target Float32 temporal y lee 128 muestras. Las compara con el campo CPU usado por el generador: error máximo de fase **0.000127744**, error de peso **0.00000170635**. Continuidad del campo de altura mineral en bordes periódicos: error **0**. El render target y el material diagnóstico se liberan al terminar; no forman parte de producción.

La secuencia lateral muestra separación proyectada entre una cresta cercana y la base: antes 19.07–28.98 px, después 32.64–47.32 px. Se siguen crestas cercanas en cada implementación, no el mismo punto exacto, porque cambió el espaciado. La sección sin shader confirma directamente la mayor silueta geométrica. La prueba con malla desactivada conserva el material y permite distinguir ese volumen del sombreado analítico.

### Imagen y saturación

El recorte de primer plano desktop 60% pasa de RGB medio `(57.036,66.050,70.911)` a aproximadamente `(58.616,67.398,72.909)` en la medición inicial final; `measurements.json` contiene los valores regenerados de la última ejecución. La mejora no depende de aumentar masivamente el brillo: el cambio principal es su distribución entre crestas y valles.

Los recortes de grava fría y junto al farol no tienen píxeles near-white (todos los canales >=245). Los máximos permanecen lejos de blanco. Los promedios de recortes cálidos incluyen valles y crestas desplazados: no se interpretan como una medida aislada de saturación de la luz. La fachada permanece idéntica en la cámara diagnóstica.

## Evidencias

Rutas relativas a este directorio:

- `comparison-production.jpg`: before/after desktop 60% y 100%.
- `comparison-closeups.jpg`: directional, radial, stepping stones y farol.
- `comparison-tablet.jpg`, `comparison-portrait.jpg`: layouts estrechos al 100%.
- `comparison-silhouette.jpg`: relieve con material plano, sin trucos de iluminación.
- `comparison-parallax.gif`: desplazamiento lateral before/after; los PNG originales conservan máxima calidad.
- `before/desktop-{20,40,60,80,100}.png` y `after/desktop-{20,40,60,80,100}.png`.
- `before/{tablet,portrait}-{20,40,60,80,100}.png` y equivalentes en `after/`.
- `after/{desktop,tablet,portrait}-reduced-{40,100}.png` y equivalentes baseline.
- `after/closeup-{directional,radial,stone,lantern,extreme-grazing}-{physical,pass-a}.png`. `pass-a` significa malla apagada con el material de esa ejecución, NO el estado BEFORE.
- `after/parallax/{physical,pass-a}-{0..7}.png`, `after/walk/{00..24}.png`; mismas rutas en `before/`.
- `before/report.json`, `after/report.json`: runtime, invariantes, geometría, capturas, parallax y recorrido.
- `measurements.json`: coste before/after, recortes RGB, parallax y coherencia.

Scripts cambiados/añadidos: `scripts/review-physical-karesansui.cjs` (límites compartidos, huellas y regiones), `scripts/verify-rake-coherence.cjs` (nuevo), `scripts/measure-ground-rewrite.py` (nuevo). Se reutiliza `scripts/verify-night-garden.cjs` sin cambios en esta fase.

Reproducción: usar Playwright del runtime de revisión, Vite en `http://localhost:5173`, variables `GARDEN_PHYSICAL_REVIEW=1`, `GARDEN_REVIEW_URL=http://localhost:5173/?debug=1`, `GARDEN_REVIEW_OUTPUT=docs/reviews/phase-3k66/after`, y ejecutar `node scripts/verify-night-garden.cjs`. Después `python scripts/measure-ground-rewrite.py` con Pillow/NumPy disponibles. No se agregaron esas herramientas a las dependencias de la aplicación.

## Limitaciones honestas

La mejora de volumen es más marcada que la cromática. La iluminación global y la escena alrededor del suelo siguen siendo las aprobadas; por ello no se reproduce toda la riqueza lumínica/fotográfica de la referencia. Los granos son mapas de material y normales, no piedras individuales modeladas. Fuera de la cobertura física el relieve vuelve gradualmente a una representación analítica. No se añadieron sombras geométricas dinámicas; la cavity es una aproximación local.

Los close-ups a pocos centímetros del suelo exponen resolución de mapas, facetas y bordes de tarjetas de fondo ya existentes. La revisión cubre las cámaras y recorridos archivados, no todas las posiciones posibles. Las capturas de producción se estabilizan con tolerancia 0.002 de scroll local; los close-ups comparados sí usan coordenadas idénticas. Falta medir en hardware móvil real. La advertencia de tamaño de bundle permanece.

## Commits locales

- `a95b6a2` — feat: rebuild karesansui relief profile and field coverage
- `d73d2ea` — feat: enrich gravel mineral response within the night palette
- Commit de cierre: validación y archivo de Phase 3K.6.6.

Fase implementada y lista para revisión visual local. No se inició cámara ni puerta; no se hizo push.
