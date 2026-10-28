import { useState, useEffect, useCallback } from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import { toast } from 'react-toastify';

import Navbar from '../components/Navbar';

import api from '../utils/api';



/* ── Constants ─────────────────────────────────────────────────────────── */

const STATUS_MAP = {

  'open':                 { bg:'#fee2e2', color:'#dc2626',  label:'Open',                icon:'🔴' },

  'under-review':         { bg:'#fef3c7', color:'#ca8a04',  label:'Under Review',        icon:'🔍' },

  'waiting-for-customer': { bg:'#fff7ed', color:'#c2410c',  label:'Waiting for You',     icon:'⏳' },

  'waiting-for-worker':   { bg:'#fff7ed', color:'#c2410c',  label:'Waiting for Worker',  icon:'⏳' },

  'evidence-requested':   { bg:'#ffedd5', color:'#ea580c',  label:'Evidence Requested',  icon:'📎' },

  'mediation-in-progress':{ bg:'#ede9fe', color:'#7c3aed',  label:'Mediation',           icon:'🤝' },

  'resolved-customer':    { bg:'#dcfce7', color:'#16a34a',  label:'Resolved — You Won',  icon:'✅' },

  'resolved-worker':      { bg:'#ccfbf1', color:'#0f766e',  label:'Resolved — Worker Won',icon:'✅' },

  'partial-settlement':   { bg:'#dbeafe', color:'#1d4ed8',  label:'Partial Settlement',  icon:'⚖️' },

  'closed':               { bg:'#f3f4f6', color:'#6b7280',  label:'Closed',              icon:'🔒' },

  'escalated':            { bg:'#f3e8ff', color:'#9333ea',  label:'Escalated',           icon:'🚨' },

  // legacy

  'mediation':            { bg:'#ede9fe', color:'#7c3aed',  label:'Mediation',           icon:'🤝' },

  'refund-review':        { bg:'#cffafe', color:'#0e7490',  label:'Refund Review',       icon:'💰' },

  'warning-issued':       { bg:'#fef9c3', color:'#854d0e',  label:'Warning Issued',      icon:'⚠️' },

  'penalty-applied':      { bg:'#fee2e2', color:'#7f1d1d',  label:'Penalty Applied',     icon:'🚫' },

  'reopened':             { bg:'#ffedd5', color:'#9a3412',  label:'Reopened',            icon:'🔄' },

};



const PRIORITY_MAP = {

  low:      { bg:'#f3f4f6', color:'#6b7280', label:'Low' },

  medium:   { bg:'#fef3c7', color:'#ca8a04', label:'Medium' },

  high:     { bg:'#fee2e2', color:'#dc2626', label:'High' },

  critical: { bg:'#fdf2f8', color:'#9d174d', label:'Critical' },

};



const ISSUE_TYPES = [

  { value:'service-not-completed',   label:'Service Not Completed' },

  { value:'poor-quality-work',       label:'Poor Quality Work' },

  { value:'overcharging',            label:'Overcharging' },

  { value:'worker-no-show',          label:'Worker No-Show' },

  { value:'property-damage',         label:'Property Damage' },

  { value:'unprofessional-behavior', label:'Unprofessional Behavior' },

  { value:'payment-dispute',         label:'Payment Dispute' },

  { value:'refund-request',          label:'Refund Request' },

  { value:'fraud',                   label:'Fraud' },

  { value:'other',                   label:'Other' },

];



const sc  = (s) => STATUS_MAP[s]   || STATUS_MAP['open'];

const pc  = (p) => PRIORITY_MAP[p] || PRIORITY_MAP['medium'];

const fmt = (d) => {

  if (!d) return '';

  const date = new Date(d), now = new Date(), diff = now - date;

  if (diff < 60000)    return 'just now';

  if (diff < 3600000)  return `${Math.floor(diff/60000)}m ago`;

  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;

  return date.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });

};

const fmtFull = (d) => d ? new Date(d).toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'; // eslint-disable-line



const Pill = ({ bg, color, children }) => (

  <span style={{ display:'inline-flex', alignItems:'center', gap:'0.2rem', background:bg, color, padding:'0.18rem 0.6rem', borderRadius:20, fontSize:'0.72rem', fontWeight:700, whiteSpace:'nowrap' }}>{children}</span>

);



/* ── Timeline component ─────────────────────────────────────────────────── */

const Timeline = ({ activity, currentUserId }) => {

  if (!activity?.length) return null;

  return (

    <div style={{ position:'relative', paddingLeft:'1.75rem' }}>

      <div style={{ position:'absolute', left:8, top:6, bottom:6, width:2, background:'#e5e7eb', borderRadius:2 }} />

      {[...activity].reverse().map((ev, i) => {

        const isAdmin    = ev.byRole === 'admin';

        const isInternal = ev.isInternal;

        if (isInternal) return null; // hide internal notes from users

        const dotColor = isAdmin ? '#6366f1' : '#10b981';

        return (

          <div key={i} style={{ position:'relative', marginBottom: i < activity.length - 1 ? '1.25rem' : 0 }}>

            <div style={{ position:'absolute', left:-22, top:5, width:12, height:12, borderRadius:'50%', background:dotColor, border:'2px solid white', boxShadow:`0 0 0 2px ${dotColor}` }} />

            <div style={{ background: isAdmin ? '#f5f3ff' : '#f9fafb', borderRadius:10, padding:'0.75rem 1rem', borderLeft:`3px solid ${dotColor}` }}>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'0.5rem', marginBottom:'0.2rem' }}>

                <span style={{ fontSize:'0.82rem', fontWeight:700, color:'#1f2937' }}>{ev.action}</span>

                <span style={{ fontSize:'0.68rem', color:'#9ca3af', flexShrink:0 }}>{fmt(ev.at)}</span>

              </div>

              {ev.by?.name && <div style={{ fontSize:'0.72rem', color:'#9ca3af', marginBottom: ev.note ? '0.25rem' : 0 }}>by {ev.by.name} ({ev.byRole})</div>}

              {ev.note && <p style={{ margin:0, fontSize:'0.8rem', color:'#4b5563', lineHeight:1.5 }}>{ev.note}</p>}

            </div>

          </div>

        );

      })}

    </div>

  );

};



/* ── Main DisputePage ───────────────────────────────────────────────────── */

export default function DisputePage() {

  const { user } = useAuth();

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();



  const [disputes,     setDisputes]     = useState([]);

  const [selected,     setSelected]     = useState(null);

  const [loading,      setLoading]      = useState(true);

  const [statusFilter, setStatusFilter] = useState('all');

  const [showForm,     setShowForm]     = useState(false);

  const [submitting,   setSubmitting]   = useState(false);

  const [bookings,     setBookings]     = useState([]);

  const [evidenceText, setEvidenceText] = useState('');

  const [submittingEv, setSubmittingEv] = useState(false);



  const [form, setForm] = useState({ bookingId:'', issueType:'other', description:'' });



  const fetchDisputes = useCallback(async () => {

    try {

      const { data } = await api.get('/disputes/my');

      setDisputes(data);

      await api.patch('/disputes/seen').catch(() => {});

    } catch { toast.error('Failed to load disputes'); }

    finally { setLoading(false); }

  }, []);



  const fetchBookings = useCallback(async () => {

    try {

      const { data } = await api.get('/bookings');

      setBookings((data || []).filter(b => ['completed','disputed'].includes(b.status)));

    } catch {}

  }, []);



  useEffect(() => { fetchDisputes(); fetchBookings(); }, [fetchDisputes, fetchBookings]);



  useEffect(() => {

    const id = searchParams.get('id') || searchParams.get('bookingId');

    if (id && disputes.length > 0) {

      const found = disputes.find(d => d._id === id || d.booking?._id === id || d.booking === id);

      if (found) { setSelected(found); setShowForm(false); }

      else if (searchParams.get('bookingId')) { setShowForm(true); setForm(f => ({ ...f, bookingId: id })); }

    }

  }, [searchParams, disputes]);



  const createDispute = async (e) => {

    e.preventDefault();

    if (!form.bookingId) { toast.error('Please select a booking'); return; }

    if (form.description.trim().length < 20) { toast.error('Description must be at least 20 characters'); return; }

    setSubmitting(true);

    try {

      const { data } = await api.post('/disputes', { bookingId: form.bookingId, reason: form.issueType, description: form.description.trim(), issueType: form.issueType });

      setDisputes(prev => [data, ...prev]);

      setForm({ bookingId:'', issueType:'other', description:'' });

      setShowForm(false);

      setSelected(data);

      toast.success('Dispute raised successfully');

    } catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }

    finally { setSubmitting(false); }

  };



  const submitEvidence = async () => {

    if (!evidenceText.trim()) { toast.error('Please enter your evidence'); return; }

    setSubmittingEv(true);

    try {

      const { data } = await api.patch(`/disputes/${selected._id}/evidence`, { evidenceNote: evidenceText.trim() });

      setSelected(data);

      setDisputes(prev => prev.map(d => d._id === data._id ? data : d));

      setEvidenceText('');

      toast.success('Evidence submitted');

    } catch { toast.error('Failed to submit evidence'); }

    finally { setSubmittingEv(false); }

  };



  const filtered = statusFilter === 'all' ? disputes : disputes.filter(d => d.status === statusFilter);

  const isResolved = (s) => ['resolved-customer','resolved-worker','closed','partial-settlement'].includes(s);

  const needsEvidence = selected && ['evidence-requested','waiting-for-customer'].includes(selected.status) && selected.raisedBy?._id === (user?._id || user?.id);

  const needsWorkerEvidence = selected && ['waiting-for-worker'].includes(selected.status) && selected.against?._id === (user?._id || user?.id);



  return (

    <div style={{ minHeight:'100vh', background:'#f8fafc', display:'flex', flexDirection:'column' }}>

      <Navbar />

      <div style={{ display:'flex', flex:1, overflow:'hidden', height:'calc(100vh - 64px)' }}>



        {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}

        <div style={{ width:300, minWidth:260, background:'white', borderRight:'1px solid #e5e7eb', display:'flex', flexDirection:'column', overflow:'hidden' }}>

          <div style={{ padding:'1rem', borderBottom:'1px solid #f3f4f6' }}>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.75rem' }}>

              <div>

                <h2 style={{ margin:0, fontSize:'1rem', fontWeight:700, color:'#1f2937' }}>⚖️ Disputes</h2>

                <div style={{ fontSize:'0.72rem', color:'#9ca3af', marginTop:'0.1rem' }}>{disputes.length} total</div>

              </div>

              <button onClick={() => { setShowForm(true); setSelected(null); }}

                style={{ background:'#6366f1', color:'white', border:'none', borderRadius:8, padding:'0.4rem 0.85rem', fontSize:'0.8rem', fontWeight:600, cursor:'pointer' }}>

                + Raise

              </button>

            </div>

            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}

              style={{ width:'100%', padding:'0.45rem 0.75rem', border:'1px solid #e5e7eb', borderRadius:8, fontSize:'0.8rem', outline:'none', background:'white' }}>

              <option value="all">All Statuses</option>

              {Object.entries(STATUS_MAP).filter(([k]) => !['mediation','refund-review','warning-issued','penalty-applied','reopened'].includes(k)).map(([k,v]) => (

                <option key={k} value={k}>{v.icon} {v.label}</option>

              ))}

            </select>

          </div>



          <div style={{ flex:1, overflowY:'auto' }}>

            {loading ? (

              <div style={{ padding:'2rem', textAlign:'center', color:'#9ca3af', fontSize:'0.875rem' }}>Loading...</div>

            ) : filtered.length === 0 ? (

              <div style={{ padding:'2.5rem 1.5rem', textAlign:'center', color:'#9ca3af' }}>

                <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>⚖️</div>

                <p style={{ fontWeight:600, color:'#6b7280', margin:'0 0 0.25rem' }}>No disputes</p>

                <p style={{ fontSize:'0.8rem', margin:0 }}>Raise a dispute for a completed booking.</p>

              </div>

            ) : filtered.map(d => {

              const s = sc(d.status);

              const p = pc(d.priority); // eslint-disable-line

              const isActive = selected?._id === d._id;

              const needsAction = ['evidence-requested','waiting-for-customer','waiting-for-worker'].includes(d.status);

              return (

                <div key={d._id} onClick={() => { setShowForm(false); setSelected(d); setEvidenceText(''); }}

                  style={{ padding:'0.875rem 1rem', borderBottom:'1px solid #f3f4f6', cursor:'pointer', background: isActive ? '#eff6ff' : 'white', borderLeft: isActive ? '3px solid #6366f1' : needsAction ? '3px solid #f59e0b' : '3px solid transparent' }}

                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f9fafb'; }}

                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'white'; }}>

                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'0.4rem', marginBottom:'0.3rem' }}>

                    <Pill bg={s.bg} color={s.color}>{s.icon} {s.label}</Pill>

                    <span style={{ fontSize:'0.68rem', color:'#9ca3af' }}>{fmt(d.updatedAt || d.createdAt)}</span>

                  </div>

                  <p style={{ margin:'0 0 0.2rem', fontSize:'0.85rem', fontWeight:600, color:'#1f2937', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>

                    {ISSUE_TYPES.find(t => t.value === d.issueType)?.label || d.reason?.replace(/-/g,' ')}

                  </p>

                  <p style={{ margin:0, fontSize:'0.75rem', color:'#6b7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>

                    {d.booking?.service || 'Booking'}

                  </p>

                  {needsAction && <div style={{ marginTop:'0.3rem', fontSize:'0.68rem', color:'#ca8a04', fontWeight:700 }}>⚠️ Action required</div>}

                </div>

              );

            })}

          </div>

        </div>



        {/* ── RIGHT PANEL ─────────────────────────────────────────────────── */}

        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#f8fafc' }}>



          {/* RAISE FORM */}

          {showForm && (

            <div style={{ flex:1, overflowY:'auto', padding:'2rem' }}>

              <div style={{ maxWidth:600, margin:'0 auto', background:'white', borderRadius:16, padding:'2rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>

                  <h3 style={{ margin:0, fontWeight:700, color:'#1f2937', fontSize:'1.1rem' }}>Raise a Dispute</h3>

                  <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', fontSize:'1.2rem', cursor:'pointer', color:'#9ca3af' }}>✕</button>

                </div>

                <form onSubmit={createDispute} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

                  <div>

                    <label style={{ display:'block', fontSize:'0.82rem', fontWeight:600, color:'#374151', marginBottom:'0.35rem' }}>Select Booking *</label>

                    <select value={form.bookingId} onChange={e => setForm(f => ({ ...f, bookingId: e.target.value }))} required

                      style={{ width:'100%', padding:'0.65rem 0.875rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.875rem', outline:'none', background:'white', boxSizing:'border-box' }}>

                      <option value="">-- Select a completed booking --</option>

                      {bookings.map(b => <option key={b._id} value={b._id}>{b.service} — {new Date(b.scheduledDate||b.createdAt).toLocaleDateString('en-IN')} — ₹{b.amount}</option>)}

                    </select>

                    {bookings.length === 0 && <p style={{ margin:'0.3rem 0 0', fontSize:'0.75rem', color:'#9ca3af' }}>No completed bookings found.</p>}

                  </div>

                  <div>

                    <label style={{ display:'block', fontSize:'0.82rem', fontWeight:600, color:'#374151', marginBottom:'0.35rem' }}>Issue Type *</label>

                    <select value={form.issueType} onChange={e => setForm(f => ({ ...f, issueType: e.target.value }))}

                      style={{ width:'100%', padding:'0.65rem 0.875rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.875rem', outline:'none', background:'white', boxSizing:'border-box' }}>

                      {ISSUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}

                    </select>

                  </div>

                  <div>

                    <label style={{ display:'block', fontSize:'0.82rem', fontWeight:600, color:'#374151', marginBottom:'0.35rem' }}>

                      Description * <span style={{ fontWeight:400, color: form.description.length < 20 ? '#ef4444' : '#9ca3af' }}>({form.description.length}/min 20)</span>

                    </label>

                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}

                      placeholder="Describe the issue in detail — what happened, when, amounts involved..." rows={5}

                      style={{ width:'100%', padding:'0.65rem 0.875rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.875rem', outline:'none', resize:'vertical', fontFamily:'inherit', lineHeight:1.5, boxSizing:'border-box' }} />

                  </div>

                  <div style={{ background:'#fef3c7', borderRadius:8, padding:'0.75rem 1rem', fontSize:'0.8rem', color:'#92400e' }}>

                    ⚠️ Disputes are reviewed by our team. Provide accurate information to help resolve faster.

                  </div>

                  <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>

                    <button type="button" onClick={() => setShowForm(false)} style={{ padding:'0.65rem 1.25rem', borderRadius:8, border:'1px solid #d1d5db', background:'white', color:'#6b7280', fontWeight:600, cursor:'pointer', fontSize:'0.875rem' }}>Cancel</button>

                    <button type="submit" disabled={submitting} style={{ padding:'0.65rem 1.5rem', borderRadius:8, border:'none', background:'#6366f1', color:'white', fontWeight:600, cursor:submitting?'not-allowed':'pointer', fontSize:'0.875rem', opacity:submitting?0.7:1 }}>

                      {submitting ? 'Submitting...' : 'Submit Dispute'}

                    </button>

                  </div>

                </form>

              </div>

            </div>

          )}



          {/* EMPTY STATE */}

          {!showForm && !selected && (

            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#9ca3af', gap:'0.75rem' }}>

              <div style={{ fontSize:'3.5rem' }}>⚖️</div>

              <p style={{ fontWeight:600, color:'#6b7280', fontSize:'1rem', margin:0 }}>Select a dispute to view details</p>

              <p style={{ fontSize:'0.85rem', margin:0 }}>Or raise a new dispute for a completed booking</p>

              <button onClick={() => setShowForm(true)} style={{ marginTop:'0.5rem', background:'#6366f1', color:'white', border:'none', borderRadius:8, padding:'0.6rem 1.5rem', fontWeight:600, cursor:'pointer', fontSize:'0.875rem' }}>+ Raise Dispute</button>

            </div>

          )}



          {/* DISPUTE DETAIL */}

          {!showForm && selected && (

            <div style={{ flex:1, overflowY:'auto', padding:'1.5rem' }}>

              <div style={{ maxWidth:760, margin:'0 auto', display:'flex', flexDirection:'column', gap:'1.25rem' }}>



                {/* Header */}

                <div style={{ background:'white', borderRadius:14, padding:'1.25rem 1.5rem', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', borderTop:`4px solid ${sc(selected.status).color}` }}>

                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem', marginBottom:'0.875rem' }}>

                    <div>

                      <h3 style={{ margin:'0 0 0.4rem', fontSize:'1.05rem', fontWeight:800, color:'#1f2937' }}>

                        {ISSUE_TYPES.find(t => t.value === selected.issueType)?.label || selected.reason?.replace(/-/g,' ')}

                      </h3>

                      <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', alignItems:'center' }}>

                        <Pill bg={sc(selected.status).bg} color={sc(selected.status).color}>{sc(selected.status).icon} {sc(selected.status).label}</Pill>

                        {selected.priority && <Pill bg={pc(selected.priority).bg} color={pc(selected.priority).color}>{pc(selected.priority).label} Priority</Pill>}

                      </div>

                    </div>

                    <div style={{ textAlign:'right', fontSize:'0.8rem', color:'#6b7280' }}>

                      <div style={{ fontWeight:700, color:'#1f2937', fontSize:'0.9rem' }}>{selected.booking?.service || '—'}</div>

                      {selected.booking?.amount && <div>₹{selected.booking.amount}</div>}

                      <div style={{ color:'#9ca3af', marginTop:'0.15rem', fontFamily:'monospace', fontSize:'0.72rem' }}>#{selected._id?.slice(-8)}</div>

                      <div style={{ color:'#9ca3af', fontSize:'0.72rem' }}>Raised {fmt(selected.createdAt)}</div>

                    </div>

                  </div>



                  {/* Parties */}

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>

                    {[

                      { label:'Raised By', user: selected.raisedBy, badge:'#dbeafe', badgeColor:'#1d4ed8' },

                      { label:'Against',   user: selected.against,  badge:'#fef3c7', badgeColor:'#92400e' },

                    ].map((p, i) => (

                      <div key={i} style={{ background:'#f9fafb', borderRadius:10, padding:'0.75rem 1rem' }}>

                        <div style={{ fontSize:'0.65rem', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'0.35rem' }}>{p.label}</div>

                        <div style={{ fontWeight:700, color:'#1f2937', fontSize:'0.875rem', marginBottom:'0.2rem' }}>{p.user?.name || '—'}</div>

                        <Pill bg={p.badge} color={p.badgeColor}>{p.user?.role || '—'}</Pill>

                      </div>

                    ))}

                  </div>

                </div>



                {/* Description */}

                <div style={{ background:'white', borderRadius:14, padding:'1.25rem 1.5rem', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>

                  <h4 style={{ margin:'0 0 0.75rem', fontSize:'0.875rem', fontWeight:700, color:'#374151' }}>Issue Description</h4>

                  <p style={{ margin:0, fontSize:'0.875rem', color:'#4b5563', lineHeight:1.7 }}>{selected.description}</p>

                </div>



                {/* Evidence section */}

                {(selected.evidenceNote || selected.evidenceByWorker || needsEvidence || needsWorkerEvidence) && (

                  <div style={{ background:'white', borderRadius:14, padding:'1.25rem 1.5rem', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>

                    <h4 style={{ margin:'0 0 0.875rem', fontSize:'0.875rem', fontWeight:700, color:'#374151' }}>Evidence</h4>

                    {selected.evidenceNote && (

                      <div style={{ background:'#f0f9ff', borderRadius:8, padding:'0.875rem', marginBottom:'0.75rem', fontSize:'0.875rem', color:'#0369a1', borderLeft:'3px solid #0ea5e9' }}>

                        <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#0369a1', marginBottom:'0.3rem', textTransform:'uppercase' }}>Customer Evidence</div>

                        {selected.evidenceNote}

                      </div>

                    )}

                    {selected.evidenceByWorker && (

                      <div style={{ background:'#f0fdf4', borderRadius:8, padding:'0.875rem', marginBottom:'0.75rem', fontSize:'0.875rem', color:'#166534', borderLeft:'3px solid #10b981' }}>

                        <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#166534', marginBottom:'0.3rem', textTransform:'uppercase' }}>Worker Evidence</div>

                        {selected.evidenceByWorker}

                      </div>

                    )}

                    {(needsEvidence || needsWorkerEvidence) && (

                      <div>

                        <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:8, padding:'0.75rem', marginBottom:'0.875rem', fontSize:'0.82rem', color:'#c2410c' }}>

                          ⚠️ Evidence has been requested. Please provide supporting details below.

                        </div>

                        <textarea value={evidenceText} onChange={e => setEvidenceText(e.target.value)}

                          placeholder="Describe your evidence — dates, amounts, screenshots, communications..." rows={4}

                          style={{ width:'100%', padding:'0.65rem 0.875rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.875rem', outline:'none', resize:'vertical', fontFamily:'inherit', lineHeight:1.5, boxSizing:'border-box', marginBottom:'0.75rem' }} />

                        <button onClick={submitEvidence} disabled={submittingEv || !evidenceText.trim()}

                          style={{ padding:'0.6rem 1.5rem', borderRadius:8, border:'none', background:'#6366f1', color:'white', fontWeight:600, cursor:submittingEv||!evidenceText.trim()?'not-allowed':'pointer', fontSize:'0.875rem', opacity:submittingEv||!evidenceText.trim()?0.6:1 }}>

                          {submittingEv ? 'Submitting...' : 'Submit Evidence'}

                        </button>

                      </div>

                    )}

                  </div>

                )}



                {/* Resolution */}

                {isResolved(selected.status) && (

                  <div style={{ background:'white', borderRadius:14, padding:'1.25rem 1.5rem', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', borderTop:`3px solid ${sc(selected.status).color}` }}>

                    <h4 style={{ margin:'0 0 0.875rem', fontSize:'0.875rem', fontWeight:700, color:'#374151' }}>Resolution</h4>

                    {selected.resolutionNote && <p style={{ margin:'0 0 1rem', fontSize:'0.875rem', color:'#4b5563', lineHeight:1.6 }}>{selected.resolutionNote}</p>}

                    <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>

                      {selected.refundAmount > 0 && <div style={{ background:'#dcfce7', borderRadius:10, padding:'0.75rem 1rem' }}><div style={{ fontSize:'0.65rem', color:'#16a34a', fontWeight:700, textTransform:'uppercase', marginBottom:'0.2rem' }}>Refund</div><div style={{ fontSize:'1.25rem', fontWeight:800, color:'#16a34a' }}>₹{selected.refundAmount}</div></div>}

                      {selected.penaltyAmount > 0 && <div style={{ background:'#fee2e2', borderRadius:10, padding:'0.75rem 1rem' }}><div style={{ fontSize:'0.65rem', color:'#dc2626', fontWeight:700, textTransform:'uppercase', marginBottom:'0.2rem' }}>Penalty</div><div style={{ fontSize:'1.25rem', fontWeight:800, color:'#dc2626' }}>₹{selected.penaltyAmount}</div></div>}

                      {selected.settlementAmount > 0 && <div style={{ background:'#dbeafe', borderRadius:10, padding:'0.75rem 1rem' }}><div style={{ fontSize:'0.65rem', color:'#1d4ed8', fontWeight:700, textTransform:'uppercase', marginBottom:'0.2rem' }}>Settlement</div><div style={{ fontSize:'1.25rem', fontWeight:800, color:'#1d4ed8' }}>₹{selected.settlementAmount}</div></div>}

                    </div>

                    {selected.warningNote && <div style={{ marginTop:'0.875rem', background:'#fef9c3', borderRadius:8, padding:'0.75rem', fontSize:'0.82rem', color:'#854d0e' }}>⚠️ {selected.warningNote}</div>}

                  </div>

                )}



                {/* Activity timeline */}

                <div style={{ background:'white', borderRadius:14, padding:'1.25rem 1.5rem', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>

                  <h4 style={{ margin:'0 0 1rem', fontSize:'0.875rem', fontWeight:700, color:'#374151' }}>Activity Timeline</h4>

                  {selected.activity?.length > 0

                    ? <Timeline activity={selected.activity} currentUserId={user?._id || user?.id} />

                    : <p style={{ margin:0, fontSize:'0.85rem', color:'#9ca3af' }}>No activity yet.</p>}

                </div>



                {/* Quick actions */}

                <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>

                  <button onClick={() => navigate(`/messages`)} style={{ padding:'0.55rem 1.1rem', background:'#ede9fe', color:'#6366f1', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.82rem' }}>💬 Message Admin</button>

                  <button onClick={() => navigate('/support')} style={{ padding:'0.55rem 1.1rem', background:'#f3f4f6', color:'#374151', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.82rem' }}>🎫 Support Ticket</button>

                </div>

              </div>

            </div>

          )}

        </div>

      </div>

    </div>

  );

}



// AdminDisputePanel — exported for use in AdminDashboard

export { STATUS_MAP as DISPUTE_STATUS_MAP, PRIORITY_MAP as DISPUTE_PRIORITY_MAP, ISSUE_TYPES as DISPUTE_ISSUE_TYPES };

