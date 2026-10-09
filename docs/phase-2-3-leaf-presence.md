# Phase 2.3 — layered leaf presence

Initial branch: phase-2-3-genkan-interior-architecture. Initial HEAD: 87c61fc43e4b85f2d3d43c850b62a7a237d44ab5. Working tree initially clean.

## Audit and implementation
Previously: one instanced ground mesh, one dynamic air mesh, one shared opaque double-sided MeshStandardMaterial and one 18-triangle folded blade geometry. Ground counts 144/96/64; air 12/8/5. Six isolated air pockets used nearly identical fall/rotation/drift behavior. Ground leaves were scattered uniformly inside eleven approved side pockets. The existing owner already supported reduced motion, visibility, hidden-tab pause and disposal.

Now: three interleaved depth layers across nine air pockets. Loose triplets share broad timing but retain individual position, size, spin and oscillation. Gliding and more direct falling profiles use 22–38 second cycles, varying fall height 3.2–4.4 units, horizontal drift and eased cycle endpoint disappearance. Foreground blade size .30–.42, others .24–.36. Culling bounds include maximum drift, arbitrary blade rotation and hover. No new loop, integration, ownership or allocation inside animation updates.

Ground leaves mix scattered members and tight small groups in the original eleven side pockets, with deterministic 0–.009 unit stacking offsets. Blade scale .19–.30; every blade is supported against the terrain contour. Placement now reserves an eight-point .24-unit perimeter around each candidate, preventing blade extents from crossing the walk, clean gravel center, walls or lantern clearance. More leaves do not mean a broader scatter into protected areas.

Ground colors remain cool blue-grey with a modest luminance lift; shared roughness .93 → .86 permits subdued highlights from existing warm practicals. Folded midrib geometry and opaque surfaces remain unchanged. No textures, emissive glow, new lights or shadow casters. Normal air colors remain unchanged.

| Profile | Ground before → after | Air before → after | Air foreground / middle / background |
| --- | --- | --- | --- |
| Desktop | 144 → 360 | 12 → 60 | 21 / 21 / 18 |
| Tablet | 96 → 240 | 8 → 42 | 15 / 15 / 12 |
| Portrait | 64 → 160 | 5 → 27 | 9 / 9 / 9 |

Counts mean active instances; the frustum, occlusion and eased cycle endpoints affect visible leaves. Composition layers describe authored garden depths, not leaves attached to the camera.

## Budget and limits
Still two instanced leaf draws, one shared geometry/material, zero leaf textures and zero leaf shadow draws. Max instance buffer capacity 156 → 420: approximately +19.6 KiB for matrix/color buffers plus .375 KiB for ground-height cache, excluding JS/driver overhead. Up to 60 transforms per moving frame rather than 12. Reduced motion freezes matrices without uploads; hidden/inactive states stop updates.

No screenshots, galleries or videos were generated. The work is numerically validated; final cinematic appearance from the normal camera remains pending visual review. Responsive tests use desktop Chrome viewport sizes, not physical tablet/phone GPU measurements. Local FPS is refresh-limited and is not a performance guarantee. Build retains the pre-existing >500 kB bundle warning.

An initial complete leaf-cycle run passed, but editing a geometry comment triggered Vite reload during lifecycle validation. The final run is repeated after freezing production files; the comment was restored and leaf geometry is byte-for-byte unchanged.

Production files: GardenLeafComposition.ts, GardenGroundLeaves.ts, GardenAirLeaves.ts, GardenLeaves.ts. Everything outside these four production files is compared to the initial commit by scripts/verify-leaf-presence-frozen.cjs. GardenLeafGeometry.ts remains unchanged.

Validation files: updated scripts/validate-garden-leaves-runtime.cjs; new scripts/verify-leaf-presence-frozen.cjs, scripts/compare-leaf-presence.cjs, scripts/leaf-presence-before.json and scripts/leaf-presence-after.json. This document records the pass.

No Phase 2.4, no push, no PR.

## Final measured BEFORE → AFTER

| Layout / pose | Draw calls | Triangles |
| --- | --- | --- |
| desktop / reveal | 87 → 87 | 324192 → 328944 |
| desktop / garden | 83 → 83 | 316692 → 321444 |
| desktop / threshold | 70 → 70 | 245300 → 245300 |
| desktop / interior | 53 → 53 | 110856 → 110856 |
| tablet / reveal | 84 → 84 | 279701 → 282905 |
| tablet / garden | 82 → 82 | 273739 → 276943 |
| tablet / threshold | 64 → 64 | 189486 → 189486 |
| tablet / interior | 51 → 51 | 106326 → 106326 |
| portrait / reveal | 81 → 81 | 220489 → 222613 |
| portrait / garden | 77 → 77 | 235931 → 238055 |
| portrait / threshold | 66 → 66 | 187165 → 187165 |
| portrait / interior | 45 → 45 | 97068 → 97068 |

All profiles: geometries 70 → 70, textures 42 → 42, warmed programs 52 → 52 (first desktop reveal 46 → 46), lights 25 → 25, shadow lights 4 → 4, casters 37 → 37, receivers 63 → 63. Shadow-refresh triangle deltas equal the main view deltas: no extra shadow rendering of leaves.

Leaf triangles when both instance meshes are submitted: desktop 2808 → 7560, tablet 1872 → 5076, portrait 1242 → 3366. Draw calls remain two for the leaf system. Threshold/interior render budgets remain unchanged because the leaves are culled/inactive in those poses. Local animated-leaf samples: 75 → 75 FPS on all profiles, refresh-limited.

## Final validation
- npm run build: PASS, existing bundle warning only.
- git diff --check and git diff 87c61fc --check: PASS (trailing blank line normalized).
- Desktop 1440x900, tablet 820x1180, portrait 390x844: PASS.
- 80 seconds of simulated motion per profile: both fall styles, all three layers, finite matrices, complete blade culling containment, air blade distance >1.7 from route, ground blade footprint exclusion and terrain support: PASS. Ground center minimum route distance 4.206; terrain gap approximately .006–.0484.
- Reduced motion freezes matrices without uploads; inactive and hidden states pause; resize retains phase: PASS.
- Native forward/reverse, four repeated resize cycles, reduced-motion native scrolling, hidden/visible, bfcache, repeated disposal: PASS.
- Zero detected JS/console/shader/WebGL errors.
- Cleanup: 0 geometries, 0 programs, 4 pre-existing renderer textures retained; exactly one disposal event for each of the 4 leaf-owned/shared resources.
- 115 protected files identical to initial HEAD; camera, routes, timing, ownership, mansion, Moon Gate, sky/moon, rocks, lanterns, stepping stones and the lighting/shadow system remain unchanged.
- scripts/compare-leaf-presence.cjs verifies exact counts and expected leaf-only triangle deltas across all 12 layout/pose combinations and shadow refresh.

Visual review remains pending; no imagery requested or generated. No push performed. No PR.
