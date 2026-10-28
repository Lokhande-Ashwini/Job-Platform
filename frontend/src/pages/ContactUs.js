import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../landing.css';

const ContactUs = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="logo" onClick={() => navigate('/')}>
          <div className="logo-icon">🏠</div>
          <span className="logo-text">Hyperlocal Jobs</span>
        </div>
        <nav className="landing-nav">
          <a href="/">Home</a>
          <a href="/about">About Us</a>
          <a href="/contact">Contact Us</a>
          <button className="btn-login" onClick={() => navigate('/login')}>Login</button>
          <button className="btn-signup" onClick={() => navigate('/register?role=worker')}>Join as Worker</button>
        </nav>
      </header>

      <section className="hero-section" style={{gridTemplateColumns:'1fr', textAlign:'center', padding:'4rem 5%'}}>
        <div>
          <h1 className="hero-title">Contact <span className="highlight">Us</span></h1>
          <p className="hero-subtitle">We'd love to hear from you. Reach out anytime.</p>
        </div>
      </section>

      <section style={{padding:'4rem 5%', background:'white'}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'4rem', maxWidth:'1200px', margin:'0 auto'}}>

          {/* Contact Info */}
          <div>
            <h2 style={{fontSize:'1.75rem', fontWeight:'700', color:'#1f2937', marginBottom:'2rem'}}>Get In Touch</h2>
            {[
              {icon:'📞', title:'Phone', info:'8767823948', sub:'Mon–Sat, 9am–6pm'},
              {icon:'📧', title:'Email', info:'contact@ansoftio.com', sub:'We reply within 24 hours'},
              {icon:'🌐', title:'Website', info:'ansoftio.com', sub:'Visit our main site'},
              {icon:'📍', title:'Location', info:'India', sub:'Serving hyperlocal communities'},
            ].map((c, i) => (
              <div key={i} style={{display:'flex', gap:'1.5rem', marginBottom:'2rem', padding:'1.5rem', background:'#f9fafb', borderRadius:'12px'}}>
                <div style={{fontSize:'2rem', width:'50px', textAlign:'center'}}>{c.icon}</div>
                <div>
                  <h4 style={{color:'#1f2937', marginBottom:'0.25rem'}}>{c.title}</h4>
                  <p style={{color:'#4f46e5', fontWeight:'600', marginBottom:'0.25rem'}}>{c.info}</p>
                  <p style={{color:'#9ca3af', fontSize:'0.85rem'}}>{c.sub}</p>
                </div>
              </div>
            ))}

            <div style={{padding:'1.5rem', background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius:'12px', color:'white', marginTop:'1rem'}}>
              <h4 style={{marginBottom:'0.5rem'}}>Built by Ashwini Lokhande</h4>
              <p style={{opacity:'0.9', fontSize:'0.95rem'}}>📞 8767823948 | 📧 contact@ansoftio.com | 🌐 ansoftio.com</p>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 style={{fontSize:'1.75rem', fontWeight:'700', color:'#1f2937', marginBottom:'2rem'}}>Send a Message</h2>
            {submitted ? (
              <div style={{textAlign:'center', padding:'3rem', background:'#f0fdf4', borderRadius:'16px', border:'2px solid #86efac'}}>
                <div style={{fontSize:'4rem', marginBottom:'1rem'}}>✅</div>
                <h3 style={{color:'#166534', marginBottom:'0.5rem'}}>Message Sent!</h3>
                <p style={{color:'#15803d'}}>Thank you for reaching out. We'll get back to you within 24 hours.</p>
                <button className="btn-primary" style={{marginTop:'1.5rem'}} onClick={() => setSubmitted(false)}>Send Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
                <input
                  type="text" placeholder="Your Name" required
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  style={{padding:'0.875rem 1rem', border:'2px solid #e5e7eb', borderRadius:'8px', fontSize:'1rem', outline:'none'}}
                />
                <input
                  type="email" placeholder="Email Address" required
                  value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  style={{padding:'0.875rem 1rem', border:'2px solid #e5e7eb', borderRadius:'8px', fontSize:'1rem', outline:'none'}}
                />
                <input
                  type="tel" placeholder="Phone Number"
                  value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  style={{padding:'0.875rem 1rem', border:'2px solid #e5e7eb', borderRadius:'8px', fontSize:'1rem', outline:'none'}}
                />
                <select
                  value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required
                  style={{padding:'0.875rem 1rem', border:'2px solid #e5e7eb', borderRadius:'8px', fontSize:'1rem', outline:'none', background:'white'}}
                >
                  <option value="">Select Subject</option>
                  <option>General Inquiry</option>
                  <option>Worker Registration</option>
                  <option>Booking Issue</option>
                  <option>Payment Problem</option>
                  <option>Technical Support</option>
                  <option>Partnership</option>
                </select>
                <textarea
                  placeholder="Your message..." required rows="5"
                  value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                  style={{padding:'0.875rem 1rem', border:'2px solid #e5e7eb', borderRadius:'8px', fontSize:'1rem', outline:'none', resize:'vertical'}}
                />
                <button type="submit" className="btn-primary" style={{padding:'1rem'}}>Send Message</button>
              </form>
            )}
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="logo"><div className="logo-icon">🏠</div><span className="logo-text">Hyperlocal Jobs</span></div>
            <p>Connecting skilled workers with customers for a better tomorrow.</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <a href="/">Home</a>
            <a href="/about">About Us</a>
            <a href="/contact">Contact Us</a>
            <a href="/login">Login</a>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>📞 8767823948</p>
            <p>📧 contact@ansoftio.com</p>
            <p>🌐 ansoftio.com</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Hyperlocal Jobs. All rights reserved. | Built by Ashwini Lokhande</p>
        </div>
      </footer>
    </div>
  );
};

export default ContactUs;
