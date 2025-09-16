import React from 'react'

export default function HUD() {
  return (
    <div className="hud">
      <h3>Smart Robotics — Controls</h3>
      <div style={{fontSize:12}}>Use mouse to orbit. Leva panel controls robot parameters.</div>
      <div style={{marginTop:8}}>
        <a className="btn" href="https://threejs.org/" target="_blank" rel="noreferrer">Three.js</a>
        <a className="btn" href="https://docs.pmnd.rs/react-three-fiber/" target="_blank" rel="noreferrer">r3f Docs</a>
      </div>
    </div>
  )
}
