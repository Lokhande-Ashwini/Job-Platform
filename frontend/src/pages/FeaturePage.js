import { useNavigate, useParams } from 'react-router-dom';
import '../landing.css';

const featureData = {
  'location-search': {
    icon: '📍',
    name: 'Location-Based Search',
    tagline: 'Find skilled workers near your location with GPS-powered search',
    description: 'Our advanced GPS-powered search technology connects you with the nearest available skilled workers in real time. No more calling around or waiting days for a professional to show up.',
    howItWorks: [
      { step: '1', title: 'Enable Location', desc: 'Allow the app to access your GPS location for accurate results' },
      { step: '2', title: 'Set Radius', desc: 'Choose your preferred search radius — 1km, 5km, or 10km' },
      { step: '3', title: 'Browse Workers', desc: 'See available workers on a map with ratings and distance' },
      { step: '4', title: 'Book Instantly', desc: 'Select a worker and book them with a single tap' },
    ],
    benefits: ['Find workers within minutes', 'See real-time availability', 'Compare workers by distance and rating', 'Reduce travel time and costs'],
  },
  'real-time-chat': {
    icon: '💬',
    name: 'Real-Time Chat',
    tagline: 'Communicate directly with workers before and during the job',
    description: 'Our built-in messaging system lets you communicate directly with workers before, during, and after the job. Discuss requirements, share photos, and stay updated — all in one place.',
    howItWorks: [
      { step: '1', title: 'Book a Worker', desc: 'Once you book, a chat thread is automatically created' },
      { step: '2', title: 'Discuss Details', desc: 'Share job requirements, photos, and specific instructions' },
      { step: '3', title: 'Stay Updated', desc: 'Get real-time updates as the worker is on their way' },
      { step: '4', title: 'Post-Job Support', desc: 'Continue chatting for follow-up questions or issues' },
    ],
    benefits: ['No need to share personal phone numbers', 'All conversations saved securely', 'Share images and documents', 'Instant message delivery'],
  },
  'secure-payments': {
    icon: '💳',
    name: 'Secure Payments',
    tagline: 'Safe and secure payment processing with multiple options',
    description: 'Pay with confidence using our secure payment gateway. Multiple payment options, transparent pricing, and money-back guarantee ensure a worry-free experience.',
    howItWorks: [
      { step: '1', title: 'Get a Quote', desc: 'Receive a transparent price estimate before work begins' },
      { step: '2', title: 'Choose Payment', desc: 'Pay via UPI, card, net banking, or cash on completion' },
      { step: '3', title: 'Work Completed', desc: 'Payment is released to the worker only after job completion' },
      { step: '4', title: 'Get Receipt', desc: 'Receive a digital invoice for every transaction' },
    ],
    benefits: ['Multiple payment methods', 'Escrow protection', 'Transparent pricing — no hidden fees', 'Instant digital receipts'],
  },
  'reviews-ratings': {
    icon: '⭐',
    name: 'Reviews & Ratings',
    tagline: 'Read genuine reviews from verified customers',
    description: 'Our review system ensures transparency and trust. Only customers who have completed a booking can leave reviews, so every rating is genuine and verified.',
    howItWorks: [
      { step: '1', title: 'Complete a Job', desc: 'Reviews can only be submitted after a job is marked complete' },
      { step: '2', title: 'Rate the Worker', desc: 'Give a star rating from 1 to 5 for the service received' },
      { step: '3', title: 'Write a Review', desc: 'Share your experience to help other customers decide' },
      { step: '4', title: 'Build Trust', desc: 'Workers with higher ratings get more visibility on the platform' },
    ],
    benefits: ['100% verified reviews', 'Detailed star ratings', 'Photo reviews supported', 'Worker response to reviews'],
  },
  'notifications': {
    icon: '🔔',
    name: 'Instant Notifications',
    tagline: 'Stay updated with real-time booking and job status alerts',
    description: 'Never miss an update. Our real-time notification system keeps both customers and workers informed at every step of the booking process.',
    howItWorks: [
      { step: '1', title: 'Booking Confirmed', desc: 'Get notified the moment a worker accepts your booking' },
      { step: '2', title: 'Worker En Route', desc: 'Receive an alert when the worker is on their way' },
      { step: '3', title: 'Job Updates', desc: 'Stay informed about job progress and any changes' },
      { step: '4', title: 'Payment Alerts', desc: 'Get instant confirmation when payment is processed' },
    ],
    benefits: ['Real-time push notifications', 'SMS alerts for critical updates', 'In-app notification center', 'Customizable notification preferences'],
  },
  'analytics': {
    icon: '📊',
    name: 'Analytics Dashboard',
    tagline: 'Track earnings, bookings, and performance metrics',
    description: 'Powerful analytics tools for both workers and customers. Workers can track earnings and performance, while customers can monitor their service history and spending.',
    howItWorks: [
      { step: '1', title: 'View Earnings', desc: 'Workers see daily, weekly, and monthly earnings at a glance' },
      { step: '2', title: 'Track Bookings', desc: 'Monitor completed, pending, and cancelled bookings' },
      { step: '3', title: 'Performance Metrics', desc: 'See your rating trends and customer satisfaction scores' },
      { step: '4', title: 'Export Reports', desc: 'Download detailed reports for accounting and planning' },
    ],
    benefits: ['Visual charts and graphs', 'Earnings breakdown by service', 'Customer retention insights', 'Downloadable reports'],
  },
};

const FeaturePage = () => {
  const { feature } = useParams();
  const navigate = useNavigate();
  const data = featureData[feature?.toLowerCase()];

  if (!data) {
    return (
      <div className="landing-page" style={{textAlign:'center', padding:'5rem'}}>
        <h2>Feature not found</h2>
        <button className="btn-primary" onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

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

      <section style={{background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding:'4rem 5%', color:'white', textAlign:'center'}}>
        <div style={{fontSize:'5rem', marginBottom:'1rem'}}>{data.icon}</div>
        <h1 style={{fontSize:'3rem', fontWeight:'800', marginBottom:'1rem'}}>{data.name}</h1>
        <p style={{fontSize:'1.25rem', opacity:'0.9', maxWidth:'600px', margin:'0 auto'}}>{data.tagline}</p>
      </section>

      <section style={{padding:'4rem 5%', background:'white'}}>
        <div style={{maxWidth:'900px', margin:'0 auto'}}>
          <p style={{color:'#6b7280', lineHeight:'1.9', fontSize:'1.1rem', textAlign:'center', marginBottom:'3rem'}}>{data.description}</p>

          <h2 style={{fontSize:'1.75rem', fontWeight:'700', color:'#1f2937', marginBottom:'2rem', textAlign:'center'}}>How It Works</h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'1.5rem', marginBottom:'3rem'}}>
            {data.howItWorks.map((item, i) => (
              <div key={i} style={{display:'flex', gap:'1rem', background:'#f9fafb', padding:'1.5rem', borderRadius:'12px'}}>
                <div style={{width:'50px', height:'50px', background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color:'white', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'1.25rem', flexShrink:0}}>{item.step}</div>
                <div>
                  <h4 style={{color:'#1f2937', marginBottom:'0.25rem'}}>{item.title}</h4>
                  <p style={{color:'#6b7280', fontSize:'0.95rem'}}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 style={{fontSize:'1.75rem', fontWeight:'700', color:'#1f2937', marginBottom:'1.5rem', textAlign:'center'}}>Key Benefits</h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'1rem'}}>
            {data.benefits.map((b, i) => (
              <div key={i} style={{background:'#f0f9ff', padding:'1rem 1.5rem', borderRadius:'8px', color:'#374151', display:'flex', alignItems:'center', gap:'0.75rem', borderLeft:'4px solid #4f46e5'}}>
                <span style={{color:'#4f46e5', fontWeight:'700'}}>✓</span> {b}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Experience {data.name}</h2>
        <p>Join thousands of users already benefiting from this feature</p>
        <div className="cta-buttons">
          <button className="btn-primary" onClick={() => navigate('/register')}>Get Started Free</button>
          <button className="btn-outline" onClick={() => navigate('/')}>Learn More</button>
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

export default FeaturePage;
