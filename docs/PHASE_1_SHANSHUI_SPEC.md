# Phase 1 — Shanshui Specification

## 愛恨 — ÀI HÈN

Phase 1 establishes the first real visual identity of the experience.

The goal is to create a Chinese shanshui-inspired landscape that initially reads as a nearly flat ink painting and gradually acquires spatial depth as the user scrolls.

This phase does not build the Moon Gate, garden, pavilion, portfolio content, final navigation, audio, or later environments.

---

## 1. Core Experience

The opening should create this feeling:

> “I thought I was looking at a painting… then it started breathing.”

The effect must be subtle, cinematic and restrained.

The scene must not look like:

- generic fantasy China
- a collection of PNGs sliding independently
- a video-game mountain environment
- photorealistic terrain
- cyberpunk
- neon
- a red-moon composition
- an imitation of Kage

The visual direction is inspired by traditional Chinese shanshui painting while remaining original to AI HEN.

---

## 2. Visual Progression

The scene evolves through three states.

### State A — Painting

Approximate scroll range:

0.00 → 0.20

Characteristics:

- composition appears nearly flat
- minimal parallax
- mist is almost still
- camera remains restrained
- mountain layers visually overlap like a painting
- depth should initially be difficult to perceive

### State B — Awakening

Approximate scroll range:

0.20 → 0.60

Characteristics:

- mountain layers begin separating subtly
- foreground gains stronger parallax
- mist begins moving independently
- slight camera push creates spatial depth
- transitions must remain slow and elegant

### State C — Living Landscape

Approximate scroll range:

0.60 → 1.00

Characteristics:

- depth is clearly established
- layers retain their painted appearance
- mist reinforces distance
- foreground provides spatial framing
- scene is ready for the future transition toward the Moon Gate

Phase 1 must stop before building the Moon Gate.

---

## 3. Scene Structure

Recommended depth hierarchy:

CAMERA

↓ foreground ink

↓ near mountains

↓ front mist

↓ mid mountains

↓ rear mist

↓ far mountains

↓ sky / paper wash

The exact Z values may be tuned during implementation.

The visual result is more important than arbitrary numerical spacing.

---

## 4. Layer Groups

### 4.1 Background / Paper Wash

Purpose:

- establish the atmospheric canvas
- provide tonal continuity
- evoke paper and diluted ink without looking aged or yellow

Direction:

- dark rice-paper inspired atmosphere
- Night Blue / Ink Black foundation
- extremely subtle texture
- no strong grain
- no vintage parchment treatment

---

### 4.2 Far Mountains

Purpose:

- establish scale
- provide distant silhouettes

Characteristics:

- low contrast
- partially obscured by atmosphere
- soft ink edges
- limited parallax
- lowest motion intensity

---

### 4.3 Mid Mountains

Purpose:

- carry the primary shanshui composition

Characteristics:

- strongest recognizable mountain forms
- moderate contrast
- visible ink texture
- subtle parallax
- should remain elegant rather than dramatic

---

### 4.4 Near Mountains

Purpose:

- provide depth and composition framing

Characteristics:

- darker values
- stronger parallax than distant layers
- partially cropped by viewport where appropriate
- should not dominate the entire image

---

### 4.5 Foreground Ink

Purpose:

- make depth perceptible without breaking the painting illusion

Possible elements:

- rock silhouettes
- sparse branches
- abstract ink forms
- minimal vegetation-like brush forms

Restrictions:

- no final garden vegetation
- no detailed trees
- no flowers
- no architecture

Foreground motion may be more noticeable than distant layers but must remain restrained.

---

## 5. Mist System

Mist is a major depth tool.

Prefer lightweight layered mist over expensive volumetric simulation.

Recommended structure:

- rear mist layer
- front mist layer

Optional third layer only if visually necessary.

Mist characteristics:

- low opacity
- soft edges
- slow lateral drift
- subtle independent movement
- distance masking
- no obvious looping animation
- no dense smoke effect

Mist should feel atmospheric rather than decorative.

---

## 6. 2.5D Strategy

Phase 1 uses a hybrid 2.5D approach.

Preferred implementation:

- transparent visual layers
- planes positioned at different Z depths
- depth-aware camera composition
- scroll-driven transformations
- lightweight atmospheric effects

Do not build large photorealistic terrain geometry.

Do not create unnecessary high-poly mountains.

Three.js is responsible for:

- spatial composition
- depth
- camera
- parallax
- mist
- animation
- scroll response

Visual mountain artwork should provide the shanshui character.

---

## 7. Assets

Target asset structure:

public/
  shanshui/
    far-mountains.webp
    mid-mountains.webp
    near-mountains.webp
    foreground-ink.webp

Additional mist textures may be added only if required.

Assets should:

- support transparency when needed
- avoid visible rectangular edges
- remain reasonably lightweight
- preserve soft ink transitions
- work on desktop and mobile

Final asset dimensions will be decided after visual prototypes are approved.

Do not invent placeholder final artwork during implementation.

---

## 8. Scroll Behaviour

Scroll remains native.

The existing ScrollDirector is the source of normalized progression.

Phase 1 must reuse:

- rawProgress
- smoothProgress
- reducedMotion
- configurable ranges

Avoid creating a second scroll system.

Different layers should respond at different strengths.

Conceptually:

far mountains:
very low movement

mid mountains:
low movement

near mountains:
moderate movement

foreground:
highest movement

mist:
independent subtle drift + scroll influence

No layer should visibly “fly” toward the camera.

---

## 9. Camera Behaviour

Camera movement must remain minimal.

Allowed:

- gentle forward push
- tiny vertical adjustment
- subtle composition refinement

Avoid:

- aggressive dolly movement
- rotations that expose flat planes
- dramatic orbiting
- large FOV changes

The viewer should perceive the painting gaining depth rather than notice the camera animation itself.

---

## 10. Reduced Motion

When `prefers-reduced-motion` is active:

- eliminate continuous mist drift
- remove decorative idle motion
- greatly reduce parallax
- avoid smooth delayed motion
- preserve the complete visual composition
- scroll progress may update scene states directly

The experience must remain understandable and aesthetically complete.

---

## 11. Responsive Behaviour

Desktop, tablet and mobile may use different composition values.

Mobile must not simply scale the desktop scene.

Consider:

- layer crop
- camera framing
- Z spacing
- mist density
- parallax intensity
- texture resolution
- GPU cost

The principal mountain composition must remain readable on portrait screens.

---

## 12. Performance Targets

Phase 1 must remain lightweight.

Guidelines:

- avoid heavy post-processing
- avoid volumetric ray marching
- avoid unnecessary transparent layers
- reuse materials where appropriate
- keep draw calls controlled
- use compressed WebP textures where appropriate
- cap DPR using the existing Viewport system
- dispose all generated resources

Do not introduce additional dependencies unless absolutely necessary.

---

## 13. Architecture

Recommended structure:

src/
  world/
    World.ts
    shanshui/
      Shanshui.ts
      InkLayer.ts
      MistLayer.ts
      ShanshuiConfig.ts

Responsibilities:

### World

Owns the high-level world and delegates updates.

### Shanshui

Coordinates the complete shanshui environment.

### InkLayer

Represents reusable mountain / foreground painted layers.

### MistLayer

Represents lightweight atmospheric layers.

### ShanshuiConfig

Centralizes composition, depth, motion and responsive tuning values.

Avoid placing all Phase 1 logic directly inside World.ts.

---

## 14. Color Direction

Use the established AI HEN palette:

Ink Black
#07090A

Night Blue
#0B151B

Dark Jade
#17322E

Stone Grey
#747773

Moon Silver
#C8CECA

Rice Paper
#E7E2D7

Seal Red
#921F1D

Seal Red is not required during Phase 1 and must never dominate the scene.

The opening should primarily use ink, navy, stone, silver and rice-paper tones.

---

## 15. Forbidden Phase 1 Work

Do not implement:

- Moon Gate
- garden
- pavilion
- pond final environment
- project corridor
- portfolio projects
- skill section
- Moon Court
- contact section
- dragon
- final navigation
- final typography system
- audio
- large post-processing stack
- final shaders unrelated to Shanshui
- GitHub Pages deployment workflow

---

## 16. Acceptance Criteria

Phase 1 is successful when:

- the scene initially reads as a Chinese ink painting
- depth is initially subtle
- scroll gradually reveals spatial separation
- far, mid, near and foreground layers respond differently
- mist reinforces depth without looking like smoke
- camera motion remains understated
- the composition remains cohesive while moving
- movement never exposes the illusion of simple flat cards
- desktop layout is visually strong
- portrait/mobile composition remains readable
- reduced motion provides a complete static experience
- no Phase 2 Moon Gate work is included
- no TypeScript errors exist
- no browser console errors exist
- `npm run build` succeeds
- resource cleanup remains valid

---

## Phase 1 Mantra

Paint first.

Depth second.

Motion third.

Never let the technology overpower the painting.