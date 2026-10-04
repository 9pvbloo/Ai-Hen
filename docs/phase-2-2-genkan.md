# Phase 2.2 — Genkan threshold

Base audited: `8200ce9012fa533837444dbd0b136fccf245109e`; clean branch `phase-2-2-genkan-threshold`. Threejs skill applied. Local only, no PR/push or visual artifacts.

## Architectural audit

`GardenPavilionFacade.createEntry` calls `addPavilionScreen` at local Z −.10: width 4.30, bottom 2.78, height 2.39, four leaves, stile .12, pitch 1.045, paper width .925 / height 2.15 / thickness .045 at Z −.23. Paper centers X −1.5675, −.5225, .5225, 1.5675, Y 3.975. Three shared internal .12-wide stiles and four crossbars (.065 high at Y 3.4731) use the structure material. Outer stiles and horizontal rails remain fixed.

Geometry is BoxGeometry instancing by finish, not independent leaf groups. Paper uses the existing `wallEntry` material (ivory albedo, roughness .94, warm emissive intensity .78 × visibility), with source shaping driven by its instance translation. The glow batch derives four planes from these same paper matrices. Moving only the wood/paper without updating glow would leave false light in the opening.

Mansion transform: X 3.2, Z −53.4, yaw −.035; root Y is sampled ground minus 1.73. The actual door is the local Z −.10 opening, not the root origin. Sill top is 2.78. Five steps reach local Y 2.46, landing 2.58, covered deck 2.72. Existing facade thresholds are at Z 5.75 and 2.66.

Three central opaque blockers must leave the aperture: screen backing at Z −.44; ceremonial slab at −.74; central hall shadow block whose front is −.52. Replace only those with a shallow enclosed dark recess; preserve flanking room blocks.

Approved camera arrival is derived from `NightGardenCameraPath.getArrival()`, intentionally about 12.7 units ahead of the door for portrait framing. Its source and entire 0…1 story range stay frozen. A new physical scroll segment will follow it, with explicit Genkan camera ownership. At close distance a fixed 45° portrait cannot contain the full exterior frame: stop before the inner sill on the covered approach, using aperture framing rather than resizing architecture or changing FOV.
