// Run against Vite. Playwright is supplied by the review environment, not the app bundle.
const { chromium } = require('playwright')
const fs = require('node:fs/promises')
const path = require('node:path')
const assert = require('node:assert/strict')
const reliefReview = process.env.GARDEN_PHYSICAL_REVIEW === '1' ? require('./review-physical-karesansui.cjs') : process.env.GARDEN_RELIEF_REVIEW === '1' ? require('./review-karesansui.cjs') : null

async function main() {
  const output = process.env.GARDEN_REVIEW_OUTPUT || 'logs/phase-3k64/verification'
  await fs.mkdir(output, { recursive: true })
  const browser = await chromium.launch({ headless: true, channel: 'chrome' })
  const report = { invariants: [], checkpoints: [], errors: [] }
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    if (reliefReview) await reliefReview.attach(page)
    page.on('pageerror', error => report.errors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error' || (message.type() === 'warning' && /shader|webgl/i.test(message.text()))) report.errors.push(message.text())
    })
    await page.addInitScript(() => {
      window.gardenContextLosses = 0
      document.addEventListener('webglcontextlost', () => window.gardenContextLosses++, true)
    })
    await page.goto(process.env.GARDEN_REVIEW_URL || 'http://127.0.0.1:5173/?debug=1')
    await page.waitForTimeout(1500)
    report.invariants = await page.evaluate(async () => {
      const { NightGardenCameraPath } = await import('/src/world/nightGarden/NightGardenCameraPath.ts')
      const { sampleDryGardenGroundWorldY } = await import('/src/world/nightGarden/GardenGroundHeight.ts')
      const { GardenPath } = await import('/src/world/nightGarden/GardenPath.ts')
      const { GardenVegetation } = await import('/src/world/nightGarden/GardenVegetation.ts')
      const { GardenBoundary } = await import('/src/world/nightGarden/GardenBoundary.ts')
      const { GardenGround } = await import('/src/world/nightGarden/GardenGround.ts')
      const { GardenRocks } = await import('/src/world/nightGarden/GardenRocks.ts')
      const { GardenLanterns } = await import('/src/world/nightGarden/GardenLanterns.ts')
      const { LANTERN_ANCHORS, LANTERN_LIGHT_INDICES, lanternBaseY } = await import('/src/world/nightGarden/GardenLanternNetwork.ts')
      const { PAVILION_OCCUPANCY_EMISSION } = await import('/src/world/nightGarden/GardenPavilionOccupancy.ts')
      const { GARDEN_WALL_RUNS, GARDEN_PERIMETER_BANKS } = await import('/src/world/nightGarden/GardenPerimeterComposition.ts')
      const { sampleDryGardenGround } = await import('/src/world/nightGarden/GardenGroundHeight.ts')
      const { GARDEN_ROUTE, gardenRouteDistance } = await import('/src/world/nightGarden/GardenApproach.ts')
      const { Group, MeshStandardMaterial } = await import('/node_modules/three/build/three.module.js')
      const results = []
      const check = (condition, message) => { if (!condition) throw new Error(message) }
      for (const [x, z] of GARDEN_ROUTE) check(gardenRouteDistance(x, z) < 1e-7, 'ground route field drifted')
      const previousWallHeights = [1.65, 1.48, 1.48, 1.50, 1.25, 1.38]
      for (const [i, run] of GARDEN_WALL_RUNS.entries()) {
        const ratio = run.height / previousWallHeights[i]
        check(ratio >= 1.20 && ratio <= 1.35, 'wall height outside approved increase')
      }
      for (const layout of ['desktop', 'tablet', 'portrait']) {
        for (const bank of GARDEN_PERIMETER_BANKS) {
          check(sampleDryGardenGround(bank.x, bank.z, layout).gravelDistance > 0, `${layout}: missing perimeter moss pocket`)
        }
        const curve = new NightGardenCameraPath(layout), pose = curve.createPose()
        for (const reduced of [false, true]) {
          let lastZ = Infinity, minClearance = Infinity, maxRouteDistance = 0, minWallClearance = Infinity
          for (let i = 0; i <= 1000; i++) {
            curve.sample(curve.getTravelProgress(i / 1000, reduced), pose, reduced)
            check(pose.position.z <= lastZ + 1e-7, `${layout}: camera reverses`)
            check(pose.position.distanceTo(pose.target) > 4, `${layout}: unstable look direction`)
            for (const run of GARDEN_WALL_RUNS) {
              const [ax, az] = run.from, [bx, bz] = run.to, dx = bx - ax, dz = bz - az
              const t = Math.max(0, Math.min(1, ((pose.position.x - ax) * dx + (pose.position.z - az) * dz) / (dx * dx + dz * dz)))
              minWallClearance = Math.min(minWallClearance, Math.hypot(pose.position.x - ax - t * dx, pose.position.z - az - t * dz) - 0.5)
            }
            lastZ = pose.position.z
            minClearance = Math.min(minClearance, pose.position.y - sampleDryGardenGroundWorldY(pose.position.x, pose.position.z, layout))
            if (pose.position.z <= GARDEN_ROUTE[0][1]) {
              let distance = Infinity
              for (let j = 1; j < GARDEN_ROUTE.length; j++) {
                const a = GARDEN_ROUTE[j - 1], b = GARDEN_ROUTE[j], dx = b[0] - a[0], dz = b[1] - a[1]
                const t = Math.max(0, Math.min(1, ((pose.position.x - a[0]) * dx + (pose.position.z - a[1]) * dz) / (dx * dx + dz * dz)))
                distance = Math.min(distance, Math.hypot(pose.position.x - a[0] - t * dx, pose.position.z - a[1] - t * dz))
              }
              maxRouteDistance = Math.max(maxRouteDistance, distance)
            }
          }
          check(minWallClearance > 3, `${layout}: perimeter intrudes into walk`)
          check(minClearance > 1.2, `${layout}: camera too close to ground`)
          check(maxRouteDistance < (reduced ? 1.1 : 0.3), `${layout}: camera leaves route (${maxRouteDistance})`)
          results.push({ layout, reduced, samples: 1001, minClearance, maxRouteDistance, minWallClearance })
        }
        const root = new Group(), material = new MeshStandardMaterial(), stones = new GardenPath(root, material)
        stones.setLayout(layout)
        const vegetation = new GardenVegetation(root), rocks = new GardenRocks(root, material)
        vegetation.setLayout(layout); rocks.setLayout(layout, 19)
        const boundary = new GardenBoundary(root), ground = new GardenGround(root, material)
        boundary.setLayout(layout); ground.setLayout(layout)
        let instances = 0, checkedMeshes = 0
        root.traverse(object => {
          if (!object.isMesh) return
          checkedMeshes++
          for (const attribute of Object.values(object.geometry.attributes)) {
            check(Array.from(attribute.array).every(Number.isFinite), `${layout}: non-finite ${object.name} geometry`)
          }
          if (object.isInstancedMesh) {
            check(object.count > 0 && object.count <= object.instanceMatrix.count, `${layout}: invalid instance count`)
            check(Array.from(object.instanceMatrix.array).every(Number.isFinite), `${layout}: non-finite instance matrix`)
            instances += object.count
          }
        })
        // Four pines (wood + foliage), 24 shrubs, 19 rocks, 366 perimeter parts.
        check(instances === 417 && checkedMeshes === 15, `${layout}: missing garden objects`)
        check(root.getObjectByName('garden-boundary-recessed-panels').count === 20, `${layout}: missing wall panels`)
        check(root.getObjectByName('garden-boundary-gabled-coping').count === 20, `${layout}: missing wall coping`)
        const contact = root.getObjectByName('garden-stone-contact-fringe').geometry
        const contactPositions = contact.getAttribute('position')
        for (let i = 0; i < contactPositions.count; i++) {
          const clearance = contactPositions.getY(i) - sampleDryGardenGroundWorldY(contactPositions.getX(i), contactPositions.getZ(i), layout)
          check(clearance > 0.009 && clearance < 0.015, `${layout}: contact fringe detached from terrain`)
        }
        const lanternRoot = new Group(), lanterns = new GardenLanterns(lanternRoot, layout)
        lanterns.setIntensity(1)
        let lightCount = 0, maxIntensity = 0
        lanternRoot.traverse(object => {
          if (!object.isPointLight) return
          lightCount++; maxIntensity = Math.max(maxIntensity, object.intensity)
          check(!object.castShadow && object.distance <= 3.5, `${layout}: unbounded lantern cost`)
        })
        check(lightCount === 7 && maxIntensity <= 0.7, `${layout}: lantern light budget changed`)
        const pools = lanternRoot.getObjectByName('garden-lantern-ground-pools').geometry.getAttribute('position')
        for (let i = 0; i < pools.count; i++) {
          const clearance = pools.getY(i) - sampleDryGardenGroundWorldY(pools.getX(i), pools.getZ(i), layout)
          check(clearance > 0.025 && clearance < 0.031, `${layout}: lantern pool detached from terrain`)
        }
        const chambers = lanternRoot.getObjectByName('garden-lantern-paper-chambers')
        check(chambers.count === 15 && LANTERN_ANCHORS.length === 15, 'lantern network count drift')
        check(LANTERN_LIGHT_INDICES.length === 7, 'point-light budget drift')
        lanternRoot.traverse(object => {
          if (object.isInstancedMesh) for (const v of object.instanceMatrix.array) check(Number.isFinite(v), 'non-finite lantern transform')
        })
        for (let i = 5; i < LANTERN_ANCHORS.length; i++) {
          const [x, z, size] = LANTERN_ANCHORS[i]
          for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
            const clearance = lanternBaseY(i, layout) - sampleDryGardenGroundWorldY(x + dx * 0.41 * size, z + dz * 0.39 * size, layout)
            check(clearance < 0 && clearance > -0.08, 'new lantern floating or excessively buried')
          }
          check(gardenRouteDistance(x, z) > 1.6, 'new lantern obstructs walk')
          for (const wall of GARDEN_WALL_RUNS) {
            const [ax, az] = wall.from, [bx, bz] = wall.to, dx = bx - ax, dz = bz - az
            const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)))
            check(Math.hypot(x - ax - t * dx, z - az - t * dz) > 0.52 * size + 0.16, 'new lantern intersects wall')
          }
        }
        check(PAVILION_OCCUPANCY_EMISSION.wallEntry.intensity > PAVILION_OCCUPANCY_EMISSION.wallWarm.intensity &&
          PAVILION_OCCUPANCY_EMISSION.wallWarm.intensity > PAVILION_OCCUPANCY_EMISSION.wallDim.intensity, 'interior warmth hierarchy inverted')
        results.push({ layout, lanterns: chambers.count, additionalPointLights: 2, finiteLanternMatrices: true, newPlinthsSeated: 10, warmthHierarchy: true })
        lanterns.setIntensity(0)
        lanternRoot.traverse(object => { if (object.isPointLight) check(object.intensity === 0, 'lantern failed to extinguish') })
        results.push({ layout, lanternLights: lightCount, maxLanternIntensity: maxIntensity, poolVerticesSeated: pools.count, contactVerticesSeated: contactPositions.count })
        lanterns.dispose()
        results.push({ layout, finiteGeometry: true, checkedMeshes, instances })
        const mesh = root.children[0].children[0], geometry = mesh.geometry
        check(geometry.drawRange.count === geometry.index.count, `${layout}: route is truncated`)
        const vertices = geometry.getAttribute('position'), normals = geometry.getAttribute('normal')
        const tones = geometry.getAttribute('pathSurfaceTone')
        let maxBottomExposure = -Infinity
        for (let i = 0; i < vertices.count; i++) {
          if (tones.getX(i) > 0.6) continue
          maxBottomExposure = Math.max(maxBottomExposure, vertices.getY(i) - sampleDryGardenGroundWorldY(vertices.getX(i), vertices.getZ(i), layout))
        }
        check(maxBottomExposure < 0, `${layout}: exposed slab underside`)
        let minTopExposure = Infinity, maxTopExposure = -Infinity
        for (let i = 0; i < vertices.count; i++) {
          // Inspect upward-facing walking surfaces independently of mesh topology.
          if (normals.getY(i) < 0.93) continue
          const exposure = vertices.getY(i) - sampleDryGardenGroundWorldY(vertices.getX(i), vertices.getZ(i), layout)
          minTopExposure = Math.min(minTopExposure, exposure)
          maxTopExposure = Math.max(maxTopExposure, exposure)
        }
        check(minTopExposure > 0.05 && maxTopExposure < 0.27, `${layout}: stones float or sink`)
        // The mansion's original support datum must remain exact after widening the court.
        const x = 3.2, z = -53.4, localZ = -z - 36
        const grass = Math.max(0, Math.min(1, 0.48 + Math.sin(x * 0.19 - z * 0.13) * 0.26 + Math.cos(z * 0.07 + x * 0.22) * 0.18))
        const originalY = -4.58 + Math.sin(x * 0.45 + localZ * 0.18) * 0.1 + Math.cos(localZ * 0.56 - x * 0.14) * 0.06 + 0.1 * (0.55 + grass * 0.45)
        check(Math.abs(sampleDryGardenGroundWorldY(x, z, layout) - originalY) < 1e-7, `${layout}: mansion support moved`)
        results.push({ layout, stones: GARDEN_ROUTE.length, minTopExposure, maxTopExposure, maxBottomExposure, mansionDatumPreserved: true })
        stones.dispose(); vegetation.dispose(); rocks.dispose(); boundary.dispose(); ground.dispose(); material.dispose()
      }
      return results
    })
    await page.addStyleTag({ content: '.debug-panel{visibility:hidden}' })
    for (const [layout, width, height] of [['desktop', 1440, 900], ['tablet', 820, 1180], ['portrait', 390, 844]]) {
      await page.setViewportSize({ width, height })
      for (const reduced of [false, true]) {
        await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' })
        for (const progress of (reduced ? [0.4, 1] : [0.2, 0.4, 0.6, 0.8, 1])) {
          await page.evaluate(p => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * (0.68 + 0.32 * p)), progress)
          await page.waitForFunction(p => {
            const term = [...document.querySelectorAll('.debug-panel dt')].find(dt => dt.textContent === 'Phase 3 local')
            return term && Math.abs(Number(term.nextElementSibling.textContent) - p) < 0.002
          }, progress, { timeout: 15000 })
          const diagnostics = await page.locator('.debug-panel').evaluate(element => Object.fromEntries([...element.querySelectorAll('dt')].map(dt => [dt.textContent, dt.nextElementSibling.textContent])))
          const gpu = await page.evaluate(() => ({
            contextLosses: window.gardenContextLosses,
            error: document.querySelector('canvas').getContext('webgl2').getError(),
          }))
          assert.deepEqual(gpu, { contextLosses: 0, error: 0 })
          assert.equal(diagnostics['Garden layout'], layout)
          assert.equal(diagnostics['Reduced motion'], reduced ? 'Yes' : 'No')
          assert.ok(Math.abs(Number(diagnostics['Phase 3 local']) - progress) < 0.002)
          await page.screenshot({ path: path.join(output, `${layout}-${reduced ? 'reduced-' : ''}${progress * 100}.png`) })
          report.checkpoints.push({ layout, reduced, progress, diagnostics, gpu })
          if (reliefReview?.checkpoint) await reliefReview.checkpoint(page, output, layout, reduced, progress, report)
        }
      }
    }
    if (reliefReview) await reliefReview.capture(page, output, report)
    assert.deepEqual(report.errors, [])
    console.log(JSON.stringify(report, null, 2))
  } catch (error) {
    report.errors.push(error.stack || error.message)
    throw error
  } finally {
    await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2))
    await browser.close()
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
