import setVisualLogActive from './visualLog.js'
import * as THREE from 'three'
import { MindARThree } from 'mindar-image-three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

// Set debug mode to true to enable visual logs
let debug = false
let visualizeLightsPosition = false
// Activate the visual log but hidden by default
setVisualLogActive('visual-console')
if (debug) {
  // Visualize the position of the lights
  visualizeLightsPosition = true
  // Enable the visual log
  document.querySelectorAll('.debug').forEach((element) => {
    element.classList.remove('hidden')
  })
}
document.querySelector('#toggleDebugButton').addEventListener('click', (event) => {
  document.querySelectorAll('.debug').forEach((element) => {
    element.classList.toggle('hidden')
  })
  debug = !debug
  visualizeLightsPosition = debug
  toggleLightIndicatorsVisibility()
})

// Create a MindARThree instance
const mindarThree = new MindARThree({
  container: document.querySelector('#container'),
  imageTargetSrc: './web/targets.mind',
  filterMinCF: 0.001,
  filterBeta: 0.05
})
console.log(mindarThree)
const { renderer, scene, camera } = mindarThree
const anchor = mindarThree.addAnchor(0)
// Enabling shadows for the renderer
renderer.shadowMap.enabled = true // Activar sombras
renderer.shadowMap.type = THREE.PCFSoftShadowMap // Establecer el tipo de sombra
const planeGeometry = new THREE.PlaneGeometry(1, 1)
const textureLoader = new THREE.TextureLoader()
const groundTexture = textureLoader.load('./web/3d/groundTargetTexture.png')
groundTexture.colorSpace = THREE.SRGBColorSpace // This is important to render the texture correctly
const groundMaterial = new THREE.MeshStandardMaterial({
  map: groundTexture,
  transparent: false,
  alphaTest: 0.5,
  side: THREE.FrontSide,
  metalness: 0,
  roughness: 1
})
const plane = new THREE.Mesh(planeGeometry, groundMaterial)
plane.receiveShadow = true
plane.castShadow = false
anchor.group.add(plane)

const ambientLight = new THREE.AmbientLight(0xffffff, 0.25)
// Add ambient light to the anchor
anchor.group.add(ambientLight)

// Load a 3D model
const loader = new GLTFLoader()
loader.load('./web/3d/rocket.glb', (gltf) => {
  const model = gltf.scene
  model.scale.set(0.25, 0.25, 0.25)
  model.rotation.set(Math.PI / 2, Math.PI, 0) // Rotate the model to be vertical
  model.position.set(0, 0, 0.11)
  const diffuseMap = textureLoader.load('./web/3d/diffuse_map.png', (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.flipY = false
  })
  const normalMap = textureLoader.load('./web/3d/normal_map.png', (texture) => {
    texture.colorSpace = THREE.NoColorSpace
    texture.flipY = false
  })
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
      child.material = new THREE.MeshStandardMaterial({
        color: child.material.color,
        map: diffuseMap,
        normalMap,
        normalScale: new THREE.Vector2(1, 1),
        roughness: 0.8,
        metalness: 0.2
      })
    }
  })
  anchor.group.add(model)
})

// Add lights to the scene
const sceneLights = []
const lightIndicators = []
const pointLight1 = new THREE.PointLight(0xffffff, 300000, 10000) // color, intensity, max distance
pointLight1.position.set(0.3, -0.5, 0.3)
sceneLights.push(pointLight1)
const pointLight2 = new THREE.PointLight(0xffffff, 300000, 10000) // color, intensity, max distance
pointLight2.position.set(-0.5, -0.5, 0.5)
sceneLights.push(pointLight2)
const pointLight3 = new THREE.PointLight(0xffffff, 300000, 10000) // color, intensity, max distance
pointLight3.position.set(0, 0.5, 0.6)
sceneLights.push(pointLight3)

// Add a sphere to each light position to visualize its position
for (const light of sceneLights) {
  // Add the light to the anchor
  light.castShadow = true
  anchor.group.add(light)
  // Add a sphere to visualize the light
  createLightIndicators(sceneLights)
}

function createLightIndicators (lightList) {
  const lightIndicatorMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })
  for (const light of lightList) {
    const lightIndicatorGeometry = new THREE.SphereGeometry(0.03, 8, 8)
    const lightIndicator = new THREE.Mesh(lightIndicatorGeometry, lightIndicatorMaterial)
    lightIndicator.position.copy(light.position)
    lightIndicators.push(lightIndicator)
    lightIndicator.castShadow = false
    lightIndicator.receiveShadow = false
    lightIndicator.visible = false
    anchor.group.add(lightIndicator)
  }
}

function toggleLightIndicatorsVisibility () {
  for (const lightIndicator of lightIndicators) {
    lightIndicator.visible = !lightIndicator.visible
  }
}

async function startAR () {
  try {
    // Ask for permission to access the camera
    // navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        // Filter devices of type 'videoinput' (cameras)
        const videoDevices = devices.filter(device => device.kind === 'videoinput')

        // Look for the rear camera by 'facingMode' or the appropriate index
        let selectedDevice = null

        // To ensure we select the rear camera 0 (main rear camera)
        for (let i = 0; i < videoDevices.length; i++) {
          if (videoDevices[i].label.includes('back') && videoDevices[i].label.includes('0')) {
            selectedDevice = videoDevices[i]
            break
          }
        }

        // If the camera with label '0' is not found, select the first available one
        if (!selectedDevice) {
          selectedDevice = videoDevices[0]
        }

        // Access the selected device
        const constraints = {
          video: {
            deviceId: { exact: selectedDevice.deviceId }
          }
        }

        return navigator.mediaDevices.getUserMedia(constraints)
      })
      .then(stream => {
        // Here you use the video stream to display it in a <video> element or use it in your AR
        const videoElement = document.querySelector('video')
        videoElement.srcObject = stream
      })
      .catch(error => {
        console.error('Error accessing the camera:', error)
      })
    await mindarThree.start()
    renderer.setAnimationLoop((currentTime) => {
      renderer.render(scene, camera)
    })
  } catch (error) {
    console.error('Error accessing the camera', error)
  }
}

// Start and stop buttons
const startButton = document.querySelector('#startButton')
const stopButton = document.querySelector('#stopButton')
startButton.addEventListener('click', () => {
  startAR()
})
stopButton.addEventListener('click', () => {
  mindarThree.stop()
  mindarThree.renderer.setAnimationLoop(null)
})
// Force click on the start button
startButton.click()

// Visual console for debugging control buttons
const toggleVisualConsoleButton = document.querySelector('#toggleVisualConsoleButton')
const clearVisualConsoleButton = document.querySelector('#clearVisualConsoleButton')
const visualConsole = document.querySelector('#visual-console')
toggleVisualConsoleButton.addEventListener('click', () => {
  visualConsole.classList.toggle('hidden')
})
clearVisualConsoleButton.addEventListener('click', () => {
  visualConsole.innerHTML = ''
})
