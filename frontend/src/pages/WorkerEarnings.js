import { useState, useEffect, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { toast } from 'react-toastify';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import Navbar from '../components/Navbar';

import api from '../utils/api';



const fmt   = (n) => `₹${(n||0).toLocaleString('en-IN')}`;

const fmtD  = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—';



const PAYOUT_STATUS = {

  pending:    { bg:'#fef3c7', color:'#92400e', label:'Pending',      dot:'#f59e0b' },

  processing: { bg:'#dbeafe', color:'#1e40af', label:'Processing',   dot:'#3b82f6' },

  credited:   { bg:'#dcfce7', color:'#16a34a', label:'Credited ✓',  dot:'#16a34a' },

  failed:     { bg:'#fee2e2', color:'#dc2626', label:'Failed',       dot:'#dc2626' },

  'on-hold':  { bg:'#f3f4f6', color:'#6b7280', label:'On Hold',     dot:'#9ca3af' },

};

const StatusChip = ({ status }) => {

  const c = PAYOUT_STATUS[status] || PAYOUT_STATUS.pending;

  return (

    <span style={{ background:c.bg, color:c.color, padding:'0.2rem 0.65rem', borderRadius:50, fontSize:'0.72rem', fontWeight:700, whiteSpace:'nowrap', display:'inline-flex', alignItems:'center', gap:'0.3rem' }}>

      <span style={{ width:6, height:6, borderRadius:'50%', background:c.dot }} />

      {c.label}

    </span>

  );

};



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



/* ── Payout Detail Drawer ───────────────────────────────────────────────── */

const PayoutDrawer = ({ payout, onClose }) => {

  if (!payout) return null;

  const b = payout.booking || {};

  const t = payout.transaction || {};



  return (

    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000, backdropFilter:'blur(5px)' }} onClick={onClose}>

      <div style={{ background:'white', borderRadius:'20px 20px 0 0', width:'100%', maxWidth:580, maxHeight:'92vh', overflowY:'auto', padding:'2rem' }} onClick={e => e.stopPropagation()}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>

          <h3 style={{ margin:0, fontWeight:800, color:'#1f2937', fontSize:'1.15rem' }}>Earning Breakdown</h3>

          <button onClick={onClose} style={{ background:'#f3f4f6', border:'none', width:32, height:32, borderRadius:'50%', cursor:'pointer', color:'#6b7280', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>

        </div>



        {/* Net payout hero */}

        <div style={{ background:'linear-gradient(135deg,#059669,#0d9488)', borderRadius:16, padding:'1.5rem', marginBottom:'1.5rem', color:'white', textAlign:'center' }}>

          <div style={{ fontSize:'0.72rem', opacity:0.8, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'0.35rem' }}>You Earned</div>

          <div style={{ fontSize:'2.75rem', fontWeight:900, lineHeight:1 }}>{fmt(payout.netPayout)}</div>

          <div style={{ fontSize:'0.78rem', opacity:0.75, marginTop:'0.4rem' }}>

            from {fmt(payout.grossAmount)} gross · {fmtD(payout.payoutDate)}

          </div>

          <div style={{ marginTop:'0.75rem' }}><StatusChip status={payout.payoutStatus} /></div>

        </div>



        {/* Deduction breakdown */}

        <div style={{ background:'#f9fafb', borderRadius:12, padding:'1.25rem', marginBottom:'1.25rem', border:'1px solid #f3f4f6' }}>

          <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.875rem' }}>Deduction Breakdown</div>

          {[

            { label:'Gross Amount',         value: fmt(payout.grossAmount),          color:'#1f2937', bold:true },

            { label:`Commission (${payout.commissionRate}%)`, value: `− ${fmt(payout.commissionDeduction)}`, color:'#ef4444' },

            payout.taxDeduction > 0 && { label:`TDS (${payout.taxRate}%)`, value: `− ${fmt(payout.taxDeduction)}`, color:'#ef4444' },

            payout.penaltyDeduction > 0 && { label:'Penalty Deduction', value: `− ${fmt(payout.penaltyDeduction)}`, color:'#ef4444' },

            { label:'Net Payout',           value: fmt(payout.netPayout),            color:'#059669', bold:true, big:true },

          ].filter(Boolean).map((r, i, arr) => (

            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.45rem 0', borderBottom: i < arr.length-1 ? '1px solid #f3f4f6' : 'none', gap:'1rem' }}>

              <span style={{ fontSize:'0.82rem', color:'#9ca3af' }}>{r.label}</span>

              <span style={{ fontSize: r.big ? '1.15rem' : '0.9rem', fontWeight: r.bold ? 800 : 600, color: r.color }}>{r.value}</span>

            </div>

          ))}

        </div>



        {/* Booking info */}

        <div style={{ background:'#f9fafb', borderRadius:12, padding:'1.25rem', marginBottom:'1.25rem', border:'1px solid #f3f4f6' }}>

          <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.875rem' }}>Booking Info</div>

          {[

            ['Service',         b.service || '—'],

            ['Customer',        b.customer?.name || '—'],

            ['Scheduled Date',  fmtD(b.scheduledDate)],

            ['Payment Method',  (t.paymentMethod || b.paymentMethod || '—').toUpperCase()],

            ['Payout Reference',payout.payoutReference || '—'],

          ].map(([l, v], i) => (

            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'0.3rem 0', borderBottom: i < 4 ? '1px solid #f3f4f6' : 'none', gap:'1rem' }}>

              <span style={{ fontSize:'0.8rem', color:'#9ca3af', flexShrink:0 }}>{l}</span>

              <span style={{ fontSize:'0.85rem', fontWeight:600, color:'#1f2937', textAlign:'right', fontFamily: l === 'Payout Reference' ? 'monospace' : 'inherit' }}>{v}</span>

            </div>

          ))}

        </div>



        {/* Customer paid section */}

        {t.totalPaid > 0 && (

          <div style={{ background:'#eff6ff', borderRadius:12, padding:'1.25rem', marginBottom:'1.25rem', border:'1px solid #bfdbfe' }}>

            <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#1e40af', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.875rem' }}>Customer Paid</div>

            {[

              { label:'Service Amount', value: fmt(t.serviceAmount) },

              { label:'Platform Fee',   value: fmt(t.platformFee) },

              { label:'Safety Fee',     value: fmt(t.supportFee) },

              t.urgentFee > 0 && { label:'Urgent Fee', value: fmt(t.urgentFee) },

              { label:'GST',            value: fmt(t.taxAmount) },

              { label:'Total Paid',     value: fmt(t.totalPaid), bold:true },

            ].filter(Boolean).map((r, i) => (

              <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem', padding:'0.25rem 0' }}>

                <span style={{ color:'#6b7280' }}>{r.label}</span>

                <span style={{ fontWeight: r.bold ? 800 : 500, color:'#1e40af' }}>{r.value}</span>

              </div>

            ))}

          </div>

        )}



        <button onClick={onClose} style={{ width:'100%', padding:'0.875rem', background:'#f3f4f6', color:'#374151', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer', fontSize:'0.9rem' }}>Close</button>

      </div>

    </div>

  );

};



/* ── Main WorkerEarnings Page ───────────────────────────────────────────── */

export default function WorkerEarnings() {

  const navigate = useNavigate();

  const [data,         setData]         = useState(null);

  const [loading,      setLoading]      = useState(true);

  const [activeTab,    setActiveTab]    = useState('earnings');

  const [selected,     setSelected]     = useState(null);

  const [statusFilter, setStatusFilter] = useState('all');



  const fetchData = useCallback(async () => {

    try {

      const { data: d } = await api.get('/finance/worker/earnings');

      setData(d);

    } catch { toast.error('Failed to load earnings'); }

    finally { setLoading(false); }

  }, []);



  useEffect(() => { fetchData(); }, [fetchData]);



  if (loading) return (

    <div style={{ minHeight:'100vh', background:'#f8fafc' }}>

      <Navbar />

      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', flexDirection:'column', gap:'1rem' }}>

        <div style={{ width:40, height:40, border:'4px solid #e5e7eb', borderTopColor:'#10b981', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />

        <p style={{ color:'#6b7280', fontWeight:500 }}>Loading earnings...</p>

      </div>

    </div>

  );



  const s = data?.summary || {};

  const payouts = data?.payouts || [];

  const monthlyChart = data?.monthlyChart || [];

  const filtered = statusFilter === 'all' ? payouts : payouts.filter(p => p.payoutStatus === statusFilter);

  const inp = { padding:'0.45rem 0.75rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.82rem', outline:'none', background:'white' };



  return (

    <div style={{ minHeight:'100vh', background:'#f8fafc' }}>

      <Navbar />

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'1.5rem 1rem' }}>



        {/* Header */}

        <div style={{ marginBottom:'1.5rem' }}>

          <button onClick={() => navigate('/dashboard')} style={{ background:'none', border:'none', color:'#6366f1', cursor:'pointer', fontWeight:600, fontSize:'0.875rem', padding:0, marginBottom:'0.5rem', display:'flex', alignItems:'center', gap:'0.3rem' }}>← Dashboard</button>

          <h2 style={{ margin:0, fontWeight:800, color:'#1f2937', fontSize:'1.6rem' }}>💰 Earnings & Payouts</h2>

          <p style={{ color:'#9ca3af', fontSize:'0.875rem', marginTop:'0.25rem' }}>Your complete financial overview and payout history</p>

        </div>



        {/* Hero balance card */}

        <div style={{ background:'linear-gradient(135deg,#059669 0%,#0d9488 60%,#0891b2 100%)', borderRadius:20, padding:'2rem', marginBottom:'1.5rem', color:'white' }}>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'1.5rem' }}>

            {[

              { label:'Available Balance', value: fmt(s.available),  big:true },

              { label:'Pending Payout',    value: fmt(s.pending) },

              { label:'This Month',        value: fmt(s.thisMonth) },

              { label:'Today',             value: fmt(s.today) },

            ].map((item, i) => (

              <div key={i} style={{ textAlign: i === 0 ? 'left' : 'center' }}>

                <div style={{ fontSize:'0.68rem', opacity:0.75, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:'0.3rem' }}>{item.label}</div>

                <div style={{ fontSize: item.big ? '2.5rem' : '1.6rem', fontWeight:900, lineHeight:1 }}>{item.value}</div>

              </div>

            ))}

          </div>

        </div>



        {/* Tabs */}

        <div style={{ display:'flex', gap:'0.25rem', background:'#f3f4f6', borderRadius:10, padding:'0.25rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>

          {[['earnings','💼 Earnings'],['payouts','📤 Payouts'],['pending','⏳ Pending'],['transactions','📋 Transactions'],['withdrawals','🏦 Withdrawals']].map(([k,l]) => (

            <button key={k} onClick={() => setActiveTab(k)}

              style={{ padding:'0.5rem 1.1rem', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.875rem', background: activeTab===k?'white':'transparent', color: activeTab===k?'#1f2937':'#6b7280', boxShadow: activeTab===k?'0 1px 4px rgba(0,0,0,0.1)':'' }}>

              {l}

            </button>

          ))}

        </div>



        {/* ── EARNINGS TAB ── */}

        {activeTab === 'earnings' && (

          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

            {/* KPI cards */}

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(175px,1fr))', gap:'1rem' }}>

              <KpiCard icon="💼" label="Total Gross"       value={fmt(s.totalGross)}      color="#6366f1" />

              <KpiCard icon="✅" label="Total Credited"    value={fmt(s.credited)}        color="#10b981" highlight />

              <KpiCard icon="🏦" label="Commission Cut"    value={fmt(s.totalCommission)} color="#f59e0b" sub="Platform deduction" />

              <KpiCard icon="📋" label="Tax Deducted"      value={fmt(s.totalTax)}        color="#8b5cf6" sub="TDS if applicable" />

              <KpiCard icon="⚠️" label="Penalties"         value={fmt(s.totalPenalty)}    color="#ef4444" />

              <KpiCard icon="💰" label="Net Earned"        value={fmt(s.totalEarned)}     color="#059669" highlight />

            </div>



            {/* Monthly chart */}

            {monthlyChart.length > 0 && (

              <div style={{ background:'white', borderRadius:14, padding:'1.25rem 1.5rem', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' }}>

                <div style={{ fontWeight:700, color:'#374151', fontSize:'0.9rem', marginBottom:'1rem' }}>Monthly Earnings (Last 6 Months)</div>

                <ResponsiveContainer width="100%" height={180}>

                  <BarChart data={monthlyChart} margin={{ top:0, right:0, left:0, bottom:0 }}>

                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />

                    <XAxis dataKey="month" tick={{ fontSize:11, fill:'#9ca3af' }} />

                    <YAxis tick={{ fontSize:11, fill:'#9ca3af' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />

                    <Tooltip formatter={(v, n) => [fmt(v), n === 'net' ? 'Net Earned' : 'Gross']} contentStyle={{ borderRadius:8, border:'1px solid #e5e7eb', fontSize:'0.82rem' }} />

                    <Bar dataKey="gross" fill="#e0e7ff" radius={[4,4,0,0]} name="gross" />

                    <Bar dataKey="net"   fill="#10b981" radius={[4,4,0,0]} name="net" />

                  </BarChart>

                </ResponsiveContainer>

                <div style={{ display:'flex', gap:'1.5rem', marginTop:'0.75rem', justifyContent:'center' }}>

                  <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.75rem', color:'#6b7280' }}><span style={{ width:12, height:12, borderRadius:3, background:'#e0e7ff', display:'inline-block' }} />Gross</div>

                  <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.75rem', color:'#6b7280' }}><span style={{ width:12, height:12, borderRadius:3, background:'#10b981', display:'inline-block' }} />Net Earned</div>

                </div>

              </div>

            )}



            {/* Recent earnings list */}

            <div style={{ background:'white', borderRadius:14, padding:'1.5rem', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' }}>

              <div style={{ fontWeight:700, color:'#1f2937', fontSize:'0.95rem', marginBottom:'1.25rem' }}>Recent Earnings</div>

              {payouts.length === 0 ? (

                <div style={{ textAlign:'center', padding:'3rem', color:'#9ca3af' }}>

                  <div style={{ fontSize:'3rem', marginBottom:'0.75rem' }}>💰</div>

                  <p>No earnings yet. Complete jobs to see your earnings here.</p>

                </div>

              ) : (

                <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>

                  {payouts.slice(0, 8).map(p => (

                    <div key={p._id} onClick={() => setSelected(p)}

                      style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.875rem 1rem', background:'#f9fafb', borderRadius:10, cursor:'pointer', border:'1px solid #f3f4f6' }}

                      onMouseEnter={e => e.currentTarget.style.background='#f3f4f6'}

                      onMouseLeave={e => e.currentTarget.style.background='#f9fafb'}>

                      <div style={{ width:40, height:40, borderRadius:10, background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0 }}>💼</div>

                      <div style={{ flex:1, minWidth:0 }}>

                        <div style={{ fontWeight:700, color:'#1f2937', fontSize:'0.9rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.booking?.service || 'Service'}</div>

                        <div style={{ fontSize:'0.72rem', color:'#9ca3af', marginTop:'0.1rem' }}>{fmtD(p.createdAt)} · {p.booking?.customer?.name || '—'}</div>

                      </div>

                      <div style={{ textAlign:'right', flexShrink:0 }}>

                        <div style={{ fontWeight:800, color:'#059669', fontSize:'1rem' }}>{fmt(p.netPayout)}</div>

                        <div style={{ fontSize:'0.68rem', color:'#9ca3af' }}>of {fmt(p.grossAmount)}</div>

                      </div>

                      <StatusChip status={p.payoutStatus} />

                      <span style={{ color:'#9ca3af' }}>›</span>

                    </div>

                  ))}

                </div>

              )}

            </div>

          </div>

        )}



        {/* ── PAYOUTS TAB ── */}

        {activeTab === 'payouts' && (

          <div style={{ background:'white', borderRadius:16, padding:'1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.75rem' }}>

              <div style={{ fontWeight:700, color:'#1f2937', fontSize:'0.95rem' }}>Payout History ({filtered.length})</div>

              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inp}>

                <option value="all">All Status</option>

                {Object.entries(PAYOUT_STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}

              </select>

            </div>



            {/* Status summary pills */}

            <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'1.25rem' }}>

              {Object.entries(PAYOUT_STATUS).map(([k, v]) => {

                const count = payouts.filter(p => p.payoutStatus === k).length;

                if (!count) return null;

                return (

                  <button key={k} onClick={() => setStatusFilter(statusFilter === k ? 'all' : k)}

                    style={{ background: statusFilter === k ? v.bg : '#f9fafb', color: statusFilter === k ? v.color : '#6b7280', border: `1.5px solid ${statusFilter === k ? v.color : '#e5e7eb'}`, borderRadius:50, padding:'0.25rem 0.75rem', fontSize:'0.75rem', fontWeight:700, cursor:'pointer' }}>

                    {v.label} ({count})

                  </button>

                );

              })}

            </div>



            {filtered.length === 0 ? (

              <div style={{ textAlign:'center', padding:'3rem', color:'#9ca3af' }}>

                <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>📋</div>

                <p>No payouts found.</p>

              </div>

            ) : (

              <div style={{ overflowX:'auto' }}>

                <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>

                  <thead>

                    <tr style={{ background:'#f9fafb', borderBottom:'2px solid #f3f4f6' }}>

                      {['Payout Ref','Service','Date','Gross','Commission','Tax','Net Payout','Status',''].map(h => (

                        <th key={h} style={{ padding:'0.75rem 0.875rem', textAlign:'left', fontSize:'0.68rem', color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.4px', whiteSpace:'nowrap' }}>{h}</th>

                      ))}

                    </tr>

                  </thead>

                  <tbody>

                    {filtered.map(p => (

                      <tr key={p._id} style={{ borderBottom:'1px solid #f9fafb' }}

                        onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}

                        onMouseLeave={e => e.currentTarget.style.background='white'}>

                        <td style={{ padding:'0.75rem 0.875rem', fontFamily:'monospace', fontSize:'0.72rem', color:'#6366f1', fontWeight:600 }}>{p.payoutReference || '—'}</td>

                        <td style={{ padding:'0.75rem 0.875rem', fontWeight:700, color:'#1f2937', fontSize:'0.85rem' }}>{p.booking?.service || '—'}</td>

                        <td style={{ padding:'0.75rem 0.875rem', color:'#6b7280', fontSize:'0.82rem', whiteSpace:'nowrap' }}>{fmtD(p.payoutDate || p.createdAt)}</td>

                        <td style={{ padding:'0.75rem 0.875rem', fontWeight:600, color:'#1f2937' }}>{fmt(p.grossAmount)}</td>

                        <td style={{ padding:'0.75rem 0.875rem', color:'#ef4444', fontWeight:600 }}>− {fmt(p.commissionDeduction)}</td>

                        <td style={{ padding:'0.75rem 0.875rem', color: p.taxDeduction > 0 ? '#ef4444' : '#d1d5db', fontWeight:600 }}>{p.taxDeduction > 0 ? `− ${fmt(p.taxDeduction)}` : '—'}</td>

                        <td style={{ padding:'0.75rem 0.875rem', fontWeight:800, color:'#059669', fontSize:'0.95rem' }}>{fmt(p.netPayout)}</td>

                        <td style={{ padding:'0.75rem 0.875rem' }}><StatusChip status={p.payoutStatus} /></td>

                        <td style={{ padding:'0.75rem 0.875rem' }}>

                          <button onClick={() => setSelected(p)} style={{ padding:'0.3rem 0.75rem', background:'#ede9fe', color:'#6366f1', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.75rem', fontWeight:700 }}>Details</button>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        )}



        {/* ── PENDING TAB ── */}

        {activeTab === 'pending' && (

          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

            {payouts.filter(p => ['pending','processing'].includes(p.payoutStatus)).length === 0 ? (

              <div style={{ textAlign:'center', padding:'5rem', background:'white', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>

                <div style={{ fontSize:'3.5rem', marginBottom:'1rem' }}>✅</div>

                <h3 style={{ color:'#1f2937', marginBottom:'0.5rem', fontWeight:700 }}>All caught up!</h3>

                <p style={{ color:'#9ca3af' }}>No pending payouts right now.</p>

              </div>

            ) : payouts.filter(p => ['pending','processing'].includes(p.payoutStatus)).map(p => (

              <div key={p._id} style={{ background:'white', borderRadius:14, padding:'1.25rem 1.5rem', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', borderLeft:`4px solid ${PAYOUT_STATUS[p.payoutStatus]?.dot || '#f59e0b'}` }}>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem' }}>

                  <div>

                    <div style={{ fontWeight:700, color:'#1f2937', fontSize:'1rem', marginBottom:'0.25rem' }}>{p.booking?.service || 'Service'}</div>

                    <div style={{ fontSize:'0.78rem', color:'#9ca3af' }}>Expected: {fmtD(p.payoutDate)} · Ref: {p.payoutReference || '—'}</div>

                  </div>

                  <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>

                    <div style={{ textAlign:'right' }}>

                      <div style={{ fontWeight:900, color:'#1f2937', fontSize:'1.2rem' }}>{fmt(p.netPayout)}</div>

                      <div style={{ fontSize:'0.7rem', color:'#9ca3af' }}>of {fmt(p.grossAmount)} gross</div>

                    </div>

                    <StatusChip status={p.payoutStatus} />

                    <button onClick={() => setSelected(p)} style={{ padding:'0.4rem 0.875rem', background:'#ede9fe', color:'#6366f1', border:'none', borderRadius:8, cursor:'pointer', fontSize:'0.8rem', fontWeight:700 }}>View</button>

                  </div>

                </div>

                {/* Mini breakdown */}

                <div style={{ display:'flex', gap:'1rem', marginTop:'0.875rem', paddingTop:'0.875rem', borderTop:'1px solid #f3f4f6', flexWrap:'wrap' }}>

                  {[

                    { label:'Gross',      value: fmt(p.grossAmount),          color:'#1f2937' },

                    { label:'Commission', value: `− ${fmt(p.commissionDeduction)}`, color:'#ef4444' },

                    { label:'Net',        value: fmt(p.netPayout),            color:'#059669' },

                  ].map((item, i) => (

                    <div key={i} style={{ background:'#f9fafb', borderRadius:8, padding:'0.4rem 0.75rem' }}>

                      <div style={{ fontSize:'0.6rem', color:'#9ca3af', fontWeight:600, textTransform:'uppercase' }}>{item.label}</div>

                      <div style={{ fontWeight:700, color:item.color, fontSize:'0.875rem' }}>{item.value}</div>

                    </div>

                  ))}

                </div>

              </div>

            ))}

          </div>

        )}



        {/* ── TRANSACTION DETAILS TAB ── */}

        {activeTab === 'transactions' && (

          <div style={{ background:'white', borderRadius:16, padding:'1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>

            <div style={{ fontWeight:700, color:'#1f2937', fontSize:'0.95rem', marginBottom:'1.25rem' }}>Transaction Details ({payouts.length})</div>

            {payouts.length === 0 ? (

              <div style={{ textAlign:'center', padding:'3rem', color:'#9ca3af' }}>

                <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>📋</div>

                <p>No transactions yet.</p>

              </div>

            ) : (

              <div style={{ overflowX:'auto' }}>

                <table style={{ width:'100%', borderCollapse:'collapse', minWidth:850 }}>

                  <thead>

                    <tr style={{ background:'#f9fafb', borderBottom:'2px solid #f3f4f6' }}>

                      {['Booking ID','Service','Gross Amt','Commission','Tax','Penalty','Net Credited','Credited On','Method','Status',''].map(h => (

                        <th key={h} style={{ padding:'0.75rem 0.875rem', textAlign:'left', fontSize:'0.65rem', color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.3px', whiteSpace:'nowrap' }}>{h}</th>

                      ))}

                    </tr>

                  </thead>

                  <tbody>

                    {payouts.map(p => {

                      const t = p.transaction || {};

                      return (

                        <tr key={p._id} style={{ borderBottom:'1px solid #f9fafb' }}

                          onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}

                          onMouseLeave={e => e.currentTarget.style.background='white'}>

                          <td style={{ padding:'0.75rem 0.875rem', fontFamily:'monospace', fontSize:'0.7rem', color:'#9ca3af' }}>#{p.booking?._id?.slice(-6) || '—'}</td>

                          <td style={{ padding:'0.75rem 0.875rem', fontWeight:700, color:'#1f2937', fontSize:'0.82rem', maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.booking?.service || '—'}</td>

                          <td style={{ padding:'0.75rem 0.875rem', fontWeight:700, color:'#1f2937' }}>{fmt(p.grossAmount)}</td>

                          <td style={{ padding:'0.75rem 0.875rem', color:'#ef4444', fontWeight:600 }}>− {fmt(p.commissionDeduction)} <span style={{ fontSize:'0.62rem', color:'#9ca3af' }}>({p.commissionRate}%)</span></td>

                          <td style={{ padding:'0.75rem 0.875rem', color: p.taxDeduction > 0 ? '#ef4444' : '#d1d5db', fontWeight:600 }}>{p.taxDeduction > 0 ? `− ${fmt(p.taxDeduction)}` : '—'}</td>

                          <td style={{ padding:'0.75rem 0.875rem', color: p.penaltyDeduction > 0 ? '#ef4444' : '#d1d5db', fontWeight:600 }}>{p.penaltyDeduction > 0 ? `− ${fmt(p.penaltyDeduction)}` : '—'}</td>

                          <td style={{ padding:'0.75rem 0.875rem', fontWeight:800, color:'#059669', fontSize:'0.95rem' }}>{fmt(p.netPayout)}</td>

                          <td style={{ padding:'0.75rem 0.875rem', fontSize:'0.78rem', color:'#9ca3af', whiteSpace:'nowrap' }}>{p.payoutStatus === 'credited' ? fmtD(p.payoutDate) : '—'}</td>

                          <td style={{ padding:'0.75rem 0.875rem' }}>

                            <span style={{ background:'#f3f4f6', color:'#374151', padding:'0.15rem 0.5rem', borderRadius:50, fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase' }}>{t.paymentMethod || '—'}</span>

                          </td>

                          <td style={{ padding:'0.75rem 0.875rem' }}><StatusChip status={p.payoutStatus} /></td>

                          <td style={{ padding:'0.75rem 0.875rem' }}>

                            <button onClick={() => setSelected(p)} style={{ padding:'0.3rem 0.75rem', background:'#ede9fe', color:'#6366f1', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.72rem', fontWeight:700 }}>Details</button>

                          </td>

                        </tr>

                      );

                    })}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        )}



        {/* ── WITHDRAWALS TAB ── */}

        {activeTab === 'withdrawals' && (

          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'1rem' }}>

              <KpiCard icon="💰" label="Available Balance"   value={fmt(s.available)}  color="#10b981" highlight />

              <KpiCard icon="⏳" label="Pending / Processing" value={fmt(s.pending)}   color="#f59e0b" />

              <KpiCard icon="✅" label="Total Withdrawn"      value={fmt(s.credited)}  color="#6366f1" />

              <KpiCard icon="💼" label="Total Gross Earned"   value={fmt(s.totalGross)} color="#374151" />

            </div>



            <div style={{ background:'white', borderRadius:14, padding:'1.5rem', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' }}>

              <div style={{ fontWeight:700, color:'#1f2937', fontSize:'0.95rem', marginBottom:'1.25rem' }}>Withdrawal History (Credited Payouts)</div>

              {payouts.filter(p => p.payoutStatus === 'credited').length === 0 ? (

                <div style={{ textAlign:'center', padding:'3rem', color:'#9ca3af' }}>

                  <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>💸</div>

                  <p>No credited payouts yet.</p>

                </div>

              ) : (

                <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>

                  {payouts.filter(p => p.payoutStatus === 'credited').map(p => (

                    <div key={p._id} onClick={() => setSelected(p)}

                      style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'1rem 1.25rem', background:'#f0fdf4', borderRadius:12, cursor:'pointer', border:'1px solid #bbf7d0', borderLeft:'3px solid #10b981' }}

                      onMouseEnter={e => e.currentTarget.style.background='#dcfce7'}

                      onMouseLeave={e => e.currentTarget.style.background='#f0fdf4'}>

                      <div style={{ width:38, height:38, borderRadius:10, background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0 }}>✅</div>

                      <div style={{ flex:1, minWidth:0 }}>

                        <div style={{ fontWeight:700, color:'#1f2937', fontSize:'0.9rem' }}>{p.booking?.service || 'Service'}</div>

                        <div style={{ fontSize:'0.72rem', color:'#9ca3af', marginTop:'0.1rem' }}>

                          Credited {fmtD(p.payoutDate)} · Ref: <span style={{ fontFamily:'monospace' }}>{p.payoutReference || '—'}</span>

                        </div>

                      </div>

                      <div style={{ textAlign:'right', flexShrink:0 }}>

                        <div style={{ fontWeight:800, color:'#059669', fontSize:'1.05rem' }}>{fmt(p.netPayout)}</div>

                        <div style={{ fontSize:'0.68rem', color:'#9ca3af' }}>of {fmt(p.grossAmount)} gross</div>

                      </div>

                      <span style={{ color:'#9ca3af' }}>›</span>

                    </div>

                  ))}

                </div>

              )}

            </div>



            <div style={{ background:'#eff6ff', borderRadius:12, padding:'1rem 1.25rem', border:'1px solid #bfdbfe', fontSize:'0.82rem', color:'#1e40af' }}>

              <strong>Payout Schedule:</strong> Payouts are processed based on platform settings. Contact support if you have payout issues.

            </div>

          </div>

        )}

      </div>



      {selected && <PayoutDrawer payout={selected} onClose={() => setSelected(null)} />}

    </div>

  );

}

