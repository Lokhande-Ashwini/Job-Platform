import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * TrustScoreCard — reusable trust score display component.
 *
 * Props:
 *   trustScore  — object from /auth/profile.trustScore or /profile/trust-score
 *   role        — 'worker' | 'customer'
 *   variant     — 'full' | 'compact' | 'mini'
 *   showHelp    — boolean (show "How to improve" panel)
 */

const LEVEL_CONFIG = {
  Platinum: { color: '#6366f1', bg: '#ede9fe', border: '#c4b5fd', emoji: '💎', next: null,     nextAt: null },
  Gold:     { color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d', emoji: '🥇', next: 'Platinum', nextAt: 85 },
  Silver:   { color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db', emoji: '🥈', next: 'Gold',    nextAt: 70 },
  Bronze:   { color: '#b45309', bg: '#fef3c7', border: '#fcd34d', emoji: '🥉', next: 'Silver',  nextAt: 50 },
  New:      { color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb', emoji: '🌱', next: 'Bronze',  nextAt: 30 },
};

const WORKER_HELP = [
  { icon: '📋', title: 'Complete your profile', desc: 'Fill in all profile fields including bio, skills, and location', pts: '+10 pts' },
  { icon: '✅', title: 'Get verified by admin', desc: 'Submit your ID document and selfie for identity verification', pts: '+15 pts' },
  { icon: '🪪', title: 'Upload ID document', desc: 'Upload Aadhaar, PAN, Driving License, or Passport', pts: '+5 pts' },
  { icon: '📋', title: 'Complete more jobs', desc: 'Accept and complete bookings without cancelling', pts: '+15 pts' },
  { icon: '⭐', title: 'Maintain high ratings', desc: 'Provide quality service to earn 4.5+ star ratings', pts: '+15 pts' },
  { icon: '🕊️', title: 'Avoid disputes', desc: 'Resolve issues directly with customers before they escalate', pts: '+10 pts' },
  { icon: '✓', title: 'Don\'t cancel bookings', desc: 'Only accept bookings you can complete on time', pts: '+10 pts' },
  { icon: '💰', title: 'Use fair pricing', desc: 'Keep your hourly rate within market range for your skill', pts: '+5 pts' },
  { icon: '🏆', title: 'Build experience', desc: 'More years of experience increases your trust score', pts: '+8 pts' },
  { icon: '💬', title: 'Collect reviews', desc: 'Ask satisfied customers to leave a review after each job', pts: '+7 pts' },
];

const CUSTOMER_HELP = [
  { icon: '📋', title: 'Complete your profile', desc: 'Fill in name, phone, email, and address', pts: '+15 pts' },
  { icon: '📞', title: 'Add phone number', desc: 'Add a valid 10-digit mobile number', pts: '+15 pts' },
  { icon: '✉️', title: 'Add email address', desc: 'Add and verify your email address', pts: '+10 pts' },
  { icon: '💳', title: 'Pay on time', desc: 'Complete payments promptly after each booking', pts: '+20 pts' },
  { icon: '🕊️', title: 'Avoid disputes', desc: 'Resolve issues directly with workers before raising disputes', pts: '+15 pts' },
  { icon: '📅', title: 'Don\'t cancel bookings', desc: 'Only book when you\'re sure you need the service', pts: '+10 pts' },
  { icon: '⭐', title: 'Leave honest reviews', desc: 'Rate workers after each completed booking', pts: '+8 pts' },
  { icon: '📅', title: 'Build account history', desc: 'Older accounts with good history earn more trust', pts: '+7 pts' },
];

// ── Mini variant — just score + level badge ───────────────────────────────────
export const TrustScoreMini = ({ trustScore }) => {
  if (!trustScore) return null;
  const { score, level, levelColor, levelBg, levelEmoji } = trustScore;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'0.35rem', background:levelBg, color:levelColor, border:`1px solid ${LEVEL_CONFIG[level]?.border || '#e5e7eb'}`, padding:'0.2rem 0.65rem', borderRadius:50, fontSize:'0.78rem', fontWeight:700, whiteSpace:'nowrap' }}>
      {levelEmoji} {level} · {score}
    </span>
  );
};

// ── Compact variant — score bar + level ──────────────────────────────────────
export const TrustScoreCompact = ({ trustScore, role }) => {
  const navigate = useNavigate();
  if (!trustScore) return null;
  const { score, level, levelColor, levelBg } = trustScore;
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.New;
  const ptsToNext = cfg.nextAt ? cfg.nextAt - score : 0;

  return (
    <div style={{ background:'white', borderRadius:14, padding:'1rem 1.25rem', boxShadow:'0 1px 6px rgba(0,0,0,0.06)', border:`1px solid ${cfg.border}` }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.6rem', flexWrap:'wrap', gap:'0.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <span style={{ fontSize:'1.1rem' }}>{cfg.emoji}</span>
          <span style={{ fontWeight:700, color:'#1f2937', fontSize:'0.9rem' }}>Trust Score</span>
          <span style={{ background:levelBg, color:levelColor, padding:'0.15rem 0.6rem', borderRadius:50, fontSize:'0.75rem', fontWeight:700 }}>{level}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <span style={{ fontSize:'1.5rem', fontWeight:900, color:levelColor }}>{score}</span>
          <span style={{ fontSize:'0.75rem', color:'#9ca3af' }}>/100</span>
        </div>
      </div>
      <div style={{ height:8, background:'#f3f4f6', borderRadius:4, overflow:'hidden', marginBottom:'0.4rem' }}>
        <div style={{ height:'100%', width:`${score}%`, background:`linear-gradient(90deg,${levelColor},${levelColor}cc)`, borderRadius:4, transition:'width 0.6s ease' }} />
      </div>
      {cfg.next && ptsToNext > 0 && (
        <div style={{ fontSize:'0.72rem', color:'#9ca3af' }}>
          {ptsToNext} more pts to reach {cfg.emoji} {cfg.next}
        </div>
      )}
      <button onClick={() => navigate('/profile?tab=trust')} style={{ marginTop:'0.5rem', background:'none', border:'none', color:levelColor, cursor:'pointer', fontSize:'0.78rem', fontWeight:600, padding:0 }}>
        How to improve →
      </button>
    </div>
  );
};

// ── Full variant — complete breakdown + help panel ────────────────────────────
const TrustScoreCard = ({ trustScore, role = 'worker', variant = 'full', showHelp: showHelpProp = false }) => {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(showHelpProp);
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (!trustScore) return null;

  if (variant === 'mini') return <TrustScoreMini trustScore={trustScore} />;
  if (variant === 'compact') return <TrustScoreCompact trustScore={trustScore} role={role} />;

  const { score, level, levelColor, levelBg, breakdown = [] } = trustScore;
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.New;
  const ptsToNext = cfg.nextAt ? cfg.nextAt - score : 0;
  const helpItems = role === 'worker' ? WORKER_HELP : CUSTOMER_HELP;

  // Sort breakdown: incomplete first, then by pts desc
  const sortedBreakdown = [...breakdown].sort((a, b) => {
    if (a.pts < a.max && b.pts >= b.max) return -1;
    if (a.pts >= a.max && b.pts < b.max) return 1;
    return (b.pts / b.max) - (a.pts / a.max);
  });

  return (
    <div style={{ background:'white', borderRadius:16, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${levelColor}18,${levelColor}08)`, padding:'1.5rem', borderBottom:`1px solid ${cfg.border}` }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'1.25rem' }}>
            {/* Score ring */}
            <div style={{ position:'relative', width:80, height:80, flexShrink:0 }}>
              <svg width={80} height={80} style={{ transform:'rotate(-90deg)' }}>
                <circle cx={40} cy={40} r={32} fill="none" stroke="#e5e7eb" strokeWidth={8} />
                <circle cx={40} cy={40} r={32} fill="none" stroke={levelColor} strokeWidth={8}
                  strokeDasharray={`${(score / 100) * 201} 201`}
                  strokeLinecap="round" style={{ transition:'stroke-dasharray 0.8s ease' }} />
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:'1.4rem', fontWeight:900, color:levelColor, lineHeight:1 }}>{score}</span>
                <span style={{ fontSize:'0.6rem', color:'#9ca3af', fontWeight:600 }}>/100</span>
              </div>
            </div>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.3rem' }}>
                <span style={{ fontSize:'1.5rem' }}>{cfg.emoji}</span>
                <span style={{ fontSize:'1.2rem', fontWeight:800, color:levelColor }}>{level}</span>
                <span style={{ background:levelBg, color:levelColor, border:`1px solid ${cfg.border}`, padding:'0.15rem 0.6rem', borderRadius:50, fontSize:'0.75rem', fontWeight:700 }}>Trust Level</span>
              </div>
              {cfg.next && ptsToNext > 0 ? (
                <div style={{ fontSize:'0.8rem', color:'#6b7280' }}>
                  <span style={{ fontWeight:600, color:levelColor }}>{ptsToNext} pts</span> to reach {cfg.emoji} {cfg.next}
                </div>
              ) : (
                <div style={{ fontSize:'0.8rem', color:'#10b981', fontWeight:600 }}>🏆 Maximum level reached!</div>
              )}
              {/* Level progress bar */}
              <div style={{ marginTop:'0.5rem', width:180 }}>
                <div style={{ height:5, background:'#e5e7eb', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${score}%`, background:levelColor, borderRadius:3, transition:'width 0.6s' }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.65rem', color:'#9ca3af', marginTop:'0.2rem' }}>
                  <span>New</span><span>Bronze</span><span>Silver</span><span>Gold</span><span>Platinum</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
            <button onClick={() => setShowBreakdown(v => !v)}
              style={{ padding:'0.45rem 1rem', background:'white', color:levelColor, border:`1px solid ${cfg.border}`, borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.8rem' }}>
              {showBreakdown ? '▲ Hide' : '▼ Breakdown'}
            </button>
            <button onClick={() => setShowHelp(v => !v)}
              style={{ padding:'0.45rem 1rem', background:levelColor, color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.8rem' }}>
              {showHelp ? '✕ Close' : '💡 How to improve'}
            </button>
          </div>
        </div>
      </div>

      {/* Breakdown grid */}
      {showBreakdown && (
        <div style={{ padding:'1.25rem 1.5rem', borderBottom:`1px solid #f3f4f6` }}>
          <div style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'0.875rem' }}>
            Score Breakdown
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'0.6rem' }}>
            {sortedBreakdown.map(b => {
              const isMax = b.pts >= b.max;
              const barColor = isMax ? '#10b981' : b.pts > 0 ? levelColor : '#e5e7eb';
              return (
                <div key={b.key} style={{ background: isMax ? '#f0fdf4' : '#f8fafc', borderRadius:10, padding:'0.75rem', border:`1px solid ${isMax ? '#6ee7b7' : '#f3f4f6'}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.35rem' }}>
                    <span style={{ fontSize:'0.82rem', fontWeight:600, color:'#374151' }}>{b.icon} {b.label}</span>
                    <span style={{ fontSize:'0.78rem', fontWeight:700, color: isMax ? '#10b981' : '#6b7280' }}>{b.pts}/{b.max}</span>
                  </div>
                  <div style={{ height:5, background:'#e5e7eb', borderRadius:3, overflow:'hidden', marginBottom:'0.3rem' }}>
                    <div style={{ height:'100%', width:`${b.pct}%`, background:barColor, borderRadius:3, transition:'width 0.5s' }} />
                  </div>
                  <div style={{ fontSize:'0.7rem', color: isMax ? '#10b981' : '#9ca3af' }}>
                    {isMax ? '✓ ' : ''}{b.detail || b.tip}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Help panel */}
      {showHelp && (
        <div style={{ padding:'1.25rem 1.5rem', background:'#fafafa' }}>
          <div style={{ fontSize:'0.9rem', fontWeight:700, color:'#1f2937', marginBottom:'1rem' }}>
            💡 How to Increase Your Trust Score
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'0.6rem' }}>
            {helpItems.map((item, i) => {
              // Check if this factor is already maxed
              const factor = breakdown.find(b => b.tip?.toLowerCase().includes(item.title.toLowerCase().slice(0, 10)));
              const isDone = factor && factor.pts >= factor.max;
              return (
                <div key={i} style={{ display:'flex', gap:'0.75rem', padding:'0.75rem', background: isDone ? '#f0fdf4' : 'white', borderRadius:10, border:`1px solid ${isDone ? '#6ee7b7' : '#e5e7eb'}` }}>
                  <span style={{ fontSize:'1.1rem', flexShrink:0 }}>{isDone ? '✅' : item.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'0.82rem', fontWeight:700, color: isDone ? '#065f46' : '#374151', marginBottom:'0.15rem' }}>{item.title}</div>
                    <div style={{ fontSize:'0.72rem', color:'#6b7280', lineHeight:1.4 }}>{item.desc}</div>
                  </div>
                  <span style={{ fontSize:'0.7rem', fontWeight:700, color: isDone ? '#10b981' : levelColor, flexShrink:0, alignSelf:'flex-start', background: isDone ? '#d1fae5' : levelBg, padding:'0.1rem 0.4rem', borderRadius:4 }}>
                    {isDone ? '✓ Done' : item.pts}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop:'1rem', padding:'0.875rem 1rem', background:'#eff6ff', borderRadius:10, fontSize:'0.8rem', color:'#1e40af', display:'flex', gap:'0.5rem' }}>
            <span style={{ flexShrink:0 }}>ℹ️</span>
            <span>Trust scores are recalculated automatically based on your activity. Scores update when you complete bookings, receive reviews, or update your profile.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrustScoreCard;

