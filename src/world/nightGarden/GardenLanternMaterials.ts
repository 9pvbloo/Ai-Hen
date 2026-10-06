import { preservePaperHighlights } from './PaperHighlightResponse'
import { PRACTICAL_LIGHT, practicalLinearGLSL } from './PracticalLightPalette'
import { AdditiveBlending, MeshStandardMaterial, ShaderMaterial, UniformsLib, UniformsUtils } from 'three'

/** Local paper transmission; the standard material retains scene fog and tone mapping. */
export function createLanternPaper(): MeshStandardMaterial {
  // Warm ivory reflectance keeps cold moon fill from washing the shade to grey.
  const material = new MeshStandardMaterial({ color: '#d4bc91', roughness: 0.92, emissive: PRACTICAL_LIGHT.paper, emissiveIntensity: 0 })
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vPaperUv;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvPaperUv = uv;')
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vPaperUv;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        vec2 p = (vPaperUv - vec2(0.5, 0.43)) * vec2(2.0, 1.65);
        float core = exp(-dot(p, p) * 3.2);
        float edge = smoothstep(0.0, 0.17, min(min(vPaperUv.x, 1.0-vPaperUv.x), min(vPaperUv.y, 1.0-vPaperUv.y)));
        totalEmissiveRadiance *= mix(vec3(0.58), vec3(1.0), core) * (0.66 + edge * 0.34);`)
  }
  material.customProgramCacheKey = () => 'garden-lantern-paper-diffusion-v4'
  preservePaperHighlights(material)
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
        gl_FragColor = vec4(${practicalLinearGLSL(PRACTICAL_LIGHT.source)}, glow * uOpacity);
        #include <fog_fragment>
      }`,
    transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false, fog: true,
  })
}
