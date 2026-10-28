import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../utils/api';
import AddressSearchInput from '../components/AddressSearchInput';

const SKILLS = ['Electrician','Plumber','Carpenter','Mechanic','Tutor','Painter','Cleaner','Gardener','AC Technician','Appliance Repair'];

const Register = () => {
  const location = useLocation();
  const [robotChecked, setRobotChecked] = useState(false);
  const [robotVerified, setRobotVerified] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [adminExists, setAdminExists] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [workerLocation, setWorkerLocation] = useState({ address:'', latitude:0, longitude:0, city:'', state:'', pincode:'' });
  const [formData, setFormData] = useState({
    name:'', email:'', password:'', phone:'', role:'customer',
    workerProfile:{ skills:[], experience:'', hourlyRate:'', bio:'' }
  });
  const [selectedSkills, setSelectedSkills] = useState([]);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('role') === 'worker') setFormData(p => ({ ...p, role:'worker' }));
    api.get('/admin/check').then(r => setAdminExists(r.data.exists)).catch(() => setAdminExists(false));
  }, [location]);

  const toggleSkill = (skill) => {
    const next = selectedSkills.includes(skill) ? selectedSkills.filter(s => s !== skill) : [...selectedSkills, skill];
    setSelectedSkills(next);
    setFormData(p => ({ ...p, workerProfile:{ ...p.workerProfile, skills:next } }));
  };

  const handleRobotCheck = () => {
    if (!robotChecked) { setRobotChecked(true); setTimeout(() => setRobotVerified(true), 800); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!robotVerified) { toast.error('Please verify you are not a robot.'); return; }
    if (formData.role === 'worker') {
      if (!selectedSkills.length) { toast.error('Select at least one skill'); return; }
      if (!formData.workerProfile.experience) { toast.error('Enter your experience'); return; }
      if (!formData.workerProfile.hourlyRate) { toast.error('Enter your hourly rate'); return; }
    }
    setSubmitting(true);
    try {
      const payload = formData.role === 'worker' ? {
        ...formData,
        location: workerLocation.latitude ? { type:'Point', coordinates:[workerLocation.longitude, workerLocation.latitude], address:workerLocation.address } : undefined
      } : { name:formData.name, email:formData.email, password:formData.password, phone:formData.phone, role:formData.role };
      await register(payload);
      toast.success('Welcome to Hyperlocal Jobs!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setSubmitting(false); }
  };

  const inp = { width:'100%', padding:'0.875rem 1rem', border:'2px solid #e5e7eb', borderRadius:10, fontSize:'0.95rem', outline:'none', boxSizing:'border-box', fontFamily:'inherit', transition:'border-color 0.2s' };
  const lbl = { display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem' };
  const onFocus = e => e.target.style.borderColor = '#6366f1';
  const onBlur  = e => e.target.style.borderColor = '#e5e7eb';

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      {/* Left branding panel */}
      <div style={{ flex:'0 0 380px', background:'linear-gradient(160deg,#4f46e5 0%,#7c3aed 100%)', display:'flex', flexDirection:'column', padding:'3rem 2.5rem', color:'white' }} className="register-brand-panel">
        <div onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:'0.75rem', cursor:'pointer', marginBottom:'3rem' }}>
          <div style={{ width:42, height:42, background:'rgba(255,255,255,0.2)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem' }}>🏠</div>
          <span style={{ fontSize:'1.1rem', fontWeight:800 }}>Hyperlocal Jobs</span>
        </div>
        <div style={{ flex:1 }}>
          <h2 style={{ fontSize:'1.75rem', fontWeight:900, marginBottom:'1rem', lineHeight:1.2 }}>Join thousands of skilled workers & customers</h2>
          <p style={{ opacity:0.85, lineHeight:1.7, marginBottom:'2.5rem', fontSize:'0.95rem' }}>
            Find trusted local professionals or offer your skills to customers in your area.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {[
              { icon:'🔍', text:'GPS-powered worker discovery' },
              { icon:'✅', text:'Verified & background-checked workers' },
              { icon:'💬', text:'Real-time chat & quote negotiation' },
              { icon:'💳', text:'Secure payments & digital invoices' },
              { icon:'⭐', text:'Genuine reviews from verified customers' },
            ].map(f => (
              <div key={f.text} style={{ display:'flex', alignItems:'center', gap:'0.875rem', background:'rgba(255,255,255,0.1)', padding:'0.875rem 1.25rem', borderRadius:12 }}>
                <span style={{ fontSize:'1.1rem', flexShrink:0 }}>{f.icon}</span>
                <span style={{ fontSize:'0.875rem', fontWeight:500 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ opacity:0.6, fontSize:'0.78rem', marginTop:'2rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color:'white', fontWeight:700 }}>Sign in →</Link>
        </p>
      </div>

      {/* Right form panel */}
      <div style={{ flex:1, overflowY:'auto', background:'#f8fafc', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'1.5rem 1rem' }}>
        <div style={{ background:'white', borderRadius:20, boxShadow:'0 4px 24px rgba(0,0,0,0.08)', padding:'2rem 1.5rem', width:'100%', maxWidth:560, margin:'auto' }}>

          {/* Header */}
          <div style={{ marginBottom:'2rem' }}>
            <h2 style={{ fontSize:'1.5rem', fontWeight:800, color:'#1f2937', marginBottom:'0.25rem' }}>Create Your Account</h2>
            <p style={{ color:'#9ca3af', fontSize:'0.875rem' }}>
              {formData.role === 'worker' ? 'Join as a skilled worker — admin approval required' : 'Find skilled workers near you'}
            </p>
          </div>

          {/* Role selector */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.875rem', marginBottom:'1.5rem' }}>
            {[
              { value:'customer', icon:'👤', name:'Customer', desc:'Find workers' },
              { value:'worker',   icon:'👷', name:'Worker',   desc:'Offer services' },
            ].map(r => (
              <label key={r.value} style={{ cursor:'pointer' }}>
                <input type="radio" name="role" value={r.value} checked={formData.role === r.value} onChange={e => setFormData(p => ({...p, role:e.target.value}))} style={{ display:'none' }} />
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'1.1rem', border:`2px solid ${formData.role===r.value?'#6366f1':'#e5e7eb'}`, borderRadius:12, background:formData.role===r.value?'#eff6ff':'#f9fafb', transition:'all 0.2s', boxShadow:formData.role===r.value?'0 4px 12px rgba(99,102,241,0.15)':'none' }}>
                  <span style={{ fontSize:'1.75rem', marginBottom:'0.4rem' }}>{r.icon}</span>
                  <span style={{ fontWeight:700, color:'#1f2937', fontSize:'0.9rem' }}>{r.name}</span>
                  <span style={{ fontSize:'0.75rem', color:'#9ca3af', marginTop:'0.15rem' }}>{r.desc}</span>
                </div>
              </label>
            ))}
          </div>

          {/* Admin setup card */}
          {adminExists === null && (
            <div style={{ textAlign:'center', padding:'0.75rem', color:'#9ca3af', fontSize:'0.82rem', marginBottom:'1rem' }}>Checking setup status...</div>
          )}
          {adminExists === false && (
            <div onClick={() => navigate('/admin-setup')} style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'1rem 1.25rem', background:'linear-gradient(135deg,#1f2937,#374151)', borderRadius:12, cursor:'pointer', border:'2px solid #f59e0b', marginBottom:'1.5rem', transition:'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
              <span style={{ fontSize:'1.75rem' }}>🛡️</span>
              <div style={{ flex:1 }}>
                <div style={{ color:'white', fontWeight:700, fontSize:'0.9rem' }}>Admin Account Setup</div>
                <div style={{ color:'#9ca3af', fontSize:'0.78rem' }}>First-time setup — create the platform administrator</div>
              </div>
              <span style={{ color:'#f59e0b', fontSize:'1.1rem' }}>→</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Basic fields */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
              <div>
                <label style={lbl}>Full Name</label>
                <input style={inp} type="text" placeholder="Your full name" value={formData.name} onChange={e => setFormData(p=>({...p,name:e.target.value}))} required onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label style={lbl}>Phone Number</label>
                <input style={inp} type="tel" placeholder="+91 98765 43210" value={formData.phone} onChange={e => setFormData(p=>({...p,phone:e.target.value}))} required onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>
            <div style={{ marginBottom:'1rem' }}>
              <label style={lbl}>Email Address</label>
              <input style={inp} type="email" placeholder="you@example.com" value={formData.email} onChange={e => setFormData(p=>({...p,email:e.target.value}))} required onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div style={{ marginBottom:'1.5rem' }}>
              <label style={lbl}>Password</label>
              <div style={{ position:'relative' }}>
                <input style={{ ...inp, paddingRight:'3rem' }} type={showPass?'text':'password'} placeholder="Minimum 6 characters" value={formData.password} onChange={e => setFormData(p=>({...p,password:e.target.value}))} required minLength="6" onFocus={onFocus} onBlur={onBlur} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position:'absolute', right:'0.875rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'1.1rem', color:'#9ca3af', padding:0 }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Worker fields */}
            {formData.role === 'worker' && (
              <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:14, padding:'1.5rem', marginBottom:'1.5rem' }}>
                <h4 style={{ color:'#1f2937', fontWeight:700, marginBottom:'1.25rem', fontSize:'0.95rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <span style={{ background:'#ede9fe', color:'#7c3aed', width:28, height:28, borderRadius:8, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem' }}>👷</span>
                  Professional Details
                </h4>

                <label style={{ ...lbl, marginBottom:'0.75rem' }}>Services you offer *</label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'0.5rem', marginBottom:'1.25rem' }}>
                  {SKILLS.map(skill => (
                    <div key={skill} onClick={() => toggleSkill(skill)}
                      style={{ padding:'0.6rem 0.875rem', border:`2px solid ${selectedSkills.includes(skill)?'#6366f1':'#e5e7eb'}`, borderRadius:8, cursor:'pointer', fontSize:'0.82rem', fontWeight:600, color:selectedSkills.includes(skill)?'white':'#6b7280', background:selectedSkills.includes(skill)?'linear-gradient(135deg,#667eea,#764ba2)':'white', transition:'all 0.15s', textAlign:'center', userSelect:'none' }}>
                      {skill}
                    </div>
                  ))}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
                  <div>
                    <label style={lbl}>Experience (years) *</label>
                    <input style={inp} type="number" placeholder="e.g. 5" value={formData.workerProfile.experience} onChange={e => setFormData(p=>({...p,workerProfile:{...p.workerProfile,experience:e.target.value}}))} min="0" required onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <label style={lbl}>Hourly Rate (₹) *</label>
                    <input style={inp} type="number" placeholder="e.g. 350" value={formData.workerProfile.hourlyRate} onChange={e => setFormData(p=>({...p,workerProfile:{...p.workerProfile,hourlyRate:e.target.value}}))} min="0" required onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>

                <div style={{ marginBottom:'1rem' }}>
                  <label style={lbl}>About Yourself</label>
                  <textarea style={{ ...inp, minHeight:72, resize:'vertical' }} placeholder="Brief description about your skills and experience..." value={formData.workerProfile.bio} onChange={e => setFormData(p=>({...p,workerProfile:{...p.workerProfile,bio:e.target.value}}))} rows={3} onFocus={onFocus} onBlur={onBlur} />
                </div>

                <div>
                  <label style={lbl}>Service Area / Address</label>
                  <AddressSearchInput value={workerLocation.address} onChange={addr => setWorkerLocation(p=>({...p,address:addr}))} onSelect={loc => setWorkerLocation(loc)} placeholder="Search your city or area..." />
                  {workerLocation.city && (
                    <div style={{ marginTop:'0.5rem', fontSize:'0.8rem', color:'#6b7280', display:'flex', alignItems:'center', gap:'0.35rem' }}>
                      <span>📍</span>
                      <span>{workerLocation.city}{workerLocation.state?`, ${workerLocation.state}`:''}{workerLocation.pincode?` — ${workerLocation.pincode}`:''}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Robot check */}
            <div onClick={handleRobotCheck} style={{ display:'flex', alignItems:'center', gap:'1rem', border:`2px solid ${robotVerified?'#22c55e':'#e5e7eb'}`, borderRadius:10, padding:'0.875rem 1.25rem', cursor:'pointer', background:robotVerified?'#f0fdf4':'#f9fafb', marginBottom:'1.5rem', userSelect:'none', transition:'all 0.2s' }}>
              <div style={{ width:24, height:24, border:`2px solid ${robotVerified?'#22c55e':'#9ca3af'}`, borderRadius:4, background:robotVerified?'#22c55e':'white', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:'0.9rem', flexShrink:0, transition:'all 0.3s' }}>
                {robotVerified ? '✓' : robotChecked ? <span style={{ width:12, height:12, border:'2px solid #6366f1', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.6s linear infinite', display:'inline-block' }}></span> : ''}
              </div>
              <span style={{ flex:1, color:'#374151', fontSize:'0.9rem', fontWeight:500 }}>I'm not a robot</span>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'1.25rem' }}>🛡️</div>
                <div style={{ fontSize:'0.6rem', color:'#9ca3af' }}>reCAPTCHA</div>
              </div>
            </div>

            <button type="submit" disabled={submitting || !robotVerified}
              style={{ width:'100%', padding:'1rem', background: submitting||!robotVerified ? '#e5e7eb' : 'linear-gradient(135deg,#667eea,#764ba2)', color: submitting||!robotVerified ? '#9ca3af' : 'white', border:'none', borderRadius:10, fontSize:'1rem', fontWeight:700, cursor: submitting||!robotVerified ? 'not-allowed' : 'pointer', transition:'all 0.2s', marginBottom:'1.25rem' }}>
              {submitting ? 'Creating account...' : formData.role === 'worker' ? '👷 Register as Worker' : '👤 Create Account'}
            </button>

            <p style={{ textAlign:'center', color:'#6b7280', fontSize:'0.875rem' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color:'#6366f1', fontWeight:700, textDecoration:'none' }}>Sign in</Link>
            </p>
          </form>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) { .register-brand-panel { display: none !important; } }
      `}</style>
    </div>
  );
};

export default Register;
