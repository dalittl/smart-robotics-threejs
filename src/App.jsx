import React from 'react'

export default function App() {
  return (
    <div className="site blank-page">
      <header className="floating-header">
        <div className="brand">
          <img src="/apolloeve.PNG" alt="Apollo Eve" className="logo" />
        </div>
      </header>

      <nav className="floating-menu" aria-label="Main menu">
        <ul>
          <li><a href="#about">About Me</a></li>
          <li><a href="#services">Services</a></li>
          <li><a href="#products">Products</a></li>
          <li><a href="#projects">Projects</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>
    </div>
  )
}
