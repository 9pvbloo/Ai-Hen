import { ShaderChunk } from 'three'
import type { MeshStandardMaterial } from 'three'

/** Ground material only. The moon is the sole shadowed directional light.
 * Preserve the shadow test, rim, ambient and every local practical contribution. */
export function softenHorizontalMoon(material: MeshStandardMaterial): void {
  const original = material.onBeforeCompile, cache = material.customProgramCacheKey()
  material.onBeforeCompile = (shader, renderer) => {
    original.call(material, shader, renderer)
    const lighting = ShaderChunk.lights_fragment_begin.replace(
      'getDirectionalLightInfo( directionalLight, directLight );',
      `getDirectionalLightInfo( directionalLight, directLight );
      #if ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
        float gardenMoonUp = smoothstep(0.65, 0.95, normalize(vGardenWorldNormal).y);
        float gardenMoonGravel = smoothstep(0.02, 0.98, vGardenSurfaceMix);
        directLight.color *= 1.0 - 0.16 * gardenMoonUp * gardenMoonGravel;
      #endif`)
    shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_begin>', lighting)
  }
  material.customProgramCacheKey = () => `${cache}-horizontal-moon-receiver-v1`
  material.needsUpdate = true
}
