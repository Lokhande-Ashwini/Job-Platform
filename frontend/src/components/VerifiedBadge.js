/**
 * VerifiedBadge — reusable badge component for worker verification and customer trust.
 *
 * Props:
 *   type        — 'worker-verified' | 'worker-pending' | 'worker-submitted' | 'worker-rejected' | 'worker-resubmission' | 'customer-trusted' | 'customer-trust-score'
 *   size        — 'sm' | 'md' | 'lg'
 *   showLabel   — boolean (default true)
 *   score       — number (for trust score display)
 *   tooltip     — string (hover text)
 */
const VerifiedBadge = ({ type, size = 'md', showLabel = true, score, tooltip }) => {
  const sizes = {
    sm: { padding: '0.1rem 0.45rem', fontSize: '0.68rem', iconSize: '0.75rem', gap: '0.25rem' },
    md: { padding: '0.2rem 0.65rem', fontSize: '0.78rem', iconSize: '0.85rem', gap: '0.3rem' },
    lg: { padding: '0.3rem 0.875rem', fontSize: '0.9rem',  iconSize: '1rem',   gap: '0.4rem' },
  };
  const s = sizes[size] || sizes.md;

  const configs = {
    'worker-verified': {
      icon: '✅',
      label: 'Verified',
      bg: '#d1fae5',
      color: '#065f46',
      border: '#6ee7b7',
      title: tooltip || 'Identity verified by admin',
    },
    'worker-submitted': {
      icon: '⏳',
      label: 'Under Review',
      bg: '#fef3c7',
      color: '#92400e',
      border: '#fcd34d',
      title: tooltip || 'Documents submitted — awaiting admin review',
    },
    'worker-pending': {
      icon: '○',
      label: 'Not Verified',
      bg: '#f3f4f6',
      color: '#6b7280',
      border: '#e5e7eb',
      title: tooltip || 'Submit documents to get verified',
    },
    'worker-rejected': {
      icon: '❌',
      label: 'Rejected',
      bg: '#fee2e2',
      color: '#991b1b',
      border: '#fca5a5',
      title: tooltip || 'Verification rejected — please re-submit',
    },
    'worker-resubmission': {
      icon: '🔄',
      label: 'Resubmit Required',
      bg: '#fff7ed',
      color: '#c2410c',
      border: '#fed7aa',
      title: tooltip || 'Admin has requested you re-submit documents',
    },
    'customer-trusted': {
      icon: '🏅',
      label: 'Trusted',
      bg: '#fef3c7',
      color: '#92400e',
      border: '#fcd34d',
      title: tooltip || 'Trusted customer — verified by admin',
    },
    'customer-trust-score': {
      icon: score >= 80 ? '🌟' : score >= 60 ? '⭐' : '○',
      label: `Trust ${score ?? 0}%`,
      bg: score >= 80 ? '#d1fae5' : score >= 60 ? '#dbeafe' : '#f3f4f6',
      color: score >= 80 ? '#065f46' : score >= 60 ? '#1e40af' : '#6b7280',
      border: score >= 80 ? '#6ee7b7' : score >= 60 ? '#93c5fd' : '#e5e7eb',
      title: tooltip || `Customer trust score: ${score ?? 0}/100`,
    },
  };

  const cfg = configs[type] || configs['worker-pending'];

  return (
    <span
      title={cfg.title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        padding: s.padding,
        borderRadius: 50,
        fontSize: s.fontSize,
        fontWeight: 700,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        whiteSpace: 'nowrap',
        cursor: tooltip ? 'help' : 'default',
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: s.iconSize, lineHeight: 1 }}>{cfg.icon}</span>
      {showLabel && cfg.label}
    </span>
  );
};

/**
 * Helper: get badge type from worker verification status
 */
export const workerBadgeType = (verificationStatus) => {
  const map = {
    verified:               'worker-verified',
    submitted:              'worker-submitted',
    pending:                'worker-pending',
    rejected:               'worker-rejected',
    'resubmission-required':'worker-resubmission',
  };
  return map[verificationStatus] || 'worker-pending';
};

export default VerifiedBadge;

