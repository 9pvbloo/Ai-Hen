# Phase 3K.6.8 — Garden Density & Lateral Depth

Local review, 2026-10-02. Baseline: `0933bf02e93bfbb8027be4b92408b837242f0a33`, branch `phase-3k-cinematic-rebuild`. This phase adds supporting vegetation, rocks and moss; it preserves the approved garden, lighting and camera. The continuation resumed the existing implementation without retuning its composition.

## Initial audit and composition

The baseline had four pines, 24 shrubs, 19 rocks and twelve planted terrain banks (five islands and seven perimeter banks). The left hero tree/rock and the mansion-side trees already carried the composition. The right foreground island felt isolated; broad lateral wall intervals and transitions between existing trees lacked intermediate scale and distant silhouettes.

The new arrangement strengthens the right foreground and midground, joins selected tree/perimeter gaps and gives selected walls darker trees behind them. The left gains low support around the established hero composition, not an enlarged replacement hero. The sides deliberately differ. The central karesansui, stepping-stone route, forecourt and genkan remain open; the mansion remains the destination.

Foreground combines low moss, shrubs and companion stones. Midground adds medium niwaki with planted wall transitions. Background uses lower-detail, lower-contrast crowns beyond selected walls. No terrain banks, walls or hero objects were moved. Moss cushions belong to existing planted territories, not new gravel islands.

## Geometry and responsive counts

Two secondary pine forms use detail factors 0.56 and 0.28, different lean/spread and enlarged individual foliage sprays to retain crown coverage. The background form also reduces twig count. Original pine and shrub generation defaults remain byte-identical to the baseline. New shrubs use detail 0.40. Each fixed cluster contains two unequal shrubs, one low eroded companion rock and one scalloped volumetric moss cushion.

| New elements | Desktop | Tablet | Portrait |
| --- | ---: | ---: | ---: |
| Trees | 7 | 5 | 3 |
| Shrubs | 36 | 32 | 26 |
| Rocks | 18 | 16 | 13 |
| Moss cushions / clusters | 18 | 16 | 13 |
| GPU instances (wood and crowns separate) | 68 | 58 | 45 |

Combined old/new totals are 11/9/7 trees, 60/56/50 shrubs and 37/35/32 rocks for desktop/tablet/portrait. The twelve existing planted terrain banks remain unchanged.

| Layer: trees / clusters | Desktop | Tablet | Portrait |
| --- | ---: | ---: | ---: |
| Foreground | 1 / 6 | 1 / 6 | 0 / 5 |
| Midground | 2 / 8 | 2 / 8 | 2 / 6 |
| Background | 4 / 4 | 2 / 2 | 1 / 2 |

Tablet omits the two distant mansion-wing silhouettes and two end clusters. Portrait further omits the foreground pine, left distant silhouette and three supporting clusters. This keeps narrow framing subordinate to the mansion without a large new tree or rock across the route.

Six instanced batches share existing foliage, wood and rock materials. Moss uses one combined geometry and one texture-free material. There are no new textures, dependencies, frame-loop calculations, lights or postprocessing passes. Layout changes regenerate only the authored instances and moss geometry; replaced moss geometry is disposed.

## Contact, visibility and technical validation

- Physical garden verification: 21 checkpoints and 25 walk frames; zero recorded errors.
- All three new layouts pass finite geometry/world/instance matrix checks and exact deterministic regeneration of active transforms and moss positions.
- Minimum sampled distance from new instanced geometry to the route axis: **3.882319775 m**. This measures every fifth geometry vertex, not an exhaustive triangle-to-path collision solver.
- Tree datums are seated 0.06 m below sampled ground; shrub origins 0.045 m below. Companion-rock lowest contact is approximately -0.1400003 to -0.1399997 m. No floating trees, shrubs or rocks were observed.
- Moss follows the existing height sampler; indexed surface vertices stay within -0.026 to +0.106 m of it. Maximum measured cushion height is 0.10364 m. Edges enter the ground rather than forming a coplanar decal.
- Moss remains at least 0.100855 m outside approved gravel and 0.900216 m from lantern anchors. Shrub geometry retains at least 0.434848 m from lantern anchors.
- **15/15 lanterns retain 100% of measured baseline warm luminous chamber pixels** in the fifteen approved diagnostic views. This is a paired ROI pixel test with only the new layer toggled, not a claim that every lantern is simultaneously visible from the normal camera.
- Disposal probe observes seven geometry, six instanced-mesh and one owned moss-material disposal events; zero borrowed-material disposal events. The group is removed from its parent.
- All 25 normal/closeup captures report zero WebGL errors and zero context losses. Browser console/page checks record zero JS/shader errors.
- No visible z-fighting, floating elements, blocked center, accidental mansion collision or ugly new tree/wall penetration was found in the reviewed frames. Mansion/wall intersection acceptance is visual, not a general-purpose mesh collision test.

`npm run build` passes (77 modules). The existing Vite chunk-size advisory remains: JS 837.61 kB / gzip 235.29 kB. `git diff --check` and the staged diff check pass.

## Performance

Normal-camera progress 60%, same local Windows headless Chrome environment. Each run measures 90 animation-frame intervals after discarding 15 warmup intervals. Full samples and camera/light data are in the JSON reports.

| Metric: before → final | Desktop 1440×900 | Tablet 820×1180 | Portrait 390×844 |
| --- | ---: | ---: | ---: |
| Draw calls | 60 → 67 | 59 → 66 | 58 → 63 |
| Triangles | 232026 → 284404 | 196664 → 242387 | 174950 → 206149 |
| Textures | 25 → 25 | 25 → 25 | 25 → 25 |
| Geometries | 50 → 57 | 50 → 57 | 50 → 57 |
| Programs | 25 → 26 | 25 → 26 | 25 → 26 |
| Observed FPS | 74.975 → 74.981 | 74.981 → 74.981 | 74.981 → 74.981 |
| p95 frame interval (ms) | 13.5 → 13.4 | 13.5 → 13.4 | 13.4 → 13.4 |

The roughly 75 Hz frame cadence is capped by this environment. It does not establish unchanged GPU cost or physical-mobile performance. Added triangle costs are 52378 / 45723 / 31199. Portrait culling accounts for its smaller draw-call increase. No physical phone/tablet GPU benchmark was performed.

## Frozen systems

The verification script compares 64 other tracked production/dependency files against the baseline, normalizing line endings, and hashes five original generated pine/shrub geometries. All match. All 25 before/after pairs have exactly equal saved camera position, quaternion, projection and light parameters.

Unchanged: mansion architecture, lighting, emissive/glow and door; camera/path and stepping stones; karesansui geometry, profile and material; lantern network/lighting and practical terrain bounce; global lighting, renderer, exposure, tone mapping, moon, fog and mountains/background. No camera refit, door animation or debug UI/material enters production.

## Evidence index

- [Baseline lateral audit](audit-before.jpg): all ten original closeups.
- [Desktop before/after](desktop-comparison.jpg): 20%, 40%, 60%, 80%, 100%.
- [Tablet before/after](tablet-comparison.jpg): all five checkpoints, including 60% and 100%.
- [Portrait before/after](portrait-comparison.jpg): all five checkpoints, including 60% and 100%.
- [Left lateral comparison](left-comparison.jpg): foreground, midground and perimeter.
- [Right lateral comparison](right-comparison.jpg): foreground, midground and perimeter.
- [Composition closeups](compositions-comparison.jpg): west/east mansion wings, hero rock/moss and hero tree.
- [Depth diagnostic](depth-diagnostic.png): amber foreground, teal midground, blue background, muted green moss; real depth-tested geometry, review-only materials.
- [Before data](before.json), [final data and geometry/lifecycle checks](after.json), [physical verification](physical-validation.json), [lantern ROI audit](lantern-visibility.json), [frozen-system hashes](frozen-systems.json).

Raw unmodified PNG captures remain locally under `logs/phase-3k68/{before,after,physical}` (ignored by Git). The committed comparison sheets resize and label those captures without modifying scene content. Fifteen paired lantern PNGs remain under `logs/phase-3k68/after`.

## Reproduction and changed files

Start Vite on port 5174. With the review environment's Playwright on `NODE_PATH`, run `DENSITY_STAGE=after node scripts/review-garden-density.cjs`; it also invokes `validate-garden-density.cjs`. Run `archive-garden-density.py` with Pillow and NumPy to rebuild sheets and lantern pixel checks. Do not run the before stage against the final implementation: the committed baseline was captured before the production changes.

For the physical suite run `scripts/verify-night-garden.cjs` with `GARDEN_PHYSICAL_REVIEW=1`, `GARDEN_REVIEW_URL=http://127.0.0.1:5174/?debug=1` and `GARDEN_REVIEW_OUTPUT=logs/phase-3k68/physical`. Run `node scripts/verify-garden-density-frozen.cjs`, `npm run build` and `git diff --check` for source/build validation. Review dependencies are external tooling, not application dependencies.

Production files:

- `src/world/nightGarden/GardenDepthComposition.ts`: authored anchors/layers and responsive selection.
- `src/world/nightGarden/GardenLateralDepth.ts`: geometry, placement, batching and lifecycle.
- `src/world/nightGarden/GardenPineGeometry.ts`: optional lower detail preserving original defaults.
- `src/world/nightGarden/GardenVegetation.ts`: borrowed material access.
- `src/world/nightGarden/NightGarden.ts`: construction, layout, visibility and disposal wiring.

Review files: `scripts/review-garden-density.cjs`, `scripts/validate-garden-density.cjs`, `scripts/archive-garden-density.py`, `scripts/verify-garden-density-frozen.cjs`, and this evidence directory. Work is split into an integrated production commit, verification tooling commit and review archive commit. No push.

## Visual judgment and limitations

Yes: the final captures show convincing additional lateral support and layered depth while preserving a calm open karesansui center and a clear route to the mansion. The strongest gain is the right foreground island and midground/perimeter succession; the left hero remains dominant on its side. Background crowns create depth beyond selected wall lines. Tablet and portrait retain the unobstructed mansion and genkan, with no new large mass across their narrow framing.

The change is intentionally strongest in lateral closeups and the earlier 20–40% approach. At 60–100% the density remains subtle as the camera approaches the facade. Moss is restrained in the approved dark lighting; this phase retains the existing stylized foliage and does not claim photoreal equivalence to the reference. Contact and clearance sampling plus visual inspection do not prove all possible views artifact-free. The recorded runtime checks and local desktop timing should not be generalized to every browser/device.
