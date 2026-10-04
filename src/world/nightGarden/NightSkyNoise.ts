/** Deterministic, texture-free fields shared by the distant atmosphere shaders. */
export const NIGHT_SKY_NOISE = `
float skyHash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * .1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float skyNoise(vec2 p) {
  vec2 cell = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(skyHash(cell), skyHash(cell + vec2(1,0)), f.x),
             mix(skyHash(cell + vec2(0,1)), skyHash(cell + vec2(1,1)), f.x), f.y);
}
float skyFbm(vec2 p) {
  float sum = 0.0, weight = .5;
  for (int i = 0; i < 4; i++) {
    sum += skyNoise(p) * weight;
    p = mat2(.8, -.6, .6, .8) * p * 2.07 + 11.3;
    weight *= .5;
  }
  return sum;
}
`
