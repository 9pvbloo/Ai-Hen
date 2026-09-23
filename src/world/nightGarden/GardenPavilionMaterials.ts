import { CanvasTexture, MeshStandardMaterial, NoColorSpace, RepeatWrapping, SRGBColorSpace, Texture, Vector2 } from 'three'

type ProceduralMaps = {
  readonly color: CanvasTexture
  readonly normal: CanvasTexture
  readonly roughness: CanvasTexture
}

type SurfaceSample = {
  readonly color: readonly [number, number, number]
  readonly height: number
  readonly roughness: number
}

const MATERIAL_SIZE = 256

function clamp(value: number): number { return Math.max(0, Math.min(1, value)) }
function fract(value: number): number { return value - Math.floor(value) }
function smooth(value: number): number { return value * value * (3 - value * 2) }
function hash(x: number, y: number): number { return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123) }

function valueNoise(x: number, y: number, frequency: number): number {
  const px = x * frequency; const py = y * frequency
  const x0 = Math.floor(px); const y0 = Math.floor(py)
  const tx = smooth(px - x0); const ty = smooth(py - y0)
  const a = hash(x0, y0); const b = hash(x0 + 1, y0)
  const c = hash(x0, y0 + 1); const d = hash(x0 + 1, y0 + 1)
  return (a + (b - a) * tx) + ((c + (d - c) * tx) - (a + (b - a) * tx)) * ty
}

function canvasTexture(colorSpace: typeof SRGBColorSpace | typeof NoColorSpace): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = MATERIAL_SIZE
  canvas.height = MATERIAL_SIZE
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = colorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  return texture
}

function createMaps(sampleAt: (u: number, v: number) => SurfaceSample, normalStrength: number): ProceduralMaps {
  const color = canvasTexture(SRGBColorSpace)
  const normal = canvasTexture(NoColorSpace)
  const roughness = canvasTexture(NoColorSpace)
  const heights = new Float32Array(MATERIAL_SIZE * MATERIAL_SIZE)
  const colorData = color.image.getContext('2d')!.createImageData(MATERIAL_SIZE, MATERIAL_SIZE)
  const normalData = normal.image.getContext('2d')!.createImageData(MATERIAL_SIZE, MATERIAL_SIZE)
  const roughnessData = roughness.image.getContext('2d')!.createImageData(MATERIAL_SIZE, MATERIAL_SIZE)
  for (let y = 0; y < MATERIAL_SIZE; y++) for (let x = 0; x < MATERIAL_SIZE; x++) {
    const index = y * MATERIAL_SIZE + x
    const sample = sampleAt(x / MATERIAL_SIZE, y / MATERIAL_SIZE)
    const pixel = index * 4
    heights[index] = sample.height
    colorData.data.set([...sample.color, 255], pixel)
    const roughnessValue = Math.round(clamp(sample.roughness) * 255)
    roughnessData.data.set([roughnessValue, roughnessValue, roughnessValue, 255], pixel)
  }
  for (let y = 0; y < MATERIAL_SIZE; y++) for (let x = 0; x < MATERIAL_SIZE; x++) {
    const heightAt = (offsetX: number, offsetY: number): number =>
      heights[((y + offsetY + MATERIAL_SIZE) % MATERIAL_SIZE) * MATERIAL_SIZE + (x + offsetX + MATERIAL_SIZE) % MATERIAL_SIZE]
    const dx = (heightAt(1, 0) - heightAt(-1, 0)) * normalStrength
    const dy = (heightAt(0, 1) - heightAt(0, -1)) * normalStrength
    const length = Math.hypot(dx, dy, 1)
    const pixel = (y * MATERIAL_SIZE + x) * 4
    normalData.data.set([
      Math.round(((-dx / length) * 0.5 + 0.5) * 255), Math.round(((-dy / length) * 0.5 + 0.5) * 255),
      Math.round((0.5 + 0.5 / length) * 255), 255,
    ], pixel)
  }
  color.image.getContext('2d')!.putImageData(colorData, 0, 0)
  normal.image.getContext('2d')!.putImageData(normalData, 0, 0)
  roughness.image.getContext('2d')!.putImageData(roughnessData, 0, 0)
  color.needsUpdate = true; normal.needsUpdate = true; roughness.needsUpdate = true
  return { color, normal, roughness }
}

function woodSample(u: number, v: number): SurfaceSample {
  const broad = valueNoise(u - 0.18, v + 0.31, 2.4) - 0.5
  const grain = Math.sin(v * 126 + Math.sin(u * 17 + v * 3.4) * 1.9)
  const fineGrain = Math.sin(v * 302 + Math.sin(u * 46) * 2.1)
  const pores = Math.max(0, grain * 0.72 + fineGrain * 0.28 - 0.42)
  const tone = clamp(0.57 + broad * 0.24 + grain * 0.055 + fineGrain * 0.02 - pores * 0.16)
  return {
    color: [Math.round(37 + tone * 31), Math.round(28 + tone * 25), Math.round(21 + tone * 19)],
    height: clamp(0.48 + grain * 0.14 + fineGrain * 0.055 - pores * 0.14),
    roughness: clamp(0.91 + broad * 0.045 - pores * 0.13),
  }
}

function material(color: string, roughness: number): MeshStandardMaterial {
  return new MeshStandardMaterial({ color, roughness, metalness: 0.03 })
}

function addWorldPositionVarying(material: MeshStandardMaterial, fragmentPatch: string, cacheKey: string): void {
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPavilionWorldPosition;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec4 pavilionWorldPosition = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
          pavilionWorldPosition = instanceMatrix * pavilionWorldPosition;
        #endif
        pavilionWorldPosition = modelMatrix * pavilionWorldPosition;
        vPavilionWorldPosition = pavilionWorldPosition.xyz;`)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPavilionWorldPosition;')
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n${fragmentPatch}`)
  }
  material.customProgramCacheKey = () => cacheKey
}

/** Owns the mansion's material instances and their lifecycle. */
export class GardenPavilionMaterials {
  private readonly woodMaps = createMaps(woodSample, 0.5)
  private readonly textures: Texture[] = [this.woodMaps.color, this.woodMaps.normal, this.woodMaps.roughness]
  readonly lowerRoof = this.createRoofMaterial('#263334', 0.87, 'ai-hen-pavilion-roof-lower-v1')
  readonly upperRoof = this.createRoofMaterial('#1d292d', 0.89, 'ai-hen-pavilion-roof-upper-v1')
  readonly wingRoof = this.createRoofMaterial('#223031', 0.9, 'ai-hen-pavilion-roof-wing-v1')
  readonly foundation = material('#182426', 0.9)
  readonly timber = this.createWoodMaterial('#d3d0c6', 0.86)
  readonly trim = this.createWoodMaterial('#e0d1ba', 0.8)
  readonly soffit = this.createWoodMaterial('#747b73', 0.92)
  readonly roofDetail = material('#364542', 0.76)
  readonly core = material('#101718', 0.95)
  readonly warmInterior = material('#604a35', 0.9)
  readonly quietInterior = material('#18201f', 0.92)
  readonly interiorShadow = material('#121412', 0.95)
  readonly coolPaper = material('#c8ceca', 0.84)
  readonly warmPaper = material('#c5ad8d', 0.86)
  readonly quietPaper = material('#a7afaa', 0.88)

  private readonly materials = [
    this.lowerRoof, this.upperRoof, this.wingRoof, this.foundation, this.timber, this.trim, this.soffit,
    this.roofDetail, this.core, this.warmInterior, this.quietInterior, this.interiorShadow,
    this.coolPaper, this.warmPaper, this.quietPaper,
  ]

  constructor() {
    this.warmInterior.emissive.set('#6f391b')
    this.quietInterior.emissive.set('#131a1a')
    this.coolPaper.emissive.set('#303634')
    this.warmPaper.emissive.set('#5c341d')
    this.quietPaper.emissive.set('#1c2424')
    for (const paper of [this.coolPaper, this.warmPaper, this.quietPaper]) {
      paper.transparent = true
      paper.depthWrite = false
    }
    this.coolPaper.opacity = 0.86
    this.warmPaper.opacity = 0.84
    this.quietPaper.opacity = 0.8
  }

  setIntensity(value: number): void {
    this.coolPaper.emissiveIntensity = 0.042 * value
    this.warmPaper.emissiveIntensity = 0.105 * value
    this.quietPaper.emissiveIntensity = 0.014 * value
    this.warmInterior.emissiveIntensity = 0.11 * value
    this.quietInterior.emissiveIntensity = 0.02 * value
  }

  dispose(): void {
    this.materials.forEach(material => material.dispose())
    this.textures.forEach(texture => texture.dispose())
  }

  private createWoodMaterial(color: string, roughness: number): MeshStandardMaterial {
    return new MeshStandardMaterial({
      color, map: this.woodMaps.color, normalMap: this.woodMaps.normal, roughnessMap: this.woodMaps.roughness,
      roughness, metalness: 0, vertexColors: true, normalScale: new Vector2(0.22, 0.22),
    })
  }

  private createRoofMaterial(color: string, roughness: number, cacheKey: string): MeshStandardMaterial {
    const roof = new MeshStandardMaterial({ color, roughness, metalness: 0 })
    addWorldPositionVarying(roof, `
      float broadCeramic = sin( vPavilionWorldPosition.x * 0.83 + vPavilionWorldPosition.z * 0.31 ) * 0.5 + 0.5;
      float tileRhythm = sin( vPavilionWorldPosition.z * 22.0 + sin( vPavilionWorldPosition.x * 0.56 ) * 0.42 ) * 0.5 + 0.5;
      float tileRidge = smoothstep( 0.83, 0.98, tileRhythm );
      float weathering = sin( vPavilionWorldPosition.x * 3.6 + vPavilionWorldPosition.z * 1.9 ) * 0.5 + 0.5;
      diffuseColor.rgb *= 0.94 + broadCeramic * 0.045 + tileRidge * 0.035 - weathering * 0.025;
      roughnessFactor *= 1.035 - tileRidge * 0.075 + weathering * 0.026;`, cacheKey)
    return roof
  }
}
