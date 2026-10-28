import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../utils/api';

/**
 * Full-screen post-signup profile completion prompt.
 * Shows after registration, guides user to complete their profile.
 * Dismissible — user can skip and complete later.
 */
const ProfileSetupPrompt = () => {
  const { user, dismissSetupPrompt, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=welcome, 2=quick-fill, 3=done
  const [saving, setSaving] = useState(false);

  // Quick-fill form state
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');

  if (!user) return null;

  const completion = user.profileCompletion;
  const pct = completion?.percentage || 0;
  const isWorker = user.role === 'worker';
  const missingFields = completion?.missingFields || [];
  const nextStep = completion?.nextStep;

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatar(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleQuickSave = async () => {
    setSaving(true);
    try {
      const form = new FormData();
      if (avatar) form.append('avatar', avatar);
      if (city) form.append('city', city);
      if (isWorker && bio) form.append('workerProfile', JSON.stringify({ bio }));
      await api.patch('/profile', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser();
      setStep(3);
    } catch {
      toast.error('Failed to save. You can update from your profile page.');
      setStep(3);
    } finally { setSaving(false); }
  };

  const goToProfile = async () => {
    await dismissSetupPrompt();
    navigate('/profile');
  };

  const skip = async () => {
    await dismissSetupPrompt();
  };

  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#6366f1' : '#f59e0b';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,15,35,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '1rem', backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        background: 'white', borderRadius: 24, width: '100%', maxWidth: 540,
        boxShadow: '0 32px 80px rgba(0,0,0,0.4)', overflow: 'hidden',
        animation: 'fadeIn 0.3s ease', maxHeight: '92vh', display: 'flex', flexDirection: 'column',
      }}>

        {/* ── STEP 1: Welcome + checklist ──────────────────────────────── */}
        {step === 1 && (
          <>
            <div style={{ background: isWorker ? 'linear-gradient(135deg,#059669,#0d9488)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)', padding: '1.75rem 2rem', color: 'white', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '2.5rem' }}>{isWorker ? '👷' : '👤'}</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>
                    Welcome, {user.name?.split(' ')[0]}!
                  </h2>
                  <p style={{ margin: '0.2rem 0 0', opacity: 0.85, fontSize: '0.85rem' }}>
                    {isWorker ? 'Complete your profile to start receiving bookings' : 'A complete profile gets faster responses from workers'}
                  </p>
                </div>
              </div>

              {/* Completion ring + bar */}
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                  <svg width={56} height={56} style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={28} cy={28} r={22} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={5} />
                    <circle cx={28} cy={28} r={22} fill="none" stroke="white" strokeWidth={5}
                      strokeDasharray={`${(pct / 100) * 138.2} 138.2`} strokeLinecap="round" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: 'white' }}>
                    {pct}%
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                    Profile {pct}% complete · {completion?.done || 0}/{completion?.total || 0} fields
                  </div>
                  {nextStep && (
                    <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem' }}>
                      Next: {nextStep.icon} {nextStep.label} — {nextStep.hint}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ padding: '1.5rem 2rem', overflowY: 'auto', flex: 1 }}>
              {/* Checklist of missing items */}
              {missingFields.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    What's missing
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {missingFields.slice(0, 6).map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 8, background: '#fafafa', border: '1px solid #f3f4f6' }}>
                        <span style={{ fontSize: '1rem', flexShrink: 0 }}>{f.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>{f.label}</div>
                          <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{f.hint}</div>
                        </div>
                        <span style={{ fontSize: '0.68rem', background: color + '15', color, padding: '0.1rem 0.4rem', borderRadius: 4, fontWeight: 700, flexShrink: 0 }}>+{f.weight}%</span>
                      </div>
                    ))}
                    {missingFields.length > 6 && (
                      <div style={{ fontSize: '0.78rem', color: '#9ca3af', textAlign: 'center', padding: '0.25rem' }}>
                        +{missingFields.length - 6} more items
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Benefits */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {(isWorker ? [
                  { icon: '✅', text: 'Get the Verified badge after admin approval', color: '#10b981' },
                  { icon: '🏆', text: 'Higher trust score = more bookings', color: '#6366f1' },
                  { icon: '💰', text: 'Verified workers earn significantly more', color: '#ec4899' },
                ] : [
                  { icon: '🏅', text: 'Earn the Trusted Customer badge', color: '#f59e0b' },
                  { icon: '⚡', text: 'Workers respond faster to complete profiles', color: '#6366f1' },
                ]).map(b => (
                  <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.875rem', background: b.color + '10', borderRadius: 8, border: `1px solid ${b.color}20` }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{b.icon}</span>
                    <span style={{ fontSize: '0.82rem', color: '#374151', fontWeight: 500 }}>{b.text}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setStep(2)}
                  style={{ flex: 1, padding: '0.875rem', background: isWorker ? 'linear-gradient(135deg,#059669,#0d9488)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                  Quick Setup (2 min) →
                </button>
                <button onClick={skip}
                  style={{ padding: '0.875rem 1.1rem', background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                  Later
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── STEP 2: Quick fill ───────────────────────────────────────── */}
        {step === 2 && (
          <>
            <div style={{ background: isWorker ? 'linear-gradient(135deg,#059669,#0d9488)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)', padding: '1.25rem 1.75rem', color: 'white', display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
              <button onClick={() => setStep(1)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: 8, padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.82rem' }}>← Back</button>
              <div>
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>Quick Setup</h3>
                <p style={{ margin: 0, opacity: 0.8, fontSize: '0.78rem' }}>Fill in the basics — takes under 2 minutes</p>
              </div>
            </div>

            <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
              {/* Avatar */}
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: avatarPreview ? 'transparent' : 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', color: 'white', fontWeight: 700, overflow: 'hidden', border: '3px solid #e5e7eb' }}>
                    {avatarPreview ? <img src={avatarPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.name?.charAt(0)}
                  </div>
                  <label htmlFor="setup-avatar" style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, background: '#6366f1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid white', fontSize: '0.7rem' }}>
                    📷
                  </label>
                  <input id="setup-avatar" type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                </div>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>Tap to add a profile photo</p>
              </div>

              {/* City */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '0.4rem', fontSize: '0.875rem' }}>📍 Your City / Area</label>
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Pune, Maharashtra"
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: 10, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>

              {/* Bio (workers only) */}
              {isWorker && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '0.4rem', fontSize: '0.875rem' }}>📝 About Yourself</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Briefly describe your skills and experience..."
                    rows={3} style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: 10, fontSize: '0.875rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'} />
                </div>
              )}

              {isWorker && (
                <div style={{ background: '#fef3c7', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#92400e', display: 'flex', gap: '0.5rem' }}>
                  <span style={{ flexShrink: 0 }}>💡</span>
                  <span>After saving, go to your Profile → Verification tab to upload your ID and selfie for the <strong>Verified badge</strong>.</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handleQuickSave} disabled={saving}
                  style={{ flex: 1, padding: '0.875rem', background: saving ? '#e5e7eb' : (isWorker ? 'linear-gradient(135deg,#059669,#0d9488)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)'), color: saving ? '#9ca3af' : 'white', border: 'none', borderRadius: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}>
                  {saving ? '⏳ Saving...' : '💾 Save & Continue →'}
                </button>
                <button onClick={() => setStep(3)}
                  style={{ padding: '0.875rem 1.1rem', background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                  Skip
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── STEP 3: Done ─────────────────────────────────────────────── */}
        {step === 3 && (
          <div style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1f2937', marginBottom: '0.5rem' }}>You're all set!</h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {isWorker
                ? 'Head to your Profile → Verification tab to upload your ID and selfie to get the Verified badge and boost your trust score.'
                : 'Your account is ready. Complete your profile anytime from the Profile page to unlock all features.'}
            </p>

            {/* Remaining items reminder */}
            {missingFields.length > 0 && (
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>Still to complete:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {missingFields.slice(0, 5).map((f, i) => (
                    <span key={i} style={{ background: 'white', border: '1px solid #e5e7eb', color: '#374151', padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600 }}>
                      {f.icon} {f.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={goToProfile}
                style={{ padding: '0.875rem 1.75rem', background: isWorker ? 'linear-gradient(135deg,#059669,#0d9488)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                {isWorker ? '🪪 Complete Verification' : '👤 Complete Profile'}
              </button>
              <button onClick={skip}
                style={{ padding: '0.875rem 1.25rem', background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSetupPrompt;