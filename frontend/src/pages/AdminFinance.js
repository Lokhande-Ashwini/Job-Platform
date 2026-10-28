import { useState, useEffect, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { toast } from 'react-toastify';

import {

  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,

  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,

} from 'recharts';

import Navbar from '../components/Navbar';

import api from '../utils/api';



const fmt  = (n) => `₹${(n||0).toLocaleString('en-IN')}`;

const fmtD = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#0ea5e9','#ec4899','#84cc16'];



const PSTATUS = {

  pending:    { bg:'#fef3c7', color:'#92400e', l:'Pending',    dot:'#f59e0b' },

  processing: { bg:'#dbeafe', color:'#1e40af', l:'Processing', dot:'#3b82f6' },

  credited:   { bg:'#dcfce7', color:'#16a34a', l:'Credited',   dot:'#16a34a' },

  failed:     { bg:'#fee2e2', color:'#dc2626', l:'Failed',     dot:'#dc2626' },

  'on-hold':  { bg:'#f3f4f6', color:'#6b7280', l:'On Hold',   dot:'#9ca3af' },

};

const PChip = ({ st }) => {

  const c = PSTATUS[st] || PSTATUS.pending;

  return <span style={{ background:c.bg, color:c.color, padding:'0.18rem 0.6rem', borderRadius:50, fontSize:'0.7rem', fontWeight:700, whiteSpace:'nowrap', display:'inline-flex', alignItems:'center', gap:'0.3rem' }}><span style={{ width:5, height:5, borderRadius:'50%', background:c.dot }} />{c.l}</span>;

};

const PayChip = ({ st }) => {

  const m = { paid:{bg:'#dcfce7',color:'#16a34a',l:'Paid'}, pending:{bg:'#fef3c7',color:'#92400e',l:'Pending'}, refunded:{bg:'#dbeafe',color:'#1e40af',l:'Refunded'}, failed:{bg:'#fee2e2',color:'#dc2626',l:'Failed'} }[st] || {bg:'#f3f4f6',color:'#6b7280',l:st};

  return <span style={{ background:m.bg, color:m.color, padding:'0.18rem 0.6rem', borderRadius:50, fontSize:'0.7rem', fontWeight:700, whiteSpace:'nowrap' }}>{m.l}</span>;

};



const KpiCard = ({ icon, label, value, sub, color, trend, highlight }) => (

  <div style={{ background:'white', borderRadius:14, padding:'1.1rem 1.25rem', boxShadow: highlight ? `0 4px 20px ${color}25` : '0 2px 10px rgba(0,0,0,0.05)', border: highlight ? `2px solid ${color}` : '1px solid #f3f4f6', borderLeft:`4px solid ${color}` }}>

    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>

      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>

        <div style={{ width:40, height:40, borderRadius:10, background:color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0 }}>{icon}</div>

        <div>

          <div style={{ fontSize:'1.35rem', fontWeight:800, color:'#1f2937', lineHeight:1 }}>{value}</div>

          <div style={{ fontSize:'0.63rem', fontWeight:600, color:'#9ca3af', marginTop:'0.1rem', textTransform:'uppercase', letterSpacing:'0.3px' }}>{label}</div>

          {sub && <div style={{ fontSize:'0.68rem', color:'#9ca3af', marginTop:'0.1rem' }}>{sub}</div>}

        </div>

      </div>

      {trend !== undefined && (

        <span style={{ fontSize:'0.7rem', fontWeight:700, color: trend >= 0 ? '#16a34a' : '#dc2626', background: trend >= 0 ? '#dcfce7' : '#fee2e2', padding:'0.15rem 0.5rem', borderRadius:50, flexShrink:0 }}>

          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%

        </span>

      )}

    </div>

  </div>

);



const ChartCard = ({ title, children, action }) => (

  <div style={{ background:'white', borderRadius:14, padding:'1.25rem 1.5rem', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', border:'1px solid #f3f4f6' }}>

    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>

      <div style={{ fontWeight:700, color:'#1f2937', fontSize:'0.9rem' }}>{title}</div>

      {action}

    </div>

    {children}

  </div>

);



const EmptyState = ({ icon, text }) => (

  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:180, color:'#9ca3af', flexDirection:'column', gap:'0.5rem' }}>

    <div style={{ fontSize:'2rem' }}>{icon || '📊'}</div>

    <p style={{ fontSize:'0.82rem', margin:0 }}>{text || 'No data available'}</p>

  </div>

);



/* ── Payout Detail Modal ─────────────────────────────────────────────────── */

const PayoutDetailModal = ({ payout, onClose, onMark }) => {

  const [ref, setRef] = useState(payout?.payoutReference || '');

  if (!payout) return null;

  return (

    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:'1rem', backdropFilter:'blur(5px)' }} onClick={onClose}>

      <div style={{ background:'white', borderRadius:20, width:'100%', maxWidth:520, boxShadow:'0 32px 80px rgba(0,0,0,0.3)', overflow:'hidden', maxHeight:'90vh', overflowY:'auto' }} onClick={e => e.stopPropagation()}>

        <div style={{ background:'linear-gradient(135deg,#1e1b4b,#4f46e5)', padding:'1.5rem 2rem', color:'white', display:'flex', justifyContent:'space-between', alignItems:'center' }}>

          <div>

            <div style={{ fontWeight:800, fontSize:'1.1rem' }}>Payout Details</div>

            <div style={{ fontSize:'0.72rem', opacity:0.7, marginTop:'0.15rem', fontFamily:'monospace' }}>{payout.payoutReference || '—'}</div>

          </div>

          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'white', width:32, height:32, borderRadius:'50%', cursor:'pointer', fontSize:'1rem' }}>✕</button>

        </div>

        <div style={{ padding:'1.5rem 2rem' }}>

          <div style={{ display:'flex', justifyContent:'center', marginBottom:'1.25rem' }}><PChip st={payout.payoutStatus} /></div>

          <div style={{ background:'#f9fafb', borderRadius:12, padding:'1rem 1.25rem', marginBottom:'1.25rem' }}>

            {[

              ['Worker',      payout.worker?.name || '—'],

              ['Service',     payout.booking?.service || '—'],

              ['Gross Amount',fmt(payout.grossAmount)],

              ['Commission',  `− ${fmt(payout.commissionDeduction)} (${payout.commissionRate}%)`],

              ['Tax (TDS)',   payout.taxDeduction > 0 ? `− ${fmt(payout.taxDeduction)}` : '₹0'],

              ['Penalty',     payout.penaltyDeduction > 0 ? `− ${fmt(payout.penaltyDeduction)}` : '₹0'],

              ['Net Payout',  fmt(payout.netPayout)],

              ['Payout Date', fmtD(payout.payoutDate)],

              ['Created',     fmtD(payout.createdAt)],

            ].map(([l, v], i) => (

              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'0.35rem 0', borderBottom: i < 8 ? '1px solid #f3f4f6' : 'none', gap:'1rem' }}>

                <span style={{ fontSize:'0.8rem', color:'#9ca3af', flexShrink:0 }}>{l}</span>

                <span style={{ fontSize:'0.875rem', fontWeight: l === 'Net Payout' ? 800 : 600, color: l === 'Net Payout' ? '#059669' : '#1f2937', textAlign:'right' }}>{v}</span>

              </div>

            ))}

          </div>

          <div style={{ marginBottom:'1.25rem' }}>

            <label style={{ fontSize:'0.78rem', fontWeight:600, color:'#374151', display:'block', marginBottom:'0.4rem' }}>Payout Reference</label>

            <input value={ref} onChange={e => setRef(e.target.value)} placeholder="Enter payout reference..." style={{ width:'100%', padding:'0.6rem 0.875rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.85rem', outline:'none', boxSizing:'border-box' }} />

          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>

            {[['processing','🔄 Mark Processing','#3b82f6'],['credited','✅ Mark Credited','#10b981'],['failed','❌ Mark Failed','#ef4444'],['on-hold','⏸ Hold','#6b7280']].map(([st, label, color]) => (

              <button key={st} onClick={() => { onMark(payout._id, st, ref); onClose(); }}

                style={{ padding:'0.6rem', background:color+'18', color, border:`1.5px solid ${color}30`, borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'0.78rem' }}>

                {label}

              </button>

            ))}

          </div>

        </div>

      </div>

    </div>

  );

};



/* ── Main AdminFinance Page ─────────────────────────────────────────────── */

export default function AdminFinance() {

  const navigate = useNavigate();

  const [data,         setData]         = useState(null);

  const [taxData,      setTaxData]      = useState(null);

  const [payoutData,   setPayoutData]   = useState(null);

  const [loading,      setLoading]      = useState(true);

  const [activeTab,    setActiveTab]    = useState('revenue');

  const [dateFrom,     setDateFrom]     = useState('');

  const [dateTo,       setDateTo]       = useState('');

  const [payoutFilter, setPayoutFilter] = useState('all');

  const [txnSearch,    setTxnSearch]    = useState('');

  const [submitting,   setSubmitting]   = useState(false);

  const [settingsForm, setSettingsForm] = useState(null);

  const [selectedPayout, setSelectedPayout] = useState(null);



  const fetchData = useCallback(async () => {

    setLoading(true);

    try {

      const params = new URLSearchParams();

      if (dateFrom) params.append('from', dateFrom);

      if (dateTo)   params.append('to', dateTo);

      const [analyticsRes, payoutsRes, taxRes] = await Promise.all([

        api.get(`/finance/admin/profit-analytics?${params}`),

        api.get(`/finance/admin/payouts?${params}`),

        api.get(`/finance/admin/tax-summary?${params}`),

      ]);

      setData(analyticsRes.data);

      setPayoutData(payoutsRes.data);

      setTaxData(taxRes.data);

      if (!settingsForm) {

        const { data: s } = await api.get('/finance/admin/settings');

        setSettingsForm(s);

      }

    } catch { toast.error('Failed to load finance data'); }

    finally { setLoading(false); }

  }, [dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps



  useEffect(() => { fetchData(); }, [fetchData]);



  const markPayout = async (id, status, payoutReference) => {

    try {

      await api.patch(`/finance/admin/payout/${id}`, { status, payoutReference });

      toast.success(`Payout marked as ${status}`);

      fetchData();

    } catch { toast.error('Failed to update payout'); }

  };



  const saveSettings = async () => {

    setSubmitting(true);

    try {

      await api.patch('/finance/admin/settings', settingsForm);

      toast.success('Settings saved');

    } catch { toast.error('Failed to save settings'); }

    finally { setSubmitting(false); }

  };



  const exportCSV = (type) => {

    const params = new URLSearchParams({ type });

    if (dateFrom) params.append('from', dateFrom);

    if (dateTo)   params.append('to', dateTo);

    const token = localStorage.getItem('token');

    const base = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    window.open(`${base}/finance/admin/export?${params}&token=${token}`, '_blank');

  };



  const s = data?.summary || {};

  const monthly = data?.monthly || [];

  const txns = data?.transactions || [];

  const serviceBreakdown = data?.serviceBreakdown || [];

  const topWorkers = data?.topWorkers || [];

  const paymentMethods = data?.paymentMethods || [];

  const allPayouts = payoutData?.payouts || [];

  const payoutSummary = payoutData?.summary || {};

  const taxSummary = taxData?.summary || {};

  const taxTxns = taxData?.transactions || [];



  const filteredPayouts = payoutFilter === 'all' ? allPayouts : allPayouts.filter(p => p.payoutStatus === payoutFilter);

  const filteredTxns = txnSearch

    ? txns.filter(t => t.booking?.service?.toLowerCase().includes(txnSearch.toLowerCase()) || t.customer?.name?.toLowerCase().includes(txnSearch.toLowerCase()) || t.worker?.name?.toLowerCase().includes(txnSearch.toLowerCase()))

    : txns;



  const inp = { padding:'0.45rem 0.75rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.82rem', outline:'none', background:'white', color:'#374151' };



  return (

    <div style={{ minHeight:'100vh', background:'#f8fafc' }}>

      <Navbar />

      <div style={{ maxWidth:1400, margin:'0 auto', padding:'1.5rem 1rem' }}>



        {/* Header */}

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>

          <div>

            <button onClick={() => navigate('/admin')} style={{ background:'none', border:'none', color:'#6366f1', cursor:'pointer', fontWeight:600, fontSize:'0.875rem', padding:0, marginBottom:'0.5rem', display:'flex', alignItems:'center', gap:'0.3rem' }}>← Admin Dashboard</button>

            <h2 style={{ margin:0, fontWeight:800, color:'#1f2937', fontSize:'1.6rem' }}>📈 Finance & Analytics</h2>

            <p style={{ color:'#9ca3af', fontSize:'0.875rem', marginTop:'0.25rem' }}>Platform revenue, payouts, profit, and tax overview</p>

          </div>

          <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', alignItems:'center' }}>

            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inp} />

            <span style={{ color:'#9ca3af', fontSize:'0.82rem' }}>to</span>

            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inp} />

            {(dateFrom||dateTo) && <button onClick={() => { setDateFrom(''); setDateTo(''); }} style={{ ...inp, background:'#fee2e2', color:'#dc2626', cursor:'pointer', fontWeight:600, border:'1.5px solid #fecaca' }}>Clear</button>}

            <button onClick={() => exportCSV('transactions')} style={{ padding:'0.45rem 0.875rem', background:'#059669', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.78rem' }}>⬇ Txns CSV</button>

            <button onClick={() => exportCSV('payouts')} style={{ padding:'0.45rem 0.875rem', background:'#6366f1', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.78rem' }}>⬇ Payouts CSV</button>

            <button onClick={() => exportCSV('tax')} style={{ padding:'0.45rem 0.875rem', background:'#8b5cf6', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.78rem' }}>⬇ Tax CSV</button>

          </div>

        </div>



        {/* Tabs */}

        <div style={{ display:'flex', gap:'0.25rem', background:'#f3f4f6', borderRadius:10, padding:'0.25rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>

          {[['revenue','💰 Revenue'],['payouts','👷 Payout Mgmt'],['profit','📈 Profit Analytics'],['tax','🧾 Tax Summary'],['settings','⚙️ Settings']].map(([k,l]) => (

            <button key={k} onClick={() => setActiveTab(k)}

              style={{ padding:'0.5rem 1.25rem', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.875rem', background: activeTab===k?'white':'transparent', color: activeTab===k?'#1f2937':'#6b7280', boxShadow: activeTab===k?'0 1px 4px rgba(0,0,0,0.1)':'' }}>

              {l}

            </button>

          ))}

        </div>



        {loading ? (

          <div style={{ textAlign:'center', padding:'5rem', color:'#9ca3af' }}>

            <div style={{ width:40, height:40, border:'3px solid #e5e7eb', borderTopColor:'#10b981', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 1rem' }} />

            Loading financial data...

          </div>

        ) : (

          <>

            {/* ══════════════════════════════════════════════════════════════

                REVENUE TAB

            ══════════════════════════════════════════════════════════════ */}

            {activeTab === 'revenue' && (

              <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

                {/* KPI grid */}

                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1rem' }}>

                  <KpiCard icon="💰" label="Total Customer Paid"  value={fmt(s.totalCustomerPaid)}  color="#10b981" highlight />

                  <KpiCard icon="📦" label="Total Booking Value"  value={fmt(s.totalBookingValue)}  color="#6366f1" />

                  <KpiCard icon="🏷️" label="Platform Fee Revenue" value={fmt(s.totalPlatformFee)}   color="#6366f1" />

                  <KpiCard icon="🛡️" label="Safety Fee Revenue"   value={fmt(s.totalSupportFee)}    color="#8b5cf6" />

                  <KpiCard icon="⚡" label="Urgent Fee Revenue"   value={fmt(s.totalUrgentFee)}     color="#ef4444" />

                  <KpiCard icon="🤝" label="Commission Revenue"   value={fmt(s.totalCommission)}    color="#f59e0b" />

                  <KpiCard icon="🧾" label="Tax Collected (GST)"  value={fmt(s.totalTax)}           color="#0ea5e9" />

                  <KpiCard icon="👷" label="Worker Payouts"       value={fmt(s.totalWorkerPayouts)} color="#374151" />

                  <KpiCard icon="📉" label="Refund Loss"          value={fmt(s.totalRefundLoss)}    color="#dc2626" />

                  <KpiCard icon="📊" label="Transactions"         value={s.txnCount || 0}           color="#6b7280" />

                  <KpiCard icon="⏳" label="Pending Payouts"      value={payoutSummary.pending || 0} color="#f59e0b" sub={fmt(payoutSummary.pendingAmount)} />

                  <KpiCard icon="🚀" label="Net Platform Profit"  value={fmt(s.netProfit)}          color="#059669" highlight />

                </div>



                {/* Monthly revenue chart */}

                <ChartCard title="Monthly Revenue Breakdown">

                  {monthly.length === 0 ? <EmptyState text="No monthly data yet" /> : (

                    <ResponsiveContainer width="100%" height={240}>

                      <BarChart data={monthly} margin={{ top:0, right:0, left:0, bottom:0 }}>

                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />

                        <XAxis dataKey="month" tick={{ fontSize:11, fill:'#9ca3af' }} />

                        <YAxis tick={{ fontSize:11, fill:'#9ca3af' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />

                        <Tooltip formatter={(v, n) => [fmt(v), n]} contentStyle={{ borderRadius:8, border:'1px solid #e5e7eb', fontSize:'0.82rem' }} />

                        <Legend wrapperStyle={{ fontSize:'0.78rem' }} />

                        <Bar dataKey="feeRevenue" name="Fee Revenue"  fill="#6366f1" radius={[3,3,0,0]} stackId="a" />

                        <Bar dataKey="commission" name="Commission"   fill="#10b981" radius={[3,3,0,0]} stackId="a" />

                        <Bar dataKey="tax"        name="Tax"          fill="#0ea5e9" radius={[3,3,0,0]} stackId="a" />

                      </BarChart>

                    </ResponsiveContainer>

                  )}

                </ChartCard>



                {/* Charts row */}

                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:'1.25rem' }}>

                  <ChartCard title="Payment Method Distribution">

                    {paymentMethods.length === 0 ? <EmptyState text="No payment data" /> : (

                      <ResponsiveContainer width="100%" height={200}>

                        <PieChart>

                          <Pie data={paymentMethods} dataKey="count" nameKey="method" cx="50%" cy="50%" outerRadius={75} label={({ method, percent }) => `${method} ${(percent*100).toFixed(0)}%`} labelLine={false}>

                            {paymentMethods.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}

                          </Pie>

                          <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius:8, fontSize:'0.82rem' }} />

                        </PieChart>

                      </ResponsiveContainer>

                    )}

                  </ChartCard>



                  <ChartCard title="Top Services by Revenue">

                    {serviceBreakdown.length === 0 ? <EmptyState text="No service data" /> : (

                      <ResponsiveContainer width="100%" height={200}>

                        <BarChart data={serviceBreakdown.slice(0,6)} layout="vertical" margin={{ top:0, right:20, left:60, bottom:0 }}>

                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />

                          <XAxis type="number" tick={{ fontSize:10, fill:'#9ca3af' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />

                          <YAxis type="category" dataKey="service" tick={{ fontSize:10, fill:'#374151' }} width={55} />

                          <Tooltip formatter={(v) => [fmt(v), 'Revenue']} contentStyle={{ borderRadius:8, fontSize:'0.82rem' }} />

                          <Bar dataKey="revenue" fill="#6366f1" radius={[0,4,4,0]} />

                        </BarChart>

                      </ResponsiveContainer>

                    )}

                  </ChartCard>

                </div>



                {/* Revenue detail table */}

                <div style={{ background:'white', borderRadius:14, boxShadow:'0 2px 10px rgba(0,0,0,0.05)', overflow:'hidden' }}>

                  <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.75rem' }}>

                    <div style={{ fontWeight:700, color:'#1f2937', fontSize:'0.95rem' }}>Revenue Detail ({filteredTxns.length})</div>

                    <input value={txnSearch} onChange={e => setTxnSearch(e.target.value)} placeholder="Search service, customer, worker..." style={{ ...inp, minWidth:220 }} />

                  </div>

                  <div style={{ overflowX:'auto' }}>

                    <table style={{ width:'100%', borderCollapse:'collapse', minWidth:1000 }}>

                      <thead>

                        <tr style={{ background:'#f9fafb', borderBottom:'2px solid #f3f4f6' }}>

                          {['Date','Service','Customer','Worker','Svc Amt','Plat Fee','Support','Urgent','Commission','Tax','Total Paid','Method','Status'].map(h => (

                            <th key={h} style={{ padding:'0.75rem 0.875rem', textAlign:'left', fontSize:'0.63rem', color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.3px', whiteSpace:'nowrap' }}>{h}</th>

                          ))}

                        </tr>

                      </thead>

                      <tbody>

                        {filteredTxns.slice(0, 50).map(t => (

                          <tr key={t._id} style={{ borderBottom:'1px solid #f9fafb' }}

                            onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}

                            onMouseLeave={e => e.currentTarget.style.background='white'}>

                            <td style={{ padding:'0.75rem 0.875rem', fontSize:'0.75rem', color:'#9ca3af', whiteSpace:'nowrap' }}>{fmtD(t.paidAt)}</td>

                            <td style={{ padding:'0.75rem 0.875rem', fontWeight:700, color:'#1f2937', fontSize:'0.82rem', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.booking?.service || '—'}</td>

                            <td style={{ padding:'0.75rem 0.875rem', fontSize:'0.82rem', color:'#374151' }}>{t.customer?.name || '—'}</td>

                            <td style={{ padding:'0.75rem 0.875rem', fontSize:'0.82rem', color:'#374151' }}>{t.worker?.name || '—'}</td>

                            <td style={{ padding:'0.75rem 0.875rem', fontWeight:600, color:'#1f2937' }}>{fmt(t.serviceAmount)}</td>

                            <td style={{ padding:'0.75rem 0.875rem', color:'#6366f1', fontWeight:600 }}>{t.platformFee > 0 ? fmt(t.platformFee) : '—'}</td>

                            <td style={{ padding:'0.75rem 0.875rem', color:'#8b5cf6', fontWeight:600 }}>{t.supportFee > 0 ? fmt(t.supportFee) : '—'}</td>

                            <td style={{ padding:'0.75rem 0.875rem', color:'#ef4444', fontWeight:600 }}>{t.urgentFee > 0 ? fmt(t.urgentFee) : '—'}</td>

                            <td style={{ padding:'0.75rem 0.875rem', color:'#f59e0b', fontWeight:600 }}>{fmt(Math.round(t.serviceAmount * (t.commissionRate||10) / 100))}</td>

                            <td style={{ padding:'0.75rem 0.875rem', color:'#0ea5e9', fontWeight:600 }}>{t.taxAmount > 0 ? fmt(t.taxAmount) : '—'}</td>

                            <td style={{ padding:'0.75rem 0.875rem', fontWeight:800, color:'#1f2937' }}>{fmt(t.totalPaid)}</td>

                            <td style={{ padding:'0.75rem 0.875rem' }}><span style={{ background:'#f3f4f6', color:'#374151', padding:'0.1rem 0.45rem', borderRadius:50, fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase' }}>{t.paymentMethod}</span></td>

                            <td style={{ padding:'0.75rem 0.875rem' }}><PayChip st={t.paymentStatus} /></td>

                          </tr>

                        ))}

                      </tbody>

                    </table>

                  </div>

                  {filteredTxns.length > 50 && (

                    <div style={{ padding:'0.75rem 1.5rem', background:'#f9fafb', borderTop:'1px solid #f3f4f6', fontSize:'0.78rem', color:'#9ca3af', textAlign:'center' }}>

                      Showing 50 of {filteredTxns.length} transactions. Export CSV for full data.

                    </div>

                  )}

                </div>

              </div>

            )}



            {/* ══════════════════════════════════════════════════════════════

                PAYOUT MANAGEMENT TAB

            ══════════════════════════════════════════════════════════════ */}

            {activeTab === 'payouts' && (

              <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

                {/* Payout KPIs */}

                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:'1rem' }}>

                  <KpiCard icon="📊" label="Total Payouts"      value={payoutSummary.total || 0}           color="#6366f1" />

                  <KpiCard icon="⏳" label="Pending"            value={payoutSummary.pending || 0}         color="#f59e0b" sub={fmt(payoutSummary.pendingAmount)} />

                  <KpiCard icon="🔄" label="Processing"         value={payoutSummary.processing || 0}      color="#3b82f6" />

                  <KpiCard icon="✅" label="Credited"           value={payoutSummary.credited || 0}        color="#10b981" highlight />

                  <KpiCard icon="❌" label="Failed"             value={payoutSummary.failed || 0}          color="#ef4444" />

                  <KpiCard icon="⏸" label="On Hold"            value={payoutSummary.onHold || 0}          color="#6b7280" />

                  <KpiCard icon="💰" label="Total Payout Amt"  value={fmt(payoutSummary.totalAmount)}     color="#059669" highlight />

                  <KpiCard icon="🤝" label="Commission Deducted" value={fmt(payoutSummary.totalCommission)} color="#f59e0b" />

                </div>



                {/* Filters */}

                <div style={{ background:'white', borderRadius:12, padding:'0.875rem 1.25rem', boxShadow:'0 1px 6px rgba(0,0,0,0.04)', display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>

                  <div style={{ fontWeight:600, color:'#374151', fontSize:'0.82rem' }}>Filter:</div>

                  {[['all','All'],['pending','Pending'],['processing','Processing'],['credited','Credited'],['failed','Failed'],['on-hold','On Hold']].map(([k,l]) => (

                    <button key={k} onClick={() => setPayoutFilter(k)}

                      style={{ padding:'0.35rem 0.875rem', border:`1.5px solid ${payoutFilter===k?'#6366f1':'#e5e7eb'}`, borderRadius:50, background: payoutFilter===k?'#ede9fe':'white', color: payoutFilter===k?'#6366f1':'#6b7280', cursor:'pointer', fontWeight:600, fontSize:'0.78rem' }}>

                      {l} {k !== 'all' && `(${allPayouts.filter(p => p.payoutStatus === k).length})`}

                    </button>

                  ))}

                  <span style={{ marginLeft:'auto', fontSize:'0.78rem', color:'#9ca3af' }}>{filteredPayouts.length} payouts</span>

                </div>



                {/* Payout table */}

                <div style={{ background:'white', borderRadius:14, boxShadow:'0 2px 10px rgba(0,0,0,0.05)', overflow:'hidden' }}>

                  <div style={{ overflowX:'auto' }}>

                    <table style={{ width:'100%', borderCollapse:'collapse', minWidth:900 }}>

                      <thead>

                        <tr style={{ background:'#f9fafb', borderBottom:'2px solid #f3f4f6' }}>

                          {['Payout Ref','Worker','Service','Gross','Commission','Tax','Penalty','Net Payout','Status','Payout Date','Actions'].map(h => (

                            <th key={h} style={{ padding:'0.75rem 0.875rem', textAlign:'left', fontSize:'0.63rem', color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.3px', whiteSpace:'nowrap' }}>{h}</th>

                          ))}

                        </tr>

                      </thead>

                      <tbody>

                        {filteredPayouts.length === 0 ? (

                          <tr><td colSpan={11} style={{ padding:'3rem', textAlign:'center', color:'#9ca3af' }}>No payouts found</td></tr>

                        ) : filteredPayouts.map(p => (

                          <tr key={p._id} style={{ borderBottom:'1px solid #f9fafb' }}

                            onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}

                            onMouseLeave={e => e.currentTarget.style.background='white'}>

                            <td style={{ padding:'0.75rem 0.875rem', fontFamily:'monospace', fontSize:'0.7rem', color:'#6366f1', fontWeight:600 }}>{p.payoutReference || '—'}</td>

                            <td style={{ padding:'0.75rem 0.875rem', fontWeight:700, color:'#1f2937', fontSize:'0.85rem' }}>{p.worker?.name || '—'}</td>

                            <td style={{ padding:'0.75rem 0.875rem', fontSize:'0.82rem', color:'#374151', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.booking?.service || '—'}</td>

                            <td style={{ padding:'0.75rem 0.875rem', fontWeight:600, color:'#1f2937' }}>{fmt(p.grossAmount)}</td>

                            <td style={{ padding:'0.75rem 0.875rem', color:'#ef4444', fontWeight:600 }}>− {fmt(p.commissionDeduction)}</td>

                            <td style={{ padding:'0.75rem 0.875rem', color: p.taxDeduction > 0 ? '#ef4444' : '#d1d5db', fontWeight:600 }}>{p.taxDeduction > 0 ? `− ${fmt(p.taxDeduction)}` : '—'}</td>

                            <td style={{ padding:'0.75rem 0.875rem', color: p.penaltyDeduction > 0 ? '#ef4444' : '#d1d5db', fontWeight:600 }}>{p.penaltyDeduction > 0 ? `− ${fmt(p.penaltyDeduction)}` : '—'}</td>

                            <td style={{ padding:'0.75rem 0.875rem', fontWeight:800, color:'#059669', fontSize:'0.95rem' }}>{fmt(p.netPayout)}</td>

                            <td style={{ padding:'0.75rem 0.875rem' }}><PChip st={p.payoutStatus} /></td>

                            <td style={{ padding:'0.75rem 0.875rem', fontSize:'0.78rem', color:'#9ca3af', whiteSpace:'nowrap' }}>{fmtD(p.payoutDate)}</td>

                            <td style={{ padding:'0.75rem 0.875rem' }}>

                              <button onClick={() => setSelectedPayout(p)} style={{ padding:'0.3rem 0.75rem', background:'#ede9fe', color:'#6366f1', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.75rem', fontWeight:700 }}>Manage</button>

                            </td>

                          </tr>

                        ))}

                      </tbody>

                    </table>

                  </div>

                </div>

              </div>

            )}



            {/* ══════════════════════════════════════════════════════════════

                PROFIT ANALYTICS TAB

            ══════════════════════════════════════════════════════════════ */}

            {activeTab === 'profit' && (

              <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

                {/* Profit KPIs */}

                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(175px,1fr))', gap:'1rem' }}>

                  <KpiCard icon="💰" label="Gross Platform Earnings" value={fmt(s.grossRevenue)}       color="#6366f1" />

                  <KpiCard icon="🏷️" label="Fee Revenue"             value={fmt((s.totalPlatformFee||0)+(s.totalSupportFee||0)+(s.totalUrgentFee||0))} color="#8b5cf6" />

                  <KpiCard icon="🤝" label="Commission Revenue"      value={fmt(s.totalCommission)}    color="#f59e0b" />

                  <KpiCard icon="⚡" label="Urgent Fee Revenue"      value={fmt(s.totalUrgentFee)}     color="#ef4444" />

                  <KpiCard icon="🛡️" label="Safety Fee Revenue"      value={fmt(s.totalSupportFee)}    color="#0ea5e9" />

                  <KpiCard icon="📉" label="Refund Loss"             value={fmt(s.totalRefundLoss)}    color="#dc2626" />

                  <KpiCard icon="🧾" label="Tax Collected"           value={fmt(s.totalTax)}           color="#0ea5e9" />

                  <KpiCard icon="🚀" label="Net Platform Profit"     value={fmt(s.netProfit)}          color="#059669" highlight />

                </div>



                {/* Monthly profit trend */}

                <ChartCard title="Monthly Net Profit Trend">

                  {monthly.length === 0 ? <EmptyState text="No data yet" /> : (

                    <ResponsiveContainer width="100%" height={220}>

                      <LineChart data={monthly} margin={{ top:5, right:10, left:0, bottom:0 }}>

                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />

                        <XAxis dataKey="month" tick={{ fontSize:11, fill:'#9ca3af' }} />

                        <YAxis tick={{ fontSize:11, fill:'#9ca3af' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />

                        <Tooltip formatter={(v, n) => [fmt(v), n]} contentStyle={{ borderRadius:8, border:'1px solid #e5e7eb', fontSize:'0.82rem' }} />

                        <Legend wrapperStyle={{ fontSize:'0.78rem' }} />

                        <Line type="monotone" dataKey="profit"     name="Net Profit"    stroke="#059669" strokeWidth={2.5} dot={{ r:4 }} />

                        <Line type="monotone" dataKey="feeRevenue" name="Fee Revenue"   stroke="#6366f1" strokeWidth={2} dot={{ r:3 }} strokeDasharray="4 2" />

                        <Line type="monotone" dataKey="commission" name="Commission"    stroke="#f59e0b" strokeWidth={2} dot={{ r:3 }} strokeDasharray="4 2" />

                        <Line type="monotone" dataKey="refundLoss" name="Refund Loss"   stroke="#ef4444" strokeWidth={1.5} dot={{ r:3 }} strokeDasharray="2 2" />

                      </LineChart>

                    </ResponsiveContainer>

                  )}

                </ChartCard>



                {/* Charts row */}

                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:'1.25rem' }}>

                  <ChartCard title="Monthly Payouts vs Profit">

                    {monthly.length === 0 ? <EmptyState text="No data" /> : (

                      <ResponsiveContainer width="100%" height={200}>

                        <BarChart data={monthly} margin={{ top:0, right:0, left:0, bottom:0 }}>

                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />

                          <XAxis dataKey="month" tick={{ fontSize:10, fill:'#9ca3af' }} />

                          <YAxis tick={{ fontSize:10, fill:'#9ca3af' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />

                          <Tooltip formatter={(v, n) => [fmt(v), n]} contentStyle={{ borderRadius:8, fontSize:'0.82rem' }} />

                          <Legend wrapperStyle={{ fontSize:'0.75rem' }} />

                          <Bar dataKey="payouts" name="Worker Payouts" fill="#e0e7ff" radius={[3,3,0,0]} />

                          <Bar dataKey="profit"  name="Platform Profit" fill="#059669" radius={[3,3,0,0]} />

                        </BarChart>

                      </ResponsiveContainer>

                    )}

                  </ChartCard>



                  <ChartCard title="Category-wise Profitability">

                    {serviceBreakdown.length === 0 ? <EmptyState text="No service data" /> : (

                      <ResponsiveContainer width="100%" height={200}>

                        <BarChart data={serviceBreakdown.slice(0,6)} layout="vertical" margin={{ top:0, right:20, left:60, bottom:0 }}>

                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />

                          <XAxis type="number" tick={{ fontSize:10, fill:'#9ca3af' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />

                          <YAxis type="category" dataKey="service" tick={{ fontSize:10, fill:'#374151' }} width={55} />

                          <Tooltip formatter={(v) => [fmt(v), 'Revenue']} contentStyle={{ borderRadius:8, fontSize:'0.82rem' }} />

                          <Bar dataKey="revenue" fill="#8b5cf6" radius={[0,4,4,0]} />

                        </BarChart>

                      </ResponsiveContainer>

                    )}

                  </ChartCard>

                </div>



                {/* Top workers */}

                {topWorkers.length > 0 && (

                  <div style={{ background:'white', borderRadius:14, padding:'1.5rem', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' }}>

                    <div style={{ fontWeight:700, color:'#1f2937', fontSize:'0.95rem', marginBottom:'1.25rem' }}>Top Workers by Payout Volume</div>

                    <div style={{ overflowX:'auto' }}>

                      <table style={{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>

                        <thead>

                          <tr style={{ background:'#f9fafb', borderBottom:'2px solid #f3f4f6' }}>

                            {['#','Worker','Jobs','Gross Earned','Commission Paid','Net Received'].map(h => (

                              <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', fontSize:'0.68rem', color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.3px' }}>{h}</th>

                            ))}

                          </tr>

                        </thead>

                        <tbody>

                          {topWorkers.map((w, i) => (

                            <tr key={i} style={{ borderBottom:'1px solid #f9fafb' }}

                              onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}

                              onMouseLeave={e => e.currentTarget.style.background='white'}>

                              <td style={{ padding:'0.75rem 1rem', fontWeight:700, color:'#9ca3af', fontSize:'0.85rem' }}>#{i+1}</td>

                              <td style={{ padding:'0.75rem 1rem', fontWeight:700, color:'#1f2937' }}>{w.name}</td>

                              <td style={{ padding:'0.75rem 1rem', color:'#6b7280' }}>{w.count}</td>

                              <td style={{ padding:'0.75rem 1rem', fontWeight:600, color:'#1f2937' }}>{fmt(w.gross)}</td>

                              <td style={{ padding:'0.75rem 1rem', color:'#ef4444', fontWeight:600 }}>{fmt(w.commission)}</td>

                              <td style={{ padding:'0.75rem 1rem', fontWeight:800, color:'#059669' }}>{fmt(w.net)}</td>

                            </tr>

                          ))}

                        </tbody>

                      </table>

                    </div>

                  </div>

                )}



                {/* Monthly detailed table */}

                {monthly.length > 0 && (

                  <div style={{ background:'white', borderRadius:14, boxShadow:'0 2px 10px rgba(0,0,0,0.05)', overflow:'hidden' }}>

                    <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #f3f4f6', fontWeight:700, color:'#1f2937', fontSize:'0.95rem' }}>Monthly Detailed Breakdown</div>

                    <div style={{ overflowX:'auto' }}>

                      <table style={{ width:'100%', borderCollapse:'collapse', minWidth:750 }}>

                        <thead>

                          <tr style={{ background:'#f9fafb', borderBottom:'2px solid #f3f4f6' }}>

                            {['Month','Fee Revenue','Commission','Tax','Worker Payouts','Refund Loss','Net Profit','Txns'].map(h => (

                              <th key={h} style={{ padding:'0.75rem 0.875rem', textAlign:'left', fontSize:'0.65rem', color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.3px', whiteSpace:'nowrap' }}>{h}</th>

                            ))}

                          </tr>

                        </thead>

                        <tbody>

                          {monthly.map((m, i) => (

                            <tr key={i} style={{ borderBottom:'1px solid #f9fafb' }}

                              onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}

                              onMouseLeave={e => e.currentTarget.style.background='white'}>

                              <td style={{ padding:'0.75rem 0.875rem', fontWeight:700, color:'#1f2937', fontFamily:'monospace', fontSize:'0.85rem' }}>{m.month}</td>

                              <td style={{ padding:'0.75rem 0.875rem', color:'#6366f1', fontWeight:600 }}>{fmt(m.feeRevenue)}</td>

                              <td style={{ padding:'0.75rem 0.875rem', color:'#f59e0b', fontWeight:600 }}>{fmt(m.commission)}</td>

                              <td style={{ padding:'0.75rem 0.875rem', color:'#0ea5e9', fontWeight:600 }}>{fmt(m.tax)}</td>

                              <td style={{ padding:'0.75rem 0.875rem', color:'#374151', fontWeight:600 }}>{fmt(m.payouts)}</td>

                              <td style={{ padding:'0.75rem 0.875rem', color:'#dc2626', fontWeight:600 }}>{m.refundLoss > 0 ? fmt(m.refundLoss) : '—'}</td>

                              <td style={{ padding:'0.75rem 0.875rem', fontWeight:800, color: m.profit >= 0 ? '#059669' : '#dc2626', fontSize:'0.95rem' }}>{fmt(m.profit)}</td>

                              <td style={{ padding:'0.75rem 0.875rem', color:'#6b7280' }}>{m.txnCount}</td>

                            </tr>

                          ))}

                        </tbody>

                      </table>

                    </div>

                  </div>

                )}

              </div>

            )}



            {/* ══════════════════════════════════════════════════════════════

                TAX SUMMARY TAB

            ══════════════════════════════════════════════════════════════ */}

            {activeTab === 'tax' && (

              <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

                {/* Tax KPIs */}

                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(175px,1fr))', gap:'1rem' }}>

                  <KpiCard icon="🧾" label="Total Tax Collected"   value={fmt(taxSummary.totalTaxCollected)}  color="#0ea5e9" highlight />

                  <KpiCard icon="📅" label="This Month Tax"        value={fmt(taxSummary.monthTaxCollected)}  color="#6366f1" />

                  <KpiCard icon="📉" label="Tax on Refunds"        value={fmt(taxSummary.refundedTax)}        color="#ef4444" />

                  <KpiCard icon="✅" label="Net Tax Amount"        value={fmt(taxSummary.netTaxAmount)}       color="#10b981" highlight />

                  <KpiCard icon="💰" label="Total Customer Paid"   value={fmt(taxSummary.totalCustomerPaid)}  color="#374151" />

                  <KpiCard icon="🏷️" label="Platform Earnings"    value={fmt(taxSummary.totalPlatformEarnings)} color="#8b5cf6" />

                </div>



                {/* Tax info banner */}

                <div style={{ background:'linear-gradient(135deg,#eff6ff,#e0f2fe)', borderRadius:12, padding:'1rem 1.5rem', border:'1px solid #bfdbfe', display:'flex', gap:'1.5rem', flexWrap:'wrap' }}>

                  <div style={{ fontSize:'0.82rem', color:'#1e40af' }}>

                    <strong>GST Rate:</strong> 18% on platform fees (platform fee + safety fee + urgent fee)

                  </div>

                  <div style={{ fontSize:'0.82rem', color:'#1e40af' }}>

                    <strong>Tax Base:</strong> Platform charges only — not on service amount

                  </div>

                  <div style={{ fontSize:'0.82rem', color:'#1e40af' }}>

                    <strong>Transactions:</strong> {taxSummary.txnCount || 0} paid bookings

                  </div>

                </div>



                {/* Tax table */}

                <div style={{ background:'white', borderRadius:14, boxShadow:'0 2px 10px rgba(0,0,0,0.05)', overflow:'hidden' }}>

                  <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.75rem' }}>

                    <div style={{ fontWeight:700, color:'#1f2937', fontSize:'0.95rem' }}>Tax Detail ({taxTxns.length})</div>

                    <button onClick={() => exportCSV('tax')} style={{ padding:'0.4rem 0.875rem', background:'#8b5cf6', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.78rem' }}>⬇ Export Tax CSV</button>

                  </div>

                  <div style={{ overflowX:'auto' }}>

                    <table style={{ width:'100%', borderCollapse:'collapse', minWidth:850 }}>

                      <thead>

                        <tr style={{ background:'#f9fafb', borderBottom:'2px solid #f3f4f6' }}>

                          {['Date','Invoice No.','Service','Customer','Svc Amount','Plat Fee','Support Fee','Urgent Fee','Tax Rate','Tax Amount','Total Paid','Status'].map(h => (

                            <th key={h} style={{ padding:'0.75rem 0.875rem', textAlign:'left', fontSize:'0.63rem', color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.3px', whiteSpace:'nowrap' }}>{h}</th>

                          ))}

                        </tr>

                      </thead>

                      <tbody>

                        {taxTxns.slice(0, 50).map(t => (

                          <tr key={t._id} style={{ borderBottom:'1px solid #f9fafb' }}

                            onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}

                            onMouseLeave={e => e.currentTarget.style.background='white'}>

                            <td style={{ padding:'0.75rem 0.875rem', fontSize:'0.75rem', color:'#9ca3af', whiteSpace:'nowrap' }}>{fmtD(t.paidAt)}</td>

                            <td style={{ padding:'0.75rem 0.875rem', fontFamily:'monospace', fontSize:'0.7rem', color:'#6366f1', fontWeight:600 }}>{t.invoiceNumber || '—'}</td>

                            <td style={{ padding:'0.75rem 0.875rem', fontWeight:700, color:'#1f2937', fontSize:'0.82rem', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.booking?.service || '—'}</td>

                            <td style={{ padding:'0.75rem 0.875rem', fontSize:'0.82rem', color:'#374151' }}>{t.customer?.name || '—'}</td>

                            <td style={{ padding:'0.75rem 0.875rem', fontWeight:600, color:'#1f2937' }}>{fmt(t.serviceAmount)}</td>

                            <td style={{ padding:'0.75rem 0.875rem', color:'#6366f1', fontWeight:600 }}>{t.platformFee > 0 ? fmt(t.platformFee) : '—'}</td>

                            <td style={{ padding:'0.75rem 0.875rem', color:'#8b5cf6', fontWeight:600 }}>{t.supportFee > 0 ? fmt(t.supportFee) : '—'}</td>

                            <td style={{ padding:'0.75rem 0.875rem', color:'#ef4444', fontWeight:600 }}>{t.urgentFee > 0 ? fmt(t.urgentFee) : '—'}</td>

                            <td style={{ padding:'0.75rem 0.875rem', color:'#0ea5e9', fontWeight:600 }}>{t.taxRate || 18}%</td>

                            <td style={{ padding:'0.75rem 0.875rem', fontWeight:800, color:'#0ea5e9', fontSize:'0.95rem' }}>{fmt(t.taxAmount)}</td>

                            <td style={{ padding:'0.75rem 0.875rem', fontWeight:700, color:'#1f2937' }}>{fmt(t.totalPaid)}</td>

                            <td style={{ padding:'0.75rem 0.875rem' }}><PayChip st={t.paymentStatus} /></td>

                          </tr>

                        ))}

                      </tbody>

                    </table>

                  </div>

                  {/* Tax totals footer */}

                  <div style={{ padding:'0.875rem 1.5rem', background:'#f0f9ff', borderTop:'2px solid #bae6fd', display:'flex', gap:'2rem', flexWrap:'wrap' }}>

                    {[

                      { label:'Total Tax Collected', value: fmt(taxTxns.reduce((s,t) => s+t.taxAmount, 0)), color:'#0ea5e9' },

                      { label:'Total Customer Paid', value: fmt(taxTxns.reduce((s,t) => s+t.totalPaid, 0)), color:'#1f2937' },

                      { label:'Avg Tax per Txn',     value: fmt(taxTxns.length ? Math.round(taxTxns.reduce((s,t) => s+t.taxAmount, 0) / taxTxns.length) : 0), color:'#6b7280' },

                    ].map((item, i) => (

                      <div key={i}>

                        <div style={{ fontSize:'0.65rem', color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.3px' }}>{item.label}</div>

                        <div style={{ fontWeight:800, color:item.color, fontSize:'0.95rem', marginTop:'0.1rem' }}>{item.value}</div>

                      </div>

                    ))}

                  </div>

                </div>

              </div>

            )}



            {/* ══════════════════════════════════════════════════════════════

                SETTINGS TAB

            ══════════════════════════════════════════════════════════════ */}

            {activeTab === 'settings' && settingsForm && (

              <div style={{ maxWidth:700 }}>

                <div style={{ background:'white', borderRadius:16, padding:'2rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>

                  <h3 style={{ margin:'0 0 1.5rem', fontWeight:800, color:'#1f2937', fontSize:'1.1rem' }}>⚙️ Platform Fee Configuration</h3>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>

                    {[

                      { key:'platformFeeType',    label:'Platform Fee Type',    type:'select', options:['percentage','fixed'] },

                      { key:'platformFeeValue',   label:'Platform Fee Value',   type:'number', hint:'% or ₹ depending on type' },

                      { key:'supportFee',         label:'Safety/Support Fee (₹)',type:'number' },

                      { key:'urgentFeeFixed',     label:'Urgent Fee (₹)',       type:'number' },

                      { key:'commissionRate',     label:'Commission Rate (%)',   type:'number' },

                      { key:'taxRate',            label:'GST Rate (%)',          type:'number' },

                      { key:'payoutMode',         label:'Payout Mode',          type:'select', options:['manual','instant','daily','weekly'] },

                      { key:'payoutCycleDays',    label:'Payout Cycle (days)',   type:'number' },

                    ].map(({ key, label, type, options, hint }) => (

                      <div key={key}>

                        <label style={{ fontSize:'0.78rem', fontWeight:600, color:'#374151', display:'block', marginBottom:'0.4rem' }}>{label}</label>

                        {type === 'select' ? (

                          <select value={settingsForm[key] || ''} onChange={e => setSettingsForm(f => ({ ...f, [key]: e.target.value }))}

                            style={{ width:'100%', padding:'0.6rem 0.875rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.875rem', outline:'none', background:'white' }}>

                            {options.map(o => <option key={o} value={o}>{o}</option>)}

                          </select>

                        ) : (

                          <input type="number" value={settingsForm[key] || ''} onChange={e => setSettingsForm(f => ({ ...f, [key]: parseFloat(e.target.value) }))}

                            style={{ width:'100%', padding:'0.6rem 0.875rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.875rem', outline:'none', boxSizing:'border-box' }} />

                        )}

                        {hint && <div style={{ fontSize:'0.68rem', color:'#9ca3af', marginTop:'0.25rem' }}>{hint}</div>}

                      </div>

                    ))}

                  </div>

                  <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.5rem', paddingTop:'1.5rem', borderTop:'1px solid #f3f4f6' }}>

                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flex:1 }}>

                      <input type="checkbox" id="taxOnWorker" checked={!!settingsForm.taxOnWorker} onChange={e => setSettingsForm(f => ({ ...f, taxOnWorker: e.target.checked }))} />

                      <label htmlFor="taxOnWorker" style={{ fontSize:'0.82rem', fontWeight:600, color:'#374151', cursor:'pointer' }}>Enable TDS on Worker Payouts</label>

                    </div>

                    {settingsForm.taxOnWorker && (

                      <div>

                        <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#374151', display:'block', marginBottom:'0.3rem' }}>Worker Tax Rate (%)</label>

                        <input type="number" value={settingsForm.workerTaxRate || 2} onChange={e => setSettingsForm(f => ({ ...f, workerTaxRate: parseFloat(e.target.value) }))}

                          style={{ width:80, padding:'0.5rem 0.75rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.875rem', outline:'none' }} />

                      </div>

                    )}

                  </div>

                  <button onClick={saveSettings} disabled={submitting}

                    style={{ marginTop:'1.5rem', padding:'0.875rem 2rem', background: submitting ? '#9ca3af' : 'linear-gradient(135deg,#4f46e5,#6366f1)', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor: submitting ? 'not-allowed' : 'pointer', fontSize:'0.9rem' }}>

                    {submitting ? 'Saving...' : '💾 Save Settings'}

                  </button>

                </div>

              </div>

            )}

          </>

        )}

      </div>



      {selectedPayout && (

        <PayoutDetailModal

          payout={selectedPayout}

          onClose={() => setSelectedPayout(null)}

          onMark={markPayout}

        />

      )}

    </div>

  );

}

