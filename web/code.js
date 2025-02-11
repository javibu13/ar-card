import * as THREE from 'three'
import { MindARThree } from 'mindar-image-three'
const mindarThree = new MindARThree({
  container: document.querySelector('#container'),
  imageTargetSrc: './web/targets.mind'
})
const { renderer, scene, camera } = mindarThree
const anchor = mindarThree.addAnchor(0)
const geometry = new THREE.PlaneGeometry(1, 0.55)
const material = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: false, opacity: 0.5 })
const plane = new THREE.Mesh(geometry, material)
anchor.group.add(plane)

async function startAR () {
  try {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    await mindarThree.start()
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera)
    })
  } catch (error) {
    console.error('Error accessing the camera', error)
  }
}

const startButton = document.querySelector('#startButton')
const stopButton = document.querySelector('#stopButton')
startButton.addEventListener('click', () => {
  startAR()
})
stopButton.addEventListener('click', () => {
  mindarThree.stop()
  mindarThree.renderer.setAnimationLoop(null)
})
