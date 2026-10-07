# Phase 2.3 — rock material realism

Baseline: 79c7f45f62d5d1bb78a9878076da3f09364deedb, branch phase-2-3-genkan-interior-architecture; initially clean.

## Audit
GardenRocks supplies unchanged flat/rounded/upright meshes, per-vertex tones and per-instance colors. GardenLateralDepth borrows the same material for companion stones. Neither geometry owner will change.

GardenMaterials creates four 256-square RGBA maps per surface. Rock height used noise at 2.1, 6.4 and 19 cycles/tile; albedo derived mainly from height; roughness used 5.5 cycles/tile. Central differences generate a normal map (strength 1.05), but the rock shader never sampled it or the height map. Only color and roughness uploaded. Color was reduced to luminance; roughness was compressed through 0.92*(0.98+map*0.06-top*0.025). Relief instead used shared GardenSurfaceDetail noise at 4.14/15.66/55.8 world frequencies with amplitude 0.055. Broad top-facing moss used one 2.2-frequency field. Repeat-wrapped maps were not periodic, risking borders.

GardenShadows selects archetype rocks as casters and receivers, companions as receivers. Shared containment/irradiance hooks remain composed; no light, shadow map or ownership edits.

## Direction
Original procedural mineral patches, eroded seams and fine pores, matte local roughness, restrained base dampening and sparse moss. Keep vertex/instance colors as the large-scale hierarchy. Preserve every geometry, transform and light. No external maps or code. Seijaku is a conceptual reference only; its implementation is not being reproduced.
