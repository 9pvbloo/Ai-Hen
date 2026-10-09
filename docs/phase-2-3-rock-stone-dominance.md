# Phase 2.3 — stone-dominant rock material follow-up

Initial state: phase-2-3-genkan-interior-architecture, clean, 74108cf5cf2cf1f788a1d6d814aa57356a7942c9.

## Material corrections
The previous shader multiplied authored green/jade instance tones into the rock albedo. Those tones could give even moss-free mineral a green cast. The rock shader now preserves the luminance hierarchy of vertex/instance/base colors while replacing their chroma with a restrained cool mineral grey. Geometry attributes and instance colors themselves remain untouched.

Broad world-space mineral modulation ranges from .80 to 1.19 to retain value variation at the garden camera's normal distance. Procedural albedo macro amplitude rises 17 → 32, medium regions 19 → 25, seam darkening 8 → 13. Fine grain/pores, roughness and normal generation are unchanged: readability is concentrated in larger mineral regions rather than extra high-frequency noise or stronger normal distortion.

Moss no longer uses upward-facing tops as automatic eligible surfaces. Its two patch fields are gated by damp base pockets; outside that region the moss mask is zero. Its tint is less green and less saturated (.76/.82/.70 versus .72/.86/.64). Approximately 90% mineral / 10% localized moss is the artistic target, not a measured screen-area claim. Contact dampening is still an approximate instance-origin mask, not geometry-derived cracks or a physical shadow/exposure mask.

Only production files GardenRockSurface.ts and GardenRockMineral.ts changed. Camera, light colors/intensities/shadows, paths, timing, ownership, geometry, transforms, composition, lanterns, mansion, leaves and other systems are untouched. No new assets, geometry, maps, programs or texture reads.

## Review boundary
The user explicitly declined temporary internal captures and accepted leaving visual review pending. No screenshot, gallery or video was generated. The pass is designed to make mineral regions legible from the normal garden view, but that artistic result is NOT claimed as visually verified. Technical render tests do not replace that review.

## Validation
The initial runtime attempt found the local server stopped (connection refused). Vite was restarted on 127.0.0.1:5174 and the full test was rerun.

npm run build passed; the existing >500 kB bundle warning remains. The existing rock material verifier passed: other surface maps byte-identical, 116 original protected source files unchanged, roughness map .8471–.9569, normal mean/max tilt 2.476/14.427 degrees, periodic boundary error <2e-13, all 16 shared maps disposed. Its reported +1 uploaded map compares against the older pre-realism 79c7f45 baseline; this follow-up adds zero maps relative to 74108cf.

Full runtime rerun: PASS. Desktop 1440x900, tablet 820x1180 and portrait 390x844; reveal/garden/threshold/interior; forward/reverse normal and reduced-motion scrolling; four resize cycles; visibility/bfcache; repeated disposal. No console, page, shader or WebGL errors. Strict budget comparison against scripts/rock-material-after.json passes for calls, triangles, geometries, textures, programs and shadow refresh in garden/threshold/interior; reveal metrics also match the recorded baseline.

Garden BEFORE → AFTER:
- Desktop: 83 → 83 calls; 316692 → 316692 triangles.
- Tablet: 82 → 82 calls; 273739 → 273739 triangles.
- Portrait: 77 → 77 calls; 235931 → 235931 triangles.
- Geometries 70 → 70; textures 42 → 42; warmed programs 52 → 52; lights 25 → 25; shadow lights 4 → 4. Map resolution/count and memory unchanged.
- Cleanup: 0 geometries, 0 programs, 4 pre-existing renderer textures retained; WebGL error 0. This viewport simulation is not a physical mobile GPU test.

Production scope verification via git diff 74108cf -- src shows exactly the two intended rock material files. git diff 74108cf --check passes. Documentation and scripts/rock-stone-dominance-after.json record this follow-up separately from prior reports.

No visual approval claimed; no capture generated. Phase 2.4 not started. No PR. No push performed.
