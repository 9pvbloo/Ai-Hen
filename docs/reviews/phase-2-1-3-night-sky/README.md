# Phase 2.1.3 — Night Sky / Moon / Distant Atmosphere

Base: `a6a1b7dbeecad8339dc08cef494b5bc44558574a`. Branch: `phase-2-1-3-night-sky-moon-atmosphere`. Local only; no PR or push.

## Audit before implementation

- GardenBackground owns a 140×100 sky plane at Z −55, a radius-1.6 moon at (−4.2, 6.3, −91.8), an 18-unit halo, two painted mountain cards and a legacy pavilion cue. At entry the moon spans only about 2° and is partly hidden by the mansion roof. Responsive profiles shrink it further.
- The sky has only one UV-space linear color blend, no variation across longitude, no stars and no layered scattering. Finite card bounds also become visible in oblique diagnostic views.
- Lunar shading is two multiplied sine waves, with a very broad faded rim; it lacks recognizable irregular maria, craters and spherical illumination.
- GardenAtmosphere owns four low-opacity depth slabs (desktop four, tablet three, portrait two). NightGarden owns global FogExp2, lighting and reveal. Global fog and lighting must remain unchanged.
- Painted mountain cards use shared geometry, independent materials, asynchronous cached textures and normal transparent depth ordering. Moon/halo must remain behind these ridges and the mansion, without writing depth.
- MoonGateAperture injects a world-space fragment mask into all garden Mesh materials. Background additions must be constructed before attachment; asynchronously loaded ridges are attached on ready. No screen-space overlay may bypass the opening.
- Renderer uses NoToneMapping and SRGB output. Existing custom background shaders write display-oriented RGB directly. Keep that convention within this isolated system; do not change global exposure/color management.

## Implementation plan

Extract separate moon and sky owners, improve backdrop coverage and tonal layers, integrate sparse static stars in the sky pass, enlarge/elevate the moon with responsive composition, replace its surface and halo, feather distant ridge edges and enrich only the distant haze. Use existing art and internal procedural shaders; no dependency or asset download. Preserve all camera paths, physical garden and practical lighting.

Validation will retain compact numeric reports only. At most a few temporary screenshots for internal visual inspection, not a gallery.
