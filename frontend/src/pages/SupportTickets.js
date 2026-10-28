import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import api from '../utils/api';

/* ── Constants ─────────────────────────────────────────────────────────────── */
const CATEGORIES = [
  { value: 'payment-issue',       label: 'Payment Issue' },
  { value: 'booking-issue',       label: 'Booking Issue' },
  { value: 'refund-issue',        label: 'Refund Issue' },
  { value: 'profile-account-issue', label: 'Profile / Account Issue' },
  { value: 'technical-issue',     label: 'Technical Issue' },
  { value: 'quote-issue',         label: 'Quote Issue' },
  { value: 'verification-issue',  label: 'Verification Issue' },
  { value: 'dispute-issue',       label: 'Dispute Issue' },
  { value: 'worker-issue',        label: 'Worker Issue' },
  { value: 'customer-issue',      label: 'Customer Issue' },
  { value: 'other',               label: 'Other' },
];

const PRIORITIES = [
  { value: 'low',    label: 'Low',    bg: '#dcfce7', color: '#16a34a' },
  { value: 'medium', label: 'Medium', bg: '#fef9c3', color: '#ca8a04' },
  { value: 'high',   label: 'High',   bg: '#fee2e2', color: '#dc2626' },
];

const STATUS_MAP = {
  'open':              { bg: '#fee2e2', color: '#dc2626',  label: 'Open' },
  'in-progress':       { bg: '#dbeafe', color: '#2563eb',  label: 'In Progress' },
  'waiting-for-user':  { bg: '#fef9c3', color: '#ca8a04',  label: 'Waiting for You' },
  'waiting-for-admin': { bg: '#e0f2fe', color: '#0369a1',  label: 'Waiting for Admin' },
  'resolved':          { bg: '#dcfce7', color: '#16a34a',  label: 'Resolved' },
  'closed':            { bg: '#f3f4f6', color: '#6b7280',  label: 'Closed' },
  'escalated':         { bg: '#f3e8ff', color: '#9333ea',  label: 'Escalated' },
};

const pColor = (p) => PRIORITIES.find(x => x.value === p) || PRIORITIES[1];
const sColor = (s) => STATUS_MAP[s] || STATUS_MAP['open'];

function fmtDate(d) {
  if (!d) return '';
  const date = new Date(d), now = new Date(), diff = now - date;
  if (diff < 60000)    return 'just now';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const Pill = ({ bg, color, children }) => (
  <span style={{ display:'inline-block', padding:'0.15rem 0.55rem', borderRadius:20, fontSize:'0.7rem', fontWeight:700, background:bg, color }}>{children}</span>
);

/* ── Main Component ─────────────────────────────────────────────────────────── */
export default function SupportTickets() {
  const { user } = useAuth();
  const navigate = useNavigate(); // eslint-disable-line

  const [tickets,       setTickets]       = useState([]);
  const [selected,      setSelected]      = useState(null);
  const [msgText,       setMsgText]       = useState('');
  const [sending,       setSending]       = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [showForm,      setShowForm]      = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [search,        setSearch]        = useState('');

  const [form, setForm] = useState({
    subject: '', category: 'other', description: '',
    priority: 'medium', bookingRef: '', screenshotUrl: '',
  });

  const chatEndRef = useRef(null);

  /* ── Data ─────────────────────────────────────────────────────────────── */
  const fetchTickets = useCallback(async () => {
    try {
      const { data } = await api.get('/tickets/my');
      setTickets(data);
    } catch { toast.error('Failed to load tickets'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const openTicket = useCallback(async (ticket) => {
    setShowForm(false);
    setLoadingTicket(true);
    setSelected(ticket);
    try {
      const { data } = await api.get(`/tickets/${ticket._id}`);
      setSelected(data);
      await api.patch(`/tickets/${ticket._id}/read`).catch(() => {});
      setTickets(prev => prev.map(t =>
        t._id === ticket._id
          ? { ...t, messages: (t.messages || []).map(m => ({ ...m, isRead: true })) }
          : t
      ));
    } catch { toast.error('Failed to load ticket'); }
    finally { setLoadingTicket(false); }
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [selected?.messages]);

  /* ── Actions ──────────────────────────────────────────────────────────── */
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!msgText.trim() || !selected) return;
    setSending(true);
    try {
      const { data } = await api.post(`/tickets/${selected._id}/messages`, { text: msgText.trim() });
      setSelected(data);
      setMsgText('');
      setTickets(prev => prev.map(t => t._id === data._id ? { ...t, status: data.status, updatedAt: data.updatedAt } : t));
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  const createTicket = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) {
      toast.error('Subject and description are required');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/tickets', form);
      setTickets(prev => [data, ...prev]);
      setForm({ subject: '', category: 'other', description: '', priority: 'medium', bookingRef: '', screenshotUrl: '' });
      setShowForm(false);
      toast.success('Ticket submitted');
      openTicket(data);
    } catch { toast.error('Failed to create ticket'); }
    finally { setSubmitting(false); }
  };

  /* ── Derived ──────────────────────────────────────────────────────────── */
  const filtered = tickets.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search && !t.subject?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const unreadCount = (t) =>
    (t.messages || []).filter(m => m.senderRole === 'admin' && !m.isRead && !m.isInternal).length;

  const openCount     = tickets.filter(t => t.status === 'open').length;
  const inProgCount   = tickets.filter(t => t.status === 'in-progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;
  const totalUnread   = tickets.reduce((s, t) => s + unreadCount(t), 0);
  const isClosed      = selected && ['resolved', 'closed'].includes(selected.status);

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', display:'flex', flexDirection:'column' }}>
      <Navbar />

      <div style={{ display:'flex', flex:1, overflow:'hidden', height:'calc(100vh - 64px)' }}>

        {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
        <div style={{ width:320, minWidth:260, background:'white', borderRight:'1px solid #e5e7eb', display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Header */}
          <div style={{ padding:'1rem', borderBottom:'1px solid #f3f4f6' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.75rem' }}>
              <div>
                <h2 style={{ margin:0, fontSize:'1rem', fontWeight:700, color:'#1f2937' }}>🎫 Support</h2>
                <div style={{ fontSize:'0.72rem', color:'#9ca3af', marginTop:'0.15rem' }}>
                  {openCount} open · {inProgCount} in progress · {resolvedCount} resolved
                  {totalUnread > 0 && <span style={{ color:'#ef4444', fontWeight:700 }}> · {totalUnread} unread</span>}
                </div>
              </div>
              <button onClick={() => { setShowForm(true); setSelected(null); }}
                style={{ background:'#6366f1', color:'white', border:'none', borderRadius:8, padding:'0.4rem 0.85rem', fontSize:'0.8rem', fontWeight:600, cursor:'pointer' }}>
                + New
              </button>
            </div>

            {/* Search */}
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets…"
              style={{ width:'100%', padding:'0.45rem 0.75rem', border:'1px solid #e5e7eb', borderRadius:8, fontSize:'0.82rem', outline:'none', boxSizing:'border-box', marginBottom:'0.5rem' }} />

            {/* Status filter */}
            <div style={{ display:'flex', gap:'0.3rem', flexWrap:'wrap' }}>
              {['all', 'open', 'in-progress', 'waiting-for-user', 'resolved', 'closed'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  style={{ padding:'0.2rem 0.6rem', borderRadius:20, fontSize:'0.7rem', fontWeight:600, cursor:'pointer', border:'none',
                    background: statusFilter === s ? '#6366f1' : '#f3f4f6',
                    color: statusFilter === s ? 'white' : '#6b7280' }}>
                  {s === 'all' ? 'All' : s === 'in-progress' ? 'In Progress' : s === 'waiting-for-user' ? 'Waiting' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket list */}
          <div style={{ flex:1, overflowY:'auto' }}>
            {loading ? (
              <div style={{ padding:'2rem', textAlign:'center', color:'#9ca3af', fontSize:'0.875rem' }}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding:'2.5rem 1.5rem', textAlign:'center', color:'#9ca3af' }}>
                <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>🎫</div>
                <p style={{ fontWeight:600, color:'#6b7280', margin:'0 0 0.25rem' }}>No tickets</p>
                <p style={{ fontSize:'0.8rem', margin:0 }}>Raise a ticket to get help from support.</p>
              </div>
            ) : filtered.map(t => {
              const uc = unreadCount(t);
              const sc = sColor(t.status);
              const pc = pColor(t.priority);
              const isActive = selected?._id === t._id;
              return (
                <div key={t._id} onClick={() => openTicket(t)}
                  style={{ padding:'0.875rem 1rem', borderBottom:'1px solid #f3f4f6', cursor:'pointer',
                    background: isActive ? '#eff6ff' : 'white',
                    borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent' }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'white'; }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'0.5rem' }}>
                    <p style={{ margin:0, fontSize:'0.875rem', fontWeight: uc > 0 ? 700 : 500, color:'#1f2937', lineHeight:1.3, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {t.subject}
                    </p>
                    {uc > 0 && (
                      <span style={{ background:'#ef4444', color:'white', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.6rem', fontWeight:700, flexShrink:0 }}>
                        {uc > 9 ? '9+' : uc}
                      </span>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:'0.3rem', marginTop:'0.35rem', flexWrap:'wrap', alignItems:'center' }}>
                    <Pill bg={sc.bg} color={sc.color}>{sc.label}</Pill>
                    <Pill bg={pc.bg} color={pc.color}>{pc.label}</Pill>
                  </div>
                  <p style={{ margin:'0.3rem 0 0', fontSize:'0.7rem', color:'#9ca3af' }}>{fmtDate(t.updatedAt || t.createdAt)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────────────────── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#f8fafc' }}>

          {/* NEW TICKET FORM */}
          {showForm && (
            <div style={{ flex:1, overflowY:'auto', padding:'2rem' }}>
              <div style={{ maxWidth:620, margin:'0 auto', background:'white', borderRadius:16, padding:'2rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
                  <h3 style={{ margin:0, fontSize:'1.1rem', fontWeight:700, color:'#1f2937' }}>New Support Ticket</h3>
                  <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', fontSize:'1.2rem', cursor:'pointer', color:'#9ca3af' }}>✕</button>
                </div>

                <form onSubmit={createTicket} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                  {/* Subject */}
                  <div>
                    <label style={lbl}>Subject *</label>
                    <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      placeholder="Brief description of your issue" required style={inp} />
                  </div>

                  {/* Category */}
                  <div>
                    <label style={lbl}>Category *</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inp}>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label style={lbl}>Priority</label>
                    <div style={{ display:'flex', gap:'0.5rem' }}>
                      {PRIORITIES.map(p => (
                        <button key={p.value} type="button" onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                          style={{ padding:'0.35rem 1rem', borderRadius:20, fontSize:'0.82rem', fontWeight:600, cursor:'pointer',
                            border: `1px solid ${form.priority === p.value ? p.color : '#d1d5db'}`,
                            background: form.priority === p.value ? p.bg : 'white',
                            color: form.priority === p.value ? p.color : '#6b7280' }}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label style={lbl}>Description *</label>
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Describe your issue in detail…" required rows={5}
                      style={{ ...inp, resize:'vertical', fontFamily:'inherit', minHeight:100 }} />
                  </div>

                  {/* Booking ref */}
                  <div>
                    <label style={lbl}>Booking Reference (optional)</label>
                    <input value={form.bookingRef} onChange={e => setForm(f => ({ ...f, bookingRef: e.target.value }))}
                      placeholder="e.g. BK-12345 or booking ID" style={inp} />
                  </div>

                  {/* Screenshot URL */}
                  <div>
                    <label style={lbl}>Screenshot URL (optional)</label>
                    <input value={form.screenshotUrl} onChange={e => setForm(f => ({ ...f, screenshotUrl: e.target.value }))}
                      placeholder="Paste image URL or upload link" style={inp} />
                  </div>

                  <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
                    <button type="button" onClick={() => setShowForm(false)}
                      style={{ padding:'0.6rem 1.25rem', borderRadius:8, border:'1px solid #d1d5db', background:'white', color:'#6b7280', fontWeight:600, cursor:'pointer', fontSize:'0.875rem' }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting}
                      style={{ padding:'0.6rem 1.5rem', borderRadius:8, border:'none', background:'#6366f1', color:'white', fontWeight:600, cursor: submitting ? 'not-allowed' : 'pointer', fontSize:'0.875rem', opacity: submitting ? 0.7 : 1 }}>
                      {submitting ? 'Submitting…' : 'Submit Ticket'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {!showForm && !selected && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#9ca3af', gap:'0.75rem' }}>
              <div style={{ fontSize:'3.5rem' }}>🎫</div>
              <p style={{ fontWeight:600, color:'#6b7280', fontSize:'1rem', margin:0 }}>Select a ticket to view the conversation</p>
              <p style={{ fontSize:'0.85rem', margin:0 }}>Or raise a new ticket to get help</p>
              <button onClick={() => setShowForm(true)}
                style={{ marginTop:'0.5rem', background:'#6366f1', color:'white', border:'none', borderRadius:8, padding:'0.6rem 1.5rem', fontWeight:600, cursor:'pointer', fontSize:'0.875rem' }}>
                + New Ticket
              </button>
            </div>
          )}

          {/* CHAT PANEL */}
          {!showForm && selected && (
            <>
              {/* Header */}
              <div style={{ padding:'1rem 1.5rem', background:'white', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'flex-start', gap:'0.75rem', flexWrap:'wrap' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' }}>
                    <h3 style={{ margin:0, fontSize:'1rem', fontWeight:700, color:'#1f2937', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {selected.subject}
                    </h3>
                    <span style={{ fontSize:'0.7rem', color:'#9ca3af' }}>#{selected._id?.slice(-6)}</span>
                  </div>
                  <div style={{ display:'flex', gap:'0.35rem', marginTop:'0.35rem', flexWrap:'wrap', alignItems:'center' }}>
                    <Pill bg={sColor(selected.status).bg} color={sColor(selected.status).color}>{sColor(selected.status).label}</Pill>
                    <Pill bg={pColor(selected.priority).bg} color={pColor(selected.priority).color}>{pColor(selected.priority).label}</Pill>
                    <Pill bg="#f3f4f6" color="#6b7280">{CATEGORIES.find(c => c.value === selected.category)?.label || selected.category}</Pill>
                    {selected.convertedTo && <Pill bg="#fef3c7" color="#92400e">→ {selected.convertedTo}</Pill>}
                  </div>
                  {selected.bookingRef && <div style={{ fontSize:'0.72rem', color:'#9ca3af', marginTop:'0.2rem' }}>Booking ref: {selected.bookingRef}</div>}
                </div>
                <div style={{ fontSize:'0.72rem', color:'#9ca3af', textAlign:'right', flexShrink:0 }}>
                  <div>{fmtDate(selected.createdAt)}</div>
                  {selected.assignedAdmin && <div style={{ marginTop:'0.15rem' }}>Assigned: {selected.assignedAdmin.name}</div>}
                </div>
              </div>

              {/* Description */}
              <div style={{ padding:'0.75rem 1.5rem', background:'#f9fafb', borderBottom:'1px solid #f3f4f6', fontSize:'0.82rem', color:'#6b7280', lineHeight:1.5 }}>
                {selected.description}
                {selected.screenshotUrl && (
                  <div style={{ marginTop:'0.5rem' }}>
                    <a href={selected.screenshotUrl} target="_blank" rel="noreferrer"
                      style={{ color:'#6366f1', fontSize:'0.78rem', fontWeight:600 }}>📎 View Screenshot</a>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div style={{ flex:1, overflowY:'auto', padding:'1.25rem 1.5rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                {loadingTicket ? (
                  <div style={{ textAlign:'center', color:'#9ca3af', marginTop:'2rem' }}>Loading…</div>
                ) : (selected.messages || []).filter(m => !m.isInternal).length === 0 ? (
                  <div style={{ textAlign:'center', color:'#9ca3af', marginTop:'2rem' }}>
                    <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>💬</div>
                    <p style={{ fontSize:'0.875rem' }}>No messages yet. Send a message to start the conversation.</p>
                  </div>
                ) : (selected.messages || []).filter(m => !m.isInternal).map((msg, i) => {
                  const isMe    = msg.sender?._id === user?.id || msg.sender?._id === user?._id || msg.sender === user?.id;
                  const isAdmin = msg.senderRole === 'admin';
                  return (
                    <div key={msg._id || i} style={{ display:'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap:'0.5rem', alignItems:'flex-end' }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, background: isAdmin ? '#6366f1' : '#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:700, color: isAdmin ? 'white' : '#6b7280' }}>
                        {isAdmin ? 'A' : (msg.sender?.name?.charAt(0) || 'U')}
                      </div>
                      <div style={{ maxWidth:'72%' }}>
                        <div style={{ padding:'0.6rem 0.875rem', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMe ? '#6366f1' : 'white', color: isMe ? 'white' : '#1f2937', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', fontSize:'0.875rem', lineHeight:1.5, border: isMe ? 'none' : '1px solid #e5e7eb' }}>
                          {msg.text}
                        </div>
                        <div style={{ fontSize:'0.65rem', color:'#9ca3af', marginTop:'0.2rem', textAlign: isMe ? 'right' : 'left' }}>
                          {isAdmin ? 'Support Team' : (msg.sender?.name || 'You')} · {fmtDate(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              {isClosed ? (
                <div style={{ padding:'1rem 1.5rem', background:'white', borderTop:'1px solid #e5e7eb', textAlign:'center', color:'#9ca3af', fontSize:'0.85rem' }}>
                  This ticket is {selected.status}.
                  {selected.status === 'resolved' && ' If your issue persists, raise a new ticket.'}
                </div>
              ) : (
                <form onSubmit={sendMessage} style={{ padding:'0.875rem 1.5rem', background:'white', borderTop:'1px solid #e5e7eb', display:'flex', gap:'0.75rem', alignItems:'flex-end' }}>
                  <textarea value={msgText} onChange={e => setMsgText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
                    placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
                    rows={2}
                    style={{ flex:1, padding:'0.6rem 0.875rem', border:'1px solid #d1d5db', borderRadius:10, fontSize:'0.875rem', outline:'none', resize:'none', fontFamily:'inherit', lineHeight:1.5 }} />
                  <button type="submit" disabled={sending || !msgText.trim()}
                    style={{ background:'#6366f1', color:'white', border:'none', borderRadius:10, padding:'0.6rem 1.25rem', fontWeight:600, cursor: sending || !msgText.trim() ? 'not-allowed' : 'pointer', fontSize:'0.875rem', opacity: sending || !msgText.trim() ? 0.6 : 1, flexShrink:0, height:42 }}>
                    {sending ? '…' : 'Send'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Shared style helpers ────────────────────────────────────────────────────── */
const lbl = { display:'block', fontSize:'0.82rem', fontWeight:600, color:'#374151', marginBottom:'0.35rem' };
const inp = { width:'100%', padding:'0.6rem 0.875rem', border:'1px solid #d1d5db', borderRadius:8, fontSize:'0.875rem', outline:'none', boxSizing:'border-box', background:'white' };
