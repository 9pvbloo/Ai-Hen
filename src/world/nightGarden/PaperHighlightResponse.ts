import type { MeshStandardMaterial } from 'three'

/** Local paper-only shoulder on final reflected + emitted radiance. Preserve RGB ratios:
 * no channel clipping to white, global tone mapper, bloom or exposure change. */
export function preservePaperHighlights(material: MeshStandardMaterial): void {
  const original=material.onBeforeCompile,cache=material.customProgramCacheKey()
  material.onBeforeCompile=(shader,renderer)=>{
    original.call(material,shader,renderer)
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
      float paperPeak=max(outgoingLight.r,max(outgoingLight.g,outgoingLight.b));
      if(paperPeak>.78){
        float paperShoulder=.78+.20*(1.0-exp(-(paperPeak-.78)/.20));
        outgoingLight*=paperShoulder/paperPeak;
      }
      #include <opaque_fragment>`)
  }
  material.customProgramCacheKey=()=>`${cache}-paper-highlight-shoulder-v1`
}
