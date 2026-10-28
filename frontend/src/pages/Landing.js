import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../landing.css';

const faqs = [
  { q: 'How do I find a worker near me?', a: 'Simply register, enable location access, and search by service category. Our GPS-powered system shows you the nearest available workers instantly.' },
  { q: 'Are workers verified and trustworthy?', a: 'Yes. All workers go through a verification process including ID check, skill assessment, and admin approval before they can accept bookings.' },
  { q: 'How does payment work?', a: 'We support UPI, credit/debit cards, net banking, and cash. Payments are processed securely and released to workers only after job completion.' },
  { q: 'Can I cancel a booking?', a: 'Yes, you can cancel a booking before the worker arrives. Cancellation policies vary based on timing — check the booking details for specifics.' },
  { q: 'What if I\'m not satisfied with the service?', a: 'We have a satisfaction guarantee. Raise a dispute within 24 hours of job completion and our support team will resolve it promptly.' },
  { q: 'How do I join as a worker?', a: 'Click "Join as Worker", fill in your profile with skills and experience, and submit for admin approval. Once approved, you\'ll start receiving booking requests.' },
  { q: 'Is there a fee to use the platform?', a: 'Registration is free for both customers and workers. A small service fee is applied on completed bookings to maintain the platform.' },
  { q: 'How do reviews and ratings work?', a: 'Only verified customers who have completed a booking can leave reviews. This ensures all ratings are genuine and trustworthy.' },
];

const Landing = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const features = [
    { icon: '📍', title: 'Location-Based Search', desc: 'Find skilled workers near your location with GPS-powered search', link: '/feature/location-search' },
    { icon: '💬', title: 'Real-Time Chat', desc: 'Communicate directly with workers before and during the job', link: '/feature/real-time-chat' },
    { icon: '💳', title: 'Secure Payments', desc: 'Safe and secure payment processing with multiple options', link: '/feature/secure-payments' },
    { icon: '⭐', title: 'Reviews & Ratings', desc: 'Read genuine reviews from verified customers', link: '/feature/reviews-ratings' },
    { icon: '🔔', title: 'Instant Notifications', desc: 'Stay updated with real-time booking and job status alerts', link: '/feature/notifications' },
    { icon: '📊', title: 'Analytics Dashboard', desc: 'Track earnings, bookings, and performance metrics', link: '/feature/analytics' },
  ];

  const services = [
    { icon: '⚡', name: 'Electrician', slug: 'electrician' },
    { icon: '🔧', name: 'Plumber', slug: 'plumber' },
    { icon: '🪚', name: 'Carpenter', slug: 'carpenter' },
    { icon: '🔩', name: 'Mechanic', slug: 'mechanic' },
    { icon: '📚', name: 'Tutor', slug: 'tutor' },
    { icon: '🎨', name: 'Painter', slug: 'painter' },
    { icon: '🧹', name: 'Cleaner', slug: 'cleaner' },
    { icon: '🌱', name: 'Gardener', slug: 'gardener' },
  ];

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="logo" onClick={() => navigate('/')}>
          <div className="logo-icon">🏠</div>
          <span className="logo-text">Hyperlocal Jobs</span>
        </div>
        <nav className="landing-nav">
          <Link to="/">Home</Link>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/project-info">Project Info</Link>
          <button className="btn-login" onClick={() => navigate('/login')}>Login</button>
          <button className="btn-signup" onClick={() => navigate('/register?role=worker')}>Join as Worker</button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Find Local Skilled Workers <br />
            <span className="highlight">In Your Area</span>
          </h1>
          <p className="hero-subtitle">
            Connect with trusted local professionals for all your home service needs.
            From electricians to tutors, find the right expert in minutes.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => navigate('/register')}>Get Started Free</button>
            <button className="btn-secondary" onClick={() => navigate('/register?role=worker')}>Join as Worker</button>
          </div>
          <div className="hero-stats">
            <div className="stat"><h3>500+</h3><p>Skilled Workers</p></div>
            <div className="stat"><h3>1000+</h3><p>Jobs Completed</p></div>
            <div className="stat"><h3>4.8★</h3><p>Average Rating</p></div>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-illustration">
            <div className="illustration-card"><span className="icon">👷</span><p>Professional Workers</p></div>
            <div className="illustration-card"><span className="icon">⚡</span><p>Quick Service</p></div>
            <div className="illustration-card"><span className="icon">⭐</span><p>Top Rated</p></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div style={{textAlign:"center",marginBottom:"2.5rem"}}>
          <span style={{background:"#ede9fe",color:"#6366f1",padding:"0.3rem 1rem",borderRadius:50,fontSize:"0.82rem",fontWeight:700,display:"inline-block",marginBottom:"0.875rem"}}>Why Us</span>
          <h2 className="section-title">Why Choose Hyperlocal Jobs?</h2>
          <p className="section-subtitle">Everything you need to find and hire local professionals</p>
        </div>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card feature-card-clickable" onClick={() => navigate(f.link)} style={{cursor:'pointer'}}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <span className="feature-learn-more">Learn more →</span>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <h2 className="section-title">How It Works</h2>
        <div className="how-it-works-tabs">
          <div className="tab-content">
            <h3>For Customers</h3>
            <div className="steps">
              {[
                {n:'1', t:'Search for Services', d:'Browse skilled workers by category and location'},
                {n:'2', t:'Book a Worker', d:'Select a professional and schedule your service'},
                {n:'3', t:'Get Work Done', d:'Worker arrives and completes the job professionally'},
                {n:'4', t:'Pay & Review', d:'Make secure payment and leave a review'},
              ].map((s, i) => (
                <div key={i} className="step">
                  <div className="step-number">{s.n}</div>
                  <div className="step-content"><h4>{s.t}</h4><p>{s.d}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="tab-content">
            <h3>For Workers</h3>
            <div className="steps">
              {[
                {n:'1', t:'Create Profile', d:'Sign up and showcase your skills and experience'},
                {n:'2', t:'Receive Requests', d:'Get notified when customers book your services'},
                {n:'3', t:'Complete Jobs', d:'Provide quality service and build your reputation'},
                {n:'4', t:'Earn Money', d:'Get paid securely and track your earnings'},
              ].map((s, i) => (
                <div key={i} className="step">
                  <div className="step-number">{s.n}</div>
                  <div className="step-content"><h4>{s.t}</h4><p>{s.d}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services-section">
        <div style={{textAlign:"center",marginBottom:"2.5rem"}}>
          <span style={{background:"#dbeafe",color:"#1e40af",padding:"0.3rem 1rem",borderRadius:50,fontSize:"0.82rem",fontWeight:700,display:"inline-block",marginBottom:"0.875rem"}}>Services</span>
          <h2 className="section-title">Popular Services</h2>
          <p className="section-subtitle">Find experts for all your needs</p>
        </div>
        <div className="services-grid">
          {services.map((s, i) => (
            <div key={i} className="service-card" onClick={() => navigate(`/service/${s.slug}`)} style={{cursor:'pointer'}}>
              <span className="service-icon">{s.icon}</span>
              <h4>{s.name}</h4>
              <span style={{fontSize:'0.8rem', opacity:'0.8', marginTop:'0.5rem', display:'block'}}>View Details →</span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" style={{padding:'5rem 5%', background:'white'}}>
        <h2 className="section-title">Frequently Asked Questions</h2>
        <p className="section-subtitle">Got questions? We've got answers.</p>
        <div style={{maxWidth:'800px', margin:'2rem auto 0', display:'flex', flexDirection:'column', gap:'1rem'}}>
          {faqs.map((faq, i) => (
            <div key={i} style={{border:'2px solid #e5e7eb', borderRadius:'12px', overflow:'hidden', transition:'border-color 0.3s', borderColor: openFaq === i ? '#4f46e5' : '#e5e7eb'}}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{width:'100%', padding:'1.25rem 1.5rem', background:'none', border:'none', textAlign:'left', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'1rem', fontWeight:'600', color:'#1f2937'}}
              >
                {faq.q}
                <span style={{fontSize:'1.25rem', color:'#4f46e5', transition:'transform 0.3s', transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)'}}>+</span>
              </button>
              {openFaq === i && (
                <div style={{padding:'0 1.5rem 1.25rem', color:'#6b7280', lineHeight:'1.7'}}>{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>Join thousands of satisfied customers and skilled workers</p>
        <div className="cta-buttons">
          <button className="btn-primary" onClick={() => navigate('/register')}>Find Workers</button>
          <button className="btn-outline" onClick={() => navigate('/register?role=worker')}>Join as Worker</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="logo"><div className="logo-icon">🏠</div><span className="logo-text">Hyperlocal Jobs</span></div>
            <p>Connecting skilled workers with customers for a better tomorrow.</p>
            <p style={{marginTop:'1rem', color:'#9ca3af', fontSize:'0.9rem'}}>Built by Ashwini Lokhande</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <Link to="/">Home</Link>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact Us</Link>
            <Link to="/project-info">Project Info</Link>
            <Link to="/login">Login</Link>
          </div>
          <div className="footer-section">
            <h4>Services</h4>
            {['electrician','plumber','carpenter','mechanic'].map(s => (
              <Link key={s} to={`/service/${s}`} style={{textTransform:'capitalize'}}>{s}</Link>
            ))}
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>📞 8767823948</p>
            <p>📧 contact@ansoftio.com</p>
            <p>🌐 ansoftio.com</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Hyperlocal Jobs. All rights reserved. | Built by Ashwini Lokhande &nbsp;|&nbsp; 📞 8767823948 &nbsp;|&nbsp; 📧 contact@ansoftio.com &nbsp;|&nbsp; 🌐 ansoftio.com</p>
          <button onClick={() => navigate('/project-info')} style={{ marginTop:'0.75rem', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.3)', color:'white', padding:'0.5rem 1.5rem', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>
            📋 View Full Project Info & Demo Credentials
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
