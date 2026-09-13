# Phase 0 — implementation and validation

Validated on 2026-09-13 on `phase-0-foundation`. Implementation remains in the local working tree for review.

## Architecture

- `Experience` owns the scene and coordinates the modules, requestAnimationFrame, visibility, resize, page lifecycle and disposal.
- `Viewport` coalesces resize events, watches DPR changes, caps DPR at 2 and exposes mobile/tablet/desktop categories.
- `Camera` owns the PerspectiveCamera and exposes `setPose`. Its aspect-aware cube framing is temporary.
- `Renderer` owns WebGLRenderer, sRGB output, configurable tone mapping and renderer diagnostics.
- `ScrollDirector` uses GSAP/ScrollTrigger with native document scrolling and exposes raw progress, smoothed progress, reduced motion and generic range mapping.
- `World` owns one temporary lit cube: one draw call and 12 triangles, with disposable geometry and material.
- `DebugPanel` is created only for `?debug=1`; continuous diagnostic updates are limited to approximately four per second.
- `main.ts` starts the runtime, provides an HTML startup failure message and registers Vite HMR disposal.

## Commands and browser checks

- `npm run dev -- --host 127.0.0.1`: passed; Vite served the application at port 5173.
- `npm run build`: passed, including TypeScript with `strict: true`.
- `npm run build -- --base=/Ai-Hen/` and `npm run preview -- --base=/Ai-Hen/ --host 127.0.0.1 --port 4173`: passed. The built application rendered at `/Ai-Hen/?debug=1` in the integrated Chromium browser without console warnings or errors. The base override was supplied only on the command line; no deployment configuration was added.
- `git diff --check`: passed.
- Automated browser checks used the environment's existing Playwright installation and Chrome 153.0.8010.36. No package was installed or added to this repository. The test driver and screenshots were kept outside the repository in the temporary `ai-hen-phase-0` directory.

The automated checks covered:

1. Actual application entry point, successful canvas rendering, one draw call and 12 triangles.
2. Native scroll endpoints 0 and 1, reverse scrolling and smoothed convergence to both endpoints.
3. Desktop 1440×900, tablet 820×1180, mobile 390×844 and 320×568, and landscape 844×390; correct canvas sizing and no horizontal overflow.
4. Live reduced-motion changes, immediate scroll progress and readable diagnostics.
5. Absence of the debug panel for the normal URL, `?debug=0` and `?debug=true`.
6. Mobile DPR 3 capped at 2, including the 780×1688 drawing buffer for a 390×844 viewport.
7. Intermediate smoothing, range clamping and rejection of invalid ranges.
8. Camera aspect, viewport measurements and renderer buffer dimensions after repeated resizing.
9. Stable cube transforms and no continuous renderer frames while reduced motion is enabled; scroll events still update diagnostics.
10. Three simulated hidden/visible cycles: renderer frames stop, resume starts with delta 0 and simulation deltas stay at or below 50 ms.
11. Simulated persisted `pagehide`/`pageshow`: pause and resume without releasing resources required by the back/forward cache.
12. Idempotent disposal: geometry and material each disposed once, empty scene, no owned ScrollTrigger, removed debug panel, zero geometry memory and no resize/media/frame activity afterward.
13. Three successive create/dispose cycles on the same canvas, each rendering successfully with only one debug panel.
14. No browser console errors or uncaught exceptions.

## Acceptance checklist

| PHASE_0_ACCEPTANCE section | Status | Evidence |
| --- | --- | --- |
| 1. Project health | Pass | Dev server and production build succeed; existing dependencies retained; strict TypeScript enabled. |
| 2. Runtime architecture | Pass | All eight expected module/style files exist; entry point remains minimal. |
| 3. Three.js runtime | Pass | Scene, PerspectiveCamera, WebGLRenderer, RAF, elapsed/delta time and resize are connected. |
| 4. Renderer | Pass | sRGB, DPR cap 2, responsive size, diagnostics; no shadows or post-processing. |
| 5. Camera | Pass | Projection resizes correctly; `setPose` and viewport category allow later compositions. |
| 6. ScrollDirector | Pass | Native scroll, GSAP/ScrollTrigger, raw/smooth/reduced state and generic `getRangeProgress`. |
| 7. Scroll test environment | Pass | Temporary 300svh document; both endpoints verified. |
| 8. Debug mode | Pass | Exact query activation; FPS, time, progress, viewport, DPR, category, draw calls, triangles, camera and motion preference. |
| 9. Responsive behavior | Pass | Desktop, tablet, mobile and landscape checks; mobile DPR cap verified. |
| 10. Reduced motion | Pass | Initial preference and live changes handled; smoothing and cube motion stop; rendering becomes event driven. |
| 11. Visibility lifecycle | Pass (simulated events) | Three pause/resume cycles; no frames while hidden; first resumed delta is zero. |
| 12. Cleanup | Pass | Listeners, RAF, owned trigger, UI, world GPU resources and renderer disposed; remount verified. |
| 13. GitHub Pages compatibility | Pass | Built application renders with a CLI `/Ai-Hen/` base override; no workflow or deployment added. |
| 14. Visual appearance | Pass | Minimal HTML harness and one diagnostic cube; references remain unchanged. |
| 15. Code quality | Pass | Starter removed, strict compilation and diff check pass, no runtime console errors. |
| 16. Final verification | Pass | Individual checklist below; validation limits stated explicitly. |

- [x] npm run dev
- [x] npm run build
- [x] Three.js canvas renders
- [x] Scroll progress reaches 0 → 1
- [x] Smooth progress works
- [x] ?debug=1 works
- [x] Normal URL hides debug UI
- [x] Browser resize works
- [x] Mobile viewport works
- [x] prefers-reduced-motion is detected
- [x] hidden-tab lifecycle works under simulated visibility events
- [x] no console errors
- [x] no TypeScript errors
- [x] cleanup architecture exists
- [x] no Phase 1 visual work has been implemented

## Decisions for future phases

- Breakpoints are viewport widths of 768 and 1024 CSS pixels. Future world quality and camera composition can use `viewport.category` without adding another resize listener.
- Scroll smoothing uses exponential damping with rate 10 per second and snaps within 0.0001 of its target. Native scrolling is never intercepted or smoothed. Scene ranges are supplied by future callers; no narrative ranges are assigned yet.
- Reduced motion freezes the diagnostic cube and uses on-demand rendering. Visibility restoration synchronizes smooth progress to the current raw progress.
- Simulation time excludes hidden/idle intervals and clamps each delta to 50 ms. Debug FPS uses uncapped frame duration so slow frames are not misreported as faster rendering.
- sRGB output and `NoToneMapping` suit this non-HDR diagnostic scene. The renderer constructor accepts a tone-mapping choice for future worlds.
- Each module releases only its own resources. ScrollDirector kills its own trigger without globally disabling GSAP or other future triggers. Renderer disposal leaves the canvas reusable.
- The entry script is processed by Vite. Future public assets should use `import.meta.env.BASE_URL`, or use Vite asset imports. No production base configuration has been committed to the project.
- Resources, atmosphere, final compositions and all visual/narrative systems remain for later reviewed phases.

## Known limits

- Vite reports its standard chunk-size warning: the minified JavaScript bundle is approximately 649.5 kB (178 kB gzip). The build succeeds. The warning has not been hidden; bundle splitting/optimization remains a later task.
- Browser validation used Chromium and emulated mobile dimensions/DPR, not physical mobile devices, Safari or Firefox.
- The automation browsers keep background tabs reported as visible. Hidden/visible and back/forward-cache events were therefore simulated to verify the runtime handlers deterministically; actual operating-system tab suspension and browser cache admission were not verified.
- No unresolved runtime or TypeScript error was found. Phase 1, deployment, commits, pushes and pull requests were not performed.
