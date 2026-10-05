# Phase 2.3 — practical warmth microadjustment

Start: 3cc2ed73d6c1502a0b0fa496f1670a564eb3d470 on phase-2-3-genkan-interior-architecture. Tracked sources clean. The two existing approved lantern reference PNGs are now tracked unchanged so delivery can have a clean worktree.

Audit: all direct practicals already share a palette. Source #f1ce9f and paper emission #f3d6af retain relatively high blue; garden/wall/pendant albedo #d4cbb8 and occupied exterior paper #cfd2cf reflect the cold moon strongly. Source gradients are achromatic. Combined reflected cool light and pale emission can read as beige instead of a warm practical. NoToneMapping can also clip highlights; exposure and renderer remain frozen in this microadjustment.

Intent: reduce blue in the practical family, give paper warm ivory reflectance, make window-to-frame transport slightly more present, and make only small emission compensation. Preserve all full-light intensities/ranges, geometry, positions, camera, scroll, moon, shadow settings and ownership. No bloom, new sources, captures, recordings, push, PR or Phase 2.4.

Fresh baseline: scripts/practical-warmth-before.json. Headless Chrome numeric inspection only, same host, desktop/tablet/portrait. Artistic appearance cannot be certified without manual visual review.
