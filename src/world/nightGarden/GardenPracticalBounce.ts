import type { MeshStandardMaterial } from 'three'
import { LANTERN_ANCHORS } from './GardenLanternNetwork'

/** Receiver-space two-scale diffuse bounce. Actual ground/ribbon fragments receive
 * it, so terrain displacement, crest normals and opaque object occlusion stay exact.
 * No overlay, no extra textures, no orange unlit decals and no per-frame sampling. */
export class GardenPracticalBounce {
  private readonly visibility = { value: 0 }

  constructor(material: MeshStandardMaterial) {
    const original = material.onBeforeCompile, cache = material.customProgramCacheKey()
    material.onBeforeCompile = (shader, renderer) => {
      original.call(material, shader, renderer)
      shader.uniforms.uPracticalBounce = this.visibility
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
        uniform float uPracticalBounce;
        float gardenBouncePatch(vec2 p, vec2 source, float radius, float coreRadius, float strength) {
          vec2 q = (p - source) * vec2(0.94, 1.06);
          float d = length(q);
          float core = 1.0 - smoothstep(0.12, coreRadius, d);
          float broad = 1.0 - smoothstep(0.0, radius, d);
          return (core * core * 0.065 + broad * broad * 0.020) * strength;
        }
        float gardenBounceField(vec2 p) {
          float bounce = 0.0;
          ${LANTERN_ANCHORS.map(([x, z], i) => {
            const radius = i < 5 ? 3.1 : i < 11 ? 2.8 : 2.15
            const core = i < 5 ? 1.2 : i < 11 ? 1.0 : 0.85
            return `bounce = max(bounce, gardenBouncePatch(p, vec2(${x.toFixed(2)}, ${z.toFixed(2)}), ${radius.toFixed(2)}, ${core.toFixed(2)}, ${i < 11 ? '1.0' : '0.75'}));`
          }).join('\n')}
          return bounce;
        }`)
        .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
          float bounceUp = clamp(dot(normal, (viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz), 0.0, 1.0);
          float bounceField = gardenBounceField(vGardenWorldPosition.xz) * practicalInterior;
          float bounceReceiver = mix(0.45, 1.0, smoothstep(0.02, 0.98, vGardenSurfaceMix));
          reflectedLight.indirectDiffuse += diffuseColor.rgb * vec3(0.95, 0.56, 0.27)
            * bounceField * bounceUp * bounceReceiver * uPracticalBounce;`)
    }
    material.customProgramCacheKey = () => `${cache}-terrain-practical-bounce-v1`
    material.needsUpdate = true
  }

  setIntensity(visibility: number): void { this.visibility.value = visibility }
}
