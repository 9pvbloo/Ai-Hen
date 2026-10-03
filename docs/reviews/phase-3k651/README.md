# Phase 3K.6.5.1 — Mansion Luminous Presence

Validated 2026-09-30. Ready for visual review; no push, camera phase, or door animation.

The mansion reads as emitting warm light into its nearby architecture, most clearly at the genkan lintel, posts, landing and first steps. The central and upper rooms remain subordinate, and wings remain mostly source-driven. This is a restrained result, not a broad floodlight effect. No production tuning was needed during recovery.

## Recovery and scope

Recovery HEAD: `175f800` on `phase-3k-cinematic-rebuild`, 16 commits ahead of origin. Initial `git diff --check` passed. The only tracked edit was the pavilion review hook in `scripts/verify-night-garden.cjs`; untracked work comprised `scripts/review-pavilion-luminous.cjs`, `scripts/measure-pavilion-luminous.py`, and this review directory. Source, finite-range spill and local glow were already committed. No reset, checkout, revert, implementation rewrite, or discarded work occurred.

Original `before/`, `after/`, `area-study/`, root comparison sheets and root pixel measurements are preserved. Fresh validation is in `final/`, including the missing left oblique view, recorded camera/exposure metadata, layer-isolation measurements and wider clipping coverage.

## Implementation

`GardenPavilion` coordinates existing materials/architecture, `GardenPavilionSource`, `GardenPavilionLighting`, and `GardenPavilionGlow`. `main.ts` remains untouched. Occupied shoji stays opaque: opacity 1, transparent false, depthWrite true. Emission modifies the existing material shader, with no extra source mesh or texture.

| Occupancy | Emissive color | Full-visibility intensity |
| --- | --- | --- |
| Genkan | #e6b46b | 0.78 |
| Central / upper warm | #e7a96c | 0.52 |
| Wings / dim warm | #ce925b | 0.28 |

All three prior intensity values are retained. These intensities fade with garden visibility. The upper source additionally uses a 0.90 shader multiplier.

Source colors are **linear RGB multipliers on each material's emissive color**, not standalone sRGB swatches: edge `(0.46, 0.29, 0.17)`, paper body `(0.81, 0.74, 0.61)`, hot core `(0.98, 1.10, 1.29)`. The core is an elliptical exponential centered at `(0.48 + room * 0.035, 0.43)`; UV axes scale by `(2.3, 1.9)` and squared distance by 2.4. Edge-to-body interpolation uses `smoothstep(0, 0.21, nearest UV border)`. Room variation is `sin(localX * 1.17 + localZ * 0.73)`, with brightness `0.96 + room * 0.04`. The graded core, body and edge remain visibly distinct.

### Architectural spill

Coordinates are mansion-local. All lights have decay 2 and castShadow false.

| Light | Type | Color | Intensity | Distance | Position | Target |
| --- | --- | --- | --- | --- | --- | --- |
| inner-threshold | Existing PointLight, adjusted | #d2a06d | 4.8 | 4.5 | (0, 4.35, 1.15) | — |
| covered-landing | Existing PointLight, adjusted | #bd936a | 3.4 | 4.1 | (0, 3.40, 5.45) | — |
| hall-spill | New SpotLight | #efb46b | 12 | 6 | (0, 4.8, 4.5) | (0, 4.2, 2.1) |
| upper-spill | New SpotLight | #efb46b | 8 | 5 | (0, 8.6, 2.5) | (0, 8.1, 0.1) |

Both spots have angle 1.18 radians and penumbra 0.8. No new PointLight was added. Night Garden has **9 active PointLights**: 2 mansion + 7 lanterns; plus 2 mansion SpotLights, 1 hemisphere and 2 directionals = **14 contributing lights** at full garden visibility. The full scene contains 17 light objects: 10 PointLights, 2 SpotLights, 2 hemispheres, 3 directionals. One PointLight, one hemisphere and one directional belong to the earlier world and have zero intensity at the final checkpoint. There are no dynamic shadows.

RectAreaLight remains rejected: the preserved prototype increased textures 25 → 27 with its two LTC lookup textures and showed faint rear-eave wash. Its original captures are in `area-study/`. The experiment was not repeated.

### Local glow

One InstancedMesh with 28 PlaneGeometry instances, 56 triangles, one draw call and no textures. The proxy derives from actual occupied infill transforms. It sits 0.008 local units in front of paper, behind timber framing; width/height scales are 1.16/1.12. Numerical measured separation is 0.007999934–0.00799999997.

ShaderMaterial uses AdditiveBlending, transparent true, depthTest true, depthWrite false, toneMapped false, and Three.js fog chunks/uniforms. Two exponential lobes are multiplied by a boundary falloff; color is `(0.95, 0.54, 0.22)`. Strengths: entry 0.16, central warm 0.085, upper warm 0.065, dim 0.035. `setEntryGlow` / `setEntryIntensity` independently control entry strength through `uEntry`, clamped to [0,1]; no door motion is implemented. Mesh, geometry and material have explicit disposal.

No selective post-process bloom was necessary. No EffectComposer, global bloom, renderer, exposure, tone-mapping, garden or lantern changes. Runtime records confirm NoToneMapping (0), exposure 1 and sRGB output for every A/B/C/D capture. Existing document-hidden pausing and reduced-motion behavior remain unchanged.

## Layer validation and occlusion

A restores previous flat emissive response plus the two previous mansion point-light settings (4.2/range 4 and 1.8/range 3.4); new spots and glow are disabled. B enables source shaping only. C enables the finite-range lighting changes. D adds local glow. Each set uses one cloned camera, identical projection/exposure, and a held framebuffer between captures. Production metadata is asserted identical across modes. Review-only injection is served through Playwright routing; no production debug switch is added.

| Genkan crop | B mean RGB | C mean RGB | D mean RGB |
| --- | --- | --- | --- |
| Lintel | 27.238, 25.705, 23.264 | 56.783, 42.895, 30.216 | Same as C |
| Porch | 41.688, 35.680, 30.148 | 49.610, 39.983, 32.014 | Same as C |
| Entry post | 21.544, 21.708, 21.064 | 25.062, 23.448, 21.658 | Same as C |
| First steps | 26.118, 28.702, 27.833 | 30.154, 31.267, 29.225 | Same as C |

A → B changes paper character; B → C creates actual architectural response; C → D preserves architecture lighting while increasing optical source presence. Lintel and porch C/D crops are pixel-identical.

Genkan, central hall, upper residence, both wings, both obliques and rear were visually inspected. Timber stays in front; no new glow-through-wall, detached halo, paper/glow z-fighting, or sorting artifact was observed. The entire rear frame is pixel-identical C → D. Rear roof and foundation crops and upper roof-body crop are unchanged in all four modes.

The full rear B → C image is not entirely identical: 2,469 changed pixels occur only in x544–895/y365–375, a narrow visible front soffit through an architectural gap. A diagnostic ray at (720,370) hits `pavilion-roof-soffits` first at mansion-local approximately (0,6.169,3.002), then front hall fascia and entry roof. This is visible front architecture, not the rejected rear-eave wash. The upper roof-and-edge crop includes a tiny changed soffit boundary (mean absolute difference 0.01274); excluding that boundary, roof-body difference is zero.

Cold/warm composition is preserved in `final/night-contrast.jpg`: warm mansion and lanterns against blue trees, cold gravel, dark timber and night sky. Sky and gravel sample deltas are exactly zero; tree/lantern sample deltas are below 0.001 RGB units. The entrance is the architectural focus while foreground lanterns remain locally brighter.

## Clipping and saturation

Measurements use 8-bit screenshots. Near-white means **all RGB channels >=245**. Crop maxima are per-channel maxima, not necessarily one pixel. Bounding boxes include frames/background; they are not material masks.

| Final crop | Max RGB | Near-white | Any channel at 255 |
| --- | --- | --- | --- |
| Mansion at desktop 100% | 255,237,182 | 0% | 0.03606% |
| Genkan paper | 255,234,168 | 0% | 11.06323% |
| Upper paper | 217,180,141 | 0% | 0% |
| Central hall full close-up | 244,225,163 | 0% | 0% |
| West wing full close-up | 208,173,139 | 0% | 0% |
| East wing full close-up | 209,174,140 | 0% | 0% |

No panel becomes a flat white slab, and the gradient is visible. **This is not a claim of zero channel clipping:** the genkan core saturates red in 11.06% of its tight crop, while green/blue retain shape. Source-only B and source+spill C have zero channel-255 pixels in that crop; D introduces this red saturation. The balance was preserved because the requested visual review still shows a shaped warm source, not a flattened white panel. Full values and crop coordinates are in `final/pixel-measurements.json`.

## Performance and technical validation

`npm run build` passed (TypeScript + Vite; 71 modules). Vite retains its >500 kB chunk warning: main JS 822.95 kB, 230.72 kB gzip. `git diff --check` and staged diff checks passed.

`GARDEN_PAVILION_REVIEW=1 node scripts/verify-night-garden.cjs` passed on local Chrome via the bundled Playwright runtime. `GARDEN_REVIEW_URL=http://localhost:5173/?debug=1` and `GARDEN_REVIEW_OUTPUT=docs/reviews/phase-3k651/final` select this archive. `python scripts/measure-pavilion-luminous.py docs/reviews/phase-3k651/final` regenerates measurements and sheets. Playwright, Pillow and NumPy are review-environment tools, not new app dependencies.

21 production checkpoints across desktop/tablet/portrait and normal/reduced motion; 12 production A/B/C/D images and 32 diagnostic A/B/C/D images. Zero collected JS/console/shader/WebGL errors, zero context loss. 970 mansion instance matrices and 56,848 geometry attribute values checked finite; world matrices and numeric glow uniforms finite. Opaque paper/depth policy, instance separation, two added spots, and no dynamic shadows asserted. Existing path, mansion support datum, wall clearance, ground seating, vegetation instance counts and 15-lantern/7-light budgets passed.

| 100% normal camera | Before calls → after | Before triangles → after | Textures |
| --- | --- | --- | --- |
| Desktop | 60 → 61 | 184646 → 184702 | 25 → 25 |
| Tablet | 59 → 60 | 172956 → 173012 | 25 → 25 |
| Portrait | 57 → 58 | 165246 → 165302 | 25 → 25 |

At desktop 20/40%, calls are 61 → 62 and triangles 185086 → 185142 because the transition still draws extra world geometry. The phase delta remains exactly **+1 draw, +56 triangles, +0 textures**. Contributing Night Garden lights increase 12 → 14, via the two SpotLights, not extra PointLights.

FPS observation: archived baseline and fresh final normal desktop checkpoints show 75 FPS; tablet/portrait 60% and 100% show 75 FPS. One fresh tablet 20% checkpoint records 1 FPS immediately after a reduced-motion/layout transition; subsequent tablet checkpoints show 75. The diagnostic counter spans paused/on-demand transitions, so that sample is not a steady-state benchmark. These are headless local-machine observations at DPR 1, not physical mobile or GPU timing guarantees.

## Capture index

All paths below are relative to this directory; original captures remain untouched.

- A/B/C/D production sets: `final/desktop-{20,60,100}-{A,B,C,D}.png`.
- A/B/C/D sheets: `final/genkan-abcd.jpg`, `final/desktop-60-abcd.jpg`.
- Composition: `final/night-contrast.jpg`.
- Desktop normal: `final/desktop-{20,40,60,80,100}.png`.
- Tablet normal: `final/tablet-{20,40,60,80,100}.png` (includes required 60/100).
- Portrait normal: `final/portrait-{20,40,60,80,100}.png` (includes required 60/100).
- Reduced motion: `final/{desktop,tablet,portrait}-reduced-{40,100}.png`.
- Close-ups: `final/closeup-{genkan,central-hall,upper-residence,west-wing,east-wing}-{A,B,C,D}.png`.
- Right oblique: `final/closeup-oblique-occlusion-{A,B,C,D}.png`.
- Left oblique: `final/closeup-oblique-left-occlusion-{A,B,C,D}.png`.
- Rear: `final/closeup-rear-occlusion-{A,B,C,D}.png`.
- Runtime/health/inventory: `final/report.json`.
- Clipping/isolation/composition numbers: `final/pixel-measurements.json`.
- Rejected prototype: `area-study/{baseline,rect-area,rear-leak-rejected}.png`, `area-study/report.json`.

## Files and commits

Production files already changed by this phase: `src/world/nightGarden/GardenPavilion.ts`, `GardenPavilionMaterials.ts`, `GardenPavilionSource.ts`, `GardenPavilionLighting.ts`, `GardenPavilionGlow.ts`. Recovery changed only the three review scripts and this archive.

- `084e11f` — feat: shape luminous shoji source response
- `910dcf8` — feat: add restrained finite-range mansion spill
- `175f800` — feat: add depth-tested local mansion glow
- `396130b` — test: validate mansion luminous presence and light budget
- Archive commit — docs: archive Phase 3K.6.5.1 luminous review (contains this report and preserved/final captures).

## Remaining limitations and acceptance

Unshadowed finite-range lights are authored for this fixed facade, not general physical occlusion for future moving doors or changed geometry. Glow is a front-facing local proxy, not true optical bloom. Diagnostic cameras expose existing scenery-card edges; tablet entrance contains faint silhouette-shaped shading already present in `before/tablet-100.png`. These were not introduced or changed by the luminous phase. No new z-fighting was observed in the reviewed views; discrete screenshots cannot prove every possible future camera position. Red-channel saturation and the build chunk warning are documented above. Physical-device performance remains unmeasured.

Visual acceptance assessment: **yes**, the mansion now appears to emit restrained warm light into nearby architecture, supported by the isolated B/C differences on actual timber and porch surfaces. Final artistic acceptance remains with the user. Nothing was pushed and no later phase was started.
