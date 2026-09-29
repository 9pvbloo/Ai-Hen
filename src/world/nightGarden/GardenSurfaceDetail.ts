/** Original world-space mineral/organic detail, shared only by garden materials. */
export const GARDEN_SURFACE_DETAIL = `
float gardenHash(vec2 p) { return fract(sin(dot(p, vec2(41.73, 289.17))) * 17341.173); }
float gardenNoise(vec2 p) {
  vec2 cell = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(gardenHash(cell), gardenHash(cell + vec2(1., 0.)), f.x),
    mix(gardenHash(cell + vec2(0., 1.)), gardenHash(cell + vec2(1.)), f.x), f.y);
}
float gardenMineral(vec3 p) {
  return gardenNoise(p.xz * 2.3 + p.y * 0.71) * 0.55
    + gardenNoise(p.xy * 8.7 + p.z * 0.4) * 0.3
    + gardenNoise(p.yz * 31.0 + p.x) * 0.15;
}
// Convert a height field into a surface gradient without UV tangent assumptions.
vec3 gardenRelief(vec3 viewNormal, float height) {
  vec3 dx = dFdx(vGardenWorldPosition), dy = dFdy(vGardenWorldPosition);
  vec3 n = inverseTransformDirection(viewNormal, viewMatrix);
  vec3 a = cross(dy, n), b = cross(n, dx);
  float determinant = dot(dx, a);
  vec3 gradient = sign(determinant) * (dFdx(height) * a + dFdy(height) * b);
  vec3 perturbed = normalize(max(abs(determinant), 0.0000001) * n - gradient);
  return normalize(mat3(viewMatrix) * perturbed);
}
`
