import { carvedToroBlock } from './PathToroStone'
import { BoxGeometry, CylinderGeometry, LatheGeometry, SphereGeometry, Vector2 } from 'three'
import type { BufferGeometry } from 'three'
import type { LanternFinish } from './GardenLanternGeometry'

/** Path-only stone toro. Coordinates retain the approved source datum and instance scale. */
export function createPathToroParts(): Record<LanternFinish, BufferGeometry[]> {
  const parts: Record<LanternFinish, BufferGeometry[]> = { stone: [], frame: [], paper: [] }
  const box = (finish: LanternFinish, w: number, h: number, d: number, x: number, y: number, z: number): void => {
    parts[finish].push(new BoxGeometry(w,h,d).translate(x,y,z))
  }
    // Broad ground contact, lighter upper pedestal, and a narrow carved reveal.
    parts.stone.push(carvedToroBlock(.68,.075,.64,.0375,.008))
    parts.stone.push(carvedToroBlock(.57,.055,.53,.1025,.006))
    parts.stone.push(carvedToroBlock(.43,.10,.41,.18,.009))
    parts.stone.push(carvedToroBlock(.45,.025,.43,.2425,.004))
    // Main shaft radii .112/.148 replace .14/.185: twenty percent slimmer.
    parts.stone.push(new CylinderGeometry(.112,.148,.38,8).rotateY(Math.PI/8).translate(0,.445,0))
    parts.stone.push(new LatheGeometry([[.148,.255],[.154,.263],[.154,.282],[.145,.29]].map(p=>new Vector2(...p as [number,number])),8).rotateY(Math.PI/8))
    parts.stone.push(new LatheGeometry([[.116,.612],[.13,.628],[.20,.659],[.238,.667],[.238,.680]].map(p=>new Vector2(...p as [number,number])),8).rotateY(Math.PI/8))
    parts.stone.push(carvedToroBlock(.52,.055,.48,.7075,.006))
    // Four thin inset panels enclose a real cavity around the unchanged y=.94 source.
    for(const z of [-.12,.12])box('paper',.272,.36,.008,0,.94,z)
    for(const x of [-.132,.132])box('paper',.008,.36,.232,x,.94,0)
    parts.stone.push(carvedToroBlock(.43,.025,.39,.7475,.003))
    for(const x of [-.215,.215])for(const z of [-.20,.20])
      parts.stone.push(carvedToroBlock(.072,.42,.072,.945,.004).translate(x,0,z))
    parts.stone.push(carvedToroBlock(.52,.044,.48,1.145,.005))
    // Broad low stone cap, restrained upturned outer edge and a small jewel finial.
    parts.stone.push(new LatheGeometry([[0,1.17],[.44,1.17],[.49,1.215],[.48,1.25],[.38,1.23],[.26,1.29],[.13,1.38],[.075,1.395],[0,1.395]].map(p=>new Vector2(...p as [number,number])),4).rotateY(Math.PI/4))
    parts.stone.push(new SphereGeometry(.07,8,6).scale(1,1.25,1).translate(0,1.45,0))
    for (const z of [-.158, .158]) {
      for(const x of [-.10,0,.10])box('frame', .012, .34, .016, x, .94, z)
      for(const y of [.83,.94,1.05])box('frame', .33, .012, .016, 0, y, z)
    }
  return parts
}
