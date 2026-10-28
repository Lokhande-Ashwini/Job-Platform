import { useNavigate } from 'react-router-dom';
import '../landing.css';

const AboutUs = () => {
  const navigate = useNavigate();

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
          <h1 className="hero-title">About <span className="highlight">Hyperlocal Jobs</span></h1>
          <p className="hero-subtitle">Bridging the gap between skilled workers and customers in your neighborhood</p>
        </div>
      </section>

      <section style={{padding:'4rem 5%', background:'white', maxWidth:'1200px', margin:'0 auto'}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'4rem', alignItems:'center'}}>
          <div>
            <h2 style={{fontSize:'2rem', fontWeight:'700', color:'#1f2937', marginBottom:'1.5rem'}}>Our Mission</h2>
            <p style={{color:'#6b7280', lineHeight:'1.8', fontSize:'1.1rem', marginBottom:'1rem'}}>
              Hyperlocal Jobs was founded with a simple but powerful mission: to connect skilled local workers with customers who need their services — quickly, safely, and affordably.
            </p>
            <p style={{color:'#6b7280', lineHeight:'1.8', fontSize:'1.1rem', marginBottom:'1rem'}}>
              We believe every skilled professional deserves a platform to showcase their talent, and every customer deserves access to trusted, verified workers in their area.
            </p>
            <p style={{color:'#6b7280', lineHeight:'1.8', fontSize:'1.1rem'}}>
              From electricians to tutors, plumbers to painters — we cover all essential home and professional services under one roof.
            </p>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'1.5rem'}}>
            {[
              {icon:'🎯', title:'Our Vision', desc:'To be the most trusted hyperlocal job platform in India'},
              {icon:'💡', title:'Innovation', desc:'GPS-powered matching and real-time communication'},
              {icon:'🤝', title:'Trust', desc:'Verified workers with genuine reviews and ratings'},
              {icon:'🌍', title:'Community', desc:'Empowering local workers and strengthening communities'},
            ].map((item, i) => (
              <div key={i} style={{background:'#f9fafb', padding:'1.5rem', borderRadius:'12px', textAlign:'center'}}>
                <div style={{fontSize:'2.5rem', marginBottom:'0.75rem'}}>{item.icon}</div>
                <h4 style={{color:'#1f2937', marginBottom:'0.5rem'}}>{item.title}</h4>
                <p style={{color:'#6b7280', fontSize:'0.9rem'}}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{padding:'4rem 5%', background:'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'}}>
        <h2 className="section-title">Our Story</h2>
        <p className="section-subtitle">How we started and where we're going</p>
        <div style={{maxWidth:'800px', margin:'0 auto', background:'white', padding:'3rem', borderRadius:'16px', boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
          <p style={{color:'#6b7280', lineHeight:'1.9', fontSize:'1.05rem', marginBottom:'1rem'}}>
            Hyperlocal Jobs was born out of a real problem — finding a reliable electrician or plumber at short notice was frustratingly difficult. Customers had no way to verify credentials, and skilled workers had no platform to reach nearby customers.
          </p>
          <p style={{color:'#6b7280', lineHeight:'1.9', fontSize:'1.05rem', marginBottom:'1rem'}}>
            We built a platform that uses GPS technology to match customers with the nearest available skilled workers, complete with verified profiles, real-time chat, secure payments, and a robust review system.
          </p>
          <p style={{color:'#6b7280', lineHeight:'1.9', fontSize:'1.05rem'}}>
            Today, we're proud to have 500+ skilled workers on our platform, 1000+ completed jobs, and an average rating of 4.8 stars — and we're just getting started.
          </p>
        </div>
      </section>

      <section style={{padding:'4rem 5%', background:'white'}}>
        <h2 className="section-title">Our Numbers</h2>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'2rem', maxWidth:'1000px', margin:'2rem auto 0'}}>
          {[
            {num:'500+', label:'Skilled Workers'},
            {num:'1000+', label:'Jobs Completed'},
            {num:'4.8★', label:'Average Rating'},
            {num:'8+', label:'Service Categories'},
          ].map((s, i) => (
            <div key={i} style={{textAlign:'center', padding:'2rem', background:'#f9fafb', borderRadius:'16px'}}>
              <h3 style={{fontSize:'2.5rem', color:'#4f46e5', fontWeight:'800', marginBottom:'0.5rem'}}>{s.num}</h3>
              <p style={{color:'#6b7280'}}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{padding:'4rem 5%', background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', textAlign:'center', color:'white'}}>
        <h2 style={{fontSize:'2rem', marginBottom:'1rem'}}>Built by Ashwini Lokhande</h2>
        <p style={{opacity:'0.9', fontSize:'1.1rem', marginBottom:'0.5rem'}}>📞 8767823948 &nbsp;|&nbsp; 📧 contact@ansoftio.com &nbsp;|&nbsp; 🌐 ansoftio.com</p>
        <p style={{opacity:'0.8', marginTop:'1rem'}}>Passionate about connecting communities through technology</p>
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

export default AboutUs;
