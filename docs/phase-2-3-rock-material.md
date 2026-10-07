# Phase 2.3 — rock material realism

Baseline: 79c7f45f62d5d1bb78a9878076da3f09364deedb, branch phase-2-3-genkan-interior-architecture; initially clean.

## Audit
GardenRocks supplies unchanged flat/rounded/upright meshes, per-vertex tones and per-instance colors. GardenLateralDepth borrows the same material for companion stones. Neither geometry owner will change.

GardenMaterials creates four 256-square RGBA maps per surface. Rock height used noise at 2.1, 6.4 and 19 cycles/tile; albedo derived mainly from height; roughness used 5.5 cycles/tile. Central differences generate a normal map (strength 1.05), but the rock shader never sampled it or the height map. Only color and roughness uploaded. Color was reduced to luminance; roughness was compressed through 0.92*(0.98+map*0.06-top*0.025). Relief instead used shared GardenSurfaceDetail noise at 4.14/15.66/55.8 world frequencies with amplitude 0.055. Broad top-facing moss used one 2.2-frequency field. Repeat-wrapped maps were not periodic, risking borders.

GardenShadows selects archetype rocks as casters and receivers, companions as receivers. Shared containment/irradiance hooks remain composed; no light, shadow map or ownership edits.

## Direction
Original procedural mineral patches, eroded seams and fine pores, matte local roughness, restrained base dampening and sparse moss. Keep vertex/instance colors as the large-scale hierarchy. Preserve every geometry, transform and light. No external maps or code. Seijaku is a conceptual reference only; its implementation is not being reproduced.

## Implemented surface
- Original periodic, quintic-interpolated mineral fields: 3 cycles/tile broad mineral, 4 domain warp, 5 warm/cool tint, 7 mineral regions, 17 erosion/seams, 61 grain/pores. At .75 tiles/world-unit these resolve to 2.25/3/3.75/5.25/12.75/45.75 cycles per world unit. Separate nonperiodic world macro (.53 horizontal, .19 vertical) breaks uniform repetition.
- RGB mineral albedo now retains its blue-grey/chromatic information instead of becoming a scalar. Existing vertex/instance tones and the original base material color remain. Sparse seam and pore darkening stays subordinate.
- Existing 256x256 normal texture is now sampled. Central differences use generation strength 6.0; shader gradient strength .55. Canvas Y orientation is corrected only for rocks. World-axis slope reconstruction and tangent-plane projection preserve negative faces and nonuniform instances; mipmaps filter distant pores. No vertex displacement. Normal single-projection tilt measured mean 2.476 degrees, maximum 14.427 degrees; blending generally reduces this further.
- Roughness map measured .8471–.9569. Final damp/moss-adjusted factor clamped .82–.97 before Three.js geometric specular antialiasing. Metalness stays zero; no emissive light added.
- Base dampening is at most 16% albedo reduction / .035 roughness reduction, with a noisy .10–.46 world-unit transition above buried instance origins. This is a soft contact approximation, not an exact terrain-distance or cavity solution.
- Sparse moss combines two unrelated world fields, top-facing shelter and base dampness. It modulates the existing stone rather than painting an opaque green layer; matte response approaches .97.
- Same owner, same four allocated maps, same disposal path; sample generation is evaluated once per texel. Only one previously unused normal map is additionally uploaded. No new dependency, geometry, light, shadow map, mesh, animation or runtime update work.

## Reference and review boundaries
The public [Seijaku listing](https://threeui.com/landing-pages/seijaku-landing-page) identifies the cinematic residence/garden and material-study context. Its accessible text does not expose sufficient material detail to verify its rock rendering. The implementation uses the user's specified conceptual principles; no Seijaku assets, textures or implementation were downloaded/copied. This is not a claim of matching its shader.

No captures, video or image files were generated. Numeric WebGL validation is not a manual visual review. Foreground/midground appearance under moon/practicals, subtle texture repetition, moss placement and the final artistic result remain pending live visual review. Periodic boundaries and restrained normal magnitudes are checked mathematically; perceptual seam/noise absence is not claimed as visually approved.

## Resource accounting
Rock maps remain four 256x256 RGBA8 canvases (color, height, roughness, normal); 0 newly allocated maps. Uploaded rock maps: 2 → 3. Approximate resident rock texture memory including full mip chains: 0.667 → 1.000 MiB (+0.333 MiB), excluding driver overhead. CPU canvas pixel storage remains approximately 1 MiB. The existing height canvas stays unuploaded. Programs do not increase; the shader uses 9 triplanar texture reads instead of 6, replacing the old analytic relief field. This is a small fragment-shader cost, not zero-cost detail.

## Reproduce
With the existing external Playwright installation on NODE_PATH, run validate-premium-practicals.cjs with LIGHTING_TORO_AUDIT=1, LIGHTING_STAGE=after and LIGHTING_REPORT_PREFIX=ai-hen-rock-final-. No screenshots are taken. verify-rock-material.cjs checks periodic map boundaries, normal tilt, roughness, disposal, other surface pixels and every protected source file against 79c7f45. compare-rock-material.cjs checks the two saved runtime reports including all shadow-refresh budgets.

## Final measured budgets

| Layout / pose | Calls before → after | Triangles before → after | Shadow-refresh triangles before → after |
| --- | --- | --- | --- |
| desktop / reveal | 87 → 87 | 324192 → 324192 | 604180 → 604180 |
| desktop / garden | 83 → 83 | 316692 → 316692 | 596680 → 596680 |
| desktop / threshold | 70 → 70 | 245300 → 245300 | 525288 → 525288 |
| desktop / interior | 53 → 53 | 110856 → 110856 | 390844 → 390844 |
| tablet / reveal | 84 → 84 | 279701 → 279701 | 559689 → 559689 |
| tablet / garden | 82 → 82 | 273739 → 273739 | 553727 → 553727 |
| tablet / threshold | 64 → 64 | 189486 → 189486 | 469474 → 469474 |
| tablet / interior | 51 → 51 | 106326 → 106326 | 386314 → 386314 |
| portrait / reveal | 81 → 81 | 220489 → 220489 | 500477 → 500477 |
| portrait / garden | 77 → 77 | 235931 → 235931 | 515919 → 515919 |
| portrait / threshold | 66 → 66 | 187165 → 187165 | 467153 → 467153 |
| portrait / interior | 45 → 45 | 97068 → 97068 | 377056 → 377056 |

Across all layouts: geometries 70 → 70; textures 41 → 42; warmed programs 52 → 52 (first desktop reveal 46 → 46); lights 25 → 25; shadow lights 4 → 4; casters 37 → 37; receivers 63 → 63. Shadow sizes remain 2048/1024/512/512.

## Validation results
- npm run build: PASS (existing >500kB bundle warning remains).
- git diff 79c7f45 --check and git diff --check: PASS.
- Numeric Chrome WebGL: desktop 1440x900, tablet 820x1180, portrait 390x844; four poses each plus shadow refresh: PASS, zero console/page/shader/WebGL errors. These are viewport simulations, not physical mobile GPU tests.
- Native forward/reverse scroll with and without reduced motion, four resize cycles, hidden/visible pause, bfcache, repeated disposal: PASS.
- Cleanup: 0 geometries, 0 programs, existing 4 retained renderer textures; no extra retained normal texture. CPU disposal listeners confirm all 16 shared surface maps disposed.
- Camera poses, shadow inventory, source containment, path clearance and protected source files unchanged. 116 protected files match the initial commit, including geometry generation, placements, camera, routes, timing, ownership, mansion, lanterns, leaves, Moon Gate and sky/moon.
- Other surface maps are byte-identical. Periodic edge error <1.5e-13. No displacement/silhouette changes.
- Local warmed garden/interior FPS before: desktop 66/71, tablet 75/75, portrait 75/75; after: 75/75 for all. Short, refresh-limited local samples do not establish a performance improvement or mobile guarantee.

## Changed files
Production: GardenMaterials.ts (modified), GardenRockMineral.ts and GardenRockSurface.ts (new). Validation: scripts/verify-rock-material.cjs, scripts/compare-rock-material.cjs, scripts/rock-material-before.json, scripts/rock-material-after.json (new). Documentation: this file (new). GardenRocks.ts, GardenSurfaceDetail.ts, GardenLateralDepth.ts and GardenShadows.ts were audited and remain unchanged.

Phase 2.3 only. No screenshots/videos. No PR. No push performed.
