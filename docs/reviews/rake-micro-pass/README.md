# Karesansui micro-pass

Only the rake profile and its local cavity response changed. Mansion, lanterns,
walls, trees, camera, global lighting, ground datum and stone placements are unchanged.

- Frequency +25% in all four fields (spacing -20%).
- Physical peak height 0.038 → 0.02736 m (-28%), also shared by the analytical relief.
- Narrower rounded profile with smooth shoulders; nine cross-section samples retained.
- Local cavity factor 0.14 → 0.10, preserving warm lantern lighting and material color.
- Shader field precision and mean height updated to match the new physical profile.

## Validation

`npm run build` and `git diff --check` passed. Vite retains its bundle-size advisory.
Existing `verify-night-garden.cjs` with `GARDEN_PHYSICAL_REVIEW=1` passed before and after.
No new dependencies or production review hooks.

- 21 checkpoints: 1440×900 desktop, 820×1180 tablet, 390×844 portrait, including reduced motion.
- 25 walk frames, grazing/stone/lantern closeups, physical silhouette and parallax captures.
- Zero captured JS/shader/WebGL errors or context losses.
- CPU/GLSL coherence: 128 samples, maximum phase error 0.000160.
- No visible z-fighting in inspected captures; all outer ridge shoulders remain below
  rendered ground by at least 1.45 mm. No coplanar overlay was added.
- All 21 stone undersides remain buried by at least 4.24 cm; no floating stones observed.
- Raised ridge vertices stay at least 8.47 cm outside stone footprints.
- Geometry remains static during the walk, deterministic and explicitly disposable.

Denser geometry increases rake triangles from 71,248 to 88,352 on desktop,
42,912 to 52,992 on tablet, and 25,328 to 31,280 on portrait, in the same single mesh.
Responsive checks use Chrome viewport emulation, not physical mobile devices.

## Evidence

- [Comparison](comparison.jpg): before left, after right; approved walk above, lantern closeup below.
- [Checkpoints](checkpoints.jpg): desktop/tablet/portrait rows; 20/40/60/80/100% columns.
- [Browser and geometry report](report.json).

Full original captures remain locally in `logs/rake-micro-pass/before` and `after`.
