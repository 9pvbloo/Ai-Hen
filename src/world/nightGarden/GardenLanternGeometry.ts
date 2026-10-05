import { BoxGeometry, CylinderGeometry, LatheGeometry, SphereGeometry, Vector2 } from 'three'
import type { BufferGeometry } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export type LanternFamily = 'path' | 'secondary'
export type LanternFinish = 'stone' | 'frame' | 'paper'
export const LANTERN_FAMILY = {
  path: { scale: 1.45, sourceY: .91, footprint: .41 },
  secondary: { scale: 1, sourceY: .40, footprint: .34 },
} as const

/** Authored prototypes, merged by finish once; no individual fixture draw calls. */
export function createGardenLanternGeometry(family: LanternFamily): Record<LanternFinish, BufferGeometry> {
  const parts: Record<LanternFinish, BufferGeometry[]> = { stone: [], frame: [], paper: [] }
  const box = (finish: LanternFinish, w: number, h: number, d: number, x: number, y: number, z: number): void => {
    parts[finish].push(new BoxGeometry(w, h, d).translate(x, y, z))
  }
  if (family === 'path') {
    parts.stone.push(new CylinderGeometry(.38, .41, .12, 8).rotateY(Math.PI / 8).translate(0, .06, 0))
    box('stone', .49, .13, .47, 0, .185, 0)
    box('stone', .23, .40, .23, 0, .45, 0)
    box('stone', .57, .10, .53, 0, .69, 0)
    box('paper', .39, .35, .35, 0, .915, 0)
    for (const x of [-.235, .235]) for (const z of [-.215, .215]) box('stone', .065, .43, .065, x, .94, z)
    box('stone', .55, .065, .51, 0, 1.14, 0)
    // Broad low stone cap, restrained upturned outer edge and a small jewel finial.
    parts.stone.push(new LatheGeometry([[0,1.17],[.47,1.17],[.49,1.205],[.37,1.22],[.21,1.31],[.09,1.33],[0,1.33]].map(p=>new Vector2(...p as [number,number])),4).rotateY(Math.PI/4))
    parts.stone.push(new SphereGeometry(.065,8,6).scale(1,.8,1).translate(0,1.38,0))
    for (const z of [-.182, .182]) box('frame', .37, .018, .018, 0, .915, z)
  } else {
    box('stone', .68, .10, .62, 0, .05, 0)
    box('frame', .49, .055, .43, 0, .128, 0)
    box('paper', .38, .45, .32, 0, .40, 0)
    for (const x of [-.22,.22]) for (const z of [-.19,.19]) box('frame', .036, .51, .036, x, .405, z)
    box('frame', .53, .05, .47, 0, .68, 0)
    box('frame', .46, .028, .40, 0, .719, 0)
    for (const z of [-.173,.173]) box('frame', .40, .013, .018, 0, .41, z)
  }
  const merged = {} as Record<LanternFinish, BufferGeometry>
  for (const finish of ['stone','frame','paper'] as const) {
    merged[finish] = mergeGeometries(parts[finish])!
    for (const geometry of parts[finish]) geometry.dispose()
  }
  return merged
}
