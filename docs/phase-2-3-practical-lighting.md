# Phase 2.3 practical lighting audit

Start: phase-2-3-genkan-interior-architecture, fa2c8ba1c7cdf282e267ae0b5665cfef03de3a27. Clean index/worktree; no untracked files. All 23 Phase 2.3 commits from 7aa13b8 through fa2c8ba retained (git log e0d49f2..fa2c8ba).

Audited Renderer, GardenLighting, PavilionLighting/Glow/Materials/MaterialPalette/Source, PracticalBounce/Containment, LanternNetwork/Lanterns/LanternMaterials, GardenMaterials and all GenkanInterior modules.

Renderer: sRGB, NoToneMapping, exposure 1, shadows disabled, default PCF. Installed Three r186 has removed PCFSoftShadowMap; use PCFShadowMap. No postprocessing planned.

Scene: 21 lights, no casters or receivers. Garden rig: hemisphere + 2 directional, 7 point practicals, 2 pavilion spots + 2 pavilion points, 4 interior spots. Remaining 3 lights belong to earlier worlds. Hall source z=4.5 is outside doorway z=-.10; lantern sources y=.65-.85 exceed scaled paper center (.62 * scale). Paper emission 1.35 and halo .16 compete with real consequence. Terrain bounce includes strong .50-.90 cores at fixtures without lights; this is not occluded indirect transport. Interior side paper has no exterior opening; remove it and its symmetric fills.

Budget: one directional + two architectural spots, zero point shadows. A point shadow requires six views; no justified benefit without visual evidence. Major opaque geometry only. Cache maps between door/layout changes. Small shared procedural maps for wood, plaster, paper and tataki; retain existing terrain microdetail.

Baseline measured headless Chrome, same machine, 1440x900 / 820x1180 / 390x844 (viewport emulation, not physical devices). Calls/triangles garden, threshold, interior:
- Desktop: 79/306528, 68/237944, 50/104304; sampled FPS 90/76/76.
- Tablet: 78/264511, 62/182130, 49/100030; sampled FPS 82/77/76.
- Portrait: 73/227333, 64/179809, 45/91228; sampled FPS 78/76/76.
All: 62 geometries, 25 textures, 26 programs, GL error 0. FPS is a short synchronized headless sample, not a hardware guarantee.

No screenshots, videos, external assets, camera edits, atmosphere edits, push or Phase 2.4.

## Implemented lighting and shadow architecture

Renderer now enables PCFShadowMap (r186 hardware PCF with disk sampling), radius 2. sRGB, NoToneMapping and exposure 1 are unchanged. No composer, AO, bloom, grading or extra dependencies.

Moon direction and intensity 1.85 are unchanged. Light/target translate together to center the finite shadow volume on the garden. Fixed world-space camera: left/right -32/24, bottom/top -25/25, near/far .5/85; 2048 square; bias -.00012, normalBias .025. Mansion AABB projects entirely inside the volume (x -.920..+.310, y -.258..+.919, z -.587..+.279). No camera-following fit. This verifies bounds, not visual absence of acne.

Hall source moves from local (0,4.8,4.5) to (0,4.72,-1.15), behind the physical doorway. Target (0,2.25,6.3), distance 12 to reach the outer stairs, angle .74, penumbra .9, decay 2, unchanged intensity 21.5. The long range is a cutoff, not uniform illumination: inverse-square falloff remains active. Raycast confirms the open doorway has an unobstructed path to the landing. Shadow 1024 square, near/far .15/12, bias -.00008, normalBias .008. Upper spill becomes a shorter, weaker secondary source (range 3.5, intensity 4); threshold/landing points reduce to 2.4/2.2 intensity with range 2.4/3.2, without shadows.

Seven garden PointLights retained, zero shadow-casting PointLights. Sources now sit at each actual paper chamber center, .62 * fixture scale, instead of floating .65-.85 above ground. Ranges shrink to 2.4-2.8; intensities unchanged. Paper emission 1.35 -> .62, halo .16 -> .035. Mansion source emission warm/dim/entry .52/.28/.78 -> .34/.18/.44; glow contribution multiplied by .25. Terrain bounce radii shrink to 1.15-1.5 and total contribution to 12% of its previous value. This remains an analytic, unoccluded indirect approximation, not physical GI. Fixtures without real lights intentionally have only a faint secondary bounce.

Interior four spots become two asymmetrical practicals: one floor andon (intensity 1.2, range 3.8, angle 1.18, penumbra .95, decay 2) and a small integrated display lamp (1.6, range 2.05, angle .73, penumbra 1). Only the andon casts: 512 square, near/far .08/3.8, bias -.00008, normalBias .004. Its light, timber enclosure and paper have the same position. Lamp paper emission .65 -> .30. The display light is secondary and unshadowed.

All 3 maps are static between door or layout changes; no idle depth rendering. Door movement invalidates them in either direction. Resize invalidates after geometry placement. Each light disposes its render target. An explicitly owned MeshDepthMaterial releases depth shader programs on world disposal.

## Interior decor and material response

Removed both lateral luminous paper windows and their symmetric light sources. Retained exterior walls and rear shoji. Left: recessed plaster backing, projecting timber frame/shelf, unlit hanging scroll with a minimal branch mark, integrated shielded lamp. Right: restrained low timber cabinet, supported on four feet; no armor or hero display.

Rebuilt the ikebana as three independent asymmetrical stems, three ivory flowers, and a broad low stoneware vessel on the left shelf. Replaced paired cubes with one slender floor andon and the small mounted lamp. New objects stay outside the central camera route. Portrait intentionally keeps the identical architecture; side accents are not guaranteed to be in the narrow final frame.

ArchitecturalMicrodetail shares eight deterministic 128x128 textures: color multiplier plus packed height/roughness for wood, plaster, paper and stone. Opaque standard materials retain actual light response; paper also uses restrained emissive texture modulation. Primary timber, trim and floor keep distinct colors/roughness (.83/.70/.66 inside); exterior palette values remain unchanged. Bump is subtle (.012 wood, .009 plaster, .006 paper, .025 mineral). Existing GardenMaterials terrain/mineral shader and textures remain intact. Reference counting avoids duplicate textures and releases them when the last material owner disposes. Box UVs give restrained grain, not a full physically scaled timber scan.

## Casters and receivers

35 caster meshes/batches; 56 receiver meshes/batches (not individual instance counts). Explicit allowlist includes major pavilion roofs/structure/deck/foundation/interior volumes, interior timber/plaster/floors, hero rock batches, trained pine wood/crowns, lantern frames/plinths/caps and boundary architecture. Ground, rake relief, path, timber and other relevant opaque architecture receive. Paper, glow, sky, moon, haze, hybrid cards, blossoms, small shrub/understory FX do not cast. Existing material batches also contain small joinery: this pass does not split them into extra draw calls just to exclude each minor instance.

Shadow budget is identical on desktop/tablet/portrait: 1 directional + 2 spots, no hero point shadows. No new responsive lighting rig or quality tier. Shadow map color+depth storage is approximately 42 MiB, plus about .67 MiB for the procedural maps including mip levels; driver overhead is not measured.

## Numeric performance

Measured in headless Chrome on the same host, viewports 1440x900, 820x1180, 390x844. These are viewport profiles, not physical tablet/phone benchmarks. Counts below use cached shadows. A refresh adds 94 calls and 191784 triangles for the three maps, independent of profile in this scene.

| Profile / point | Calls before -> after | Triangles before -> after | Calls with shadow refresh |
| --- | --- | --- | --- |
| Desktop garden | 79 -> 80 | 306528 -> 306024 | 174 |
| Desktop threshold | 68 -> 69 | 237944 -> 237440 | 163 |
| Desktop interior | 50 -> 51 | 104304 -> 103800 | 145 |
| Tablet garden | 78 -> 79 | 264511 -> 264007 | 173 |
| Tablet threshold | 62 -> 63 | 182130 -> 181626 | 157 |
| Tablet interior | 49 -> 49 | 100030 -> 99270 | 143 |
| Portrait garden | 73 -> 74 | 227333 -> 226829 | 168 |
| Portrait threshold | 64 -> 65 | 179809 -> 179305 | 159 |
| Portrait interior | 45 -> 43 | 91228 -> 90012 | 137 |

Resources: textures 25 -> 39 (8 surface maps + 6 shadow color/depth textures); warmed programs 26 -> 45; geometries 62 -> 62 at the measured points. Lights 21 -> 19; shadow lights 0 -> 3; casters 0 -> 35; receivers 0 -> 56. First garden sampling has 38 programs before later pose variants warm to 45. Repeated resize/traversal stabilizes at 58 geometries, 39 textures and 45 programs in the lifecycle sampling sequence.

## Technical validation and limitations

npm run build PASS. git diff --check PASS. Vite retains its large-bundle advisory (873.79 kB JS, 247.15 kB gzip); no dependency or pipeline expansion.

Numeric browser validation: zero JS/GLSL console errors, zero WebGL error, forward/reverse traversal, repeated native scroll, reduced motion, resize stability, visibility pause/resume, bfcache pause/resume. Endpoint, target, FOV and traversal length match approved baselines for all three layouts. Interior clearance .635/.637/.641 exceeds near-plane envelope .127/.112/.110; 605/605/484 enclosure rays have zero leaks; 112 floor support samples per profile pass. These are geometry enclosure checks, not proof that every unshadowed fill has zero radiometric leak.

After world disposal: geometries 0, programs 0, textures 4 (same retained baseline); double disposal succeeds and frame/scroll callbacks stop. All three shadow targets are reused through traversal, not reallocated. New material owners release their maps. Existing camera/scroll/terrain/vegetation/path/mansion geometry/moon/sky/atmosphere source files have zero diff from fa2c8ba.

No screenshots or visual artifacts were produced, as requested. Artistic approval, shadow acne, peter-panning, perceived softness, temporal shimmer and subtle light leaks still require manual visual review; numeric checks cannot honestly certify those. Exterior geometry and choreography are frozen; intended lighting/material differences mean pixel-identical exterior appearance is not a goal or a claimed result.

## Tone mapping audit only

NoToneMapping preserves approved painted values but can clip sufficiently bright linear light. The installed ACES operator applies a color transform and fitted film response (including its exposure / .6 scale); it would alter contrast and saturation. AgX adds gamut conversion and highlight compression, also affecting approved hues/contrast. Neutral compresses bright values with less midrange alteration but still changes highlights and saturation. None was enabled or visually approved. Evaluate a scene-by-scene render pipeline in a future phase before adopting any global operator, including checks on Shanshui, Moon Gate, sky, pearl moon and mansion sources.

## Reproduction

Use existing Vite on 5174 and external Playwright (no package dependency added). Run scripts/validate-practical-lighting.cjs with LIGHTING_STAGE=after. For a historical measurement without checkout changes, use LIGHTING_STAGE=before and LIGHTING_BASELINE_REF=fa2c8ba; the harness serves transpiled historical modules only to its own browser. Reports are compact numeric files in the system temporary directory. Historical refinement tests retain their old decor assumptions; this pass uses the new shadow validator and the general interior/lifecycle validators.

Warmed FPS comparison: 75 -> 75 for garden and interior in all three profiles, using 20 warmup frames plus 60 measured frames per point after revisiting every layout. Both versions hit the environment synchronization ceiling; this does not establish maximum GPU throughput or guarantee physical mobile performance. The historical rerun reproduces the original calls/triangles/resources exactly. Initial short samples varied widely (including on the unchanged historical code) and are not used as a performance regression claim.

## Files created/modified

- A — docs/phase-2-3-practical-lighting.md
- A — scripts/practical-lighting-baseline.json
- M — scripts/validate-genkan-interior-runtime.cjs
- A — scripts/validate-practical-lighting.cjs
- A — scripts/validate-practical-shadow-runtime.cjs
- M — src/core/Renderer.ts
- A — src/world/nightGarden/ArchitecturalMicrodetail.ts
- M — src/world/nightGarden/GardenLanternNetwork.ts
- M — src/world/nightGarden/GardenLanterns.ts
- M — src/world/nightGarden/GardenLighting.ts
- M — src/world/nightGarden/GardenPavilionGlow.ts
- M — src/world/nightGarden/GardenPavilionLighting.ts
- M — src/world/nightGarden/GardenPavilionMaterials.ts
- M — src/world/nightGarden/GardenPavilionOccupancy.ts
- M — src/world/nightGarden/GardenPracticalBounce.ts
- A — src/world/nightGarden/GardenShadowSettings.ts
- A — src/world/nightGarden/GardenShadows.ts
- M — src/world/nightGarden/GenkanInterior.ts
- A — src/world/nightGarden/GenkanInteriorDisplay.ts
- M — src/world/nightGarden/GenkanInteriorFlowers.ts
- M — src/world/nightGarden/GenkanInteriorLanterns.ts
- M — src/world/nightGarden/GenkanInteriorLighting.ts
- M — src/world/nightGarden/GenkanInteriorMaterials.ts
- M — src/world/nightGarden/GenkanInteriorPanels.ts
- M — src/world/nightGarden/NightGarden.ts

## Preserved Phase 2.3 history (23 commits)

- 7aa13b8 docs: add approved Phase 2.3 genkan art direction reference
- bf89f3f docs: audit physical genkan interior volume
- fa08762 refactor: centralize audited genkan interior dimensions
- f5c2ef0 feat: establish shared interior materials and static geometry ownership
- cc5c132 feat: build mineral genkan floor and supported agarikamachi platform
- b707f20 feat: enclose the audited interior with plaster skins and a recessed ceiling
- df0e899 feat: replace the threshold room blocker with owned physical interior
- dec595b feat: seat interior posts and hierarchical ceiling beams
- d2c4586 feat: frame the future residence with static shoji and warm infill
- dd690f0 feat: motivate restrained interior warmth with two architectural paper spills
- 133688d feat: append interior scroll space without compressing the approved threshold
- 7d565fb feat: derive interior traversal and portrait framing from the physical threshold
- 9387e19 feat: hand camera ownership to the interior while keeping shoji fully open
- 9fcb9a1 fix: keep mineral foreground and rear header inside the final camera frame
- 5a26f89 fix: support the raised genkan floor on the existing hall foundation
- 9286223 test: validate genkan interior traversal enclosure and resource lifecycle
- 5f718fe docs: close phase 2.3 with architectural metrics and validation limits
- 6ee3f2f feat: add a restrained side ikebana in a stoneware vessel
- 9460564 feat: seat paired low paper lanterns beside the genkan step
- 4c89365 feat: add short warm practical spills at the interior step
- 0440274 fix: improve tablet accent framing without moving the approved camera
- 0d309df test: verify refinement placement budgets and resource ownership
- fa2c8ba docs: record genkan refinement metrics and framing limitations

## Commits in this pass

- a187e52 docs: audit practical lighting and capture numeric baseline
- 4ecf4a2 feat: enable bounded selective PCF shadow infrastructure
- e987b44 feat: classify major shadow surfaces and cache moon depth maps
- 622d95b feat: cast doorway shadows from a physically interior hall spill
- 6f4de82 fix: seat lantern sources inside paper and shorten practical pools
- c1d96e5 refactor: restrain terrain bounce to a small indirect contribution
- b2712c9 fix: contain shoji emission and architectural glow
- 64ba7b5 feat: share restrained procedural timber paper plaster and mineral finishes
- 5c130d3 feat: replace false side windows with recessed scroll and timber cabinet
- 0f27552 feat: rebuild ikebana as three asymmetric stems in low stoneware
- 031522d feat: establish one andon and a shielded display light with local shadows
- fd095d0 fix: explicitly own and dispose selective shadow depth materials
- 401a6d2 fix: cover mansion shadow bounds and reach the physical entry stairs
- b8d3f3b fix: seat cabinet feet and anchor the display lamp to plaster
- 4d3c279 test: validate shadow budgets bounds traversal and GPU resource lifecycle
- 5223d04 test: compare warmed rendering against the original lighting revision
- Final documentation commit: docs: record selective lighting metrics and review limitations

17 atomic commits including this documentation closeout. No squash, rebase, PR, push, screenshots, videos, review galleries or Phase 2.4. Final HEAD is the documentation commit recorded by git log. Manual artistic review is the next step.
