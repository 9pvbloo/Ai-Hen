import { PRACTICAL_LIGHT, practicalLinearGLSL } from './PracticalLightPalette'
import type { MeshStandardMaterial } from 'three'
import { LANTERN_ANCHORS, LANTERN_LIGHT_INDICES } from './GardenLanternNetwork'

/** Supplement the seven real practicals; give the eight other fixtures a readable
 * receiving surface without another light, mesh or texture. Finite support keeps
 * cold negative space between pools. Values are local diffuse irradiance weights. */
export const LANTERN_BOUNCE_ZONES = LANTERN_ANCHORS.map((_, index) => {
  const hasPractical = LANTERN_LIGHT_INDICES.some(anchor => anchor === index)
  const path = index < 5, perimeter = index >= 5 && index < 11
  // The rear-left accent sits entirely on dark moss, rather than pale gravel.
  if (index === 13) return { radius: 1.25, coreRadius: 0.65, core: 0.90, broad: 0.16 }
  return {
    radius: path ? 1.5 : perimeter ? 1.35 : 1.15,
    coreRadius: path ? .7 : perimeter ? .65 : .55,
    core: hasPractical ? 0.14 : perimeter ? 0.68 : path ? 0.60 : 0.50,
    broad: hasPractical ? 0.035 : perimeter ? 0.12 : path ? 0.11 : 0.09,
  }
})

/** Receiver-space two-scale diffuse bounce. Actual ground/ribbon fragments receive
 * it, so terrain displacement and crest normals stay exact. This is not occluded GI.
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
        float gardenBouncePatch(vec2 p, vec2 source, float radius, float coreRadius, float coreGain, float broadGain) {
          vec2 q = (p - source) * vec2(0.94, 1.06);
          float d = length(q);
          float core = 1.0 - smoothstep(0.12, coreRadius, d);
          float broad = 1.0 - smoothstep(0.0, radius, d);
          return core * core * coreGain + broad * broad * broadGain;
        }
        float gardenBounceField(vec2 p) {
          float bounce = 0.0;
          ${LANTERN_ANCHORS.map(([x, z], i) => {
            const { radius, coreRadius, core, broad } = LANTERN_BOUNCE_ZONES[i]
            return `bounce = max(bounce, gardenBouncePatch(p, vec2(${x.toFixed(2)}, ${z.toFixed(2)}), ${radius.toFixed(2)}, ${coreRadius.toFixed(2)}, ${core.toFixed(3)}, ${broad.toFixed(3)}));`
          }).join('\n')}
          return bounce;
        }`)
        .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
          float bounceUp = clamp(dot(normal, (viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz), 0.0, 1.0);
          float bounceField = gardenBounceField(vGardenWorldPosition.xz) * practicalInterior;
          float bounceReceiver = mix(0.70, 1.0, smoothstep(0.02, 0.98, vGardenSurfaceMix));
          reflectedLight.indirectDiffuse += diffuseColor.rgb * ${practicalLinearGLSL(PRACTICAL_LIGHT.bounce)}
            * bounceField * bounceUp * bounceReceiver * uPracticalBounce;`)
    }
    material.customProgramCacheKey = () => `${cache}-terrain-practical-bounce-v3`
    material.needsUpdate = true
  }

  setIntensity(visibility: number): void { this.visibility.value = visibility * 0.12 }
}
