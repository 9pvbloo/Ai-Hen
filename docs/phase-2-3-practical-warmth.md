# Phase 2.3 — practical warmth microadjustment

Start: 3cc2ed73d6c1502a0b0fa496f1670a564eb3d470 on phase-2-3-genkan-interior-architecture. Tracked sources clean. The two existing approved lantern reference PNGs are now tracked unchanged so delivery can have a clean worktree.

Audit: all direct practicals already share a palette. Source #f1ce9f and paper emission #f3d6af retain relatively high blue; garden/wall/pendant albedo #d4cbb8 and occupied exterior paper #cfd2cf reflect the cold moon strongly. Source gradients are achromatic. Combined reflected cool light and pale emission can read as beige instead of a warm practical. NoToneMapping can also clip highlights; exposure and renderer remain frozen in this microadjustment.

Intent: reduce blue in the practical family, give paper warm ivory reflectance, make window-to-frame transport slightly more present, and make only small emission compensation. Preserve all full-light intensities/ranges, geometry, positions, camera, scroll, moon, shadow settings and ownership. No bloom, new sources, captures, recordings, push, PR or Phase 2.4.

Fresh baseline: scripts/practical-warmth-before.json. Headless Chrome numeric inspection only, same host, desktop/tablet/portrait. Artistic appearance cannot be certified without manual visual review.

## Applied changes

| Role | Before | After |
| --- | --- | --- |
| Practical source | #f1ce9f | #edbd7e |
| Paper emission | #f3d6af | #efc58e |
| Bounce | #d6b58f | #c99c66 |
| Dim emission | #e5c39a | #dfb37e |
| Lantern/wall/pendant paper reflectance | #d4cbb8 | #d9c5a4 |
| Occupied exterior shoji reflectance | #cfd2cf | #dcc8a8 |
| Recessed interior paper reflectance | #b4a588 | #c7b598 |

All practical lights and existing analytic transport inherit the new color family. No color-temperature-in-Kelvin claim: these are art-directed sRGB values converted by Three.Color, not calibrated spectral emitters. Linear blue/red ratio drops .394 -> .246 for direct source and .478 -> .313 for paper emission. Red remains below full scale; lowering relative blue creates warmer amber without adding saturated orange or a global exposure increase.

Paper emission compensation is small: garden .78 -> .82 (+5.1%), wall .65 -> .68 (+4.6%), interior lamps .62 -> .64 (+3.2%). All full-light scalar intensities, distances, decay, angles, positions and shadow properties remain identical. Warmer RGB has lower luminance: direct palette luminance .653 -> .559, paper .702 -> .602, bounce .493 -> .372. This is deliberately not a luminance-neutral recoloring or a claim of more brightness. The compensation limits loss at visible shades and keeps exterior emitters prominent relative to unchanged house emission scalars (.40/.19/.48). The bounce stays quieter than the source.

Occupied shoji now reflects warm ivory while unoccupied rooms, exterior plaster and the rest of the architecture keep their approved materials. Frame irradiance uses source amber instead of the paler paper color. Warm/dim weights .42/.19 -> .46/.20 retain the same 1.35 m support, normal response, cap .65 and 24 source rectangles. The slight weight change supports local frame response rather than brightening a floating glow plane. Window emission gradients remain intact. Halo opacity, geometry and glow strength are unchanged; they inherit only the new palette. No additional bloom or scattering layers.

## Scope and visual review boundary

The cold moon, sky, camera, timing, route, layouts, all luminaire geometry, source positions, the four-map selective shadow system and the renderer are frozen. The no-media requirement is respected; no screenshots, galleries, contact sheets, videos or image artifacts were generated. The two pre-existing reference images were committed unchanged to clean the worktree.

The warmer chromatic separation is verified in parameters, not visually certified. Manual review should confirm the balance against the cold moon, sufficient exterior lantern presence, and highlight appearance on paper. Existing analytic bounce/window transport remains unoccluded; unchanged NoToneMapping may still clip bright direct highlights. These are existing system limitations, not new lighting or shadow systems.

## Runtime results

| Profile / pose | Calls BEFORE -> AFTER | Triangles BEFORE -> AFTER |
| --- | --- | --- |
| desktop / garden | 81 -> 81 | 313884 -> 313884 |
| desktop / threshold | 70 -> 70 | 245300 -> 245300 |
| desktop / interior | 53 -> 53 | 110856 -> 110856 |
| tablet / garden | 80 -> 80 | 271867 -> 271867 |
| tablet / threshold | 64 -> 64 | 189486 -> 189486 |
| tablet / interior | 51 -> 51 | 106326 -> 106326 |
| portrait / garden | 75 -> 75 | 234689 -> 234689 |
| portrait / threshold | 66 -> 66 | 187165 -> 187165 |
| portrait / interior | 45 -> 45 | 97068 -> 97068 |

All profiles: geometries 68 -> 68, textures 41 -> 41, warmed programs 50 -> 50, scene lights 25 -> 25, shadow lights 4 -> 4. Full shadow refresh counts also match exactly. Renderer configuration, caster/receiver inventory and every shadow setting match the fresh baseline.

Synchronized warm FPS BEFORE: {"desktop":{"garden":73,"interior":75},"tablet":{"garden":75,"interior":75},"portrait":{"garden":75,"interior":75}}; AFTER: {"desktop":{"garden":75,"interior":75},"tablet":{"garden":75,"interior":75},"portrait":{"garden":75,"interior":75}}. No appreciable local regression; 73/75 fluctuations do not establish a speedup. A synchronization ceiling prevents inference about GPU headroom or real mobile devices.

PASS build (existing Vite large-chunk advisory only), diff check and frozen-system audit: 99 source/config files unchanged, coordinator changes limited to emission, all lantern anchors unchanged. PASS desktop/tablet/portrait, forward/reverse, resize cycles, native reduced motion, native scroll, visibility/bfcache pause and resume, camera ownership, fixture and whole-world double disposal. Zero JS/shader errors recorded, WebGL error 0. Final cleanup: {"memory":{"geometries":0,"textures":4},"programs":0,"error":0,"stopped":true,"killed":true}. Four retained textures are the unchanged pre-existing lifecycle baseline.

Reproduction: existing external Playwright in NODE_PATH, Vite port 5174, LIGHTING_STAGE=after, LIGHTING_REPORT_PREFIX=ai-hen-warmth-, LIGHTING_BUDGET_BASELINE=./practical-warmth-before.json, then node scripts/validate-premium-practicals.cjs. Static protection: node scripts/verify-practical-warmth-frozen.cjs. No runtime dependency added.

## Commits in order

```text
d52965f docs: track approved stone lantern references without altering assets
5c90858 docs: audit pale practical response and record warmth baseline
f8d1255 fix: warm practical transport toward restrained amber and honey
6084602 fix: give garden wall and pendant paper warm ivory reflectance
988bb44 fix: warm occupied shoji paper without tinting unlit architecture
3111d96 fix: restore warm window presence through bounded frame irradiance
2a74948 fix: retain exterior paper presence with restrained emission compensation
02ba889 fix: align recessed genkan paper with the warm ivory family
a16fe95 test: verify unchanged warmth budgets shadows traversal and lifecycle
```

Final documentation commit follows this list; the delivery message supplies its hash. No push or PR.
