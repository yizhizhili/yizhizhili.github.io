import * as THREE from '../lib/three.module.js'

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

if (!prefersReducedMotion && document.body && !document.getElementById('three-idle-stage')) {
  const stage = document.createElement('div')
  stage.id = 'three-idle-stage'
  stage.setAttribute('aria-hidden', 'true')
  document.body.appendChild(stage)

  let renderer
  let camera
  let animationId = 0
  let idleTimer = 0
  let isIdle = false

  const scene = new THREE.Scene()
  const orbGroup = new THREE.Group()
  const particleGroup = new THREE.Group()
  const edgeGroup = new THREE.Group()
  const idleDelay = 5000
  const maxPixelRatio = 1.5
  const particleCount = window.innerWidth < 768 ? 72 : 132

  const buildParticles = () => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i += 1) {
      const radius = 3 + Math.random() * 4.2
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const index = i * 3

      positions[index] = radius * Math.sin(phi) * Math.cos(theta)
      positions[index + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[index + 2] = radius * Math.cos(phi)
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      color: 0x000000,
      size: 0.042,
      transparent: true,
      opacity: 0.72,
      sizeAttenuation: true
    })

    return new THREE.Points(geometry, material)
  }

  const buildScene = () => {
    camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.set(0, 0, 8.5)

    const coreOrb = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.9, 1),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        wireframe: true,
        transparent: true,
        opacity: 0.18
      })
    )

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.8, 0.02, 18, 180),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        wireframe: true,
        transparent: true,
        opacity: 0.13
      })
    )
    ring.rotation.x = Math.PI / 2.6

    const shell = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(3.35, 0)),
      new THREE.LineBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.08
      })
    )

    orbGroup.add(coreOrb)
    orbGroup.add(ring)
    edgeGroup.add(shell)
    particleGroup.add(buildParticles())

    scene.add(orbGroup)
    scene.add(edgeGroup)
    scene.add(particleGroup)
  }

  const renderOnce = () => {
    if (renderer && camera) renderer.render(scene, camera)
  }

  const resize = () => {
    if (!renderer || !camera) return
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderOnce()
  }

  const animate = () => {
    const time = performance.now() * 0.0002
    orbGroup.rotation.x = time * 0.65
    orbGroup.rotation.y = time * 0.9
    edgeGroup.rotation.x = -time * 0.24
    edgeGroup.rotation.y = time * 0.36
    particleGroup.rotation.x = -time * 0.12
    particleGroup.rotation.y = -time * 0.18
    particleGroup.position.y = Math.sin(time * 3.1) * 0.08

    renderOnce()

    if (isIdle) {
      animationId = window.requestAnimationFrame(animate)
    } else {
      animationId = 0
    }
  }

  const stopLoop = () => {
    if (animationId) {
      window.cancelAnimationFrame(animationId)
      animationId = 0
    }
  }

  const startLoop = () => {
    if (!animationId) animate()
  }

  const setIdle = nextIdle => {
    if (isIdle === nextIdle) return
    isIdle = nextIdle
    document.body.classList.toggle('is-idle', nextIdle)

    if (nextIdle) {
      startLoop()
    } else {
      stopLoop()
      renderOnce()
    }
  }

  const scheduleIdle = () => {
    window.clearTimeout(idleTimer)
    setIdle(false)

    if (document.hidden) return

    idleTimer = window.setTimeout(() => {
      setIdle(true)
    }, idleDelay)
  }

  const boot = () => {
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power'
      })
    } catch (error) {
      stage.remove()
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.setAttribute('aria-hidden', 'true')
    stage.appendChild(renderer.domElement)

    buildScene()
    renderOnce()

    ;['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(eventName => {
      window.addEventListener(eventName, scheduleIdle, { passive: true })
    })

    document.addEventListener('visibilitychange', scheduleIdle)
    window.addEventListener('resize', resize)

    scheduleIdle()
  }

  boot()
}
