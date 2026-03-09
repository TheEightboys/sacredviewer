import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { create } from 'zustand'
import * as THREE from 'three'

// Store for ring settings - can be adjusted from UI
interface RingSettings {
  radius: number
  yPosition: number
  enabled: boolean
  rotationSpeed: number
  setRadius: (radius: number) => void
  setYPosition: (y: number) => void
  setEnabled: (enabled: boolean) => void
  setRotationSpeed: (speed: number) => void
}

export const useRingStore = create<RingSettings>((set) => ({
  radius: 11.0,
  yPosition: -4.5,
  enabled: true,
  rotationSpeed: 0.5,
  setRadius: (radius) => set({ radius }),
  setYPosition: (yPosition) => set({ yPosition }),
  setEnabled: (enabled) => set({ enabled }),
  setRotationSpeed: (rotationSpeed) => set({ rotationSpeed }),
}))

/**
 * Mystical rotating ring pedestal with multiple decorative rings
 * Features: outer ring, inner ring, mystical runes, particle glow
 */
export function GoldenPedestal() {
  const groupRef = useRef<THREE.Group>(null)
  const outerRingRef = useRef<THREE.Mesh>(null)
  const innerRingRef = useRef<THREE.Mesh>(null)
  const runeRingRef = useRef<THREE.Mesh>(null)
  const glowRingRef = useRef<THREE.Mesh>(null)

  const { radius, yPosition, enabled, rotationSpeed } = useRingStore()

  // Rotation animation - different speeds for each ring
  useFrame((state) => {
    const time = state.clock.elapsedTime

    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = time * rotationSpeed
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z = -time * rotationSpeed * 1.5
    }
    if (runeRingRef.current) {
      runeRingRef.current.rotation.z = time * rotationSpeed * 0.3
    }
    if (glowRingRef.current) {
      // Pulsing glow
      const pulse = Math.sin(time * 2) * 0.3 + 0.7
      glowRingRef.current.scale.setScalar(pulse)
    }
  })

  if (!enabled) return null

  return (
    <group ref={groupRef} position={[0, yPosition, 0]} rotation={[0, 0, 0]}>
      {/* Outer main ring - thick golden band */}
      <mesh
        ref={outerRingRef}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[radius, 0.08, 16, 128]} />
        <meshStandardMaterial
          color="#d4a853"
          emissive="#d4a853"
          emissiveIntensity={0.8}
          metalness={0.95}
          roughness={0.15}
          toneMapped={false}
        />
      </mesh>

      {/* Inner decorative ring - thinner */}
      <mesh
        ref={innerRingRef}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[radius * 0.85, 0.04, 16, 128]} />
        <meshStandardMaterial
          color="#ffd700"
          emissive="#ffd700"
          emissiveIntensity={1.0}
          metalness={0.9}
          roughness={0.2}
          toneMapped={false}
        />
      </mesh>

      {/* Rune/pattern ring - segmented look */}
      <mesh
        ref={runeRingRef}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[radius * 0.92, 0.02, 8, 64]} />
        <meshStandardMaterial
          color="#8b6914"
          emissive="#d4a853"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.3}
          toneMapped={false}
        />
      </mesh>

      {/* Glow ring - soft outer glow effect */}
      <mesh
        ref={glowRingRef}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[radius * 1.05, 0.15, 16, 128]} />
        <meshBasicMaterial
          color="#d4a853"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Center glow disc */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[radius * 0.8, 64]} />
        <meshBasicMaterial
          color="#d4a853"
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Decorative dots/gems around the ring */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        return (
          <mesh key={i} position={[x, 0, z]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial
              color="#ffd700"
              emissive="#ffd700"
              emissiveIntensity={1.5}
              metalness={1}
              roughness={0}
              toneMapped={false}
            />
          </mesh>
        )
      })}
    </group>
  )
}
