import { PRACTICAL_LIGHT, practicalLinearGLSL } from './PracticalLightPalette'
import { PREMIUM_ENERGY, secondaryLanternEnergy } from './PremiumPracticalEnergy'
import { Mesh, MeshStandardMaterial, Vector4 } from 'three'
import type { Group } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { LANTERN_ANCHORS, LANTERN_LIGHT_INDICES, lanternSourceY } from './GardenLanternNetwork'

const SECONDARY_SOURCES = LANTERN_ANCHORS.map((_, i) => i).filter(i => !LANTERN_LIGHT_INDICES.some(index => index === i))

/** Diffuse-only near-field transport for fixtures outside the seven full PBR practicals.
 * Inverse-square distance and receiver normals, not emissive ground decals. Unshadowed. */
export class GardenLanternIrradiance {
  private readonly sources = SECONDARY_SOURCES.map(() => new Vector4())
  private readonly energy = new Float32Array(SECONDARY_SOURCES.map(secondaryLanternEnergy))
  private readonly visibility = { value: 0 }

  constructor(root: Group) {
    const materials = new Set<MeshStandardMaterial>()
    const visit = (node: typeof root | Mesh): void => {
      if (node.name === 'garden-pavilion-residence' || node.name === 'garden-path-lanterns') return
      if (node instanceof Mesh) for (const m of Array.isArray(node.material) ? node.material : [node.material])
        if (m instanceof MeshStandardMaterial && !m.transparent) materials.add(m)
      for (const child of node.children) visit(child as typeof root | Mesh)
    }
    visit(root)
    for (const material of materials) {
      const original=material.onBeforeCompile,cache=material.customProgramCacheKey()
      material.onBeforeCompile=(shader,renderer)=>{
        original.call(material,shader,renderer)
        shader.uniforms.uLanternSources={value:this.sources};shader.uniforms.uLanternPresence=this.visibility
        shader.uniforms.uLanternEnergy={value:this.energy}
        shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
          uniform vec4 uLanternSources[${SECONDARY_SOURCES.length}]; uniform float uLanternEnergy[${SECONDARY_SOURCES.length}]; uniform float uLanternPresence;`)
          .replace('#include <aomap_fragment>',`#include <aomap_fragment>
            for (int lamp=0; lamp<${SECONDARY_SOURCES.length}; lamp++) {
              vec3 offset = uLanternSources[lamp].xyz - vPracticalPosition;
              float d2 = dot(offset,offset), range = uLanternSources[lamp].w;
              if (d2 < range*range) {
                vec3 toward = normalize((viewMatrix * vec4(offset,0.0)).xyz);
                float cutoff = pow(max(0.0,1.0-pow(d2/(range*range),2.0)),2.0);
                float energy = uLanternEnergy[lamp] * cutoff / max(.09,d2);
                reflectedLight.directDiffuse += diffuseColor.rgb * ${practicalLinearGLSL(PRACTICAL_LIGHT.source)}
                  * max(0.0,dot(normal,toward)) * energy * RECIPROCAL_PI * practicalInterior * uLanternPresence;
              }
            }`)
      }
      material.customProgramCacheKey=()=>`${cache}-secondary-lantern-irradiance-v4`
      material.needsUpdate=true
    }
  }

  setLayout(layout: CompositionId): void {
    SECONDARY_SOURCES.forEach((index,i)=>{
      const [x,z]=LANTERN_ANCHORS[index]
      this.sources[i].set(x,lanternSourceY(index,layout),z,index<11?PREMIUM_ENERGY.secondary.perimeterRange:PREMIUM_ENERGY.secondary.islandRange)
    })
  }
  setIntensity(value: number): void { this.visibility.value=value }
}
