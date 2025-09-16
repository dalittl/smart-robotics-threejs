import React from 'react'

export default function Contact() {
  return (
    <section id="contact" className="section contact">
      <div className="container">
        <h2>Contact Us</h2>
        <p>Interested in a custom robotics solution? Drop us a message and we'll get back to you.</p>
        <form className="contact-form" onSubmit={(e) => { e.preventDefault(); alert('Thanks — message sent (demo)') }}>
          <label>
            Name
            <input name="name" type="text" required />
          </label>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Message
            <textarea name="message" rows={5} required />
          </label>
          <button className="btn primary" type="submit">Send message</button>
        </form>
      </div>
    </section>
  )
}
