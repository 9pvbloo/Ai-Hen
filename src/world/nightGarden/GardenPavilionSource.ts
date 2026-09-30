import type { MeshStandardMaterial } from 'three'

/** Visible emission on the existing opaque infill, never a plane behind it. */
export function shapePavilionSource(material: MeshStandardMaterial): void {
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>
      varying vec2 vShojiUv;
      varying vec3 vShojiRoom;`)
      .replace('#include <uv_vertex>', `#include <uv_vertex>
        vShojiUv = uv;
        vShojiRoom = vec3(0.0);
        #ifdef USE_INSTANCING
          vShojiRoom = instanceMatrix[3].xyz;
        #endif`)
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
      varying vec2 vShojiUv;
      varying vec3 vShojiRoom;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float room = sin(vShojiRoom.x * 1.17 + vShojiRoom.z * 0.73);
        vec2 sourceUv = vShojiUv - vec2(0.48 + room * 0.035, 0.43);
        float core = exp(-dot(sourceUv * vec2(2.3, 1.9), sourceUv * vec2(2.3, 1.9)) * 2.4);
        float border = min(min(vShojiUv.x, 1.0-vShojiUv.x), min(vShojiUv.y, 1.0-vShojiUv.y));
        float edge = smoothstep(0.0, 0.21, border);
        vec3 body = mix(vec3(0.46, 0.29, 0.17), vec3(0.81, 0.74, 0.61), edge);
        vec3 sourceColor = mix(body, vec3(0.98, 1.10, 1.29), core);
        float upperPresence = vShojiRoom.y > 7.0 ? 0.90 : 1.0;
        totalEmissiveRadiance *= sourceColor * (0.96 + room * 0.04) * upperPresence;`)
  }
  material.customProgramCacheKey = () => 'pavilion-opaque-shoji-source-v1'
}
