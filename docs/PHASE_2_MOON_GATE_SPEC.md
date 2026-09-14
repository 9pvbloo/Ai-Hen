# 愛恨 — ÀI HÈN

## Phase 2 — Moon Gate Specification

> The painting has awakened.
> Now it reveals a threshold.

---

## 1. Phase Goal

Phase 2 introduces the **Moon Gate** as the first unquestionably physical 3D object in the experience.

The visitor begins inside the Shanshui world created during Phase 1. At first, the landscape still feels like a living ink painting. As the user continues scrolling, the composition gradually reorganizes around a circular architectural form.

The Moon Gate must not feel like a decorative object placed on top of the landscape.

It must feel as if it had always existed inside the painting and is only now becoming visible.

The intended emotional progression is:

```text
Living painting
    ↓
Something circular emerges
    ↓
Architectural depth becomes visible
    ↓
The Moon Gate becomes the visual anchor
    ↓
The viewer approaches the threshold
    ↓
Phase ends just before crossing
```

The desired reaction is:

> “The painting was hiding a real place.”

Phase 2 does NOT yet reveal the complete Night Garden.

---

## 2. Narrative Function

The Moon Gate represents the transition between two visual realities:

```text
PAINTING
    ↓
DEPTH
    ↓
ARCHITECTURE
    ↓
THRESHOLD
    ↓
WORLD
```

Phase 1 established:

- Ink
- Mountains
- Mist
- Depth
- Slow movement

Phase 2 introduces:

- Physical geometry
- Material
- Architectural scale
- Spatial perspective
- A clear destination

Phase 3 will introduce:

- The Night Garden
- Fully spatial environment
- Water / garden architecture
- The world beyond the threshold

The gate therefore acts as the bridge between Phase 1 and Phase 3.

---

## 3. Core Visual Principle

The Moon Gate must remain elegant and restrained.

It should feel inspired by traditional Jiangnan / Suzhou garden architecture without becoming ornamental or theatrical.

The gate should NOT resemble:

- A fantasy portal
- A videogame teleportation ring
- A glowing magical doorway
- A cyberpunk portal
- A temple entrance
- A giant monument
- A neon circle
- A red Chinese festival gate

The visual language must remain:

- Quiet
- Architectural
- Stone-like
- Moonlit
- Weathered
- Refined
- Cinematic

---

## 4. 3D Strategy

Unlike the Phase 1 Shanshui layers, the Moon Gate should be **true 3D geometry**.

This is intentional.

The visual evolution of the project should be perceptible:

```text
2D painting
    ↓
2.5D painting
    ↓
real 3D Moon Gate
    ↓
real 3D garden
```

The gate must react correctly to:

- Camera perspective
- Parallax
- Depth
- Lighting
- Occlusion
- Atmospheric haze

It must not be implemented as a PNG billboard.

---

## 5. Initial Geometry Strategy

The first implementation should preferably use procedural Three.js geometry.

Do not require Blender or a GLB asset during the first Moon Gate implementation unless procedural geometry proves visually insufficient.

Recommended structure:

```text
MoonGate
├── Outer architecture
├── Circular opening
├── Inner tunnel / thickness
├── Side wall masses
├── Ground connection
└── optional subtle architectural details
```

The geometry should be simple enough to remain inexpensive.

A possible implementation may use:

- Shape
- Path
- ExtrudeGeometry
- BoxGeometry
- PlaneGeometry
- Custom lightweight geometry

The circular opening must have actual depth.

The inside edge of the gate must reveal thickness when the camera approaches.

The user should eventually perceive:

- Front surface
- Inner circular wall
- Rear edge

This physical depth is essential.

---

## 6. Architectural Design

The gate should resemble a traditional Chinese Moon Gate integrated into a garden wall.

Primary form:

- Large circular opening
- Thick masonry/plaster wall
- Slightly irregular stone or plaster character
- Restrained side walls
- Strong circular silhouette

The design should remain minimal.

Avoid excessive:

- Roof ornamentation
- Carved dragons
- Gold
- Bright red
- Decorative columns
- Hanging lantern clusters
- Inscriptions
- Complex reliefs

The circle itself is the ornament.

---

## 7. Circle as Brand Motif

The circular form is one of the central visual motifs of 愛恨.

The Moon Gate introduces this motif physically.

Later phases may subtly reuse circles through:

- Moon
- Reflections
- Project reveals
- UI masks
- Transitions
- Contact / Moon Court

However, Phase 2 must not turn the circle into a UI gimmick.

The Moon Gate remains an architectural object first.

---

## 8. Composition

At the beginning of Phase 2, the gate should not immediately dominate the screen.

Its presence should be discovered progressively.

Suggested composition evolution:

### Stage A — Hidden Threshold

The Shanshui still dominates.

The Moon Gate may initially be:

- Obscured by mist
- Partially hidden behind foreground ink
- Low contrast
- Visually integrated into the mountain composition

The viewer should not immediately read it as architecture.

### Stage B — Recognition

As scroll progresses:

- Mist separates slightly
- Gate contrast increases
- Geometry becomes more readable
- Circular opening emerges
- Architectural depth becomes visible

The circle becomes the new visual anchor.

### Stage C — Approach

The gate occupies more of the composition.

The camera moves subtly toward it.

The surrounding Shanshui becomes less dominant.

The viewer begins to perceive that the gate exists in a different spatial reality than the painted mountains.

### Stage D — Threshold

The circular opening becomes large and central enough to imply crossing.

The scene beyond the gate must remain mostly abstract.

Phase 2 ends here.

The viewer should feel:

> “I am about to enter.”

Phase 3 performs the actual reveal of the Night Garden.

---

## 9. Scroll Narrative

Do not create a second scroll system.

Reuse the existing:

```text
ScrollDirector
```

Phase 2 should receive normalized progress from the existing runtime.

Do not scatter global scroll values across multiple classes.

All Moon Gate ranges must be configurable.

Recommended provisional global progression:

```text
0.00 → 0.18
Painting

0.18 → 0.48
Awakening

0.48 → 0.68
Living Landscape

0.58 → 0.74
Moon Gate emergence

0.74 → 0.90
Moon Gate recognition / approach

0.90 → 1.00
Threshold
```

The intentional overlap between Shanshui and Moon Gate is important.

The gate should emerge FROM the existing landscape rather than appear after it.

These ranges are provisional.

They must be defined in configuration and remain easy to rebalance as later phases extend the experience.

---

## 10. Camera

Camera movement must remain controlled.

Do not transform the experience into a fly-through.

Recommended behavior:

### Initial Moon Gate Reveal

Almost no camera movement.

The gate emerges primarily through:

- Opacity / atmosphere
- Depth
- Scale perception
- Layer separation

### Approach

Introduce a restrained forward movement.

Camera should remain:

- Centered or almost centered
- Level
- Stable
- Cinematic

Avoid:

- Orbiting
- Aggressive yaw
- Strong pitch
- Sudden FOV changes
- Handheld movement
- Camera shake

The architecture should create the depth, not camera tricks.

---

## 11. Perspective Transition

One important objective of Phase 2 is the transition from painted space to geometric space.

At the beginning:

```text
mountains dominate perception
```

Near the end:

```text
architecture dominates perception
```

This should happen gradually.

The user should never see a sudden transition such as:

```text
PNG landscape
CUT
3D gate
```

The gate must visually inherit:

- Atmospheric color
- Haze
- Contrast
- Lighting direction
- Compositional rhythm

from the Shanshui environment.

---

## 12. Materials

The Moon Gate should use physically believable but restrained materials.

Initial implementation does NOT require expensive texture sets.

Preferred appearance:

```text
dark grey stone
+
cool plaster
+
subtle moonlit highlights
```

Suggested palette:

- Ink Black `#07090A`
- Night Blue `#0B151B`
- Dark Jade `#17322E`
- Stone Grey `#747773`
- Moon Silver `#C8CECA`
- Rice Paper `#E7E2D7`

Seal Red `#921F1D` should NOT be used on the gate itself.

Possible material:

```text
MeshStandardMaterial
```

or another lightweight physically responsive material.

Surface qualities:

- High roughness
- Low metallic
- Subtle variation
- Restrained highlights

Avoid:

- Glossy marble
- Metallic architecture
- Perfect white plaster
- Glowing materials
- Exaggerated normal maps

---

## 13. Lighting

Lighting should reveal the geometry without making it look like a 3D product render.

Primary lighting idea:

### Cool Moonlight

A soft cool light should define:

- Outer circular edge
- Inner tunnel
- Side wall planes

The gate should feel illuminated by the same moonlit atmosphere as the future garden.

Possible secondary illumination:

A very subtle warmer or neutral light may appear beyond the opening.

This must NOT reveal the complete garden.

It may only suggest:

> There is another space behind this wall.

Avoid visible light sources during Phase 2.

No lantern hero objects yet.

---

## 14. Atmospheric Integration

Mist remains essential.

The gate should interact visually with the existing Phase 1 mist.

Possible treatment:

```text
foreground mist
gate
rear mist / atmospheric depth
```

The gate should sometimes disappear partially into haze.

Do not cover the entire gate uniformly.

Atmospheric depth should help reveal its physical form.

Recommended:

- Subtle depth-based fading
- Controlled transparent mist planes
- Existing Phase 1 mist reuse where possible

Do not introduce volumetric fog.

---

## 15. Gate Interior

The circular opening must not show a fully developed Night Garden yet.

Phase 2 may show only:

- Darkness
- Distant haze
- Subtle moonlit gradient
- Vague silhouettes
- Soft reflected light

No detailed pavilion.

No finished pond.

No project content.

No visible complete garden.

The space beyond the gate should create curiosity.

---

## 16. Moon Alignment

A literal moon is optional during Phase 2.

If introduced, it must be subtle.

A possible cinematic moment:

```text
Moon Gate circle
      +
distant pale moon
      ↓
brief visual alignment
```

This should never resemble a logo animation or perfect artificial target.

The moon must remain:

- White
- Pearl
- Slightly cool
- Physically plausible

Never:

- Red
- Orange
- Neon blue

If the literal moon complicates composition, defer it to a later phase.

The gate itself is sufficient for Phase 2.

---

## 17. Shanshui Interaction

The existing Phase 1 landscape must remain alive.

Do not replace it.

As the gate gains importance:

- Far mountains remain visible
- Mid mountains may fade slightly
- Foreground ink may help frame the gate
- Mist may expose the circular form
- Parallax can become slightly less important

The Shanshui gradually becomes environment rather than protagonist.

Do not abruptly fade all six layers to zero.

---

## 18. Responsive Composition

Desktop, tablet and mobile require different compositions.

Do not simply scale the desktop gate.

### Desktop

Gate may sit:

- Near center
- Slightly off-center if composition benefits
- Surrounded by substantial negative space

The circular opening may become large near the threshold.

### Tablet

Reduce environmental width.

Keep circular silhouette clearly readable.

Avoid excessive wall cropping.

### Mobile Portrait

The gate becomes more dominant vertically.

Composition may need:

- Different scale
- Different Y position
- Different camera distance
- Reduced side-wall visibility

The circle must remain identifiable even when the viewport is narrow.

Do not allow the gate to become an oval due to incorrect scaling.

---

## 19. Reduced Motion

Respect:

```text
prefers-reduced-motion
```

With reduced motion:

- No idle gate movement
- No decorative camera drift
- Greatly reduced approach movement
- Minimal parallax
- Mist drift disabled
- State transitions can occur directly

The gate should remain visually understandable without motion.

---

## 20. Motion Rules

The Moon Gate itself should NOT float, rotate or animate unnaturally.

Architecture is stationary.

Motion should come from:

- Viewer approach
- Atmosphere
- Shanshui separation
- Lighting evolution
- Fog
- Scroll progression

Do not animate:

- Gate rotation
- Gate breathing
- Pulsing
- Bouncing
- Wobbling
- Magical glow

The physical architecture must feel stable.

---

## 21. Suggested Architecture

Recommended structure:

```text
src/
└── world/
    └── moonGate/
        ├── MoonGate.ts
        ├── MoonGateGeometry.ts
        ├── MoonGateMaterials.ts
        └── MoonGateConfig.ts
```

Responsibilities:

### MoonGate.ts

Coordinates:

- Gate root group
- Progress
- Responsive layout
- Visibility
- Lighting integration
- Phase state

Should not contain all geometry implementation details.

### MoonGateGeometry.ts

Creates:

- Circular architecture
- Wall sections
- Gate depth
- Optional ground connection

No scroll logic.

### MoonGateMaterials.ts

Creates and disposes:

- Stone/plaster materials
- Shared material properties

Avoid duplicate materials unnecessarily.

### MoonGateConfig.ts

Contains:

- Responsive scale
- X/Y/Z placement
- Dimensions
- Wall thickness
- Opening radius
- Animation ranges
- Camera approach values
- Lighting values

Avoid magic numbers in `MoonGate.ts`.

---

## 22. World Integration

`World.ts` should continue acting as a coordinator.

Preferred conceptual structure:

```text
World
├── Shanshui
└── MoonGate
```

World should not absorb Moon Gate implementation logic.

Expected update flow:

```text
Experience
    ↓
World.update(...)
    ├── Shanshui.update(...)
    └── MoonGate.update(...)
```

Do not create a second animation loop.

---

## 23. Scene Depth

The Moon Gate must occupy a meaningful Z position relative to the Shanshui planes.

The exact values should be visually tuned.

Conceptually:

```text
camera

foreground ink

near mountains / mist

MOON GATE

mid / far atmospheric landscape

background
```

However, this ordering may intentionally overlap.

The gate should appear partially integrated with the mountains during emergence.

Transparent planes must be handled carefully.

Review:

- `renderOrder`
- `depthWrite`
- `depthTest`
- `alphaTest` where appropriate

Avoid transparency artifacts.

---

## 24. Performance Budget

Phase 2 should remain inexpensive.

Target:

- Low polygon count
- Few materials
- Few additional draw calls
- No postprocessing
- No dynamic shadows unless absolutely justified
- No expensive custom shaders
- No volumetric lighting

Current Phase 1 baseline:

```text
7 draw calls
20 triangles
6 textures
DPR ≤ 2
```

Phase 2 may increase these values, but the Moon Gate should remain lightweight.

A procedural gate should not require thousands of unnecessary segments.

Circular geometry must be visually smooth but economical.

---

## 25. Shadows

Do not introduce expensive real-time shadows by default.

Depth should primarily come from:

- Material shading
- Light direction
- Geometry
- Atmospheric occlusion
- Interior darkness

If shadows are tested, they must be justified by a significant visual improvement.

Otherwise keep shadows disabled.

---

## 26. Asset Policy

No external Moon Gate model should be downloaded without explicit approval.

No marketplace assets.

No copied Kage assets.

No copied architecture from other websites.

Reference imagery may inform:

- Proportions
- Stone texture
- Wall construction
- Composition

but the final Moon Gate must be original.

If a Blender/GLB version is eventually created, it should be authored specifically for 愛恨.

---

## 27. Debug Mode

Existing:

```text
?debug=1
```

must remain functional.

Phase 2 may add lightweight diagnostics such as:

```text
Moon Gate:
Hidden / Emerging / Recognized / Approach / Threshold

Gate progress:
0.0000 → 1.0000

Gate visibility:
0.00 → 1.00

Camera approach:
value

Layout:
desktop / tablet / portrait
```

Do not turn the debug panel into a developer dashboard.

Keep it compact.

---

## 28. Loading

Phase 2 should not require a visible loading screen.

If no external textures or GLB files are used, gate geometry should be immediately available.

If future assets are introduced:

- Handle delayed loading
- Handle failed loading
- Handle destroy-before-load-completion
- Never block the complete experience unnecessarily

---

## 29. Cleanup

All Phase 2 resources must be disposable.

Dispose:

- Geometries
- Materials
- Textures if introduced
- Event listeners if introduced

The existing Experience lifecycle must remain valid.

No resource leaks.

---

## 30. Accessibility

Important content must not depend exclusively on WebGL.

Phase 2 itself is visual, but it must not interfere with future semantic HTML content.

Respect reduced motion.

Avoid rapid flashes.

Avoid high-frequency contrast changes.

---

## 31. Phase 2 States

Recommended internal state model:

```text
HIDDEN

EMERGING

RECOGNIZED

APPROACH

THRESHOLD
```

Approximate meaning:

### HIDDEN

Gate barely distinguishable from the environment.

### EMERGING

Circular silhouette begins to separate from the Shanshui.

### RECOGNIZED

Viewer clearly understands this is architecture.

### APPROACH

Camera subtly moves toward gate.

### THRESHOLD

Opening dominates composition and prepares Phase 3.

---

## 32. Visual Acceptance Criteria

Phase 2 is visually approved only if all of the following are true:

- The Moon Gate feels physically 3D.
- It does not look like another PNG layer.
- It feels native to the Shanshui environment.
- Its circular silhouette becomes the main focal point naturally.
- The gate does not feel like a fantasy portal.
- Camera motion remains restrained.
- No sudden visual cut occurs between Phase 1 and Phase 2.
- The interior creates curiosity without revealing Phase 3.
- Architecture remains elegant and believable.
- Mobile composition remains readable.
- The gate does not overpower the scene too early.
- The transition feels cinematic rather than technical.

Primary visual question:

> Does the viewer feel that a physical doorway has emerged from inside the painting?

---

## 33. Technical Acceptance Criteria

Phase 2 is technically approved when:

- `npm run build` passes.
- TypeScript strict mode passes.
- No console errors occur during normal use.
- Existing Phase 1 behavior remains functional.
- One scroll system remains in use.
- One animation loop remains in use.
- `?debug=1` remains functional.
- Responsive layouts work.
- Reduced motion works.
- Tab visibility lifecycle still works.
- Resource disposal works.
- No Phase 3 content is implemented.
- No unnecessary dependencies are introduced.

---

## 34. Out of Scope

Do NOT implement during Phase 2:

- Complete Night Garden
- Pavilion
- Finished pond
- Water reflections
- Project Corridor
- Skills
- Ink interaction system
- Moon Court
- Contact
- Final navigation
- Final typography system
- Audio
- Dragon
- Full postprocessing
- Bloom
- Depth of field
- Film grain
- Final deployment
- Final asset compression pass

Those belong to later phases.

---

## 35. Phase Boundary

Phase 2 begins when the Shanshui landscape has become a living environment.

Phase 2 ends when the user reaches the Moon Gate threshold.

Conceptually:

```text
Phase 1
THE PAINTING
↓
AWAKENING
↓
LIVING LANDSCAPE

Phase 2
MOON GATE EMERGENCE
↓
RECOGNITION
↓
APPROACH
↓
THRESHOLD

Phase 3
CROSSING
↓
NIGHT GARDEN
```

The actual crossing belongs to Phase 3.

---

## 36. Design Mantra

> Do not place a portal inside the painting.

> Reveal that the painting was hiding a doorway.

And:

> Architecture must feel more real than the world that surrounds it.

That contrast is the purpose of Phase 2.