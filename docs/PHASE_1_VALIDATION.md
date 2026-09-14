# Phase 1 — Shanshui implementation and validation

Implemented on `phase-1-shanshui`, ready for local visual review. No commit, push, pull request, deployment or Phase 2 work was performed.

## 1. Architecture

The Phase 0 runtime remains in place. `Experience` still owns the only application RAF loop, ScrollDirector, viewport, visibility lifecycle and cleanup. `World` now owns the atmospheric field and delegates composition to `Shanshui`.

- `Shanshui` coordinates the six layers, staged scroll progression, responsive composition, loading state and disposal.
- `InkLayer` owns a two-triangle plane, unlit transparent material and asynchronously loaded texture. It preserves image aspect and disposes late load results if the runtime has already been destroyed.
- `MistLayer` extends InkLayer with bounded, independent transform drift. No UV repetition or extra animation loop is used.
- `ShanshuiConfig` centralizes depth, order, tint, opacity, framing, responsive profiles, ranges and motion values.
- `AtmosphericField` has one clear additional responsibility: a broad navy-to-silver wash made from vertex colors. It uses no new artwork, texture, custom shader or lighting.
- `Camera.resize` now updates projection without resetting the pose to the Phase 0 cube framing. Shanshui uses the existing `setPose` API; the generic camera contains no landscape choreography.
- Loading completion invalidates the existing Experience loop, including when reduced motion is active. The complete composition becomes visible together, rather than revealing images in network-arrival order.

## 2. Exact file inventory

Created:

- `src/world/shanshui/Shanshui.ts`
- `src/world/shanshui/InkLayer.ts`
- `src/world/shanshui/MistLayer.ts`
- `src/world/shanshui/ShanshuiConfig.ts`
- `src/world/shanshui/AtmosphericField.ts`
- `docs/PHASE_1_VALIDATION.md`

Modified:

- `src/world/World.ts`
- `src/core/Experience.ts`
- `src/core/Camera.ts`
- `src/core/Renderer.ts` — updated the obsolete diagnostic-scene comment only.
- `src/ui/DebugPanel.ts`
- `src/main.ts`
- `src/styles/main.css`
- `index.html`

Removed files: none. The diagnostic cube and its two lights were removed from World. Source PNGs, approved references, existing project documents, dependencies, lockfile, TypeScript configuration, Viewport and ScrollDirector remain unchanged.

## 3. Texture and alpha audit

All six original PNGs decode successfully in Pillow and Chromium. Every image is RGBA with usable transparency; none contains a baked checkerboard. Bounds below are `(left, top, right, bottom)` for alpha greater than 16/255, with right/bottom exclusive. Very faint pixels can exist outside these bounds.

| Asset | Dimensions | File bytes | Fully transparent pixels | Visible bounds, alpha > 16 |
| --- | --- | ---: | ---: | --- |
| far-mountains.png | 2172 × 724 | 1,225,675 | 59.21% | (4, 247, 2172, 641) |
| mid-mountains.png | 2171 × 724 | 1,750,346 | 45.42% | (5, 116, 2169, 672) |
| near-mountains.png | 2172 × 724 | 1,718,938 | 46.78% | (9, 160, 2166, 684) |
| foreground-ink.png | 2172 × 724 | 1,799,495 | 49.83% | (0, 74, 2172, 715) |
| mist-back.png | 2172 × 724 | 1,212,746 | 52.24% | (3, 209, 2172, 690) |
| mist-front.png | 2172 × 724 | 1,238,282 | 58.45% | (1, 178, 2168, 685) |

The substantial empty upper regions are accounted for in each layer's scale and vertical placement. The actual loaded dimensions determine aspect, including the one-pixel width difference in mid-mountains. Original alpha is retained without thresholding or color-key removal. Textures use sRGB, linear magnification and mipmapped linear minification.

Unexpected source details were reported during implementation:

- Foreground ink contains a small painted lantern and detailed tree/rock forms. Framing places the lantern below the visible area in the tested layouts; the source was not edited or replaced.
- Both mist images contain recognizable terrain/tree silhouettes. Their opacity and drift are deliberately low so the embedded forms remain atmospheric.
- Some source edge RGB pixels are strongly blue/cyan. All pixels matching the audit's high-chroma blue-fringe check had alpha at most 16/255. They were retained; no color-removal workaround was added. No conspicuous colored or rectangular edge was observed in the reviewed compositions.

The six files total **8,945,482 bytes**, approximately 8.95 MB / 8.53 MiB. Reference boards are never requested by the runtime.

## 4. Layer composition

Positions are framed in projected viewport units at each layer's rest depth. Image-space horizontal focus selects the crop; image height is specified relative to viewport height. Neither the UVs nor the image proportions are stretched. Lateral overscan keeps the rectangular plane edges outside the frustum during motion and resizing.

| Layer, back to front | Desktop rest Z | Base opacity | Composition and movement |
| --- | ---: | ---: | --- |
| Far mountains | -10 | 0.64 | Raised, quieter ridge line behind the main peaks; only 0.6% horizontal scroll translation before depth projection. |
| Rear mist | -8 | 0.16 | Overlaps distant mountain bases and the main ridge; slow independent drift. |
| Mid mountains | -6 | 0.94 | Main recognizable mass, offset left of center; 1.4% horizontal translation. |
| Front mist | -4 | 0.19 | Softens the lower middle distance without covering the entire view; a different drift period and direction. |
| Near mountains | -2 | 0.98 | Darker lower and lateral framing, with 2.9% horizontal translation in the opposite direction to the mid layer. |
| Foreground ink | 0 | 1.00 | Cropped lower-edge brush/rock/tree framing; strongest translation at 4.1%, with the lantern outside the visible crop. |

The atmospheric field lies at Z = -32. Ink tints become progressively darker toward the camera. Materials are unlit, `transparent: true`, `depthWrite: false`, `depthTest: true`, with explicit render orders 1–6. The depth hierarchy does not cross at any tested scroll state. There is no global depth-test override.

## 5. Scroll and camera behavior

The existing ScrollDirector remains the only scroll system. Native scrolling is unchanged; both raw and smooth progress, reduced motion and `getRangeProgress()` are reused.

- **0.00–0.20 / Painting:** terrain and camera remain still. Mist runs at only 1.5% of its full drift strength and speed.
- **0.20–0.60 / Awakening:** smoothstep gradually introduces 80% of the depth and parallax response.
- **0.60–1.00 / Living landscape:** the remaining 20% settles into place; mist continues moving independently.

Smoothstep derivatives vanish at stage boundaries, so there is no sudden motion at 0.20 or 0.60. Camera motion is translation along Z only: a maximum desktop push from 24 to 23.65, about 1.46%. FOV and camera rotation do not animate. Planes remain front facing and more than 20 world units from the camera in the tested desktop endpoint. No mountain layer has decorative idle motion.

Mist uses independent sine periods of 193/257 seconds and 239/311 seconds, with small bounded offsets and mild stage-dependent opacity changes. It never tiles or wraps across the screen.

## 6. Responsive behavior

Three configurations share one implementation:

- **Desktop:** a broad ridge line, the main mass left of center and layered lower framing.
- **Tablet:** separate scale, focus, mist placement, depth spacing and motion values. Tested at 820 × 1180 and landscape 844 × 390.
- **Portrait:** a deliberately offset principal mountain and right-side near framing around a narrow valley. This profile is used below aspect 0.6, or for a mobile-category viewport in portrait orientation. Tested at 390 × 844 and 320 × 568.

Motion multipliers are 1 / 0.7 / 0.45; depth-spacing multipliers are 1 / 0.85 / 0.7. Camera rest distances are 24 / 25 / 26. Scale is expanded only when necessary to preserve lateral coverage on wider viewports. All profiles preserve the source image aspect ratio. Ultra-wide coverage was checked at 2560 × 720.

## 7. Reduced motion, loading and cleanup

Reduced motion uses raw progress immediately, scales camera/parallax motion to 6% of the chosen profile, stops both mist phase clocks and eliminates continuous rendering. Small tonal changes still reflect the current stage. Initial reduced motion, live preference changes, scrolling and resizing were tested.

If any texture fails, the entire partial Shanshui composition stays hidden and its successful resources are released. An HTML status message suggests reloading, and the console identifies the failed URL. The atmospheric backdrop remains usable. A late image load after disposal is disposed without reattaching it or updating the status message.

Experience disposal releases all seven geometries, seven materials and six textures, removes the debug panel and owned ScrollTrigger, cancels RAF and removes the existing lifecycle listeners. No event listener or second RAF loop was added by Shanshui.

## 8. Performance observations

- **7 draw calls:** six raster layers and one atmospheric field.
- **20 triangles:** twelve for the six quads, eight for the field's gradient bands.
- **6 textures**, DPR still capped at **2**.
- No scene lights, shadow maps, post-processing, custom shaders, high-poly terrain or GUI dependency.
- The six RGBA textures require approximately **36 MiB before mipmaps / 48 MiB with mipmaps**, an estimate excluding render buffers and driver overhead. This is the principal mobile memory cost; geometry cost is negligible.
- Local Chromium diagnostics were approximately 75 FPS in the sampled runs. This is an observation on the test machine, not a physical-mobile benchmark.
- Vite retains its chunk-size warning: approximately **657.1 kB JavaScript / 181.1 kB gzip**. The build succeeds; the warning was not suppressed.

## 9. Build and runtime validation

`npm run build` passed with strict TypeScript. `git diff --check` passed. No dependency or lockfile change was introduced.

Seventeen automated browser checks passed using the environment's existing Playwright and Chrome 153.0.8010.36, without installing a package:

1. Normal URL, successful six-PNG load, composed scene visibility and hidden debug panel.
2. Draw calls, triangles, sRGB, source aspect, alpha settings and transparent depth/order configuration.
3. Static camera and terrain throughout the initial Painting range.
4. Awakening/Living stages, scroll endpoints, movement hierarchy, small push and stable depth order.
5. No transform discontinuity across 0.20 and 0.60.
6. Independent mist drift while terrain remains still at a fixed scroll endpoint.
7. Six viewport sizes, both scroll endpoints, correct camera projection, canvas dimensions, image aspect and lateral coverage.
8. Existing debug data plus stage, composition profile, layer count and texture count.
9. Live reduced motion, frozen drift, direct progress and no continuous renderer frames.
10. Three simulated hidden/visible cycles with no hidden-frame activity or mist jump; first resumed delta equals zero.
11. Complete, idempotent resource disposal and stopped resize/render activity afterward.
12. Three repeated mounts and disposals on the same canvas without accumulating GPU resources or debug panels.
13. Emulated mobile DPR 3 capped at 2, with reduced motion enabled before loading.
14. Delayed loading hides the composition as a group and respects resizing before completion.
15. Disposal during loading prevents late attachment, rendering and status callbacks.
16. Controlled missing-texture failure produces a useful diagnostic and HTML fallback; no broken partial composition remains.
17. Normal operation has no console errors or uncaught exceptions. Expected diagnostics from the deliberately injected 404 were checked separately.

Additional production-path validation passed:

```text
npm run build -- --base=/Ai-Hen/
npm run preview -- --base=/Ai-Hen/ --host 127.0.0.1 --port 4173
```

All six PNG requests returned HTTP 200 from `/Ai-Hen/shanshui/`. Native mouse-wheel scrolling reached 1, keyboard Home returned to 0, and the normal production URL hid debug. No console errors occurred. The override was supplied only through the CLI; no Vite deployment configuration or GitHub workflow was added. A final ordinary build restored the default local build output.

Visual captures were inspected at scroll 0, 0.5 and 1 on desktop/tablet/mobile, with additional endpoint checks on small mobile, landscape and ultra-wide screens. No obvious rectangular texture border, transparent sorting artifact, exposed side of a plane or visible lantern was observed. Temporary test drivers, results and screenshots live outside the repository in the system temporary directory.

## 10. Phase 1 acceptance checklist

Based on `PHASE_1_SHANSHUI_SPEC.md`, section 16:

- [x] Initial composition reads as one painted Shanshui landscape.
- [x] Spatial motion is initially subtle; no terrain/camera movement in Painting.
- [x] Scroll gradually reveals spatial separation.
- [x] Far, mid, near and foreground have different movement strengths.
- [x] Mist reinforces depth with restrained opacity and drift.
- [x] Camera movement remains understated and never rotates toward the planes.
- [x] Composition remains cohesive while moving.
- [x] No exposed card sides or obvious rectangular borders in the reviewed views.
- [x] Desktop composition reviewed at all three stages.
- [x] Tablet and portrait/mobile compositions remain readable.
- [x] Reduced motion preserves a complete composition with no continuous drift.
- [x] No Moon Gate or other Phase 2 work.
- [x] No TypeScript errors.
- [x] No browser console errors during normal operation.
- [x] `npm run build` succeeds.
- [x] Resource cleanup remains valid, including pending loads.

These checks make Phase 1 ready for the user's local visual review; they do not replace artistic approval before Phase 2.

## 11. Remaining limits and decisions before Phase 2

- The supplied images already contain multiple painted ridges, mist and trees. Their embedded details cannot acquire independent depth without different source artwork. Some repeated geological motifs and raster softness remain properties of the supplied art.
- The small lantern remains in the untouched foreground PNG, outside the current framing. Revisit the crop or obtain an approved architecture-free asset before substantially changing the camera/composition.
- Review optimized delivery formats and mobile texture budgets before deployment. The 8.95 MB original PNG payload was deliberately preserved; no replacement artwork or compressed derivative was generated.
- Review the current framing, contrast and restrained motion in the live browser before accepting the next phase.
- Phase 1 currently occupies global progress 0–1. Allocate its final global range when the next scene is explicitly requested; the central ranges and existing ScrollDirector support that change.
- Future lit 3D scenes may require a different tone-mapping choice. Current unlit paintings retain their own consistent color treatment.
- Validation used Chromium and emulated mobile dimensions/DPR, not physical phones, Safari or Firefox. Visibility events were simulated because the automation browser reports background tabs as visible; actual OS tab suspension and back/forward-cache admission were not revalidated.
- TextureLoader cannot cancel an in-flight image request. Disposal safely rejects its eventual result, but the request may finish in the background. A cancellable resource pipeline is deferred until required.
