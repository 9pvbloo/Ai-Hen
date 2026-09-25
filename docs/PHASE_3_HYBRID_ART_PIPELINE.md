# PHASE 3 — HYBRID ART PIPELINE

## 1. Purpose

This document defines the final production strategy for Phase 3 — Crossing / Night Garden of 愛恨 — ÀI HÈN.

The current procedural Night Garden proved that the architecture, crossing, camera, runtime, responsive system, and performance budget are healthy.

However, pure procedural geometry is not producing the desired cinematic quality efficiently.

Phase 3 therefore moves to a hybrid production model:

- physical 3D where spatial depth matters
- instanced geometry where repetition benefits from true parallax
- art-directed transparent cutouts where silhouette quality matters most
- 2.5D layered scenery for distant depth
- procedural materials for surface richness
- fog / haze layering for atmospheric integration

The target is not photorealism.

The target is a cinematic Jiangnan-inspired garden frame that feels authored.

---

## 2. Core Production Principle

> The viewer judges the final frame, not the polygon source.

Use 3D when the camera must move around or through something.

Use cutouts when a silhouette needs artistic richness but does not require full volumetric inspection.

Use layered planes when depth can be sold by parallax, fog, scale, and contrast.

Use procedural textures when simple geometry needs believable surface variation.

---

## 3. What Remains Physical 3D

These elements remain true Three.js geometry:

- Moon Gate
- Moon Gate tunnel / stone reveal
- camera crossing corridor
- physical garden ground
- stone path
- pond mesh
- hero scholar-rock group
- selected secondary rocks
- bamboo trunks near camera
- shoreline geometry
- simple Pavilion Phase 3 hint
- terrain anchors used to hide card intersections

These objects establish real space.

---

## 4. What Becomes Hybrid / Cutout Driven

Use art-directed transparent image cards for:

- willow foreground framing
- secondary bamboo foliage mass
- pond reeds
- jade low foliage
- scholar-rock foreground silhouette
- distant tree line

Current assets:

```text
public/night-garden/
├── willow-foreground-left.png
├── bamboo-midground-right.png
├── pond-reeds-cluster.png
├── jade-foliage-foreground.png
├── scholar-rock-foreground.png
└── distant-tree-line.png
```

These assets are original project assets and are not copied from Kage.

---

## 5. What Remains 2.5D

Use layered planes / procedural silhouettes for:

- distant shanshui ridges
- far mountain layers
- atmospheric tree silhouettes
- mist bands
- distant architectural obscuration
- sky / moon atmosphere

The distant world should feel spatial without becoming a full terrain simulation.

---

## 6. Layering Model

Recommended depth stack after crossing:

```text
CAMERA
  ↓
foreground willow / scholar-rock cutout
  ↓
physical path / ground / hero rock
  ↓
pond / reeds / low foliage
  ↓
bamboo physical trunks + foliage cutout
  ↓
mist / haze
  ↓
distant tree line
  ↓
shanshui ridge layers
  ↓
Pavilion hint
  ↓
sky / moon / halo
```

This ordering is conceptual, not a strict renderOrder list.

Prefer real Z depth where possible.

---

## 7. Foreground Willow Asset

Asset:

```text
willow-foreground-left.png
```

Role:

- primary upper-left framing element
- create an authored silhouette
- add near-camera depth
- soften the procedural feeling of the scene
- direct the eye toward pond / path / Pavilion hint

Recommended behavior:

- use one large transparent plane or slightly curved card
- place close enough for visible parallax
- keep outside the center corridor
- rotate subtly toward camera
- no obvious billboard snapping
- preserve strong negative space

Do not center it.

Do not let it cover the Moon Gate crossing corridor.

---

## 8. Willow Fade Behavior

The willow card must never be crossed visibly by the camera.

Recommended:

- full opacity only after REVEAL begins
- hold through ARRIVAL
- begin fade when camera-to-card distance drops below a safety threshold
- fully fade before near-plane contact
- reverse scroll restores opacity symmetrically

Use smoothstep-based distance fade.

Do not use abrupt visibility toggles.

---

## 9. Bamboo Hybrid Strategy

Asset:

```text
bamboo-midground-right.png
```

Use together with limited physical bamboo stalk geometry.

Physical component:

- a few real trunks
- node segmentation
- controlled lean
- true parallax near camera

Cutout component:

- richer leaf mass
- branch complexity
- cinematic silhouette

This avoids building hundreds of leaves in geometry.

Place primarily on the right side or rear-right midground to counterbalance the willow.

---

## 10. Pond Reeds Asset

Asset:

```text
pond-reeds-cluster.png
```

Role:

- break the pond shoreline
- hide overly clean water / terrain intersections
- create scale
- create local detail without extra geometry
- improve water readability

Use in 1–2 placements maximum.

Prefer partial occlusion by rocks / terrain.

Avoid evenly repeating the same card.

If reused, vary:

- scale
- Y position
- slight rotation
- horizontal flip only if the image still reads naturally

---

## 11. Jade Foliage Asset

Asset:

```text
jade-foliage-foreground.png
```

Role:

- hide geometric joins
- soften hero-rock bases
- create controlled foreground mass
- reinforce Dark Jade palette

Use sparingly.

Best use:

- lower-right or lower-left edge
- partially cropped by viewport
- close to terrain
- behind or beside a hero rock

Avoid covering path readability.

---

## 12. Scholar Rock Foreground Asset

Asset:

```text
scholar-rock-foreground.png
```

This is not a replacement for the hero physical rock.

Use it as:

- near-frame silhouette
- compositional crop
- optional foreground depth layer

The hero rock remains physical 3D.

The card exists to create a richer cinematic edge where full 3D detail is unnecessary.

---

## 13. Distant Tree Line Asset

Asset:

```text
distant-tree-line.png
```

Role:

- replace procedural repeated tree blobs
- bridge garden geometry and distant shanshui ridges
- create an organic horizon
- hide the sense of an empty background

Place far enough to receive strong atmospheric attenuation.

It should have:

- lower contrast
- cooler values
- mist overlap
- almost no visible texture detail at final camera distance

---

## 14. Alpha / Transparency Strategy

All cutouts must use proper alpha handling.

Preferred first strategy:

- transparent material
- alphaTest when possible for harder foliage edges
- controlled opacity for atmospheric assets
- depthTest enabled
- depthWrite determined per asset

Suggested:

Foreground foliage:
- depthTest: true
- depthWrite: false or selective depending on artifacts
- alphaTest where edges allow

Distant tree line:
- depthTest: true
- depthWrite: false
- opacity affected by fog / progress

Never allow rectangular card boundaries to become visible.

---

## 15. Card Edge Safety

Every cutout must be checked for:

- visible rectangular edges
- dark premultiplied-alpha halos
- white PNG fringe
- hard corners
- texture bleeding

If needed:

- add edge fade in shader/material
- crop transparent bounds tighter
- increase plane size relative to visible artwork
- keep transparent border around silhouette

No asset should read as a flat rectangular image.

---

## 16. Camera-Relative Fade System

Create one reusable helper or local utility for card fading.

Inputs:

- camera world position
- card world position
- fade start distance
- fade end distance
- Phase 3 local progress

Output:

- target opacity

Requirements:

- forward and reverse symmetric
- no popping
- no separate animation loop
- driven by existing update lifecycle

This behavior should be shared by all cards that the camera may approach.

---

## 17. Responsive Cutout Profiles

### Desktop

Use full set:

- willow
- bamboo
- reeds
- jade foliage
- scholar-rock foreground
- distant tree line

### Tablet

Reduce:

- scholar-rock foreground optional
- smaller willow
- reduced jade foliage
- keep bamboo and tree line

### Portrait

Prioritize:

- one framing foliage asset
- bamboo OR willow, not necessarily both
- reeds if pond remains visible
- distant tree line
- remove nonessential near-camera cutouts

Portrait must remain readable and uncluttered.

---

## 18. Physical Geometry to Keep

Preserve these current systems unless integration requires minor changes:

- `GardenGround`
- `GardenPath`
- `GardenPond`
- core hero rocks
- `GardenLighting`
- Phase 3 state logic
- crossing camera
- Moon Gate
- responsive profile architecture
- reduced motion
- debug
- lifecycle

Do not rewrite working systems merely because the art pipeline changes.

---

## 19. Procedural Geometry to Reduce

After cutouts are integrated, reduce or remove procedural geometry that duplicates them.

Likely candidates:

- excess willow branch ribbons
- dense procedural leaf groups
- procedural distant tree blobs
- unnecessary bamboo leaf geometry
- low-value shoreline plant geometry
- foreground rock geometry used only for silhouette

Goal:

replace weak procedural complexity with stronger authored imagery.

---

## 20. Hero Rock Strategy

Keep one principal scholar-rock group in true 3D.

Requirements:

- strong vertical silhouette
- asymmetric massing
- meaningful negative-space / erosion suggestion
- moonlit rim
- dark base integrated with foliage
- visible from more than one crossing state

Do not attempt to make every rock equally detailed.

One good hero rock is enough.

---

## 21. Stone Material Pipeline

Stone should no longer rely only on flat color + roughness.

Generate inexpensive procedural textures using Canvas.

Recommended maps:

- base color variation
- height
- roughness
- normal derived from height

Texture size can remain modest, e.g.:

```text
256×256
or
512×512
```

Use repeat wrapping.

Target surfaces:

- path stones
- scholar rocks
- selected wall / ground areas

Do not create unique textures per stone.

---

## 22. Height-to-Normal Strategy

Use a generated grayscale height field and derive a normal map.

Possible pipeline:

```text
Canvas height texture
↓
sample neighboring pixels
↓
gradient / Sobel-style normal estimation
↓
Canvas normal texture
```

The objective is microdetail:

- pores
- stone grain
- wet irregularity

Not visible large-scale displacement.

---

## 23. Wet Path Strategy

Path should read damp through material response.

Use:

- dark stone base
- procedural color variation
- roughness variation
- restrained normal detail
- slightly lower roughness on select upper surfaces
- moonlit grazing highlights

Avoid mirror-like wetness.

Avoid globally glossy stones.

---

## 24. Pond Strategy

Keep current lightweight pond shader architecture.

Improve final look with:

- dark blue-black depth tint
- Fresnel at grazing angles
- elongated moon reflection cue
- very low-frequency distortion
- subtle shoreline fade
- controlled opacity / depth relationship
- no planar reflection pass

The pond should read as water because of lighting and context, not because it mirrors the whole scene.

---

## 25. Moon Reflection

Moon reflection should be a broken vertical / diagonal glint, not a circular blur.

Recommended:

- screen/world projected directional streak
- low-frequency noise breaks
- narrow core
- wider faint halo
- fade with view angle
- restrained intensity

No bright white neon streak.

---

## 26. Atmospheric Stack

Recommended atmosphere:

1. renderer/scene fog
2. low garden mist
3. one or two haze planes
4. distant tree attenuation
5. shanshui ridge attenuation
6. moon halo

Avoid many overlapping transparent planes.

Use few strong layers.

---

## 27. Haze Planes

Use large soft cards.

Requirements:

- boundaries outside camera framing
- very low opacity
- large feathered alpha
- slow motion only
- optional additive or normal blending depending on look
- never form visible rectangles

Reduced motion:

- stop drift
- keep static atmospheric depth

---

## 28. Shanshui Ridge Strategy

Distant ridges should reconnect Phase 3 to Phase 1 visually.

Use:

- irregular painted-like ridge silhouettes
- multiple Z layers
- decreasing contrast with distance
- cool atmospheric tint
- mist overlap

Do not build large physical terrain.

The ridges should feel like the original painting becoming spatial geography.

---

## 29. Moon Strategy

Moon remains:

- pearl white
- slight ice-blue
- not red

Recommended composition:

- moon disc
- wide faint halo
- atmospheric haze interaction

No postprocessing dependency required.

The moon is a compositional anchor, not a glowing UI element.

---

## 30. Pavilion Phase 3 Strategy

The Pavilion stays a hint only.

Use:

- simple dark roof silhouette
- minimal body
- slight upturned-eave suggestion
- tiny restrained warm value
- mist partial occlusion

Do not add detailed roof construction yet.

Do not turn Pavilion into the hero.

---

## 31. Camera Composition Checkpoints

Do not judge the scene only at progress `1.0`.

Review at minimum:

- Threshold
- COMMIT
- PASSAGE
- REVEAL
- ARRIVAL
- ESTABLISHED

At each checkpoint evaluate:

- silhouette
- focal point
- negative space
- depth
- foliage framing
- Moon Gate visibility
- pond readability
- Pavilion hint

The final scene must work as a sequence of authored frames.

---

## 32. Cutout Appearance Timing

Recommended general timing:

COMMIT:
- no foreground cards
- distant tree line may be faint

PASSAGE:
- no near foreground cards
- only deep garden hints

REVEAL:
- reeds / bamboo / tree line begin appearing

ARRIVAL:
- willow / jade foliage / scholar-rock framing become active

ESTABLISHED:
- complete composition visible

This protects the crossing corridor.

---

## 33. Reverse Scroll Behavior

Every visibility rule must work backward.

No one-way animation assumptions.

When reversing:

- foreground cards fade before crossing the camera
- distant layers restore gradually
- Shanshui regains dominance naturally
- no black occlusion
- no cutout pop
- no rectangular card reveal

---

## 34. Mobile Strategy

Mobile is not desktop with smaller scale.

Prefer:

- stronger center composition
- fewer near-plane cards
- one primary framing silhouette
- simplified vegetation
- smaller pond footprint
- hero rock retained
- tree line retained
- fewer haze planes

Avoid edge clutter on portrait.

---

## 35. Performance Strategy

The hybrid pipeline should improve perceived quality without large geometry growth.

Preferred approximate desktop target:

- draw calls: <= 30–35
- triangles: <= 20k–30k
- textures: increased modestly by authored cutouts and generated maps
- no heavy postprocessing
- no reflection render pass
- no shadow-map dependency

Image cutouts should replace weak geometry, not simply stack on top of everything.

---

## 36. Texture Loading

Use existing project asset path style.

Assets live under:

```text
/public/night-garden/
```

Runtime paths should remain compatible with Vite and future GitHub Pages deployment.

Avoid fragile root assumptions if the existing project uses a base path helper.

Load once and reuse.

Do not create duplicate TextureLoader requests for the same asset.

---

## 37. Color Management

Ensure authored PNG assets remain coherent with renderer color management.

Check:

- sRGB handling for color textures
- no double gamma
- no washed-out foliage
- no unintended bright edges

Generated non-color maps:

- normal
- roughness
- height

must not be treated as sRGB color data.

---

## 38. Material Cohesion

Cutouts must not look pasted over the 3D environment.

Unify them through:

- shared palette
- fog
- opacity
- moonlight tint
- atmospheric contrast
- depth placement
- partial occlusion by real geometry

If necessary, apply a subtle cool multiply/tint in material.

---

## 39. Debug Additions

Optional useful debug fields:

- hybrid cards active
- willow opacity
- bamboo card opacity
- reeds opacity
- tree-line opacity
- camera-to-nearest-card distance
- hybrid profile: desktop/tablet/portrait

Do not turn debug into a placement editor.

---

## 40. Reduced Motion

Hybrid art must still work when static.

Reduced motion:

- no cutout sway required
- no vegetation movement required
- mist stops
- water movement minimized
- distance fading still works from scroll/camera position
- composition remains complete

---

## 41. Implementation Order

When Codex returns, implement in this order:

### Pass A — Integration foundation
- card loader / shared material helper
- depth placement
- fade helper
- distant tree line

### Pass B — Major framing
- willow
- bamboo
- reeds

### Pass C — Grounding
- jade foliage
- scholar-rock foreground
- remove redundant procedural foliage

### Pass D — Surface richness
- procedural stone base/roughness/normal
- wet path tuning
- hero rock material tuning

### Pass E — Atmosphere
- haze
- shanshui ridges
- moon integration

### Pass F — Final composition
- desktop
- tablet
- portrait
- reverse scroll
- reduced motion
- performance

Do not try to solve everything in one uncontrolled rewrite.

---

## 42. Acceptance Criteria

Hybrid Phase 3 is accepted only when:

1. Night Garden no longer reads as a procedural blockout.
2. Crossing remains unchanged and clean.
3. Foreground foliage creates cinematic framing.
4. No cutout rectangle is visible.
5. Cards fade before camera contact.
6. Reverse scroll restores cards symmetrically.
7. Bamboo reads as bamboo.
8. Willow reads as willow.
9. Pond reeds improve shoreline realism.
10. Low foliage hides geometric joins.
11. Distant tree line no longer looks like repeated blobs.
12. Hero rock remains true 3D.
13. Path remains physical and gains believable stone microdetail.
14. Pond reads as water.
15. Shanshui ridges create distant depth.
16. Moon integrates with haze.
17. Pavilion remains only a hint.
18. Desktop composition approaches the reference boards.
19. Tablet remains coherent.
20. Portrait remains intentionally simplified.
21. Reduced motion works.
22. No second RAF exists.
23. No second ScrollDirector exists.
24. No console errors exist.
25. Performance remains controlled.

---

## 43. Explicit Out of Scope

Do not implement in this pipeline:

- full Pavilion
- Pavilion interior
- project corridor
- audio
- complex postprocessing stack
- planar reflections
- SSR
- physics
- volumetric fog engine
- large external asset packs
- copied Kage code or artwork

Kage is a technical/art-direction reference only.

---

## 44. Final Production Rule

Do not ask:

> “Can this object be modeled procedurally?”

Ask:

> “What is the cheapest technique that makes this frame beautiful while preserving spatial credibility?”

That is the Phase 3 hybrid pipeline.
