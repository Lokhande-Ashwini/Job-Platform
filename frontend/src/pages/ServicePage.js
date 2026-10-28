import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../service-pages.css';

const serviceData = {
  electrician: {
    icon: '⚡',
    name: 'Electrician',
    tagline: 'Expert electrical solutions for your home & office',
    description: 'Our certified electricians handle everything from basic wiring repairs to complete electrical installations. All workers are verified, insured, and experienced with 5+ years in the field.',
    theme: 'electric',
    heroGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #92400e 100%)',
    accentColor: '#f59e0b',
    lightBg: '#fffbeb',
    stats: [{ v: '200+', l: 'Electricians' }, { v: '4.9★', l: 'Rating' }, { v: '₹200–800', l: 'Per Hour' }, { v: '1–3 hrs', l: 'Avg Time' }],
    services: [
      { icon: '🔌', name: 'Wiring & Rewiring', desc: 'Complete home and office wiring solutions' },
      { icon: '🔲', name: 'Switchboard Installation', desc: 'New boards, MCB fitting, and upgrades' },
      { icon: '💡', name: 'Fan & Light Fitting', desc: 'Ceiling fans, chandeliers, LED lights' },
      { icon: '🔋', name: 'Inverter & UPS', desc: 'Installation, battery replacement, servicing' },
      { icon: '📹', name: 'CCTV & Security', desc: 'Camera installation and wiring' },
      { icon: '❄️', name: 'AC Electrical Work', desc: 'Power points, stabilizer fitting' },
      { icon: '⚠️', name: 'Short Circuit Repair', desc: 'Emergency fault detection and repair' },
      { icon: '🏭', name: 'Industrial Wiring', desc: 'Commercial and industrial electrical work' },
    ],
    process: [
      { step: '01', title: 'Book Online', desc: 'Select your service and preferred time slot' },
      { step: '02', title: 'Get Matched', desc: 'We assign the nearest certified electrician' },
      { step: '03', title: 'Work Done', desc: 'Professional arrives and completes the job safely' },
      { step: '04', title: 'Pay & Rate', desc: 'Secure payment and leave your review' },
    ],
    tips: ['Always hire a certified electrician — never DIY high-voltage work', 'Get a written estimate before work begins', 'Ensure all work complies with local electrical codes', 'Ask for a warranty on completed work'],
    faqs: [
      { q: 'How quickly can an electrician arrive?', a: 'Most electricians on our platform can arrive within 1–2 hours of booking, depending on your location.' },
      { q: 'Are your electricians certified?', a: 'Yes, all electricians are verified with valid certifications, background checks, and at least 3 years of experience.' },
      { q: 'What if the problem isn\'t fixed?', a: 'We offer a 7-day satisfaction guarantee. If the issue persists, we\'ll send another professional at no extra charge.' },
      { q: 'Do electricians carry spare parts?', a: 'Yes, our electricians carry common spare parts like switches, fuses, and MCBs for quick fixes.' },
    ],
    whyUs: ['Licensed & insured professionals', 'Same-day service available', '7-day work guarantee', 'Transparent pricing — no hidden charges'],
  },
  plumber: {
    icon: '🔧',
    name: 'Plumber',
    tagline: 'Fast and reliable plumbing services near you',
    description: 'From leaky taps to full bathroom installations, our skilled plumbers solve any plumbing issue quickly and efficiently. Available 7 days a week including emergencies.',
    theme: 'plumb',
    heroGradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #075985 100%)',
    accentColor: '#0ea5e9',
    lightBg: '#f0f9ff',
    stats: [{ v: '150+', l: 'Plumbers' }, { v: '4.8★', l: 'Rating' }, { v: '₹250–900', l: 'Per Hour' }, { v: '1–4 hrs', l: 'Avg Time' }],
    services: [
      { icon: '🚿', name: 'Pipe Leak Repair', desc: 'Detect and fix leaks in walls, floors, ceilings' },
      { icon: '🚰', name: 'Tap & Faucet', desc: 'Replacement, repair, and new installation' },
      { icon: '🛁', name: 'Bathroom Fitting', desc: 'Complete bathroom plumbing setup' },
      { icon: '🌡️', name: 'Water Heater', desc: 'Geyser installation and repair' },
      { icon: '🌀', name: 'Drain Cleaning', desc: 'Blockage removal and drain maintenance' },
      { icon: '🚽', name: 'Toilet Repair', desc: 'Flush, seat, and cistern repairs' },
      { icon: '🏗️', name: 'Pipeline Installation', desc: 'New pipelines for homes and offices' },
      { icon: '💧', name: 'Water Tank Cleaning', desc: 'Overhead and underground tank cleaning' },
    ],
    process: [
      { step: '01', title: 'Describe Issue', desc: 'Tell us what\'s wrong — leak, blockage, or installation' },
      { step: '02', title: 'Plumber Assigned', desc: 'Nearest available plumber is dispatched' },
      { step: '03', title: 'Inspection & Fix', desc: 'Plumber inspects, quotes, and fixes the issue' },
      { step: '04', title: 'Test & Pay', desc: 'Work is tested before you pay' },
    ],
    tips: ['Turn off the main water supply before any major repair', 'Regular drain cleaning prevents costly blockages', 'Check for hidden leaks to avoid water damage', 'Install water pressure regulators to protect pipes'],
    faqs: [
      { q: 'Do you handle emergency plumbing?', a: 'Yes, we have plumbers available for emergency calls 7 days a week, including holidays.' },
      { q: 'Do plumbers bring their own tools?', a: 'Yes, all plumbers come fully equipped with professional tools and common spare parts.' },
      { q: 'How is pricing calculated?', a: 'Pricing is based on the type of work and time taken. You\'ll get a clear estimate before work starts.' },
      { q: 'Can you fix leaks inside walls?', a: 'Yes, our plumbers use leak detection equipment to find and fix hidden leaks with minimal wall damage.' },
    ],
    whyUs: ['Emergency service 24/7', 'Leak detection technology', 'No mess — clean work guaranteed', 'Parts warranty included'],
  },
  carpenter: {
    icon: '🪚',
    name: 'Carpenter',
    tagline: 'Quality woodwork and custom furniture solutions',
    description: 'Our skilled carpenters bring craftsmanship and precision to every project. From custom furniture to complete home woodwork, we deliver quality that lasts a lifetime.',
    theme: 'wood',
    heroGradient: 'linear-gradient(135deg, #92400e 0%, #b45309 50%, #d97706 100%)',
    accentColor: '#b45309',
    lightBg: '#fef3c7',
    stats: [{ v: '80+', l: 'Carpenters' }, { v: '4.9★', l: 'Rating' }, { v: '₹300–1000', l: 'Per Hour' }, { v: '2–8 hrs', l: 'Avg Time' }],
    services: [
      { icon: '🛋️', name: 'Furniture Assembly', desc: 'IKEA, modular, and custom furniture setup' },
      { icon: '🚪', name: 'Door & Window Repair', desc: 'Hinges, frames, locks, and fitting' },
      { icon: '🗄️', name: 'Wardrobe Installation', desc: 'Sliding, hinged, and walk-in wardrobes' },
      { icon: '🍳', name: 'Kitchen Cabinets', desc: 'Modular kitchen design and installation' },
      { icon: '🪵', name: 'Wooden Flooring', desc: 'Laminate, hardwood, and vinyl flooring' },
      { icon: '🏠', name: 'False Ceiling', desc: 'POP, gypsum, and wooden false ceilings' },
      { icon: '🛏️', name: 'Bed Frame Repair', desc: 'Broken joints, slats, and headboard fixes' },
      { icon: '✏️', name: 'Custom Furniture', desc: 'Bespoke pieces designed to your specs' },
    ],
    process: [
      { step: '01', title: 'Share Requirements', desc: 'Describe your project or upload photos' },
      { step: '02', title: 'Get a Quote', desc: 'Carpenter visits and provides a detailed estimate' },
      { step: '03', title: 'Work Begins', desc: 'Skilled craftsman completes the work on schedule' },
      { step: '04', title: 'Inspect & Pay', desc: 'Review the finished work before making payment' },
    ],
    tips: ['Measure your space carefully before ordering custom furniture', 'Use quality wood like teak or sheesham for longevity', 'Regular polishing extends furniture life by years', 'Always check moisture levels before wooden flooring installation'],
    faqs: [
      { q: 'Can carpenters make custom furniture?', a: 'Absolutely! Our carpenters specialize in custom-made furniture tailored to your exact specifications and budget.' },
      { q: 'Do you provide materials?', a: 'Carpenters can source quality materials for you or work with materials you provide. Discuss this during booking.' },
      { q: 'How long does furniture assembly take?', a: 'Simple assembly takes 1–2 hours. Complex custom work may take a full day or spread over multiple visits.' },
      { q: 'Do you offer a warranty on work?', a: 'Yes, all carpentry work comes with a 30-day workmanship warranty.' },
    ],
    whyUs: ['Custom designs to your taste', 'Quality wood and materials', '30-day workmanship warranty', 'On-time project delivery'],
  },
  mechanic: {
    icon: '🔩',
    name: 'Mechanic',
    tagline: 'Professional vehicle repair and maintenance at your doorstep',
    description: 'Certified mechanics for all types of vehicles. From routine servicing to complex engine repairs, our professionals come to you — saving you time and hassle.',
    theme: 'mech',
    heroGradient: 'linear-gradient(135deg, #374151 0%, #1f2937 50%, #111827 100%)',
    accentColor: '#6b7280',
    lightBg: '#f9fafb',
    stats: [{ v: '100+', l: 'Mechanics' }, { v: '4.7★', l: 'Rating' }, { v: '₹300–1200', l: 'Per Hour' }, { v: '1–6 hrs', l: 'Avg Time' }],
    services: [
      { icon: '🚗', name: 'Car Servicing', desc: 'Full service, oil change, filter replacement' },
      { icon: '🏍️', name: 'Bike Repair', desc: 'Two-wheeler repair and maintenance' },
      { icon: '🛢️', name: 'Oil Change', desc: 'Engine oil, gear oil, and coolant flush' },
      { icon: '🛑', name: 'Brake Repair', desc: 'Brake pads, discs, and fluid replacement' },
      { icon: '🔋', name: 'Battery Replacement', desc: 'Testing and replacement of car batteries' },
      { icon: '🔘', name: 'Tyre Service', desc: 'Puncture repair, rotation, and balancing' },
      { icon: '❄️', name: 'AC Repair', desc: 'Car AC gas refill and compressor repair' },
      { icon: '🔍', name: 'Engine Diagnostics', desc: 'OBD scanning and fault code analysis' },
    ],
    process: [
      { step: '01', title: 'Describe Problem', desc: 'Tell us the issue or book a routine service' },
      { step: '02', title: 'Mechanic Arrives', desc: 'Certified mechanic comes to your location' },
      { step: '03', title: 'Diagnose & Fix', desc: 'Thorough inspection and professional repair' },
      { step: '04', title: 'Test Drive & Pay', desc: 'Vehicle tested before handover' },
    ],
    tips: ['Regular servicing every 5,000–10,000 km extends engine life', 'Check tyre pressure monthly for safety and fuel efficiency', 'Never ignore warning lights on your dashboard', 'Change engine oil on schedule to prevent engine damage'],
    faqs: [
      { q: 'Do mechanics come to my location?', a: 'Yes, our mechanics offer doorstep service for most repairs, servicing, and diagnostics.' },
      { q: 'What vehicles do you service?', a: 'We service cars, bikes, scooters, and light commercial vehicles of all brands.' },
      { q: 'Are spare parts genuine?', a: 'We use only genuine OEM or OEM-equivalent spare parts for all repairs.' },
      { q: 'What if the problem comes back?', a: 'All repairs come with a 15-day warranty. If the same issue recurs, we fix it free of charge.' },
    ],
    whyUs: ['Doorstep service — no towing needed', 'Genuine spare parts only', '15-day repair warranty', 'Transparent pricing before work starts'],
  },
  tutor: {
    icon: '📚',
    name: 'Tutor',
    tagline: 'Expert tutors for every subject and every age',
    description: 'Connect with qualified, experienced tutors for school subjects, competitive exam prep, language learning, and skill development. Online and in-person sessions available.',
    theme: 'tutor',
    heroGradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4c1d95 100%)',
    accentColor: '#7c3aed',
    lightBg: '#f5f3ff',
    stats: [{ v: '120+', l: 'Tutors' }, { v: '4.9★', l: 'Rating' }, { v: '₹200–800', l: 'Per Hour' }, { v: '1–2 hrs', l: 'Per Session' }],
    services: [
      { icon: '🏫', name: 'School Subjects', desc: 'All subjects for classes 1–12' },
      { icon: '🎯', name: 'JEE / NEET Prep', desc: 'Competitive exam coaching and mock tests' },
      { icon: '🗣️', name: 'English Speaking', desc: 'Spoken English and communication skills' },
      { icon: '➗', name: 'Mathematics', desc: 'From basics to advanced calculus' },
      { icon: '🔬', name: 'Science & Physics', desc: 'Conceptual and practical science coaching' },
      { icon: '💻', name: 'Computer Programming', desc: 'Python, Java, web development basics' },
      { icon: '🎵', name: 'Music & Arts', desc: 'Guitar, keyboard, drawing, and painting' },
      { icon: '🌍', name: 'Language Learning', desc: 'Hindi, English, French, German, and more' },
    ],
    process: [
      { step: '01', title: 'Choose Subject', desc: 'Select the subject and level you need help with' },
      { step: '02', title: 'Match with Tutor', desc: 'We match you with the best-fit tutor nearby' },
      { step: '03', title: 'Trial Session', desc: 'Start with a trial session to ensure compatibility' },
      { step: '04', title: 'Regular Classes', desc: 'Schedule ongoing sessions at your convenience' },
    ],
    tips: ['Consistency is key — regular sessions yield far better results', 'Set clear learning goals before starting', 'Practice between sessions to reinforce what you\'ve learned', 'Ask questions freely — there are no silly questions in learning'],
    faqs: [
      { q: 'Are tutors qualified?', a: 'All tutors are verified with their educational qualifications, teaching certifications, and experience.' },
      { q: 'Can I get online tutoring?', a: 'Yes, many tutors offer online sessions via video call for added convenience and flexibility.' },
      { q: 'How do I choose the right tutor?', a: 'Browse profiles, read reviews, and book a trial session to find the best fit for your learning style.' },
      { q: 'What if I\'m not happy with my tutor?', a: 'You can switch tutors at any time. We\'ll help you find a better match at no extra cost.' },
    ],
    whyUs: ['Verified qualifications and experience', 'Online and in-person options', 'Flexible scheduling', 'Free tutor replacement if needed'],
  },
  painter: {
    icon: '🎨',
    name: 'Painter',
    tagline: 'Transform your space with professional painting',
    description: 'Professional painters for interior and exterior painting, texture work, and waterproofing. We use premium paints and deliver flawless finishes that last for years.',
    theme: 'paint',
    heroGradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 50%, #be185d 100%)',
    accentColor: '#ec4899',
    lightBg: '#fdf2f8',
    stats: [{ v: '90+', l: 'Painters' }, { v: '4.8★', l: 'Rating' }, { v: '₹15–50', l: 'Per Sq Ft' }, { v: '1–5 days', l: 'Avg Time' }],
    services: [
      { icon: '🏠', name: 'Interior Painting', desc: 'Walls, ceilings, and trims with premium finish' },
      { icon: '🏢', name: 'Exterior Painting', desc: 'Weather-resistant exterior coatings' },
      { icon: '🌀', name: 'Texture Painting', desc: 'Sand, sponge, and designer textures' },
      { icon: '💧', name: 'Waterproofing', desc: 'Terrace, bathroom, and wall waterproofing' },
      { icon: '🪵', name: 'Wood Polishing', desc: 'Furniture, doors, and floor polishing' },
      { icon: '✏️', name: 'Stencil & Art', desc: 'Custom wall art and stencil designs' },
      { icon: '🏭', name: 'Commercial Painting', desc: 'Offices, shops, and large spaces' },
      { icon: '🎭', name: 'Epoxy Flooring', desc: 'Durable epoxy coatings for floors' },
    ],
    process: [
      { step: '01', title: 'Site Visit', desc: 'Painter visits to assess area and suggest colors' },
      { step: '02', title: 'Get Quote', desc: 'Receive a detailed quote per square foot' },
      { step: '03', title: 'Painting Begins', desc: 'Surface prep, priming, and painting done right' },
      { step: '04', title: 'Final Inspection', desc: 'Walk-through before final payment' },
    ],
    tips: ['Prepare surfaces properly — filling cracks and sanding is key', 'Use quality paint for better coverage and durability', 'Ventilate rooms well during and after painting', 'Apply a primer coat for longer-lasting color'],
    faqs: [
      { q: 'Do painters provide paint and materials?', a: 'Painters can supply premium materials or work with paint you choose. Discuss during booking.' },
      { q: 'How long does a room take to paint?', a: 'A standard room takes 1–2 days including preparation, priming, and drying time.' },
      { q: 'Do you offer texture and designer finishes?', a: 'Yes, our painters are skilled in various texture, stencil, and decorative finishes.' },
      { q: 'How do I calculate the cost?', a: 'Pricing is per square foot. Share your room dimensions and we\'ll give you an instant estimate.' },
    ],
    whyUs: ['Premium paints and materials', 'Zero mess — full cleanup included', 'Color consultation free of charge', 'Warranty on workmanship'],
  },
  cleaner: {
    icon: '🧹',
    name: 'Cleaner',
    tagline: 'Professional cleaning for a spotless, healthy home',
    description: 'Thorough home and office cleaning using eco-friendly, child-safe products. From regular maintenance to deep cleaning and post-construction cleanup — we do it all.',
    theme: 'clean',
    heroGradient: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
    accentColor: '#10b981',
    lightBg: '#f0fdf4',
    stats: [{ v: '110+', l: 'Cleaners' }, { v: '4.8★', l: 'Rating' }, { v: '₹1500–5000', l: 'Per Session' }, { v: '3–8 hrs', l: 'Avg Time' }],
    services: [
      { icon: '🏠', name: 'Home Deep Cleaning', desc: 'Top-to-bottom thorough home cleaning' },
      { icon: '🍳', name: 'Kitchen Cleaning', desc: 'Chimney, tiles, appliances, and cabinets' },
      { icon: '🚿', name: 'Bathroom Sanitization', desc: 'Deep scrub, descaling, and disinfection' },
      { icon: '🛋️', name: 'Sofa & Carpet', desc: 'Steam cleaning and stain removal' },
      { icon: '🏢', name: 'Office Cleaning', desc: 'Daily, weekly, and monthly office cleaning' },
      { icon: '🏗️', name: 'Post-Construction', desc: 'Dust, debris, and paint removal' },
      { icon: '📦', name: 'Move-In/Move-Out', desc: 'Complete cleaning for property handover' },
      { icon: '🪟', name: 'Window Cleaning', desc: 'Interior and exterior glass cleaning' },
    ],
    process: [
      { step: '01', title: 'Choose Package', desc: 'Select regular, deep, or specialized cleaning' },
      { step: '02', title: 'Team Assigned', desc: 'Trained cleaning team is scheduled for your slot' },
      { step: '03', title: 'Cleaning Done', desc: 'Systematic, room-by-room professional cleaning' },
      { step: '04', title: 'Inspect & Pay', desc: 'Walk through with the team before payment' },
    ],
    tips: ['Schedule deep cleaning every 3–6 months for a healthy home', 'Declutter before the session for best results', 'Eco-friendly products are safer for children and pets', 'Inform cleaners of any allergies or sensitive areas'],
    faqs: [
      { q: 'Do cleaners bring their own supplies?', a: 'Yes, all cleaners come with professional-grade equipment and eco-friendly, child-safe products.' },
      { q: 'Is deep cleaning different from regular cleaning?', a: 'Deep cleaning covers areas not typically cleaned regularly — behind appliances, inside cabinets, grout lines, etc.' },
      { q: 'Are cleaners background verified?', a: 'Yes, all cleaning professionals are background checked, trained, and verified before joining our platform.' },
      { q: 'How many cleaners will come?', a: 'Depending on the size of your home, we send 1–4 cleaners to complete the job efficiently.' },
    ],
    whyUs: ['Eco-friendly, child-safe products', 'Background-verified professionals', 'Satisfaction guarantee', 'Flexible scheduling including weekends'],
  },
  gardener: {
    icon: '🌱',
    name: 'Gardener',
    tagline: 'Beautiful, thriving gardens crafted with expertise',
    description: 'Expert gardeners for lawn maintenance, landscaping, plant care, and garden design. Whether you have a small balcony garden or a large estate, we make it flourish.',
    theme: 'garden',
    heroGradient: 'linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%)',
    accentColor: '#16a34a',
    lightBg: '#f0fdf4',
    stats: [{ v: '60+', l: 'Gardeners' }, { v: '4.9★', l: 'Rating' }, { v: '₹500–2000', l: 'Per Session' }, { v: '2–6 hrs', l: 'Avg Time' }],
    services: [
      { icon: '🌿', name: 'Lawn Mowing', desc: 'Regular mowing and edging for neat lawns' },
      { icon: '✂️', name: 'Trimming & Pruning', desc: 'Shaping hedges, shrubs, and trees' },
      { icon: '🏡', name: 'Garden Design', desc: 'Custom garden layouts and planting plans' },
      { icon: '🌄', name: 'Landscaping', desc: 'Pathways, rockeries, and water features' },
      { icon: '💧', name: 'Irrigation Setup', desc: 'Drip and sprinkler system installation' },
      { icon: '🐛', name: 'Pest Control', desc: 'Organic pest and disease management' },
      { icon: '🌸', name: 'Seasonal Planting', desc: 'Flowers, vegetables, and seasonal plants' },
      { icon: '🏙️', name: 'Terrace Garden', desc: 'Balcony and rooftop garden setup' },
    ],
    process: [
      { step: '01', title: 'Share Your Space', desc: 'Tell us about your garden size and goals' },
      { step: '02', title: 'Gardener Visits', desc: 'Expert assesses your garden and suggests a plan' },
      { step: '03', title: 'Work Begins', desc: 'Gardening, planting, and landscaping done right' },
      { step: '04', title: 'Maintenance Plan', desc: 'Set up a regular schedule to keep it thriving' },
    ],
    tips: ['Water plants early morning or evening for best absorption', 'Regular pruning promotes healthy, bushy growth', 'Use organic compost for a healthier, chemical-free garden', 'Group plants with similar water needs together'],
    faqs: [
      { q: 'Do gardeners bring their own tools?', a: 'Yes, gardeners come with all necessary tools, equipment, and basic supplies.' },
      { q: 'Can you design a garden from scratch?', a: 'Absolutely! Our gardeners can design and set up a complete garden based on your preferences and budget.' },
      { q: 'How often should I schedule gardening?', a: 'For maintained gardens, monthly visits are recommended. Lawns may need bi-weekly mowing in growing season.' },
      { q: 'Do you use chemical pesticides?', a: 'We prefer organic and eco-friendly pest control methods. Chemical treatments are used only when necessary.' },
    ],
    whyUs: ['Organic and eco-friendly methods', 'Custom garden design included', 'Seasonal maintenance plans', 'Plant health guarantee'],
  },
};

const SharedHeader = ({ navigate }) => (
  <header className="landing-header" style={{position:'sticky', top:0, zIndex:100, background:'white', boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
    <div className="logo" onClick={() => navigate('/')} style={{cursor:'pointer'}}>
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
);

const SharedFooter = () => (
  <footer className="landing-footer">
    <div className="footer-content">
      <div className="footer-section">
        <div className="logo"><div className="logo-icon">🏠</div><span className="logo-text">Hyperlocal Jobs</span></div>
        <p>Connecting skilled workers with customers for a better tomorrow.</p>
        <p style={{marginTop:'0.75rem', color:'#9ca3af', fontSize:'0.85rem'}}>Built by Ashwini Lokhande</p>
      </div>
      <div className="footer-section">
        <h4>Quick Links</h4>
        <a href="/">Home</a><a href="/about">About Us</a><a href="/contact">Contact Us</a><a href="/login">Login</a>
      </div>
      <div className="footer-section">
        <h4>Services</h4>
        {['electrician','plumber','carpenter','mechanic','tutor','painter','cleaner','gardener'].map(s => (
          <a key={s} href={`/service/${s}`} style={{textTransform:'capitalize'}}>{s}</a>
        ))}
      </div>
      <div className="footer-section">
        <h4>Contact</h4>
        <p>📞 8767823948</p><p>📧 contact@ansoftio.com</p><p>🌐 ansoftio.com</p>
      </div>
    </div>
    <div className="footer-bottom">
      <p>&copy; 2026 Hyperlocal Jobs. All rights reserved. | Built by Ashwini Lokhande | 📞 8767823948 | 📧 contact@ansoftio.com | 🌐 ansoftio.com</p>
    </div>
  </footer>
);

const ServicePage = () => {
  const { service } = useParams();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const data = serviceData[service?.toLowerCase()];

  if (!data) {
    return (
      <div style={{minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1rem'}}>
        <div style={{fontSize:'4rem'}}>🔍</div>
        <h2 style={{color:'#1f2937'}}>Service not found</h2>
        <button className="btn-primary" onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  return (
    <div className={`sp-page sp-${data.theme}`}>
      <SharedHeader navigate={navigate} />

      {/* Hero */}
      <section className="sp-hero" style={{background: data.heroGradient}}>
        <div className="sp-hero-inner">
          <div className="sp-hero-icon">{data.icon}</div>
          <h1 className="sp-hero-title">{data.name}</h1>
          <p className="sp-hero-tagline">{data.tagline}</p>
          <div className="sp-stats-row">
            {data.stats.map((s, i) => (
              <div key={i} className="sp-stat-pill">
                <span className="sp-stat-val">{s.v}</span>
                <span className="sp-stat-lbl">{s.l}</span>
              </div>
            ))}
          </div>
          <div className="sp-hero-btns">
            <button className="sp-btn-book" onClick={() => navigate('/register')}>Book Now</button>
            <button className="sp-btn-worker" onClick={() => navigate('/register?role=worker')}>Work as {data.name}</button>
          </div>
        </div>
      </section>

      {/* About + Why Us */}
      <section className="sp-about-section" style={{background: data.lightBg}}>
        <div className="sp-container sp-about-grid">
          <div className="sp-about-text">
            <h2 className="sp-section-h2" style={{color: data.accentColor}}>About This Service</h2>
            <p className="sp-desc">{data.description}</p>
            <div className="sp-why-box" style={{borderColor: data.accentColor}}>
              <h4 style={{color: data.accentColor, marginBottom:'1rem'}}>✅ Why Choose Us</h4>
              {data.whyUs.map((w, i) => (
                <div key={i} className="sp-why-item">
                  <span className="sp-check" style={{color: data.accentColor}}>✓</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="sp-tips-box">
            <h2 className="sp-section-h2" style={{color: data.accentColor}}>💡 Pro Tips</h2>
            {data.tips.map((tip, i) => (
              <div key={i} className="sp-tip-item" style={{borderLeftColor: data.accentColor}}>
                <span className="sp-tip-num" style={{background: data.accentColor}}>{i + 1}</span>
                <p>{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="sp-services-section">
        <div className="sp-container">
          <h2 className="sp-center-h2">What We Offer</h2>
          <p className="sp-center-sub">Comprehensive {data.name.toLowerCase()} services for every need</p>
          <div className="sp-services-grid">
            {data.services.map((s, i) => (
              <div key={i} className="sp-service-item" style={{'--accent': data.accentColor}}>
                <div className="sp-svc-icon">{s.icon}</div>
                <h4 className="sp-svc-name">{s.name}</h4>
                <p className="sp-svc-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="sp-process-section" style={{background: data.lightBg}}>
        <div className="sp-container">
          <h2 className="sp-center-h2">How It Works</h2>
          <p className="sp-center-sub">Simple steps to get your job done</p>
          <div className="sp-process-grid">
            {data.process.map((p, i) => (
              <div key={i} className="sp-process-card">
                <div className="sp-process-num" style={{background: data.heroGradient}}>{p.step}</div>
                <h4 className="sp-process-title">{p.title}</h4>
                <p className="sp-process-desc">{p.desc}</p>
                {i < data.process.length - 1 && <div className="sp-process-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="sp-faq-section">
        <div className="sp-container sp-faq-inner">
          <h2 className="sp-center-h2">Frequently Asked Questions</h2>
          <p className="sp-center-sub">Everything you need to know</p>
          <div className="sp-faq-list">
            {data.faqs.map((faq, i) => (
              <div key={i} className="sp-faq-item" style={{borderColor: openFaq === i ? data.accentColor : '#e5e7eb'}}>
                <button className="sp-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  <span className="sp-faq-toggle" style={{color: data.accentColor, transform: openFaq === i ? 'rotate(45deg)' : 'none'}}>+</span>
                </button>
                {openFaq === i && <p className="sp-faq-a">{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="sp-cta-section" style={{background: data.heroGradient}}>
        <h2 className="sp-cta-title">Ready to Book a {data.name}?</h2>
        <p className="sp-cta-sub">Get connected with verified professionals near you — fast, safe, and affordable</p>
        <div className="sp-cta-btns">
          <button className="sp-btn-book" onClick={() => navigate('/register')}>Find a {data.name}</button>
          <button className="sp-btn-worker" onClick={() => navigate('/register?role=worker')}>Join as {data.name}</button>
        </div>
      </section>

      <SharedFooter />
    </div>
  );
};

export default ServicePage;
