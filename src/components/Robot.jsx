import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import * as THREE from 'three'

function Limb({ length = 1, radius = 0.08, color = 'silver', rotation = [0, 0, 0] }) {
  return (
    <mesh rotation={rotation}>
      <cylinderGeometry args={[radius, radius, length, 18]} />
      <meshStandardMaterial color={color} metalness={0.7} roughness={0.2} />
    </mesh>
  )
}

export default function Robot() {
  const root = useRef()
  const arm = useRef()
  const head = useRef()

  const { idleSpeed, armYaw, armPitch, headTilt } = useControls('Robot', {
    idleSpeed: { value: 1, min: 0, max: 5, step: 0.1 },
    armYaw: { value: 0.5, min: -Math.PI, max: Math.PI, step: 0.01 },
    armPitch: { value: 0.3, min: -Math.PI / 2, max: Math.PI / 2, step: 0.01 },
    headTilt: { value: 0.1, min: -Math.PI/2, max: Math.PI/2, step: 0.01 }
  })

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime()
    root.current.rotation.y = Math.sin(t * 0.3 * idleSpeed) * 0.15
    arm.current.rotation.y = armYaw + Math.sin(t * 2.0 * idleSpeed) * 0.2
    arm.current.rotation.z = armPitch + Math.cos(t * 1.5 * idleSpeed) * 0.15
    head.current.rotation.x = headTilt + Math.sin(t * 1.2 * idleSpeed) * 0.08
  })

  return (
    <group ref={root} position={[0, -0.5, 0]}>
      {/* Body */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.2, 1.0, 0.6]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Head */}
      <group ref={head} position={[0, 1.05, 0]}>
        <mesh>
          <sphereGeometry args={[0.28, 32, 32]} />
          <meshStandardMaterial color="#e6eefc" metalness={0.2} roughness={0.4} />
        </mesh>
        <mesh position={[0.18, 0.02, 0.24]} rotation={[0, 0.3, 0]}>
          <boxGeometry args={[0.18, 0.08, 0.02]} />
          <meshStandardMaterial color="#000" />
        </mesh>
      </group>

      {/* Left Arm */}
      <group ref={arm} position={[-0.75, 0.55, 0]}>
        <Limb length={0.9} radius={0.07} color="#d1d5db" rotation={[0, 0, Math.PI/2]} />
        <mesh position={[0, -0.45, 0]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color="#111827" metalness={0.7} />
        </mesh>
        <mesh position={[0, -0.9, 0]}> 
          <boxGeometry args={[0.12, 0.12, 0.28]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
      </group>

      {/* Right Arm (static) */}
      <group position={[0.75, 0.55, 0]}>
        <Limb length={0.85} radius={0.07} color="#d1d5db" rotation={[0, 0, Math.PI/2]} />
        <mesh position={[0, -0.42, 0]}>
          <sphereGeometry args={[0.085, 16, 16]} />
          <meshStandardMaterial color="#111827" metalness={0.7} />
        </mesh>
      </group>

      {/* Legs */}
      <mesh position={[-0.3, -0.65, 0]}> 
        <boxGeometry args={[0.3, 0.6, 0.3]} />
        <meshStandardMaterial color="#0b1220" />
      </mesh>
      <mesh position={[0.3, -0.65, 0]}> 
        <boxGeometry args={[0.3, 0.6, 0.3]} />
        <meshStandardMaterial color="#0b1220" />
      </mesh>

      {/* Ground */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0, -1.05, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#061021" />
      </mesh>

      {/* Sensor ray (example of interaction) */}
      <mesh position={[0, 0.4, 0.35]}> 
        <coneGeometry args={[0.06, 0.25, 16]} />
        <meshStandardMaterial color="#ffeb3b" emissive="#ffeb3b" emissiveIntensity={0.6} />
        <primitive object={new THREE.Mesh(new THREE.CylinderGeometry(0.01,0.01,1,8), new THREE.MeshBasicMaterial({color:'#ffeb3b'}))} position={[0,-0.65,0]} rotation={[Math.PI/2,0,0]} />
      </mesh>
    </group>
  )
}
