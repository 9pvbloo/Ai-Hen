import { GARDEN_ISLANDS } from './GardenApproach'
import { GARDEN_PERIMETER_BANKS } from './GardenPerimeterComposition'

/** Fragment-only samon. Fields, cross-section and pixel footprint have separate jobs. */
export const GARDEN_RAKE_GLSL = `
struct GardenRakeField { vec4 phase; vec4 weight; };
struct GardenRakeSample { float height; float crest; float valley; float coverage; };

GardenRakeField gardenRakeField(vec2 p) {
  float islandDistance = 1000.0;
  ${[...GARDEN_ISLANDS, ...GARDEN_PERIMETER_BANKS].map(i => `islandDistance = min(islandDistance,
    (length((p - vec2(${i.x.toFixed(3)}, ${i.z.toFixed(3)})) / vec2(${i.rx.toFixed(3)}, ${i.rz.toFixed(3)})) - 1.0) * ${Math.min(i.rx, i.rz).toFixed(3)});`).join('\n')}
  float court = smoothstep(38.0, 43.0, -p.y);
  float drift = sin(p.y * 0.17 + p.x * 0.06) * 0.62;
  GardenRakeField field;
  field.phase = vec4(
    (p.x + drift + sin(p.x * 0.32 + p.y * 0.09) * 0.22) * 30.0,
    (p.x * 0.91 + p.y * 0.24 + sin(p.y * 0.18) * 0.32) * 33.0,
    (p.x * 0.36 + p.y * 0.88 + sin(p.x * 0.24) * 0.28) * 28.0,
    (islandDistance + sin(p.x * 0.7 + p.y * 0.4) * 0.035) * 32.0
  );
  float contour = 1.0 - smoothstep(0.65, 2.4, islandDistance);
  float directionalWeight = 1.0 - smoothstep(0.12, 0.48, contour);
  float ringWeight = smoothstep(0.52, 0.88, contour);
  // Non-overlapping weights leave quiet margins, never crossing two wave trains.
  field.weight = vec4(
    1.0 - smoothstep(23.0, 25.0, -p.y),
    smoothstep(25.4, 27.0, -p.y) * (1.0 - smoothstep(34.0, 36.0, -p.y)),
    smoothstep(36.4, 38.4, -p.y), 1.0
  ) * vec4(vec3(directionalWeight), ringWeight);
  float handPressure = 0.97 + sin(p.y * 0.31 + p.x * 0.16) * 0.03;
  field.weight *= (1.0 - court * 0.40) * handPressure * smoothstep(-0.1, 0.32, islandDistance);
  return field;
}

vec4 gardenRakeVisibility(vec4 phase) {
  // Shaped crests contain higher frequencies than a sine: fade before subpixel ridges.
  return 1.0 - smoothstep(vec4(0.45), vec4(1.8), fwidth(phase));
}

vec4 gardenRakeProfile(vec4 phase) {
  vec4 wave = 0.5 + 0.5 * cos(phase);
  // Rounded upper ~39% of the period, broad valley and continuous sloping shoulders.
  return pow(smoothstep(vec4(0.18), vec4(1.0), wave), vec4(1.6));
}

float gardenRakeHeight(vec4 profile, vec4 weight) {
  // Virtual peak-to-valley height, NOT geometry displacement. Centering prevents
  // the fading field envelope from adding a broad artificial bump at its seams.
  return dot(profile - 0.39, weight) * 0.017;
}

GardenRakeSample gardenRakeSample(vec2 p, float pathDistance) {
  GardenRakeField field = gardenRakeField(p);
  // A shallow maintained trace remains between treads; recover full relief just
  // beyond their edges instead of clearing a broad corridor along the centerline.
  float pathRelief = mix(0.30, 1.0, smoothstep(0.35, 0.95, pathDistance));
  vec4 weight = field.weight * gardenRakeVisibility(field.phase) * pathRelief;
  vec4 profile = gardenRakeProfile(field.phase);
  GardenRakeSample result;
  result.height = gardenRakeHeight(profile, weight);
  result.crest = dot(profile * profile, weight);
  result.valley = dot(1.0 - smoothstep(vec4(0.04), vec4(0.30), profile), weight);
  result.coverage = dot(weight, vec4(1.0));
  return result;
}
`
