import React from 'react'

export default function Footer(){
  return (
    <footer className="site-footer">
      <div className="container">
        <div>© {new Date().getFullYear()} Smart Robotics</div>
        <div className="socials">Built with three.js & React</div>
      </div>
    </footer>
  )
}
