import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import AddressSearchInput from '../components/AddressSearchInput';
import ProfileCompletionBanner from '../components/ProfileCompletionBanner';
import VerifiedBadge, { workerBadgeType } from '../components/VerifiedBadge';
import TrustScoreCard from '../components/TrustScoreCard';
import ReviewSummaryCard from '../components/ReviewSummaryCard';
import api from '../utils/api';

// ─── Style constants ────────────────────────────────────────────────────────
const CARD = { background:'white', borderRadius:16, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', padding:'1.5rem' };
const INP  = { width:'100%', padding:'0.75rem 1rem', border:'1px solid #d1d5db', borderRadius:10, fontSize:'0.9rem', outline:'none', boxSizing:'border-box', fontFamily:'inherit', transition:'border-color 0.2s' };
const LBL  = { display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem' };
const BTN_PRIMARY   = { padding:'0.75rem 1.5rem', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:'0.9rem', transition:'all 0.2s' };
const BTN_SECONDARY = { padding:'0.75rem 1.5rem', background:'#f3f4f6', color:'#374151', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer', fontSize:'0.9rem' };

// ─── Trust score ─────────────────────────────────────────────────────────────
const calcTrust = (p) => {
  if (!p) return { score:0, level:'Bronze', color:'#b45309', breakdown:[] };
  let s = 0;
  const bd = [];
  const add = (label, pts, max, icon, tip) => { s += pts; bd.push({ label, pts, max, icon, tip }); };
  add('Admin Verified',     p.verificationStatus==='verified'?20:0, 20, '✅', 'Get verified by admin');
  add('ID Document',        p.idDocument?10:0,                      10, '🪪', 'Upload government ID');
  add('Verification Selfie',p.photoVerification?5:0,                 5, '🤳', 'Upload selfie');
  add('Star Rating',        Math.round((p.rating||0)*4),            20, '⭐', 'Higher ratings = more pts');
  add('Jobs Completed',     Math.min(15,Math.round((p.totalJobs||0)*0.3)), 15, '📋', 'Complete more jobs');
  add('Completion Rate',    Math.round(((p.completionRate||0)/100)*10), 10, '📈', "Don't cancel jobs");
  add('Experience',         Math.min(10,Math.round(p.experience||0)), 10, '🏆', 'More experience = more pts');
  add('Total Reviews',      Math.min(10,Math.round((p.totalReviews||0)*0.5)), 10, '💬', 'Get more reviews');
  const score = Math.min(100, s);
  const level = score>=85?'Platinum':score>=70?'Gold':score>=50?'Silver':'Bronze';
  const color = {Platinum:'#6366f1',Gold:'#f59e0b',Silver:'#9ca3af',Bronze:'#b45309'}[level];
  return { score, level, color, breakdown: bd };
};

// ─── Market rates ─────────────────────────────────────────────────────────────
const MARKET_RATES = { Electrician:350, Plumber:300, Carpenter:450, Mechanic:500, Tutor:400, Painter:250, Cleaner:200, Gardener:300, 'AC Technician':450, 'Appliance Repair':350 };

const ALL_SKILLS = ['Electrician','Plumber','Carpenter','Mechanic','Tutor','Painter','Cleaner','Gardener','AC Technician','Appliance Repair'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fileToBase64 = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = rej;
  r.readAsDataURL(file);
});

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' }) : '—';

// ─── Sub-components ───────────────────────────────────────────────────────────
const FieldGroup = ({ label, children }) => (
  <div style={{ marginBottom:'1.25rem' }}>
    <label style={LBL}>{label}</label>
    {children}
  </div>
);

const PasswordInput = ({ value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position:'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ ...INP, paddingRight:'3rem' }}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        style={{ position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'1.1rem', color:'#6b7280' }}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
};

const ProgressBar = ({ value, max=100, color='#6366f1', height=8 }) => (
  <div style={{ background:'#f3f4f6', borderRadius:99, height, overflow:'hidden' }}>
    <div style={{ width:`${Math.min(100,(value/max)*100)}%`, height:'100%', background:color, borderRadius:99, transition:'width 0.4s' }} />
  </div>
);

const SectionTitle = ({ children }) => (
  <h3 style={{ fontSize:'1rem', fontWeight:700, color:'#1f2937', marginBottom:'1.25rem', paddingBottom:'0.75rem', borderBottom:'1px solid #f3f4f6' }}>{children}</h3>
);

// ─── Profile Header ───────────────────────────────────────────────────────────
const ProfileHeader = ({ profile, onAvatarChange, onAvatarRemove, avatarPreview }) => {
  const wp = profile?.workerProfile;
  const trust = calcTrust(wp);
  const roleLabel = profile?.role === 'worker' ? '👷 Worker' : profile?.role === 'admin' ? '🛡️ Admin' : '👤 Customer';
  const roleBg    = profile?.role === 'worker' ? '#ede9fe' : profile?.role === 'admin' ? '#fee2e2' : '#dbeafe';
  const roleColor = profile?.role === 'worker' ? '#5b21b6' : profile?.role === 'admin' ? '#991b1b' : '#1e40af';
  const avatarSrc = avatarPreview || profile?.avatar;
  const completion = profile?.profileCompletion ?? 0;

  return (
    <div style={{ ...CARD, marginBottom:'1.5rem', display:'flex', flexWrap:'wrap', gap:'1.5rem', alignItems:'center' }}>
      {/* Avatar */}
      <div style={{ position:'relative', flexShrink:0 }}>
        <div style={{ width:120, height:120, borderRadius:'50%', overflow:'hidden', border:'4px solid #e0e7ff', background:'linear-gradient(135deg,#667eea,#764ba2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {avatarSrc
            ? <img src={avatarSrc} alt={profile?.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <span style={{ fontSize:'2.5rem', color:'white', fontWeight:700 }}>{profile?.name?.[0]?.toUpperCase() || '?'}</span>
          }
        </div>
        <label style={{ position:'absolute', bottom:4, right:4, width:32, height:32, borderRadius:'50%', background:'#6366f1', color:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'0.85rem', boxShadow:'0 2px 6px rgba(0,0,0,0.2)' }}>
          📷
          <input type="file" accept="image/*" style={{ display:'none' }} onChange={onAvatarChange} />
        </label>
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:200 }}>
        <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:'0.5rem', marginBottom:'0.5rem' }}>
          <h2 style={{ margin:0, fontSize:'1.5rem', fontWeight:800, color:'#1f2937' }}>{profile?.name || 'User'}</h2>
          <span style={{ background:roleBg, color:roleColor, padding:'0.2rem 0.75rem', borderRadius:50, fontSize:'0.78rem', fontWeight:700 }}>{roleLabel}</span>
          {wp?.verificationStatus && (
            <VerifiedBadge type={workerBadgeType(wp.verificationStatus)} size="sm" />
          )}
          {profile?.role === 'customer' && profile?.trustedCustomer && (
            <VerifiedBadge type="customer-trusted" size="sm" />
          )}
          {profile?.role === 'customer' && profile?.customerTrustScore?.score > 0 && !profile?.trustedCustomer && (
            <VerifiedBadge type="customer-trust-score" size="sm" score={profile.customerTrustScore.score} />
          )}
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'1rem', color:'#6b7280', fontSize:'0.875rem' }}>
          {profile?.email && <span>✉️ {profile.email}</span>}
          {profile?.phone && <span>📞 {profile.phone}</span>}
          {(profile?.location?.city || profile?.location?.state) && <span>📍 {[profile.location?.city, profile.location?.state].filter(Boolean).join(', ')}</span>}
        </div>
        {avatarSrc && (
          <button onClick={onAvatarRemove} style={{ marginTop:'0.5rem', background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:'0.8rem', padding:0 }}>
            🗑️ Remove photo
          </button>
        )}
      </div>

      {/* Completion bar */}
      {completion < 100 && (
        <div style={{ width:'100%', marginTop:'0.5rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.35rem' }}>
            <span style={{ fontSize:'0.8rem', color:'#6b7280', fontWeight:600 }}>Profile Completion</span>
            <span style={{ fontSize:'0.8rem', fontWeight:700, color: completion < 40 ? '#ef4444' : completion < 70 ? '#f59e0b' : '#10b981' }}>{completion}%</span>
          </div>
          <ProgressBar value={completion} color={completion < 40 ? '#ef4444' : completion < 70 ? '#f59e0b' : '#10b981'} height={6} />
        </div>
      )}

      {/* Worker trust score mini */}
      {profile?.role === 'worker' && wp && (
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', background:'#f8fafc', borderRadius:10, padding:'0.6rem 1rem' }}>
          <span style={{ fontSize:'1.2rem' }}>🛡️</span>
          <div>
            <div style={{ fontSize:'0.75rem', color:'#6b7280', fontWeight:600 }}>Trust Score</div>
            <div style={{ fontSize:'1.1rem', fontWeight:800, color:trust.color }}>{trust.score}/100 <span style={{ fontSize:'0.75rem' }}>{trust.level}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Tab: Overview ────────────────────────────────────────────────────────────
const TabOverview = ({ profile, stats }) => {
  const wp = profile?.workerProfile;

  return (
    <div>
      {/* Profile completion banner — shown until 100% */}
      <ProfileCompletionBanner
        completion={profile?.profileCompletion}
        variant="checklist"
        role={profile?.role || 'customer'}
      />
      {/* Basic info card */}
      <div style={{ ...CARD, marginBottom:'1.25rem' }}>
        <SectionTitle>Account Information</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'1rem' }}>
          {[
            { icon:'👤', label:'Full Name',   value: profile?.name },
            { icon:'✉️', label:'Email',       value: profile?.email },
            { icon:'📞', label:'Phone',       value: profile?.phone || '—' },
            { icon:'📍', label:'Location',    value: [profile?.location?.address, profile?.location?.city, profile?.location?.state, profile?.location?.pincode].filter(Boolean).join(', ') || '—' },
            { icon:'📅', label:'Member Since',value: fmtDate(profile?.createdAt) },
            { icon:'🆔', label:'Account ID',  value: profile?._id ? '…' + profile._id.slice(-8) : '—' },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ background:'#f8fafc', borderRadius:10, padding:'0.85rem 1rem' }}>
              <div style={{ fontSize:'0.75rem', color:'#9ca3af', fontWeight:600, marginBottom:'0.25rem' }}>{icon} {label}</div>
              <div style={{ fontSize:'0.9rem', fontWeight:700, color:'#1f2937', wordBreak:'break-all' }}>{value || '—'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Worker: trust + stats */}
      {profile?.role === 'worker' && wp && (
        <>
          {/* Full trust score card with breakdown and help panel */}
          <div style={{ marginBottom:'1.25rem' }}>
            <TrustScoreCard trustScore={profile.trustScore} role="worker" variant="full" />
          </div>

          {stats && (
            <div style={{ ...CARD }}>
              <SectionTitle>Work Statistics</SectionTitle>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:'1rem' }}>
                {[
                  { icon:'📋', label:'Total Jobs',    value: stats.totalJobs ?? wp.totalJobs ?? 0 },
                  { icon:'✅', label:'Completed',     value: stats.completedJobs ?? wp.completedJobs ?? 0 },
                  { icon:'⭐', label:'Rating',        value: (wp.rating||0).toFixed(1) },
                  { icon:'💬', label:'Reviews',       value: wp.totalReviews ?? 0 },
                  { icon:'💰', label:'Earnings',      value: `₹${(stats.totalEarnings||0).toLocaleString('en-IN')}` },
                  { icon:'📈', label:'Completion %',  value: `${wp.completionRate||0}%` },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ background:'#f8fafc', borderRadius:10, padding:'1rem', textAlign:'center' }}>
                    <div style={{ fontSize:'1.5rem', marginBottom:'0.35rem' }}>{icon}</div>
                    <div style={{ fontSize:'1.25rem', fontWeight:800, color:'#1f2937' }}>{value}</div>
                    <div style={{ fontSize:'0.75rem', color:'#9ca3af', fontWeight:600 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Customer overview */}
      {profile?.role === 'customer' && (
        <>
          {/* Customer trust score */}
          {profile.trustScore && (
            <div style={{ marginBottom:'1.25rem' }}>
              <TrustScoreCard trustScore={profile.trustScore} role="customer" variant="full" />
            </div>
          )}
        <div style={{ ...CARD }}>
          <SectionTitle>Customer Summary</SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'1rem' }}>
            {[
              { icon:'🏅', label:'Loyalty Points', value: profile.loyaltyPoints ?? 0 },
              { icon:'💸', label:'Total Spent',    value: `₹${(profile.totalSpent||0).toLocaleString('en-IN')}` },
              { icon:'📋', label:'Total Bookings', value: profile.totalBookings ?? 0 },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ background:'#f8fafc', borderRadius:10, padding:'1rem', textAlign:'center' }}>
                <div style={{ fontSize:'1.5rem', marginBottom:'0.35rem' }}>{icon}</div>
                <div style={{ fontSize:'1.25rem', fontWeight:800, color:'#1f2937' }}>{value}</div>
                <div style={{ fontSize:'0.75rem', color:'#9ca3af', fontWeight:600 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
        </>
      )}
    </div>
  );
};

// ─── Tab: Edit Profile ────────────────────────────────────────────────────────
const TabEditProfile = ({ profile, onSaved }) => {
  const [form, setForm] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    address: profile?.location?.address || '',
    city: profile?.location?.city || '',
    state: profile?.location?.state || '',
    pincode: profile?.location?.pincode || '',
    bio: profile?.workerProfile?.bio || '',
    skills: (profile?.workerProfile?.skills || []).join(', '),
    experience: profile?.workerProfile?.experience ?? '',
    hourlyRate: profile?.workerProfile?.hourlyRate ?? '',
    available: profile?.workerProfile?.availability ?? profile?.workerProfile?.available ?? true,
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar || '');
  const [saving, setSaving] = useState(false);
  const isWorker = profile?.role === 'worker';

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const b64 = await fileToBase64(file);
    setAvatarPreview(b64);
  };

  const validate = () => {
    if (!form.name.trim() || form.name.trim().length < 2) { toast.error('Name must be at least 2 characters'); return false; }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error('Enter a valid email address'); return false; }
    if (!form.phone.trim() || form.phone.replace(/\D/g,'').length < 10) { toast.error('Phone must be at least 10 digits'); return false; }
    if (isWorker && form.hourlyRate && Number(form.hourlyRate) <= 0) { toast.error('Hourly rate must be positive'); return false; }
    if (isWorker && form.experience && (Number(form.experience) < 0 || Number(form.experience) > 50)) { toast.error('Experience must be between 0 and 50 years'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('email', form.email.trim());
      fd.append('phone', form.phone.trim());
      fd.append('address', form.address.trim());
      fd.append('city', form.city.trim());
      fd.append('state', form.state.trim());
      fd.append('pincode', form.pincode.trim());
      if (avatarFile) fd.append('avatar', avatarFile);
      if (isWorker) {
        const wp = {
          bio: form.bio.trim(),
          skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
          experience: Number(form.experience) || 0,
          hourlyRate: Number(form.hourlyRate) || 0,
          available: form.available,
        };
        fd.append('workerProfile', JSON.stringify(wp));
      }
      await api.patch('/profile', fd, { headers:{ 'Content-Type':'multipart/form-data' } });
      toast.success('Profile updated successfully');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Avatar */}
      <div style={{ ...CARD, marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'1.5rem', flexWrap:'wrap' }}>
        <div style={{ position:'relative' }}>
          <div style={{ width:80, height:80, borderRadius:'50%', overflow:'hidden', border:'3px solid #e0e7ff', background:'linear-gradient(135deg,#667eea,#764ba2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {avatarPreview
              ? <img src={avatarPreview} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <span style={{ fontSize:'1.8rem', color:'white', fontWeight:700 }}>{form.name?.[0]?.toUpperCase() || '?'}</span>
            }
          </div>
          <label style={{ position:'absolute', bottom:0, right:0, width:26, height:26, borderRadius:'50%', background:'#6366f1', color:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'0.7rem' }}>
            📷<input type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatarChange} />
          </label>
        </div>
        <div>
          <div style={{ fontWeight:700, color:'#1f2937', marginBottom:'0.25rem' }}>Profile Photo</div>
          <div style={{ fontSize:'0.8rem', color:'#9ca3af' }}>JPG, PNG or GIF. Max 5MB.</div>
        </div>
      </div>

      <div style={{ ...CARD, marginBottom:'1.25rem' }}>
        <SectionTitle>Personal Information</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'1rem' }}>
          <FieldGroup label="Full Name *">
            <input style={INP} value={form.name} onChange={set('name')} placeholder="Your full name" required />
          </FieldGroup>
          <FieldGroup label="Email Address *">
            <input style={INP} type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
            <div style={{ fontSize:'0.75rem', color:'#f59e0b', marginTop:'0.3rem' }}>⚠️ Changing email requires re-login</div>
          </FieldGroup>
          <FieldGroup label="Phone Number *">
            <input style={INP} value={form.phone} onChange={set('phone')} placeholder="10-digit mobile number" required />
          </FieldGroup>
        </div>
      </div>

      <div style={{ ...CARD, marginBottom:'1.25rem' }}>
        <SectionTitle>Address</SectionTitle>
        <div style={{ marginBottom:'1rem' }}>
          <FieldGroup label="Street Address">
            <AddressSearchInput
              value={form.address}
              onChange={(val) => setForm(f => ({ ...f, address: val }))}
              onSelect={(place) => {
                const parts = place.label?.split(',') || [];
                setForm(f => ({
                  ...f,
                  address: parts[0]?.trim() || f.address,
                  city: parts[1]?.trim() || f.city,
                  state: parts[2]?.trim() || f.state,
                }));
              }}
              placeholder="Search address..."
            />
          </FieldGroup>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'1rem' }}>
          <FieldGroup label="City">
            <input style={INP} value={form.city} onChange={set('city')} placeholder="City" />
          </FieldGroup>
          <FieldGroup label="State">
            <input style={INP} value={form.state} onChange={set('state')} placeholder="State" />
          </FieldGroup>
          <FieldGroup label="Pincode">
            <input style={INP} value={form.pincode} onChange={(e) => { if (e.target.value.length <= 6) set('pincode')(e); }} placeholder="6-digit pincode" maxLength={6} />
          </FieldGroup>
        </div>
      </div>

      {isWorker && (
        <div style={{ ...CARD, marginBottom:'1.25rem' }}>
          <SectionTitle>Professional Details</SectionTitle>
          <FieldGroup label="Bio">
            <textarea style={{ ...INP, minHeight:90, resize:'vertical' }} value={form.bio} onChange={set('bio')} placeholder="Tell customers about yourself..." />
          </FieldGroup>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'1rem' }}>
            <FieldGroup label="Skills (comma-separated)">
              <input style={INP} value={form.skills} onChange={set('skills')} placeholder="e.g. Electrician, Plumber" />
            </FieldGroup>
            <FieldGroup label="Experience (years)">
              <input style={INP} type="number" min={0} max={50} value={form.experience} onChange={set('experience')} placeholder="Years of experience" />
            </FieldGroup>
            <FieldGroup label="Hourly Rate (₹)">
              <input style={INP} type="number" min={0} value={form.hourlyRate} onChange={set('hourlyRate')} placeholder="Rate per hour" />
            </FieldGroup>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginTop:'0.5rem' }}>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, available: !f.available }))}
              style={{ width:48, height:26, borderRadius:13, border:'none', cursor:'pointer', background: form.available ? '#10b981' : '#d1d5db', position:'relative', transition:'background 0.2s' }}
            >
              <span style={{ position:'absolute', top:3, left: form.available ? 24 : 3, width:20, height:20, borderRadius:'50%', background:'white', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
            <span style={{ fontWeight:600, color: form.available ? '#10b981' : '#6b7280', fontSize:'0.9rem' }}>
              {form.available ? '🟢 Available for work' : '🔴 Not available'}
            </span>
          </div>
        </div>
      )}

      <div style={{ display:'flex', gap:'0.75rem' }}>
        <button type="submit" style={BTN_PRIMARY} disabled={saving}>
          {saving ? '⏳ Saving…' : '💾 Save Changes'}
        </button>
      </div>
    </form>
  );
};

// ─── Tab: Change Password ─────────────────────────────────────────────────────
const TabChangePassword = () => {
  const [form, setForm] = useState({ current:'', newPass:'', confirm:'' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPass.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (form.newPass === form.current) { toast.error('New password must differ from current password'); return; }
    if (form.newPass !== form.confirm) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await api.patch('/auth/change-password', { currentPassword: form.current, newPassword: form.newPass });
      toast.success('Password changed successfully');
      setForm({ current:'', newPass:'', confirm:'' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ ...CARD, maxWidth:480 }}>
      <SectionTitle>Change Password</SectionTitle>
      <form onSubmit={handleSubmit}>
        <FieldGroup label="Current Password">
          <PasswordInput value={form.current} onChange={set('current')} placeholder="Enter current password" />
        </FieldGroup>
        <FieldGroup label="New Password">
          <PasswordInput value={form.newPass} onChange={set('newPass')} placeholder="Min 6 characters" />
        </FieldGroup>
        <FieldGroup label="Confirm New Password">
          <PasswordInput value={form.confirm} onChange={set('confirm')} placeholder="Repeat new password" />
        </FieldGroup>
        {form.newPass && form.confirm && form.newPass !== form.confirm && (
          <div style={{ color:'#ef4444', fontSize:'0.8rem', marginBottom:'1rem' }}>❌ Passwords do not match</div>
        )}
        {form.newPass && form.confirm && form.newPass === form.confirm && form.newPass.length >= 6 && (
          <div style={{ color:'#10b981', fontSize:'0.8rem', marginBottom:'1rem' }}>✅ Passwords match</div>
        )}
        <button type="submit" style={BTN_PRIMARY} disabled={saving}>
          {saving ? '⏳ Updating…' : '🔒 Update Password'}
        </button>
      </form>
    </div>
  );
};

// ─── Tab: Account ─────────────────────────────────────────────────────────────
const TabAccount = ({ profile }) => {
  const wp = profile?.workerProfile;
  const roleLabel = profile?.role === 'worker' ? '👷 Worker' : profile?.role === 'admin' ? '🛡️ Admin' : '👤 Customer';

  return (
    <div>
      <div style={{ ...CARD, marginBottom:'1.25rem' }}>
        <SectionTitle>Account Details</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'1rem' }}>
          {[
            { icon:'🎭', label:'Role',        value: roleLabel },
            { icon:'📅', label:'Joined',      value: fmtDate(profile?.createdAt) },
            { icon:'🆔', label:'Account ID',  value: profile?._id ? '…' + profile._id.slice(-8) : '—' },
            { icon:'📧', label:'Email',       value: profile?.email },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ background:'#f8fafc', borderRadius:10, padding:'0.85rem 1rem' }}>
              <div style={{ fontSize:'0.75rem', color:'#9ca3af', fontWeight:600, marginBottom:'0.25rem' }}>{icon} {label}</div>
              <div style={{ fontSize:'0.9rem', fontWeight:700, color:'#1f2937' }}>{value || '—'}</div>
            </div>
          ))}
        </div>
      </div>

      {profile?.role === 'customer' && (
        <div style={{ ...CARD, marginBottom:'1.25rem' }}>
          <SectionTitle>Loyalty & Spending</SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'1rem' }}>
            <div style={{ background:'#fef3c7', borderRadius:10, padding:'1rem', textAlign:'center' }}>
              <div style={{ fontSize:'1.5rem' }}>🏅</div>
              <div style={{ fontSize:'1.4rem', fontWeight:800, color:'#92400e' }}>{profile.loyaltyPoints ?? 0}</div>
              <div style={{ fontSize:'0.75rem', color:'#92400e', fontWeight:600 }}>Loyalty Points</div>
            </div>
            <div style={{ background:'#d1fae5', borderRadius:10, padding:'1rem', textAlign:'center' }}>
              <div style={{ fontSize:'1.5rem' }}>💸</div>
              <div style={{ fontSize:'1.4rem', fontWeight:800, color:'#065f46' }}>₹{(profile.totalSpent||0).toLocaleString('en-IN')}</div>
              <div style={{ fontSize:'0.75rem', color:'#065f46', fontWeight:600 }}>Total Spent</div>
            </div>
          </div>
        </div>
      )}

      {profile?.role === 'worker' && wp && (
        <div style={{ ...CARD, marginBottom:'1.25rem' }}>
          <SectionTitle>Verification Status</SectionTitle>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
            {wp.verificationStatus === 'verified' && <span style={{ background:'#d1fae5', color:'#065f46', padding:'0.4rem 1rem', borderRadius:50, fontWeight:700 }}>✅ Verified by Admin</span>}
            {wp.verificationStatus === 'submitted' && <span style={{ background:'#fef3c7', color:'#92400e', padding:'0.4rem 1rem', borderRadius:50, fontWeight:700 }}>⏳ Under Review</span>}
            {wp.verificationStatus === 'rejected' && <span style={{ background:'#fee2e2', color:'#991b1b', padding:'0.4rem 1rem', borderRadius:50, fontWeight:700 }}>❌ Rejected</span>}
            {wp.verificationStatus === 'resubmission-required' && <span style={{ background:'#fff7ed', color:'#c2410c', padding:'0.4rem 1rem', borderRadius:50, fontWeight:700 }}>🔄 Resubmit Required</span>}
            {(!wp.verificationStatus || wp.verificationStatus === 'pending') && <span style={{ background:'#f3f4f6', color:'#6b7280', padding:'0.4rem 1rem', borderRadius:50, fontWeight:700 }}>⏸️ Not Submitted</span>}
          </div>
        </div>
      )}

      <div style={{ ...CARD, border:'1px solid #fee2e2' }}>
        <SectionTitle>Danger Zone</SectionTitle>
        <p style={{ color:'#6b7280', fontSize:'0.875rem', marginBottom:'1rem' }}>Destructive account actions will be available here in a future update.</p>
        <button style={{ ...BTN_SECONDARY, color:'#ef4444', border:'1px solid #fca5a5', cursor:'not-allowed', opacity:0.6 }} disabled>
          🗑️ Delete Account
        </button>
      </div>
    </div>
  );
};

// ─── Tab: Professional (workers only) ────────────────────────────────────────
const TabProfessional = ({ profile, onSaved }) => {
  const wp = profile?.workerProfile || {};
  const [skills, setSkills] = useState(wp.skills || []);
  const [experience, setExperience] = useState(wp.experience ?? '');
  const [hourlyRate, setHourlyRate] = useState(wp.hourlyRate ?? '');
  const [bio, setBio] = useState(wp.bio || '');
  const [available, setAvailable] = useState(wp.availability ?? wp.available ?? true);
  const [serviceArea, setServiceArea] = useState(wp.serviceArea || profile?.city || '');
  const [saving, setSaving] = useState(false);

  const toggleSkill = (s) => setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const fairnessTag = () => {
    if (!hourlyRate || skills.length === 0) return null;
    const rate = Number(hourlyRate);
    const avgMarket = skills.reduce((sum, s) => sum + (MARKET_RATES[s] || 350), 0) / skills.length;
    if (rate < avgMarket * 0.8) return { label:'💚 Below Market', color:'#065f46', bg:'#d1fae5' };
    if (rate > avgMarket * 1.3) return { label:'🔴 Above Market', color:'#991b1b', bg:'#fee2e2' };
    return { label:'✅ Fair Price', color:'#1e40af', bg:'#dbeafe' };
  };
  const tag = fairnessTag();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (experience && (Number(experience) < 0 || Number(experience) > 50)) { toast.error('Experience must be 0–50 years'); return; }
    if (hourlyRate && Number(hourlyRate) <= 0) { toast.error('Hourly rate must be positive'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('workerProfile', JSON.stringify({ skills, experience: Number(experience)||0, hourlyRate: Number(hourlyRate)||0, bio: bio.trim(), available, serviceArea: serviceArea.trim() }));
      await api.patch('/profile', fd, { headers:{ 'Content-Type':'multipart/form-data' } });
      toast.success('Professional profile updated');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ ...CARD, marginBottom:'1.25rem' }}>
        <SectionTitle>Skills</SectionTitle>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
          {ALL_SKILLS.map(s => (
            <button
              key={s} type="button"
              onClick={() => toggleSkill(s)}
              style={{ padding:'0.4rem 0.9rem', borderRadius:50, border:'2px solid', cursor:'pointer', fontSize:'0.85rem', fontWeight:600, transition:'all 0.15s',
                background: skills.includes(s) ? '#6366f1' : 'white',
                color: skills.includes(s) ? 'white' : '#6366f1',
                borderColor: '#6366f1' }}
            >
              {s}
            </button>
          ))}
        </div>
        {skills.length === 0 && <div style={{ fontSize:'0.8rem', color:'#9ca3af', marginTop:'0.5rem' }}>Select at least one skill</div>}
      </div>

      <div style={{ ...CARD, marginBottom:'1.25rem' }}>
        <SectionTitle>Experience & Rates</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'1rem' }}>
          <FieldGroup label="Experience (years)">
            <input style={INP} type="number" min={0} max={50} value={experience} onChange={e => setExperience(e.target.value)} placeholder="Years of experience" />
          </FieldGroup>
          <FieldGroup label="Hourly Rate (₹/hr)">
            <div style={{ position:'relative' }}>
              <input style={{ ...INP, paddingRight: tag ? '9rem' : INP.paddingRight }} type="number" min={0} value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} placeholder="e.g. 350" />
              {tag && <span style={{ position:'absolute', right:'0.5rem', top:'50%', transform:'translateY(-50%)', background:tag.bg, color:tag.color, padding:'0.15rem 0.5rem', borderRadius:50, fontSize:'0.7rem', fontWeight:700, whiteSpace:'nowrap' }}>{tag.label}</span>}
            </div>
            {skills.length > 0 && <div style={{ fontSize:'0.72rem', color:'#9ca3af', marginTop:'0.25rem' }}>Market avg: ₹{Math.round(skills.reduce((s,k)=>s+(MARKET_RATES[k]||350),0)/skills.length)}/hr</div>}
          </FieldGroup>
          <FieldGroup label="Service Area">
            <input style={INP} value={serviceArea} onChange={e => setServiceArea(e.target.value)} placeholder="City or area you serve" />
          </FieldGroup>
        </div>
      </div>

      <div style={{ ...CARD, marginBottom:'1.25rem' }}>
        <SectionTitle>Bio</SectionTitle>
        <textarea style={{ ...INP, minHeight:110, resize:'vertical' }} value={bio} onChange={e => setBio(e.target.value)} placeholder="Describe your experience, specialties, and what makes you stand out..." />
      </div>

      <div style={{ ...CARD, marginBottom:'1.25rem' }}>
        <SectionTitle>Availability</SectionTitle>
        <div
          onClick={() => setAvailable(v => !v)}
          style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'1rem 1.25rem', borderRadius:12, cursor:'pointer', background: available ? '#d1fae5' : '#fee2e2', border:`2px solid ${available ? '#10b981' : '#ef4444'}`, transition:'all 0.2s', userSelect:'none' }}
        >
          <span style={{ fontSize:'1.5rem' }}>{available ? '🟢' : '🔴'}</span>
          <div>
            <div style={{ fontWeight:700, color: available ? '#065f46' : '#991b1b' }}>{available ? 'Available for Work' : 'Not Available'}</div>
            <div style={{ fontSize:'0.8rem', color: available ? '#065f46' : '#991b1b' }}>{available ? 'Customers can book you' : 'You won\'t appear in search results'}</div>
          </div>
          <div style={{ marginLeft:'auto', width:48, height:26, borderRadius:13, background: available ? '#10b981' : '#d1d5db', position:'relative', transition:'background 0.2s' }}>
            <span style={{ position:'absolute', top:3, left: available ? 24 : 3, width:20, height:20, borderRadius:'50%', background:'white', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
          </div>
        </div>
      </div>

      <button type="submit" style={BTN_PRIMARY} disabled={saving}>
        {saving ? '⏳ Saving…' : '💾 Save Professional Profile'}
      </button>
    </form>
  );
};

// ─── Tab: Verification (workers only) ────────────────────────────────────────
const TabVerification = ({ profile, onSaved }) => {
  const wp = profile?.workerProfile || {};
  const trust = calcTrust(wp);
  const [idType, setIdType] = useState(wp.idDocumentType || 'aadhaar');
  const [idPreview, setIdPreview] = useState(wp.idDocument || '');
  const [selfiePreview, setSelfiePreview] = useState(wp.photoVerification || '');
  const [skillProofPreview, setSkillProofPreview] = useState(wp.skillProof || '');
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleFile = async (e, setPreview) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setPreview(b64);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!idPreview) { toast.error('Please upload your ID document'); return; }
    setSubmitting(true);
    try {
      await api.post('/profile/verify/submit', {
        idDocument: idPreview,
        idDocumentType: idType,
        photoVerification: selfiePreview || undefined,
        skillProof: skillProofPreview || undefined,
      });
      toast.success('Verification documents submitted! Admin will review within 24 hours.');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const vs = wp.verificationStatus || 'pending';
  const canSubmit = ['pending', 'rejected', 'resubmission-required'].includes(vs);

  const statusConfig = {
    verified:               { bg:'#d1fae5', color:'#065f46', border:'#6ee7b7', icon:'✅', title:'Identity Verified', text:'Your identity has been verified by admin. You have the Verified badge.' },
    submitted:              { bg:'#fef3c7', color:'#92400e', border:'#fcd34d', icon:'⏳', title:'Under Review', text:'Your documents are under review. Admin will respond within 24 hours.' },
    'resubmission-required':{ bg:'#fff7ed', color:'#c2410c', border:'#fed7aa', icon:'🔄', title:'Resubmission Required', text: wp.verificationRejectedReason || 'Admin has requested you re-submit your documents with clearer images.' },
    rejected:               { bg:'#fee2e2', color:'#991b1b', border:'#fca5a5', icon:'❌', title:'Verification Rejected', text: wp.verificationRejectedReason || 'Your verification was rejected. Please re-submit with clearer documents.' },
    pending:                { bg:'#f3f4f6', color:'#6b7280', border:'#e5e7eb', icon:'⏸️', title:'Not Submitted', text:'Submit your ID document and selfie to get the Verified badge and boost your trust score.' },
  };
  const sc = statusConfig[vs] || statusConfig.pending;

  const UploadZone = ({ preview, onFileChange, label, icon, required = false }) => (
    <label style={{ display:'block', cursor:'pointer' }}>
      <div style={{ border:`2px dashed ${preview ? '#6366f1' : '#d1d5db'}`, borderRadius:12, padding:'1.25rem', textAlign:'center', background: preview ? '#f5f3ff' : '#fafafa', transition:'all 0.2s', minHeight:120, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0.4rem' }}>
        {preview
          ? <img src={preview} alt={label} style={{ maxHeight:110, maxWidth:'100%', borderRadius:8, objectFit:'contain' }} />
          : <>
              <span style={{ fontSize:'1.75rem' }}>{icon}</span>
              <span style={{ fontSize:'0.82rem', color:'#6b7280', fontWeight:600 }}>{label}{required ? ' *' : ' (optional)'}</span>
              <span style={{ fontSize:'0.72rem', color:'#9ca3af' }}>Click to upload · JPG, PNG, PDF</span>
            </>
        }
      </div>
      <input type="file" accept="image/*,.pdf" style={{ display:'none' }} onChange={onFileChange} />
    </label>
  );

  return (
    <div>
      {/* Status banner */}
      <div style={{ ...CARD, marginBottom:'1.25rem', background:sc.bg, border:`1px solid ${sc.border}` }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:'1rem', flexWrap:'wrap' }}>
          <span style={{ fontSize:'2rem', flexShrink:0 }}>{sc.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, color:sc.color, fontSize:'1rem', marginBottom:'0.25rem' }}>{sc.title}</div>
            <div style={{ fontSize:'0.875rem', color:sc.color, lineHeight:1.5 }}>{sc.text}</div>
            {wp.verificationApprovedAt && vs === 'verified' && (
              <div style={{ fontSize:'0.78rem', color:sc.color, marginTop:'0.35rem', opacity:0.8 }}>
                Approved on {new Date(wp.verificationApprovedAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
              </div>
            )}
            {wp.verificationAdminNote && vs !== 'verified' && (
              <div style={{ marginTop:'0.5rem', background:'rgba(0,0,0,0.06)', borderRadius:8, padding:'0.5rem 0.75rem', fontSize:'0.8rem', color:sc.color }}>
                <strong>Admin note:</strong> {wp.verificationAdminNote}
              </div>
            )}
          </div>
          {vs === 'verified' && (
            <VerifiedBadge type="worker-verified" size="lg" />
          )}
        </div>
      </div>

      {/* Document status chips */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
        {[
          { label:'ID Document', done: !!wp.idDocument, icon:'🪪' },
          { label:'Selfie', done: !!wp.photoVerification, icon:'🤳' },
          { label:'Skill Proof', done: !!wp.skillProof, icon:'📜' },
        ].map(d => (
          <span key={d.label} style={{ display:'flex', alignItems:'center', gap:'0.35rem', padding:'0.25rem 0.75rem', borderRadius:50, fontSize:'0.78rem', fontWeight:600, background: d.done ? '#d1fae5' : '#f3f4f6', color: d.done ? '#065f46' : '#9ca3af', border:`1px solid ${d.done ? '#6ee7b7' : '#e5e7eb'}` }}>
            {d.icon} {d.label}: {d.done ? '✓ Uploaded' : '○ Missing'}
          </span>
        ))}
      </div>

      {/* Upload form — shown when can submit */}
      {canSubmit && (
        <form onSubmit={handleSubmit}>
          <div style={{ ...CARD, marginBottom:'1.25rem' }}>
            <SectionTitle>Step 1 — ID Document (Required)</SectionTitle>
            <FieldGroup label="Document Type">
              <select style={INP} value={idType} onChange={e => setIdType(e.target.value)}>
                <option value="aadhaar">Aadhaar Card</option>
                <option value="pan">PAN Card</option>
                <option value="driving-license">Driving License</option>
                <option value="passport">Passport</option>
                <option value="voter-id">Voter ID</option>
              </select>
            </FieldGroup>
            <UploadZone preview={idPreview} onFileChange={e => handleFile(e, setIdPreview)} label="Upload ID Document" icon="🪪" required />
            {idPreview && <button type="button" onClick={() => setIdPreview('')} style={{ marginTop:'0.4rem', background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:'0.78rem' }}>🗑️ Remove</button>}
          </div>

          <div style={{ ...CARD, marginBottom:'1.25rem' }}>
            <SectionTitle>Step 2 — Verification Selfie (Recommended)</SectionTitle>
            <div style={{ background:'#fef3c7', borderRadius:8, padding:'0.6rem 0.875rem', marginBottom:'0.875rem', fontSize:'0.8rem', color:'#92400e' }}>
              💡 Hold your ID document next to your face for best results
            </div>
            <UploadZone preview={selfiePreview} onFileChange={e => handleFile(e, setSelfiePreview)} label="Upload Selfie with ID" icon="🤳" />
            {selfiePreview && <button type="button" onClick={() => setSelfiePreview('')} style={{ marginTop:'0.4rem', background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:'0.78rem' }}>🗑️ Remove</button>}
          </div>

          <div style={{ ...CARD, marginBottom:'1.25rem' }}>
            <SectionTitle>Step 3 — Skill Proof (Optional)</SectionTitle>
            <p style={{ fontSize:'0.85rem', color:'#6b7280', marginBottom:'0.875rem' }}>Upload a certificate, diploma, or any document proving your skill (e.g. ITI certificate, trade license).</p>
            <UploadZone preview={skillProofPreview} onFileChange={e => handleFile(e, setSkillProofPreview)} label="Upload Skill Certificate" icon="📜" />
            {skillProofPreview && <button type="button" onClick={() => setSkillProofPreview('')} style={{ marginTop:'0.4rem', background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:'0.78rem' }}>🗑️ Remove</button>}
          </div>

          <div style={{ background:'#eff6ff', borderRadius:10, padding:'0.875rem 1rem', marginBottom:'1.25rem', fontSize:'0.82rem', color:'#1e40af', display:'flex', gap:'0.5rem' }}>
            <span style={{ flexShrink:0 }}>ℹ️</span>
            <span>Documents are reviewed by admin and never shared publicly. Verification usually takes 1–2 business days.</span>
          </div>

          <button type="submit" style={{ ...BTN_PRIMARY, opacity: !idPreview ? 0.5 : 1 }} disabled={submitting || !idPreview}>
            {submitting ? '⏳ Submitting…' : vs === 'resubmission-required' ? '🔄 Re-submit Documents' : '📤 Submit for Verification'}
          </button>
        </form>
      )}

      {/* Verification history */}
      {wp.verificationHistory?.length > 0 && (
        <div style={{ ...CARD, marginTop:'1.5rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
            <SectionTitle>Verification History</SectionTitle>
            <button onClick={() => setShowHistory(v => !v)} style={{ background:'none', border:'none', color:'#6366f1', cursor:'pointer', fontSize:'0.82rem', fontWeight:600 }}>
              {showHistory ? '▲ Hide' : '▼ Show'}
            </button>
          </div>
          {showHistory && (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {[...wp.verificationHistory].reverse().map((h, i) => {
                const hsc = statusConfig[h.status] || statusConfig.pending;
                return (
                  <div key={i} style={{ display:'flex', gap:'0.875rem', padding:'0.75rem', background:'#f8fafc', borderRadius:10, borderLeft:`3px solid ${hsc.border}` }}>
                    <span style={{ fontSize:'1.1rem', flexShrink:0 }}>{hsc.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, color:hsc.color, fontSize:'0.85rem' }}>{hsc.title}</div>
                      {h.note && <div style={{ fontSize:'0.78rem', color:'#6b7280', marginTop:'0.15rem' }}>{h.note}</div>}
                      {h.byName && <div style={{ fontSize:'0.72rem', color:'#9ca3af', marginTop:'0.1rem' }}>By: {h.byName}</div>}
                    </div>
                    <div style={{ fontSize:'0.72rem', color:'#9ca3af', flexShrink:0 }}>
                      {new Date(h.at).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Trust score breakdown */}
      <div style={{ ...CARD, marginTop:'1.5rem' }}>
        <SectionTitle>Trust Score — {trust.score}/100 ({trust.level})</SectionTitle>
        <ProgressBar value={trust.score} color={trust.color} height={10} />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'0.6rem', marginTop:'1rem' }}>
          {trust.breakdown.map(b => (
            <div key={b.label} style={{ background:'#f8fafc', borderRadius:8, padding:'0.6rem 0.85rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.3rem' }}>
                <span style={{ fontSize:'0.8rem', color:'#374151', fontWeight:600 }}>{b.icon} {b.label}</span>
                <span style={{ fontSize:'0.8rem', fontWeight:700, color: b.pts===b.max?'#10b981':'#6b7280' }}>{b.pts}/{b.max}</span>
              </div>
              <ProgressBar value={b.pts} max={b.max} color={b.pts===b.max?'#10b981':'#6366f1'} height={4} />
              {b.pts < b.max && <div style={{ fontSize:'0.7rem', color:'#9ca3af', marginTop:'0.2rem' }}>{b.tip}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Main Profile component ───────────────────────────────────────────────────
const Profile = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [avatarPreview, setAvatarPreview] = useState('');

  const isWorker = profile?.role === 'worker';

  const TABS = [
    { key:'overview',      icon:'📊', label:'Overview' },
    { key:'edit',          icon:'✏️', label:'Edit Profile' },
    { key:'password',      icon:'🔒', label:'Change Password' },
    { key:'account',       icon:'⚙️', label:'Account' },
    ...(isWorker ? [
      { key:'professional', icon:'💼', label:'Professional' },
      { key:'verification', icon:'🪪', label:'Verification' },
      { key:'reviews',      icon:'⭐', label:'My Reviews' },
    ] : []),
  ];

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/profile');
      setProfile(data);
      setAvatarPreview('');
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/profile/stats');
      setStats(data);
    } catch {}
  }, []);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchProfile();
  }, [user, navigate, fetchProfile]);

  useEffect(() => {
    if (profile?.role === 'worker') fetchStats();
  }, [profile?.role, fetchStats]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setAvatarPreview(b64);
    // Upload immediately
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      await api.patch('/profile', fd, { headers:{ 'Content-Type':'multipart/form-data' } });
      toast.success('Avatar updated');
      await fetchProfile();
      await refreshUser();
    } catch {
      toast.error('Failed to upload avatar');
      setAvatarPreview('');
    }
  };

  const handleAvatarRemove = async () => {
    try {
      await api.delete('/profile/avatar');
      toast.success('Avatar removed');
      setAvatarPreview('');
      await fetchProfile();
      await refreshUser();
    } catch {
      toast.error('Failed to remove avatar');
    }
  };

  const handleSaved = async () => {
    await fetchProfile();
    await refreshUser();
  };

  if (loading) {
    return (
      <div className="dashboard" style={{paddingTop:0}}>
        <Navbar />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
          <div style={{ textAlign:'center', color:'#6b7280' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>⏳</div>
            <div style={{ fontWeight:600 }}>Loading profile…</div>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':     return <TabOverview profile={profile} stats={stats} />;
      case 'edit':         return <TabEditProfile profile={profile} onSaved={handleSaved} />;
      case 'password':     return <TabChangePassword />;
      case 'account':      return <TabAccount profile={profile} />;
      case 'professional': return isWorker ? <TabProfessional profile={profile} onSaved={handleSaved} /> : null;
      case 'verification': return isWorker ? <TabVerification profile={profile} onSaved={handleSaved} /> : null;
      case 'reviews':      return isWorker ? (
        <div style={{ background:'white', borderRadius:16, padding:'1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin:'0 0 1.5rem', fontWeight:700, color:'#1f2937', fontSize:'1rem' }}>⭐ My Reviews</h3>
          <ReviewSummaryCard
            workerId={profile?._id}
            workerProfile={profile?.workerProfile}
            isWorker={true}
          />
        </div>
      ) : null;
      default:             return null;
    }
  };

  return (
    <div className="dashboard">
      <Navbar />
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'1.5rem 1rem' }}>
        {/* Page title */}
        <div style={{ marginBottom:'1.25rem' }}>
          <h1 style={{ margin:0, fontSize:'1.6rem', fontWeight:800, color:'#1f2937' }}>My Profile</h1>
          <p style={{ margin:'0.25rem 0 0', color:'#6b7280', fontSize:'0.9rem' }}>Manage your account settings and preferences</p>
        </div>

        {/* Profile header */}
        <ProfileHeader
          profile={profile}
          onAvatarChange={handleAvatarChange}
          onAvatarRemove={handleAvatarRemove}
          avatarPreview={avatarPreview}
        />

        {/* Layout: sidebar + content */}
        <div style={{ display:'flex', gap:'1.5rem', alignItems:'flex-start', flexWrap:'wrap' }}>

          {/* Sidebar tabs — desktop */}
          <div style={{ width:200, flexShrink:0, display:'flex', flexDirection:'column', gap:'0.25rem' }}
               className="profile-sidebar">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  display:'flex', alignItems:'center', gap:'0.6rem',
                  padding:'0.7rem 1rem', borderRadius:10, border:'none', cursor:'pointer',
                  fontWeight: activeTab === t.key ? 700 : 500,
                  fontSize:'0.875rem', textAlign:'left', transition:'all 0.15s',
                  background: activeTab === t.key ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'white',
                  color: activeTab === t.key ? 'white' : '#374151',
                  boxShadow: activeTab === t.key ? '0 2px 8px rgba(99,102,241,0.3)' : '0 1px 4px rgba(0,0,0,0.05)',
                }}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Mobile horizontal tabs */}
          <div style={{ display:'none', width:'100%', overflowX:'auto', gap:'0.5rem', paddingBottom:'0.5rem' }}
               className="profile-tabs-mobile">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  flexShrink:0, padding:'0.5rem 1rem', borderRadius:50, border:'none', cursor:'pointer',
                  fontWeight: activeTab === t.key ? 700 : 500, fontSize:'0.82rem', whiteSpace:'nowrap',
                  background: activeTab === t.key ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'white',
                  color: activeTab === t.key ? 'white' : '#374151',
                  boxShadow: activeTab === t.key ? '0 2px 8px rgba(99,102,241,0.3)' : '0 1px 4px rgba(0,0,0,0.05)',
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex:1, minWidth:0 }}>
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Responsive styles injected */}
      <style>{`
        @media (max-width: 640px) {
          .profile-sidebar { display: none !important; }
          .profile-tabs-mobile { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

export default Profile;
