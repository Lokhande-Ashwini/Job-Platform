import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../utils/api';
import '../admin.css';
import AdminMapPanel from '../components/AdminMapPanel';
import AdminProfile from './AdminProfile';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16'];

const StatusBadge = ({ status }) => {
  const map = {
    verified:               { bg:'#d1fae5', color:'#065f46', label:'Verified' },
    submitted:              { bg:'#fef3c7', color:'#92400e', label:'Under Review' },
    pending:                { bg:'#f3f4f6', color:'#6b7280', label:'Not Submitted' },
    rejected:               { bg:'#fee2e2', color:'#991b1b', label:'Rejected' },
    'resubmission-required':{ bg:'#fff7ed', color:'#c2410c', label:'Resubmit Required' },
    completed:              { bg:'#d1fae5', color:'#065f46', label:'Completed' },
    accepted:               { bg:'#dbeafe', color:'#1e40af', label:'Accepted' },
    'in-progress':          { bg:'#ede9fe', color:'#5b21b6', label:'In Progress' },
    cancelled:              { bg:'#f3f4f6', color:'#6b7280', label:'Cancelled' },
    open:                   { bg:'#fee2e2', color:'#991b1b', label:'Open' },
    resolved:               { bg:'#d1fae5', color:'#065f46', label:'Resolved' },
    'under-review':         { bg:'#fef3c7', color:'#92400e', label:'Under Review' },
    paid:                   { bg:'#d1fae5', color:'#065f46', label:'Paid' },
    unpaid:                 { bg:'#fee2e2', color:'#991b1b', label:'Unpaid' },
  };
  const s = map[status] || { bg:'#f3f4f6', color:'#6b7280', label: status || '—' };
  return <span style={{background:s.bg, color:s.color, padding:'0.2rem 0.75rem', borderRadius:'50px', fontSize:'0.78rem', fontWeight:'600'}}>{s.label}</span>;
};

const Avatar = ({ user, size = 36 }) => (
  user?.avatar
    ? <img src={user.avatar} alt={user.name} style={{width:size, height:size, borderRadius:'50%', objectFit:'cover'}} />
    : <div style={{width:size, height:size, borderRadius:'50%', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:size*0.4}}>{user?.name?.[0] || '₹'}</div>
);

const KpiCard = ({ icon, label, value, sub, color }) => (
  <div style={{background:'white', borderRadius:'16px', padding:'1.5rem', boxShadow:'0 1px 8px rgba(0,0,0,0.07)', borderLeft:`4px solid ${color}`, display:'flex', alignItems:'center', gap:'1rem'}}>
    <div style={{width:52, height:52, borderRadius:'12px', background:color+'20', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0}}>{icon}</div>
    <div>
      <div style={{fontSize:'1.75rem', fontWeight:'800', color:'#1f2937', lineHeight:1}}>{value}</div>
      <div style={{fontSize:'0.85rem', fontWeight:'600', color:'#6b7280', marginTop:'0.25rem'}}>{label}</div>
      {sub && <div style={{fontSize:'0.75rem', color:'#9ca3af', marginTop:'0.15rem'}}>{sub}</div>}
    </div>
  </div>
);

const EmptyState = ({ icon, text }) => (
  <div style={{textAlign:'center', padding:'4rem 2rem', color:'#9ca3af'}}>
    <div style={{fontSize:'3.5rem', marginBottom:'1rem'}}>{icon}</div>
    <p style={{fontSize:'1rem'}}>{text}</p>
  </div>
);

const TABS = [
  { key:'overview',     icon:'📊', label:'Overview' },
  { key:'bookings',     icon:'📋', label:'Bookings' },
  { key:'workers',      icon:'👷', label:'Workers' },
  { key:'customers',    icon:'👤', label:'Customers' },
  { key:'pending',      icon:'⏳', label:'Verifications' },
  { key:'disputes',     icon:'⚠️', label:'Disputes' },
  { key:'quotes',       icon:'💬', label:'Quotes' },
  { key:'payments',     icon:'💰', label:'Payments' },
  { key:'support',      icon:'🛎️', label:'Support Chat' },
  { key:'analytics',    icon:'📈', label:'Analytics' },
  { key:'ai',           icon:'🤖', label:'AI Insights' },
  { key:'map',          icon:'🗺️', label:'Map Monitor' },
  { key:'tickets',      icon:'🎫', label:'Support Tickets' },
  { key:'notifications',icon:'🔔', label:'Notifications' },
  { key:'finance',      icon:'💹', label:'Finance & Analytics', external:'/admin/finance' },
];

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [stats, setStats] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [newMsg, setNewMsg] = useState('');
  const [newThreadForm, setNewThreadForm] = useState({ show:false, targetId:'', subject:'', message:'', type:'admin-worker' });
  const [aiFlags, setAiFlags] = useState([]);
  const [aiReviews, setAiReviews] = useState(null);
  const [showAdminProfile, setShowAdminProfile] = useState(false);
  const [adminDropOpen, setAdminDropOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [ticketMsg,    setTicketMsg]    = useState('');
  const [ticketNote,   setTicketNote]   = useState('');
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter,   setTicketStatusFilter]   = useState('all');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState('all');
  const [ticketRoleFilter,     setTicketRoleFilter]     = useState('all');
  const [ticketSending,        setTicketSending]        = useState(false);
  const [ticketNoteMode,       setTicketNoteMode]       = useState(false);
  const [workerDetailModal, setWorkerDetailModal] = useState(null);
  const [changeRequestModal, setChangeRequestModal] = useState(null);
  const [crItems, setCrItems] = useState([{ fieldName:'', oldValue:'', suggestedValue:'', reason:'' }]);
  const [crPriority, setCrPriority] = useState('medium');
  const [workerRequests, setWorkerRequests] = useState([]);
  const [customerChatModal, setCustomerChatModal] = useState(null);
  const [customerChatMsg, setCustomerChatMsg] = useState('');
  const [customerThread, setCustomerThread] = useState(null);
  const [workerChatModal, setWorkerChatModal] = useState(null);
  const [workerChatMsg, setWorkerChatMsg] = useState('');
  const [workerChatThread, setWorkerChatThread] = useState(null);

  const [deleteModal, setDeleteModal] = useState(null);
  const [activeDispute, setActiveDispute] = useState(null);
  const [resolveModal, setResolveModal] = useState(null);
  const [workerSearch, setWorkerSearch] = useState('');
  const [workerTrustFilter, setWorkerTrustFilter] = useState('all');
  const [customerTrustFilter, setCustomerTrustFilter] = useState('all');
  const [customerSearch, setCustomerSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState('all');
  const [bookingSearch, setBookingSearch] = useState('');

  // Payments tab state (lifted to avoid hooks-in-callbacks)
  const [finData,       setFinData]       = useState(null);
  const [finLoading,    setFinLoading]    = useState(false);
  const [payoutFilter,  setPayoutFilter]  = useState('all');
  const [finDateFrom,   setFinDateFrom]   = useState('');
  const [finDateTo,     setFinDateTo]     = useState('');
  const [settingsForm,  setSettingsForm]  = useState(null);
  const [savingSettings,setSavingSettings]= useState(false);
  const [activeFinTab,  setActiveFinTab]  = useState('overview');

  // Notifications tab state (lifted)
  const [adminNotifs,     setAdminNotifs]     = useState([]);
  const [notifLoading,    setNotifLoading]    = useState(false);
  const [notifType,       setNotifType]       = useState('all');
  const [announceForm,    setAnnounceForm]    = useState({ title:'', message:'', targetRole:'all' });
  const [sendingAnnounce, setSendingAnnounce] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/dashboard'); return; }
    fetchAll();
  }, [user, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Payments tab: fetch finance data when tab is active or date changes
  useEffect(() => {
    if (activeTab !== 'payments') return;
    setFinLoading(true);
    const params = new URLSearchParams();
    if (finDateFrom) params.append('from', finDateFrom);
    if (finDateTo)   params.append('to', finDateTo);
    api.get(`/finance/admin/revenue?${params}`).then(r => {
      setFinData(r.data);
      if (!settingsForm) setSettingsForm(r.data.settings);
    }).catch(() => {}).finally(() => setFinLoading(false));
  }, [activeTab, finDateFrom, finDateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notifications tab: fetch when tab is active or type changes
  useEffect(() => {
    if (activeTab !== 'notifications') return;
    setNotifLoading(true);
    const params = new URLSearchParams({ limit: 50 });
    if (notifType !== 'all') params.append('type', notifType);
    api.get(`/notifications?${params}`).then(r => setAdminNotifs(r.data.notifications || [])).catch(() => {}).finally(() => setNotifLoading(false));
  }, [activeTab, notifType]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveSettings = async () => {
    setSavingSettings(true);
    try { await api.patch('/finance/admin/settings', settingsForm); toast.success('Settings saved'); }
    catch { toast.error('Failed'); }
    finally { setSavingSettings(false); }
  };

  const markNotifRead = async (id) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    setAdminNotifs(prev => prev.map(n => n._id === id ? {...n, isRead:true} : n));
  };
  const deleteNotif = async (id) => {
    await api.delete(`/notifications/${id}`).catch(() => {});
    setAdminNotifs(prev => prev.filter(n => n._id !== id));
  };
  const markAllNotifsRead = async () => {
    await api.patch('/notifications/read-all', { type: notifType }).catch(() => {});
    setAdminNotifs(prev => prev.map(n => ({...n, isRead:true})));
  };
  const sendAnnouncement = async (e) => {
    e.preventDefault();
    setSendingAnnounce(true);
    try {
      const { data } = await api.post('/notifications/announcement', announceForm);
      toast.success(`Announcement sent to ${data.sent} users`);
      setAnnounceForm({ title:'', message:'', targetRole:'all' });
    } catch { toast.error('Failed'); }
    finally { setSendingAnnounce(false); }
  };
  const markPayoutStatus = async (id, status) => {
    try {
      await api.patch(`/finance/admin/payout/${id}`, { status });
      toast.success(`Payout marked as ${status}`);
      const r = await api.get('/finance/admin/revenue');
      setFinData(r.data);
    } catch { toast.error('Failed'); }
  };

  const fetchAll = useCallback(async () => {
    try {
      // Load stats first — show the UI immediately
      const sRes = await api.get('/admin/stats');
      setStats(sRes.data);
      setLoading(false); // render the dashboard now

      // Load the rest in background
      const [wRes, cRes, pRes, bRes, dRes, qRes, tRes] = await Promise.all([
        api.get('/admin/workers'),
        api.get('/admin/customers'),
        api.get('/admin/workers/pending'),
        api.get('/admin/bookings'),
        api.get('/disputes'),
        api.get('/quotes/admin/review'),
        api.get('/support/threads/all'),
      ]);
      setWorkers(wRes.data);
      setCustomers(cRes.data);
      setPendingWorkers(pRes.data);
      setBookings(bRes.data);
      setDisputes(dRes.data);
      setQuotes(qRes.data);
      setThreads(tRes.data);
      // Fetch AI data in background
      api.get('/ai/suspicious-flags').then(r => setAiFlags(r.data)).catch(() => {});
      api.get('/ai/review-analytics').then(r => setAiReviews(r.data)).catch(() => {});
      api.get('/tickets').then(r => setTickets(r.data)).catch(() => {});
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, []);

  const handleVerify = async (id, status) => {
    try {
      await api.patch(`/profile/verify/${id}/admin`, { status });
      toast.success(`Worker ${status}`);
      fetchAll();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/users/${deleteModal._id}`);
      toast.success('Deleted');
      setDeleteModal(null);
      fetchAll();
    } catch { toast.error('Failed to delete'); }
  };

  const handleResolveDispute = async (e) => {
    e.preventDefault();
    if (!resolveModal) return;
    try {
      const payload = {
        status: resolveModal.resolution,
        resolutionNote: resolveModal.note,
        actionNote: resolveModal.note,
        refundAmount: Number(resolveModal.refund) || 0,
        penaltyAmount: Number(resolveModal.penalty) || 0,
        settlementAmount: Number(resolveModal.settlement) || 0,
        warningNote: resolveModal.warning,
      };
      const res = await api.patch(`/disputes/${resolveModal._id}/status`, payload);
      toast.success('Dispute action applied');
      setDisputes(prev => prev.map(d => d._id === res.data._id ? res.data : d));
      if (activeDispute?._id === resolveModal._id) setActiveDispute(res.data);
      setResolveModal(null);
    } catch { toast.error('Failed to apply action'); }
  };

  const handleAdminDecideQuote = async (id, decision) => {
    try {
      await api.patch(`/quotes/admin/${id}/decide`, { decision, note: decision === 'approved' ? 'Admin approved — quote released to customer' : 'Admin rejected — quote flagged as unreasonable' });
      toast.success(`Quote ${decision}`);
      api.get('/quotes/admin/review').then(r => setQuotes(r.data)).catch(() => {});
    } catch { toast.error('Failed'); }
  };

  const submitChangeRequest = async (e) => {
    e.preventDefault();
    const validItems = crItems.filter(i => i.fieldName && i.suggestedValue && i.reason);
    if (!validItems.length) { toast.error('Add at least one complete change request'); return; }
    try {
      await Promise.all(validItems.map(item =>
        api.post('/worker-requests', { workerId: changeRequestModal._id, ...item, priority: crPriority })
      ));
      toast.success(`${validItems.length} change request(s) sent to worker`);
      setChangeRequestModal(null);
      setCrItems([{ fieldName:'', oldValue:'', suggestedValue:'', reason:'' }]);
      setCrPriority('medium');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const openCustomerChat = async (customer) => {
    setCustomerChatModal(customer);
    setCustomerThread(null);
    setCustomerChatMsg('');
    // Try to find existing thread
    try {
      const { data } = await api.get('/support/threads');
      const existing = data.find(t => t.participants?.some(p => p._id === customer._id || p === customer._id));
      if (existing) {
        const { data: full } = await api.get(`/support/threads/${existing._id}`);
        setCustomerThread(full);
      }
    } catch {}
  };

  const sendCustomerChatMsg = async () => {
    if (!customerChatMsg.trim() || !customerChatModal) return;
    try {
      if (!customerThread) {
        const { data } = await api.post('/support/threads', {
          targetUserId: customerChatModal._id,
          subject: `Admin Support — ${customerChatModal.name}`,
          message: customerChatMsg,
          threadType: 'admin-customer'
        });
        setCustomerThread(data);
      } else {
        const { data } = await api.post(`/support/threads/${customerThread._id}/messages`, { text: customerChatMsg });
        setCustomerThread(data);
      }
      setCustomerChatMsg('');
    } catch { toast.error('Failed to send'); }
  };

  const openWorkerChat = async (worker) => {
    setWorkerChatModal(worker);
    setWorkerChatThread(null);
    setWorkerChatMsg('');
    setWorkerDetailModal(null);
    try {
      const { data } = await api.get('/support/threads');
      const existing = data.find(t => t.participants?.some(p => p._id === worker._id || p === worker._id));
      if (existing) {
        const { data: full } = await api.get(`/support/threads/${existing._id}`);
        setWorkerChatThread(full);
      }
    } catch {}
  };

  const sendWorkerChatMsg = async () => {
    if (!workerChatMsg.trim() || !workerChatModal) return;
    try {
      if (!workerChatThread) {
        const { data } = await api.post('/support/threads', {
          targetUserId: workerChatModal._id,
          subject: `Admin ↔ Worker — ${workerChatModal.name}`,
          message: workerChatMsg,
          threadType: 'admin-worker'
        });
        setWorkerChatThread(data);
      } else {
        const { data } = await api.post(`/support/threads/${workerChatThread._id}/messages`, { text: workerChatMsg });
        setWorkerChatThread(data);
      }
      setWorkerChatMsg('');
    } catch { toast.error('Failed to send'); }
  };

  const loadWorkerRequests = async (workerId) => {
    try {
      const { data } = await api.get(`/worker-requests/worker/${workerId}`);
      setWorkerRequests(data);
    } catch {}
  };

  const suspendWorker = async (workerId, action) => {
    try {
      await api.patch(`/worker-requests/worker/${workerId}/status`, { action });
      toast.success(`Worker ${action}d`);
      fetchAll();
    } catch { toast.error('Failed'); }
  };

  const loadTicket = async (ticket) => {
    try {
      const { data } = await api.get(`/tickets/${ticket._id}`);
      setActiveTicket(data);
      setTicketMsg('');
      setTicketNote('');
      setTicketNoteMode(false);
      api.patch(`/tickets/${ticket._id}/read`).catch(() => {});
    } catch { toast.error('Failed to load ticket'); }
  };

  const sendTicketMsg = async () => {
    if (!ticketMsg.trim() || !activeTicket) return;
    setTicketSending(true);
    try {
      const { data } = await api.post(`/tickets/${activeTicket._id}/messages`, { text: ticketMsg });
      setActiveTicket(data);
      setTicketMsg('');
      setTickets(prev => prev.map(t => t._id === data._id ? { ...t, status: data.status, updatedAt: data.updatedAt } : t));
    } catch { toast.error('Failed'); }
    finally { setTicketSending(false); }
  };

  const sendTicketNote = async () => {
    if (!ticketNote.trim() || !activeTicket) return;
    try {
      const { data } = await api.post(`/tickets/${activeTicket._id}/internal-note`, { note: ticketNote });
      setActiveTicket(data);
      setTicketNote('');
      toast.success('Internal note added');
    } catch { toast.error('Failed'); }
  };

  const updateTicketStatus = async (id, status, resolutionNote) => {
    try {
      await api.patch(`/tickets/${id}`, { status, resolutionNote });
      toast.success(`Ticket marked as ${status}`);
      if (activeTicket?._id === id) loadTicket({ _id: id });
      api.get('/tickets').then(r => setTickets(r.data)).catch(() => {});
    } catch { toast.error('Failed'); }
  };

  const ticketAction = async (id, action) => {
    try {
      await api.patch(`/tickets/${id}/${action}`);
      toast.success(`Done`);
      if (activeTicket?._id === id) loadTicket({ _id: id });
      api.get('/tickets').then(r => setTickets(r.data)).catch(() => {});
    } catch { toast.error('Failed'); }
  };

  const loadThread = async (thread) => {
    try {
      const res = await api.get(`/support/threads/${thread._id}`);
      setActiveThread(res.data);
      // Mark messages as read
      api.patch(`/support/threads/${thread._id}/read`).catch(() => {});
    } catch { toast.error('Failed to load thread'); }
  };

  const sendSupportMsg = async () => {
    if (!newMsg.trim() || !activeThread) return;
    try {
      const res = await api.post(`/support/threads/${activeThread._id}/messages`, { text: newMsg });
      setActiveThread(res.data);
      setNewMsg('');
      fetchAll();
    } catch { toast.error('Failed'); }
  };

  const createThread = async () => {
    try {
      const res = await api.post('/support/threads', {
        targetUserId: newThreadForm.targetId,
        subject: newThreadForm.subject,
        message: newThreadForm.message,
        threadType: newThreadForm.type
      });
      setActiveThread(res.data);
      setNewThreadForm({ show:false, targetId:'', subject:'', message:'', type:'admin-worker' });
      toast.success('Thread created');
      fetchAll();
    } catch { toast.error('Failed to create thread'); }
  };

  if (loading) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:48, height:48, border:'4px solid #e5e7eb', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 1rem'}}></div>
        <p style={{color:'#6b7280'}}>Loading dashboard...</p>
      </div>
    </div>
  );

  const filteredWorkers = workers
    .filter(w => w.name.toLowerCase().includes(workerSearch.toLowerCase()) || w.email.toLowerCase().includes(workerSearch.toLowerCase()))
    .filter(w => {
      if (workerTrustFilter === 'high') return (w.trustScore?.score || 0) >= 70;
      if (workerTrustFilter === 'low')  return (w.trustScore?.score || 0) < 40;
      return true;
    });
  const filteredCustomers = customers
    .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.email.toLowerCase().includes(customerSearch.toLowerCase()))
    .filter(c => {
      if (customerTrustFilter === 'high') return (c.trustScore?.score || 0) >= 70;
      if (customerTrustFilter === 'low')  return (c.trustScore?.score || 0) < 40;
      return true;
    });

  const serviceChartData = stats?.serviceDemand?.map(s => ({ name: s._id, value: s.count })) || [];
  const bookingChartData = [
    { name: 'Pending', value: stats?.bookings?.pending || 0 },
    { name: 'Completed', value: stats?.bookings?.completed || 0 },
    { name: 'Total', value: stats?.bookings?.total || 0 },
  ];

  return (
    <div style={{display:'flex', minHeight:'100vh', background:'#f8fafc', fontFamily:'Inter, system-ui, sans-serif'}}>

      {/* SIDEBAR */}
      <aside style={{width: sidebarOpen ? 240 : 64, background:'#1e1b4b', transition:'width 0.3s', flexShrink:0, display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, height:'100vh', zIndex:100, overflowY:'auto'}}>
        <div style={{padding:'1.25rem', borderBottom:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', gap:'0.75rem', cursor:'pointer'}} onClick={() => setSidebarOpen(!sidebarOpen)}>
          <div style={{fontSize:'1.5rem'}}>🏠</div>
          {sidebarOpen && <span style={{color:'white', fontWeight:'700', fontSize:'1rem', whiteSpace:'nowrap'}}>Admin Panel</span>}
        </div>
        <nav style={{flex:1, padding:'0.75rem 0'}}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => t.external ? navigate(t.external) : setActiveTab(t.key)}
              style={{width:'100%', display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem 1.25rem', background: activeTab===t.key ? 'rgba(99,102,241,0.3)' : 'transparent', border:'none', cursor:'pointer', color: activeTab===t.key ? '#a5b4fc' : '#94a3b8', fontWeight: activeTab===t.key ? '600' : '400', fontSize:'0.9rem', textAlign:'left', borderLeft: activeTab===t.key ? '3px solid #6366f1' : '3px solid transparent', transition:'all 0.2s'}}>
              <span style={{fontSize:'1.1rem', flexShrink:0}}>{t.icon}</span>
              {sidebarOpen && <span style={{whiteSpace:'nowrap'}}>{t.label}{t.key==='pending' && pendingWorkers.length > 0 ? ` (${pendingWorkers.length})` : ''}{t.key==='disputes' && disputes.filter(d=>d.status==='open').length > 0 ? ` (${disputes.filter(d=>d.status==='open').length})` : ''}{t.external ? ' ↗' : ''}</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:'1rem', borderTop:'1px solid rgba(255,255,255,0.1)', display:'flex', flexDirection:'column', gap:'0.5rem'}}>
          <button onClick={() => navigate('/dashboard')} style={{width:'100%', padding:'0.6rem', background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'8px', color:'#94a3b8', cursor:'pointer', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:'0.5rem', justifyContent: sidebarOpen ? 'flex-start' : 'center', transition:'background 0.2s'}}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}>
            <span>↩</span>{sidebarOpen && 'Back to App'}
          </button>
          <button onClick={logout} style={{width:'100%', padding:'0.6rem', background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'8px', color:'#fca5a5', cursor:'pointer', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:'0.5rem', justifyContent: sidebarOpen ? 'flex-start' : 'center', transition:'all 0.2s'}}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.3)'; e.currentTarget.style.color='white'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(239,68,68,0.15)'; e.currentTarget.style.color='#fca5a5'; }}>
            <span>🚪</span>{sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{flex:1, overflow:'auto', marginLeft:sidebarOpen?240:64, transition:'margin-left 0.3s'}}>
        {/* TOP BAR */}
        <div style={{background:'white', padding:'1rem 2rem', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50, boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
          <div>
            <h1 style={{fontSize:'1.25rem', fontWeight:'700', color:'#1f2937', margin:0}}>{TABS.find(t=>t.key===activeTab)?.icon} {TABS.find(t=>t.key===activeTab)?.label}</h1>
            <p style={{fontSize:'0.8rem', color:'#9ca3af', margin:0}}>Hyperlocal Jobs Admin</p>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:'0.9rem', fontWeight:'600', color:'#1f2937'}}>{user?.name}</div>
              <div style={{fontSize:'0.75rem', color:'#9ca3af'}}>Administrator</div>
            </div>
            {/* Admin avatar with dropdown */}
            <div style={{position:'relative'}}>
              <div onClick={() => setAdminDropOpen(v => !v)} style={{cursor:'pointer', transition:'transform 0.2s'}} title="Account"
                onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
                <Avatar user={user} size={40} />
              </div>
              {adminDropOpen && (
                <>
                  <div onClick={() => setAdminDropOpen(false)} style={{position:'fixed', inset:0, zIndex:98}} />
                  <div style={{position:'absolute', top:48, right:0, background:'white', borderRadius:14, boxShadow:'0 8px 32px rgba(0,0,0,0.15)', border:'1px solid #e5e7eb', minWidth:200, zIndex:99, overflow:'hidden'}}>
                    <div style={{padding:'0.875rem 1.25rem', borderBottom:'1px solid #f3f4f6', background:'#f9fafb'}}>
                      <div style={{fontWeight:700, color:'#1f2937', fontSize:'0.9rem'}}>{user?.name}</div>
                      <div style={{fontSize:'0.75rem', color:'#9ca3af'}}>Administrator</div>
                    </div>
                    {[
                      { icon:'👤', label:'My Profile',      action: () => { setShowAdminProfile(true); setAdminDropOpen(false); } },
                      { icon:'✏️', label:'Edit Profile',    action: () => { setShowAdminProfile(true); setAdminDropOpen(false); } },
                      { icon:'🔒', label:'Change Password', action: () => { setShowAdminProfile(true); setAdminDropOpen(false); } },
                    ].map(item => (
                      <button key={item.label} onClick={item.action}
                        style={{width:'100%', padding:'0.75rem 1.25rem', background:'none', border:'none', cursor:'pointer', textAlign:'left', fontSize:'0.875rem', color:'#374151', fontWeight:500, display:'flex', alignItems:'center', gap:'0.75rem', transition:'background 0.15s'}}
                        onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background='none'}>
                        <span>{item.icon}</span>{item.label}
                      </button>
                    ))}
                    <div style={{borderTop:'1px solid #f3f4f6'}}>
                      <button onClick={() => { setAdminDropOpen(false); logout(); }}
                        style={{width:'100%', padding:'0.75rem 1.25rem', background:'none', border:'none', cursor:'pointer', textAlign:'left', fontSize:'0.875rem', color:'#ef4444', fontWeight:600, display:'flex', alignItems:'center', gap:'0.75rem', transition:'background 0.15s'}}
                        onMouseEnter={e => e.currentTarget.style.background='#fff5f5'}
                        onMouseLeave={e => e.currentTarget.style.background='none'}>
                        <span>🚪</span>Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{padding:'2rem'}}>
          {/* -- OVERVIEW -- */}
          {activeTab === 'overview' && (
            <div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1.25rem', marginBottom:'2rem'}}>
                <KpiCard icon="👥" label="Total Users" value={stats?.users?.total||0} sub={`${stats?.users?.workers||0} workers · ${stats?.users?.customers||0} customers`} color="#6366f1" />
                <KpiCard icon="📋" label="Total Bookings" value={stats?.bookings?.total||0} sub={`${stats?.bookings?.completed||0} completed`} color="#10b981" />
                <KpiCard icon="💰" label="Total Revenue" value={`₹${(stats?.revenue||0).toLocaleString()}`} sub="From completed bookings" color="#f59e0b" />
                <KpiCard icon="✅" label="Verified Workers" value={stats?.users?.verifiedWorkers||0} sub={`${pendingWorkers.length} pending`} color="#8b5cf6" />
              </div>

              {/* Low-rating alert */}
              {(() => {
                const lowRatedWorkers = workers.filter(w => (w.workerProfile?.rating || 0) > 0 && (w.workerProfile?.rating || 0) <= 2.5 && (w.workerProfile?.totalReviews || 0) >= 2);
                if (!lowRatedWorkers.length) return null;
                return (
                  <div style={{background:'#fef2f2', border:'1px solid #fecaca', borderRadius:14, padding:'1rem 1.25rem', marginBottom:'1.5rem', display:'flex', alignItems:'flex-start', gap:'0.875rem'}}>
                    <span style={{fontSize:'1.5rem', flexShrink:0}}>⚠️</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700, color:'#991b1b', marginBottom:'0.5rem', fontSize:'0.9rem'}}>Low Rating Alert — {lowRatedWorkers.length} worker{lowRatedWorkers.length>1?'s':''} need attention</div>
                      <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap'}}>
                        {lowRatedWorkers.map(w => (
                          <div key={w._id} style={{background:'white', borderRadius:8, padding:'0.4rem 0.875rem', display:'flex', alignItems:'center', gap:'0.5rem', border:'1px solid #fecaca'}}>
                            <span style={{fontWeight:600, color:'#1f2937', fontSize:'0.82rem'}}>{w.name}</span>
                            <span style={{background:'#fee2e2', color:'#dc2626', padding:'0.1rem 0.4rem', borderRadius:50, fontSize:'0.68rem', fontWeight:700}}>⭐ {(w.workerProfile.rating||0).toFixed(1)}</span>
                            <span style={{fontSize:'0.68rem', color:'#9ca3af'}}>{w.workerProfile.totalReviews} reviews</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'1.5rem'}}>
                <div style={{background:'white', borderRadius:'16px', padding:'1.5rem', boxShadow:'0 1px 8px rgba(0,0,0,0.07)'}}>
                  <h3 style={{margin:'0 0 1.25rem', color:'#1f2937', fontSize:'1rem', fontWeight:'700'}}>📊 Booking Status</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={bookingChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="name" tick={{fontSize:12}} />
                      <YAxis tick={{fontSize:12}} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#6366f1" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{background:'white', borderRadius:'16px', padding:'1.5rem', boxShadow:'0 1px 8px rgba(0,0,0,0.07)'}}>
                  <h3 style={{margin:'0 0 1.25rem', color:'#1f2937', fontSize:'1rem', fontWeight:'700'}}>🔥 Service Demand</h3>
                  {serviceChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={serviceChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                          {serviceChartData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <EmptyState icon="📊" text="No booking data yet" />}
                </div>
              </div>
              <div style={{background:'white', borderRadius:'16px', padding:'1.5rem', boxShadow:'0 1px 8px rgba(0,0,0,0.07)'}}>
                <h3 style={{margin:'0 0 1.25rem', color:'#1f2937', fontSize:'1rem', fontWeight:'700'}}>🏆 Top Workers</h3>
                {stats?.topWorkers?.length > 0 ? (
                  <table style={{width:'100%', borderCollapse:'collapse'}}>
                    <thead><tr style={{borderBottom:'2px solid #f3f4f6'}}>{['#','Worker','Skills','Jobs','Rating'].map(h=><th key={h} style={{padding:'0.75rem 1rem', textAlign:'left', fontSize:'0.8rem', color:'#9ca3af', fontWeight:'600', textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
                    <tbody>
                      {stats.topWorkers.map((w,i)=>(
                        <tr key={w._id} style={{borderBottom:'1px solid #f9fafb'}}>
                          <td style={{padding:'0.75rem 1rem', color:'#6b7280', fontWeight:'700'}}>#{i+1}</td>
                          <td style={{padding:'0.75rem 1rem', fontWeight:'600', color:'#1f2937'}}>{w.name}</td>
                          <td style={{padding:'0.75rem 1rem', color:'#6b7280', fontSize:'0.85rem'}}>{w.workerProfile?.skills?.slice(0,2).join(', ')}</td>
                          <td style={{padding:'0.75rem 1rem', color:'#1f2937', fontWeight:'600'}}>{w.workerProfile?.totalJobs||0}</td>
                          <td style={{padding:'0.75rem 1rem'}}><span style={{color:'#f59e0b', fontWeight:'700'}}>⭐ {(w.workerProfile?.rating||0).toFixed(1)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <EmptyState icon="📊" text="No worker data yet" />}
              </div>
            </div>
          )}

          {/* -- BOOKINGS -- */}
          {activeTab === 'bookings' && (() => {
            const BOOKING_STATUS_MAP = {
              requested:             { bg:'#ede9fe', color:'#6366f1',  label:'Requested',           icon:'📋' },
              accepted:              { bg:'#dbeafe', color:'#2563eb',  label:'Accepted',             icon:'✅' },
              rejected:              { bg:'#fee2e2', color:'#dc2626',  label:'Rejected',             icon:'❌' },
              scheduled:             { bg:'#e0f2fe', color:'#0369a1',  label:'Scheduled',            icon:'📅' },
              'on-the-way':          { bg:'#fef3c7', color:'#ca8a04',  label:'On The Way',           icon:'🚗' },
              arrived:               { bg:'#fef9c3', color:'#a16207',  label:'Arrived',              icon:'📍' },
              'in-progress':         { bg:'#ede9fe', color:'#7c3aed',  label:'In Progress',          icon:'🔧' },
              'waiting-for-payment': { bg:'#fff7ed', color:'#c2410c',  label:'Waiting Payment',      icon:'💳' },
              completed:             { bg:'#dcfce7', color:'#16a34a',  label:'Completed',            icon:'✓' },
              cancelled:             { bg:'#f3f4f6', color:'#6b7280',  label:'Cancelled',            icon:'✗' },
              disputed:              { bg:'#fef2f2', color:'#991b1b',  label:'Disputed',             icon:'⚠️' },
              pending:               { bg:'#ede9fe', color:'#6366f1',  label:'Requested',            icon:'📋' },
            };
            const bPill = (status) => { const c = BOOKING_STATUS_MAP[status]||{}; return <span style={{display:'inline-flex',alignItems:'center',gap:'0.2rem',background:c.bg,color:c.color,padding:'0.15rem 0.55rem',borderRadius:50,fontSize:'0.7rem',fontWeight:700,whiteSpace:'nowrap'}}>{c.icon} {c.label}</span>; };
            const payPill = (s) => { const c={paid:{bg:'#dcfce7',color:'#16a34a',l:'✓ Paid'},pending:{bg:'#fef3c7',color:'#92400e',l:'⏳ Pending'},refunded:{bg:'#dbeafe',color:'#1e40af',l:'↩ Refunded'},failed:{bg:'#fee2e2',color:'#991b1b',l:'✗ Failed'}}[s]||{bg:'#f3f4f6',color:'#6b7280',l:s}; return <span style={{background:c.bg,color:c.color,padding:'0.12rem 0.5rem',borderRadius:50,fontSize:'0.68rem',fontWeight:700}}>{c.l}</span>; };

            const filteredB = bookings.filter(b => {
              if (bookingFilter !== 'all' && b.status !== bookingFilter) return false;
              if (bookingSearch) {
                const q = bookingSearch.toLowerCase();
                return b.service?.toLowerCase().includes(q) || b.customer?.name?.toLowerCase().includes(q) || b.worker?.name?.toLowerCase().includes(q) || b._id?.includes(q);
              }
              return true;
            });

            const statusCounts = {};
            bookings.forEach(b => { statusCounts[b.status] = (statusCounts[b.status]||0) + 1; });
            const escalated = bookings.filter(b => b.hasDispute || b.status === 'disputed');

            return (
            <div style={{display:'flex', flexDirection:'column', gap:'1.25rem'}}>
              {/* Stats bar */}
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:'0.875rem'}}>
                {[
                  {label:'Total',    value:bookings.length,                                                                  color:'#6366f1'},
                  {label:'Active',   value:bookings.filter(b=>['requested','accepted','on-the-way','arrived','in-progress','waiting-for-payment'].includes(b.status)).length, color:'#f59e0b'},
                  {label:'Completed',value:bookings.filter(b=>b.status==='completed').length,                                color:'#10b981'},
                  {label:'Disputed', value:escalated.length,                                                                 color:'#ef4444'},
                  {label:'Unpaid',   value:bookings.filter(b=>b.paymentStatus==='pending'&&['waiting-for-payment','completed'].includes(b.status)).length, color:'#ca8a04'},
                ].map((s,i) => (
                  <div key={i} style={{background:'white', borderRadius:12, padding:'0.875rem 1rem', boxShadow:'0 1px 6px rgba(0,0,0,0.06)', borderLeft:`3px solid ${s.color}`}}>
                    <div style={{fontSize:'0.65rem', color:'#9ca3af', fontWeight:600, textTransform:'uppercase', marginBottom:'0.15rem'}}>{s.label}</div>
                    <div style={{fontSize:'1.35rem', fontWeight:800, color:'#1f2937'}}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Escalations alert */}
              {escalated.length > 0 && (
                <div style={{background:'#fef2f2', border:'1px solid #fecaca', borderRadius:12, padding:'0.875rem 1rem', display:'flex', alignItems:'center', gap:'0.75rem'}}>
                  <span style={{fontSize:'1.25rem'}}>⚠️</span>
                  <div>
                    <div style={{fontWeight:700, color:'#991b1b', fontSize:'0.875rem'}}>{escalated.length} Disputed / Escalated Booking{escalated.length>1?'s':''}</div>
                    <div style={{fontSize:'0.78rem', color:'#b91c1c'}}>Requires admin attention</div>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div style={{background:'white', borderRadius:12, padding:'1rem', boxShadow:'0 1px 6px rgba(0,0,0,0.06)', display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center'}}>
                <input value={bookingSearch} onChange={e => setBookingSearch(e.target.value)} placeholder="Search by service, customer, worker, ID..." style={{padding:'0.45rem 0.875rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.82rem', outline:'none', flex:1, minWidth:200}} />
                <select value={bookingFilter} onChange={e=>setBookingFilter(e.target.value)} style={{padding:'0.45rem 0.75rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.82rem', outline:'none', background:'white'}}>
                  <option value="all">All Statuses</option>
                  {Object.entries(BOOKING_STATUS_MAP).filter(([k])=>k!=='pending').map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                </select>
                <span style={{fontSize:'0.82rem', color:'#9ca3af'}}>{filteredB.length} results</span>
              </div>

              {/* Table */}
              <div style={{background:'white', borderRadius:12, boxShadow:'0 1px 6px rgba(0,0,0,0.06)', overflow:'hidden'}}>
                {filteredB.length === 0 ? <EmptyState icon="📋" text="No bookings found" /> : (
                  <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%', borderCollapse:'collapse', minWidth:800}}>
                      <thead>
                        <tr style={{borderBottom:'2px solid #f3f4f6', background:'#f9fafb'}}>
                          {['Service','Customer','Worker','Date','Amount','Status','Payment','Links'].map(h=>(
                            <th key={h} style={{padding:'0.75rem 1rem', textAlign:'left', fontSize:'0.72rem', color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.4px'}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredB.map(b => (
                          <tr key={b._id} style={{borderBottom:'1px solid #f9fafb', background: b.hasDispute?'#fef2f2': b.status==='waiting-for-payment'?'#fffbeb':'white'}}
                            onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}
                            onMouseLeave={e => e.currentTarget.style.background = b.hasDispute?'#fef2f2': b.status==='waiting-for-payment'?'#fffbeb':'white'}>
                            <td style={{padding:'0.75rem 1rem'}}>
                              <div style={{fontWeight:600, color:'#1f2937', fontSize:'0.875rem'}}>{b.service}</div>
                              {b.isEmergency && <span style={{background:'#fee2e2', color:'#dc2626', fontSize:'0.62rem', fontWeight:700, padding:'0.05rem 0.35rem', borderRadius:50}}>🚨 Emergency</span>}
                              <div style={{fontSize:'0.68rem', color:'#9ca3af', marginTop:'0.1rem'}}>#{b._id?.slice(-6)}</div>
                            </td>
                            <td style={{padding:'0.75rem 1rem'}}>
                              <div style={{fontWeight:600, color:'#1f2937', fontSize:'0.85rem'}}>{b.customer?.name||'—'}</div>
                              <div style={{color:'#9ca3af', fontSize:'0.72rem'}}>{b.customer?.phone}</div>
                            </td>
                            <td style={{padding:'0.75rem 1rem'}}>
                              <div style={{fontWeight:600, color:'#1f2937', fontSize:'0.85rem'}}>{b.worker?.name||'—'}</div>
                              <div style={{color:'#9ca3af', fontSize:'0.72rem'}}>{b.worker?.phone}</div>
                            </td>
                            <td style={{padding:'0.75rem 1rem', color:'#6b7280', fontSize:'0.82rem', whiteSpace:'nowrap'}}>{new Date(b.scheduledDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</td>
                            <td style={{padding:'0.75rem 1rem', fontWeight:700, color:'#1f2937'}}>₹{b.amount}</td>
                            <td style={{padding:'0.75rem 1rem'}}>{bPill(b.status)}</td>
                            <td style={{padding:'0.75rem 1rem'}}>{payPill(b.paymentStatus)}</td>
                            <td style={{padding:'0.75rem 1rem'}}>
                              <div style={{display:'flex', gap:'0.3rem', flexWrap:'wrap'}}>
                                {b.hasDispute && <span style={{background:'#fef2f2', color:'#991b1b', padding:'0.1rem 0.4rem', borderRadius:4, fontSize:'0.65rem', fontWeight:700}}>⚠️ Dispute</span>}
                                {b.paymentStatus==='pending' && ['waiting-for-payment','completed'].includes(b.status) && <span style={{background:'#fef3c7', color:'#92400e', padding:'0.1rem 0.4rem', borderRadius:4, fontSize:'0.65rem', fontWeight:700}}>💳 Unpaid</span>}
                                {b.timeline?.length > 0 && <span style={{background:'#f3f4f6', color:'#6b7280', padding:'0.1rem 0.4rem', borderRadius:4, fontSize:'0.65rem'}}>{b.timeline.length} events</span>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            );
          })()}

          {/* -- WORKERS -- */}
          {activeTab === 'workers' && (
            <div style={{background:'white', borderRadius:'16px', padding:'1.5rem', boxShadow:'0 1px 8px rgba(0,0,0,0.07)'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', gap:'1rem'}}>
                <h3 style={{margin:0, color:'#1f2937', fontWeight:'700'}}>All Workers ({filteredWorkers.length})</h3>
                <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap', alignItems:'center'}}>
                  {/* Download buttons */}
                  {[['csv','📄 CSV'],['excel','📊 Excel'],['json','🗂 JSON']].map(([fmt,label])=>(
                    <button key={fmt} onClick={()=>{
                      const base = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
                      const token = localStorage.getItem('token');
                      window.open(`${base}/admin/export?type=workers&format=${fmt}&token=${token}`,'_blank');
                    }} style={{padding:'0.4rem 0.75rem',background:'#f0fdf4',color:'#065f46',border:'1px solid #6ee7b7',borderRadius:7,cursor:'pointer',fontSize:'0.78rem',fontWeight:600}}>
                      {label}
                    </button>
                  ))}
                  <select value={workerTrustFilter} onChange={e=>setWorkerTrustFilter(e.target.value)} style={{padding:'0.5rem 0.75rem', border:'2px solid #e5e7eb', borderRadius:'8px', fontSize:'0.85rem', outline:'none', background:'white'}}>
                    <option value="all">All Trust Levels</option>
                    <option value="high">High Trust (70+)</option>
                    <option value="low">Low Trust (&lt;40)</option>
                  </select>
                  <input value={workerSearch} onChange={e=>setWorkerSearch(e.target.value)} placeholder="Search workers..." style={{padding:'0.5rem 1rem', border:'2px solid #e5e7eb', borderRadius:'8px', fontSize:'0.9rem', outline:'none', width:200}} />
                </div>
              </div>
              {filteredWorkers.length === 0 ? <EmptyState icon="📊" text="No workers found" /> : (
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%', borderCollapse:'collapse', minWidth:800}}>
                    <thead><tr style={{borderBottom:'2px solid #f3f4f6', background:'#f9fafb'}}>{['Worker','Contact','Skills','Exp','Rate','Rating','Profile %','Trust','Status','Actions'].map(h=><th key={h} style={{padding:'0.75rem 1rem', textAlign:'left', fontSize:'0.8rem', color:'#9ca3af', fontWeight:'600', textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
                    <tbody>
                      {filteredWorkers.map(w=>(
                        <tr key={w._id} style={{borderBottom:'1px solid #f9fafb'}}>
                          <td style={{padding:'0.75rem 1rem'}}>
                            <div style={{display:'flex', alignItems:'center', gap:'0.75rem'}}>
                              <Avatar user={w} size={36} />
                              <div>
                                <div style={{fontWeight:'600', color:'#1f2937', fontSize:'0.9rem'}}>{w.name}</div>
                                <div style={{color:'#9ca3af', fontSize:'0.75rem'}}>{w.workerProfile?.totalJobs||0} jobs</div>
                              </div>
                            </div>
                          </td>
                          <td style={{padding:'0.75rem 1rem'}}>
                            <div style={{fontSize:'0.85rem', color:'#374151'}}>{w.email}</div>
                            <div style={{fontSize:'0.78rem', color:'#9ca3af'}}>{w.phone}</div>
                          </td>
                          <td style={{padding:'0.75rem 1rem', fontSize:'0.85rem', color:'#6b7280'}}>{w.workerProfile?.skills?.slice(0,2).join(', ')}{w.workerProfile?.skills?.length>2?'…':''}</td>
                          <td style={{padding:'0.75rem 1rem', color:'#6b7280', fontSize:'0.85rem'}}>{w.workerProfile?.experience}yr</td>
                          <td style={{padding:'0.75rem 1rem', fontWeight:'600', color:'#1f2937'}}>₹{w.workerProfile?.hourlyRate}/hr</td>
                          <td style={{padding:'0.75rem 1rem'}}><span style={{color:'#f59e0b', fontWeight:'700'}}>⭐ {(w.workerProfile?.rating||0).toFixed(1)}</span></td>
                          <td style={{padding:'0.75rem 1rem'}}>
                            {(() => {
                              const pct = w.profileCompletion?.percentage ?? 0;
                              const c = pct >= 80 ? '#10b981' : pct >= 50 ? '#6366f1' : '#f59e0b';
                              return (
                                <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                                  <div style={{width:48, height:5, background:'#f3f4f6', borderRadius:3, overflow:'hidden'}}>
                                    <div style={{height:'100%', width:`${pct}%`, background:c, borderRadius:3}} />
                                  </div>
                                  <span style={{fontSize:'0.78rem', fontWeight:700, color:c}}>{pct}%</span>
                                </div>
                              );
                            })()}
                          </td>
                          {/* Trust score cell */}
                          <td style={{padding:'0.75rem 1rem'}}>
                            {(() => {
                              const ts = w.trustScore;
                              if (!ts) return <span style={{color:'#9ca3af', fontSize:'0.78rem'}}>—</span>;
                              const colors = {Platinum:'#6366f1',Gold:'#f59e0b',Silver:'#6b7280',Bronze:'#b45309',New:'#9ca3af'};
                              const bgs = {Platinum:'#ede9fe',Gold:'#fef3c7',Silver:'#f3f4f6',Bronze:'#fef3c7',New:'#f9fafb'};
                              const emojis = {Platinum:'💎',Gold:'🥇',Silver:'🥈',Bronze:'🥉',New:'🌱'};
                              const c = colors[ts.level] || '#9ca3af';
                              const bg = bgs[ts.level] || '#f9fafb';
                              return (
                                <span style={{background:bg, color:c, padding:'0.2rem 0.5rem', borderRadius:50, fontSize:'0.75rem', fontWeight:700, whiteSpace:'nowrap'}}>
                                  {emojis[ts.level]} {ts.score}
                                </span>
                              );
                            })()}
                          </td>
                          <td style={{padding:'0.75rem 1rem'}}><StatusBadge status={w.workerProfile?.verificationStatus} /></td>                          <td style={{padding:'0.75rem 1rem'}}>
                            <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap'}}>
                              <button onClick={()=>{ setWorkerDetailModal(w); loadWorkerRequests(w._id); }} style={{padding:'0.35rem 0.75rem', background:'#ede9fe', color:'#7c3aed', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600'}}>View</button>
                              <button onClick={()=>{ setChangeRequestModal(w); setCrItems([{ fieldName:'', oldValue:'', suggestedValue:'', reason:'' }]); setCrPriority('medium'); }} style={{padding:'0.35rem 0.75rem', background:'#dbeafe', color:'#1e40af', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600'}}>Request</button>
                              <button onClick={()=>openWorkerChat(w)} style={{padding:'0.35rem 0.75rem', background:'#d1fae5', color:'#065f46', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600'}}>Chat</button>
                              <button onClick={()=>setDeleteModal(w)} style={{padding:'0.35rem 0.75rem', background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600'}}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* -- CUSTOMERS -- */}
          {activeTab === 'customers' && (
            <div style={{background:'white', borderRadius:'16px', padding:'1.5rem', boxShadow:'0 1px 8px rgba(0,0,0,0.07)'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', gap:'1rem'}}>
                <h3 style={{margin:0, color:'#1f2937', fontWeight:'700'}}>All Customers ({filteredCustomers.length})</h3>
                <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap', alignItems:'center'}}>
                  {/* Download buttons */}
                  {[['csv','📄 CSV'],['excel','📊 Excel'],['json','🗂 JSON']].map(([fmt,label])=>(
                    <button key={fmt} onClick={()=>{
                      const base = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
                      const token = localStorage.getItem('token');
                      window.open(`${base}/admin/export?type=customers&format=${fmt}&token=${token}`,'_blank');
                    }} style={{padding:'0.4rem 0.75rem',background:'#eff6ff',color:'#1e40af',border:'1px solid #93c5fd',borderRadius:7,cursor:'pointer',fontSize:'0.78rem',fontWeight:600}}>
                      {label}
                    </button>
                  ))}
                  <select value={customerTrustFilter} onChange={e=>setCustomerTrustFilter(e.target.value)} style={{padding:'0.5rem 0.75rem', border:'2px solid #e5e7eb', borderRadius:'8px', fontSize:'0.85rem', outline:'none', background:'white'}}>
                    <option value="all">All Trust Levels</option>
                    <option value="high">High Trust (70+)</option>
                    <option value="low">Low Trust (&lt;40)</option>
                  </select>
                  <input value={customerSearch} onChange={e=>setCustomerSearch(e.target.value)} placeholder="Search customers..." style={{padding:'0.5rem 1rem', border:'2px solid #e5e7eb', borderRadius:'8px', fontSize:'0.9rem', outline:'none', width:200}} />
                </div>
              </div>
              {filteredCustomers.length === 0 ? <EmptyState icon="📊" text="No customers found" /> : (
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%', borderCollapse:'collapse', minWidth:700}}>
                    <thead><tr style={{borderBottom:'2px solid #f3f4f6', background:'#f9fafb'}}>{['Customer','Email','Phone','Loyalty Pts','Total Spent','Profile %','Trust','Joined','Actions'].map(h=><th key={h} style={{padding:'0.75rem 1rem', textAlign:'left', fontSize:'0.8rem', color:'#9ca3af', fontWeight:'600', textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
                    <tbody>
                      {filteredCustomers.map(c=>(
                        <tr key={c._id} style={{borderBottom:'1px solid #f9fafb'}}>
                          <td style={{padding:'0.75rem 1rem'}}>
                            <div style={{display:'flex', alignItems:'center', gap:'0.75rem'}}>
                              <Avatar user={c} size={36} />
                              <span style={{fontWeight:'600', color:'#1f2937', fontSize:'0.9rem'}}>{c.name}</span>
                            </div>
                          </td>
                          <td style={{padding:'0.75rem 1rem', fontSize:'0.85rem', color:'#374151'}}>{c.email}</td>
                          <td style={{padding:'0.75rem 1rem', fontSize:'0.85rem', color:'#6b7280'}}>{c.phone}</td>
                          <td style={{padding:'0.75rem 1rem'}}><span style={{background:'#fef3c7', color:'#92400e', padding:'0.2rem 0.6rem', borderRadius:'50px', fontSize:'0.8rem', fontWeight:'600'}}>🏅 {c.loyaltyPoints||0}</span></td>
                          <td style={{padding:'0.75rem 1rem', fontWeight:'700', color:'#1f2937'}}>₹{c.totalSpent||0}</td>
                          <td style={{padding:'0.75rem 1rem'}}>
                            {(() => {
                              const pct = c.profileCompletion?.percentage ?? 0;
                              const col = pct >= 80 ? '#10b981' : pct >= 50 ? '#6366f1' : '#f59e0b';
                              return (
                                <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                                  <div style={{width:48, height:5, background:'#f3f4f6', borderRadius:3, overflow:'hidden'}}>
                                    <div style={{height:'100%', width:`${pct}%`, background:col, borderRadius:3}} />
                                  </div>
                                  <span style={{fontSize:'0.78rem', fontWeight:700, color:col}}>{pct}%</span>
                                </div>
                              );
                            })()}
                          </td>
                          {/* Customer trust score cell */}
                          <td style={{padding:'0.75rem 1rem'}}>
                            {(() => {
                              const ts = c.trustScore;
                              if (!ts) return <span style={{color:'#9ca3af', fontSize:'0.78rem'}}>—</span>;
                              const colors = {Platinum:'#6366f1',Gold:'#f59e0b',Silver:'#6b7280',Bronze:'#b45309',New:'#9ca3af'};
                              const bgs = {Platinum:'#ede9fe',Gold:'#fef3c7',Silver:'#f3f4f6',Bronze:'#fef3c7',New:'#f9fafb'};
                              const emojis = {Platinum:'💎',Gold:'🥇',Silver:'🥈',Bronze:'🥉',New:'🌱'};
                              const col = colors[ts.level] || '#9ca3af';
                              const bg = bgs[ts.level] || '#f9fafb';
                              return (
                                <span style={{background:bg, color:col, padding:'0.2rem 0.5rem', borderRadius:50, fontSize:'0.75rem', fontWeight:700, whiteSpace:'nowrap'}}>
                                  {emojis[ts.level]} {ts.score}
                                </span>
                              );
                            })()}
                          </td>
                          <td style={{padding:'0.75rem 1rem', color:'#9ca3af', fontSize:'0.85rem'}}>{new Date(c.createdAt).toLocaleDateString()}</td>                          <td style={{padding:'0.75rem 1rem'}}>
                            <div style={{display:'flex', gap:'0.5rem'}}>
                              <button onClick={()=>openCustomerChat(c)} style={{padding:'0.35rem 0.75rem', background:'#dbeafe', color:'#1e40af', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600'}}>💬 Chat</button>
                              <button onClick={async()=>{ await api.patch(`/profile/trusted/${c._id}`, { trusted: !c.trustedCustomer, note:'Granted by admin' }); toast.success(c.trustedCustomer?'Badge removed':'Trusted badge granted!'); fetchAll(); }} style={{padding:'0.35rem 0.75rem', background: c.trustedCustomer?'#fef3c7':'#f3f4f6', color: c.trustedCustomer?'#92400e':'#6b7280', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600'}}>
                                {c.trustedCustomer ? '🏅 Revoke' : '🏅 Trust'}
                              </button>
                              <button onClick={()=>setDeleteModal(c)} style={{padding:'0.35rem 0.75rem', background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600'}}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* --'⏳ Pending Verifications -- */}
          {activeTab === 'pending' && (
            <div>
              <h3 style={{margin:'0 0 1.5rem', color:'#1f2937', fontWeight:'700'}}>⏳ Pending Verifications ({pendingWorkers.length})</h3>
              {pendingWorkers.length === 0 ? <EmptyState icon="✅" text="All workers verified — no pending requests" /> : (
                <div style={{display:'grid', gap:'1.25rem'}}>
                  {pendingWorkers.map(w=>(
                    <div key={w._id} style={{background:'white', borderRadius:'16px', padding:'1.5rem', boxShadow:'0 1px 8px rgba(0,0,0,0.07)'}}>
                      <div style={{display:'flex', alignItems:'flex-start', gap:'1.5rem', flexWrap:'wrap'}}>
                        <Avatar user={w} size={56} />
                        <div style={{flex:1, minWidth:200}}>
                          <div style={{fontWeight:'700', color:'#1f2937', fontSize:'1.05rem'}}>{w.name}</div>
                          <div style={{color:'#6b7280', fontSize:'0.85rem', marginTop:'0.25rem'}}>{w.email} · {w.phone}</div>
                          <div style={{display:'flex', gap:'0.5rem', marginTop:'0.5rem', flexWrap:'wrap'}}>
                            {w.workerProfile?.skills?.map(s=><span key={s} style={{background:'#ede9fe', color:'#7c3aed', padding:'0.2rem 0.6rem', borderRadius:'50px', fontSize:'0.78rem', fontWeight:'600'}}>{s}</span>)}
                          </div>
                          <div style={{display:'flex', gap:'1.5rem', marginTop:'0.5rem', fontSize:'0.85rem', color:'#6b7280'}}>
                            <span>📅 {w.workerProfile?.experience} yrs exp</span>
                            <span>💰 ₹{w.workerProfile?.hourlyRate}/hr</span>
                            <span>📍 {w.location?.address || 'No address'}</span>
                          </div>
                          {w.workerProfile?.bio && <p style={{margin:'0.5rem 0 0', color:'#6b7280', fontSize:'0.85rem', fontStyle:'italic'}}>"{w.workerProfile.bio}"</p>}

                          {/* Document previews */}
                          <div style={{display:'flex', gap:'1rem', marginTop:'1rem', flexWrap:'wrap'}}>
                            {w.workerProfile?.idDocument ? (
                              <div style={{textAlign:'center'}}>
                                <div style={{fontSize:'0.72rem', color:'#9ca3af', fontWeight:600, marginBottom:'0.35rem', textTransform:'uppercase'}}>
                                  {w.workerProfile?.idDocumentType || 'ID'} Document
                                </div>
                                <img src={w.workerProfile.idDocument} alt="ID" style={{width:120, height:80, objectFit:'cover', borderRadius:8, border:'1px solid #e5e7eb', cursor:'pointer'}}
                                  onClick={() => window.open(w.workerProfile.idDocument, '_blank')} />
                              </div>
                            ) : (
                              <div style={{width:120, height:80, background:'#f3f4f6', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', color:'#9ca3af', textAlign:'center', padding:'0.5rem'}}>
                                No ID uploaded
                              </div>
                            )}
                            {w.workerProfile?.photoVerification ? (
                              <div style={{textAlign:'center'}}>
                                <div style={{fontSize:'0.72rem', color:'#9ca3af', fontWeight:600, marginBottom:'0.35rem', textTransform:'uppercase'}}>Verification Selfie</div>
                                <img src={w.workerProfile.photoVerification} alt="Selfie" style={{width:80, height:80, objectFit:'cover', borderRadius:'50%', border:'2px solid #6366f1', cursor:'pointer'}}
                                  onClick={() => window.open(w.workerProfile.photoVerification, '_blank')} />
                              </div>
                            ) : (
                              <div style={{width:80, height:80, background:'#f3f4f6', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', color:'#9ca3af', textAlign:'center', padding:'0.5rem'}}>
                                No selfie
                              </div>
                            )}
                          </div>

                          {/* Submitted date */}
                          {w.workerProfile?.verificationSubmittedAt && (
                            <div style={{marginTop:'0.75rem', fontSize:'0.78rem', color:'#9ca3af'}}>
                              Submitted: {new Date(w.workerProfile.verificationSubmittedAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                        <div style={{display:'flex', flexDirection:'column', gap:'0.5rem', flexShrink:0}}>
                          <button onClick={()=>handleVerify(w._id,'verified')} style={{padding:'0.6rem 1.5rem', background:'#10b981', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'700', fontSize:'0.9rem'}}>✓ Verify</button>
                          <button onClick={()=>{
                            const reason = window.prompt('Rejection reason (shown to worker):');
                            if (reason !== null) api.patch(`/profile/verify/${w._id}/admin`, { status:'rejected', reason }).then(()=>{ toast.success('Worker rejected'); fetchAll(); }).catch(()=>toast.error('Failed'));
                          }} style={{padding:'0.6rem 1.5rem', background:'#ef4444', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'700', fontSize:'0.9rem'}}>✗ Reject</button>
                          <button onClick={()=>{
                            const reason = window.prompt('What needs to be resubmitted? (shown to worker)');
                            if (reason !== null) api.patch(`/profile/verify/${w._id}/admin`, { status:'resubmission-required', reason }).then(()=>{ toast.success('Resubmission requested'); fetchAll(); }).catch(()=>toast.error('Failed'));
                          }} style={{padding:'0.6rem 1.5rem', background:'#f59e0b', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'0.82rem'}}>🔄 Resubmit</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* -- DISPUTES -- */}
          {activeTab === 'disputes' && (
            <div>
              <h3 style={{margin:'0 0 1.5rem', color:'#1f2937', fontWeight:'700'}}>⚠️ Disputes ({disputes.length})</h3>
              {disputes.length === 0 ? <EmptyState icon="🕊️" text="No disputes raised — platform is running smoothly" /> : (
                <div style={{display:'grid', gap:'1rem'}}>
                  {disputes.map(d=>{
                    const statusColors = {
                      'open':{'bg':'#fee2e2','color':'#991b1b'},
                      'under-review':{'bg':'#fef3c7','color':'#92400e'},
                      'evidence-requested':{'bg':'#ffedd5','color':'#c2410c'},
                      'mediation':{'bg':'#ede9fe','color':'#6d28d9'},
                      'partial-settlement':{'bg':'#dbeafe','color':'#1d4ed8'},
                      'refund-review':{'bg':'#cffafe','color':'#0e7490'},
                      'warning-issued':{'bg':'#fef9c3','color':'#854d0e'},
                      'penalty-applied':{'bg':'#fee2e2','color':'#7f1d1d'},
                      'resolved-customer':{'bg':'#d1fae5','color':'#065f46'},
                      'resolved-worker':{'bg':'#ccfbf1','color':'#134e4a'},
                      'closed':{'bg':'#f3f4f6','color':'#374151'},
                      'reopened':{'bg':'#ffedd5','color':'#9a3412'},
                    };
                    const sc = statusColors[d.status] || statusColors['open'];
                    const isFinal = ['resolved-customer','resolved-worker','closed'].includes(d.status);
                    return (
                    <div key={d._id} style={{background:'white', borderRadius:'16px', padding:'1.5rem', boxShadow:'0 1px 8px rgba(0,0,0,0.07)', borderLeft:`4px solid ${sc.color}`}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem'}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.5rem', flexWrap:'wrap'}}>
                            <span style={{background:sc.bg, color:sc.color, padding:'0.2rem 0.75rem', borderRadius:50, fontSize:'0.78rem', fontWeight:700}}>{d.status?.replace(/-/g,' ')}</span>
                            <span style={{fontWeight:'700', color:'#1f2937'}}>{d.reason?.replace(/-/g,' ')}</span>
                          </div>
                          <p style={{color:'#6b7280', fontSize:'0.9rem', margin:'0 0 0.75rem'}}>{d.description}</p>
                          <div style={{display:'flex', gap:'1.5rem', fontSize:'0.85rem', color:'#9ca3af', flexWrap:'wrap'}}>
                            <span>👤 Raised by: <strong style={{color:'#374151'}}>{d.raisedBy?.name}</strong> ({d.raisedBy?.role})</span>
                            <span>⚡ Against: <strong style={{color:'#374151'}}>{d.against?.name}</strong></span>
                            <span>📋 Booking: {d.booking?.service}</span>
                            <span>📅 {new Date(d.createdAt).toLocaleDateString()}</span>
                          </div>
                          {d.evidenceNote && <div style={{marginTop:'0.75rem', padding:'0.75rem', background:'#f0f9ff', borderRadius:'8px', fontSize:'0.85rem', color:'#0369a1', borderLeft:'3px solid #0ea5e9'}}>📎 Evidence: {d.evidenceNote}</div>}
                          {d.resolutionNote && <div style={{marginTop:'0.75rem', padding:'0.75rem', background:'#f0fdf4', borderRadius:'8px', fontSize:'0.85rem', color:'#166534'}}>✅ Resolution: {d.resolutionNote}</div>}
                          {d.refundAmount > 0 && <div style={{marginTop:'0.5rem', fontSize:'0.85rem', color:'#065f46', fontWeight:700}}>💰 Refund: ₹{d.refundAmount}</div>}
                          {d.penaltyAmount > 0 && <div style={{marginTop:'0.25rem', fontSize:'0.85rem', color:'#991b1b', fontWeight:700}}>⚠️ Penalty: ₹{d.penaltyAmount}</div>}
                        </div>
                        {!isFinal && (
                          <button onClick={()=>setResolveModal({...d, note:'', refund:0, penalty:0, settlement:0, warning:'', resolution:'under-review'})} style={{padding:'0.6rem 1.25rem', background:'#6366f1', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'0.85rem', flexShrink:0}}>
                            Take Action
                          </button>
                        )}
                        {isFinal && (
                          <button onClick={()=>setResolveModal({...d, note:'', refund:0, penalty:0, settlement:0, warning:'', resolution:'reopened'})} style={{padding:'0.6rem 1.25rem', background:'#f3f4f6', color:'#374151', border:'1px solid #e5e7eb', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'0.85rem', flexShrink:0}}>
                            Reopen
                          </button>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* -- QUOTES -- */}
          {activeTab === 'quotes' && (
            <div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem'}}>
                <div>
                  <h3 style={{margin:0, color:'#1f2937', fontWeight:700}}>📊 Quote Review Panel</h3>
                  <div style={{fontSize:'0.8rem', color:'#9ca3af', marginTop:'0.2rem'}}>
                    {quotes.filter(q=>q.status==='admin-review').length} flagged · {quotes.filter(q=>q.status==='accepted').length} accepted · {quotes.filter(q=>q.status==='negotiating').length} negotiating
                  </div>
                </div>
                <button onClick={() => api.get('/quotes/admin/review').then(r => setQuotes(r.data)).catch(() => {})} style={{background:'none', border:'1px solid #e5e7eb', color:'#6366f1', cursor:'pointer', fontSize:'0.82rem', fontWeight:600, padding:'0.4rem 0.875rem', borderRadius:8}}>↻ Refresh</button>
              </div>
              {quotes.length === 0 ? <EmptyState icon="📊" text="No quotes pending admin review" /> : (
                <div style={{display:'grid', gap:'1rem'}}>
                  {quotes.map(q => {
                    const ratio = q.baseRate > 0 ? (q.quotedAmount / q.baseRate) : 0;
                    const flagColor = ratio > 2 ? '#dc2626' : ratio > 1.5 ? '#f59e0b' : '#10b981';
                    const statusMap = { new:{bg:'#ede9fe',color:'#6366f1',label:'New'}, viewed:{bg:'#dbeafe',color:'#2563eb',label:'Viewed'}, negotiating:{bg:'#fef3c7',color:'#ca8a04',label:'Negotiating'}, accepted:{bg:'#dcfce7',color:'#16a34a',label:'Accepted'}, rejected:{bg:'#fee2e2',color:'#dc2626',label:'Rejected'}, expired:{bg:'#f3f4f6',color:'#6b7280',label:'Expired'}, 'admin-review':{bg:'#f3e8ff',color:'#9333ea',label:'Admin Review'} };
                    const sc = statusMap[q.status] || statusMap['new'];
                    return (
                      <div key={q._id} style={{background:'white', borderRadius:16, padding:'1.5rem', boxShadow:'0 1px 8px rgba(0,0,0,0.07)', borderLeft:`4px solid ${q.adminReviewRequired ? '#f59e0b' : '#e5e7eb'}`}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem', marginBottom:'1rem'}}>
                          <div style={{flex:1}}>
                            <div style={{display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap', marginBottom:'0.35rem'}}>
                              <span style={{fontWeight:700, color:'#1f2937', fontSize:'0.95rem'}}>{q.booking?.service}</span>
                              <span style={{background:sc.bg, color:sc.color, padding:'0.1rem 0.5rem', borderRadius:50, fontSize:'0.7rem', fontWeight:700}}>{sc.label}</span>
                              {q.adminReviewRequired && <span style={{background:'#fef3c7', color:'#92400e', padding:'0.1rem 0.5rem', borderRadius:50, fontSize:'0.7rem', fontWeight:700}}>⚠️ Flagged</span>}
                            </div>
                            <div style={{fontSize:'0.82rem', color:'#6b7280'}}>
                              Worker: <strong>{q.worker?.name}</strong> · Customer: <strong>{q.customer?.name}</strong>
                            </div>
                          </div>
                          <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap', alignItems:'center'}}>
                            {q.status === 'admin-review' && <>
                              <button onClick={() => handleAdminDecideQuote(q._id,'approved')} style={{padding:'0.45rem 1rem', background:'#10b981', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.82rem'}}>✓ Approve</button>
                              <button onClick={() => handleAdminDecideQuote(q._id,'rejected')} style={{padding:'0.45rem 1rem', background:'#ef4444', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.82rem'}}>✗ Reject</button>
                            </>}
                          </div>
                        </div>

                        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:'0.75rem', marginBottom:'1rem'}}>
                          {[
                            { label:'Base Rate', value:'₹' + (q.baseRate||0) + '/hr', color:'#6b7280' },
                            { label:'Quoted', value:'₹' + q.quotedAmount, color: flagColor },
                            q.counterAmount && { label:'Counter', value:'₹' + q.counterAmount, color:'#ca8a04' },
                            q.finalAmount   && { label:'Agreed',  value:'₹' + q.finalAmount,   color:'#16a34a' },
                            { label:'Ratio', value: ratio > 0 ? ratio.toFixed(1) + 'x base' : '—', color: flagColor },
                          ].filter(Boolean).map((item, i) => (
                            <div key={i} style={{background:'#f9fafb', borderRadius:8, padding:'0.6rem 0.875rem'}}>
                              <div style={{fontSize:'0.65rem', color:'#9ca3af', fontWeight:600, textTransform:'uppercase', marginBottom:'0.2rem'}}>{item.label}</div>
                              <div style={{fontWeight:700, color: item.color, fontSize:'0.95rem'}}>{item.value}</div>
                            </div>
                          ))}
                        </div>

                        <div style={{display:'flex', gap:'1.5rem', flexWrap:'wrap', fontSize:'0.78rem', color:'#9ca3af', marginBottom: q.notes || q.flagReason ? '0.75rem' : 0}}>
                          {q.estimatedHours && <span>⏱ {q.estimatedHours}h</span>}
                          {q.validUntil && <span>⏳ Valid until {new Date(q.validUntil).toLocaleDateString()}</span>}
                          <span>📨 {new Date(q.createdAt).toLocaleDateString()}</span>
                          {q.viewedByCustomer && <span style={{color:'#10b981'}}>👁 Viewed</span>}
                          {q.questions?.length > 0 && <span style={{color:'#6366f1'}}>❓ {q.questions.length} question{q.questions.length > 1 ? 's' : ''}</span>}
                        </div>

                        {q.flagReason && <div style={{background:'#fef3c7', borderRadius:8, padding:'0.5rem 0.875rem', fontSize:'0.8rem', color:'#92400e', marginBottom:'0.5rem'}}>⚠️ {q.flagReason}</div>}
                        {q.notes && <div style={{background:'#f9fafb', borderRadius:8, padding:'0.5rem 0.875rem', fontSize:'0.82rem', color:'#374151', fontStyle:'italic'}}>"{q.notes}"</div>}
                        {q.adminNote && <div style={{background:'#f3e8ff', borderRadius:8, padding:'0.5rem 0.875rem', fontSize:'0.8rem', color:'#7c3aed', marginTop:'0.5rem'}}>🛡️ Admin note: {q.adminNote}</div>}

                        {q.history?.length > 0 && (
                          <div style={{marginTop:'0.875rem', paddingTop:'0.875rem', borderTop:'1px solid #f3f4f6'}}>
                            <div style={{fontSize:'0.7rem', color:'#9ca3af', fontWeight:600, textTransform:'uppercase', marginBottom:'0.4rem'}}>History</div>
                            <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap'}}>
                              {q.history.map((h, i) => (
                                <span key={i} style={{background:'#f3f4f6', color:'#374151', padding:'0.1rem 0.5rem', borderRadius:4, fontSize:'0.72rem', fontWeight:600}}>
                                  {h.action}{h.amount ? ' ₹' + h.amount : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* -- PAYMENTS -- */}
          {activeTab === 'payments' && (() => {
            const fmt = (n) => `₹${(n||0).toLocaleString('en-IN')}`;
            const s = finData?.summary || {};
            const txns = finData?.transactions || [];
            const payouts = finData?.payouts || [];
            const monthly = finData?.monthly || [];
            const filteredPayouts = payoutFilter === 'all' ? payouts : payouts.filter(p => p.payoutStatus === payoutFilter);
            const PSTATUS = { pending:{bg:'#fef3c7',color:'#92400e',l:'Pending'}, processing:{bg:'#dbeafe',color:'#1e40af',l:'Processing'}, credited:{bg:'#dcfce7',color:'#16a34a',l:'Credited'}, failed:{bg:'#fee2e2',color:'#dc2626',l:'Failed'}, 'on-hold':{bg:'#f3f4f6',color:'#6b7280',l:'On Hold'} };
            const pChip = (st) => { const c=PSTATUS[st]||PSTATUS.pending; return <span style={{background:c.bg,color:c.color,padding:'0.12rem 0.5rem',borderRadius:50,fontSize:'0.68rem',fontWeight:700,whiteSpace:'nowrap'}}>{c.l}</span>; };
            return (
            <div style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
              <div style={{background:'white', borderRadius:12, padding:'1rem 1.25rem', boxShadow:'0 1px 6px rgba(0,0,0,0.06)', display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'center'}}>
                <span style={{fontWeight:600, color:'#374151', fontSize:'0.875rem'}}>Filter:</span>
                <input type="date" value={finDateFrom} onChange={e=>setFinDateFrom(e.target.value)} style={{padding:'0.4rem 0.75rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.82rem', outline:'none'}} />
                <span style={{color:'#9ca3af'}}>to</span>
                <input type="date" value={finDateTo} onChange={e=>setFinDateTo(e.target.value)} style={{padding:'0.4rem 0.75rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.82rem', outline:'none'}} />
                {(finDateFrom||finDateTo) && <button onClick={()=>{setFinDateFrom('');setFinDateTo('');}} style={{padding:'0.4rem 0.75rem', background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:8, cursor:'pointer', fontSize:'0.78rem', fontWeight:600}}>Clear</button>}
                <div style={{marginLeft:'auto', display:'flex', gap:'0.25rem', background:'#f3f4f6', borderRadius:8, padding:'0.2rem'}}>
                  {[['overview','Overview'],['transactions','Transactions'],['payouts','Payouts'],['settings','Settings']].map(([k,l]) => (
                    <button key={k} onClick={() => setActiveFinTab(k)} style={{padding:'0.35rem 0.875rem', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600, fontSize:'0.78rem', background:activeFinTab===k?'white':'transparent', color:activeFinTab===k?'#1f2937':'#6b7280', boxShadow:activeFinTab===k?'0 1px 4px rgba(0,0,0,0.1)':''}}>{l}</button>
                  ))}
                </div>
              </div>

              {finLoading ? (
                <div style={{textAlign:'center', padding:'3rem', color:'#9ca3af'}}>
                  <div style={{width:36, height:36, border:'3px solid #e5e7eb', borderTopColor:'#10b981', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 1rem'}} />
                  Loading financial data...
                </div>
              ) : (<>

              {activeFinTab === 'overview' && (<>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:'1rem'}}>
                  {[
                    {icon:'💰', label:'Customer Paid',    value:fmt(s.totalCustomerPaid),  color:'#10b981'},
                    {icon:'🏦', label:'Platform Fee',     value:fmt(s.totalPlatformFee),   color:'#6366f1'},
                    {icon:'🛡️', label:'Support Fee',      value:fmt(s.totalSupportFee),    color:'#8b5cf6'},
                    {icon:'🚨', label:'Urgent Fee',       value:fmt(s.totalUrgentFee),     color:'#ef4444'},
                    {icon:'📊', label:'Commission',       value:fmt(s.totalCommission),    color:'#f59e0b'},
                    {icon:'🧾', label:'Tax (GST)',         value:fmt(s.totalTaxCollected),  color:'#0ea5e9'},
                    {icon:'👷', label:'Worker Payouts',   value:fmt(s.totalWorkerPayouts), color:'#059669'},
                    {icon:'📈', label:'Net Profit',       value:fmt(s.netProfit),          color:'#1f2937'},
                  ].map((c,i) => (
                    <div key={i} style={{background:'white', borderRadius:12, padding:'1rem 1.1rem', boxShadow:'0 1px 6px rgba(0,0,0,0.06)', borderLeft:`4px solid ${c.color}`}}>
                      <div style={{display:'flex', alignItems:'center', gap:'0.6rem'}}>
                        <div style={{width:36, height:36, borderRadius:8, background:c.color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', flexShrink:0}}>{c.icon}</div>
                        <div>
                          <div style={{fontSize:'1.2rem', fontWeight:800, color:'#1f2937', lineHeight:1}}>{c.value}</div>
                          <div style={{fontSize:'0.65rem', fontWeight:600, color:'#9ca3af', marginTop:'0.1rem', textTransform:'uppercase', letterSpacing:'0.3px'}}>{c.label}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {monthly.length > 0 && (
                  <div style={{background:'white', borderRadius:14, padding:'1.5rem', boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}}>
                    <h3 style={{margin:'0 0 1.25rem', fontWeight:700, color:'#1f2937', fontSize:'0.95rem'}}>📅 Monthly Revenue Trend</h3>
                    <div style={{overflowX:'auto'}}>
                      <table style={{width:'100%', borderCollapse:'collapse', minWidth:600}}>
                        <thead><tr style={{borderBottom:'2px solid #f3f4f6', background:'#f9fafb'}}>
                          {['Month','Fee Revenue','Commission','Tax','Worker Payouts','Net Profit'].map(h => (
                            <th key={h} style={{padding:'0.65rem 0.875rem', textAlign:'left', fontSize:'0.7rem', color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.4px'}}>{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {monthly.map((m,i) => (
                            <tr key={i} style={{borderBottom:'1px solid #f9fafb'}}>
                              <td style={{padding:'0.65rem 0.875rem', fontWeight:600, color:'#1f2937', fontSize:'0.875rem'}}>{m.month}</td>
                              <td style={{padding:'0.65rem 0.875rem', color:'#6366f1', fontWeight:600}}>{fmt(m.revenue)}</td>
                              <td style={{padding:'0.65rem 0.875rem', color:'#f59e0b', fontWeight:600}}>{fmt(m.commission)}</td>
                              <td style={{padding:'0.65rem 0.875rem', color:'#0ea5e9', fontWeight:600}}>{fmt(m.tax)}</td>
                              <td style={{padding:'0.65rem 0.875rem', color:'#059669', fontWeight:600}}>{fmt(m.payouts)}</td>
                              <td style={{padding:'0.65rem 0.875rem', color:'#1f2937', fontWeight:800}}>{fmt(m.profit)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>)}

              {activeFinTab === 'transactions' && (
                <div style={{background:'white', borderRadius:14, padding:'1.5rem', boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}}>
                  <h3 style={{margin:'0 0 1.25rem', fontWeight:700, color:'#1f2937', fontSize:'0.95rem'}}>💳 Transaction Ledger ({txns.length})</h3>
                  {txns.length === 0 ? <EmptyState icon="💳" text="No transactions yet" /> : (
                    <div style={{overflowX:'auto'}}>
                      <table style={{width:'100%', borderCollapse:'collapse', minWidth:900}}>
                        <thead><tr style={{borderBottom:'2px solid #f3f4f6', background:'#f9fafb'}}>
                          {['Invoice','Service','Customer','Worker','Svc Amt','Plat Fee','Support','Urgent','Tax','Total','Method','Date'].map(h => (
                            <th key={h} style={{padding:'0.65rem 0.75rem', textAlign:'left', fontSize:'0.65rem', color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.3px', whiteSpace:'nowrap'}}>{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {txns.slice(0,50).map(t => (
                            <tr key={t._id} style={{borderBottom:'1px solid #f9fafb'}}
                              onMouseEnter={e=>e.currentTarget.style.background='#f9fafb'}
                              onMouseLeave={e=>e.currentTarget.style.background='white'}>
                              <td style={{padding:'0.65rem 0.75rem', fontFamily:'monospace', fontSize:'0.68rem', color:'#9ca3af'}}>{t.invoiceNumber?.slice(-10)||'—'}</td>
                              <td style={{padding:'0.65rem 0.75rem', fontWeight:600, color:'#1f2937', fontSize:'0.82rem', whiteSpace:'nowrap'}}>{t.booking?.service||'—'}</td>
                              <td style={{padding:'0.65rem 0.75rem', fontSize:'0.82rem', color:'#374151'}}>{t.customer?.name||'—'}</td>
                              <td style={{padding:'0.65rem 0.75rem', fontSize:'0.82rem', color:'#374151'}}>{t.worker?.name||'—'}</td>
                              <td style={{padding:'0.65rem 0.75rem', fontWeight:600, color:'#1f2937'}}>{fmt(t.serviceAmount)}</td>
                              <td style={{padding:'0.65rem 0.75rem', color:'#6366f1', fontWeight:600}}>{fmt(t.platformFee)}</td>
                              <td style={{padding:'0.65rem 0.75rem', color:'#8b5cf6', fontWeight:600}}>{fmt(t.supportFee)}</td>
                              <td style={{padding:'0.65rem 0.75rem', color:'#ef4444', fontWeight:600}}>{t.urgentFee>0?fmt(t.urgentFee):'—'}</td>
                              <td style={{padding:'0.65rem 0.75rem', color:'#0ea5e9', fontWeight:600}}>{fmt(t.taxAmount)}</td>
                              <td style={{padding:'0.65rem 0.75rem', fontWeight:800, color:'#1f2937'}}>{fmt(t.totalPaid)}</td>
                              <td style={{padding:'0.65rem 0.75rem'}}><span style={{background:'#f3f4f6', color:'#374151', padding:'0.1rem 0.45rem', borderRadius:50, fontSize:'0.68rem', fontWeight:600, textTransform:'uppercase'}}>{t.paymentMethod}</span></td>
                              <td style={{padding:'0.65rem 0.75rem', fontSize:'0.75rem', color:'#9ca3af', whiteSpace:'nowrap'}}>{t.paidAt?new Date(t.paidAt).toLocaleDateString('en-IN'):'—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeFinTab === 'payouts' && (
                <div style={{background:'white', borderRadius:14, padding:'1.5rem', boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.75rem'}}>
                    <h3 style={{margin:0, fontWeight:700, color:'#1f2937', fontSize:'0.95rem'}}>👷 Worker Payouts ({filteredPayouts.length})</h3>
                    <select value={payoutFilter} onChange={e=>setPayoutFilter(e.target.value)} style={{padding:'0.4rem 0.75rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.82rem', outline:'none', background:'white'}}>
                      <option value="all">All Status</option>
                      {Object.entries(PSTATUS).map(([k,v])=><option key={k} value={k}>{v.l}</option>)}
                    </select>
                  </div>
                  {filteredPayouts.length === 0 ? <EmptyState icon="👷" text="No payouts found" /> : (
                    <div style={{overflowX:'auto'}}>
                      <table style={{width:'100%', borderCollapse:'collapse', minWidth:800}}>
                        <thead><tr style={{borderBottom:'2px solid #f3f4f6', background:'#f9fafb'}}>
                          {['Ref','Worker','Service','Gross','Commission','Tax','Net Payout','Status','Date','Action'].map(h => (
                            <th key={h} style={{padding:'0.65rem 0.75rem', textAlign:'left', fontSize:'0.65rem', color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.3px', whiteSpace:'nowrap'}}>{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {filteredPayouts.map(p => (
                            <tr key={p._id} style={{borderBottom:'1px solid #f9fafb'}}
                              onMouseEnter={e=>e.currentTarget.style.background='#f9fafb'}
                              onMouseLeave={e=>e.currentTarget.style.background='white'}>
                              <td style={{padding:'0.65rem 0.75rem', fontFamily:'monospace', fontSize:'0.68rem', color:'#9ca3af'}}>{p.payoutReference?.slice(-8)||'—'}</td>
                              <td style={{padding:'0.65rem 0.75rem', fontWeight:600, color:'#1f2937', fontSize:'0.82rem'}}>{p.worker?.name||'—'}</td>
                              <td style={{padding:'0.65rem 0.75rem', fontSize:'0.82rem', color:'#374151'}}>{p.booking?.service||'—'}</td>
                              <td style={{padding:'0.65rem 0.75rem', fontWeight:600, color:'#1f2937'}}>{fmt(p.grossAmount)}</td>
                              <td style={{padding:'0.65rem 0.75rem', color:'#ef4444', fontWeight:600}}>- {fmt(p.commissionDeduction)}</td>
                              <td style={{padding:'0.65rem 0.75rem', color:p.taxDeduction>0?'#ef4444':'#9ca3af', fontWeight:600}}>{p.taxDeduction>0?`- ${fmt(p.taxDeduction)}`:'₹0'}</td>
                              <td style={{padding:'0.65rem 0.75rem', fontWeight:800, color:'#059669'}}>{fmt(p.netPayout)}</td>
                              <td style={{padding:'0.65rem 0.75rem'}}>{pChip(p.payoutStatus)}</td>
                              <td style={{padding:'0.65rem 0.75rem', fontSize:'0.75rem', color:'#9ca3af', whiteSpace:'nowrap'}}>{p.payoutDate?new Date(p.payoutDate).toLocaleDateString('en-IN'):'—'}</td>
                              <td style={{padding:'0.65rem 0.75rem'}}>
                                {p.payoutStatus==='pending' && <button onClick={()=>markPayoutStatus(p._id,'credited')} style={{padding:'0.25rem 0.6rem', background:'#dcfce7', color:'#16a34a', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.7rem', fontWeight:700}}>Mark Paid</button>}
                                {p.payoutStatus==='credited' && <span style={{fontSize:'0.72rem', color:'#9ca3af'}}>Done</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeFinTab === 'settings' && settingsForm && (
                <div style={{background:'white', borderRadius:14, padding:'1.5rem', boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}}>
                  <h3 style={{margin:'0 0 1.5rem', fontWeight:700, color:'#1f2937', fontSize:'0.95rem'}}>⚙️ Platform Monetization Settings</h3>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:'1.25rem', marginBottom:'1.5rem'}}>
                    {[
                      {key:'platformFeeValue', label:'Platform Fee (%)',        type:'number'},
                      {key:'supportFee',        label:'Support/Safety Fee (₹)', type:'number'},
                      {key:'urgentFeeFixed',    label:'Urgent Booking Fee (₹)', type:'number'},
                      {key:'commissionRate',    label:'Worker Commission (%)',   type:'number'},
                      {key:'taxRate',           label:'GST Rate (%)',            type:'number'},
                      {key:'workerTaxRate',     label:'Worker TDS Rate (%)',     type:'number'},
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{display:'block', fontSize:'0.75rem', fontWeight:600, color:'#374151', marginBottom:'0.35rem', textTransform:'uppercase', letterSpacing:'0.3px'}}>{f.label}</label>
                        <input type={f.type} value={settingsForm[f.key]||0} onChange={e => setSettingsForm(s => ({...s, [f.key]: parseFloat(e.target.value)||0}))}
                          style={{width:'100%', padding:'0.6rem 0.875rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.9rem', outline:'none', boxSizing:'border-box'}} />
                      </div>
                    ))}
                    <div>
                      <label style={{display:'block', fontSize:'0.75rem', fontWeight:600, color:'#374151', marginBottom:'0.35rem', textTransform:'uppercase', letterSpacing:'0.3px'}}>Payout Mode</label>
                      <select value={settingsForm.payoutMode||'manual'} onChange={e => setSettingsForm(s => ({...s, payoutMode: e.target.value}))}
                        style={{width:'100%', padding:'0.6rem 0.875rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.9rem', outline:'none', background:'white'}}>
                        <option value="instant">Instant</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="manual">Manual</option>
                      </select>
                    </div>
                    <div style={{display:'flex', flexDirection:'column', gap:'0.5rem', justifyContent:'flex-end'}}>
                      <label style={{display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', fontSize:'0.82rem', fontWeight:600, color:'#374151'}}>
                        <input type="checkbox" checked={!!settingsForm.taxOnWorker} onChange={e => setSettingsForm(s => ({...s, taxOnWorker: e.target.checked}))} />
                        Apply TDS on Worker Payout
                      </label>
                      <label style={{display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', fontSize:'0.82rem', fontWeight:600, color:'#374151'}}>
                        <input type="checkbox" checked={!!settingsForm.cashAllowed} onChange={e => setSettingsForm(s => ({...s, cashAllowed: e.target.checked}))} />
                        Allow Cash Payments
                      </label>
                    </div>
                  </div>
                  <div style={{background:'#f0fdf4', borderRadius:10, padding:'0.875rem 1rem', marginBottom:'1.25rem', fontSize:'0.82rem', color:'#166534'}}>
                    <strong>Preview for ₹1000 booking:</strong> Customer pays ₹{(1000 + Math.round(1000*(settingsForm.platformFeeValue||0)/100) + (settingsForm.supportFee||0) + Math.round((Math.round(1000*(settingsForm.platformFeeValue||0)/100)+(settingsForm.supportFee||0))*(settingsForm.taxRate||0)/100)).toLocaleString('en-IN')} · Worker gets ₹{(1000 - Math.round(1000*(settingsForm.commissionRate||0)/100)).toLocaleString('en-IN')} · Platform earns ₹{(Math.round(1000*(settingsForm.platformFeeValue||0)/100) + (settingsForm.supportFee||0) + Math.round(1000*(settingsForm.commissionRate||0)/100)).toLocaleString('en-IN')}
                  </div>
                  <button onClick={saveSettings} disabled={savingSettings} style={{padding:'0.75rem 2rem', background:'#6366f1', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:'0.9rem', opacity:savingSettings?0.7:1}}>
                    {savingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              )}
              </>)}
            </div>
            );
          })()}
          {/* -- SUPPORT CHAT -- */}
          {activeTab === 'support' && (
            <div style={{display:'grid', gridTemplateColumns:'minmax(240px,300px) 1fr', gap:'1.5rem', height:'calc(100vh - 200px)', minHeight:400}}>
              <div style={{background:'white', borderRadius:'16px', boxShadow:'0 1px 8px rgba(0,0,0,0.07)', display:'flex', flexDirection:'column', overflow:'hidden'}}>
                <div style={{padding:'1rem 1.25rem', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <h3 style={{margin:0, fontSize:'0.95rem', fontWeight:'700', color:'#1f2937'}}>Support Threads</h3>
                  <button onClick={()=>setNewThreadForm({...newThreadForm, show:true})} style={{padding:'0.35rem 0.75rem', background:'#6366f1', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600'}}>+ New</button>
                </div>
                <div style={{flex:1, overflowY:'auto'}}>
                  {threads.length === 0 ? <div style={{padding:'2rem', textAlign:'center', color:'#9ca3af', fontSize:'0.85rem'}}>No threads yet</div> : threads.map(t=>{
                    const unreadInThread = t.messages?.filter(m => m.sender?._id !== user?.id && m.sender !== user?.id && !m.isRead).length || 0;
                    return (
                    <div key={t._id} onClick={()=>loadThread(t)} style={{padding:'1rem 1.25rem', borderBottom:'1px solid #f9fafb', cursor:'pointer', background: activeThread?._id===t._id ? '#f5f3ff' : unreadInThread > 0 ? '#eff6ff' : 'transparent', transition:'background 0.2s', borderLeft: unreadInThread > 0 ? '3px solid #3b82f6' : '3px solid transparent'}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                        <div style={{fontWeight: unreadInThread > 0 ? '700' : '600', color:'#1f2937', fontSize:'0.9rem', marginBottom:'0.25rem'}}>{t.subject}</div>
                        {unreadInThread > 0 && <span style={{background:'#ef4444', color:'white', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:700, flexShrink:0}}>{unreadInThread > 9 ? '9+' : unreadInThread}</span>}
                      </div>
                      <div style={{fontSize:'0.78rem', color:'#9ca3af'}}>{t.participants?.map(p=>p.name).join(' · ')}</div>
                      <div style={{fontSize:'0.75rem', color:'#c4b5fd', marginTop:'0.25rem'}}>{t.threadType}</div>
                    </div>
                    );
                  })}
                </div>
              </div>
              <div style={{background:'white', borderRadius:'16px', boxShadow:'0 1px 8px rgba(0,0,0,0.07)', display:'flex', flexDirection:'column', overflow:'hidden'}}>
                {!activeThread ? (
                  <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af'}}>
                    <div style={{textAlign:'center'}}><div style={{fontSize:'3rem', marginBottom:'1rem'}}>📊</div><p>Select a thread to view messages</p></div>
                  </div>
                ) : (
                  <>
                    <div style={{padding:'1rem 1.5rem', borderBottom:'1px solid #f3f4f6'}}>
                      <div style={{fontWeight:'700', color:'#1f2937'}}>{activeThread.subject}</div>
                      <div style={{fontSize:'0.8rem', color:'#9ca3af'}}>{activeThread.participants?.map(p=>p.name).join(' · ')}</div>
                    </div>
                    <div style={{flex:1, overflowY:'auto', padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.75rem'}}>
                      {activeThread.messages?.map((m,i)=>{
                        const isAdmin = m.sender?._id === user?.id || m.sender === user?.id;
                        return (
                          <div key={i} style={{display:'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start'}}>
                            <div style={{maxWidth:'70%', padding:'0.75rem 1rem', borderRadius: isAdmin ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isAdmin ? '#6366f1' : '#f3f4f6', color: isAdmin ? 'white' : '#1f2937', fontSize:'0.9rem'}}>
                              <div style={{fontSize:'0.75rem', opacity:0.7, marginBottom:'0.25rem'}}>{m.sender?.name || 'Admin'}</div>
                              {m.text}
                              <div style={{fontSize:'0.7rem', opacity:0.6, marginTop:'0.25rem', textAlign:'right'}}>{new Date(m.createdAt).toLocaleTimeString()}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{padding:'1rem 1.5rem', borderTop:'1px solid #f3f4f6', display:'flex', gap:'0.75rem'}}>
                      <input value={newMsg} onChange={e=>setNewMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendSupportMsg()} placeholder="Type a message..." style={{flex:1, padding:'0.75rem 1rem', border:'2px solid #e5e7eb', borderRadius:'10px', fontSize:'0.9rem', outline:'none'}} />
                      <button onClick={sendSupportMsg} style={{padding:'0.75rem 1.5rem', background:'#6366f1', color:'white', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:'600'}}>Send</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* -- ANALYTICS -- */}
          {activeTab === 'analytics' && (
            <div style={{display:'grid', gap:'1.5rem'}}>
              <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.25rem'}}>
                <KpiCard icon="📊" label="Total Bookings" value={stats?.bookings?.total||0} color="#6366f1" />
                <KpiCard icon="📈" label="Completion Rate" value={stats?.bookings?.total ? Math.round((stats.bookings.completed/stats.bookings.total)*100)+'%' : '0%'} color="#10b981" />
                <KpiCard icon="💰" label="Revenue" value={`₹${(stats?.revenue||0).toLocaleString()}`} color="#f59e0b" />
              </div>              <div style={{background:'white', borderRadius:'16px', padding:'1.5rem', boxShadow:'0 1px 8px rgba(0,0,0,0.07)'}}>
                <h3 style={{margin:'0 0 1.25rem', color:'#1f2937', fontWeight:'700'}}>🔥 Top Services by Demand</h3>
                {serviceChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={serviceChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis type="number" tick={{fontSize:12}} />
                      <YAxis dataKey="name" type="category" tick={{fontSize:12}} width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#6366f1" radius={[0,6,6,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyState icon="📊" text="No booking data yet" />}
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem'}}>
                <div style={{background:'white', borderRadius:'16px', padding:'1.5rem', boxShadow:'0 1px 8px rgba(0,0,0,0.07)'}}>
                  <h3 style={{margin:'0 0 1rem', color:'#1f2937', fontWeight:'700'}}>👥 User Distribution</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={[{name:'Workers',value:stats?.users?.workers||0},{name:'Customers',value:stats?.users?.customers||0}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                        <Cell fill="#6366f1" /><Cell fill="#10b981" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{background:'white', borderRadius:'16px', padding:'1.5rem', boxShadow:'0 1px 8px rgba(0,0,0,0.07)'}}>
                  <h3 style={{margin:'0 0 1rem', color:'#1f2937', fontWeight:'700'}}>📊 Booking Status Split</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={bookingChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                        {bookingChartData.map((_,i)=><Cell key={i} fill={COLORS[i]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ── AI INSIGHTS ── */}
          {activeTab === 'ai' && (
            <div style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
              {/* Summary Cards */}
              <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.25rem'}}>
                <KpiCard icon="��" label="Suspicious Workers" value={aiFlags.length} sub="Flagged by AI analysis" color="#ef4444" />
                <KpiCard icon="😊" label="Positive Reviews" value={aiReviews?.positive || 0} sub={`of ${aiReviews?.total || 0} total reviews`} color="#10b981" />
                <KpiCard icon="😞" label="Negative Reviews" value={aiReviews?.negative || 0} sub="Need attention" color="#f59e0b" />
              </div>

              {/* Suspicious Activity Flags */}
              <div style={{background:'white', borderRadius:16, padding:'1.5rem', boxShadow:'0 1px 8px rgba(0,0,0,0.07)'}}>
                <h3 style={{margin:'0 0 1.25rem', color:'#1f2937', fontWeight:700}}>🚩 Suspicious Activity Flags</h3>
                {aiFlags.length === 0 ? (
                  <EmptyState icon="✅" text="No suspicious activity detected — platform looks healthy!" />
                ) : aiFlags.map((item, i) => (
                  <div key={i} style={{padding:'1rem', background:'#fef9f0', borderRadius:10, marginBottom:'0.75rem', borderLeft:'4px solid #f59e0b'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.5rem'}}>
                      <Avatar user={item.worker} size={36} />
                      <div>
                        <div style={{fontWeight:700, color:'#1f2937'}}>{item.worker.name}</div>
                        <div style={{fontSize:'0.8rem', color:'#9ca3af'}}>{item.worker.email}</div>
                      </div>
                    </div>
                    {item.flags.map((flag, j) => (
                      <div key={j} style={{display:'flex', alignItems:'center', gap:'0.5rem', marginTop:'0.4rem'}}>
                        <span style={{background: flag.severity==='danger'?'#fee2e2':flag.severity==='warning'?'#fef3c7':'#e0f2fe', color: flag.severity==='danger'?'#991b1b':flag.severity==='warning'?'#92400e':'#0369a1', padding:'0.15rem 0.6rem', borderRadius:50, fontSize:'0.72rem', fontWeight:700}}>
                          {flag.severity.toUpperCase()}
                        </span>
                        <span style={{fontSize:'0.85rem', color:'#374151'}}>{flag.message}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Review Sentiment Analysis */}
              <div style={{background:'white', borderRadius:16, padding:'1.5rem', boxShadow:'0 1px 8px rgba(0,0,0,0.07)'}}>
                <h3 style={{margin:'0 0 1.25rem', color:'#1f2937', fontWeight:700}}>🧠 Review Sentiment Analysis</h3>
                {!aiReviews ? (
                  <EmptyState icon="📝" text="No reviews to analyze yet" />
                ) : (
                  <>
                    {/* Sentiment Bar */}
                    <div style={{marginBottom:'1.5rem'}}>
                      <div style={{display:'flex', gap:'1rem', marginBottom:'0.75rem', flexWrap:'wrap'}}>
                        {[
                          { label:'😊 Positive', count: aiReviews.positive, color:'#10b981', bg:'#d1fae5' },
                          { label:'😐 Neutral',  count: aiReviews.neutral,  color:'#6b7280', bg:'#f3f4f6' },
                          { label:'😞 Negative', count: aiReviews.negative, color:'#ef4444', bg:'#fee2e2' },
                        ].map(s => (
                          <div key={s.label} style={{background:s.bg, color:s.color, padding:'0.5rem 1rem', borderRadius:8, fontWeight:700, fontSize:'0.9rem'}}>
                            {s.label}: {s.count}
                          </div>
                        ))}
                      </div>
                      {aiReviews.total > 0 && (
                        <div style={{height:10, background:'#f3f4f6', borderRadius:5, overflow:'hidden', display:'flex'}}>
                          <div style={{width:`${(aiReviews.positive/aiReviews.total)*100}%`, background:'#10b981', transition:'width 0.5s'}}></div>
                          <div style={{width:`${(aiReviews.neutral/aiReviews.total)*100}%`, background:'#9ca3af'}}></div>
                          <div style={{width:`${(aiReviews.negative/aiReviews.total)*100}%`, background:'#ef4444'}}></div>
                        </div>
                      )}
                    </div>

                    {/* Recent Reviews with Sentiment */}
                    <div style={{display:'flex', flexDirection:'column', gap:'0.75rem', maxHeight:320, overflowY:'auto'}}>
                      {aiReviews.reviews?.slice(0,10).map((r, i) => (
                        <div key={i} style={{padding:'0.875rem', background:'#f9fafb', borderRadius:10, borderLeft:`3px solid ${r.sentiment.label==='positive'?'#10b981':r.sentiment.label==='negative'?'#ef4444':'#9ca3af'}`}}>
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.35rem'}}>
                            <span style={{fontWeight:600, color:'#1f2937', fontSize:'0.9rem'}}>{r.service} — {r.worker}</span>
                            <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                              <span style={{fontSize:'0.8rem', color:'#f59e0b'}}>{'⭐'.repeat(r.rating)}</span>
                              <span style={{fontSize:'1rem'}}>{r.sentiment.emoji}</span>
                              <span style={{fontSize:'0.72rem', fontWeight:700, color: r.sentiment.label==='positive'?'#059669':r.sentiment.label==='negative'?'#dc2626':'#6b7280', background: r.sentiment.label==='positive'?'#d1fae5':r.sentiment.label==='negative'?'#fee2e2':'#f3f4f6', padding:'0.1rem 0.5rem', borderRadius:50}}>
                                {r.sentiment.label}
                              </span>
                            </div>
                          </div>
                          <p style={{color:'#6b7280', fontSize:'0.85rem', margin:0, fontStyle:'italic'}}>"{r.comment}"</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Price Fairness Overview */}
              <div style={{background:'white', borderRadius:16, padding:'1.5rem', boxShadow:'0 1px 8px rgba(0,0,0,0.07)'}}>
                <h3 style={{margin:'0 0 1.25rem', color:'#1f2937', fontWeight:700}}>💰 Worker Price Fairness Overview</h3>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'1rem'}}>
                  {workers.slice(0,8).map(w => {
                    const skill = w.workerProfile?.skills?.[0];
                    const rate = w.workerProfile?.hourlyRate;
                    if (!skill || !rate) return null;
                    const MARKET = { Electrician:350, Plumber:300, Carpenter:450, Mechanic:500, Tutor:400, Painter:250, Cleaner:200, Gardener:300 };
                    const avg = MARKET[skill] || 350;
                    const ratio = rate / avg;
                    const label = ratio < 0.75 ? 'Budget' : ratio <= 1.15 ? 'Fair' : ratio <= 1.5 ? 'Premium' : 'High';
                    const color = ratio < 0.75 ? '#10b981' : ratio <= 1.15 ? '#6366f1' : ratio <= 1.5 ? '#f59e0b' : '#ef4444';
                    return (
                      <div key={w._id} style={{padding:'0.875rem', background:'#f9fafb', borderRadius:10, borderLeft:`3px solid ${color}`}}>
                        <div style={{fontWeight:600, color:'#1f2937', fontSize:'0.85rem', marginBottom:'0.25rem'}}>{w.name}</div>
                        <div style={{fontSize:'0.78rem', color:'#9ca3af', marginBottom:'0.4rem'}}>{skill}</div>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                          <span style={{fontWeight:700, color:'#1f2937'}}>₹{rate}/hr</span>
                          <span style={{background:color+'20', color, padding:'0.1rem 0.5rem', borderRadius:50, fontSize:'0.72rem', fontWeight:700}}>{label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── MAP MONITOR ── */}
          {activeTab === 'map' && (
            <div>
              <h3 style={{margin:'0 0 1.5rem', color:'#1f2937', fontWeight:700}}>🗺️ Platform Map Monitor</h3>
              <AdminMapPanel workers={workers} customers={customers} bookings={bookings} />
            </div>
          )}

          {/* ── SUPPORT TICKETS ── */}
          {activeTab === 'tickets' && (() => {
            const TICKET_STATUS_MAP = {
              'open':              { bg:'#fee2e2', color:'#dc2626',  label:'Open' },
              'in-progress':       { bg:'#dbeafe', color:'#2563eb',  label:'In Progress' },
              'waiting-for-user':  { bg:'#fef9c3', color:'#ca8a04',  label:'Waiting User' },
              'waiting-for-admin': { bg:'#e0f2fe', color:'#0369a1',  label:'Waiting Admin' },
              'resolved':          { bg:'#dcfce7', color:'#16a34a',  label:'Resolved' },
              'closed':            { bg:'#f3f4f6', color:'#6b7280',  label:'Closed' },
              'escalated':         { bg:'#f3e8ff', color:'#9333ea',  label:'Escalated' },
            };
            const TICKET_PRIORITY_MAP = {
              low:    { bg:'#dcfce7', color:'#16a34a' },
              medium: { bg:'#fef9c3', color:'#ca8a04' },
              high:   { bg:'#fee2e2', color:'#dc2626' },
            };
            const tPill = (bg, color, text) => (
              <span style={{display:'inline-block', padding:'0.12rem 0.5rem', borderRadius:20, fontSize:'0.68rem', fontWeight:700, background:bg, color}}>{text}</span>
            );
            const filteredTickets = tickets.filter(t => {
              if (ticketStatusFilter !== 'all' && t.status !== ticketStatusFilter) return false;
              if (ticketPriorityFilter !== 'all' && t.priority !== ticketPriorityFilter) return false;
              if (ticketRoleFilter !== 'all' && t.raisedByRole !== ticketRoleFilter) return false;
              if (ticketSearch) {
                const q = ticketSearch.toLowerCase();
                const match = t.subject?.toLowerCase().includes(q) || t.raisedBy?.name?.toLowerCase().includes(q) || t.raisedBy?.email?.toLowerCase().includes(q) || t._id?.includes(q) || t.bookingRef?.toLowerCase().includes(q);
                if (!match) return false;
              }
              return true;
            });
            const statCounts = { open: tickets.filter(t=>t.status==='open').length, 'in-progress': tickets.filter(t=>t.status==='in-progress').length, escalated: tickets.filter(t=>t.status==='escalated').length, resolved: tickets.filter(t=>t.status==='resolved').length };
            return (
            <div style={{display:'grid', gridTemplateColumns: activeTicket ? '380px 1fr' : '1fr', gap:'1.5rem', alignItems:'start'}}>
              {/* ── LEFT: list + filters ── */}
              <div style={{background:'white', borderRadius:16, boxShadow:'0 1px 8px rgba(0,0,0,0.07)', display:'flex', flexDirection:'column', overflow:'hidden', maxHeight:'calc(100vh - 180px)'}}>
                <div style={{padding:'1rem 1.25rem', borderBottom:'1px solid #f3f4f6'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem'}}>
                    <h3 style={{margin:0, color:'#1f2937', fontWeight:700, fontSize:'0.95rem'}}>🎫 Support Tickets ({filteredTickets.length})</h3>
                    <button onClick={() => api.get('/tickets').then(r => setTickets(r.data)).catch(() => {})} style={{background:'none', border:'none', color:'#6366f1', cursor:'pointer', fontSize:'0.8rem', fontWeight:600}}>↻ Refresh</button>
                  </div>
                  <div style={{display:'flex', gap:'0.4rem', flexWrap:'wrap', marginBottom:'0.6rem'}}>
                    {Object.entries(statCounts).map(([s, n]) => { const sc = TICKET_STATUS_MAP[s]||{}; return <span key={s} style={{background:sc.bg, color:sc.color, padding:'0.12rem 0.5rem', borderRadius:50, fontSize:'0.68rem', fontWeight:700}}>{n} {sc.label||s}</span>; })}
                  </div>
                  <input value={ticketSearch} onChange={e => setTicketSearch(e.target.value)} placeholder="Search by name, subject, ID…" style={{width:'100%', padding:'0.4rem 0.7rem', border:'1px solid #e5e7eb', borderRadius:7, fontSize:'0.8rem', outline:'none', boxSizing:'border-box', marginBottom:'0.5rem'}} />
                  <div style={{display:'flex', gap:'0.35rem', flexWrap:'wrap'}}>
                    <select value={ticketStatusFilter} onChange={e => setTicketStatusFilter(e.target.value)} style={{padding:'0.28rem 0.55rem', border:'1px solid #e5e7eb', borderRadius:6, fontSize:'0.73rem', outline:'none', background:'white'}}>
                      <option value="all">All Status</option>
                      {Object.entries(TICKET_STATUS_MAP).map(([v,s]) => <option key={v} value={v}>{s.label}</option>)}
                    </select>
                    <select value={ticketPriorityFilter} onChange={e => setTicketPriorityFilter(e.target.value)} style={{padding:'0.28rem 0.55rem', border:'1px solid #e5e7eb', borderRadius:6, fontSize:'0.73rem', outline:'none', background:'white'}}>
                      <option value="all">All Priority</option>
                      <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                    </select>
                    <select value={ticketRoleFilter} onChange={e => setTicketRoleFilter(e.target.value)} style={{padding:'0.28rem 0.55rem', border:'1px solid #e5e7eb', borderRadius:6, fontSize:'0.73rem', outline:'none', background:'white'}}>
                      <option value="all">All Users</option><option value="customer">Customers</option><option value="worker">Workers</option>
                    </select>
                  </div>
                </div>
                <div style={{flex:1, overflowY:'auto'}}>
                  {filteredTickets.length === 0 ? (
                    <div style={{padding:'2rem', textAlign:'center', color:'#9ca3af', fontSize:'0.875rem'}}>No tickets match filters</div>
                  ) : filteredTickets.map(t => {
                    const sc = TICKET_STATUS_MAP[t.status]||TICKET_STATUS_MAP['open'];
                    const pc = TICKET_PRIORITY_MAP[t.priority]||TICKET_PRIORITY_MAP['medium'];
                    const unread = (t.messages||[]).filter(m => m.senderRole !== 'admin' && !m.isRead).length;
                    const isActive = activeTicket?._id === t._id;
                    return (
                      <div key={t._id} onClick={() => loadTicket(t)}
                        style={{padding:'0.875rem 1rem', borderBottom:'1px solid #f3f4f6', cursor:'pointer', background: isActive?'#f5f3ff': unread>0?'#eff6ff':'white', borderLeft: isActive?'3px solid #6366f1': unread>0?'3px solid #3b82f6':'3px solid transparent'}}
                        onMouseEnter={e => { if(!isActive) e.currentTarget.style.background='#f9fafb'; }}
                        onMouseLeave={e => { if(!isActive) e.currentTarget.style.background= isActive?'#f5f3ff': unread>0?'#eff6ff':'white'; }}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'0.4rem', marginBottom:'0.25rem'}}>
                          <span style={{fontWeight: unread>0?700:600, color:'#1f2937', fontSize:'0.83rem', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{t.subject}</span>
                          <div style={{display:'flex', gap:'0.25rem', alignItems:'center', flexShrink:0}}>
                            {unread>0 && <span style={{background:'#ef4444', color:'white', borderRadius:'50%', width:15, height:15, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.58rem', fontWeight:700}}>{unread>9?'9+':unread}</span>}
                            {tPill(sc.bg, sc.color, sc.label)}
                          </div>
                        </div>
                        <div style={{display:'flex', gap:'0.3rem', alignItems:'center', flexWrap:'wrap'}}>
                          <span style={{fontSize:'0.73rem', color:'#6b7280', fontWeight:600}}>{t.raisedBy?.name}</span>
                          <span style={{fontSize:'0.65rem', color:'#9ca3af', background:'#f3f4f6', padding:'0.08rem 0.35rem', borderRadius:4}}>{t.raisedByRole}</span>
                          {tPill(pc.bg, pc.color, t.priority)}
                          <span style={{fontSize:'0.65rem', color:'#9ca3af', marginLeft:'auto'}}>{new Date(t.updatedAt||t.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── RIGHT: ticket detail + chat ── */}
              {activeTicket && (
                <div style={{background:'white', borderRadius:16, boxShadow:'0 1px 8px rgba(0,0,0,0.07)', display:'flex', flexDirection:'column', overflow:'hidden', maxHeight:'calc(100vh - 180px)'}}>
                  {/* Header */}
                  <div style={{padding:'1rem 1.25rem', borderBottom:'1px solid #f3f4f6'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.5rem'}}>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{fontWeight:700, color:'#1f2937', fontSize:'0.95rem', marginBottom:'0.25rem'}}>{activeTicket.subject}</div>
                        <div style={{display:'flex', gap:'0.3rem', flexWrap:'wrap', alignItems:'center'}}>
                          {(() => { const sc=TICKET_STATUS_MAP[activeTicket.status]||TICKET_STATUS_MAP['open']; const pc=TICKET_PRIORITY_MAP[activeTicket.priority]||TICKET_PRIORITY_MAP['medium']; return (<>{tPill(sc.bg,sc.color,sc.label)}{tPill(pc.bg,pc.color,activeTicket.priority)}<span style={{fontSize:'0.65rem',color:'#9ca3af'}}>#{activeTicket._id?.slice(-6)}</span><span style={{fontSize:'0.65rem',color:'#9ca3af'}}>{activeTicket.raisedByRole}</span>{activeTicket.convertedTo&&tPill('#fef3c7','#92400e',`→ ${activeTicket.convertedTo}`)}</>); })()}
                        </div>
                      </div>
                      <button onClick={() => setActiveTicket(null)} style={{background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:'1.1rem', flexShrink:0}}>✕</button>
                    </div>
                    {/* Raised by */}
                    <div style={{display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.5rem 0.75rem', background:'#f9fafb', borderRadius:8, marginBottom:'0.6rem'}}>
                      <div style={{width:28, height:28, borderRadius:'50%', background:'#6366f1', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.78rem', flexShrink:0}}>{activeTicket.raisedBy?.name?.charAt(0)}</div>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{fontWeight:600, color:'#1f2937', fontSize:'0.82rem'}}>{activeTicket.raisedBy?.name}</div>
                        <div style={{fontSize:'0.68rem', color:'#9ca3af'}}>{activeTicket.raisedBy?.email} · {activeTicket.raisedByRole}</div>
                      </div>
                      {activeTicket.assignedAdmin && <div style={{fontSize:'0.68rem', color:'#6366f1', fontWeight:600}}>Assigned: {activeTicket.assignedAdmin?.name}</div>}
                    </div>
                    {/* Actions row 1 */}
                    <div style={{display:'flex', gap:'0.35rem', flexWrap:'wrap', marginBottom:'0.35rem'}}>
                      {[{label:'In Progress',status:'in-progress',bg:'#dbeafe',color:'#2563eb'},{label:'Waiting User',status:'waiting-for-user',bg:'#fef9c3',color:'#ca8a04'},{label:'Resolved',status:'resolved',bg:'#dcfce7',color:'#16a34a'},{label:'Closed',status:'closed',bg:'#f3f4f6',color:'#6b7280'}].map(a => (
                        <button key={a.status} onClick={() => updateTicketStatus(activeTicket._id, a.status)} style={{padding:'0.22rem 0.6rem', background:a.bg, color:a.color, border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.7rem', fontWeight:700}}>{a.label}</button>
                      ))}
                    </div>
                    {/* Actions row 2 */}
                    <div style={{display:'flex', gap:'0.35rem', flexWrap:'wrap'}}>
                      <button onClick={() => api.patch(`/tickets/${activeTicket._id}/assign`).then(() => { toast.success('Assigned to you'); loadTicket(activeTicket); }).catch(() => toast.error('Failed'))} style={{padding:'0.22rem 0.6rem', background:'#ede9fe', color:'#7c3aed', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.7rem', fontWeight:700}}>📌 Assign Me</button>
                      <button onClick={() => ticketAction(activeTicket._id, 'escalate')} style={{padding:'0.22rem 0.6rem', background:'#f3e8ff', color:'#9333ea', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.7rem', fontWeight:700}}>⚠️ Escalate</button>
                      <button onClick={() => ticketAction(activeTicket._id, 'reopen')} style={{padding:'0.22rem 0.6rem', background:'#ffedd5', color:'#ea580c', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.7rem', fontWeight:700}}>🔄 Reopen</button>
                      <button onClick={() => ticketAction(activeTicket._id, 'convert-dispute')} style={{padding:'0.22rem 0.6rem', background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.7rem', fontWeight:700}}>⚖️ → Dispute</button>
                      <button onClick={() => ticketAction(activeTicket._id, 'convert-refund')} style={{padding:'0.22rem 0.6rem', background:'#d1fae5', color:'#065f46', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.7rem', fontWeight:700}}>💰 → Refund</button>
                      <button onClick={() => setTicketNoteMode(m => !m)} style={{padding:'0.22rem 0.6rem', background: ticketNoteMode?'#1f2937':'#f3f4f6', color: ticketNoteMode?'white':'#374151', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.7rem', fontWeight:700}}>📝 {ticketNoteMode?'Cancel Note':'Internal Note'}</button>
                    </div>
                  </div>
                  {/* Description */}
                  <div style={{padding:'0.6rem 1.25rem', background:'#f9fafb', borderBottom:'1px solid #f3f4f6', fontSize:'0.8rem', color:'#6b7280', lineHeight:1.5}}>
                    <strong style={{color:'#374151'}}>Issue: </strong>{activeTicket.description}
                    {activeTicket.bookingRef && <span style={{marginLeft:'0.75rem', color:'#6366f1', fontWeight:600}}>Ref: {activeTicket.bookingRef}</span>}
                    {activeTicket.screenshotUrl && <a href={activeTicket.screenshotUrl} target="_blank" rel="noreferrer" style={{marginLeft:'0.75rem', color:'#6366f1', fontWeight:600, fontSize:'0.72rem'}}>📎 Screenshot</a>}
                  </div>
                  {/* Admin notes */}
                  {activeTicket.adminNotes?.length > 0 && (
                    <div style={{padding:'0.6rem 1.25rem', background:'#fffbeb', borderBottom:'1px solid #fde68a'}}>
                      <div style={{fontSize:'0.68rem', fontWeight:700, color:'#92400e', marginBottom:'0.3rem'}}>🔒 Internal Notes</div>
                      {activeTicket.adminNotes.map((n, i) => (
                        <div key={i} style={{fontSize:'0.75rem', color:'#78350f', marginBottom:'0.2rem', padding:'0.3rem 0.55rem', background:'#fef3c7', borderRadius:6}}>
                          <strong>{n.admin?.name||'Admin'}:</strong> {n.note} <span style={{color:'#b45309', fontSize:'0.65rem'}}>{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Messages */}
                  <div style={{flex:1, overflowY:'auto', padding:'0.875rem 1.25rem', display:'flex', flexDirection:'column', gap:'0.65rem', background:'#f8fafc'}}>
                    {(activeTicket.messages||[]).map((m, i) => {
                      const isAdminMsg = m.senderRole === 'admin';
                      if (m.isInternal) return (
                        <div key={i} style={{padding:'0.45rem 0.75rem', background:'#fffbeb', border:'1px dashed #fde68a', borderRadius:7, fontSize:'0.75rem', color:'#78350f'}}>
                          🔒 <strong>Internal:</strong> {m.text} <span style={{color:'#b45309', fontSize:'0.62rem'}}>{new Date(m.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                        </div>
                      );
                      return (
                        <div key={i} style={{display:'flex', justifyContent: isAdminMsg?'flex-end':'flex-start', gap:'0.4rem', alignItems:'flex-end'}}>
                          <div style={{width:24, height:24, borderRadius:'50%', flexShrink:0, background: isAdminMsg?'#6366f1':'#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.62rem', fontWeight:700, color: isAdminMsg?'white':'#6b7280', order: isAdminMsg?1:0}}>
                            {isAdminMsg?'A':(m.sender?.name?.charAt(0)||'U')}
                          </div>
                          <div style={{maxWidth:'75%'}}>
                            <div style={{padding:'0.5rem 0.8rem', borderRadius: isAdminMsg?'12px 4px 12px 12px':'4px 12px 12px 12px', background: isAdminMsg?'linear-gradient(135deg,#667eea,#764ba2)':'white', color: isAdminMsg?'white':'#1f2937', fontSize:'0.82rem', boxShadow: isAdminMsg?'none':'0 1px 4px rgba(0,0,0,0.08)', lineHeight:1.5}}>
                              <div style={{fontSize:'0.62rem', opacity:0.7, marginBottom:'0.12rem'}}>{isAdminMsg?'You (Admin)':`${m.sender?.name||'User'} (${m.senderRole})`}</div>
                              {m.text}
                            </div>
                            <div style={{fontSize:'0.6rem', color:'#9ca3af', marginTop:'0.12rem', textAlign: isAdminMsg?'right':'left'}}>{new Date(m.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Internal note input */}
                  {ticketNoteMode && (
                    <div style={{padding:'0.65rem 1.25rem', background:'#fffbeb', borderTop:'1px solid #fde68a', display:'flex', gap:'0.5rem'}}>
                      <input value={ticketNote} onChange={e => setTicketNote(e.target.value)} onKeyDown={e => e.key==='Enter' && sendTicketNote()} placeholder="Internal note (admin-only)…" style={{flex:1, padding:'0.45rem 0.8rem', border:'1px solid #fde68a', borderRadius:8, fontSize:'0.8rem', outline:'none', background:'#fffbeb'}} />
                      <button onClick={sendTicketNote} style={{padding:'0.45rem 0.9rem', background:'#f59e0b', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.75rem'}}>Save</button>
                    </div>
                  )}
                  {/* Reply input */}
                  {!ticketNoteMode && (
                    <div style={{padding:'0.65rem 1.25rem', borderTop:'1px solid #f3f4f6', display:'flex', gap:'0.5rem', background:'white'}}>
                      <input value={ticketMsg} onChange={e => setTicketMsg(e.target.value)} onKeyDown={e => e.key==='Enter' && sendTicketMsg()} placeholder="Reply to user…" style={{flex:1, padding:'0.55rem 0.9rem', border:'2px solid #e5e7eb', borderRadius:50, fontSize:'0.85rem', outline:'none'}} onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
                      <button onClick={sendTicketMsg} disabled={ticketSending||!ticketMsg.trim()} style={{padding:'0.55rem 1.1rem', background: ticketMsg.trim()?'#6366f1':'#e5e7eb', color: ticketMsg.trim()?'white':'#9ca3af', border:'none', borderRadius:50, cursor: ticketMsg.trim()?'pointer':'not-allowed', fontWeight:600, fontSize:'0.8rem'}}>{ticketSending?'…':'Send'}</button>
                    </div>
                  )}
                </div>
              )}
            </div>
            );
          })()}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === 'notifications' && (
            <div style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
            {(() => {
            const TYPE_ICONS = { booking:'📋', payment:'💰', quote:'🏷️', dispute:'⚖️', message:'💬', ticket:'🎫', verification:'✅', review:'⭐', payout:'💳', 'change-request':'📝', announcement:'📢', system:'🔔' };
            const TYPE_COLORS = { booking:'#6366f1', payment:'#10b981', quote:'#f59e0b', dispute:'#ef4444', message:'#0ea5e9', ticket:'#8b5cf6', verification:'#059669', review:'#f59e0b', payout:'#10b981', 'change-request':'#6366f1', announcement:'#dc2626', system:'#6b7280' };
            const fmtT = (d) => { if (!d) return ''; const diff = Date.now() - new Date(d); if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`; if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`; return new Date(d).toLocaleDateString('en-IN', {day:'numeric',month:'short'}); };
            const unread = adminNotifs.filter(n => !n.isRead).length;
            const filtered = notifType === 'all' ? adminNotifs : adminNotifs.filter(n => n.type === notifType);
            return (<>

              {/* Announcement panel */}
              <div style={{background:'white', borderRadius:14, padding:'1.5rem', boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}}>
                <h3 style={{margin:'0 0 1.25rem', fontWeight:700, color:'#1f2937', fontSize:'0.95rem'}}>📢 Send Announcement</h3>
                <form onSubmit={sendAnnouncement} style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
                  <div>
                    <label style={{display:'block', fontSize:'0.75rem', fontWeight:600, color:'#374151', marginBottom:'0.3rem', textTransform:'uppercase', letterSpacing:'0.3px'}}>Title *</label>
                    <input value={announceForm.title} onChange={e => setAnnounceForm(a => ({...a, title:e.target.value}))} required placeholder="Announcement title" style={{width:'100%', padding:'0.6rem 0.875rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.875rem', outline:'none', boxSizing:'border-box'}} />
                  </div>
                  <div>
                    <label style={{display:'block', fontSize:'0.75rem', fontWeight:600, color:'#374151', marginBottom:'0.3rem', textTransform:'uppercase', letterSpacing:'0.3px'}}>Target</label>
                    <select value={announceForm.targetRole} onChange={e => setAnnounceForm(a => ({...a, targetRole:e.target.value}))} style={{width:'100%', padding:'0.6rem 0.875rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.875rem', outline:'none', background:'white'}}>
                      <option value="all">All Users</option>
                      <option value="worker">Workers Only</option>
                      <option value="customer">Customers Only</option>
                    </select>
                  </div>
                  <div style={{gridColumn:'span 2'}}>
                    <label style={{display:'block', fontSize:'0.75rem', fontWeight:600, color:'#374151', marginBottom:'0.3rem', textTransform:'uppercase', letterSpacing:'0.3px'}}>Message *</label>
                    <div style={{display:'flex', gap:'0.75rem'}}>
                      <textarea value={announceForm.message} onChange={e => setAnnounceForm(a => ({...a, message:e.target.value}))} required rows={2} placeholder="Write your announcement..." style={{flex:1, padding:'0.6rem 0.875rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.875rem', outline:'none', resize:'none', fontFamily:'inherit'}} />
                      <button type="submit" disabled={sendingAnnounce} style={{padding:'0.6rem 1.5rem', background:'#6366f1', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:'0.875rem', opacity:sendingAnnounce?0.7:1, flexShrink:0}}>
                        {sendingAnnounce ? 'Sending...' : '📢 Send'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Notification list */}
              <div style={{background:'white', borderRadius:14, boxShadow:'0 1px 6px rgba(0,0,0,0.06)', overflow:'hidden'}}>
                <div style={{padding:'1rem 1.25rem', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.75rem'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                    <h3 style={{margin:0, fontWeight:700, color:'#1f2937', fontSize:'0.95rem'}}>🔔 Recent Notifications</h3>
                    {unread > 0 && <span style={{background:'#6366f1', color:'white', borderRadius:50, padding:'0.1rem 0.5rem', fontSize:'0.65rem', fontWeight:700}}>{unread} unread</span>}
                  </div>
                  <div style={{display:'flex', gap:'0.5rem', alignItems:'center'}}>
                    {unread > 0 && <button onClick={markAllNotifsRead} style={{padding:'0.3rem 0.75rem', background:'#ede9fe', color:'#6366f1', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.75rem', fontWeight:600}}>✓ Mark All Read</button>}
                  </div>
                </div>

                {/* Type filter */}
                <div style={{padding:'0.5rem 1rem', borderBottom:'1px solid #f3f4f6', display:'flex', gap:'0.3rem', overflowX:'auto', background:'#fafafa'}}>
                  {['all','booking','payment','quote','dispute','message','ticket','announcement','verification','system'].map(t => (
                    <button key={t} onClick={() => setNotifType(t)}
                      style={{padding:'0.2rem 0.6rem', borderRadius:20, fontSize:'0.68rem', fontWeight:600, cursor:'pointer', border:'none', whiteSpace:'nowrap', flexShrink:0, background: notifType===t?'#6366f1':'#f3f4f6', color: notifType===t?'white':'#6b7280'}}>
                      {TYPE_ICONS[t]||'🔔'} {t === 'all' ? 'All' : t.charAt(0).toUpperCase()+t.slice(1)}
                    </button>
                  ))}
                </div>

                {notifLoading ? (
                  <div style={{padding:'2rem', textAlign:'center', color:'#9ca3af', fontSize:'0.875rem'}}>Loading...</div>
                ) : filtered.length === 0 ? (
                  <div style={{padding:'3rem', textAlign:'center', color:'#9ca3af'}}>
                    <div style={{fontSize:'2.5rem', marginBottom:'0.5rem'}}>🔔</div>
                    <p style={{margin:0, fontSize:'0.875rem'}}>No notifications</p>
                  </div>
                ) : filtered.map(n => {
                  const icon = TYPE_ICONS[n.type] || '🔔';
                  const color = TYPE_COLORS[n.type] || '#6b7280';
                  return (
                    <div key={n._id} style={{display:'flex', alignItems:'flex-start', gap:'0.875rem', padding:'0.875rem 1.25rem', borderBottom:'1px solid #f9fafb', background: n.isRead?'white':'#f5f3ff', borderLeft: n.isRead?'3px solid transparent':'3px solid #6366f1'}}>
                      <div style={{width:34, height:34, borderRadius:8, background:color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem', flexShrink:0}}>{icon}</div>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{display:'flex', justifyContent:'space-between', gap:'0.5rem', marginBottom:'0.15rem'}}>
                          <span style={{fontWeight: n.isRead?500:700, color:'#1f2937', fontSize:'0.85rem'}}>{n.title}</span>
                          <span style={{fontSize:'0.68rem', color:'#9ca3af', flexShrink:0}}>{fmtT(n.createdAt)}</span>
                        </div>
                        <p style={{margin:0, fontSize:'0.78rem', color:'#6b7280', lineHeight:1.4}}>{n.message}</p>
                      </div>
                      <div style={{display:'flex', gap:'0.3rem', flexShrink:0}}>
                        {!n.isRead && <button onClick={() => markNotifRead(n._id)} style={{padding:'0.2rem 0.5rem', background:'#ede9fe', color:'#6366f1', border:'none', borderRadius:4, cursor:'pointer', fontSize:'0.65rem', fontWeight:600}}>Read</button>}
                        <button onClick={() => deleteNotif(n._id)} style={{padding:'0.2rem 0.5rem', background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:4, cursor:'pointer', fontSize:'0.65rem', fontWeight:600}}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>);
            })()}
            </div>
          )}

        </div>
      </main>

      {/* Admin Profile Modal */}
      {showAdminProfile && <AdminProfile onClose={() => setShowAdminProfile(false)} />}

      {/* Worker Detail Modal */}
      {workerDetailModal && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem', backdropFilter:'blur(4px)'}}>
          <div style={{background:'white', borderRadius:20, padding:'2rem', width:'100%', maxWidth:560, boxShadow:'0 20px 60px rgba(0,0,0,0.25)', maxHeight:'90vh', overflowY:'auto'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
              <h3 style={{margin:0, color:'#1f2937', fontWeight:700}}>👷 Worker Details</h3>
              <button onClick={() => setWorkerDetailModal(null)} style={{background:'none', border:'none', cursor:'pointer', fontSize:'1.25rem', color:'#9ca3af'}}>✕</button>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem', padding:'1rem', background:'#f9fafb', borderRadius:12}}>
              <Avatar user={workerDetailModal} size={56} />
              <div>
                <div style={{fontWeight:700, color:'#1f2937', fontSize:'1.05rem'}}>{workerDetailModal.name}</div>
                <div style={{color:'#6b7280', fontSize:'0.85rem'}}>{workerDetailModal.email} · {workerDetailModal.phone}</div>
                <div style={{marginTop:'0.35rem'}}><StatusBadge status={workerDetailModal.workerProfile?.verificationStatus} /></div>
              </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem'}}>
              {[
                ['Skills', workerDetailModal.workerProfile?.skills?.join(', ')],
                ['Experience', `${workerDetailModal.workerProfile?.experience} years`],
                ['Hourly Rate', `₹${workerDetailModal.workerProfile?.hourlyRate}/hr`],
                ['Rating', `⭐ ${(workerDetailModal.workerProfile?.rating||0).toFixed(1)}`],
                ['Total Jobs', workerDetailModal.workerProfile?.totalJobs || 0],
                ['Location', workerDetailModal.location?.address || 'Not set'],
              ].map(([k,v]) => (
                <div key={k} style={{padding:'0.875rem', background:'#f9fafb', borderRadius:10}}>
                  <div style={{fontSize:'0.72rem', color:'#9ca3af', fontWeight:600, textTransform:'uppercase', marginBottom:'0.25rem'}}>{k}</div>
                  <div style={{fontWeight:600, color:'#1f2937', fontSize:'0.875rem'}}>{v || '—'}</div>
                </div>
              ))}
            </div>
            {workerRequests.length > 0 && (
              <div style={{marginBottom:'1.5rem'}}>
                <div style={{fontWeight:700, color:'#1f2937', marginBottom:'0.75rem', fontSize:'0.9rem'}}>Change Request History ({workerRequests.length})</div>
                <div style={{display:'flex', flexDirection:'column', gap:'0.5rem', maxHeight:160, overflowY:'auto'}}>
                  {workerRequests.map(r => (
                    <div key={r._id} style={{padding:'0.6rem 0.875rem', background:'#f9fafb', borderRadius:8, fontSize:'0.82rem', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span style={{color:'#374151'}}>{r.fieldName}: <strong>{r.suggestedValue}</strong></span>
                      <span style={{background:r.status==='completed'?'#d1fae5':r.status==='rejected'?'#fee2e2':'#fef3c7', color:r.status==='completed'?'#065f46':r.status==='rejected'?'#991b1b':'#92400e', padding:'0.1rem 0.5rem', borderRadius:50, fontSize:'0.7rem', fontWeight:700}}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{display:'flex', gap:'0.75rem', flexWrap:'wrap'}}>
              <button onClick={() => { setChangeRequestModal(workerDetailModal); setCrItems([{ fieldName:'', oldValue:'', suggestedValue:'', reason:'' }]); setCrPriority('medium'); setWorkerDetailModal(null); }} style={{flex:1, padding:'0.75rem', background:'#6366f1', color:'white', border:'none', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:'0.875rem'}}>📝 Request Change</button>
              <button onClick={() => openWorkerChat(workerDetailModal)} style={{flex:1, padding:'0.75rem', background:'#d1fae5', color:'#065f46', border:'none', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:'0.875rem'}}>💬 Chat</button>
              {workerDetailModal.workerProfile?.verificationStatus !== 'verified' && (
                <button onClick={async () => { try { await api.patch(`/admin/workers/${workerDetailModal._id}/verify`, { status:'verified' }); toast.success('Worker verified'); setWorkerDetailModal(null); fetchAll(); } catch { toast.error('Failed'); } }} style={{flex:1, padding:'0.75rem', background:'#dbeafe', color:'#1e40af', border:'none', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:'0.875rem'}}>✅ Verify</button>
              )}
              <button onClick={() => suspendWorker(workerDetailModal._id, workerDetailModal.workerProfile?.availability ? 'suspend' : 'activate')} style={{flex:1, padding:'0.75rem', background:workerDetailModal.workerProfile?.availability?'#fef3c7':'#d1fae5', color:workerDetailModal.workerProfile?.availability?'#92400e':'#065f46', border:'none', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:'0.875rem'}}>
                {workerDetailModal.workerProfile?.availability ? '⏸ Suspend' : '▶ Activate'}
              </button>
              <button onClick={() => { setDeleteModal(workerDetailModal); setWorkerDetailModal(null); }} style={{padding:'0.75rem 1.25rem', background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:'0.875rem'}}>🗑️</button>
            </div>
          </div>
        </div>
      )}

      {/* Change Request Modal — Multi-field, dynamic */}
      {changeRequestModal && (() => {
        const FIELD_CONFIG = {
          name:         { label:'Full Name',        placeholder:'Enter correct full name', type:'text' },
          phone:        { label:'Phone Number',     placeholder:'Enter phone number', type:'tel' },
          skills:       { label:'Skills',           placeholder:'e.g. Electrician, Plumber', type:'text' },
          experience:   { label:'Experience (yrs)', placeholder:'e.g. 5', type:'number' },
          hourlyRate:   { label:'Hourly Rate (₹)',  placeholder:'e.g. 350', type:'number' },
          bio:          { label:'Bio / About',      placeholder:'Enter updated bio', type:'textarea' },
          availability: { label:'Availability',     placeholder:'true or false', type:'select', options:['true','false'] },
        };
        const updateItem = (idx, key, val) => setCrItems(prev => prev.map((it, i) => i === idx ? {...it, [key]: val} : it));
        const addItem = () => setCrItems(prev => [...prev, { fieldName:'', oldValue:'', suggestedValue:'', reason:'' }]);
        const removeItem = (idx) => setCrItems(prev => prev.filter((_, i) => i !== idx));
        return (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem', backdropFilter:'blur(4px)'}}>
            <div style={{background:'white', borderRadius:20, padding:'2rem', width:'100%', maxWidth:580, boxShadow:'0 20px 60px rgba(0,0,0,0.25)', maxHeight:'90vh', overflowY:'auto'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem'}}>
                <h3 style={{margin:0, color:'#1f2937', fontWeight:700}}>📝 Request Profile Changes</h3>
                <button onClick={() => setChangeRequestModal(null)} style={{background:'none', border:'none', cursor:'pointer', fontSize:'1.25rem', color:'#9ca3af'}}>✕</button>
              </div>
              <div style={{background:'#f0f9ff', border:'1px solid #bae6fd', padding:'0.875rem 1rem', borderRadius:10, marginBottom:'1.5rem', fontSize:'0.875rem', color:'#0369a1'}}>
                Sending to: <strong>{changeRequestModal.name}</strong> — Worker must accept each change before it applies.
              </div>

              <form onSubmit={submitChangeRequest} style={{display:'flex', flexDirection:'column', gap:'1.25rem'}}>
                {/* Priority + Add button row */}
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'0.75rem'}}>
                    <label style={{fontWeight:600, color:'#374151', fontSize:'0.875rem'}}>Priority:</label>
                    <select value={crPriority} onChange={e=>setCrPriority(e.target.value)} style={{padding:'0.5rem 0.875rem', border:'2px solid #e5e7eb', borderRadius:8, fontSize:'0.875rem', outline:'none'}}>
                      {['low','medium','high'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                    </select>
                  </div>
                  <button type="button" onClick={addItem} style={{padding:'0.5rem 1rem', background:'#ede9fe', color:'#7c3aed', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.82rem'}}>
                    + Add Another Field
                  </button>
                </div>

                {/* Change items */}
                {crItems.map((item, idx) => {
                  const fc = FIELD_CONFIG[item.fieldName];
                  return (
                    <div key={idx} style={{background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:12, padding:'1.25rem', position:'relative'}}>
                      {crItems.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)} style={{position:'absolute', top:10, right:10, background:'#fee2e2', border:'none', color:'#dc2626', width:24, height:24, borderRadius:'50%', cursor:'pointer', fontSize:'0.8rem', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700}}>✕</button>
                      )}
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.875rem', marginBottom:'0.875rem'}}>
                        <div>
                          <label style={{display:'block', fontWeight:600, color:'#374151', marginBottom:'0.35rem', fontSize:'0.82rem'}}>Field to Change *</label>
                          <select value={item.fieldName} onChange={e => updateItem(idx, 'fieldName', e.target.value)} required style={{width:'100%', padding:'0.75rem', border:'2px solid #e5e7eb', borderRadius:8, fontSize:'0.875rem', outline:'none', background:'white'}}>
                            <option value="">Select field...</option>
                            {Object.entries(FIELD_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{display:'block', fontWeight:600, color:'#374151', marginBottom:'0.35rem', fontSize:'0.82rem'}}>Current Value</label>
                          <input type="text" value={item.oldValue} onChange={e => updateItem(idx, 'oldValue', e.target.value)} placeholder="Current value (reference)" style={{width:'100%', padding:'0.75rem', border:'2px solid #e5e7eb', borderRadius:8, fontSize:'0.875rem', outline:'none', boxSizing:'border-box'}} />
                        </div>
                      </div>
                      <div style={{marginBottom:'0.875rem'}}>
                        <label style={{display:'block', fontWeight:600, color:'#374151', marginBottom:'0.35rem', fontSize:'0.82rem'}}>
                          {fc ? `New ${fc.label} *` : 'Suggested New Value *'}
                        </label>
                        {fc?.type === 'textarea' ? (
                          <textarea value={item.suggestedValue} onChange={e => updateItem(idx, 'suggestedValue', e.target.value)} required rows={2} placeholder={fc?.placeholder || 'Enter new value'} style={{width:'100%', padding:'0.75rem', border:'2px solid #e5e7eb', borderRadius:8, fontSize:'0.875rem', outline:'none', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box'}} />
                        ) : fc?.type === 'select' ? (
                          <select value={item.suggestedValue} onChange={e => updateItem(idx, 'suggestedValue', e.target.value)} required style={{width:'100%', padding:'0.75rem', border:'2px solid #e5e7eb', borderRadius:8, fontSize:'0.875rem', outline:'none', background:'white'}}>
                            <option value="">Select...</option>
                            {fc.options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input type={fc?.type || 'text'} value={item.suggestedValue} onChange={e => updateItem(idx, 'suggestedValue', e.target.value)} required placeholder={fc?.placeholder || 'Enter new value'} style={{width:'100%', padding:'0.75rem', border:'2px solid #e5e7eb', borderRadius:8, fontSize:'0.875rem', outline:'none', boxSizing:'border-box'}} />
                        )}
                      </div>
                      <div>
                        <label style={{display:'block', fontWeight:600, color:'#374151', marginBottom:'0.35rem', fontSize:'0.82rem'}}>Reason / Note to Worker *</label>
                        <input type="text" value={item.reason} onChange={e => updateItem(idx, 'reason', e.target.value)} required placeholder="Why is this change needed?" style={{width:'100%', padding:'0.75rem', border:'2px solid #e5e7eb', borderRadius:8, fontSize:'0.875rem', outline:'none', boxSizing:'border-box'}} />
                      </div>
                    </div>
                  );
                })}

                <div style={{background:'#fef3c7', padding:'0.75rem 1rem', borderRadius:8, fontSize:'0.82rem', color:'#92400e'}}>
                  ⚠️ {crItems.filter(i=>i.fieldName).length} change request(s) will be sent. Worker must accept each one before changes apply.
                </div>
                <div style={{display:'flex', gap:'0.75rem'}}>
                  <button type="submit" style={{flex:1, padding:'0.875rem', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer'}}>
                    Send {crItems.filter(i=>i.fieldName).length || ''} Request(s)
                  </button>
                  <button type="button" onClick={() => setChangeRequestModal(null)} style={{flex:1, padding:'0.875rem', background:'#f3f4f6', color:'#6b7280', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer'}}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Customer Chat Modal */}
      {customerChatModal && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem', backdropFilter:'blur(4px)'}}>
          <div style={{background:'white', borderRadius:20, width:'100%', maxWidth:500, boxShadow:'0 20px 60px rgba(0,0,0,0.25)', display:'flex', flexDirection:'column', overflow:'hidden', maxHeight:'85vh'}}>
            <div style={{background:'linear-gradient(135deg,#667eea,#764ba2)', padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', gap:'1rem'}}>
              <div style={{width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.25)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1rem', flexShrink:0}}>
                {customerChatModal.name?.charAt(0)}
              </div>
              <div style={{flex:1}}>
                <div style={{color:'white', fontWeight:700}}>{customerChatModal.name}</div>
                <div style={{color:'rgba(255,255,255,0.75)', fontSize:'0.78rem'}}>{customerChatModal.email}</div>
              </div>
              <button onClick={() => setCustomerChatModal(null)} style={{background:'rgba(255,255,255,0.15)', border:'none', color:'white', width:30, height:30, borderRadius:'50%', cursor:'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center'}}>✕</button>
            </div>
            <div style={{flex:1, overflowY:'auto', padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.75rem', background:'#f8fafc', minHeight:200}}>
              {!customerThread || customerThread.messages?.length === 0 ? (
                <div style={{textAlign:'center', color:'#9ca3af', padding:'2rem', fontSize:'0.875rem'}}>
                  <div style={{fontSize:'2rem', marginBottom:'0.5rem'}}>💬</div>
                  Start a conversation with {customerChatModal.name}
                </div>
              ) : customerThread.messages?.map((m, i) => {
                const isAdmin = m.sender?._id === user?.id || m.sender?._id === user?._id;
                return (
                  <div key={i} style={{display:'flex', justifyContent:isAdmin?'flex-end':'flex-start'}}>
                    <div style={{maxWidth:'78%', padding:'0.75rem 1rem', borderRadius:isAdmin?'16px 4px 16px 16px':'4px 16px 16px 16px', background:isAdmin?'linear-gradient(135deg,#667eea,#764ba2)':'white', color:isAdmin?'white':'#1f2937', fontSize:'0.875rem', boxShadow:isAdmin?'none':'0 1px 4px rgba(0,0,0,0.08)'}}>
                      <div style={{fontSize:'0.68rem', opacity:0.7, marginBottom:'0.2rem'}}>{isAdmin?'You (Admin)':customerChatModal.name}</div>
                      {m.text}
                      <div style={{fontSize:'0.65rem', opacity:0.6, marginTop:'0.25rem', textAlign:'right'}}>{new Date(m.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{padding:'1rem', borderTop:'1px solid #f3f4f6', display:'flex', gap:'0.75rem', background:'white'}}>
              <input value={customerChatMsg} onChange={e=>setCustomerChatMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendCustomerChatMsg()} placeholder={`Message ${customerChatModal.name}...`} style={{flex:1, padding:'0.75rem 1.25rem', border:'2px solid #e5e7eb', borderRadius:50, fontSize:'0.875rem', outline:'none', transition:'border-color 0.2s'}} onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
              <button onClick={sendCustomerChatMsg} disabled={!customerChatMsg.trim()} style={{padding:'0.75rem 1.5rem', background:customerChatMsg.trim()?'linear-gradient(135deg,#667eea,#764ba2)':'#e5e7eb', color:customerChatMsg.trim()?'white':'#9ca3af', border:'none', borderRadius:50, cursor:customerChatMsg.trim()?'pointer':'not-allowed', fontWeight:700, fontSize:'0.875rem', transition:'all 0.2s'}}>Send</button>
            </div>
          </div>
        </div>
      )}

      {/* -- NEW THREAD MODAL -- */}
      {newThreadForm.show && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{background:'white', borderRadius:'20px', padding:'2rem', width:'100%', maxWidth:480, boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
            <h3 style={{margin:'0 0 1.5rem', color:'#1f2937'}}>New Support Thread</h3>
            <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
              <select value={newThreadForm.type} onChange={e=>setNewThreadForm({...newThreadForm, type:e.target.value})} style={{padding:'0.75rem', border:'2px solid #e5e7eb', borderRadius:'8px', fontSize:'0.9rem', outline:'none'}}>
                <option value="admin-worker">Admin ? Worker</option>
                <option value="admin-customer">Admin ? Customer</option>
              </select>
              <select value={newThreadForm.targetId} onChange={e=>setNewThreadForm({...newThreadForm, targetId:e.target.value})} style={{padding:'0.75rem', border:'2px solid #e5e7eb', borderRadius:'8px', fontSize:'0.9rem', outline:'none'}}>
                <option value="">Select {newThreadForm.type==='admin-worker'?'Worker':'Customer'}</option>
                {(newThreadForm.type==='admin-worker'?workers:customers).map(u=><option key={u._id} value={u._id}>{u.name} — {u.email}</option>)}
              </select>
              <input value={newThreadForm.subject} onChange={e=>setNewThreadForm({...newThreadForm, subject:e.target.value})} placeholder="Subject" style={{padding:'0.75rem', border:'2px solid #e5e7eb', borderRadius:'8px', fontSize:'0.9rem', outline:'none'}} />
              <textarea value={newThreadForm.message} onChange={e=>setNewThreadForm({...newThreadForm, message:e.target.value})} placeholder="First message..." rows={4} style={{padding:'0.75rem', border:'2px solid #e5e7eb', borderRadius:'8px', fontSize:'0.9rem', outline:'none', resize:'vertical'}} />
              <div style={{display:'flex', gap:'0.75rem'}}>
                <button onClick={createThread} style={{flex:1, padding:'0.875rem', background:'#6366f1', color:'white', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:'700'}}>Send Message</button>
                <button onClick={()=>setNewThreadForm({...newThreadForm, show:false})} style={{flex:1, padding:'0.875rem', background:'#f3f4f6', color:'#6b7280', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:'600'}}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -- WORKER CHAT MODAL -- */}
      {workerChatModal && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem', backdropFilter:'blur(4px)'}}>
          <div style={{background:'white', borderRadius:20, width:'100%', maxWidth:500, boxShadow:'0 20px 60px rgba(0,0,0,0.25)', display:'flex', flexDirection:'column', overflow:'hidden', maxHeight:'85vh'}}>
            <div style={{background:'linear-gradient(135deg,#059669,#0d9488)', padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', gap:'1rem'}}>
              <Avatar user={workerChatModal} size={40} />
              <div style={{flex:1}}>
                <div style={{color:'white', fontWeight:700}}>{workerChatModal.name}</div>
                <div style={{color:'rgba(255,255,255,0.75)', fontSize:'0.78rem'}}>👷 Worker · {workerChatModal.email}</div>
              </div>
              <button onClick={() => setWorkerChatModal(null)} style={{background:'rgba(255,255,255,0.15)', border:'none', color:'white', width:30, height:30, borderRadius:'50%', cursor:'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center'}}>✕</button>
            </div>
            <div style={{flex:1, overflowY:'auto', padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.75rem', background:'#f8fafc', minHeight:200}}>
              {!workerChatThread ? (
                <div style={{textAlign:'center', color:'#9ca3af', padding:'2rem', fontSize:'0.875rem'}}>
                  <div style={{fontSize:'2rem', marginBottom:'0.5rem'}}>💬</div>
                  Start a conversation with {workerChatModal.name}
                </div>
              ) : workerChatThread.messages?.map((m, i) => {
                const isAdmin = m.sender?._id === user?._id || m.sender === user?._id;
                return (
                  <div key={i} style={{display:'flex', justifyContent:isAdmin?'flex-end':'flex-start'}}>
                    <div style={{maxWidth:'78%', padding:'0.75rem 1rem', borderRadius:isAdmin?'16px 4px 16px 16px':'4px 16px 16px 16px', background:isAdmin?'linear-gradient(135deg,#059669,#0d9488)':'white', color:isAdmin?'white':'#1f2937', fontSize:'0.875rem', boxShadow:isAdmin?'none':'0 1px 4px rgba(0,0,0,0.08)'}}>
                      <div style={{fontSize:'0.68rem', opacity:0.7, marginBottom:'0.2rem'}}>{isAdmin?'You (Admin)':workerChatModal.name}</div>
                      {m.text}
                      <div style={{fontSize:'0.65rem', opacity:0.6, marginTop:'0.25rem', textAlign:'right'}}>{new Date(m.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{padding:'1rem', borderTop:'1px solid #f3f4f6', display:'flex', gap:'0.75rem', background:'white'}}>
              <input value={workerChatMsg} onChange={e=>setWorkerChatMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendWorkerChatMsg()} placeholder={`Message ${workerChatModal.name}...`} style={{flex:1, padding:'0.75rem 1.25rem', border:'2px solid #e5e7eb', borderRadius:50, fontSize:'0.875rem', outline:'none'}} />
              <button onClick={sendWorkerChatMsg} disabled={!workerChatMsg.trim()} style={{padding:'0.75rem 1.5rem', background:workerChatMsg.trim()?'linear-gradient(135deg,#059669,#0d9488)':'#e5e7eb', color:workerChatMsg.trim()?'white':'#9ca3af', border:'none', borderRadius:50, cursor:workerChatMsg.trim()?'pointer':'not-allowed', fontWeight:700, fontSize:'0.875rem'}}>Send</button>
            </div>
          </div>
        </div>
      )}

      {/* -- DELETE MODAL -- */}
      {deleteModal && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{background:'white', borderRadius:'20px', padding:'2rem', width:'100%', maxWidth:420, textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
            <div style={{fontSize:'3rem', marginBottom:'1rem'}}>📊?</div>
            <h3 style={{color:'#1f2937', marginBottom:'0.5rem'}}>Delete {deleteModal.name}?</h3>
            <p style={{color:'#6b7280', marginBottom:'1.5rem', fontSize:'0.9rem'}}>This action cannot be undone.</p>
            <div style={{display:'flex', gap:'0.75rem'}}>
              <button onClick={handleDelete} style={{flex:1, padding:'0.875rem', background:'#ef4444', color:'white', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:'700'}}>Yes, Delete</button>
              <button onClick={()=>setDeleteModal(null)} style={{flex:1, padding:'0.875rem', background:'#f3f4f6', color:'#6b7280', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:'600'}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* -- DISPUTE ACTION MODAL -- */}
      {resolveModal && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem', backdropFilter:'blur(4px)'}}>
          <div style={{background:'white', borderRadius:'20px', padding:'2rem', width:'100%', maxWidth:520, boxShadow:'0 20px 60px rgba(0,0,0,0.3)', maxHeight:'90vh', overflowY:'auto'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
              <h3 style={{margin:0, color:'#1f2937', fontWeight:700}}>Dispute Action</h3>
              <button onClick={()=>setResolveModal(null)} style={{background:'none', border:'none', cursor:'pointer', fontSize:'1.25rem', color:'#9ca3af'}}>X</button>
            </div>
            <div style={{background:'#f9fafb', borderRadius:10, padding:'0.875rem 1rem', marginBottom:'1.25rem', fontSize:'0.85rem', color:'#374151'}}>
              <strong>{resolveModal.reason?.replace(/-/g,' ')}</strong> — {resolveModal.raisedBy?.name} vs {resolveModal.against?.name}
            </div>
            <form onSubmit={handleResolveDispute} style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
              <div>
                <label style={{display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem'}}>Action / New Status</label>
                <select value={resolveModal.resolution} onChange={e=>setResolveModal({...resolveModal,resolution:e.target.value})}
                  style={{width:'100%', padding:'0.75rem', border:'2px solid #e5e7eb', borderRadius:'8px', fontSize:'0.9rem', outline:'none', background:'white'}}>
                  <option value="under-review">Under Review</option>
                  <option value="evidence-requested">Request Evidence</option>
                  <option value="mediation">Start Mediation</option>
                  <option value="partial-settlement">Partial Settlement</option>
                  <option value="refund-review">Refund Review</option>
                  <option value="warning-issued">Issue Warning</option>
                  <option value="penalty-applied">Apply Penalty</option>
                  <option value="resolved-customer">Resolved — Customer Wins</option>
                  <option value="resolved-worker">Resolved — Worker Wins</option>
                  <option value="closed">Close Dispute</option>
                  <option value="reopened">Reopen</option>
                </select>
              </div>
              <div>
                <label style={{display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem'}}>Action Note / Resolution</label>
                <textarea value={resolveModal.note} onChange={e=>setResolveModal({...resolveModal,note:e.target.value})} placeholder="Explain the action taken..." rows={3} required
                  style={{width:'100%', padding:'0.75rem', border:'2px solid #e5e7eb', borderRadius:'8px', fontSize:'0.9rem', outline:'none', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box'}} />
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem'}}>
                <div>
                  <label style={{display:'block', fontWeight:600, color:'#374151', marginBottom:'0.3rem', fontSize:'0.8rem'}}>Refund (Rs)</label>
                  <input type="number" min="0" value={resolveModal.refund} onChange={e=>setResolveModal({...resolveModal,refund:e.target.value})} placeholder="0"
                    style={{width:'100%', padding:'0.6rem', border:'2px solid #e5e7eb', borderRadius:'8px', fontSize:'0.875rem', outline:'none', boxSizing:'border-box'}} />
                </div>
                <div>
                  <label style={{display:'block', fontWeight:600, color:'#374151', marginBottom:'0.3rem', fontSize:'0.8rem'}}>Penalty (Rs)</label>
                  <input type="number" min="0" value={resolveModal.penalty} onChange={e=>setResolveModal({...resolveModal,penalty:e.target.value})} placeholder="0"
                    style={{width:'100%', padding:'0.6rem', border:'2px solid #e5e7eb', borderRadius:'8px', fontSize:'0.875rem', outline:'none', boxSizing:'border-box'}} />
                </div>
                <div>
                  <label style={{display:'block', fontWeight:600, color:'#374151', marginBottom:'0.3rem', fontSize:'0.8rem'}}>Settlement (Rs)</label>
                  <input type="number" min="0" value={resolveModal.settlement} onChange={e=>setResolveModal({...resolveModal,settlement:e.target.value})} placeholder="0"
                    style={{width:'100%', padding:'0.6rem', border:'2px solid #e5e7eb', borderRadius:'8px', fontSize:'0.875rem', outline:'none', boxSizing:'border-box'}} />
                </div>
              </div>
              <div>
                <label style={{display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem'}}>Warning Note (optional)</label>
                <input type="text" value={resolveModal.warning} onChange={e=>setResolveModal({...resolveModal,warning:e.target.value})} placeholder="Warning message..."
                  style={{width:'100%', padding:'0.75rem', border:'2px solid #e5e7eb', borderRadius:'8px', fontSize:'0.9rem', outline:'none', boxSizing:'border-box'}} />
              </div>
              <div style={{display:'flex', gap:'0.75rem'}}>
                <button type="submit" style={{flex:1, padding:'0.875rem', background:'#6366f1', color:'white', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:'700'}}>Apply Action</button>
                <button type="button" onClick={()=>setResolveModal(null)} style={{flex:1, padding:'0.875rem', background:'#f3f4f6', color:'#6b7280', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:'600'}}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;



