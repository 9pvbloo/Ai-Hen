import { BoxGeometry, CylinderGeometry, LatheGeometry, SphereGeometry, Vector2 } from 'three'
import type { BufferGeometry } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export type LanternFamily = 'path' | 'secondary'
export type LanternFinish = 'stone' | 'frame' | 'paper'
export const LANTERN_FAMILY = {
  path: { scale: 1.70, sourceY: .94, footprint: .49 },
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
    parts.stone.push(new CylinderGeometry(.14, .185, .40, 8).rotateY(Math.PI/8).translate(0,.45,0))
    parts.stone.push(new CylinderGeometry(.285,.15,.085,8).rotateY(Math.PI/8).translate(0,.655,0))
    box('stone', .57, .10, .53, 0, .69, 0)
    // Recessed luminous chamber leaves a thick stone reveal on all four sides.
    box('paper', .33, .34, .30, 0, .94, 0)
    for (const x of [-.225, .225]) for (const z of [-.205, .205]) box('stone', .105, .43, .105, x, .94, z)
    box('stone', .55, .065, .51, 0, 1.14, 0)
    // Broad low stone cap, restrained upturned outer edge and a small jewel finial.
    parts.stone.push(new LatheGeometry([[0,1.17],[.44,1.17],[.49,1.215],[.48,1.25],[.38,1.23],[.26,1.29],[.13,1.38],[.075,1.395],[0,1.395]].map(p=>new Vector2(...p as [number,number])),4).rotateY(Math.PI/4))
    parts.stone.push(new SphereGeometry(.07,8,6).scale(1,1.25,1).translate(0,1.45,0))
    for (const z of [-.158, .158]) {
      for(const x of [-.10,0,.10])box('frame', .012, .34, .016, x, .94, z)
      for(const y of [.83,.94,1.05])box('frame', .33, .012, .016, 0, y, z)
    }
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
