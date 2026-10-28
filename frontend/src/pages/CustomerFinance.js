import { useState, useEffect, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import { toast } from 'react-toastify';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import Navbar from '../components/Navbar';

import api from '../utils/api';



const fmt   = (n) => `₹${(n||0).toLocaleString('en-IN')}`;

const fmtD  = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—';

const fmtDT = (d) => d ? new Date(d).toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'; // eslint-disable-line



const PAY_STATUS = {

  paid:     { bg:'#dcfce7', color:'#16a34a', label:'Paid ✓',    dot:'#16a34a' },

  pending:  { bg:'#fef3c7', color:'#92400e', label:'Pending',   dot:'#f59e0b' },

  refunded: { bg:'#dbeafe', color:'#1e40af', label:'Refunded',  dot:'#3b82f6' },

  failed:   { bg:'#fee2e2', color:'#dc2626', label:'Failed',    dot:'#dc2626' },

};

const PayChip = ({ status }) => {

  const c = PAY_STATUS[status] || PAY_STATUS.pending;

  return (

    <span style={{ background:c.bg, color:c.color, padding:'0.2rem 0.7rem', borderRadius:50, fontSize:'0.72rem', fontWeight:700, whiteSpace:'nowrap', display:'inline-flex', alignItems:'center', gap:'0.3rem' }}>

      <span style={{ width:6, height:6, borderRadius:'50%', background:c.dot, display:'inline-block' }} />

      {c.label}

    </span>

  );

};



const METHOD_ICONS = { cash:'💵', upi:'📱', card:'💳', online:'🌐' };



/* ── Invoice / Detail Modal ─────────────────────────────────────────────── */

const InvoiceModal = ({ txn, onClose }) => {

  if (!txn) return null;

  const lineItems = [

    { label:'Service Amount',      value: fmt(txn.serviceAmount),  color:'#1f2937', bold:true },

    txn.platformFee  > 0 && { label:'Platform Fee',       value: fmt(txn.platformFee),   color:'#6366f1' },

    txn.supportFee   > 0 && { label:'Safety & Support Fee',value: fmt(txn.supportFee),   color:'#8b5cf6' },

    txn.urgentFee    > 0 && { label:'Urgent Booking Fee',  value: fmt(txn.urgentFee),    color:'#ef4444' },

    txn.discountAmount > 0 && { label:'Discount Applied',  value: `- ${fmt(txn.discountAmount)}`, color:'#10b981' },

    txn.taxAmount    > 0 && { label:`GST (${txn.taxRate||18}%)`,   value: fmt(txn.taxAmount),     color:'#0ea5e9' },

  ].filter(Boolean);



  return (

    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:'1rem', backdropFilter:'blur(6px)' }}

      onClick={onClose}>

      <div style={{ background:'white', borderRadius:20, width:'100%', maxWidth:520, boxShadow:'0 32px 80px rgba(0,0,0,0.35)', overflow:'hidden', maxHeight:'95vh', overflowY:'auto' }}

        onClick={e => e.stopPropagation()}>



        {/* Invoice header */}

        <div style={{ background:'linear-gradient(135deg,#1e1b4b 0%,#4f46e5 60%,#6366f1 100%)', padding:'1.75rem 2rem', color:'white' }}>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>

            <div>

              <div style={{ fontSize:'1.3rem', fontWeight:900, letterSpacing:'-0.5px' }}>Hyperlocal Jobs</div>

              <div style={{ fontSize:'0.72rem', opacity:0.7, marginTop:'0.15rem', textTransform:'uppercase', letterSpacing:'1px' }}>Tax Invoice</div>

            </div>

            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'white', width:32, height:32, borderRadius:'50%', cursor:'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>

          </div>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>

            <div>

              <div style={{ fontSize:'0.65rem', opacity:0.65, textTransform:'uppercase', letterSpacing:'0.5px' }}>Invoice Number</div>

              <div style={{ fontWeight:700, fontSize:'0.95rem', fontFamily:'monospace', marginTop:'0.1rem' }}>{txn.invoiceNumber || '—'}</div>

            </div>

            <div style={{ textAlign:'right' }}>

              <div style={{ fontSize:'0.65rem', opacity:0.65, textTransform:'uppercase', letterSpacing:'0.5px' }}>Date</div>

              <div style={{ fontWeight:600, fontSize:'0.85rem', marginTop:'0.1rem' }}>{fmtD(txn.paidAt)}</div>

            </div>

          </div>

        </div>



        <div style={{ padding:'1.5rem 2rem' }}>

          {/* Status badge */}

          <div style={{ display:'flex', justifyContent:'center', marginBottom:'1.25rem' }}>

            <PayChip status={txn.paymentStatus} />

          </div>



          {/* Service info */}

          <div style={{ background:'#f9fafb', borderRadius:12, padding:'1rem 1.25rem', marginBottom:'1.25rem', border:'1px solid #f3f4f6' }}>

            <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.75rem' }}>Service Details</div>

            {[

              ['Service',         txn.booking?.service || '—'],

              ['Worker',          txn.worker?.name || '—'],

              ['Scheduled Date',  fmtD(txn.booking?.scheduledDate)],

              ['Payment Method',  `${METHOD_ICONS[txn.paymentMethod] || ''} ${(txn.paymentMethod || '—').toUpperCase()}`],

              txn.transactionRef && ['Transaction Ref', txn.transactionRef],

            ].filter(Boolean).map(([l, v], i) => (

              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'0.3rem 0', borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none', gap:'1rem' }}>

                <span style={{ fontSize:'0.8rem', color:'#9ca3af', flexShrink:0 }}>{l}</span>

                <span style={{ fontSize:'0.85rem', fontWeight:600, color:'#1f2937', textAlign:'right', wordBreak:'break-all', fontFamily: l === 'Transaction Ref' ? 'monospace' : 'inherit' }}>{v}</span>

              </div>

            ))}

          </div>



          {/* Itemized breakdown */}

          <div style={{ borderRadius:12, border:'1px solid #e5e7eb', overflow:'hidden', marginBottom:'1.25rem' }}>

            <div style={{ padding:'0.75rem 1.25rem', background:'#f9fafb', borderBottom:'1px solid #e5e7eb', fontSize:'0.68rem', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.5px' }}>

              Itemized Breakdown

            </div>

            <div style={{ padding:'1rem 1.25rem' }}>

              {lineItems.map((item, i) => (

                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'0.35rem 0', borderBottom: i < lineItems.length-1 ? '1px solid #f9fafb' : 'none' }}>

                  <span style={{ fontSize:'0.82rem', color:'#6b7280' }}>{item.label}</span>

                  <span style={{ fontSize:'0.875rem', fontWeight: item.bold ? 700 : 600, color: item.color }}>{item.value}</span>

                </div>

              ))}

              <div style={{ borderTop:'2px solid #e5e7eb', marginTop:'0.875rem', paddingTop:'0.875rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>

                <span style={{ fontWeight:800, color:'#1f2937', fontSize:'1rem' }}>Total Paid</span>

                <span style={{ fontWeight:900, color:'#1f2937', fontSize:'1.5rem' }}>{fmt(txn.totalPaid)}</span>

              </div>

            </div>

          </div>



          {/* Fee explanation */}

          <div style={{ background:'#eff6ff', borderRadius:10, padding:'0.875rem 1rem', marginBottom:'1.25rem', border:'1px solid #bfdbfe' }}>

            <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#1e40af', marginBottom:'0.5rem', textTransform:'uppercase', letterSpacing:'0.4px' }}>How your total was calculated</div>

            <div style={{ fontSize:'0.78rem', color:'#1e40af', lineHeight:1.6 }}>

              Service amount ({fmt(txn.serviceAmount)})

              {txn.platformFee > 0 && ` + Platform fee (${fmt(txn.platformFee)})`}

              {txn.supportFee  > 0 && ` + Safety fee (${fmt(txn.supportFee)})`}

              {txn.urgentFee   > 0 && ` + Urgent fee (${fmt(txn.urgentFee)})`}

              {txn.taxAmount   > 0 && ` + GST (${fmt(txn.taxAmount)})`}

              {txn.discountAmount > 0 && ` - Discount (${fmt(txn.discountAmount)})`}

              {' = '}<strong>{fmt(txn.totalPaid)}</strong>

            </div>

          </div>



          {txn.taxAmount > 0 && (

            <div style={{ background:'#f0fdf4', borderRadius:8, padding:'0.6rem 0.875rem', marginBottom:'1rem', fontSize:'0.78rem', color:'#166534', border:'1px solid #bbf7d0' }}>

              ✓ Includes GST of {fmt(txn.taxAmount)} on platform charges (18% on fees)

            </div>

          )}



          <div style={{ textAlign:'center', fontSize:'0.7rem', color:'#9ca3af', marginBottom:'1rem' }}>

            Thank you for using Hyperlocal Jobs · Computer-generated invoice · Not a physical document

          </div>

        </div>



        <div style={{ padding:'1rem 2rem', borderTop:'1px solid #f3f4f6', display:'flex', gap:'0.75rem' }}>

          <button onClick={onClose} style={{ flex:1, padding:'0.75rem', background:'#f3f4f6', color:'#374151', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer', fontSize:'0.875rem' }}>Close</button>

          <button onClick={() => window.print()} style={{ flex:1, padding:'0.75rem', background:'linear-gradient(135deg,#4f46e5,#6366f1)', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:'0.875rem' }}>🖨️ Print Invoice</button>

        </div>

      </div>

    </div>

  );

};



/* ── KPI Card ───────────────────────────────────────────────────────────── */

const KpiCard = ({ icon, label, value, sub, color, highlight }) => (

  <div style={{ background:'white', borderRadius:14, padding:'1.1rem 1.25rem', boxShadow: highlight ? `0 4px 20px ${color}30` : '0 2px 10px rgba(0,0,0,0.05)', border: highlight ? `2px solid ${color}` : '1px solid #f3f4f6', borderLeft:`4px solid ${color}` }}>

    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>

      <div style={{ width:42, height:42, borderRadius:10, background:color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', flexShrink:0 }}>{icon}</div>

      <div>

        <div style={{ fontSize:'1.4rem', fontWeight:800, color:'#1f2937', lineHeight:1 }}>{value}</div>

        <div style={{ fontSize:'0.65rem', fontWeight:600, color:'#9ca3af', marginTop:'0.15rem', textTransform:'uppercase', letterSpacing:'0.4px' }}>{label}</div>

        {sub && <div style={{ fontSize:'0.7rem', color:'#9ca3af', marginTop:'0.1rem' }}>{sub}</div>}

      </div>

    </div>

  </div>

);



/* ── Main CustomerFinance Page ──────────────────────────────────────────── */

export default function CustomerFinance() {

  const { user } = useAuth();

  const navigate = useNavigate();

  const [txns,         setTxns]         = useState([]);

  const [summary,      setSummary]      = useState({});

  const [monthlyChart, setMonthlyChart] = useState([]);

  const [loading,      setLoading]      = useState(true);

  const [activeTab,    setActiveTab]    = useState('payments');

  const [selected,     setSelected]     = useState(null);

  const [search,       setSearch]       = useState('');

  const [statusFilter, setStatusFilter] = useState('all');

  const [methodFilter, setMethodFilter] = useState('all');



  const fetchData = useCallback(async () => {

    try {

      const { data } = await api.get('/finance/customer/transactions');

      setTxns(data.transactions || data);

      setSummary(data.summary || {});

      setMonthlyChart(data.monthlyChart || []);

    } catch { toast.error('Failed to load payment history'); }

    finally { setLoading(false); }

  }, []);



  useEffect(() => { fetchData(); }, [fetchData]);



  const filtered = txns.filter(t => {

    if (statusFilter !== 'all' && t.paymentStatus !== statusFilter) return false;

    if (methodFilter !== 'all' && t.paymentMethod !== methodFilter) return false;

    if (search) {

      const q = search.toLowerCase();

      return t.booking?.service?.toLowerCase().includes(q) ||

             t.worker?.name?.toLowerCase().includes(q) ||

             (t.invoiceNumber || '').toLowerCase().includes(q) ||

             (t.transactionRef || '').toLowerCase().includes(q);

    }

    return true;

  });



  const s = summary;

  const inp = { padding:'0.5rem 0.875rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.82rem', outline:'none', background:'white', color:'#374151' };



  return (

    <div style={{ minHeight:'100vh', background:'#f8fafc' }}>

      <Navbar />

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'1.5rem 1rem' }}>



        {/* Header */}

        <div style={{ marginBottom:'1.5rem' }}>

          <button onClick={() => navigate('/dashboard')} style={{ background:'none', border:'none', color:'#6366f1', cursor:'pointer', fontWeight:600, fontSize:'0.875rem', padding:0, marginBottom:'0.5rem', display:'flex', alignItems:'center', gap:'0.3rem' }}>← Dashboard</button>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem' }}>

            <div>

              <h2 style={{ margin:0, fontWeight:800, color:'#1f2937', fontSize:'1.6rem' }}>💳 My Payments</h2>

              <p style={{ color:'#9ca3af', fontSize:'0.875rem', marginTop:'0.25rem' }}>Complete payment history, invoices, and fee breakdown</p>

            </div>

            {user && <div style={{ background:'white', borderRadius:10, padding:'0.5rem 1rem', boxShadow:'0 1px 6px rgba(0,0,0,0.06)', fontSize:'0.82rem', color:'#374151', fontWeight:600 }}>👤 {user.name}</div>}

          </div>

        </div>



        {/* Summary KPI cards */}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>

          <KpiCard icon="💰" label="Total Paid"       value={fmt(s.totalPaid)}       color="#10b981" highlight />

          <KpiCard icon="⏳" label="Pending"           value={fmt(s.totalPending)}    color="#f59e0b" />

          <KpiCard icon="🧾" label="GST Paid"          value={fmt(s.totalTax)}        color="#8b5cf6" sub="On platform fees" />

          <KpiCard icon="🏷️" label="Platform Fees"    value={fmt(s.totalPlatformFee)} color="#6366f1" />

          <KpiCard icon="🛡️" label="Safety Fees"      value={fmt(s.totalSupportFee)} color="#0ea5e9" />

          <KpiCard icon="📋" label="Transactions"      value={s.txnCount || 0}        color="#374151" />

        </div>



        {/* Spend chart */}

        {monthlyChart.length > 0 && (

          <div style={{ background:'white', borderRadius:14, padding:'1.25rem 1.5rem', marginBottom:'1.5rem', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' }}>

            <div style={{ fontSize:'0.82rem', fontWeight:700, color:'#374151', marginBottom:'1rem' }}>Monthly Spend (Last 6 Months)</div>

            <ResponsiveContainer width="100%" height={160}>

              <BarChart data={monthlyChart} margin={{ top:0, right:0, left:0, bottom:0 }}>

                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />

                <XAxis dataKey="month" tick={{ fontSize:11, fill:'#9ca3af' }} />

                <YAxis tick={{ fontSize:11, fill:'#9ca3af' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />

                <Tooltip formatter={(v) => [fmt(v), 'Spent']} contentStyle={{ borderRadius:8, border:'1px solid #e5e7eb', fontSize:'0.82rem' }} />

                <Bar dataKey="spent" fill="#6366f1" radius={[4,4,0,0]} />

              </BarChart>

            </ResponsiveContainer>

          </div>

        )}



        {/* Tabs */}

        <div style={{ display:'flex', gap:'0.25rem', background:'#f3f4f6', borderRadius:10, padding:'0.25rem', marginBottom:'1.25rem', width:'fit-content' }}>

          {[['payments','💳 Payments'],['invoices','🧾 Invoices'],['history','📋 Payment History']].map(([k,l]) => (

            <button key={k} onClick={() => setActiveTab(k)}

              style={{ padding:'0.5rem 1.25rem', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.875rem', background: activeTab===k?'white':'transparent', color: activeTab===k?'#1f2937':'#6b7280', boxShadow: activeTab===k?'0 1px 4px rgba(0,0,0,0.1)':'' }}>

              {l}

            </button>

          ))}

        </div>



        {/* Filters */}

        <div style={{ background:'white', borderRadius:12, padding:'0.875rem 1.25rem', marginBottom:'1rem', boxShadow:'0 1px 6px rgba(0,0,0,0.04)', display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>

          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search service, worker, invoice, ref..." style={{ ...inp, flex:1, minWidth:200 }} />

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inp}>

            <option value="all">All Status</option>

            {Object.entries(PAY_STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}

          </select>

          <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} style={inp}>

            <option value="all">All Methods</option>

            {['cash','upi','card','online'].map(m => <option key={m} value={m}>{METHOD_ICONS[m]} {m.toUpperCase()}</option>)}

          </select>

          {(search || statusFilter !== 'all' || methodFilter !== 'all') && (

            <button onClick={() => { setSearch(''); setStatusFilter('all'); setMethodFilter('all'); }}

              style={{ ...inp, background:'#fee2e2', color:'#dc2626', cursor:'pointer', fontWeight:600, border:'1.5px solid #fecaca' }}>Clear</button>

          )}

          <span style={{ fontSize:'0.78rem', color:'#9ca3af', marginLeft:'auto' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>

        </div>



        {loading ? (

          <div style={{ textAlign:'center', padding:'5rem', color:'#9ca3af' }}>

            <div style={{ width:40, height:40, border:'3px solid #e5e7eb', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 1rem' }} />

            Loading your payments...

          </div>

        ) : filtered.length === 0 ? (

          <div style={{ textAlign:'center', padding:'5rem', background:'white', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>

            <div style={{ fontSize:'3.5rem', marginBottom:'1rem' }}>💳</div>

            <h3 style={{ color:'#1f2937', marginBottom:'0.5rem', fontWeight:700 }}>No payments found</h3>

            <p style={{ color:'#9ca3af', fontSize:'0.875rem' }}>Your payment history will appear here after completing bookings.</p>

          </div>

        ) : (

          <>

            {/* ── PAYMENTS TAB ── */}

            {activeTab === 'payments' && (

              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

                {filtered.map(t => {

                  const sc = PAY_STATUS[t.paymentStatus] || PAY_STATUS.pending;

                  return (

                    <div key={t._id} style={{ background:'white', borderRadius:16, padding:'1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', border:`1px solid #f3f4f6`, borderLeft:`4px solid ${sc.color}` }}>

                      {/* Top row */}

                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'0.75rem', marginBottom:'1rem' }}>

                        <div>

                          <div style={{ fontWeight:800, color:'#1f2937', fontSize:'1.05rem', marginBottom:'0.2rem' }}>{t.booking?.service || '—'}</div>

                          <div style={{ fontSize:'0.78rem', color:'#9ca3af', display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>

                            <span>👷 {t.worker?.name || '—'}</span>

                            <span>📅 {fmtD(t.paidAt || t.createdAt)}</span>

                            <span>{METHOD_ICONS[t.paymentMethod] || '💳'} {(t.paymentMethod || '—').toUpperCase()}</span>

                          </div>

                        </div>

                        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>

                          <div style={{ textAlign:'right' }}>

                            <div style={{ fontWeight:900, color:'#1f2937', fontSize:'1.35rem', lineHeight:1 }}>{fmt(t.totalPaid)}</div>

                            <div style={{ fontSize:'0.68rem', color:'#9ca3af', marginTop:'0.15rem' }}>Total Paid</div>

                          </div>

                          <PayChip status={t.paymentStatus} />

                        </div>

                      </div>



                      {/* Fee breakdown pills */}

                      <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem', marginBottom:'1rem' }}>

                        {[

                          { label:'Service',     value: fmt(t.serviceAmount),  bg:'#f9fafb',  color:'#1f2937' },

                          t.platformFee > 0 && { label:'Platform Fee', value: fmt(t.platformFee), bg:'#ede9fe', color:'#6366f1' },

                          t.supportFee  > 0 && { label:'Safety Fee',   value: fmt(t.supportFee),  bg:'#f3e8ff', color:'#8b5cf6' },

                          t.urgentFee   > 0 && { label:'Urgent Fee',   value: fmt(t.urgentFee),   bg:'#fee2e2', color:'#ef4444' },

                          t.taxAmount   > 0 && { label:'GST',          value: fmt(t.taxAmount),   bg:'#e0f2fe', color:'#0ea5e9' },

                        ].filter(Boolean).map((item, i) => (

                          <div key={i} style={{ background:item.bg, borderRadius:8, padding:'0.4rem 0.75rem', display:'flex', flexDirection:'column', alignItems:'center', minWidth:80 }}>

                            <div style={{ fontSize:'0.6rem', color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.3px' }}>{item.label}</div>

                            <div style={{ fontWeight:700, color:item.color, fontSize:'0.875rem', marginTop:'0.1rem' }}>{item.value}</div>

                          </div>

                        ))}

                      </div>



                      {/* Bottom row */}

                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.5rem', paddingTop:'0.875rem', borderTop:'1px solid #f3f4f6' }}>

                        <div style={{ fontSize:'0.75rem', color:'#9ca3af', fontFamily:'monospace' }}>

                          {t.invoiceNumber ? `📄 ${t.invoiceNumber}` : ''}

                          {t.transactionRef ? ` · Ref: ${t.transactionRef.slice(0,20)}` : ''}

                        </div>

                        <button onClick={() => setSelected(t)} style={{ padding:'0.45rem 1.1rem', background:'linear-gradient(135deg,#4f46e5,#6366f1)', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.8rem' }}>

                          View Details →

                        </button>

                      </div>

                    </div>

                  );

                })}

              </div>

            )}



            {/* ── INVOICES TAB ── */}

            {activeTab === 'invoices' && (

              <div style={{ background:'white', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.05)', overflow:'hidden' }}>

                <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>

                  <div style={{ fontWeight:700, color:'#1f2937', fontSize:'0.95rem' }}>Invoices ({filtered.length})</div>

                  <div style={{ fontSize:'0.75rem', color:'#9ca3af' }}>Click any row to view full invoice</div>

                </div>

                <div style={{ overflowX:'auto' }}>

                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth:750 }}>

                    <thead>

                      <tr style={{ background:'#f9fafb', borderBottom:'2px solid #f3f4f6' }}>

                        {['Invoice No.','Service','Worker','Svc Amount','Tax (GST)','Total','Date','Status','Action'].map(h => (

                          <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', fontSize:'0.68rem', color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.4px', whiteSpace:'nowrap' }}>{h}</th>

                        ))}

                      </tr>

                    </thead>

                    <tbody>

                      {filtered.map((t, i) => (

                        <tr key={t._id} style={{ borderBottom:'1px solid #f9fafb', cursor:'pointer', transition:'background 0.1s' }}

                          onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}

                          onMouseLeave={e => e.currentTarget.style.background='white'}>

                          <td style={{ padding:'0.875rem 1rem', fontFamily:'monospace', fontSize:'0.72rem', color:'#6366f1', fontWeight:600 }}>{t.invoiceNumber || '—'}</td>

                          <td style={{ padding:'0.875rem 1rem', fontWeight:700, color:'#1f2937', fontSize:'0.875rem' }}>{t.booking?.service || '—'}</td>

                          <td style={{ padding:'0.875rem 1rem', fontSize:'0.82rem', color:'#374151' }}>{t.worker?.name || '—'}</td>

                          <td style={{ padding:'0.875rem 1rem', fontWeight:600, color:'#1f2937' }}>{fmt(t.serviceAmount)}</td>

                          <td style={{ padding:'0.875rem 1rem', color:'#0ea5e9', fontWeight:600 }}>{t.taxAmount > 0 ? fmt(t.taxAmount) : <span style={{ color:'#d1d5db' }}>—</span>}</td>

                          <td style={{ padding:'0.875rem 1rem', fontWeight:800, color:'#1f2937', fontSize:'0.95rem' }}>{fmt(t.totalPaid)}</td>

                          <td style={{ padding:'0.875rem 1rem', fontSize:'0.78rem', color:'#9ca3af', whiteSpace:'nowrap' }}>{fmtD(t.paidAt)}</td>

                          <td style={{ padding:'0.875rem 1rem' }}><PayChip status={t.paymentStatus} /></td>

                          <td style={{ padding:'0.875rem 1rem' }}>

                            <button onClick={() => setSelected(t)} style={{ padding:'0.35rem 0.875rem', background:'#ede9fe', color:'#6366f1', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.75rem', fontWeight:700 }}>View →</button>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

                {/* Summary footer */}

                <div style={{ padding:'0.875rem 1.5rem', background:'#f9fafb', borderTop:'2px solid #f3f4f6', display:'flex', gap:'2rem', flexWrap:'wrap' }}>

                  {[

                    { label:'Total Invoiced', value: fmt(filtered.reduce((s,t) => s + t.totalPaid, 0)) },

                    { label:'Total Tax',       value: fmt(filtered.reduce((s,t) => s + t.taxAmount, 0)) },

                    { label:'Paid',            value: filtered.filter(t => t.paymentStatus === 'paid').length },

                    { label:'Pending',         value: filtered.filter(t => t.paymentStatus === 'pending').length },

                  ].map((item, i) => (

                    <div key={i}>

                      <div style={{ fontSize:'0.65rem', color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.3px' }}>{item.label}</div>

                      <div style={{ fontWeight:800, color:'#1f2937', fontSize:'0.95rem', marginTop:'0.1rem' }}>{item.value}</div>

                    </div>

                  ))}

                </div>

              </div>

            )}



            {/* ── PAYMENT HISTORY TAB ── */}

            {activeTab === 'history' && (

              <div style={{ background:'white', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.05)', overflow:'hidden' }}>

                <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.5rem' }}>

                  <div style={{ fontWeight:700, color:'#1f2937', fontSize:'0.95rem' }}>Payment History ({filtered.length})</div>

                  <div style={{ fontSize:'0.75rem', color:'#9ca3af' }}>Click any row for full breakdown</div>

                </div>

                <div style={{ overflowX:'auto' }}>

                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth:950 }}>

                    <thead>

                      <tr style={{ background:'#f9fafb', borderBottom:'2px solid #f3f4f6' }}>

                        {['Date','Service','Worker','Svc Amt','Plat Fee','Safety Fee','Urgent','GST','Total','Method','Ref','Status'].map(h => (

                          <th key={h} style={{ padding:'0.75rem 0.875rem', textAlign:'left', fontSize:'0.65rem', color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.3px', whiteSpace:'nowrap' }}>{h}</th>

                        ))}

                      </tr>

                    </thead>

                    <tbody>

                      {filtered.map(t => (

                        <tr key={t._id} style={{ borderBottom:'1px solid #f9fafb', cursor:'pointer' }}

                          onClick={() => setSelected(t)}

                          onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}

                          onMouseLeave={e => e.currentTarget.style.background='white'}>

                          <td style={{ padding:'0.75rem 0.875rem', fontSize:'0.78rem', color:'#9ca3af', whiteSpace:'nowrap' }}>{fmtD(t.paidAt || t.createdAt)}</td>

                          <td style={{ padding:'0.75rem 0.875rem', fontWeight:700, color:'#1f2937', fontSize:'0.82rem', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.booking?.service || '—'}</td>

                          <td style={{ padding:'0.75rem 0.875rem', fontSize:'0.82rem', color:'#374151' }}>{t.worker?.name || '—'}</td>

                          <td style={{ padding:'0.75rem 0.875rem', fontWeight:700, color:'#1f2937' }}>{fmt(t.serviceAmount)}</td>

                          <td style={{ padding:'0.75rem 0.875rem', color:'#6366f1', fontWeight:600 }}>{t.platformFee > 0 ? fmt(t.platformFee) : <span style={{ color:'#d1d5db' }}>—</span>}</td>

                          <td style={{ padding:'0.75rem 0.875rem', color:'#8b5cf6', fontWeight:600 }}>{t.supportFee > 0 ? fmt(t.supportFee) : <span style={{ color:'#d1d5db' }}>—</span>}</td>

                          <td style={{ padding:'0.75rem 0.875rem', color:'#ef4444', fontWeight:600 }}>{t.urgentFee > 0 ? fmt(t.urgentFee) : <span style={{ color:'#d1d5db' }}>—</span>}</td>

                          <td style={{ padding:'0.75rem 0.875rem', color:'#0ea5e9', fontWeight:600 }}>{t.taxAmount > 0 ? fmt(t.taxAmount) : <span style={{ color:'#d1d5db' }}>—</span>}</td>

                          <td style={{ padding:'0.75rem 0.875rem', fontWeight:800, color:'#1f2937', fontSize:'0.9rem' }}>{fmt(t.totalPaid)}</td>

                          <td style={{ padding:'0.75rem 0.875rem' }}>

                            <span style={{ background:'#f3f4f6', color:'#374151', padding:'0.15rem 0.5rem', borderRadius:50, fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase' }}>

                              {METHOD_ICONS[t.paymentMethod]} {t.paymentMethod}

                            </span>

                          </td>

                          <td style={{ padding:'0.75rem 0.875rem', fontFamily:'monospace', fontSize:'0.68rem', color:'#9ca3af', maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.transactionRef || '—'}</td>

                          <td style={{ padding:'0.75rem 0.875rem' }}><PayChip status={t.paymentStatus} /></td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

                {/* Totals footer */}

                <div style={{ padding:'0.875rem 1.5rem', background:'#f9fafb', borderTop:'2px solid #f3f4f6', display:'flex', gap:'2rem', flexWrap:'wrap' }}>

                  {[

                    { label:'Total Paid',     value: fmt(filtered.filter(t=>t.paymentStatus==='paid').reduce((s,t)=>s+t.totalPaid,0)),    color:'#10b981' },

                    { label:'Platform Fees',  value: fmt(filtered.reduce((s,t)=>s+t.platformFee,0)),   color:'#6366f1' },

                    { label:'Safety Fees',    value: fmt(filtered.reduce((s,t)=>s+t.supportFee,0)),    color:'#8b5cf6' },

                    { label:'GST Paid',       value: fmt(filtered.reduce((s,t)=>s+t.taxAmount,0)),     color:'#0ea5e9' },

                  ].map((item, i) => (

                    <div key={i}>

                      <div style={{ fontSize:'0.65rem', color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.3px' }}>{item.label}</div>

                      <div style={{ fontWeight:800, color:item.color, fontSize:'0.95rem', marginTop:'0.1rem' }}>{item.value}</div>

                    </div>

                  ))}

                </div>

              </div>

            )}

          </>

        )}

      </div>



      {selected && <InvoiceModal txn={selected} onClose={() => setSelected(null)} />}

    </div>

  );

}

