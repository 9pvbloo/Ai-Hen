# Phase 3K.6.7 — Practical Light Propagation & Warm Environmental Spill

Revisión local final, 2026-10-01. Rama `phase-3k-cinematic-rebuild`. Sin push.

## Recuperación y alcance

HEAD original: `81b5fcc23e09d2bf3c1f7a2b831c3b2683c5e740`.
El único trabajo previo sin commit era el micro-pass aprobado del karesansui;
se preservó en `5515b4c`. Ese commit es la referencia A de esta fase.
La reanudación encontró HEAD `96a1082fe4fb38b3bde99ee6eb3027c79904ad4c`,
sin cambios tracked y con esta carpeta de revisión pendiente de archivar.
No hubo reset, revert, rebase ni sustitución del checkout.

La implementación queda congelada en ese HEAD; la finalización solo agrega evidencia
y documentación. No se inicia otra fase. Véase [auditoría inicial](recovery-audit.txt).

## Arquitectura final

1. `GardenLanternNetwork.ts` describe siete zonas prácticas finitas. `GardenLanterns.ts`
   posiciona esos PointLights con alturas en metros independientes de la escala de las
   linternas. Sus 15 instancias visibles, modelos, materiales y matrices no cambian.
2. `GardenPracticalBounce.ts` añade irradiancia difusa cálida al material receptor ya
   compartido por el terreno y el relieve real. Dos escalas: núcleo corto y caída amplia
   suave. No añade albedo, roughness, cavity ni desplazamiento. Responde a las normales,
   mezcla grava/musgo y visibilidad de la fase. Las piedras, bases y rocas opacas ocluyen
   los fragmentos de terreno que tienen debajo mediante el depth buffer existente.
3. `GardenPracticalContainment.ts` usa los seis tramos de muro aprobados para atenuar
   solo la contribución local de PointLights al otro lado de sus planos. Se compone con
   los shaders existentes de terreno, roca, camino, vegetación y perímetro. No modifica
   el material de mansión o faroles, ni la contribución directional/hemisphere.
4. `NightGarden.ts` conecta los receptores una vez y actualiza solo la visibilidad del
   bounce. No hay muestreo de terreno ni reconstrucción de geometría por frame.
5. `GardenPavilionLighting.ts` conserva las cuatro luces existentes y redirige dos de
   ellas para iluminar el porche, los escalones y el forecourt inmediato.

Los antiguos pools superpuestos se retiran: -1 draw call, -4.320 triángulos,
-1 geometría y -1 programa en el checkpoint desktop. No se crean recursos GPU para
el bounce: los materiales existentes siguen siendo propietarios de sus shaders y de
su disposición. No hay nuevas texturas, sombras dinámicas, bloom ni RectAreaLight.

## Inventario de luces

| Night Garden | Antes | Final |
|---|---:|---:|
| Faroles visibles | 15 | 15 |
| PointLights de faroles | 7 | 7 |
| PointLights de mansión | 2 | 2 |
| SpotLights de mansión | 2 | 2 |
| DirectionalLights lunar/rim | 2 | 2 |
| HemisphereLight | 1 | 1 |
| Total de luces contribuyentes al 60% | 14 | 14 |
| Luces nuevas / sombras nuevas | 0 / 0 | 0 / 0 |

El Scene completo conserva además las tres luces de Moon Gate: un PointLight, un
DirectionalLight y un HemisphereLight a intensidad cero en el checkpoint establecido.
Por eso el inventario de objetos del Scene es 10 PointLights, 2 SpotLights, 3 DirectionalLights
y 2 HemisphereLights; no debe confundirse con las 14 luces contribuyentes de Night Garden.
Inventario runtime completo en [responsive-budget.json](responsive-budget.json).

## Parámetros exactos y sweep

Tres configuraciones `low`, `balanced`, `wide` se probaron con la misma cámara,
variando intensidad, rango, altura, desplazamiento hacia el interior y dirección del hall.
Se eligió `balanced`: `low` dejaba las islas laterales tímidas; `wide` extendía el baño
en grava/escalones y elevaba más la respuesta posterior sin aportar una mejor separación.
No se añadieron SpotLights regionales porque la redistribución existente fue suficiente.
Las configuraciones completas están en [sweep/report.json](sweep/report.json) y la
[comparativa visual](parameter-sweep.jpg). El sweep es luz real, sin halos ni pools.

Todos los PointLights de faroles conservan color `#efb46b`, decay=2 y castShadow=false.
Intensidades de la tabla a visibilidad=1; el fade de la fase sigue multiplicándolas.
Índices de farol de esta tabla son **base cero**. Altura Y respecto de su datum de apoyo.

| Zona | Anchor | X, Z | dx | Y local | Intensidad anterior → final | Rango anterior → final |
|---|---:|---|---:|---:|---:|---:|
| foreground | 0 | -3.05, -14.95 | 0 | 0.70 | 0.620 → 2.8 | 3.35 → 5.2 |
| left-midground | 11 | -5.70, -25.80 | 0 | 0.85 | 0.562 → 4.2 | 3.35 → 6.2 |
| right-midground | 12 | 4.90, -32.80 | 0 | 0.85 | 0.504 → 4.6 | 3.35 → 6.2 |
| mid-path | 3 | -2.05, -33.00 | 0 | 0.70 | 0.446 → 2.8 | 3.35 → 5.2 |
| arrival | 4 | 0.75, -39.15 | 0 | 0.65 | 0.388 → 2.4 | 3.35 → 5.0 |
| left-perimeter | 6 | -11.00, -32.10 | +0.22 | 0.85 | 0.480 → 4.8 | 3.35 → 5.8 |
| right-perimeter | 9 | 12.10, -37.50 | -0.22 | 0.85 | 0.480 → 4.8 | 3.35 → 5.8 |

Las luces que antes seguían anchors 1 y 2 pasan a 11 y 12. Sus posiciones anteriores
eran (-6.45, -20.15) y (-1.25, -27.95). Los faroles visibles en esos cuatro anchors
permanecen donde estaban. Antes la altura de cada luz era 0.68 × escala del farol
(0.2584–0.3944 m); ahora las luces representan zonas y se elevan para alcanzar superficies
adyacentes. La relación espacial con las fuentes se conserva en los closeups.

### Mansión (coordenadas locales de su root aprobado)

| Luz | Posición final | Target final | Intensidad | Rango | Angle / penumbra |
|---|---|---|---:|---:|---|
| inner-threshold Point | 0, 4.35, 1.15 | — | 4.8 | 4.5 | — |
| covered-landing Point | 0, 3.10, 6.15 | — | 6.4 | 6.5 | — |
| hall-spill Spot | 0, 4.8, 4.5 | 0, 0.6, 11 | 20 | 10.5 | 0.90 / 0.85 |
| upper-spill Spot | 0, 8.6, 2.5 | 0, 8.1, 0.1 | 8 | 5 | 1.18 / 0.80 |

Decay=2 y castShadow=false para las cuatro. Inner-threshold y upper-spill no cambian.
Covered-landing pasa de posición (0,3.40,5.45), intensidad 3.4, rango 4.1 a los valores
anteriores. Hall conserva su posición; antes apuntaba a (0,4.2,2.1), con intensidad 12,
rango 6, angle 1.18 y penumbra 0.8. Ahora apunta hacia abajo y hacia el jardín. Los colores
siguen siendo `#d2a06d` para inner, `#bd936a` para landing y `#efb46b` para spots.

### Bounce y halos

El campo usa los 15 anchors existentes. Núcleo: radios 1.2 / 1.0 / 0.85 m para camino /
perímetro / acentos. Bounce: 3.1 / 2.8 / 2.15 m. Coordenadas con anisotropía (0.94,1.06),
smoothstep cuadrático y coeficientes de irradiancia 0.065 core + 0.020 bounce; acentos
al 75%. El máximo entre campos evita sumar zonas solapadas. Color lineal (0.95,0.56,0.27),
respuesta de musgo al 45% de la grava y peso de normal ascendente. Son términos de luz
difusa, **no opacidad de un decal**. Se aplica la misma contención de perímetro.

Los halos originales permanecen pequeños: escala 1.65 × escala de farol, opacidad 0.16
× visibilidad. No se amplían; el halo vende la fuente y la geometría vende la propagación.
El glow de mansión, su geometría y sus uniforms de producción no se retocan.

## A/B/C/D/E

| Estado | Luces prácticas | Bounce / pools | Halos y glow |
|---|---|---|---|
| A | baseline `5515b4c` | pools previos | originales |
| B | finales con contención | desactivados | desactivados |
| C | finales con contención | bounce en terreno/rake real | desactivados |
| D | igual a C | igual a C | originales activados |
| E | final de producción | igual a D | igual a D |

Las superficies emisivas siguen presentes en B: no se apagan las fuentes visibles.
D y E son intencionadamente iguales; no hay ajuste oculto adicional al final.
A→B incluye la retirada de los viejos pools/glow; B→C aísla el bounce y C→D los halos/glow.
El incremento principal aparece ya en B. El bounce añade una transición sutil (por
ejemplo, menos de 1 nivel RGB medio en el recorte de foreground gravel), sin pintar
un disco plano. Las diferencias por capa están en [mediciones](regional-measurements.json).

Las 19 cámaras normales/closeup comparables A/E tienen matrices de posición, quaternion,
proyección y ajustes de renderer idénticos, verificados por el script de medición.
Los estados B/C/D/E comparten la cámara detenida de cada vista. Exposición=1,
NoToneMapping, pixel ratio=1 para estas capturas. La composición y los sistemas congelados
se verifican también por diff contra `5515b4c`. Las cámaras diagnósticas solo existen en
Playwright; no hay UI ni interruptores de revisión en producción.

## Mediciones regionales

Promedios de recortes fijos de las capturas originales. RGB sRGB 0–255; luminancia lineal
Rec.709 después de decodificar sRGB. No son mediciones físicas de lux ni segmentación de
materiales. Coordenadas y recortes anotados en [regions/](regions/) y en el JSON.

| Región | RGB antes | RGB final | Δ luminancia lineal |
|---|---|---|---:|
| foreground gravel | 63.12, 68.85, 72.52 | 87.00, 83.22, 78.42 | +47.62% |
| foreground lantern area | 74.05, 73.89, 72.51 | 105.56, 95.19, 82.56 | +71.26% |
| left moss island | 25.10, 36.18, 33.12 | 42.27, 48.19, 37.08 | +75.71% |
| left rock island | 7.87, 12.62, 12.13 | 31.66, 30.96, 19.20 | +206.02% |
| left wall base | 12.30, 15.96, 15.04 | 30.89, 28.21, 19.61 | +83.73% |
| right moss island | 34.29, 46.01, 44.83 | 63.86, 65.19, 51.70 | +109.43% |
| right rock island | 27.29, 37.94, 37.21 | 34.84, 42.39, 38.66 | +25.52% |
| right wall base | 50.13, 60.44, 59.59 | 56.14, 63.50, 60.61 | +11.73% |
| mid path | 52.03, 64.80, 71.77 | 55.64, 66.57, 72.33 | +6.68% |
| genkan forecourt | 46.37, 59.29, 65.07 | 54.95, 63.40, 66.60 | +15.00% |
| first steps | 25.70, 30.80, 31.56 | 35.54, 36.56, 33.99 | +46.38% |
| dark negative-space control | 6.00, 12.72, 15.93 | 6.00, 12.72, 15.93 | +0.00% |
| cold gravel between sources | 64.59, 75.80, 84.36 | 64.59, 75.80, 84.36 | +0.00% |
| dark eaves control | 25.71, 25.80, 25.52 | 25.05, 25.47, 25.44 | -2.21% |
| left wall rear ground | 22.19, 33.73, 30.04 | 22.00, 33.66, 30.01 | -0.41% |
| right wall rear ground | 25.76, 35.96, 32.62 | 32.05, 39.24, 33.75 | +21.04% |
| right solid wall rear control | 22.91, 34.23, 31.03 | 23.62, 34.61, 31.15 | +2.17% |
| mansion rear | 8.49, 10.64, 11.60 | 8.49, 10.64, 11.60 | -0.03% |

Los controles oscuro y grava fría permanecen exactamente sin aumento en los recortes.
Las mejoras cálidas son locales. La cifra relativa de la roca izquierda parte de una
superficie inicialmente muy oscura; debe leerse junto con el RGB absoluto y la imagen.

## Contención y límites observados

Las vistas exteriores conservan los muros reales y sus aberturas. El recorte amplio
`right wall rear ground` incluye la abertura lateral, con visión directa al farol: su
aumento no es una prueba de luz atravesando un muro. El recorte amplio de control derecho
también incluye parte de esa transición. Se añaden sondas proyectadas desde coordenadas
del mundo detrás de tramos **sólidos**, sin seleccionar los píxeles por su resultado:

- `left-solid-rear`: RGB [23.2528, 35.0992, 31.2432] → [23.0576, 35.0032, 31.1968]; cambio medio firmado -0.1125/255.
- `right-solid-rear`: RGB [67.5488, 78.04, 85.2656] → [67.5488, 78.04, 85.2656]; cambio medio firmado 0.0000/255.

Véanse [sondas](containment-probes.json), [izquierda](left-solid-rear-probe.jpg) y
[derecha](right-solid-rear-probe.jpg). No se observa nuevo baño cálido detrás de esos
tramos. El encuadre trasero de mansión queda prácticamente igual; el spill descendente
no produce una iluminación distante del tejado. Las franjas frías entre fuentes siguen
visibles y el campo de bounce usa máximo, no suma, para evitar acumulación.

Esta contención analítica resuelve los tramos de muro aprobados; no es un sistema de
sombras ni un cálculo general de oclusión. No simula sombras de rocas o vegetación sobre
otras superficies. Existe transmisión por las aberturas reales del perímetro. La
respuesta de las cubiertas de los faroles aumenta al recibir sus luces regionales;
sus materiales no cambian. Las vistas diagnósticas fuera de la cámara aprobada pueden
mostrar límites del fondo y detalles geométricos ya presentes en A.

## Rendimiento confirmado

| Formato / 60% | Draw calls | Triángulos | Texturas | Point / Spot / contribuyentes | FPS observado antes → final | p95 ms antes → final |
|---|---:|---:|---:|---|---:|---:|
| desktop | 61 → 60 | 236346 → 232026 | 25 → 25 | 9 / 2 / 14 → 9 / 2 / 14 | 74.99 → 74.98 | 13.60 → 13.60 |
| tablet | 60 → 59 | 200984 → 196664 | 25 → 25 | 9 / 2 / 14 → 9 / 2 / 14 | 74.98 → 74.99 | 13.50 → 13.50 |
| portrait | 59 → 58 | 179270 → 174950 | 25 → 25 | 9 / 2 / 14 → 9 / 2 / 14 | 74.98 → 74.98 | 13.50 → 13.40 |

Estas cifras vienen de una ejecución secuencial before/after con 90 intervalos rAF de
animación de producción por formato, después del asentamiento y de descartar 15 frames.
No hay browsers de revisión concurrentes en ese ensayo. Desktop 1440×900, tablet
820×1180, portrait 390×844, Chrome headless local. Datos completos, GPU, percentiles y
todos los intervalos en [responsive-budget.json](responsive-budget.json).

La cadencia estable queda limitada aproximadamente a 75 Hz en este entorno; no demuestra
75 FPS en hardware móvil. Los samples de cambio de viewport/carga inicial no se mezclan
con el steady state. Los benchmarks de render+gl.finish del primer reporte son tiempos
de envío/sincronización aislados y **no** se presentan como FPS visibles. Para comparar
FPS usar el ensayo responsive secuencial anterior, no dividir 1000 por esos tiempos.

## Validación final

- `npm run build`: OK. Persiste el aviso de Vite sobre chunk mayor de 500 kB;
  bundle final 826.67 kB, gzip 232.20 kB, sin nuevas dependencias.
- `git diff --check`: OK.
- `review-practical-propagation.cjs`: 64 capturas B/C/D/E y normales, sin errores.
- `finish-evidence.cjs`: presupuestos responsive, inventario Scene, sondas y primeros
  escalones A/B/C/D/E, sin errores; solo herramienta dentro del archivo de revisión.
- `measure-practical-propagation.py`: regenerado desde las capturas del código final
  comprometido; comprueba igualdad de cámaras y renderer A/E.
- `verify-night-garden.cjs` con `GARDEN_PHYSICAL_REVIEW=1`: 21 checkpoints con reduced
  motion, 25 frames del recorrido, normales/alturas/contacto, coherencia CPU/GLSL y disposal OK.
- Cero JS errors, shader errors, WebGL errors y context loss en los reportes finales.
  Posiciones, luces, matrices, atributos y uniforms comprobados finitos.
- Sin nueva geometría superpuesta de luz ni z-fighting observado. Hombros del relieve
  enterrados al menos 1.45 mm y las 21 piedras conservan su apoyo; sin objetos flotantes
  nuevos ni clipping nuevo observado en las vistas aprobadas.
- Karesansui: frecuencia, altura 0.02736 m, perfil, cobertura, mineral, cavity y roughness
  base intactos. Mansion: arquitectura, papeles, emisivos, glow y puerta intactos.
  Cámara, renderer, exposición, luces globales, cielo y niebla intactos.

Reportes: [health y capas](after/report.json), [geometría y recorrido](physical-validation.json),
[presupuesto y congelados](responsive-budget.json). El diff de producción contra la
referencia solo contiene los seis archivos permitidos enumerados abajo.

## Archivos y commits

Producción: `GardenLanternNetwork.ts`, `GardenLanterns.ts`, `GardenPracticalBounce.ts`,
`GardenPracticalContainment.ts`, `GardenPavilionLighting.ts`, `NightGarden.ts`, todos en
`src/world/nightGarden/`. Tests: `scripts/review-practical-propagation.cjs`,
`scripts/review-practical-validation.cjs`, `scripts/measure-practical-propagation.py`,
`scripts/verify-night-garden.cjs`. Evidencia: esta carpeta; [índice exacto](file-manifest.json).

- `5515b4c`: preserva el micro-pass previo aprobado, baseline de esta fase.
- `f347a33`: feat: rebalance practical garden propagation with contained terrain bounce.
- `ea7f937`: feat: direct existing mansion spill into the genkan forecourt.
- `96a1082`: test: verify practical light layers regional response and rendering budget.
- El commit que incorpora este README: docs: archive Phase 3K.6.7 practical lighting review.

## Índice visual

- [Antes/final desktop 20/40/60/80/100](normal-comparison.jpg).
- [Tablet y portrait 60/100](responsive-comparison.jpg).
- [Contribución A/B/C/D/E](contribution-ABCDE.jpg).
- [Sweep low/balanced/wide](parameter-sweep.jpg).
- [Closeups y vistas posteriores](closeups-comparison.jpg).
- [Mapa diagnóstico](debug-light-map.png): verde = delta de luces reales ×9;
  magenta = delta de bounce ×24; negro = sin cambio. Son deltas de renders reales,
  amplificados para lectura; no representan luminosidad final ni máscaras pintadas.
- [Primeros escalones A](before/closeup-first-steps-A.png),
  [B](after/closeup-first-steps-B.png), [C](after/closeup-first-steps-C.png),
  [D](after/closeup-first-steps-D.png), [E](after/closeup-first-steps-E.png).
- Originales normales y closeups: [before/](before/), [after/](after/), [sweep/](sweep/).
  Todos son screenshots sin retoque. Las hojas solo redimensionan y organizan imágenes;
  los recortes anotados y el mapa diagnóstico están identificados por separado.

## Aceptación visual

Sí: en las comparativas finales el jardín se lee iluminado por fuentes prácticas cálidas,
con crestas, roca/musgo y llegada más presentes, mientras conserva separaciones frías y
oscuras entre fuentes. La evidencia visual y los controles regionales respaldan esa
lectura; no se infiere solo del resultado de los tests. El forecourt gana presencia
de manera contenida y no ilumina hasta la cámara. Queda listo para aceptación visual
local del usuario, sin push y sin avanzar a otra fase.
