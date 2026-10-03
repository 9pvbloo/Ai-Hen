# Phase 3K.6.1 — Japanese Garden Quality Pass

The user approved the local visual checkpoint before this continuation. The continuation preserved all product code exactly as reviewed, strengthened validation, and committed the existing stone, rock, material and moss work. No redesign, camera change, frozen-system change, dependency addition or push.

## Existing Phase 3K.6 commits (complete)

- `6c1440c` — connect raked terrain and stepping stones to the genkan.
- `8078ab3` — planted rock islands and niwaki framing.
- `81fa436` — mansion support and responsive silhouettes.
- `5594826` — forward camera walk and steady genkan reveal.
- `0ff359f` — integration validation and documentation.

## Existing Phase 3K.6.1 commit

- `5814f91` — branching pine trunks, support roots, two procedural pine variants, bark texture and layered alpha-cutout needle sprays. Shared materials, instanced trees and shrubs, explicit resource disposal.

## Commits created in the continuation

- `64aed32` — flatter independent top normals, irregular beveled stepping stones and restrained orientation; updated regression checks including finite geometry and instance counts.
- `b9bcce6` — broken rock profiles, creased normals, restrained inclination and existing burial.
- `719bbc7` — gravel relief/grain, mineral variation and shared surface-gradient helper.
- `da9e390` — small irregular moss boundary lobes.
- Documentation commit: `docs: archive Japanese garden quality validation` (contains this report and captures).

## Scope and observations

The 21-stone alignment and final genkan axis are preserved. Top surfaces are planar with slight authored variation and separate bevel normals. Nominal thickness remains 0.20 world units; terrain and tilt produce exposed-height variation of 0.120–0.195. No additional thickness randomization was introduced after checkpoint approval.

Four pines retain branch gaps and lateral framing. Eight low shrub masses and eleven rocks remain. Raked grooves now affect normal response with derivative-filtered grain; moss boundaries have small lobes without changing the island composition. At portrait arrival, lateral vegetation is cropped by the approved framing while the entrance and path remain visible.

No obvious floating stones, broken foliage, z-fighting, camera intersections or mansion/background regression were observed in the inspected captures. Screenshot inspection is not an exhaustive temporal z-fighting or collision proof. The final visual review remains with the user.

## Validation

- `npm run build`: passed (TypeScript and Vite).
- `git diff --check`: passed; CRLF conversion notices are not whitespace errors.
- `scripts/verify-night-garden.cjs`: passed against local Vite in Chrome.
- 21 captures: desktop 1440×900, tablet 820×1180, portrait 390×844; normal 20/40/60/80/100 and reduced motion 40/100 for each.
- 6,006 camera samples: forward travel, stable look distance, terrain clearance >1.35 normal / >1.45 reduced, route alignment within limits.
- Every layout: 9 checked meshes and 27 active instances (pine wood/foliage counted separately), finite vertex attributes and matrices, valid instance capacities, complete 21-stone draw range.
- Mansion ground support datum unchanged within 1e-7.
- No console/page/shader errors recorded. CPU geometry and matrices contain no NaN/Infinity; GPU pixel values were not instrumented.
- The local server initially required restarting; the subsequent full run passed.
- Existing build-size warning remains: JS 799.59 kB minified / 223.80 kB gzip.

## Performance

| Final checkpoint | Draw calls | Triangles | Textures | Observed FPS |
|---|---:|---:|---:|---:|
| Desktop | 53 | 114702 | 25 | 75 |
| Tablet viewport | 52 | 114700 | 25 | 75 |
| Portrait viewport | 50 | 114634 | 25 | 75 |

Relative to Phase 3K.6 desktop: +2 draw calls, +47,126 triangles (about 70%), +2 textures. Needle geometry is the main additional geometric cost. Generation is deterministic and performed at construction/layout time; no per-frame geometry creation or new dynamic shadows. Measurements are local Chrome at pixel ratio 1, not physical mobile benchmarks. Fragment shader and foliage overdraw costs were not separately profiled.

## References studied

[Kage](https://mengto.github.io/kage/), [Seijaku](https://seijaku.mengto.here.now/) and [Seijaku Study](https://github.com/dvnvlone/seijaku-study) informed silhouette, layering, gravel and stone rhythm only. No external code or assets were copied. Local `docs/references/phase-3k6-garden-reference.png` and `phase-3k6-garden-target.png` were inspected. The installed threejs skill supplied technical guidance.

## Exact Phase 3K.6.1 source/test files

- `C:/Users/PABLO/Documents/ai-hen/scripts/verify-night-garden.cjs`
- `C:/Users/PABLO/Documents/ai-hen/src/world/nightGarden/GardenApproach.ts`
- `C:/Users/PABLO/Documents/ai-hen/src/world/nightGarden/GardenGroundHeight.ts`
- `C:/Users/PABLO/Documents/ai-hen/src/world/nightGarden/GardenMaterials.ts`
- `C:/Users/PABLO/Documents/ai-hen/src/world/nightGarden/GardenPath.ts`
- `C:/Users/PABLO/Documents/ai-hen/src/world/nightGarden/GardenPineGeometry.ts`
- `C:/Users/PABLO/Documents/ai-hen/src/world/nightGarden/GardenRakeShader.ts`
- `C:/Users/PABLO/Documents/ai-hen/src/world/nightGarden/GardenRocks.ts`
- `C:/Users/PABLO/Documents/ai-hen/src/world/nightGarden/GardenSurfaceDetail.ts`
- `C:/Users/PABLO/Documents/ai-hen/src/world/nightGarden/GardenVegetation.ts`
- `C:/Users/PABLO/Documents/ai-hen/src/world/nightGarden/GardenVegetationMaterials.ts`

## Exact review artifact paths

- `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k61/checkpoints.jpg`
- `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k61/comparison.jpg`
- `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k61/desktop-100.png`
- `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k61/desktop-20.png`
- `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k61/desktop-40.png`
- `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k61/desktop-60.png`
- `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k61/desktop-80.png`
- `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k61/desktop-reduced-100.png`
- `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k61/desktop-reduced-40.png`
- `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k61/portrait-100.png`
- `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k61/portrait-20.png`
- `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k61/portrait-40.png`
- `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k61/portrait-60.png`
- `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k61/portrait-80.png`
- `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k61/portrait-reduced-100.png`
- `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k61/portrait-reduced-40.png`
- `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k61/tablet-100.png`
- `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k61/tablet-20.png`
- `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k61/tablet-40.png`
- `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k61/tablet-60.png`
- `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k61/tablet-80.png`
- `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k61/tablet-reduced-100.png`
- `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k61/tablet-reduced-40.png`
- `C:/Users/PABLO/Documents/ai-hen/docs/reviews/phase-3k61/validation.json`
- `C:/Users/PABLO/Documents/ai-hen/docs/PHASE_3K6_1_JAPANESE_GARDEN_QUALITY.md`

## Final Git state

Branch: `phase-3k-cinematic-rebuild`. All scoped source, tests, report and captures are committed. No push performed. After the documentation commit, the branch is 11 commits ahead of its tracked origin (5 Phase 3K.6, 6 Phase 3K.6.1).

Only pre-existing unrelated untracked paths remain: `.agents/`, `docs/references/`, `skills-lock.json`. These were preserved and excluded from the commits. No tracked changes remain.
