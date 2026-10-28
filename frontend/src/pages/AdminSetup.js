import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';

const AdminSetup = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });

  useEffect(() => {
    api.get('/admin/check')
      .then(res => { setAdminExists(res.data.exists); setChecking(false); })
      .catch(() => setChecking(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/admin/setup', form);
      localStorage.setItem('token', data.token);
      toast.success('Admin account created! Redirecting...');
      // Full reload so AuthContext picks up the new token
      window.location.href = '/admin';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner}></div>
        <p style={{color:'#6b7280', marginTop:'1rem'}}>Checking setup status...</p>
      </div>
    );
  }

  if (adminExists) {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <div style={{fontSize:'4rem', marginBottom:'1rem'}}>🔒</div>
          <h2 style={styles.title}>Admin Already Exists</h2>
          <p style={styles.sub}>An admin account has already been created for this platform. Only one admin is allowed.</p>
          <button style={styles.btnPrimary} onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{textAlign:'center', marginBottom:'2rem'}}>
          <div style={styles.logoBox}>🏠</div>
          <h2 style={styles.title}>First-Time Admin Setup</h2>
          <p style={styles.sub}>Create the administrator account for Hyperlocal Jobs. This can only be done once.</p>
          <div style={styles.badge}>⚠️ One-time setup — no second admin allowed</div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input
              style={styles.input} type="text" placeholder="Admin Name" required
              value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input
              style={styles.input} type="email" placeholder="admin@example.com" required
              value={form.email} onChange={e => setForm({...form, email: e.target.value})}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <div style={styles.passWrap}>
              <input
                style={{...styles.input, paddingRight:'3rem'}}
                type={showPass ? 'text' : 'password'}
                placeholder="Min 6 characters" required minLength="6"
                value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              />
              <button type="button" style={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Phone Number</label>
            <input
              style={styles.input} type="tel" placeholder="Phone number" required
              value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
            />
          </div>
          <button type="submit" style={styles.btnPrimary} disabled={loading}>
            {loading ? 'Creating Admin...' : '🚀 Create Admin Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight:'100vh', background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' },
  center: { minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'1rem' },
  card: { background:'white', borderRadius:'20px', padding:'2rem 1.5rem', width:'100%', maxWidth:'460px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
  logoBox: { fontSize:'3rem', background:'linear-gradient(135deg, #667eea, #764ba2)', width:'70px', height:'70px', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' },
  title: { fontSize:'1.6rem', fontWeight:'800', color:'#1f2937', marginBottom:'0.5rem' },
  sub: { color:'#6b7280', fontSize:'0.95rem', lineHeight:'1.6', marginBottom:'1rem' },
  badge: { background:'#fef3c7', color:'#92400e', padding:'0.5rem 1rem', borderRadius:'8px', fontSize:'0.85rem', fontWeight:'600', display:'inline-block' },
  form: { display:'flex', flexDirection:'column', gap:'1.25rem', marginTop:'1.5rem' },
  field: { display:'flex', flexDirection:'column', gap:'0.4rem' },
  label: { fontSize:'0.875rem', fontWeight:'600', color:'#374151' },
  input: { padding:'0.875rem 1rem', border:'2px solid #e5e7eb', borderRadius:'10px', fontSize:'1rem', outline:'none', width:'100%', boxSizing:'border-box', transition:'border-color 0.2s' },
  passWrap: { position:'relative' },
  eyeBtn: { position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'1.1rem', padding:'0.25rem' },
  btnPrimary: { padding:'1rem', background:'linear-gradient(135deg, #667eea, #764ba2)', color:'white', border:'none', borderRadius:'10px', fontSize:'1rem', fontWeight:'700', cursor:'pointer', marginTop:'0.5rem' },
  spinner: { width:'40px', height:'40px', border:'4px solid #e5e7eb', borderTopColor:'#667eea', borderRadius:'50%', animation:'spin 0.8s linear infinite' },
};

export default AdminSetup;
