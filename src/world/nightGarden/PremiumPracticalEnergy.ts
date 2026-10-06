/** Explicit art-directed source budgets. Color, world placement and ownership stay separate.
 * Values are Three light intensities / shader diffuse weights, not a whole-frame percentage. */
export const PREMIUM_ENERGY = {
  path: [
    {intensity:10.5,range:3.8},{intensity:9.6,range:3.7},{intensity:9.0,range:3.6},
    {intensity:10.0,range:3.8},{intensity:8.8,range:3.5},
  ],
  perimeter:{intensity:5.8,range:2.8},
  secondary:{perimeter:3.8,island:3.2,perimeterRange:2.4,islandRange:2.1},
  wall:{intensity:4.2,range:2.4},
  paper:{garden:1.24,wall:1.08,interior:.96,warm:.90,dim:.42,entry:1.0},
  house:{hall:64,upper:8.5,threshold:5.2,landing:12,landingRange:4.8},
  window:{warm:1.05,dim:.46,cap:1.2,glow:.46},
  interior:{pendant:7.2,display:2.4,andon:.72,upper:.90},
  groundBounce:.24,
} as const

export function secondaryLanternEnergy(index: number): number {
  return (index<11?PREMIUM_ENERGY.secondary.perimeter:PREMIUM_ENERGY.secondary.island)*(.92+(index%3)*.08)
}
