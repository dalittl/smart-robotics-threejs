import React from 'react'

const services = [
  { title: 'Custom robotic platforms', desc: 'End-to-end design and manufacturing of robots tailored to your use-case.' },
  { title: 'Perception & AI', desc: 'Deployment-ready perception stacks: 3D detection, tracking, and SLAM.' },
  { title: 'Simulation & Testing', desc: 'High-fidelity simulation pipelines and CI testing for robust releases.' },
  { title: 'Consulting & Integration', desc: 'From prototype to production: integration, testing, and training.' }
]

export default function Services() {
  return (
    <section id="services" className="section services">
      <div className="container">
        <h2>Our Services</h2>
        <div className="service-grid">
          {services.map(s => (
            <div className="service-card" key={s.title}>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
