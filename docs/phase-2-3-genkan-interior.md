# Phase 2.3 — Genkan interior architecture

## Starting audit

Local branch `phase-2-3-genkan-interior-architecture`, base `e0d49f23624de90e040496705df2165e2340de6d`. The only initial untracked file was the approved reference, now committed unchanged as documentation. Reference SHA256: `A930E257C6BF029EBBBEC88900DE2B92EE5BE9A8A0A1D5B09C81221FBFFD2530`. Threejs skill applied. No runtime image import, external assets, push or PR.

Reference interpretation: compact mineral entry, dark timber hierarchy, physical step-up and raised timber floor, muted plaster/paper infill, restrained amber architectural sources and a framed future connection. No decorative objects or literal reference dimensions.

All dimensions below are mansion-local. Root is (3.2, sampled ground −1.73, −53.4), yaw −.035, unit scale. Ground sampling gives root Y≈−6.388809 in the validated layouts. Foundation top is 2.355; hall base deck top 2.52 and structural underfloor top 2.70. Existing covered entry deck top 2.72; sill and threshold transition top 2.78. Door center (0,3.975,−.10), outer span 4.30×2.39, useful opening 2.16, fixed rails bound Y2.90…5.05. Tracks and jamb margins remain frozen.

Flanking opaque hall volumes begin at |X|=2.52. Phase 2.2 side shadow strips begin at |X|=2.13 and extend Z−.52…−6.94. Rear residence blocker begins at Z−7.24; rear structural posts are centered at Z−7.35. Central hall beams bottom near Y6.21; hall roof eave is 6.42, upper-storey deck bottom 6.93. Therefore a shell within X±2.13, front Z−.67, rear Z−6.50, ceiling underside Y5.86 stays within the existing envelope. New interior must not cut either side room, roof or rear residence.

Placeholder replacement: retain side shadow strips, foundation shadow, sill transition and a short opaque front collar above the old opening. Remove the old rear wall at Z−3.8, inner side skins, floor and low ceiling; these would obstruct the new room. No second shell inside the old box. The new room closes at Z−6.5 before the rear residence.

Floor plan: lower mineral floor Y2.78 from Z−.67 to the step at −3.80; raised timber platform Y3.10 from −3.80 to −6.50. Step-up .32, solid agarikamachi depth .24. Usable wall-to-wall width 4.26; side posts reduce local clear width. This is a compact entry, not a long corridor or a completed Main Hall.

Phase 2.2 endpoints must be sampled from its existing camera path on resize, never copied from this document. Its approach, source, door choreography and previous physical scroll distances remain unchanged. The new camera crosses the fully open doorway and stops inside the lower Genkan, framing the step/platform and the static future connection.

## Completion and recovery — 2026-10-04

Continuation resumed at `9387e1939d4b633c5fd7d8133ff6a61abab702eb`: 13 phase commits preserved, tracked tree clean, only the numeric review script untracked. Architecture, palette, lights and ownership were already implemented. Completion added regression validation and one necessary camera correction: the former final eye cropped the mineral floor (projected Y=-1.2865, outside the -1…1 viewport). The interior-only endpoint now includes the mineral foreground, step and rear header at fixed 45° FOV. A concealed .08-high support also bridges the step/platform to the existing Y2.70 underfloor. No visible architecture or Phase 2.2 choreography was redesigned.

## Built dimensions and organization

| Quantity | Mansion-local value |
|---|---|
| Envelope | 4.26 wide × 5.83 deep |
| Clear width | 4.14 between plaster skins; 3.84 between side posts |
| Clear central depth to closed rear paper | 5.7525 from Z=-.67 to -6.4225 |
| Lower mineral floor | Y=2.78; 3.01 deep to the step's leading edge |
| Raised timber floor | Y=3.10; .32 above the lower floor |
| Agarikamachi | Solid .32-high × .24-deep timber edge, centered Z=-3.80 |
| Platform behind the edge | 2.58 deep; no room beyond the rear shoji |
| Ceiling | Underside Y=5.86; 3.08 above lower floor / 2.76 above raised floor |
| Primary beams | Underside Y=5.64; 2.86 / 2.54 clearance above the two floor levels |
| Exterior door passage | Frozen 2.16 wide × 2.15 high between fixed rail faces |

Mineral tiles and timber boards have real thickness and recessed continuous backing beneath their joints. The step has a front, top and supported body. Three structural bays connect floor, posts, longitudinal headers and primary ceiling beams; secondary members are deliberately sparse. Warm plaster skins cover the retained side shadow structure. A recessed static shoji pair and heavier portal frame suggest the future residence, without constructing the Main Hall.

Seven shared opaque MeshStandardMaterial finishes: structural timber, trim, timber floor, mineral floor, plaster, paper and shadow. Static boxes share one geometry and seven InstancedMesh batches. Only the interior owner disposes these materials/geometry. Two warm SpotLights are motivated by side paper panels, have finite 3.15-unit ranges and aim inward/downward. No shadows, extra passes, textures, global exposure change or decorative lamps. Geometry controls reveal; lighting is scaled only by the existing garden visibility, with no independent timer or autoplay.

## Camera and scroll

Appended 168svh after the existing 520svh story and 126svh threshold extension. Original physical scroll mappings remain unchanged. Ownership is explicitly `night-garden` → `genkan-threshold` → `genkan-interior`; exactly one pose writer runs per update. Door progress stays 1 throughout interior traversal. Reverse returns to the unchanged threshold endpoint before restoring its closing choreography.

The interior path samples the previous endpoint on resize and reuses vectors per frame. The final eye is 1.62 above the lower floor. It settles .06 lower than the threshold eye over the forward motion, without head bob, to keep both floor and rear frame visible. No floor/step climb is simulated: the camera stops in the lower Genkan, .88 behind the exterior door plane and 2.70 ahead of the step edge. FOV remains 45°. Architecture hashes match across viewports; only framing calculation uses aspect. At these three tested aspects the final framing constraint yields the same endpoint.

| Viewport | Added path length | Minimum static wall/post distance | Minimum ceiling/lintel distance | Minimum door distance |
|---|---:|---:|---:|---:|
| Desktop 1440×900 | 4.053928 | 1.920000 | .635174 | 1.080000 |
| Tablet 820×1180 | 4.707464 | 1.920000 | .637259 | 1.080000 |
| Portrait 390×844 | 6.635697 | 1.920000 | .640994 | 1.080000 |

World-space final eye: **(3.234293, -1.988809, -54.379400)**. Final target: **(3.419755, -2.948809, -59.676154)**. Mansion-local eye: (0,4.40,-.98). Values above are 401-sample point-to-box surface measurements, not a continuous player collision solver. The complete near-plane corner envelope (.127 maximum) fits within the smallest measured clearance.

## Verification and performance

- `npm run build` and `git diff --check` pass. JS bundle 865.21 kB / gzip 244.10 kB; existing >500 kB advisory remains.
- 101 old-story plus 101 threshold poses per layout match pre-change hashes, including door offsets. Interior start position/target match Phase 2.2 within 1e-12.
- 401 new poses per layout: finite transforms, one writer, fully open doors, exact reverse/reduced-motion replay over repeated passes. Projected mineral floor, step and rear-header landmarks remain in the final viewport.
- 605 / 605 / 484 frustum rays from sampled inside poses hit opaque mansion geometry: zero unoccluded sightlines. 112 floor samples per layout find physical support and no duplicate exposed coplanar tops. Nine vertical support stacks connect Y2.70 to the step/platform top without a hidden gap.
- Numeric GPU comparison with original `e0d49f2` pavilion loaded read-only through browser response interception: CLOSED full frames match; at threshold progress .5 and 1, pixels outside the projected entrance rectangle match. All three viewports, zero changed exterior pixels. This does not assert that the intentionally replaced interior matches the placeholder. No images are saved.
- Native scrolling forward/reverse, actual reduced-motion switching, three resize cycles after warmup, visibility pause/resume and persisted pagehide/pageshow pass. No new JS, shader or normal-render WebGL errors.
- Isolated interior double-disposal releases exactly one geometry, seven materials and seven mesh resources once. Whole-world cleanup leaves zero geometries/programs and four registered textures before renderer disposal, matching the Phase 2.2 baseline recorded in `docs/phase-2-2-genkan.md`. No new resource accumulation across tested cycles. New update paths reuse their objects; no claim of a whole-app heap benchmark.

Matched approved garden arrival, before → after:

| Viewport | Draw calls | Triangles |
|---|---:|---:|
| Desktop | 68 → 75 | 303688 → 304816 |
| Tablet | 67 → 74 | 261671 → 262799 |
| Portrait | 62 → 69 | 224493 → 225621 |

Delta: **+7 calls / +1128 triangles** at that matched pose. Textures **25→25**, programs **27→28**, geometries **58→59**, scene lights **17→19**. Seven new materials and one new unique geometry. Final interior poses render 46 / 45 / 42 calls and 102592 / 98318 / 89772 triangles; these are different views, not directly comparable baseline savings. GPU time and physical mobile FPS are not measured.

## Files and reproduction

New production modules under `src/world/nightGarden/`: `GenkanInterior.ts`, `GenkanInteriorDimensions.ts`, `GenkanInteriorMaterials.ts`, `GenkanInteriorBatch.ts`, `GenkanInteriorFloor.ts`, `GenkanInteriorShell.ts`, `GenkanInteriorStructure.ts`, `GenkanInteriorPanels.ts`, `GenkanInteriorLighting.ts`, `GenkanInteriorCameraPath.ts`.

Modified production: `index.html`, `src/styles/main.css`, `src/core/ScrollDirector.ts`, `src/world/World.ts`, `src/world/nightGarden/GardenPavilion.ts`, `src/world/nightGarden/GenkanRecess.ts`, `src/world/nightGarden/NightGarden.ts`. Door dimensions/motion/joinery/glow, previous camera paths, facade, roofs, garden, sky, assets and dependencies remain unchanged.

Supporting additions: this document, unchanged approved reference PNG, and `scripts/review-genkan-interior.cjs`, `scripts/genkan-interior-baseline.json`, `scripts/validate-genkan-interior-runtime.cjs`, `scripts/validate-genkan-interior-lifecycle.cjs`, `scripts/compare-genkan-interior-exterior.cjs`. Total: 24 files.

Run Vite on 5174, set external Playwright tooling through `NODE_PATH`, then `node scripts/review-genkan-interior.cjs`. The small numeric result is written outside Git to `%TEMP%/ai-hen-interior-validation/after.json`; no screenshots, video, galleries or runtime reference assets. The fixture preserves measured pre-change metrics and pose hashes.

Final artistic approval remains the user's manual visual/video review. Numeric visibility and occlusion tests do not certify artistic quality or every possible viewing angle. Existing retained textures and the previously documented forced-context-restoration cleanup limitation are not solved here. No Phase 2.4, Main Hall, hero objects or decoration were added. Work remains local, with no PR or push. Full chronological history: `git log --reverse --oneline e0d49f2..HEAD`.
