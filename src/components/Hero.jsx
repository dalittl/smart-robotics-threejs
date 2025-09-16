import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei'
import Robot from './Robot'

export default function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-inner">
        <div className="hero-copy">
          <h1>Smart Robotics — Autonomous systems for the real world</h1>
          <p>We design AI-driven robotic platforms and perception systems that power safe and efficient automation.</p>
          <div className="hero-ctas">
            <a className="btn primary" href="#contact">Get in touch</a>
            <a className="btn" href="#services">Our services</a>
          </div>
        </div>

        <div className="hero-canvas">
          <Canvas camera={{ position: [3, 2, 5], fov: 45 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            <Robot />
            <OrbitControls enablePan={false} enableZoom={true} />
            <GizmoHelper alignment="bottom-left" margin={[80, 80]}>
              <GizmoViewport axisColors={["#ff0000", "#00ff00", "#0000ff"]} labelColor="#ffffff" />
            </GizmoHelper>
          </Canvas>
        </div>
      </div>
    </section>
  )
}
