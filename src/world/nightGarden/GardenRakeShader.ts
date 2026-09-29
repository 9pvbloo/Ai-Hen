import { GARDEN_ISLANDS } from './GardenApproach'

/** Original procedural rake field; derivative filtering prevents distant stripe shimmer. */
export const GARDEN_RAKE_GLSL = `
float gardenRake(vec2 p) {
  float islandDistance = 1000.0;
  ${GARDEN_ISLANDS.map(i => `islandDistance = min(islandDistance,
    (length((p - vec2(${i.x.toFixed(3)}, ${i.z.toFixed(3)})) / vec2(${i.rx.toFixed(3)}, ${i.rz.toFixed(3)})) - 1.0) * ${Math.min(i.rx, i.rz).toFixed(3)});`).join('\n')}
  // The raked contour follows the main mass, not every small tuft at its edge.
  // Long, gently turning strokes open into a quieter ceremonial forecourt.
  float court = smoothstep(38.0, 43.0, -p.y);
  float drift = sin(p.y * 0.17 + p.x * 0.06) * 0.62;
  float parallelPhase = (p.x + drift * (1.0 - court * 0.8)
    + sin(p.x * 0.32 + p.y * 0.09) * 0.22) * 32.0;
  float ringPhase = (islandDistance + sin(p.x * 0.7 + p.y * 0.4) * 0.035) * 32.0;
  float parallel = cos(parallelPhase) * (1.0 - smoothstep(0.7, 3.1, fwidth(parallelPhase)));
  float rings = cos(ringPhase) * (1.0 - smoothstep(0.7, 3.1, fwidth(ringPhase)));
  float contour = 1.0 - smoothstep(0.65, 2.4, islandDistance);
  return mix(parallel, rings, contour) * (1.0 - court * 0.24);
}
`
