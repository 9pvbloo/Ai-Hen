import { GARDEN_ISLANDS } from './GardenApproach'
import { GARDEN_PERIMETER_BANKS } from './GardenPerimeterComposition'

/** Original procedural rake field; derivative filtering prevents distant stripe shimmer. */
export const GARDEN_RAKE_GLSL = `
float gardenRake(vec2 p) {
  float islandDistance = 1000.0;
  ${[...GARDEN_ISLANDS, ...GARDEN_PERIMETER_BANKS].map(i => `islandDistance = min(islandDistance,
    (length((p - vec2(${i.x.toFixed(3)}, ${i.z.toFixed(3)})) / vec2(${i.rx.toFixed(3)}, ${i.rz.toFixed(3)})) - 1.0) * ${Math.min(i.rx, i.rz).toFixed(3)});`).join('\n')}
  // The raked contour follows the main mass, not every small tuft at its edge.
  // Long, gently turning strokes open into a quieter ceremonial forecourt.
  float court = smoothstep(38.0, 43.0, -p.y);
  float drift = sin(p.y * 0.17 + p.x * 0.06) * 0.62;
  float parallelPhase = (p.x + drift * (1.0 - court * 0.8)
    + sin(p.x * 0.32 + p.y * 0.09) * 0.22 + sin(p.y * 0.075) * p.x * 0.065) * 32.0;
  float ringPhase = (islandDistance + sin(p.x * 0.7 + p.y * 0.4) * 0.035) * 32.0;
  float parallel = cos(parallelPhase) * (1.0 - smoothstep(0.7, 3.1, fwidth(parallelPhase)));
  float rings = cos(ringPhase) * (1.0 - smoothstep(0.7, 3.1, fwidth(ringPhase)));
  float contour = 1.0 - smoothstep(0.65, 2.4, islandDistance);
  // Separate fields with a softly unraked margin instead of crossing two wave trains.
  float parallelWeight = 1.0 - smoothstep(0.12, 0.48, contour);
  float ringWeight = smoothstep(0.52, 0.88, contour);
  float handPressure = 0.90 + sin(p.y * 0.31 + p.x * 0.16) * 0.10;
  return (parallel * parallelWeight + rings * ringWeight) * (1.0 - court * 0.32) * handPressure;
}
`
