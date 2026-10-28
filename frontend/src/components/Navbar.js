import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState({ quotes:0, tickets:0, disputes:0, adminMessages:0, messages:0 });
  const [mobileOpen, setMobileOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const [notifRes, countsRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-counts').catch(() => ({ data: {} })),
      ]);
      setNotifications(notifRes.data.notifications || []);
      setUnreadCount(notifRes.data.unreadCount || 0);
      setUnreadCounts(countsRes.data || {});
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line

  const [notifFilter, setNotifFilter] = useState('all');

  const TYPE_ICONS = {
    booking:'📋', payment:'💰', quote:'🏷️', dispute:'⚖️', message:'💬',
    ticket:'🎫', verification:'✅', review:'⭐', payout:'💳',
    'change-request':'📝', announcement:'📢', system:'🔔',
  };

  const getNavUrl = (n) => {
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

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all', {});
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleNotifClick = async (n) => {
    if (!n.isRead) await markAsRead(n._id);
    const url = getNavUrl(n);
    if (url) navigate(url);
    setShowNotifications(false);
  };

  const filteredNotifs = notifFilter === 'all'
    ? notifications
    : notifications.filter(n => n.type === notifFilter);

  const fmtTime = (d) => {
    if (!d) return '';
    const diff = Date.now() - new Date(d);
    if (diff < 60000)    return 'just now';
    if (diff < 3600000)  return `${Math.floor(diff/60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)}h`;
    return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short' });
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['customer', 'worker'] },
    { path: '/search',    label: 'Find Workers', icon: '🔍', roles: ['customer'] },
    { path: '/bookings',  label: 'Bookings', icon: '📋', roles: ['customer', 'worker'] },
    { path: '/messages',  label: 'Messages', icon: '💬', roles: ['customer', 'worker'] },
    { path: '/quotes',    label: 'Quotes', icon: '🏷️', roles: ['customer', 'worker'] },
    { path: '/disputes',  label: 'Disputes', icon: '⚠️', roles: ['customer', 'worker'] },
    { path: '/support',   label: 'Support', icon: '🎫', roles: ['customer'] },
    { path: '/worker-requests', label: 'Requests', icon: '📋', roles: ['worker'] },
    { path: '/admin',     label: 'Admin Panel', icon: '🛡️', roles: ['admin'] },
  ].filter(l => l.roles.includes(user?.role));

  const getUnreadForPath = (path) => {
    if (path === '/messages') return (unreadCounts.messages || 0) + (unreadCounts.adminMessages || 0);
    if (path === '/quotes') return unreadCounts.quotes || 0;
    if (path === '/support') return unreadCounts.tickets || 0;
    if (path === '/disputes') return unreadCounts.disputes || 0;
    if (path === '/worker-requests') return unreadCounts.pendingChangeRequests || 0;
    return 0;
  };
  const NavBtn = ({ path, label, icon }) => {
    const badge = getUnreadForPath(path);
    return (
      <button
        onClick={() => navigate(path)}
        style={{
          background: isActive(path) ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
          border: isActive(path) ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent',
          color: 'white', padding: '0.45rem 0.875rem', borderRadius: 8, cursor: 'pointer',
          fontSize: '0.82rem', fontWeight: isActive(path) ? 700 : 500, transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap', position: 'relative',
        }}
        onMouseEnter={e => { if (!isActive(path)) e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
        onMouseLeave={e => { if (!isActive(path)) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
      >
        <span style={{ fontSize: '0.9rem' }}>{icon}</span>
        <span className="nav-label">{label}</span>
        {badge > 0 && (
          <span style={{ background:'#ef4444', color:'white', borderRadius:'50%', width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.6rem', fontWeight:700, marginLeft:'0.1rem', flexShrink:0 }}>
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      <nav style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        boxShadow: '0 2px 12px rgba(79,70,229,0.35)',
        position: 'sticky',
        top: 0,
        zIndex: 200,
      }}>
        {/* Logo */}
        <div onClick={() => navigate('/dashboard')} style={{ display:'flex', alignItems:'center', gap:'0.75rem', cursor:'pointer', flexShrink:0 }}>
          <div style={{ width:38, height:38, background:'rgba(255,255,255,0.2)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem', border:'1px solid rgba(255,255,255,0.3)' }}>🏠</div>
          <span style={{ fontSize:'1.1rem', fontWeight:800, color:'white', letterSpacing:'-0.3px' }}>Hyperlocal Jobs</span>
        </div>

        {/* Desktop nav links */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.35rem', flex:1, justifyContent:'center', overflow:'hidden' }} className="desktop-nav">
          {navLinks.map(l => <NavBtn key={l.path} {...l} />)}
        </div>

        {/* Right side */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexShrink:0 }}>
          {/* Notification bell */}
          <div style={{ position:'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', color:'white', width:38, height:38, borderRadius:10, cursor:'pointer', fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', transition:'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.12)'}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{ position:'absolute', top:-4, right:-4, background:'#ef4444', color:'white', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:700, border:'2px solid #6366f1' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div style={{ position:'absolute', top:46, right:0, background:'white', borderRadius:16, boxShadow:'0 8px 40px rgba(0,0,0,0.18)', width:380, maxHeight:520, overflow:'hidden', display:'flex', flexDirection:'column', border:'1px solid #e5e7eb', zIndex:300 }}>

                {/* Header */}
                <div style={{ padding:'0.875rem 1.25rem', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center', background:'white' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    <span style={{ fontWeight:700, color:'#1f2937', fontSize:'0.95rem' }}>Notifications</span>
                    {unreadCount > 0 && (
                      <span style={{ background:'#6366f1', color:'white', borderRadius:50, padding:'0.1rem 0.5rem', fontSize:'0.65rem', fontWeight:700 }}>{unreadCount} new</span>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} style={{ background:'none', border:'none', color:'#6366f1', cursor:'pointer', fontSize:'0.75rem', fontWeight:600, padding:0 }}>✓ All read</button>
                    )}
                    <button onClick={() => { navigate('/notifications'); setShowNotifications(false); }}
                      style={{ background:'#ede9fe', border:'none', color:'#6366f1', cursor:'pointer', fontSize:'0.72rem', fontWeight:700, padding:'0.2rem 0.6rem', borderRadius:6 }}>
                      View All
                    </button>
                  </div>
                </div>

                {/* Type filter pills */}
                <div style={{ padding:'0.5rem 1rem', borderBottom:'1px solid #f3f4f6', display:'flex', gap:'0.3rem', overflowX:'auto', background:'#fafafa' }}>
                  {['all','booking','payment','quote','dispute','message','ticket','announcement'].map(t => {
                    const icons = { all:'🔔', booking:'📋', payment:'💰', quote:'🏷️', dispute:'⚖️', message:'💬', ticket:'🎫', announcement:'📢' };
                    const count = t === 'all' ? notifications.length : notifications.filter(n => n.type === t).length;
                    return (
                      <button key={t} onClick={() => setNotifFilter(t)}
                        style={{ padding:'0.2rem 0.55rem', borderRadius:20, fontSize:'0.65rem', fontWeight:600, cursor:'pointer', border:'none', whiteSpace:'nowrap', flexShrink:0,
                          background: notifFilter === t ? '#6366f1' : '#f3f4f6',
                          color: notifFilter === t ? 'white' : '#6b7280' }}>
                        {icons[t]} {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                        {count > 0 && <span style={{ marginLeft:'0.2rem', opacity:0.8 }}>({count})</span>}
                      </button>
                    );
                  })}
                </div>

                {/* List */}
                <div style={{ overflowY:'auto', flex:1 }}>
                  {filteredNotifs.length === 0 ? (
                    <div style={{ padding:'2.5rem', textAlign:'center', color:'#9ca3af' }}>
                      <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>🔔</div>
                      <p style={{ fontSize:'0.82rem', margin:0 }}>No notifications</p>
                    </div>
                  ) : filteredNotifs.slice(0, 12).map(n => {
                    const icon = TYPE_ICONS[n.type] || '🔔';
                    const hasLink = !!getNavUrl(n);
                    return (
                      <div key={n._id}
                        onClick={() => handleNotifClick(n)}
                        style={{ padding:'0.75rem 1.25rem', borderBottom:'1px solid #f9fafb', cursor: hasLink ? 'pointer' : 'default', background: n.isRead ? 'white' : '#f5f3ff', borderLeft: n.isRead ? '3px solid transparent' : '3px solid #6366f1', display:'flex', gap:'0.75rem', alignItems:'flex-start', transition:'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'white' : '#f5f3ff'}>
                        <div style={{ width:32, height:32, borderRadius:8, background: n.isRead ? '#f3f4f6' : '#ede9fe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem', flexShrink:0 }}>{icon}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', gap:'0.4rem', marginBottom:'0.15rem' }}>
                            <span style={{ fontWeight: n.isRead ? 500 : 700, color:'#1f2937', fontSize:'0.82rem', lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.title}</span>
                            <span style={{ fontSize:'0.62rem', color:'#9ca3af', flexShrink:0 }}>{fmtTime(n.createdAt)}</span>
                          </div>
                          <p style={{ margin:0, fontSize:'0.75rem', color:'#6b7280', lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.message}</p>
                        </div>
                        {!n.isRead && <div style={{ width:7, height:7, borderRadius:'50%', background:'#6366f1', flexShrink:0, marginTop:4 }} />}
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div style={{ padding:'0.75rem 1.25rem', borderTop:'1px solid #f3f4f6', textAlign:'center', background:'#fafafa' }}>
                  <button onClick={() => { navigate('/notifications'); setShowNotifications(false); }}
                    style={{ background:'none', border:'none', color:'#6366f1', cursor:'pointer', fontSize:'0.8rem', fontWeight:700 }}>
                    See all {notifications.length} notifications →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div onClick={() => navigate('/profile')} title="My Profile"
            style={{ width:38, height:38, borderRadius:10, background:'rgba(255,255,255,0.2)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, cursor:'pointer', overflow:'hidden', border:'2px solid rgba(255,255,255,0.35)', fontSize:'0.9rem', transition:'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor='white'}
            onMouseLeave={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.35)'}>
            {user?.avatar ? <img src={user.avatar} alt={user.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : user?.name?.charAt(0) || '?'}
          </div>

          {/* Logout */}
          <button onClick={logout}
            style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.25)', color:'white', padding:'0.45rem 0.875rem', borderRadius:8, cursor:'pointer', fontSize:'0.82rem', fontWeight:600, transition:'all 0.2s', whiteSpace:'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.3)'; e.currentTarget.style.borderColor='rgba(239,68,68,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.25)'; }}>
            Sign Out
          </button>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="mobile-menu-btn"
            style={{ display:'none', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', color:'white', width:38, height:38, borderRadius:10, cursor:'pointer', fontSize:'1.1rem', alignItems:'center', justifyContent:'center' }}>
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ background:'#4f46e5', padding:'1rem 1.5rem', display:'flex', flexDirection:'column', gap:'0.5rem', borderBottom:'2px solid rgba(255,255,255,0.1)', zIndex:199 }} className="mobile-nav">
          {navLinks.map(l => (
            <button key={l.path} onClick={() => navigate(l.path)}
              style={{ background: isActive(l.path) ? 'rgba(255,255,255,0.2)' : 'transparent', border:'none', color:'white', padding:'0.75rem 1rem', borderRadius:8, cursor:'pointer', fontSize:'0.9rem', fontWeight: isActive(l.path) ? 700 : 500, textAlign:'left', display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <span>{l.icon}</span>{l.label}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .nav-label { display: none; }
        }
        @media (max-width: 480px) {
          .mobile-nav { display: flex; }
        }
      `}</style>
    </>
  );
};

export default Navbar;
