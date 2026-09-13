# 愛恨 — AI HEN
## Project Instructions

愛恨 — ÀI HÈN is a cinematic interactive 3D portfolio.

Visual references:

- `public/references/ai-hen-storyboard.png`
- `public/references/ai-hen-visual-bible.png`

These references define the approved visual direction.

---

## Core concept

The experience combines:

- Chinese shanshui landscape painting
- moonlit Chinese gardens
- ink and rice-paper aesthetics
- restrained traditional architecture
- cinematic scroll storytelling
- modern interactive 3D

The central theme is duality:

- Love / Hate
- Tradition / Modernity
- Stillness / Movement
- Ink / Light
- 2D / 3D

---

## Technical stack

Use:

- Vite
- TypeScript
- Three.js
- GSAP
- GSAP ScrollTrigger
- HTML
- CSS

Do not introduce React, Vue, Svelte, Angular or another framework.

Do not introduce new dependencies unless they solve a clear technical requirement.

---

## Architecture rules

Keep the application modular.

`main.ts` must remain minimal.

Do not create a giant monolithic file.

Major systems must have separate responsibilities.

Expected systems include:

- Experience
- Renderer
- Camera
- ScrollDirector
- World
- Resources
- Atmosphere

Future visual systems should also remain isolated.

---

## Visual rules

The project must feel:

- cinematic
- quiet
- poetic
- elegant
- restrained
- premium

Primary palette:

- Ink Black `#07090A`
- Night Blue `#0B151B`
- Dark Jade `#17322E`
- Stone Grey `#747773`
- Moon Silver `#C8CECA`
- Rice Paper `#E7E2D7`
- Seal Red `#921F1D`

Seal Red is an accent only.

The moon is white / pearl / cold silver.

---

## Never do

Do NOT turn the project into:

- cyberpunk
- neon China
- generic fantasy temple imagery
- a theme park
- excessive red lanterns
- excessive architecture
- a giant dragon spectacle
- a red-moon aesthetic
- a copy of Kage

Kage is an inspiration for cinematic storytelling only.

Do not copy its visual identity, code, assets, composition or scenes.

---

## Performance rules

Design for desktop and mobile from the beginning.

Prefer:

- optimized geometry
- compressed assets when appropriate
- limited pixel ratio
- controlled draw calls
- reusable materials
- responsible texture sizes
- explicit disposal of Three.js GPU resources

Pause unnecessary rendering work when the document is hidden.

Support `prefers-reduced-motion`.

Avoid unnecessary continuous calculations.

---

## Content rules

Three.js creates the world.

HTML communicates the portfolio content.

Important text and navigation should not exist only inside WebGL.

Accessibility and usability matter.

---

## Deployment

The project will eventually be deployed with GitHub Pages.

Repository:

`9pvbloo/Ai-Hen`

Production path:

`/Ai-Hen/`

Avoid hardcoded asset paths that will break under a non-root base path.

---

## Development workflow

Work phase by phase.

Do not implement future phases unless explicitly requested.

Current development order:

0. Foundation
1. Shanshui
2. Moon Gate
3. Night Garden
4. Pavilion
5. Visual Polish
6. Project Corridor
7. Ink / Skills
8. Moon Court / Contact
9. Audio and Microinteractions
10. Final Optimization

Every phase must be reviewed before progressing.

Build the world first.
Polish the world.
Then tell the story.