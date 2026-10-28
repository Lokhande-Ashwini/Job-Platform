import { useState, useEffect, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import { toast } from 'react-toastify';

import Navbar from '../components/Navbar';

import api from '../utils/api';



const STATUS_MAP = {

  new:           { bg:'#ede9fe', color:'#6366f1',  label:'New' },

  viewed:        { bg:'#dbeafe', color:'#2563eb',  label:'Viewed' },

  negotiating:   { bg:'#fef3c7', color:'#ca8a04',  label:'Negotiating' },

  accepted:      { bg:'#dcfce7', color:'#16a34a',  label:'Accepted ✓' },

  rejected:      { bg:'#fee2e2', color:'#dc2626',  label:'Rejected' },

  expired:       { bg:'#f3f4f6', color:'#6b7280',  label:'Expired' },

  'admin-review':{ bg:'#f3e8ff', color:'#9333ea',  label:'Admin Review' },

};



function fmtDate(d) {

  if (!d) return '';

  return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });

}

function fmtTime(d) {

  if (!d) return '';

  const date = new Date(d), now = new Date(), diff = now - date;

  if (diff < 60000)    return 'just now';

  if (diff < 3600000)  return Math.floor(diff/60000) + 'm ago';

  if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago';

  return fmtDate(d);

}

function daysLeft(d) {

  if (!d) return null;

  const diff = new Date(d) - new Date();

  if (diff <= 0) return 0;

  return Math.ceil(diff / 86400000);

}



const Pill = ({ bg, color, children, style }) => (

  <span style={{ display:'inline-block', padding:'0.15rem 0.6rem', borderRadius:20, fontSize:'0.72rem', fontWeight:700, background:bg, color, ...style }}>{children}</span>

);



const Modal = ({ title, onClose, children, maxWidth = 500 }) => (

  <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem', backdropFilter:'blur(4px)' }}>

    <div style={{ background:'white', borderRadius:20, padding:'2rem', width:'100%', maxWidth, boxShadow:'0 20px 60px rgba(0,0,0,0.25)', maxHeight:'90vh', overflowY:'auto' }}>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>

        <h3 style={{ color:'#1f2937', fontWeight:700, margin:0, fontSize:'1.05rem' }}>{title}</h3>

        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem', color:'#9ca3af' }}>x</button>

      </div>

      {children}

    </div>

  </div>

);



const inp = { width:'100%', padding:'0.7rem 0.9rem', border:'1.5px solid #e5e7eb', borderRadius:9, fontSize:'0.9rem', outline:'none', boxSizing:'border-box', fontFamily:'inherit', background:'white' };

const lbl = { display:'block', fontWeight:600, color:'#374151', marginBottom:'0.35rem', fontSize:'0.82rem' };



/* ── CUSTOMER QUOTE PAGE ─────────────────────────────────────────────────── */

function CustomerQuotes() {

  const { user } = useAuth();

  const navigate = useNavigate();

  const [quotes,    setQuotes]    = useState([]);

  const [selected,  setSelected]  = useState(null);

  const [loading,   setLoading]   = useState(true);

  const [filter,    setFilter]    = useState('all');

  const [modal,     setModal]     = useState(null); // 'counter' | 'question'

  const [form,      setForm]      = useState({});

  const [submitting,setSubmitting]= useState(false);



  const fetchQuotes = useCallback(async () => {

    try {

      const { data } = await api.get('/quotes/incoming');

      setQuotes(data);

    } catch { toast.error('Failed to load quotes'); }

    finally { setLoading(false); }

  }, []);



  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);



  const openQuote = async (q) => {

    setSelected(q);

    if (!q.viewedByCustomer) {

      api.patch('/quotes/' + q._id + '/viewed').catch(() => {});

      setQuotes(prev => prev.map(x => x._id === q._id ? { ...x, viewedByCustomer: true, status: x.status === 'new' ? 'viewed' : x.status } : x));

    }

  };



  const doAction = async (action, payload) => {

    setSubmitting(true);

    try {

      let res;

      if (action === 'accept')   res = await api.patch('/quotes/' + selected._id + '/approve');

      if (action === 'reject')   res = await api.patch('/quotes/' + selected._id + '/reject', { note: payload });

      if (action === 'counter')  res = await api.patch('/quotes/' + selected._id + '/counter', payload);

      if (action === 'question') res = await api.post('/quotes/' + selected._id + '/questions', payload);

      toast.success(action === 'accept' ? 'Quote accepted!' : action === 'reject' ? 'Quote rejected' : action === 'counter' ? 'Counter offer sent!' : 'Question sent!');

      setSelected(res.data);

      setQuotes(prev => prev.map(x => x._id === res.data._id ? res.data : x));

      setModal(null);

      setForm({});

    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }

    finally { setSubmitting(false); }

  };



  const isNew = (q) => {

    const uid = user?._id || user?.id;

    return !q.viewedByCustomer && !(q.seenBy || []).some(s => (s._id || s)?.toString() === uid?.toString());

  };



  const filtered = filter === 'all' ? quotes : quotes.filter(q => q.status === filter);

  const newCount  = quotes.filter(q => isNew(q)).length;

  const canAct    = selected && ['new','viewed','negotiating'].includes(selected.status);



  return (

    <div style={{ minHeight:'100vh', background:'#f8fafc', display:'flex', flexDirection:'column' }}>

      <Navbar />

      <div style={{ display:'flex', flex:1, overflow:'hidden', height:'calc(100vh - 64px)' }}>



        {/* Sidebar */}

        <div style={{ width:320, minWidth:260, background:'white', borderRight:'1px solid #e5e7eb', display:'flex', flexDirection:'column', overflow:'hidden' }}>

          <div style={{ padding:'1rem', borderBottom:'1px solid #f3f4f6' }}>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.5rem' }}>

              <div>

                <h2 style={{ margin:0, fontSize:'1rem', fontWeight:700, color:'#1f2937' }}>Incoming Quotes</h2>

                <div style={{ fontSize:'0.72rem', color:'#9ca3af', marginTop:'0.1rem' }}>

                  {quotes.length} total{newCount > 0 && <span style={{ color:'#ef4444', fontWeight:700 }}> · {newCount} new</span>}

                </div>

              </div>

            </div>

            <div style={{ display:'flex', gap:'0.3rem', flexWrap:'wrap' }}>

              {['all','new','viewed','negotiating','accepted','rejected','expired'].map(s => (

                <button key={s} onClick={() => setFilter(s)}

                  style={{ padding:'0.18rem 0.55rem', borderRadius:20, fontSize:'0.68rem', fontWeight:600, cursor:'pointer', border:'none',

                    background: filter === s ? '#6366f1' : '#f3f4f6', color: filter === s ? 'white' : '#6b7280' }}>

                  {s === 'all' ? 'All' : STATUS_MAP[s]?.label || s}

                </button>

              ))}

            </div>

          </div>



          <div style={{ flex:1, overflowY:'auto' }}>

            {loading ? <div style={{ padding:'2rem', textAlign:'center', color:'#9ca3af', fontSize:'0.875rem' }}>Loading...</div>

            : filtered.length === 0 ? (

              <div style={{ padding:'2.5rem 1.5rem', textAlign:'center', color:'#9ca3af' }}>

                <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>💬</div>

                <p style={{ fontWeight:600, color:'#6b7280', margin:'0 0 0.25rem' }}>No quotes yet</p>

                <p style={{ fontSize:'0.8rem', margin:0 }}>Workers will send quotes for your bookings.</p>

              </div>

            ) : filtered.map(q => {

              const sc = STATUS_MAP[q.status] || STATUS_MAP['new'];

              const isActive = selected?._id === q._id;

              const fresh = isNew(q);

              const days = daysLeft(q.validUntil);

              return (

                <div key={q._id} onClick={() => openQuote(q)}

                  style={{ padding:'0.875rem 1rem', borderBottom:'1px solid #f3f4f6', cursor:'pointer',

                    background: isActive ? '#eff6ff' : 'white',

                    borderLeft: isActive ? '3px solid #6366f1' : fresh ? '3px solid #ef4444' : '3px solid transparent' }}

                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f9fafb'; }}

                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'white'; }}>

                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'0.4rem' }}>

                    <div style={{ flex:1, minWidth:0 }}>

                      <div style={{ fontWeight: fresh ? 700 : 600, color:'#1f2937', fontSize:'0.875rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>

                        {q.booking?.service || 'Service'}

                      </div>

                      <div style={{ fontSize:'0.72rem', color:'#9ca3af', marginTop:'0.1rem' }}>{q.worker?.name}</div>

                    </div>

                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'0.2rem', flexShrink:0 }}>

                      {fresh && <span style={{ background:'#ef4444', color:'white', borderRadius:50, padding:'0.08rem 0.45rem', fontSize:'0.62rem', fontWeight:700 }}>NEW</span>}

                      <Pill bg={sc.bg} color={sc.color}>{sc.label}</Pill>

                    </div>

                  </div>

                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'0.35rem' }}>

                    <span style={{ fontWeight:700, color:'#1f2937', fontSize:'0.9rem' }}>

                      {q.counterAmount ? '₹' + q.counterAmount + ' (counter)' : '₹' + q.quotedAmount}

                    </span>

                    <span style={{ fontSize:'0.68rem', color: days !== null && days <= 1 ? '#ef4444' : '#9ca3af' }}>

                      {days !== null && days > 0 ? days + 'd left' : days === 0 ? 'Expires today' : fmtTime(q.createdAt)}

                    </span>

                  </div>

                </div>

              );

            })}

          </div>

        </div>



        {/* Detail panel */}

        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#f8fafc' }}>

          {!selected ? (

            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#9ca3af', gap:'0.75rem' }}>

              <div style={{ fontSize:'3.5rem' }}>💬</div>

              <p style={{ fontWeight:600, color:'#6b7280', fontSize:'1rem', margin:0 }}>Select a quote to review</p>

            </div>

          ) : (

            <div style={{ flex:1, overflowY:'auto', padding:'1.5rem' }}>

              <div style={{ maxWidth:700, margin:'0 auto' }}>



                {/* Quote header card */}

                <div style={{ background:'white', borderRadius:16, padding:'1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:'1rem' }}>

                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem', marginBottom:'1.25rem' }}>

                    <div>

                      <div style={{ fontSize:'1.15rem', fontWeight:800, color:'#1f2937', marginBottom:'0.25rem' }}>{selected.booking?.service}</div>

                      <div style={{ fontSize:'0.82rem', color:'#9ca3af' }}>

                        Scheduled: {fmtDate(selected.booking?.scheduledDate)}

                        {selected.booking?.status && <span style={{ marginLeft:'0.5rem', background:'#f3f4f6', color:'#6b7280', padding:'0.1rem 0.4rem', borderRadius:4, fontSize:'0.7rem' }}>{selected.booking.status}</span>}

                      </div>

                    </div>

                    <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', alignItems:'center' }}>

                      <Pill bg={STATUS_MAP[selected.status]?.bg} color={STATUS_MAP[selected.status]?.color}>{STATUS_MAP[selected.status]?.label}</Pill>

                      {selected.adminReviewRequired && <Pill bg="#f3e8ff" color="#9333ea">🛡️ Admin Flagged</Pill>}

                    </div>

                  </div>



                  {/* Worker info */}

                  <div style={{ display:'flex', alignItems:'center', gap:'0.875rem', padding:'0.875rem 1rem', background:'#f9fafb', borderRadius:10, marginBottom:'1.25rem' }}>

                    <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1.1rem', flexShrink:0 }}>

                      {selected.worker?.name?.charAt(0)}

                    </div>

                    <div style={{ flex:1 }}>

                      <div style={{ fontWeight:700, color:'#1f2937' }}>{selected.worker?.name}</div>

                      <div style={{ fontSize:'0.78rem', color:'#9ca3af' }}>

                        {selected.worker?.workerProfile?.skills?.slice(0,3).join(', ')}

                        {selected.worker?.workerProfile?.rating > 0 && <span style={{ marginLeft:'0.5rem' }}>⭐ {selected.worker.workerProfile.rating.toFixed(1)}</span>}

                        {selected.worker?.workerProfile?.verificationStatus === 'verified' && <span style={{ marginLeft:'0.5rem', color:'#10b981', fontWeight:600 }}>✓ Verified</span>}

                      </div>

                    </div>

                    <button onClick={() => navigate('/profile')} style={{ padding:'0.4rem 0.875rem', background:'#ede9fe', color:'#6366f1', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.78rem' }}>View Profile</button>

                  </div>



                  {/* Pricing grid */}

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:'0.75rem', marginBottom:'1.25rem' }}>

                    {[

                      { label:'Original Amount', value:'₹' + selected.estimatedAmount, color:'#6b7280' },

                      { label:'Quoted Price',     value:'₹' + selected.quotedAmount,    color:'#6366f1' },

                      selected.counterAmount && { label:'Counter Offer', value:'₹' + selected.counterAmount, color:'#ca8a04' },

                      selected.finalAmount   && { label:'Agreed Price',  value:'₹' + selected.finalAmount,   color:'#16a34a' },

                    ].filter(Boolean).map((item, i) => (

                      <div key={i} style={{ background:'#f9fafb', borderRadius:10, padding:'0.875rem 1rem' }}>

                        <div style={{ fontSize:'0.7rem', color:'#9ca3af', fontWeight:600, textTransform:'uppercase', marginBottom:'0.25rem' }}>{item.label}</div>

                        <div style={{ fontSize:'1.2rem', fontWeight:800, color: item.color }}>{item.value}</div>

                      </div>

                    ))}

                  </div>



                  {/* Details row */}

                  <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap', marginBottom:'1rem', fontSize:'0.82rem', color:'#6b7280' }}>

                    {selected.estimatedHours && <span>⏱ {selected.estimatedHours}h estimated</span>}

                    {selected.estimatedStartDate && <span>📅 Start: {fmtDate(selected.estimatedStartDate)}</span>}

                    {selected.validUntil && <span style={{ color: daysLeft(selected.validUntil) <= 1 ? '#ef4444' : '#6b7280' }}>

                      ⏳ Valid until {fmtDate(selected.validUntil)} ({daysLeft(selected.validUntil)}d left)

                    </span>}

                    <span>📨 Sent {fmtTime(selected.createdAt)}</span>

                    {selected.viewedByCustomer && <span style={{ color:'#10b981' }}>👁 Viewed {fmtTime(selected.viewedAt)}</span>}

                  </div>



                  {/* Notes */}

                  {selected.notes && (

                    <div style={{ background:'#f9fafb', borderRadius:10, padding:'0.875rem 1rem', marginBottom:'1rem', fontSize:'0.875rem', color:'#374151', borderLeft:'3px solid #6366f1' }}>

                      <div style={{ fontSize:'0.7rem', color:'#9ca3af', fontWeight:600, marginBottom:'0.3rem' }}>WORKER NOTES</div>

                      {selected.notes}

                    </div>

                  )}



                  {/* Admin note */}

                  {selected.adminNote && (

                    <div style={{ background:'#f3e8ff', borderRadius:10, padding:'0.875rem 1rem', marginBottom:'1rem', fontSize:'0.875rem', color:'#7c3aed', borderLeft:'3px solid #9333ea' }}>

                      🛡️ Admin note: {selected.adminNote}

                    </div>

                  )}



                  {/* Actions */}

                  {canAct && (

                    <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>

                      <button onClick={() => doAction('accept')} style={{ padding:'0.65rem 1.5rem', background:'#10b981', color:'white', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700, fontSize:'0.9rem' }}>✓ Accept Quote</button>

                      <button onClick={() => { setModal('counter'); setForm({ counterAmount: selected.quotedAmount, note:'' }); }} style={{ padding:'0.65rem 1.5rem', background:'#f59e0b', color:'white', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700, fontSize:'0.9rem' }}>Counter Offer</button>

                      <button onClick={() => doAction('reject')} style={{ padding:'0.65rem 1.5rem', background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:'0.9rem' }}>Reject</button>

                      <button onClick={() => { setModal('question'); setForm({ question:'' }); }} style={{ padding:'0.65rem 1.25rem', background:'#ede9fe', color:'#6366f1', border:'none', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:'0.9rem' }}>Ask Question</button>

                    </div>

                  )}

                </div>



                {/* Q&A */}

                {selected.questions?.length > 0 && (

                  <div style={{ background:'white', borderRadius:16, padding:'1.25rem 1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:'1rem' }}>

                    <div style={{ fontWeight:700, color:'#1f2937', marginBottom:'1rem', fontSize:'0.9rem' }}>Questions & Answers</div>

                    {selected.questions.map((q, i) => (

                      <div key={i} style={{ marginBottom:'0.875rem', paddingBottom:'0.875rem', borderBottom: i < selected.questions.length - 1 ? '1px solid #f3f4f6' : 'none' }}>

                        <div style={{ fontSize:'0.85rem', color:'#1f2937', fontWeight:600, marginBottom:'0.3rem' }}>

                          ❓ {q.question}

                          <span style={{ fontSize:'0.68rem', color:'#9ca3af', fontWeight:400, marginLeft:'0.5rem' }}>{fmtTime(q.askedAt)}</span>

                        </div>

                        {q.answer ? (

                          <div style={{ fontSize:'0.82rem', color:'#374151', paddingLeft:'1rem', borderLeft:'2px solid #10b981' }}>

                            💬 {q.answer}

                            <span style={{ fontSize:'0.65rem', color:'#9ca3af', marginLeft:'0.5rem' }}>{fmtTime(q.answeredAt)}</span>

                          </div>

                        ) : (

                          <div style={{ fontSize:'0.78rem', color:'#9ca3af', paddingLeft:'1rem' }}>Awaiting answer...</div>

                        )}

                      </div>

                    ))}

                    {canAct && (

                      <button onClick={() => { setModal('question'); setForm({ question:'' }); }} style={{ padding:'0.4rem 1rem', background:'#ede9fe', color:'#6366f1', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.78rem', marginTop:'0.5rem' }}>+ Ask Another Question</button>

                    )}

                  </div>

                )}



                {/* Negotiation history */}

                {selected.history?.length > 0 && (

                  <div style={{ background:'white', borderRadius:16, padding:'1.25rem 1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>

                    <div style={{ fontWeight:700, color:'#1f2937', marginBottom:'1rem', fontSize:'0.9rem' }}>Negotiation History</div>

                    <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>

                      {selected.history.map((h, i) => (

                        <div key={i} style={{ display:'flex', gap:'0.75rem', alignItems:'flex-start', fontSize:'0.82rem' }}>

                          <span style={{ color:'#9ca3af', flexShrink:0, whiteSpace:'nowrap', fontSize:'0.7rem', marginTop:'0.1rem' }}>{fmtTime(h.at)}</span>

                          <span style={{ background:'#f3f4f6', color:'#374151', padding:'0.1rem 0.5rem', borderRadius:4, fontWeight:600, flexShrink:0, fontSize:'0.72rem' }}>{h.action}</span>

                          {h.amount && <span style={{ fontWeight:700, color:'#1f2937', flexShrink:0 }}>₹{h.amount}</span>}

                          {h.note && <span style={{ color:'#6b7280', fontStyle:'italic' }}>— {h.note}</span>}

                        </div>

                      ))}

                    </div>

                  </div>

                )}

              </div>

            </div>

          )}

        </div>

      </div>



      {/* Counter modal */}

      {modal === 'counter' && (

        <Modal title="Make a Counter Offer" onClose={() => setModal(null)}>

          <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', padding:'0.875rem 1rem', borderRadius:10, marginBottom:'1.25rem', fontSize:'0.875rem', color:'#9a3412' }}>

            Worker quoted: <strong>₹{selected.quotedAmount}</strong>. Enter your preferred amount.

          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

            <div><label style={lbl}>Your Counter Amount (₹) *</label>

              <input type="number" value={form.counterAmount || ''} onChange={e => setForm(f => ({ ...f, counterAmount: e.target.value }))} min="1" style={inp} /></div>

            <div><label style={lbl}>Note to Worker</label>

              <textarea value={form.note || ''} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={3} placeholder="Explain your counter offer..." style={{ ...inp, resize:'vertical' }} /></div>

            <div style={{ display:'flex', gap:'0.75rem' }}>

              <button onClick={() => doAction('counter', form)} disabled={submitting || !form.counterAmount} style={{ flex:1, padding:'0.75rem', background:'#f59e0b', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', opacity: submitting ? 0.7 : 1 }}>

                {submitting ? 'Sending...' : 'Send Counter Offer'}

              </button>

              <button onClick={() => setModal(null)} style={{ flex:1, padding:'0.75rem', background:'#f3f4f6', color:'#6b7280', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer' }}>Cancel</button>

            </div>

          </div>

        </Modal>

      )}



      {/* Question modal */}

      {modal === 'question' && (

        <Modal title="Ask a Question" onClose={() => setModal(null)}>

          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

            <div><label style={lbl}>Your Question *</label>

              <textarea value={form.question || ''} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} rows={3} placeholder="Ask about materials, timeline, scope..." style={{ ...inp, resize:'vertical' }} /></div>

            <div style={{ display:'flex', gap:'0.75rem' }}>

              <button onClick={() => doAction('question', { question: form.question })} disabled={submitting || !form.question?.trim()} style={{ flex:1, padding:'0.75rem', background:'#6366f1', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', opacity: submitting ? 0.7 : 1 }}>

                {submitting ? 'Sending...' : 'Send Question'}

              </button>

              <button onClick={() => setModal(null)} style={{ flex:1, padding:'0.75rem', background:'#f3f4f6', color:'#6b7280', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer' }}>Cancel</button>

            </div>

          </div>

        </Modal>

      )}

    </div>

  );

}



/* ── WORKER QUOTE PAGE ───────────────────────────────────────────────────── */

function WorkerQuotes() {

  const [quotes,    setQuotes]    = useState([]);

  const [selected,  setSelected]  = useState(null);

  const [loading,   setLoading]   = useState(true);

  const [filter,    setFilter]    = useState('all');

  const [modal,     setModal]     = useState(null);

  const [form,      setForm]      = useState({});

  const [submitting,setSubmitting]= useState(false);

  const [bookings,  setBookings]  = useState([]);

  const [showNewForm, setShowNewForm] = useState(false);

  const [newForm,   setNewForm]   = useState({ bookingId:'', quotedAmount:'', notes:'', estimatedHours:'', estimatedStartDate:'', validityDays:'3' });



  const fetchQuotes = useCallback(async () => {

    try {

      const [qRes, bRes] = await Promise.all([

        api.get('/quotes/my'),

        api.get('/bookings'),

      ]);

      setQuotes(qRes.data);

      const quotedBookingIds = new Set(qRes.data.filter(q => !['rejected','expired'].includes(q.status)).map(q => q.booking?._id || q.booking));

      setBookings(bRes.data.filter(b => ['accepted','in-progress','requested'].includes(b.status) && !quotedBookingIds.has(b._id)));

    } catch { toast.error('Failed to load quotes'); }

    finally { setLoading(false); }

  }, []);



  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);



  const submitNewQuote = async (e) => {

    e.preventDefault();

    setSubmitting(true);

    try {

      const { data } = await api.post('/quotes', newForm);

      toast.success('Quote submitted!');

      setShowNewForm(false);

      setNewForm({ bookingId:'', quotedAmount:'', notes:'', estimatedHours:'', estimatedStartDate:'', validityDays:'3' });

      setQuotes(prev => [data, ...prev]);

      setSelected(data);

    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }

    finally { setSubmitting(false); }

  };



  const doAction = async (action, payload) => {

    setSubmitting(true);

    try {

      let res;

      if (action === 'accept')         res = await api.patch('/quotes/' + selected._id + '/approve');

      if (action === 'reject')         res = await api.patch('/quotes/' + selected._id + '/reject', { note: payload });

      if (action === 'worker-counter') res = await api.patch('/quotes/' + selected._id + '/worker-counter', payload);

      if (action === 'answer')         res = await api.patch('/quotes/' + selected._id + '/questions/' + payload.questionId + '/answer', { answer: payload.answer });

      toast.success('Done');

      setSelected(res.data);

      setQuotes(prev => prev.map(x => x._id === res.data._id ? res.data : x));

      setModal(null);

      setForm({});

    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }

    finally { setSubmitting(false); }

  };



  const filtered = filter === 'all' ? quotes : quotes.filter(q => q.status === filter);

  const pendingResponse = quotes.filter(q => q.status === 'negotiating').length;

  const unansweredQs = quotes.reduce((s, q) => s + (q.questions || []).filter(x => !x.answer).length, 0);



  return (

    <div style={{ minHeight:'100vh', background:'#f8fafc', display:'flex', flexDirection:'column' }}>

      <Navbar />

      <div style={{ display:'flex', flex:1, overflow:'hidden', height:'calc(100vh - 64px)' }}>



        {/* Sidebar */}

        <div style={{ width:320, minWidth:260, background:'white', borderRight:'1px solid #e5e7eb', display:'flex', flexDirection:'column', overflow:'hidden' }}>

          <div style={{ padding:'1rem', borderBottom:'1px solid #f3f4f6' }}>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.5rem' }}>

              <div>

                <h2 style={{ margin:0, fontSize:'1rem', fontWeight:700, color:'#1f2937' }}>My Quotes</h2>

                <div style={{ fontSize:'0.72rem', color:'#9ca3af', marginTop:'0.1rem' }}>

                  {quotes.length} total

                  {pendingResponse > 0 && <span style={{ color:'#ca8a04', fontWeight:700 }}> · {pendingResponse} need response</span>}

                  {unansweredQs > 0 && <span style={{ color:'#6366f1', fontWeight:700 }}> · {unansweredQs} questions</span>}

                </div>

              </div>

              {bookings.length > 0 && (

                <button onClick={() => setShowNewForm(true)} style={{ background:'#6366f1', color:'white', border:'none', borderRadius:8, padding:'0.4rem 0.75rem', fontSize:'0.78rem', fontWeight:600, cursor:'pointer' }}>+ Quote</button>

              )}

            </div>

            <div style={{ display:'flex', gap:'0.3rem', flexWrap:'wrap' }}>

              {['all','new','viewed','negotiating','accepted','rejected','expired','admin-review'].map(s => (

                <button key={s} onClick={() => setFilter(s)}

                  style={{ padding:'0.18rem 0.5rem', borderRadius:20, fontSize:'0.65rem', fontWeight:600, cursor:'pointer', border:'none',

                    background: filter === s ? '#6366f1' : '#f3f4f6', color: filter === s ? 'white' : '#6b7280' }}>

                  {s === 'all' ? 'All' : STATUS_MAP[s]?.label || s}

                </button>

              ))}

            </div>

          </div>



          <div style={{ flex:1, overflowY:'auto' }}>

            {loading ? <div style={{ padding:'2rem', textAlign:'center', color:'#9ca3af', fontSize:'0.875rem' }}>Loading...</div>

            : filtered.length === 0 ? (

              <div style={{ padding:'2.5rem 1.5rem', textAlign:'center', color:'#9ca3af' }}>

                <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>📋</div>

                <p style={{ fontWeight:600, color:'#6b7280', margin:'0 0 0.25rem' }}>No quotes yet</p>

                {bookings.length > 0 && <button onClick={() => setShowNewForm(true)} style={{ marginTop:'0.75rem', padding:'0.45rem 1rem', background:'#6366f1', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.8rem' }}>Submit a Quote</button>}

              </div>

            ) : filtered.map(q => {

              const sc = STATUS_MAP[q.status] || STATUS_MAP['new'];

              const isActive = selected?._id === q._id;

              const hasCounter = q.status === 'negotiating' && q.counterAmount;

              const unanswered = (q.questions || []).filter(x => !x.answer).length;

              return (

                <div key={q._id} onClick={() => { setSelected(q); api.patch('/quotes/' + q._id + '/seen').catch(() => {}); }}

                  style={{ padding:'0.875rem 1rem', borderBottom:'1px solid #f3f4f6', cursor:'pointer',

                    background: isActive ? '#f5f3ff' : 'white',

                    borderLeft: isActive ? '3px solid #6366f1' : hasCounter ? '3px solid #ca8a04' : '3px solid transparent' }}

                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f9fafb'; }}

                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'white'; }}>

                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'0.4rem' }}>

                    <div style={{ flex:1, minWidth:0 }}>

                      <div style={{ fontWeight:600, color:'#1f2937', fontSize:'0.875rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>

                        {q.booking?.service || 'Service'}

                      </div>

                      <div style={{ fontSize:'0.72rem', color:'#9ca3af', marginTop:'0.1rem' }}>{q.customer?.name}</div>

                    </div>

                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'0.2rem', flexShrink:0 }}>

                      <Pill bg={sc.bg} color={sc.color}>{sc.label}</Pill>

                      {unanswered > 0 && <span style={{ background:'#ede9fe', color:'#6366f1', borderRadius:50, padding:'0.05rem 0.4rem', fontSize:'0.6rem', fontWeight:700 }}>{unanswered} Q</span>}

                    </div>

                  </div>

                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'0.35rem' }}>

                    <span style={{ fontWeight:700, color:'#1f2937', fontSize:'0.875rem' }}>₹{q.quotedAmount}</span>

                    {hasCounter && <span style={{ fontSize:'0.72rem', color:'#ca8a04', fontWeight:600 }}>Counter: ₹{q.counterAmount}</span>}

                    <span style={{ fontSize:'0.68rem', color:'#9ca3af' }}>{fmtTime(q.updatedAt || q.createdAt)}</span>

                  </div>

                  {q.viewedByCustomer && <div style={{ fontSize:'0.65rem', color:'#10b981', marginTop:'0.2rem' }}>👁 Viewed by customer</div>}

                </div>

              );

            })}

          </div>

        </div>



        {/* Detail panel */}

        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#f8fafc' }}>

          {showNewForm ? (

            <div style={{ flex:1, overflowY:'auto', padding:'1.5rem' }}>

              <div style={{ maxWidth:600, margin:'0 auto', background:'white', borderRadius:16, padding:'2rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>

                  <h3 style={{ margin:0, fontWeight:700, color:'#1f2937' }}>Submit a Quote</h3>

                  <button onClick={() => setShowNewForm(false)} style={{ background:'none', border:'none', fontSize:'1.2rem', cursor:'pointer', color:'#9ca3af' }}>x</button>

                </div>

                <form onSubmit={submitNewQuote} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

                  <div><label style={lbl}>Booking *</label>

                    <select value={newForm.bookingId} onChange={e => setNewForm(f => ({ ...f, bookingId: e.target.value }))} required style={inp}>

                      <option value="">Select booking...</option>

                      {bookings.map(b => <option key={b._id} value={b._id}>{b.service} — {b.customer?.name} — ₹{b.amount}</option>)}

                    </select>

                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>

                    <div><label style={lbl}>Your Quote (₹) *</label>

                      <input type="number" value={newForm.quotedAmount} onChange={e => setNewForm(f => ({ ...f, quotedAmount: e.target.value }))} required min="1" placeholder="e.g. 1500" style={inp} /></div>

                    <div><label style={lbl}>Estimated Hours</label>

                      <input type="number" value={newForm.estimatedHours} onChange={e => setNewForm(f => ({ ...f, estimatedHours: e.target.value }))} min="0.5" step="0.5" placeholder="e.g. 3" style={inp} /></div>

                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>

                    <div><label style={lbl}>Estimated Start Date</label>

                      <input type="date" value={newForm.estimatedStartDate} onChange={e => setNewForm(f => ({ ...f, estimatedStartDate: e.target.value }))} style={inp} /></div>

                    <div><label style={lbl}>Valid for (days)</label>

                      <select value={newForm.validityDays} onChange={e => setNewForm(f => ({ ...f, validityDays: e.target.value }))} style={inp}>

                        {[1,2,3,5,7].map(d => <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>)}

                      </select>

                    </div>

                  </div>

                  <div><label style={lbl}>Notes / Breakdown</label>

                    <textarea value={newForm.notes} onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))} rows={4} placeholder="Explain your pricing — materials, complexity, travel, etc." style={{ ...inp, resize:'vertical' }} /></div>

                  <div style={{ background:'#fef3c7', padding:'0.75rem 1rem', borderRadius:8, fontSize:'0.82rem', color:'#92400e' }}>

                    Quotes significantly above your base rate will be flagged for admin review before the customer sees them.

                  </div>

                  <div style={{ display:'flex', gap:'0.75rem' }}>

                    <button type="submit" disabled={submitting} style={{ flex:1, padding:'0.875rem', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', opacity: submitting ? 0.7 : 1 }}>

                      {submitting ? 'Submitting...' : 'Submit Quote'}

                    </button>

                    <button type="button" onClick={() => setShowNewForm(false)} style={{ flex:1, padding:'0.875rem', background:'#f3f4f6', color:'#6b7280', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer' }}>Cancel</button>

                  </div>

                </form>

              </div>

            </div>

          ) : !selected ? (

            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#9ca3af', gap:'0.75rem' }}>

              <div style={{ fontSize:'3.5rem' }}>📋</div>

              <p style={{ fontWeight:600, color:'#6b7280', fontSize:'1rem', margin:0 }}>Select a quote to view details</p>

              {bookings.length > 0 && <button onClick={() => setShowNewForm(true)} style={{ marginTop:'0.5rem', background:'#6366f1', color:'white', border:'none', borderRadius:8, padding:'0.6rem 1.5rem', fontWeight:600, cursor:'pointer', fontSize:'0.875rem' }}>+ Submit New Quote</button>}

            </div>

          ) : (

            <div style={{ flex:1, overflowY:'auto', padding:'1.5rem' }}>

              <div style={{ maxWidth:700, margin:'0 auto' }}>



                {/* Quote header */}

                <div style={{ background:'white', borderRadius:16, padding:'1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:'1rem' }}>

                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem', marginBottom:'1.25rem' }}>

                    <div>

                      <div style={{ fontSize:'1.15rem', fontWeight:800, color:'#1f2937', marginBottom:'0.25rem' }}>{selected.booking?.service}</div>

                      <div style={{ fontSize:'0.82rem', color:'#9ca3af' }}>Customer: {selected.customer?.name} · {fmtDate(selected.booking?.scheduledDate)}</div>

                    </div>

                    <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', alignItems:'center' }}>

                      <Pill bg={STATUS_MAP[selected.status]?.bg} color={STATUS_MAP[selected.status]?.color}>{STATUS_MAP[selected.status]?.label}</Pill>

                      {selected.adminReviewRequired && <Pill bg="#f3e8ff" color="#9333ea">🛡️ Admin Flagged</Pill>}

                      {selected.viewedByCustomer && <Pill bg="#dcfce7" color="#16a34a">👁 Viewed</Pill>}

                    </div>

                  </div>



                  {/* Pricing */}

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:'0.75rem', marginBottom:'1.25rem' }}>

                    {[

                      { label:'Your Quote',     value:'₹' + selected.quotedAmount,    color:'#6366f1' },

                      selected.counterAmount && { label:'Customer Counter', value:'₹' + selected.counterAmount, color:'#ca8a04' },

                      selected.finalAmount   && { label:'Agreed Price',     value:'₹' + selected.finalAmount,   color:'#16a34a' },

                    ].filter(Boolean).map((item, i) => (

                      <div key={i} style={{ background:'#f9fafb', borderRadius:10, padding:'0.875rem 1rem' }}>

                        <div style={{ fontSize:'0.7rem', color:'#9ca3af', fontWeight:600, textTransform:'uppercase', marginBottom:'0.25rem' }}>{item.label}</div>

                        <div style={{ fontSize:'1.2rem', fontWeight:800, color: item.color }}>{item.value}</div>

                      </div>

                    ))}

                  </div>



                  {/* Details */}

                  <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap', marginBottom:'1rem', fontSize:'0.82rem', color:'#6b7280' }}>

                    {selected.estimatedHours && <span>⏱ {selected.estimatedHours}h estimated</span>}

                    {selected.estimatedStartDate && <span>�� Start: {fmtDate(selected.estimatedStartDate)}</span>}

                    {selected.validUntil && <span style={{ color: daysLeft(selected.validUntil) <= 1 ? '#ef4444' : '#6b7280' }}>

                      ⏳ Valid until {fmtDate(selected.validUntil)} ({daysLeft(selected.validUntil)}d left)

                    </span>}

                    <span>📨 Sent {fmtTime(selected.createdAt)}</span>

                    {selected.viewedByCustomer && <span style={{ color:'#10b981' }}>👁 Viewed {fmtTime(selected.viewedAt)}</span>}

                  </div>



                  {selected.notes && (

                    <div style={{ background:'#f9fafb', borderRadius:10, padding:'0.875rem 1rem', marginBottom:'1rem', fontSize:'0.875rem', color:'#374151', borderLeft:'3px solid #6366f1' }}>

                      <div style={{ fontSize:'0.7rem', color:'#9ca3af', fontWeight:600, marginBottom:'0.3rem' }}>YOUR NOTES</div>

                      {selected.notes}

                    </div>

                  )}



                  {selected.adminNote && (

                    <div style={{ background:'#f3e8ff', borderRadius:10, padding:'0.875rem 1rem', marginBottom:'1rem', fontSize:'0.875rem', color:'#7c3aed', borderLeft:'3px solid #9333ea' }}>

                      🛡️ Admin note: {selected.adminNote}

                    </div>

                  )}



                  {selected.flagReason && (

                    <div style={{ background:'#fef3c7', borderRadius:10, padding:'0.75rem 1rem', marginBottom:'1rem', fontSize:'0.82rem', color:'#92400e', borderLeft:'3px solid #f59e0b' }}>

                      ⚠️ Flagged: {selected.flagReason}

                    </div>

                  )}



                  {/* Worker actions on counter */}

                  {selected.status === 'negotiating' && selected.counterAmount && (

                    <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:10, padding:'1rem', marginBottom:'1rem' }}>

                      <div style={{ fontWeight:600, color:'#9a3412', marginBottom:'0.75rem', fontSize:'0.875rem' }}>

                        Customer countered with ₹{selected.counterAmount}

                      </div>

                      <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>

                        <button onClick={() => doAction('accept')} style={{ padding:'0.55rem 1.25rem', background:'#10b981', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'0.875rem' }}>✓ Accept ₹{selected.counterAmount}</button>

                        <button onClick={() => { setModal('worker-counter'); setForm({ counterAmount: selected.quotedAmount, note:'' }); }} style={{ padding:'0.55rem 1.25rem', background:'#f59e0b', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.875rem' }}>Counter Back</button>

                        <button onClick={() => doAction('reject')} style={{ padding:'0.55rem 1.25rem', background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.875rem' }}>Reject</button>

                      </div>

                    </div>

                  )}

                </div>



                {/* Unanswered questions */}

                {selected.questions?.filter(q => !q.answer).length > 0 && (

                  <div style={{ background:'white', borderRadius:16, padding:'1.25rem 1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:'1rem', borderLeft:'4px solid #6366f1' }}>

                    <div style={{ fontWeight:700, color:'#1f2937', marginBottom:'1rem', fontSize:'0.9rem' }}>Questions Awaiting Your Answer</div>

                    {selected.questions.filter(q => !q.answer).map((q, i) => (

                      <div key={i} style={{ marginBottom:'0.875rem' }}>

                        <div style={{ fontSize:'0.85rem', color:'#1f2937', fontWeight:600, marginBottom:'0.5rem' }}>❓ {q.question}</div>

                        <div style={{ display:'flex', gap:'0.5rem' }}>

                          <input placeholder="Your answer..." value={form['answer_' + q._id] || ''} onChange={e => setForm(f => ({ ...f, ['answer_' + q._id]: e.target.value }))}

                            style={{ ...inp, flex:1 }} />

                          <button onClick={() => doAction('answer', { questionId: q._id, answer: form['answer_' + q._id] })} disabled={!form['answer_' + q._id]?.trim()}

                            style={{ padding:'0.55rem 1rem', background:'#6366f1', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.82rem', flexShrink:0 }}>Answer</button>

                        </div>

                      </div>

                    ))}

                  </div>

                )}



                {/* All Q&A */}

                {selected.questions?.filter(q => q.answer).length > 0 && (

                  <div style={{ background:'white', borderRadius:16, padding:'1.25rem 1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:'1rem' }}>

                    <div style={{ fontWeight:700, color:'#1f2937', marginBottom:'1rem', fontSize:'0.9rem' }}>Answered Questions</div>

                    {selected.questions.filter(q => q.answer).map((q, i) => (

                      <div key={i} style={{ marginBottom:'0.75rem', paddingBottom:'0.75rem', borderBottom: i < selected.questions.filter(x => x.answer).length - 1 ? '1px solid #f3f4f6' : 'none' }}>

                        <div style={{ fontSize:'0.82rem', color:'#1f2937', fontWeight:600, marginBottom:'0.25rem' }}>❓ {q.question}</div>

                        <div style={{ fontSize:'0.8rem', color:'#374151', paddingLeft:'1rem', borderLeft:'2px solid #10b981' }}>💬 {q.answer}</div>

                      </div>

                    ))}

                  </div>

                )}



                {/* History */}

                {selected.history?.length > 0 && (

                  <div style={{ background:'white', borderRadius:16, padding:'1.25rem 1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>

                    <div style={{ fontWeight:700, color:'#1f2937', marginBottom:'1rem', fontSize:'0.9rem' }}>Negotiation History</div>

                    <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>

                      {selected.history.map((h, i) => (

                        <div key={i} style={{ display:'flex', gap:'0.75rem', alignItems:'flex-start', fontSize:'0.82rem' }}>

                          <span style={{ color:'#9ca3af', flexShrink:0, whiteSpace:'nowrap', fontSize:'0.7rem', marginTop:'0.1rem' }}>{fmtTime(h.at)}</span>

                          <span style={{ background:'#f3f4f6', color:'#374151', padding:'0.1rem 0.5rem', borderRadius:4, fontWeight:600, flexShrink:0, fontSize:'0.72rem' }}>{h.action}</span>

                          {h.amount && <span style={{ fontWeight:700, color:'#1f2937', flexShrink:0 }}>₹{h.amount}</span>}

                          {h.note && <span style={{ color:'#6b7280', fontStyle:'italic' }}>— {h.note}</span>}

                        </div>

                      ))}

                    </div>

                  </div>

                )}

              </div>

            </div>

          )}

        </div>

      </div>



      {/* Worker counter modal */}

      {modal === 'worker-counter' && (

        <Modal title="Counter Back" onClose={() => setModal(null)}>

          <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', padding:'0.875rem 1rem', borderRadius:10, marginBottom:'1.25rem', fontSize:'0.875rem', color:'#9a3412' }}>

            Customer offered: <strong>₹{selected.counterAmount}</strong>. Enter your revised amount.

          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

            <div><label style={lbl}>Your Revised Amount (₹) *</label>

              <input type="number" value={form.counterAmount || ''} onChange={e => setForm(f => ({ ...f, counterAmount: e.target.value }))} min="1" style={inp} /></div>

            <div><label style={lbl}>Note to Customer</label>

              <textarea value={form.note || ''} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={3} placeholder="Explain your revised price..." style={{ ...inp, resize:'vertical' }} /></div>

            <div style={{ display:'flex', gap:'0.75rem' }}>

              <button onClick={() => doAction('worker-counter', form)} disabled={submitting || !form.counterAmount} style={{ flex:1, padding:'0.75rem', background:'#f59e0b', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', opacity: submitting ? 0.7 : 1 }}>

                {submitting ? 'Sending...' : 'Send Counter'}

              </button>

              <button onClick={() => setModal(null)} style={{ flex:1, padding:'0.75rem', background:'#f3f4f6', color:'#6b7280', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer' }}>Cancel</button>

            </div>

          </div>

        </Modal>

      )}

    </div>

  );

}



/* ── Main Export ─────────────────────────────────────────────────────────── */

const QuotePage = () => {

  const { user } = useAuth();

  if (user?.role === 'worker') return <WorkerQuotes />;

  return <CustomerQuotes />;

};



export default QuotePage;

