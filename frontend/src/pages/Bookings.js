import { useState, useEffect, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import { toast } from 'react-toastify';

import QRCode from 'qrcode';

import Navbar from '../components/Navbar';

import api from '../utils/api';



/* ── Constants ─────────────────────────────────────────────────────────── */

const UPI_ID   = '8767823948@ybl';

const UPI_NAME = 'Hyperlocal Jobs';



const STATUS_CONFIG = {

  requested:            { bg:'#ede9fe', color:'#6366f1',  label:'Requested',          icon:'📋' },

  accepted:             { bg:'#dbeafe', color:'#2563eb',  label:'Accepted',            icon:'✅' },

  rejected:             { bg:'#fee2e2', color:'#dc2626',  label:'Rejected',            icon:'❌' },

  scheduled:            { bg:'#e0f2fe', color:'#0369a1',  label:'Scheduled',           icon:'📅' },

  'on-the-way':         { bg:'#fef3c7', color:'#ca8a04',  label:'On The Way',          icon:'🚗' },

  arrived:              { bg:'#fef9c3', color:'#a16207',  label:'Arrived',             icon:'📍' },

  'in-progress':        { bg:'#ede9fe', color:'#7c3aed',  label:'In Progress',         icon:'🔧' },

  'waiting-for-payment':{ bg:'#fff7ed', color:'#c2410c',  label:'Waiting for Payment', icon:'💳' },

  completed:            { bg:'#dcfce7', color:'#16a34a',  label:'Completed',           icon:'✓' },

  cancelled:            { bg:'#f3f4f6', color:'#6b7280',  label:'Cancelled',           icon:'✗' },

  disputed:             { bg:'#fef2f2', color:'#991b1b',  label:'Disputed',            icon:'⚠️' },

  // legacy

  pending:              { bg:'#ede9fe', color:'#6366f1',  label:'Requested',           icon:'📋' },

};



// Ordered steps for the progress timeline

const TIMELINE_STEPS = [

  'requested','accepted','scheduled','on-the-way','arrived','in-progress','waiting-for-payment','completed'

];



const buildUpiUrl = (amount, note) =>

  `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;



/* ── Helpers ────────────────────────────────────────────────────────────── */

const useQR = (text) => {

  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {

    if (!text) return;

    QRCode.toDataURL(text, { width: 220, margin: 2, color: { dark: '#1e1b4b', light: '#ffffff' } })

      .then(setDataUrl).catch(() => {});

  }, [text]);

  return dataUrl;

};



const fmtDate = (d) => d ? new Date(d).toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

const fmtDateShort = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short' }) : '—'; // eslint-disable-line



const StatusBadge = ({ status }) => {

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.requested;

  return (

    <span style={{ display:'inline-flex', alignItems:'center', gap:'0.25rem', background:cfg.bg, color:cfg.color, padding:'0.2rem 0.65rem', borderRadius:50, fontSize:'0.75rem', fontWeight:700, whiteSpace:'nowrap' }}>

      {cfg.icon} {cfg.label}

    </span>

  );

};



const PayBadge = ({ status }) => {

  const cfg = { paid:{bg:'#dcfce7',color:'#16a34a',label:'✓ Paid'}, pending:{bg:'#fef3c7',color:'#92400e',label:'⏳ Pending'}, refunded:{bg:'#dbeafe',color:'#1e40af',label:'↩ Refunded'}, failed:{bg:'#fee2e2',color:'#991b1b',label:'✗ Failed'} }[status] || {bg:'#f3f4f6',color:'#6b7280',label:status};

  return <span style={{ background:cfg.bg, color:cfg.color, padding:'0.15rem 0.55rem', borderRadius:50, fontSize:'0.72rem', fontWeight:700 }}>{cfg.label}</span>;

};



/* ── Progress Timeline Bar ──────────────────────────────────────────────── */

const ProgressBar = ({ status }) => {

  const stepIdx = TIMELINE_STEPS.indexOf(status);

  if (stepIdx < 0 || ['cancelled','rejected','disputed'].includes(status)) return null;

  const pct = stepIdx / (TIMELINE_STEPS.length - 1) * 100;

  const labels = { requested:'Requested', accepted:'Accepted', scheduled:'Scheduled', 'on-the-way':'On Way', arrived:'Arrived', 'in-progress':'Working', 'waiting-for-payment':'Pay', completed:'Done' };

  return (

    <div style={{ padding:'1rem', background:'#f9fafb', borderRadius:10, margin:'0.875rem 0' }}>

      <div style={{ position:'relative', display:'flex', justifyContent:'space-between', alignItems:'center' }}>

        <div style={{ position:'absolute', top:'50%', left:0, right:0, height:3, background:'#e5e7eb', transform:'translateY(-50%)', zIndex:0 }} />

        <div style={{ position:'absolute', top:'50%', left:0, height:3, background:'linear-gradient(90deg,#6366f1,#8b5cf6)', transform:'translateY(-50%)', zIndex:1, width:`${pct}%`, transition:'width 0.6s ease' }} />

        {TIMELINE_STEPS.map((step, i) => {

          const done    = i < stepIdx;

          const current = i === stepIdx;

          return (

            <div key={step} style={{ display:'flex', flexDirection:'column', alignItems:'center', zIndex:2, flex:1 }}>

              <div style={{ width:26, height:26, borderRadius:'50%', background: done?'#6366f1': current?'white':'white', border:`3px solid ${done||current?'#6366f1':'#e5e7eb'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', color: done?'white': current?'#6366f1':'#9ca3af', fontWeight:700, marginBottom:'0.35rem', boxShadow: current?'0 0 0 3px rgba(99,102,241,0.2)':'' }}>

                {done ? '✓' : i + 1}

              </div>

              <span style={{ fontSize:'0.58rem', color: done||current?'#6366f1':'#9ca3af', fontWeight: current?700:400, textAlign:'center', whiteSpace:'nowrap', overflow:'hidden', maxWidth:52, textOverflow:'ellipsis' }}>{labels[step]}</span>

            </div>

          );

        })}

      </div>

    </div>

  );

};



/* ── Timeline History ───────────────────────────────────────────────────── */

const TimelineHistory = ({ timeline }) => {

  if (!timeline?.length) return null;

  return (

    <div style={{ marginTop:'1rem', paddingTop:'1rem', borderTop:'1px solid #f3f4f6' }}>

      <div style={{ fontSize:'0.72rem', color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'0.75rem' }}>Activity Log</div>

      <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>

        {[...timeline].reverse().map((ev, i) => {

          const cfg = STATUS_CONFIG[ev.status] || {};

          return (

            <div key={i} style={{ display:'flex', gap:'0.75rem', alignItems:'flex-start', fontSize:'0.8rem' }}>

              <div style={{ width:22, height:22, borderRadius:'50%', background:cfg.bg||'#f3f4f6', color:cfg.color||'#6b7280', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', flexShrink:0, marginTop:'0.1rem' }}>{cfg.icon||'•'}</div>

              <div style={{ flex:1 }}>

                <span style={{ fontWeight:600, color:'#374151' }}>{cfg.label || ev.status}</span>

                {ev.note && <span style={{ color:'#9ca3af', marginLeft:'0.4rem' }}>— {ev.note}</span>}

                <div style={{ color:'#9ca3af', fontSize:'0.68rem', marginTop:'0.1rem' }}>{fmtDate(ev.at)}</div>

              </div>

            </div>

          );

        })}

      </div>

    </div>

  );

};



/* ── Payment Modal ──────────────────────────────────────────────────────── */

const PaymentModal = ({ booking, onClose, onConfirm }) => {

  const [tab,        setTab]        = useState('upi');

  const [confirming, setConfirming] = useState(false);

  const [upiRef,     setUpiRef]     = useState('');

  const [breakdown,  setBreakdown]  = useState(null);

  const [loadingBD,  setLoadingBD]  = useState(true);



  // Fetch real breakdown from backend
  useEffect(() => {
    if (!booking?._id) return;
    api.get(`/finance/breakdown/${booking._id}`)
      .then(r => setBreakdown(r.data.breakdown))
      .catch(() => {
        setBreakdown({ serviceAmount: booking.amount, platformFee: 0, supportFee: 0, urgentFee: 0, taxAmount: 0, discountAmount: 0, totalPaid: booking.amount });
      })
      .finally(() => setLoadingBD(false));
  }, [booking?._id]); // eslint-disable-line react-hooks/exhaustive-deps



  const bd = breakdown || {};

  const totalDue = bd.totalPaid || booking?.amount || 0;

  const upiUrl   = buildUpiUrl(totalDue, `Payment for ${booking?.service}`);

  const qrDataUrl = useQR(tab !== 'cash' ? upiUrl : '');



  const handleConfirm = async () => {

    setConfirming(true);

    try {

      await onConfirm({ paymentMethod_detail: tab === 'cash' ? 'Cash' : `${tab.toUpperCase()} - ${upiRef || 'QR Scan'}`, paymentId: `${tab.toUpperCase()}_${Date.now()}` });

    } finally { setConfirming(false); }

  };



  if (!booking) return null;



  const lineItems = [

    { label: 'Service Amount',    value: bd.serviceAmount,   color: '#1f2937' },

    bd.platformFee > 0 && { label: 'Platform Fee',     value: bd.platformFee,    color: '#6b7280' },

    bd.supportFee  > 0 && { label: 'Safety & Support', value: bd.supportFee,     color: '#6b7280' },

    bd.urgentFee   > 0 && { label: 'Urgent Booking Fee',value: bd.urgentFee,     color: '#ef4444' },

    bd.taxAmount   > 0 && { label: `GST (${bd.rates?.taxRate || 18}%)`, value: bd.taxAmount, color: '#6b7280' },

    bd.discountAmount > 0 && { label: 'Discount',       value: -bd.discountAmount, color: '#10b981' },

  ].filter(Boolean);



  return (

    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:'1rem', backdropFilter:'blur(4px)' }}>

      <div style={{ background:'white', borderRadius:24, width:'100%', maxWidth:460, boxShadow:'0 24px 64px rgba(0,0,0,0.3)', overflow:'hidden', maxHeight:'95vh', overflowY:'auto' }}>



        {/* Header */}

        <div style={{ background:'linear-gradient(135deg,#1e1b4b,#4f46e5)', padding:'1.25rem 1.5rem', color:'white', display:'flex', justifyContent:'space-between', alignItems:'center' }}>

          <div>

            <div style={{ fontWeight:800, fontSize:'1.1rem' }}>Complete Payment</div>

            <div style={{ fontSize:'0.78rem', opacity:0.8 }}>{booking.service} · {booking.worker?.name}</div>

          </div>

          <div style={{ textAlign:'right' }}>

            <div style={{ fontSize:'2rem', fontWeight:900, lineHeight:1 }}>₹{totalDue.toLocaleString('en-IN')}</div>

            <div style={{ fontSize:'0.72rem', opacity:0.7 }}>Total Due</div>

          </div>

        </div>



        {/* Bill breakdown */}

        {!loadingBD && (

          <div style={{ padding:'1rem 1.5rem 0' }}>

            <div style={{ background:'#f9fafb', borderRadius:12, padding:'0.875rem 1rem', marginBottom:'0.875rem' }}>

              <div style={{ fontSize:'0.7rem', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'0.625rem' }}>Payment Breakdown</div>

              {lineItems.map((item, i) => (

                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.3rem 0', borderBottom: i < lineItems.length - 1 ? '1px solid #f3f4f6' : 'none' }}>

                  <span style={{ fontSize:'0.82rem', color:'#6b7280' }}>{item.label}</span>

                  <span style={{ fontSize:'0.875rem', fontWeight:600, color: item.value < 0 ? '#10b981' : item.color }}>

                    {item.value < 0 ? `- ₹${Math.abs(item.value).toLocaleString('en-IN')}` : `₹${item.value.toLocaleString('en-IN')}`}

                  </span>

                </div>

              ))}

              <div style={{ borderTop:'2px solid #e5e7eb', marginTop:'0.625rem', paddingTop:'0.625rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>

                <span style={{ fontWeight:800, color:'#1f2937', fontSize:'0.95rem' }}>Total Payable</span>

                <span style={{ fontWeight:900, color:'#1f2937', fontSize:'1.2rem' }}>₹{totalDue.toLocaleString('en-IN')}</span>

              </div>

            </div>

          </div>

        )}



        {/* Payment method tabs */}

        <div style={{ display:'flex', borderBottom:'1px solid #f3f4f6', background:'#f9fafb', margin:'0 1.5rem', borderRadius:10, overflow:'hidden' }}>

          {[{key:'upi',label:'UPI / QR',icon:'📱'},{key:'card',label:'Card',icon:'💳'},{key:'cash',label:'Cash',icon:'💵'}].map(t => (

            <button key={t.key} onClick={() => setTab(t.key)} style={{ flex:1, padding:'0.65rem 0.5rem', border:'none', background:'transparent', cursor:'pointer', fontWeight:tab===t.key?700:500, color:tab===t.key?'#4f46e5':'#6b7280', fontSize:'0.8rem', borderBottom:tab===t.key?'2px solid #4f46e5':'2px solid transparent', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.15rem' }}>

              <span style={{ fontSize:'1rem' }}>{t.icon}</span>{t.label}

            </button>

          ))}

        </div>



        <div style={{ padding:'1rem 1.5rem 1.5rem' }}>

          {tab !== 'cash' ? (

            <div style={{ textAlign:'center' }}>

              <div style={{ fontSize:'0.82rem', color:'#6b7280', marginBottom:'0.875rem' }}>

                Scan with GPay, PhonePe, Paytm or any UPI app.<br />

                Amount <strong style={{ color:'#4f46e5' }}>₹{totalDue.toLocaleString('en-IN')}</strong> is pre-filled.

              </div>

              {qrDataUrl

                ? <div style={{ display:'inline-block', padding:'0.875rem', background:'white', borderRadius:14, boxShadow:'0 4px 20px rgba(0,0,0,0.12)', border:'2px solid #e5e7eb', marginBottom:'0.875rem' }}><img src={qrDataUrl} alt="UPI QR" style={{ width:180, height:180, display:'block' }} /></div>

                : <div style={{ width:180, height:180, background:'#f3f4f6', borderRadius:14, margin:'0 auto 0.875rem', display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af', fontSize:'0.82rem' }}>Generating QR...</div>}

              <div style={{ background:'#f5f3ff', borderRadius:8, padding:'0.6rem 0.875rem', marginBottom:'0.875rem', fontSize:'0.8rem', color:'#5b21b6' }}>

                <strong>UPI ID:</strong> {UPI_ID}

              </div>

              <input value={upiRef} onChange={e => setUpiRef(e.target.value)} placeholder="UPI Reference / Transaction ID (optional)" style={{ width:'100%', padding:'0.65rem 0.875rem', border:'2px solid #e5e7eb', borderRadius:8, fontSize:'0.875rem', outline:'none', boxSizing:'border-box', marginBottom:'0.875rem' }} />

            </div>

          ) : (

            <div style={{ textAlign:'center', padding:'0.5rem 0' }}>

              <div style={{ fontSize:'3.5rem', marginBottom:'0.5rem' }}>💵</div>

              <div style={{ fontSize:'1.75rem', fontWeight:900, color:'#1f2937', marginBottom:'0.4rem' }}>₹{totalDue.toLocaleString('en-IN')}</div>

              <div style={{ fontSize:'0.875rem', color:'#6b7280', marginBottom:'1rem' }}>Pay in cash directly to the worker. The worker will confirm receipt.</div>

            </div>

          )}

          <div style={{ background:'#fef3c7', borderRadius:8, padding:'0.55rem 0.875rem', fontSize:'0.78rem', color:'#92400e', marginBottom:'1rem' }}>

            ⚠️ After paying, click confirm to record the payment.

          </div>

          <div style={{ display:'flex', gap:'0.75rem' }}>

            <button onClick={handleConfirm} disabled={confirming} style={{ flex:1, padding:'0.875rem', background:confirming?'#e5e7eb':'linear-gradient(135deg,#4f46e5,#6366f1)', color:confirming?'#9ca3af':'white', border:'none', borderRadius:12, fontWeight:700, cursor:confirming?'not-allowed':'pointer', fontSize:'0.95rem' }}>

              {confirming ? 'Confirming...' : tab === 'cash' ? '✓ Noted — Cash' : "✓ I've Paid"}

            </button>

            <button onClick={onClose} style={{ padding:'0.875rem 1.25rem', background:'#f3f4f6', color:'#374151', border:'none', borderRadius:12, fontWeight:600, cursor:'pointer' }}>Cancel</button>

          </div>

        </div>

      </div>

    </div>

  );

};



/* ── Cash Confirm Modal (Worker) ────────────────────────────────────────── */

const CashConfirmModal = ({ booking, onConfirm, onClose }) => {

  const [confirming, setConfirming] = useState(false);

  if (!booking) return null;

  return (

    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:'1rem', backdropFilter:'blur(4px)' }}>

      <div style={{ background:'white', borderRadius:24, width:'100%', maxWidth:400, boxShadow:'0 24px 64px rgba(0,0,0,0.3)', overflow:'hidden' }}>

        <div style={{ background:'linear-gradient(135deg,#065f46,#10b981)', padding:'1.25rem 1.5rem', color:'white', textAlign:'center' }}>

          <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>💵</div>

          <div style={{ fontWeight:800, fontSize:'1.1rem' }}>Confirm Cash Received</div>

        </div>

        <div style={{ padding:'1.5rem' }}>

          <div style={{ background:'#f9fafb', borderRadius:12, padding:'1rem 1.25rem', marginBottom:'1.25rem' }}>

            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem' }}><span style={{ fontSize:'0.82rem', color:'#9ca3af' }}>Service</span><span style={{ fontWeight:700, color:'#1f2937' }}>{booking.service}</span></div>

            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem' }}><span style={{ fontSize:'0.82rem', color:'#9ca3af' }}>Customer</span><span style={{ fontWeight:600, color:'#1f2937' }}>{booking.customer?.name}</span></div>

            <div style={{ borderTop:'1px solid #e5e7eb', marginTop:'0.75rem', paddingTop:'0.75rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>

              <span style={{ fontWeight:700, color:'#1f2937' }}>Cash Amount</span>

              <span style={{ fontWeight:900, color:'#1f2937', fontSize:'1.5rem' }}>₹{booking.amount}</span>

            </div>

          </div>

          <div style={{ background:'#fef3c7', borderRadius:10, padding:'0.875rem 1rem', fontSize:'0.85rem', color:'#92400e', marginBottom:'1.25rem' }}>

            ⚠️ Only confirm if you have physically received ₹{booking.amount} in cash.

          </div>

          <div style={{ display:'flex', gap:'0.75rem' }}>

            <button onClick={async () => { setConfirming(true); await onConfirm(); setConfirming(false); }} disabled={confirming}

              style={{ flex:1, padding:'0.875rem', background:confirming?'#e5e7eb':'#10b981', color:confirming?'#9ca3af':'white', border:'none', borderRadius:12, fontWeight:700, cursor:confirming?'not-allowed':'pointer', fontSize:'0.95rem' }}>

              {confirming ? '...' : '✓ Yes, Cash Received'}

            </button>

            <button onClick={onClose} style={{ padding:'0.875rem 1.25rem', background:'#f3f4f6', color:'#374151', border:'none', borderRadius:12, fontWeight:600, cursor:'pointer' }}>Not Yet</button>

          </div>

        </div>

      </div>

    </div>

  );

};



/* ── Reject Modal ───────────────────────────────────────────────────────── */

const RejectModal = ({ booking, onConfirm, onClose }) => {

  const [reason, setReason] = useState('');

  const [submitting, setSubmitting] = useState(false);

  if (!booking) return null;

  return (

    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:'1rem', backdropFilter:'blur(4px)' }}>

      <div style={{ background:'white', borderRadius:20, padding:'2rem', width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,0.25)' }}>

        <h3 style={{ margin:'0 0 1rem', color:'#1f2937', fontWeight:700 }}>Reject Booking</h3>

        <p style={{ color:'#6b7280', fontSize:'0.875rem', marginBottom:'1rem' }}>Please provide a reason for rejecting this booking.</p>

        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="e.g. Not available on this date, outside service area..." style={{ width:'100%', padding:'0.75rem', border:'2px solid #e5e7eb', borderRadius:8, fontSize:'0.9rem', outline:'none', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box', marginBottom:'1rem' }} />

        <div style={{ display:'flex', gap:'0.75rem' }}>

          <button onClick={async () => { setSubmitting(true); await onConfirm(reason); setSubmitting(false); }} disabled={submitting}

            style={{ flex:1, padding:'0.875rem', background:'#ef4444', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', opacity:submitting?0.7:1 }}>

            {submitting ? '...' : 'Reject Booking'}

          </button>

          <button onClick={onClose} style={{ flex:1, padding:'0.875rem', background:'#f3f4f6', color:'#6b7280', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer' }}>Cancel</button>

        </div>

      </div>

    </div>

  );

};



/* ── Cancel Modal ───────────────────────────────────────────────────────── */

const CancelModal = ({ booking, onConfirm, onClose }) => {

  const [reason, setReason] = useState('');

  const [submitting, setSubmitting] = useState(false);

  if (!booking) return null;

  return (

    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:'1rem', backdropFilter:'blur(4px)' }}>

      <div style={{ background:'white', borderRadius:20, padding:'2rem', width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,0.25)' }}>

        <h3 style={{ margin:'0 0 1rem', color:'#1f2937', fontWeight:700 }}>Cancel Booking</h3>

        <p style={{ color:'#6b7280', fontSize:'0.875rem', marginBottom:'1rem' }}>Are you sure? Please provide a reason.</p>

        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Reason for cancellation..." style={{ width:'100%', padding:'0.75rem', border:'2px solid #e5e7eb', borderRadius:8, fontSize:'0.9rem', outline:'none', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box', marginBottom:'1rem' }} />

        <div style={{ display:'flex', gap:'0.75rem' }}>

          <button onClick={async () => { setSubmitting(true); await onConfirm(reason); setSubmitting(false); }} disabled={submitting}

            style={{ flex:1, padding:'0.875rem', background:'#ef4444', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', opacity:submitting?0.7:1 }}>

            {submitting ? '...' : 'Yes, Cancel'}

          </button>

          <button onClick={onClose} style={{ flex:1, padding:'0.875rem', background:'#f3f4f6', color:'#6b7280', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer' }}>Keep Booking</button>

        </div>

      </div>

    </div>

  );

};



/* ── Invoice Modal ──────────────────────────────────────────────────────── */

const InvoiceModal = ({ booking, user, onClose }) => {

  const [txn, setTxn] = useState(null);

  useEffect(() => {

    if (!booking?._id) return;

    api.get(`/finance/transaction/${booking._id}`).then(r => setTxn(r.data)).catch(() => {});

  }, [booking?._id]);



  if (!booking) return null;

  const invoiceNo = txn?.invoiceNumber || `INV-${booking._id?.slice(-8).toUpperCase()}`;

  const date = txn?.paidAt || booking.paidAt || booking.completedAt || booking.createdAt;

  const bd = txn || {};

  const isCustomer = user?.role === 'customer';



  const lineItems = [

    { label:'Service Amount',    value: bd.serviceAmount || booking.amount },

    bd.platformFee > 0 && { label:'Platform Fee',     value: bd.platformFee },

    bd.supportFee  > 0 && { label:'Safety & Support', value: bd.supportFee },

    bd.urgentFee   > 0 && { label:'Urgent Booking Fee',value: bd.urgentFee },

    bd.taxAmount   > 0 && { label:`GST (${bd.taxRate || 18}%)`, value: bd.taxAmount },

    bd.discountAmount > 0 && { label:'Discount',       value: -bd.discountAmount },

  ].filter(Boolean);



  return (

    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:'1rem', backdropFilter:'blur(4px)' }}>

      <div style={{ background:'white', borderRadius:20, width:'100%', maxWidth:500, boxShadow:'0 24px 64px rgba(0,0,0,0.3)', overflow:'hidden', maxHeight:'95vh', overflowY:'auto' }}>



        {/* Invoice header */}

        <div style={{ background:'linear-gradient(135deg,#1e1b4b,#4f46e5)', padding:'1.5rem 2rem', color:'white', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>

          <div>

            <div style={{ fontSize:'1.25rem', fontWeight:800 }}>Hyperlocal Jobs</div>

            <div style={{ fontSize:'0.75rem', opacity:0.75, marginTop:'0.2rem' }}>Tax Invoice</div>

          </div>

          <div style={{ textAlign:'right' }}>

            <div style={{ fontSize:'0.68rem', opacity:0.7, textTransform:'uppercase', letterSpacing:'0.4px' }}>Invoice No.</div>

            <div style={{ fontWeight:700, fontSize:'0.9rem' }}>{invoiceNo}</div>

            <div style={{ fontSize:'0.68rem', opacity:0.7, marginTop:'0.2rem' }}>{fmtDate(date)}</div>

          </div>

        </div>



        <div style={{ padding:'1.5rem 2rem' }}>

          {/* Status badge */}

          <div style={{ display:'flex', justifyContent:'center', marginBottom:'1.25rem' }}>

            <span style={{ background:booking.paymentStatus==='paid'?'#d1fae5':'#fef3c7', color:booking.paymentStatus==='paid'?'#065f46':'#92400e', padding:'0.4rem 1.5rem', borderRadius:50, fontWeight:800, fontSize:'0.9rem', border:`2px solid ${booking.paymentStatus==='paid'?'#6ee7b7':'#fcd34d'}` }}>

              {booking.paymentStatus==='paid' ? '✓ PAYMENT CONFIRMED' : '⏳ PAYMENT PENDING'}

            </span>

          </div>



          {/* Service details */}

          <div style={{ background:'#f9fafb', borderRadius:12, padding:'1rem 1.25rem', marginBottom:'1rem' }}>

            {[

              ['Service',    booking.service],

              [isCustomer ? 'Worker' : 'Customer', isCustomer ? booking.worker?.name : booking.customer?.name],

              ['Date',       fmtDate(booking.scheduledDate)],

              booking.location?.address && ['Location', booking.location.address],

              txn?.transactionRef && ['Transaction Ref', txn.transactionRef],

              ['Payment Method', (txn?.paymentMethod || booking.paymentMethod || '—').toUpperCase()],

            ].filter(Boolean).map(([l, v], i) => (

              <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem', gap:'1rem' }}>

                <span style={{ fontSize:'0.82rem', color:'#9ca3af', flexShrink:0 }}>{l}</span>

                <span style={{ fontSize:'0.85rem', fontWeight:600, color:'#1f2937', textAlign:'right', wordBreak:'break-all' }}>{v}</span>

              </div>

            ))}

          </div>



          {/* Itemized breakdown */}

          <div style={{ borderRadius:12, border:'1px solid #e5e7eb', overflow:'hidden', marginBottom:'1rem' }}>

            <div style={{ padding:'0.75rem 1.25rem', background:'#f9fafb', borderBottom:'1px solid #e5e7eb', fontSize:'0.72rem', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.4px' }}>

              Itemized Breakdown

            </div>

            <div style={{ padding:'0.875rem 1.25rem' }}>

              {lineItems.map((item, i) => (

                <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem', padding:'0.2rem 0', borderBottom: i < lineItems.length - 1 ? '1px solid #f9fafb' : 'none' }}>

                  <span style={{ fontSize:'0.82rem', color:'#6b7280' }}>{item.label}</span>

                  <span style={{ fontSize:'0.875rem', fontWeight:600, color: item.value < 0 ? '#10b981' : '#1f2937' }}>

                    {item.value < 0 ? `- ₹${Math.abs(item.value).toLocaleString('en-IN')}` : `₹${(item.value||0).toLocaleString('en-IN')}`}

                  </span>

                </div>

              ))}

              <div style={{ borderTop:'2px solid #e5e7eb', marginTop:'0.75rem', paddingTop:'0.75rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>

                <span style={{ fontWeight:800, color:'#1f2937', fontSize:'1rem' }}>Total Paid</span>

                <span style={{ fontWeight:900, color:'#1f2937', fontSize:'1.35rem' }}>₹{(bd.totalPaid || booking.amount || 0).toLocaleString('en-IN')}</span>

              </div>

            </div>

          </div>



          {/* Tax note */}

          {bd.taxAmount > 0 && (

            <div style={{ background:'#f0fdf4', borderRadius:8, padding:'0.6rem 0.875rem', marginBottom:'1rem', fontSize:'0.78rem', color:'#166534' }}>

              ✓ Includes GST of ₹{bd.taxAmount.toLocaleString('en-IN')} on platform charges

            </div>

          )}



          <div style={{ textAlign:'center', fontSize:'0.72rem', color:'#9ca3af', marginBottom:'1rem' }}>

            Thank you for using Hyperlocal Jobs · This is a computer-generated invoice

          </div>

        </div>



        <div style={{ padding:'1rem 2rem', borderTop:'1px solid #f3f4f6', display:'flex', gap:'0.75rem' }}>

          <button onClick={onClose} style={{ flex:1, padding:'0.75rem', background:'#f3f4f6', color:'#374151', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer' }}>Close</button>

          <button onClick={() => window.print()} style={{ flex:1, padding:'0.75rem', background:'linear-gradient(135deg,#4f46e5,#6366f1)', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer' }}>🖨️ Print</button>

        </div>

      </div>

    </div>

  );

};



/* ── Booking Card ───────────────────────────────────────────────────────── */

const BookingCard = ({ booking, user, onStatusUpdate, onPayment, onCashConfirm, onReject, onCancel, onInvoice, onReview, onReplyReview, navigate }) => {

  const [showTimeline, setShowTimeline] = useState(false);

  const isWorker   = user?.role === 'worker';

  const isCustomer = user?.role === 'customer';

  const s = booking.status;

  const isPaid     = booking.paymentStatus === 'paid';

  const needsPayment = isCustomer && !isPaid && ['waiting-for-payment','completed'].includes(s);

  const cfg = STATUS_CONFIG[s] || STATUS_CONFIG.requested;

  const otherParty = isCustomer ? booking.worker : booking.customer;



  return (

    <div style={{ background:'white', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', overflow:'hidden', border:'1px solid #f3f4f6', borderLeft:`4px solid ${cfg.color}`, marginBottom:'1rem' }}>



      {/* Header */}

      <div style={{ padding:'1rem 1.25rem', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'0.75rem' }}>

        <div style={{ flex:1, minWidth:0 }}>

          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap', marginBottom:'0.25rem' }}>

            <h3 style={{ margin:0, fontWeight:700, color:'#1f2937', fontSize:'1rem' }}>{booking.service}</h3>

            {booking.isEmergency && <span style={{ background:'#fee2e2', color:'#dc2626', padding:'0.1rem 0.5rem', borderRadius:50, fontSize:'0.68rem', fontWeight:700 }}>🚨 Emergency</span>}

            {needsPayment && <span style={{ background:'#fef3c7', color:'#92400e', padding:'0.1rem 0.5rem', borderRadius:50, fontSize:'0.68rem', fontWeight:700 }}>💳 Payment Due</span>}

            {booking.hasDispute && <span style={{ background:'#fee2e2', color:'#991b1b', padding:'0.1rem 0.5rem', borderRadius:50, fontSize:'0.68rem', fontWeight:700 }}>⚠️ Disputed</span>}

          </div>

          <div style={{ fontSize:'0.8rem', color:'#9ca3af' }}>

            {isCustomer ? 'Worker' : 'Customer'}: <strong style={{ color:'#374151' }}>{otherParty?.name || '—'}</strong>

            {' · '}📅 {fmtDate(booking.scheduledDate)}

          </div>

        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexShrink:0 }}>

          <StatusBadge status={s} />

          <PayBadge status={booking.paymentStatus} />

        </div>

      </div>



      {/* Progress bar */}

      <div style={{ padding:'0 1.25rem' }}>

        <ProgressBar status={s} />

      </div>



      {/* Details */}

      <div style={{ padding:'0 1.25rem 0.875rem', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'0.5rem' }}>

        <div style={{ background:'#f9fafb', borderRadius:8, padding:'0.5rem 0.75rem' }}>

          <div style={{ fontSize:'0.65rem', color:'#9ca3af', fontWeight:600, textTransform:'uppercase', marginBottom:'0.15rem' }}>Amount</div>

          <div style={{ fontWeight:800, color:'#1f2937', fontSize:'1rem' }}>₹{booking.amount}</div>

        </div>

        <div style={{ background:'#f9fafb', borderRadius:8, padding:'0.5rem 0.75rem' }}>

          <div style={{ fontSize:'0.65rem', color:'#9ca3af', fontWeight:600, textTransform:'uppercase', marginBottom:'0.15rem' }}>Payment</div>

          <div style={{ fontWeight:600, color:'#374151', fontSize:'0.82rem', textTransform:'capitalize' }}>{booking.paymentMethod}</div>

        </div>

        {booking.location?.address && (

          <div style={{ background:'#f9fafb', borderRadius:8, padding:'0.5rem 0.75rem', gridColumn:'span 2' }}>

            <div style={{ fontSize:'0.65rem', color:'#9ca3af', fontWeight:600, textTransform:'uppercase', marginBottom:'0.15rem' }}>Location</div>

            <div style={{ fontWeight:500, color:'#374151', fontSize:'0.8rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>📍 {booking.location.address}</div>

          </div>

        )}

      </div>



      {/* Payment confirmed strip */}

      {isPaid && booking.paidAt && (

        <div style={{ margin:'0 1.25rem 0.875rem', background:'#f0fdf4', borderRadius:8, padding:'0.5rem 0.875rem', fontSize:'0.78rem', color:'#166534', display:'flex', alignItems:'center', gap:'0.5rem', borderLeft:'3px solid #10b981' }}>

          ✓ Paid {fmtDate(booking.paidAt)}{booking.paymentMethod_detail && ` · ${booking.paymentMethod_detail}`}

        </div>

      )}



      {/* Rejection / cancellation reason */}

      {(booking.rejectionReason || booking.cancellationReason) && (

        <div style={{ margin:'0 1.25rem 0.875rem', background:'#fef2f2', borderRadius:8, padding:'0.5rem 0.875rem', fontSize:'0.78rem', color:'#991b1b', borderLeft:'3px solid #ef4444' }}>

          {booking.rejectionReason ? `Rejected: ${booking.rejectionReason}` : `Cancelled: ${booking.cancellationReason}`}

        </div>

      )}



      {/* Review */}

      {booking.review && (

        <div style={{ margin:'0 1.25rem 0.875rem', background:'#f0fdf4', padding:'0.875rem 1rem', borderRadius:10, borderLeft:'3px solid #10b981' }}>

          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.3rem', flexWrap:'wrap' }}>

            <span style={{ fontWeight:700, color:'#065f46', fontSize:'0.875rem' }}>⭐ {booking.review.rating}/5</span>

            {booking.review.sentiment?.emoji && <span style={{ fontSize:'0.82rem' }}>{booking.review.sentiment.emoji}</span>}

            {booking.review.categories && Object.values(booking.review.categories).some(v => v > 0) && (

              <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>

                {[['quality','🔧'],['behavior','🤝'],['punctuality','⏰'],['priceFairness','💰']].filter(([k]) => booking.review.categories[k]).map(([k,icon]) => (

                  <span key={k} style={{ background:'#dcfce7', color:'#16a34a', padding:'0.1rem 0.45rem', borderRadius:50, fontSize:'0.65rem', fontWeight:700 }}>

                    {icon} {booking.review.categories[k]}

                  </span>

                ))}

              </div>

            )}

          </div>

          {booking.review.comment && <p style={{ color:'#166534', fontSize:'0.82rem', margin:'0 0 0.3rem', fontStyle:'italic' }}>"{booking.review.comment}"</p>}

          {booking.review.workerReply && (

            <div style={{ background:'white', borderRadius:6, padding:'0.5rem 0.75rem', marginTop:'0.4rem', fontSize:'0.78rem', color:'#374151', borderLeft:'2px solid #6366f1' }}>

              <span style={{ fontWeight:600, color:'#6366f1', fontSize:'0.68rem', textTransform:'uppercase', letterSpacing:'0.3px' }}>Worker Reply: </span>

              {booking.review.workerReply}

            </div>

          )}

        </div>

      )}



      {/* Description */}

      {booking.description && <p style={{ margin:'0 1.25rem 0.875rem', color:'#6b7280', fontSize:'0.82rem', fontStyle:'italic' }}>"{booking.description}"</p>}



      {/* Action buttons */}

      <div style={{ padding:'0.875rem 1.25rem', borderTop:'1px solid #f9fafb', display:'flex', gap:'0.5rem', flexWrap:'wrap', alignItems:'center' }}>



        {/* ── WORKER ACTIONS ── */}

        {isWorker && s === 'requested' && (

          <>

            <button onClick={() => onStatusUpdate(booking._id, 'accepted')} style={{ padding:'0.5rem 1.1rem', background:'#10b981', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>✓ Accept</button>

            <button onClick={() => onReject(booking)} style={{ padding:'0.5rem 1.1rem', background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.85rem' }}>✗ Reject</button>

          </>

        )}

        {isWorker && s === 'accepted' && (

          <button onClick={() => onStatusUpdate(booking._id, 'on-the-way')} style={{ padding:'0.5rem 1.1rem', background:'#f59e0b', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>🚗 On The Way</button>

        )}

        {isWorker && s === 'on-the-way' && (

          <button onClick={() => onStatusUpdate(booking._id, 'arrived')} style={{ padding:'0.5rem 1.1rem', background:'#6366f1', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>📍 Arrived</button>

        )}

        {isWorker && s === 'arrived' && (

          <button onClick={() => onStatusUpdate(booking._id, 'in-progress')} style={{ padding:'0.5rem 1.1rem', background:'#7c3aed', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>🔧 Start Job</button>

        )}

        {isWorker && s === 'in-progress' && (

          booking.paymentMethod === 'cash'

            ? <button onClick={() => onCashConfirm(booking)} style={{ padding:'0.5rem 1.1rem', background:'#10b981', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>✓ Complete + Confirm Cash</button>

            : <button onClick={() => onStatusUpdate(booking._id, 'waiting-for-payment')} style={{ padding:'0.5rem 1.1rem', background:'#10b981', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>✓ Work Done — Request Payment</button>

        )}

        {isWorker && s === 'waiting-for-payment' && (

          <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:8, padding:'0.5rem 0.875rem', fontSize:'0.82rem', color:'#9a3412', fontWeight:600 }}>

            ⏳ Waiting for customer payment (₹{booking.amount})

          </div>

        )}



        {/* ── CUSTOMER ACTIONS ── */}

        {isCustomer && needsPayment && (

          <button onClick={() => onPayment(booking)} style={{ padding:'0.5rem 1.25rem', background:'linear-gradient(135deg,#4f46e5,#6366f1)', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'0.9rem' }}>💳 Pay ₹{booking.amount}</button>

        )}

        {isCustomer && s === 'completed' && !booking.review && (

          <button onClick={() => onReview(booking)} style={{ padding:'0.5rem 1.1rem', background:'#fef3c7', color:'#92400e', border:'1px solid #fcd34d', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.85rem' }}>⭐ Leave Review</button>

        )}

        {isCustomer && ['requested','accepted'].includes(s) && (

          <button onClick={() => onCancel(booking)} style={{ padding:'0.5rem 1rem', background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.82rem' }}>✗ Cancel</button>

        )}

        {isCustomer && s === 'completed' && (

          <button onClick={() => navigate(`/disputes?bookingId=${booking._id}`)} style={{ padding:'0.5rem 1rem', background:'#fef2f2', color:'#991b1b', border:'1px solid #fecaca', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.82rem' }}>⚠️ Dispute</button>

        )}



        {/* ── SHARED ACTIONS ── */}

        {s === 'completed' && (

          <button onClick={() => onInvoice(booking)} style={{ padding:'0.5rem 1rem', background:'#f5f3ff', color:'#6366f1', border:'1px solid #c4b5fd', borderRadius:8, cursor:'pointer', fontSize:'0.82rem', fontWeight:600 }}>🧾 Invoice</button>

        )}

        {/* Worker: reply to review */}

        {isWorker && s === 'completed' && booking.review?.rating && !booking.review?.workerReply && onReplyReview && (

          <button onClick={() => onReplyReview(booking)} style={{ padding:'0.5rem 1rem', background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', borderRadius:8, cursor:'pointer', fontSize:'0.82rem', fontWeight:600 }}>💬 Reply to Review</button>

        )}

        <button onClick={() => navigate(`/messages/${booking._id}`)} style={{ padding:'0.5rem 1rem', background:'#f3f4f6', color:'#374151', border:'none', borderRadius:8, cursor:'pointer', fontSize:'0.82rem', fontWeight:600 }}>💬 Chat</button>

        <button onClick={() => setShowTimeline(!showTimeline)} style={{ padding:'0.5rem 1rem', background:'none', color:'#9ca3af', border:'1px solid #e5e7eb', borderRadius:8, cursor:'pointer', fontSize:'0.78rem', fontWeight:600, marginLeft:'auto' }}>

          {showTimeline ? '▲ Hide Log' : '▼ Activity Log'}

        </button>

      </div>



      {/* Timeline history */}

      {showTimeline && (

        <div style={{ padding:'0 1.25rem 1.25rem' }}>

          <TimelineHistory timeline={booking.timeline} />

        </div>

      )}

    </div>

  );

};



/* ── Main Bookings Page ─────────────────────────────────────────────────── */

const Bookings = () => {

  const { user } = useAuth();

  const navigate = useNavigate();

  const [bookings,    setBookings]    = useState([]);

  const [filter,      setFilter]      = useState('all');

  const [search,      setSearch]      = useState('');

  const [loading,     setLoading]     = useState(true);

  const [paymentBooking,    setPaymentBooking]    = useState(null);

  const [cashConfirmBooking,setCashConfirmBooking]= useState(null);

  const [invoiceBooking,    setInvoiceBooking]    = useState(null);

  const [rejectBooking,     setRejectBooking]     = useState(null);

  const [cancelBooking,     setCancelBooking]     = useState(null);

  const [reviewBooking, setReviewBooking] = useState(null);

  const [review, setReview] = useState({ rating:5, comment:'', categories:{ quality:5, behavior:5, punctuality:5, priceFairness:5 } });

  const [replyReviewBooking, setReplyReviewBooking] = useState(null);

  const [replyText, setReplyText] = useState('');



  const fetchBookings = useCallback(async () => {

    try {

      const { data } = await api.get('/bookings');

      setBookings(data);

    } catch { toast.error('Failed to load bookings'); }

    finally { setLoading(false); }

  }, []);



  useEffect(() => { fetchBookings(); }, [fetchBookings]);



  const updateStatus = async (id, status, extra = {}) => {

    try {

      await api.patch(`/bookings/${id}/status`, { status, ...extra });

      toast.success(`Booking ${STATUS_CONFIG[status]?.label || status}`);

      fetchBookings();

    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }

  };



  const handlePaymentConfirm = async ({ paymentMethod_detail, paymentId }) => {

    try {

      await api.patch(`/bookings/${paymentBooking._id}/payment-demo`, { paymentMethod_detail, paymentId });

      toast.success('Payment confirmed!');

      setPaymentBooking(null);

      fetchBookings();

    } catch { toast.error('Failed to confirm payment'); }

  };



  const handleWorkerCashConfirm = async () => {

    try {

      await api.patch(`/bookings/${cashConfirmBooking._id}/payment-demo`, { paymentMethod_detail:'Cash - Worker Confirmed', paymentId:`CASH_${Date.now()}` });

      toast.success('Cash confirmed and job completed!');

      setCashConfirmBooking(null);

      fetchBookings();

    } catch { toast.error('Failed'); }

  };



  const handleReject = async (reason) => {

    await updateStatus(rejectBooking._id, 'rejected', { rejectionReason: reason });

    setRejectBooking(null);

  };



  const handleCancel = async (reason) => {

    await updateStatus(cancelBooking._id, 'cancelled', { cancellationReason: reason });

    setCancelBooking(null);

  };



  const submitReview = async (e) => {

    e.preventDefault();

    try {

      await api.post(`/bookings/${reviewBooking._id}/review`, review);

      toast.success('Review submitted!');

      setReviewBooking(null);

      setReview({ rating:5, comment:'', categories:{ quality:5, behavior:5, punctuality:5, priceFairness:5 } });

      fetchBookings();

    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit review'); }

  };



  const submitReply = async () => {

    if (!replyText.trim()) return;

    try {

      await api.patch(`/bookings/${replyReviewBooking._id}/review/reply`, { reply: replyText });

      toast.success('Reply posted!');

      setReplyReviewBooking(null);

      setReplyText('');

      fetchBookings();

    } catch { toast.error('Failed to post reply'); }

  };



  // Derived

  const ALL_STATUSES = ['all','requested','accepted','rejected','scheduled','on-the-way','arrived','in-progress','waiting-for-payment','completed','cancelled','disputed']; // eslint-disable-line

  const isWorker = user?.role === 'worker';



  const filtered = bookings.filter(b => {

    if (filter !== 'all' && b.status !== filter) return false;

    if (search) {

      const q = search.toLowerCase();

      return b.service?.toLowerCase().includes(q) ||

        b.customer?.name?.toLowerCase().includes(q) ||

        b.worker?.name?.toLowerCase().includes(q);

    }

    return true;

  });



  // Worker: separate new requests from active jobs

  const newRequests = isWorker ? filtered.filter(b => b.status === 'requested') : [];

  const activeJobs  = isWorker ? filtered.filter(b => ['accepted','scheduled','on-the-way','arrived','in-progress','waiting-for-payment'].includes(b.status)) : [];

  const otherJobs   = isWorker ? filtered.filter(b => !['requested','accepted','scheduled','on-the-way','arrived','in-progress','waiting-for-payment'].includes(b.status)) : [];



  // Stats

  const totalPaid    = bookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.amount, 0);

  const totalPending = bookings.filter(b => b.paymentStatus === 'pending' && ['waiting-for-payment','completed'].includes(b.status)).reduce((s, b) => s + b.amount, 0);

  const activeCount  = bookings.filter(b => ['requested','accepted','on-the-way','arrived','in-progress','waiting-for-payment'].includes(b.status)).length;



  const cardProps = { user, onStatusUpdate: updateStatus, onPayment: setPaymentBooking, onCashConfirm: setCashConfirmBooking, onReject: setRejectBooking, onCancel: setCancelBooking, onInvoice: setInvoiceBooking, onReview: setReviewBooking, onReplyReview: setReplyReviewBooking, navigate };



  return (

    <div style={{ minHeight:'100vh', background:'#f8fafc' }}>

      <Navbar />

      <div style={{ maxWidth:900, margin:'0 auto', padding:'1.5rem 1rem' }}>



        {/* Header */}

        <div style={{ marginBottom:'1.5rem' }}>

          <h2 style={{ color:'#1f2937', fontWeight:800, fontSize:'1.5rem', margin:0 }}>

            {isWorker ? '🔧 My Jobs' : '📋 My Bookings'}

          </h2>

          <p style={{ color:'#9ca3af', fontSize:'0.875rem', marginTop:'0.25rem' }}>

            {bookings.length} total · {activeCount} active

          </p>

        </div>



        {/* Stats strip */}

        {bookings.length > 0 && (

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'0.875rem', marginBottom:'1.5rem' }}>

            {[

              { label: isWorker ? 'New Requests' : 'Active', value: isWorker ? newRequests.length : activeCount, color:'#6366f1', bg:'#ede9fe' },

              { label: isWorker ? 'Active Jobs' : 'Completed', value: isWorker ? activeJobs.length : bookings.filter(b=>b.status==='completed').length, color:'#10b981', bg:'#dcfce7' },

              { label: isWorker ? 'Total Earned' : 'Total Paid', value:`₹${totalPaid.toLocaleString()}`, color:'#059669', bg:'#f0fdf4' },

              totalPending > 0 && { label:'Payment Pending', value:`₹${totalPending.toLocaleString()}`, color:'#ca8a04', bg:'#fef9c3' },

            ].filter(Boolean).map((s, i) => (

              <div key={i} style={{ background:'white', borderRadius:12, padding:'0.875rem 1rem', boxShadow:'0 1px 6px rgba(0,0,0,0.06)', borderLeft:`3px solid ${s.color}` }}>

                <div style={{ fontSize:'0.65rem', color:'#9ca3af', fontWeight:600, textTransform:'uppercase', marginBottom:'0.2rem' }}>{s.label}</div>

                <div style={{ fontSize:'1.35rem', fontWeight:800, color:'#1f2937' }}>{s.value}</div>

              </div>

            ))}

          </div>

        )}



        {/* Filters */}

        <div style={{ background:'white', borderRadius:12, padding:'0.875rem 1rem', marginBottom:'1.25rem', boxShadow:'0 1px 6px rgba(0,0,0,0.06)', display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>

          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bookings..." style={{ padding:'0.45rem 0.875rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.875rem', outline:'none', flex:1, minWidth:160 }} />

          <div style={{ display:'flex', gap:'0.3rem', flexWrap:'wrap' }}>

            {['all','requested','accepted','in-progress','waiting-for-payment','completed','cancelled'].map(f => (

              <button key={f} onClick={() => setFilter(f)}

                style={{ padding:'0.3rem 0.7rem', borderRadius:20, fontSize:'0.72rem', fontWeight:600, cursor:'pointer', border:'none',

                  background: filter === f ? '#6366f1' : '#f3f4f6',

                  color: filter === f ? 'white' : '#6b7280' }}>

                {f === 'all' ? 'All' : STATUS_CONFIG[f]?.label || f}

                {f !== 'all' && <span style={{ marginLeft:'0.25rem', opacity:0.8 }}>({bookings.filter(b=>b.status===f).length})</span>}

              </button>

            ))}

          </div>

        </div>



        {loading ? (

          <div style={{ textAlign:'center', padding:'4rem', color:'#9ca3af' }}>

            <div style={{ width:40, height:40, border:'4px solid #e5e7eb', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 1rem' }} />

            <p>Loading bookings...</p>

          </div>

        ) : bookings.length === 0 ? (

          <div style={{ textAlign:'center', padding:'4rem 2rem', background:'white', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>

            <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📋</div>

            <h3 style={{ color:'#1f2937', marginBottom:'0.5rem' }}>No bookings yet</h3>

            <p style={{ color:'#9ca3af' }}>{isWorker ? 'Bookings from customers will appear here.' : 'Search for workers and make your first booking!'}</p>

            {!isWorker && <button onClick={() => navigate('/search')} style={{ marginTop:'1rem', padding:'0.65rem 1.5rem', background:'#6366f1', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700 }}>Find Workers →</button>}

          </div>

        ) : (

          <>

            {/* Worker: New Requests section */}

            {isWorker && filter === 'all' && newRequests.length > 0 && (

              <div style={{ marginBottom:'1.5rem' }}>

                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.875rem' }}>

                  <h3 style={{ margin:0, fontWeight:700, color:'#1f2937', fontSize:'0.95rem' }}>🔔 New Requests</h3>

                  <span style={{ background:'#ef4444', color:'white', borderRadius:50, padding:'0.1rem 0.5rem', fontSize:'0.72rem', fontWeight:700 }}>{newRequests.length}</span>

                </div>

                {newRequests.map(b => <BookingCard key={b._id} booking={b} {...cardProps} />)}

              </div>

            )}



            {/* Worker: Active Jobs section */}

            {isWorker && filter === 'all' && activeJobs.length > 0 && (

              <div style={{ marginBottom:'1.5rem' }}>

                <h3 style={{ margin:'0 0 0.875rem', fontWeight:700, color:'#1f2937', fontSize:'0.95rem' }}>⚡ Active Jobs ({activeJobs.length})</h3>

                {activeJobs.map(b => <BookingCard key={b._id} booking={b} {...cardProps} />)}

              </div>

            )}



            {/* Worker: payment pending warning */}

            {isWorker && filter === 'all' && bookings.filter(b => b.status === 'waiting-for-payment').length > 0 && (

              <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:12, padding:'0.875rem 1rem', marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'0.75rem' }}>

                <span style={{ fontSize:'1.25rem' }}>⏳</span>

                <div>

                  <div style={{ fontWeight:700, color:'#9a3412', fontSize:'0.875rem' }}>Payment Pending</div>

                  <div style={{ fontSize:'0.78rem', color:'#c2410c' }}>{bookings.filter(b=>b.status==='waiting-for-payment').length} job(s) waiting for customer payment</div>

                </div>

              </div>

            )}



            {/* All other bookings (or filtered) */}

            {(filter !== 'all' ? filtered : isWorker ? otherJobs : filtered).map(b => (

              <BookingCard key={b._id} booking={b} {...cardProps} />

            ))}



            {filtered.length === 0 && filter !== 'all' && (

              <div style={{ textAlign:'center', padding:'3rem', background:'white', borderRadius:16 }}>

                <p style={{ color:'#9ca3af' }}>No bookings with status "{STATUS_CONFIG[filter]?.label || filter}"</p>

              </div>

            )}

          </>

        )}

      </div>



      {/* Modals */}

      {paymentBooking    && <PaymentModal    booking={paymentBooking}    onClose={() => setPaymentBooking(null)}    onConfirm={handlePaymentConfirm} />}

      {cashConfirmBooking&& <CashConfirmModal booking={cashConfirmBooking} onClose={() => setCashConfirmBooking(null)} onConfirm={handleWorkerCashConfirm} />}

      {invoiceBooking    && <InvoiceModal    booking={invoiceBooking}    user={user}                                onClose={() => setInvoiceBooking(null)} />}

      {rejectBooking     && <RejectModal     booking={rejectBooking}     onClose={() => setRejectBooking(null)}     onConfirm={handleReject} />}

      {cancelBooking     && <CancelModal     booking={cancelBooking}     onClose={() => setCancelBooking(null)}     onConfirm={handleCancel} />}



      {/* Worker Reply to Review Modal */}

      {replyReviewBooking && (

        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:'1rem', backdropFilter:'blur(4px)' }}>

          <div style={{ background:'white', borderRadius:20, padding:'2rem', width:'100%', maxWidth:460, boxShadow:'0 20px 60px rgba(0,0,0,0.25)' }}>

            <h3 style={{ margin:'0 0 0.5rem', color:'#1f2937', fontWeight:700 }}>💬 Reply to Review</h3>

            <div style={{ background:'#f0fdf4', borderRadius:10, padding:'0.875rem 1rem', marginBottom:'1.25rem' }}>

              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.3rem' }}>

                <span style={{ fontWeight:700, color:'#065f46' }}>⭐ {replyReviewBooking.review?.rating}/5</span>

                <span style={{ fontSize:'0.78rem', color:'#6b7280' }}>{replyReviewBooking.customer?.name}</span>

              </div>

              {replyReviewBooking.review?.comment && <p style={{ margin:0, fontSize:'0.82rem', color:'#166534', fontStyle:'italic' }}>"{replyReviewBooking.review.comment}"</p>}

            </div>

            <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={4}

              placeholder="Write a professional, helpful reply..."

              style={{ width:'100%', padding:'0.875rem', border:'2px solid #e5e7eb', borderRadius:10, fontSize:'0.9rem', outline:'none', resize:'vertical', fontFamily:'inherit', marginBottom:'1.25rem', boxSizing:'border-box' }} />

            <div style={{ display:'flex', gap:'0.75rem' }}>

              <button onClick={submitReply} disabled={!replyText.trim()} style={{ flex:1, padding:'0.875rem', background:'#10b981', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', opacity:!replyText.trim()?0.6:1 }}>Post Reply</button>

              <button onClick={() => { setReplyReviewBooking(null); setReplyText(''); }} style={{ flex:1, padding:'0.875rem', background:'#f3f4f6', color:'#6b7280', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer' }}>Cancel</button>

            </div>

          </div>

        </div>

      )}



      {/* Review Modal */}

      {reviewBooking && (

        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:'1rem', backdropFilter:'blur(4px)' }}>

          <div style={{ background:'white', borderRadius:20, padding:'2rem', width:'100%', maxWidth:500, boxShadow:'0 20px 60px rgba(0,0,0,0.25)', maxHeight:'92vh', overflowY:'auto' }}>

            <h3 style={{ margin:'0 0 0.25rem', color:'#1f2937', fontWeight:800, fontSize:'1.1rem' }}>⭐ Leave a Review</h3>

            <p style={{ color:'#6b7280', marginBottom:'1.5rem', fontSize:'0.875rem' }}>How was your experience with <strong>{reviewBooking?.worker?.name}</strong>?</p>

            <form onSubmit={submitReview} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>



              {/* Overall rating */}

              <div>

                <label style={{ display:'block', fontSize:'0.78rem', fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'0.5rem' }}>Overall Rating *</label>

                <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>

                  {[1,2,3,4,5].map(n => (

                    <button key={n} type="button" onClick={() => setReview(r => ({...r, rating:n}))}

                      style={{ width:46, height:46, borderRadius:'50%', border:`2px solid ${n<=review.rating?'#f59e0b':'#e5e7eb'}`, background:n<=review.rating?'#fef3c7':'white', fontSize:'1.3rem', cursor:'pointer', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center' }}>

                      ★

                    </button>

                  ))}

                  <span style={{ fontWeight:800, color:'#1f2937', fontSize:'1.1rem', marginLeft:'0.25rem' }}>{review.rating}/5</span>

                  <span style={{ fontSize:'0.82rem', color:'#9ca3af' }}>

                    {['','Poor','Fair','Good','Very Good','Excellent'][review.rating]}

                  </span>

                </div>

              </div>



              {/* Category ratings */}

              <div style={{ background:'#f9fafb', borderRadius:12, padding:'1rem 1.25rem' }}>

                <div style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'0.875rem' }}>Rate by Category</div>

                {[

                  { key:'quality',       label:'Quality of Work',  icon:'🔧', color:'#6366f1' },

                  { key:'behavior',      label:'Behavior',         icon:'🤝', color:'#10b981' },

                  { key:'punctuality',   label:'Punctuality',      icon:'⏰', color:'#f59e0b' },

                  { key:'priceFairness', label:'Price Fairness',   icon:'💰', color:'#8b5cf6' },

                ].map(cat => (

                  <div key={cat.key} style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.625rem' }}>

                    <span style={{ fontSize:'0.9rem', width:20, flexShrink:0 }}>{cat.icon}</span>

                    <span style={{ fontSize:'0.8rem', color:'#374151', width:110, flexShrink:0 }}>{cat.label}</span>

                    <div style={{ display:'flex', gap:'0.3rem' }}>

                      {[1,2,3,4,5].map(n => (

                        <button key={n} type="button"

                          onClick={() => setReview(r => ({ ...r, categories: { ...r.categories, [cat.key]: n } }))}

                          style={{ width:28, height:28, borderRadius:'50%', border:`1.5px solid ${n<=(review.categories?.[cat.key]||0)?cat.color:'#e5e7eb'}`, background:n<=(review.categories?.[cat.key]||0)?cat.color+'20':'white', fontSize:'0.75rem', cursor:'pointer', transition:'all 0.12s', color:n<=(review.categories?.[cat.key]||0)?cat.color:'#9ca3af', fontWeight:700 }}>

                          {n}

                        </button>

                      ))}

                    </div>

                    <span style={{ fontSize:'0.72rem', color:'#9ca3af', width:20 }}>{review.categories?.[cat.key] || '—'}</span>

                  </div>

                ))}

              </div>



              {/* Comment */}

              <div>

                <label style={{ display:'block', fontSize:'0.78rem', fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'0.5rem' }}>Your Review *</label>

                <textarea placeholder="Describe your experience in detail..." value={review.comment} onChange={e => setReview(r => ({...r, comment:e.target.value}))} required rows={4}

                  style={{ width:'100%', padding:'0.875rem', border:'2px solid #e5e7eb', borderRadius:10, fontSize:'0.9rem', outline:'none', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box', lineHeight:1.5 }} />

              </div>



              <div style={{ display:'flex', gap:'0.75rem' }}>

                <button type="submit" style={{ flex:1, padding:'0.875rem', background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:'0.95rem' }}>

                  ⭐ Submit Review

                </button>

                <button type="button" onClick={() => setReviewBooking(null)} style={{ flex:1, padding:'0.875rem', background:'#f3f4f6', color:'#6b7280', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer' }}>

                  Cancel

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

};



export default Bookings;

