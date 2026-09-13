import './styles/main.css'
import { Experience } from './core/Experience'

const canvas = document.querySelector<HTMLCanvasElement>('#experience')!
const status = document.querySelector<HTMLElement>('#runtime-status')!

try {
  const experience = new Experience(canvas)
  status.textContent = 'Diagnostic cube active. Scroll to test the runtime.'
  import.meta.hot?.dispose(() => experience.dispose())
} catch (error) {
  status.textContent = 'The 3D runtime could not start. Please use a browser with WebGL 2 enabled.'
  console.error('Phase 0 runtime initialization failed.', error)
}
