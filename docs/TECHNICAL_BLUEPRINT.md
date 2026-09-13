# 愛恨 — TECHNICAL BLUEPRINT

## Objective

Create a cinematic Three.js portfolio while maintaining:

- modular architecture
- predictable scroll behavior
- good desktop performance
- viable mobile performance
- maintainability
- accessibility
- compatibility with GitHub Pages

---

# Runtime architecture

Target architecture:

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

  utils/

  styles/
    main.css

  main.ts

Future phases may introduce:

world/
  Shanshui.ts
  MoonGate.ts
  Mountains.ts
  Atmosphere.ts
  Water.ts
  Garden.ts
  Pavilion.ts
  Vegetation.ts

assets or resource systems should be added only when required.

---

# Experience

`Experience` coordinates the runtime.

Responsibilities:

- Three.js Scene
- Camera
- Renderer
- World
- ScrollDirector
- animation lifecycle
- resize lifecycle
- visibility lifecycle

Experience must coordinate systems rather than contain all implementation details.

---

# Renderer

Use Three.js WebGLRenderer.

Foundation requirements:

- antialiasing where appropriate
- device pixel ratio capped for performance
- responsive resizing
- modern Three.js color management
- appropriate output color space
- configurable tone mapping
- renderer diagnostics available in debug mode

Do not add expensive post-processing in Phase 0.

---

# Camera

Use PerspectiveCamera.

The camera will eventually follow a continuous cinematic journey controlled by scroll.

Phase 0 only needs the infrastructure required to support future camera choreography.

Camera behavior must support different compositions for:

- desktop
- tablet
- mobile

Do not assume one camera path will work for every viewport.

---

# Scroll system

Use:

- native browser scrolling
- GSAP
- ScrollTrigger
- a custom ScrollDirector

Do not introduce a smooth-scroll library during Phase 0.

ScrollDirector should expose normalized progress.

Expected concepts:

- raw progress
- smooth progress
- reduced-motion behavior
- future scene ranges

Example conceptual ranges:

0.00 — Painting
0.15 — Awakening
0.25 — Moon Gate
0.35 — Crossing
0.50 — Garden
0.65 — Pavilion
0.80 — Projects
1.00 — Ending

Exact values will be tuned later.

---

# Animation loop

Use `requestAnimationFrame`.

The runtime should provide delta time / elapsed time where useful.

Avoid unnecessary allocations inside the render loop.

Pause or minimize work while the browser tab is hidden.

---

# Responsive strategy

Desktop and mobile may use different:

- camera positions
- scene density
- particle counts
- shadow quality
- texture resolution
- vegetation density
- animation complexity

Mobile should not simply be a smaller desktop scene.

---

# Reduced motion

Respect:

`prefers-reduced-motion`

Reduced-motion mode should eventually provide:

- significantly reduced camera travel
- minimal parallax
- restrained ambient animation
- accessible navigation

---

# Asset pipeline

Preferred runtime 3D format:

GLB / glTF

Blender will be used later for major architecture such as:

- Moon Gate details
- pavilion
- rocks
- selected environmental props

Future optimization may include:

- Draco
- Meshopt
- KTX2

Do not add these systems before they are needed.

---

# Shanshui strategy

The opening landscape should use a hybrid approach.

Possible techniques:

- layered planes
- depth-separated ink imagery
- procedural geometry
- atmospheric fog
- masks
- shaders
- subtle displacement
- parallax

Do not model an entire photoreal mountain environment unnecessarily.

The artistic goal matters more than geometric complexity.

---

# HTML / WebGL relationship

WebGL controls:

- environment
- camera
- atmosphere
- architecture
- cinematic movement

HTML controls:

- titles
- navigation
- project information
- About content
- Skills
- Contact information
- accessibility

Important portfolio information must remain readable without depending exclusively on WebGL.

---

# Performance

Performance must be considered from the start.

Guidelines:

- cap device pixel ratio
- monitor draw calls
- monitor triangles
- avoid excessive transparent objects
- avoid unnecessary shadow casters
- reuse geometry/materials where reasonable
- avoid huge textures
- dispose GPU resources when removed
- minimize per-frame object creation

Debug mode should eventually expose useful renderer information.

---

# Debug mode

Development-only debug interface should be available through:

`?debug=1`

Possible diagnostics:

- FPS
- scroll progress
- smooth progress
- viewport dimensions
- pixel ratio
- draw calls
- triangles
- active scene / range
- camera coordinates

The production experience should remain visually clean.

---

# GitHub Pages

Repository:

9pvbloo/Ai-Hen

Expected public path:

/Ai-Hen/

The application must not assume deployment at `/`.

Use Vite-compatible asset handling.

Deployment configuration will be implemented in a later phase.

---

# Phase discipline

Do not build multiple visual phases simultaneously.

Phase 0 must not create:

- final mountains
- Moon Gate
- pavilion
- final water
- garden
- vegetation
- shaders
- project corridor
- audio

Phase 0 creates the runtime foundation only.

Every subsequent visual phase should build upon a stable previous phase.