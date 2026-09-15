# Phase 3 — Crossing / Night Garden validation

Local implementation only on `phase-3-night-garden`. No commit, push, pull request, deployment,
new dependency, second RAF, or second ScrollDirector was created.

## Architecture implemented

- `World` now coordinates the existing `Shanshui` and `MoonGate` systems with `NightGarden`.
- `NightGarden` is an orchestration layer only. Ground, path, pond, rocks, vegetation, mist,
  lighting, and distant atmospheric depth each own their resources and explicit disposal.
- Repeated rock and distant-silhouette geometry is rendered through `InstancedMesh`; the path,
  bamboo stalks, and bamboo leaves are also instanced.
- The existing single `Experience` RAF, visibility pause/resume handling, `ScrollDirector`, and
  responsive lifecycle remain the only runtime systems.

## Scroll and camera states

Phase 3 occupies normalized global scroll `0.68–1.00`, immediately after the Moon Gate threshold.
The Phase 3-local states are explicit and reported in `?debug=1`:

| Local range | State | Implemented behavior |
| --- | --- | --- |
| `0.00–0.15` | COMMIT | Garden begins behind the still-dominant gate; Z crossing begins. |
| `0.15–0.35` | PASSAGE | Camera traverses the real extruded opening with centered clearance. |
| `0.35–0.55` | REVEAL | Camera is beyond the rear edge; pond, stones, terrain, and framing read. |
| `0.55–0.80` | ARRIVAL | Z travel decelerates and the camera settles into the garden composition. |
| `0.80–1.00` | NIGHT GARDEN ESTABLISHED | Minimal final adjustment; a small distant roof/body silhouette remains a destination cue only. |

The camera receives the existing Phase 2 pose, then applies one monotonic, mostly-Z crossing offset.
Desktop travels 34 world units after the threshold; tablet 29; portrait 25. There is no scene swap,
fade, teleport, FOV change, or rotation/roll. The gate's 1.35-unit extrusion and centered X/Y
approach leave the camera inside the circular clearance during PASSAGE. Reversing the same scroll
range uses the same deterministic pose mapping.

## Garden and transition strategy

- Ground is a lightly perturbed plane that supports the pond edge, damp path, rocks, and planting.
- The path is a single instanced irregular-stone composition, directed toward the distant hint.
- The pond uses one isolated, lightweight shader: dark depth tint, low-frequency displacement,
  Fresnel/ice-silver response, and no reflection render pass.
- Scholar rocks, bamboo, one restrained willow card, sparse low-mass planting, low mist, cool local
  moonlight, and low-contrast distant silhouettes establish physical depth.
- The Pavilion boundary is held: the only architecture beyond the garden is a small dark box/roof
  silhouette with a barely warm distant accent. There is no interior, detailed roof, close-up, or
  interaction.
- Shanshui does not disappear at one threshold. The crossing physically moves past its depth-separated
  planes; gradual late opacity reduction merely lets mist and depth finish the handoff.

## Responsive and motion behavior

- Desktop uses the broadest pond, 15 path stones, 30 bamboo stalks, 7 rock instances, and 3 mist
  layers.
- Tablet uses 12 path stones, 22 bamboo stalks, 6 rocks, 2 mist layers, and a tighter pond.
- Portrait uses 9 path stones, 15 bamboo stalks, 4 rocks, 1 mist layer, a smaller pond, simplified
  distant massing, and a stronger central path hierarchy.
- Local browser checks were run at requested `820 × 1180` and `390 × 844` viewport overrides. The
  debug panel reported the tablet and portrait profiles respectively.
- Existing reduced-motion behavior continues to consume raw scroll and render on demand. Phase 3
  reduces crossing travel to 86%, stops vegetation sway and mist drift, and limits pond motion to 8%.
  The full garden composition remains present without ambient animation.

## Measurements and checks

Phase 2 baseline from its approved validation: 11 draw calls, 1,820 triangles, 8 textures.

Measured on the local Chromium preview at the desktop Phase 3 endpoint (requested `1280 × 900`,
debug-reported CSS viewport `1405 × 1000`, DPR `0.90`):

- 25 draw calls
- 4,312 triangles
- 8 textures

This is below the preferred 30-call / 25k–40k triangle Phase 3 desktop target. A local tablet
endpoint check reported 27 calls, 5,340 triangles, and 8 textures; the portrait endpoint reported
27 calls, 4,590 triangles, and 8 textures. No shadow maps, post-processing, external models,
reflection target, or new packages were used.

- `npm run build`: passed (`tsc` and Vite build).
- `git diff --check`: passed.
- Debug checks reached `COMMIT`, `PASSAGE`, and `NIGHT GARDEN ESTABLISHED`; intermediate state
  boundaries are deterministic local ranges listed above and exposed in the debug panel.
- Forward/reverse pose mapping, resize profiles, one RAF/ScrollDirector ownership, and module
  disposal were inspected in the local implementation.
- Browser console: no warnings or errors were reported in the final local preview.
- Existing visibility lifecycle is retained; the local browser session was not a physical mobile
  device and did not expose an OS reduced-motion toggle or background-tab automation hook.

## Known limitations

- The garden is intentionally procedural and stylized; rocks, willow, and distant forms are
  silhouette-first rather than authored scanned/GLB assets.
- Final art direction still benefits from visual review on physical mobile Safari/Firefox hardware,
  including OS reduced-motion and hidden-tab resume checks.
- The generated Vite bundle retains the pre-existing >500 kB chunk-size warning; no Phase 3-specific
  build failure results from it.

## Hybrid Pass A

This focused pass adds only the first authored 2.5D card: `distant-tree-line.png`. The Moon Gate,
crossing path, Phase 3 ranges, Shanshui handoff, and the other five Night Garden cutout assets were
not changed.

### Asset verification

- `public/night-garden/distant-tree-line.png` is `2172 × 724`, `Format32bppArgb`, and has an alpha
  range of `0–254`.
- 1,130,080 of 1,572,528 pixels (71.86%) are fully transparent. Non-transparent artwork is bounded
  to `x: 18–2155`, `y: 103–723`, leaving a substantial transparent surround.
- The source was visually inspected against a dark background. It has no white matte or black
  rectangular backing; its soft cool edge is retained through low-opacity alpha-tested rendering.
  The source image was not modified.

### Hybrid architecture and integration

- `HybridArtLayer` owns authored-card loading, per-profile placement, progress timing, diagnostics,
  and texture cleanup. Its map caches `Promise<Texture>` values by Vite base-path URL, so a source is
  requested once and future cards can reuse the same texture object. Color artwork is marked
  `SRGBColorSpace`.
- `HybridCard` owns one plane/material pair and deterministically multiplies authored base opacity,
  scroll-progress opacity, and smoothstep camera-distance opacity. It creates no RAF, tween, or
  independent state transition.
- The distant tree line is a real vertical world plane behind the path, pond, rocks, and vegetation
  at Z `-43` desktop, Z `-42` tablet, and Z `-39` portrait—between the physical garden and existing
  shanshui ridge depth. Alpha test `0.035`, disabled depth writing, dark jade/silver tint, low final
  opacity, and foreground mist/geometry prevent a rectangular-card read.
- The weak repeated procedural distant-tree row in `GardenBackground` was removed. Existing ridge
  geometry, moon, Pavilion hint, and physical garden systems remain.

### Timing, fade, and responsive checks

- The tree line stays absent through COMMIT/PASSAGE, begins smoothly at local progress `0.22`, and
  reaches its atmospheric target by `0.82`. At desktop established state it measured `0.180` opacity.
  Reverse scrolling back before Phase 3 measured `0.000`, with no visibility pop or black frame.
- The reusable camera-distance fade is a symmetric smoothstep: cards retain authored opacity beyond
  24 world units, begin fading inside 24, and reach zero at 10. The desktop card measured 27.27 world
  units away at the established endpoint, so it stays at its intended atmospheric value while future
  near cards can safely clear the camera.
- Browser checks confirmed desktop profile at local `1405 × 1000`, tablet at `894 × 1311` after a
  requested `820 × 1180` override, and portrait at `416 × 937` after a requested `390 × 844`
  override. The local browser applies a display scale to requested sizes; debug reported desktop,
  tablet, and portrait hybrid profiles respectively. Portrait uses the intentionally narrower,
  lower-contrast tree-line layout.

### Measurements and validation

- Before Pass A: approximately 25 draw calls, 19,754 triangles, 8 textures (existing desktop
  endpoint baseline). After Pass A desktop endpoint: 27 draw calls, 20,636 triangles, 9 textures.
  The authored art adds one PNG texture and remains below the hybrid 30–35 draw-call target.
- `npm run build`: passed (`tsc` and Vite build). Vite continues to report only the pre-existing
  >500 kB chunk-size advisory.
- `git diff --check`: passed.
- Local normal and `?debug=1` routes loaded. A fresh local browser session reported no console
  warnings or errors. The debug panel exposes hybrid profile, tree-line opacity, and camera distance.
- Forward endpoint, reverse return to pre-Phase-3 state, and the approved threshold/crossing were
  visually checked. No crossing timing/path modification, rectangular card boundary, alpha matte,
  or reverse black frame was observed.

### Remaining limitation

Only `distant-tree-line.png` is integrated in this architectural proof pass. Willow, bamboo, reeds,
jade foliage, and scholar-rock cutouts remain intentionally deferred to Hybrid Pass B/C. Physical
mobile-browser and OS reduced-motion verification remain future hardware checks.

## Crossing-fix pass

This focused local pass changed only crossing safety and transitional geometry. It did not add
dependencies, textures, render passes, RAFs, ScrollDirectors, or garden-detail work.

### Ground strip

**Cause:** the original 52 × 56 ground plane was centered at Z `-28`, placing its straight near edge
at approximately Z `0`, directly inside the lower Moon Gate view during COMMIT/PASSAGE.

**Fix:** the ground is now 52 × 50, centered at Z `-36`, placing the entrance edge behind the gate
at approximately Z `-11`. The nearest two geometry rows also receive a deterministic irregular inset,
so the entrance contour cannot form a horizontal strip.

### Rectangular atmospheric card

**Cause:** visual inspection identified the distant 58 × 22 background plane as the large rectangular
form visible through the opening. Its flat blue-grey presentation made it read as a fog/transparency
card. The two source-image Shanshui mist planes could also remain visible as the camera approached
their depths.

**Fix:** the background plane is now 160 × 110, deliberately outside every crossing frustum. The
existing Shanshui mist cards fade from local progress `0.08–0.28`, before camera contact with their
planes; the garden's radial low-mist forms take over. The pond retains its shader strategy but now uses
a circular footprint rather than a transparent rectangle.

### Reverse clipping / black frame

**Cause:** the Moon Gate's dark interior haze disc retained its threshold opacity for all Phase 3
progress. On reverse travel, the camera could meet that dark, screen-filling plane from inside the
opening.

**Fix:** the haze is now reduced symmetrically over local crossing `0.08–0.28`. It is gone before the
camera reaches the tunnel plane and returns only after the reverse path has cleared it. The camera path,
FOV, gate proportions, and state names are unchanged. Combined with the recessed entrance ground, the
same centered corridor stays clear in either direction.

### Crossing-fix validation

- Desktop debug/screenshot checks covered the Phase 2 threshold, COMMIT, PASSAGE, and the return to
  the pre-crossing gate state. The passage frame had no horizontal ground edge or rectangular backdrop;
  reverse return was visible and did not produce a black frame.
- A portrait `390 × 844` check reached REVEAL with the portrait profile selected and no rectangular
  backdrop. An `820 × 1180` check selected the tablet profile.
- Reduced-motion behavior was source-reviewed: raw-scroll mapping and the existing paused ambient
  paths remain intact. The local browser runner did not expose an OS reduced-motion emulation toggle.
- Final desktop endpoint measurement after the fix: 25 draw calls, 3,208 triangles, 8 textures.
  This keeps the 25-call / 8-texture Phase 3 endpoint unchanged while reducing geometry from the prior
  4,312-triangle measurement because the pond footprint is now circular.
- `npm run build` and `git diff --check` pass. Final local console inspection reported no warnings or
  errors.

## Visual polish pass

This pass stays within Phase 3. It refines the existing garden modules without changing the Phase 3
scroll range, state ranges, Moon Gate construction, camera path, or adding assets, dependencies,
render targets, RAFs, or scroll systems.

### Visual changes

- `GardenRocks` now builds three bounded, procedural scholar-rock profiles with irregular rings,
  tapered silhouettes, smooth normals, restrained vertex-tone variation, and cool moonlit material
  separation. They remain instanced.
- `GardenPath` uses low eight-sided, irregularly scaled pavers with per-instance stone hues and a
  slightly wet, low-metalness response. The original path choreography is unchanged.
- `GardenPond` remains one circular shader surface. Its stable shader now combines slow displacement,
  edge falloff, Fresnel, a controlled silver reflection streak, and a cool depth tint; it has no
  planar reflection or post-processing pass.
- Bamboo, leaf cards, a sparse low planting layer, and slender willow strands are distributed in
  depth. The vegetation does not enter until Phase 3 REVEAL (`local >= 0.4`), preventing the garden
  cards from reading over the Moon Gate passage.
- The distant depth layer is a low-contrast negative sky with soft mountain silhouettes, a cold pearl
  moon/halo, and a small unlit pavilion roof/body cue. The pavilion remains only a distant Phase 4
  boundary hint, with no interior or close-up content.
- Garden materials and lighting separate damp ground, cooler water, pale stone, dark jade foliage,
  and moonlit rock planes. Moonlight uses a hemisphere fill, directional key, and one short-range
  cool water bounce; shadows remain disabled.

### Responsive performance budget

- Desktop retains the complete garden composition and all three rock silhouettes.
- Tablet collapses rocks to one instanced profile and omits the distant pavilion/silhouette treatment,
  willow framing, and extra local mist layers.
- Portrait keeps the path, pond, ground, compact rocks, bamboo framing, and moon while omitting
  small-screen-only distant backdrop, mist, and leaf-card detail. This is culling, not a second
  runtime or alternate scene.

### Polish validation

Settled local Chromium endpoint measurements (`?debug=1`, DPR `1.00`) were:

| Profile | Debug viewport | Draw calls | Triangles | Textures |
| --- | ---: | ---: | ---: | ---: |
| Desktop | `1250 × 720` | 29 | 3,702 | 8 |
| Tablet | `819 × 1194` | 22 | 4,342 | 8 |
| Portrait | `375 × 844` | 17 | 3,600 | 8 |

All three endpoint measurements are within the Phase 3 target budgets (desktop `<=30`, tablet
`<=24`, portrait `<=18`). The passage was additionally inspected at desktop Phase 3 local progress
`0.2187` (PASSAGE): the circular opening remained clear, with no horizontal ground strip,
rectangular background card, black frame, or premature vegetation. `npm run build` and
`git diff --check` passed for this pass; the local browser console had no warnings or errors.

### Remaining visual limits

- The garden is still a procedural, low-asset scene. It deliberately does not use authored rock,
  foliage, paving, water-normal, or sky textures, so close viewing retains a stylized geometric read.
- The pavilion is intentionally only a distant silhouette. Its architecture, interior, and any
  project/content presentation remain deferred to later approved phases.

## Final Night Garden art-direction rebuild

This pass replaces the endpoint's blockout-oriented foreground/background treatment without changing
the approved Phase 3 range, state definitions, crossing distance, Moon Gate construction, Shanshui
handoff code, or reverse-scroll mapping.

### Rebuilt systems

- `GardenRocks` is now one merged, higher-density scholar-rock composition: an asymmetric hero mass,
  an eroded arch/pierce suggestion, pond-edge forms, irregular bases, narrowed waists, and a quieter
  distant counterpart. It uses 18-sided profile rings and curved tube arches rather than primitive
  dodecahedra/cones.
- `GardenPath` is one merged bevelled paving mesh. Each paver has an irregular eight-sided footprint,
  three vertical rings for softened wet edges, local tilt, variable thickness, and embedded shore
  stones around the pond.
- `GardenVegetation` now uses segmented, node-bulged bamboo stalk geometry, clustered growth,
  lanceolate leaf groups, a branch-and-hanging-leaf willow system, and separate low grass/reed tufts
  at rock, pond, and path transitions.
- `GardenGround` now has a denser contoured mesh with deterministic damp-soil variation, an irregular
  pond basin, shoreline lift, and vertex-color separation.
- `GardenPond` has a 96-sided irregular outline, dark-to-deep-blue variation, stable edge response,
  lower-frequency movement, Fresnel, and a narrow broken longitudinal reflection cue. It still uses
  one isolated shader mesh with no planar reflection target.
- `GardenBackground` replaces the horizon card with an inward-facing night-sky dome, three overlapping
  procedural shanshui ridge profiles, a low tree line, a single geometric pearl-moon/halo shader, and
  a merged Jiangnan roofline/pillar Pavilion cue.
- Lighting now uses lower global hemisphere fill, a stronger cool directional moon, a restrained pond
  bounce, and a short-range cool rock rim light. No shadows or post-processing were added.

### Measured desktop endpoint

At `?debug=1`, desktop CSS viewport `1265 × 720`, DPR `1.00`, settled at `NIGHT GARDEN ESTABLISHED`:

- 25 draw calls
- 19,754 triangles
- 8 textures

This uses the newly authorized triangle headroom while remaining below the preferred 30 draw-call and
20k–25k triangle desktop budget. The local Vite preview reported no console warnings/errors.

### Regression observations

- PASSAGE was inspected at local Phase 3 progress `0.2187`: the opening remained clear with no early
  ground strip, rectangular mist card, black reverse frame, or premature vegetation.
- A direct REVEAL/early-ARRIVAL inspection at local progress `0.4378` / `0.5629` still presents a
  sparse, dark locked camera composition while exiting the gate. No crossing, camera, Moon Gate,
  Shanshui, state-range, or reverse-scroll code was changed to mask or alter that approved behavior.
- The local in-app browser's responsive viewport capability did not apply its requested `820 × 1180`
  and `390 × 844` overrides (the page remained `1280 × 720`); therefore this pass does not claim new
  measured tablet/portrait runtime numbers. The existing responsive profile reductions remain in code.

## Hybrid Pass B

This pass extends the existing `HybridArtLayer` / `HybridCard` pipeline with only
`willow-foreground-left.png`, `bamboo-midground-right.png`, and `pond-reeds-cluster.png`. The Moon
Gate, crossing path/timing, Phase 3 ranges, Pass A tree line, Shanshui handoff, and the remaining
jade-foliage and scholar-rock assets were not changed.

### Asset verification

| Asset | Dimensions | Alpha | Fully transparent | Non-transparent bounds |
| --- | --- | --- | ---: | --- |
| `willow-foreground-left.png` | 1122 × 1402 | 0–255 | 54.01% | 0,0 → 1121,1401 |
| `bamboo-midground-right.png` | 1122 × 1402 | 0–255 | 56.46% | 0,0 → 1121,1401 |
| `pond-reeds-cluster.png` | 1448 × 1086 | 0–255 | 59.46% | 0,19 → 1433,1085 |

All three are `Format32bppArgb` with meaningful transparent pixels. They were visually inspected on
a dark field; no white/black matte was observed. The willow and bamboo artwork reaches canvas edges,
so their cards are intentionally positioned partly outside the composition rather than exposing those
edges. Source PNGs were not modified.

### Hybrid architecture and authored integration

- The existing `HybridArtLayer` remains the only card coordinator. It now has four profile-aware cards
  (`treeLine`, `willow`, `bamboo`, `reeds`) using the same Vite-base-path Promise texture cache and
  `SRGBColorSpace` handling. No loader work occurs on resize/profile changes.
- `HybridCard` gained a layout setter so one card can scale and reposition across desktop, tablet, and
  portrait profiles without replacing its geometry or texture. Scroll opacity and camera-distance
  opacity remain deterministic smoothstep products in the existing render loop.
- Willow is a near left-edge hanging frame at desktop Z `-21.5`; it starts at local progress `0.50`,
  reaches its atmospheric value by `0.84`, and has a close-contact fade from 9 to 2 world units.
- Bamboo is a right rear-midground authored mass at desktop Z `-31`; it begins at `0.37`, settles by
  `0.75`, and remains paired with retained physical bamboo trunks for spatial parallax.
- One reeds card sits along the right pond shore at desktop Z `-26.2`; it starts at `0.42`, settles by
  `0.78`, and is partially backed by the existing pond/rock/ground context rather than repeated.
- Alpha tests (`0.055` foliage, `0.045` reeds), cool moonlit tint, low opacity, real Z separation,
  depth testing, disabled depth writes, and strategic viewport cropping prevent a rectangular-card read.

### Procedural vegetation reduction

- The procedural willow mesh was removed completely; the authored willow now owns that framing role.
- Physical bamboo stalks remain. Their procedural leaf clusters were reduced from up to twice the stalk
  count to at most one per stalk, allowing the authored bamboo silhouette to carry the visual mass.
- Low procedural shoreline foliage was reduced from 24 to 14 desktop instances (8 portrait), while
  preserving non-card shoreline context away from the one authored reeds placement.

### Timing, responsive checks, and measurements

- At desktop PASSAGE (local `0.2560`), willow/bamboo/reeds diagnostics all measured `0.000`; the Pass A
  tree line was only `0.002`. The corridor remained clean. At established desktop, tree line/willow/
  bamboo/reeds measured `0.180` / `0.270` / `0.271` / `0.290`.
- Reverse scrolling from established state back to PASSAGE restored the zero-opacity clean corridor
  without a pop or black frame. All cards use their own configured smoothstep safety distances, while
  retaining the shared fade implementation.
- Requested `820 × 1180` browser validation resolved to `805 × 1180` and selected tablet. Requested
  `390 × 844` resolved to `375 × 844` and selected portrait. Portrait retains bamboo and a restrained
  willow/reeds contribution (`0.120` / `0.160` endpoint opacity); tablet keeps all three at reduced
  placement/scale. Desktop was measured at `1265 × 720`.
- Pass A recorded desktop endpoint: 27 draw calls, 20,636 triangles, 9 textures. Pass B desktop
  endpoint: 28 draw calls, 18,242 triangles, 12 textures. The three authored PNGs add three textures
  and one net draw call while procedural vegetation removal reduces triangle count.

### Build and runtime validation

- `npm run build`: passed (`tsc` and Vite build). The only build notice remains the pre-existing
  >500 kB bundle-size advisory.
- `git diff --check`: passed.
- Normal and `?debug=1` local routes loaded. A fresh browser session reported no console warnings or
  errors. Debug now reports willow, bamboo, reeds, and nearest-card metrics.
- Threshold, PASSAGE, established state, reverse return, responsive profiles, and alpha/card edges
  were visually checked. No new crossing regression, black reverse frame, opaque block, or visible
  rectangular card boundary was observed.

### Remaining limitation

Pass C remains intentionally unimplemented: `jade-foliage-foreground.png` and
`scholar-rock-foreground.png` are not loaded or placed. Physical mobile hardware and OS
reduced-motion verification remain future checks.

## HYBRID PASS B.1 — COMPOSITION CALIBRATION

This pass separates viewport foreground art from world vegetation. No source PNGs, Moon Gate files,
camera crossing, Phase 3 ranges, Shanshui handoff, or Pass C assets were changed.

### Rendering and composition

- Added `HybridForeground.ts`, owned/disposed by the existing `HybridArtLayer`. Its single fixed
  `#hybrid-foreground` host is decorative (`aria-hidden`, empty image alt, pointer-events none),
  clipped to the viewport, above WebGL and below the harness/debug UI. Willow is no longer a WebGL
  card or GPU texture. It uses the same original PNG and Vite base URL, with no duplicate willow loader.
- Desktop willow: image width 41vw, left -6vw, top -16vw, native aspect ratio. The reviewed 1265×720
  screenshot shows foliage in roughly the left 28–30% of the frame, with principal hanging tips
  around mid-height. Top/left source boundaries are deliberately cropped. Active opacity is 0.94,
  saturation 0.85 and brightness 0.76; a mask softens only the lowest tips.
- Tablet willow is smaller in visible height: 46vw width, -8vw left and -13vw top. Portrait omits it
  entirely, leaving bamboo as the primary framing asset.
- Willow enters over local progress 0.38–0.78 with at most 14px horizontal / 7px vertical translation.
  It remains zero through PASSAGE. Reduced motion uses the same progress opacity with zero shift.
  There is no new RAF, tween, renderer, or animation timer; DOM lifecycle is tied to the garden.
- Desktop bamboo is at (5.5, 1.1, -29), width 9, active opacity 0.90. Screenshot iteration brought it
  inward from an initially excessive right crop. It now forms a substantial right-edge mass behind
  the physical hero rock, leaving the moon, path, pond and Pavilion axis open. Tablet/portrait
  opacity is 0.86 with separately configured scale and placement.
- One desktop reeds card is at (3.5, -3.45, -24), width 3.1, active opacity 0.86. Moving it back from
  the initial foreground-ground placement put its base at the pond/ground join; the existing rock
  occludes part of the card. It occupies approximately the rightmost 20–25% of the desktop image
  including transparent margins. Tablet uses (3.2, -3.45, -24), width 3.1, opacity 0.82. Portrait
  uses (3.6, -3.5, -23), width 2.8, opacity 0.80 and a deliberately small shoreline accent.
- Tree-line profile positions, tints, opacity targets (0.18 / 0.16 / 0.14), and timing are retained.
- Bamboo/reeds retain MeshBasicMaterial, sRGB maps, FrontSide, depthTest true, depthWrite false,
  transparent true, alphaTest 0.055 / 0.045, and cool tint #728b8c. Fog support is explicitly true;
  no global scene fog was added. Existing atmosphere, tint and physical overlap supply integration.
  Close-distance safety fades remain in world space (bamboo 7→2 units, reeds 4→1 units), while willow
  retirement is purely progress-driven because it cannot intersect world geometry.

### Procedural reduction and measurements

- Retained 8 structural bamboo trunks on desktop/tablet and 5 on portrait. Disabled procedural
  bamboo leaves so authored artwork supplies the foliage silhouette. Shoreline tufts now number
  6 on desktop/tablet and 3 on portrait. Physical rocks, path, pond and terrain were retained.
- Pass B supplied baseline: 28 draw calls / 18,242 triangles / 12 WebGL textures.
- B.1 measured desktop established (1265×720, DPR 1): 25 draw calls / 10,984 triangles / 11 WebGL
  textures, plus one DOM willow image. Browser compositor work is not included in Three.js metrics.
  No new artwork, dependencies, postprocessing or additional render passes were introduced.

### Screenshots and runtime checks actually performed

- Normal-route desktop ESTABLISHED screenshots reviewed before and after placement adjustments.
  Willow clearly anchors upper-left; bamboo anchors the right; reeds meet the shoreline. The central
  view remains open. No new card rectangle, conspicuous alpha fringe or sorting failure was seen.
- Desktop ARRIVAL reviewed with and without debug, local progress 0.7024: willow 0.848, bamboo 0.861,
  reeds 0.757. Desktop ESTABLISHED values were 0.940 / 0.900 / 0.860.
- Tablet established screenshot reviewed at actual 805×1180 (requested 820×1180), including a second
  review after reeds moved inward/back to the shoreline. Portrait established screenshot reviewed at
  actual 375×844 (requested 390×844); bamboo-only primary framing leaves the center uncluttered.
- Reverse desktop REVEAL screenshot reviewed at 0.4420 and PASSAGE at 0.2560. All three foreground/
  vegetation opacities were zero in PASSAGE; the visible gate/painting returned without new obstruction.
  Threshold-state return was reviewed at global 0.6763 (gate progress 0.9866, Phase 3 local zero).
- Normal and debug routes loaded, console warning/error query returned empty. Build and diff whitespace
  checks passed; Vite retains its existing >500kB chunk-size advisory.

### Remaining limitations

The frozen camera still produces a very dark, sparse REVEAL frame at local 0.4420, and the existing
angular sky/ridge/background treatment remains evident. This pass does not claim to resolve those
world issues. Physical-device reduced-motion and hidden-tab tests were not performed; reduced-motion
foreground behavior was source-reviewed. Pass C remains unimplemented.

## HYBRID PASS C — LOWER FOREGROUND COMPOSITION

### Asset verification

| Asset | Dimensions | Alpha | Fully transparent | Partial alpha | Non-transparent bounds |
| --- | --- | --- | ---: | ---: | --- |
| `jade-foliage-foreground.png` | 1448 × 1086 | 0–255 | 55.14% | 44.82% | 0,21 → 1439,1067 |
| `scholar-rock-foreground.png` | 1122 × 1402 | 0–255 | 57.64% | 42.30% | 0,19 → 1085,1401 |

Both source PNGs are `Format32bppArgb` with meaningful transparent and feathered-alpha pixels. They
were inspected on a dark field; no white or black matte and no rectangular source boundary were
observed. Source assets were not modified.

### Hybrid foreground integration

- `HybridForeground`, already owned and disposed by `HybridArtLayer`, remains the single decorative
  viewport host. It now owns the new jade foliage and scholar-rock images alongside willow. There is
  no second foreground system, WebGL card, texture-loader request, render loop, tween, or render pass.
- Jade foliage is a strong, cool-toned lower-right foreground mass. Desktop uses a 55vw card cropped
  24vw beyond the right edge and 10vw below the bottom edge; its final active opacity is 0.88.
  Tablet reduces its framing pressure, while portrait keeps jade alone as the lower framing element
  (0.84 opacity) and omits willow and the scholar rock.
- The scholar-rock source is a lower-left near-frame crop, not a hero replacement. Desktop uses a
  30vw card pushed 28vw below the bottom edge, preserving the existing physical 3D hero rock and
  upper-left willow. Its final active opacity is 0.86. Tablet reduces it to 25vw; portrait omits it.
- Both cards use the existing symmetric REVEAL-to-ARRIVAL smoothstep (`0.38–0.78`), so they are zero
  through COMMIT and PASSAGE and reach their intended presence by ESTABLISHED. Reduced motion retains
  the same opacity progression but removes the small entrance translation.

### Procedural reduction and composition checks

- Low-value procedural shoreline/ground tufts were reduced from 6 to 3 instances on desktop/tablet
  and from 3 to 2 on portrait. Physical terrain, path, pond, bamboo trunks, useful shoreline context,
  and the physical hero scholar rock remain unchanged.
- Desktop ESTABLISHED review at the actual `1388 × 800` desktop viewport retained willow in the
  upper-left, physical/authored bamboo at right, the new lower-left rock crop and lower-right jade
  foliage. The path and pond corridor remained open.
- Tablet ESTABLISHED review at the actual `894 × 1311` viewport retained both restrained lower-frame
  assets. Portrait ESTABLISHED review at actual `416 × 937` used jade only; the scholar rock and
  willow were absent, leaving the center corridor open.
- A desktop reverse check from REVEAL into PASSAGE reached local progress `0.2547`: jade and scholar
  rock opacities were both `0.000`, matching the zero willow/bamboo/reeds values. No foreground asset
  appeared in the crossing corridor.

### Measured validation

- Desktop B.1 baseline: 25 draw calls, 10,984 triangles, 11 WebGL textures, plus the DOM willow.
  Pass C desktop established: 25 draw calls, 10,792 triangles, 11 WebGL textures, plus DOM willow,
  jade foliage, and scholar rock. The added art stays outside Three.js texture/draw-call metrics;
  reduced tufts remove 192 rendered triangles.
- Tablet established: 25 draw calls, 11,950 triangles, 11 WebGL textures. Portrait established:
  24 draw calls, 10,978 triangles, 11 WebGL textures. Browser-compositor work for DOM foreground
  images is not included in the Three.js metrics.
- `npm run build` and `git diff --check` passed. Normal and debug routes loaded during desktop,
  tablet, and portrait reviews. The existing Vite >500 kB bundle advisory remains.

### Remaining limitation

Physical-device, OS reduced-motion, and hidden-tab verification remain outstanding. The frozen
Phase 3 world/camera still has its pre-existing sparse, dark REVEAL presentation; Pass C only changes
the authorized lower foreground composition.

## PASS D — SURFACE / MATERIAL FOUNDATION

### Material architecture

- Added `GardenMaterials`, a Night Garden-only owner for one shared 256 × 256 procedural map set and
  one `MeshStandardMaterial` per physical family: wet path stone, weathered scholar rock, and quiet
  garden ground. `NightGarden` constructs it once, passes its materials into the three physical
  systems, and disposes it once after the meshes release their geometries.
- `GardenPath`, `GardenRocks`, and `GardenGround` no longer own or dispose independent materials.
  Path and rock geometries now have stable projected UVs; existing ground UVs are retained. No map
  regeneration occurs during resize, profile changes, or rendering.

### Generated maps and color handling

- Each family generates 256 × 256 base-color, grayscale height, roughness, and tangent-space normal
  maps. Height textures are retained as source resources for the material set; base-color, roughness,
  and normal maps are bound to the material.
- Color textures use `SRGBColorSpace`. Height, roughness, and normal textures use `NoColorSpace`.
  All maps use `RepeatWrapping`; no authored image color handling was changed.
- Normals are central-difference derivatives of the deterministic grayscale height fields, wrapped at
  texture edges. Path uses broad stone variation, worn grain, and shallow pits; rock uses broad
  erosion, furrow fields, and smaller pits; ground uses only broad damp-soil breakup.

### Surface treatment

- Path: blue-charcoal/cool-grey color variation with darker recesses, a `0.94` material roughness
  multiplier over a generated `0.76–0.97` roughness map, zero metalness, and restrained `0.26`
  normal scale. The approved irregular 3D path route and stone silhouettes are unchanged.
- Physical scholar rocks: dedicated cool limestone/charcoal maps with darker damp crevices and a
  restrained jade-muted recess cue. Material roughness is `0.93` over a generated `0.76–0.99` map,
  metalness is zero, and normal scale is `0.34`. The hero formation geometry is unchanged.
- Ground: a quieter ink/jade/charcoal map with only broad tonal breakup, `0.97` material roughness
  over a generated `0.90–0.97` map, zero metalness, and a `0.055` normal scale. Existing terrain and
  shoreline geometry remain unchanged.
- Pond: retained the same single lightweight shader. The shoreline now darkens up to 18%, depth tint
  was slightly deepened, and Fresnel/ribbon glint strengths were reduced from `0.18` / `0.045–0.185`
  to `0.15` / `0.035–0.155`, keeping water calm and distinct from damp stone.
- Lighting was not changed.

### Validation and measurements

- Desktop `NIGHT GARDEN ESTABLISHED` debug review at `1265 × 720`, DPR 1: 25 draw calls, 10,792
  triangles, and 20 WebGL textures. Pass C baseline was 25 calls, 10,792 triangles, and 11 textures;
  the nine bound procedural maps account for the texture increase without geometry or draw-call growth.
- Tablet (`805 × 1180`) and portrait (`375 × 844`) reviews selected their correct profiles and kept the
  same shared texture count. ARRIVAL and ESTABLISHED states were checked through `?debug=1`; normal
  route screenshots were also reviewed.
- Reverse scroll into COMMIT/PASSAGE retained zero foreground-art opacity and the existing clean
  crossing behavior. No camera, gate, state-range, hybrid-art, background, or Phase 4 code changed.
- `npm run build` and `git diff --check` passed. Normal/debug routes ran without console warnings or
  errors. The existing Vite >500 kB bundle-size advisory remains.

### Remaining limitation

The established camera is intentionally a wide compositional frame, so the smallest generated
microstructure is clearest in local path/rock portions rather than as a close-up material study.
Physical-device reduced-motion and hidden-tab checks remain outstanding.

## PASS E — ATMOSPHERE / BACKGROUND / MOONLIGHT

### Background, painted depth, and air

- Removed the previous inward sky sphere and its three custom angular ridge meshes. The Night Garden
  now uses one frustum-covering vertical night-blue gradient plane, so the old grey dome/circle and
  polygonal peak silhouette do not remain underneath the new scenery.
- Reused the owned `public/shanshui/mid-mountains.png` and `public/shanshui/far-mountains.png` files.
  They were inspected as 2171 × 724 and 2172 × 724 ARGB PNGs respectively, each with feathered alpha
  and useful transparent bounds. Neither asset was modified and no reference-board imagery is used.
- The nearer painted ridge is cool-tinted `#44606b`, opacity `0.54`, at `(-1.8, 0.5, -69)` with a
  74-unit width. The lighter far ridge is `#6d8491`, opacity `0.34`, at `(1.4, 3.2, -87)` with an
  86-unit width. Their separated depth, reduced contrast, and alpha leave the tree line as the bridge
  between physical garden and painted geography.
- The pre-existing Shanshui atmospheric field now sits at depth `-60`, behind the Phase 3 sky plane;
  this removes its former visible portrait-plane edge without changing its palette, camera path, or
  transition ranges.
- `FogExp2('#0a161a', density)` is introduced only after local Night Garden progress `0.34` and rises
  smoothly to `0.012` by `0.58`. It is therefore absent during COMMIT/PASSAGE and leaves the frozen
  crossing clear while integrating the tree line, ridges, and Pavilion hint at arrival.
- One low mist separator plus three deeper textureless shader haze slabs make the desktop stack. Their
  feathered elliptical alpha, depth-write-off materials, and positions at z `-49`, `-61`, `-79`, and
  `-95` avoid card edges. Tablet uses three slabs and portrait two; drift is sub-pixel-scale and stops
  under reduced motion.

### Moon, light, and surface response

- The moon is a 64-sided pearl disc shader with a softened edge and restrained procedural mottling,
  paired with a much larger, low-alpha radial halo plane. Desktop places it at `(-4.2, 6.3, -91.8)`;
  tablet and portrait adjust x/y/scale intentionally. There is no bloom, post-processing, red tint,
  or opaque halo disc.
- Lighting is a `0.23` muted blue/near-black hemisphere fill; one `#dbecee` directional moon key at
  `(-12, 15, 4)` with intensity `3.05`; a small `#91bdc7` pond bounce (`0.52`, range 24); and a
  `#9bbbc2` directional separation rim at `0.34`. The moon target favours the path/pond corridor;
  the rim remains subordinate and does not create a dual-key look.
- The grazing key and restrained rim make the existing Pass D path stone edges, rock erosion/cavities,
  and quiet ground breakup visible without reducing their high roughness or creating a glossy path.
- No pond shader rewrite was needed: the Pass D dark depth tint and broken longitudinal glint remain.
  Its response is now framed by the cooler key/bounce and background haze rather than becoming a mirror.
- The Pavilion remains a small, dark distant hint and the approved tree-line card remains its bridge to
  the new mountain stack; neither becomes a Phase 4 destination.

### Responsive and regression review

- Clean and debug route reviews confirmed the desktop established frame has the moon as the brightest
  anchor, a cooler lower-contrast painted background, readable midground path/pond, and no angular
  ridge, grey dome, halo disc, or haze-card boundary. The responsive tablet and portrait frames retain
  the authored moon placement and reduced haze; portrait's terrain support was extended beneath the
  same path/pond coordinates to eliminate a near-edge seam.
- Desktop established measurement at `1265 × 720`, DPR 1, changed from the Pass D baseline of 25 draw
  calls / 10,792 triangles / 20 textures to 28 calls / 9,272 triangles / 22 textures. The two added
  textures are the owned ridge assets; the lower triangle count comes from removing the former custom
  ridge meshes. A subsequent tablet debug frame at `943 × 1002` measured 29 calls / 10,508 triangles /
  22 textures. No render passes or dependencies were added.
- Normal and `?debug=1` routes loaded without console errors or warnings. COMMIT, REVEAL, and
  ESTABLISHED were observed; reverse navigation back into COMMIT retained the existing zero-visibility
  garden/crossing behaviour. `npm run build` and `git diff --check` pass. The existing Vite >500 kB
  bundle-size advisory remains.

### Remaining limitation

The established Phase 3 camera intentionally remains wide, so surface detail reads through selected
grazing highlights rather than close-up inspection. Physical-device reduced-motion/hidden-tab checks
and a browser-tooling-confirmed dedicated ARRIVAL screenshot remain outstanding; no Phase 4 work was
started.
