import type { CanvasTexture } from 'three'

/** Rock-only patches; the shared ground/path shader stays untouched. */
export function rockSurface(maps: { color: CanvasTexture; roughness: CanvasTexture }) {
  return {
      cacheKey: 'ai-hen-weathered-rock-v4-moss-mineral',
      uniforms: { rockColorMap: maps.color, rockRoughnessMap: maps.roughness },
      uniformDeclarations: 'uniform sampler2D rockColorMap;\nuniform sampler2D rockRoughnessMap;',
      colorPatch: `vec3 rockAxisWeights = pow( abs( normalize( vGardenWorldNormal ) ), vec3( 3.5 ) );
        rockAxisWeights /= max( dot( rockAxisWeights, vec3( 1.0 ) ), 0.0001 );
        vec3 rockX = texture2D( rockColorMap, vGardenWorldPosition.yz * 0.22 ).rgb;
        vec3 rockY = texture2D( rockColorMap, vGardenWorldPosition.xz * 0.22 ).rgb;
        vec3 rockZ = texture2D( rockColorMap, vGardenWorldPosition.xy * 0.22 ).rgb;
        float rockMineral = dot( rockX * rockAxisWeights.x + rockY * rockAxisWeights.y + rockZ * rockAxisWeights.z, vec3( 0.3333 ) );
        float rockTopColor = smoothstep( 0.16, 0.84, vGardenWorldNormal.y );
        float mineral = gardenMineral(vGardenWorldPosition * 1.8);
        diffuseColor.rgb *= (0.78 + rockMineral * 0.30) * mix(vec3(0.57, 0.64, 0.64), vec3(1.52, 1.46, 1.31), mineral);
        float moss = smoothstep(0.48, 0.69, gardenNoise(vGardenWorldPosition.xz * 2.2 + vGardenWorldPosition.y)) * rockTopColor;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.07, 0.105, 0.052), moss * 0.55);`,
      roughnessPatch: `vec3 rockRoughnessWeights = pow( abs( normalize( vGardenWorldNormal ) ), vec3( 3.5 ) );
        rockRoughnessWeights /= max( dot( rockRoughnessWeights, vec3( 1.0 ) ), 0.0001 );
        float rockRoughnessDetail = texture2D( rockRoughnessMap, vGardenWorldPosition.yz * 0.22 ).g * rockRoughnessWeights.x
          + texture2D( rockRoughnessMap, vGardenWorldPosition.xz * 0.22 ).g * rockRoughnessWeights.y
          + texture2D( rockRoughnessMap, vGardenWorldPosition.xy * 0.22 ).g * rockRoughnessWeights.z;
        float rockTopRoughness = smoothstep( 0.16, 0.84, vGardenWorldNormal.y );
        roughnessFactor *= 0.98 + rockRoughnessDetail * 0.06 - rockTopRoughness * 0.025;`,
      normalPatch: `normal = gardenRelief(normal, gardenMineral(vGardenWorldPosition * 1.8) * 0.055);`,
    }
}
