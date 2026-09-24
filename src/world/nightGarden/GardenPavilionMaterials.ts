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
    // This is a restrained multiplier, not the wood's final albedo. Its lighter
    // range lets the material's dark espresso base carry the exterior palette.
    color: [Math.round(150 + tone * 72), Math.round(132 + tone * 64), Math.round(116 + tone * 55)],
    height: clamp(0.48 + grain * 0.14 + fineGrain * 0.055 - pores * 0.14),
    roughness: clamp(0.91 + broad * 0.045 - pores * 0.13),
  }
}

function paperSample(u: number, v: number): SurfaceSample {
  const cloud = valueNoise(u + 0.17, v - 0.23, 2.2) - 0.5
  const fibers = Math.sin(u * 198 + Math.sin(v * 21) * 1.4) * 0.5 + 0.5
  const crossFiber = Math.sin(v * 137 + Math.sin(u * 13) * 1.2) * 0.5 + 0.5
  const density = clamp(0.72 + cloud * 0.13 + (fibers - 0.5) * 0.032 + (crossFiber - 0.5) * 0.018)
  return {
    color: [Math.round(190 + density * 32), Math.round(187 + density * 31), Math.round(172 + density * 33)],
    height: clamp(0.52 + (fibers - 0.5) * 0.08 + (crossFiber - 0.5) * 0.045),
    roughness: clamp(0.94 + cloud * 0.025),
  }
}

function stoneSample(u: number, v: number): SurfaceSample {
  const broad = valueNoise(u + 0.19, v - 0.27, 2.1) - 0.5
  const mineral = valueNoise(u - 0.34, v + 0.11, 6.2) - 0.5
  const pitting = Math.max(0, valueNoise(u + 0.08, v - 0.37, 21) - 0.72)
  const tone = clamp(0.57 + broad * 0.27 + mineral * 0.08 - pitting * 0.16)
  return {
    color: [Math.round(32 + tone * 22), Math.round(39 + tone * 25), Math.round(40 + tone * 25)],
    height: clamp(0.54 + broad * 0.25 + mineral * 0.09 - pitting * 0.34),
    roughness: clamp(0.94 + broad * 0.035 + pitting * 0.05),
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
  private readonly paperMaps = createMaps(paperSample, 0.16)
  private readonly stoneMaps = createMaps(stoneSample, 0.42)
  private readonly textures: Texture[] = [
    this.woodMaps.color, this.woodMaps.normal, this.woodMaps.roughness,
    this.paperMaps.color, this.paperMaps.normal, this.paperMaps.roughness,
    this.stoneMaps.color, this.stoneMaps.normal, this.stoneMaps.roughness,
  ]
  readonly lowerRoof = this.createRoofMaterial('#182329', 0.87, 'ai-hen-pavilion-roof-lower-v2')
  readonly upperRoof = this.createRoofMaterial('#141f26', 0.89, 'ai-hen-pavilion-roof-upper-v2')
  readonly wingRoof = this.createRoofMaterial('#17242a', 0.9, 'ai-hen-pavilion-roof-wing-v2')
  readonly foundation = this.createStoneMaterial()
  readonly timber = this.createWoodMaterial('#211813', 0.86, '#3c3022', 0.14)
  readonly trim = this.createWoodMaterial('#34261d', 0.8, '#4b3b2a', 0.15)
  readonly soffit = this.createWoodMaterial('#141411', 0.92, '#171611', 0.08)
  readonly roofDetail = material('#1a282d', 0.84)
  readonly core = material('#0d1314', 0.95)
  readonly warmInterior = material('#51331f', 0.9)
  readonly quietInterior = material('#17201e', 0.92)
  readonly interiorShadow = material('#121412', 0.95)
  readonly coolPaper = this.createPaperMaterial('#c7cbc3', '#1d2929', 0.88, 'ai-hen-pavilion-paper-cool-v2')
  readonly warmPaper = this.createPaperMaterial('#c98b53', '#7f3a16', 0.86, 'ai-hen-pavilion-paper-warm-v2')
  readonly quietPaper = this.createPaperMaterial('#a9aea6', '#171f20', 0.82, 'ai-hen-pavilion-paper-quiet-v2')

  private readonly materials = [
    this.lowerRoof, this.upperRoof, this.wingRoof, this.foundation, this.timber, this.trim, this.soffit,
    this.roofDetail, this.core, this.warmInterior, this.quietInterior, this.interiorShadow,
    this.coolPaper, this.warmPaper, this.quietPaper,
  ]

  constructor() {
    this.warmInterior.emissive.set('#763511')
    this.quietInterior.emissive.set('#101919')
  }

  setIntensity(value: number): void {
    this.coolPaper.emissiveIntensity = 0.042 * value
    this.warmPaper.emissiveIntensity = 0.145 * value
    this.quietPaper.emissiveIntensity = 0.014 * value
    this.warmInterior.emissiveIntensity = 0.11 * value
    this.quietInterior.emissiveIntensity = 0.02 * value
  }

  dispose(): void {
    this.materials.forEach(material => material.dispose())
    this.textures.forEach(texture => texture.dispose())
  }

  private createWoodMaterial(color: string, roughness: number, emissive: string, emissiveIntensity: number): MeshStandardMaterial {
    return new MeshStandardMaterial({
      color, map: this.woodMaps.color, normalMap: this.woodMaps.normal, roughnessMap: this.woodMaps.roughness,
      roughness, emissive, emissiveIntensity, metalness: 0, vertexColors: true, normalScale: new Vector2(0.22, 0.22),
    })
  }

  private createStoneMaterial(): MeshStandardMaterial {
    return new MeshStandardMaterial({
      color: '#252e30', map: this.stoneMaps.color, normalMap: this.stoneMaps.normal, roughnessMap: this.stoneMaps.roughness,
      roughness: 0.93, metalness: 0, vertexColors: true, normalScale: new Vector2(0.14, 0.14),
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

  private createPaperMaterial(color: string, emissive: string, opacity: number, cacheKey: string): MeshStandardMaterial {
    const paper = new MeshStandardMaterial({
      color, emissive, map: this.paperMaps.color, normalMap: this.paperMaps.normal, roughnessMap: this.paperMaps.roughness,
      roughness: 0.91, metalness: 0, transparent: true, opacity, depthWrite: false, alphaTest: 0.015,
      normalScale: new Vector2(0.06, 0.06),
    })
    addWorldPositionVarying(paper, `
      float paperMottle = sin( vPavilionWorldPosition.x * 5.7 + vPavilionWorldPosition.y * 3.1 + vPavilionWorldPosition.z * 2.3 ) * 0.5 + 0.5;
      diffuseColor.rgb *= 0.975 + paperMottle * 0.035;
      roughnessFactor *= 0.99 + paperMottle * 0.018;`, cacheKey)
    return paper
  }
}
