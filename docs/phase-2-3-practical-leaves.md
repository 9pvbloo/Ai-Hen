# Phase 2.3 — richer practicals and restrained leaf detail

Start HEAD d18d1ca5ecadd4cd04c84ebdce9217860505bdb2, branch phase-2-3-genkan-interior-architecture, clean worktree. Threejs skill applies.

Audit: previous warmth pass reduced practical RGB luminance while preserving full-light scalar intensities. This explains why warmer color alone can still feel weak. Refine source energy locally, not global exposure: keep all ranges, positions, shadow maps, moon/sky and camera choreography fixed. House aura stays tied to occupied paper and bounded frame transfer.

Leaves: add original low-poly folded leaf geometry and an opaque standard material, two instanced batches, no textures or shadow casters. Deterministic clusters near planted banks/trees, with route, forecourt, wall and lantern exclusion. Ground instances seat on terrain slopes. Few airborne instances move from the existing update loop; cap delta, pause while hidden/outside garden, and freeze for reduced motion. Responsive density: desktop/tablet/portrait, stable subsets and no allocation on resize.

No Phase 2.4, main architecture/layout/stepping stone changes, capture/media, push or PR. Validation is numeric; artistic approval remains manual.
