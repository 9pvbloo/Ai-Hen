import { CanvasTexture, LinearMipmapLinearFilter, MeshBasicMaterial, MeshStandardMaterial,
  RepeatWrapping, SRGBColorSpace } from 'three'
import { MOON_GATE } from './MoonGateConfig'

function createPlasterTexture(): CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')!
  const image = context.createImageData(size, size)

  const smooth = (value: number): number => value * value * (3 - 2 * value)
  const hash = (x: number, y: number): number => {
    const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
    return value - Math.floor(value)
  }
  const noise = (x: number, y: number, scale: number): number => {
    const gridX = x / scale
    const gridY = y / scale
    const x0 = Math.floor(gridX)
    const y0 = Math.floor(gridY)
    const blendX = smooth(gridX - x0)
    const blendY = smooth(gridY - y0)
    const a = hash(x0, y0)
    const b = hash(x0 + 1, y0)
    const c = hash(x0, y0 + 1)
    const d = hash(x0 + 1, y0 + 1)
    return (a + (b - a) * blendX) + ((c + (d - c) * blendX) - (a + (b - a) * blendX)) * blendY
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4
      const broad = noise(x, y, 42) - 0.5
      const medium = noise(x + 19, y - 11, 15) - 0.5
      const fine = noise(x - 7, y + 23, 5) - 0.5
      const value = Math.max(211, Math.min(230, 221 + broad * 9 + medium * 4 + fine * 1.5))
      image.data[index] = value
      image.data[index + 1] = value + 2
      image.data[index + 2] = value + 3
      image.data[index + 3] = 255
    }
  }
  context.putImageData(image, 0, 0)

  const texture = new CanvasTexture(canvas)
  texture.name = 'moon-gate-procedural-plaster'
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(0.12, 0.12)
  texture.minFilter = LinearMipmapLinearFilter
  return texture
}

export class MoonGateMaterials {
  readonly plasterTexture = createPlasterTexture()
  readonly plaster = new MeshStandardMaterial({
    color: MOON_GATE.colors.plaster,
    map: this.plasterTexture,
    roughness: MOON_GATE.materials.roughness,
    metalness: 0,
    transparent: true,
  })

  readonly stone = new MeshStandardMaterial({
    color: MOON_GATE.colors.stone,
    roughness: MOON_GATE.materials.stoneRoughness,
    metalness: 0,
    transparent: true,
  })

  readonly shoulder = new MeshStandardMaterial({
    color: MOON_GATE.colors.plaster,
    map: this.plasterTexture,
    roughness: MOON_GATE.materials.roughness,
    metalness: 0,
    transparent: true,
    depthWrite: false,
  })

  readonly interior = new MeshBasicMaterial({
    color: MOON_GATE.colors.interior,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  })

  setVisibility(visibility: number): void {
    // Let the stone circle establish the threshold first; the wider plaster mass
    // arrives more gently and reads through the existing landscape mist.
    this.plaster.opacity = visibility * visibility
    this.shoulder.opacity = visibility * visibility * 0.38
    this.stone.opacity = visibility
    this.interior.opacity = visibility * MOON_GATE.materials.interiorOpacity

    const writesDepth = visibility >= MOON_GATE.materials.depthWriteVisibility
    // Mid-distance ink needs to pass over the broad plaster surround; the local
    // stone reveal and tunnel still establish depth once the gate is recognized.
    this.plaster.depthWrite = false
    this.stone.depthWrite = writesDepth
  }

  dispose(): void {
    this.plasterTexture.dispose()
    this.plaster.dispose()
    this.shoulder.dispose()
    this.stone.dispose()
    this.interior.dispose()
  }
}
