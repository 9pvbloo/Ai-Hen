import { DataTexture, LinearMipmapLinearFilter, LinearFilter, RepeatWrapping, RGBAFormat } from 'three'
import type { MeshStandardMaterial } from 'three'

type Finish = 'wood' | 'plaster' | 'paper' | 'stone'
type Maps = { color: DataTexture; detail: DataTexture; owners: number }
const shared = new Map<Finish, Maps>()

/** Small deterministic linear multipliers. R=height, G=roughness; no external assets. */
function createMaps(finish: Finish): Maps {
  const size = 128, color = new Uint8Array(size * size * 4), detail = new Uint8Array(color.length)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size * Math.PI * 2, v = y / size * Math.PI * 2
    const hash = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
    const noise = hash - Math.floor(hash)
    const broad = .5 + .25 * Math.sin(u * 3 + Math.sin(v * 2)) + .25 * Math.cos(v * 3 - u)
    const grain = finish === 'wood' ? .5 + .5 * Math.sin(u * 19 + Math.sin(v * 2) * .8 + Math.sin(u * 3))
      : finish === 'paper' ? .5 + .25 * Math.sin(u * 35 + Math.sin(v)) + .25 * noise
        : .7 * broad + .3 * noise
    const i = (y * size + x) * 4
    const value = Math.round(255 * (.91 + grain * .07 + broad * .02))
    color.set([value, value, value, 255], i)
    detail.set([Math.round(255 * (.45 + grain * .10)), Math.round(255 * (.92 + broad * .08)), 255, 255], i)
  }
  const texture = (data: Uint8Array): DataTexture => {
    const result = new DataTexture(data, size, size, RGBAFormat)
    result.wrapS = result.wrapT = RepeatWrapping
    result.magFilter = LinearFilter; result.minFilter = LinearMipmapLinearFilter
    result.generateMipmaps = true; result.needsUpdate = true
    result.name = `architectural-${finish}-128`
    return result
  }
  return { color: texture(color), detail: texture(detail), owners: 0 }
}

/** Reference-counted ownership across exterior, interior and garden paper. */
export class ArchitecturalMicrodetail {
  private readonly finishes = new Set<Finish>()

  apply(material: MeshStandardMaterial, finish: Finish, relief = .015): void {
    let maps = shared.get(finish)
    if (!maps) { maps = createMaps(finish); shared.set(finish, maps) }
    if (!this.finishes.has(finish)) { maps.owners++; this.finishes.add(finish) }
    material.map = maps.color
    material.roughnessMap = material.bumpMap = maps.detail
    material.bumpScale = relief
    if (finish === 'paper') material.emissiveMap = maps.color
  }

  dispose(): void {
    for (const finish of this.finishes) {
      const maps = shared.get(finish)!
      if (--maps.owners === 0) { maps.color.dispose(); maps.detail.dispose(); shared.delete(finish) }
    }
    this.finishes.clear()
  }
}
