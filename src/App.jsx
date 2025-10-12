import React from 'react'
import RobotGLBViewer from './components/RobotGLBViewer'

export default function App() {
  return (
    <div className="site blank-page">
      {/* Hero center headline */}
      <main className="hero-center">
        <div className="hero-inner">
          <h1>We build robots!</h1>
          <p className="hero-sublabel">coming soon 2026....</p>
        </div>
        <RobotGLBViewer />
      </main>
    </div>
  )
}
