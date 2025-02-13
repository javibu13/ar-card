import * as THREE from 'three'
import { MindARThree } from 'mindar-image-three'
const mindarThree = new MindARThree({
  container: document.querySelector('#container'),
  imageTargetSrc: './web/targets.mind',
  filterMinCF: 0.001,
  filterBeta: 0.05
})
console.log(mindarThree)
console.log('filterBeta', mindarThree.filterBeta)
const { renderer, scene, camera } = mindarThree
const anchor = mindarThree.addAnchor(0)
const geometry = new THREE.PlaneGeometry(1, 0.55)
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.75 })
const plane = new THREE.Mesh(geometry, material)
const cube = new THREE.Mesh(cubeGeometry, material)
// anchor.group.add(plane)
// anchor.group.add(cube)

// Dibujar ejes en escena
// // Eje X
const xAxisGeometry = new THREE.BoxGeometry(1, 0.05, 0.05)
const xAxisMaterial = new THREE.MeshBasicMaterial({ color: 'red' })
const xAxis = new THREE.Mesh(xAxisGeometry, xAxisMaterial)
// xAxis.position.x = 0.5
// // Eje Y
const yAxisGeometry = new THREE.BoxGeometry(0.05, 1, 0.05)
const yAxisMaterial = new THREE.MeshBasicMaterial({ color: 'green' })
const yAxis = new THREE.Mesh(yAxisGeometry, yAxisMaterial)
// yAxis.position.y = 0.5
// // Eje Z
const zAxisGeometry = new THREE.BoxGeometry(0.05, 0.05, 1)
const zAxisMaterial = new THREE.MeshBasicMaterial({ color: 'blue' })
const zAxis = new THREE.Mesh(zAxisGeometry, zAxisMaterial)
// zAxis.position.z = 0.5

anchor.group.add(xAxis)
anchor.group.add(yAxis)
anchor.group.add(zAxis)

let previousTime = performance.now()

async function startAR () {
  try {
    // Ask for permission to access the camera
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    await mindarThree.start()
    renderer.setAnimationLoop((currentTime) => {
      const deltaTime = currentTime - previousTime
      previousTime = currentTime
      const increaseRotation = (2 * Math.PI) * ((deltaTime / 1000) / 3)
      cube.rotation.y += increaseRotation
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

// Simultar el click en el botón de inicio
startButton.click()
