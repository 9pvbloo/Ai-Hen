# Phase 2.3 practical lighting audit

Start: phase-2-3-genkan-interior-architecture, fa2c8ba1c7cdf282e267ae0b5665cfef03de3a27. Clean index/worktree; no untracked files. All 23 Phase 2.3 commits from 7aa13b8 through fa2c8ba retained (git log e0d49f2..fa2c8ba).

Audited Renderer, GardenLighting, PavilionLighting/Glow/Materials/MaterialPalette/Source, PracticalBounce/Containment, LanternNetwork/Lanterns/LanternMaterials, GardenMaterials and all GenkanInterior modules.

Renderer: sRGB, NoToneMapping, exposure 1, shadows disabled, default PCF. Installed Three r186 has removed PCFSoftShadowMap; use PCFShadowMap. No postprocessing planned.

Scene: 21 lights, no casters or receivers. Garden rig: hemisphere + 2 directional, 7 point practicals, 2 pavilion spots + 2 pavilion points, 4 interior spots. Remaining 3 lights belong to earlier worlds. Hall source z=4.5 is outside doorway z=-.10; lantern sources y=.65-.85 exceed scaled paper center (.62 * scale). Paper emission 1.35 and halo .16 compete with real consequence. Terrain bounce includes strong .50-.90 cores at fixtures without lights; this is not occluded indirect transport. Interior side paper has no exterior opening; remove it and its symmetric fills.

Budget: one directional + two architectural spots, zero point shadows. A point shadow requires six views; no justified benefit without visual evidence. Major opaque geometry only. Cache maps between door/layout changes. Small shared procedural maps for wood, plaster, paper and tataki; retain existing terrain microdetail.

Baseline measured headless Chrome, same machine, 1440x900 / 820x1180 / 390x844 (viewport emulation, not physical devices). Calls/triangles garden, threshold, interior:
- Desktop: 79/306528, 68/237944, 50/104304; sampled FPS 90/76/76.
- Tablet: 78/264511, 62/182130, 49/100030; sampled FPS 82/77/76.
- Portrait: 73/227333, 64/179809, 45/91228; sampled FPS 78/76/76.
All: 62 geometries, 25 textures, 26 programs, GL error 0. FPS is a short synchronized headless sample, not a hardware guarantee.

No screenshots, videos, external assets, camera edits, atmosphere edits, push or Phase 2.4.
