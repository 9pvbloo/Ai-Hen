# Phase 2.2 — Genkan threshold

Base audited: `8200ce9012fa533837444dbd0b136fccf245109e`; clean branch `phase-2-2-genkan-threshold`. Threejs skill applied. Local only, no PR/push or visual artifacts.

## Architectural audit

`GardenPavilionFacade.createEntry` calls `addPavilionScreen` at local Z −.10: width 4.30, bottom 2.78, height 2.39, four leaves, stile .12, pitch 1.045, paper width .925 / height 2.15 / thickness .045 at Z −.23. Paper centers X −1.5675, −.5225, .5225, 1.5675, Y 3.975. Three shared internal .12-wide stiles and four crossbars (.065 high at Y 3.4731) use the structure material. Outer stiles and horizontal rails remain fixed.

Geometry is BoxGeometry instancing by finish, not independent leaf groups. Paper uses the existing `wallEntry` material (ivory albedo, roughness .94, warm emissive intensity .78 × visibility), with source shaping driven by its instance translation. The glow batch derives four planes from these same paper matrices. Moving only the wood/paper without updating glow would leave false light in the opening.

Mansion transform: X 3.2, Z −53.4, yaw −.035; root Y is sampled ground minus 1.73. The actual door is the local Z −.10 opening, not the root origin. Sill top is 2.78. Five steps reach local Y 2.46, landing 2.58, covered deck 2.72. Existing facade thresholds are at Z 5.75 and 2.66.

Three central opaque blockers must leave the aperture: screen backing at Z −.44; ceremonial slab at −.74; central hall shadow block whose front is −.52. Replace only those with a shallow enclosed dark recess; preserve flanking room blocks.

Approved camera arrival is derived from `NightGardenCameraPath.getArrival()`, intentionally about 12.7 units ahead of the door for portrait framing. Its source and entire 0…1 story range stay frozen. A new physical scroll segment will follow it, with explicit Genkan camera ownership. At close distance a fixed 45° portrait cannot contain the full exterior frame: stop before the inner sill on the covered approach, using aperture framing rather than resizing architecture or changing FOV.

## Completion — 2026-10-04

Recovery found branch `phase-2-2-genkan-threshold` at `9bdcd51dea2dc22fb23e48e6ac4760555acef4e5`, with 13 phase commits, no staged/unstaged tracked edits, and only the untracked numeric review script. All existing commits were preserved. The user had already approved CLOSED, opening timing, motion, reverse, camera extension, endpoint and dark placeholder; these were not redesigned.

New production corrections are limited to two physical details: moving leaf rails now meet their stiles and fit below the existing lintel without the former .02 overlap; the sill transition, recess floor and lower shadow envelope no longer duplicate visible coplanar surfaces. No exterior, lighting, timing or camera-path adjustment was needed during this completion.

## Final ownership and mechanism

- `GenkanDimensions`: frozen local dimensions; `GenkanJoinery`: fixed guide pockets and moving leaf recipes.
- `GenkanDoorSystem`: four logical leaves, 20 timber instances plus four paper instances, two InstancedMesh batches, one owned BoxGeometry. Borrows mansion materials; only the existing material owner disposes them. One cached Matrix4 and typed offset array handle updates; unchanged progress skips GPU uploads. No added assets, textures, timers or autonomous animations.
- `GenkanDoorMotion`: deterministic depth seating followed by smootherstep lateral translation. Paper remains opaque; scale and material visibility are never used to open the door.
- `GardenPavilionGlow`: first four source planes follow their respective paper leaves; all other room sources remain stationary. Existing practical lighting is unchanged.
- `GenkanRecess`: undecorated opaque back, sides, floor and ceiling. Sill/floor top Y=2.78, continuous into the recess. Rear blocker front Z=-3.72 remains deliberately closed; no Phase 2.3 room or exit.
- `GenkanCameraPath`: caches arrival/endpoint on resize, samples into reused vectors. `World` chooses `genkan-threshold` ownership only after the original arrival. Exactly one camera pose writer per update. FOV remains 45°.
- `ScrollDirector`: appended 126svh after the original story; original physical scroll distances and legacy 0–1 progress remain intact. Reduced motion uses raw progress with the existing event-driven renderer.

All coordinates and distances below use scene units. Leaves are ordered left to right in CLOSED:

| Leaf | Max lateral translation | Depth offset |
|---|---:|---:|
| Outer left | -.035 | -.040 |
| Inner left | -1.080 | -.320 |
| Inner right | +1.080 | -.320 |
| Outer right | +.035 | -.040 |

Track separation is .280; minimum stacked leaf-envelope depth gap is .0075. OPEN useful central width is **2.160**. Outermost moving X is ±2.125, leaving .005 to the adjacent surround posts and .010 to the recessed jamb edge. The .035 outer travel is lateral, not the depth offset. Lower guide supports the leaf rails; the upper rails finish at the existing lintel underside, Y=5.13.

## Camera measurements

401 samples of the new segment per layout, with an identical reverse pass. Clearances are camera-center distances to actual unit-box instance surfaces, including moving paper/timber and static mansion structure. The near-plane corner envelope is also smaller than the measured architecture clearance. These are sampled engineering measurements, not a continuous collision solver or a player-body clearance guarantee.

| Viewport | Added path length | Minimum leaf clearance | Minimum structure clearance | Final eye position |
|---|---:|---:|---:|---|
| Desktop 1440×900 | 9.699565 | 3.276590 | .688370 | (3.092450, -1.928809, -50.328399) |
| Tablet 820×1180 | 9.045919 | 3.899618 | .760000 | (3.069579, -1.928809, -49.675201) |
| Portrait 390×844 | 7.117163 | 5.777271 | .760000 | (3.002101, -1.928809, -47.748038) |

Final look target is (3.255989, -2.174809, -54.999020) for all three. The endpoint is on the covered threshold approach, **before the inner shoji sill**, particularly in portrait; it does not enter the placeholder room. Position and target at extension zero match the approved arrival within 1e-12. The original camera source was not modified.

## Validation

- Build and `git diff --check` pass. Vite retains its existing >500 kB chunk advisory: final JS 858.11 kB / gzip 242.18 kB. No dependency changes.
- 101 original-route camera samples per layout match the stored baseline hashes exactly; CLOSED paper instance matrices and material parameters also match exactly.
- Numeric in-memory CLOSED render comparison against the original pavilion: pixels differing by more than 3/255 occupy .0353% desktop, .0894% tablet and .1306% portrait. Mean maximum-channel differences are .00297 / .00681 / .01114 out of 255; isolated edge peaks are 12 / 45 / 37. CLOSED is visually equivalent and user-approved, not pixel-identical after physical joinery extraction. No images were saved.
- 201 door states: no inter-leaf or leaf/static-box volume collisions above 1e-6; paper/glow alignment remains within 1e-6. Explicit CLOSED/25/50/75/OPEN offsets are included in the small temporary numeric report.
- 401 forward/reverse camera states per viewport: exact repeated matrices/poses, finite values, one camera writer, constant FOV, identical reduced-motion poses. Unchanged progress does not upload matrices; paper and timber remain opaque.
- Nine interior-facing rays hit opaque enclosure within 3.2 units. Floor support samples cover the deck/sill/recess center; no missing support or duplicated top planes along the new threshold.
- Native browser scroll forward and backward validates original-story mapping, extension, fully open endpoint and return to CLOSED in all layouts. Actual reduced-motion media switching and event-driven frame settling pass.
- Three resize cycles after GPU warmup retain identical final poses and resource counters. Visibility pause/resume and persisted pagehide/pageshow retain ownership and resources; RAF and ScrollTrigger stop on final disposal.
- Isolated door disposal emits exactly one geometry and two mesh disposals, zero borrowed material disposals, even when called twice. New sampling/update paths allocate no objects per frame by source inspection; this is not a whole-application heap benchmark.
- Zero JavaScript/console shader errors and zero normal-render WebGL errors during the final suite. No new resources accumulate across the tested cycles.

### Lifecycle limitation verified against base

After this suite's full responsive/scroll lifecycle, clearing and disposing the world leaves **0 geometries, 0 programs and 4 registered textures** before renderer disposal. The same sequence with the six affected GPU-owner modules loaded read-only from `git show 8200ce9:…` produces exactly **0 / 0 / 4**, also with zero WebGL errors. Thus the retained texture count is preexisting, not a new Genkan leak. This more extensive sequence differs from the prior phase's fresh-context single-layout count of one. No claim of zero total existing scene leakage is made.

The previously documented cleanup issue after forced context loss/restoration remains outside this phase; see `docs/reviews/phase-2-1-3-night-sky/README.md`. Forced context recovery was not part of this completion's normal lifecycle suite. Hardware mobile FPS/GPU time was not measured; tablet/portrait are desktop Chrome viewports.

## Performance: identical approved arrival

| Layout | Draw calls before → after | Triangles before → after |
|---|---:|---:|
| Desktop | 67 → 68 | 303376 → 303688 |
| Tablet | 66 → 67 | 261359 → 261671 |
| Portrait | 61 → 62 | 224181 → 224493 |

All layouts: geometries **57 → 58**, textures **25 → 25**, programs **27 → 27**. Increment is one draw call and 312 triangles at this matched pose, not a whole-route maximum or FPS prediction. Four animated leaves share batches instead of adding a draw call per component.

## Exact file inventory

Production additions (six):

- `src/world/nightGarden/GenkanCameraPath.ts`
- `src/world/nightGarden/GenkanDimensions.ts`
- `src/world/nightGarden/GenkanDoorMotion.ts`
- `src/world/nightGarden/GenkanDoorSystem.ts`
- `src/world/nightGarden/GenkanJoinery.ts`
- `src/world/nightGarden/GenkanRecess.ts`

Production modifications (nine):

- `index.html`
- `src/core/ScrollDirector.ts`
- `src/styles/main.css`
- `src/world/World.ts`
- `src/world/nightGarden/GardenPavilion.ts`
- `src/world/nightGarden/GardenPavilionArchitecture.ts`
- `src/world/nightGarden/GardenPavilionFacade.ts`
- `src/world/nightGarden/GardenPavilionGlow.ts`
- `src/world/nightGarden/NightGarden.ts`

Supporting additions: this document, `scripts/genkan-baseline.json`, `scripts/review-genkan.cjs`, `scripts/validate-genkan-runtime.cjs`, `scripts/validate-genkan-lifecycle.cjs`. Total phase inventory: 20 files. No captures, videos, galleries, new assets or heavy reports.

## Reproduction and local history

Start Vite on port 5174. Playwright/Chrome are external review tooling, not application dependencies. On this machine set `$env:NODE_PATH="$env:TEMP/ai-hen-review-tools/node_modules"`, then run `node scripts/review-genkan.cjs`. The compact baseline fixture retains original metrics and hashes rather than full pose dumps. Reports go to `%TEMP%/ai-hen-genkan-validation/after.json`.

To reproduce the preexisting retained textures, set `$env:GENKAN_LIFECYCLE_BASELINE='1'` and run the same command; unset it for final validation. It loads original World, NightGarden, GardenPavilion, Architecture, Facade and Glow through browser response interception only. Current scroll plumbing supplies the same lifecycle input sequence; original GPU owners determine the resource result. Output is `lifecycle-baseline.json` in the same temporary directory. No working files are reverted or restored.

Phase history contains 17 atomic commits, including all 13 recovered commits, two physical corrections, regression validation and this completion report. Obtain the exact chronological list with `git log --reverse --oneline 8200ce9..HEAD`. No squash, rebase, PR or push. Phase 2.3 has not started.
