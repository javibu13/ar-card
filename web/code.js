import setVisualLogActive from './visualLog.js'
import * as THREE from 'three'
import { MindARThree } from 'mindar-image-three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

// Set debug mode to true to enable visual logs
let debug = false
// Activate the visual log but hidden by default
setVisualLogActive('visual-console')
if (debug) {
  // Visualize the position of the lights
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
  toggleLightIndicatorsVisibility()
})

// Create a MindARThree instance
const mindarThree = new MindARThree({
  container: document.querySelector('#container'),
  imageTargetSrc: './web/targets.mind',
  uiScanning: '#custom-scanning-overlay',
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

// Create plante to hide elements under the ground
const clippingPlane = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({
  colorWrite: false, // Does not draw color, but still blocks the view
  depthTest: true, // Allows the object to hide other objects behind it
  depthWrite: true // Writes to the depth buffer
}))
clippingPlane.position.set(0, 0, -0.01)
clippingPlane.rotation.set(0, 0, 0)
anchor.group.add(clippingPlane)

const ambientLight = new THREE.AmbientLight(0xffffff, 0.25)
// Add ambient light to the anchor
anchor.group.add(ambientLight)

// Load the rocket 3D model
const loader = new GLTFLoader()
loader.load('./web/3d/rocket/rocket.glb', (gltf) => {
  const model = gltf.scene
  model.scale.set(0.25, 0.25, 0.25)
  model.rotation.set(Math.PI / 2, Math.PI, 0) // Rotate the model to be vertical
  model.position.set(0, 0, 0.11)
  const diffuseMap = textureLoader.load('./web/3d/rocket/diffuse_map.png', (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.flipY = false
  })
  const normalMap = textureLoader.load('./web/3d/rocket/normal_map.png', (texture) => {
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
        metalness: 0.2,
        clippingPlanes: [clippingPlane], // Add the clipping plane to the material
        clipIntersection: true, // Set to true to show the intersection of the clipping plane
        clipShadows: true // Set to true to show shadows on the intersection of the clipping plane
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

// Load the hatch 3D model
let mixerHatch3D
loader.load('./web/3d/hatch/hatch.glb', (gltf) => {
  const model = gltf.scene
  model.scale.set(0.25, 0.25, 0.25)
  model.rotation.set(Math.PI / 2, 0, 0) // Rotate the model to be vertical
  model.position.set(0, 0.045, 0.11)
  const diffuseMapBorder = textureLoader.load('./web/3d/hatch/hatch_border_diffuse_map.png', (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.flipY = false
  })
  const normalMapBorder = textureLoader.load('./web/3d/hatch/hatch_border_normal_map.png', (texture) => {
    texture.colorSpace = THREE.NoColorSpace
    texture.flipY = false
  })
  const normalMapDoors = textureLoader.load('./web/3d/hatch/hatch_doors_normal_map.png', (texture) => {
    texture.colorSpace = THREE.NoColorSpace
    texture.flipY = false
  })
  console.log(model)
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
      if (child.name === 'Cube') {
        child.material = new THREE.MeshStandardMaterial({
          color: child.material.color,
          map: diffuseMapBorder,
          normalMap: normalMapBorder,
          normalScale: new THREE.Vector2(1, 1),
          roughness: 0.69,
          metalness: 0.69
        })
      } else if (child.name.startsWith('Plane')) {
        child.material = new THREE.MeshStandardMaterial({
          color: '#8A8A8A',
          normalMap: normalMapDoors,
          normalScale: new THREE.Vector2(1, 1),
          roughness: 0.69,
          metalness: 0.69
        })
      }
    }
  })
  anchor.group.add(model)
})

// Load the button 3D model
let mixerButton3D
loader.load('./web/3d/buttonInfinite/buttonInfinite.glb', (gltf) => {
  const model = gltf.scene
  model.scale.set(0.25, 0.25, 0.25)
  model.rotation.set(Math.PI / 2, 0, 0) // Rotate the model to be vertical
  model.position.set(0, 0.06, 0.11)
  const diffuseMap = textureLoader.load('./web/3d/buttonInfinite/button_diffuse_map.png', (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.flipY = false
  })
  const normalMap = textureLoader.load('./web/3d/buttonInfinite/button_normal_map.png', (texture) => {
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
  // Load animations
  mixerButton3D = new THREE.AnimationMixer(model)
  const clips = gltf.animations
  // Obtener las animaciones
  const pressAnim = mixerButton3D.clipAction(clips.find(clip => clip.name === 'press'))
  pressAnim.setLoop(THREE.LoopOnce)
  pressAnim.clampWhenFinished = true
  pressAnim.timeScale = 1
  const releaseAnim = mixerButton3D.clipAction(clips.find(clip => clip.name === 'release'))
  releaseAnim.setLoop(THREE.LoopOnce)
  releaseAnim.clampWhenFinished = true
  releaseAnim.timeScale = 1

  // Set up Raycaster to detect clicks
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  let isPressed = false
  // Click event handler
  function onMouseDown (event) {
    // Get normalized mouse coordinates
    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    // Cast the ray from the camera
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObject(model)
    if (intersects.length > 0) {
      console.log('¡Botón 3D clickeado!')
      isPressed = true
      releaseAnim.stop() // Stop the previous animation
      pressAnim.reset().play()
    }
  }
  function onMouseUp (event) {
    if (isPressed) {
      console.log('¡Botón 3D liberado!')
      pressAnim.stop() // Stop the previous animation
      releaseAnim.reset().play()
      isPressed = false
    }
  }
  // Add the click event listener
  document.addEventListener('mousedown', onMouseDown)
  document.addEventListener('mouseup', onMouseUp)
})

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
    const clock = new THREE.Clock()
    renderer.setAnimationLoop((currentTime) => {
      const delta = clock.getDelta()
      if (mixerButton3D) mixerButton3D.update(delta)
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
