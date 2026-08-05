'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function AnimatedBackground() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.z = 10

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    
    // Deep obsidian background
    renderer.setClearColor(0x030308, 1)
    mount.appendChild(renderer.domElement)

    // Create a group of glowing, soft orbs to act as our fluid gradient
    const gradientGroup = new THREE.Group()
    scene.add(gradientGroup)

    const sphereGeo = new THREE.SphereGeometry(4, 32, 32)
    
    // We use AdditiveBlending and very low opacity to make them look like light leaks/auroras
    const createOrb = (colorHex: number, x: number, y: number) => {
      const mat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
      const mesh = new THREE.Mesh(sphereGeo, mat)
      mesh.position.set(x, y, 0)
      
      // Store random orbital parameters
      mesh.userData = {
        speed: Math.random() * 0.005 + 0.002,
        radius: Math.random() * 3 + 2,
        angle: Math.random() * Math.PI * 2,
        zSpeed: Math.random() * 0.01
      }
      return mesh
    }

    // Modern cyber-aurora palette: Deep Violet, Electric Cyan, Neon Magenta, Azure
    const orbs = [
      createOrb(0x7000ff, -3, 2),
      createOrb(0x00f0ff, 3, -2),
      createOrb(0xff007f, 0, 0),
      createOrb(0x0055ff, -4, -3),
      createOrb(0x9d00ff, 4, 3)
    ]
    
    orbs.forEach(orb => gradientGroup.add(orb))

    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    let animationId: number
    let clock = 0

    function animate() {
      clock += 0.01

      // Slowly orbit the orbs around the center to create a shifting fluid gradient
      orbs.forEach((orb, i) => {
        orb.userData.angle += orb.userData.speed
        orb.position.x = Math.cos(orb.userData.angle) * orb.userData.radius
        orb.position.y = Math.sin(orb.userData.angle) * orb.userData.radius
        
        // Gentle pulsing scale
        const scale = 1 + Math.sin(clock + i) * 0.3
        orb.scale.set(scale, scale, scale)
      })

      // Slowly rotate the entire system
      gradientGroup.rotation.z = Math.sin(clock * 0.1) * 0.5

      renderer.render(scene, camera)
      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      sphereGeo.dispose()
      orbs.forEach(orb => (orb.material as THREE.Material).dispose())
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
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        // A heavy CSS blur forces the Three.js spheres to merge into a smooth liquid gradient
        filter: 'blur(80px)', 
        background: '#030308'
      }}
    />
  )
}