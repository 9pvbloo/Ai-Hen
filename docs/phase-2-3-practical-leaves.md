# Phase 2.3 — richer practicals and restrained leaf detail

Start HEAD d18d1ca5ecadd4cd04c84ebdce9217860505bdb2, branch phase-2-3-genkan-interior-architecture, clean worktree. Threejs skill applies.

Audit: previous warmth pass reduced practical RGB luminance while preserving full-light scalar intensities. This explains why warmer color alone can still feel weak. Refine source energy locally, not global exposure: keep all ranges, positions, shadow maps, moon/sky and camera choreography fixed. House aura stays tied to occupied paper and bounded frame transfer.

Leaves: add original low-poly folded leaf geometry and an opaque standard material, two instanced batches, no textures or shadow casters. Deterministic clusters near planted banks/trees, with route, forecourt, wall and lantern exclusion. Ground instances seat on terrain slopes. Few airborne instances move from the existing update loop; cap delta, pause while hidden/outside garden, and freeze for reduced motion. Responsive density: desktop/tablet/portrait, stable subsets and no allocation on resize.

No Phase 2.4, main architecture/layout/stepping stone changes, capture/media, push or PR. Validation is numeric; artistic approval remains manual.

## Implemented practical lighting

The previous pass warmed RGB but reduced source luminance while keeping scalar power fixed. This pass adds controlled local energy: main path lights gain approximately 33–36%, perimeter lights 32%, wall lights 27%, and diffuse secondary transport 33%. Their source positions, cutoff ranges, inverse-square decay and four selective shadow maps stay fixed. Ground bounce remains a subordinate term (.12 -> .15).

Palette source #edbd7e -> #f2b465, paper #efc58e -> #f5c181, bounce #c99c66 -> #d5a168 and dim #dfb37e -> #e5b477. Amber is more chromatic; global night, moon, renderer exposure and tone mapping are unchanged. Paper reflectance #d9c5a4 -> #d0ba95 reduces cold reflected whitening while source diffusion gradients remain. Garden/wall emission .82/.68 -> .94/.80. Halo strength is unchanged.

House: hall spill 21.5 -> 25.5, upper spill 4 -> 4.8, inner threshold 2.4 -> 2.9 and covered landing 2.2 -> 2.6. Occupied warm/dim/entry paper emission .40/.19/.48 -> .50/.23/.58. The existing 24 window rectangles increase bounded frame transfer weights .46/.20 -> .58/.25 and cap .65 -> .75, without widening the 1.35 m support. Existing depth-tested shoji glow multiplier .25 -> .32, still tied to paper faces and moving door offsets. No extra glow mesh or bloom pass.

Interior: pendant 4.2 -> 4.9, display 1.6 -> 1.8, andon .42 -> .49, upper diffusion .55 -> .62; lamp paper .64 -> .74. No fixture, architectural, camera or shadow-position changes.

## Leaf architecture

Five isolated modules: original folded leaf geometry (18 triangles), deterministic composition, terrain-seated ground instances, bounded airborne motion, and a shared-resource owner. A narrow blade with raised midrib, tapered outline and short stem uses muted ochre/brown/olive instance colors and one opaque double-sided MeshStandardMaterial. No copied assets/code, texture, transparent particle card, emitter light or leaf shadow caster.

Density ground/air: desktop 144/12, tablet 96/8, portrait 64/5. Ground placement uses authored lateral pockets, the existing planted-ground mask, a 2 m route exclusion, wall inset and fixture exclusion. Actual minimum ground-center distance to the approved route is >4.34 m in the measured profiles. Leaves follow the terrain normal and every blade vertex is seated >=.006 m above the terrain; maximum measured blade clearance <.031 m. Natural overlap or occlusion by existing rocks/understory is possible; the leaf layer does not move those objects or simulate settling against arbitrary meshes.

Air motion has 24–36 second fall cycles over 3 m, lateral drift capped at .28/.20 m and slow tumble. A smooth size envelope hides wrap endpoints, without alpha overdraw. Static conservative bounds enclose all animated vertices. A single existing garden update advances at most 12 CPU matrices, with no per-frame allocation, independent RAF, timer, event listener or terrain resampling. Ground matrices change only on layout. Both batches share one geometry and one material; responsive counts reuse the buffers.

Reduced motion freezes the current air pose with no matrix uploads. Hidden document, inactive garden and interior traversal pause airborne work; resize preserves its phase. Reverse scroll preserves camera choreography while wind remains an independent ambient clock, not a reversed simulation. Source light/shadow receiver response and physical Moon Gate aperture are composed onto the shared material by the existing systems. Leaves receive existing shadows and never add shadow passes.

## Validation scope and limits

Numeric browser inspection only. No screenshots, galleries, contact sheets or videos generated. The previous visual references were not altered. No Phase 2.4, push or PR.

Artistic approval remains manual: perceived leaf density/readability, local plant occlusion, paper highlight clipping under unchanged NoToneMapping, shadow artifacts and the final warm/cold balance cannot be certified by numeric tests. Window/secondary diffuse transport remains a bounded unoccluded approximation; this pass adds no full GI. Desktop/tablet/portrait are emulated viewports on this host, not physical-device benchmarks.

## BEFORE -> AFTER runtime budgets

| Profile / pose | Calls | Triangles |
| --- | --- | --- |
| desktop / garden | 81 -> 83 | 313884 -> 316692 |
| desktop / threshold | 70 -> 70 | 245300 -> 245300 |
| desktop / interior | 53 -> 53 | 110856 -> 110856 |
| tablet / garden | 80 -> 82 | 271867 -> 273739 |
| tablet / threshold | 64 -> 64 | 189486 -> 189486 |
| tablet / interior | 51 -> 51 | 106326 -> 106326 |
| portrait / garden | 75 -> 77 | 234689 -> 235931 |
| portrait / threshold | 66 -> 66 | 187165 -> 187165 |
| portrait / interior | 45 -> 45 | 97068 -> 97068 |

Resources in all profiles: geometries 68 -> 69, textures 41 -> 41, warmed programs 50 -> 51, scene lights 25 -> 25, shadow maps 4 -> 4. Garden adds two draws and 2808/1872/1242 triangles by profile. At the measured threshold/interior poses leaves are culled/hidden: calls and triangles unchanged. Receivers 61 -> 63, casters 37 -> 37. Full shadow refresh overhead remains 117 calls / 266548 triangles.

Warmed pose FPS BEFORE: {"desktop":{"garden":75,"interior":75},"tablet":{"garden":75,"interior":75},"portrait":{"garden":75,"interior":75}}; AFTER: {"desktop":{"garden":75,"interior":75},"tablet":{"garden":75,"interior":75},"portrait":{"garden":75,"interior":75}}. Explicit animated-leaf update plus one scene render/frame: {"desktop":75,"tablet":75,"portrait":75} FPS. No appreciable regression in these synchronized local samples; the 75 FPS ceiling does not prove unused GPU capacity or physical mobile performance. Cold short samples remain in the JSON and are not used for a speedup claim.

PASS npm run build (888.12 kB JS / 251.56 kB gzip; existing Vite large-chunk advisory), git diff --check, and verify-practical-leaves-frozen.cjs: 92 source/config files unchanged; NightGarden differs only in leaf integration; shadow strategy differs only in allowing leaf receivers. All lantern anchors and protected camera/routes/timing/ownership/stepping-stone source remain unchanged.

PASS desktop/tablet/portrait, forward/reverse, repeated resize, native reduced motion, native scroll, visibility/bfcache, camera handoff and approved endpoint/target/FOV/path lengths. Zero JS/shader console errors and WebGL error 0. Leaf tests verify counts, source sharing, route exclusion, all-vertex terrain support, a complete 36-second motion envelope, finite matrices, culling bounds, reduced-motion upload freeze, hidden/inactive pause, resize phase preservation and idempotent GPU disposal. Existing luminaire, shadow-map reuse, open hall/foreground rays and interior enclosure tests pass.

Whole-world disposal: {"memory":{"geometries":0,"textures":4},"programs":0,"error":0,"stopped":true,"killed":true}. Four retained textures match the established baseline. Leaf probe disposes one geometry, one material and two instance buffers exactly once.

Reproduction: existing external Playwright via NODE_PATH, Vite port 5174, LIGHTING_STAGE=after, LIGHTING_REPORT_PREFIX=ai-hen-leaves-, LIGHTING_LEAF_AUDIT=1; run node scripts/validate-premium-practicals.cjs. Leave LIGHTING_BUDGET_BASELINE unset because this pass intentionally adds leaf draws. Frozen check: node scripts/verify-practical-leaves-frozen.cjs. No dependency added.

## Complete file inventory

```text
A	docs/phase-2-3-practical-leaves.md
A	scripts/practical-leaves-after.json
A	scripts/practical-leaves-before.json
A	scripts/validate-garden-leaves-runtime.cjs
M	scripts/validate-premium-practicals.cjs
A	scripts/verify-practical-leaves-frozen.cjs
A	src/world/nightGarden/GardenAirLeaves.ts
A	src/world/nightGarden/GardenGroundLeaves.ts
M	src/world/nightGarden/GardenLanternIrradiance.ts
M	src/world/nightGarden/GardenLanternMaterials.ts
M	src/world/nightGarden/GardenLanternNetwork.ts
M	src/world/nightGarden/GardenLanterns.ts
A	src/world/nightGarden/GardenLeafComposition.ts
A	src/world/nightGarden/GardenLeafGeometry.ts
A	src/world/nightGarden/GardenLeaves.ts
M	src/world/nightGarden/GardenPavilionGlow.ts
M	src/world/nightGarden/GardenPavilionLighting.ts
M	src/world/nightGarden/GardenPavilionOccupancy.ts
M	src/world/nightGarden/GardenPracticalBounce.ts
M	src/world/nightGarden/GardenShadows.ts
M	src/world/nightGarden/GardenWallLanterns.ts
M	src/world/nightGarden/GardenWindowIrradiance.ts
M	src/world/nightGarden/GenkanInterior.ts
M	src/world/nightGarden/GenkanInteriorLighting.ts
M	src/world/nightGarden/NightGarden.ts
M	src/world/nightGarden/PracticalLightPalette.ts
```

## Commits in order

```text
624e1b7 docs: audit practical energy and scope restrained garden leaves
e808f5d feat: enrich practical amber while preserving cold night separation
08eeb98 feat: strengthen finite lantern pools without expanding light ranges
08c4882 feat: balance richer paper emission against cooler reflected highlights
ee0fcaf feat: reinforce occupied shoji and shadowed threshold spill
ae0d822 feat: enrich near-window aura and frame response within existing bounds
c1023b0 feat: refine genkan pendant warmth and restrained interior bounce
3d1537b feat: author folded leaf geometry with tapered blade and stem
28d7213 feat: place deterministic leaf pockets outside the protected route and rake field
46f6322 feat: seat instanced fallen leaves on terrain slopes with shared finishes
8ae9127 feat: drift sparse airborne leaves with bounded motion and responsive density
5094462 feat: integrate shared leaf resources with aperture lighting and garden lifecycle
1d3ae56 test: validate leaf bounds motion responsive budgets and frozen choreography
946261b test: measure synchronized garden rendering with airborne leaf updates
```

Final documentation commit follows; its exact HEAD is reported in the delivery response. No push or PR.
