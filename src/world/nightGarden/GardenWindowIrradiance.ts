import { Matrix4, Vector3 } from 'three'
import type { Group, InstancedMesh, MeshStandardMaterial } from 'three'
import type { GardenPavilionMaterials } from './GardenPavilionMaterials'
import { PRACTICAL_LIGHT, practicalLinearGLSL } from './PracticalLightPalette'

/** Finite, one-sided diffuse transfer from static occupied paper to nearby joinery.
 * Analytic area approximation, not occluded GI. Moving entry uses the shadowed hall.
 * Only existing exterior material owners retain these hooks; no GPU allocations. */
export class GardenWindowIrradiance {
  private readonly presence = { value: 0 }
  private readonly world = { value: new Matrix4() }
  readonly sourceCount: number

  constructor(root: Group, materials: GardenPavilionMaterials) {
    const sources: string[] = [], matrix = new Matrix4()
    const v = (a: number[]) => `vec3(${a.map(n=>n.toFixed(5)).join(',')})`
    for(const finish of ['wallWarm','wallDim'] as const) {
      const batch = root.getObjectByName(`pavilion-blockout-${finish}`) as InstancedMesh
      for(let i=0;i<batch.count;i++) {
        batch.getMatrixAt(i,matrix)
        const e=matrix.elements, side=Math.abs(e[0])<Math.abs(e[10]), sign=e[12]<0?-1:1
        const normal=side?[sign,0,0]:[0,0,1]
        const center=[e[12]+(side?sign*Math.abs(e[0])*.5:0),e[13],e[14]+(side?0:Math.abs(e[10])*.5)]
        const extent=[side?0:Math.abs(e[0])*.5,Math.abs(e[5])*.5,side?Math.abs(e[10])*.5:0]
        sources.push(`windowDiffuse += windowTransfer(vWindowPosition, ${v(center)}, ${v(extent)}, ${v(normal)}, normal) * ${finish==='wallWarm'?'0.46':'0.20'};`)
      }
    }
    this.sourceCount=sources.length
    for(const material of [materials.foundation,materials.deck,materials.structure,materials.secondaryStructure,materials.wall,materials.soffit]) {
      this.attach(material,sources.join('\n'))
    }
    this.setLayout(root)
  }

  private attach(material: MeshStandardMaterial, sources: string): void {
    const original=material.onBeforeCompile, cache=material.customProgramCacheKey()
    material.onBeforeCompile=(shader,renderer)=>{
      original.call(material,shader,renderer)
      shader.uniforms.uWindowPresence=this.presence;shader.uniforms.uWindowWorld=this.world
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWindowPosition;')
        .replace('#include <project_vertex>',`#include <project_vertex>
          vWindowPosition = transformed;
          #ifdef USE_INSTANCING
            vWindowPosition = (instanceMatrix * vec4(transformed,1.0)).xyz;
          #endif`)
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
        varying vec3 vWindowPosition; uniform float uWindowPresence; uniform mat4 uWindowWorld;
        float windowTransfer(vec3 p, vec3 center, vec3 halfSize, vec3 outward, vec3 receiverNormal) {
          vec3 delta=p-center;
          float front=dot(delta,outward);
          if(front<0.0 || front>1.35)return 0.0;
          vec3 nearest=center+clamp(delta,-halfSize,halfSize);
          vec3 toPaper=nearest-p;
          float d2=dot(toPaper,toPaper);
          if(d2>1.8225)return 0.0;
          vec3 toward=normalize(mat3(viewMatrix*uWindowWorld)*(toPaper-outward*.08));
          float falloff=pow(max(0.0,1.0-d2/1.8225),2.0)/(1.0+d2*3.0);
          // A small local indirect term accompanies normal-aware direct diffuse.
          return falloff*(max(0.0,dot(receiverNormal,toward))+.08)*smoothstep(0.0,.025,front);
        }`)
        .replace('#include <aomap_fragment>',`#include <aomap_fragment>
          float windowDiffuse=0.0;
          ${sources}
          reflectedLight.indirectDiffuse += diffuseColor.rgb * ${practicalLinearGLSL(PRACTICAL_LIGHT.source)}
            * min(windowDiffuse,.65) * RECIPROCAL_PI * uWindowPresence;`)
    }
    material.customProgramCacheKey=()=>`${cache}-occupied-window-transfer-v2`
    material.needsUpdate=true
  }

  setLayout(root: Group): void {
    root.updateWorldMatrix(true,false)
    // Translation is irrelevant to direction conversion; keep the full authored matrix.
    this.world.value.copy(root.matrixWorld).setPosition(new Vector3())
  }
  setIntensity(value: number): void { this.presence.value=value }
}
