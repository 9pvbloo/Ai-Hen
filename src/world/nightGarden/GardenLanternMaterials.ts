import { AdditiveBlending, MeshStandardMaterial, ShaderMaterial, UniformsLib, UniformsUtils } from 'three'

/** Local paper transmission; the standard material retains scene fog and tone mapping. */
export function createLanternPaper(): MeshStandardMaterial {
  const material = new MeshStandardMaterial({ color: '#c6baa2', roughness: 0.92, emissive: '#f0c99b', emissiveIntensity: 0 })
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vPaperUv;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvPaperUv = uv;')
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vPaperUv;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        vec2 p = (vPaperUv - vec2(0.5, 0.43)) * vec2(2.0, 1.65);
        float core = exp(-dot(p, p) * 3.2);
        float edge = smoothstep(0.0, 0.17, min(min(vPaperUv.x, 1.0-vPaperUv.x), min(vPaperUv.y, 1.0-vPaperUv.y)));
        totalEmissiveRadiance *= mix(vec3(0.78, 0.70, 0.58), vec3(1.06, 1.0, 0.89), core) * (0.86 + edge * 0.14);`)
  }
  material.customProgramCacheKey = () => 'garden-lantern-paper-diffusion-v2'
  return material
}

/** Small camera-facing scattering envelope, occluded by opaque scene geometry. */
export function createLanternHalo(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: UniformsUtils.merge([UniformsLib.fog, { uOpacity: { value: 0 } }]),
    vertexShader: `varying vec2 vUv;
      #include <fog_pars_vertex>
      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(0., 0., 0., 1.);
        mvPosition.xy += position.xy * length(instanceMatrix[0].xyz);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `varying vec2 vUv; uniform float uOpacity;
      #include <fog_pars_fragment>
      void main() {
        float radius = length((vUv - 0.5) * 2.0);
        float glow = pow(max(0.0, 1.0 - radius), 3.5);
        gl_FragColor = vec4(vec3(0.67, 0.48, 0.28), glow * uOpacity);
        #include <fog_fragment>
      }`,
    transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false, fog: true,
  })
}
