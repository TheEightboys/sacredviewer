import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Cloud, Clouds } from '@react-three/drei'

// Local cloud texture to avoid CORS issues with external CDN
const CLOUD_TEXTURE_URL = '/cloud.png'

// Hook to detect mobile for performance optimization
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

/**
 * Rain particles using instanced mesh for performance
 * Creates thousands of raindrops efficiently
 */
export function Rain({ count = 800 }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Initialize particles with random positions and speeds
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 30,
        y: Math.random() * 25 + 5,
        z: (Math.random() - 0.5) * 30,
        speed: Math.random() * 0.15 + 0.1,
      })
    }
    return temp
  }, [count])

  // Animate rain falling
  useFrame(() => {
    if (!meshRef.current) return

    particles.forEach((particle, i) => {
      // Move down
      particle.y -= particle.speed

      // Reset to top when below ground
      if (particle.y < -2) {
        particle.y = 25
        particle.x = (Math.random() - 0.5) * 30
        particle.z = (Math.random() - 0.5) * 30
      }

      // Update instance matrix
      dummy.position.set(particle.x, particle.y, particle.z)
      dummy.rotation.set(0, 0, Math.random() * 0.1) // Slight tilt variation
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <cylinderGeometry args={[0.005, 0.005, 0.3, 4]} />
      <meshBasicMaterial
        color="#a8c8e8"
        transparent
        opacity={0.4}
      />
    </instancedMesh>
  )
}

/**
 * Fluffy realistic clouds using Drei's Cloud component
 * Key: Use white/near-white colors, higher segments, larger volumes
 * The 'concentrate' prop helps create natural fluffy edges
 */
export function MysticalClouds() {
  const isMobile = useIsMobile()

  // Reduce segments on mobile for better performance
  const segmentMultiplier = isMobile ? 0.4 : 1

  return (
    <Clouds material={THREE.MeshLambertMaterial} limit={400} texture={CLOUD_TEXTURE_URL}>
      {/* Main fluffy cloud cluster - white, high volume for puffy look */}
      <Cloud
        seed={1}
        segments={Math.floor(80 * segmentMultiplier)}
        bounds={[15, 5, 15]}
        volume={25}
        smallestVolume={0.4}
        concentrate="inside"
        color="#ffffff"
        opacity={0.85}
        speed={0.1}
        growth={6}
        position={[0, 18, -5]}
        fade={50}
      />

      {/* Second fluffy cluster - slightly cream tinted */}
      <Cloud
        seed={42}
        segments={Math.floor(70 * segmentMultiplier)}
        bounds={[12, 4, 12]}
        volume={22}
        smallestVolume={0.35}
        concentrate="inside"
        color="#f8f4f0"
        opacity={0.8}
        speed={0.08}
        growth={5}
        position={[-12, 16, 8]}
        fade={45}
      />

      {/* Third cloud - back right */}
      <Cloud
        seed={123}
        segments={Math.floor(65 * segmentMultiplier)}
        bounds={[14, 4, 14]}
        volume={20}
        smallestVolume={0.3}
        concentrate="inside"
        color="#fafafa"
        opacity={0.75}
        speed={0.06}
        growth={5}
        position={[15, 20, -10]}
        fade={50}
      />

      {/* Skip extra layers on mobile */}
      {!isMobile && (
        <>
          {/* Mid-height wispy cloud */}
          <Cloud
            seed={77}
            segments={50}
            bounds={[18, 3, 18]}
            volume={15}
            smallestVolume={0.25}
            concentrate="random"
            color="#f5f5f5"
            opacity={0.6}
            speed={0.05}
            growth={4}
            position={[8, 14, 5]}
            fade={40}
          />

          {/* Distant background clouds */}
          <Cloud
            seed={99}
            segments={45}
            bounds={[20, 3, 20]}
            volume={18}
            smallestVolume={0.3}
            concentrate="inside"
            color="#f0f0f0"
            opacity={0.5}
            speed={0.04}
            growth={4}
            position={[-8, 22, -15]}
            fade={60}
          />
        </>
      )}

      {/* Low atmospheric haze - very subtle, light blue tint */}
      <Cloud
        seed={200}
        segments={Math.floor(25 * segmentMultiplier)}
        bounds={[30, 2, 30]}
        volume={8}
        smallestVolume={0.5}
        concentrate="outside"
        color="#e8f4ff"
        opacity={0.2}
        speed={0.02}
        growth={3}
        position={[0, 8, 0]}
        fade={30}
      />
    </Clouds>
  )
}

/**
 * Floating dust/spark particles for mystical atmosphere
 */
export function FloatingParticles({ count = 100 }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Initialize particles
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 20,
        y: Math.random() * 15,
        z: (Math.random() - 0.5) * 20,
        speedY: (Math.random() - 0.5) * 0.01,
        speedX: (Math.random() - 0.5) * 0.005,
        phase: Math.random() * Math.PI * 2,
        scale: Math.random() * 0.5 + 0.5,
      })
    }
    return temp
  }, [count])

  useFrame((state) => {
    if (!meshRef.current) return

    const time = state.clock.elapsedTime

    particles.forEach((particle, i) => {
      // Gentle floating motion
      particle.y += particle.speedY + Math.sin(time + particle.phase) * 0.002
      particle.x += particle.speedX + Math.cos(time * 0.5 + particle.phase) * 0.001

      // Wrap around
      if (particle.y > 15) particle.y = 0
      if (particle.y < 0) particle.y = 15
      if (particle.x > 10) particle.x = -10
      if (particle.x < -10) particle.x = 10

      dummy.position.set(particle.x, particle.y, particle.z)
      dummy.scale.setScalar(particle.scale * (0.8 + Math.sin(time * 2 + particle.phase) * 0.2))
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.02, 8, 8]} />
      <meshBasicMaterial
        color="#d4a853"
        transparent
        opacity={0.6}
      />
    </instancedMesh>
  )
}

/**
 * Combined atmospheric effects component
 * Automatically adjusts counts for mobile performance
 */
export function AtmosphericEffects({
  enableRain = true,
  enableClouds = true,
  enableParticles = true,
  rainCount = 600,
  particleCount = 80,
}) {
  const isMobile = useIsMobile()

  // Reduce particle counts on mobile for better performance
  const adjustedRainCount = isMobile ? Math.floor(rainCount * 0.4) : rainCount
  const adjustedParticleCount = isMobile ? Math.floor(particleCount * 0.5) : particleCount

  return (
    <group>
      {enableClouds && <MysticalClouds />}
      {enableRain && <Rain count={adjustedRainCount} />}
      {enableParticles && <FloatingParticles count={adjustedParticleCount} />}
    </group>
  )
}
