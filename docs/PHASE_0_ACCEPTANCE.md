# 愛恨 — PHASE 0 ACCEPTANCE CRITERIA

## Goal

Phase 0 establishes the technical runtime foundation for 愛恨.

It does NOT build the final visual world.

No Shanshui landscape, Moon Gate, garden, pavilion, final water,
vegetation, shaders, portfolio sections or audio should be implemented.

---

# 1. Project health

The following commands must succeed without errors:

npm run dev
npm run build

TypeScript must compile without errors.

No unnecessary dependencies may be added.

---

# 2. Runtime architecture

The project must have clear modular responsibilities.

Expected foundation:

src/
  core/
    Experience.ts
    Camera.ts
    Renderer.ts
    ScrollDirector.ts
    Viewport.ts

  world/
    World.ts

  ui/
    DebugPanel.ts

  styles/
    main.css

  main.ts

Small justified architectural changes are allowed.

main.ts must remain minimal.

Experience.ts must coordinate systems without becoming a monolithic file.

---

# 3. Three.js runtime

A valid Three.js scene must render successfully.

The temporary Phase 0 scene may contain only simple diagnostic geometry.

It must NOT attempt final art direction.

The runtime must include:

- Scene
- PerspectiveCamera
- WebGLRenderer
- requestAnimationFrame lifecycle
- elapsed time / delta time support
- resize handling

---

# 4. Renderer

Renderer must:

- resize correctly
- use an appropriate output color space
- cap device pixel ratio
- avoid unnecessary expensive effects
- expose renderer diagnostics for debug mode

Post-processing is NOT required in Phase 0.

---

# 5. Camera

Camera must:

- use PerspectiveCamera
- resize correctly
- have a clean interface for future cinematic motion
- avoid embedding final camera choreography

The architecture must allow future desktop/mobile camera variations.

---

# 6. ScrollDirector

Use:

- native browser scroll
- GSAP
- ScrollTrigger

Do not add Lenis or another smooth-scroll dependency.

ScrollDirector must expose at minimum:

- raw normalized scroll progress: 0 → 1
- smoothed progress: 0 → 1
- reduced-motion state

It must be designed so future scene ranges can be added without rewriting the runtime.

---

# 7. Scroll test environment

Phase 0 must provide enough vertical document height to test scrolling.

Scrolling must update progress reliably from 0 to 1.

No final website sections are required.

Temporary development markup is acceptable.

---

# 8. Debug mode

Debug mode must activate only when the URL contains:

?debug=1

Example:

http://localhost:5173/?debug=1

The debug panel should display useful runtime information such as:

- FPS
- raw scroll progress
- smooth scroll progress
- viewport width / height
- device pixel ratio
- draw calls
- triangles
- camera position
- reduced-motion state

It must not appear during normal browsing.

Avoid adding a heavy debug dependency unless clearly necessary.

---

# 9. Responsive behavior

The runtime must work at minimum on:

- desktop
- tablet-sized viewport
- mobile viewport

Resizing the browser must not break:

- renderer
- camera aspect ratio
- canvas sizing
- scroll calculations

Mobile architecture must be prepared for future reduced scene complexity.

---

# 10. Reduced motion

The runtime must detect:

prefers-reduced-motion: reduce

The reduced-motion state must be available to the runtime.

Phase 0 does not need final reduced-motion choreography,
but the infrastructure must exist.

---

# 11. Visibility lifecycle

When the browser tab becomes hidden:

- unnecessary animation work should pause or be minimized
- returning to the tab must not produce a huge delta-time jump
- rendering must resume correctly

---

# 12. Cleanup

Core systems should provide cleanup/dispose behavior where relevant.

Event listeners must be removable.

Three.js resources created by the temporary World should be disposable.

The architecture should not assume resources live forever.

---

# 13. GitHub Pages compatibility

The project will eventually run at:

/Ai-Hen/

Phase 0 must avoid fragile absolute asset paths.

Do NOT configure final deployment unless explicitly requested.

Do NOT add GitHub Actions in this phase.

---

# 14. Visual appearance

The temporary Phase 0 page should remain minimal.

It may loosely use the AI HEN palette:

Ink Black
Night Blue
Moon Silver
Rice Paper

But it must NOT attempt to implement:

- Shanshui
- Moon Gate
- Pavilion
- Chinese architecture
- final typography
- final hero
- final UI
- final transitions

This is a runtime test harness, not the final design.

---

# 15. Code quality

Before completion:

- remove unused Vite starter code
- remove unused starter assets if no longer necessary
- avoid console errors
- avoid TypeScript warnings
- avoid dead code
- avoid unexplained magic numbers where practical
- keep naming consistent
- add comments only where they clarify non-obvious behavior

Do not over-engineer.

---

# 16. Final verification

Phase 0 is complete only when all of the following work:

[ ] npm run dev
[ ] npm run build
[ ] Three.js canvas renders
[ ] Scroll progress reaches 0 → 1
[ ] Smooth progress works
[ ] ?debug=1 works
[ ] Normal URL hides debug UI
[ ] Browser resize works
[ ] Mobile viewport works
[ ] prefers-reduced-motion is detected
[ ] hidden-tab lifecycle works
[ ] no console errors
[ ] no TypeScript errors
[ ] cleanup architecture exists
[ ] no Phase 1 visual work has been implemented

If any item fails, Phase 0 is not complete.