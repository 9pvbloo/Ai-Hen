# Phase 3K.6.5 — Focused mansion warmth review

Base exacta: `d0806e7ba55279aac065c776a25c3b416014ecd3`, rama `phase-3k-cinematic-rebuild`, árbol inicialmente limpio. Sin reset, revert, descarte ni push.

Único archivo de producción modificado: `src/world/nightGarden/GardenPavilionOccupancy.ts`. Solo cambian tres intensidades y el color emisivo de entrada; todas las asignaciones de paneles y geometrías permanecen iguales.

| Emisión | Antes | Final | Color final |
|---|---:|---:|---|
| Genkan / entrada | 0.55 | **0.78** | `#e6b46b` |
| Centro y planta superior cálida | 0.30 | **0.52** | `#e7a96c` |
| Alas / paneles subordinados | 0.16 | **0.28** | `#ce925b` |

La primera prueba de entrada a 0.84 saturaba parte del canal rojo. Se redujo a 0.78 y se moderó ligeramente el rojo del ámbar, manteniendo el verde/azul y la jerarquía. En los recortes finales de mansión de desktop 20/60/100 no hay canales a 255 ni píxeles blancos con los tres canales >245. Máximos RGB al 60%: 253/210/175; al 100%: 252/208/182. Es un control del framebuffer en estos encuadres, no una prueba HDR exhaustiva.

Visualmente, la entrada es más dorada, el hall y la planta superior destacan más contra la madera oscura y las alas son más legibles. Se mantienen los paneles fríos y atenuados. La diferencia es más clara al 60/100%; la aparición gradual de la escena al 20% conserva el comportamiento aprobado. No se modificaron albedo de madera, luz global o exposición para aumentar el contraste.

## Validación y preservación

- `npm run build`: PASS; bundle 817.20 kB / 229.28 kB gzip. Advertencia preexistente de chunk >500 kB.
- `git diff --check`: PASS.
- Verificador Night Garden: 21 checkpoints BEFORE y AFTER, cero errores JS/shader/WebGL y cero pérdidas de contexto. Se conserva la validación de cámara, soporte, faroles y jerarquía de emisión.
- Draw calls, triángulos y texturas idénticos en los 21 checkpoints. En llegada desktop: **60 calls, 184646 triángulos, 25 texturas**, antes y después. Tablet 59/172956/25; portrait 57/165246/25.
- **Cero luces nuevas**, incluida iluminación de soporte. Se mantienen 7 PointLights de faroles y 2 de mansión, más el PointLight apagado de Moon Gate en el scene graph. Solo parámetros emisivos existentes: sin nuevas operaciones de shader, mapas o geometría. No se realizó perfilado GPU adicional.
- Comparación de archivos de producción contra la base confirma que todos los demás son idénticos: faroles/red, cámara, arquitectura, puerta, terreno/karesansui, vegetación, muros, atmósfera, renderer, exposición, tone mapping, luna y luces globales.

## Evidencia

En `before/` y `after/`: `desktop-20.png`, `desktop-60.png`, `desktop-100.png`, además de los checkpoints normales/reduced adicionales generados por el harness existente. `desktop-comparison.jpg` presenta las tres parejas requeridas. `validation-summary.json` contiene checks de saturación y preservación de coste. `capture-manifest.md` enlaza cada captura y reporte mediante ruta absoluta; `changed-files.txt` enumera exhaustivamente los archivos de esta entrega.

Sin cambios en scripts de revisión. Reproducción: ejecutar el verificador existente contra Vite con `GARDEN_REVIEW_URL` y `GARDEN_REVIEW_OUTPUT`, y Playwright disponible mediante `NODE_PATH` del entorno. Se deja local para revisión visual.
