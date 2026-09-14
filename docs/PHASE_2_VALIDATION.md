# Phase 2 — Moon Gate implementation and validation

Implemented locally on `phase-2-moon-gate` for visual review. No commit, push, pull request,
deployment, or Phase 3 work was performed.

## Architecture

- `World` remains a coordinator for `Shanshui` and `MoonGate`.
- `MoonGate` owns phase state, visibility, responsive placement, restrained lighting, camera approach,
  and disposal coordination.
- `MoonGateGeometry` creates the procedural wall, grounded circular passage, stone reveal, real wall
  thickness, and rear haze. It contains no scroll behavior.
- `MoonGateMaterials` owns two shared lit materials, the rear-haze material, and one 128 × 128
  generated plaster-variation texture.
- `MoonGateConfig` centralizes geometry, materials, lighting, layouts, ranges, and motion values.
- The existing `Experience` RAF and `ScrollDirector` remain the only animation and scroll systems.

## Geometry and scene depth

The wall and reveal use `ExtrudeGeometry` with 32 radial segments. The concealed main wall retains a
5.5-world-unit outer radius and low ink-covered joins. A second, overlapping pair of small plaster
shoulders shares the existing texture and wall depth; it restores a local garden-wall read at the left
and right of the opening without rebuilding a broad front plate. The shoulders have no new asset or
draw call, and their short lower overlap is absorbed into the foreground/mist rather than reading as
two supports. The circular contour keeps its broad, softly curved passage, wall depth remains 1.35 world
units, and the shallow stone reveal still extends 0.12 units beyond each face.

The main plaster wall renders at 2.5, below the existing mid-mountain layer (3); rear/front mist,
near mountains, and foreground ink remain later in the explicit stack. A restrained textured shoulder
underlay renders at 3.1, behind front mist, near mountains, foreground ink, and the stone reveal (3.6).
Both plaster surfaces keep depth testing but do not write depth, allowing the painted landscape to lose
their joins naturally. The interior haze (3.2) and stone reveal retain their established local read;
stone begins writing depth only once substantially recognized, preserving tunnel and rear-edge depth.

## Materials and lighting

The wall uses rough, non-metallic `MeshStandardMaterial` in readable cool charcoal plaster. The reveal
and tunnel sides share a slightly lighter rough stone material. A deterministic 128 × 128
`CanvasTexture` combines broad, medium, and fine smooth value noise in a low-contrast 211–230 range at
0.12 repeat, removing the prior regular/banded read without an external texture, GLB, shader, or
marketplace asset. The plaster fades slightly behind the stone circle during emergence, then reaches
full opacity by recognition.

One restrained hemisphere light, one cool directional moonlight, and one low-intensity light behind the
opening reveal form without shadows, bloom, post-processing, or a visible light source. All intensities
rise with recognition rather than pulsing or idling.

## Narrative ranges and camera

- Painting: `0.00–0.18`
- Awakening: `0.18–0.48`
- Living landscape settles: `0.48–0.68`
- Moon Gate emergence: `0.58–0.74`
- Recognized: `0.74–0.82`
- Approach: `0.82–0.92`
- Threshold: `0.92–1.00`

The Moon Gate remains stationary. Camera movement is Z-only and begins in Approach. Maximum
additional approach is 5.4 world units on desktop, 3.8 on tablet, and 2.15 in portrait. At the tested
desktop endpoint, camera Z is 18.25 and the front face remains approximately 22 world units away, so
the camera does not cross the gate.

## Responsive and reduced motion

Desktop, tablet, and portrait have separate gate position, scale, depth, and approach values. Scaling
is uniform in every profile, so the circular opening cannot become an oval. Tall-layout wall masses
extend below the frame, avoiding an exposed lower geometry edge.

Reduced motion consumes raw progress, limits Moon Gate camera approach to 12%, inherits the existing
6% Shanshui parallax scale, stops mist clocks, and keeps the existing render-on-demand behavior.

## Debug and lifecycle

`?debug=1` now adds Moon Gate state, gate progress, visibility, camera approach, and responsive layout.
Normal URLs contain neither Phase 2 study labels nor debug UI. Geometry, three materials, and the generated texture are
disposed explicitly; lights and their target are removed with the root group. Repeated Vite hot
reloads did not accumulate draw calls, textures, panels, or RAF activity.

## Performance and validation

Observed at the local desktop preview after all Shanshui textures loaded:

- 11 draw calls
- 1,820 triangles (from 1,752 before this correction; localized shoulder underlay)
- 8 renderer-reported textures
- DPR cap remains 2
- no shadows, shadow maps, post-processing, external models, or additional dependencies

`npm run build` passes with strict TypeScript. The existing Vite chunk-size warning remains; the
generated JavaScript is approximately 698.5 kB / 193.4 kB gzip. `git diff --check` passes.

Live checks covered normal and debug URLs, Hidden / Emerging / Recognized / Approach / Threshold states,
forward and reverse scroll, desktop, tablet (820 × 1180), portrait (390 × 844), resize/reload, stable
circular proportions, Shanshui occlusion, and browser console warnings/errors. No normal-runtime warning
or error was reported.

The visual result remains subject to the requested artistic review. The procedural material is
intentionally subtler than authored scanned plaster, and browser checks used local Chromium rather
than physical mobile hardware, Safari, or Firefox.

## Phase 2 acceptance checklist

- [x] Real extruded 3D architecture with a grounded circular opening
- [x] Front face, tunnel thickness, and rear edge are visible
- [x] Restrained Jiangnan-inspired wall without ornamental overbuilding
- [x] Gradual Shanshui overlap; no hard scene cut
- [x] Configurable Hidden / Emerging / Recognized / Approach / Threshold states
- [x] Camera stops before crossing
- [x] Abstract interior only; no Night Garden or Phase 3 content
- [x] Desktop, tablet, and portrait profiles
- [x] Reduced-motion path preserved and extended
- [x] Existing debug mode extended concisely
- [x] One RAF and one native-scroll/ScrollTrigger system
- [x] Explicit GPU resource disposal
- [x] Strict build and normal-runtime console checks pass
- [x] No dependency, lockfile, deployment, commit, push, or PR changes
