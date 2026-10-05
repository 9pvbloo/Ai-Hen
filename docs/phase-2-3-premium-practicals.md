# Phase 2.3 — practical sources and stone lantern refinement

Start HEAD: d84d914f5803801c490cfb45e268d1dd1dff5941.
Branch: phase-2-3-genkan-interior-architecture. Existing tracked tree clean; two user-provided reference PNGs untracked and preserved.

Read threejs skill, current lighting/material/ownership implementations, and approved storyboard/visual bible plus both local stone references. Reference filenames show a low stone chamber in the large-path image and tall toro in the small-ambient image; the explicit brief governs hierarchy: tall path, compact secondary.

Audit: secondary prototype was timber/paper without a stone roof; eight sources use much weaker custom diffuse transport than the seven PBR points. Wall boxes already exist at four wall datums. No round pendant exists. House/paper/bounce use unrelated amber RGB values. Three cached shadow maps currently belong to moon, hall and floor andon.

Scope: reconstruct luminaires at frozen anchors, unify practical chromatic family, bounded window-to-frame response, pendant-owned interior light. Preserve architecture, camera, ownership, scroll, moon/sky, exposure and layouts. No Phase 2.4, media, external dependencies, push or PR.

Numeric baseline: scripts/lantern-premium-baseline.json; same-machine headless Chrome, no screenshots. 23 lights, three shadows, 66 geometries, 39 textures, 45 warmed programs. All three profiles stabilize at 75 synchronized FPS. This ceiling is not GPU headroom.

## Implementation

Tall stone lanterns: octagonal footing, tapered shaft and shoulder, thick chamber reveals, recessed paper/lattice, flared four-sided stone roof and restrained finial. Height scale 1.45 -> 1.70; horizontal prototype factor .85 preserves the old lateral silhouette envelope. Minimum conservative centerline-to-fixture clearance is .90661 m. No anchor was relocated. Compact fixtures now use stone feet, corner piers and low flared stone caps, with smaller dark lattice inserts. Both remain six shared finish batches plus the existing very restrained halo batch.

Four existing wall-mounted rectangular boxes gain front stiles, rails and rain caps. Their practicals now sit inside the paper chamber (offset .34 from wall datum versus box center .31), verified in each instance's local bounds. No walls moved.

The genkan gains a .72 m round washi pendant with eleven fine latitude ribs, four meridian loops, two collars and a ceiling suspension. Final local center (-.18,4.70,-4.65) fits the complete shade inside all three frozen camera frames. Its conservative projected bounds in portrait remain within x [-.9022,.3406], y [.4245,.9220]. Minimum camera-to-shade AABB distance along interior travel: 3.30167 m. Two merged meshes borrow interior materials and explicitly own their geometries. No per-frame geometry work.

PracticalLightPalette supplies source/paper/bounce/dim colors; custom transport converts sRGB to linear through Three.Color. Visible paper cores retain diffusion gradients and shared fiber maps, with less hue drift between lamps and house. Stone albedo and roughness, interior timber and plaster were adjusted to accept local light. Existing mineral ground microdetail remains unchanged.

Seven full garden practicals now prioritize all five path fixtures plus two perimeter lamps; the eight other fixtures use stronger finite, normal-aware diffuse transport (range 1.65–2.0). This is an unoccluded analytic approximation, not extra Three Lights or ray-traced GI. Ground bounce is still a weak supplementary receiver term. Cold space remains between finite pools.

House aura: 24 static occupied paper faces supply bounded, one-sided local irradiance to existing timber, sills, foundations and soffits. The kernel uses actual paper rectangles, receiver normals, finite 1.35 m support and a small indirect term. Moving entry paper is excluded; the existing shadowed hall controls the doorway/landing/stairs. No extra window meshes, textures or per-window full lights. This transfer does not resolve arbitrary occluders and is not physical area-light integration; close artistic inspection of adjacent framing remains necessary. Visible window emission/glow now shares the practical palette, with unchanged global exposure/tone mapping and no postprocessing.

## Selective shadows and performance

Four active shadow lights: moon 2048, hall 1024, pendant 512 and foreground path lantern 512. No PointLight shadows. The interior map migrated from the floor andon to the suspended source; the andon retains a short local point and the pendant has a small upper diffusion point. Total scene lights 23 -> 25 (garden subtree 20 -> 22). No shadows on the ten compact fixtures or four wall lamps.

Maps are reused, not reallocated. Foreground lantern map remains cached through door travel and invalidates only on layout changes. Full layout refresh adds 117 calls / 266548 triangles; baseline refresh added 97 / 192772. Moving doors do not pay the extra foreground map pass. Casters 37 -> 37; receivers 59 -> 61. Additional 512 color/depth map pair is approximately 2 MiB excluding driver overhead. Shadow bias/normalBias stay small and world-space bounds remain fixed.

## BEFORE → AFTER

Same host, headless Chrome, desktop 1440x900 / tablet 820x1180 / portrait 390x844. Table counts use cached shadows; resource inventory is measured after warmup, not peak total memory.

| Profile / point | Draw calls | Triangles |
| --- | --- | --- |
| desktop / garden | 79 → 81 | 304908 → 313884 |
| desktop / threshold | 68 → 70 | 236324 → 245300 |
| desktop / interior | 51 → 53 | 103800 → 110856 |
| tablet / garden | 78 → 80 | 262891 → 271867 |
| tablet / threshold | 62 → 64 | 180510 → 189486 |
| tablet / interior | 49 → 51 | 99270 → 106326 |
| portrait / garden | 73 → 75 | 225713 → 234689 |
| portrait / threshold | 64 → 66 | 178189 → 187165 |
| portrait / interior | 43 → 45 | 90012 → 97068 |

Resources: geometries 66 → 68; textures 39 → 41; warmed programs 45 → 50; scene lights 23 → 25; shadow lights 3 → 4. Textures increase solely for the new shadow render target; procedural surface maps remain shared.

Warmed synchronized FPS: 75 → 75 in both garden and interior for desktop, tablet and portrait. No appreciable loss in this local synchronized test. It hits a synchronization ceiling and does not establish GPU headroom or physical mobile performance. Initial cold samples vary substantially in both revisions and are retained in raw reports rather than presented as a reliable regression statistic.

## Validation and limits

PASS npm run build; PASS git diff --check; Vite's existing large-chunk advisory remains (882.75 kB JS, 249.79 kB gzip). No dependencies added.

PASS scripts/verify-premium-frozen.cjs: 87 files byte-equivalent after newline normalization, including camera paths, scroll/ownership, main, sky/moon, atmosphere, terrain, architecture and layouts. All 15 lantern anchors unchanged. Endpoint/target/FOV and path lengths match the approved interior baselines in all profiles.

PASS scripts/validate-premium-practicals.cjs: desktop/tablet/portrait, forward/reverse, native scroll, repeated resize, native reduced motion, hidden/resume, bfcache, ownership, double disposal and map reuse. Zero captured JS/shader console errors; WebGL error 0. 605/605/484 enclosure rays without leaks and 112 floor support samples per profile. New checks cover source-in-chamber positions, full shade framing, path clearance, fixture ownership and unobstructed foreground source-to-path / hall-to-landing rays. Ray visibility is a geometric test, not a proof of radiometric accuracy everywhere.

World cleanup: 0 geometries, 0 programs, 4 retained textures matching the pre-existing lifecycle baseline, callbacks stopped. Fixture probes dispose their own geometry/material/instance resources once; borrowed shared maps remain under reference-counted ownership.

No screenshots, galleries, contact sheets or videos were produced. Perceived premium finish, shadow acne/peter-panning, motion shimmer, paper highlight clipping under unchanged NoToneMapping, and subtle unshadowed spill still need manual visual approval. No Phase 2.4, camera change, push or PR.

Reproduce with Vite on 127.0.0.1:5174 and the existing external Playwright installation: set NODE_PATH to the review-tools node_modules, LIGHTING_STAGE=after, then node scripts/validate-premium-practicals.cjs. Reports: scripts/lantern-premium-baseline.json and scripts/lantern-premium-after.json. Tests inspect numeric runtime state only.

## Complete changed-file inventory

```text
A	docs/phase-2-3-premium-practicals.md
A	scripts/lantern-premium-after.json
A	scripts/lantern-premium-baseline.json
A	scripts/validate-premium-luminaires-runtime.cjs
A	scripts/validate-premium-practicals.cjs
A	scripts/validate-premium-shadow-runtime.cjs
A	scripts/verify-premium-frozen.cjs
M	src/world/nightGarden/GardenLanternGeometry.ts
M	src/world/nightGarden/GardenLanternIrradiance.ts
M	src/world/nightGarden/GardenLanternMaterials.ts
M	src/world/nightGarden/GardenLanternNetwork.ts
M	src/world/nightGarden/GardenLanterns.ts
M	src/world/nightGarden/GardenPavilion.ts
M	src/world/nightGarden/GardenPavilionGlow.ts
M	src/world/nightGarden/GardenPavilionLighting.ts
M	src/world/nightGarden/GardenPavilionOccupancy.ts
M	src/world/nightGarden/GardenPavilionSource.ts
M	src/world/nightGarden/GardenPracticalBounce.ts
M	src/world/nightGarden/GardenShadowSettings.ts
M	src/world/nightGarden/GardenShadows.ts
M	src/world/nightGarden/GardenWallLanterns.ts
A	src/world/nightGarden/GardenWindowIrradiance.ts
M	src/world/nightGarden/GenkanInterior.ts
M	src/world/nightGarden/GenkanInteriorLighting.ts
M	src/world/nightGarden/GenkanInteriorMaterials.ts
A	src/world/nightGarden/GenkanPendant.ts
A	src/world/nightGarden/PracticalLightPalette.ts
```

## Commits in order

```text
8a653ba docs: audit lantern refinement and record current numeric baseline
09da2ff refactor: define one color-managed practical light family
29c8524 feat: sculpt taller stone path lanterns with recessed lattice chambers
ff838e1 feat: rebuild compact garden lanterns as low stone toro
6ee0163 feat: refine stone response and diffuse warm paper cores
a17a7b0 fix: prioritize path sources and restore bounded secondary light pools
8d070a7 feat: detail shielded rectangular wall lanterns at existing mounting bays
62aa73a feat: suspend ribbed round washi pendant within the existing genkan
490fb8f feat: anchor interior shadow and ceiling response to the pendant
53493a1 feat: align shoji house spills and interior finishes with warm paper lighting
cf92d9d fix: retain typed source exclusion after path light reassignment
769beae feat: derive bounded frame and sill irradiance from occupied shoji
04c885b feat: add one cached foreground lantern shadow without point shadow maps
d5e7df2 fix: preserve path clearance while increasing stone lantern height
03f7172 fix: fit the complete pendant shade within frozen portrait framing
513be5c perf: keep foreground lantern shadows cached during door travel
0535984 fix: recess wall practical sources inside their paper chambers
72086e0 test: verify full shade framing practical ownership frozen systems and runtime budgets
```

The final documentation commit follows this list; its exact hash is reported in the delivery message (self-hashing a committed file is impossible). The two original reference PNGs remain untracked and untouched.
