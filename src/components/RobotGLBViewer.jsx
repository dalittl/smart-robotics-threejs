import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Stage } from '@react-three/drei'

function Model() {
  // load the specific user-provided model from the project root (served at /)
  const { scene } = useGLTF('/robot_no.1_-_rigged_-_animated.glb')
  return <primitive object={scene} dispose={null} />
}

export default function RobotGLBViewer({ className = '' }){
  return (
    <div className={`robot-glb-viewer ${className}`}>
      <Canvas gl={{ alpha: true }} style={{ background: 'transparent' }} camera={{ position: [0, 1.2, 3], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 7]} intensity={1} />
        <Suspense fallback={null}>
          <Stage intensity={0.7} environment="city">
            <Model />
          </Stage>
        </Suspense>
        <OrbitControls enablePan={true} enableZoom={true} />
      </Canvas>
    </div>
  )
}

// Note: ensure the file `robot_no.1_-_rigged_-_animated.glb` exists at the project root or in /public so it's reachable at '/robot_no.1_-_rigged_-_animated.glb'.
