import React, { Suspense, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Stage, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

function Model() {
  // load the specific user-provided model from the project root (served at /)
  const group = useRef()
  const { scene, animations } = useGLTF('/robot_no.1_-_rigged_-_animated.glb')
  const { actions, names, mixer } = useAnimations(animations, group)

  useEffect(() => {
    if (!animations || !animations.length) {
      console.info('[RobotGLBViewer] no animations found in GLB')
      return
    }

  // animation details logging removed per user request

    if (!actions) return

    // Prefer an action named 'attack' (case-insensitive), otherwise use the first available animation
    const findAttack = (key) => key.toLowerCase() === 'attack'
    let attackAction = null
    for (const k of Object.keys(actions)) {
      if (findAttack(k)) { attackAction = actions[k]; break }
    }
    if (!attackAction && names && names.length) {
      attackAction = actions[names[0]]
    }

    if (attackAction) {
      // play once and clamp when finished so it holds final pose
      attackAction.reset()
      attackAction.setLoop(THREE.LoopOnce, 1)
      attackAction.clampWhenFinished = true
      attackAction.fadeIn(0.1)
      attackAction.play()
    }

    return () => {
      if (attackAction) {
        try { attackAction.fadeOut(0.1) } catch (e) {}
      }
      // clean up mixer if present
      if (mixer) mixer.stopAllAction()
    }
  }, [actions, names, mixer])

  return <primitive ref={group} object={scene} dispose={null} />
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
