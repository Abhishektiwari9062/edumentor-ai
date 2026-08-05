'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

type FaceState = 'idle' | 'listening' | 'speaking' | 'loading'

export default function AIFace({ state }: { state: FaceState }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef<FaceState>(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const width = 320
    const height = 360

    const scene = new THREE.Scene()
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 0, 8.5)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.domElement.style.pointerEvents = 'none'
    mount.appendChild(renderer.domElement)

    // --- Orbital Neon Lighting for Multicolor Reflections ---
    const cyanLight = new THREE.PointLight(0x00f0ff, 150, 20)
    const magentaLight = new THREE.PointLight(0xff007f, 150, 20)
    const goldLight = new THREE.PointLight(0xffaa00, 150, 20)
    scene.add(cyanLight, magentaLight, goldLight)

    const ambient = new THREE.AmbientLight(0x222233, 2)
    scene.add(ambient)

    // --- High-Density Liquid Chrome Sphere ---
    const geometry = new THREE.IcosahedronGeometry(1.5, 32)
    const basePositions = new Float32Array(geometry.attributes.position.array)
    
    // Kept your precise material settings to ensure no added reflections or color changes
    const material = new THREE.MeshStandardMaterial({
      color: 0x050510,
      metalness: 1.0,  
      roughness: 0.15, 
    })

    const ferrofluid = new THREE.Mesh(geometry, material)
    scene.add(ferrofluid)

    // State weights for buttery smooth transitions
    const weights = {
      idle: 1,
      listening: 0,
      speaking: 0,
      loading: 0
    }

    let animationId: number
    const clock = new THREE.Clock() 

    function animate() {
      const time = clock.getElapsedTime()
      const currentState = stateRef.current

      // Orbit the lights around the metal
      cyanLight.position.set(Math.cos(time * 1.5) * 4, Math.sin(time * 1.5) * 4, Math.sin(time * 0.8) * 4)
      magentaLight.position.set(Math.sin(time * 1.2) * 4, Math.cos(time * 1.2) * 4, Math.cos(time * 0.6) * 4)
      goldLight.position.set(Math.cos(time * 0.9) * 4, Math.sin(time * 1.8) * 4, Math.sin(time * 1.1) * 4)

      // --- Smooth State Easing ---
      const lerpSpeed = 0.08
      weights.idle += ((currentState === 'idle' ? 1 : 0) - weights.idle) * lerpSpeed
      weights.listening += ((currentState === 'listening' ? 1 : 0) - weights.listening) * lerpSpeed
      weights.speaking += ((currentState === 'speaking' ? 1 : 0) - weights.speaking) * lerpSpeed
      weights.loading += ((currentState === 'loading' ? 1 : 0) - weights.loading) * lerpSpeed

      // --- Real-time Vertex Manipulation with Blending ---
      const pos = geometry.attributes.position.array as Float32Array
      
      for (let i = 0; i < pos.length; i += 3) {
        const bx = basePositions[i]
        const by = basePositions[i + 1]
        const bz = basePositions[i + 2]

        const nx = bx / 1.5
        const ny = by / 1.5
        const nz = bz / 1.5

        let dSpeak = 0, dListen = 0, dLoad = 0, dIdle = 0

        // Only calculate geometry math if the weight is visible enough to matter (saves CPU)
        if (weights.speaking > 0.001) {
          const raw = Math.sin(nx * 8 + time * 6) * Math.sin(ny * 8 + time * 6) * Math.sin(nz * 8 + time * 6)
          dSpeak = Math.pow(Math.abs(raw), 2) * Math.sign(raw) * 0.9
        }
        if (weights.listening > 0.001) {
          dListen = -Math.abs(nz) * 0.6
        }
        if (weights.loading > 0.001) {
          const twist = ny * 3
          dLoad = Math.sin(nx * 4 + twist - time * 8) * 0.25
        }
        if (weights.idle > 0.001) {
          dIdle = Math.sin(nx * 3 + time * 1.5) * Math.sin(ny * 3 + time * 1.5) * 0.12
        }

        // Blend the distortions based on the current state weights
        const distortion = (dSpeak * weights.speaking) + 
                           (dListen * weights.listening) + 
                           (dLoad * weights.loading) + 
                           (dIdle * weights.idle)

        const newRadius = 1.5 + distortion
        pos[i] = nx * newRadius
        pos[i + 1] = ny * newRadius
        pos[i + 2] = nz * newRadius
      }

      geometry.attributes.position.needsUpdate = true
      geometry.computeVertexNormals()

      ferrofluid.rotation.y = time * 0.15
      ferrofluid.rotation.x = time * 0.05

      renderer.render(scene, camera)
      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (mount && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div 
      ref={mountRef} 
      style={{ 
        position: 'relative', 
        width: 320,           
        height: 360,          
        margin: '0 auto',
        zIndex: -10, 
        pointerEvents: 'none' 
      }} 
    />
  )
}