import { CircleGeometry, ExtrudeGeometry, Group, Mesh, Shape } from 'three'
import type { BufferGeometry, Material } from 'three'
import { MOON_GATE } from './MoonGateConfig'
import type { MoonGateMaterials } from './MoonGateMaterials'

export interface MoonGateArchitecture {
  readonly group: Group
  readonly geometries: readonly BufferGeometry[]
}

const OPENING_LEFT_ANGLE = Math.PI * 245 / 180
const OPENING_RIGHT_ANGLE = -Math.PI * 65 / 180

function softLineTo(shape: Shape, fromX: number, fromY: number, controlX: number, controlY: number,
  toX: number, toY: number): void {
  // Keep the perimeter light while retaining a softened, non-diagonal read.
  for (let step = 1; step <= 3; step++) {
    const t = step / 3
    const inverse = 1 - t
    shape.lineTo(
      inverse * inverse * fromX + 2 * inverse * t * controlX + t * t * toX,
      inverse * inverse * fromY + 2 * inverse * t * controlY + t * t * toY,
    )
  }
}

function appendOuterWallPath(shape: Shape): void {
  const geometry = MOON_GATE.geometry
  const steps = 32
  for (let step = 1; step <= steps; step++) {
    const t = step / steps
    const angle = OPENING_LEFT_ANGLE + (OPENING_RIGHT_ANGLE - OPENING_LEFT_ANGLE) * t
    const sideWeight = Math.pow(Math.abs(Math.cos(angle)), 4)
    const radius = geometry.wallOuterRadius + geometry.wallSideBulge * sideWeight
    shape.lineTo(Math.cos(angle) * radius, geometry.openingY + Math.sin(angle) * radius)
  }
}

function createWallShape(): Shape {
  const geometry = MOON_GATE.geometry
  const halfWidth = geometry.wallWidth / 2
  const outerLeftX = Math.cos(OPENING_LEFT_ANGLE) * geometry.wallOuterRadius
  const outerLeftY = geometry.openingY + Math.sin(OPENING_LEFT_ANGLE) * geometry.wallOuterRadius
  const outerRightX = Math.cos(OPENING_RIGHT_ANGLE) * geometry.wallOuterRadius
  const outerRightY = geometry.openingY + Math.sin(OPENING_RIGHT_ANGLE) * geometry.wallOuterRadius
  const innerLeftX = Math.cos(OPENING_LEFT_ANGLE) * geometry.openingRadius
  const innerLeftY = geometry.openingY + Math.sin(OPENING_LEFT_ANGLE) * geometry.openingRadius
  const innerRightX = Math.cos(OPENING_RIGHT_ANGLE) * geometry.openingRadius
  const innerRightY = geometry.openingY + Math.sin(OPENING_RIGHT_ANGLE) * geometry.openingRadius
  const shape = new Shape()
  shape.moveTo(-halfWidth, geometry.wallBottom)
  shape.lineTo(-halfWidth, geometry.passageBaseY)
  softLineTo(shape, -halfWidth, geometry.passageBaseY, -halfWidth * 0.62,
    geometry.passageBaseY + 0.5, outerLeftX, outerLeftY)
  appendOuterWallPath(shape)
  softLineTo(shape, outerRightX, outerRightY, halfWidth * 0.62,
    geometry.passageBaseY + 0.5, halfWidth, geometry.passageBaseY)
  shape.lineTo(halfWidth, geometry.wallBottom)
  shape.lineTo(geometry.passageBaseHalfWidth, geometry.wallBottom)
  shape.lineTo(geometry.passageBaseHalfWidth, geometry.passageBaseY)
  softLineTo(shape, geometry.passageBaseHalfWidth, geometry.passageBaseY,
    geometry.passageBaseHalfWidth * 0.56, geometry.passageBaseY + 1.8, innerRightX, innerRightY)
  shape.absarc(0, geometry.openingY, geometry.openingRadius,
    OPENING_RIGHT_ANGLE, OPENING_LEFT_ANGLE, false)
  softLineTo(shape, innerLeftX, innerLeftY, -geometry.passageBaseHalfWidth * 0.56,
    geometry.passageBaseY + 1.8, -geometry.passageBaseHalfWidth, geometry.passageBaseY)
  shape.lineTo(-geometry.passageBaseHalfWidth, geometry.wallBottom)
  shape.closePath()
  return shape
}

function createShoulderShape(side: -1 | 1): Shape {
  const shape = new Shape()
  const x = (value: number): number => value * side
  shape.moveTo(x(4.1), -4.7)
  shape.lineTo(x(5.55), -3.75)
  shape.quadraticCurveTo(x(6.2), -1.3, x(5.65), 0.9)
  shape.quadraticCurveTo(x(5.2), 1.9, x(4.4), 2.25)
  shape.quadraticCurveTo(x(4.2), -0.5, x(4.35), -2.6)
  shape.lineTo(x(4.1), -4.7)
  return shape
}

function createRevealShape(): Shape {
  const geometry = MOON_GATE.geometry
  const outerRadius = geometry.openingRadius + geometry.revealWidth
  const outerLeftX = Math.cos(OPENING_LEFT_ANGLE) * outerRadius
  const outerLeftY = geometry.openingY + Math.sin(OPENING_LEFT_ANGLE) * outerRadius
  const innerRightX = Math.cos(OPENING_RIGHT_ANGLE) * geometry.openingRadius
  const innerRightY = geometry.openingY + Math.sin(OPENING_RIGHT_ANGLE) * geometry.openingRadius
  const outerBaseX = geometry.revealBaseHalfWidth + geometry.revealWidth
  const innerBaseX = geometry.revealBaseHalfWidth - geometry.revealWidth
  const shape = new Shape()
  shape.moveTo(-outerBaseX, geometry.revealBaseY)
  softLineTo(shape, -outerBaseX, geometry.revealBaseY, -outerBaseX * 0.82,
    geometry.revealBaseY + 0.12, outerLeftX, outerLeftY)
  shape.absarc(0, geometry.openingY, outerRadius,
    OPENING_LEFT_ANGLE, OPENING_RIGHT_ANGLE, true)
  softLineTo(shape, Math.cos(OPENING_RIGHT_ANGLE) * outerRadius,
    geometry.openingY + Math.sin(OPENING_RIGHT_ANGLE) * outerRadius,
    outerBaseX * 0.82, geometry.revealBaseY + 0.12, outerBaseX, geometry.revealBaseY)
  shape.lineTo(innerBaseX, geometry.revealBaseY)
  softLineTo(shape, innerBaseX, geometry.revealBaseY, innerBaseX * 0.82,
    geometry.revealBaseY + 0.12, innerRightX, innerRightY)
  shape.absarc(0, geometry.openingY, geometry.openingRadius,
    OPENING_RIGHT_ANGLE, OPENING_LEFT_ANGLE, false)
  softLineTo(shape, Math.cos(OPENING_LEFT_ANGLE) * geometry.openingRadius,
    geometry.openingY + Math.sin(OPENING_LEFT_ANGLE) * geometry.openingRadius,
    -innerBaseX * 0.82, geometry.revealBaseY + 0.12, -innerBaseX, geometry.revealBaseY)
  shape.closePath()
  return shape
}

function makeMesh(geometry: BufferGeometry, material: Material | Material[], name: string,
  renderOrder: number): Mesh {
  const mesh = new Mesh(geometry, material)
  mesh.name = name
  mesh.renderOrder = renderOrder
  return mesh
}

export function createMoonGateArchitecture(materials: MoonGateMaterials): MoonGateArchitecture {
  const config = MOON_GATE.geometry
  const group = new Group()
  group.name = 'moon-gate-architecture'

  const wall = new ExtrudeGeometry(createWallShape(), {
    depth: config.wallDepth,
    bevelEnabled: false,
    curveSegments: config.radialSegments,
  })
  const shoulders = new ExtrudeGeometry([createShoulderShape(-1), createShoulderShape(1)], {
    depth: config.wallDepth,
    bevelEnabled: false,
    curveSegments: 8,
  })
  const reveal = new ExtrudeGeometry(createRevealShape(), {
    depth: config.wallDepth + config.revealDepth * 2,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.06,
    bevelThickness: 0.06,
    curveSegments: config.radialSegments,
  })
  reveal.translate(0, 0, -config.revealDepth)

  const interior = new CircleGeometry(config.openingRadius * 0.985, config.radialSegments)
  interior.translate(0, config.openingY, -0.08)

  group.add(
    makeMesh(interior, materials.interior, 'moon-gate-interior-haze', 3.2),
    makeMesh(wall, materials.plaster, 'moon-gate-wall', 2.5),
    makeMesh(shoulders, materials.shoulder, 'moon-gate-wall-shoulders', 3.1),
    makeMesh(reveal, materials.stone, 'moon-gate-stone-reveal', 3.6),
  )

  return { group, geometries: [wall, shoulders, reveal, interior] }
}
