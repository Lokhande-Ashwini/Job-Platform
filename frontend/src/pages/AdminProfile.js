import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../utils/api';

const AdminProfile = ({ onClose }) => {
  const { user, refreshUser, logout } = useAuth();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '' });
  const [pwForm, setPwForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [showPw, setShowPw] = useState({ current:false, new:false, confirm:false });
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);

  const inp = { width:'100%', padding:'0.875rem 1rem', border:'2px solid #e5e7eb', borderRadius:10, fontSize:'0.95rem', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s', fontFamily:'inherit' };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.name.trim().length < 2) { toast.error('Name must be at least 2 characters'); return; }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error('Invalid email address'); return; }
    if (form.phone && form.phone.replace(/\D/g,'').length < 10) { toast.error('Phone must be at least 10 digits'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      if (form.phone) fd.append('phone', form.phone.trim());
      if (form.email && form.email !== user?.email) fd.append('email', form.email.trim());
      if (avatarFile) fd.append('avatar', avatarFile);
      await api.patch('/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser();
      toast.success('Profile updated!');
      if (onClose) onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
    finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (pwForm.newPassword === pwForm.currentPassword) { toast.error('New password must differ from current'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await api.patch('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const removeAvatar = async () => {
    try {
      await api.delete('/profile/avatar');
      setAvatarPreview('');
      setAvatarFile(null);
      await refreshUser();
      toast.success('Avatar removed');
    } catch { toast.error('Failed to remove avatar'); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:'1rem', backdropFilter:'blur(4px)' }}>
      <div style={{ background:'white', borderRadius:20, width:'100%', maxWidth:540, boxShadow:'0 20px 60px rgba(0,0,0,0.25)', overflow:'hidden', animation:'fadeIn 0.2s ease', maxHeight:'92vh', display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#1e1b4b,#4f46e5)', padding:'1.5rem 2rem', display:'flex', alignItems:'center', gap:'1rem', flexShrink:0 }}>
          <div style={{ position:'relative' }}>
            <div style={{ width:60, height:60, borderRadius:'50%', overflow:'hidden', border:'3px solid rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'1.5rem' }}>
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : user?.name?.charAt(0) || 'A'}
            </div>
            <label style={{ position:'absolute', bottom:0, right:0, width:22, height:22, borderRadius:'50%', background:'#6366f1', color:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'0.65rem', border:'2px solid white' }}>
              📷<input type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatarChange} />
            </label>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ color:'white', fontWeight:700, fontSize:'1.05rem' }}>{user?.name}</div>
            <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.82rem' }}>Administrator · {user?.email}</div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'white', width:32, height:32, borderRadius:'50%', cursor:'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid #f3f4f6', flexShrink:0 }}>
          {[['profile','👤 Profile'],['password','🔒 Password']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ flex:1, padding:'0.875rem', border:'none', background:'none', cursor:'pointer', fontWeight:600, fontSize:'0.875rem', color:tab===k?'#6366f1':'#9ca3af', borderBottom:tab===k?'2px solid #6366f1':'2px solid transparent', transition:'all 0.2s' }}>{l}</button>
          ))}
        </div>

        <div style={{ padding:'1.75rem 2rem', overflowY:'auto', flex:1 }}>
          {tab === 'profile' && (
            <form onSubmit={saveProfile} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
              {/* Avatar actions */}
              {avatarPreview && (
                <button type="button" onClick={removeAvatar} style={{ alignSelf:'flex-start', background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:'0.8rem', padding:0 }}>
                  🗑️ Remove profile photo
                </button>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div>
                  <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem' }}>Full Name *</label>
                  <input style={inp} type="text" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} required onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
                </div>
                <div>
                  <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem' }}>Phone</label>
                  <input style={inp} type="tel" value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
                </div>
              </div>
              <div>
                <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem' }}>Email Address</label>
                <input style={inp} type="email" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
                {form.email !== user?.email && <p style={{ fontSize:'0.75rem', color:'#f59e0b', marginTop:'0.3rem' }}>⚠️ Changing email will require re-login</p>}
              </div>
              <div style={{ background:'#f9fafb', padding:'1rem', borderRadius:10, border:'1px solid #e5e7eb' }}>
                <div style={{ display:'flex', gap:'1.5rem', fontSize:'0.875rem', flexWrap:'wrap' }}>
                  <div><span style={{ color:'#9ca3af' }}>Role: </span><span style={{ fontWeight:600, color:'#6366f1' }}>Administrator</span></div>
                  <div><span style={{ color:'#9ca3af' }}>Joined: </span><span style={{ fontWeight:600, color:'#374151' }}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : 'N/A'}</span></div>
                  <div><span style={{ color:'#9ca3af' }}>ID: </span><span style={{ fontWeight:600, color:'#374151' }}>…{user?._id?.slice(-8) || 'N/A'}</span></div>
                </div>
              </div>
              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button type="submit" disabled={saving} style={{ flex:1, padding:'0.875rem', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', opacity:saving?0.7:1 }}>
                  {saving ? '⏳ Saving...' : '💾 Save Changes'}
                </button>
                <button type="button" onClick={onClose} style={{ flex:1, padding:'0.875rem', background:'#f3f4f6', color:'#6b7280', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer' }}>Cancel</button>
              </div>
            </form>
          )}

          {tab === 'password' && (
            <form onSubmit={changePassword} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
              {[
                ['currentPassword','Current Password','current'],
                ['newPassword','New Password','new'],
                ['confirmPassword','Confirm New Password','confirm'],
              ].map(([field, label, key]) => (
                <div key={field}>
                  <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem' }}>{label}</label>
                  <div style={{ position:'relative' }}>
                    <input style={{ ...inp, paddingRight:'3rem' }} type={showPw[key]?'text':'password'} value={pwForm[field]} onChange={e => setPwForm(p=>({...p,[field]:e.target.value}))} required onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
                    <button type="button" onClick={() => setShowPw(p=>({...p,[key]:!p[key]}))} style={{ position:'absolute', right:'0.875rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'1rem', color:'#9ca3af', padding:0 }}>
                      {showPw[key] ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              ))}
              {pwForm.newPassword && pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                <div style={{ color:'#ef4444', fontSize:'0.8rem' }}>❌ Passwords do not match</div>
              )}
              {pwForm.newPassword && pwForm.confirmPassword && pwForm.newPassword === pwForm.confirmPassword && pwForm.newPassword.length >= 6 && (
                <div style={{ color:'#10b981', fontSize:'0.8rem' }}>✅ Passwords match</div>
              )}
              <div style={{ background:'#fef3c7', padding:'0.875rem 1rem', borderRadius:8, fontSize:'0.82rem', color:'#92400e' }}>
                🔒 Password must be at least 6 characters.
              </div>
              <button type="submit" disabled={saving} style={{ padding:'0.875rem', background:'#6366f1', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', opacity:saving?0.7:1 }}>
                {saving ? '⏳ Changing...' : '🔒 Change Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;