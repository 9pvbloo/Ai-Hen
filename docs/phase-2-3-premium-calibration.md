# Phase 2.3 — premium lighting energy calibration

Start HEAD 7103bc1e53d47606dc94d4db3574c5d3c8906231, branch phase-2-3-genkan-interior-architecture, clean worktree. Existing threejs skill applied. No Phase 2.4 or choreography/ownership/architecture change.

Audit: finite cutoff compounds inverse-square falloff; path lights with 2.7–3 m ranges lose much of their already modest energy before reaching adjacent stepping stones. The shadowed hall must travel roughly 7–9 local metres to the outer approach. Source color shifts and 15–35% increases have not addressed that attenuation sufficiently. Frame transport is bounded correctly but its gain and cap remain very restrained. Moon is unchanged; do not reduce it globally to compensate. Existing leaves use brown/ochre instance colors, contrary to this pass's requested blue family.

Plan: centralize explicit energy targets; substantial real-source and bounded diffuse increases, slightly wider local pools; stronger occupied paper and mansion spill with a hue-preserving paper highlight shoulder; larger bounded frame response, unchanged source geometry and map count. Recolor leaves only. Measure numeric receiver irradiance proxies and runtime budgets without pixel capture. The requested 60–65 / 35–40 split is an artistic whole-frame hierarchy, not a physically meaningful ratio of scalar light intensities.

Fresh baseline: scripts/premium-calibration-before.json. No screenshots/videos, push, PR or new external assets. Manual review remains necessary to certify the requested visual result.
