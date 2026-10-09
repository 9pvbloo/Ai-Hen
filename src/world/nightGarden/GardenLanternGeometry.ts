import { createPathToroParts } from './PathToroGeometry'
import { BoxGeometry, CylinderGeometry, LatheGeometry, SphereGeometry, Vector2 } from 'three'
import type { BufferGeometry } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export type LanternFamily = 'path' | 'secondary'
export type LanternFinish = 'stone' | 'frame' | 'paper'
export const LANTERN_FAMILY = {
  path: { scale: 1.70, sourceY: .94, footprint: .4165 },
  secondary: { scale: 1, sourceY: .40, footprint: .46 },
} as const

/** Authored prototypes, merged by finish once; no individual fixture draw calls. */
export function createGardenLanternGeometry(family: LanternFamily): Record<LanternFinish, BufferGeometry> {
  const parts: Record<LanternFinish, BufferGeometry[]> = family === 'path' ? createPathToroParts() : { stone: [], frame: [], paper: [] }
  const box = (finish: LanternFinish, w: number, h: number, d: number, x: number, y: number, z: number): void => {
    parts[finish].push(new BoxGeometry(w, h, d).translate(x, y, z))
  }
  if (family === 'secondary') {
    parts.stone.push(new CylinderGeometry(.33,.36,.12,8).rotateY(Math.PI/8).translate(0,.06,0))
    box('stone', .56, .075, .52, 0, .1575, 0)
    box('paper', .32, .34, .29, 0, .40, 0)
    for (const x of [-.215,.215]) for (const z of [-.195,.195]) box('stone', .105, .40, .105, x, .395, z)
    box('stone', .55, .065, .51, 0, .615, 0)
    parts.stone.push(new LatheGeometry([[0,.645],[.40,.645],[.46,.68],[.45,.715],[.34,.70],[.19,.78],[.065,.82],[0,.82]].map(p=>new Vector2(...p as [number,number])),4).rotateY(Math.PI/4))
    parts.stone.push(new SphereGeometry(.055,8,6).translate(0,.855,0))
    for (const z of [-.153,.153]) {
      box('frame', .012, .34, .014, 0, .40, z)
      box('frame', .32, .012, .014, 0, .40, z)
    }
  }
  const merged = {} as Record<LanternFinish, BufferGeometry>
  for (const finish of ['stone','frame','paper'] as const) {
    merged[finish] = mergeGeometries(parts[finish])!
    // Taller silhouette without widening into the approved narrow middle bend.
    if(family === 'path')merged[finish].scale(.85,1,.85)
    for (const geometry of parts[finish]) geometry.dispose()
  }
  return merged
}
