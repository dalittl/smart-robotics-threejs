import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats, GizmoHelper, GizmoViewport } from '@react-three/drei'
import { Leva } from 'leva'
import Robot from './components/Robot'
import HUD from './components/HUD'

export default function App() {
  return (
    <div className="app">
      <Leva collapsed={false} />
      <Canvas camera={{ position: [3, 2, 5], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <Robot />
        <OrbitControls makeDefault />
        <GizmoHelper alignment="bottom-left" margin={[80, 80]}>
          <GizmoViewport axisColors={["#ff0000", "#00ff00", "#0000ff"]} labelColor="#ffffff" />
        </GizmoHelper>
        <Stats />
      </Canvas>
      <HUD />
    </div>
  )
}
