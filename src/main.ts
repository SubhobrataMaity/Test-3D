import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'three/addons/libs/stats.module.js'

// ==========================
// SCENE SETUP
// ==========================
const scene = new THREE.Scene()
const loader = new THREE.TextureLoader()


// ==========================
// 1. LOAD TEXTURES
// ==========================
const faceTextures = {
  right:  loader.load('public/right.jpg'),  // Red face
  left:   loader.load('public/left.jpg'),   // Orange face
  top:    loader.load('public/top.jpg'),    // White face
  bottom: loader.load('public/bottom.jpg'), // Yellow face
  front:  loader.load('public/front.jpg'),  // Blue face
  back:   loader.load('public/back.jpg')    // Green face
}



// Background Texture
const texture = loader.load('public/luffy.jpg')
scene.background = texture

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(4, 4, 6)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

// Controls - Disable Scroll Zoom
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableZoom = false 

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

const stats = new Stats()
document.body.appendChild(stats.dom)

// ==========================
// LIGHTING
// ==========================
scene.add(new THREE.AmbientLight(0xffffff, 1.0)) 
const light = new THREE.DirectionalLight(0xffffff, 0.5)
light.position.set(10, 10, 10)
scene.add(light)

// ==========================
// MATERIALS CREATION
// ==========================

// 1. Transparent material for internal cubie faces
const transparentMat = new THREE.MeshBasicMaterial({ 
  transparent: true, 
  opacity: 0, 
  depthWrite: false // Prevents transparency rendering artifacts
});

// 2. Face materials (DoubleSide is key to seeing 'inside')
const faceMaterials = [
  new THREE.MeshBasicMaterial({ map: faceTextures.right, side: THREE.DoubleSide }),  // +X (Index 0)
  new THREE.MeshBasicMaterial({ map: faceTextures.left, side: THREE.DoubleSide }),   // -X (Index 1)
  new THREE.MeshBasicMaterial({ map: faceTextures.top, side: THREE.DoubleSide }),    // +Y (Index 2)
  new THREE.MeshBasicMaterial({ map: faceTextures.bottom, side: THREE.DoubleSide }), // -Y (Index 3)
  new THREE.MeshBasicMaterial({ map: faceTextures.front, side: THREE.DoubleSide }),  // +Z (Index 4)
  new THREE.MeshBasicMaterial({ map: faceTextures.back, side: THREE.DoubleSide })    // -Z (Index 5)
];

// ==========================
// RUBIK'S CUBE CREATION
// ==========================
const rubikGroup = new THREE.Group()
const cubieSize = 0.95
const stickerOffset = 0.51
const stickerSize = 0.8

const cubieGeometry = new THREE.BoxGeometry(cubieSize, cubieSize, cubieSize)
const cubieMaterial = [
  new THREE.MeshBasicMaterial({ map: faceTextures.right, side: THREE.FrontSide }),  // +X
  new THREE.MeshBasicMaterial({ map: faceTextures.left, side: THREE.FrontSide }),   // -X
  new THREE.MeshBasicMaterial({ map: faceTextures.top, side: THREE.FrontSide }),    // +Y
  new THREE.MeshBasicMaterial({ map: faceTextures.bottom, side: THREE.FrontSide }), // -Y
  new THREE.MeshBasicMaterial({ map: faceTextures.front, side: THREE.FrontSide }),  // +Z
  new THREE.MeshBasicMaterial({ map: faceTextures.back, side: THREE.FrontSide }),   // -Z
]

// ==========================
// 2.CREATESTICKER FUNCTION
// ==========================
function createSticker(texture: THREE.Texture, position: THREE.Vector3, rotation: THREE.Euler) {
  const geo = new THREE.PlaneGeometry(stickerSize, stickerSize)
  // Use 'map' instead of 'color'
  const mat = new THREE.MeshBasicMaterial({ 
    map: texture, 
    side: THREE.DoubleSide // Ensures texture is visible from both sides if needed
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.copy(position)
  mesh.rotation.copy(rotation)
  return mesh
}

for (let x = -1; x <= 1; x++) {
  for (let y = -1; y <= 1; y++) {
    for (let z = -1; z <= 1; z++) {
      const group = new THREE.Group() as any
      const cubie = new THREE.Mesh(cubieGeometry, cubieMaterial)
      group.add(cubie)

      if (x === 1) group.add(createSticker(faceTextures.right, new THREE.Vector3(stickerOffset, 0, 0), new THREE.Euler(0, Math.PI / 2, 0)))
      if (x === -1) group.add(createSticker(faceTextures.left, new THREE.Vector3(-stickerOffset, 0, 0), new THREE.Euler(0, -Math.PI / 2, 0)))
      if (y === 1) group.add(createSticker(faceTextures.top, new THREE.Vector3(0, stickerOffset, 0), new THREE.Euler(-Math.PI / 2, 0, 0)))
      if (y === -1) group.add(createSticker(faceTextures.bottom, new THREE.Vector3(0, -stickerOffset, 0), new THREE.Euler(Math.PI / 2, 0, 0)))
      if (z === 1) group.add(createSticker(faceTextures.front, new THREE.Vector3(0, 0, stickerOffset), new THREE.Euler(0, 0, 0)))
      if (z === -1) group.add(createSticker(faceTextures.back, new THREE.Vector3(0, 0, -stickerOffset), new THREE.Euler(0, Math.PI, 0)))

      group.position.set(x, y, z)
      // Store the local "assembled" position for the scroll effect
      group.userData.assembledPos = new THREE.Vector3(x, y, z)
      rubikGroup.add(group)
    }
  }
}
scene.add(rubikGroup)

// ==========================
// SCROLL DISASSEMBLY LOGIC
// ==========================
let scrollProgress = 0
const explosionFactor = 6 

window.addEventListener('scroll', () => {
  // Calculate how far we've scrolled
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  
  // Normalize to a 0.0 -> 1.0 range
  scrollProgress = Math.max(0, Math.min(1, scrollTop / (maxScroll || 1)));

  // DEBUG: Uncomment the line below to see if scroll is working in your console
  // console.log('Scroll Progress:', scrollProgress);

  updateDisassembly();
});

function updateDisassembly() {
  rubikGroup.children.forEach((cubie: any) => {
    // Fallback in case userData isn't set yet
    if (!cubie.userData.assembledPos) {
      cubie.userData.assembledPos = cubie.position.clone();
    }

    const basePos = cubie.userData.assembledPos as THREE.Vector3;
    
    // Apply position based on scrollProgress
    cubie.position.x = basePos.x * (1 + scrollProgress * explosionFactor);
    cubie.position.y = basePos.y * (1 + scrollProgress * explosionFactor);
    cubie.position.z = basePos.z * (1 + scrollProgress * explosionFactor);
    
    // Add rotation chaos
    cubie.rotation.x = scrollProgress * 2;
    cubie.rotation.z = scrollProgress * 2;
  });
}

// ==========================
// ROTATION LOGIC
// ==========================
let isRotating = false
type Axis = 'x' | 'y' | 'z'

function rotateLayer(axis: Axis, layerIndex: number, direction: number) {
  // GUARD: Only rotate if fully assembled (scroll is at top)
  if (isRotating || scrollProgress > 0.01) return
  isRotating = true

  const tempGroup = new THREE.Group()
  scene.add(tempGroup)

  const selected: THREE.Object3D[] = []

  rubikGroup.children.slice().forEach((cubie) => {
    const worldPos = new THREE.Vector3()
    cubie.getWorldPosition(worldPos)
    if (Math.round(worldPos[axis]) === layerIndex) {
      selected.push(cubie)
      tempGroup.attach(cubie)
    }
  })

  let angle = 0
  const speed = 0.08 * direction
  const target = (Math.PI / 2) * direction

  function animateRotation() {
    const remaining = target - angle
    if (Math.abs(remaining) > Math.abs(speed)) {
      tempGroup.rotation[axis] += speed
      angle += speed
      requestAnimationFrame(animateRotation)
    } else {
      tempGroup.rotation[axis] = target
      tempGroup.updateMatrixWorld(true)

      selected.forEach((cubie: any) => {
        rubikGroup.attach(cubie)
        
        // Snapping
        cubie.position.set(Math.round(cubie.position.x), Math.round(cubie.position.y), Math.round(cubie.position.z))
        const snap = (v: number) => Math.round(v / (Math.PI / 2)) * (Math.PI / 2)
        cubie.rotation.set(snap(cubie.rotation.x), snap(cubie.rotation.y), snap(cubie.rotation.z))
        
        // UPDATE: Refresh the "assembled" position so the next scroll knows new home
        cubie.userData.assembledPos.copy(cubie.position)
      })

      scene.remove(tempGroup)
      isRotating = false
    }
  }
  animateRotation()
}

// ==========================
// KEYBOARD CONTROLS
// ==========================
window.addEventListener('keydown', (e: KeyboardEvent) => {
  // Zoom Logic
  const zoomSpeed = 0.5
  if (e.key === '+' || e.key === '=') camera.position.z -= zoomSpeed
  if (e.key === '-' || e.key === '_') camera.position.z += zoomSpeed

  // Layer Rotations
  switch (e.key) {
    case 'q': rotateLayer('x', -1, 1); break
    case 'w': rotateLayer('x', 0, 1); break
    case 'e': rotateLayer('x', 1, 1); break
    case 'a': rotateLayer('y', -1, 1); break
    case 's': rotateLayer('y', 0, 1); break
    case 'd': rotateLayer('y', 1, 1); break
    case 'z': rotateLayer('z', -1, 1); break
    case 'x': rotateLayer('z', 0, 1); break
    case 'c': rotateLayer('z', 1, 1); break
    case 'Q': rotateLayer('x', -1, -1); break
    case 'W': rotateLayer('x', 0, -1); break
    case 'E': rotateLayer('x', 1, -1); break
  }
})

function animate() {
  requestAnimationFrame(animate)
  rubikGroup.rotation.x += 0.01
  rubikGroup.rotation.y += 0.01
  renderer.render(scene, camera)
  stats.update()
}
animate()