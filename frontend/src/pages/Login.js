import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [robotChecked, setRobotChecked] = useState(false);
  const [robotVerified, setRobotVerified] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRobotCheck = () => {
    if (!robotChecked) { setRobotChecked(true); setTimeout(() => setRobotVerified(true), 800); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!robotVerified) { toast.error('Please verify that you are not a robot.'); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      // Redirect based on role — avoid the dashboard→admin redirect loop
      const cached = localStorage.getItem('cached_user');
      const u = cached ? JSON.parse(cached) : null;
      navigate(u?.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      {/* Left panel — branding */}
      <div style={{ flex:1, background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'3rem', color:'white' }} className="login-brand-panel">
        <div style={{ fontSize:'4rem', marginBottom:'1.5rem' }}>🏠</div>
        <h1 style={{ fontSize:'2rem', fontWeight:900, marginBottom:'1rem', textAlign:'center' }}>Hyperlocal Jobs</h1>
        <p style={{ fontSize:'1.05rem', opacity:0.9, textAlign:'center', lineHeight:1.7, maxWidth:320 }}>
          Connect with trusted local professionals for all your home service needs.
        </p>
        <div style={{ marginTop:'3rem', display:'flex', flexDirection:'column', gap:'1rem', width:'100%', maxWidth:280 }}>
          {[
            { icon:'⚡', text:'Verified skilled workers' },
            { icon:'📍', text:'GPS-powered nearby search' },
            { icon:'💳', text:'Secure payments' },
            { icon:'⭐', text:'Genuine reviews & ratings' },
          ].map(f => (
            <div key={f.text} style={{ display:'flex', alignItems:'center', gap:'0.875rem', background:'rgba(255,255,255,0.12)', padding:'0.875rem 1.25rem', borderRadius:12 }}>
              <span style={{ fontSize:'1.25rem' }}>{f.icon}</span>
              <span style={{ fontSize:'0.9rem', fontWeight:500 }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem 1rem', background:'#f8fafc', minWidth:0 }}>
        <div style={{ background:'white', padding:'2rem 1.5rem', borderRadius:20, boxShadow:'0 4px 24px rgba(0,0,0,0.1)', width:'100%', maxWidth:440 }}>
          <div style={{ textAlign:'center', marginBottom:'2rem' }}>
            <div style={{ width:56, height:56, background:'linear-gradient(135deg,#667eea,#764ba2)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.75rem', margin:'0 auto 1rem' }}>🏠</div>
            <h2 style={{ fontSize:'1.5rem', fontWeight:800, color:'#1f2937', marginBottom:'0.25rem' }}>Welcome Back</h2>
            <p style={{ color:'#9ca3af', fontSize:'0.875rem' }}>Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:'1.25rem' }}>
              <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.5rem', fontSize:'0.875rem' }}>Email Address</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ width:'100%', padding:'0.875rem 1rem', border:'2px solid #e5e7eb', borderRadius:10, fontSize:'0.95rem', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor='#6366f1'}
                onBlur={e => e.target.style.borderColor='#e5e7eb'} />
            </div>

            <div style={{ marginBottom:'1.25rem' }}>
              <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.5rem', fontSize:'0.875rem' }}>Password</label>
              <div style={{ position:'relative' }}>
                <input type={showPass ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required
                  style={{ width:'100%', padding:'0.875rem 3rem 0.875rem 1rem', border:'2px solid #e5e7eb', borderRadius:10, fontSize:'0.95rem', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor='#6366f1'}
                  onBlur={e => e.target.style.borderColor='#e5e7eb'} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position:'absolute', right:'0.875rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'1.1rem', color:'#9ca3af', padding:0 }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Robot check */}
            <div onClick={handleRobotCheck} style={{ display:'flex', alignItems:'center', gap:'1rem', border:'2px solid #e5e7eb', borderRadius:10, padding:'0.875rem 1.25rem', cursor:'pointer', background:'#f9fafb', marginBottom:'1.5rem', userSelect:'none', transition:'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='#6366f1'}
              onMouseLeave={e => e.currentTarget.style.borderColor='#e5e7eb'}>
              <div style={{ width:24, height:24, border:'2px solid', borderColor: robotVerified ? '#22c55e' : '#9ca3af', borderRadius:4, background: robotVerified ? '#22c55e' : 'white', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:'0.9rem', flexShrink:0, transition:'all 0.3s' }}>
                {robotVerified ? '✓' : robotChecked ? <span style={{ width:12, height:12, border:'2px solid #6366f1', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.6s linear infinite', display:'inline-block' }}></span> : ''}
              </div>
              <span style={{ flex:1, color:'#374151', fontSize:'0.9rem', fontWeight:500 }}>I'm not a robot</span>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'1.25rem' }}>🛡️</div>
                <div style={{ fontSize:'0.6rem', color:'#9ca3af' }}>reCAPTCHA</div>
              </div>
            </div>

            <button type="submit" disabled={loading || !robotVerified}
              style={{ width:'100%', padding:'1rem', background: loading || !robotVerified ? '#e5e7eb' : 'linear-gradient(135deg,#667eea,#764ba2)', color: loading || !robotVerified ? '#9ca3af' : 'white', border:'none', borderRadius:10, fontSize:'1rem', fontWeight:700, cursor: loading || !robotVerified ? 'not-allowed' : 'pointer', transition:'all 0.2s', marginBottom:'1.25rem' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <p style={{ textAlign:'center', color:'#6b7280', fontSize:'0.875rem' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color:'#6366f1', fontWeight:700, textDecoration:'none' }}>Create Account</Link>
            </p>
          </form>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .login-brand-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Login;
