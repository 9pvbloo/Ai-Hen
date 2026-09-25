# Phase 3 — Crossing / Night Garden Specification

## 1. Purpose

Phase 3 transforms 愛恨 — ÀI HÈN from a layered painted world into a believable three-dimensional place.

Phase 1 established the shanshui painting. Phase 2 revealed the Moon Gate as the first true 3D architectural threshold. Phase 3 crosses that threshold and establishes the Night Garden.

Primary emotional idea:

> The painting was not an image. It was the entrance to a place.

Phase 3 must feel continuous with Phase 2 and must not behave like a scene swap.

## 2. Narrative Role

Narrative progression:

THE PAINTING → AWAKENING → MOON GATE → CROSSING → NIGHT GARDEN → PAVILION → PROJECT CORRIDOR → INK / SKILLS → MOON COURT → RETURN TO PAINTING

Phase 3 owns Crossing, the physical garden reveal, the first complete 3D environment, establishing water/stone/vegetation/mist/moonlight, and preparing the visual destination for Phase 4.

Phase 3 does not own the finished Pavilion.

## 3. Phase Start Boundary

Phase 3 begins exactly where Phase 2 ends:

- Moon Gate state: `THRESHOLD`
- Gate progress: `1.0000`
- Viewer is close to the circular opening
- Camera has not crossed the opening
- Shanshui is still visible
- Moon Gate remains the dominant architectural element

No jump, cut, teleport, fade-to-black or loading interruption is allowed.

## 4. Phase End Boundary

Phase 3 ends once the viewer is fully inside the Night Garden.

At the endpoint:

- the camera has crossed the Moon Gate
- the physical garden is fully established
- the painted shanshui no longer dominates the view
- the Moon Gate becomes entrance context behind or around the viewer
- water, stone, vegetation and mist define the world
- a distant Pavilion hint may establish direction
- the complete Pavilion remains unbuilt

Phase 4 begins when the Pavilion becomes the main destination.

## 5. Design Mantras

> The painting was not an image. It was the entrance to a place.

> Cross the threshold. Do not cut to another scene.

> The garden is composed, not populated.

> Silhouette before detail.

> Moonlight before decoration.

> Phase 3 reveals the world. Phase 4 reveals the destination.

## 6. Emotional Target

The Night Garden should feel quiet, humid, moonlit, ancient, elegant, restrained, cinematic, physical, contemplative and slightly mysterious.

The viewer should feel that they have entered somewhere real, not loaded another scene.

## 7. Visual Direction

Reference language:

- Jiangnan / Suzhou garden restraint
- moonlit Chinese garden architecture
- shanshui composition translated into spatial depth
- dark pond surfaces
- scholar rocks
- bamboo and willow silhouettes
- layered humidity and atmospheric depth

Avoid cyberpunk, neon, red-dominant lighting, fantasy portal effects, theme-park China, generic temple scenes, decorative overload, dense jungle, particle spectacle and excessive lanterns.

## 8. Color Language

Primary palette:

- Ink Black `#07090A`
- Night Blue `#0B151B`
- Dark Jade `#17322E`
- Stone Grey `#747773`
- Moon Silver `#C8CECA`
- Rice Paper `#E7E2D7`
- Seal Red `#921F1D`

Night Garden should primarily use blue-black, dark jade, charcoal, cool grey stone, moon silver and muted vegetation. Seal Red remains a minor accent only.

## 9. Moonlight

Moonlight must remain white, pearl or slightly ice-blue. Never red.

Lighting hierarchy:

1. cool directional moonlight
2. subtle ambient / hemisphere fill
3. optional very restrained warm practical bounce

Warm light must never compete with the moon.

## 10. Crossing Concept

The crossing is the core event of Phase 3.

Recommended progression:

THRESHOLD → COMMIT → PASSAGE → REVEAL → ARRIVAL → NIGHT GARDEN ESTABLISHED

The transition must feel spatial. The viewer should perceive the thickness of the Moon Gate tunnel, increasing parallax, the painted layers losing authority, physical garden elements gaining depth, atmosphere shifting from illustrated to spatial, and the old world disappearing naturally behind geometry and fog.

## 11. Phase 3 Scroll States

Recommended local normalized progress:

### 0.00–0.15 — COMMIT

Purpose: the viewer decides to enter.

Behavior:

- camera begins moving through the threshold
- Moon Gate remains dominant
- Shanshui still visible
- Night Garden only faintly visible beyond the opening
- mist begins increasing inside the tunnel
- no sudden lighting change

### 0.15–0.35 — PASSAGE

Purpose: make the doorway physically believable.

Behavior:

- camera enters the Moon Gate thickness
- stone reveal and tunnel depth become obvious
- Shanshui is partially occluded
- garden silhouettes start appearing
- pond reflections become hinted
- Moon Gate edges move strongly in parallax
- no clipping

### 0.35–0.55 — REVEAL

Purpose: reveal that the painting led to a physical place.

Behavior:

- camera exits the tunnel
- physical terrain becomes readable
- pond, path and rocks appear
- Shanshui fades compositionally rather than by opacity alone
- mist bridges painted and physical worlds
- vegetation begins framing the view

### 0.55–0.80 — ARRIVAL

Purpose: allow the viewer to understand the garden.

Behavior:

- camera slows
- foreground depth becomes stable
- pond and path establish composition
- scholar rocks form silhouettes
- bamboo / willow create restrained framing
- Moon Gate becomes entrance context behind the viewer
- subtle Pavilion destination may appear

### 0.80–1.00 — NIGHT GARDEN ESTABLISHED

Purpose: hold the new world before Phase 4.

Behavior:

- camera movement becomes minimal
- Night Garden is fully readable
- pond, stone path, rocks, vegetation and mist are balanced
- moonlight defines hierarchy
- distant Pavilion hint may become slightly clearer
- no Pavilion hero reveal yet

## 12. Camera Choreography

Camera motion should remain cinematic and restrained.

Preferred:

- primary Z movement
- small Y correction
- very small X adjustment if needed
- subtle look-target evolution
- no dramatic yaw
- no roll
- no game-like free movement
- no rollercoaster trajectory

Environment parallax should communicate most of the depth. Reverse scrolling must reproduce the transition cleanly in reverse.

## 13. Camera Safety

During the crossing:

- camera must never intersect Moon Gate geometry
- near clipping plane must be verified
- tunnel radius must leave sufficient camera clearance
- no camera snapping
- no sudden FOV changes
- no tunnel wall flicker
- no depth fighting

The camera path should be testable with debug markers if necessary.

## 14. Moon Gate Integration

The approved Phase 2 Moon Gate must be preserved.

Phase 3 may integrate its wall mass with real garden terrain, improve lower grounding using physical environment geometry, reveal more believable rear-side context, and use garden rocks/mist/vegetation to complete the composition.

Phase 3 must not redesign the circular opening, change the established proportions without strong justification, convert it into an ornate structure, add fantasy effects, or rebuild Phase 2 from scratch.

## 15. Garden Composition

The garden should be composed around a few strong masses:

1. Moon Gate / entrance
2. stone path
3. pond
4. one or two major rock groups
5. restrained vegetation clusters
6. atmospheric depth
7. distant architectural hint

The garden should not feel populated with random assets. Each object must have a compositional role.

## 16. Ground / Terrain

Ground should be simple and low-cost.

Preferred:

- subtle non-flat variation
- dark damp soil / stone context
- enough geometry to avoid a perfectly flat game floor
- no terrain engine
- no displacement-heavy mesh

The ground should primarily support path, pond edge, rocks, vegetation and Moon Gate anchoring.

## 17. Stone Path

The path is a visual guide, not the hero.

Preferred:

- irregular stone paving
- restrained spacing
- subtle variation in scale and rotation
- damp roughness
- moonlit edge highlights

Avoid perfect grids, repeated identical stepping stones, bright path materials and a game-like waypoint feeling.

The path should guide the eye toward the future Pavilion direction.

## 18. Pond

The pond is a major compositional element.

Desired behavior:

- dark
- calm
- nearly still
- reflective without becoming a mirror
- slight distortion
- moonlight response
- subtle depth color

Avoid ocean waves, turquoise water, high-frequency normals, mirror-perfect planar reflection and expensive reflection passes unless later proven necessary.

## 19. Water Rendering Strategy

Recommended first implementation:

- simple custom shader or carefully tuned material
- Fresnel-based reflection response
- low-frequency normal distortion
- dark depth tint
- subtle specular moon response
- optional fake environmental reflection gradient
- no planar reflection render target in first pass

If a custom shader is used, keep it isolated to the pond module.

The water should sell atmosphere, not technical spectacle.

## 20. Garden Rocks

Scholar-rock influence should appear through silhouette.

Use a small number of strong compositions:

- one principal midground rock group
- one secondary pond-edge group
- optional foreground silhouette

Rocks should break horizontal lines, frame water, create scale, add depth and visually connect shanshui language to the physical garden.

Avoid large random scatter.

## 21. Rock Geometry Strategy

Preferred:

- handcrafted low-poly procedural forms
- reused base geometry with controlled transforms
- deterministic variation
- merged geometry or InstancedMesh when appropriate

Silhouette quality matters more than polygon density.

## 22. Vegetation

Preferred vegetation:

- bamboo clusters
- willow silhouette
- restrained low plants
- occasional branch framing
- sparse leaf masses

Avoid jungle density, large asset packs, thousands of unique leaves, colorful flower fields and strong wind animation.

Vegetation exists to frame architecture and depth.

## 23. Bamboo

Bamboo should be treated as a cluster, not individual decorative sticks.

Recommended:

- few grouped stalk meshes
- shared material
- minimal leaf cards or stylized leaf clusters
- slight silhouette variation
- optional extremely subtle motion

Mobile may reduce stalk count and remove most leaf detail.

## 24. Willow / Framing Vegetation

Willow or equivalent foliage may be used to create top-corner framing, pond-edge silhouette and soft movement against a moonlit background.

It should never dominate the composition. A single strong silhouette is preferable to multiple trees.

## 25. Mist / Humidity

The garden should feel humid.

Do not require true volumetric fog.

Use layered techniques:

- scene fog
- low translucent mist meshes
- subtle depth-gradient planes
- slow drifting haze
- atmospheric color falloff

Mist should soften transitions rather than hide design problems.

## 26. Atmospheric Perspective

Depth should be reinforced through lower contrast at distance, slightly cooler distant values, fog density, reduced saturation, selective silhouette loss and slower background motion.

This carries the shanshui depth logic into 3D.

## 27. Background Depth

The garden must not end at a visible wall of emptiness.

Background may use:

- dark tree silhouettes
- distant wall fragments
- mountain remnants
- mist layers
- subtle architecture silhouette

Avoid building a complete second environment.

## 28. Pavilion Hint

The full Pavilion belongs to Phase 4.

Phase 3 may show only:

- a partial roofline
- dark architectural silhouette
- a tiny warm reflected accent
- obscured structure behind mist
- distant destination framed by vegetation

Do not build detailed roof geometry, interior, hero framing, Pavilion interaction or close-up materials.

The viewer should think: “There is somewhere deeper to go.”

## 29. Render Ordering / Depth Strategy

Prefer real depth testing wherever possible. Use renderOrder only for deliberate atmospheric layering.

Rules:

- opaque terrain / rocks / gate use normal depth behavior
- pond uses controlled transparency or shader strategy
- mist uses depth-aware ordering
- vegetation cards must avoid obvious sorting artifacts
- no global `depthWrite = false` hacks except where justified
- no full-screen transparency stacks that flatten the scene

## 30. Material Strategy

Preferred materials:

- MeshStandardMaterial for stone, terrain and most vegetation
- simple custom shader for pond only if useful
- MeshPhysicalMaterial only when clearly justified

Material language:

- rough
- subdued
- non-metallic
- damp rather than glossy
- moon-responsive

Avoid plastic surfaces.

## 31. Technical Module Structure

Recommended structure:

```text
src/world/nightGarden/
  NightGarden.ts
  NightGardenConfig.ts
  GardenGround.ts
  GardenPath.ts
  GardenPond.ts
  GardenRocks.ts
  GardenVegetation.ts
  GardenAtmosphere.ts
  GardenLighting.ts
```

Optional if crossing logic becomes complex:

```text
src/world/crossing/
  CrossingDirector.ts
```

Responsibilities:

- `NightGarden.ts`: coordinator only
- `NightGardenConfig.ts`: layout and profile data
- `GardenGround.ts`: base ground and pond edge support
- `GardenPath.ts`: path composition
- `GardenPond.ts`: water mesh/material/update
- `GardenRocks.ts`: rock groups
- `GardenVegetation.ts`: bamboo / willow / low vegetation
- `GardenAtmosphere.ts`: mist and depth effects
- `GardenLighting.ts`: garden-local light rig
- `CrossingDirector.ts`: only if needed to map Phase 3 local progress to crossing states

No God Object.

## 32. Runtime Integration

Continue using the existing `Experience`, `World`, `Camera`, `Renderer`, `ScrollDirector`, resize lifecycle, visibility lifecycle and RAF.

Never add a second RAF, second ScrollDirector, physics engine, alternate scene manager or independent animation framework.

## 33. Performance Budget

Phase 2 baseline:

- ~11 draw calls
- ~1,820 triangles
- 8 textures

Recommended Phase 3 desktop target:

- ideally <= 30 draw calls
- ideally <= 25k–40k triangles
- modest texture growth
- no heavy postprocessing
- no dependency on real-time shadows
- no reflection render pass in first implementation

Recommended mobile profile:

- fewer vegetation instances
- fewer mist layers
- simplified pond material
- lower DPR when appropriate
- simplified rock groups
- reduced background detail

Performance should be measured after implementation, not guessed.

## 34. Shadow Strategy

Do not enable global real-time shadows by default.

Preferred first pass:

- directional light without shadow map
- baked/fake contact darkening
- material variation
- ambient occlusion implied through geometry/material
- strategic dark planes or ground gradients if necessary

If real-time shadows are later considered, they must prove clear visual value and remain tightly scoped.

## 35. Responsive Composition

### Desktop

- widest pond read
- stronger lateral rock composition
- full bamboo / willow framing
- longest visible path
- strongest distant Pavilion hint

### Tablet

- tighter path
- reduced lateral vegetation
- pond remains readable
- Moon Gate crossing remains centered and safe

### Portrait Mobile

Mobile is not scaled desktop.

Use:

- simplified foreground
- fewer rocks
- reduced vegetation
- smaller pond footprint
- cleaner central path
- stronger silhouette hierarchy
- controlled gate framing
- reduced atmospheric layers

The composition must remain intentional at 390×844.

## 36. Reduced Motion

Reduced-motion behavior:

- progress responds directly to scroll
- crossing distance significantly reduced
- no unnecessary camera easing
- mist drift stopped or nearly stopped
- water movement minimized
- vegetation movement stopped
- no essential information depends on motion
- Night Garden remains visually understandable

## 37. Debug Mode

Extend `?debug=1` only with useful Phase 3 information.

Recommended diagnostics:

- Phase 3 state
- local Phase 3 progress
- crossing progress
- garden visibility
- camera crossing offset
- pond visibility
- mist intensity
- layout profile
- draw calls
- triangles
- textures

Debug mode is not an editor.

## 38. Lifecycle / Cleanup

Phase 3 modules must support resize, visibility pause/resume, reduced-motion changes if the current architecture supports them, and disposal.

Dispose geometries, materials, generated textures, shader resources and event handlers. No orphaned RAF callbacks.

## 39. Accessibility

The 3D environment is visual storytelling.

Rules:

- essential text must remain available in HTML when later introduced
- no important information exists only inside WebGL
- reduced motion must be respected
- avoid flashes
- avoid sudden brightness changes
- no audio requirement in Phase 3

## 40. Asset Policy

Prefer procedural or lightweight in-project geometry first.

External models may be evaluated later only when they offer clear artistic value, licensing is clean, topology is optimized, file size is appropriate and style matches the project.

Do not require paid assets. Do not introduce large asset packs.

## 41. Failure Modes

Reject the implementation if any of these appear:

- crossing behaves like scene teleportation
- camera clips the Moon Gate
- garden appears before the threshold in a distracting way
- Shanshui abruptly disappears
- pond looks like game water
- architecture becomes red-dominant
- vegetation becomes jungle-like
- random prop scattering
- fantasy portal effects
- complete Pavilion built early
- excessive draw-call growth
- second RAF
- second ScrollDirector
- mobile composition is just scaled desktop
- reverse scroll breaks continuity

## 42. Validation Plan

Validate:

- build passes
- strict TypeScript passes
- `git diff --check`
- normal URL has no debug artifacts
- `?debug=1` works
- all Phase 3 states
- forward scroll
- reverse scroll
- threshold continuity
- camera clearance
- desktop layout
- tablet 820×1180
- portrait 390×844
- reduced motion
- resize
- hidden-tab resume
- disposal
- console cleanliness
- render statistics
- Phase 4 boundary

## 43. Acceptance Checklist

Phase 3 is accepted only when:

1. Crossing feels spatial, not like a scene swap.
2. Camera passes through the Moon Gate without clipping.
3. Forward and reverse scrolling both work.
4. Shanshui naturally gives way to physical garden space.
5. Night Garden clearly reads as 3D.
6. Moon Gate remains connected to the environment.
7. Pond reads as water without an expensive reflection system.
8. Stone path establishes direction.
9. Rocks create depth without clutter.
10. Vegetation creates framing without clutter.
11. Mist supports depth without hiding composition.
12. Moonlight remains white / pearl / ice-blue.
13. Scene is not red-dominant.
14. Scene does not read as cyberpunk or fantasy portal.
15. Full Pavilion is not implemented.
16. Desktop composition is intentional.
17. Tablet composition is intentional.
18. Portrait composition is intentional.
19. Reduced motion works.
20. No second RAF exists.
21. No second ScrollDirector exists.
22. No console errors exist.
23. Resources dispose correctly.
24. Performance remains inside the agreed Phase 3 budget.
25. Phase 3 ends with the garden established and Phase 4 prepared.

## 44. Phase 3 / Phase 4 Boundary

Phase 3 answers:

> What exists beyond the Moon Gate?

Answer: a real moonlit garden.

Phase 4 answers:

> Where is this journey taking us?

Answer: the Pavilion.

Phase 3 may imply the Pavilion. Phase 3 must not fully reveal, detail or activate it.

## 45. Final Implementation Principle

Build the crossing first. Then establish the physical garden. Then validate composition. Only after the world reads clearly should detail be added.

The first implementation goal is not decoration. It is the moment where the viewer believes they have crossed from painting into place.
