import React from 'react'
import RobotGLBViewer from './components/RobotGLBViewer'

export default function App() {
  return (
    <div className="site blank-page">
      {/* Hero center headline */}
      <main className="hero-center">
        {/* Hero text hidden per request - comment out to keep markup for later */}
        {/*
        <div className="hero-inner">
          <h1>We build robots!</h1>
          <p className="hero-sublabel">coming soon 2026....</p>
        </div>
        */}
      </main>
      {/* place the viewer as a top-level child so its fixed/fullscreen styles reference the viewport */}
      <RobotGLBViewer />
    </div>
  )
}
