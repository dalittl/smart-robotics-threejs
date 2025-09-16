import React from 'react'

export default function About() {
  return (
    <section id="about" className="section about">
      <div className="container">
        <h2>About Smart Robotics</h2>
        <p>At Smart Robotics we combine state-of-the-art AI with robust mechanical design to build autonomous systems for industry and research. Our products include perception pipelines, motion planning, and integrated robotic platforms.</p>
        <div className="features">
          <div className="feature">
            <h3>Sensing & Perception</h3>
            <p>Real-time sensor fusion and perception models optimized for robotics.</p>
          </div>
          <div className="feature">
            <h3>Autonomy & Control</h3>
            <p>Proven control stacks for safe navigation and manipulation.</p>
          </div>
          <div className="feature">
            <h3>Integration & Support</h3>
            <p>Hardware integration, testing, and long-term support.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
