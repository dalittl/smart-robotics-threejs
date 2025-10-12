import React, { Suspense, useRef, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Stage, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

// ModelLoader calls useGLTF (must be rendered only when the asset is confirmed available)
function ModelLoader() {
  const group = useRef()
  const { scene, animations } = useGLTF('/robot_no.1_-_rigged_-_animated.glb')
  const { actions, names, mixer } = useAnimations(animations, group)

  useEffect(() => {
    if (!animations || !animations.length) {
      console.info('[RobotGLBViewer] no animations found in GLB')
      return
    }

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

// Model performs a lightweight fetch preflight to check the asset exists and is binary (not HTML)
function Model() {
  const [status, setStatus] = useState('checking') // 'checking' | 'ok' | 'missing'

  useEffect(() => {
    let cancelled = false
    const url = '/robot_no.1_-_rigged_-_animated.glb'
    // fetch only the first few bytes (range) to detect HTML responses. Some hosts may not support Range; fall back to full fetch.
    fetch(url, { method: 'GET', headers: { Range: 'bytes=0-255' } })
      .then(async (res) => {
        if (cancelled) return
        const ct = res.headers.get('content-type') || ''
        // If the server returned HTML (e.g., a Pages 404), content-type may be text/html
        if (ct.includes('text/html')) {
          setStatus('missing')
          return
        }
        // If we got a 206 Partial Content or 200 OK and not HTML, assume ok
        if (res.ok) {
          setStatus('ok')
          return
        }
        setStatus('missing')
      })
      .catch(() => {
        if (!cancelled) setStatus('missing')
      })

    return () => { cancelled = true }
  }, [])

  if (status === 'checking') return null
  if (status === 'missing') {
    // Render a small placeholder so the page doesn't crash — keeps visual layout stable
    return (
      <group>
        {/* lightweight warning placeholder - not visible in production layout but useful for debugging */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.01, 0.01, 0.01]} />
          <meshBasicMaterial color="black" />
        </mesh>
      </group>
    )
  }

  return <ModelLoader />
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
