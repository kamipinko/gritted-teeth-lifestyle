'use client'
/*
 * MuscleBody — a stylized low-poly humanoid built from primitive meshes,
 * rendered with React Three Fiber. The body is a dark "skeletal" frame,
 * and 10 muscle groups are overlaid as brighter ellipsoid/box meshes.
 *
 * Each muscle group is its own clickable mesh. Clicking toggles its
 * selection state (passed in from the parent). Selected muscles glow red
 * with emissive material; unselected muscles are a muted dark red.
 *
 * Muscle groups (10 total):
 *   chest, biceps, triceps, shoulders, forearms, abs, quads,
 *   hamstrings, glutes, calves
 *
 * Left/right pairs are grouped under the same category — clicking the
 * left bicep toggles "biceps" as a single selection.
 */
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef, useState } from 'react'
import * as THREE from 'three'

// Muted muscle tissue color for unselected state
const UNSELECTED = '#5a1215'
// Bright selected color
const SELECTED = '#ff2a36'
// Emissive color for selected glow
const SELECTED_EMISSIVE = '#d4181f'
// Skeletal base color
const BONE = '#2a1a1c'
// Accent outline on muscles
const MUSCLE_EDGE = '#8a1a20'

/**
 * A single muscle mesh — a rounded shape at a given position that can
 * be selected by clicking. Hover shows a slight highlight.
 */
function Muscle({
  group,
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  shape = 'sphere',
  isSelected,
  onToggle,
}) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame(() => {
    if (meshRef.current && isSelected) {
      // Subtle pulse for selected muscles
      const t = Date.now() * 0.003
      const pulse = 1 + Math.sin(t) * 0.02
      meshRef.current.scale.set(scale[0] * pulse, scale[1] * pulse, scale[2] * pulse)
    } else if (meshRef.current) {
      meshRef.current.scale.set(scale[0], scale[1], scale[2])
    }
  })

  const color = isSelected ? SELECTED : (hovered ? '#8a1a20' : UNSELECTED)
  const emissive = isSelected ? SELECTED_EMISSIVE : (hovered ? '#3a0a0c' : '#1a0608')
  const emissiveIntensity = isSelected ? 1.2 : (hovered ? 0.3 : 0.1)

  const handleClick = (e) => {
    e.stopPropagation()
    onToggle(group)
  }

  const handlePointerOver = (e) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }

  const handlePointerOut = () => {
    setHovered(false)
    document.body.style.cursor = 'default'
  }

  const geometry = (() => {
    if (shape === 'box') return <boxGeometry args={[1, 1, 1]} />
    if (shape === 'capsule') return <capsuleGeometry args={[0.4, 1, 8, 16]} />
    return <sphereGeometry args={[1, 24, 24]} />
  })()

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {geometry}
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={0.55}
        metalness={0.15}
      />
    </mesh>
  )
}

/**
 * Skeletal base — the dark body frame beneath the muscles.
 * Made from capsules and a sphere to suggest a humanoid silhouette
 * without competing visually with the muscles.
 */
function Skeleton() {
  return (
    <group>
      {/* Head */}
      <mesh position={[0, 3.2, 0]}>
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshStandardMaterial color={BONE} roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 2.55, 0]}>
        <cylinderGeometry args={[0.22, 0.25, 0.45, 12]} />
        <meshStandardMaterial color={BONE} roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Torso — front/back plane */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[1.6, 2.0, 0.7]} />
        <meshStandardMaterial color={BONE} roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Pelvis */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[1.45, 0.7, 0.7]} />
        <meshStandardMaterial color={BONE} roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Upper arms (L/R) */}
      <mesh position={[-1.05, 1.9, 0]} rotation={[0, 0, 0.05]}>
        <capsuleGeometry args={[0.22, 1.1, 8, 16]} />
        <meshStandardMaterial color={BONE} roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[1.05, 1.9, 0]} rotation={[0, 0, -0.05]}>
        <capsuleGeometry args={[0.22, 1.1, 8, 16]} />
        <meshStandardMaterial color={BONE} roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Forearms (L/R) */}
      <mesh position={[-1.2, 0.55, 0]} rotation={[0, 0, 0.08]}>
        <capsuleGeometry args={[0.18, 1.0, 8, 16]} />
        <meshStandardMaterial color={BONE} roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[1.2, 0.55, 0]} rotation={[0, 0, -0.08]}>
        <capsuleGeometry args={[0.18, 1.0, 8, 16]} />
        <meshStandardMaterial color={BONE} roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Upper legs (L/R) */}
      <mesh position={[-0.4, -0.9, 0]}>
        <capsuleGeometry args={[0.3, 1.3, 8, 16]} />
        <meshStandardMaterial color={BONE} roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[0.4, -0.9, 0]}>
        <capsuleGeometry args={[0.3, 1.3, 8, 16]} />
        <meshStandardMaterial color={BONE} roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Lower legs (L/R) */}
      <mesh position={[-0.4, -2.5, 0]}>
        <capsuleGeometry args={[0.24, 1.2, 8, 16]} />
        <meshStandardMaterial color={BONE} roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[0.4, -2.5, 0]}>
        <capsuleGeometry args={[0.24, 1.2, 8, 16]} />
        <meshStandardMaterial color={BONE} roughness={0.9} metalness={0.1} />
      </mesh>
    </group>
  )
}

/**
 * All muscle groups, positioned on top of the skeleton. Each group
 * receives the current selection state and the toggle callback.
 */
function MuscleGroups({ selected, onToggle }) {
  const isSelected = (group) => selected.has(group)
  return (
    <group>
      {/* Chest — two rounded pec ellipsoids */}
      <Muscle
        group="chest"
        position={[-0.4, 2.1, 0.4]}
        scale={[0.55, 0.38, 0.35]}
        isSelected={isSelected('chest')}
        onToggle={onToggle}
      />
      <Muscle
        group="chest"
        position={[0.4, 2.1, 0.4]}
        scale={[0.55, 0.38, 0.35]}
        isSelected={isSelected('chest')}
        onToggle={onToggle}
      />

      {/* Shoulders — deltoid caps */}
      <Muscle
        group="shoulders"
        position={[-1.05, 2.35, 0]}
        scale={[0.45, 0.42, 0.45]}
        isSelected={isSelected('shoulders')}
        onToggle={onToggle}
      />
      <Muscle
        group="shoulders"
        position={[1.05, 2.35, 0]}
        scale={[0.45, 0.42, 0.45]}
        isSelected={isSelected('shoulders')}
        onToggle={onToggle}
      />

      {/* Biceps — front of upper arms */}
      <Muscle
        group="biceps"
        position={[-1.05, 1.9, 0.3]}
        scale={[0.28, 0.55, 0.25]}
        isSelected={isSelected('biceps')}
        onToggle={onToggle}
      />
      <Muscle
        group="biceps"
        position={[1.05, 1.9, 0.3]}
        scale={[0.28, 0.55, 0.25]}
        isSelected={isSelected('biceps')}
        onToggle={onToggle}
      />

      {/* Triceps — back of upper arms */}
      <Muscle
        group="triceps"
        position={[-1.05, 1.9, -0.3]}
        scale={[0.28, 0.55, 0.25]}
        isSelected={isSelected('triceps')}
        onToggle={onToggle}
      />
      <Muscle
        group="triceps"
        position={[1.05, 1.9, -0.3]}
        scale={[0.28, 0.55, 0.25]}
        isSelected={isSelected('triceps')}
        onToggle={onToggle}
      />

      {/* Forearms — lower arms */}
      <Muscle
        group="forearms"
        position={[-1.2, 0.55, 0.1]}
        scale={[0.24, 0.5, 0.24]}
        isSelected={isSelected('forearms')}
        onToggle={onToggle}
      />
      <Muscle
        group="forearms"
        position={[1.2, 0.55, 0.1]}
        scale={[0.24, 0.5, 0.24]}
        isSelected={isSelected('forearms')}
        onToggle={onToggle}
      />

      {/* Abs — central core, 6 small boxes to suggest six-pack */}
      {[
        [-0.22, 1.55, 0.4], [0.22, 1.55, 0.4],
        [-0.22, 1.15, 0.4], [0.22, 1.15, 0.4],
        [-0.22, 0.75, 0.4], [0.22, 0.75, 0.4],
      ].map((pos, i) => (
        <Muscle
          key={`ab-${i}`}
          group="abs"
          position={pos}
          scale={[0.18, 0.17, 0.16]}
          shape="box"
          isSelected={isSelected('abs')}
          onToggle={onToggle}
        />
      ))}

      {/* Glutes — back of pelvis */}
      <Muscle
        group="glutes"
        position={[-0.3, 0.1, -0.45]}
        scale={[0.4, 0.38, 0.32]}
        isSelected={isSelected('glutes')}
        onToggle={onToggle}
      />
      <Muscle
        group="glutes"
        position={[0.3, 0.1, -0.45]}
        scale={[0.4, 0.38, 0.32]}
        isSelected={isSelected('glutes')}
        onToggle={onToggle}
      />

      {/* Quads — front of upper legs */}
      <Muscle
        group="quads"
        position={[-0.4, -0.9, 0.3]}
        scale={[0.35, 0.62, 0.3]}
        isSelected={isSelected('quads')}
        onToggle={onToggle}
      />
      <Muscle
        group="quads"
        position={[0.4, -0.9, 0.3]}
        scale={[0.35, 0.62, 0.3]}
        isSelected={isSelected('quads')}
        onToggle={onToggle}
      />

      {/* Hamstrings — back of upper legs */}
      <Muscle
        group="hamstrings"
        position={[-0.4, -0.9, -0.3]}
        scale={[0.33, 0.62, 0.28]}
        isSelected={isSelected('hamstrings')}
        onToggle={onToggle}
      />
      <Muscle
        group="hamstrings"
        position={[0.4, -0.9, -0.3]}
        scale={[0.33, 0.62, 0.28]}
        isSelected={isSelected('hamstrings')}
        onToggle={onToggle}
      />

      {/* Calves — back of lower legs */}
      <Muscle
        group="calves"
        position={[-0.4, -2.5, -0.25]}
        scale={[0.28, 0.55, 0.25]}
        isSelected={isSelected('calves')}
        onToggle={onToggle}
      />
      <Muscle
        group="calves"
        position={[0.4, -2.5, -0.25]}
        scale={[0.28, 0.55, 0.25]}
        isSelected={isSelected('calves')}
        onToggle={onToggle}
      />
    </group>
  )
}

/**
 * Slow auto-rotation when the user isn't interacting — gives the body
 * a subtle living presence. OrbitControls overrides this on drag.
 */
function SceneContent({ selected, onToggle }) {
  const groupRef = useRef()

  return (
    <group ref={groupRef}>
      {/* Lighting — key + fill + rim */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[4, 6, 5]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-4, 2, -3]} intensity={0.6} color="#ff4a4a" />
      <pointLight position={[0, 4, 4]} intensity={0.8} color="#ffaa66" />

      <Skeleton />
      <MuscleGroups selected={selected} onToggle={onToggle} />
    </group>
  )
}

export default function MuscleBody({ selected, onToggle }) {
  return (
    <Canvas
      camera={{ position: [0, 1, 7], fov: 45 }}
      shadows={false}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <SceneContent selected={selected} onToggle={onToggle} />
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={4}
        maxDistance={12}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={(Math.PI * 3) / 4}
        target={[0, 0.8, 0]}
      />
    </Canvas>
  )
}
