'use client'
/*
 * MuscleBody — loads one of four GLB models and overlays muscle hitboxes.
 *
 * Models (selected via the `modelKey` prop from the parent):
 *   - goku      : Rigged & Animated Goku (Sketchfab, CC-BY)
 *   - gokuSSJ   : Super Saiyan Goku variant
 *   - gohan     : Gohan variant
 *   - anatomy   : Anatomical muscle reference body
 *
 * Each model has its own calibration entry (scale, rotation, hitbox
 * offsets). The hitboxes are invisible until hovered or selected. Click
 * to toggle; selected hitboxes glow red with emissive material.
 */
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Center } from '@react-three/drei'
import { Suspense, useRef, useState, useMemo } from 'react'
import * as THREE from 'three'

// Preload all four models so switching between them is instant
useGLTF.preload('/models/goku.glb')
useGLTF.preload('/models/super_saiyan_goku.glb')
useGLTF.preload('/models/gohan.glb')
useGLTF.preload('/models/muscle_body.glb')

// ── Per-model calibration ────────────────────────────────────────
// Each entry defines: file path, display scale, extra rotation, and
// per-muscle hitbox positions/scales. Tuning these is iterative — if
// a given model's hitboxes don't align, tweak that model's entry.
// Target height in scene units — every model is auto-normalized to this.
// If a particular model needs fine-tuning after normalization, add an
// optional `scaleMult` (default 1.0) to that model's config.
const TARGET_HEIGHT = 4.0

const MODELS = {
  goku: {
    path: '/models/goku.glb',
    rotationY: Math.PI,
    scaleMult: 1.0,
    hitboxes: buildStandardHitboxes({ bodyScale: 1.0 }),
  },
  gokuSSJ: {
    path: '/models/super_saiyan_goku.glb',
    rotationY: Math.PI,
    scaleMult: 1.0,
    hitboxes: buildStandardHitboxes({ bodyScale: 1.0 }),
  },
  gohan: {
    path: '/models/gohan.glb',
    rotationY: Math.PI,
    scaleMult: 1.0,
    hitboxes: buildStandardHitboxes({ bodyScale: 1.0 }),
  },
  anatomy: {
    path: '/models/muscle_body.glb',
    rotationY: 0,
    scaleMult: 1.0,
    hitboxes: buildStandardHitboxes({ bodyScale: 1.0 }),
  },
}

// ── Standard hitbox layout — shared starting point for every model ──
// Tuned for a model at scale 2.5 after <Center>, facing the camera.
// Per-model overrides can adjust by passing a bodyScale multiplier.
function buildStandardHitboxes({ bodyScale = 1.0 }) {
  const s = bodyScale
  return [
    // CHEST — two pec ellipsoids
    { group: 'chest', position: [-0.45 * s, 1.6 * s, 0.55 * s], scale: [0.55 * s, 0.4 * s, 0.32 * s] },
    { group: 'chest', position: [ 0.45 * s, 1.6 * s, 0.55 * s], scale: [0.55 * s, 0.4 * s, 0.32 * s] },

    // SHOULDERS
    { group: 'shoulders', position: [-1.15 * s, 1.85 * s, 0.05 * s], scale: [0.45 * s, 0.42 * s, 0.45 * s] },
    { group: 'shoulders', position: [ 1.15 * s, 1.85 * s, 0.05 * s], scale: [0.45 * s, 0.42 * s, 0.45 * s] },

    // BICEPS
    { group: 'biceps', position: [-1.25 * s, 1.4 * s, 0.35 * s], scale: [0.3 * s, 0.5 * s, 0.28 * s] },
    { group: 'biceps', position: [ 1.25 * s, 1.4 * s, 0.35 * s], scale: [0.3 * s, 0.5 * s, 0.28 * s] },

    // TRICEPS
    { group: 'triceps', position: [-1.25 * s, 1.4 * s, -0.3 * s], scale: [0.3 * s, 0.5 * s, 0.28 * s] },
    { group: 'triceps', position: [ 1.25 * s, 1.4 * s, -0.3 * s], scale: [0.3 * s, 0.5 * s, 0.28 * s] },

    // FOREARMS
    { group: 'forearms', position: [-1.55 * s, 0.45 * s, 0.15 * s], scale: [0.27 * s, 0.45 * s, 0.27 * s] },
    { group: 'forearms', position: [ 1.55 * s, 0.45 * s, 0.15 * s], scale: [0.27 * s, 0.45 * s, 0.27 * s] },

    // ABS — six-pack
    { group: 'abs', shape: 'box', position: [-0.2 * s, 1.0 * s, 0.55 * s], scale: [0.18 * s, 0.16 * s, 0.16 * s] },
    { group: 'abs', shape: 'box', position: [ 0.2 * s, 1.0 * s, 0.55 * s], scale: [0.18 * s, 0.16 * s, 0.16 * s] },
    { group: 'abs', shape: 'box', position: [-0.2 * s, 0.65 * s, 0.55 * s], scale: [0.18 * s, 0.16 * s, 0.16 * s] },
    { group: 'abs', shape: 'box', position: [ 0.2 * s, 0.65 * s, 0.55 * s], scale: [0.18 * s, 0.16 * s, 0.16 * s] },
    { group: 'abs', shape: 'box', position: [-0.2 * s, 0.3 * s, 0.55 * s], scale: [0.18 * s, 0.16 * s, 0.16 * s] },
    { group: 'abs', shape: 'box', position: [ 0.2 * s, 0.3 * s, 0.55 * s], scale: [0.18 * s, 0.16 * s, 0.16 * s] },

    // GLUTES
    { group: 'glutes', position: [-0.32 * s, -0.4 * s, -0.45 * s], scale: [0.4 * s, 0.38 * s, 0.32 * s] },
    { group: 'glutes', position: [ 0.32 * s, -0.4 * s, -0.45 * s], scale: [0.4 * s, 0.38 * s, 0.32 * s] },

    // QUADS
    { group: 'quads', position: [-0.4 * s, -1.05 * s, 0.4 * s], scale: [0.36 * s, 0.6 * s, 0.3 * s] },
    { group: 'quads', position: [ 0.4 * s, -1.05 * s, 0.4 * s], scale: [0.36 * s, 0.6 * s, 0.3 * s] },

    // HAMSTRINGS
    { group: 'hamstrings', position: [-0.4 * s, -1.05 * s, -0.4 * s], scale: [0.34 * s, 0.6 * s, 0.28 * s] },
    { group: 'hamstrings', position: [ 0.4 * s, -1.05 * s, -0.4 * s], scale: [0.34 * s, 0.6 * s, 0.28 * s] },

    // CALVES
    { group: 'calves', position: [-0.42 * s, -2.55 * s, -0.3 * s], scale: [0.3 * s, 0.55 * s, 0.27 * s] },
    { group: 'calves', position: [ 0.42 * s, -2.55 * s, -0.3 * s], scale: [0.3 * s, 0.55 * s, 0.27 * s] },
  ]
}

// ── Color palette ──
const SELECTED_COLOR    = '#ff2a36'
const SELECTED_EMISSIVE = '#d4181f'
const HOVER_COLOR       = '#a8421e'

// ── One hitbox — clickable semi-transparent overlay ──
function Hitbox({ group, position, scale, shape = 'sphere', isSelected, onToggle }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame(() => {
    if (!meshRef.current) return
    if (isSelected) {
      const t = Date.now() * 0.003
      const pulse = 1 + Math.sin(t) * 0.05
      meshRef.current.scale.set(scale[0] * pulse, scale[1] * pulse, scale[2] * pulse)
    } else {
      meshRef.current.scale.set(scale[0], scale[1], scale[2])
    }
  })

  const opacity = isSelected ? 0.82 : (hovered ? 0.32 : 0.0)
  const color = isSelected ? SELECTED_COLOR : HOVER_COLOR
  const emissive = isSelected ? SELECTED_EMISSIVE : '#3a0a0c'
  const emissiveIntensity = isSelected ? 1.5 : (hovered ? 0.5 : 0)

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={(e) => { e.stopPropagation(); onToggle(group) }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
    >
      {shape === 'box'
        ? <boxGeometry args={[1, 1, 1]} />
        : <sphereGeometry args={[1, 24, 24]} />
      }
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={0.5}
        metalness={0.15}
        transparent
        opacity={opacity}
        depthWrite={isSelected}
      />
    </mesh>
  )
}

// ── The displayed model — re-mounts when modelKey changes ──
//
// Auto-normalizes scale by walking visible meshes (skipping bones/joints
// whose world positions may extend far beyond the actual geometry), then
// computing the union bounding box and scaling so the largest dimension
// matches TARGET_HEIGHT. An optional per-model `scaleMult` multiplier
// fine-tunes from there.
function ModelDisplay({ modelKey }) {
  const config = MODELS[modelKey] || MODELS.goku
  const { scene } = useGLTF(config.path)
  const cloned = useMemo(() => scene.clone(true), [scene])

  const normalizedScale = useMemo(() => {
    // Make sure world matrices are up to date before measuring
    cloned.updateMatrixWorld(true)

    // Compute a bounding box from visible meshes only (skip bones)
    const box = new THREE.Box3()
    let first = true
    cloned.traverse((obj) => {
      if (obj.isMesh || obj.isSkinnedMesh) {
        const meshBox = new THREE.Box3().setFromObject(obj)
        if (first) { box.copy(meshBox); first = false }
        else       { box.union(meshBox) }
      }
    })
    if (first) return 1  // no meshes found, fall back

    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    if (maxDim === 0) return 1

    return (TARGET_HEIGHT / maxDim) * (config.scaleMult ?? 1)
  }, [cloned, config.scaleMult])

  return (
    <Center disableY={false}>
      <primitive
        object={cloned}
        scale={normalizedScale}
        rotation={[0, config.rotationY, 0]}
      />
    </Center>
  )
}

function SceneContent({ modelKey, selected, onToggle }) {
  const config = MODELS[modelKey] || MODELS.goku

  return (
    <group>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 6]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-5, 3, -4]} intensity={0.7} color="#ff6644" />
      <pointLight position={[0, 5, 5]} intensity={0.8} color="#ffaa66" />
      <pointLight position={[0, -2, 4]} intensity={0.4} color="#4488ff" />

      <Suspense fallback={null}>
        {/* Key forces unmount/remount when switching models */}
        <ModelDisplay key={modelKey} modelKey={modelKey} />
      </Suspense>

      {/* Hitboxes — rebuilt per model, but live in world space */}
      {config.hitboxes.map((h, i) => (
        <Hitbox
          key={`${modelKey}-${h.group}-${i}`}
          group={h.group}
          position={h.position}
          scale={h.scale}
          shape={h.shape}
          isSelected={selected.has(h.group)}
          onToggle={onToggle}
        />
      ))}
    </group>
  )
}

export default function MuscleBody({ selected, onToggle, modelKey = 'goku' }) {
  return (
    <Canvas
      camera={{ position: [0, 1, 8], fov: 45 }}
      shadows={false}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <SceneContent modelKey={modelKey} selected={selected} onToggle={onToggle} />
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={5}
        maxDistance={14}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={(Math.PI * 3) / 4}
        target={[0, 0.6, 0]}
        autoRotate
        autoRotateSpeed={0.6}
      />
    </Canvas>
  )
}
