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
  // Three tended beds: long entrance strokes, an oblique middle reach and
  // a softer transverse court. Unraked seams keep their directions from crossing.
  float entranceWeight = 1.0 - smoothstep(23.0, 25.0, -p.y);
  float middleWeight = smoothstep(25.4, 27.0, -p.y) * (1.0 - smoothstep(34.0, 36.0, -p.y));
  float courtWeight = smoothstep(36.4, 38.4, -p.y);
  float parallelPhase = (p.x + drift + sin(p.x * 0.32 + p.y * 0.09) * 0.22) * 30.0;
  float middlePhase = (p.x * 0.91 + p.y * 0.24 + sin(p.y * 0.18) * 0.32) * 33.0;
  float courtPhase = (p.x * 0.36 + p.y * 0.88 + sin(p.x * 0.24) * 0.28) * 28.0;
  float ringPhase = (islandDistance + sin(p.x * 0.7 + p.y * 0.4) * 0.035) * 32.0;
  float parallel = cos(parallelPhase) * (1.0 - smoothstep(0.7, 3.1, fwidth(parallelPhase)));
  float middle = cos(middlePhase) * (1.0 - smoothstep(0.7, 3.1, fwidth(middlePhase)));
  float courtStrokes = cos(courtPhase) * (1.0 - smoothstep(0.7, 3.1, fwidth(courtPhase)));
  parallel = parallel * entranceWeight + middle * middleWeight + courtStrokes * courtWeight;
  float rings = cos(ringPhase) * (1.0 - smoothstep(0.7, 3.1, fwidth(ringPhase)));
  float contour = 1.0 - smoothstep(0.65, 2.4, islandDistance);
  // Separate fields with a softly unraked margin instead of crossing two wave trains.
  float parallelWeight = 1.0 - smoothstep(0.12, 0.48, contour);
  float ringWeight = smoothstep(0.52, 0.88, contour);
  float handPressure = 0.90 + sin(p.y * 0.31 + p.x * 0.16) * 0.10;
  float bankMargin = smoothstep(-0.1, 0.32, islandDistance);
  return (parallel * parallelWeight + rings * ringWeight) * (1.0 - court * 0.40) * handPressure * bankMargin;
}
`
