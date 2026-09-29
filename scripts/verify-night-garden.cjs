// Run against Vite. Playwright is supplied by the review environment, not the app bundle.
const { chromium } = require('playwright')
const fs = require('node:fs/promises')
const path = require('node:path')
const assert = require('node:assert/strict')

async function main() {
  const output = process.env.GARDEN_REVIEW_OUTPUT || 'logs/phase-3k6/verification'
  await fs.mkdir(output, { recursive: true })
  const browser = await chromium.launch({ headless: true, channel: 'chrome' })
  const report = { invariants: [], checkpoints: [], errors: [] }
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    page.on('pageerror', error => report.errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()) })
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
      const { GARDEN_ROUTE } = await import('/src/world/nightGarden/GardenApproach.ts')
      const { Group, MeshStandardMaterial } = await import('/node_modules/three/build/three.module.js')
      const results = []
      const check = (condition, message) => { if (!condition) throw new Error(message) }
      for (const layout of ['desktop', 'tablet', 'portrait']) {
        const curve = new NightGardenCameraPath(layout), pose = curve.createPose()
        for (const reduced of [false, true]) {
          let lastZ = Infinity, minClearance = Infinity, maxRouteDistance = 0
          for (let i = 0; i <= 1000; i++) {
            curve.sample(curve.getTravelProgress(i / 1000, reduced), pose, reduced)
            check(pose.position.z <= lastZ + 1e-7, `${layout}: camera reverses`)
            check(pose.position.distanceTo(pose.target) > 4, `${layout}: unstable look direction`)
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
          check(minClearance > 1.2, `${layout}: camera too close to ground`)
          check(maxRouteDistance < (reduced ? 1.1 : 0.3), `${layout}: camera leaves route (${maxRouteDistance})`)
          results.push({ layout, reduced, samples: 1001, minClearance, maxRouteDistance })
        }
        const root = new Group(), material = new MeshStandardMaterial(), stones = new GardenPath(root, material)
        stones.setLayout(layout)
        const vegetation = new GardenVegetation(root), rocks = new GardenRocks(root, material)
        vegetation.setLayout(layout); rocks.setLayout(layout, 11)
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
        // Four pines (wood + foliage), twelve shrubs, eleven rocks, 206 boundary parts.
        check(instances === 237 && checkedMeshes === 12, `${layout}: missing garden objects`)
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
          assert.equal(diagnostics['Garden layout'], layout)
          assert.equal(diagnostics['Reduced motion'], reduced ? 'Yes' : 'No')
          assert.ok(Math.abs(Number(diagnostics['Phase 3 local']) - progress) < 0.002)
          await page.screenshot({ path: path.join(output, `${layout}-${reduced ? 'reduced-' : ''}${progress * 100}.png`) })
          report.checkpoints.push({ layout, reduced, progress, diagnostics })
        }
      }
    }
    assert.deepEqual(report.errors, [])
    await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2))
    console.log(JSON.stringify(report, null, 2))
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
