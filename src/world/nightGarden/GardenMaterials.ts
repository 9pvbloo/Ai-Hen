import { rockMineralSample } from './GardenRockMineral'
import { rockSurface } from './GardenRockSurface'
import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, MeshStandardMaterial, NoColorSpace, RepeatWrapping, SRGBColorSpace, Vector2 } from 'three'
import { gravelMineralHeight } from './GardenGravelMineral'
import { GARDEN_RAKE_GLSL } from './GardenRakeShader'
import { GARDEN_SURFACE_DETAIL } from './GardenSurfaceDetail'

type MaterialMaps = {
  readonly color: CanvasTexture
  readonly height: CanvasTexture
  readonly roughness: CanvasTexture
  readonly normal: CanvasTexture
}

type SurfaceKind = 'path' | 'rock' | 'ground' | 'gravel'

const MATERIAL_SIZE = 256

function clamp(value: number): number { return Math.max(0, Math.min(1, value)) }
function smooth(value: number): number { return value * value * (3 - value * 2) }
function fract(value: number): number { return value - Math.floor(value) }
function hash(x: number, y: number): number { return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123) }

function valueNoise(x: number, y: number, frequency: number): number {
  const px = x * frequency
  const py = y * frequency
  const x0 = Math.floor(px)
  const y0 = Math.floor(py)
  const tx = smooth(px - x0)
  const ty = smooth(py - y0)
  const a = hash(x0, y0)
  const b = hash(x0 + 1, y0)
  const c = hash(x0, y0 + 1)
  const d = hash(x0 + 1, y0 + 1)
  return (a + (b - a) * tx) + ((c + (d - c) * tx) - (a + (b - a) * tx)) * ty
}

function heightAt(kind: SurfaceKind, x: number, y: number): number {
  if (kind === 'path') {
    const broad = valueNoise(x + 0.17, y - 0.21, 2.4) - 0.5
    const wornGrain = valueNoise(x, y, 13) - 0.5
    const pit = Math.max(0, valueNoise(x + 0.3, y - 0.4, 24) - 0.76) * 0.33
    return clamp(0.54 + broad * 0.2 + wornGrain * 0.075 - pit)
  }
  if (kind === 'rock') return rockMineralSample(x, y).height
  if (kind === 'gravel') return gravelMineralHeight(x, y)

  const broadSoil = valueNoise(x + 0.31, y - 0.16, 1.45) - 0.5
  const organicBreakup = (valueNoise(x - 0.19, y + 0.27, 5.6) - 0.5) * 0.045
    + (valueNoise(x + 0.42, y - 0.13, 10.8) - 0.5) * 0.025
  const fineGrain = (valueNoise(x * 1.37 + 0.08, y * 0.83 - 0.24, 18) - 0.5) * 0.011
    + (valueNoise(x * 0.71 - 0.36, y * 1.49 + 0.18, 31) - 0.5) * 0.006
  return clamp(0.51 + broadSoil * 0.12 + organicBreakup + fineGrain)
}

function colorFor(kind: SurfaceKind, height: number, x: number, y: number): readonly [number, number, number] {
  if (kind === 'path') {
    const mineral = valueNoise(x - 0.12, y + 0.27, 3.2)
    const tone = clamp(height * 0.78 + mineral * 0.22)
    return [42 + tone * 54, 53 + tone * 62, 60 + tone * 67]
  }
  if (kind === 'rock') return rockMineralSample(x, y).color
  if (kind === 'gravel') {
    const mineral = valueNoise(x + 0.11, y - 0.28, 3.3)
    const granules = valueNoise(x - 0.27, y + 0.19, 18.4) - 0.5
    const tone = clamp(height * 0.78 + mineral * 0.22)
    return [119 + tone * 32 + granules * 22, 127 + tone * 30 + granules * 18, 139 + tone * 26 + granules * 13]
  }
  const soil = clamp(height * 0.82 + valueNoise(x, y, 1.1) * 0.18)
  return [17 + soil * 24, 31 + soil * 34, 27 + soil * 29]
}

function roughnessFor(kind: SurfaceKind, height: number, x: number, y: number): number {
  if (kind === 'path') {
    const damp = valueNoise(x + 0.16, y - 0.32, 2.7)
    return clamp(0.76 + (1 - height) * 0.12 + damp * 0.09)
  }
  if (kind === 'rock') return rockMineralSample(x, y).roughness
  if (kind === 'gravel') return clamp(0.79 + (1 - height) * 0.15 + valueNoise(x - 0.2, y + 0.3, 8.2) * 0.04)
  const broadMatte = valueNoise(x + 0.2, y, 2.2) - 0.5
  const fineMatte = (valueNoise(x - 0.17, y + 0.31, 13.4) - 0.5) * 0.5
    + (valueNoise(x * 1.31, y * 0.77, 32) - 0.5) * 0.24
  return clamp(0.95 + broadMatte * 0.026 + fineMatte * 0.022)
}

function canvasTexture(size: number, colorSpace: typeof SRGBColorSpace | typeof NoColorSpace): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = colorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.generateMipmaps = true
  texture.minFilter = LinearMipmapLinearFilter
  texture.magFilter = LinearFilter
  texture.needsUpdate = true
  return texture
}

function createMaps(kind: SurfaceKind, normalStrength: number): MaterialMaps {
  const color = canvasTexture(MATERIAL_SIZE, SRGBColorSpace)
  const height = canvasTexture(MATERIAL_SIZE, NoColorSpace)
  const roughness = canvasTexture(MATERIAL_SIZE, NoColorSpace)
  const normal = canvasTexture(MATERIAL_SIZE, NoColorSpace)
  const heightValues = new Float32Array(MATERIAL_SIZE * MATERIAL_SIZE)
  const colorContext = color.image.getContext('2d')!
  const heightContext = height.image.getContext('2d')!
  const roughnessContext = roughness.image.getContext('2d')!
  const normalContext = normal.image.getContext('2d')!
  const colorData = colorContext.createImageData(MATERIAL_SIZE, MATERIAL_SIZE)
  const heightData = heightContext.createImageData(MATERIAL_SIZE, MATERIAL_SIZE)
  const roughnessData = roughnessContext.createImageData(MATERIAL_SIZE, MATERIAL_SIZE)
  const normalData = normalContext.createImageData(MATERIAL_SIZE, MATERIAL_SIZE)

  for (let y = 0; y < MATERIAL_SIZE; y++) {
    for (let x = 0; x < MATERIAL_SIZE; x++) {
      const index = y * MATERIAL_SIZE + x
      const normalizedX = x / MATERIAL_SIZE
      const normalizedY = y / MATERIAL_SIZE
      const value = heightAt(kind, normalizedX, normalizedY)
      heightValues[index] = value
      const [red, green, blue] = colorFor(kind, value, normalizedX, normalizedY)
      const pixel = index * 4
      colorData.data[pixel] = red
      colorData.data[pixel + 1] = green
      colorData.data[pixel + 2] = blue
      colorData.data[pixel + 3] = 255
      const heightPixel = Math.round(value * 255)
      heightData.data[pixel] = heightPixel
      heightData.data[pixel + 1] = heightPixel
      heightData.data[pixel + 2] = heightPixel
      heightData.data[pixel + 3] = 255
      const rough = Math.round(roughnessFor(kind, value, normalizedX, normalizedY) * 255)
      roughnessData.data[pixel] = rough
      roughnessData.data[pixel + 1] = rough
      roughnessData.data[pixel + 2] = rough
      roughnessData.data[pixel + 3] = 255
    }
  }

  for (let y = 0; y < MATERIAL_SIZE; y++) {
    for (let x = 0; x < MATERIAL_SIZE; x++) {
      const sample = (offsetX: number, offsetY: number): number =>
        heightValues[((y + offsetY + MATERIAL_SIZE) % MATERIAL_SIZE) * MATERIAL_SIZE + (x + offsetX + MATERIAL_SIZE) % MATERIAL_SIZE]
      const dx = (sample(1, 0) - sample(-1, 0)) * normalStrength
      // CanvasTexture flips rows on upload: rock world-projection uses increasing UV v.
      const dy = (sample(0, 1) - sample(0, -1)) * normalStrength * (kind === 'rock' ? -1 : 1)
      const length = Math.hypot(dx, dy, 1)
      const pixel = (y * MATERIAL_SIZE + x) * 4
      normalData.data[pixel] = Math.round(((-dx / length) * 0.5 + 0.5) * 255)
      normalData.data[pixel + 1] = Math.round(((-dy / length) * 0.5 + 0.5) * 255)
      normalData.data[pixel + 2] = Math.round((0.5 + 0.5 / length) * 255)
      normalData.data[pixel + 3] = 255
    }
  }

  colorContext.putImageData(colorData, 0, 0)
  heightContext.putImageData(heightData, 0, 0)
  roughnessContext.putImageData(roughnessData, 0, 0)
  normalContext.putImageData(normalData, 0, 0)
  color.needsUpdate = true
  height.needsUpdate = true
  roughness.needsUpdate = true
  normal.needsUpdate = true
  return { color, height, roughness, normal }
}

type SurfaceShaderOptions = {
  readonly cacheKey: string
  readonly colorPatch: string
  readonly roughnessPatch: string
  readonly normalPatch?: string
  readonly lightingPatch?: string
  readonly surfaceMix?: boolean
  readonly pathSurfaceTone?: boolean
  readonly groundMacroTone?: boolean
  readonly rockContact?: boolean
  readonly uniforms?: Readonly<Record<string, unknown>>
  readonly uniformDeclarations?: string
}

function addSurfaceShader(material: MeshStandardMaterial, options: SurfaceShaderOptions): void {
  material.onBeforeCompile = shader => {
    const surfaceMixVertex = options.surfaceMix ? 'attribute float surfaceMix;\nvarying float vGardenSurfaceMix;' : ''
    const surfaceMixFragment = options.surfaceMix ? 'varying float vGardenSurfaceMix;' : ''
    const pathSurfaceToneVertex = options.pathSurfaceTone ? 'attribute float pathSurfaceTone;\nvarying float vGardenPathSurfaceTone;' : ''
    const pathSurfaceToneFragment = options.pathSurfaceTone ? 'varying float vGardenPathSurfaceTone;' : ''
    const groundMacroToneVertex = options.groundMacroTone ? 'attribute float physicalRake;\nvarying float vPhysicalRake;\nattribute float groundMacroTone;\nattribute float groundPathDistance;\nvarying float vGardenGroundPathDistance;\nvarying float vGardenGroundMacroTone;' : ''
    const groundMacroToneFragment = options.groundMacroTone ? 'varying float vPhysicalRake;\nvarying float vGardenGroundMacroTone;\nvarying float vGardenGroundPathDistance;' : ''
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        varying vec3 vGardenWorldNormal;
        varying vec3 vGardenWorldPosition;
        ${options.rockContact ? 'varying float vRockHeightAboveOrigin;' : ''}
        ${surfaceMixVertex}
        ${pathSurfaceToneVertex}
        ${groundMacroToneVertex}`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        vec3 gardenWorldNormal = objectNormal;
        #ifdef USE_INSTANCING
          mat3 gardenInstanceNormal = mat3( instanceMatrix );
          gardenWorldNormal /= vec3( dot( gardenInstanceNormal[ 0 ], gardenInstanceNormal[ 0 ] ), dot( gardenInstanceNormal[ 1 ], gardenInstanceNormal[ 1 ] ), dot( gardenInstanceNormal[ 2 ], gardenInstanceNormal[ 2 ] ) );
          gardenWorldNormal = gardenInstanceNormal * gardenWorldNormal;
        #endif
        vGardenWorldNormal = normalize( mat3( modelMatrix ) * gardenWorldNormal );`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec4 gardenWorldPosition = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
          gardenWorldPosition = instanceMatrix * gardenWorldPosition;
        #endif
        gardenWorldPosition = modelMatrix * gardenWorldPosition;
        vGardenWorldPosition = gardenWorldPosition.xyz;
        ${options.rockContact ? `vec4 rockOrigin = vec4(0.0, 0.0, 0.0, 1.0);
          #ifdef USE_INSTANCING
            rockOrigin = instanceMatrix * rockOrigin;
          #endif
          vRockHeightAboveOrigin = gardenWorldPosition.y - (modelMatrix * rockOrigin).y;` : ''}
        ${options.surfaceMix ? 'vGardenSurfaceMix = surfaceMix;' : ''}
        ${options.pathSurfaceTone ? 'vGardenPathSurfaceTone = pathSurfaceTone;' : ''}
        ${options.groundMacroTone ? 'vPhysicalRake = physicalRake; vGardenGroundMacroTone = groundMacroTone; vGardenGroundPathDistance = groundPathDistance;' : ''}`)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vGardenWorldNormal;
        varying vec3 vGardenWorldPosition;
        ${options.rockContact ? 'varying float vRockHeightAboveOrigin;' : ''}
        ${surfaceMixFragment}
        ${pathSurfaceToneFragment}
        ${groundMacroToneFragment}
        ${GARDEN_SURFACE_DETAIL}
        ${options.uniformDeclarations ?? ''}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        ${options.colorPatch}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        ${options.roughnessPatch}`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        ${options.normalPatch ?? ''}`)
      .replace('#include <aomap_fragment>', `#include <aomap_fragment>
        ${options.lightingPatch ?? ''}`)
    for (const [name, value] of Object.entries(options.uniforms ?? {})) shader.uniforms[name] = { value }
  }
  material.customProgramCacheKey = () => options.cacheKey
}

/** Shared, one-time procedural map and material owner for Night Garden physical surfaces. */
export class GardenMaterials {
  readonly pathMaps = createMaps('path', 0.72)
  readonly rockMaps = createMaps('rock', 6.0)
  readonly groundMaps = createMaps('ground', 0.42)
  readonly gravelMaps = createMaps('gravel', 1.65)
  readonly pathMaterial = this.createPathMaterial()
  readonly rockMaterial = this.createRockMaterial()
  readonly groundMaterial = this.createGroundMaterial()

  private createPathMaterial(): MeshStandardMaterial {
    const path = new MeshStandardMaterial({
    map: this.pathMaps.color, normalMap: this.pathMaps.normal, roughnessMap: this.pathMaps.roughness,
      color: '#d5e0e1', vertexColors: false, roughness: 0.92, metalness: 0,
      normalScale: new Vector2(0.24, 0.24), emissive: '#000000', emissiveIntensity: 0,
    })
    addSurfaceShader(path, {
      cacheKey: 'ai-hen-moonlit-path-v5-seated-mineral',
      pathSurfaceTone: true,
      colorPatch: `float pathAuthoredTone = smoothstep( 0.56, 1.06, vGardenPathSurfaceTone );
        float pathTopFacing = smoothstep( 0.38, 0.92, vGardenWorldNormal.y );
        float pathSurfacePresentation = clamp( pathAuthoredTone * 0.72 + pathTopFacing * 0.28, 0.0, 1.0 );
        vec3 pathTopTint = vec3( 1.06, 1.12, 1.15 );
        vec3 pathSideTint = vec3( 0.48, 0.53, 0.54 );
        diffuseColor.rgb *= mix( pathSideTint, pathTopTint, pathSurfacePresentation );
        float mineral = gardenMineral(vGardenWorldPosition * 2.4);
        diffuseColor.rgb *= mix(vec3(0.70, 0.77, 0.75), vec3(1.32, 1.27, 1.12), mineral);`,
      roughnessPatch: `float pathAuthoredRoughness = smoothstep( 0.56, 1.06, vGardenPathSurfaceTone );
        float pathTopRoughness = smoothstep( 0.38, 0.92, vGardenWorldNormal.y );
        float pathFinish = clamp( pathAuthoredRoughness * 0.72 + pathTopRoughness * 0.28, 0.0, 1.0 );
        roughnessFactor *= mix( 1.08, 0.94, pathFinish );`,
      normalPatch: `normal = gardenRelief(normal, gardenMineral(vGardenWorldPosition * 2.4) * 0.016);`,
    })
    return path
  }

  private createGroundMaterial(): MeshStandardMaterial {
    const ground = new MeshStandardMaterial({
      map: this.groundMaps.color, normalMap: this.groundMaps.normal, roughnessMap: this.groundMaps.roughness,
      color: '#d8e4db', vertexColors: false, roughness: 0.96, metalness: 0,
      normalScale: new Vector2(0.15, 0.15), emissive: '#040807', emissiveIntensity: 0.014,
    })
    addSurfaceShader(ground, {
      cacheKey: 'ai-hen-authored-gravel-ground-v15-fine-rake',
      surfaceMix: true,
      groundMacroTone: true,
      uniforms: {
        groundColorMap: this.groundMaps.color, groundRoughnessMap: this.groundMaps.roughness,
        groundNormalMap: this.groundMaps.normal,
        gravelColorMap: this.gravelMaps.color, gravelRoughnessMap: this.gravelMaps.roughness,
        gravelNormalMap: this.gravelMaps.normal, gravelHeightMap: this.gravelMaps.height,
      },
      uniformDeclarations: `uniform sampler2D groundColorMap;
        uniform sampler2D groundRoughnessMap;
        uniform sampler2D groundNormalMap;
        uniform sampler2D gravelColorMap;
        uniform sampler2D gravelRoughnessMap;
        uniform sampler2D gravelNormalMap;
        uniform sampler2D gravelHeightMap;
        ${GARDEN_RAKE_GLSL}`,
      colorPatch: `GardenRakeSample rakeSample = gardenRakeSample(vGardenWorldPosition.xz, vGardenGroundPathDistance);
        { float gravelBlend = smoothstep( 0.02, 0.98, vGardenSurfaceMix );
        vec2 lawnMacroColorUv = vGardenWorldPosition.xz * 0.085;
        vec2 lawnMicroColorUv = vec2(
          vGardenWorldPosition.x * 0.58 + vGardenWorldPosition.z * 0.11,
          vGardenWorldPosition.z * 0.37 - vGardenWorldPosition.x * 0.07 );
        vec3 lawnMacroAlbedo = texture2D( groundColorMap, lawnMacroColorUv ).rgb;
        vec3 lawnMicroAlbedo = texture2D( groundColorMap, lawnMicroColorUv ).rgb;
        float lawnFibers = dot( lawnMicroAlbedo, vec3( 0.3333 ) );
        vec3 lawnFiberTint = mix( vec3( 0.88, 0.94, 0.89 ), vec3( 1.055, 1.09, 1.025 ), lawnFibers );
        float mossCushion = gardenNoise(vGardenWorldPosition.xz * 4.7);
        vec3 lawnAlbedo = lawnMacroAlbedo * lawnFiberTint * (0.95 + mossCushion * 0.65);
        // Independent fine-grain scales avoid a regular bead pattern. Broad
        // mineral variation stays in world space and detail filters through mipmaps.
        vec2 gravelMacroColorUv = vGardenWorldPosition.xz * 2.15;
        vec2 gravelMidColorUv = vGardenWorldPosition.xz * 3.17 + vec2( 0.31, -0.17 );
        vec2 gravelMicroColorUv = vGardenWorldPosition.xz * 2.8 + vec2( -0.13, 0.27 );
        vec3 gravelMacroAlbedo = texture2D( gravelColorMap, gravelMacroColorUv ).rgb;
        vec3 gravelMidAlbedo = texture2D( gravelColorMap, gravelMidColorUv ).rgb;
        vec3 gravelMicroAlbedo = texture2D( gravelColorMap, gravelMicroColorUv ).rgb;
        vec3 gravelAlbedo = mix( gravelMacroAlbedo, gravelMidAlbedo, 0.22 );
        float granularHeight = texture2D( gravelHeightMap, gravelMicroColorUv ).r;
        float granularLightness = dot( gravelMicroAlbedo, vec3( 0.3333 ) );
        float granularResponse = mix( smoothstep( 0.42, 0.67, granularHeight ), granularLightness, 0.1 );
        gravelAlbedo *= mix( 0.95, 1.045, granularResponse );
        float grainFootprint = max(length(dFdx(vGardenWorldPosition.xz)), length(dFdy(vGardenWorldPosition.xz))) * 58.0;
        float grainVisibility = 1.0 - smoothstep(0.45, 1.8, grainFootprint);
        float grain = (gardenNoise(vGardenWorldPosition.xz * 58.0) - 0.5) * grainVisibility;
        gravelAlbedo *= 1.0 + grain * 0.23;
        float mineralBed = gardenNoise(vGardenWorldPosition.xz * 0.72);
        gravelAlbedo *= mix(vec3(0.90, 0.98, 1.12), vec3(1.08, 1.025, 0.95), mineralBed);
        // A darker mineral seam seats the low planted banks in the pale gravel.
        gravelAlbedo *= 1.0 - (1.0 - abs(gravelBlend * 2.0 - 1.0)) * 0.18;
        float lawnDrift = sin( vGardenWorldPosition.x * 0.29 + vGardenWorldPosition.z * 0.17 ) * 0.5 + 0.5;
        vec3 lawnVariation = vec3( 0.9 + lawnDrift * 0.06, 0.95 + lawnDrift * 0.06, 0.91 + lawnDrift * 0.055 );
        float authoredGroundTone = clamp( vGardenGroundMacroTone, 0.68, 0.98 );
        float lawnMassLift = mix( 0.84, 1.075, authoredGroundTone );
        float gravelMassLift = mix( 0.90, 1.035, authoredGroundTone );
        diffuseColor.rgb = mix( lawnAlbedo * lawnVariation * lawnMassLift, gravelAlbedo * gravelMassLift, gravelBlend ); }`,
      roughnessPatch: `{ float gravelRoughnessBlend = smoothstep( 0.02, 0.98, vGardenSurfaceMix );
        vec2 lawnMacroRoughnessUv = vGardenWorldPosition.xz * 0.085;
        vec2 lawnMicroRoughnessUv = vec2(
          vGardenWorldPosition.x * 0.72 + vGardenWorldPosition.z * 0.14,
          vGardenWorldPosition.z * 0.46 - vGardenWorldPosition.x * 0.09 );
        float lawnMacroRoughness = texture2D( groundRoughnessMap, lawnMacroRoughnessUv ).g;
        float lawnMicroRoughness = texture2D( groundRoughnessMap, lawnMicroRoughnessUv ).g;
        float lawnRoughness = mix( lawnMacroRoughness, lawnMicroRoughness, 0.3 );
        vec2 gravelMacroRoughnessUv = vGardenWorldPosition.xz * 0.42;
        vec2 gravelMicroRoughnessUv = vGardenWorldPosition.xz * 1.24 + vec2( -0.21, 0.38 );
        float gravelMacroRoughness = texture2D( gravelRoughnessMap, gravelMacroRoughnessUv ).g;
        float gravelMicroRoughness = texture2D( gravelRoughnessMap, gravelMicroRoughnessUv ).g;
        float gravelRoughness = mix( gravelMacroRoughness, gravelMicroRoughness, 0.42 );
        float mineralMatte = gardenNoise(vGardenWorldPosition.xz * 1.7);
        gravelRoughness = clamp( gravelRoughness + ( gravelMicroRoughness - 0.92 ) * 0.45 - mineralMatte * 0.055, 0.83, 0.98 );
        float exposedCrest = rakeSample.crest / max(rakeSample.coverage, 0.0001);
        float rakeRoughness = clamp(0.96 - exposedCrest * 0.15
          + (gravelMicroRoughness - 0.94) * 0.12, 0.78, 0.98);
        float gravelFinish = mix(roughness * gravelRoughness, rakeRoughness, rakeSample.coverage);
        roughnessFactor = mix( roughness * lawnRoughness, gravelFinish, gravelRoughnessBlend ); }`,
      lightingPatch: `// Local diffuse cavity, independent of albedo and light color.
        float rakeCavity = 0.10 * rakeSample.valley * smoothstep(0.02, 0.98, vGardenSurfaceMix);
        reflectedLight.directDiffuse *= 1.0 - rakeCavity;
        reflectedLight.indirectDiffuse *= 1.0 - rakeCavity * 1.25;`,
      normalPatch: `{ float gravelNormalBlend = smoothstep( 0.02, 0.98, vGardenSurfaceMix );
        vec2 lawnMacroNormalUv = vGardenWorldPosition.xz * 0.085;
        vec2 lawnMicroNormalUv = vec2(
          vGardenWorldPosition.x * 0.78 + vGardenWorldPosition.z * 0.15,
          vGardenWorldPosition.z * 0.48 - vGardenWorldPosition.x * 0.10 );
        vec3 lawnMacroNormal = texture2D( groundNormalMap, lawnMacroNormalUv ).xyz * 2.0 - 1.0;
        vec3 lawnMicroNormal = texture2D( groundNormalMap, lawnMicroNormalUv ).xyz * 2.0 - 1.0;
        vec3 lawnNormal = normalize( mix( lawnMacroNormal, lawnMicroNormal, 0.32 ) );
        vec2 gravelMacroNormalUv = vGardenWorldPosition.xz * 2.15;
        vec2 gravelMicroNormalUv = vGardenWorldPosition.xz * 2.8 + vec2( 0.14, -0.33 );
        vec3 gravelMacroNormal = texture2D( gravelNormalMap, gravelMacroNormalUv ).xyz * 2.0 - 1.0;
        vec3 gravelMicroNormal = texture2D( gravelNormalMap, gravelMicroNormalUv ).xyz * 2.0 - 1.0;
        vec3 gravelNormal = normalize( mix( gravelMacroNormal, gravelMicroNormal, 0.58 ) );
        lawnNormal.xy *= 0.115;
        gravelNormal.xy *= 0.38;
        vec3 surfaceNormal = mix( lawnNormal, gravelNormal, gravelNormalBlend );
        normal = normalize( mix( normal, tbn * surfaceNormal, 0.62 ) );
        float grainFootprint = max(length(dFdx(vGardenWorldPosition.xz)), length(dFdy(vGardenWorldPosition.xz))) * 58.0;
        float grainVisibility = 1.0 - smoothstep(0.45, 1.8, grainFootprint);
        float grainHeight = gardenNoise(vGardenWorldPosition.xz * 58.0) * grainVisibility * 0.0018;
        float mossHeight = gardenNoise(vGardenWorldPosition.xz * 14.0) * 0.018;
        normal = gardenRelief(normal, mix(mossHeight, grainHeight, gravelNormalBlend));
        normal = gardenRelief(normal, rakeSample.height * gravelNormalBlend * (1.0 - vPhysicalRake)); }`,
    })
    return ground
  }

  private createRockMaterial(): MeshStandardMaterial {
    const rock = new MeshStandardMaterial({
      color: '#819499', vertexColors: true, roughness: 0.92, metalness: 0,
      emissive: '#000000', emissiveIntensity: 0,
    })
    addSurfaceShader(rock, rockSurface(this.rockMaps))
    return rock
  }

  dispose(): void {
    for (const maps of [this.pathMaps, this.rockMaps, this.groundMaps, this.gravelMaps]) {
      maps.color.dispose()
      maps.height.dispose()
      maps.roughness.dispose()
      maps.normal.dispose()
    }
    this.pathMaterial.dispose()
    this.rockMaterial.dispose()
    this.groundMaterial.dispose()
  }
}

