# Phase 2.3 — practical sources and stone lantern refinement

Start HEAD: d84d914f5803801c490cfb45e268d1dd1dff5941.
Branch: phase-2-3-genkan-interior-architecture. Existing tracked tree clean; two user-provided reference PNGs untracked and preserved.

Read threejs skill, current lighting/material/ownership implementations, and approved storyboard/visual bible plus both local stone references. Reference filenames show a low stone chamber in the large-path image and tall toro in the small-ambient image; the explicit brief governs hierarchy: tall path, compact secondary.

Audit: secondary prototype was timber/paper without a stone roof; eight sources use much weaker custom diffuse transport than the seven PBR points. Wall boxes already exist at four wall datums. No round pendant exists. House/paper/bounce use unrelated amber RGB values. Three cached shadow maps currently belong to moon, hall and floor andon.

Scope: reconstruct luminaires at frozen anchors, unify practical chromatic family, bounded window-to-frame response, pendant-owned interior light. Preserve architecture, camera, ownership, scroll, moon/sky, exposure and layouts. No Phase 2.4, media, external dependencies, push or PR.

Numeric baseline: scripts/lantern-premium-baseline.json; same-machine headless Chrome, no screenshots. 23 lights, three shadows, 66 geometries, 39 textures, 45 warmed programs. All three profiles stabilize at 75 synchronized FPS. This ceiling is not GPU headroom.
