import { GARDEN_ISLANDS } from './GardenApproach'

/** Original procedural rake field; derivative filtering prevents distant stripe shimmer. */
export const GARDEN_RAKE_GLSL = `
float gardenRake(vec2 p) {
  float islandDistance = 1000.0;
  ${GARDEN_ISLANDS.map(i => `islandDistance = min(islandDistance,
    (length((p - vec2(${i.x.toFixed(3)}, ${i.z.toFixed(3)})) / vec2(${i.rx.toFixed(3)}, ${i.rz.toFixed(3)})) - 1.0) * ${Math.min(i.rx, i.rz).toFixed(3)});`).join('\n')}
  float parallelPhase = (p.x + sin(p.y * 0.18) * 0.55) * 31.416;
  float ringPhase = islandDistance * 31.416;
  float parallel = cos(parallelPhase) * (1.0 - smoothstep(0.7, 3.1, fwidth(parallelPhase)));
  float rings = cos(ringPhase) * (1.0 - smoothstep(0.7, 3.1, fwidth(ringPhase)));
  return mix(parallel, rings, 1.0 - smoothstep(0.5, 2.2, islandDistance));
}
`
