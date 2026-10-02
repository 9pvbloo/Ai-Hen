# Phase 3K.6.9 — Cinematic Stone-Path Camera Refit

Local review, 2026-10-02. Baseline `bfdcabaff875c37a32506b7a1857c1c9250fc92e`; branch `phase-3k-cinematic-rebuild`. Recovery found a clean tree, 31 commits ahead of the locally stored origin reference. No remote fetch, reset, checkout, rewrite or push was performed. The approved world remains frozen.

## Review entry point

Open [review.html](review.html) through Vite, or play [movement-comparison.mp4](movement-comparison.mp4). Before is on the left, final on the right. The two 24-second videos use the same 960×600 wide/tablet composition, garden and uniform review scroll input. Production is still entirely scroll-driven; the video driver is review-only.

- [Desktop comparison, 0–100% every 10%](desktop-comparison.jpg)
- [Tablet comparison](tablet-comparison.jpg) / [portrait comparison](portrait-comparison.jpg)
- Arrival 90/95/100%: [desktop](arrival-desktop.jpg), [tablet](arrival-tablet.jpg), [portrait](arrival-portrait.jpg)
- [Top-view route comparison](top-view.png): actual stones, centerline, old/new camera paths, authored controls, independent target path, arrival and clearance markers; inset includes the full inherited handoff.
- [Motion plots](motion-metrics.png), [animation filmstrip](movement-filmstrip.jpg), [handoff filmstrip](handoff-filmstrip.jpg)
- Original recordings: [before](before-walk.webm), [final](after-walk.webm)
- [21-stone audit](stones.csv): index, world x/y/z, rotation and 3D distance to the next center. Y is the actual stone top center, not its buried datum. Rotation follows the frozen placement recipe; centers are extracted from the production mesh and checked against that recipe.
- [Before runtime data](before.json), [final runtime data and tests](after.json), [summary metrics](metrics.json), [frozen-source hashes](frozen-systems.json)
- Per-sample metrics: [desktop](desktop-metrics.csv), [tablet](tablet-metrics.csv), [portrait](portrait-metrics.csv).

Raw production screenshots remain under ignored `logs/phase-3k69/{before,after}`. The archive sheets only resize and label those frames. No generated scene imagery or debug material is used in the shipped app.

## Audit: previous camera and ownership

`World.update` establishes the Shanshui pose, applies Moon Gate, then lets Night Garden blend and own the final camera. Moon Gate's phase is global 0.40–0.68; Night Garden occupies 0.68–1.00. `ScrollDirector` supplies smoothed range progress normally and raw progress under reduced motion, with exponential smoothing rate 10 and settle threshold 0.0001. These systems and ranges are unchanged.

The previous camera had eight position controls with fixed world heights (-3.06 to -2.87). X came from the broad route polyline, not the actual slightly staggered stone centers. Its separate eight-point attention curve increasingly held the mansion bearing. Sampling used Catmull-Rom parameter t, with a global smootherstep but no arc-length mapping. Desktop stopped at z=-28.40, tablet -26.20, portrait -23.50, despite the last stone lying at -43.35. Reduced motion replaced the route with a straight interpolation from different starting controls, potentially cutting the physical bend.

FOV is 45°; near/far are 0.1/100. No other production code changes FOV. Roll is not authored: `lookAt` retains world-up. All these settings remain unchanged.

The available `sampleDryGardenGroundWorldY` is the approved macro terrain source. Physical raked relief is a separate mesh/shader system and is deliberately excluded from camera height. Scale was audited from stone thickness 0.20, stair increments 0.12 and the 2.39-high door. Values in this report are scene units, interpreted consistently with that architectural scale.

## Position, height and pacing

All 21 real stone positions define the route. Each interior control blends its center at weight 0.50 and adjacent centers at 0.25 each; the endpoints remain exact. A leading point at (-4.70, 0, -10.10) joins the inherited entrance to the first stone. There is no independent lateral sway or authored zigzag.

The centripetal `CatmullRomCurve3` uses 2048 arc-length divisions and `getPointAt`. A separate 1025-entry integrated speed table maps local scroll progress to travel distance. Its relative speed keys are:

| Local progress | 0 | 0.08 | 0.22 | 0.43 | 0.63 | 0.80 | 0.94 | 1 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Relative speed | 0 | 0 | 1.35 | 1.65 | 1.05 | 0.50 | 0.16 | 0 |

Quintic smooth transitions between speeds give a soft entry, stronger middle, architectural reading pause and long final deceleration. Integrating and normalizing the table avoids confusing spline parameter spacing with desired speed. There are no timers, autonomous travel or direction-specific state.

Height is a cached macro-ground profile plus **1.62** eye height. The sampler is filtered over 0.9 units longitudinally with weights 1/4, 1/2, 1/4; it never follows stone tops or rake ridges. Measured ground-relative height during ownership is **1.61699–1.62199**. No head bob, oscillation, additional temporal filter or micro motion is added. Reduced motion uses the same safe physical route with the existing raw-scroll behavior.

Final geometric path travel is **32.1764** units (including the garden entrance lead-in). Travel after full ownership at 16% is **31.3396**. The separate inherited desktop handoff travels approximately 30 units from the previous phase's distant camera; it must not be mistaken for eye-level garden walking. Maximum perpendicular distance to the actual stone-center polyline, after reaching the first stone, is **0.10650**.

## Independent attention and handoff

The target curve has its own controls: (-4.95,-3.48,-18), (-3.50,-3.20,-25), (-0.50,-2.80,-35), (2.60,-2.50,-46), then the actual closed-door visual center. It starts with the route/garden, progresses toward the mansion opening and converges on the warm entry. It is never `lookAt(next camera point)`.

The established ownership range **0.02–0.16** remains. Handoff weighting now uses smootherstep, giving zero first and second derivatives at the boundaries. The existing longitudinal blend is retained while lateral and height ownership use its cube: the camera crosses the Moon Gate aperture before moving toward the west-hand stones. This fixes the tablet/portrait near-plane conflict found by the initial corridor test. Bearings are blended around the moving camera rather than interpolating absolute targets from different camera origins, avoiding the resulting temporary yaw/pitch excursion. At 16% the normal position and independent attention curves take full ownership.

During the owned walk, the maximum quaternion angular delta is **0.60794° per 0.5% progress**, maximum yaw delta **0.59918°**, and pitch delta **0.17908°**. Full sampled velocity, acceleration, yaw, pitch and angular deltas, including the faster inherited handoff, are retained in the CSVs and plots. These are derivatives with respect to scroll progress, not claims of a fixed real-time walking speed. The peak owned speed is 61.61 units/progress, equivalent to 2.57 units/second only in the 24-second linear review recording.

## Arrival and Phase 3K.7 contract

The frozen mansion root is (3.2, groundY−1.73, -53.4), rotated -0.035 around Y. The door frame spans 4.72 units; its sill is local (0,2.78,-0.10), its visual center is 1.195 units above the sill. The first stair's front is local (0,1.98,9.30). These are audited architectural datums, not a guessed mansion-center target.

The final stop is derived from the 4.72-wide entry frame plus 3% framing margin at fixed 45° FOV and the reviewed 390/844 portrait aspect. That minimum viewing distance is mapped backward along the same physical curve. All formats share this endpoint, preventing a layout-dependent X/Z jump. The remaining last stones and stair ascent are intentionally reserved for the future advance. The camera stops **before the stairs**, not on the covered landing or inside the building.

| Desktop pose | Position | Look target |
| --- | --- | --- |
| Inherited start, 0% | (0, 0, 18.25) | (0, 0, 6.25) |
| Full ownership, 16% | (-4.69202, -2.95267, -10.93593) | See exact `after.json` |
| Midpoint, 50% | (-2.11884, -3.09485, -29.10376) | (0.94607, -2.65374, -39.70685) |
| Arrival, 100% | (2.63922, -2.94472, -40.81891) | (3.20350, -2.41381, -53.49994) |

`NightGardenCameraPath.getArrival()` exports position, look target, quaternion, threshold, doorway visual center, remaining horizontal distance, eye height, logical progress=1 and globalProgress=1. The final quaternion is approximately (0.020894,-0.022228,0.000465,0.999534). Its small quaternion Z component is the yaw/pitch composition, not an authored camera roll.

Threshold world position: **(3.20350,-3.60881,-53.49994)**. Remaining horizontal distance to the doorway: **12.69357**. First stair front: **(2.87457,-4.40881,-44.10570)**, approximately **3.295** units ahead horizontally. Phase 3K.7 must plan the remaining stones and stair elevation before reaching the recessed door; this phase does not silently walk through those surfaces. Door opening is not implemented.

## Responsive, reversibility and safety

Desktop 1440×900, tablet 820×1180 and portrait 390×844 share X/Z route, pacing, attention and final framing. Only the existing layout-specific macro terrain affects eye Y. Resize tests cycle desktop → tablet → portrait → desktop at 20%, 50%, 85% and 100%; restoring desktop returns the exact original pose. No new layout-dependent lateral path or FOV change exists. The previous phase still owns its original responsive start poses before handoff.

Validation samples **201 poses per layout**, plus **321 dense handoff poses per layout**. It checks finite positions, targets and quaternions; exact deterministic reverse traversal; reduced-motion agreement after ownership; real slow/normal/fast/reverse scroll; and real media-query reduced motion with a stable held pose. Scroll checks record movement and settling, confirm finite poses, no progress overshoot and arrival at the requested range.

The collision diagnostic transforms actual mesh triangles and instances to world space, prunes by bounds and measures closest points. It includes physical trees/foliage, shrubs, rocks, moss, stones, lanterns, walls, mansion and Moon Gate. Foliage alpha cards are conservatively treated as solid triangles. Disabled/distance-faded hybrid cards and light halos are not solid obstacles; close tree-line-card opacity is separately checked. It is not merely a distance-to-object-origin test.

The camera/near-plane volume is enclosed by a sphere of radius **0.12692 / 0.11200 / 0.10992** for desktop/tablet/portrait. Minimum garden distance is **1.51310** to a lantern finial; near-plane margin is at least **1.38618**. Dense handoff minimum distances are **1.51840 / 1.12241 / 0.29825**; portrait is the tightest. Its margin remains positive after subtracting both the near-plane sphere and a full adjacent sample displacement (**0.02125** conservative residual). No physical point/near-plane intersection was detected. The final camera is clear of stairs, posts and canopy.

This is dense geometric sampling with a conservative near-plane envelope, not a universal continuous collision solver. Visual inspection found no clipping through prominent geometry or lantern covering most of the frame. The inherited handoff remains a faster transition from the previous painting phase; eye-level walking begins once Night Garden owns the camera.

## Performance, frozen scope and validation

Only two production files change:

- `src/world/nightGarden/NightGardenCameraPath.ts`: physical route, independent attention, cached macro height, distance pacing and arrival contract.
- `src/world/nightGarden/NightGarden.ts`: camera handoff block only.

`verify-camera-refit-frozen.cjs` compares **67 other tracked production/dependency files** to the baseline and separately verifies that all of `NightGarden.ts` outside its camera block is identical. Mansion/door/luminous presence, lights, lantern network/bounce, stepping stones, karesansui/terrain, rocks/moss/vegetation/density, walls, moon, mountains, atmosphere, renderer, exposure and tone mapping are unchanged. No dependencies or GPU objects are added.

At identical baseline camera poses and progress 20%, 60% and 100%, draw calls and triangles are exactly unchanged in all layouts. At 60%:

| Same-pose metric, before → final | Desktop | Tablet | Portrait |
| --- | ---: | ---: | ---: |
| Draw calls | 67 → 67 | 66 → 66 | 63 → 63 |
| Triangles | 284404 → 284404 | 242387 → 242387 | 206149 → 206149 |
| Textures | 25 → 25 | 25 → 25 | 25 → 25 |
| Geometries | 57 → 57 | 57 → 57 | 57 → 57 |
| Programs | 26 → 26 | 26 → 26 | 26 → 26 |

Actual new-camera visibility can reduce portrait draw counts through normal frustum culling: 60% is 60 calls/204547 triangles; 100% is 59/203073. Desktop and tablet retain their baseline counts at these checkpoints. This is visibility, not a change to scene complexity.

The path caches arc lengths, heights and pacing; sample calls reuse vectors and allocate no application objects per frame. A warmed 20000-call local microbenchmark is recorded as `cpuUs` per layout in `after.json` (sub-microsecond on this host). This is not a frame-rate guarantee or a physical mobile CPU measurement. Layout changes precompute heights rather than querying ground every frame.

Build (`tsc && vite build`), diff-check, frozen-source checks and runtime assertions pass. Zero recorded JS/shader/WebGL errors or context losses. The pre-existing Vite advisory for a bundle over 500 kB remains. No near/far adjustment was needed.

## Reproduction

Start Vite on 127.0.0.1:5174. Review tooling uses the externally supplied Playwright Chrome runtime via `NODE_PATH`; it is not an app dependency. Run `CAMERA_STAGE=after node scripts/review-camera-refit.cjs`; it invokes `validate-camera-refit.cjs`, captures the checkpoints and records the canvas. `CAMERA_VALIDATE_ONLY=1` runs just the diagnostic suite into a separate report. Do not run `CAMERA_STAGE=before` against final production: the committed baseline was captured before edits.

Run `scripts/archive-camera-refit.py` with the review runtime's NumPy/Pillow to generate CSVs, diagrams and sheets. The MP4 comparison is made with FFmpeg: resample both recordings to 24 fps, scale each to 640×400, stack horizontally and encode H.264. Filmstrips decode the actual recordings at 1 fps (comparison) and 3 fps (first four seconds of handoff). Scripts never ship diagnostic geometry, materials or UI in production.

## Visual acceptance and limits

The decoded animation sequence, checkpoints and measured path support the intended result: the camera progresses along the actual bend with stone/lantern/rock parallax instead of stopping halfway through the garden. Attention gradually shifts from nearby stones to the architecture and warm entrance. The long deceleration prepares a stable exterior arrival; reverse traversal returns identical poses.

Portrait deliberately transitions from a broader reveal to an entry-focused frame; it cannot show the entire mansion facade at close eye-level distance with the frozen 45° FOV. The final closed entry frame remains visible. No claim is made that this forecourt pose is already on the covered landing. The future door phase still needs the short remaining route and stair ascent. No physical mobile-device benchmark was performed. The viewport-specific geometry tests cover the reviewed layouts rather than every possible aspect ratio.

All work remains local for visual review. No door animation, interior traversal, art changes or push.
