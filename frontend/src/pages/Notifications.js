import { useState, useEffect, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import { toast } from 'react-toastify';

import Navbar from '../components/Navbar';

import api from '../utils/api';



/* ── Type config ────────────────────────────────────────────────────────── */

const TYPE_CONFIG = {

  booking:        { icon:'📋', label:'Booking',        color:'#6366f1', bg:'#ede9fe' },

  payment:        { icon:'💰', label:'Payment',        color:'#10b981', bg:'#dcfce7' },

  quote:          { icon:'🏷️', label:'Quote',          color:'#f59e0b', bg:'#fef3c7' },

  dispute:        { icon:'⚖️', label:'Dispute',        color:'#ef4444', bg:'#fee2e2' },

  message:        { icon:'💬', label:'Message',        color:'#0ea5e9', bg:'#e0f2fe' },

  ticket:         { icon:'🎫', label:'Support',        color:'#8b5cf6', bg:'#f3e8ff' },

  verification:   { icon:'✅', label:'Verification',   color:'#059669', bg:'#d1fae5' },

  review:         { icon:'⭐', label:'Review',         color:'#f59e0b', bg:'#fef9c3' },

  payout:         { icon:'💳', label:'Payout',         color:'#10b981', bg:'#dcfce7' },

  'change-request':{ icon:'📝', label:'Change Request',color:'#6366f1', bg:'#ede9fe' },

  announcement:   { icon:'📢', label:'Announcement',  color:'#dc2626', bg:'#fee2e2' },

  system:         { icon:'🔔', label:'System',         color:'#6b7280', bg:'#f3f4f6' },

};



const ALL_TYPES = ['all', ...Object.keys(TYPE_CONFIG)];



const getActionUrl = (n) => {

  if (n.actionUrl) return n.actionUrl;

  switch (n.type) {

    case 'booking':        return '/bookings';

    case 'payment':        return '/bookings';

    case 'quote':          return '/quotes';

    case 'dispute':        return '/disputes';

    case 'message':        return n.relatedId ? `/messages/${n.relatedId}` : '/messages';

    case 'ticket':         return '/support';

    case 'verification':   return '/profile';

    case 'review':         return '/bookings';

    case 'payout':         return '/earnings';

    case 'change-request': return '/worker-requests';

    default:               return null;

  }

};



function fmtDate(d) {

  if (!d) return '';

  const date = new Date(d), now = new Date(), diff = now - date;

  if (diff < 60000)    return 'just now';

  if (diff < 3600000)  return `${Math.floor(diff/60000)}m ago`;

  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;

  if (diff < 604800000)return `${Math.floor(diff/86400000)}d ago`;

  return date.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });

}



/* ── Notification item ──────────────────────────────────────────────────── */

const NotifItem = ({ n, onRead, onDelete, onNavigate }) => {

  const tc = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;

  return (

    <div

      style={{

        display:'flex', alignItems:'flex-start', gap:'0.875rem',

        padding:'1rem 1.25rem', borderBottom:'1px solid #f3f4f6',

        background: n.isRead ? 'white' : '#f5f3ff',

        borderLeft: n.isRead ? '3px solid transparent' : '3px solid #6366f1',

        cursor: getActionUrl(n) ? 'pointer' : 'default',

        transition:'background 0.15s',

      }}

      onClick={() => { if (!n.isRead) onRead(n._id); if (getActionUrl(n)) onNavigate(n); }}

      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}

      onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'white' : '#f5f3ff'}

    >

      {/* Icon */}

      <div style={{ width:38, height:38, borderRadius:10, background:tc.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0, marginTop:'0.1rem' }}>

        {tc.icon}

      </div>



      {/* Content */}

      <div style={{ flex:1, minWidth:0 }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'0.5rem', marginBottom:'0.2rem' }}>

          <span style={{ fontWeight: n.isRead ? 500 : 700, color:'#1f2937', fontSize:'0.875rem', lineHeight:1.3 }}>{n.title}</span>

          <span style={{ fontSize:'0.68rem', color:'#9ca3af', flexShrink:0, marginTop:'0.1rem' }}>{fmtDate(n.createdAt)}</span>

        </div>

        <p style={{ margin:0, fontSize:'0.8rem', color:'#6b7280', lineHeight:1.5 }}>{n.message}</p>

        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginTop:'0.4rem' }}>

          <span style={{ background:tc.bg, color:tc.color, padding:'0.1rem 0.5rem', borderRadius:50, fontSize:'0.65rem', fontWeight:700 }}>{tc.label}</span>

          {!n.isRead && <span style={{ background:'#6366f1', color:'white', padding:'0.1rem 0.5rem', borderRadius:50, fontSize:'0.62rem', fontWeight:700 }}>NEW</span>}

          {getActionUrl(n) && <span style={{ fontSize:'0.68rem', color:'#6366f1', fontWeight:600 }}>View →</span>}

        </div>

      </div>



      {/* Delete */}

      <button

        onClick={e => { e.stopPropagation(); onDelete(n._id); }}

        style={{ background:'none', border:'none', color:'#d1d5db', cursor:'pointer', fontSize:'0.9rem', padding:'0.2rem', flexShrink:0, borderRadius:4, lineHeight:1 }}

        onMouseEnter={e => e.currentTarget.style.color='#ef4444'}

        onMouseLeave={e => e.currentTarget.style.color='#d1d5db'}

        title="Delete"

      >✕</button>

    </div>

  );

};



/* ── Main Notifications Page ────────────────────────────────────────────── */

export default function Notifications() {

  const { user } = useAuth();

  const navigate = useNavigate();



  const [notifications, setNotifications] = useState([]);

  const [total,         setTotal]         = useState(0);

  const [unreadCount,   setUnreadCount]   = useState(0);

  const [loading,       setLoading]       = useState(true);

  const [typeFilter,    setTypeFilter]    = useState('all');

  const [readFilter,    setReadFilter]    = useState('all'); // 'all' | 'unread' | 'read'

  const [page,          setPage]          = useState(0);

  const [submitting,    setSubmitting]    = useState(false);



  // Admin announcement form

  const [showAnnounce,  setShowAnnounce]  = useState(false);

  const [announce,      setAnnounce]      = useState({ title:'', message:'', targetRole:'all' });



  const PER_PAGE = 20;



  const fetchNotifications = useCallback(async (p = 0, type = typeFilter) => {

    setLoading(true);

    try {

      const params = new URLSearchParams({ limit: PER_PAGE, skip: p * PER_PAGE });

      if (type !== 'all') params.append('type', type);

      const { data } = await api.get(`/notifications?${params}`);

      setNotifications(data.notifications || []);

      setTotal(data.total || 0);

      setUnreadCount(data.unreadCount || 0);

    } catch { toast.error('Failed to load notifications'); }

    finally { setLoading(false); }

  }, [typeFilter]);



  useEffect(() => { fetchNotifications(0, typeFilter); setPage(0); }, [typeFilter]); // eslint-disable-line



  const handleRead = async (id) => {

    try {

      await api.patch(`/notifications/${id}/read`);

      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));

      setUnreadCount(c => Math.max(0, c - 1));

    } catch {}

  };



  const handleDelete = async (id) => {

    try {

      await api.delete(`/notifications/${id}`);

      setNotifications(prev => prev.filter(n => n._id !== id));

      setTotal(c => c - 1);

    } catch { toast.error('Failed'); }

  };



  const handleMarkAllRead = async () => {

    try {

      await api.patch('/notifications/read-all', { type: typeFilter });

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

      setUnreadCount(0);

      toast.success('All marked as read');

    } catch { toast.error('Failed'); }

  };



  const handleDeleteAll = async () => {

    if (!window.confirm('Delete all notifications?')) return;

    try {

      await api.delete(`/notifications/all${typeFilter !== 'all' ? `?type=${typeFilter}` : ''}`);

      setNotifications([]);

      setTotal(0);

      toast.success('Cleared');

    } catch { toast.error('Failed'); }

  };



  const handleNavigate = async (n) => {

    if (!n.isRead) await handleRead(n._id);

    const url = getActionUrl(n);

    if (url) navigate(url);

  };



  const sendAnnouncement = async (e) => {

    e.preventDefault();

    setSubmitting(true);

    try {

      const { data } = await api.post('/notifications/announcement', announce);

      toast.success(`Announcement sent to ${data.sent} users`);

      setShowAnnounce(false);

      setAnnounce({ title:'', message:'', targetRole:'all' });

    } catch { toast.error('Failed'); }

    finally { setSubmitting(false); }

  };



  const displayed = readFilter === 'unread'

    ? notifications.filter(n => !n.isRead)

    : readFilter === 'read'

    ? notifications.filter(n => n.isRead)

    : notifications;



  const typeCounts = notifications.reduce((acc, n) => {

    acc[n.type] = (acc[n.type] || 0) + 1;

    return acc;

  }, {});



  const inp = { width:'100%', padding:'0.65rem 0.875rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.875rem', outline:'none', boxSizing:'border-box', background:'white' };

  const lbl = { display:'block', fontSize:'0.78rem', fontWeight:600, color:'#374151', marginBottom:'0.35rem' };



  return (

    <div style={{ minHeight:'100vh', background:'#f8fafc' }}>

      <Navbar />

      <div style={{ maxWidth:860, margin:'0 auto', padding:'1.5rem 1rem' }}>



        {/* Header */}

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>

          <div>

            <h2 style={{ margin:0, fontWeight:800, color:'#1f2937', fontSize:'1.5rem' }}>🔔 Notifications</h2>

            <p style={{ color:'#9ca3af', fontSize:'0.875rem', marginTop:'0.2rem' }}>

              {total} total · {unreadCount} unread

            </p>

          </div>

          <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>

            {unreadCount > 0 && (

              <button onClick={handleMarkAllRead}

                style={{ padding:'0.5rem 1rem', background:'#ede9fe', color:'#6366f1', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.82rem' }}>

                ✓ Mark All Read

              </button>

            )}

            <button onClick={handleDeleteAll}

              style={{ padding:'0.5rem 1rem', background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.82rem' }}>

              🗑 Clear All

            </button>

            {user?.role === 'admin' && (

              <button onClick={() => setShowAnnounce(!showAnnounce)}

                style={{ padding:'0.5rem 1rem', background:'#6366f1', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.82rem' }}>

                📢 Announce

              </button>

            )}

          </div>

        </div>



        {/* Admin announcement form */}

        {showAnnounce && (

          <div style={{ background:'white', borderRadius:14, padding:'1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:'1.5rem', border:'1px solid #e5e7eb' }}>

            <h3 style={{ margin:'0 0 1.25rem', fontWeight:700, color:'#1f2937', fontSize:'1rem' }}>📢 Send Announcement</h3>

            <form onSubmit={sendAnnouncement} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>

                <div>

                  <label style={lbl}>Title *</label>

                  <input value={announce.title} onChange={e => setAnnounce(a => ({...a, title:e.target.value}))} required placeholder="Announcement title" style={inp} />

                </div>

                <div>

                  <label style={lbl}>Target Audience</label>

                  <select value={announce.targetRole} onChange={e => setAnnounce(a => ({...a, targetRole:e.target.value}))} style={inp}>

                    <option value="all">All Users</option>

                    <option value="worker">Workers Only</option>

                    <option value="customer">Customers Only</option>

                  </select>

                </div>

              </div>

              <div>

                <label style={lbl}>Message *</label>

                <textarea value={announce.message} onChange={e => setAnnounce(a => ({...a, message:e.target.value}))} required rows={3} placeholder="Write your announcement..." style={{ ...inp, resize:'vertical', fontFamily:'inherit' }} />

              </div>

              <div style={{ display:'flex', gap:'0.75rem' }}>

                <button type="submit" disabled={submitting} style={{ padding:'0.65rem 1.5rem', background:'#6366f1', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', opacity:submitting?0.7:1 }}>

                  {submitting ? 'Sending...' : 'Send Announcement'}

                </button>

                <button type="button" onClick={() => setShowAnnounce(false)} style={{ padding:'0.65rem 1.25rem', background:'#f3f4f6', color:'#6b7280', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer' }}>Cancel</button>

              </div>

            </form>

          </div>

        )}



        {/* Filters */}

        <div style={{ background:'white', borderRadius:14, padding:'1rem 1.25rem', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', marginBottom:'1rem', display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>

          {/* Type filter pills */}

          <div style={{ display:'flex', gap:'0.3rem', flexWrap:'wrap', flex:1 }}>

            {ALL_TYPES.map(t => {

              const tc = TYPE_CONFIG[t];

              const count = t === 'all' ? notifications.length : (typeCounts[t] || 0);

              return (

                <button key={t} onClick={() => setTypeFilter(t)}

                  style={{ padding:'0.25rem 0.7rem', borderRadius:20, fontSize:'0.72rem', fontWeight:600, cursor:'pointer', border:'none', display:'flex', alignItems:'center', gap:'0.25rem',

                    background: typeFilter === t ? (tc?.bg || '#f3f4f6') : '#f3f4f6',

                    color: typeFilter === t ? (tc?.color || '#6b7280') : '#6b7280',

                    outline: typeFilter === t ? `2px solid ${tc?.color || '#6b7280'}` : 'none',

                  }}>

                  {tc?.icon || '🔔'} {tc?.label || 'All'}

                  {count > 0 && <span style={{ background:'rgba(0,0,0,0.1)', borderRadius:50, padding:'0 4px', fontSize:'0.6rem' }}>{count}</span>}

                </button>

              );

            })}

          </div>



          {/* Read filter */}

          <div style={{ display:'flex', gap:'0.25rem', background:'#f3f4f6', borderRadius:8, padding:'0.2rem', flexShrink:0 }}>

            {[['all','All'],['unread','Unread'],['read','Read']].map(([v,l]) => (

              <button key={v} onClick={() => setReadFilter(v)}

                style={{ padding:'0.3rem 0.75rem', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.75rem', fontWeight:600,

                  background: readFilter === v ? 'white' : 'transparent',

                  color: readFilter === v ? '#1f2937' : '#9ca3af',

                  boxShadow: readFilter === v ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>

                {l}

              </button>

            ))}

          </div>

        </div>



        {/* Notification list */}

        <div style={{ background:'white', borderRadius:14, boxShadow:'0 2px 10px rgba(0,0,0,0.05)', overflow:'hidden' }}>

          {loading ? (

            <div style={{ padding:'3rem', textAlign:'center', color:'#9ca3af' }}>

              <div style={{ width:36, height:36, border:'3px solid #e5e7eb', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 1rem' }} />

              Loading notifications...

            </div>

          ) : displayed.length === 0 ? (

            <div style={{ padding:'4rem 2rem', textAlign:'center', color:'#9ca3af' }}>

              <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🔔</div>

              <p style={{ fontWeight:600, color:'#6b7280', margin:'0 0 0.25rem' }}>No notifications</p>

              <p style={{ fontSize:'0.82rem', margin:0 }}>

                {typeFilter !== 'all' ? `No ${TYPE_CONFIG[typeFilter]?.label || typeFilter} notifications` : "You're all caught up!"}

              </p>

            </div>

          ) : (

            <>

              {displayed.map(n => (

                <NotifItem key={n._id} n={n} onRead={handleRead} onDelete={handleDelete} onNavigate={handleNavigate} />

              ))}



              {/* Pagination */}

              {total > PER_PAGE && (

                <div style={{ padding:'1rem 1.25rem', borderTop:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>

                  <span style={{ fontSize:'0.8rem', color:'#9ca3af' }}>

                    Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, total)} of {total}

                  </span>

                  <div style={{ display:'flex', gap:'0.5rem' }}>

                    <button onClick={() => { const p = page - 1; setPage(p); fetchNotifications(p); }} disabled={page === 0}

                      style={{ padding:'0.4rem 0.875rem', border:'1px solid #e5e7eb', borderRadius:8, background:'white', color: page === 0 ? '#d1d5db' : '#374151', cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize:'0.82rem', fontWeight:600 }}>

                      ← Prev

                    </button>

                    <button onClick={() => { const p = page + 1; setPage(p); fetchNotifications(p); }} disabled={(page + 1) * PER_PAGE >= total}

                      style={{ padding:'0.4rem 0.875rem', border:'1px solid #e5e7eb', borderRadius:8, background:'white', color: (page+1)*PER_PAGE >= total ? '#d1d5db' : '#374151', cursor: (page+1)*PER_PAGE >= total ? 'not-allowed' : 'pointer', fontSize:'0.82rem', fontWeight:600 }}>

                      Next →

                    </button>

                  </div>

                </div>

              )}

            </>

          )}

        </div>

      </div>

    </div>

  );

}

