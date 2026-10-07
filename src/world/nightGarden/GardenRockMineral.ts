/** Original seamless mineral field; frequencies are cycles per 256px tile. */
const clamp = (v: number): number => Math.max(0, Math.min(1, v))
const fade = (v: number): number => v * v * v * (v * (v * 6 - 15) + 10)
function noise(x: number, y: number, period: number): number {
  const px = x * period, py = y * period
  const ix = Math.floor(px), iy = Math.floor(py)
  const hash = (a: number, b: number): number => {
    a = ((a % period) + period) % period
    b = ((b % period) + period) % period
    const v = Math.sin(a * 127.1 + b * 311.7 + 17.3) * 43758.5453
    return v - Math.floor(v)
  }
  const u = fade(px - ix), v = fade(py - iy)
  const a = hash(ix, iy), b = hash(ix + 1, iy)
  const c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1)
  return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v
}

export function rockMineralSample(x: number, y: number) {
  const macro = noise(x, y, 3)
  // Periodic domain distortion breaks straight veins without texture borders.
  const u = x + (noise(x + .31, y, 4) - .5) * .075
  const v = y + (noise(x, y - .17, 4) - .5) * .075
  const mineral = noise(u, v, 7)
  const erosion = noise(u + .23, v - .41, 17)
  const seam = Math.pow(clamp(1 - Math.abs(erosion - .48) / .075), 3)
    * clamp((mineral - .35) * 2)
  const grain = noise(x + .19, y - .27, 61)
  const pore = Math.pow(clamp((.34 - grain) / .34), 2)
  const height = .5 + (mineral - .5) * .095 + (erosion - .5) * .055
    - seam * .028 + (grain - .5) * .038 - pore * .034
  const tone = (macro - .5) * 17 + (mineral - .5) * 19
    + (grain - .5) * 13 - seam * 8 - pore * 10
  const warm = (noise(x - .13, y + .21, 5) - .5) * 8
  return {
    height,
    color: [145 + tone + warm, 153 + tone, 158 + tone - warm * .6] as const,
    roughness: Math.max(.82, Math.min(.97, .845 + erosion * .075 + pore * .045 + seam * .018)),
  }
}
