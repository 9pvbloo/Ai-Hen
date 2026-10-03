import { Mesh, MeshStandardMaterial, ShaderChunk } from 'three'
import type { Group } from 'three'
import { GARDEN_WALL_RUNS } from './GardenPerimeterComposition'

/** Analytic receiver boundary for unshadowed practicals, not a global light mask.
 * Only local point-light radiance is suppressed beyond the authored wall planes.
 * Wall interiors retain their wash; moon/sky/specular material values are untouched. */
export const PRACTICAL_INTERIOR_GLSL = `
float gardenPracticalInterior(vec2 p) {
  float interior = 1.0;
  ${GARDEN_WALL_RUNS.map(({ from: a, to: b }) => {
    const minZ = Math.min(a[1], b[1]), maxZ = Math.max(a[1], b[1])
    return `{
      float t = clamp((p.y - ${a[1].toFixed(3)}) / ${(b[1] - a[1]).toFixed(3)}, 0.0, 1.0);
      float wallX = mix(${a[0].toFixed(3)}, ${b[0].toFixed(3)}, t);
      float span = smoothstep(${(minZ - 0.12).toFixed(3)}, ${(minZ + 0.12).toFixed(3)}, p.y)
        * (1.0 - smoothstep(${(maxZ - 0.12).toFixed(3)}, ${(maxZ + 0.12).toFixed(3)}, p.y));
      float side = ${(a[0] < 0 ? 1 : -1).toFixed(1)} * (p.x - wallX);
      interior = min(interior, mix(1.0, smoothstep(-0.05, 0.12, side), span));
    }`
  }).join('\n')}
  return interior;
}`

/** Compose with existing material shaders; no geometry, albedo or roughness edits. */
export function containGardenPracticalLights(root: Group): void {
  const materials = new Set<MeshStandardMaterial>()
  const visit = (node: typeof root | Mesh): void => {
    if (node.name === 'garden-pavilion-residence' || node.name === 'garden-path-lanterns') return
    if (node instanceof Mesh) for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      if (material instanceof MeshStandardMaterial) materials.add(material)
    }
    for (const child of node.children) visit(child as typeof root | Mesh)
  }
  visit(root)
  for (const material of materials) {
    const original = material.onBeforeCompile, cache = material.customProgramCacheKey()
    material.onBeforeCompile = (shader, renderer) => {
      original.call(material, shader, renderer)
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vPracticalPosition;')
        .replace('#include <project_vertex>', `#include <project_vertex>
          vec4 practicalPosition = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            practicalPosition = instanceMatrix * practicalPosition;
          #endif
          vPracticalPosition = (modelMatrix * practicalPosition).xyz;`)
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
        varying vec3 vPracticalPosition;
        ${PRACTICAL_INTERIOR_GLSL}`)
        .replace('#include <lights_fragment_begin>', `float practicalInterior = gardenPracticalInterior(vPracticalPosition.xz);
          ${ShaderChunk.lights_fragment_begin.replace('getPointLightInfo( pointLight, geometryPosition, directLight );',
            'getPointLightInfo( pointLight, geometryPosition, directLight ); directLight.color *= practicalInterior;')}`)
    }
    material.customProgramCacheKey = () => `${cache}-practical-wall-containment-v1`
    material.needsUpdate = true
  }
}
