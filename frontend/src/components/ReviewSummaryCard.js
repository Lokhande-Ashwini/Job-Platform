import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

/* ── Star display ───────────────────────────────────────────────────────── */
const Stars = ({ rating, size = 16 }) => {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span style={{ display:'inline-flex', gap:1 }}>
      {Array(full).fill(0).map((_, i) => <span key={`f${i}`} style={{ fontSize:size, color:'#f59e0b' }}>★</span>)}
      {half && <span style={{ fontSize:size, color:'#f59e0b' }}>½</span>}
      {Array(empty).fill(0).map((_, i) => <span key={`e${i}`} style={{ fontSize:size, color:'#e5e7eb' }}>★</span>)}
    </span>
  );
};

/* ── Category bar ───────────────────────────────────────────────────────── */
const CategoryBar = ({ label, value, color = '#6366f1' }) => {
  if (!value) return null;
  const pct = (value / 5) * 100;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.5rem' }}>
      <span style={{ fontSize:'0.75rem', color:'#6b7280', width:100, flexShrink:0 }}>{label}</span>
      <div style={{ flex:1, height:6, background:'#f3f4f6', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:3, transition:'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize:'0.75rem', fontWeight:700, color:'#1f2937', width:28, textAlign:'right', flexShrink:0 }}>{value.toFixed(1)}</span>
    </div>
  );
};

/* ── Distribution bar ───────────────────────────────────────────────────── */
const DistBar = ({ star, count, total }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const colors = { 5:'#16a34a', 4:'#65a30d', 3:'#ca8a04', 2:'#ea580c', 1:'#dc2626' };
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.3rem' }}>
      <span style={{ fontSize:'0.72rem', color:'#6b7280', width:14, textAlign:'right', flexShrink:0 }}>{star}</span>
      <span style={{ fontSize:'0.72rem', color:'#f59e0b', flexShrink:0 }}>★</span>
      <div style={{ flex:1, height:6, background:'#f3f4f6', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:colors[star] || '#6366f1', borderRadius:3, transition:'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize:'0.68rem', color:'#9ca3af', width:20, textAlign:'right', flexShrink:0 }}>{count}</span>
    </div>
  );
};

/* ── Single review card ─────────────────────────────────────────────────── */
const ReviewCard = ({ review, service, customer, isWorker, onReply, bookingId }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText,     setReplyText]     = useState('');
  const [submitting,    setSubmitting]    = useState(false);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '';

  const sentimentColor = {
    positive: '#16a34a', neutral: '#ca8a04', negative: '#dc2626',
  }[review.sentiment?.label] || '#6b7280';

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await api.patch(`/bookings/${bookingId}/review/reply`, { reply: replyText });
      onReply && onReply(bookingId, replyText);
      setShowReplyForm(false);
      setReplyText('');
    } catch { }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ background:'white', borderRadius:14, padding:'1.25rem 1.5rem', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', border:'1px solid #f3f4f6', marginBottom:'1rem' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.875rem', flexWrap:'wrap', gap:'0.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.9rem', flexShrink:0, overflow:'hidden' }}>
            {customer?.avatar
              ? <img src={customer.avatar} alt={customer.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : (customer?.name?.charAt(0) || 'C')}
          </div>
          <div>
            <div style={{ fontWeight:700, color:'#1f2937', fontSize:'0.875rem' }}>{customer?.name || 'Customer'}</div>
            <div style={{ fontSize:'0.72rem', color:'#9ca3af' }}>{service} · {fmtDate(review.createdAt)}</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <Stars rating={review.rating} size={14} />
          <span style={{ fontWeight:800, color:'#1f2937', fontSize:'0.9rem' }}>{review.rating.toFixed(1)}</span>
          {review.sentiment?.label && (
            <span style={{ background:sentimentColor+'15', color:sentimentColor, padding:'0.1rem 0.5rem', borderRadius:50, fontSize:'0.65rem', fontWeight:700 }}>
              {review.sentiment.emoji} {review.sentiment.label}
            </span>
          )}
        </div>
      </div>

      {/* Category ratings */}
      {review.categories && Object.values(review.categories).some(v => v > 0) && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:'0.4rem', marginBottom:'0.875rem', padding:'0.75rem', background:'#f9fafb', borderRadius:8 }}>
          {[
            { key:'quality',       label:'Quality',        color:'#6366f1' },
            { key:'behavior',      label:'Behavior',       color:'#10b981' },
            { key:'punctuality',   label:'Punctuality',    color:'#f59e0b' },
            { key:'priceFairness', label:'Price Fairness', color:'#8b5cf6' },
          ].filter(c => review.categories[c.key]).map(c => (
            <div key={c.key} style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
              <span style={{ fontSize:'0.68rem', color:'#9ca3af', width:80, flexShrink:0 }}>{c.label}</span>
              <div style={{ flex:1, height:4, background:'#e5e7eb', borderRadius:2 }}>
                <div style={{ height:'100%', width:`${(review.categories[c.key]/5)*100}%`, background:c.color, borderRadius:2 }} />
              </div>
              <span style={{ fontSize:'0.68rem', fontWeight:700, color:c.color, width:20, textAlign:'right' }}>{review.categories[c.key]}</span>
            </div>
          ))}
        </div>
      )}

      {/* Comment */}
      {review.comment && (
        <p style={{ margin:'0 0 0.875rem', fontSize:'0.875rem', color:'#374151', lineHeight:1.6, fontStyle:'italic' }}>
          "{review.comment}"
        </p>
      )}

      {/* Worker reply */}
      {review.workerReply && (
        <div style={{ background:'#f0fdf4', borderRadius:8, padding:'0.75rem 1rem', marginBottom:'0.75rem', borderLeft:'3px solid #10b981' }}>
          <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#16a34a', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'0.3rem' }}>Worker Reply</div>
          <p style={{ margin:0, fontSize:'0.82rem', color:'#166534', lineHeight:1.5 }}>{review.workerReply}</p>
          {review.workerRepliedAt && <div style={{ fontSize:'0.65rem', color:'#9ca3af', marginTop:'0.25rem' }}>{fmtDate(review.workerRepliedAt)}</div>}
        </div>
      )}

      {/* Reply button for worker */}
      {isWorker && !review.workerReply && (
        <div>
          {!showReplyForm ? (
            <button onClick={() => setShowReplyForm(true)}
              style={{ padding:'0.35rem 0.875rem', background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', borderRadius:8, cursor:'pointer', fontSize:'0.78rem', fontWeight:600 }}>
              💬 Reply to Review
            </button>
          ) : (
            <div style={{ display:'flex', gap:'0.5rem', alignItems:'flex-end' }}>
              <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={2}
                placeholder="Write a professional reply..."
                style={{ flex:1, padding:'0.6rem 0.875rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.82rem', outline:'none', resize:'none', fontFamily:'inherit' }} />
              <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                <button onClick={handleReply} disabled={submitting || !replyText.trim()}
                  style={{ padding:'0.5rem 0.875rem', background:'#10b981', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.78rem', opacity:submitting?0.7:1 }}>
                  {submitting ? '...' : 'Reply'}
                </button>
                <button onClick={() => { setShowReplyForm(false); setReplyText(''); }}
                  style={{ padding:'0.5rem 0.875rem', background:'#f3f4f6', color:'#6b7280', border:'none', borderRadius:8, cursor:'pointer', fontSize:'0.78rem' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Main ReviewSummaryCard ─────────────────────────────────────────────── */
const ReviewSummaryCard = ({ workerId, workerProfile, isWorker = false, compact = false }) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(0);
  const PER_PAGE = 5;

  const fetchReviews = useCallback(async (p = 0) => {
    if (!workerId) return;
    setLoading(true);
    try {
      const { data: d } = await api.get(`/bookings/reviews/${workerId}?limit=${PER_PAGE}&skip=${p * PER_PAGE}`);
      setData(d);
    } catch { }
    finally { setLoading(false); }
  }, [workerId]);

  useEffect(() => { fetchReviews(0); }, [fetchReviews]);

  const handleReply = (bookingId, reply) => {
    setData(prev => ({
      ...prev,
      reviews: prev.reviews.map(r =>
        r._id === bookingId
          ? { ...r, review: { ...r.review, workerReply: reply, workerRepliedAt: new Date() } }
          : r
      ),
    }));
  };

  const summary = data?.summary;
  const reviews = data?.reviews || [];
  const breakdown = workerProfile?.ratingBreakdown || {};

  if (loading && !data) return (
    <div style={{ padding:'2rem', textAlign:'center', color:'#9ca3af', fontSize:'0.875rem' }}>
      <div style={{ width:32, height:32, border:'3px solid #e5e7eb', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 0.75rem' }} />
      Loading reviews...
    </div>
  );

  if (!summary || summary.count === 0) return (
    <div style={{ padding:'2.5rem', textAlign:'center', color:'#9ca3af' }}>
      <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>⭐</div>
      <p style={{ fontWeight:600, color:'#6b7280', margin:'0 0 0.25rem' }}>No reviews yet</p>
      <p style={{ fontSize:'0.8rem', margin:0 }}>Reviews from completed bookings will appear here.</p>
    </div>
  );

  return (
    <div>
      {/* Summary section */}
      <div style={{ display:'grid', gridTemplateColumns: compact ? '1fr' : 'auto 1fr', gap:'1.5rem', marginBottom:'1.5rem', background:'white', borderRadius:14, padding:'1.5rem', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', border:'1px solid #f3f4f6' }}>

        {/* Overall score */}
        <div style={{ textAlign:'center', minWidth:120 }}>
          <div style={{ fontSize:'3.5rem', fontWeight:900, color:'#1f2937', lineHeight:1 }}>{summary.average.toFixed(1)}</div>
          <Stars rating={summary.average} size={18} />
          <div style={{ fontSize:'0.78rem', color:'#9ca3af', marginTop:'0.35rem' }}>{summary.count} review{summary.count !== 1 ? 's' : ''}</div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          {/* Distribution */}
          <div>
            {[5,4,3,2,1].map(s => (
              <DistBar key={s} star={s} count={summary.distribution[s] || 0} total={summary.count} />
            ))}
          </div>

          {/* Category breakdown */}
          {Object.values(breakdown).some(v => v > 0) && (
            <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:'0.75rem' }}>
              <CategoryBar label="Quality"        value={breakdown.quality}       color="#6366f1" />
              <CategoryBar label="Behavior"       value={breakdown.behavior}      color="#10b981" />
              <CategoryBar label="Punctuality"    value={breakdown.punctuality}   color="#f59e0b" />
              <CategoryBar label="Price Fairness" value={breakdown.priceFairness} color="#8b5cf6" />
            </div>
          )}
        </div>
      </div>

      {/* Review list */}
      <div>
        {reviews.map(r => (
          <ReviewCard
            key={r._id}
            bookingId={r._id}
            review={r.review}
            service={r.service}
            customer={r.customer}
            isWorker={isWorker}
            onReply={handleReply}
          />
        ))}

        {/* Pagination */}
        {data?.total > PER_PAGE && (
          <div style={{ display:'flex', justifyContent:'center', gap:'0.5rem', marginTop:'1rem' }}>
            <button onClick={() => { const p = page - 1; setPage(p); fetchReviews(p); }} disabled={page === 0}
              style={{ padding:'0.4rem 0.875rem', border:'1px solid #e5e7eb', borderRadius:8, background:'white', color: page === 0 ? '#d1d5db' : '#374151', cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize:'0.82rem', fontWeight:600 }}>
              ← Prev
            </button>
            <span style={{ padding:'0.4rem 0.75rem', fontSize:'0.8rem', color:'#6b7280' }}>
              {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, data.total)} of {data.total}
            </span>
            <button onClick={() => { const p = page + 1; setPage(p); fetchReviews(p); }} disabled={(page + 1) * PER_PAGE >= data.total}
              style={{ padding:'0.4rem 0.875rem', border:'1px solid #e5e7eb', borderRadius:8, background:'white', color: (page+1)*PER_PAGE >= data.total ? '#d1d5db' : '#374151', cursor: (page+1)*PER_PAGE >= data.total ? 'not-allowed' : 'pointer', fontSize:'0.82rem', fontWeight:600 }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export { Stars, CategoryBar, DistBar, ReviewCard };
export default ReviewSummaryCard;
