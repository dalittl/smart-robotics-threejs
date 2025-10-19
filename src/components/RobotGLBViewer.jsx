import React, { Suspense, useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations, OrbitControls, Text, Html, useProgress } from '@react-three/drei'
import * as THREE from 'three'
// postprocessing (from three examples)
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'

// ModelLoader must be rendered only once the asset is confirmed present (useGLTF is a hook)
// Default camera snapshot (used when no saved camera is present)
const DEFAULT_CAMERA = {
  // using the user's requested snapshot (from their console logs)
  pos: [5.962, -0.982, 6.398],
  target: [0, 0, 0],
  // lock zoom: set minDistance to the same as the snapshot distance
  // snapshot distance logged: 8.801
  distance: 8.801,
  minDistance: 8.801,
  maxDistance: 22.078,
  fov: 45,
  near: 0.036797267645416,
  far: 1000,
}

function ModelLoader({ isDriving = false, driveSpeed = 1 }) {
  const group = useRef()
    // Choose model URL dynamically:
  // - during local development proxy /robot.glb through Vite dev server to avoid CORS
  // - in production use the public R2 URL
  const r2Url = 'https://pub-63db098fc98c4445b67e76b821321f72.r2.dev/robot.glb'
  // Use Vite's DEV flag so the local proxy is used in development regardless of hostname
  const modelUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV)
    ? '/robot.glb'
    : r2Url
  const { scene, animations } = useGLTF(modelUrl)
  const { actions, names } = useAnimations(animations, group)
  const controlsRef = useRef()
  const { camera } = useThree()
  const lastSaveRef = useRef(0)
  // tweak this to make the robots larger by default
  const MODEL_SCALE = 1.9

  useEffect(() => {
    if (!animations || !animations.length) return
    try {
      const first = names && names.length ? actions[names[0]] : null
      if (first) {
        first.reset()
        first.setLoop(THREE.LoopRepeat)
        first.play()
      }
    } catch (e) {}
  }, [actions, names, animations])

  // Auto-fit: center the model and move the camera back so the whole model is visible
  useEffect(() => {
    if (!scene || !group.current) return
    try {
      // Convert materials but preserve metalness/roughness/emissive values while
      // converting colors and diffuse textures to grayscale.
      const makeGrayscaleTexture = (map) => {
        if (!map || !map.image || typeof document === 'undefined') return null
        try {
          const img = map.image
          const width = img.width || img.naturalWidth || 512
          const height = img.height || img.naturalHeight || 512
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          const imageData = ctx.getImageData(0, 0, width, height)
          const data = imageData.data
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2]
            const l = 0.299 * r + 0.587 * g + 0.114 * b
            data[i] = data[i + 1] = data[i + 2] = l
          }
          ctx.putImageData(imageData, 0, 0)
          const tex = new THREE.CanvasTexture(canvas)
          tex.needsUpdate = true
          try { tex.wrapS = map.wrapS; tex.wrapT = map.wrapT; tex.repeat.copy(map.repeat); tex.offset.copy(map.offset); tex.encoding = map.encoding } catch (e) {}
          return tex
        } catch (e) {
          return null
        }
      }

      scene.traverse((node) => {
        if (!node.isMesh) return
        try {
          const oldMat = node.material
          const makeNew = (m) => {
            if (!m) return null
            const skinning = !!m.skinning
            const morphTargets = !!m.morphTargets
            const metalness = (typeof m.metalness !== 'undefined') ? m.metalness : 0
            const roughness = (typeof m.roughness !== 'undefined') ? m.roughness : 1
            // compute grayscale color from old color if present
            let colorVal = 0xffffff
            if (m.color) {
              const c = m.color
              const l = Math.round((0.299 * c.r + 0.587 * c.g + 0.114 * c.b) * 255)
              colorVal = (l << 16) | (l << 8) | l
            }

            const mat = new THREE.MeshStandardMaterial({ color: colorVal, metalness, roughness, skinning, morphTargets })

            // preserve maps where appropriate, but convert diffuse map to grayscale
            if (m.map) {
              const gray = makeGrayscaleTexture(m.map)
              if (gray) mat.map = gray
            }
            if (m.emissive) {
              // convert emissive color to grayscale luminance
              const e = m.emissive
              const l = (0.299 * e.r + 0.587 * e.g + 0.114 * e.b)
              mat.emissive = new THREE.Color(l, l, l)
              // stronger boost for bright emissive colors so whites glow more
              const baseIntensity = m.emissiveIntensity || 1
              // be more aggressive: lower threshold and increase multiplier,
              // but clamp to avoid extreme values
              if (l > 0.6) {
                mat.emissiveIntensity = Math.min(12, baseIntensity * (2 + (l - 0.6) * 10))
              } else {
                mat.emissiveIntensity = baseIntensity
              }
            }
            // If the diffuse color is nearly white, make it slightly emissive as well
            if (m.color) {
              const cr = m.color.r, cg = m.color.g, cb = m.color.b
              const lum = 0.299 * cr + 0.587 * cg + 0.114 * cb
              if (lum > 0.6) {
                // add a stronger emissive boost derived from luminance
                // start boosting earlier and allow a larger cap for visibility
                const boost = Math.min(14.0, 1 + (lum - 0.6) * 18)
                const ecol = Math.min(1, lum * 1.2)
                mat.emissive = mat.emissive || new THREE.Color(ecol, ecol, ecol)
                mat.emissiveIntensity = Math.max(mat.emissiveIntensity || 0, boost)
              }
            }
            // preserve metalness/roughness maps and normal/ao maps
            if (m.metalnessMap) mat.metalnessMap = m.metalnessMap
            if (m.roughnessMap) mat.roughnessMap = m.roughnessMap
            if (m.normalMap) mat.normalMap = m.normalMap
            if (m.aoMap) mat.aoMap = m.aoMap
            if (m.side) mat.side = m.side
            mat.needsUpdate = true
            return mat
          }

          if (Array.isArray(oldMat)) {
            node.material = oldMat.map(makeNew)
          } else {
            node.material = makeNew(oldMat) || oldMat
          }
          // enable shadows on meshes so the spotlight can cast onto/around them
          try {
            node.castShadow = true
            node.receiveShadow = true
          } catch (e) {}
        } catch (e) {
          // ignore per-node errors
        }
      })
      // compute bounding box, size and center first (we still want to position/scale the model)
      const box = new THREE.Box3().setFromObject(scene)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())

      // move the model so its center is at the group's origin
      group.current.position.set(-center.x, -center.y, -center.z)
      // scale the whole model up for a bigger visual
      group.current.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE)

      // If the user previously saved a camera angle, restore it instead of auto-fitting.
      try {
        const raw = typeof window !== 'undefined' && window.localStorage ? localStorage.getItem('robotCamera') : null
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed && parsed.pos && parsed.target && controlsRef.current) {
            camera.position.fromArray(parsed.pos)
            controlsRef.current.target.fromArray(parsed.target)
            // set reasonable near/far based on distance
            const pdist = camera.position.distanceTo(controlsRef.current.target)
            camera.near = Math.max(0.01, pdist / 100)
            camera.far = Math.max(1000, pdist * 100)
            camera.updateProjectionMatrix()
            // Allow some zoom-in even when restoring a saved view: set minDistance to a
            // fraction of the saved distance (25%) so users can still zoom closer.
            controlsRef.current.minDistance = Math.max(0.01, pdist * 0.25)
            controlsRef.current.maxDistance = Math.max(2, pdist * 6)
            controlsRef.current.update()
            return
          }
        }
      } catch (e) {
        // ignore storage parse errors and fall back to auto-fit
      }

      // If there's no saved camera, apply DEFAULT_CAMERA (so the viewer starts at a known pose)
      try {
        if (typeof window !== 'undefined' && !localStorage.getItem('robotCamera') && controlsRef.current && DEFAULT_CAMERA) {
          // apply the user-provided default snapshot
          if (Array.isArray(DEFAULT_CAMERA.pos)) camera.position.fromArray(DEFAULT_CAMERA.pos)
          if (Array.isArray(DEFAULT_CAMERA.target)) controlsRef.current.target.fromArray(DEFAULT_CAMERA.target)
          if (typeof DEFAULT_CAMERA.fov === 'number') camera.fov = DEFAULT_CAMERA.fov
          if (typeof DEFAULT_CAMERA.near === 'number') camera.near = DEFAULT_CAMERA.near
          if (typeof DEFAULT_CAMERA.far === 'number') camera.far = DEFAULT_CAMERA.far
          camera.updateProjectionMatrix()
          // Lock zoom: use the provided snapshot distance (or compute it)
          const pdist = typeof DEFAULT_CAMERA.distance === 'number'
            ? DEFAULT_CAMERA.distance
            : camera.position.distanceTo(controlsRef.current.target)
          controlsRef.current.minDistance = typeof DEFAULT_CAMERA.minDistance === 'number' ? DEFAULT_CAMERA.minDistance : pdist
          // keep a reasonable maxDistance but allow some zoom-out
          controlsRef.current.maxDistance = typeof DEFAULT_CAMERA.maxDistance === 'number' ? DEFAULT_CAMERA.maxDistance : Math.max(6, pdist * 3)
          controlsRef.current.update()
          return
        }
      } catch (e) {
        // ignore and fall back to auto-fit
      }

      // compute a camera distance that fits the model
  const maxDim = Math.max(size.x, size.y, size.z)
  const fov = (camera.fov * Math.PI) / 180
      // Use a slightly larger multiplier so the camera sits a bit farther back by default
      // this helps ensure models aren't clipped or too close to the camera
      const distance = Math.abs(maxDim / (2 * Math.tan(fov / 2))) * 1.05 / MODEL_SCALE

      // place camera slightly above center to give better framing
            camera.position.set(0, Math.max(size.y * 0.5 * MODEL_SCALE, 0.5), distance)
      camera.near = Math.max(0.1, distance / 100)
      camera.far = Math.max(1000, distance * 100)
      camera.updateProjectionMatrix()

      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0)
        // Allow users to zoom in closer than the fitted distance but prevent clipping.
        // Set minDistance to a fraction of the fitted distance (25%). Users can still
        // zoom out to a wider range.
        controlsRef.current.minDistance = Math.max(0.01, distance * 0.25)
        // widen the allowed zoom-out range so users can explore further away
        controlsRef.current.maxDistance = Math.max(6, distance * 6)
        controlsRef.current.update()
      }

      // compute a ground Y position under the model so a plane can sit beneath it
      try {
        const groundY = (-size.y * MODEL_SCALE) / 2 - 0.02
        // store on the group node so the render path can pick it up (safe shortcut)
        // attach a custom property; the ground mesh will read scene.userData.groundY if present
            if (scene && typeof scene.userData === 'object') {
              scene.userData.groundY = groundY
              // compute a reasonable label Y above the model (half model height + small offset)
              try {
                const labelY = Math.max((size.y * MODEL_SCALE) / 2 + 0.6, groundY + 1.4)
                scene.userData.labelY = labelY
              } catch (e) {}
            }
      } catch (e) {}
    } catch (e) {
      // silently ignore bounding-box errors
    }
  }, [scene, camera])

  // Drive the model forward along its local -Z axis when requested
  useFrame((_, delta) => {
    try {
      if (isDriving && group.current) {
        // translateZ moves along local Z; negative Z is forward in GLTF convention
        group.current.translateZ(-driveSpeed * delta)
      }
    } catch (e) {}
  })

  // Drive the model forward along its local -Z axis when requested
  useFrame((_, delta) => {
    try {
      if (isDriving && group.current) {
        // translateZ moves along local Z; negative Z is forward in GLTF convention
        group.current.translateZ(-driveSpeed * delta)
      }
    } catch (e) {}
  })

  return (
    <>
      <primitive ref={group} object={scene} dispose={null} />
      {/* 3D label: "Apollo Eve". The labelY is computed from scene.userData.labelY (set during auto-fit) */}
      {scene && scene.userData ? (
        <ModelLabel labelY={scene.userData.labelY || (scene.userData.groundY || 0) + 1.4} />
      ) : null}
      {/* ground plane placed under the model based on computed scene.userData.groundY */}
      {scene && scene.userData && typeof scene.userData.groundY === 'number' ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, scene.userData.groundY, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#070707" metalness={0} roughness={0.9} />
        </mesh>
      ) : null}
      {/* OrbitControls placed here so the controls target can be updated when the model is fitted */}
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        onChange={() => {
          try {
            const pos = camera.position
            const tgt = controlsRef.current ? controlsRef.current.target : null
            const dist = tgt ? pos.distanceTo(tgt) : pos.length()
            // gather zoom / camera settings
            const minD = controlsRef.current ? controlsRef.current.minDistance : undefined
            const maxD = controlsRef.current ? controlsRef.current.maxDistance : undefined
            const fov = camera.fov
            const near = camera.near
            const far = camera.far
            // OrbitControls provides helpers for angles
            const polar = controlsRef.current && typeof controlsRef.current.getPolarAngle === 'function' ? controlsRef.current.getPolarAngle() : undefined
            const azim = controlsRef.current && typeof controlsRef.current.getAzimuthalAngle === 'function' ? controlsRef.current.getAzimuthalAngle() : undefined

            console.debug('[RobotGLBViewer] camera distance:', dist.toFixed(3),
              'pos:', pos.toArray().map(n => n.toFixed(3)),
              'target:', tgt ? tgt.toArray().map(n => n.toFixed(3)) : null,
              'minDistance:', (minD !== undefined ? minD.toFixed(3) : 'n/a'),
              'maxDistance:', (maxD !== undefined ? maxD.toFixed(3) : 'n/a'),
              'fov:', fov, 'near:', near, 'far:', far,
              'polar:', polar !== undefined ? polar.toFixed(3) : 'n/a',
              'azimuthal:', azim !== undefined ? azim.toFixed(3) : 'n/a')

            // Throttle saves to localStorage to ~1 per 250ms
            const now = Date.now()
            if (now - lastSaveRef.current > 250) {
              lastSaveRef.current = now
              try {
                if (typeof window !== 'undefined' && window.localStorage && tgt) {
                  const payload = { pos: pos.toArray(), target: tgt.toArray() }
                  localStorage.setItem('robotCamera', JSON.stringify(payload))
                }
              } catch (e) {
                // ignore storage write errors
              }
            }
          } catch (e) {}
        }}
      />

    </>
  )
}

// Renders an ASCII post-effect on top of the canvas. It creates the AsciiEffect,
// appends its DOM element to the canvas container and renders it each frame.

function Model({ onStatusChange }) {
  const [status, setStatus] = useState('checking') // 'checking' | 'ok' | 'missing'
  // allow parent to be notified of status changes via a prop
  // (we'll accept an onStatusChange prop when Model is used)

  useEffect(() => {
    let cancelled = false
    // Use the same modelUrl selection as ModelLoader so production uses the R2 URL
    const r2Url = 'https://pub-63db098fc98c4445b67e76b821321f72.r2.dev/robot.glb'
    const url = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) ? '/robot.glb' : r2Url
    // Try to fetch only headers (HEAD) first. Some servers disallow HEAD; fallback to GET range.
    fetch(url, { method: 'HEAD' })
      .then((res) => {
        if (cancelled) return
        const ct = res.headers.get('content-type') || ''
        if (ct.includes('text/html')) {
          setStatus('missing')
          if (typeof onStatusChange === 'function') onStatusChange('missing')
          return
        }
        if (res.ok) {
          setStatus('ok')
          if (typeof onStatusChange === 'function') onStatusChange('ok')
          return
        }
        setStatus('missing')
        if (typeof onStatusChange === 'function') onStatusChange('missing')
        return
      })
      .catch(() => {
        // HEAD may be blocked; try a small GET range
        fetch(url, { method: 'GET', headers: { Range: 'bytes=0-255' } })
          .then((r) => {
            if (cancelled) return
            const ct2 = r.headers.get('content-type') || ''
            if (ct2.includes('text/html')) {
              setStatus('missing')
              if (typeof onStatusChange === 'function') onStatusChange('missing')
              return
            }
            if (r.ok) {
              setStatus('ok')
              if (typeof onStatusChange === 'function') onStatusChange('ok')
              return
            }
            setStatus('missing')
            if (typeof onStatusChange === 'function') onStatusChange('missing')
            return
          })
          .catch(() => { if (!cancelled) { setStatus('missing'); if (typeof onStatusChange === 'function') onStatusChange('missing') } })
      })

    return () => { cancelled = true }
  }, [])

  if (status === 'checking') return null
  if (status === 'missing') {
    // Render a visible placeholder and log to the console so it's obvious why the
    // model isn't appearing in the UI. This avoids silent failures.
    if (typeof console !== 'undefined') {
      console.warn('[RobotGLBViewer] robot.glb not found at /robot.glb.\n' +
        'Place the file in the project `public/` folder or update the path in `RobotGLBViewer.jsx`.')
    }

    // Use <Html> so we don't render raw DOM directly under the R3F <Canvas>
    return (
      <Html center>
        <div className="robot-glb-missing" style={{color: '#666', textAlign: 'center', background: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 6}}>
          <div style={{fontSize: 12}}>3D model not found</div>
          <div style={{fontSize: 11}}>Expecting <code>/robot.glb</code> in the dev server root (public/)</div>
        </div>
      </Html>
    )
  }

  return <ModelLoader />
}

// ProgressTracker: uses drei's useProgress inside the R3F tree and reports
// active state upward so the UI can hide the spinner when loading completes.
function ProgressTracker({ onActiveChange }) {
  const { active } = useProgress()
  useEffect(() => { if (typeof onActiveChange === 'function') onActiveChange(active) }, [active, onActiveChange])
  return null
}

function LoaderOverlay({ timedOut = false }) {
  return (
    <div className="loader-overlay" role="status" aria-live="polite">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" aria-hidden="true"></div>
        {timedOut ? <div style={{ color: '#fff', marginTop: 12, fontSize: 14 }}>Still loading — please try again or check your connection.</div> : null}
      </div>
    </div>
  )
}

export default function RobotGLBViewer({ className = '' }){
  const [intensity, setIntensity] = useState(3.2)
  const [height, setHeight] = useState(8)
  const [posX, setPosX] = useState(0)
  const [posZ, setPosZ] = useState(0)
  const [angle, setAngle] = useState(Math.PI / 10)
  const [penumbra, setPenumbra] = useState(0.2)
  const [isLoading, setIsLoading] = useState(true)
  const [r3fActive, setR3fActive] = useState(false)
  const [modelStatus, setModelStatus] = useState('checking')
  const [timedOut, setTimedOut] = useState(false)
  const [isDriving, setIsDriving] = useState(false)
  const [driveSpeed, setDriveSpeed] = useState(1.2)

  // When R3F is not active (no in-flight assets) and the model check has
  // finished (ok or missing), hide the loader overlay.
  useEffect(() => {
    if (!r3fActive && (modelStatus === 'ok' || modelStatus === 'missing')) setIsLoading(false)
    else setIsLoading(true)
  }, [r3fActive, modelStatus])

  // Safety timeout: if still loading after 20s, hide spinner and mark timedOut
  useEffect(() => {
    let t = null
    if (isLoading) {
      setTimedOut(false)
      t = setTimeout(() => { setIsLoading(false); setTimedOut(true) }, 20000)
    }
    return () => { if (t) clearTimeout(t) }
  }, [isLoading])

  return (
    <div className={`robot-glb-viewer ${className}`}>
  <Canvas shadows gl={{ alpha: true }} camera={{ position: [0, 1.2, 2.5], fov: 45 }}>
        {/* Slightly brighter environment lights to make models more visible */}
        <ambientLight intensity={1.0} />
        <directionalLight position={[2, 4, 2]} intensity={1.0} castShadow />
        {/* Spotlight above the model (controlled by overlay) */}
        <SpotLightAbove intensity={intensity} height={height} posX={posX} posZ={posZ} angle={angle} penumbra={penumbra} />
        <Suspense fallback={null}>
          <Model onStatusChange={(s) => setModelStatus(s)} isDriving={isDriving} driveSpeed={driveSpeed} />
        </Suspense>
        {/* ProgressTracker runs inside the R3F tree and reports loading state */}
        <ProgressTracker onActiveChange={(a) => setR3fActive(!!a)} />
        {/* ground plane is rendered inside the loaded model so it follows model bounds */}
        {/* Slight bloom post-processing to make emissive parts glow softly */}
        {/* Reduced bloom: subtle glow on emissive areas */}
        <PostProcessing strength={0.09} radius={0.12} threshold={0.96} />
      </Canvas>
      {/* Spotlight controls hidden by request. To re-enable, render <SpotlightControlsOverlay /> here. */}

  {/* LoaderOverlay shown while R3F is loading assets or model check is pending */}
  {isLoading ? <LoaderOverlay timedOut={timedOut} /> : null}

  {/* Simple drive controls */}
  <div style={{ position: 'fixed', left: 12, bottom: 12, zIndex: 4000, display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 8 }}>
    <button onClick={() => setIsDriving(d => !d)} style={{ padding: '8px 12px', background: isDriving ? '#d33' : '#1a1', color: '#fff', border: 'none', borderRadius: 6 }}>
      {isDriving ? 'Stop' : 'Drive'}
    </button>
    <label style={{ color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
      Speed
      <input type="range" min="0.2" max="4" step="0.1" value={driveSpeed} onChange={(e) => setDriveSpeed(parseFloat(e.target.value))} />
    </label>
  </div>
    </div>
  )
}

function PostProcessing({ strength = 0.18, radius = 0.2, threshold = 0.92 }) {
  const composerRef = useRef()
  const { gl, scene, camera, size } = useThree()

  useEffect(() => {
    if (!gl) return
    const composer = new EffectComposer(gl)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(size.width, size.height), strength, radius, threshold)
    composer.addPass(bloomPass)

    composerRef.current = composer

    // keep composer sized correctly
    composer.setSize(size.width, size.height)

    return () => {
      try { composer.dispose() } catch (e) {}
      composerRef.current = null
    }
  }, [gl, scene, camera, size.width, size.height, strength, radius, threshold])

  // render the composer each frame after the scene renders
  useFrame((_, delta) => {
    if (composerRef.current) {
      try {
        composerRef.current.render(delta)
      } catch (e) {}
    }
  }, 1)

  return null
}

function SpotLightAbove({ intensity = 3.2, height = 8, posX = 0, posZ = 0, angle = Math.PI / 10, penumbra = 0.2 }) {
  const ref = useRef()
  const { scene } = useThree()

  // ensure the light.target is part of the scene so lookAt works correctly
  useEffect(() => {
    if (!ref.current || !scene) return
    const target = ref.current.target
    if (target && !scene.children.includes(target)) {
      scene.add(target)
    }
    return () => {
      try {
        if (target && scene && scene.children.includes(target)) scene.remove(target)
      } catch (e) {}
    }
  }, [scene])

  useFrame(() => {
    if (!ref.current) return
    // position above the model center and point towards origin (or the model center)
    ref.current.position.set(posX, height, posZ)
    ref.current.target.position.set(0, 0, 0)
    // ensure parameters are applied each frame
    ref.current.intensity = intensity
    ref.current.angle = angle
    ref.current.penumbra = penumbra
  })

  return (
    <spotLight
      ref={ref}
      castShadow
      intensity={intensity}
      color={0xffffff}
      position={[posX, height, posZ]}
      angle={angle}
      penumbra={penumbra}
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-bias={-0.0005}
    />
  )
}

function ModelLabel({ labelY = 1.4 }) {
  // stable emissive material for the 'Eve' word
  const eveMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#fff', metalness: 0.1, roughness: 0.2 })
    m.emissive = new THREE.Color(0.95, 0.8, 0.5)
    m.emissiveIntensity = 3.2
    return m
  }, [])

  // Move the label up by ~20 screen pixels. We compute a world-space offset
  // that corresponds to 20 device pixels at the label's current depth and
  // apply it each frame so the shift remains correct with camera changes.
  const groupRef = useRef()
  const { camera, size } = useThree()
  const PIXELS = 40

  // reusable temp vectors to avoid allocations inside the frame loop
  const tmpWorld = useMemo(() => new THREE.Vector3(), [])
  const tmpNDC = useMemo(() => new THREE.Vector3(), [])
  const tmpShiftedNDC = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    if (!groupRef.current || !camera || !size) return
    try {
      // original world position of the group's origin
      tmpWorld.set(0, labelY, 0)
      // convert to NDC (normalized device coordinates)
      tmpNDC.copy(tmpWorld).project(camera)
      // shifting in screen pixels maps to a constant delta in NDC Y: 2 * pixels / height
      tmpShiftedNDC.set(tmpNDC.x, tmpNDC.y + (2 * PIXELS) / Math.max(1, size.height), tmpNDC.z)
      // unproject back to world coords
      tmpShiftedNDC.unproject(camera)
      // compute delta and apply only the Y component to preserve original X/Z
      const dy = tmpShiftedNDC.y - tmpWorld.y
      groupRef.current.position.set(0, labelY + dy, 0)
    } catch (e) {
      // noop on errors
    }
  })

  // Apollo uses default Text material
  return (
    <group ref={groupRef} position={[0, labelY, 0]}>
      <Text position={[0, 0.14, 0]} fontSize={0.55} lineHeight={0.9} letterSpacing={-0.02} color="#ddd" anchorX="center" anchorY="middle">Apollo</Text>
      <Text position={[0, -0.42, 0]} fontSize={0.85} letterSpacing={-0.02} color="#ffffff" anchorX="center" anchorY="middle" material={eveMat}>
        Eve
      </Text>
    </group>
  )
}

function SpotlightControlsOverlay({ intensity, setIntensity, height, setHeight, posX, setPosX, posZ, setPosZ, angle, setAngle, penumbra, setPenumbra }) {
  return (
    <div style={{ position: 'fixed', left: 12, top: 12, zIndex: 2000, background: 'rgba(0,0,0,0.55)', padding: 12, borderRadius: 8, color: '#fff', fontSize: 13, width: 220 }}>
      <div style={{ marginBottom: 8, fontWeight: 600 }}>Spotlight</div>
      <label style={{ display: 'block', marginBottom: 6 }}>Intensity: {intensity.toFixed(2)}</label>
      <input type="range" min="0" max="8" step="0.1" value={intensity} onChange={(e) => setIntensity(parseFloat(e.target.value))} style={{ width: '100%' }} />
      <label style={{ display: 'block', marginTop: 8 }}>Height: {height.toFixed(1)}</label>
      <input type="range" min="2" max="14" step="0.1" value={height} onChange={(e) => setHeight(parseFloat(e.target.value))} style={{ width: '100%' }} />
      <label style={{ display: 'block', marginTop: 8 }}>X: {posX.toFixed(1)}</label>
      <input type="range" min="-8" max="8" step="0.1" value={posX} onChange={(e) => setPosX(parseFloat(e.target.value))} style={{ width: '100%' }} />
      <label style={{ display: 'block', marginTop: 8 }}>Z: {posZ.toFixed(1)}</label>
      <input type="range" min="-8" max="8" step="0.1" value={posZ} onChange={(e) => setPosZ(parseFloat(e.target.value))} style={{ width: '100%' }} />
      <label style={{ display: 'block', marginTop: 8 }}>Angle: {angle.toFixed(2)}</label>
      <input type="range" min="0.05" max="1.2" step="0.01" value={angle} onChange={(e) => setAngle(parseFloat(e.target.value))} style={{ width: '100%' }} />
      <label style={{ display: 'block', marginTop: 8 }}>Penumbra: {penumbra.toFixed(2)}</label>
      <input type="range" min="0" max="1" step="0.01" value={penumbra} onChange={(e) => setPenumbra(parseFloat(e.target.value))} style={{ width: '100%' }} />
    </div>
  )
}

// Note: place `robot.glb` in the project's `public/` folder or ensure it's served at '/robot.glb'.
