# Phase 2.1.3 — Night Sky / Moon / Distant Atmosphere

Base: `a6a1b7dbeecad8339dc08cef494b5bc44558574a`. Branch: `phase-2-1-3-night-sky-moon-atmosphere`. Local only; no PR or push.

## Audit before implementation

- GardenBackground owns a 140×100 sky plane at Z −55, a radius-1.6 moon at (−4.2, 6.3, −91.8), an 18-unit halo, two painted mountain cards and a legacy pavilion cue. At entry the moon spans only about 2° and is partly hidden by the mansion roof. Responsive profiles shrink it further.
- The sky has only one UV-space linear color blend, no variation across longitude, no stars and no layered scattering. Finite card bounds also become visible in oblique diagnostic views.
- Lunar shading is two multiplied sine waves, with a very broad faded rim; it lacks recognizable irregular maria, craters and spherical illumination.
- GardenAtmosphere owns four low-opacity depth slabs (desktop four, tablet three, portrait two). NightGarden owns global FogExp2, lighting and reveal. Global fog and lighting must remain unchanged.
- Painted mountain cards use shared geometry, independent materials, asynchronous cached textures and normal transparent depth ordering. Moon/halo must remain behind these ridges and the mansion, without writing depth.
- MoonGateAperture injects a world-space fragment mask into all garden Mesh materials. Background additions must be constructed before attachment; asynchronously loaded ridges are attached on ready. No screen-space overlay may bypass the opening.
- Renderer uses NoToneMapping and SRGB output. Existing custom background shaders write display-oriented RGB directly. Keep that convention within this isolated system; do not change global exposure/color management.

## Implementation plan

Extract separate moon and sky owners, improve backdrop coverage and tonal layers, integrate sparse static stars in the sky pass, enlarge/elevate the moon with responsive composition, replace its surface and halo, feather distant ridge edges and enrich only the distant haze. Use existing art and internal procedural shaders; no dependency or asset download. Preserve all camera paths, physical garden and practical lighting.

The initial partial implementation was inspected at desktop, tablet and portrait using three temporary images outside Git. The continuation explicitly prohibited further captures: none were generated after that instruction. Final automated rendering checks run in the local browser without screenshots or visual archives. Final artistic assessment of the cloud treatment remains for live review.

## Recovery and preserved work

Continuation audit found branch unchanged, HEAD `f5364667c41fe3f0c37d8f17576925e15ead0505`, nine phase commits, no staged/unstaged edits and three untracked validation files. All valid production work was retained. The two numeric files were moved to the OS temporary validation directory; the test script was completed. No reset, checkout, source restoration, squash, push or PR was performed during recovery.

The approved partial moon positions/radii remain exactly: desktop (−8.5,16,−91.8), radius 5.2; tablet (−4.8,16,−91.8), radius 4.9; portrait (−2,15,−91.8), radius 4.4. No further enlargement was needed.

## Final architecture

- `GardenBackground`: lifecycle coordinator, painted ridges and shared celestial state. Painted assets and placement retained; only card edges feathered.
- `GardenNightSky`: camera-centered, inward-facing 60-unit dome within the existing far plane. One pass contains a direction-space gradient, deterministic clouds, sparse stars and low wooded foothills. No new texture, panorama, render target or light.
- `GardenMoon`: existing enlarged disc with irregular maria/craters and spherical shading, a narrow optical limb falloff, compact aureole and wide faint outer halo. The shared cloud field attenuates the disc and halo.
- `NightSkyComposition` / `NightSkyState`: authoritative anchors, palette, influence, absorption and shared uniform identities. Moon direction is derived from its world position and the current camera, not a second independently tuned vector.
- `NightCloudField` / `NightSkyNoise`: internal deterministic shader fields. Continuous directional cloud coordinates avoid a longitude seam. Moon-facing cloud edges receive restrained silver light. Clouds, horizon and moon influence suppress stars; polar points fade before longitude convergence.
- `GardenAtmosphere`: existing depth slabs stay behind the garden at their existing positions/counts. Low-frequency stratification and the shared moon direction articulate distant haze; global FogExp2 is unchanged.
- `NightGarden`: only constructs atmosphere with shared state and forwards its existing visibility scalar to the background. No reveal curve, camera, physical garden or lighting changes.

PMREM/environment contribution was deliberately excluded: the existing approved PBR lighting has no environment map and adding one would change garden material response. Renderer, tone mapping, all lighting, gate aperture/path, garden path, mansion, stones, walls, rake and vegetation source files are unchanged.

## Validation — 2026-10-03

- `npm run build`: passes. Existing bundle-size advisory remains; final JS 852.36 kB, gzip 240.45 kB.
- `git diff --check`: passes.
- Local Chrome rendering at 1440×900, 820×1180 and 390×844; eleven approved-route samples per layout. Position, quaternion, FOV, camera owner, light intensities and global fog exactly match the original base.
- Reverse sampling: zero position error. Reduced-motion differences at the early approach match the baseline exactly (desktop .0224663, tablet .0112331, portrait .00519934 units); no new difference. Actual media-query switching works.
- Desktop → tablet → portrait → desktop restores the same pose; shared moon state follows layout without GPU allocations.
- Physical aperture GPU test at global .55, with background isolated and full brightness only in the test: 29,657 exterior sample pixels, zero exterior changes, 113,231 changed interior samples. Test consumes numeric pixel differences and saves no images.
- Finite matrices and geometry buffers; no JavaScript/shader errors or normal-render WebGL errors.
- Three traversal cycles keep geometry/texture/program counters stable.
- New sky/moon plus existing haze ownership probe: four geometries and seven materials, each disposed once; shared uniform identity confirmed; no attached children after disposal.
- Forced context loss/restoration recovers rendering and 57 geometries / 25 textures / 27 programs.
- Normal fresh-context disposal: zero geometries, zero programs, zero WebGL errors. One preexisting texture remains, unchanged from baseline behavior; no claim of zero total scene leakage.

### Known lifecycle limitation

Disposing the complete scene **after forced context loss/restoration** generates WebGL `INVALID_OPERATION` (1282). Reproduced with the original three affected modules loaded directly from `git show a6a1b7d:…` into browser responses, without modifying working files. The same error occurs across original Shanshui, Moon Gate and garden owners; after cleanup both versions retain zero geometries, zero programs and one texture. This is a preexisting context-recovery cleanup issue, left outside the frozen renderer scope. Normal rendering, restored rendering and normal disposal pass.

## Performance

Maxima over eleven identical route samples (not an exhaustive GPU benchmark):

| Layout | Calls before → after | Triangles before → after |
|---|---:|---:|
| Desktop | 71 → 71 | 304218 → 305176 |
| Tablet | 70 → 70 | 262201 → 263159 |
| Portrait | 69 → 69 | 228099 → 229057 |

Additional cost: 958 dome triangles, one shader program (26 → 27), more procedural fragment arithmetic. Geometries/textures remain 57 / 25. No additional draw calls, render passes or runtime-generated textures. No claim of unchanged GPU time or mobile FPS; viewports are emulated on this desktop machine.

At global .6675 the projected lunar diameter is approximately 3.25× / 3.38× / 3.39× the original diameter (desktop/tablet/portrait). Its scale and position are unchanged from the approved partial implementation. It fits during the entry/reveal; later it naturally leaves the frame as the frozen camera approaches the mansion. It is not screen-pinned.

## Scope and reproduction

Production modified: `GardenBackground.ts`, `GardenAtmosphere.ts`, `NightGarden.ts`.
Production added: `GardenMoon.ts`, `GardenNightSky.ts`, `NightSkyComposition.ts`, `NightSkyState.ts`, `NightSkyNoise.ts`, `NightCloudField.ts` (all under `src/world/nightGarden/`).
Supporting files: this README and `scripts/review-night-sky.cjs`. No dependencies or assets added.

Run Vite locally on 5174 (override `SKY_URL` if needed). Playwright must be available through external tooling; it was not added to package.json. Run `node scripts/review-night-sky.cjs`; numeric results go to `%TEMP%/ai-hen-night-sky-validation`, never Git. Optional `SKY_REPORT_DIR` overrides that location. To establish the baseline read-only: `SKY_ORIGINAL=1` with `SKY_STAGE=before`, then with `SKY_STAGE=recovery-baseline`; unset `SKY_ORIGINAL` and use `SKY_STAGE=after` for the final implementation. The baseline mode transpiles the original modules from Git only into browser responses.

The final phase history contains 23 atomic commits including the original nine, the recovery work, validation and this documentation. Use `git log --reverse --oneline a6a1b7d..HEAD` for the exact chronological history.
