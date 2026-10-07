import type { CanvasTexture } from 'three'

/** Rock-only world-space surface; vertex/instance colors retain composition hierarchy. */
export function rockSurface(maps: { color: CanvasTexture; roughness: CanvasTexture }) {
  return {
    cacheKey: 'ai-hen-rock-mineral-v5',
    uniforms: { rockColorMap: maps.color, rockRoughnessMap: maps.roughness },
    uniformDeclarations: 'uniform sampler2D rockColorMap;\nuniform sampler2D rockRoughnessMap;',
    colorPatch: `vec3 rockAxisWeights = pow(abs(normalize(vGardenWorldNormal)), vec3(3.5));
      rockAxisWeights /= max(dot(rockAxisWeights, vec3(1.0)), .0001);
      vec3 rockP = vGardenWorldPosition * .75;
      vec3 rockAlbedo = texture2D(rockColorMap, rockP.yz).rgb * rockAxisWeights.x
        + texture2D(rockColorMap, rockP.xz).rgb * rockAxisWeights.y
        + texture2D(rockColorMap, rockP.xy).rgb * rockAxisWeights.z;
      // Linear albedo modulation preserves the approved nocturnal exposure.
      float rockMacro = gardenNoise(vGardenWorldPosition.xz * .53 + vGardenWorldPosition.y * .19);
      diffuseColor.rgb *= rockAlbedo * 2.85
        * mix(vec3(.93, .98, 1.035), vec3(1.055, 1.015, .965), rockMacro);`,
    roughnessPatch: `float rockRoughnessDetail = texture2D(rockRoughnessMap, rockP.yz).g * rockAxisWeights.x
      + texture2D(rockRoughnessMap, rockP.xz).g * rockAxisWeights.y
      + texture2D(rockRoughnessMap, rockP.xy).g * rockAxisWeights.z;
      roughnessFactor = clamp(rockRoughnessDetail, .82, .97);`,
    normalPatch: `normal = gardenRelief(normal, gardenMineral(vGardenWorldPosition * 1.8) * .008);`,
  }
}
