import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * ProfileCompletionBanner — reusable component used in all three dashboards.
 *
 * Props:
 *   completion  — object from /auth/profile.profileCompletion
 *   variant     — 'banner' (full-width card) | 'compact' (slim bar) | 'checklist' (expanded)
 *   role        — 'customer' | 'worker' | 'admin'
 */
const ProfileCompletionBanner = ({ completion, variant = 'banner', role = 'customer' }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  if (!completion) return null;
  const { percentage, missingFields = [], missing = [], nextStep, tier } = completion;

  // Don't show if complete
  if (percentage >= 100) return null;

  const color =
    percentage >= 80 ? '#10b981' :
    percentage >= 60 ? '#6366f1' :
    percentage >= 40 ? '#f59e0b' : '#ef4444';

  const bgColor =
    percentage >= 80 ? '#f0fdf4' :
    percentage >= 60 ? '#eff6ff' :
    percentage >= 40 ? '#fffbeb' : '#fff5f5';

  const borderColor =
    percentage >= 80 ? '#6ee7b7' :
    percentage >= 60 ? '#a5b4fc' :
    percentage >= 40 ? '#fcd34d' : '#fca5a5';

  const tierMsg = {
    new:      'Start by adding your basic info',
    started:  'Keep going — you\'re making progress',
    halfway:  'More than halfway there!',
    almost:   'Almost done — just a few more steps',
    complete: 'Profile complete!',
  }[tier] || '';

  // ── Compact variant — just a slim progress bar ────────────────────────────
  if (variant === 'compact') {
    return (
      <div style={{ background:'white', borderRadius:12, padding:'0.875rem 1.25rem', boxShadow:'0 1px 6px rgba(0,0,0,0.05)', border:`1px solid ${borderColor}`, marginBottom:'1.25rem' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.5rem', gap:'0.75rem', flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <span style={{ fontSize:'1rem' }}>{percentage < 40 ? '⚠️' : percentage < 80 ? '📋' : '🎯'}</span>
            <span style={{ fontWeight:700, color:'#1f2937', fontSize:'0.875rem' }}>Profile {percentage}% complete</span>
            {nextStep && (
              <span style={{ fontSize:'0.75rem', color:'#6b7280' }}>· Next: {nextStep.icon} {nextStep.label}</span>
            )}
          </div>
          <button onClick={() => navigate('/profile')}
            style={{ padding:'0.35rem 0.875rem', background:color, color:'white', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600, fontSize:'0.78rem', flexShrink:0 }}>
            Complete →
          </button>
        </div>
        <div style={{ height:6, background:'#f3f4f6', borderRadius:3, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${percentage}%`, background:color, borderRadius:3, transition:'width 0.6s ease' }} />
        </div>
      </div>
    );
  }

  // ── Checklist variant — full expanded checklist ───────────────────────────
  if (variant === 'checklist') {
    const allFields = completion.fields || [];
    return (
      <div style={{ background:'white', borderRadius:16, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', overflow:'hidden', marginBottom:'1.5rem', border:`1px solid ${borderColor}` }}>
        {/* Header */}
        <div style={{ background:`linear-gradient(135deg,${color}15,${color}08)`, padding:'1.25rem 1.5rem', borderBottom:`1px solid ${borderColor}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.75rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            {/* Ring */}
            <div style={{ position:'relative', width:64, height:64, flexShrink:0 }}>
              <svg width={64} height={64} style={{ transform:'rotate(-90deg)' }}>
                <circle cx={32} cy={32} r={26} fill="none" stroke="#e5e7eb" strokeWidth={6} />
                <circle cx={32} cy={32} r={26} fill="none" stroke={color} strokeWidth={6}
                  strokeDasharray={`${(percentage / 100) * 163.4} 163.4`}
                  strokeLinecap="round" style={{ transition:'stroke-dasharray 0.6s ease' }} />
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85rem', fontWeight:800, color }}>
                {percentage}%
              </div>
            </div>
            <div>
              <div style={{ fontWeight:800, color:'#1f2937', fontSize:'1rem' }}>Complete Your Profile</div>
              <div style={{ fontSize:'0.8rem', color:'#6b7280', marginTop:'0.15rem' }}>{tierMsg}</div>
              {nextStep && (
                <div style={{ fontSize:'0.78rem', color, fontWeight:600, marginTop:'0.25rem' }}>
                  Next: {nextStep.icon} {nextStep.label}
                </div>
              )}
            </div>
          </div>
          <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
            <button onClick={() => navigate('/profile')}
              style={{ padding:'0.5rem 1.25rem', background:color, color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>
              Complete Profile →
            </button>
            <button onClick={() => setExpanded(v => !v)}
              style={{ padding:'0.5rem 0.75rem', background:'white', color:'#6b7280', border:`1px solid ${borderColor}`, borderRadius:8, cursor:'pointer', fontSize:'0.8rem', fontWeight:600 }}>
              {expanded ? '▲ Hide' : '▼ Checklist'}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height:4, background:'#f3f4f6' }}>
          <div style={{ height:'100%', width:`${percentage}%`, background:color, transition:'width 0.6s ease' }} />
        </div>

        {/* Checklist */}
        {expanded && (
          <div style={{ padding:'1.25rem 1.5rem' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'0.6rem' }}>
              {allFields.map(f => (
                <div key={f.key} style={{ display:'flex', alignItems:'flex-start', gap:'0.75rem', padding:'0.6rem 0.875rem', borderRadius:10, background: f.done ? '#f0fdf4' : '#fafafa', border:`1px solid ${f.done ? '#6ee7b7' : '#e5e7eb'}` }}>
                  <span style={{ fontSize:'1rem', flexShrink:0, marginTop:'0.05rem' }}>
                    {f.done ? '✅' : f.icon}
                  </span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'0.82rem', fontWeight:600, color: f.done ? '#065f46' : '#374151' }}>{f.label}</div>
                    {!f.done && f.hint && (
                      <div style={{ fontSize:'0.72rem', color:'#9ca3af', marginTop:'0.1rem' }}>{f.hint}</div>
                    )}
                  </div>
                  {!f.done && (
                    <span style={{ fontSize:'0.68rem', background:`${color}15`, color, padding:'0.1rem 0.4rem', borderRadius:4, fontWeight:600, flexShrink:0 }}>
                      +{f.weight}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Banner variant (default) — card with ring + missing items ────────────
  return (
    <div style={{ background:bgColor, borderRadius:16, padding:'1.25rem 1.5rem', boxShadow:'0 1px 8px rgba(0,0,0,0.06)', marginBottom:'1.5rem', border:`1px solid ${borderColor}`, borderLeft:`4px solid ${color}` }}>
      <div style={{ display:'flex', alignItems:'center', gap:'1.25rem', flexWrap:'wrap' }}>
        {/* Circular ring */}
        <div style={{ position:'relative', width:72, height:72, flexShrink:0 }}>
          <svg width={72} height={72} style={{ transform:'rotate(-90deg)' }}>
            <circle cx={36} cy={36} r={30} fill="none" stroke="#e5e7eb" strokeWidth={7} />
            <circle cx={36} cy={36} r={30} fill="none" stroke={color} strokeWidth={7}
              strokeDasharray={`${(percentage / 100) * 188.5} 188.5`}
              strokeLinecap="round" style={{ transition:'stroke-dasharray 0.6s ease' }} />
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem', fontWeight:800, color }}>
            {percentage}%
          </div>
        </div>

        <div style={{ flex:1, minWidth:180 }}>
          <div style={{ fontWeight:800, color:'#1f2937', fontSize:'0.95rem', marginBottom:'0.25rem' }}>
            {percentage < 40 ? '⚠️' : '📋'} Complete Your Profile
          </div>
          <div style={{ fontSize:'0.8rem', color:'#6b7280', marginBottom:'0.5rem' }}>{tierMsg}</div>

          {/* Missing items as chips */}
          {missing.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.35rem', marginBottom:'0.6rem' }}>
              {missing.slice(0, 4).map((m, i) => (
                <span key={i} style={{ background:'white', border:`1px solid ${borderColor}`, color:'#374151', padding:'0.15rem 0.5rem', borderRadius:6, fontSize:'0.72rem', fontWeight:600 }}>
                  {missingFields[i]?.icon || '○'} {m}
                </span>
              ))}
              {missing.length > 4 && (
                <span style={{ background:'white', border:`1px solid ${borderColor}`, color:'#6b7280', padding:'0.15rem 0.5rem', borderRadius:6, fontSize:'0.72rem' }}>
                  +{missing.length - 4} more
                </span>
              )}
            </div>
          )}

          <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
            <button onClick={() => navigate('/profile')}
              style={{ padding:'0.45rem 1.1rem', background:color, color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'0.82rem' }}>
              Complete Profile →
            </button>
            <button onClick={() => setExpanded(v => !v)}
              style={{ padding:'0.45rem 0.875rem', background:'white', color:'#6b7280', border:`1px solid ${borderColor}`, borderRadius:8, cursor:'pointer', fontSize:'0.78rem', fontWeight:600 }}>
              {expanded ? '▲ Hide' : '▼ See checklist'}
            </button>
          </div>
        </div>
      </div>

      {/* Inline checklist when expanded */}
      {expanded && (
        <div style={{ marginTop:'1rem', paddingTop:'1rem', borderTop:`1px solid ${borderColor}` }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'0.5rem' }}>
            {(completion.fields || []).map(f => (
              <div key={f.key} style={{ display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.5rem 0.75rem', borderRadius:8, background: f.done ? '#f0fdf4' : 'white', border:`1px solid ${f.done ? '#6ee7b7' : '#e5e7eb'}` }}>
                <span style={{ fontSize:'0.9rem', flexShrink:0 }}>{f.done ? '✅' : f.icon}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'0.78rem', fontWeight:600, color: f.done ? '#065f46' : '#374151' }}>{f.label}</div>
                  {!f.done && f.hint && <div style={{ fontSize:'0.68rem', color:'#9ca3af' }}>{f.hint}</div>}
                </div>
                {!f.done && <span style={{ fontSize:'0.65rem', color, fontWeight:700, flexShrink:0 }}>+{f.weight}%</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCompletionBanner;

