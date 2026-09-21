import { CanvasTexture, MeshStandardMaterial, NoColorSpace, RepeatWrapping, SRGBColorSpace, Vector2 } from 'three'

type MaterialMaps = {
  readonly color: CanvasTexture
  readonly height: CanvasTexture
  readonly roughness: CanvasTexture
  readonly normal: CanvasTexture
}

type SurfaceKind = 'path' | 'rock' | 'ground'

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
  if (kind === 'rock') {
    const erosion = valueNoise(x - 0.23, y + 0.14, 2.1) - 0.5
    const furrowField = valueNoise(x + 0.35, y - 0.18, 6.4)
    const furrow = Math.max(0, furrowField - 0.62) * 0.34
    const pitting = Math.max(0, valueNoise(x - 0.1, y + 0.27, 19) - 0.7) * 0.22
    return clamp(0.55 + erosion * 0.42 - furrow - pitting)
  }
  const broadSoil = valueNoise(x + 0.31, y - 0.16, 1.45) - 0.5
  const fineSoil = valueNoise(x, y, 5.2) - 0.5
  return clamp(0.51 + broadSoil * 0.15 + fineSoil * 0.028)
}

function colorFor(kind: SurfaceKind, height: number, x: number, y: number): readonly [number, number, number] {
  if (kind === 'path') {
    const mineral = valueNoise(x - 0.12, y + 0.27, 3.2)
    const tone = clamp(height * 0.78 + mineral * 0.22)
    return [42 + tone * 54, 53 + tone * 62, 60 + tone * 67]
  }
  if (kind === 'rock') {
    const ridge = clamp((height - 0.28) * 1.34)
    const damp = clamp((0.49 - height) * 2.2) * valueNoise(x + 0.42, y - 0.35, 3.8)
    return [48 + ridge * 75 - damp * 9, 56 + ridge * 80 - damp * 2, 58 + ridge * 82 - damp * 8]
  }
  const soil = clamp(height * 0.82 + valueNoise(x, y, 1.1) * 0.18)
  return [15 + soil * 19, 25 + soil * 26, 27 + soil * 24]
}

function roughnessFor(kind: SurfaceKind, height: number, x: number, y: number): number {
  if (kind === 'path') {
    const damp = valueNoise(x + 0.16, y - 0.32, 2.7)
    return clamp(0.76 + (1 - height) * 0.12 + damp * 0.09)
  }
  if (kind === 'rock') return clamp(0.76 + (1 - height) * 0.17 + valueNoise(x, y, 5.5) * 0.055)
  return clamp(0.9 + valueNoise(x + 0.2, y, 1.9) * 0.07)
}

function canvasTexture(size: number, colorSpace: typeof SRGBColorSpace | typeof NoColorSpace): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = colorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
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
      const dy = (sample(0, 1) - sample(0, -1)) * normalStrength
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

/** Shared, one-time procedural map and material owner for Night Garden physical surfaces. */
export class GardenMaterials {
  readonly pathMaps = createMaps('path', 0.72)
  readonly rockMaps = createMaps('rock', 1.05)
  readonly groundMaps = createMaps('ground', 0.15)
  readonly pathMaterial = new MeshStandardMaterial({
    map: this.pathMaps.color, normalMap: this.pathMaps.normal, roughnessMap: this.pathMaps.roughness,
    color: '#d6e0dd', vertexColors: true, roughness: 0.94, metalness: 0,
    normalScale: new Vector2(0.26, 0.26), emissive: '#060a0c', emissiveIntensity: 0.045,
  })
  readonly rockMaterial = new MeshStandardMaterial({
    map: this.rockMaps.color, normalMap: this.rockMaps.normal, roughnessMap: this.rockMaps.roughness,
    color: '#9aa7a1', vertexColors: true, roughness: 0.93, metalness: 0,
    normalScale: new Vector2(0.34, 0.34), emissive: '#06090a', emissiveIntensity: 0.035,
  })
  readonly groundMaterial = new MeshStandardMaterial({
    map: this.groundMaps.color, normalMap: this.groundMaps.normal, roughnessMap: this.groundMaps.roughness,
    color: '#d0dad5', vertexColors: true, roughness: 0.97, metalness: 0,
    normalScale: new Vector2(0.055, 0.055), emissive: '#050909', emissiveIntensity: 0.035,
  })

  dispose(): void {
    for (const maps of [this.pathMaps, this.rockMaps, this.groundMaps]) {
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
