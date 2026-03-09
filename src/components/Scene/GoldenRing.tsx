import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { modelBoundsStore } from './BuildingModel'

// 3D Golden ring - tilted ring orbiting around the model (like in Tantra Sadhana reference)
export function GoldenRing() {
  const groupRef = useRef<THREE.Group>(null)
  const [ringConfig, setRingConfig] = useState({ radius: 3, centerY: 0 })

  // Update ring size based on model bounds
  useEffect(() => {
    const updateConfig = () => {
      if (modelBoundsStore.size && modelBoundsStore.center) {
        // Calculate ring radius - should encircle the model with some margin
        const maxDim = Math.max(
          modelBoundsStore.size.x,
          modelBoundsStore.size.y,
          modelBoundsStore.size.z
        )
        const radius = maxDim * 0.7

        // Center the ring at model's vertical center
        const centerY = modelBoundsStore.center.y

        setRingConfig({ radius, centerY })
      }
    }

    updateConfig()
    const unsubscribe = modelBoundsStore.subscribe(updateConfig)
    return () => { unsubscribe() }
  }, [])

  // Slow rotation around Y axis
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2
    }
  })

  return (
    <group ref={groupRef} position={[0, ringConfig.centerY, 0]}>
      {/* Main golden ring - tilted at ~60 degrees to create orbital effect */}
      <mesh rotation={[Math.PI * 0.35, 0, Math.PI * 0.1]}>
        <torusGeometry args={[ringConfig.radius, 0.02, 16, 128]} />
        <meshStandardMaterial
          color="#d4a853"
          emissive="#d4a853"
          emissiveIntensity={2}
          metalness={0.9}
          roughness={0.1}
          toneMapped={false}
        />
      </mesh>

      {/* Glow effect - slightly larger transparent ring */}
      <mesh rotation={[Math.PI * 0.35, 0, Math.PI * 0.1]}>
        <torusGeometry args={[ringConfig.radius, 0.08, 8, 64]} />
        <meshBasicMaterial
          color="#d4a853"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
