# Phase 2.3 — restrained residential refinement

Date: 2026-10-04. Branch: `phase-2-3-genkan-interior-architecture`.
Starting HEAD: `5f718fea174d03b4172cb6741db1380c353e74c6`, clean tree.
Threejs skill applied. All previous commits preserved. No Phase 2.4, push, PR, screenshots, galleries or videos.

## Additions

- One stoneware vase, mansion-local (-1.34, 3.10, -5.85), seated on the existing timber platform. Height .58, maximum radius .14. A recessed neck receives four asymmetric branch runs. Six small ivory/blush blossoms; total arrangement height about 1.60. No second bouquet or wall decoration.
- Two .24-wide, .34-high timber/paper floor lanterns at X±1.21, Z=-5.18, base Y=3.10. Timber frames reuse the existing instanced batch. A shared opaque emissive paper finish supplies restrained visible warmth, without bloom, textures or an autonomous animation.
- Two warm shadowless SpotLights, intensity 1.2 each, range 2.05, penumbra 1, decay 2. They aim inward/downward toward the step. Existing niche lights, exposure and exterior lighting are untouched. All intensities follow the existing garden visibility.
- Placement was moved deeper on the platform after numerical tablet framing checks. Lamp inner edges remain at |X|=1.09, outside the existing 2.16-wide central passage. Camera/prop bounding-box clearance over 401 poses is at least 4.330831 units.

No edits to architecture, floor levels, rear shoji, door choreography, camera paths, camera ownership, scroll durations or resize logic. No new dependencies or external assets. Three merged flower/vase meshes share existing stone/timber finishes and one new petal material; two lamps add one instanced paper batch. Construction-only temporary geometries are disposed immediately. No new per-frame allocations.

## Measured performance

Before is the measured starting HEAD, not the older Phase 2.2 baseline. Same viewport and pose for each comparison.

| Viewport | Garden arrival calls | Garden arrival triangles | Final interior calls | Final interior triangles |
|---|---:|---:|---:|---:|
| Desktop 1440×900 | 75 → 79 | 304816 → 306528 | 46 → 50 | 102592 → 104304 |
| Tablet 820×1180 | 74 → 78 | 262799 → 264511 | 45 → 49 | 98318 → 100030 |
| Portrait 390×844 | 69 → 73 | 225621 → 227333 | 42 → 45 | 89772 → 91228 |

Textures 25→25, programs 28→28, geometries 59→62, scene lights 19→21. Interior unique materials 7→9. Matched garden arrival delta: +4 calls, +1712 triangles. Final portrait draws fewer added meshes because of frustum culling; draw submission does not prove visible pixels.

## Validation

`npm run build`: pass, 104 modules, JS 869.19 kB / gzip 245.36 kB. Existing >500 kB advisory remains. `git diff --check`: pass.

Numeric-only Chrome runtime suite passes for desktop/tablet/portrait:

- Prior garden/threshold pose hashes and door offsets unchanged. Interior endpoint, target and extension length exactly match the captured refinement baseline. Camera/scroll implementation files have no diff.
- 401 interior poses per layout, single camera writer, fully open doors, deterministic repeated reverse and reduced-motion replay. Native forward/reverse, normal and reduced-motion switching pass.
- Repeated resize, visibility pause/resume and persisted pagehide/pageshow pass without resource accumulation.
- Floor, step and rear-header landmarks stay framed. Floor support and enclosure tests pass: 112 floor samples and 605/605/484 inside frustum rays, no sampled leaks. New vase and lamps have physical support; props remain away from the camera and structural envelope.
- Exterior comparison against the approved original pavilion: closed full frames and pixels outside the entrance at threshold .5/1 show zero changed pixels in all layouts. The deliberately decorated interior is excluded from the open-door exterior comparison.
- Interior double-disposal releases four geometries, nine materials and eight instanced mesh resources exactly once. Full-world cleanup returns zero geometries/programs; the same four pre-existing retained textures remain. No new JS, shader or normal-render WebGL errors.

## Actual limitations

No saved or live screenshot-based artistic review was performed. Validation above is numerical, not certification of artistic quality, exposure balance or every possible surface intersection. User visual approval remains pending.

Desktop frames the accents. At the final tablet pose their centers remain visible near the edges, with partial cropping. At the final 390×844 portrait pose the arrangement and lantern centers are outside the narrow approved view; the floor/step/rear connection stay framed. The camera and central route were intentionally preserved. Full portrait visibility of the props is not claimed. Practical illumination remains active, but its perceived improvement on portrait needs manual review.

Hardware mobile FPS/GPU milliseconds were not measured. Existing retained textures and prior context-restoration limitations are unchanged.

## Files and reproduction

New production: `src/world/nightGarden/GenkanInteriorFlowers.ts`, `src/world/nightGarden/GenkanInteriorLanterns.ts`.
Modified production: `GenkanInterior.ts`, `GenkanInteriorMaterials.ts`, `GenkanInteriorLighting.ts` in the same directory.
Validation: updated `scripts/review-genkan-interior.cjs`, `scripts/validate-genkan-interior-runtime.cjs`; added `scripts/validate-genkan-refinement.cjs`, `scripts/genkan-refinement-baseline.json`.

Run Vite on 5174, provide external Playwright through `NODE_PATH`, run `node scripts/review-genkan-interior.cjs`. Compact numeric results: `%TEMP%/ai-hen-interior-validation/after.json`; original measured recovery results: `refinement-before.json` in that directory. The committed compact fixture preserves the relevant baseline. No image outputs.

Chronological refinement commits: `git log --reverse --oneline 5f718fe..HEAD`.
