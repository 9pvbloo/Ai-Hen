import type { CanvasTexture } from 'three'

/** Rock-only world-space surface; vertex/instance colors retain composition hierarchy. */
export function rockSurface(maps: { color: CanvasTexture; roughness: CanvasTexture; normal: CanvasTexture }) {
  return {
    cacheKey: 'ai-hen-rock-mineral-v7-weathering',
    rockContact: true,
    uniforms: { rockColorMap: maps.color, rockRoughnessMap: maps.roughness, rockNormalMap: maps.normal },
    uniformDeclarations: 'uniform sampler2D rockColorMap;\nuniform sampler2D rockRoughnessMap;\nuniform sampler2D rockNormalMap;',
    colorPatch: `vec3 rockAxisWeights = pow(abs(normalize(vGardenWorldNormal)), vec3(3.5));
      rockAxisWeights /= max(dot(rockAxisWeights, vec3(1.0)), .0001);
      vec3 rockP = vGardenWorldPosition * .75;
      vec3 rockAlbedo = texture2D(rockColorMap, rockP.yz).rgb * rockAxisWeights.x
        + texture2D(rockColorMap, rockP.xz).rgb * rockAxisWeights.y
        + texture2D(rockColorMap, rockP.xy).rgb * rockAxisWeights.z;
      // Linear albedo modulation preserves the approved nocturnal exposure.
      float rockMacro = gardenNoise(vGardenWorldPosition.xz * .53 + vGardenWorldPosition.y * .19);
      diffuseColor.rgb *= rockAlbedo * 2.85
        * mix(vec3(.93, .98, 1.035), vec3(1.055, 1.015, .965), rockMacro);
      // Buried instance origins provide a soft contact proxy, without geometry edits.
      float rockWeather = gardenNoise(vGardenWorldPosition.xz * 2.3 + vGardenWorldPosition.y * .61);
      float rockDamp = (1.0 - smoothstep(.10, .46, vRockHeightAboveOrigin + (rockWeather - .5) * .15))
        * (.35 + rockWeather * .65);
      diffuseColor.rgb *= 1.0 - rockDamp * .16;`,
    roughnessPatch: `float rockRoughnessDetail = texture2D(rockRoughnessMap, rockP.yz).g * rockAxisWeights.x
      + texture2D(rockRoughnessMap, rockP.xz).g * rockAxisWeights.y
      + texture2D(rockRoughnessMap, rockP.xy).g * rockAxisWeights.z;
      roughnessFactor = clamp(rockRoughnessDetail - rockDamp * .035, .82, .97);`,
    normalPatch: `// Reconstruct a world-space height gradient, not a blend of tangent normals.
      // Planar coordinates have positive world axes on both faces: no face-sign flip.
      vec3 rockNX = texture2D(rockNormalMap, rockP.yz).xyz * 2.0 - 1.0;
      vec3 rockNY = texture2D(rockNormalMap, rockP.xz).xyz * 2.0 - 1.0;
      vec3 rockNZ = texture2D(rockNormalMap, rockP.xy).xyz * 2.0 - 1.0;
      vec2 rockDX = -rockNX.xy / max(rockNX.z, .2);
      vec2 rockDY = -rockNY.xy / max(rockNY.z, .2);
      vec2 rockDZ = -rockNZ.xy / max(rockNZ.z, .2);
      vec3 rockGradient = vec3(0.0, rockDX) * rockAxisWeights.x
        + vec3(rockDY.x, 0.0, rockDY.y) * rockAxisWeights.y
        + vec3(rockDZ, 0.0) * rockAxisWeights.z;
      vec3 rockWorldNormal = inverseTransformDirection(normal, viewMatrix);
      rockGradient -= rockWorldNormal * dot(rockWorldNormal, rockGradient);
      normal = normalize(mat3(viewMatrix) * normalize(rockWorldNormal - rockGradient * .65));`,
  }
}
