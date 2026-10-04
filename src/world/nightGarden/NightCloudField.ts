/** Continuous on the sphere: no longitude seam, textures, time dependency or raymarch. */
export const NIGHT_CLOUD_FIELD = `
float cloudNoise3(vec3 p) {
  float z = floor(p.z), f = fract(p.z);
  f = f * f * (3.0 - 2.0 * f);
  return mix(skyNoise(p.xy + z * vec2(37.0,59.0)),
             skyNoise(p.xy + (z + 1.0) * vec2(37.0,59.0)), f);
}
float nightCloudDensity(vec3 direction) {
  vec3 p = direction * vec3(3.1, 8.4, 3.1) + vec3(7.2, 2.6, 11.4);
  float field = cloudNoise3(p) * .58
    + cloudNoise3(p * 2.03 + 9.7) * .28
    + cloudNoise3(p * 4.11 - 3.2) * .14;
  return smoothstep(.38, .72, field) * smoothstep(-.03, .16, direction.y);
}
`

export const CELESTIAL_UNIFORMS = `
uniform vec3 uMoonPosition;
uniform float uMoonRadius, uMoonInfluence, uCloudAbsorption, uSkyVisibility;
float lunarInfluence(vec3 direction) {
  vec3 moonDirection = normalize(uMoonPosition - cameraPosition);
  return smoothstep(uMoonInfluence, 1.0, dot(direction, moonDirection));
}
`
