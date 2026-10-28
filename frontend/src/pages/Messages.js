import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import api from '../utils/api';

const fmtTime = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

function Messages() {
  const { bookingId: paramBookingId } = useParams();
  const navigate = useNavigate(); // eslint-disable-line
  const location = useLocation();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('booking');
  const [bookingConvs, setBookingConvs] = useState([]);
  const [adminThreads, setAdminThreads] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadForm, setNewThreadForm] = useState({ targetUserId: '', subject: '', message: '' });
  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const isAdmin = user?.role === 'admin';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ── Fetch booking conversations ──────────────────────────────────────────
  const fetchBookingConvs = useCallback(async () => {
    try {
      const res = await api.get('/messages/conversations');
      setBookingConvs(res.data || []);
    } catch {
      // silently ignore
    }
  }, []);

  // ── Fetch admin threads ──────────────────────────────────────────────────
  const fetchAdminThreads = useCallback(async () => {
    try {
      const res = await api.get('/support/threads');
      setAdminThreads(res.data || []);
    } catch {
      // silently ignore
    }
  }, []);

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingConvs(true);
      await Promise.all([fetchBookingConvs(), fetchAdminThreads()]);
      setLoadingConvs(false);
    };
    load();
  }, [fetchBookingConvs, fetchAdminThreads]);

  // ── If navigated with a bookingId param, open that conv ──────────────────
  useEffect(() => {
    if (paramBookingId) {
      setActiveTab('booking');
      setActiveConvId(paramBookingId);
      setMobileShowChat(true);
    }
  }, [paramBookingId]);

  // ── If navigated with ?tab=admin, switch to admin tab ─────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'admin') {
      setActiveTab('admin');
    }
  }, [location.search]);

  // ── Fetch booking messages when activeConvId changes (booking tab) ────────
  const fetchBookingMessages = useCallback(async (bookingId) => {
    try {
      const res = await api.get(`/messages/${bookingId}`);
      setMessages(res.data || []);
    } catch {
      toast.error('Failed to load messages');
    }
  }, []);

  // ── Fetch admin thread ────────────────────────────────────────────────────
  const fetchAdminThread = useCallback(async (threadId) => {
    try {
      const res = await api.get(`/support/threads/${threadId}`);
      setActiveThread(res.data);
    } catch {
      toast.error('Failed to load thread');
    }
  }, []);

  // ── Mark admin thread as read ─────────────────────────────────────────────
  const markThreadRead = useCallback(async (threadId) => {
    try {
      await api.patch(`/support/threads/${threadId}/read`);
      fetchAdminThreads();
    } catch {
      // ignore
    }
  }, [fetchAdminThreads]);

  // ── Open a conversation ───────────────────────────────────────────────────
  const openConversation = useCallback((id, tab) => {
    setActiveConvId(id);
    setActiveTab(tab);
    setMessages([]);
    setActiveThread(null);
    setMobileShowChat(true);

    if (tab === 'booking') {
      fetchBookingMessages(id);
    } else {
      fetchAdminThread(id);
      markThreadRead(id);
    }
  }, [fetchBookingMessages, fetchAdminThread, markThreadRead]);

  // ── Poll booking messages every 2s (faster real-time) ───────────────────
  useEffect(() => {
    if (activeTab === 'booking' && activeConvId) {
      // Poll immediately then every 2s
      const poll = () => fetchBookingMessages(activeConvId);
      pollRef.current = setInterval(() => {
        if (!document.hidden) poll(); // pause when tab not visible
      }, 2000);
    }
    return () => clearInterval(pollRef.current);
  }, [activeTab, activeConvId, fetchBookingMessages]);

  // ── Auto-scroll on new messages ───────────────────────────────────────────
  useEffect(() => {
    scrollToBottom();
  }, [messages, activeThread]);

  // ── Load admin users list (admin only) ────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    const loadUsers = async () => {
      try {
        const [cRes, wRes] = await Promise.all([
          api.get('/admin/customers'),
          api.get('/admin/workers'),
        ]);
        setAllUsers([...(cRes.data || []), ...(wRes.data || [])]);
      } catch {
        // ignore
      }
    };
    loadUsers();
  }, [isAdmin]);

  // ── Worker: start a thread with admin ─────────────────────────────────────
  const startAdminThread = async () => {
    const existing = adminThreads.find(t =>
      t.participants?.some(p => (p._id || p) !== user?._id)
    );
    if (existing) {
      openConversation(existing._id, 'admin');
      return;
    }
    setShowNewThread(true);
    setNewThreadForm({ targetUserId: '', subject: 'Profile / Pricing Discussion', message: '' });
    // Pre-fetch admin user id
    try {
      const { data } = await api.get('/admin/admin-user');
      setNewThreadForm(f => ({ ...f, targetUserId: data._id }));
      setAllUsers([data]);
    } catch {}
  };

  // ── Send booking message ──────────────────────────────────────────────────
  const sendBookingMessage = async () => {
    if (!newMessage.trim() || !activeConvId) return;
    const conv = bookingConvs.find((c) => c.bookingId === activeConvId || c._id === activeConvId);
    let receiverId = null;
    if (conv) {
      if (user?.role === 'worker') {
        receiverId = conv.booking?.customer?._id || conv.customerId || conv.customer?._id;
      } else {
        receiverId = conv.booking?.worker?._id || conv.workerId || conv.worker?._id;
      }
    }

    // Optimistic update — show message instantly
    const optimisticMsg = {
      _id: 'temp_' + Date.now(),
      sender: { _id: user?.id || user?._id, name: user?.name, avatar: user?.avatar, role: user?.role },
      message: newMessage.trim(),
      createdAt: new Date().toISOString(),
      isRead: false,
      _optimistic: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    const msgText = newMessage.trim();
    setNewMessage('');

    setSending(true);
    try {
      await api.post('/messages', {
        bookingId: activeConvId,
        receiverId,
        message: msgText,
      });
      // Refresh to get real message from server
      fetchBookingMessages(activeConvId);
      fetchBookingConvs();
    } catch {
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m._id !== optimisticMsg._id));
      setNewMessage(msgText);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // ── Send admin thread message ─────────────────────────────────────────────
  const sendAdminMessage = async () => {
    if (!newMessage.trim() || !activeConvId) return;
    const msgText = newMessage.trim();
    setNewMessage('');
    setSending(true);
    try {
      const res = await api.post(`/support/threads/${activeConvId}/messages`, { text: msgText });
      setActiveThread(res.data);
      fetchAdminThreads();
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    if (activeTab === 'booking') sendBookingMessage();
    else sendAdminMessage();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Create new admin thread ───────────────────────────────────────────────
  const createThread = async () => {
    const { targetUserId, subject, message } = newThreadForm;
    if (!targetUserId || !subject.trim() || !message.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    setSending(true);
    try {
      const res = await api.post('/support/threads', {
        targetUserId,
        subject: subject.trim(),
        message: message.trim(),
        threadType: isAdmin ? 'admin-worker' : 'admin-worker',
      });
      setShowNewThread(false);
      setNewThreadForm({ targetUserId: '', subject: '', message: '' });
      setUserSearch('');
      await fetchAdminThreads();
      openConversation(res.data._id || res.data.thread?._id, 'admin');
    } catch {
      toast.error('Failed to create thread');
    } finally {
      setSending(false);
    }
  };

  // ── Filtered lists ────────────────────────────────────────────────────────
  const filteredBooking = bookingConvs.filter((c) => {
    const name =
      c.booking?.worker?.name ||
      c.booking?.customer?.name ||
      c.workerName || c.customerName ||
      c.otherUser?.name || '';
    const service = c.booking?.service || c.serviceName || c.service || '';
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      service.toLowerCase().includes(search.toLowerCase())
    );
  });

  const filteredAdmin = adminThreads.filter((t) => {
    const subject = t.subject || '';
    const name = t.otherUser?.name || t.participants?.find((p) => p._id !== user?._id)?.name || '';
    return (
      subject.toLowerCase().includes(search.toLowerCase()) ||
      name.toLowerCase().includes(search.toLowerCase())
    );
  });

  const filteredUsers = allUsers.filter((u) =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getInitials = (name) =>
    (name || '?')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const getThreadUnread = (thread) => {
    if (!thread?.messages) return 0;
    return thread.messages.filter((m) => m.sender?._id !== user?._id && !m.isRead).length;
  };

  const getConvOtherUser = (conv) => {
    if (user?.role === 'worker') {
      const name = conv.booking?.customer?.name || conv.customerName || conv.customer?.name || 'Customer';
      const avatar = conv.booking?.customer?.avatar || conv.customer?.avatar;
      return { name, role: 'customer', avatar };
    }
    const name = conv.booking?.worker?.name || conv.workerName || conv.worker?.name || 'Worker';
    const avatar = conv.booking?.worker?.avatar || conv.worker?.avatar;
    return { name, role: 'worker', avatar };
  };

  const getThreadOtherUser = (thread) => {
    const other = thread.participants?.find((p) => p._id !== user?._id);
    return other || { name: 'Unknown', role: '' };
  };

  const roleColor = (role) => {
    if (role === 'admin') return '#7c3aed';
    if (role === 'worker') return '#059669';
    return '#2563eb';
  };

  // ── Derived: active booking conv ──────────────────────────────────────────
  const activeBookingConv = bookingConvs.find(
    (c) => c.bookingId === activeConvId || c._id === activeConvId
  );
  const activeAdminThread = adminThreads.find((t) => t._id === activeConvId);

  // ── Styles ────────────────────────────────────────────────────────────────
  const S = {
    page: {
      minHeight: '100vh',
      background: '#f1f5f9',
      display: 'flex',
      flexDirection: 'column',
    },
    container: {
      flex: 1,
      display: 'flex',
      maxWidth: 1200,
      width: '100%',
      margin: '24px auto',
      padding: '0 16px',
      gap: 0,
      height: 'calc(100vh - 120px)',
    },
    sidebar: {
      width: 320,
      minWidth: 320,
      background: '#fff',
      borderRadius: '16px 0 0 16px',
      border: '1px solid #e2e8f0',
      borderRight: 'none',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    sidebarHeader: {
      padding: '20px 16px 12px',
      borderBottom: '1px solid #f1f5f9',
    },
    sidebarTitle: {
      fontSize: 20,
      fontWeight: 700,
      color: '#1e293b',
      marginBottom: 12,
    },
    searchBar: {
      display: 'flex',
      alignItems: 'center',
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: 10,
      padding: '8px 12px',
      gap: 8,
      marginBottom: 12,
    },
    searchInput: {
      border: 'none',
      background: 'transparent',
      outline: 'none',
      flex: 1,
      fontSize: 14,
      color: '#334155',
    },
    tabRow: {
      display: 'flex',
      gap: 4,
    },
    tab: (active) => ({
      flex: 1,
      padding: '7px 0',
      borderRadius: 8,
      border: 'none',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: active ? 600 : 400,
      background: active ? '#4f46e5' : 'transparent',
      color: active ? '#fff' : '#64748b',
      transition: 'all 0.15s',
    }),
    threadList: {
      flex: 1,
      overflowY: 'auto',
      padding: '8px 0',
    },
    threadItem: (active) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 16px',
      cursor: 'pointer',
      background: active ? '#eef2ff' : 'transparent',
      borderLeft: active ? '3px solid #4f46e5' : '3px solid transparent',
      transition: 'background 0.12s',
    }),
    avatarWrap: {
      position: 'relative',
      flexShrink: 0,
    },
    avatar: (color) => ({
      width: 44,
      height: 44,
      borderRadius: '50%',
      background: color || '#4f46e5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontWeight: 700,
      fontSize: 15,
      overflow: 'hidden',
    }),
    unreadBadge: {
      position: 'absolute',
      top: -3,
      right: -3,
      background: '#ef4444',
      color: '#fff',
      borderRadius: '50%',
      width: 18,
      height: 18,
      fontSize: 10,
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid #fff',
    },
    threadInfo: {
      flex: 1,
      minWidth: 0,
    },
    threadName: {
      fontSize: 14,
      fontWeight: 600,
      color: '#1e293b',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    threadSub: {
      fontSize: 12,
      color: '#64748b',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      marginTop: 1,
    },
    threadMeta: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 4,
      flexShrink: 0,
    },
    threadTime: {
      fontSize: 11,
      color: '#94a3b8',
    },
    unreadCount: {
      background: '#4f46e5',
      color: '#fff',
      borderRadius: 10,
      padding: '1px 6px',
      fontSize: 11,
      fontWeight: 700,
    },
    chatPanel: {
      flex: 1,
      background: '#fff',
      borderRadius: '0 16px 16px 0',
      border: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    chatHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '16px 20px',
      borderBottom: '1px solid #f1f5f9',
      background: '#fff',
      flexShrink: 0,
    },
    chatHeaderName: {
      fontSize: 16,
      fontWeight: 700,
      color: '#1e293b',
    },
    roleBadge: (color) => ({
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: color + '18',
      color: color,
      textTransform: 'capitalize',
      marginLeft: 6,
    }),
    messagesArea: {
      flex: 1,
      overflowY: 'auto',
      padding: '20px 20px 8px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    },
    msgRow: (mine) => ({
      display: 'flex',
      flexDirection: mine ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: 8,
    }),
    msgAvatar: (color) => ({
      width: 32,
      height: 32,
      borderRadius: '50%',
      background: color || '#4f46e5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontWeight: 700,
      fontSize: 12,
      flexShrink: 0,
      overflow: 'hidden',
    }),
    msgBubble: (mine) => ({
      maxWidth: '65%',
      background: mine ? '#4f46e5' : '#f1f5f9',
      color: mine ? '#fff' : '#1e293b',
      borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
      padding: '10px 14px',
      fontSize: 14,
      lineHeight: 1.5,
      wordBreak: 'break-word',
    }),
    msgMeta: (mine) => ({
      display: 'flex',
      flexDirection: mine ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 3,
    }),
    msgSenderName: {
      fontSize: 11,
      color: '#64748b',
      fontWeight: 600,
    },
    msgTime: {
      fontSize: 11,
      color: '#94a3b8',
    },
    inputArea: {
      padding: '12px 16px',
      borderTop: '1px solid #f1f5f9',
      display: 'flex',
      gap: 10,
      alignItems: 'flex-end',
      background: '#fff',
      flexShrink: 0,
    },
    textarea: {
      flex: 1,
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: '10px 14px',
      fontSize: 14,
      resize: 'none',
      outline: 'none',
      fontFamily: 'inherit',
      color: '#1e293b',
      background: '#f8fafc',
      maxHeight: 120,
      lineHeight: 1.5,
    },
    sendBtn: (disabled) => ({
      width: 44,
      height: 44,
      borderRadius: '50%',
      background: disabled ? '#c7d2fe' : '#4f46e5',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      transition: 'background 0.15s',
    }),
    emptyState: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#94a3b8',
      gap: 12,
    },
    newThreadBtn: {
      margin: '8px 16px 4px',
      padding: '9px 0',
      background: '#4f46e5',
      color: '#fff',
      border: 'none',
      borderRadius: 10,
      fontWeight: 600,
      fontSize: 14,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    modalOverlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(15,23,42,0.45)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    },
    modal: {
      background: '#fff',
      borderRadius: 16,
      padding: 28,
      width: '100%',
      maxWidth: 460,
      boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 700,
      color: '#1e293b',
      marginBottom: 20,
    },
    label: {
      fontSize: 13,
      fontWeight: 600,
      color: '#475569',
      marginBottom: 6,
      display: 'block',
    },
    input: {
      width: '100%',
      border: '1px solid #e2e8f0',
      borderRadius: 10,
      padding: '10px 12px',
      fontSize: 14,
      outline: 'none',
      color: '#1e293b',
      background: '#f8fafc',
      boxSizing: 'border-box',
      marginBottom: 14,
    },
    userOption: (selected) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 10px',
      borderRadius: 8,
      cursor: 'pointer',
      background: selected ? '#eef2ff' : 'transparent',
      border: selected ? '1px solid #c7d2fe' : '1px solid transparent',
      marginBottom: 4,
    }),
    modalBtnRow: {
      display: 'flex',
      gap: 10,
      marginTop: 4,
    },
    cancelBtn: {
      flex: 1,
      padding: '10px 0',
      border: '1px solid #e2e8f0',
      borderRadius: 10,
      background: '#fff',
      color: '#64748b',
      fontWeight: 600,
      fontSize: 14,
      cursor: 'pointer',
    },
    confirmBtn: (disabled) => ({
      flex: 1,
      padding: '10px 0',
      border: 'none',
      borderRadius: 10,
      background: disabled ? '#c7d2fe' : '#4f46e5',
      color: '#fff',
      fontWeight: 600,
      fontSize: 14,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }),
    backBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#4f46e5',
      fontWeight: 600,
      fontSize: 14,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: '0 4px 0 0',
    },
  };

  // ── Avatar colors by role ─────────────────────────────────────────────────
  const avatarBg = (role) => {
    if (role === 'admin') return '#7c3aed';
    if (role === 'worker') return '#059669';
    return '#4f46e5';
  };

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderAvatar = (name, role, avatar, size = 44) => {
    const bg = avatarBg(role);
    return (
      <div style={{ ...S.avatar(bg), width: size, height: size, fontSize: size * 0.34 }}>
        {avatar
          ? <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : getInitials(name)}
      </div>
    );
  };

  const renderBookingThreadItem = (conv) => {
    const other = getConvOtherUser(conv);
    const isActive = activeConvId === (conv.bookingId || conv._id) && activeTab === 'booking';
    const unread = conv.unreadCount || 0;
    const lastMsg = conv.lastMessage?.message || '';
    const lastTime = fmtTime(conv.lastMessage?.createdAt);
    const service = conv.booking?.service || conv.serviceName || conv.service || '';
    return (
      <div
        key={conv.bookingId || conv._id}
        style={S.threadItem(isActive)}
        onClick={() => openConversation(conv.bookingId || conv._id, 'booking')}
      >
        <div style={S.avatarWrap}>
          {renderAvatar(other.name, other.role, other.avatar)}
          {unread > 0 && <div style={S.unreadBadge}>{unread}</div>}
        </div>
        <div style={S.threadInfo}>
          <div style={S.threadName}>{other.name}</div>
          <div style={S.threadSub}>{service || lastMsg || 'No messages yet'}</div>
        </div>
        <div style={S.threadMeta}>
          <span style={S.threadTime}>{lastTime}</span>
          {unread > 0 && <span style={S.unreadCount}>{unread}</span>}
        </div>
      </div>
    );
  };

  const renderAdminThreadItem = (thread) => {
    const other = getThreadOtherUser(thread);
    const isActive = activeConvId === thread._id && activeTab === 'admin';
    const unread = getThreadUnread(thread);
    const lastMsg = thread.messages?.[thread.messages.length - 1]?.text || '';
    const lastTime = fmtTime(thread.lastMessageAt);
    return (
      <div
        key={thread._id}
        style={S.threadItem(isActive)}
        onClick={() => openConversation(thread._id, 'admin')}
      >
        <div style={S.avatarWrap}>
          {renderAvatar(other.name, other.role, other.avatar)}
          {unread > 0 && <div style={S.unreadBadge}>{unread}</div>}
        </div>
        <div style={S.threadInfo}>
          <div style={S.threadName}>{thread.subject || other.name}</div>
          <div style={S.threadSub}>{other.name}{lastMsg ? ` · ${lastMsg}` : ''}</div>
        </div>
        <div style={S.threadMeta}>
          <span style={S.threadTime}>{lastTime}</span>
          {unread > 0 && <span style={S.unreadCount}>{unread}</span>}
        </div>
      </div>
    );
  };

  const renderBookingMessages = () =>
    messages.map((msg, i) => {
      const mine = msg.sender?._id === user?._id || msg.senderId === user?._id;
      const senderName = msg.sender?.name || (mine ? user?.name : 'Other');
      const senderRole = msg.sender?.role || '';
      return (
        <div key={msg._id || i} style={S.msgRow(mine)}>
          {renderAvatar(senderName, senderRole, msg.sender?.avatar, 32)}
          <div>
            <div style={S.msgMeta(mine)}>
              <span style={S.msgSenderName}>{senderName}</span>
              <span style={S.msgTime}>{fmtTime(msg.createdAt)}</span>
            </div>
            <div style={S.msgBubble(mine)}>{msg.message || msg.text}</div>
          </div>
        </div>
      );
    });

  const renderAdminMessages = () => {
    if (!activeThread?.messages) return null;
    return activeThread.messages.map((msg, i) => {
      const mine = msg.sender?._id === user?._id;
      const senderName = msg.sender?.name || 'Unknown';
      const senderRole = msg.sender?.role || '';
      const color = roleColor(senderRole);
      return (
        <div key={msg._id || i} style={S.msgRow(mine)}>
          {renderAvatar(senderName, senderRole, msg.sender?.avatar, 32)}
          <div>
            <div style={S.msgMeta(mine)}>
              <span style={S.msgSenderName}>{senderName}</span>
              <span style={S.roleBadge(color)}>{senderRole || 'user'}</span>
              <span style={S.msgTime}>{fmtTime(msg.createdAt)}</span>
            </div>
            <div style={S.msgBubble(mine)}>{msg.text}</div>
          </div>
        </div>
      );
    });
  };

  // ── Chat header info ──────────────────────────────────────────────────────
  const getChatHeaderInfo = () => {
    if (activeTab === 'booking' && activeBookingConv) {
      const other = getConvOtherUser(activeBookingConv);
      const service = activeBookingConv.booking?.service || activeBookingConv.serviceName || '';
      return { name: other.name, role: other.role, sub: service, avatar: null };
    }
    if (activeTab === 'admin' && activeAdminThread) {
      const other = getThreadOtherUser(activeAdminThread);
      return { name: other.name, role: other.role, sub: activeAdminThread.subject, avatar: other.avatar };
    }
    return null;
  };

  const headerInfo = getChatHeaderInfo();

  // ── Mobile responsive: hide sidebar when chat is open ────────────────────
  const isMobile = window.innerWidth < 768;
  const showSidebar = !isMobile || !mobileShowChat;
  const showChat = !isMobile || mobileShowChat;

  return (
    <div style={S.page}>
      <Navbar />
      <div style={{ ...S.container, ...(isMobile ? { margin: '0', padding: '0', height: '100vh', borderRadius: 0 } : {}) }}>

        {/* ── Sidebar ── */}
        {showSidebar && (
          <div style={{ ...S.sidebar, ...(isMobile ? { width: '100%', minWidth: 0, borderRadius: 0, border: '1px solid #e2e8f0' } : {}) }}>
            <div style={S.sidebarHeader}>
              <div style={S.sidebarTitle}>Messages</div>
              <div style={S.searchBar}>
                <svg width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  style={S.searchInput}
                  placeholder="Search conversations…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div style={S.tabRow}>
                <button style={S.tab(activeTab === 'booking')} onClick={() => setActiveTab('booking')}>
                  Booking Chats
                </button>
                <button style={S.tab(activeTab === 'admin')} onClick={() => setActiveTab('admin')}>
                  Admin Messages
                </button>
              </div>
            </div>

            {isAdmin && activeTab === 'admin' && (
              <button style={S.newThreadBtn} onClick={() => setShowNewThread(true)}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                New Thread
              </button>
            )}
            {!isAdmin && activeTab === 'admin' && (
              <button style={S.newThreadBtn} onClick={startAdminThread}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Message Admin
              </button>
            )}

            <div style={S.threadList}>
              {loadingConvs ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading…</div>
              ) : activeTab === 'booking' ? (
                filteredBooking.length === 0
                  ? <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No conversations found</div>
                  : filteredBooking.map(renderBookingThreadItem)
              ) : (
                filteredAdmin.length === 0
                  ? <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No threads found</div>
                  : filteredAdmin.map(renderAdminThreadItem)
              )}
            </div>
          </div>
        )}

        {/* ── Chat Panel ── */}
        {showChat && (
          <div style={{ ...S.chatPanel, ...(isMobile ? { width: '100%', borderRadius: 0, border: '1px solid #e2e8f0' } : {}) }}>
            {!activeConvId ? (
              <div style={S.emptyState}>
                <svg width="56" height="56" fill="none" stroke="#c7d2fe" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8' }}>Select a conversation</div>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>Choose a chat from the sidebar to get started</div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={S.chatHeader}>
                  {isMobile && (
                    <button style={S.backBtn} onClick={() => setMobileShowChat(false)}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M15 18l-6-6 6-6"/>
                      </svg>
                      Back
                    </button>
                  )}
                  {headerInfo && (
                    <>
                      {renderAvatar(headerInfo.name, headerInfo.role, headerInfo.avatar, 40)}
                      <div>
                        <div style={S.chatHeaderName}>
                          {headerInfo.name}
                          <span style={S.roleBadge(roleColor(headerInfo.role))}>{headerInfo.role || 'user'}</span>
                        </div>
                        {headerInfo.sub && (
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{headerInfo.sub}</div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Messages */}
                <div style={S.messagesArea}>
                  {activeTab === 'booking' ? renderBookingMessages() : renderAdminMessages()}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div style={S.inputArea}>
                  <textarea
                    style={S.textarea}
                    rows={1}
                    placeholder="Type a message…"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button
                    style={S.sendBtn(sending || !newMessage.trim())}
                    onClick={handleSend}
                    disabled={sending || !newMessage.trim()}
                  >
                    <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── New Thread Modal ── */}
      {showNewThread && (
        <div style={S.modalOverlay} onClick={() => setShowNewThread(false)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalTitle}>{isAdmin ? 'New Admin Thread' : 'Message Admin'}</div>

            {isAdmin ? (
              <>
                <label style={S.label}>Search User</label>
                <input
                  style={S.input}
                  placeholder="Search by name…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                <div style={{ maxHeight: 160, overflowY: 'auto', marginBottom: 14, border: '1px solid #e2e8f0', borderRadius: 10, padding: 6 }}>
                  {filteredUsers.length === 0
                    ? <div style={{ padding: 10, color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>No users found</div>
                    : filteredUsers.map((u) => (
                      <div
                        key={u._id}
                        style={S.userOption(newThreadForm.targetUserId === u._id)}
                        onClick={() => setNewThreadForm((f) => ({ ...f, targetUserId: u._id }))}
                      >
                        {renderAvatar(u.name, u.role, u.avatar, 32)}
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: roleColor(u.role), textTransform: 'capitalize' }}>{u.role}</div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </>
            ) : (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: 14, fontSize: 13, color: '#166534' }}>
                📨 Sending to: <strong>Admin</strong>
                {allUsers[0] && <span style={{ color: '#6b7280' }}> — {allUsers[0].name}</span>}
              </div>
            )}

            <label style={S.label}>Subject</label>
            <input
              style={S.input}
              placeholder="Thread subject…"
              value={newThreadForm.subject}
              onChange={(e) => setNewThreadForm((f) => ({ ...f, subject: e.target.value }))}
            />

            <label style={S.label}>Message</label>
            <textarea
              style={{ ...S.input, resize: 'vertical', minHeight: 80 }}
              placeholder="Write your message…"
              value={newThreadForm.message}
              onChange={(e) => setNewThreadForm((f) => ({ ...f, message: e.target.value }))}
            />

            <div style={S.modalBtnRow}>
              <button style={S.cancelBtn} onClick={() => { setShowNewThread(false); setUserSearch(''); }}>
                Cancel
              </button>
              <button
                style={S.confirmBtn(sending)}
                onClick={createThread}
                disabled={sending}
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages;
