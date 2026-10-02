# Validacion individual de los 15 faroles

Delta: media RGB de los 2.500 pixeles receptores mas afectados al apagar solo esa fuente, escala 0–255. No es lux. Umbrales y coordenadas completos en measurements.json.

| ID (index) | Categoria | PointLight | Rebote | Delta receptor BEFORE → FINAL | Pixeles >2/255 FINAL | Camara | Estado |
|---|---|---|---|---:|---:|---|---|
| 01 (0) | path | Si | Si | 68.040 → 70.826 | 416060 | closeup diagonal estandar | PASS |
| 02 (1) | path | No | Si | 8.034 → 44.280 | 102917 | closeup diagonal estandar | PASS |
| 03 (2) | path | No | Si | 7.035 → 41.591 | 120152 | closeup diagonal estandar | PASS |
| 04 (3) | path | Si | Si | 65.010 → 67.714 | 449547 | closeup diagonal estandar | PASS |
| 05 (4) | path | Si | Si | 53.867 → 56.638 | 300703 | closeup diagonal estandar | PASS |
| 06 (5) | perimeter | No | Si | 4.136 → 34.515 | 29793 | closeup diagonal estandar | PASS |
| 07 (6) | perimeter | Si | Si | 66.649 → 66.649 | 470372 | closeup diagonal estandar | PASS |
| 08 (7) | perimeter | No | Si | 3.193 → 28.984 | 12546 | closeup diagonal estandar | PASS |
| 09 (8) | perimeter | No | Si | 0.722 → 7.829 | 18688 | closeup diagonal estandar | PASS |
| 10 (9) | perimeter | Si | Si | 53.976 → 55.964 | 513419 | closeup diagonal estandar | PASS |
| 11 (10) | perimeter | No | Si | 1.153 → 12.292 | 279376 | closeup despejado: offset (-0.8, +1.4), altura 1.1 | PASS |
| 12 (11) | island/accent | Si | Si | 49.632 → 52.108 | 641329 | closeup diagonal estandar | PASS |
| 13 (12) | island/accent | Si | Si | 63.526 → 64.769 | 612921 | closeup diagonal estandar | PASS |
| 14 (13) | island/accent | No | Si | 0.739 → 11.658 | 90587 | closeup diagonal estandar | PASS |
| 15 (14) | island/accent | No | Si | 2.800 → 25.829 | 41777 | closeup diagonal estandar | PASS |
