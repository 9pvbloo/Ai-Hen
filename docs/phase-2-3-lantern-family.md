# Phase 2.3 lantern family refinement

Initial branch: phase-2-3-genkan-interior-architecture. HEAD becae7718e0e307fbcba18db0cfd73b8818e9bcc. Clean worktree and index. Existing practical pass preserved.

Scope: round suspended washi interior lamp, restrained perimeter wall lanterns, two garden fixture families, window source/frame/spill relationship. No camera, threshold, door motion, sky/moon, path, wall geometry or planting layout edits; no tone mapping/postprocessing change, push, PR, squash or rebase.

Audit: 15 identical scaled garden fixtures share seven real PointLights; the other eight have only faint ground bounce. Paper gradient is strongly orange and falls dark at corners. Interior main shadow source is the low andon; no pendant. Perimeter has no wall-mounted fixtures. Mansion source shader has central emissive cores but no area-like diffuse response on adjacent timber.

References: docs/references/phase-2-3-genkan-reference.png reviewed for timber/washi, construction and restrained warmth. Specific approved round pendant and rectangular wall-lamp files were not present among repository references; requested their path. Work can proceed from the explicit written design brief, without claiming exact reference matching.

Plan: keep three selective shadow lights; move interior shadow source to the pendant and add a short omnidirectional ceiling fill. Four spaced wall lanterns share procedural finishes. Keep seven real garden lights; give the remaining eight local, normal-aware diffuse response through a bounded receiver shader rather than adding eight full PBR light loops. Explicitly report this approximation and measure performance. Reuse existing microdetail maps and preserve disposal ownership.
